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
}
