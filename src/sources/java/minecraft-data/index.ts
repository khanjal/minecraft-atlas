// Wraps PrismarineJS/minecraft-data: items, entities, effects, enchantments, per version.
// Fetched directly from the repo (data/pc/{version}/*.json on master) rather than depending on
// the minecraft-data npm package, which bundles every version's data locally at once - not
// needed here since a build only ever wants one version at a time, same sourcing model as mcmeta.
// minecraft-data has no per-version tag (unlike mcmeta), so master is the only ref there is.

const REPO = 'PrismarineJS/minecraft-data';

function rawUrl(version: string, file: string): string {
    return `https://raw.githubusercontent.com/${REPO}/master/data/pc/${version}/${file}.json`;
}

async function fetchJson<T = any>(version: string, file: string): Promise<T> {
    const res = await fetch(rawUrl(version, file));
    if (!res.ok) {
        throw new Error(`minecraft-data: failed to fetch ${file}.json @ ${version} (${res.status} ${res.statusText})`);
    }
    return res.json() as Promise<T>;
}

export interface RawItem {
    id: number;
    name: string;
    displayName: string;
    stackSize: number;
    maxDurability?: number;
    enchantCategories?: string[];
    repairWith?: string[];
}

export interface RawEntity {
    id: number;
    internalId: number;
    name: string;
    displayName: string;
    width: number;
    height: number;
    type: string;
    category?: string;
}

// Unlike items/entities/enchantments, effects.json's own "name" field is PascalCase
// ("MiningFatigue", "NightVision") rather than the real snake_case registry id - see
// transform/effects.ts for the conversion. displayName is the real human-readable form.
export interface RawEffect {
    id: number;
    name: string;
    displayName: string;
    type: 'good' | 'bad';
}

export interface RawEnchantment {
    id: number;
    name: string;
    displayName: string;
    maxLevel: number;
    minCost: { a: number; b: number };
    maxCost: { a: number; b: number };
    treasureOnly: boolean;
    curse: boolean;
    exclude: string[];
    category: string;
    weight: number;
    tradeable: boolean;
    discoverable: boolean;
}

// harvestTools' keys and drops' entries are item ids in the exact same numbering as items.json's
// own `id` (verified: stone's drops: [35] is items.json id 35, "cobblestone") - blocks and items
// share one id space here, so transform/java/blocks.ts can resolve both into real item ids by
// joining against items.json rather than leaving them as opaque numbers.
export interface RawBlock {
    id: number;
    name: string;
    displayName: string;
    hardness: number;
    resistance: number;
    diggable: boolean;
    material: string;
    transparent: boolean;
    emitLight: number;
    filterLight: number;
    harvestTools?: Record<string, boolean>;
    drops: number[];
    boundingBox: string;
}

export interface RawBiome {
    id: number;
    name: string;
    displayName: string;
    category: string;
    dimension: string;
    temperature: number;
    has_precipitation: boolean;
    color: number;
}

export async function fetchItems(version: string): Promise<RawItem[]> {
    return fetchJson<RawItem[]>(version, 'items');
}

export async function fetchEntities(version: string): Promise<RawEntity[]> {
    return fetchJson<RawEntity[]>(version, 'entities');
}

export async function fetchEffects(version: string): Promise<RawEffect[]> {
    return fetchJson<RawEffect[]>(version, 'effects');
}

export async function fetchEnchantments(version: string): Promise<RawEnchantment[]> {
    return fetchJson<RawEnchantment[]>(version, 'enchantments');
}

export async function fetchBlocks(version: string): Promise<RawBlock[]> {
    return fetchJson<RawBlock[]>(version, 'blocks');
}

export async function fetchBiomes(version: string): Promise<RawBiome[]> {
    return fetchJson<RawBiome[]>(version, 'biomes');
}
