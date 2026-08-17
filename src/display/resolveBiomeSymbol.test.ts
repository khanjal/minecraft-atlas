import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveBiomeSymbol } from './resolveBiomeSymbol';
import { Biome } from '../models/biome.model';

function biome(overrides: Partial<Biome>): Biome {
    return {
        id: 'minecraft:test',
        displayName: 'Test',
        category: 'plains',
        dimension: 'overworld',
        temperature: 0.8,
        hasPrecipitation: true,
        color: '#123456',
        ...overrides,
    };
}

test('resolveBiomeSymbol always uses the biome\'s own real colour, never a hash', () => {
    // "#4287f5" is a real, arbitrary hex - resolveBiomeSymbol must return exactly it, not something
    // derived from the id/name the way item/entity hashing would.
    const result = resolveBiomeSymbol(biome({ color: '#4287f5' }));
    assert.equal(result.color, '#4287f5');
});

test('resolveBiomeSymbol picks a shape from the real category field', () => {
    assert.equal(resolveBiomeSymbol(biome({ category: 'ocean' })).symbol, '◇');
    assert.equal(resolveBiomeSymbol(biome({ category: 'nether' })).symbol, '★');
    assert.equal(resolveBiomeSymbol(biome({ category: 'the_end' })).symbol, '◆');
});

test('resolveBiomeSymbol groups related categories under one shape (colour still tells them apart)', () => {
    const desert = resolveBiomeSymbol(biome({ category: 'desert', color: '#d4c47a' }));
    const savanna = resolveBiomeSymbol(biome({ category: 'savanna', color: '#a5665a' }));
    assert.equal(desert.symbol, savanna.symbol);
    assert.notEqual(desert.color, savanna.color);
});

test('resolveBiomeSymbol falls back to a neutral shape for the real "none" category, keeping the real colour', () => {
    const result = resolveBiomeSymbol(biome({ category: 'none', color: '#5c5c5c' }));
    assert.equal(result.symbol, '◐');
    assert.equal(result.color, '#5c5c5c');
});
