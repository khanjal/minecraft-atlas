// Parses mcmeta's raw per-recipe JSON into this project's ParsedRecipe shape.
//
// Port of Data Converter/lambda/helpers/minecraft/recipe.helpers.ts, re-pointed at mcmeta instead
// of the hand-vendored recipe files. The input format barely changes (mcmeta *is* Mojang's data
// pack format, the same thing already vendored today), so the real difference is tag handling:
// the old pipeline left a tag ingredient as just its own name ("planks") and relied on a later
// join against the curated item list's `groups` field to find which concrete items qualified.
// That join doesn't exist here - this is meant to stand alone - so tags are resolved directly via
// mcmeta's own data/minecraft/tags/item/*.json (see tags.ts) into a real, self-contained list of
// item ids.
//
// Covers the recipe types that produce a concrete crafting requirement: crafting_shaped,
// crafting_shapeless, the smelting family (smelting/blasting/smoking/campfire_cooking),
// stonecutting, smithing_transform, and smithing_trim. Not yet ported: the ~15 crafting_special_*
// one-off types (bookcloning, firework_*, shielddecoration, shulkerboxcoloring, suspiciousstew,
// tippedarrow, armordye, bannerduplicate, banneraddpattern, repairitem), crafting_decorated_pot,
// crafting_transmute, crafting_dye, crafting_imbue, and brewing (brewing isn't data-pack driven
// at all - it lives in the game's brewing logic, not a recipe JSON file, so it needs a different
// source entirely, same as it did in the original pipeline).

import { fetchRecipe, listRecipeFiles, recipeNameFromPath } from '../sources/mcmeta';
import { mapWithConcurrency } from '../util/concurrency';
import { namespaced } from '../util/id';
import { resolveTag } from './tags';
import { ParsedRecipe, ResolvedIngredient } from './types';

type RawIngredientSpec = string | { item?: string; tag?: string } | RawIngredientSpec[];

async function resolveIngredient(version: string, spec: RawIngredientSpec, quantity: number): Promise<ResolvedIngredient> {
    if (Array.isArray(spec)) {
        // A rare, explicit list of alternative items for one slot (not a tag reference) - e.g.
        // "either of these two exact items". Each entry is itself resolved and merged; in
        // practice every entry here is a plain item, since a real tag reference is written as a
        // string or {tag: ...}, not nested inside an array.
        const items: string[] = [];
        for (const entry of spec) {
            items.push(...(await resolveIngredient(version, entry, quantity)).items);
        }
        return { type: 'item', id: items[0] ?? '', items, quantity };
    }

    if (typeof spec === 'string') {
        if (spec.startsWith('#')) {
            const tagId = namespaced(spec.slice(1));
            return { type: 'tag', id: tagId, items: await resolveTag(version, tagId), quantity };
        }
        const id = namespaced(spec);
        return { type: 'item', id, items: [id], quantity };
    }

    if (spec.tag) {
        const tagId = namespaced(spec.tag);
        return { type: 'tag', id: tagId, items: await resolveTag(version, tagId), quantity };
    }

    const id = namespaced(spec.item!);
    return { type: 'item', id, items: [id], quantity };
}

async function resolveShapedIngredients(
    version: string,
    key: Record<string, RawIngredientSpec>,
    pattern: string[]
): Promise<ResolvedIngredient[]> {
    const flat = pattern.join('');
    const symbols = Object.keys(key);
    return Promise.all(symbols.map(symbol => {
        const quantity = flat.split(symbol).length - 1;
        return resolveIngredient(version, key[symbol], quantity);
    }));
}

async function resolveShapelessIngredients(version: string, ingredients: RawIngredientSpec[]): Promise<ResolvedIngredient[]> {
    const resolved = await Promise.all(ingredients.map(spec => resolveIngredient(version, spec, 1)));
    // Multiple slots can name the same item/tag (e.g. 2 sugar in suspicious stew) - collapse
    // those into one entry with a summed quantity rather than reporting the same ingredient twice.
    const byId = new Map<string, ResolvedIngredient>();
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

function resolveResult(raw: any): { id: string; count: number } | null {
    if (!raw.result) {
        return null;
    }
    const id = raw.result.id ?? raw.result.item ?? raw.result;
    return { id: namespaced(id), count: raw.result.count ?? 1 };
}

export async function parseRecipe(version: string, name: string, raw: any): Promise<ParsedRecipe | null> {
    const type: string = raw.type.replace('minecraft:', '');
    const id = namespaced(name);
    const result = resolveResult(raw);

    switch (type) {
        case 'crafting_shaped':
            return {
                id, type, group: raw.group, result, pattern: raw.pattern,
                ingredients: await resolveShapedIngredients(version, raw.key, raw.pattern),
            };

        case 'crafting_shapeless':
            return {
                id, type, group: raw.group, result,
                ingredients: await resolveShapelessIngredients(version, raw.ingredients),
            };

        case 'smelting':
        case 'blasting':
        case 'campfire_cooking':
        case 'smoking':
        case 'stonecutting':
            return {
                id, type, result,
                ingredients: [await resolveIngredient(version, raw.ingredient, 1)],
            };

        case 'smithing_transform':
            return {
                id, type, result,
                ingredients: await Promise.all([
                    resolveIngredient(version, raw.template, 1),
                    resolveIngredient(version, raw.base, 1),
                    resolveIngredient(version, raw.addition, 1),
                ]),
            };

        case 'smithing_trim':
            // Applies a trim pattern to the base armor piece rather than producing a new item -
            // result is genuinely null here, not a parsing gap. (The original pipeline dropped
            // this recipe type entirely, since its "has no result -> discard" filter caught it as
            // a side effect; this is a deliberate improvement, not just a port.)
            return {
                id, type, result: null,
                ingredients: await Promise.all([
                    resolveIngredient(version, raw.template, 1),
                    resolveIngredient(version, raw.base, 1),
                    resolveIngredient(version, raw.addition, 1),
                ]),
            };

        default:
            return null;
    }
}

export async function buildRecipes(version: string, concurrency = 16): Promise<ParsedRecipe[]> {
    const files = await listRecipeFiles(version);
    const names = files.map(recipeNameFromPath);
    const parsed = await mapWithConcurrency(names, concurrency, async name => {
        const raw = await fetchRecipe(version, name);
        return parseRecipe(version, name, raw);
    });
    return parsed.filter((recipe): recipe is ParsedRecipe => recipe !== null);
}
