import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as mcmeta from '../../sources/java/mcmeta';
import { parseStructure } from './structures';

// Every fixture below is real mcmeta JSON (26.1-data), fetched and verified against the live
// source during development.

test('parses a jigsaw structure (village_plains), resolving its real biomes tag', async (t) => {
    t.mock.method(mcmeta, 'fetchBiomeTag', async (_version: string, tagId: string) => {
        assert.equal(tagId, 'minecraft:has_structure/village_plains');
        return { values: ['minecraft:plains', 'minecraft:meadow'] };
    });

    const structure = await parseStructure('test-village', 'village_plains', {
        type: 'minecraft:jigsaw',
        biomes: '#minecraft:has_structure/village_plains',
        max_distance_from_center: 80,
        size: 6,
        start_pool: 'minecraft:village/plains/town_centers',
        step: 'surface_structures',
    });

    assert.equal(structure.id, 'minecraft:village_plains');
    assert.equal(structure.type, 'minecraft:jigsaw');
    assert.equal(structure.step, 'surface_structures');
    assert.deepEqual(structure.biomes, ['minecraft:plains', 'minecraft:meadow']);
});

test('parses a non-jigsaw structure type (stronghold)', async (t) => {
    t.mock.method(mcmeta, 'fetchBiomeTag', async () => ({ values: ['minecraft:plains'] }));

    const structure = await parseStructure('test-stronghold', 'stronghold', {
        type: 'minecraft:stronghold',
        biomes: '#minecraft:has_structure/stronghold',
        step: 'surface_structures',
        terrain_adaptation: 'bury',
    });

    assert.equal(structure.type, 'minecraft:stronghold');
});

test('parses an underground-step structure with a real mineshaft_type field (mineshaft)', async (t) => {
    t.mock.method(mcmeta, 'fetchBiomeTag', async () => ({ values: ['minecraft:desert', 'minecraft:plains'] }));

    const structure = await parseStructure('test-mineshaft', 'mineshaft', {
        type: 'minecraft:mineshaft',
        biomes: '#minecraft:has_structure/mineshaft',
        mineshaft_type: 'normal',
        step: 'underground_structures',
    });

    assert.equal(structure.id, 'minecraft:mineshaft');
    assert.equal(structure.step, 'underground_structures');
});
