export interface ResolvedIngredient {
    type: 'item' | 'tag';
    // The item id itself ("minecraft:oak_planks"), or the tag id ("minecraft:planks").
    id: string;
    // Concrete item ids this ingredient accepts - a single-element array for a plain item, the
    // tag's full (recursively resolved) expansion for a tag.
    items: string[];
    // How many of this ingredient the recipe needs - grid-cell count for a shaped recipe,
    // slot count for shapeless.
    quantity: number;
}

export interface ParsedRecipe {
    id: string;
    type: string;
    group?: string;
    result: { id: string; count: number } | null;
    pattern?: string[];
    ingredients: ResolvedIngredient[];
}

export interface ParsedItem {
    id: string;
    displayName: string;
    stackSize: number;
    maxDurability?: number;
    enchantCategories?: string[];
    // Item ids this can be repaired with on an anvil, namespaced.
    repairWith?: string[];
}

export interface ParsedEntity {
    id: string;
    displayName: string;
    type: string;
    category?: string;
    width: number;
    height: number;
}

export interface ParsedEffect {
    id: string;
    displayName: string;
    category: 'good' | 'bad';
}

export interface ParsedEnchantment {
    id: string;
    displayName: string;
    maxLevel: number;
    treasureOnly: boolean;
    curse: boolean;
    tradeable: boolean;
    discoverable: boolean;
    weight: number;
    category: string;
    // Enchantment ids this can't coexist with on the same item, namespaced.
    excludes: string[];
}
