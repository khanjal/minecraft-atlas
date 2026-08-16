import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEnchantment } from './enchantments';

// Real minecraft-data 26.1 fixture, verified against the live source earlier.
test('parseEnchantment namespaces id and every excludes entry', () => {
    const enchantment = parseEnchantment({
        id: 0,
        name: 'bane_of_arthropods',
        displayName: 'Bane of Arthropods',
        maxLevel: 5,
        minCost: { a: 5, b: 8 },
        maxCost: { a: 5, b: 20 },
        treasureOnly: false,
        curse: false,
        exclude: ['breach', 'density', 'impaling', 'sharpness', 'smite'],
        category: 'weapon',
        weight: 5,
        tradeable: true,
        discoverable: true,
    });

    assert.equal(enchantment.id, 'minecraft:bane_of_arthropods');
    assert.equal(enchantment.maxLevel, 5);
    assert.equal(enchantment.weight, 5);
    assert.equal(enchantment.treasureOnly, false);
    assert.deepEqual(enchantment.excludes, [
        'minecraft:breach',
        'minecraft:density',
        'minecraft:impaling',
        'minecraft:sharpness',
        'minecraft:smite',
    ]);
    // minCost/maxCost are deliberately not carried through - see enchantment.model.ts.
    assert.equal((enchantment as any).minCost, undefined);
});
