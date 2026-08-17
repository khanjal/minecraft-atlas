// Resolves an item name to a display symbol+colour identity - ported from Craft Helper's
// recipeGridHelpers.ts (see itemSymbols.ts's header for why). A consumer building any kind of
// multi-item visual display (a recipe grid, an inventory list, ...) gets a consistent, deterministic
// identity per item name: a hand-picked match for the common/recognisable items (RESERVED_SYMBOLS),
// a real-colour family match for anything that's "some colour of X" (dye/copper/potion families),
// and a deterministic name-derived fallback for everything else - never an unstyled or arbitrary
// result.

import { ItemSymbol } from '../models/item-symbol.model';
import {
    DISPLAY_SYMBOLS, SYMBOL_COLORS, RESERVED_SYMBOLS, DYE_COLORS, COLOR_FAMILY_SHAPES,
    COPPER_OXIDATION_COLORS, COPPER_FORMS, POTION_EFFECT_COLORS, POTION_BASE_COLORS, ORE_COLORS,
    CORAL_COLORS, DEAD_CORAL_COLOR, WOOD_SPECIES_COLORS, WOOD_LEAF_COLORS, WOOD_FORM_SHAPES,
    WOOD_FORM_IS_GROWTH, MATERIAL_TIER_COLORS, MATERIAL_TIER_ITEM_SHAPES, MODERN_BLOCK_NAMES,
    STONE_MATERIAL_COLORS, STONE_FORM_SHAPES, STONE_BRICK_VARIANTS, POTTERY_SHERD_COLOR,
    BANNER_PATTERN_ITEM_COLOR, SPAWN_EGG_SHAPE, PALE_BRIGHTNESS_THRESHOLD,
} from './itemSymbols';

// Folds every wood's planks ("oak planks", "birch planks", the "planks" tag itself, ...) into one
// "planks" identity, since the shape/colour stands for "a plank," not a specific wood - display
// text stays whatever the caller already shows, this only affects the shape/colour lookup. Applied
// before both the RESERVED_SYMBOLS lookup and the hash in resolveHashedSymbol, so oak/birch/spruce
// planks all land on the exact same slot even on the rare recipe where planks isn't reserved from a
// colliding hash.
// Folds every wood species into one of three identities - the shape stands for "a plank," "a log,"
// or "a boat," not a specific wood, matching planks' existing precedent. Checked in this order
// because "stripped acacia log" would otherwise match the general log/stem rule before the more
// specific stripped one ever ran.
export function canonicalizeName(name: string): string {
    if (!name) {
        return name;
    }

    if (name.endsWith('planks')) {
        return 'planks';
    }

    if (name === 'stripped bamboo block' || (name.startsWith('stripped ') && (name.endsWith('log') || name.endsWith('stem')))) {
        return 'stripped log';
    }

    // Bamboo's own boat-equivalent is called a "raft," not a "boat" - same vehicle, same recipe
    // shape. The chest variant is named "X boat with chest" / "X raft with chest" in the real
    // catalog (not "X chest boat" as originally assumed here - found while extending wood coverage
    // beyond just planks/log/boat: "oak boat with chest" was silently missing this fold entirely,
    // 9 real chest-boat names across every species affected), so that suffix is stripped first.
    const withoutChest = name.endsWith(' with chest') ? name.slice(0, -' with chest'.length) : name;
    if (withoutChest.endsWith('boat') || withoutChest.endsWith('raft')) {
        return 'boat';
    }

    if (name.endsWith('logs') || name.endsWith('log') || name.endsWith('stems') || name.endsWith('stem')) {
        return 'log';
    }

    return name;
}

// Checks whether `name` is "<colour> <family>" for one of the real 16-colour families above - if so,
// returns that family's shape paired with the real dye colour, so every colour of wool (for example)
// shares one shape and only the colour changes, matching the real item far more closely than a hash
// of the whole string ever could ("purple stained glass pane" hashing to whatever the string happens
// to land on, unrelated to purple, was the actual gap this closes).
function getColorFamilyMatch(name: string): ItemSymbol | undefined {
    for (const dye of DYE_COLORS) {
        if (!name.startsWith(dye.name + ' ')) {
            continue;
        }

        const family = name.slice(dye.name.length + 1);
        const shape = COLOR_FAMILY_SHAPES[family];

        if (shape) {
            return { symbol: shape, color: dye.color };
        }
    }

    return undefined;
}

// Matches any of the ~50 copper-family ingredients (four oxidation stages x fourteen forms, each
// optionally "waxed") to one shape (the ingot bar, since it's still fundamentally copper) and a
// colour keyed only by oxidation stage - the form doesn't affect appearance, so "copper chain" and
// "copper lantern" share a colour, matching the real game where only the oxidation state is
// visually distinct. "Waxed" never changes colour (it just stops further oxidising), so it's
// stripped before matching and both states render identically - the same shared-identity pattern
// as glass/glass pane and ice/packed ice.
// Every form shares the ingot's horizontal bar except copper chain - a vertical rectangle instead,
// matching iron chain (RESERVED_SYMBOLS), the only other chain in the game. A hanging chain reads
// as vertical, not like a flat bar of metal.
function copperFormSymbol(form: string): string {
    return form === 'copper chain' ? '▮' : '▬';
}

function getCopperFamilyMatch(name: string): ItemSymbol | undefined {
    const stripped = name.startsWith('waxed ') ? name.slice(6) : name;

    if (stripped === 'copper block' || COPPER_FORMS.has(stripped)) {
        return { symbol: copperFormSymbol(stripped), color: COPPER_OXIDATION_COLORS['copper'] };
    }

    for (const state of ['exposed', 'weathered', 'oxidized']) {
        if (!stripped.startsWith(state + ' ')) {
            continue;
        }

        const form = stripped.slice(state.length + 1);
        if (form === 'copper' || COPPER_FORMS.has(form)) {
            return { symbol: copperFormSymbol(form), color: COPPER_OXIDATION_COLORS[state] };
        }
    }

    return undefined;
}

// A "potion of X" and every splash/lingering/extended/enhanced form of it are the same liquid in a
// different delivery mechanism or dose, so they all share one filled half-circle - a potion bottle's
// round body - and a colour keyed only by effect (POTION_EFFECT_COLORS, itemSymbols.ts).
//
// The delivery word lands in a different position depending on the base name, which is why this
// isn't a single strip-then-match: "water bottle" and every effect potion take it as a prefix
// ("splash water bottle", "splash potion of healing"), but awkward/mundane/thick insert it before
// the word "potion" instead ("awkward splash potion", not "splash awkward potion") - verified
// against real Java 26.2 data rather than assumed, since the two patterns look like they should be
// the same and aren't.
function getPotionFamilyMatch(name: string): ItemSymbol | undefined {
    const prefixStripped = name.startsWith('splash ') ? name.slice(7)
        : name.startsWith('lingering ') ? name.slice(10)
        : name;

    if (prefixStripped === 'water bottle') {
        return { symbol: '◑', color: POTION_BASE_COLORS['water bottle'] };
    }

    for (const base of ['awkward', 'mundane', 'thick']) {
        if (name === `${base} potion` || name === `${base} splash potion` || name === `${base} lingering potion`) {
            return { symbol: '◑', color: POTION_BASE_COLORS[`${base} potion`] };
        }
    }

    let stripped = prefixStripped;
    for (const tier of ['extended ', 'enhanced ']) {
        if (stripped.startsWith(tier)) {
            stripped = stripped.slice(tier.length);
        }
    }

    if (stripped.startsWith('potion of ')) {
        const effect = stripped.slice('potion of '.length);
        const color = POTION_EFFECT_COLORS[effect];

        if (color) {
            return { symbol: '◑', color };
        }
    }

    return undefined;
}

// Real Java ore blocks (verified: 18 names, see ORE_COLORS) - "<mineral> ore", "deepslate
// <mineral> ore", or (quartz/gold's real exception) "nether <mineral> ore". A stone-block shape,
// since that's what an ore block fundamentally is, in a colour derived from the real mineral it
// contains rather than an unrelated hashed one.
function getOreFamilyMatch(name: string): ItemSymbol | undefined {
    const stripped = name.startsWith('deepslate ') ? name.slice(10)
        : name.startsWith('nether ') ? name.slice(7)
        : name;

    if (!stripped.endsWith(' ore')) {
        return undefined;
    }

    const mineral = stripped.slice(0, -' ore'.length);
    const colors = ORE_COLORS[mineral];

    if (!colors) {
        return undefined;
    }

    const color = name.startsWith('deepslate ') ? colors.deepslateOre : colors.ore;
    return { symbol: '■', color };
}

// Real coral names (verified: 40 total, see CORAL_COLORS) - "<type> coral", "<type> coral block",
// "<type> coral fan"/"<type> coral wall fan" (fan and wall fan share one identity - the same fan
// object, freestanding or wall-mounted), each optionally "dead " prefixed for the real bleached-grey
// variant. A different shape per real object type: the loose plant (a small polyp cluster), the
// solid block, and the branching fan.
function getCoralFamilyMatch(name: string): ItemSymbol | undefined {
    const isDead = name.startsWith('dead ');
    const stripped = isDead ? name.slice(5) : name;

    for (const type of Object.keys(CORAL_COLORS)) {
        if (!stripped.startsWith(type + ' coral')) {
            continue;
        }

        const form = stripped.slice((type + ' coral').length);
        const color = isDead ? DEAD_CORAL_COLOR : CORAL_COLORS[type];

        if (form === '') {
            return { symbol: '○', color };
        }
        if (form === ' block') {
            return { symbol: '■', color };
        }
        if (form === ' fan' || form === ' wall fan') {
            return { symbol: '◇', color };
        }
    }

    return undefined;
}

// Every real wood-species form NOT already folded by canonicalizeName (planks/log/stripped/boat
// keep their existing flat, single-colour identity - see WOOD_SPECIES_COLORS' own comment for why).
// Checked against `name` directly, not the canonicalized form, since canonicalizeName would already
// have folded away anything this function needs to see species-distinctly.
function getWoodFormFamilyMatch(name: string): ItemSymbol | undefined {
    for (const species of Object.keys(WOOD_SPECIES_COLORS)) {
        if (!name.startsWith(species + ' ')) {
            continue;
        }

        const form = name.slice(species.length + 1);
        const shape = WOOD_FORM_SHAPES[form];

        if (!shape) {
            continue;
        }

        const color = WOOD_FORM_IS_GROWTH.has(form) ? WOOD_LEAF_COLORS[species] : WOOD_SPECIES_COLORS[species];
        return { symbol: shape, color };
    }

    return undefined;
}

// Real tool/armour material tiers (verified: axe/hoe/pickaxe/shovel/sword/spear and helmet/
// chestplate/leggings/boots/horse armor, wooden/stone/leather/chainmail/iron/copper/golden/
// netherite - diamond excluded, already covered per-piece by RESERVED_SYMBOLS). "<material> <item
// type>" - checked as two whole words from the front, not a generic prefix, since "iron" alone is
// also a real standalone item (RESERVED_SYMBOLS' iron ingot) that must never match this.
function getMaterialTierFamilyMatch(name: string): ItemSymbol | undefined {
    for (const material of Object.keys(MATERIAL_TIER_COLORS)) {
        if (!name.startsWith(material + ' ')) {
            continue;
        }

        const itemType = name.slice(material.length + 1);
        const shape = MATERIAL_TIER_ITEM_SHAPES[itemType];

        if (shape) {
            return { symbol: shape, color: MATERIAL_TIER_COLORS[material] };
        }
    }

    return undefined;
}

// The real "Block of X" Mojang rename (see MODERN_BLOCK_NAMES) - checked as its own prefix rather
// than reversed into "X block" and re-run through the rest of resolveFixedSymbol, so there's no
// risk of the reversed string accidentally matching something it shouldn't via a different family.
function getModernBlockNameMatch(name: string): ItemSymbol | undefined {
    if (!name.startsWith('block of ')) {
        return undefined;
    }

    return MODERN_BLOCK_NAMES[name.slice('block of '.length)];
}

// Real stone/mineral "<material> slab/stairs/wall" names (verified: 103 across these three
// suffixes, wood species and cut-copper forms excluded since they're already covered elsewhere).
// Safe against prefix overlap without needing a longest-first check (unlike DYE_COLORS): a match
// only returns once the *remaining* text after the material name is itself a recognised form -
// "stone brick slab" tried against the shorter "stone" prefix leaves "brick slab", which isn't a
// valid form, so the loop continues to the longer, correct "stone brick" match instead of stopping
// early on a false positive.
function getStoneFormFamilyMatch(name: string): ItemSymbol | undefined {
    for (const material of Object.keys(STONE_MATERIAL_COLORS)) {
        if (!name.startsWith(material + ' ')) {
            continue;
        }

        const form = name.slice(material.length + 1);
        const shape = STONE_FORM_SHAPES[form];

        if (shape) {
            return { symbol: shape, color: STONE_MATERIAL_COLORS[material] };
        }
    }

    return undefined;
}

// The twelve real "chiseled/cracked/infested X bricks" names (see STONE_BRICK_VARIANTS) that don't
// fit the material-then-form pattern above.
function getStoneBrickVariantMatch(name: string): ItemSymbol | undefined {
    return STONE_BRICK_VARIANTS[name];
}

// Every real pottery sherd (23 names) shares one identity - a real material (fired clay, the same
// substance terracotta's colour represents), not 23 fabricated per-picture colours. A half-circle
// evokes a broken shard, distinct from terracotta's own filled circle.
function getPotterySherdMatch(name: string): ItemSymbol | undefined {
    return name.endsWith(' pottery sherd') ? { symbol: '◐', color: POTTERY_SHERD_COLOR } : undefined;
}

// Every real banner pattern item (10 names) shares one identity too, same reasoning - a real
// parchment/template tone (reusing paper's own colour) rather than a fabricated per-pattern one.
// A small rectangle (a pattern card), distinct from an actual dyed banner's star (COLOR_FAMILY_SHAPES).
function getBannerPatternItemMatch(name: string): ItemSymbol | undefined {
    return name.endsWith(' banner pattern') ? { symbol: '▭', color: BANNER_PATTERN_ITEM_COLOR } : undefined;
}

// Single entry point for "this name has a fixed, hand-matched identity" - a single reserved item
// first, then a colour-family match. A caller building a multi-item display should resolve every
// name through this in one pass before any hash runs: a fixed identity never checks for collisions,
// so hash-assignment needs to see the complete fixed set up front to avoid clashing with one
// resolved later in whatever order the caller processes items.
export function resolveFixedSymbol(name: string): ItemSymbol | undefined {
    const canonical = canonicalizeName(name);

    return RESERVED_SYMBOLS[canonical] || getColorFamilyMatch(canonical) || getCopperFamilyMatch(canonical)
        || getPotionFamilyMatch(canonical) || getOreFamilyMatch(canonical) || getCoralFamilyMatch(canonical)
        || getWoodFormFamilyMatch(canonical) || getMaterialTierFamilyMatch(canonical)
        || getModernBlockNameMatch(canonical) || getStoneFormFamilyMatch(canonical)
        || getStoneBrickVariantMatch(canonical) || getPotterySherdMatch(canonical)
        || getBannerPatternItemMatch(canonical);
}

function isPale(hex: string): boolean {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return (r + g + b) / 3 > PALE_BRIGHTNESS_THRESHOLD;
}

// Deterministic, name-derived symbol/colour - same item name always lands on the same slot.
// `usedSoFar` holds every pair already assigned in this display; on a collision the slot walks
// forward through the combined shape x colour space (a fixed sequence, not random) until it finds
// one that's free, so two different items in the same display never render identically, and asking
// for the same display twice always renders it the same way. A candidate is also skipped if it
// would put a second pale colour on a shape another pale entry already claimed (see isPale above),
// even when the exact pair differs.
// `symbols` defaults to DISPLAY_SYMBOLS (the confirmed-safe pool) - a caller that's verified
// PROVISIONAL_DISPLAY_SYMBOLS render correctly on their target device can pass a wider pool
// (e.g. `[...DISPLAY_SYMBOLS, ...PROVISIONAL_DISPLAY_SYMBOLS]`) explicitly; nothing opts into an
// unconfirmed glyph by default.
export function resolveHashedSymbol(
    name: string,
    usedSoFar: Map<string, ItemSymbol>,
    symbols: string[] = DISPLAY_SYMBOLS,
): ItemSymbol {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    }

    const totalCombos = symbols.length * SYMBOL_COLORS.length;
    const usedPairs = new Set([...usedSoFar.values()].map(v => `${v.symbol}|${v.color}`));
    const usedPaleShapes = new Set([...usedSoFar.values()].filter(v => isPale(v.color)).map(v => v.symbol));

    for (let attempt = 0; attempt < totalCombos; attempt++) {
        const slot = (hash + attempt) % totalCombos;
        const symbol = symbols[slot % symbols.length];
        const color = SYMBOL_COLORS[Math.floor(slot / symbols.length) % SYMBOL_COLORS.length];

        if (usedPairs.has(`${symbol}|${color}`)) {
            continue;
        }

        if (isPale(color) && usedPaleShapes.has(symbol)) {
            continue;
        }

        return { symbol, color };
    }

    // Every combo already taken elsewhere in this display - not reachable in practice for a real
    // Minecraft recipe (max 4 distinct ingredients against dozens of combos), kept only so this
    // always returns something rather than needing a caller-side null check.
    const slot = hash % totalCombos;

    return {
        symbol: symbols[slot % symbols.length],
        color: SYMBOL_COLORS[Math.floor(slot / symbols.length) % SYMBOL_COLORS.length],
    };
}

// Combined convenience entry point: a fixed identity if this name has one, otherwise a deterministic
// hashed one that avoids colliding with `usedSoFar`. Most callers building a single-pass display
// (no fixed-identities-first ordering requirement) can just call this directly per item; a caller
// that needs the two-pass ordering resolveFixedSymbol's own doc comment describes (resolve every
// fixed identity first, independent of processing order, before any hash runs) should call
// resolveFixedSymbol and resolveHashedSymbol separately instead, the way this function is defined.
//
// One real, partial exception: a spawn egg name (see SPAWN_EGG_SHAPE, itemSymbols.ts) gets a
// known, honest shape even though there's no real per-mob colour source to make it a full fixed
// identity - the hash pool is restricted to that one shape so resolveHashedSymbol effectively
// becomes a colour-only picker, still deterministic and still collision-avoiding against
// `usedSoFar`, just never landing on a different glyph the way an unrecognised name would.
export function resolveItemSymbol(name: string, usedSoFar: Map<string, ItemSymbol>): ItemSymbol {
    const fixed = resolveFixedSymbol(name);
    if (fixed) {
        return fixed;
    }

    const canonical = canonicalizeName(name);
    if (canonical.endsWith(' spawn egg')) {
        return resolveHashedSymbol(canonical, usedSoFar, [SPAWN_EGG_SHAPE]);
    }

    return resolveHashedSymbol(canonical, usedSoFar);
}
