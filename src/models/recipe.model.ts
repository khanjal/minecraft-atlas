import { Ingredient } from './ingredient.model';

export interface Recipe {
    id: string;
    type: string;
    group?: string;
    result: { id: string; count: number } | null;
    pattern?: string[];
    ingredients: Ingredient[];
    // Which station(s) this recipe can be made at (e.g. "furnace", "smoker", "crafting_table") -
    // real Bedrock data, always present on a Bedrock recipe. Undefined for Java recipes, which
    // don't need it: Java already encodes the station in `type` itself (separate "smelting" vs
    // "blasting" vs "smoking" types, rather than one type with a station list).
    stations?: string[];
}
