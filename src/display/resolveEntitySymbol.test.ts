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

test('resolveEntityFixedSymbol returns undefined for Java\'s real catch-all type values', () => {
    // "other" (boats, area_effect_cloud, ...) and "mob" (allay, ender_dragon, ghast, ...) are real
    // heterogeneous buckets in minecraft-data itself - no single colour would mean anything.
    assert.equal(resolveEntityFixedSymbol(entity({ type: 'other' })), undefined);
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
    assert.equal(resolveEntityFixedSymbol(entity({ family: ['inanimate'] })), undefined);
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
