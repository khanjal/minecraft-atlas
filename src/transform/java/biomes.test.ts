import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBiome } from './biomes';

// Real minecraft-data 26.1 fixture, verified against the live source earlier - badlands' packed
// color (7254527) really does convert to #6eb1ff, checked by actually running this conversion
// against live data before trusting it, not just trusting the arithmetic.
test('parseBiome converts a packed decimal color to a hex string', () => {
    const biome = parseBiome({
        id: 0,
        name: 'badlands',
        displayName: 'Badlands',
        category: 'mesa',
        dimension: 'overworld',
        temperature: 2.0,
        has_precipitation: false,
        color: 7254527,
    });

    assert.deepEqual(biome, {
        id: 'minecraft:badlands',
        displayName: 'Badlands',
        category: 'mesa',
        dimension: 'overworld',
        temperature: 2.0,
        hasPrecipitation: false,
        color: '#6eb1ff',
    });
});

test('parseBiome pads a short hex value to 6 digits', () => {
    const biome = parseBiome({
        id: 1, name: 'test_biome', displayName: 'Test Biome', category: 'none',
        dimension: 'overworld', temperature: 0, has_precipitation: false, color: 255,
    });
    assert.equal(biome.color, '#0000ff');
});
