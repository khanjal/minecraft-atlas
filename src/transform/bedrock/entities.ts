// Parses Bedrock's entity JSON (Mojang/bedrock-samples' behavior_pack/entities/) into this
// project's shared Entity model. Unlike recipes, this is a real, honest downgrade rather than
// full coverage: a behavior-pack entity file is a component-based behavior definition (AI
// priorities, breeding items, attack damage, ...), not a flat catalog row - it was never designed
// to answer "what is this entity called and how big is it", which is all this project extracts
// from it.
//
// Two genuine format quirks, only found by fetching and parsing all 127 files for real:
//
// - ~40% of files (51/127 at v1.26.40.05, e.g. armadillo.json, zombie.json) use `//` line comments
//   despite the .json extension - real JSONC, not strict JSON. `fetchEntity` handles this via
//   util/jsonc.ts's string-aware stripper rather than failing or silently mis-parsing.
// - There is no "item.json" (or any single file for the generic dropped-item entity) - it isn't a
//   gap in the fetch, the file genuinely doesn't exist in the repo.
//
// What's extractable, and what isn't:
//
// - `id` (description.identifier) - always present, every file.
// - `family` (components["minecraft:type_family"].family) - Bedrock's closest analog to Java's
//   `type`, but a list rather than one value, absent on 30/127 (mostly non-mob entities like
//   xp_orb, area_effect_cloud).
// - `category` (description.spawn_category) - absent on 20/127, mostly non-spawnable entities
//   (arrow, boat, ...) that make sense to lack one.
// - `width`/`height` (components["minecraft:collision_box"]) - absent on 10/127.
// - `displayName` - genuinely unavailable. Bedrock's behavior pack carries no human-readable name
//   at all; that only exists in a resource pack's lang file (entity.minecraft:cow.name=Cow),
//   which is a separate, unmerged source. Left undefined rather than guessed from the id.

import { fetchEntity, listEntityFiles, entityNameFromPath } from '../../sources/bedrock/bedrock-samples';
import { mapWithConcurrency } from '../../util/concurrency';
import { namespaced } from '../../util/id';
import { Entity } from '../../models/entity.model';

export function parseBedrockEntity(raw: any): Entity | null {
    const body = raw['minecraft:entity'];
    if (!body?.description?.identifier) {
        return null;
    }

    const components = body.components || {};
    const collisionBox = components['minecraft:collision_box'];
    const typeFamily = components['minecraft:type_family'];

    return {
        id: namespaced(body.description.identifier),
        category: body.description.spawn_category,
        family: typeFamily?.family,
        width: collisionBox?.width,
        height: collisionBox?.height,
    };
}

export async function buildBedrockEntities(tag: string, concurrency = 16): Promise<Entity[]> {
    const files = await listEntityFiles(tag);
    const names = files.map(entityNameFromPath);
    const parsed = await mapWithConcurrency(names, concurrency, async name => {
        const raw = await fetchEntity(tag, name);
        return parseBedrockEntity(raw);
    });
    return parsed.filter((entity): entity is Entity => entity !== null);
}
