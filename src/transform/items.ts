// Converts a minecraft-data item entry into this project's ParsedItem shape.

import { fetchItems, RawItem } from '../sources/minecraft-data';
import { namespaced } from '../util/id';
import { ParsedItem } from './types';

export function parseItem(raw: RawItem): ParsedItem {
    return {
        id: namespaced(raw.name),
        displayName: raw.displayName,
        stackSize: raw.stackSize,
        maxDurability: raw.maxDurability,
        enchantCategories: raw.enchantCategories,
        repairWith: raw.repairWith?.map(namespaced),
    };
}

export async function buildItems(version: string): Promise<ParsedItem[]> {
    const raw = await fetchItems(version);
    return raw.map(parseItem);
}
