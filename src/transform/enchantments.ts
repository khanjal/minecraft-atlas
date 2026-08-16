// Converts a minecraft-data enchantment entry into this project's Enchantment shape.

import { fetchEnchantments, RawEnchantment } from '../sources/minecraft-data';
import { namespaced } from '../util/id';
import { Enchantment } from '../models/enchantment.model';

export function parseEnchantment(raw: RawEnchantment): Enchantment {
    return {
        id: namespaced(raw.name),
        displayName: raw.displayName,
        maxLevel: raw.maxLevel,
        treasureOnly: raw.treasureOnly,
        curse: raw.curse,
        tradeable: raw.tradeable,
        discoverable: raw.discoverable,
        weight: raw.weight,
        category: raw.category,
        excludes: raw.exclude.map(namespaced),
    };
}

export async function buildEnchantments(version: string): Promise<Enchantment[]> {
    const raw = await fetchEnchantments(version);
    return raw.map(parseEnchantment);
}
