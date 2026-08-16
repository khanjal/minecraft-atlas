# minecraft-atlas

Merged, versioned Minecraft data — items, entities, recipes, effects, enchantments — assembled
from two upstream sources instead of hand-vendored, plus a curated overlay for the parts no
public source has.

## Status

Early scaffold. Structure only — modules are stubs, nothing is implemented yet.

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
    mcmeta/            wraps misode/mcmeta's {version}-data tag — raw recipe files + tag definitions
  transform/
    items.ts           minecraft-data item -> base Item shape
    entities.ts         minecraft-data entity -> base Entity shape
    recipes.ts           recipe parsing, fed by mcmeta instead of vendored files
    tags.ts               resolves #minecraft:x tag references via mcmeta's tags/item/*.json
  merge/
    overlay.ts           joins curated data (synonyms, tips, breeding/taming, ...) onto the base layer
  diff/
    coverageReport.ts     flags base-layer items/entities with no match in the curated data —
                          catches renames and new items the curated layer hasn't picked up yet
  schema/
    public.ts             the stable versioned output shape actually published
```

## Open questions

- Whether redistributing Mojang-derived data (especially icons/images) is fine under Mojang's
  usage guidelines — not yet checked.
- Whether the curated overlay (`merge/`) ships from this repo or a separate one, since it's the
  Craft-Helper-specific part and the rest above it is general-purpose.

## License

MIT — see [LICENSE](LICENSE).
