import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveStructureSymbol, resolveStructureFixedSymbol } from './resolveStructureSymbol';
import { Structure } from '../models/structure.model';
import { ItemSymbol } from '../models/item-symbol.model';

function structure(id: string): Structure {
    return { id, type: 'minecraft:test', step: 'surface_structures', biomes: [] };
}

test('resolveStructureFixedSymbol covers every one of the 34 real structures', () => {
    const realIds = [
        'minecraft:ancient_city', 'minecraft:bastion_remnant', 'minecraft:buried_treasure',
        'minecraft:desert_pyramid', 'minecraft:end_city', 'minecraft:fortress', 'minecraft:igloo',
        'minecraft:jungle_pyramid', 'minecraft:mansion', 'minecraft:mineshaft',
        'minecraft:mineshaft_mesa', 'minecraft:monument', 'minecraft:nether_fossil',
        'minecraft:ocean_ruin_cold', 'minecraft:ocean_ruin_warm', 'minecraft:pillager_outpost',
        'minecraft:ruined_portal', 'minecraft:ruined_portal_desert', 'minecraft:ruined_portal_jungle',
        'minecraft:ruined_portal_mountain', 'minecraft:ruined_portal_nether',
        'minecraft:ruined_portal_ocean', 'minecraft:ruined_portal_swamp', 'minecraft:shipwreck',
        'minecraft:shipwreck_beached', 'minecraft:stronghold', 'minecraft:swamp_hut',
        'minecraft:trail_ruins', 'minecraft:trial_chambers', 'minecraft:village_desert',
        'minecraft:village_plains', 'minecraft:village_savanna', 'minecraft:village_snowy',
        'minecraft:village_taiga',
    ];

    for (const id of realIds) {
        const result = resolveStructureFixedSymbol(structure(id));
        assert.notEqual(result, undefined, `expected a fixed identity for ${id}`);
        assert.equal(typeof result?.symbol, 'string');
        assert.equal(result?.color.startsWith('#'), true);
    }
});

test('resolveStructureFixedSymbol gives every ruined_portal biome variant the same real obsidian identity', () => {
    const base = resolveStructureFixedSymbol(structure('minecraft:ruined_portal'));
    const desert = resolveStructureFixedSymbol(structure('minecraft:ruined_portal_desert'));
    const nether = resolveStructureFixedSymbol(structure('minecraft:ruined_portal_nether'));
    assert.deepEqual(base, desert);
    assert.deepEqual(base, nether);
    assert.equal(base?.color, '#2a1a3d');
});

test('resolveStructureFixedSymbol gives each real village biome variant a distinct color', () => {
    const plains = resolveStructureFixedSymbol(structure('minecraft:village_plains'));
    const snowy = resolveStructureFixedSymbol(structure('minecraft:village_snowy'));
    const taiga = resolveStructureFixedSymbol(structure('minecraft:village_taiga'));
    assert.notEqual(plains?.color, snowy?.color);
    assert.notEqual(plains?.color, taiga?.color);
});

test('resolveStructureFixedSymbol returns undefined for a real id it does not cover', () => {
    assert.equal(resolveStructureFixedSymbol(structure('minecraft:not_a_real_structure')), undefined);
});

test('resolveStructureSymbol falls back to a deterministic hash for an unrecognised structure id', () => {
    const usedSoFar = new Map<string, ItemSymbol>();
    const result = resolveStructureSymbol(structure('minecraft:some_future_structure'), usedSoFar);
    assert.equal(typeof result.symbol, 'string');
    assert.equal(result.color.startsWith('#'), true);
});
