export interface Item {
    id: string;
    displayName: string;
    stackSize: number;
    maxDurability?: number;
    enchantCategories?: string[];
    // Item ids this can be repaired with on an anvil, namespaced.
    repairWith?: string[];
}
