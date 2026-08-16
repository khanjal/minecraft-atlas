import { Ingredient } from './ingredient.model';

export interface RecipeResultEffect {
    // Effect id, namespaced the same way Effect.id is (e.g. "minecraft:night_vision") - a recipe
    // result's effects and the effects catalog (transform/java/effects.ts) share one id space, so
    // a consumer can join this straight against Effect for a display name.
    id: string;
    durationTicks: number;
}

export interface Recipe {
    id: string;
    type: string;
    group?: string;
    result: { id: string; count: number; effects?: RecipeResultEffect[] } | null;
    pattern?: string[];
    ingredients: Ingredient[];
    // Which station(s) this recipe can be made at (e.g. "furnace", "smoker", "crafting_table") -
    // real Bedrock data, always present on a Bedrock recipe. Undefined for Java recipes, which
    // don't need it: Java already encodes the station in `type` itself (separate "smelting" vs
    // "blasting" vs "smoking" types, rather than one type with a station list).
    stations?: string[];
    // Named convenience slots for recipe types with a small, fixed set of named ingredients rather
    // than an open list - smithing_transform/smithing_trim (template/base/addition) and
    // crafting_transmute/crafting_dye/crafting_imbue (base/addition only, no template). Duplicates
    // what's already in `ingredients` (same Ingredient objects, so tag-based slots - e.g.
    // smithing_transform's "addition" is netherite_tool_materials, a tag, on all 12 real recipes -
    // aren't flattened away), but named instead of positional: a consumer would otherwise have to
    // know "index 2 means addition for this specific type" rather than just reading `.addition`.
    template?: Ingredient;
    base?: Ingredient;
    addition?: Ingredient;
}
