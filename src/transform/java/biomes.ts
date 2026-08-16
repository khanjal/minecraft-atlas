// Converts a minecraft-data biome entry into this project's Biome shape.

import { fetchBiomes, RawBiome } from '../../sources/java/minecraft-data';
import { namespaced } from '../../util/id';
import { Biome } from '../../models/biome.model';

function toHexColor(color: number): string {
    return `#${color.toString(16).padStart(6, '0')}`;
}

export function parseBiome(raw: RawBiome): Biome {
    return {
        id: namespaced(raw.name),
        displayName: raw.displayName,
        category: raw.category,
        dimension: raw.dimension,
        temperature: raw.temperature,
        hasPrecipitation: raw.has_precipitation,
        color: toHexColor(raw.color),
    };
}

export async function buildBiomes(version: string): Promise<Biome[]> {
    const raw = await fetchBiomes(version);
    return raw.map(parseBiome);
}
