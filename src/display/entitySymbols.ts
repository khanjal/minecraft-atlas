// Entity visual-identity data - unlike items/blocks (matched by name pattern), entities are matched
// by real category field, since there's no equivalent of RESERVED_SYMBOLS' name-based hand-picking
// for ~300 real Java+Bedrock entities without either fabricating individual per-mob colours (no
// verified real source for that at this scale) or genuinely hand-authoring each one. A category-
// based identity is honest about what it is: "this is a hostile mob" rendered consistently, not
// "this is specifically a zombie" - still a real, deliberate identity, grounded in each edition's
// own real classification field rather than invented.

import { ItemSymbol } from '../models/item-symbol.model';

// Java's real minecraft-data `type` field, verified distribution against 26.1's real entities.json
// (10 real values, e.g. 34 hostile, 34 animal, 19 projectile, 46 "other"). "other" and "mob" are
// deliberately excluded - both are genuine catch-all buckets in the source data itself (boats,
// area_effect_cloud, ender_dragon, ghast, ... - no coherent single visual identity fits), so they
// fall through to the hash fallback rather than being forced into a fixed colour that wouldn't mean
// anything.
export const JAVA_ENTITY_TYPE_COLORS: Record<string, ItemSymbol> = {
    'hostile': { symbol: '▲', color: '#c0392b' },
    'animal': { symbol: '●', color: '#5e935e' },
    'passive': { symbol: '●', color: '#5e935e' },
    'water_creature': { symbol: '◇', color: '#3a8ee0' },
    'ambient': { symbol: '○', color: '#a8b8c0' },
    // Reuses the 'arrow' item's own reserved colour (itemSymbols.ts) - a thrown/shot entity and the
    // literal arrow item are the same real fletching-grey identity.
    'projectile': { symbol: '▯', color: '#8a8577' },
    // Armor stand and mannequin - inanimate humanoid props, not a living creature.
    'living': { symbol: '■', color: '#8a8a78' },
    'player': { symbol: '★', color: '#ffd700' },
};

// Bedrock's real `description.spawn_category` field (verified against v1.26.40.05's real 127
// entities: 44 monster, 33 creature, 20 misc, plus smaller water/ambient buckets). "misc" is
// deliberately excluded, same reasoning as Java's "other"/"mob" - xp_orb, area_effect_cloud,
// lightning_bolt, ... share no real visual identity.
export const BEDROCK_ENTITY_CATEGORY_COLORS: Record<string, ItemSymbol> = {
    'monster': { symbol: '▲', color: '#c0392b' },
    'creature': { symbol: '●', color: '#5e935e' },
    'water_creature': { symbol: '◇', color: '#3a8ee0' },
    'water_ambient': { symbol: '◇', color: '#3a8ee0' },
    'underground_water_creature': { symbol: '◇', color: '#3a8ee0' },
    'ambient': { symbol: '○', color: '#a8b8c0' },
};

// Bedrock's real `minecraft:type_family` list can carry a category hint even when
// spawn_category is absent (e.g. non-spawnable entities) - checked as a fallback after
// spawn_category, keyed by the same real family strings Bedrock itself uses ("monster", "mob" for
// generic creatures - "mob" alone maps to the same green as "creature" rather than being excluded,
// since a passive-by-default mob with no more specific family is still a real creature, unlike
// Java's true catch-all "mob" type value above).
export const BEDROCK_ENTITY_FAMILY_COLORS: Record<string, ItemSymbol> = {
    'monster': { symbol: '▲', color: '#c0392b' },
    'mob': { symbol: '●', color: '#5e935e' },
};
