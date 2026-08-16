# minecraft-atlas

Merged, versioned Minecraft data — items, entities, recipes, effects, enchantments — assembled
from two upstream sources instead of hand-vendored, plus a curated overlay for the parts no
public source has.

## Status

Both sources and every `transform/` module are implemented and verified against real 26.1 data:

- `npm run generate:recipes -- 26.1` — 1,514 of 1,515 recipes (every type except one deliberately
  deferred case — see below), tags fully resolved to concrete item lists.
- `npm run generate:base -- 26.1` — 1,506 items, 157 entities, 40 effects, 43 enchantments.

`merge/` and `diff/` (the curated-data join and the coverage-gap report) are still stubs.

## Why

[Craft Helper](../Craft%20Helper) (an Alexa skill) and its [Data Converter](../Data%20Converter)
pipeline currently hand-vendor raw per-version Minecraft data (e.g. ~1,500 individual recipe JSON
files per version, checked into the repo and updated manually on every release) and hand-maintain
item/entity naming data in a Google Sheet. Both halves have real, publicly-maintained upstream
equivalents:

- [PrismarineJS/minecraft-data](https://github.com/PrismarineJS/minecraft-data) — items, entities,
  effects, enchantments, pre-shaped and kept current across Java and Bedrock versions.
- [misode/mcmeta](https://github.com/misode/mcmeta) — the vanilla data pack (recipes, tags, etc.)
  in Mojang's native per-version format, auto-generated and tagged per release including the
  current 26.x scheme.

Neither source has the curated layer that makes Craft Helper's answers useful — synonyms, plurals,
predecessor/counterpart naming across editions, breeding/taming/farming tips. That stays
hand-maintained; this project is about not hand-maintaining the raw game data underneath it.

## Structure

```
src/
  sources/
    minecraft-data/   wraps PrismarineJS/minecraft-data — items, entities, effects, enchantments [done]
    mcmeta/            wraps misode/mcmeta's {version}-data tag — recipe files + tag definitions [done]
  transform/
    items.ts           minecraft-data item -> ParsedItem [done]
    entities.ts         minecraft-data entity -> ParsedEntity [done]
    effects.ts           minecraft-data effect -> ParsedEffect, incl. its PascalCase id fix-up [done]
    enchantments.ts       minecraft-data enchantment -> ParsedEnchantment [done]
    recipes.ts           parses every mcmeta recipe type except one deferred case [done]
    tags.ts               resolves #minecraft:x tags to concrete item ids, recursively [done]
  merge/
    overlay.ts           joins curated data (synonyms, tips, breeding/taming, ...) onto the base layer
  diff/
    coverageReport.ts     flags base-layer items/entities with no match in the curated data —
                          catches renames and new items the curated layer hasn't picked up yet
  schema/
    public.ts             the stable versioned output shape actually published
scripts/
  generateRecipes.ts       `npm run generate:recipes -- <version>` — recipes, one file per version
  generateBase.ts           `npm run generate:base -- <version>` — items/entities/effects/enchantments
                            (both write into data/<version>/, gitignored)
```

### Recipe type coverage

`recipes.ts` covers every recipe type that exists in mcmeta's 26.1 data pack (enumerated and
counted directly, not assumed) except one:

- **crafting_special_firework_star** is deliberately deferred. Real Minecraft's firework star
  recipe has required ingredients (dye, fuel) *and* independently optional ones (trail, twinkle)
  *and* a set of mutually-exclusive alternative "shape" ingredients (pick at most one of
  burst/creeper/large_ball/star). Flattening that into the same flat ingredient list every other
  type uses would misreport an optional ingredient as required - it needs its own shape in the
  type system before it can be modeled honestly, rather than a fast but wrong port.
- **brewing** isn't covered because there's no structured source for it at all - no recipe JSON
  file lists "potion of X + ingredient -> potion of Y", so the original Data Converter pipeline
  hand-authored a static potion table instead of parsing one. That's curated content, not a
  parse-a-source problem, so it belongs in `merge/` against a real potion-effect list, not here.

Several of the "special" crafting types (bannerduplicate, bookcloning, decorated_pot,
firework_rocket, firework_star_fade, mapextending, shielddecoration) turned out to carry real,
well-structured ingredient fields in the current game format - the original `recipe.helpers.ts`'s
comments assumed several of these had nothing to extract, which was true when that code was
written but isn't anymore. Verified by fetching and reading the real mcmeta files rather than
trusting the old comments. `crafting_transmute`, `crafting_dye`, and `crafting_imbue` (all 1.21.2+
additions) are covered too - `crafting_dye` now includes the actual dye ingredient, which the old
pipeline had no field access to at all and silently dropped.

Tag ingredients resolve to their real, recursively-expanded item list via mcmeta's own tag
definitions — e.g. a smithing trim's "any armor piece" resolves to all 29 concrete armor items, a
decorated pot's four sherd slots each resolve to the real 24-item sherd+brick tag. The old Data
Converter pipeline couldn't do this: it kept a tag ingredient as a bare name and depended on a
later join against the curated sheet's per-item `groups` field to find matches, so this is a real
capability gain, not just a port.

### One data-quality fix along the way

minecraft-data's `effects.json` stores its own `name` field as PascalCase ("MiningFatigue",
"NightVision", "DolphinsGrace") rather than the real snake_case registry id every other file uses
("minecraft:mining_fatigue") - items, entities, and enchantments don't have this quirk, only
effects. `transform/effects.ts` converts it rather than carrying the PascalCase form through, so
every id this project produces is the real, namespaced Mojang id, consistently.

## Open questions

- Whether redistributing Mojang-derived data (especially icons/images) is fine under Mojang's
  usage guidelines — not yet checked.
- Whether the curated overlay (`merge/`) ships from this repo or a separate one, since it's the
  Craft-Helper-specific part and the rest above it is general-purpose.

## License

MIT — see [LICENSE](LICENSE).
