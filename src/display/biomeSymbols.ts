// Biome visual-identity data - unlike items/blocks/entities, a biome's colour is already 100% real
// and unique per biome (Biome.color, transform/java/biomes.ts's own hex conversion of Mojang's real
// map/foliage tint - every one of the 65 real Java biomes has one, nothing to fall back on or
// invent). So the only real gap is a shape: a category-level visual grouping that lets a consumer
// tell "this is some kind of ocean biome" at a glance, while the colour itself still carries the
// full, exact per-biome distinction.

// Real minecraft-data `category` field, verified against all 65 of 26.1's real biomes (19 distinct
// category values). Grouped thematically rather than one shape per category, since the colour
// (already unique) does the actual distinguishing work here - shape only needs to convey a rough
// kind, not a precise identity, unlike the item/block families above where colour is often shared
// across an entire family and shape has to help.
export const BIOME_CATEGORY_SHAPES: Record<string, string> = {
    'ocean': '◇',
    'river': '◇',
    'beach': '◇',
    'underground': '■',
    'desert': '▲',
    'savanna': '▲',
    'mesa': '▲',
    'mountain': '▲',
    'extreme_hills': '▲',
    'ice': '○',
    'forest': '●',
    'jungle': '●',
    'taiga': '●',
    'swamp': '●',
    'mushroom': '●',
    'plains': '●',
    'nether': '★',
    'the_end': '◆',
};

// The real "none" category (2 biomes: pale_garden, the_void) has no coherent shared kind - a
// neutral fallback shape rather than forcing a meaning that isn't there. Still paired with that
// biome's own real colour by resolveBiomeSymbol, so nothing about the identity is fabricated, only
// the shape choice is a plain default.
export const BIOME_DEFAULT_SHAPE = '◐';
