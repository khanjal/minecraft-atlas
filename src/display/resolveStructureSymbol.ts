// Resolves a Structure (models/structure.model.ts) to a display symbol+colour identity. Simpler
// than items/entities: the real catalog is only 34 structures, small enough that STRUCTURE_COLORS
// covers every single one directly (see its own header) - no family system needed, this is
// unconditionally 100% real, hand-verified coverage for every structure that exists today.

import { Structure } from '../models/structure.model';
import { ItemSymbol } from '../models/item-symbol.model';
import { STRUCTURE_COLORS } from './structureSymbols';
import { resolveHashedSymbol } from './resolveItemSymbol';

export function resolveStructureFixedSymbol(structure: Structure): ItemSymbol | undefined {
    return STRUCTURE_COLORS[structure.id];
}

// Combined entry point, mirroring resolveItemSymbol/resolveEntitySymbol: falls back to the same
// deterministic hash pool for a structure a future Minecraft version adds that isn't in
// STRUCTURE_COLORS yet - not reachable against any real structure today (all 34 are covered), kept
// for the same forward-compatibility reason the other resolvers have one.
export function resolveStructureSymbol(structure: Structure, usedSoFar: Map<string, ItemSymbol>): ItemSymbol {
    return resolveStructureFixedSymbol(structure) ?? resolveHashedSymbol(structure.id, usedSoFar);
}
