export interface Structure {
    id: string;
    // Mojang's real structure-generator type ("minecraft:mineshaft", "minecraft:stronghold",
    // "minecraft:jigsaw" for the template-pool-driven ones like villages/ancient_city/
    // pillager_outpost - not one type per structure, several real distinct structures share
    // "jigsaw" as their generator kind).
    type: string;
    // Which world-generation phase this structure places in ("surface_structures",
    // "underground_structures", "underground_decoration") - Mojang's own real field, not derived.
    step: string;
    // The concrete biome ids this structure can generate in, resolved from its real "biomes" tag
    // reference (e.g. "#minecraft:has_structure/village_plains") the same recursive way recipe
    // ingredient tags resolve - see transform/java/tags.ts's resolveBiomeTag.
    biomes: string[];
}
