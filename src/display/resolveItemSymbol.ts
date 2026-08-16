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
    COPPER_OXIDATION_COLORS, COPPER_FORMS, POTION_EFFECT_COLORS, POTION_BASE_COLORS,
    PALE_BRIGHTNESS_THRESHOLD,
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
    // shape ("bamboo chest raft" <- [chest, bamboo raft], identical to every "X chest boat").
    if (name.endsWith('boat') || name.endsWith('raft')) {
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

// Single entry point for "this name has a fixed, hand-matched identity" - a single reserved item
// first, then a colour-family match. A caller building a multi-item display should resolve every
// name through this in one pass before any hash runs: a fixed identity never checks for collisions,
// so hash-assignment needs to see the complete fixed set up front to avoid clashing with one
// resolved later in whatever order the caller processes items.
export function resolveFixedSymbol(name: string): ItemSymbol | undefined {
    const canonical = canonicalizeName(name);

    return RESERVED_SYMBOLS[canonical] || getColorFamilyMatch(canonical) || getCopperFamilyMatch(canonical)
        || getPotionFamilyMatch(canonical);
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
export function resolveHashedSymbol(name: string, usedSoFar: Map<string, ItemSymbol>): ItemSymbol {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    }

    const totalCombos = DISPLAY_SYMBOLS.length * SYMBOL_COLORS.length;
    const usedPairs = new Set([...usedSoFar.values()].map(v => `${v.symbol}|${v.color}`));
    const usedPaleShapes = new Set([...usedSoFar.values()].filter(v => isPale(v.color)).map(v => v.symbol));

    for (let attempt = 0; attempt < totalCombos; attempt++) {
        const slot = (hash + attempt) % totalCombos;
        const symbol = DISPLAY_SYMBOLS[slot % DISPLAY_SYMBOLS.length];
        const color = SYMBOL_COLORS[Math.floor(slot / DISPLAY_SYMBOLS.length) % SYMBOL_COLORS.length];

        if (usedPairs.has(`${symbol}|${color}`)) {
            continue;
        }

        if (isPale(color) && usedPaleShapes.has(symbol)) {
            continue;
        }

        return { symbol, color };
    }

    // Every combo already taken elsewhere in this display - not reachable in practice for a real
    // Minecraft recipe (max 4 distinct ingredients against 64 combos), kept only so this always
    // returns something rather than needing a caller-side null check.
    const slot = hash % totalCombos;

    return {
        symbol: DISPLAY_SYMBOLS[slot % DISPLAY_SYMBOLS.length],
        color: SYMBOL_COLORS[Math.floor(slot / DISPLAY_SYMBOLS.length) % SYMBOL_COLORS.length],
    };
}

// Combined convenience entry point: a fixed identity if this name has one, otherwise a deterministic
// hashed one that avoids colliding with `usedSoFar`. Most callers building a single-pass display
// (no fixed-identities-first ordering requirement) can just call this directly per item; a caller
// that needs the two-pass ordering resolveFixedSymbol's own doc comment describes (resolve every
// fixed identity first, independent of processing order, before any hash runs) should call
// resolveFixedSymbol and resolveHashedSymbol separately instead, the way this function is defined.
export function resolveItemSymbol(name: string, usedSoFar: Map<string, ItemSymbol>): ItemSymbol {
    return resolveFixedSymbol(name) ?? resolveHashedSymbol(canonicalizeName(name), usedSoFar);
}
