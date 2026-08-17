import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEntityBreeding, parseEntityGrowth, parseEntityTaming } from './entityBehavior';

// Every fixture below is a real, trimmed shape verified against the live source
// (Mojang/bedrock-samples v1.26.40.05) during development, not fabricated.

test('parseEntityBreeding reads a component nested inside component_groups (real cow.json shape)', () => {
    const breeding = parseEntityBreeding('cow', {
        'minecraft:entity': {
            description: { identifier: 'minecraft:cow' },
            component_groups: {
                'minecraft:cow_adult': {
                    'minecraft:breedable': {
                        breed_items: ['wheat'],
                        breeds_with: { 'minecraft:cow': {} },
                    },
                },
            },
        },
    });

    assert.equal(breeding?.entityId, 'minecraft:cow');
    assert.equal(breeding?.requireTame, undefined);
    assert.deepEqual(breeding?.breedsWith, ['minecraft:cow']);
    assert.deepEqual(breeding?.breedItems, ['wheat']);
});

test('parseEntityBreeding reads requireTame and a real multi-partner breeds_with (horse+donkey mule mechanic)', () => {
    const breeding = parseEntityBreeding('horse', {
        'minecraft:entity': {
            description: { identifier: 'minecraft:horse' },
            component_groups: {
                'minecraft:horse_tamed': {
                    'minecraft:breedable': {
                        require_tame: true,
                        breeds_with: { 'minecraft:horse': {}, 'minecraft:donkey': {} },
                        breed_items: ['golden_carrot', 'golden_apple', 'appleEnchanted'],
                    },
                },
            },
        },
    });

    assert.equal(breeding?.requireTame, true);
    assert.deepEqual(breeding?.breedsWith, ['minecraft:horse', 'minecraft:donkey']);
    // Bedrock's own raw item-id shorthand kept verbatim - not mapped to a real item registry id.
    assert.deepEqual(breeding?.breedItems, ['golden_carrot', 'golden_apple', 'appleEnchanted']);
});

test('parseEntityBreeding returns undefined for an entity with no breedable component', () => {
    const breeding = parseEntityBreeding('item_display', {
        'minecraft:entity': { description: { identifier: 'minecraft:item_display' }, components: {} },
    });
    assert.equal(breeding, undefined);
});

test('parseEntityGrowth handles feed_items as a bare string, not an array (real cow.json shape)', () => {
    const growth = parseEntityGrowth('cow', {
        'minecraft:entity': {
            description: { identifier: 'minecraft:cow' },
            component_groups: {
                'minecraft:cow_baby': {
                    'minecraft:ageable': { duration: 1200, feed_items: 'wheat' },
                },
            },
        },
    });

    assert.equal(growth?.durationTicks, 1200);
    assert.deepEqual(growth?.growUpItems, ['wheat']);
});

test('parseEntityTaming reads a top-level component with a bare string tame_items (real wolf.json shape)', () => {
    const taming = parseEntityTaming('wolf', {
        'minecraft:entity': {
            description: { identifier: 'minecraft:wolf' },
            components: { 'minecraft:tameable': { tame_items: 'bone' } },
        },
    });

    assert.deepEqual(taming?.tameItems, ['bone']);
});

test('parseEntityTaming extracts just the item id from a mixed string/object array (real nautilus.json shape)', () => {
    const taming = parseEntityTaming('nautilus', {
        'minecraft:entity': {
            description: { identifier: 'minecraft:nautilus' },
            components: {
                'minecraft:tameable': {
                    tame_items: [
                        { item: 'pufferfish_bucket', result_item: 'water_bucket:0' },
                        'pufferfish',
                    ],
                },
            },
        },
    });

    // Only the item id itself - the bucket's empty-container side effect isn't part of "what can
    // tame this", so it's dropped, deliberately.
    assert.deepEqual(taming?.tameItems, ['pufferfish_bucket', 'pufferfish']);
});

test('parseEntityTaming returns undefined for ride-based taming (horse/donkey/llama - no item involved)', () => {
    // Real: horses/donkeys/llamas have no minecraft:tameable component at all in Bedrock's data -
    // they're tamed by riding, not feeding, matching Java.
    const taming = parseEntityTaming('horse', {
        'minecraft:entity': { description: { identifier: 'minecraft:horse' }, components: {} },
    });
    assert.equal(taming, undefined);
});
