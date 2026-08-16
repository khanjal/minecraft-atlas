import { test } from 'node:test';
import assert from 'node:assert/strict';
import { overlay } from './overlay';

interface FakeItem { id: string; displayName: string }
interface FakeCurated { name: string; synonyms?: string }

test('overlay joins by normalized name and passes curated fields through', () => {
    const base: FakeItem[] = [
        { id: 'minecraft:oak_planks', displayName: 'Oak Planks' },
        { id: 'minecraft:mystery_item', displayName: 'Mystery Item' },
    ];
    const curated: FakeCurated[] = [{ name: 'oak planks', synonyms: 'planks' }];

    const result = overlay(base, curated, item => item.displayName);

    assert.equal(result[0].curated?.synonyms, 'planks');
    assert.equal(result[1].curated, null);
});
