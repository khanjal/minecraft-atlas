import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as mcmeta from '../../sources/java/mcmeta';
import { parseRecipe } from './recipes';

// Every fixture below is real mcmeta 26.1-data JSON, fetched and verified against the live source
// (this session, and earlier), not fabricated. Tag ingredients are mocked via fetchTag rather than
// hitting the network - see tags.test.ts for why, and for the shorthand/recursion/caching behavior
// those mocks rely on, tested separately there rather than re-tested here.

function mockPlanksTag(t: any) {
    t.mock.method(mcmeta, 'fetchTag', async () => ({
        values: ['minecraft:oak_planks', 'minecraft:spruce_planks', 'minecraft:birch_planks'],
    }));
}

test('crafting_shaped with a plain item ingredient (acacia_boat)', async () => {
    const recipe = await parseRecipe('test-26.1', 'acacia_boat', {
        type: 'minecraft:crafting_shaped',
        category: 'misc',
        group: 'boat',
        key: { '#': { item: 'minecraft:acacia_planks' } },
        pattern: ['# #', '###'],
        result: { count: 1, id: 'minecraft:acacia_boat' },
    });

    assert.equal(recipe?.id, 'minecraft:acacia_boat');
    assert.equal(recipe?.type, 'crafting_shaped');
    assert.equal(recipe?.group, 'boat');
    assert.deepEqual(recipe?.result, { id: 'minecraft:acacia_boat', count: 1 });
    assert.equal(recipe?.ingredients.length, 1);
    assert.deepEqual(recipe?.ingredients[0], {
        type: 'item', id: 'minecraft:acacia_planks', items: ['minecraft:acacia_planks'], quantity: 5, symbol: '#',
    });
});

test('crafting_shaped with a tag ingredient, resolved via mcmeta (stick)', async (t) => {
    mockPlanksTag(t);

    const recipe = await parseRecipe('test-26.1', 'stick', {
        type: 'minecraft:crafting_shaped',
        category: 'misc',
        group: 'sticks',
        key: { '#': '#minecraft:planks' },
        pattern: ['#', '#'],
        result: { count: 4, id: 'minecraft:stick' },
    });

    assert.deepEqual(recipe?.result, { id: 'minecraft:stick', count: 4 });
    assert.deepEqual(recipe?.ingredients[0], {
        type: 'tag', id: 'minecraft:planks', quantity: 2, symbol: '#',
        items: ['minecraft:oak_planks', 'minecraft:spruce_planks', 'minecraft:birch_planks'],
    });
});

test('crafting_shapeless with result effects (suspicious_stew_from_poppy)', async () => {
    const recipe = await parseRecipe('test-26.1', 'suspicious_stew_from_poppy', {
        type: 'minecraft:crafting_shapeless',
        category: 'misc',
        group: 'suspicious_stew',
        ingredients: ['minecraft:bowl', 'minecraft:brown_mushroom', 'minecraft:red_mushroom', 'minecraft:poppy'],
        result: {
            id: 'minecraft:suspicious_stew',
            components: { 'minecraft:suspicious_stew_effects': [{ duration: 100, id: 'minecraft:night_vision' }] },
        },
    });

    assert.equal(recipe?.type, 'crafting_shapeless');
    assert.equal(recipe?.ingredients.length, 4);
    assert.deepEqual(recipe?.result?.effects, [{ id: 'minecraft:night_vision', durationTicks: 100 }]);
});

test('smelting with a bare-string ingredient (baked_potato)', async () => {
    const recipe = await parseRecipe('test-26.1', 'baked_potato', {
        type: 'minecraft:smelting',
        category: 'food',
        cookingtime: 200,
        experience: 0.35,
        ingredient: 'minecraft:potato',
        result: { id: 'minecraft:baked_potato' },
    });

    assert.equal(recipe?.type, 'smelting');
    assert.deepEqual(recipe?.result, { id: 'minecraft:baked_potato', count: 1 });
    assert.deepEqual(recipe?.ingredients, [{ type: 'item', id: 'minecraft:potato', items: ['minecraft:potato'], quantity: 1 }]);
});

test('stonecutting (andesite_slab_from_andesite_stonecutting)', async () => {
    const recipe = await parseRecipe('test-26.1', 'andesite_slab_from_andesite_stonecutting', {
        type: 'minecraft:stonecutting',
        ingredient: 'minecraft:andesite',
        result: { count: 2, id: 'minecraft:andesite_slab' },
    });

    assert.equal(recipe?.type, 'stonecutting');
    assert.deepEqual(recipe?.result, { id: 'minecraft:andesite_slab', count: 2 });
});

test('smithing_transform with a tag addition, into named slots (netherite_axe_smithing)', async (t) => {
    t.mock.method(mcmeta, 'fetchTag', async () => ({ values: ['minecraft:netherite_ingot'] }));

    const recipe = await parseRecipe('test-26.1', 'netherite_axe_smithing', {
        type: 'minecraft:smithing_transform',
        addition: '#minecraft:netherite_tool_materials',
        base: 'minecraft:diamond_axe',
        result: { id: 'minecraft:netherite_axe' },
        template: 'minecraft:netherite_upgrade_smithing_template',
    });

    assert.deepEqual(recipe?.result, { id: 'minecraft:netherite_axe', count: 1 });
    assert.equal(recipe?.template?.id, 'minecraft:netherite_upgrade_smithing_template');
    assert.equal(recipe?.base?.id, 'minecraft:diamond_axe');
    assert.deepEqual(recipe?.addition, {
        type: 'tag', id: 'minecraft:netherite_tool_materials', items: ['minecraft:netherite_ingot'], quantity: 1,
    });
    // Named slots duplicate what's in ingredients (positionally: template, base, addition), not a
    // separate source of truth.
    assert.deepEqual(recipe?.ingredients, [recipe?.template, recipe?.base, recipe?.addition]);
});

test('smithing_trim has tag base/addition, a plain item template, and no result (bolt_armor_trim)', async (t) => {
    t.mock.method(mcmeta, 'fetchTag', async (_v: string, tagId: string) => {
        if (tagId === 'minecraft:trimmable_armor') return { values: ['minecraft:iron_chestplate'] };
        if (tagId === 'minecraft:trim_materials') return { values: ['minecraft:diamond'] };
        throw new Error(`unexpected tag: ${tagId}`);
    });

    const recipe = await parseRecipe('test-26.1', 'bolt_armor_trim_smithing_template_smithing_trim', {
        type: 'minecraft:smithing_trim',
        addition: '#minecraft:trim_materials',
        base: '#minecraft:trimmable_armor',
        pattern: 'minecraft:bolt', // the trim pattern id - unrelated to shaped-recipe Recipe.pattern, not read
        template: 'minecraft:bolt_armor_trim_smithing_template',
    });

    assert.equal(recipe?.result, null);
    assert.equal(recipe?.template?.type, 'item');
    assert.equal(recipe?.base?.type, 'tag');
    assert.equal(recipe?.addition?.type, 'tag');
    assert.equal(recipe?.pattern, undefined);
});

test('crafting_transmute reads input and material (black_bundle)', async (t) => {
    t.mock.method(mcmeta, 'fetchTag', async () => ({ values: ['minecraft:bundle', 'minecraft:black_bundle'] }));

    const recipe = await parseRecipe('test-26.1', 'black_bundle', {
        type: 'minecraft:crafting_transmute',
        category: 'equipment',
        group: 'bundle_dye',
        input: '#minecraft:bundles',
        material: 'minecraft:black_dye',
        result: { id: 'minecraft:black_bundle' },
    });

    assert.equal(recipe?.base?.type, 'tag');
    assert.equal(recipe?.addition?.id, 'minecraft:black_dye');
});

test('crafting_dye reads target and dye - the field the old pipeline never read (leather_boots_dyed)', async (t) => {
    t.mock.method(mcmeta, 'fetchTag', async () => ({ values: ['minecraft:red_dye'] }));

    const recipe = await parseRecipe('test-26.1', 'leather_boots_dyed', {
        type: 'minecraft:crafting_dye',
        category: 'misc',
        dye: '#minecraft:dyes',
        group: 'dyed_armor',
        result: { id: 'minecraft:leather_boots' },
        target: 'minecraft:leather_boots',
    });

    assert.equal(recipe?.base?.id, 'minecraft:leather_boots');
    assert.equal(recipe?.addition?.type, 'tag');
    assert.equal(recipe?.addition?.id, 'minecraft:dyes');
});

test('crafting_imbue reads material and source (tipped_arrow)', async () => {
    const recipe = await parseRecipe('test-26.1', 'tipped_arrow', {
        type: 'minecraft:crafting_imbue',
        category: 'misc',
        material: 'minecraft:arrow',
        result: { count: 8, id: 'minecraft:tipped_arrow' },
        source: 'minecraft:lingering_potion',
    });

    assert.deepEqual(recipe?.result, { id: 'minecraft:tipped_arrow', count: 8 });
    assert.equal(recipe?.base?.id, 'minecraft:arrow');
    assert.equal(recipe?.addition?.id, 'minecraft:lingering_potion');
});

test('crafting_decorated_pot resolves all four present sherd slots', async (t) => {
    t.mock.method(mcmeta, 'fetchTag', async () => ({ values: ['minecraft:brick', 'minecraft:angler_pottery_sherd'] }));

    const recipe = await parseRecipe('test-26.1', 'decorated_pot', {
        type: 'minecraft:crafting_decorated_pot',
        back: '#minecraft:decorated_pot_ingredients',
        front: '#minecraft:decorated_pot_ingredients',
        left: '#minecraft:decorated_pot_ingredients',
        right: '#minecraft:decorated_pot_ingredients',
        result: { id: 'minecraft:decorated_pot' },
    });

    assert.equal(recipe?.ingredients.length, 4);
});

test('crafting_special_bannerduplicate - previously never created at all by the old pipeline', async () => {
    const recipe = await parseRecipe('test-26.1', 'black_banner_duplicate', {
        type: 'minecraft:crafting_special_bannerduplicate',
        banner: 'minecraft:black_banner',
        result: { id: 'minecraft:black_banner' },
    });

    assert.equal(recipe?.type, 'crafting_special_bannerduplicate');
    assert.deepEqual(recipe?.result, { id: 'minecraft:black_banner', count: 1 });
});

test('crafting_special_repairitem has no declarative fields - null result, empty ingredients', async () => {
    const recipe = await parseRecipe('test-26.1', 'repair_item', { type: 'minecraft:crafting_special_repairitem' });

    assert.equal(recipe?.result, null);
    assert.deepEqual(recipe?.ingredients, []);
});

test('crafting_special_firework_star is deliberately deferred - returns null', async () => {
    const recipe = await parseRecipe('test-26.1', 'firework_star', {
        type: 'minecraft:crafting_special_firework_star',
        dye: '#minecraft:dyes',
        fuel: 'minecraft:gunpowder',
        result: { id: 'minecraft:firework_star' },
        shapes: { burst: 'minecraft:feather', creeper: '#minecraft:skulls', large_ball: 'minecraft:fire_charge', star: 'minecraft:gold_nugget' },
        trail: 'minecraft:diamond',
        twinkle: 'minecraft:glowstone_dust',
    });

    assert.equal(recipe, null);
});

test('an unrecognized type returns null', async () => {
    const recipe = await parseRecipe('test-26.1', 'mystery', { type: 'minecraft:something_new_mojang_added' });
    assert.equal(recipe, null);
});
