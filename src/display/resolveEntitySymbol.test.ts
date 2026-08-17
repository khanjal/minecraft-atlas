import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveEntitySymbol, resolveEntityFixedSymbol } from './resolveEntitySymbol';
import { Entity } from '../models/entity.model';
import { ItemSymbol } from '../models/item-symbol.model';

function entity(overrides: Partial<Entity>): Entity {
    return { id: 'minecraft:test', ...overrides };
}

test('resolveEntityFixedSymbol matches Java entities by their real type field', () => {
    assert.deepEqual(resolveEntityFixedSymbol(entity({ type: 'hostile' })), { symbol: '▲', color: '#c0392b' });
    assert.deepEqual(resolveEntityFixedSymbol(entity({ type: 'animal' })), { symbol: '●', color: '#5e935e' });
    assert.deepEqual(resolveEntityFixedSymbol(entity({ type: 'water_creature' })), { symbol: '◇', color: '#3a8ee0' });
    assert.deepEqual(resolveEntityFixedSymbol(entity({ type: 'player' })), { symbol: '★', color: '#ffd700' });
});

test('resolveEntityFixedSymbol matches Java\'s real "mob" catch-all by individual id, not by type', () => {
    // All 10 real "mob"-type entities are individually hand-curated (small, coherent enough,
    // unlike "other") - matched on id, real type value is irrelevant once the id itself is known.
    assert.deepEqual(resolveEntityFixedSymbol(entity({ id: 'minecraft:ender_dragon', type: 'mob' })), { symbol: '★', color: '#4a2a5e' });
    // Reuses copper ingot's own reserved item colour - genuinely the same substance.
    assert.deepEqual(resolveEntityFixedSymbol(entity({ id: 'minecraft:copper_golem', type: 'mob' })), { symbol: '★', color: '#c87f4a' });
    assert.deepEqual(resolveEntityFixedSymbol(entity({ id: 'minecraft:slime', type: 'mob' })), { symbol: '★', color: '#8bc34a' });
});

test('resolveEntityFixedSymbol returns undefined for Java\'s real "other" catch-all type', () => {
    // 46 real, genuinely heterogeneous entries (boats, area_effect_cloud, minecarts, displays, ...)
    // - no single colour would mean anything, unlike "mob" (see the dedicated test below), which
    // is small and coherent enough to hand-curate individually.
    assert.equal(resolveEntityFixedSymbol(entity({ type: 'other' })), undefined);
    // "mob" itself, on an id NOT in JAVA_ENTITY_MOB_COLORS, still correctly falls through - the
    // type value alone was never a real signal, only the specific id is.
    assert.equal(resolveEntityFixedSymbol(entity({ type: 'mob' })), undefined);
    assert.equal(resolveEntityFixedSymbol(entity({})), undefined);
});

test('resolveEntityFixedSymbol matches Bedrock entities by spawn_category', () => {
    assert.deepEqual(resolveEntityFixedSymbol(entity({ category: 'monster' })), { symbol: '▲', color: '#c0392b' });
    assert.deepEqual(resolveEntityFixedSymbol(entity({ category: 'creature' })), { symbol: '●', color: '#5e935e' });
    // "misc" is Bedrock's own real catch-all (xp_orb, lightning_bolt, ...) - excluded the same way
    // Java's "other" is.
    assert.equal(resolveEntityFixedSymbol(entity({ category: 'misc' })), undefined);
});

test('resolveEntityFixedSymbol falls back to Bedrock family tags when spawn_category is absent', () => {
    assert.deepEqual(resolveEntityFixedSymbol(entity({ family: ['cow', 'mob'] })), { symbol: '●', color: '#5e935e' });
    assert.deepEqual(resolveEntityFixedSymbol(entity({ family: ['warden', 'monster', 'mob'] })), { symbol: '▲', color: '#c0392b' });
    // "inanimate" is real too (boat/chest_boat/minecart all genuinely carry it with no
    // spawn_category) - a neutral mechanical grey, distinct from any living-creature colour.
    assert.deepEqual(resolveEntityFixedSymbol(entity({ family: ['boat', 'inanimate'] })), { symbol: '■', color: '#8a8a78' });
    assert.equal(resolveEntityFixedSymbol(entity({ family: ['some_unrecognised_tag'] })), undefined);
});

test('resolveEntityFixedSymbol prefers spawn_category over family when both are present', () => {
    // A real shape: a Bedrock entity with spawn_category "creature" but a family list that happens
    // to include "monster" as a sub-tag should still use the more specific, official category.
    assert.deepEqual(
        resolveEntityFixedSymbol(entity({ category: 'creature', family: ['monster', 'mob'] })),
        { symbol: '●', color: '#5e935e' },
    );
});

test('resolveEntitySymbol falls back to a deterministic hash keyed on id for uncategorised entities', () => {
    const usedSoFar = new Map<string, ItemSymbol>();
    const first = resolveEntitySymbol(entity({ id: 'minecraft:area_effect_cloud', type: 'other' }), usedSoFar);
    const second = resolveEntitySymbol(entity({ id: 'minecraft:area_effect_cloud', type: 'other' }), new Map());
    assert.deepEqual(first, second);
});
