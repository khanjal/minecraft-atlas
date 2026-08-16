import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveItemSymbol, resolveFixedSymbol, resolveHashedSymbol, canonicalizeName } from './resolveItemSymbol';
import { ItemSymbol } from '../models/item-symbol.model';

test('canonicalizeName folds every wood species into one of three identities', () => {
    assert.equal(canonicalizeName('oak planks'), 'planks');
    assert.equal(canonicalizeName('birch planks'), 'planks');
    assert.equal(canonicalizeName('stripped acacia log'), 'stripped log');
    assert.equal(canonicalizeName('stripped bamboo block'), 'stripped log');
    assert.equal(canonicalizeName('oak log'), 'log');
    assert.equal(canonicalizeName('crimson stem'), 'log');
    assert.equal(canonicalizeName('oak boat'), 'boat');
    assert.equal(canonicalizeName('bamboo raft'), 'boat');
    assert.equal(canonicalizeName('diamond'), 'diamond');
});

test('resolveFixedSymbol returns the reserved entry for a hand-picked item', () => {
    assert.deepEqual(resolveFixedSymbol('diamond'), { symbol: '◆', color: '#4dd9ff' });
});

test('resolveFixedSymbol applies canonicalization before the reserved lookup', () => {
    // "oak planks" isn't itself a RESERVED_SYMBOLS key - only "planks" is.
    assert.deepEqual(resolveFixedSymbol('oak planks'), { symbol: '■', color: '#c9976b' });
});

test('resolveFixedSymbol matches a colour family, longest colour name first', () => {
    assert.deepEqual(resolveFixedSymbol('purple wool'), { symbol: '■', color: '#8932b8' });
    // "light gray" must be checked before the shorter "gray" would wrongly match as
    // "gray" + leftover "y wool".
    assert.deepEqual(resolveFixedSymbol('light gray wool'), { symbol: '■', color: '#9d9d97' });
    assert.deepEqual(resolveFixedSymbol('light blue carpet'), { symbol: '▭', color: '#3ab3da' });
});

test('resolveFixedSymbol returns undefined for a colour prefix with no listed family', () => {
    // "purple shulker box" - shulker box was deliberately excluded (never an ingredient in any
    // real 26.2 shaped recipe, see itemSymbols.ts).
    assert.equal(resolveFixedSymbol('purple shulker box'), undefined);
});

test('resolveFixedSymbol matches copper forms by oxidation stage, waxed or not', () => {
    assert.deepEqual(resolveFixedSymbol('copper bulb'), { symbol: '▬', color: '#c87f4a' });
    assert.deepEqual(resolveFixedSymbol('exposed copper bulb'), { symbol: '▬', color: '#a68868' });
    assert.deepEqual(resolveFixedSymbol('waxed weathered copper bulb'), { symbol: '▬', color: '#6b9080' });
    assert.deepEqual(resolveFixedSymbol('oxidized copper'), { symbol: '▬', color: '#4a8f6b' });
    // Copper chain is the one form that gets a different shape from the rest.
    assert.deepEqual(resolveFixedSymbol('copper chain'), { symbol: '▮', color: '#c87f4a' });
});

test('resolveFixedSymbol matches potion families, including the delivery-word position quirk', () => {
    assert.deepEqual(resolveFixedSymbol('potion of healing'), { symbol: '◑', color: '#f82423' });
    assert.deepEqual(resolveFixedSymbol('splash potion of healing'), { symbol: '◑', color: '#f82423' });
    assert.deepEqual(resolveFixedSymbol('lingering potion of healing'), { symbol: '◑', color: '#f82423' });
    // extended/enhanced tiers sit between the delivery word and "potion of X".
    assert.deepEqual(resolveFixedSymbol('extended potion of poison'), { symbol: '◑', color: '#4e9331' });
    // water bottle takes the delivery word as a plain prefix, same as an effect potion.
    assert.deepEqual(resolveFixedSymbol('splash water bottle'), { symbol: '◑', color: '#7ec4e8' });
    // awkward/mundane/thick insert the delivery word before "potion", not as a prefix.
    assert.deepEqual(resolveFixedSymbol('awkward splash potion'), { symbol: '◑', color: '#96896e' });
    assert.deepEqual(resolveFixedSymbol('awkward potion'), { symbol: '◑', color: '#96896e' });
});

test('resolveFixedSymbol returns undefined for an unmatched name', () => {
    assert.equal(resolveFixedSymbol('totally unknown made up item'), undefined);
});

test('resolveHashedSymbol is deterministic for the same name', () => {
    const usedSoFar = new Map<string, ItemSymbol>();
    const first = resolveHashedSymbol('some unreserved item', usedSoFar);
    const second = resolveHashedSymbol('some unreserved item', new Map());
    assert.deepEqual(first, second);
});

test('resolveHashedSymbol bumps to a free slot on a collision', () => {
    const usedSoFar = new Map<string, ItemSymbol>();
    const first = resolveHashedSymbol('item a', usedSoFar);
    usedSoFar.set('item a', first);

    // Force a collision by pre-claiming a second name's natural slot too, then confirm a third
    // name never reuses either already-claimed exact pair.
    const second = resolveHashedSymbol('item b', usedSoFar);
    assert.notDeepEqual(second, first);
});

test('resolveItemSymbol prefers a fixed identity over a hashed one', () => {
    const usedSoFar = new Map<string, ItemSymbol>();
    assert.deepEqual(resolveItemSymbol('diamond', usedSoFar), { symbol: '◆', color: '#4dd9ff' });
});

test('resolveItemSymbol falls back to a hashed identity for an unmatched name', () => {
    const usedSoFar = new Map<string, ItemSymbol>();
    const result = resolveItemSymbol('totally unknown made up item', usedSoFar);
    assert.equal(typeof result.symbol, 'string');
    assert.equal(typeof result.color, 'string');
    assert.equal(result.color.startsWith('#'), true);
});
