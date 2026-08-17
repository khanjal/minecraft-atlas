# minecraft-atlas

[![CI](https://github.com/khanjal/minecraft-atlas/actions/workflows/ci.yml/badge.svg)](https://github.com/khanjal/minecraft-atlas/actions/workflows/ci.yml)

Merged, versioned Minecraft data — items, entities, recipes, effects, enchantments, blocks,
biomes, structures, for both Java and Bedrock Edition — assembled from official/community upstream
sources instead of hand-vendored, plus a curated overlay for the parts no public source has.

## Status

Java is fully implemented and in real use, not just internally consistent - Data Converter (the
Craft Helper Alexa skill's build pipeline) depends on this directly and generates its actual
recipe/item data through it as of 2026-08-16, replacing ~1,500 hand-vendored recipe files per
version. Also verified standalone by `npm install`-ing this into a scratch project from a local
path and calling it via `require('minecraft-atlas')`:

```js
const { buildSnapshot, buildBedrockRecipes, buildBedrockEntities } = require('minecraft-atlas');
const snapshot = await buildSnapshot('26.1');            // Java: items, entities, effects, ...
const bedrockRecipes = await buildBedrockRecipes('v1.26.40.05');  // Bedrock: recipes, see below
const bedrockEntities = await buildBedrockEntities('v1.26.40.05'); // Bedrock: entities, see below
```

- `npm run generate -- 26.1` — the real Java entry point (`buildSnapshot`), one combined
  `data/java/26.1/snapshot.json`: 1,506 items, 157 entities, 40 effects, 43 enchantments, 1,168
  blocks, 65 biomes, **34 of 34 real structures**, 1,514 of 1,515 recipes (every type except one
  deliberately deferred case — see below).
- `npm run generate:bedrock-recipes -- v1.26.40.05` — Bedrock recipes only (`buildBedrockRecipes`),
  `data/bedrock/v1.26.40.05/recipes.json`: **all 1,756 of 1,756** recipes that exist for that
  version - full coverage, better than Java's, since Bedrock's format turned out simpler once
  investigated for real.
- `npm run generate:bedrock-entities -- v1.26.40.05` — Bedrock entities only
  (`buildBedrockEntities`), `data/bedrock/v1.26.40.05/entities.json`: all 127 of 127 entity files
  parse, but this is a real, honest downgrade from Java's entity coverage rather than a parallel
  win - see "Bedrock Edition" below for what's actually extractable from a behavior-pack entity
  definition versus a flat catalog row. Items/effects/enchantments still aren't covered for
  Bedrock - see "Bedrock Edition" below for why.
- `merge/overlay.ts` and `diff/coverageReport.ts` take a consumer's own curated data as a
  parameter rather than reading any specific file (see "Curated data" below). Sanity-checked
  against Craft Helper's actual sheet snapshot (not part of this repo, run locally, not
  committed): 274 items in minecraft-data 26.1 have no matching sheet entry, and the rename
  heuristic correctly separates 21 real Mojang renames ("Iron Block" -> "Block of Iron", etc.)
  from 253 genuinely new items - consistent with the gap this project's investigation surfaced in
  the first place.

### Tests

`npm test` runs 108 tests (Node's built-in test runner, `src/**/*.test.ts`) in ~3s, fully offline.
Every parser (`items`/`entities`/`effects`/`enchantments`/`blocks`/`biomes`/`structures`, both Java
and Bedrock `recipes`, Bedrock `entities`, `tags`) has real fixture-based coverage now, not just the
generic `match`/`overlay`/`coverageReport` utility layer - every fixture is real JSON fetched and verified
against the live source during development, not fabricated. Tag resolution (`tags.ts`, and any Java
recipe test that needs one) is tested by mocking `fetchTag` at the module boundary rather than the
network, including a regression test for the shorthand-tag-reference bug found and fixed earlier
(`#planks` with no explicit namespace) and a cache-hit-count test. `util/jsonc.ts` (the comment
stripper Bedrock entities need, see below) has its own tests for the case that matters most: a `//`
that appears inside a real string value must not be treated as a comment. Before this, every parser
was only ever verified via live network calls against real data during development - real
confidence, but slow, network-dependent, and nothing a CI run could rely on. GitHub Actions
(`.github/workflows/ci.yml`) now runs `tsc --noEmit`, `npm test`, and `npm run build` on every push
and pull request against master, on Node 18/20/22, since the fully-offline suite makes that cheap
and fast to actually gate on.

## Why

[Craft Helper](../Craft%20Helper) (an Alexa skill) and its [Data Converter](../Data%20Converter)
pipeline currently hand-vendor raw per-version Minecraft data (e.g. ~1,500 individual recipe JSON
files per version, checked into the repo and updated manually on every release) and hand-maintain
item/entity naming data in a Google Sheet. Both halves have real, publicly-maintained upstream
equivalents:

- [PrismarineJS/minecraft-data](https://github.com/PrismarineJS/minecraft-data) — Java items,
  entities, effects, enchantments, pre-shaped and kept current.
- [misode/mcmeta](https://github.com/misode/mcmeta) — the Java vanilla data pack (recipes, tags,
  etc.) in Mojang's native per-version format, auto-generated and tagged per release including the
  current 26.x scheme.
- [Mojang/bedrock-samples](https://github.com/Mojang/bedrock-samples) — Mojang's own official
  vanilla behavior pack, including Bedrock's recipes in its native per-version format. Unlike the
  two above, this is Mojang's own repo, not a third party's processed mirror.

Neither source has the curated layer that makes Craft Helper's answers useful — synonyms, plurals,
predecessor/counterpart naming across editions, breeding/taming/farming tips. That stays
hand-maintained; this project is about not hand-maintaining the raw game data underneath it.

## Structure

```
src/
  index.ts            the public API - only what's exported here is a stability guarantee [done]
  models/
    item.model.ts, entity.model.ts, effect.model.ts, enchantment.model.ts,
    recipe.model.ts, ingredient.model.ts, block.model.ts, biome.model.ts,
    structure.model.ts, curated-record.model.ts, snapshot.model.ts
                        one interface per file, matching Data Converter's models/minecraft/*.model.ts
                        naming convention - the ONE shared layer both editions produce the same
                        shape into, so a consumer works with one Recipe/Item/etc. type regardless
                        of which edition it came from. Everything edition-specific lives under
                        sources/ and transform/'s own java/ and bedrock/ subfolders below.
  sources/
    java/
      minecraft-data/  wraps PrismarineJS/minecraft-data — items, entities, effects, enchantments [done]
      mcmeta/           wraps misode/mcmeta's {version}-data tag — recipe files + tag definitions [done]
    bedrock/
      bedrock-samples/  wraps Mojang/bedrock-samples' {tag} — recipe + entity files [done]
  util/
    jsonc.ts            string-aware `//` comment stripper - ~40% of bedrock-samples' entity
                        files are JSONC despite the .json extension [done]
  transform/
    java/
      items.ts          minecraft-data item -> Item [done]
      entities.ts        minecraft-data entity -> Entity [done]
      effects.ts          minecraft-data effect -> Effect, incl. its PascalCase id fix-up [done]
      enchantments.ts      minecraft-data enchantment -> Enchantment [done]
      blocks.ts             minecraft-data block -> Block, resolving drops/harvestTools'
                            numeric item ids into real item ids by joining against items.json [done]
      biomes.ts               minecraft-data biome -> Biome, incl. packed-int color -> hex [done]
      structures.ts             mcmeta worldgen/structure -> Structure, resolving each real
                                "biomes" tag to concrete biome ids via resolveBiomeTag [done]
      recipes.ts          parses every mcmeta recipe type except one deferred case [done]
      tags.ts              resolves #minecraft:x tags (items) and worldgen/biome tags
                           (structures) to concrete ids, recursively [done]
    bedrock/
      recipes.ts          parses every bedrock-samples recipe type - full coverage [done]
      entities.ts          parses every bedrock-samples entity file - id/category/family/
                           width/height only, no displayName (genuinely unavailable) [done]
  display/
    itemSymbols.ts        hand-picked symbol+colour identity (~180 items/blocks, ported from Craft
                          Helper) plus real family tables: dye, copper-oxidation, potion-effect,
                          ore-mineral, coral-type, wood-species/leaf, tool-material-tier,
                          stone/mineral-material, and the "Block of X" Mojang-rename aliases [done]
    resolveItemSymbol.ts   resolveItemSymbol(name, usedSoFar) - reserved match, then each colour
                          family in turn, then a deterministic name-derived hash fallback that
                          avoids colliding with what's already assigned - see "Item/block/entity
                          display symbols" below for the real ~66% coverage this achieves [done]
    entitySymbols.ts       real category->colour tables for Java's minecraft-data `type` field and
                          Bedrock's `spawn_category`/`family` fields [done]
    resolveEntitySymbol.ts  resolveEntitySymbol(entity, usedSoFar) - same fixed-then-hash shape as
                          items, matched on structured category fields instead of a name [done]
    biomeSymbols.ts        category->shape groupings only - a biome's colour is already 100% real
                          and unique (Biome.color), nothing to hash [done]
    resolveBiomeSymbol.ts   resolveBiomeSymbol(biome) - always returns the biome's own real colour,
                          paired with a category shape; never falls back to a hash [done]
    structureSymbols.ts     hand-curated symbol+colour for every one of the 34 real structures -
                          small enough to cover every single one directly, no family/hash needed [done]
    resolveStructureSymbol.ts  resolveStructureFixedSymbol(structure) - 100% real coverage today;
                          resolveStructureSymbol adds a hash fallback only for forward-compatibility
                          with a structure a future Minecraft version might add [done]
  merge/
    overlay.ts           joins a consumer's curated records onto base-layer records by name [done]
  diff/
    coverageReport.ts     flags base-layer records with no curated match, with a rename-vs-new
                          heuristic - see "Curated data" below [done]
  schema/
    public.ts             buildSnapshot(version) - bundles every java/ transform module into one
                          Snapshot { schemaVersion, minecraftVersion, generatedAt, items,
                          entities, effects, enchantments, recipes, blocks, biomes }. Java only -
                          see "Bedrock Edition" below for why there's no Bedrock snapshot yet [done]
scripts/
  generate.ts               `npm run generate -- <version>` — the real Java entry point, one
                            data/java/<version>/snapshot.json via buildSnapshot()
  generateRecipes.ts         `npm run generate:recipes -- <version>` — Java recipes only, for
                            debugging that module in isolation
  generateBase.ts             `npm run generate:base -- <version>` — Java items/entities/effects/
                            enchantments/blocks/biomes only, same reason
  generateBedrockRecipes.ts    `npm run generate:bedrock-recipes -- <tag>` — Bedrock recipes,
                            data/bedrock/<tag>/recipes.json (all data/ output gitignored)
```

### Java recipe type coverage

`transform/java/recipes.ts` covers every recipe type that exists in mcmeta's 26.1 data pack (enumerated and
counted directly, not assumed) except one:

- **crafting_special_firework_star** is deliberately deferred. Real Minecraft's firework star
  recipe has required ingredients (dye, fuel) *and* independently optional ones (trail, twinkle)
  *and* a set of mutually-exclusive alternative "shape" ingredients (pick at most one of
  burst/creeper/large_ball/star). Flattening that into the same flat ingredient list every other
  type uses would misreport an optional ingredient as required - it needs its own shape in the
  type system before it can be modeled honestly, rather than a fast but wrong port.
- **brewing** isn't covered on Java specifically because there's no structured source for it -
  no recipe JSON file lists "potion of X + ingredient -> potion of Y", so the original Data
  Converter pipeline hand-authored a static potion table instead of parsing one. (Bedrock's format
  turns out to have this data-driven after all - see "Bedrock Edition" below.)

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

### Recipe result effects

A recipe's `result` can carry real gameplay data beyond "which item, how many": Mojang's data
components system lets a recipe declare, say, what status effect the crafted item confers. Found
by inspecting the real recipe files, not assumed - every `suspicious_stew_from_*.json` (all 17)
declares `result.components["minecraft:suspicious_stew_effects"]`, an array of `{id, duration}`,
verified against known real effects across 5 different flowers (dandelion -> saturation,
wither_rose -> wither, torchflower -> night vision, azure_bluet/open_eyeblossom -> blindness).
`Recipe.result.effects` (`RecipeResultEffect[]`, ids namespaced the same way `Effect.id` is, so a
consumer can join straight against the effects catalog) captures this - not hardcoded to
suspicious stew specifically, any recipe using that same component key is picked up the same way,
though suspicious stew is the only case actually confirmed to use it as of 26.1. Previously
discarded entirely: this is genuinely new data no part of the old pipeline (vendored files or the
custom `suspicious_stew.json` override some of it used) ever exposed at all - it can't be, since
the old pipeline's `crafting_special_suspiciousstew` type was one generic "any flower" recipe with
no way to represent 17 different effects on a single recipe in the first place.

### Grid-ready shaped ingredients, and named slots for small fixed-ingredient types

`Ingredient.symbol` carries a shaped recipe's own pattern-grid key (e.g. `"#"` in
`["# #", "###"]`) - needed by any consumer rendering an actual crafting-grid UI, which has to
place each ingredient in the right cell, not just list them. Found to be a real gap while scoping
Craft Helper's own recipe-grid screen against this data: it was being computed internally (to work
out ingredient quantity) and then discarded rather than kept on the output.

`Recipe.template`/`.base`/`.addition` are named convenience slots (`Ingredient`, not plain
strings) for the recipe types that always have a small, fixed set of named ingredients rather than
an open list: `smithing_transform`/`smithing_trim` (all three), `crafting_transmute`/
`crafting_dye`/`crafting_imbue` (base/addition only). They duplicate what's already in
`ingredients` - not a new source of truth, just named instead of positional, so a consumer doesn't
have to know "index 2 means addition for this specific type." Kept as full `Ingredient` objects
rather than flattened to a name: checked first whether that would lose anything, and it would -
every one of `smithing_transform`'s 12 real recipes has a tag (not a plain item) in its `addition`
slot (`netherite_tool_materials`), which a plain string couldn't represent.

### Bedrock Edition

Recipes and entities, on purpose - not a first pass at "everything," a deliberate scope limit after
checking what's actually reliably available:

- **minecraft-data has no Bedrock items/entities/effects/enchantments catalog at all.** Checked
  directly: `data/bedrock/<version>/` only contains `protocol.json` and `version.json`; the real
  catalogs live in `data/pc/` (Java) only. minecraft-data's Bedrock coverage is protocol-level data
  for bot/proxy authors, not a game-content catalog.
- **bedrock-samples' `items/` folder isn't a full catalog either** - checked directly: 77 files,
  all food items, spear examples, and bundles, missing basic vanilla items like diamond or
  iron_ingot entirely. It's an example set for behavior-pack tutorials, not the vanilla registry.
  Still not covered.

#### Entities: real coverage, but a genuine downgrade from Java's

`behavior_pack/entities/` (127 files, includes zombie/cow/axolotl) turned out to be a real,
different schema from Java's flat `entities.json` catalog row: each file is a component-based
*behavior* definition (AI priorities, breeding items, attack damage, ...), not a data record. It
was never designed to answer "what is this called and how big is it," which is all
`buildBedrockEntities` asks of it - so this is an honest downgrade, not a parallel win the way
recipes turned out to be:

- **`displayName` is genuinely unavailable, on all 127 files.** A behavior pack carries no
  human-readable name at all; that only exists in a resource pack's lang file
  (`entity.minecraft:cow.name=Cow`), a separate, unmerged source. Left `undefined` rather than
  guessed from the id.
- **No single field maps to Java's `type`.** The closest analog, `minecraft:type_family`'s
  `family` list (e.g. cow: `["cow", "mob"]`), is a different shape (a list, not one value) and a
  different vocabulary - kept as its own `Entity.family` field rather than forced into `type`.
  Absent on 30/127 entities (mostly non-mob entities like `xp_orb`, `area_effect_cloud`).
- **`category` (`description.spawn_category`) and `width`/`height`
  (`minecraft:collision_box`) are both real but each absent on part of the set** - `category` on
  20/127 (mostly non-spawnable entities like `arrow`, `boat`), collision box on 10/127
  (`area_effect_cloud`, `lightning_bolt`, `ominous_item_spawner`, `shulker`, ...). Left
  `undefined` rather than defaulted.
- **~40% of files (51/127) are JSONC, not strict JSON**, despite the `.json` extension - real
  `//` line comments (e.g. `armadillo.json`, `zombie.json`), found by `JSON.parse` failing outright
  on them. `util/jsonc.ts`'s `stripJsonComments` handles this: a small string-aware stripper (walks
  the text tracking whether it's inside a quoted value, including escaped quotes) rather than a
  regex that would corrupt a string value that happens to contain `//` itself. No block comments
  (`/* */`) were found in the survey, so only `//` is handled. Recipes never needed this - all
  1,756 parse with plain `JSON.parse` - so it's a separate `fetchJsonc` rather than changing the
  well-tested recipe fetch path.
- **There is no `item.json`** (or any single file for the generic dropped-item entity) - not a
  fetch gap, the file genuinely doesn't exist in the repo.

Recipes are different: `behavior_pack/recipes/` really is the complete, official set - **1,756 of
1,756 recipe files parse successfully**, better coverage than Java achieves, once the actual format
was worked out (my first read of the directory listing said 1,000 files - that number came from
GitHub's `contents` API, which silently truncates large directories at 1,000 entries undocumented;
`listFiles`'s git-tree-based approach doesn't have that limit and found the real count).

Bedrock's recipe format covers seven real types (`minecraft:recipe_shaped`, `_shapeless`,
`_furnace`, `_brewing_mix`, `_brewing_container`, `_smithing_transform`, `_smithing_trim`) - richer
than expected on two fronts:

- **Brewing is data-driven on Bedrock** (`recipe_brewing_mix`/`_brewing_container`, 72 recipes
  total) even though it isn't on Java - closing, for this edition, the exact gap documented as
  out-of-scope for Java above.
- **Furnace recipes carry their own station list** (`furnace`/`smoker`/`campfire`/`soul_campfire`)
  in one recipe rather than Java's four separate types - this is what `Recipe.stations` (added to
  the shared model) exists for; Java doesn't populate it since `type` already encodes the same
  distinction there.

Two honest limitations, found by testing against real data rather than assumed from the format
before checking:

- **No tag-definition source exists for Bedrock.** mcmeta publishes Java's tag definitions, so
  `#minecraft:planks` resolves to real item ids; Mojang/bedrock-samples has no equivalent
  `tags/item/*.json` (confirmed by searching the whole repo tree). A Bedrock tag reference like
  `{"tag": "minecraft:coals"}` (real, from `fire_charge.json`) is represented as
  `{ type: 'tag', id: 'minecraft:coals', items: [] }` - the tag id is preserved, the expansion
  genuinely can't be produced from any public source.
- **A recipe's `result` can be an array, not just one object** - e.g. `cake` also returns the 3
  emptied milk buckets used to make it. Only the first (the actual product) is kept; the
  simplification is documented in code rather than silently dropping the rest unremarked.

### Blocks and biomes

`blocks.json`'s `drops` and `harvestTools` reference items purely by number (`stone`'s
`drops: [35]`) - checked whether that's really items.json's own id space before assuming it, by
looking up id 35 there directly: it's `cobblestone`. Confirmed correct, so `buildBlocks` fetches
`items.json` alongside `blocks.json` and resolves both fields into real item ids (`stone.drops` ->
`["minecraft:cobblestone"]`, `stone.harvestTools` -> all 7 pickaxe tiers by name) rather than
leaving them as bare numbers a consumer would have to resolve themselves.

Biomes needed one small conversion: minecraft-data stores each biome's tint as a packed decimal
RGB int (`7254527`), converted here to the hex string (`"#6eb1ff"`) anyone actually wants.

### Structures

A new data type, not just an extension of an existing one - real, previously-untouched public data
from `misode/mcmeta`'s `data/minecraft/worldgen/structure/*.json`, the same real Java data pack
format `recipes.ts` already reads, just a different folder. Genuinely distinct from Craft Helper's
own hand-maintained "Thing" catalog (which has synonyms/plurals/parent-room/generates fields -
curated naming data, the same kind that stays out of this repo everywhere else), even though the
two overlap in subject matter: this is Mojang's own raw structure-generation data, not a curated
list of what to call things.

Verified against the real 26.1 data pack: **34 of 34 real structure definitions parse**, each with
a genuine `type` (`minecraft:mineshaft`, `minecraft:jigsaw` for the template-pool-driven ones like
villages, `minecraft:stronghold`, ...) and `step` (`surface_structures`/`underground_structures`/
`underground_decoration`) field - no format quirks found, unlike most of the other real sources
this project reads.

The one real design decision: a structure's `biomes` field is itself a tag reference (e.g.
`"#minecraft:has_structure/village_plains"`), in a *different* real Mojang tag registry than
recipe ingredient tags (`tags/worldgen/biome/*.json`, not `tags/item/*.json`) but the exact same
recursive shape (`{values: [...]}`, tags can reference other tags via a `#` prefix). Rather than
leaving this unresolved the way Bedrock's recipe tags stay (no public definition source exists for
those - see "Bedrock Edition" below), this one *does* have a real, fetchable definition, so
`resolveBiomeTag` (`transform/java/tags.ts`) resolves it the same way `resolveTag` already resolves
item tags - verified live: `mineshaft`'s tag expands to 49 concrete biome ids, matching its real
in-game "almost anywhere underground" spawn behaviour.

A real bug surfaced while building this and fixed before it shipped: an earlier version tried to
share the recursive tag-resolution logic between `resolveTag` and `resolveBiomeTag` via a factory
function parameterized on which fetch to call, passed as a captured argument. That broke the
existing test suite's `t.mock.method` mocking outright (`fetchTag`'s real 404s started leaking
through) - `t.mock.method` replaces the *module's* exported function at test time, but a value
already captured as a factory argument at module-load time doesn't see that later replacement; only
a direct call site inside the function body (`fetchTag(...)`, re-read fresh on every invocation)
does. Reverted to two independent, textually similar functions rather than a shared abstraction -
duplication that stays correctly testable beats a DRY refactor that silently breaks mocking.

Symbol/colour coverage for structures is unconditionally 100% real, not a family system or a hash
fallback: the whole catalog is only 34 structures, small enough to hand-curate every single one
directly (`display/structureSymbols.ts`) the same way the original ~180-entry item list does, with
real thematic colours (ocean monument reuses prismarine's own colour, desert pyramid reuses
sandstone's, trial chambers reuses copper's, ruined portals reuse obsidian's, ...) rather than
arbitrary ones.

### One data-quality fix along the way

minecraft-data's `effects.json` stores its own `name` field as PascalCase ("MiningFatigue",
"NightVision", "DolphinsGrace") rather than the real snake_case registry id every other file uses
("minecraft:mining_fatigue") - items, entities, and enchantments don't have this quirk, only
effects. `transform/effects.ts` converts it rather than carrying the PascalCase form through, so
every id this project produces is the real, namespaced Mojang id, consistently.

### Curated data

`merge/overlay.ts` and `diff/coverageReport.ts` don't read Craft Helper's sheet (or any specific
file) directly - that data is private and Craft-Helper-specific, which has no place baked into a
public, MIT-licensed repo. Both are generic functions typed against `CuratedRecord`
(`models/curated-record.model.ts`), a minimal `{ name: string }` contract - a consumer supplies
their own curated array (however they source it) plus a `nameOf` function for the base-layer side,
and gets back either a join (`overlay`) or a gap report (`coverageReport`). This settles the
"does the curated overlay ship from this repo" open question from earlier: the *mechanism* does,
here, generically; the *data* (and whatever eventually reads the sheet into that shape) stays
wherever Craft Helper's own pipeline lives.

### Item/block/entity/biome/structure display symbols

`display/` holds real visual-identity data (a symbol+colour per name) - it started as a wholesale
port of Craft Helper's `lambda/helpers/itemSymbols.ts` and `recipeGridHelpers.ts`
([khanjal/Craft-Helper#3](https://github.com/khanjal/Craft-Helper/issues/3)) scoped to what that one
screen needed (~180 items that actually appear as recipe ingredients), then expanded to cover every
data type this project produces - items, blocks, entities, biomes, structures - each a genuinely
different shape of problem, described honestly below rather than overclaimed:

- **Items/blocks**: real, verified family rules covering ~66% of the catalog (below), hash fallback
  for the rest.
- **Entities**: matched by real category field, not name (below).
- **Biomes**: already 100% real - `Biome.color` is Mojang's own tint, unique per biome; only a
  category shape needed adding.
- **Structures**: only 34 real structures total, small enough to hand-curate every single one
  directly - unconditionally 100% real coverage, see "Structures" above.

**What "full catalog coverage" actually means at this scale.** The original ~180-entry
`RESERVED_SYMBOLS` list works because every entry has something real to check it against: does this
item collide with another reserved item in an actual recipe. Only ~250-300 names ever appear as a
recipe ingredient at all. Java 26.1's real item+block catalog is 1,590 unique names; adding entities
brings the real total past 1,850. Writing individually-verified, collision-checked reasoning for
every one of those - the way each `RESERVED_SYMBOLS` entry has - isn't achievable honestly at that
scale: most of these names never appear together anywhere, so there's no real collision to verify
against, and inventing one per item would be fabrication, not curation. So this expansion is a
**family system**, not a bigger flat list: real, verified shared-substance/category rules (the same
pattern the original port already used for dye/copper/potion families), applied broadly:

- **Item/block families added**: full 16-colour coverage for concrete, concrete powder, glazed
  terracotta, candle, shulker box, and bundle (the last two were genuinely missing from the original
  port, found while auditing coverage - `bundle` in particular was a real gap, not a deliberate
  exclusion). An ore family (18 names: coal/copper/diamond/emerald/gold/iron/lapis/redstone/quartz,
  each stone- or deepslate-muted from that mineral's own reserved colour). A coral family (40 names:
  5 real types x plant/block/fan forms, alive and bleached-grey dead). A wood-form family covering
  every real per-species form beyond planks/log/boat (leaves, signs, doors, fences, buttons,
  pressure plates, saplings, shelves, and each nether-wood/bamboo species' own real form set -
  fungus/roots/hyphae/nylium for crimson/warped, mosaic/shoot/raft for bamboo - real per-species
  wood and foliage tones, not the same "planks" identity for every species this system used before).
  A tool/armour material-tier family (wooden/stone/leather/chainmail/iron/copper/golden/netherite -
  diamond excluded, already covered per-piece). A "Block of X" alias table for Mojang's real rename
  (confirmed live: minecraft-data's current `displayName` says "Block of Iron", not "Iron Block" -
  Craft Helper's own cleaned pipeline still emits the pre-rename order, which is why
  `RESERVED_SYMBOLS` kept the old keys, but a consumer working from this project's own unprocessed
  `Item.displayName` needs both forms to resolve to the same identity). A stone/mineral family
  (168 real names across slab/stairs/wall for ~35 base materials, plus the 12 real "chiseled/
  cracked/infested X bricks" names as direct aliases) - reuses each base material's own existing
  colour the same way the ore/wood families do, and deliberately gives slab a *different* shape
  from plank's own square: an earlier version shared the shape and a real collision was found (two
  actual recipes, `barrel` and `chiseled bookshelf`, use planks and a wooden-slab tag as separate
  ingredients of the same species) - see the verification note below.
- **A real bug found and fixed along the way**: the wood-species boat fold only matched
  `name.endsWith('boat')`, silently missing every real "X boat with chest" name (9 across all wood
  species use exactly that phrasing, not "X chest boat" as the original comment assumed) - the fold
  now strips a trailing " with chest" first.
- **Entities**: a different shape of problem again - matched by real category field
  (`resolveEntitySymbol`/`resolveEntityFixedSymbol`, `display/resolveEntitySymbol.ts`), not by name,
  since there's no per-entity equivalent of "hand-verify against a real recipe collision" and ~300
  entities is too many to fabricate individual colours for. Java's real `type` field and Bedrock's
  real `spawn_category`/`family` fields each get a genuine, verified mapping (hostile -> red,
  animal/passive/creature -> green, water_creature -> blue, ambient -> pale, projectile -> the
  arrow item's own reserved grey, player -> gold). Two later, narrower additions once "other"/"misc"
  were looked at more closely: Java's real "mob" type value is a genuine catch-all (10 entries) but,
  unlike "other" (46 entries, genuinely heterogeneous), small and coherent enough to hand-curate
  every one directly by id (`JAVA_ENTITY_MOB_COLORS`) the same way `STRUCTURE_COLORS` covers all 34
  structures - several reuse an existing reserved item colour outright (copper golem -> copper
  ingot's colour, iron golem -> iron ingot's, slime/magma cube -> slime ball's). Bedrock's real
  `"inanimate"` family tag (boat/chest_boat/minecart all genuinely carry it) got its own neutral
  colour too. Java's true "other" and Bedrock's "misc" stay unmapped - real, confirmed catch-all
  buckets with no coherent shared identity, not a gap that was missed.
- **The fallback pool itself got wider too**: `DISPLAY_SYMBOLS` grew from 8 to 14 by promoting six
  glyphs (▬▭▮▯◈◐) that were already rendering in production via `RESERVED_SYMBOLS` - zero new
  device-rendering risk, since real recipes already display them today. `SYMBOL_COLORS` doubled from
  8 to 16 (plain hex, no rendering risk at all). Four genuinely new, never-rendered glyphs
  (`PROVISIONAL_DISPLAY_SYMBOLS`: ◉◎⬟⬢) are defined but deliberately excluded from the default pool
  - `resolveHashedSymbol` takes an optional explicit pool parameter for a caller that's confirmed
  they render correctly on their target device; nothing opts in by default.

**Honest, measured results** (checked live against real 26.1 Java data and real v1.26.40.05 Bedrock
data, not estimated): **66.4%** of the real 1,590 unique Java item+block names now resolve through a
real, verified rule rather than the hash fallback (up from ~11% before this session, when only the
original ~180-entry recipe-grid list existed). **70.7%** of Java's 157 real entities and **81.1%** of
Bedrock's 127 real entities resolve through a real category rule. Every biome and every structure
resolves through a real rule unconditionally - see "Structures" above and "Blocks and biomes"
below. Every name still gets *something* either way - `resolveItemSymbol`/`resolveEntitySymbol`
always return a deterministic, collision-avoiding identity via the hash fallback - so "does every
item/block/entity/biome/structure have a symbol and colour" is unconditionally true; "is that
identity a deliberately verified one or a computed one" is true for two-thirds of items/blocks and
roughly three-quarters of entities. Checked whether the shape pool itself needed expanding to cover
these new categories (entities/biomes/structures all reuse it) - it didn't: every one of them fit
comfortably within the existing 14 confirmed shapes via colour-differentiated reuse, the same design
the item families already lean on; `PROVISIONAL_DISPLAY_SYMBOLS`' four new glyphs went unused. What's left in the
hash fallback and wasn't tackled yet, in rough order of size: spawn eggs (93, real per-mob colours
exist in the game but verifying and hand-entering ~90 without a fetchable source wasn't attempted),
pottery sherds (23, each depicts a distinct picture with no shared colour), banner patterns (10,
same reasoning), and a long tail of individually unique blocks/items (anvil, beacon, barrel, ...)
that never shared a family to begin with.

**Verified as a real port, not just a faithful-looking rewrite**, for the original recipe-grid
scope specifically: before touching Craft Helper's code, a snapshot script rendered every one of the
1,139 real, griddable 26.2 recipes' full symbol map, grid, and legend using the original code; after
wiring Craft Helper to consume this module instead, the same script produced **byte-identical
output** across all 1,139 recipes. (Craft Helper hasn't yet been updated to pull in this session's
further expansion - the byte-identical check reflects the initial port only.)

## Open questions

- Whether redistributing Mojang-derived data (especially icons/images) is fine under Mojang's
  usage guidelines — not yet checked.

## License

MIT — see [LICENSE](LICENSE).
