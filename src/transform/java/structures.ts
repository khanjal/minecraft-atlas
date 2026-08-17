// Parses mcmeta's raw worldgen/structure JSON into this project's Structure shape - a real,
// previously-untouched public data source (Craft Helper's own "Thing" catalog covers similar
// ground, but with hand-curated fields - synonyms, parent, generates - that make it genuinely
// different from this: curated naming data, not raw game data, the same boundary the rest of this
// project already draws). Verified: 34 real structure definitions for 26.1, each already a small,
// well-structured object (`type`, `step`, `biomes`) - no format quirks found, unlike recipes/
// entities elsewhere in this project.

import { listStructureFiles, structureNameFromPath, fetchStructure } from '../../sources/java/mcmeta';
import { resolveBiomeTag } from './tags';
import { mapWithConcurrency } from '../../util/concurrency';
import { namespaced } from '../../util/id';
import { Structure } from '../../models/structure.model';

// `biomes` is always a real tag reference in the live data (verified across all 34 structures -
// none use a bare biome id or list) but a bare id is handled too rather than assumed impossible,
// the same defensive shape recipes.ts already takes for tag-vs-plain ingredient references.
export async function parseStructure(version: string, name: string, raw: any): Promise<Structure> {
    const biomes = typeof raw.biomes === 'string' && raw.biomes.startsWith('#')
        ? await resolveBiomeTag(version, raw.biomes.slice(1))
        : [namespaced(raw.biomes)];

    return {
        id: namespaced(name),
        type: namespaced(raw.type),
        step: raw.step,
        biomes,
    };
}

export async function buildStructures(version: string, concurrency = 16): Promise<Structure[]> {
    const files = await listStructureFiles(version);
    const names = files.map(structureNameFromPath);
    return mapWithConcurrency(names, concurrency, async name => {
        const raw = await fetchStructure(version, name);
        return parseStructure(version, name, raw);
    });
}
