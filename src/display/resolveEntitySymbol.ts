// Resolves an Entity (models/entity.model.ts) to a display symbol+colour identity, by real
// category rather than by name - see entitySymbols.ts's header for why a per-entity RESERVED_SYMBOLS
// equivalent isn't what this does. Separate from resolveItemSymbol.ts since entities are matched
// on a structured field (type/category/family), not a name string - there's no shared matching
// logic between the two beyond both eventually falling back to the same deterministic hash pool.

import { Entity } from '../models/entity.model';
import { ItemSymbol } from '../models/item-symbol.model';
import {
    JAVA_ENTITY_TYPE_COLORS, JAVA_ENTITY_MOB_COLORS, BEDROCK_ENTITY_CATEGORY_COLORS,
    BEDROCK_ENTITY_FAMILY_COLORS,
} from './entitySymbols';
import { resolveHashedSymbol } from './resolveItemSymbol';

// Java: a real per-id match for the small "mob" catch-all (JAVA_ENTITY_MOB_COLORS) first, then the
// real minecraft-data `type` field for everything else. Returns undefined for "other" (a genuine,
// too-heterogeneous catch-all - see entitySymbols.ts) or an entity with no type at all, so the
// caller's hash fallback picks up anything not meaningfully categorised.
function resolveJavaEntityFixedSymbol(entity: Entity): ItemSymbol | undefined {
    if (JAVA_ENTITY_MOB_COLORS[entity.id]) {
        return JAVA_ENTITY_MOB_COLORS[entity.id];
    }

    if (!entity.type) {
        return undefined;
    }

    return JAVA_ENTITY_TYPE_COLORS[entity.type];
}

// Bedrock: matched on the real `spawn_category` field first (the more specific, official
// classification when present), falling back to a `type_family` tag check for entities that lack
// spawn_category (e.g. non-spawnable ones) but still carry a real "monster"/"mob" family tag.
function resolveBedrockEntityFixedSymbol(entity: Entity): ItemSymbol | undefined {
    if (entity.category && BEDROCK_ENTITY_CATEGORY_COLORS[entity.category]) {
        return BEDROCK_ENTITY_CATEGORY_COLORS[entity.category];
    }

    if (entity.family) {
        for (const tag of entity.family) {
            if (BEDROCK_ENTITY_FAMILY_COLORS[tag]) {
                return BEDROCK_ENTITY_FAMILY_COLORS[tag];
            }
        }
    }

    return undefined;
}

// Single entry point - tries Java's real `type` field, then Bedrock's real `category`/`family`
// fields (an Entity from either edition may have either set, so both are always checked; a Java
// entity never has `category`/`family` populated the way Bedrock's are, and vice versa, so there's
// no real risk of one edition's data accidentally matching the other's table).
export function resolveEntityFixedSymbol(entity: Entity): ItemSymbol | undefined {
    return resolveJavaEntityFixedSymbol(entity) || resolveBedrockEntityFixedSymbol(entity);
}

// Combined convenience entry point, mirroring resolveItemSymbol: a fixed category identity if this
// entity's real classification data resolves to one, otherwise a deterministic hash keyed on the
// entity's id (stable across calls, unlike relying on display order).
export function resolveEntitySymbol(entity: Entity, usedSoFar: Map<string, ItemSymbol>): ItemSymbol {
    return resolveEntityFixedSymbol(entity) ?? resolveHashedSymbol(entity.id, usedSoFar);
}
