# minecraft-atlas

Merged, versioned Minecraft data — items, entities, recipes, effects, enchantments — assembled
from two upstream sources instead of hand-vendored, plus a curated overlay for the parts no
public source has.

## Status

`sources/mcmeta` and `transform/{recipes,tags}` are implemented and verified against real data:
`npm run generate:recipes -- 26.1` fetches and parses all ~1,450 crafting/smelting/stonecutting/
smithing recipes for that version directly from mcmeta, with tags fully resolved to concrete item
lists (not just the tag's own name — see Structure below). Everything else is still a stub.

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
    minecraft-data/   wraps PrismarineJS/minecraft-data — items, entities, effects, enchantments
    mcmeta/            wraps misode/mcmeta's {version}-data tag — recipe files + tag definitions [done]
  transform/
    items.ts           minecraft-data item -> base Item shape
    entities.ts         minecraft-data entity -> base Entity shape
    recipes.ts           parses shaped/shapeless/smelting-family/stonecutting/smithing recipes [done]
    tags.ts               resolves #minecraft:x tags to concrete item ids, recursively [done]
  merge/
    overlay.ts           joins curated data (synonyms, tips, breeding/taming, ...) onto the base layer
  diff/
    coverageReport.ts     flags base-layer items/entities with no match in the curated data —
                          catches renames and new items the curated layer hasn't picked up yet
  schema/
    public.ts             the stable versioned output shape actually published
scripts/
  generateRecipes.ts       `npm run generate:recipes -- <version>` — fetches + parses a whole
                            version's recipes, writes data/<version>/recipes.json (gitignored)
```

`recipes.ts` currently covers crafting_shaped, crafting_shapeless, smelting/blasting/smoking/
campfire_cooking, stonecutting, smithing_transform, and smithing_trim. Not yet ported: the
~15 crafting_special_* one-off types (bookcloning, firework_*, shielddecoration, ...),
crafting_transmute, crafting_dye, crafting_imbue, crafting_decorated_pot, and brewing (which isn't
data-pack driven at all, so it needs a different source). Tag ingredients resolve to their real,
recursively-expanded item list via mcmeta's own tag definitions — e.g. a smithing trim's "any
armor piece" resolves to all 29 concrete armor items, not just the tag's name. The old Data
Converter pipeline couldn't do this: it kept a tag ingredient as a bare name and depended on a
later join against the curated sheet's per-item `groups` field to find matches, so this is a real
capability gain, not just a port.

## Open questions

- Whether redistributing Mojang-derived data (especially icons/images) is fine under Mojang's
  usage guidelines — not yet checked.
- Whether the curated overlay (`merge/`) ships from this repo or a separate one, since it's the
  Craft-Helper-specific part and the rest above it is general-purpose.

## License

MIT — see [LICENSE](LICENSE).
