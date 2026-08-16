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
    // The recipe's own grid-pattern key this ingredient fills (e.g. "#" in a pattern like
    // ["# #", "###"]) - only present on a shaped recipe's ingredients, where it's needed to place
    // each ingredient in the right grid cell. Mojang's own pattern keys are arbitrary per recipe
    // (diamond might be "#" in one recipe, "D" in the next), so this is only meaningful alongside
    // that same recipe's own `pattern`, not as a stable identity across recipes.
    symbol?: string;
}
