import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as mcmeta from '../../sources/java/mcmeta';
import { resolveTag } from './tags';

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
