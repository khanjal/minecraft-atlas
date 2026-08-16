import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseItem } from './items';

// Real minecraft-data 26.1 fixtures, verified against the live source earlier.
test('parseItem handles a plain item with no optional fields', () => {
    const item = parseItem({ id: 1, name: 'stone', displayName: 'Stone', stackSize: 64 });
    assert.deepEqual(item, {
        id: 'minecraft:stone',
        displayName: 'Stone',
        stackSize: 64,
        maxDurability: undefined,
        enchantCategories: undefined,
        repairWith: undefined,
    });
});

test('parseItem namespaces repairWith ids', () => {
    const item = parseItem({
        id: 863,
        name: 'elytra',
        displayName: 'Elytra',
        stackSize: 1,
        enchantCategories: ['equippable', 'durability', 'vanishing'],
        repairWith: ['phantom_membrane'],
        maxDurability: 432,
    });
    assert.equal(item.id, 'minecraft:elytra');
    assert.equal(item.maxDurability, 432);
    assert.deepEqual(item.repairWith, ['minecraft:phantom_membrane']);
});
