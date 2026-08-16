// Converts a minecraft-data effect entry into this project's ParsedEffect shape.
//
// Unlike items/entities/enchantments, minecraft-data's effects.json stores its "name" field as
// PascalCase ("MiningFatigue", "NightVision", "DolphinsGrace") rather than the real snake_case
// registry id Mojang actually uses ("minecraft:mining_fatigue"). Converted here rather than
// carried through, so every ParsedX id in this project is namespaced the same real way.

import { fetchEffects, RawEffect } from '../sources/minecraft-data';
import { ParsedEffect } from './types';

function pascalToSnakeId(name: string): string {
    return `minecraft:${name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()}`;
}

export function parseEffect(raw: RawEffect): ParsedEffect {
    return {
        id: pascalToSnakeId(raw.name),
        displayName: raw.displayName,
        category: raw.type,
    };
}

export async function buildEffects(version: string): Promise<ParsedEffect[]> {
    const raw = await fetchEffects(version);
    return raw.map(parseEffect);
}
