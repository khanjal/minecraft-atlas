// All the hand-picked and derived visual-identity data resolveItemSymbol.ts matches item names
// against - kept separate from the matching/hashing logic itself so the two can grow independently:
// this file is edited every time a new item gets a reserved symbol or a family gains an entry,
// while the logic in resolveItemSymbol.ts almost never changes.
//
// Ported from Craft Helper's lambda/helpers/itemSymbols.ts (see
// https://github.com/khanjal/Craft-Helper/issues/3) - this data isn't Craft-Helper-specific in
// what it represents (a real symbol/colour identity per item/block), only in where it used to
// live. Every hex value, shape choice, and collision note below was verified against real 26.2
// recipe data during Craft Helper's own development; kept verbatim rather than re-derived, since
// re-deriving it would throw away that verification work for no benefit.

import { ItemSymbol } from '../models/item-symbol.model';

// Minecraft's own pattern keys are arbitrary and chosen per recipe - diamond is "#" in one recipe
// and "D" in the next - so an item's symbol can't be based on the key. Every non-reserved item gets
// a name-derived, deterministic symbol+colour instead (resolveHashedSymbol in
// resolveItemSymbol.ts), computed at runtime from the name, no stored per-item data to maintain or
// regenerate. Filled/outline pairs stay distinguishable if colour is lost (greyscale, colour
// blindness, low-quality panel).
//
// Unlike colour (plain hex, no render risk), a new glyph's real-device rendering can't be
// confirmed without a screenshot - the first 8 here are the ones confirmed against a real Echo
// Show during Craft Helper's own development. The next 6 (▬▭▮▯◈◐) are also already live in
// production, just via RESERVED_SYMBOLS rather than this hash pool - dozens of real recipes
// (ingots, rods, chains, nuggets, potions, ...) already render them today, so folding them into
// the general fallback pool too adds zero new rendering risk, only more variety. See
// PROVISIONAL_DISPLAY_SYMBOLS below for glyphs that are genuinely new and NOT yet confirmed -
// those are kept out of this pool on purpose.
//
// 14 shapes x 16 colours (SYMBOL_COLORS below) is 224 combos - comfortably more than any single
// Java recipe could ever need (see RESERVED_SYMBOLS below for why 4 is the real ceiling for a
// recipe-grid display), and enough headroom that a much larger display (an item list, not just one
// recipe) still gets real variety before resolveHashedSymbol's collision-bump ever has to work
// hard. Collisions within one display are still possible in principle (two different names hashing
// to the same slot), so resolveHashedSymbol deterministically bumps to the next free slot rather
// than leaving two items looking identical.
export const DISPLAY_SYMBOLS = ['●', '■', '▲', '◆', '★', '○', '◇', '▼', '▬', '▭', '▮', '▯', '◈', '◐'];

// Glyphs that look like they belong in the same family as DISPLAY_SYMBOLS (Geometric Shapes /
// Miscellaneous Symbols, filled/outline pairs) but have never actually been rendered and confirmed
// on a real Alexa device - kept deliberately separate from DISPLAY_SYMBOLS so nothing consuming
// the default hash pool picks one up silently. A consumer that's confirmed these render correctly
// can pass them explicitly to resolveHashedSymbol's pool parameter; until then this is a reference
// list, not something live.
export const PROVISIONAL_DISPLAY_SYMBOLS = ['◉', '◎', '⬟', '⬢'];

export const SYMBOL_COLORS = [
    '#7fd4ff', '#ffcf5c', '#9ee37d', '#ff8fa3', '#c9a7ff', '#ffb072', '#7fe3d4', '#e0e5ee',
    // Second half added for full-catalog coverage (originally only 8, sized for one recipe's ~4
    // ingredients) - eight more hues distinct from the originals and from each other, still plain
    // hex, so no rendering-risk trade-off the way new glyphs have.
    '#ff6b6b', '#4d96ff', '#b5e61d', '#e066ff', '#d2914d', '#2dd4bf', '#9ca3af', '#fff176',
];

// Hand-picked symbol/colour for the items where matching the real thing is worth doing by hand - an
// ingot is a rectangle, a nether star is a pale star, not whatever a hash happens to land on.
// Everything not listed here still gets a stable identity via resolveHashedSymbol; this list is for
// the items common enough, and simple enough to draw, that a deliberate match beats a computed one.
// A diamond is always this blue diamond in every recipe you browse, not just within one.
//
// Each entry's colour is its own literal, not drawn from SYMBOL_COLORS above - reserved lookups
// happen before a hash is ever computed, so there's no shared-capacity limit on how many items this
// list can hold and no risk of a reserved colour coinciding with a hash-assigned one. The real
// constraint is just picking colours distinct enough from each other and from SYMBOL_COLORS to
// glance-read.
//
// No Java recipe uses more than 4 distinct ingredients (verified against every 26.2 shaped recipe:
// 429 use 1, 237 use 2, 63 use 3, only 4 - cake/crafter/crossbow/piston - use all 4), so reserving
// more items here never risks starving anything - a hash-assigned ingredient's slot only has to
// avoid whatever's already used elsewhere in that same recipe (resolveHashedSymbol's collision
// bump), never a shared budget with this list. Matched by canonical name (canonicalizeName), which
// folds every wood's planks into one "planks" identity, since the shape stands for "a plank," not a
// specific wood - the legend still names the real wood.
export const RESERVED_SYMBOLS: Record<string, ItemSymbol> = {
    // "◆" is quite literally called a diamond shape - it belongs to the diamond item, not emerald.
    'diamond': { symbol: '◆', color: '#4dd9ff' },
    'redstone': { symbol: '▲', color: '#ff5c5c' },
    'planks': { symbol: '■', color: '#c9976b' },
    'emerald': { symbol: '●', color: '#3ecf6c' },
    'nether star': { symbol: '★', color: '#f5efe0' },
    'lapis lazuli': { symbol: '○', color: '#2b4c9e' },
    'leather': { symbol: '▼', color: '#935c34' },
    // Filled/outline horizontal rectangle - an ingot's actual shape - rather than the star/circle
    // used before. Kept as a pair for the same greyscale-safety reason as elsewhere in this map.
    'iron ingot': { symbol: '▬', color: '#c7ccd1' },
    'gold ingot': { symbol: '▭', color: '#ffb703' },
    // A third ingot reuses iron's rectangle rather than a new glyph - there's no clean third
    // rectangle variant in the block iron/gold's pair comes from, and colour alone (a muted
    // copper-brown against iron's pale silver) is already how every other shared-shape pair in this
    // map stays distinguishable.
    'copper ingot': { symbol: '▬', color: '#c87f4a' },
    'coal': { symbol: '◇', color: '#5b6472' },
    // Vertical rectangle - a stick's actual shape.
    'stick': { symbol: '▮', color: '#d4a373' },
    // Outline vertical rectangle - stick's filled/outline pair, and blaze rod is itself another
    // elongated rod, not just a stand-in shape.
    'blaze rod': { symbol: '▯', color: '#ff9b3f' },
    'quartz': { symbol: '◈', color: '#f0ece2' },
    'amethyst shard': { symbol: '◐', color: '#9d6fd9' },
    // These four all appear only once or twice as an ingredient in 26.2 (dirt: coarse dirt: sand:
    // sandstone) - far rarer than the rest of this list, reserved anyway because they're some of the
    // most instantly-recognisable blocks in the game, not because of how often they'd be seen.
    'dirt': { symbol: '■', color: '#6b4423' },
    'sand': { symbol: '●', color: '#ddc98f' },
    'obsidian': { symbol: '◆', color: '#2a1a3d' },
    'brick': { symbol: '▲', color: '#9c4a3c' },
    'honeycomb': { symbol: '○', color: '#d99a3d' },
    'prismarine shard': { symbol: '◇', color: '#5fd4c0' },
    // Plain terracotta (the base ingredient in every "<colour> terracotta" recipe - see
    // COLOR_FAMILY_SHAPES below) was landing on whatever resolveHashedSymbol computed for the
    // literal string "terracotta", every time - coincidentally always the same pale purple, since
    // the name never changes regardless of which colour is being made. Sharing the outline-circle
    // shape dye already uses for that family, with a colour close enough to grey to be hard to tell
    // apart, made every "<colour> terracotta" recipe read as "grey circle, purple circle" no matter
    // the colour. Reserving plain terracotta with its own family's filled-circle shape and a real
    // clay colour fixes both: shape now differs from dye's outline circle, and the colour is
    // unambiguous.
    'terracotta': { symbol: '●', color: '#b5622c' },
    // Both mushrooms share the filled circle - a mushroom cap's real shape - and only the colour
    // tells them apart, the same pairing pattern as the ingots above. Never co-occurs with
    // emerald/sand/terracotta's own use of this shape (checked every 26.2 shapeless recipe that
    // uses either mushroom: mushroom stew, rabbit stew, suspicious stew, fermented spider eye).
    'brown mushroom': { symbol: '●', color: '#835432' },
    'red mushroom': { symbol: '●', color: '#b02e26' },
    // A wide horizontal bar rather than a mushroom's circle - a bowl is broad and shallow, not
    // round like a cap. Reuses the ingots' bar shape; never appears alongside an ingot in any real
    // recipe, so the shared shape is never ambiguous in practice.
    'bowl': { symbol: '▬', color: '#b8916a' },
    // Glass and glass pane are the same material, and never appear as ingredients in the same
    // recipe as each other, so they share one identity rather than needing to be told apart. Real
    // conflicts checked against every 26.2 recipe: beacon (nether star, obsidian), the 16 harness
    // recipes (leather, coloured wool), the 16 stained glass/pane recipes (coloured dye), daylight
    // detector (quartz), tinted glass (amethyst shard) - none of those use this outline-diamond
    // shape, so it's free for both.
    'glass': { symbol: '◇', color: '#a8d8e8' },
    'glass pane': { symbol: '◇', color: '#a8d8e8' },
    // Plain gray, not the tan of planks or dirt's dark brown - cobblestone's real conflicts
    // (diamond, redstone, quartz, stick, iron ingot via armour trims/redstone components/lever/
    // piston) all use other shapes, leaving the filled square free.
    'cobblestone': { symbol: '■', color: '#8a8a8a' },
    // A chest's only real collision is the ingot bar shape (hopper pairs it with iron ingot, copper
    // chest with copper ingot), so it needs a shape other than that - reuses cobblestone's filled
    // square, since the two never appear together in any recipe.
    'chest': { symbol: '■', color: '#9c6b3f' },
    // Candle only ever appears paired with a dye (the 16 coloured-candle recipes), never with
    // another reserved item directly, so the one real constraint is avoiding dye's outline-circle
    // shape. Reuses stick's vertical bar - a candle is rod-shaped too - and never co-occurs with
    // stick itself.
    'candle': { symbol: '▮', color: '#f0dfa0' },
    // A carrot's own shape - thin and tall - rather than the round produce below. Only real
    // co-ingredients are bowl and both mushrooms (rabbit stew), none of which use this bar shape.
    'carrot': { symbol: '▮', color: '#e8791a' },
    // Never shares a recipe with anything else already on the filled square (planks, dirt,
    // cobblestone, chest), so wheat reuses it too - a golden-tan sheaf colour tells it apart from
    // all four whenever they're compared side by side, even though they never actually appear
    // together.
    'wheat': { symbol: '■', color: '#e0c15c' },
    // Nether wart's only real neighbours are itself (nether wart block) and nether brick (hashed,
    // never collides), so the triangle - already used by redstone and brick, neither of which ever
    // shares a recipe with this - is free for its own deep maroon.
    'nether wart': { symbol: '▲', color: '#8b2e2e' },
    // A distinct magenta-red keeps beetroot apart from every other filled-circle item (emerald,
    // sand, terracotta, both mushrooms) it could theoretically be compared against - none of them
    // ever appear in beetroot soup or the red dye recipe, its only two real contexts.
    'beetroot': { symbol: '●', color: '#a51931' },
    // A wedge, not a circle - melon slice reuses leather's downward triangle, since the two never
    // appear in the same recipe (melon block, melon seeds, glistering melon slice).
    'melon slice': { symbol: '▼', color: '#e0407a' },
    // A pale, granular look distinct from dye/lapis/honeycomb's other uses of the outline circle -
    // sugar's real co-ingredients (wheat, milk bucket, cocoa beans, spider eye, brown mushroom,
    // pumpkin) never touch that shape.
    'sugar': { symbol: '○', color: '#f5f0e0' },
    // Every concrete powder pairs gravel with sand and a dye, and coarse dirt pairs it with dirt -
    // none of those three use the triangle, which is otherwise only redstone/brick/nether wart's.
    'gravel': { symbol: '▲', color: '#8f8272' },
    // Requested as a white square instead of the parchment-tan outline circle it started as - a
    // sheet reads better as a square than a circle. Paper's one real reserved neighbour is leather
    // (book, on the downward triangle), and its other contexts (banners, maps, fireworks) never
    // include anything already on the filled square (planks/dirt/cobblestone/chest/wheat/any storage
    // block), so it's free.
    'paper': { symbol: '■', color: '#f2ecd8' },
    // Requested as a vertical rectangle instead of the ingot's horizontal bar - a hanging chain reads
    // as vertical, not like a bar of metal lying flat. Every hanging sign pairs this with a stripped
    // log/stem, never with anything else reserved, so it's unconstrained; joins copper chain (see
    // getCopperFamilyMatch in resolveItemSymbol.ts, which special-cases the same request for every
    // copper oxidation stage) as the only two chains in the game.
    'iron chain': { symbol: '▮', color: '#6b7280' },
    // Joins stick/candle/carrot on the vertical bar - bamboo never appears in a recipe alongside any
    // of the three (bamboo block is just bamboo x9; scaffolding pairs it with string, not with them).
    'bamboo': { symbol: '▮', color: '#5a9c3f' },
    // Same substance at two densities, so they share one identity the way glass/glass pane do -
    // packed ice is just ice x9, blue ice is just packed ice x9, neither ever meets another
    // reserved item.
    'ice': { symbol: '◇', color: '#c8ecf5' },
    'packed ice': { symbol: '◇', color: '#c8ecf5' },
    // String's real neighbours - stick (bow, fishing rod), leather (bundle), honeycomb (candle's own
    // recipe), iron ingot (crossbow) - cover four different shapes, but none of them use quartz's
    // diamond-outline, leaving it free.
    'string': { symbol: '◈', color: '#d8d4c0' },
    // Reported live: gold nugget was landing on an unrelated hashed colour (an outline diamond in
    // light green - nothing about gold). All three nuggets share amethyst shard's half-circle - a
    // small chunk, not an ingot's rectangle bar - in their own ingot's exact colour, since they're
    // literally the same metal. Iron chain and copper chain each pair a nugget directly with its own
    // ingot as a second ingredient, so the shape (not just the colour) has to differ from
    // iron/copper ingot's bar - checked every 26.2 recipe naming a nugget, and none of them include
    // amethyst shard, so the half-circle is free for all three.
    'gold nugget': { symbol: '◐', color: '#ffb703' },
    'iron nugget': { symbol: '◐', color: '#c7ccd1' },
    'copper nugget': { symbol: '◐', color: '#c87f4a' },
    // Same bug, same fix, found the same way: reported live as "the iron block looks like a green
    // circle" - iron block was hashing to an unrelated outline circle in teal, right next to iron
    // ingot's pale silver bar in the anvil recipe (its one real multi-ingredient context). A block is
    // a cube, so it gets the filled square rather than the nugget's half-circle or the ingot's bar,
    // in its own material's exact reserved colour. The other six compressed-storage blocks (gold,
    // diamond, emerald, coal, redstone, lapis) had the identical gap - none were reserved, so each
    // was one hash away from the same complaint - fixed proactively rather than one report at a time.
    // Every one of these seven is a single-ingredient self-conversion back to nine of its material
    // except anvil, so the square only actually gets compared against something else there; the rest
    // just stop rendering an arbitrary colour for a very recognisable block.
    'iron block': { symbol: '■', color: '#c7ccd1' },
    'gold block': { symbol: '■', color: '#ffb703' },
    'diamond block': { symbol: '■', color: '#4dd9ff' },
    'emerald block': { symbol: '■', color: '#3ecf6c' },
    'coal block': { symbol: '■', color: '#5b6472' },
    'redstone block': { symbol: '■', color: '#ff5c5c' },
    'lapis block': { symbol: '■', color: '#2b4c9e' },
    // The one other real case in this shape: netherite scrap sits next to gold ingot in netherite
    // ingot's recipe (4 scrap + 4 gold ingot), the same collision shape as iron block/anvil - checked
    // every 26.2 recipe naming any of these three, and that's the only place one meets another
    // reserved item. Unlike copper, netherite doesn't change colour between forms in the real game,
    // so all three share one dark colour and differ only by shape: scrap's shard, ingot's bar, block's
    // square - matching the shape language already used for every other material in this map.
    'netherite scrap': { symbol: '◇', color: '#544c53' },
    'netherite ingot': { symbol: '▬', color: '#544c53' },
    'netherite block': { symbol: '■', color: '#544c53' },
    // Reported live: slime ball was rendering as a green triangle (sticky piston, slime block), and a
    // completely different pink circle in magma cream - the hash bump depends on whatever else is in
    // that specific recipe, so an unreserved item's look isn't even guaranteed stable across recipes,
    // just within one. Never appears alongside anything else reserved (blaze powder and piston, its
    // only real neighbours, are both unreserved), so nothing constrains the choice - a filled circle,
    // matching the real ball shape, in an olive-lime green distinct from emerald's brighter jewel
    // green.
    'slime ball': { symbol: '●', color: '#8bc34a' },
    // Reported live: eggs (the "eggs" tag - cake's only real ingredient use, paired with milk bucket,
    // sugar, wheat) was landing on a hashed outline shape. Requested as a solid circle instead - a
    // pale eggshell tan, distinct from sugar's near-white outline circle and wheat's more golden
    // filled square, the two other pale tones it shares a recipe with.
    'eggs': { symbol: '●', color: '#e8d4a0' },
    // Requested as a two-tone square (white on top, grey on bottom, evoking milk poured into a
    // bucket) - this map only carries one colour per symbol, so a literal two-tone glyph isn't
    // possible here. Closest single-glyph approximation: an upper-half-filled square in milk-white,
    // reading as "the visible milk sitting above the container" against the dark cell background
    // standing in for the grey. Every other symbol in this file was chosen from a small proven set
    // (circles, squares, diamonds, bars) specifically because an untested glyph's real-device
    // rendering can't be confirmed without a screenshot - this upper-half-block character is outside
    // that set, so treat it as provisional until confirmed on a real Echo Show.
    'milk bucket': { symbol: '▀', color: '#f2f2ea' },
    // First pass through the master ingredient list (see getPotionFamilyMatch in
    // resolveItemSymbol.ts for the potions themselves) - these are the reagents that pair with a
    // potion bottle in nearly every brewing recipe, so each needs to be visually distinct from the
    // potion family's shape (the filled half-circle) as well as from each other where they co-occur
    // directly (fire charge pairs gunpowder with blaze powder and coal).
    'gunpowder': { symbol: '▲', color: '#2e2b28' },
    'dragons breath': { symbol: '◆', color: '#c9a8e0' },
    // The exact same substance as redstone (RESERVED_SYMBOLS above), just named differently in
    // brewing recipes ("extended potion of X" uses "redstone dust", crafting recipes use
    // "redstone") - same identity, so it gets the same entry rather than a second colour for one
    // substance.
    'redstone dust': { symbol: '▲', color: '#ff5c5c' },
    'glowstone dust': { symbol: '★', color: '#ffcc4d' },
    // Ground blaze rod, so it shares blaze rod's fire-orange - reuses gold ingot's outline rectangle
    // rather than blaze rod's own bar, since blaze powder appears alongside coal (fire charge) and
    // potions/lingering potions (strength brewing), never gold ingot.
    'blaze powder': { symbol: '▭', color: '#ff9b3f' },
    'fermented spider eye': { symbol: '▼', color: '#6b7a2e' },
    'spider eye': { symbol: '○', color: '#8b1a1a' },
    'ghast tear': { symbol: '◈', color: '#d4e8ec' },
    // The other two wood identities canonicalizeName folds every species into, alongside the
    // existing 'planks' entry - a log's real shape is a round cross-section (bark and all), so it
    // gets the filled circle in a dull bark-brown, distinct from planks' lighter tan. Stripped wood
    // is close to a plank's own colour (the bark is gone) but not identical, so it keeps planks'
    // square shape in a slightly lighter, more golden shade.
    'log': { symbol: '●', color: '#5c4a3a' },
    'stripped log': { symbol: '■', color: '#d9b483' },
    // Boats are five planks in shape, but co-occur directly with chest (also a filled square, "X
    // chest boat" <- [chest, X boat]) so they need a different shape - a hull reads reasonably as a
    // downward wedge, and boat never appears alongside leather or melon slice, the triangle's other
    // two users.
    'boat': { symbol: '▼', color: '#c9976b' },
    // Third chunk of the master-list pass: stone and mineral families. Unlike wood or copper, stone
    // names don't share one regular prefix/suffix pattern (some prepend "polished ", some append
    // " bricks" or " slab", some do both to different bases), so each family is enumerated directly
    // here rather than parsed at runtime - still one real colour per rock type, shared across all its
    // cut/polished/chiseled forms, since that's genuinely true of the material (a stone brick slab
    // and chiseled stone bricks are the same rock, just shaped differently).
    //
    // Plain stone - andesite/diorite/granite (below) are visually close greys too, and diorite
    // actually co-occurs with stone's own filled square twice over (andesite's cobblestone, granite's
    // quartz - neither of which is stone itself, but the recipe reads as "two similar greys" either
    // way), so diorite gets a different shape to stay legible in exactly those two recipes.
    'stone': { symbol: '■', color: '#7d7d78' },
    'stone bricks': { symbol: '■', color: '#7d7d78' },
    'stone brick slab': { symbol: '■', color: '#7d7d78' },
    'chiseled stone bricks': { symbol: '■', color: '#7d7d78' },
    'stone slab': { symbol: '■', color: '#7d7d78' },
    'stone pressure plate': { symbol: '■', color: '#7d7d78' },
    'smooth stone': { symbol: '■', color: '#9a9a94' },
    'smooth stone slab': { symbol: '■', color: '#9a9a94' },
    // A moss-green tint distinguishes the mossy variant of each base from its plain-grey original -
    // a real, visible colour difference, not just a different carving.
    'mossy stone bricks': { symbol: '■', color: '#6b7a5c' },
    'mossy cobblestone': { symbol: '■', color: '#6f8a5c' },
    'andesite': { symbol: '■', color: '#7a7f82' },
    'polished andesite': { symbol: '■', color: '#7a7f82' },
    // Diorite's real conflicts (see the note above stone) - a triangle keeps it apart from
    // cobblestone and quartz's shapes in andesite/granite, its only two real multi-ingredient
    // contexts.
    'diorite': { symbol: '▲', color: '#c7c5bd' },
    'polished diorite': { symbol: '▲', color: '#c7c5bd' },
    'granite': { symbol: '■', color: '#a5665a' },
    'polished granite': { symbol: '■', color: '#a5665a' },
    'cobbled deepslate': { symbol: '■', color: '#3a3a3d' },
    'cobbled deepslate slab': { symbol: '■', color: '#3a3a3d' },
    'deepslate bricks': { symbol: '■', color: '#3a3a3d' },
    'deepslate tiles': { symbol: '■', color: '#3a3a3d' },
    'polished deepslate': { symbol: '■', color: '#3a3a3d' },
    'blackstone': { symbol: '■', color: '#2b2530' },
    'polished blackstone': { symbol: '■', color: '#2b2530' },
    'polished blackstone bricks': { symbol: '■', color: '#2b2530' },
    'polished blackstone slab': { symbol: '■', color: '#2b2530' },
    // The singular item (a single fired brick) and the block built from four of them genuinely look
    // different - not just a technical fix, real collision caught live: nether brick fence needs
    // both as separate ingredients. Same colour (same substance), a bar instead of a square for the
    // single elongated brick.
    'nether brick': { symbol: '▬', color: '#432022' },
    'nether bricks': { symbol: '■', color: '#432022' },
    'nether brick slab': { symbol: '■', color: '#432022' },
    'red nether bricks': { symbol: '■', color: '#5c1f22' },
    'end stone': { symbol: '■', color: '#dcd6a3' },
    'end stone bricks': { symbol: '■', color: '#dcd6a3' },
    'sandstone': { symbol: '■', color: '#d4c47a' },
    'cut sandstone': { symbol: '■', color: '#d4c47a' },
    'smooth sandstone': { symbol: '■', color: '#d4c47a' },
    'sandstone slab': { symbol: '■', color: '#d4c47a' },
    'chiseled sandstone': { symbol: '■', color: '#d4c47a' },
    'red sandstone': { symbol: '■', color: '#a8532f' },
    'cut red sandstone': { symbol: '■', color: '#a8532f' },
    'smooth red sandstone': { symbol: '■', color: '#a8532f' },
    'red sandstone slab': { symbol: '■', color: '#a8532f' },
    'chiseled red sandstone': { symbol: '■', color: '#a8532f' },
    'tuff': { symbol: '■', color: '#5c6058' },
    'polished tuff': { symbol: '■', color: '#5c6058' },
    'tuff bricks': { symbol: '■', color: '#5c6058' },
    'tuff brick slab': { symbol: '■', color: '#5c6058' },
    'tuff slab': { symbol: '■', color: '#5c6058' },
    // The raw droplet is a lighter, rawer amber than the compressed/cut forms.
    'resin clump': { symbol: '■', color: '#d68a3f' },
    'resin block': { symbol: '■', color: '#c9752f' },
    'resin bricks': { symbol: '■', color: '#c9752f' },
    'resin brick slab': { symbol: '■', color: '#c9752f' },
    'mud bricks': { symbol: '■', color: '#8a7355' },
    'prismarine': { symbol: '■', color: '#5f9e94' },
    'prismarine bricks': { symbol: '■', color: '#5f9e94' },
    'dark prismarine': { symbol: '■', color: '#2d5f58' },
    // Never appears alongside prismarine shard's own outline-diamond (its one real co-ingredient,
    // sea lantern), so the nugget's half-circle is free and unrelated to either nugget colour here.
    'prismarine crystals': { symbol: '◐', color: '#a8f0e8' },
    // The same substance as glowstone dust (RESERVED_SYMBOLS above) compressed into a block, so it
    // shares that exact colour and shape rather than needing a second glowing yellow.
    'glowstone': { symbol: '★', color: '#ffcc4d' },
    'heavy core': { symbol: '●', color: '#3a3a3f' },
    'pointed dripstone': { symbol: '◈', color: '#8a6a4a' },
    // Redstone's own colour (it's a torch with redstone dust on it), but needs its own shape since
    // repeater pairs it directly with plain redstone as a second ingredient.
    'redstone torch': { symbol: '▯', color: '#ff5c5c' },
    // Fourth chunk of the master-list pass: tools, weapons, and armour. Every "diamond X" here is a
    // netherite upgrade's base ingredient (netherite sword smithing <- diamond sword, netherite tool
    // materials, netherite upgrade smithing template) - genuinely made of diamond, so all twelve share
    // diamond's own reserved identity rather than needing twelve near-identical blues.
    'diamond sword': { symbol: '◆', color: '#4dd9ff' },
    'diamond axe': { symbol: '◆', color: '#4dd9ff' },
    'diamond pickaxe': { symbol: '◆', color: '#4dd9ff' },
    'diamond shovel': { symbol: '◆', color: '#4dd9ff' },
    'diamond hoe': { symbol: '◆', color: '#4dd9ff' },
    'diamond spear': { symbol: '◆', color: '#4dd9ff' },
    'diamond helmet': { symbol: '◆', color: '#4dd9ff' },
    'diamond chestplate': { symbol: '◆', color: '#4dd9ff' },
    'diamond leggings': { symbol: '◆', color: '#4dd9ff' },
    'diamond boots': { symbol: '◆', color: '#4dd9ff' },
    'diamond horse armor': { symbol: '◆', color: '#4dd9ff' },
    'diamond nautilus armor': { symbol: '◆', color: '#4dd9ff' },
    // A pale pinkish shell colour - conduit's other ingredient (heart of the sea) is unreserved, so
    // nothing here actually constrains the shape, but keeping it off the already-crowded shapes for
    // general clarity.
    'nautilus shell': { symbol: '○', color: '#e8d4c4' },
    // Dispenser pairs bow directly with cobblestone (filled square) and redstone (triangle), so it
    // needs a third shape - wood-and-string brown, distinct from planks' more orange tan since a
    // strung bow reads a little different from a flat board.
    'bow': { symbol: '▭', color: '#9c7a4a' },
    // Spectral arrow pairs this with glowstone dust's star, so it needs a different shape - a thin
    // shaft fits the same rod family as blaze rod/stick, in a plain fletching grey-brown.
    'arrow': { symbol: '▯', color: '#8a8577' },
    // All eighteen real armour trim patterns (the pattern itself is chosen by which template you
    // use; the trim's actual dye colour comes from a separate material ingredient entirely) share one
    // identity - genuinely accurate, not a shortcut: in the real game every smithing template has the
    // same dark parchment-purple card, differing only in a small pattern icon too fine-grained for
    // this system to draw. Each duplication recipe pairs the template with diamond (RESERVED_SYMBOLS
    // above) as a second ingredient, so it needs its own shape rather than reusing diamond's.
    'bolt armor trim smithing template': { symbol: '◐', color: '#4a4560' },
    'coast armor trim smithing template': { symbol: '◐', color: '#4a4560' },
    'dune armor trim smithing template': { symbol: '◐', color: '#4a4560' },
    'eye armor trim smithing template': { symbol: '◐', color: '#4a4560' },
    'flow armor trim smithing template': { symbol: '◐', color: '#4a4560' },
    'host armor trim smithing template': { symbol: '◐', color: '#4a4560' },
    'raiser armor trim smithing template': { symbol: '◐', color: '#4a4560' },
    'rib armor trim smithing template': { symbol: '◐', color: '#4a4560' },
    'sentry armor trim smithing template': { symbol: '◐', color: '#4a4560' },
    'shaper armor trim smithing template': { symbol: '◐', color: '#4a4560' },
    'silence armor trim smithing template': { symbol: '◐', color: '#4a4560' },
    'snout armor trim smithing template': { symbol: '◐', color: '#4a4560' },
    'spire armor trim smithing template': { symbol: '◐', color: '#4a4560' },
    'tide armor trim smithing template': { symbol: '◐', color: '#4a4560' },
    'vex armor trim smithing template': { symbol: '◐', color: '#4a4560' },
    'ward armor trim smithing template': { symbol: '◐', color: '#4a4560' },
    'wayfinder armor trim smithing template': { symbol: '◐', color: '#4a4560' },
    'wild armor trim smithing template': { symbol: '◐', color: '#4a4560' },
    // Fifth chunk of the master-list pass: flowers and their dyes. Every flower's only real
    // reserved neighbours are bowl/brown mushroom/red mushroom (each one's own suspicious stew
    // variant) plus gold nugget (golden dandelion) and paper (oxeye daisy's flower banner pattern) -
    // checked against every 26.2 recipe naming a flower - so the whole family shares one shape (a
    // star, evoking a bloom) that avoids all four. No recipe ever uses two different flowers as
    // separate ingredients, so reusing a colour across several flowers carries no real collision risk
    // even where it happens below.
    //
    // Most flowers already share the real Mojang dye colour their own dye conversion produces - that
    // hex is already how the flower looks in-game, not a coincidence. Three exceptions: azure bluet,
    // oxeye daisy, and white tulip all genuinely look white/pale-cream with a yellow centre, despite
    // each producing "light gray" dye (a Mojang naming quirk, not a colour match) - these three use
    // their real pale colour instead of the misleading grey.
    'dandelion': { symbol: '★', color: '#fed83d' },
    'golden dandelion': { symbol: '★', color: '#ffb703' },
    'sunflower': { symbol: '★', color: '#fed83d' },
    'wildflowers': { symbol: '★', color: '#fed83d' },
    'poppy': { symbol: '★', color: '#b02e26' },
    'red tulip': { symbol: '★', color: '#b02e26' },
    'rose bush': { symbol: '★', color: '#b02e26' },
    'orange tulip': { symbol: '★', color: '#f9801d' },
    'torchflower': { symbol: '★', color: '#f9801d' },
    'open eyeblossom': { symbol: '★', color: '#f9801d' },
    'pink tulip': { symbol: '★', color: '#f38baa' },
    'peony': { symbol: '★', color: '#f38baa' },
    'pink petals': { symbol: '★', color: '#f38baa' },
    'cactus flower': { symbol: '★', color: '#f38baa' },
    'allium': { symbol: '★', color: '#c74ebd' },
    'lilac': { symbol: '★', color: '#c74ebd' },
    'blue orchid': { symbol: '★', color: '#3ab3da' },
    'cornflower': { symbol: '★', color: '#3c44aa' },
    'pitcher plant': { symbol: '★', color: '#169c9c' },
    'lily of the valley': { symbol: '★', color: '#f9fffe' },
    'closed eyeblossom': { symbol: '★', color: '#474f52' },
    'wither rose': { symbol: '★', color: '#1d1d21' },
    'azure bluet': { symbol: '★', color: '#f5f0d8' },
    'oxeye daisy': { symbol: '★', color: '#f5f0d8' },
    'white tulip': { symbol: '★', color: '#f5f0d8' },
    // Sixth chunk of the master-list pass: mob drops.
    // Arrow pairs this with stick and flint; brush pairs it with copper ingot and stick - avoiding
    // both stick's bar and copper's bar rules out ▮/▬.
    'feather': { symbol: '◇', color: '#f0ead8' },
    // Arrow also pairs flint with feather; fletching table pairs it with planks; flint and steel
    // pairs it with iron ingot - avoiding stick/feather/planks/iron ingot's shapes.
    'flint': { symbol: '▲', color: '#4a4a48' },
    // Bone, bone meal, and bone block are always a single-ingredient conversion from the previous
    // stage, never siblings in the same recipe, so sharing one colour across all three is both safe
    // and accurate (it's the same substance, just ground finer or compressed).
    'bone': { symbol: '▯', color: '#e8e0d0' },
    'bone meal': { symbol: '○', color: '#e8e0d0' },
    'bone block': { symbol: '■', color: '#e8e0d0' },
    // Leather's only recipe (single ingredient), so nothing constrains this one.
    'rabbit hide': { symbol: '▼', color: '#b08860' },
    // Painting pairs this with stick, so it can't share stick's bar. Off-white rather than dye
    // white's pure white/light-blue-white pair - undyed wool is a creamy, slightly grey white.
    'wool': { symbol: '■', color: '#e8e4d8' },
    // Shulker box pairs this with chest's filled square, so it needs a different shape.
    'shulker shell': { symbol: '●', color: '#c9a8d4' },
    // Turtle helmet's only recipe (single ingredient).
    'turtle scute': { symbol: '▮', color: '#7a9060' },
    // Wolf armor's only recipe (single ingredient).
    'armadillo scute': { symbol: '◆', color: '#8a7a5a' },
    // Rabbit stew pairs this with bowl, carrot, and a mushroom - avoiding all three shapes.
    'cooked rabbit': { symbol: '○', color: '#a86840' },
    // These four all pair with a base potion (the filled half-circle) as their only real reserved
    // neighbour, so each just needs to avoid that one shape.
    'rabbit foot': { symbol: '◐', color: '#c9a878' },
    'phantom membrane': { symbol: '◈', color: '#a8b8a0' },
    'turtle shell': { symbol: '▬', color: '#4a7a5a' },
    'cobweb': { symbol: '▭', color: '#d0cbb8' },
    // Seventh chunk of the master-list pass: the Nether and the End.
    // Ender eye's own recipe pairs this with blaze powder's outline rectangle.
    'ender pearl': { symbol: '●', color: '#3a8a7a' },
    // A purple-teal blend (an ender pearl fused with blaze powder) - ender chest pairs this with
    // obsidian and itself, end crystal pairs it with glass and ghast tear, so it needs a shape none
    // of ender pearl/blaze powder/obsidian/glass/ghast tear already use.
    'ender eye': { symbol: '▼', color: '#7a3a9e' },
    // Both real recipes pair this with diamond as a second ingredient.
    'netherrack': { symbol: '■', color: '#6b3a35' },
    // Skull banner pattern pairs this with paper's filled square.
    'wither skeleton skull': { symbol: '◇', color: '#3a3a3a' },
    // Mace pairs this with heavy core's filled circle; flow armor trim template pairs it with
    // diamond and itself.
    'breeze rod': { symbol: '◈', color: '#a8d8e0' },
    // The one smithing template outside the eighteen trim patterns (RESERVED_SYMBOLS above) - real
    // Minecraft gives every template, netherite upgrade included, the same dark parchment-purple
    // card, so it shares that exact identity rather than needing a nineteenth near-identical colour.
    'netherite upgrade smithing template': { symbol: '◐', color: '#4a4560' },
    // Eighth chunk of the master-list pass: everything left over that isn't a tag placeholder
    // ("X tool materials", "trim materials", "trimmable armor", "wooden slabs" - deferred, since
    // each represents "any of several different real items," not one substance) or non-canonical
    // modded content (the sulfur/cinnabar families - not real Minecraft).
    'apple': { symbol: '●', color: '#a83232' },
    'baked potato': { symbol: '◇', color: '#c9a050' },
    'bamboo blocks': { symbol: '■', color: '#a8b878' },
    'bamboo mosaic': { symbol: '■', color: '#c4b878' },
    'bamboo slab': { symbol: '■', color: '#c4b878' },
    'basalt': { symbol: '■', color: '#454548' },
    'book': { symbol: '▼', color: '#c9a878' },
    'bookshelf': { symbol: '■', color: '#8a6a3a' },
    // The compressed block (four fired bricks), distinct from plain 'brick' (RESERVED_SYMBOLS above)
    // the same way nether brick/nether bricks are - same colour, a square instead of a bar.
    'bricks': { symbol: '■', color: '#9c4a3c' },
    'carved pumpkin': { symbol: '●', color: '#d9891a' },
    'chiseled quartz block': { symbol: '■', color: '#f0ece2' },
    'quartz block': { symbol: '■', color: '#f0ece2' },
    'quartz slab': { symbol: '■', color: '#f0ece2' },
    'quartz pillar': { symbol: '■', color: '#f0ece2' },
    'smooth quartz': { symbol: '■', color: '#f0ece2' },
    'clay ball': { symbol: '●', color: '#8a9a8a' },
    // The same substance as coal (RESERVED_SYMBOLS above) - a tag covering coal or charcoal, either
    // of which looks the same for this purpose.
    'coals': { symbol: '◇', color: '#5b6472' },
    'cocoa beans': { symbol: '●', color: '#5c3a1e' },
    'compass': { symbol: '◐', color: '#b8935a' },
    'copper torch': { symbol: '▯', color: '#c87f4a' },
    'crafting table': { symbol: '●', color: '#a87a4a' },
    'creeper head': { symbol: '◐', color: '#3a7a3a' },
    // Purple-glow variant of obsidian (RESERVED_SYMBOLS above) - a distinct colour and shape, since
    // the two are different enough to be worth telling apart even though they never co-occur.
    'crying obsidian': { symbol: '▼', color: '#7a2a9e' },
    // One of nine identical fragments that combine into a single music disc - nothing meaningfully
    // distinguishes fragment 5 from the others visually, so this is a generic "disc fragment" look
    // rather than anything specific to the number.
    'disc fragment 5': { symbol: '◐', color: '#2a2a2a' },
    'dried kelp': { symbol: '▼', color: '#4a5a2a' },
    'dried kelp block': { symbol: '■', color: '#4a5a2a' },
    'dropper': { symbol: '●', color: '#6a6a68' },
    'echo shard': { symbol: '◈', color: '#8aa8b0' },
    'enchanted golden apple': { symbol: '▭', color: '#ffb703' },
    'fishing rod': { symbol: '▯', color: '#8a6a3a' },
    // The generic "any flower" tag (suspicious stew's alternate representation) - shares the flower
    // family's own star shape, in an average floral tone rather than any one specific bloom's colour.
    'flowers': { symbol: '★', color: '#d9a83a' },
    'furnace': { symbol: '■', color: '#6a6a68' },
    'glass bottle': { symbol: '◇', color: '#c8e8ec' },
    'glistering melon slice': { symbol: '▼', color: '#e8c840' },
    'glow ink sac': { symbol: '●', color: '#4ae0c8' },
    'golden carrot': { symbol: '▮', color: '#ffb703' },
    'hay block': { symbol: '■', color: '#d4b03a' },
    'heart of the sea': { symbol: '◐', color: '#3ab8c9' },
    'honey block': { symbol: '■', color: '#e8a83a' },
    'honey bottle': { symbol: '▯', color: '#e8a83a' },
    'hopper': { symbol: '▼', color: '#6a6a68' },
    'ink sac': { symbol: '●', color: '#2a2a2a' },
    'item frame': { symbol: '▭', color: '#8a6a3a' },
    'magma cream': { symbol: '●', color: '#d97a3a' },
    'mangrove roots': { symbol: '▮', color: '#5a3a2a' },
    // A tag covering any plain metal nugget (iron/gold/copper) - the pale-silver iron nugget colour
    // is the most neutral representative of the three.
    'metal nuggets': { symbol: '◐', color: '#c7ccd1' },
    'minecart': { symbol: '▼', color: '#7a7a78' },
    'moss block': { symbol: '●', color: '#5a7a3a' },
    'mud': { symbol: '◇', color: '#5a4a3a' },
    'packed mud': { symbol: '■', color: '#6a5a3a' },
    'pale moss block': { symbol: '○', color: '#a8b090' },
    'piston': { symbol: '■', color: '#8a8a78' },
    'popped chorus fruit': { symbol: '◐', color: '#c090d0' },
    'pufferfish': { symbol: '▼', color: '#d4b060' },
    'pumpkin': { symbol: '■', color: '#d9891a' },
    'purpur block': { symbol: '●', color: '#a878b8' },
    'purpur slab': { symbol: '■', color: '#a878b8' },
    // Raw ore is duller and rougher than its refined ingot form (RESERVED_SYMBOLS above) - each pair
    // (the loose ore and the compressed 9-ore block) shares one colour, distinct from the other two
    // metals' raw forms and from all three refined ingots.
    'raw copper': { symbol: '◐', color: '#d4823a' },
    'raw copper block': { symbol: '◐', color: '#d4823a' },
    'raw gold': { symbol: '▭', color: '#e8c85a' },
    'raw gold block': { symbol: '▭', color: '#e8c85a' },
    'raw iron': { symbol: '▯', color: '#a89888' },
    'raw iron block': { symbol: '▯', color: '#a89888' },
    'red sand': { symbol: '●', color: '#a85a2a' },
    'resin brick': { symbol: '▬', color: '#c9752f' },
    'sculk sensor': { symbol: '◐', color: '#1a5a5a' },
    // The block form of slime ball (RESERVED_SYMBOLS above) - potion of oozing uses the block
    // specifically, not the ball, so it needs its own entry, sharing slime's real green.
    'slime block': { symbol: '■', color: '#8bc34a' },
    'snow block': { symbol: '●', color: '#f0f5f8' },
    'snowball': { symbol: '○', color: '#f0f5f8' },
    // A small tag ("soul sand or soul soil") rather than a sprawling category like the deferred tool-
    // material tags, and both alternatives genuinely produce the same blue soul-fire colour, so it
    // gets one real identity rather than being deferred with the others.
    'soul fire base blocks': { symbol: '◈', color: '#4a8ac9' },
    'soul sand': { symbol: '▼', color: '#4a3a2a' },
    'soul torch': { symbol: '▯', color: '#4a8ac9' },
    'sugar cane': { symbol: '◇', color: '#7a9a4a' },
    'tnt': { symbol: '■', color: '#c9301a' },
    'torch': { symbol: '▯', color: '#f0a030' },
    'vine': { symbol: '▲', color: '#4a7a2a' },
    'warped fungus': { symbol: '●', color: '#2a9a8a' },
    // Crossbow pairs this with stick, iron ingot, and string; trapped chest pairs it with chest -
    // avoiding all four shapes.
    'tripwire hook': { symbol: '◆', color: '#8a7a6a' },
};

// Minecraft's 16 standard dye colours, in their real hex values (the same tones the wiki's colour
// chart and firework/banner data use) - keyed longest-name-first so a two-word colour ("light gray",
// "light blue") is checked before the single-word colour that's also its own valid prefix ("gray",
// "blue") would otherwise wrongly match first. getColorFamilyMatch (resolveItemSymbol.ts) relies on
// this order.
export const DYE_COLORS: { name: string, color: string }[] = [
    { name: 'light gray', color: '#9d9d97' },
    { name: 'light blue', color: '#3ab3da' },
    { name: 'white', color: '#f9fffe' },
    { name: 'orange', color: '#f9801d' },
    { name: 'magenta', color: '#c74ebd' },
    { name: 'yellow', color: '#fed83d' },
    { name: 'lime', color: '#80c71f' },
    { name: 'pink', color: '#f38baa' },
    { name: 'gray', color: '#474f52' },
    { name: 'cyan', color: '#169c9c' },
    { name: 'purple', color: '#8932b8' },
    { name: 'blue', color: '#3c44aa' },
    { name: 'brown', color: '#835432' },
    { name: 'green', color: '#5e7c16' },
    { name: 'red', color: '#b02e26' },
    { name: 'black', color: '#1d1d21' },
];

// The "family" part of a colour-prefixed name ("purple wool" -> "wool") mapped to a shape shared by
// every colour of that family. The first 10 entries below were originally scoped to recipe-grid
// rendering only, where what mattered was whether the family ever shows up as an INGREDIENT in a
// crafting_shaped recipe - candle, concrete powder, glazed terracotta, and shulker box were checked
// against the real 26.2 data and never appear as anyone's ingredient, so they were left out. That
// scoping doesn't apply to full item/block coverage: an item can need a real identity without ever
// being a recipe ingredient, so concrete/concrete powder/glazed terracotta/candle/shulker box are
// added below too (real, verified counts: 16 colours each except shulker box's 17th, undyed entry,
// which isn't part of this colour-prefixed family and resolves through RESERVED_SYMBOLS/hash
// instead). "Cake with <colour> candle" is a real but different naming pattern - the colour sits in
// the middle of the name, not as a prefix - so those 16 names aren't matched here and fall through
// to the hash fallback; a small, deliberately out-of-scope gap rather than an oversight.
export const COLOR_FAMILY_SHAPES: Record<string, string> = {
    'wool': '■',
    'terracotta': '●',
    'stained glass': '◆',
    'stained glass pane': '◇',
    'bed': '▬',
    'carpet': '▭',
    'banner': '★',
    'wall banner': '★',
    // Reuses lapis lazuli's shape - fitting, since lapis is itself one of blue dye's ingredients.
    'dye': '○',
    // Reuses bed's shape - harness never appears in the same recipe as a bed, so there's no real
    // conflict, and both are "a coloured fabric item" in the same loose sense.
    'harness': '▬',
    // Concrete is a solid, opaque block the same way wool/terracotta are - shares wool's shape.
    'concrete': '■',
    // The loose, uncompacted form of concrete - an outline diamond reads lighter/looser than the
    // solid square its hardened form uses.
    'concrete powder': '◇',
    // A candle is genuinely rod-shaped - the same vertical bar its own single reserved 'candle'
    // entry (RESERVED_SYMBOLS above) already uses for the undyed base candle.
    'candle': '▮',
    // A box, loosely - the outline bar distinguishes it from every filled/solid-block shape above.
    'shulker box': '▯',
    // A glossy-fired version of plain terracotta (its own filled circle above) - the filled diamond
    // (stained glass's own shape) evokes that glazed sheen better than reusing the plain circle.
    'glazed terracotta': '◆',
    // Real 16-colour family, verified (16 real names) - genuinely missed in the original port, not
    // deliberately excluded the way candle/concrete/etc. were. Reuses harness's own shape (both are
    // "a coloured fabric container/accessory" in the same loose sense harness already reuses bed's
    // shape for).
    'bundle': '▬',
};

// A real Mojang rename ("Iron Block" -> "Block of Iron", etc. - the same rename family
// diff/coverageReport.ts's heuristic already knows how to detect for a different purpose) shows up
// directly in minecraft-data's current displayName field, confirmed by checking it live: 26.1's
// real items.json has "Block of Iron", not "Iron Block". Craft Helper's own cleaned pipeline still
// emits the pre-rename order (verified against its real bundled 26.2 items.json), which is why
// RESERVED_SYMBOLS above still keys these under the old "iron block" form - but a consumer working
// from minecraft-atlas's own buildItems/buildBlocks output directly (unprocessed displayName) would
// see the new order and miss every one of these without this alias table. Reuses each mineral's
// exact existing colour+shape rather than a new lookup, since it's the identical real item under a
// different name - not a second, separate identity.
export const MODERN_BLOCK_NAMES: Record<string, ItemSymbol> = {
    'amethyst': { symbol: '◐', color: '#9d6fd9' },
    'coal': { symbol: '■', color: '#5b6472' },
    'copper': { symbol: '■', color: '#c87f4a' },
    'diamond': { symbol: '■', color: '#4dd9ff' },
    'emerald': { symbol: '■', color: '#3ecf6c' },
    'gold': { symbol: '■', color: '#ffb703' },
    'iron': { symbol: '■', color: '#c7ccd1' },
    'lapis lazuli': { symbol: '■', color: '#2b4c9e' },
    'netherite': { symbol: '■', color: '#544c53' },
    'quartz': { symbol: '■', color: '#f0ece2' },
    'raw copper': { symbol: '◐', color: '#d4823a' },
    'raw gold': { symbol: '▭', color: '#e8c85a' },
    'raw iron': { symbol: '▯', color: '#a89888' },
    'redstone': { symbol: '■', color: '#ff5c5c' },
    'resin': { symbol: '■', color: '#c9752f' },
};

// Every real Java ore block (verified: 18 names across coal/copper/diamond/emerald/gold/iron/
// lapis lazuli/redstone/quartz, each as a plain and - except quartz - a deepslate variant) gets a
// colour derived from that exact mineral's own RESERVED_SYMBOLS colour above, not a new invented
// one: an ore block genuinely is that mineral suspended in stone, so its colour should read as
// "that mineral, muted" rather than something unrelated. Computed once, offline, as a 45/55 blend
// of the mineral's reserved colour with plain stone's own reserved tone (#7d7d78) for the surface
// variant, or deepslate's (#3a3a3d) for the deepslate variant - then hardcoded here as a literal
// hex like every other colour in this file, the same way every blended/derived tone elsewhere in
// this project (e.g. the ore-region JSON hex conversions in transform/java/biomes.ts) is a stored
// literal, not a runtime computation with its own rounding behaviour to reason about.
export const ORE_COLORS: Record<string, { ore: string; deepslateOre: string }> = {
    'coal': { ore: '#6e7275', deepslateOre: '#494d55' },
    'copper': { ore: '#9f7e63', deepslateOre: '#7a5943' },
    'diamond': { ore: '#67a6b5', deepslateOre: '#438294' },
    'emerald': { ore: '#61a273', deepslateOre: '#3c7d52' },
    'gold': { ore: '#b89743', deepslateOre: '#937223' },
    'iron': { ore: '#9ea1a0', deepslateOre: '#797c80' },
    'lapis lazuli': { ore: '#586789', deepslateOre: '#334269' },
    'redstone': { ore: '#b86e6b', deepslateOre: '#93494b' },
    // No deepslate quartz ore exists in the real game - quartz only ever generates in the Nether,
    // named "nether quartz ore" rather than a stone/deepslate pair the way the other eight are.
    // deepslateOre is unused for this one entry, kept only so every mineral shares one type shape.
    'quartz': { ore: '#b1afa8', deepslateOre: '#b1afa8' },
};

// Real Minecraft's five coral types, their real in-game hues (the same tones the block/fan/plant
// textures actually render). Verified count: 40 real names total (5 types x 4 forms x alive/dead) -
// "<type> coral", "<type> coral block", "<type> coral fan", "<type> coral wall fan", each with a
// "dead <type> coral..." counterpart that's bone-grey regardless of type (DEAD_CORAL_COLOR below),
// matching how bleached coral genuinely loses all colour in the real game.
export const CORAL_COLORS: Record<string, string> = {
    'tube': '#3a8ee0',
    'brain': '#e893c1',
    'bubble': '#b93bd1',
    'fire': '#e0402a',
    'horn': '#e0c22a',
};
export const DEAD_CORAL_COLOR = '#8f7f76';

// Real per-species wood tone, approximating each species' actual in-game colour (oak's matches the
// existing flat 'planks' RESERVED_SYMBOLS entry above, for consistency between the two systems).
// Used for every wood-species form EXCEPT the "growing part" forms (leaves/sapling/fungus/roots/
// shoot - WOOD_LEAF_COLORS below) - a door, sign, fence, or shelf is the wood grain colour; foliage
// isn't. Deliberately doesn't cover planks/log/stripped-log/wood/boat/raft/stem - those already
// have their own flat, single-colour identity (RESERVED_SYMBOLS' 'planks'/'log'/'stripped log', and
// canonicalizeName's boat fold) verified byte-identical against real Craft Helper recipe-grid
// output; extending them to per-species colours here would change live rendering behaviour that's
// already confirmed correct, for no real gain in the one context (a single recipe) that behaviour
// was built for.
export const WOOD_SPECIES_COLORS: Record<string, string> = {
    'oak': '#c9976b',
    'spruce': '#7a4a2e',
    'birch': '#e8d9a0',
    'jungle': '#b97a4f',
    'acacia': '#ba6337',
    'dark oak': '#4a3728',
    'mangrove': '#8f3a2e',
    'cherry': '#e8b4c8',
    'bamboo': '#c9b23a',
    'crimson': '#8f2233',
    'warped': '#2a8f8a',
    'pale oak': '#d9d3c0',
};

// The real, distinct colour of each species' foliage/growing part - most are shades of green,
// cherry is famously pink-blossomed, crimson/warped's fungus caps and bamboo's shoot reuse their
// own species' wood tone above since those particular growths genuinely are that same hue in-game
// (a crimson fungus cap is the same deep red as crimson wood, not a separate green).
export const WOOD_LEAF_COLORS: Record<string, string> = {
    'oak': '#4a7a2e',
    'spruce': '#2e5a2e',
    'birch': '#6a9a4a',
    'jungle': '#3a8a3a',
    'acacia': '#7a9a3a',
    'dark oak': '#3a5a2a',
    'mangrove': '#4a7a3a',
    'cherry': '#f4c2d7',
    'bamboo': '#8fc73e',
    'crimson': '#8f2233',
    'warped': '#2a8f8a',
    'pale oak': '#c9d9c0',
};

// Every real wood-species form NOT already covered by canonicalizeName's planks/log/boat fold
// (verified against the real 26.2 catalog per species - the exact set varies: standard trees have
// leaves/sapling, crimson/warped have fungus/roots/hyphae/nylium instead, bamboo has shoot/mosaic
// instead of leaves/log). Mapped to a shape shared across every species - the colour (species wood
// tone or leaf tone, WOOD_FORM_IS_GROWTH below) is what actually distinguishes one species from
// another.
export const WOOD_FORM_SHAPES: Record<string, string> = {
    'leaves': '○',
    'sign': '▭',
    'hanging sign': '▭',
    'door': '▯',
    'trapdoor': '▯',
    'fence': '▮',
    'fence gate': '▮',
    'button': '▬',
    'pressure plate': '▬',
    'sapling': '★',
    'shoot': '★',
    'fungus': '★',
    'roots': '★',
    'shelf': '◇',
    'hyphae': '■',
    'nylium': '■',
    'mosaic': '■',
    'mosaic slab': '■',
    'mosaic stairs': '■',
    // The full-bark storage-block form (distinct from 'log', which canonicalizeName's existing
    // fold already handles) - not folded into that flat identity since 'wood' was never covered by
    // the original recipe-grid-only system at all (falls to hash either way, no verified behaviour
    // to preserve), so it's safe to give it a real per-species colour here instead.
    'wood': '■',
    // Cut planks - same substance as planks, same shape.
    'slab': '■',
    'stairs': '■',
};

// Which of WOOD_FORM_SHAPES' forms are "the growing/living part" of the species (foliage or
// fungus), and so should use WOOD_LEAF_COLORS rather than the wood-grain WOOD_SPECIES_COLORS.
export const WOOD_FORM_IS_GROWTH = new Set(['leaves', 'sapling', 'shoot', 'fungus', 'roots']);

// Every real tool/armour material tier except diamond, which already has its own individual
// RESERVED_SYMBOLS entry per piece above (twelve real recipes make diamond tools/armour the base
// ingredient for a netherite upgrade, so each already needed its own entry regardless of this
// table). Colour reuses that exact material's own existing reserved colour where one exists
// (wooden -> planks' tan, stone -> stone's grey, iron/copper/golden/netherite -> their own ingot
// colours, leather -> leather's own colour) so a tool and its raw material always read as the same
// substance; chainmail and copper are the two with no pre-existing reserved colour of their own,
// given real, distinct tones here.
export const MATERIAL_TIER_COLORS: Record<string, string> = {
    'wooden': '#c9976b',
    'stone': '#7d7d78',
    'leather': '#935c34',
    'chainmail': '#8a8f99',
    'iron': '#c7ccd1',
    'copper': '#c87f4a',
    'golden': '#ffb703',
    'netherite': '#544c53',
};

// Shape per real tool/armour piece type - reuses the same bar/rectangle language ingots and other
// reserved metal items already use, so a material tier's tools/armour visually read as "made of
// that substance" rather than getting an arbitrary new glyph per object type.
export const MATERIAL_TIER_ITEM_SHAPES: Record<string, string> = {
    'axe': '▬',
    'hoe': '▬',
    'pickaxe': '▬',
    'shovel': '▬',
    'sword': '◆',
    'spear': '▮',
    'helmet': '▯',
    'chestplate': '▯',
    'leggings': '▯',
    'boots': '▯',
    'horse armor': '▯',
};

// Copper's four real oxidation stages, in order from freshest to most weathered. The base stage
// reuses copper ingot's own colour (RESERVED_SYMBOLS above, checked before the copper family match
// ever runs) - a copper block genuinely is nine ingots, so sharing that colour is correct, not just
// convenient.
export const COPPER_OXIDATION_COLORS: Record<string, string> = {
    'copper': '#c87f4a',
    'exposed': '#a68868',
    'weathered': '#6b9080',
    'oxidized': '#4a8f6b',
};

// Every copper form that actually goes through all four oxidation stages in the real game - built
// by reading every 26.2 recipe naming "copper" anything, not assumed. Deliberately excludes copper
// ingot/nugget (their own RESERVED_SYMBOLS entries above), raw copper (ore, never oxidises), and
// copper armour (no exposed/weathered/oxidised variants exist for it). The raw block itself is
// handled separately in getCopperFamilyMatch (resolveItemSymbol.ts), since Mojang names it
// inconsistently: "Copper Block" at the base stage, but just "Exposed/Weathered/Oxidized Copper"
// (no "Block") once it's aged.
export const COPPER_FORMS = new Set([
    'cut copper', 'cut copper slab', 'cut copper stairs', 'chiseled copper', 'copper bulb',
    'copper grate', 'copper door', 'copper trapdoor', 'copper chain', 'copper chest',
    'copper lantern', 'copper bars', 'copper golem statue',
    // Doesn't have "copper" in its own name, but is genuinely copper and does oxidise in the real
    // game the same way every other form here does ("exposed lightning rod", "weathered lightning
    // rod", "oxidized lightning rod" are all real items) - the naming quirk is Mojang's, not a
    // reason to treat it differently.
    'lightning rod',
]);

// Real Mojang potion colours - the same hues the potion liquid, splash particle, and status icon
// all use in-game, well documented and stable across versions. A "potion of X" and its splash/
// lingering/extended/enhanced forms are the exact same liquid in a different delivery mechanism or
// dose, so they all share this one colour per effect (see getPotionFamilyMatch,
// resolveItemSymbol.ts) rather than needing ~5 near-duplicate entries per effect. The four newest
// effects (infestation, oozing, weaving, wind charging - all from Trial Chambers content) don't have
// as firmly documented a canonical hex as the classic effects; these four are a reasonable thematic
// estimate rather than a cited game value.
export const POTION_EFFECT_COLORS: Record<string, string> = {
    'fire resistance': '#e49a3a',
    'healing': '#f82423',
    'harming': '#430a09',
    'invisibility': '#7f8392',
    'leaping': '#2effcc',
    'night vision': '#1f1fa1',
    'poison': '#4e9331',
    'regeneration': '#cd5cab',
    'slow falling': '#fefdf7',
    'slowness': '#5a6c81',
    'strength': '#932423',
    'swiftness': '#7cafc6',
    'water breathing': '#2e5299',
    'weakness': '#484d48',
    'the turtle master': '#7a5333',
    'infestation': '#7d8570',
    'oozing': '#86c74e',
    'weaving': '#cfd6c8',
    'wind charging': '#bfe8ec',
};

// The four potions with no effect - either the very base (water bottle) or a dead-end intermediate
// step (awkward/mundane/thick) that never gets bottled into anything drinkable. Murky, muted tones
// rather than a real cited colour, since none of these have a strong canonical "look" the way an
// effect potion does.
export const POTION_BASE_COLORS: Record<string, string> = {
    'water bottle': '#7ec4e8',
    'awkward potion': '#96896e',
    'mundane potion': '#9e8f5e',
    'thick potion': '#8a7a5a',
};

// A shape's fill/colour is dark enough on a typical dark cell background that two DIFFERENT pale
// colours sharing a shape can still be hard to tell apart even though they're not an exact match -
// verified against real data: 3 of 733 shaped 26.2 recipes hit this (e.g. beacon's near-white glass
// and near-white nether star, both landing on a star). 200 is picked from that same data: only 2 of
// the 8 SYMBOL_COLORS and 1 reserved colour (nether star) cross it, so this only ever kicks in for
// the specific colours that actually caused the problem.
export const PALE_BRIGHTNESS_THRESHOLD = 200;
