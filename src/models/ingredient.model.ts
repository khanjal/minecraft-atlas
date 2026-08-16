export interface Ingredient {
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
