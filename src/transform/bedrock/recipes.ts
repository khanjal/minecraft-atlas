// Parses Bedrock's recipe JSON (Mojang/bedrock-samples' behavior_pack/recipes/) into this
// project's shared Recipe/Ingredient models - a separate module from transform/recipes.ts rather
// than an edition branch inside it, since the raw formats share nothing worth factoring out: each
// Bedrock recipe file is wrapped in one of three top-level keys (minecraft:recipe_shaped,
// minecraft:recipe_shapeless, minecraft:recipe_furnace) rather than Java's flat `type` field, and
// Bedrock's furnace recipe covers what Java splits into four separate types (smelting/blasting/
// smoking/campfire_cooking) via a `tags` array of which stations it works at instead.
//
// One real, honest limitation: unlike mcmeta (which publishes Java's tag *definitions*, letting
// tags.ts fully resolve "#minecraft:planks" to real item ids), Mojang/bedrock-samples has no
// equivalent tags/item/*.json - confirmed by searching the whole repo tree for one. A Bedrock
// ingredient like {"tag": "minecraft:coals"} is real (verified: fire_charge.json uses it) but
// can't be expanded here - there's no published source that says what's in "minecraft:coals" on
// Bedrock. Represented as `{ type: 'tag', id: 'minecraft:coals', items: [] }` rather than guessed
// or silently dropped, so a consumer can tell "this is a tag, unresolved" from "this recipe
// genuinely has no ingredients".

import { fetchRecipe, listRecipeFiles, recipeNameFromPath } from '../../sources/bedrock/bedrock-samples';
import { mapWithConcurrency } from '../../util/concurrency';
import { namespaced } from '../../util/id';
import { Recipe } from '../../models/recipe.model';
import { Ingredient } from '../../models/ingredient.model';

// A slot reference shows up in three real shapes across shaped/shapeless/furnace recipes: a bare
// item string ("minecraft:acacia_planks"), an object with an optional legacy "data" variant value
// ({"item": "minecraft:sand", "data": 0}), or a tag ({"tag": "minecraft:logs_that_burn"}). `data`
// is dropped rather than folded into the id: every case checked (furnace_sand/_sandstone/
// _red_sandstone, all "data": 0) already has its own distinct item id, so the base id alone
// identifies the right item for every recipe actually seen - a genuine simplification for any
// item that still needs the legacy id+data addressing to disambiguate, not confirmed absent.
type RawIngredientSpec = string | { item?: string; tag?: string; data?: number };

function resolveIngredient(spec: RawIngredientSpec, quantity: number): Ingredient {
    const normalized = typeof spec === 'string' ? { item: spec } : spec;
    if (normalized.tag) {
        const id = namespaced(normalized.tag);
        return { type: 'tag', id, items: [], quantity };
    }
    const id = namespaced(normalized.item!);
    return { type: 'item', id, items: [id], quantity };
}

type RawResult = { item: string; count?: number } | { item: string; count?: number }[];

// Some Bedrock recipes (cake, honey block, ...) declare an array of results rather than one -
// e.g. cake also returns the 3 emptied milk buckets used to make it. The first entry is always
// the recipe's actual product; later entries are byproducts like that. Only the first is kept -
// dropping "you also get 3 empty buckets back" is a real simplification, not silently wrong,
// since Recipe.result models one product, but it's worth being honest that it's a simplification
// rather than the full picture.
function resolveResult(raw: RawResult): { id: string; count: number } {
    const primary = Array.isArray(raw) ? raw[0] : raw;
    return { id: namespaced(primary.item), count: primary.count ?? 1 };
}

function resolveShapedIngredients(key: Record<string, RawIngredientSpec>, pattern: string[]): Ingredient[] {
    const flat = pattern.join('');
    return Object.keys(key).map(symbol => {
        const quantity = flat.split(symbol).length - 1;
        return resolveIngredient(key[symbol], quantity);
    });
}

function resolveShapelessIngredients(ingredients: RawIngredientSpec[]): Ingredient[] {
    const resolved = ingredients.map(spec => resolveIngredient(spec, 1));
    // Same collapsing as Java's shapeless handling: multiple slots naming the same item/tag
    // become one entry with a summed quantity.
    const byId = new Map<string, Ingredient>();
    for (const ingredient of resolved) {
        const existing = byId.get(ingredient.id);
        if (existing) {
            existing.quantity += ingredient.quantity;
        } else {
            byId.set(ingredient.id, { ...ingredient });
        }
    }
    return [...byId.values()];
}

export function parseBedrockRecipe(raw: any): Recipe | null {
    if (raw['minecraft:recipe_shaped']) {
        const body = raw['minecraft:recipe_shaped'];
        return {
            id: namespaced(body.description.identifier),
            type: 'shaped',
            group: body.group,
            stations: body.tags,
            result: resolveResult(body.result),
            pattern: body.pattern,
            ingredients: resolveShapedIngredients(body.key, body.pattern),
        };
    }

    if (raw['minecraft:recipe_shapeless']) {
        const body = raw['minecraft:recipe_shapeless'];
        return {
            id: namespaced(body.description.identifier),
            type: 'shapeless',
            group: body.group,
            stations: body.tags,
            result: resolveResult(body.result),
            ingredients: resolveShapelessIngredients(body.ingredients),
        };
    }

    if (raw['minecraft:recipe_furnace']) {
        const body = raw['minecraft:recipe_furnace'];
        return {
            id: namespaced(body.description.identifier),
            type: 'furnace',
            stations: body.tags,
            result: { id: namespaced(body.output), count: 1 },
            ingredients: [resolveIngredient(body.input, 1)],
        };
    }

    // recipe_brewing_mix (potion effect: awkward + blaze powder -> strength) and
    // recipe_brewing_container (container stage: potion + gunpowder -> splash_potion) share this
    // exact shape - the only real difference is what kind of transition input/output describe.
    // Bedrock has this data-driven; Java doesn't (brewing isn't in Java's data pack format at all
    // - see transform/recipes.ts's file header), so this closes a real gap that edition has.
    //
    // input/output here aren't literal item registry ids - they use Bedrock's own
    // "minecraft:potion_type:X" convention to name a potion effect or container stage, not a
    // concrete item. Kept as given (namespaced the same way) rather than invented into something
    // else, since a consumer who knows that convention can still use them directly; only
    // `reagent` is a real item id.
    if (raw['minecraft:recipe_brewing_mix']) {
        const body = raw['minecraft:recipe_brewing_mix'];
        return {
            id: namespaced(body.description.identifier),
            type: 'brewing_mix',
            stations: body.tags,
            result: { id: namespaced(body.output), count: 1 },
            ingredients: [resolveIngredient(body.input, 1), resolveIngredient(body.reagent, 1)],
        };
    }

    if (raw['minecraft:recipe_brewing_container']) {
        const body = raw['minecraft:recipe_brewing_container'];
        return {
            id: namespaced(body.description.identifier),
            type: 'brewing_container',
            stations: body.tags,
            result: { id: namespaced(body.output), count: 1 },
            ingredients: [resolveIngredient(body.input, 1), resolveIngredient(body.reagent, 1)],
        };
    }

    if (raw['minecraft:recipe_smithing_transform']) {
        const body = raw['minecraft:recipe_smithing_transform'];
        return {
            id: namespaced(body.description.identifier),
            type: 'smithing_transform',
            stations: body.tags,
            result: { id: namespaced(body.result), count: 1 },
            ingredients: [
                resolveIngredient(body.template, 1),
                resolveIngredient(body.base, 1),
                resolveIngredient(body.addition, 1),
            ],
        };
    }

    if (raw['minecraft:recipe_smithing_trim']) {
        // No result field, same as Java's smithing_trim - modifies the base armor piece's visual
        // pattern rather than producing a new item.
        const body = raw['minecraft:recipe_smithing_trim'];
        return {
            id: namespaced(body.description.identifier),
            type: 'smithing_trim',
            stations: body.tags,
            result: null,
            ingredients: [
                resolveIngredient(body.template, 1),
                resolveIngredient(body.base, 1),
                resolveIngredient(body.addition, 1),
            ],
        };
    }

    return null;
}

export async function buildBedrockRecipes(tag: string, concurrency = 16): Promise<Recipe[]> {
    const files = await listRecipeFiles(tag);
    const names = files.map(recipeNameFromPath);
    const parsed = await mapWithConcurrency(names, concurrency, async name => {
        const raw = await fetchRecipe(tag, name);
        return parseBedrockRecipe(raw);
    });
    return parsed.filter((recipe): recipe is Recipe => recipe !== null);
}
