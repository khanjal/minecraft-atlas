import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEffect } from './effects';

// Real minecraft-data 26.1 entries, verified against the live source earlier - covers the
// PascalCase -> snake_case id conversion this module exists for, including the multi-word cases
// that are the whole reason a naive lowercase() wouldn't be enough.
test('parseEffect converts a single-word PascalCase name', () => {
    const effect = parseEffect({ id: 0, name: 'Speed', displayName: 'Speed', type: 'good' });
    assert.deepEqual(effect, { id: 'minecraft:speed', displayName: 'Speed', category: 'good' });
});

test('parseEffect converts multi-word PascalCase names correctly', () => {
    const cases: [string, string][] = [
        ['MiningFatigue', 'minecraft:mining_fatigue'],
        ['NightVision', 'minecraft:night_vision'],
        ['DolphinsGrace', 'minecraft:dolphins_grace'],
        ['HeroOfTheVillage', 'minecraft:hero_of_the_village'],
        ['BreathOfTheNautilus', 'minecraft:breath_of_the_nautilus'],
    ];

    for (const [name, expectedId] of cases) {
        const effect = parseEffect({ id: 0, name, displayName: name, type: 'good' });
        assert.equal(effect.id, expectedId, `${name} -> ${expectedId}`);
    }
});

test('parseEffect preserves the real displayName and bad category', () => {
    const effect = parseEffect({ id: 19, name: 'Wither', displayName: 'Wither', type: 'bad' });
    assert.equal(effect.category, 'bad');
    assert.equal(effect.displayName, 'Wither');
});
