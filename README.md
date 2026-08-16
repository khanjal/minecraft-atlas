# minecraft-atlas

Merged, versioned Minecraft data — items, entities, recipes, effects, enchantments, blocks,
biomes, for both Java and Bedrock Edition — assembled from official/community upstream sources
instead of hand-vendored, plus a curated overlay for the parts no public source has.

## Status

Java is fully implemented and genuinely consumable, not just internally consistent - verified by
actually `npm install`-ing this into a scratch project from a local path and calling it via
`require('minecraft-atlas')`, the same way a real consumer (e.g. Data Converter) eventually would:

```js
const { buildSnapshot, buildBedrockRecipes } = require('minecraft-atlas');
const snapshot = await buildSnapshot('26.1');            // Java: items, entities, effects, ...
const bedrockRecipes = await buildBedrockRecipes('v1.26.40.05'); // Bedrock: recipes only, see below
```

- `npm run generate -- 26.1` — the real Java entry point (`buildSnapshot`), one combined
  `data/java/26.1/snapshot.json`: 1,506 items, 157 entities, 40 effects, 43 enchantments, 1,168
  blocks, 65 biomes, 1,514 of 1,515 recipes (every type except one deliberately deferred case —
  see below).
- `npm run generate:bedrock-recipes -- v1.26.40.05` — Bedrock recipes only (`buildBedrockRecipes`),
  `data/bedrock/v1.26.40.05/recipes.json`: **all 1,756 of 1,756** recipes that exist for that
  version - full coverage, better than Java's, since Bedrock's format turned out simpler once
  investigated for real. Items/entities/effects/enchantments aren't covered for Bedrock - see
  "Bedrock Edition" below for why.
- `merge/overlay.ts` and `diff/coverageReport.ts` take a consumer's own curated data as a
  parameter rather than reading any specific file (see "Curated data" below) - covered by unit
  tests with small fixtures (`npm test`) rather than a generate script. Sanity-checked against
  Craft Helper's actual sheet snapshot (not part of this repo, run locally, not committed): 274
  items in minecraft-data 26.1 have no matching sheet entry, and the rename heuristic correctly
  separates 21 real Mojang renames ("Iron Block" -> "Block of Iron", etc.) from 253 genuinely new
  items - consistent with the gap this project's investigation surfaced in the first place.

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
    curated-record.model.ts, snapshot.model.ts
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
      bedrock-samples/  wraps Mojang/bedrock-samples' {tag} — recipe files (behavior_pack/recipes/) [done]
  transform/
    java/
      items.ts          minecraft-data item -> Item [done]
      entities.ts        minecraft-data entity -> Entity [done]
      effects.ts          minecraft-data effect -> Effect, incl. its PascalCase id fix-up [done]
      enchantments.ts      minecraft-data enchantment -> Enchantment [done]
      blocks.ts             minecraft-data block -> Block, resolving drops/harvestTools'
                            numeric item ids into real item ids by joining against items.json [done]
      biomes.ts               minecraft-data biome -> Biome, incl. packed-int color -> hex [done]
      recipes.ts          parses every mcmeta recipe type except one deferred case [done]
      tags.ts              resolves #minecraft:x tags to concrete item ids, recursively [done]
    bedrock/
      recipes.ts          parses every bedrock-samples recipe type - full coverage [done]
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

### Bedrock Edition

Recipes only, on purpose - not a first pass at "everything," a deliberate scope limit after
checking what's actually reliably available:

- **minecraft-data has no Bedrock items/entities/effects/enchantments catalog at all.** Checked
  directly: `data/bedrock/<version>/` only contains `protocol.json` and `version.json`; the real
  catalogs live in `data/pc/` (Java) only. minecraft-data's Bedrock coverage is protocol-level data
  for bot/proxy authors, not a game-content catalog.
- **bedrock-samples' `items/` folder isn't a full catalog either** - checked directly: 77 files,
  all food items, spear examples, and bundles, missing basic vanilla items like diamond or
  iron_ingot entirely. It's an example set for behavior-pack tutorials, not the vanilla registry.
  `entities/` (127 files, includes zombie/cow/axolotl) looks more complete but wasn't investigated
  - a real, different schema (component-based behavior definitions, not a flat catalog) that needs
  its own pass rather than a rushed guess at what's extractable from it.

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

## Open questions

- Whether redistributing Mojang-derived data (especially icons/images) is fine under Mojang's
  usage guidelines — not yet checked.

## License

MIT — see [LICENSE](LICENSE).
