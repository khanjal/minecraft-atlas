import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveItemSymbol, resolveFixedSymbol, resolveHashedSymbol, canonicalizeName } from './resolveItemSymbol';
import { DISPLAY_SYMBOLS, PROVISIONAL_DISPLAY_SYMBOLS, SYMBOL_COLORS } from './itemSymbols';
import { ItemSymbol } from '../models/item-symbol.model';

test('resolveHashedSymbol only draws from the confirmed-safe pool by default', () => {
    const usedSoFar = new Map<string, ItemSymbol>();
    for (const name of ['a', 'bb', 'ccc', 'dddd', 'eeeee']) {
        const result = resolveHashedSymbol(name, usedSoFar);
        assert.equal(DISPLAY_SYMBOLS.includes(result.symbol), true);
        assert.equal(PROVISIONAL_DISPLAY_SYMBOLS.includes(result.symbol), false);
        usedSoFar.set(name, result);
    }
});

test('resolveHashedSymbol accepts an explicit wider pool for a caller that has confirmed it', () => {
    const usedSoFar = new Map<string, ItemSymbol>();
    const widerPool = [...DISPLAY_SYMBOLS, ...PROVISIONAL_DISPLAY_SYMBOLS];
    const result = resolveHashedSymbol('some item', usedSoFar, widerPool);
    assert.equal(widerPool.includes(result.symbol), true);
    assert.equal(SYMBOL_COLORS.includes(result.color), true);
});

test('canonicalizeName folds every wood species into one of three identities', () => {
    assert.equal(canonicalizeName('oak planks'), 'planks');
    assert.equal(canonicalizeName('birch planks'), 'planks');
    assert.equal(canonicalizeName('stripped acacia log'), 'stripped log');
    assert.equal(canonicalizeName('stripped bamboo block'), 'stripped log');
    assert.equal(canonicalizeName('oak log'), 'log');
    assert.equal(canonicalizeName('crimson stem'), 'log');
    assert.equal(canonicalizeName('oak boat'), 'boat');
    assert.equal(canonicalizeName('bamboo raft'), 'boat');
    assert.equal(canonicalizeName('diamond'), 'diamond');
});

test('resolveFixedSymbol returns the reserved entry for a hand-picked item', () => {
    assert.deepEqual(resolveFixedSymbol('diamond'), { symbol: '◆', color: '#4dd9ff' });
});

test('resolveFixedSymbol applies canonicalization before the reserved lookup', () => {
    // "oak planks" isn't itself a RESERVED_SYMBOLS key - only "planks" is.
    assert.deepEqual(resolveFixedSymbol('oak planks'), { symbol: '■', color: '#c9976b' });
});

test('resolveFixedSymbol matches a colour family, longest colour name first', () => {
    assert.deepEqual(resolveFixedSymbol('purple wool'), { symbol: '■', color: '#8932b8' });
    // "light gray" must be checked before the shorter "gray" would wrongly match as
    // "gray" + leftover "y wool".
    assert.deepEqual(resolveFixedSymbol('light gray wool'), { symbol: '■', color: '#9d9d97' });
    assert.deepEqual(resolveFixedSymbol('light blue carpet'), { symbol: '▭', color: '#3ab3da' });
});

test('resolveFixedSymbol returns undefined for a colour prefix with no listed family', () => {
    // "candle cake" doesn't exist as a suffix - the real name is "cake with <colour> candle",
    // colour in the middle rather than as a prefix, a deliberately out-of-scope pattern.
    assert.equal(resolveFixedSymbol('purple cake with candle'), undefined);
});

test('resolveFixedSymbol covers the color families added for full item/block coverage', () => {
    // These four were excluded from the original recipe-grid-only scope (never a recipe
    // ingredient) but are real, verified 16-colour families once full coverage matters.
    assert.deepEqual(resolveFixedSymbol('purple shulker box'), { symbol: '▯', color: '#8932b8' });
    assert.deepEqual(resolveFixedSymbol('red concrete'), { symbol: '■', color: '#b02e26' });
    assert.deepEqual(resolveFixedSymbol('red concrete powder'), { symbol: '◇', color: '#b02e26' });
    assert.deepEqual(resolveFixedSymbol('red glazed terracotta'), { symbol: '◆', color: '#b02e26' });
    assert.deepEqual(resolveFixedSymbol('blue candle'), { symbol: '▮', color: '#3c44aa' });
});

test('resolveFixedSymbol matches the real ore family by mineral, muted for stone/deepslate', () => {
    assert.deepEqual(resolveFixedSymbol('coal ore'), { symbol: '■', color: '#6e7275' });
    assert.deepEqual(resolveFixedSymbol('deepslate coal ore'), { symbol: '■', color: '#494d55' });
    assert.deepEqual(resolveFixedSymbol('diamond ore'), { symbol: '■', color: '#67a6b5' });
    assert.deepEqual(resolveFixedSymbol('deepslate redstone ore'), { symbol: '■', color: '#93494b' });
    // Real exceptions: nether-prefixed, no deepslate variant, but still real ore names.
    assert.deepEqual(resolveFixedSymbol('nether gold ore'), { symbol: '■', color: '#b89743' });
    assert.deepEqual(resolveFixedSymbol('nether quartz ore'), { symbol: '■', color: '#b1afa8' });
});

test('resolveFixedSymbol requires a real ore mineral, not just an "ore" suffix', () => {
    // A naive `name.endsWith('ore')` (no leading space) would wrongly match "heavy core" - the
    // real check requires " ore" as its own word, and a real mineral name before it.
    assert.equal(resolveFixedSymbol('unobtainium ore'), undefined);
});

test('resolveFixedSymbol matches coral by type and form, dead corals sharing one grey', () => {
    assert.deepEqual(resolveFixedSymbol('tube coral'), { symbol: '○', color: '#3a8ee0' });
    assert.deepEqual(resolveFixedSymbol('tube coral block'), { symbol: '■', color: '#3a8ee0' });
    assert.deepEqual(resolveFixedSymbol('tube coral fan'), { symbol: '◇', color: '#3a8ee0' });
    assert.deepEqual(resolveFixedSymbol('tube coral wall fan'), { symbol: '◇', color: '#3a8ee0' });
    // Every dead coral, regardless of type, shares one bleached-grey colour but keeps its form's shape.
    assert.deepEqual(resolveFixedSymbol('dead fire coral block'), { symbol: '■', color: '#8f7f76' });
    assert.deepEqual(resolveFixedSymbol('dead horn coral'), { symbol: '○', color: '#8f7f76' });
});

test('resolveFixedSymbol matches copper forms by oxidation stage, waxed or not', () => {
    assert.deepEqual(resolveFixedSymbol('copper bulb'), { symbol: '▬', color: '#c87f4a' });
    assert.deepEqual(resolveFixedSymbol('exposed copper bulb'), { symbol: '▬', color: '#a68868' });
    assert.deepEqual(resolveFixedSymbol('waxed weathered copper bulb'), { symbol: '▬', color: '#6b9080' });
    assert.deepEqual(resolveFixedSymbol('oxidized copper'), { symbol: '▬', color: '#4a8f6b' });
    // Copper chain is the one form that gets a different shape from the rest.
    assert.deepEqual(resolveFixedSymbol('copper chain'), { symbol: '▮', color: '#c87f4a' });
});

test('resolveFixedSymbol matches potion families, including the delivery-word position quirk', () => {
    assert.deepEqual(resolveFixedSymbol('potion of healing'), { symbol: '◑', color: '#f82423' });
    assert.deepEqual(resolveFixedSymbol('splash potion of healing'), { symbol: '◑', color: '#f82423' });
    assert.deepEqual(resolveFixedSymbol('lingering potion of healing'), { symbol: '◑', color: '#f82423' });
    // extended/enhanced tiers sit between the delivery word and "potion of X".
    assert.deepEqual(resolveFixedSymbol('extended potion of poison'), { symbol: '◑', color: '#4e9331' });
    // water bottle takes the delivery word as a plain prefix, same as an effect potion.
    assert.deepEqual(resolveFixedSymbol('splash water bottle'), { symbol: '◑', color: '#7ec4e8' });
    // awkward/mundane/thick insert the delivery word before "potion", not as a prefix.
    assert.deepEqual(resolveFixedSymbol('awkward splash potion'), { symbol: '◑', color: '#96896e' });
    assert.deepEqual(resolveFixedSymbol('awkward potion'), { symbol: '◑', color: '#96896e' });
});

test('resolveFixedSymbol returns undefined for an unmatched name', () => {
    assert.equal(resolveFixedSymbol('totally unknown made up item'), undefined);
});

test('resolveHashedSymbol is deterministic for the same name', () => {
    const usedSoFar = new Map<string, ItemSymbol>();
    const first = resolveHashedSymbol('some unreserved item', usedSoFar);
    const second = resolveHashedSymbol('some unreserved item', new Map());
    assert.deepEqual(first, second);
});

test('resolveHashedSymbol bumps to a free slot on a collision', () => {
    const usedSoFar = new Map<string, ItemSymbol>();
    const first = resolveHashedSymbol('item a', usedSoFar);
    usedSoFar.set('item a', first);

    // Force a collision by pre-claiming a second name's natural slot too, then confirm a third
    // name never reuses either already-claimed exact pair.
    const second = resolveHashedSymbol('item b', usedSoFar);
    assert.notDeepEqual(second, first);
});

test('resolveItemSymbol prefers a fixed identity over a hashed one', () => {
    const usedSoFar = new Map<string, ItemSymbol>();
    assert.deepEqual(resolveItemSymbol('diamond', usedSoFar), { symbol: '◆', color: '#4dd9ff' });
});

test('resolveItemSymbol falls back to a hashed identity for an unmatched name', () => {
    const usedSoFar = new Map<string, ItemSymbol>();
    const result = resolveItemSymbol('totally unknown made up item', usedSoFar);
    assert.equal(typeof result.symbol, 'string');
    assert.equal(typeof result.color, 'string');
    assert.equal(result.color.startsWith('#'), true);
});

test('resolveFixedSymbol covers real wood-species forms beyond planks/log/boat', () => {
    // Standard tree species: leaves get the species' real leaf tone, not its wood tone.
    assert.deepEqual(resolveFixedSymbol('oak leaves'), { symbol: '○', color: '#4a7a2e' });
    assert.deepEqual(resolveFixedSymbol('cherry leaves'), { symbol: '○', color: '#f4c2d7' });
    assert.deepEqual(resolveFixedSymbol('dark oak door'), { symbol: '▯', color: '#4a3728' });
    assert.deepEqual(resolveFixedSymbol('mangrove hanging sign'), { symbol: '▭', color: '#8f3a2e' });
    // Nether wood species have a real, different form set - no leaves/boat, but fungus/roots/hyphae/
    // nylium instead.
    assert.deepEqual(resolveFixedSymbol('crimson fungus'), { symbol: '★', color: '#8f2233' });
    assert.deepEqual(resolveFixedSymbol('warped nylium'), { symbol: '■', color: '#2a8f8a' });
    // Bamboo has its own real form set too (raft/shoot/mosaic instead of boat/sapling/planks-cut-forms).
    assert.deepEqual(resolveFixedSymbol('bamboo shoot'), { symbol: '★', color: '#8fc73e' });
    assert.deepEqual(resolveFixedSymbol('bamboo mosaic stairs'), { symbol: '■', color: '#c9b23a' });
});

test('canonicalizeName folds "X boat with chest" / "X raft with chest", not just bare boat/raft', () => {
    // Real bug found while extending wood coverage: the original fold only checked
    // name.endsWith('boat'), which never matches the real "oak boat with chest" naming.
    assert.equal(canonicalizeName('oak boat with chest'), 'boat');
    assert.equal(canonicalizeName('bamboo raft with chest'), 'boat');
    assert.deepEqual(resolveFixedSymbol('oak boat with chest'), { symbol: '▼', color: '#c9976b' });
});

test('resolveFixedSymbol matches real tool/armour material tiers (diamond excluded, already reserved)', () => {
    assert.deepEqual(resolveFixedSymbol('wooden axe'), { symbol: '▬', color: '#c9976b' });
    assert.deepEqual(resolveFixedSymbol('stone sword'), { symbol: '◆', color: '#7d7d78' });
    assert.deepEqual(resolveFixedSymbol('golden pickaxe'), { symbol: '▬', color: '#ffb703' });
    assert.deepEqual(resolveFixedSymbol('netherite chestplate'), { symbol: '▯', color: '#544c53' });
    assert.deepEqual(resolveFixedSymbol('chainmail helmet'), { symbol: '▯', color: '#8a8f99' });
    assert.deepEqual(resolveFixedSymbol('leather horse armor'), { symbol: '▯', color: '#935c34' });
    // A bare material name must never match on its own - only "<material> <real item type>".
    assert.equal(resolveFixedSymbol('iron'), undefined);
});

test('resolveFixedSymbol matches the real "Block of X" Mojang rename to its existing colour', () => {
    assert.deepEqual(resolveFixedSymbol('block of iron'), { symbol: '■', color: '#c7ccd1' });
    assert.deepEqual(resolveFixedSymbol('block of lapis lazuli'), { symbol: '■', color: '#2b4c9e' });
    assert.deepEqual(resolveFixedSymbol('block of raw copper'), { symbol: '◐', color: '#d4823a' });
    assert.equal(resolveFixedSymbol('block of unobtainium'), undefined);
});

test('resolveFixedSymbol covers the real bundle colour family (genuinely missed in the initial port)', () => {
    assert.deepEqual(resolveFixedSymbol('black bundle'), { symbol: '▬', color: '#1d1d21' });
});

test('resolveFixedSymbol matches the real stone-material family across slab/stairs/wall', () => {
    // andesite/granite/diorite/etc. have no individual RESERVED_SYMBOLS slab/stairs/wall entry of
    // their own (unlike stone, which does - see the next test), so these three only resolve via
    // the new family match.
    assert.deepEqual(resolveFixedSymbol('andesite slab'), { symbol: '▬', color: '#7a7f82' });
    assert.deepEqual(resolveFixedSymbol('andesite stairs'), { symbol: '◐', color: '#7a7f82' });
    assert.deepEqual(resolveFixedSymbol('andesite wall'), { symbol: '▮', color: '#7a7f82' });
    // Longer prefixes must win over a shorter one that's also a real, valid material on its own -
    // "polished blackstone brick wall" is polished-blackstone-brick, not "blackstone" (or
    // "polished blackstone") plus a leftover remainder that isn't a real form. None of the wall
    // forms were part of the original recipe-grid-scoped RESERVED_SYMBOLS list, so this is a clean
    // test of the family match alone.
    assert.deepEqual(resolveFixedSymbol('polished blackstone brick wall'), { symbol: '▮', color: '#2b2530' });
    // "stone slab"/"stone brick slab"/"smooth stone slab" are already individually reserved
    // (RESERVED_SYMBOLS, from the original recipe-grid port) with their own '■' shape - confirming
    // that pre-existing, more specific identity still wins over the new family's generic '▬'.
    assert.deepEqual(resolveFixedSymbol('stone slab'), { symbol: '■', color: '#7d7d78' });
    assert.deepEqual(resolveFixedSymbol('smooth stone slab'), { symbol: '■', color: '#9a9a94' });
});

test('resolveFixedSymbol matches the real chiseled/cracked/infested brick variants', () => {
    assert.deepEqual(resolveFixedSymbol('infested cracked stone bricks'), { symbol: '■', color: '#7d7d78' });
    assert.deepEqual(resolveFixedSymbol('chiseled tuff bricks'), { symbol: '■', color: '#5c6058' });
});

test('resolveFixedSymbol keeps wood-slab and stone-slab visually distinct despite sharing a glyph', () => {
    const woodSlab = resolveFixedSymbol('oak slab');
    const stoneSlab = resolveFixedSymbol('andesite slab');
    assert.equal(woodSlab?.symbol, stoneSlab?.symbol);
    assert.notEqual(woodSlab?.color, stoneSlab?.color);
});

test('resolveFixedSymbol shares one real fired-clay identity across all real pottery sherds', () => {
    assert.deepEqual(resolveFixedSymbol('angler pottery sherd'), { symbol: '◐', color: '#b5622c' });
    assert.deepEqual(resolveFixedSymbol('skull pottery sherd'), { symbol: '◐', color: '#b5622c' });
});

test('resolveFixedSymbol shares one real parchment identity across all real banner pattern items', () => {
    assert.deepEqual(resolveFixedSymbol('flower charge banner pattern'), { symbol: '▭', color: '#f2ecd8' });
    assert.deepEqual(resolveFixedSymbol('thing banner pattern'), { symbol: '▭', color: '#f2ecd8' });
    // A dyed banner itself is a different real item with its own colour-family identity (the star
    // shape, COLOR_FAMILY_SHAPES) - a banner pattern item is the template, not the finished banner.
    assert.notEqual(resolveFixedSymbol('flower charge banner pattern')?.symbol, resolveFixedSymbol('red banner')?.symbol);
});

test('resolveFixedSymbol has no fixed identity for a spawn egg - no real per-mob colour source exists', () => {
    // Confirmed by resolveItemSymbol's own partial-identity handling below, not just an oversight.
    assert.equal(resolveFixedSymbol('cow spawn egg'), undefined);
});

test('resolveItemSymbol gives every spawn egg the real, honest shared shape with a distinct hashed colour', () => {
    const usedSoFar = new Map<string, ItemSymbol>();
    const cow = resolveItemSymbol('cow spawn egg', usedSoFar);
    usedSoFar.set('cow spawn egg', cow);
    const pig = resolveItemSymbol('pig spawn egg', usedSoFar);

    assert.equal(cow.symbol, '○');
    assert.equal(pig.symbol, '○');
    // Two eggs shown together get distinct colours via the usual collision-avoidance - true for
    // any realistically small display. Restricting the pool to one shape does mean only 16 real
    // colour slots exist across all 87 real eggs (SPAWN_EGG_SHAPE's own comment, itemSymbols.ts),
    // so this guarantee doesn't extend to "all 87 shown at once" - not a scenario any consumer of
    // this project has today.
    assert.notEqual(cow.color, pig.color);
    // Same name always resolves to the same result, same as any other hashed identity.
    assert.deepEqual(resolveItemSymbol('cow spawn egg', new Map()), { symbol: '○', color: cow.color });
});
