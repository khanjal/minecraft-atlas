export interface Enchantment {
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
