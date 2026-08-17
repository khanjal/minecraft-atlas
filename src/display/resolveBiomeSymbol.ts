// Resolves a Biome (models/biome.model.ts) to a display symbol+colour identity. Simpler than
// resolveItemSymbol/resolveEntitySymbol: a biome's colour is already real and unique (Biome.color),
// so this never falls back to a hash - only the shape needs resolving, from the biome's own real
// `category` field.

import { Biome } from '../models/biome.model';
import { ItemSymbol } from '../models/item-symbol.model';
import { BIOME_CATEGORY_SHAPES, BIOME_DEFAULT_SHAPE } from './biomeSymbols';

export function resolveBiomeSymbol(biome: Biome): ItemSymbol {
    return {
        symbol: BIOME_CATEGORY_SHAPES[biome.category] ?? BIOME_DEFAULT_SHAPE,
        color: biome.color,
    };
}
