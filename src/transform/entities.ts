// Converts a minecraft-data entity entry into this project's ParsedEntity shape.

import { fetchEntities, RawEntity } from '../sources/minecraft-data';
import { namespaced } from '../util/id';
import { ParsedEntity } from './types';

export function parseEntity(raw: RawEntity): ParsedEntity {
    return {
        id: namespaced(raw.name),
        displayName: raw.displayName,
        type: raw.type,
        category: raw.category,
        width: raw.width,
        height: raw.height,
    };
}

export async function buildEntities(version: string): Promise<ParsedEntity[]> {
    const raw = await fetchEntities(version);
    return raw.map(parseEntity);
}
