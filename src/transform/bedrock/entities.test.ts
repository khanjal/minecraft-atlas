import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBedrockEntity } from './entities';

// Every fixture's field shape below (description keys, minecraft:collision_box, minecraft:type_family)
// was verified against the real Mojang/bedrock-samples files at v1.26.40.05 - trimmed to the
// fields this parser actually reads, not the full ~150-2,000 line behavior definitions.

test('parses a full entity: id, category, family, and collision box', () => {
    // Real shape from cow.json.
    const entity = parseBedrockEntity({
        'minecraft:entity': {
            description: { identifier: 'minecraft:cow', spawn_category: 'creature' },
            components: {
                'minecraft:collision_box': { width: 0.9, height: 1.3 },
                'minecraft:type_family': { family: ['cow', 'mob'] },
            },
        },
    });

    assert.equal(entity?.id, 'minecraft:cow');
    assert.equal(entity?.category, 'creature');
    assert.deepEqual(entity?.family, ['cow', 'mob']);
    assert.equal(entity?.width, 0.9);
    assert.equal(entity?.height, 1.3);
    assert.equal(entity?.displayName, undefined);
});

test('leaves category and family undefined when the entity has neither (real shape: arrow)', () => {
    const entity = parseBedrockEntity({
        'minecraft:entity': {
            description: { identifier: 'minecraft:arrow', is_spawnable: false },
            components: {
                'minecraft:collision_box': { width: 0.25, height: 0.25 },
            },
        },
    });

    assert.equal(entity?.id, 'minecraft:arrow');
    assert.equal(entity?.category, undefined);
    assert.equal(entity?.family, undefined);
    assert.equal(entity?.width, 0.25);
});

test('leaves width/height and family undefined when collision_box and type_family are both absent (real shape: area_effect_cloud)', () => {
    const entity = parseBedrockEntity({
        'minecraft:entity': {
            description: { identifier: 'minecraft:area_effect_cloud', spawn_category: 'misc' },
            components: {},
        },
    });

    assert.equal(entity?.id, 'minecraft:area_effect_cloud');
    assert.equal(entity?.category, 'misc');
    assert.equal(entity?.family, undefined);
    assert.equal(entity?.width, undefined);
    assert.equal(entity?.height, undefined);
});

test('returns null for a file with no minecraft:entity.description.identifier', () => {
    const entity = parseBedrockEntity({ 'minecraft:entity': { description: {} } });
    assert.equal(entity, null);
});

test('applies the minecraft: namespace to a bare identifier the same way recipes/items do', () => {
    const entity = parseBedrockEntity({
        'minecraft:entity': { description: { identifier: 'cow' }, components: {} },
    });
    assert.equal(entity?.id, 'minecraft:cow');
});
