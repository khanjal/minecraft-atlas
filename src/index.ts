// Public API. Only what's exported here is meant to be depended on by consumers - everything
// else under src/ is reachable by path but not a stability guarantee.

export { buildSnapshot } from './schema/public';
export { overlay } from './merge/overlay';
export { buildCoverageReport } from './diff/coverageReport';

export { buildItems } from './transform/java/items';
export { buildEntities } from './transform/java/entities';
export { buildEffects } from './transform/java/effects';
export { buildEnchantments } from './transform/java/enchantments';
export { buildRecipes } from './transform/java/recipes';
export { buildBlocks } from './transform/java/blocks';
export { buildBiomes } from './transform/java/biomes';
export { buildStructures } from './transform/java/structures';
export { buildBedrockRecipes } from './transform/bedrock/recipes';
export { buildBedrockEntities } from './transform/bedrock/entities';

export { resolveItemSymbol, resolveFixedSymbol, resolveHashedSymbol, canonicalizeName } from './display/resolveItemSymbol';
export { resolveEntitySymbol, resolveEntityFixedSymbol } from './display/resolveEntitySymbol';
export { resolveBiomeSymbol } from './display/resolveBiomeSymbol';
export { resolveStructureSymbol, resolveStructureFixedSymbol } from './display/resolveStructureSymbol';
export { DISPLAY_SYMBOLS, PROVISIONAL_DISPLAY_SYMBOLS, SYMBOL_COLORS } from './display/itemSymbols';

export type { Item } from './models/item.model';
export type { Entity } from './models/entity.model';
export type { Effect } from './models/effect.model';
export type { Enchantment } from './models/enchantment.model';
export type { Recipe } from './models/recipe.model';
export type { Ingredient } from './models/ingredient.model';
export type { Block } from './models/block.model';
export type { Biome } from './models/biome.model';
export type { Structure } from './models/structure.model';
export type { CuratedRecord } from './models/curated-record.model';
export type { Snapshot } from './models/snapshot.model';
export type { Overlaid } from './merge/overlay';
export type { CoverageGap } from './diff/coverageReport';
export type { ItemSymbol } from './models/item-symbol.model';
