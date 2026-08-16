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
// Covers every recipe type present in mcmeta's data pack for 26.1 (verified by enumerating and
// counting every distinct `type` across all 1,515 recipe files - see the "Recipe type coverage"
// note in the README), with two deliberate exceptions:
//
// - crafting_special_repairitem carries no declarative fields at all (confirmed against the real
//   file: just `{type}`) - it operates on "two damaged items of matching type in the input slots",
//   not a fixed item/tag, so there's genuinely nothing to extract. Returns ingredients: [].
// - crafting_special_firework_star is deferred outright rather than modeled inaccurately: it has
//   ingredients that are required (dye, fuel), independently optional (trail, twinkle), *and*
//   mutually-exclusive alternatives (shapes.burst/creeper/large_ball/star - pick at most one).
//   Flattening that into the same flat ingredients[] every other type uses would misreport e.g.
//   diamond (trail) as required when it's optional. Needs its own shape before it can be modeled
//   honestly.
//
// A number of these "special" types turned out to have real, well-structured field data in the
// current game format that the original recipe.helpers.ts's comments assumed didn't exist
// (e.g. crafting_dye's own `dye` ingredient, dropped by the old code and now included) - Mojang
// made even the "hardcoded" crafting types substantially more data-driven since that code was
// last touched, verified here by fetching and reading the real files rather than trusting the
// old comments.
//
// Not covered because no structured source exists for it at all: brewing. It isn't data-pack
// driven - no recipe JSON file lists "potion of X + ingredient -> potion of Y" - so the original
// pipeline hand-authored a static potion table instead of parsing one. That's curated content,
// not a parse-a-source problem, so it belongs in merge/ against a real potion-effect list, not here.

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

        case 'crafting_special_bannerduplicate':
            return {
                id, type, result,
                ingredients: [await resolveIngredient(version, raw.banner, 1)],
            };

        case 'crafting_transmute':
            // 1.21.2+: one item (input) transformed by a second (material) into a differently-
            // flavoured version of itself - e.g. bundle + dye -> that colour of bundle.
            return {
                id, type, group: raw.group, result,
                ingredients: await Promise.all([
                    resolveIngredient(version, raw.input, 1),
                    resolveIngredient(version, raw.material, 1),
                ]),
            };

        case 'crafting_dye':
            // 1.21.6+: dyeing leather/wolf armor. The old pipeline only read `target` and
            // silently dropped `dye` (no field access to it at all, not a filtered-out choice) -
            // included properly here.
            return {
                id, type, group: raw.group, result,
                ingredients: await Promise.all([
                    resolveIngredient(version, raw.target, 1),
                    resolveIngredient(version, raw.dye, 1),
                ]),
            };

        case 'crafting_imbue':
            // Crafting-table tipped arrows: a base item flavoured by a "source" - e.g.
            // arrow + lingering potion -> 8 tipped arrows.
            return {
                id, type, result,
                ingredients: await Promise.all([
                    resolveIngredient(version, raw.material, 1),
                    resolveIngredient(version, raw.source, 1),
                ]),
            };

        case 'crafting_special_bookcloning':
            return {
                id, type, result,
                ingredients: await Promise.all([
                    resolveIngredient(version, raw.source, 1),
                    resolveIngredient(version, raw.material, 1),
                ]),
            };

        case 'crafting_special_firework_rocket':
            return {
                id, type, result,
                ingredients: await Promise.all([
                    resolveIngredient(version, raw.shell, 1),
                    resolveIngredient(version, raw.fuel, 1),
                    resolveIngredient(version, raw.star, 1),
                ]),
            };

        case 'crafting_special_firework_star_fade':
            return {
                id, type, result,
                ingredients: await Promise.all([
                    resolveIngredient(version, raw.target, 1),
                    resolveIngredient(version, raw.dye, 1),
                ]),
            };

        case 'crafting_special_mapextending':
            return {
                id, type, result,
                ingredients: await Promise.all([
                    resolveIngredient(version, raw.map, 1),
                    resolveIngredient(version, raw.material, 1),
                ]),
            };

        case 'crafting_special_shielddecoration':
            return {
                id, type, result,
                ingredients: await Promise.all([
                    resolveIngredient(version, raw.target, 1),
                    resolveIngredient(version, raw.banner, 1),
                ]),
            };

        case 'crafting_decorated_pot': {
            const sides = ['front', 'back', 'left', 'right'] as const;
            const present = sides.filter(side => raw[side]);
            return {
                id, type, result,
                ingredients: await Promise.all(present.map(side => resolveIngredient(version, raw[side], 1))),
            };
        }

        case 'crafting_special_repairitem':
            // No declarative ingredient data at all - see the file header note above.
            return { id, type, result: null, ingredients: [] };

        case 'crafting_special_firework_star':
            // Deliberately deferred - see the file header note above.
            return null;

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
