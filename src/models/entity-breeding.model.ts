export interface EntityBreeding {
    entityId: string;
    // Whether this entity must be tamed first before it'll breed (real Bedrock field - e.g. true
    // for horses, absent/false for cows).
    requireTame?: boolean;
    // The real entity ids this can breed with, from Bedrock's own `breeds_with` map keys (e.g.
    // horse breeds with both "minecraft:horse" and "minecraft:donkey", the real mule mechanic).
    breedsWith: string[];
    // Bedrock's own raw item-id strings for what feeds/triggers breeding (e.g. "muttonRaw",
    // "appleEnchanted") - deliberately NOT run through namespaced()/mapped to a real item registry
    // id the way every other id in this project is. See transform/bedrock/entityBehavior.ts's own
    // header for why: these are Bedrock's internal shorthand, not consistently real item ids, and
    // no public source maps them to either edition's actual item registry.
    breedItems: string[];
}
