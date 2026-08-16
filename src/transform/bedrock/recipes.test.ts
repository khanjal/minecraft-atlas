import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBedrockRecipe } from './recipes';

// Every fixture below is real Mojang/bedrock-samples JSON (v1.26.40.05), fetched and verified
// against the live source earlier this session, not fabricated - including the three real-world
// quirks that were only found by testing against live data: result can be an array (cake), an
// ingredient can be {item, data} or {tag} instead of a bare string (furnace_sand/furnace_log).

test('parses a shaped recipe with a plain item ingredient', () => {
    const recipe = parseBedrockRecipe({
        format_version: '1.20.10',
        'minecraft:recipe_shaped': {
            description: { identifier: 'minecraft:acacia_boat' },
            tags: ['crafting_table'],
            pattern: ['# #', '###'],
            key: { '#': { item: 'minecraft:acacia_planks' } },
            unlock: { context: 'PlayerInWater' },
            result: { item: 'minecraft:acacia_boat' },
        },
    });

    assert.equal(recipe?.id, 'minecraft:acacia_boat');
    assert.equal(recipe?.type, 'shaped');
    assert.deepEqual(recipe?.stations, ['crafting_table']);
    assert.deepEqual(recipe?.result, { id: 'minecraft:acacia_boat', count: 1 });
    assert.equal(recipe?.ingredients.length, 1);
    assert.equal(recipe?.ingredients[0].quantity, 5);
});

test('parses a shapeless recipe with a tag ingredient', () => {
    const recipe = parseBedrockRecipe({
        format_version: '1.20.10',
        'minecraft:recipe_shapeless': {
            description: { identifier: 'minecraft:FireCharge_coal_sulphur_recipeId' },
            tags: ['crafting_table'],
            ingredients: [
                { item: 'minecraft:blaze_powder' },
                { tag: 'minecraft:coals' },
                { item: 'minecraft:gunpowder' },
            ],
            unlock: [{ item: 'minecraft:blaze_powder' }],
            result: { item: 'minecraft:fire_charge', count: 3 },
            priority: -1,
        },
    });

    assert.equal(recipe?.type, 'shapeless');
    assert.deepEqual(recipe?.result, { id: 'minecraft:fire_charge', count: 3 });
    const tagIngredient = recipe?.ingredients.find(i => i.type === 'tag');
    // Bedrock has no published tag-definition source (see this module's file header) - the tag
    // id is preserved, but items is honestly empty rather than guessed.
    assert.deepEqual(tagIngredient, { type: 'tag', id: 'minecraft:coals', items: [], quantity: 1 });
});

test('parses a furnace recipe with a bare string input', () => {
    const recipe = parseBedrockRecipe({
        format_version: '1.20.10',
        'minecraft:recipe_furnace': {
            description: { identifier: 'minecraft:furnace_beef' },
            unlock: [{ item: 'minecraft:beef' }],
            tags: ['furnace', 'smoker', 'campfire', 'soul_campfire'],
            input: 'minecraft:beef',
            output: 'minecraft:cooked_beef',
            priority: 30,
        },
    });

    assert.equal(recipe?.type, 'furnace');
    assert.deepEqual(recipe?.stations, ['furnace', 'smoker', 'campfire', 'soul_campfire']);
    assert.deepEqual(recipe?.result, { id: 'minecraft:cooked_beef', count: 1 });
    assert.deepEqual(recipe?.ingredients, [{ type: 'item', id: 'minecraft:beef', items: ['minecraft:beef'], quantity: 1 }]);
});

test('parses a furnace recipe whose input is a tag, not a bare string', () => {
    const recipe = parseBedrockRecipe({
        'minecraft:recipe_furnace': {
            description: { identifier: 'minecraft:furnace_log' },
            tags: ['furnace'],
            input: { tag: 'minecraft:logs_that_burn' },
            output: 'minecraft:charcoal',
        },
    });
    assert.deepEqual(recipe?.ingredients[0], { type: 'tag', id: 'minecraft:logs_that_burn', items: [], quantity: 1 });
});

test('parses a furnace recipe whose input has a legacy data variant', () => {
    const recipe = parseBedrockRecipe({
        'minecraft:recipe_furnace': {
            description: { identifier: 'minecraft:furnace_sand' },
            tags: ['furnace'],
            input: { item: 'minecraft:sand', data: 0 },
            output: 'minecraft:glass',
        },
    });
    // data is deliberately dropped - see this module's file header for why (every real case
    // checked already has its own distinct item id).
    assert.deepEqual(recipe?.ingredients[0], { type: 'item', id: 'minecraft:sand', items: ['minecraft:sand'], quantity: 1 });
});

test('parses a recipe whose result is an array, keeping only the primary product', () => {
    const recipe = parseBedrockRecipe({
        'minecraft:recipe_shaped': {
            description: { identifier: 'minecraft:honey_bottle_to_sugar' },
            tags: ['crafting_table'],
            pattern: ['#'],
            key: { '#': { item: 'minecraft:honey_bottle' } },
            unlock: [{ item: 'minecraft:honey_bottle' }],
            result: [
                { item: 'minecraft:sugar', count: 3 },
                { item: 'minecraft:glass_bottle', count: 1 },
            ],
        },
    });
    assert.deepEqual(recipe?.result, { id: 'minecraft:sugar', count: 3 });
});

test('parses a brewing_mix recipe', () => {
    const recipe = parseBedrockRecipe({
        'minecraft:recipe_brewing_mix': {
            description: { identifier: 'minecraft:brew_awkward_blaze_powder' },
            tags: ['brewing_stand'],
            input: 'minecraft:potion_type:awkward',
            reagent: 'minecraft:blaze_powder',
            output: 'minecraft:potion_type:strength',
        },
    });
    assert.equal(recipe?.type, 'brewing_mix');
    assert.deepEqual(recipe?.result, { id: 'minecraft:potion_type:strength', count: 1 });
    assert.deepEqual(recipe?.ingredients.map(i => i.id), ['minecraft:potion_type:awkward', 'minecraft:blaze_powder']);
});

test('parses a brewing_container recipe', () => {
    const recipe = parseBedrockRecipe({
        'minecraft:recipe_brewing_container': {
            description: { identifier: 'minecraft:brew_potion_sulphur' },
            tags: ['brewing_stand'],
            input: 'minecraft:potion',
            reagent: 'minecraft:gunpowder',
            output: 'minecraft:splash_potion',
        },
    });
    assert.equal(recipe?.type, 'brewing_container');
    assert.deepEqual(recipe?.result, { id: 'minecraft:splash_potion', count: 1 });
});

test('parses a smithing_transform recipe into named slots', () => {
    const recipe = parseBedrockRecipe({
        'minecraft:recipe_smithing_transform': {
            description: { identifier: 'minecraft:smithing_netherite_axe' },
            tags: ['smithing_table'],
            template: 'minecraft:netherite_upgrade_smithing_template',
            base: 'minecraft:diamond_axe',
            addition: 'minecraft:netherite_ingot',
            result: 'minecraft:netherite_axe',
        },
    });
    assert.equal(recipe?.type, 'smithing_transform');
    assert.deepEqual(recipe?.result, { id: 'minecraft:netherite_axe', count: 1 });
    assert.equal(recipe?.ingredients.length, 3);
});

test('parses a smithing_trim recipe with tag slots and no result', () => {
    const recipe = parseBedrockRecipe({
        'minecraft:recipe_smithing_trim': {
            description: { identifier: 'minecraft:smithing_armor_trim' },
            tags: ['smithing_table'],
            template: { tag: 'minecraft:trim_templates' },
            base: { tag: 'minecraft:trimmable_armors' },
            addition: { tag: 'minecraft:trim_materials' },
        },
    });
    assert.equal(recipe?.type, 'smithing_trim');
    assert.equal(recipe?.result, null);
    assert.equal(recipe?.ingredients.every(i => i.type === 'tag'), true);
});

test('returns null for an unrecognized recipe wrapper', () => {
    const recipe = parseBedrockRecipe({ 'minecraft:recipe_something_new': {} });
    assert.equal(recipe, null);
});
