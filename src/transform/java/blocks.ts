// Converts a minecraft-data block entry into this project's Block shape.
//
// harvestTools and drops reference items.json's own numeric ids (verified: stone's drops: [35]
// really is item id 35, "cobblestone"), so this needs items.json alongside blocks.json to resolve
// them into real item ids rather than leaving them as opaque numbers - buildBlocks fetches both.

import { fetchBlocks, fetchItems, RawBlock, RawItem } from '../../sources/java/minecraft-data';
import { namespaced } from '../../util/id';
import { Block } from '../../models/block.model';

export function parseBlock(raw: RawBlock, itemNamesById: Map<number, string>): Block {
    const resolveItemId = (id: number): string => namespaced(itemNamesById.get(id) ?? String(id));

    return {
        id: namespaced(raw.name),
        displayName: raw.displayName,
        hardness: raw.hardness,
        resistance: raw.resistance,
        diggable: raw.diggable,
        material: raw.material,
        transparent: raw.transparent,
        emitLight: raw.emitLight,
        filterLight: raw.filterLight,
        harvestTools: raw.harvestTools ? Object.keys(raw.harvestTools).map(id => resolveItemId(Number(id))) : undefined,
        drops: raw.drops.map(resolveItemId),
        boundingBox: raw.boundingBox,
    };
}

export async function buildBlocks(version: string): Promise<Block[]> {
    const [rawBlocks, rawItems] = await Promise.all([fetchBlocks(version), fetchItems(version)]);
    const itemNamesById = new Map<number, string>(rawItems.map((item: RawItem) => [item.id, item.name]));
    return rawBlocks.map(block => parseBlock(block, itemNamesById));
}
