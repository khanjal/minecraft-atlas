import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBlock } from './blocks';

// Real minecraft-data 26.1 fixture (stone's real drops: [35] and harvestTools keys), verified
// against the live source earlier - id 35 really is "cobblestone" there, confirming blocks and
// items share one id space, which is the whole reason blocks.ts needs an itemNamesById map at all.
const itemNamesById = new Map<number, string>([
    [35, 'cobblestone'],
    [914, 'wooden_pickaxe'],
    [919, 'copper_pickaxe'],
    [924, 'stone_pickaxe'],
    [929, 'golden_pickaxe'],
    [934, 'iron_pickaxe'],
    [939, 'diamond_pickaxe'],
    [944, 'netherite_pickaxe'],
]);

test('parseBlock resolves drops and harvestTools to real item ids', () => {
    const block = parseBlock({
        id: 1,
        name: 'stone',
        displayName: 'Stone',
        hardness: 1.5,
        resistance: 6.0,
        diggable: true,
        material: 'mineable/pickaxe',
        transparent: false,
        emitLight: 0,
        filterLight: 15,
        harvestTools: { '914': true, '919': true, '924': true, '929': true, '934': true, '939': true, '944': true },
        drops: [35],
        boundingBox: 'block',
    }, itemNamesById);

    assert.equal(block.id, 'minecraft:stone');
    assert.deepEqual(block.drops, ['minecraft:cobblestone']);
    assert.deepEqual(block.harvestTools, [
        'minecraft:wooden_pickaxe', 'minecraft:copper_pickaxe', 'minecraft:stone_pickaxe',
        'minecraft:golden_pickaxe', 'minecraft:iron_pickaxe', 'minecraft:diamond_pickaxe',
        'minecraft:netherite_pickaxe',
    ]);
});

test('parseBlock handles a block with no harvestTools (any tool, or none, works)', () => {
    const block = parseBlock({
        id: 0,
        name: 'air',
        displayName: 'Air',
        hardness: 0,
        resistance: 0,
        diggable: false,
        material: 'default',
        transparent: true,
        emitLight: 0,
        filterLight: 0,
        drops: [],
        boundingBox: 'empty',
    }, itemNamesById);

    assert.equal(block.harvestTools, undefined);
    assert.deepEqual(block.drops, []);
});

test('parseBlock falls back to the raw id when an item name is unknown', () => {
    const block = parseBlock({
        id: 2, name: 'mystery_block', displayName: 'Mystery Block',
        hardness: 1, resistance: 1, diggable: true, material: 'default',
        transparent: false, emitLight: 0, filterLight: 0,
        drops: [9999], boundingBox: 'block',
    }, itemNamesById);

    assert.deepEqual(block.drops, ['minecraft:9999']);
});
