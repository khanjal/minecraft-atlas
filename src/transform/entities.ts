// Converts a minecraft-data entity entry into this project's Entity shape.

import { fetchEntities, RawEntity } from '../sources/minecraft-data';
import { namespaced } from '../util/id';
import { Entity } from '../models/entity.model';

export function parseEntity(raw: RawEntity): Entity {
    return {
        id: namespaced(raw.name),
        displayName: raw.displayName,
        type: raw.type,
        category: raw.category,
        width: raw.width,
        height: raw.height,
    };
}

export async function buildEntities(version: string): Promise<Entity[]> {
    const raw = await fetchEntities(version);
    return raw.map(parseEntity);
}
