import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as mcmeta from '../../sources/java/mcmeta';
import { resolveTag, resolveBiomeTag } from './tags';

// Mocks fetchTag at the module boundary (t.mock.method, auto-restored after each test) rather
// than hitting the real network - fast, offline, and lets each test control exactly what a tag
// "contains" instead of depending on whatever mcmeta happens to say today. resolveTag's own cache
// is a module-level Map keyed by "version:tagId", so each test below uses its own fake version
// string to avoid one test's mock leaking into another's cached result.

test('resolveTag resolves a flat tag to its item list', async (t) => {
    t.mock.method(mcmeta, 'fetchTag', async () => ({
        values: ['minecraft:oak_planks', 'minecraft:spruce_planks'],
    }));

    const items = await resolveTag('test-flat-tag', 'minecraft:planks');
    assert.deepEqual(items, ['minecraft:oak_planks', 'minecraft:spruce_planks']);
});

test('resolveTag recurses through a nested tag reference', async (t) => {
    t.mock.method(mcmeta, 'fetchTag', async (_version: string, tagId: string) => {
        if (tagId === 'minecraft:logs_that_burn') {
            return { values: ['#minecraft:oak_logs', 'minecraft:cherry_log'] };
        }
        if (tagId === 'minecraft:oak_logs') {
            return { values: ['minecraft:oak_log', 'minecraft:oak_wood'] };
        }
        throw new Error(`unexpected tag lookup: ${tagId}`);
    });

    const items = await resolveTag('test-nested-tag', 'minecraft:logs_that_burn');
    assert.deepEqual(items, ['minecraft:oak_log', 'minecraft:oak_wood', 'minecraft:cherry_log']);
});

test('resolveTag namespaces a shorthand nested reference correctly', async (t) => {
    // Regression test for a real bug found and fixed earlier: namespaced() only recognizes
    // "already namespaced" by the presence of a colon, so a bare "#planks" value inside a tag
    // file (no explicit namespace on the reference itself) needs the "#" stripped *before*
    // namespacing, not after - otherwise it becomes "minecraft:#planks" instead of the intended
    // "#minecraft:planks", and this mock throws on any lookup other than the two expected ones,
    // so the bug (a wrong lookup key) would fail the test loudly rather than silently.
    t.mock.method(mcmeta, 'fetchTag', async (_version: string, tagId: string) => {
        if (tagId === 'minecraft:some_tag') {
            return { values: ['#planks'] };
        }
        if (tagId === 'minecraft:planks') {
            return { values: ['minecraft:oak_planks'] };
        }
        throw new Error(`unexpected tag lookup: ${tagId}`);
    });

    const items = await resolveTag('test-shorthand', 'minecraft:some_tag');
    assert.deepEqual(items, ['minecraft:oak_planks']);
});

test('resolveTag caches: two calls for the same tag only fetch once', async (t) => {
    const fetchTagMock = t.mock.method(mcmeta, 'fetchTag', async () => ({ values: ['minecraft:stick'] }));

    await resolveTag('test-cache', 'minecraft:sticks');
    await resolveTag('test-cache', 'minecraft:sticks');

    assert.equal(fetchTagMock.mock.callCount(), 1);
});

test('resolveBiomeTag resolves a real structure biomes tag, mocking fetchBiomeTag not fetchTag', async (t) => {
    // Real shape from data/minecraft/tags/worldgen/biome/has_structure/village_plains.json -
    // mocked at its own function boundary to confirm resolveBiomeTag reads from fetchBiomeTag,
    // not accidentally sharing resolveTag's item-tag fetch.
    t.mock.method(mcmeta, 'fetchBiomeTag', async () => ({
        values: ['minecraft:plains', 'minecraft:meadow'],
    }));

    const biomes = await resolveBiomeTag('test-biome-tag', 'minecraft:has_structure/village_plains');
    assert.deepEqual(biomes, ['minecraft:plains', 'minecraft:meadow']);
});

test('resolveBiomeTag and resolveTag use independent caches for the same literal tag id', async (t) => {
    const fetchTagMock = t.mock.method(mcmeta, 'fetchTag', async () => ({ values: ['minecraft:item_result'] }));
    const fetchBiomeTagMock = t.mock.method(mcmeta, 'fetchBiomeTag', async () => ({ values: ['minecraft:biome_result'] }));

    const items = await resolveTag('test-shared-id', 'minecraft:shared_name');
    const biomes = await resolveBiomeTag('test-shared-id', 'minecraft:shared_name');

    assert.deepEqual(items, ['minecraft:item_result']);
    assert.deepEqual(biomes, ['minecraft:biome_result']);
    assert.equal(fetchTagMock.mock.callCount(), 1);
    assert.equal(fetchBiomeTagMock.mock.callCount(), 1);
});
