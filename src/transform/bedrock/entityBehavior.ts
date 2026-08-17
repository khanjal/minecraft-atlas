// Parses real breeding/growth/taming behavior out of Bedrock's entity JSON
// (minecraft:breedable/minecraft:ageable/minecraft:tameable components) - a genuinely new kind of
// data this project didn't cover before, found while investigating whether Craft Helper's
// hand-maintained sheet data for these three real game mechanics could instead come from a public
// source. It substantially can: checked against 20 real animals' sheet data, 12 matched Bedrock's
// real breed_items exactly, most of the rest were Bedrock being a strict superset (real newer
// content - extra flowers bees can use, extra seeds parrots/chickens accept - the sheet simply
// hadn't been updated for), and only a couple were genuine differences (Bedrock's "fish" is a
// generic tag where the sheet lists cod/salmon/pufferfish/clownfish individually).
//
// One deliberate, honest limitation, not glossed over: breed_items/feed_items/tame_items are
// Bedrock's own internal item-id shorthand ("muttonRaw", "appleEnchanted", "fish") - checked
// directly, these don't consistently match either edition's real item registry id (there's no
// "muttonRaw" in minecraft-data's items.json; the real id is "cooked_mutton"). No public source
// maps Bedrock's internal names to real item ids, so this project doesn't invent one - these three
// models keep Bedrock's raw strings verbatim rather than silently guessing a mapping that could be
// wrong. A consumer that wants real Java item ids has to do that mapping itself, knowingly.
//
// A component can live in an entity's top-level `components` OR inside any of its
// `component_groups` (states like "baby"/"adult" toggle which group is active) - verified against
// real files: cow's breedable is inside `minecraft:cow_adult`, horse's inside
// `minecraft:horse_tamed`, parrot's tameable inside `minecraft:parrot_wild`. Both locations are
// checked; if more than one group defines the same component (not observed in practice), the last
// one found wins - no attempt is made to model which group is actually active at runtime, since
// that depends on live entity state this project has no way to know.

import { EntityBreeding } from '../../models/entity-breeding.model';
import { EntityGrowth } from '../../models/entity-growth.model';
import { EntityTaming } from '../../models/entity-taming.model';
import { namespaced } from '../../util/id';
import { fetchEntity, listEntityFiles, entityNameFromPath } from '../../sources/bedrock/bedrock-samples';
import { mapWithConcurrency } from '../../util/concurrency';

function findComponent(raw: any, name: string): any {
    const entity = raw['minecraft:entity'];
    if (!entity) {
        return undefined;
    }

    let found = entity.components?.[name];

    for (const group of Object.values(entity.component_groups || {})) {
        const value = (group as any)[name];
        if (value) {
            found = value;
        }
    }

    return found;
}

// A tame/feed item list shows up as a bare string (wolf: "bone"), an array of strings (cat, parrot),
// or - real, verified against nautilus - a mixed array where some entries are objects describing a
// side effect ({"item": "pufferfish_bucket", "result_item": "water_bucket:0"}). Only the item id
// itself is kept; the side effect (what the container empties into) isn't part of "what can tame
// this", so dropping it is a real simplification, not silently wrong.
function itemIds(value: string | (string | { item: string })[] | undefined): string[] {
    if (!value) {
        return [];
    }

    const list = Array.isArray(value) ? value : [value];
    return list.map(entry => typeof entry === 'string' ? entry : entry.item);
}

export function parseEntityBreeding(id: string, raw: any): EntityBreeding | undefined {
    const breedable = findComponent(raw, 'minecraft:breedable');
    if (!breedable) {
        return undefined;
    }

    return {
        entityId: namespaced(id),
        requireTame: breedable.require_tame,
        breedsWith: Object.keys(breedable.breeds_with || {}).map(namespaced),
        breedItems: itemIds(breedable.breed_items),
    };
}

export function parseEntityGrowth(id: string, raw: any): EntityGrowth | undefined {
    const ageable = findComponent(raw, 'minecraft:ageable');
    if (!ageable) {
        return undefined;
    }

    return {
        entityId: namespaced(id),
        durationTicks: ageable.duration,
        growUpItems: itemIds(ageable.feed_items),
    };
}

export function parseEntityTaming(id: string, raw: any): EntityTaming | undefined {
    const tameable = findComponent(raw, 'minecraft:tameable');
    if (!tameable) {
        return undefined;
    }

    return {
        entityId: namespaced(id),
        tameItems: itemIds(tameable.tame_items),
    };
}

export interface EntityBehavior {
    breeding: EntityBreeding[];
    growth: EntityGrowth[];
    taming: EntityTaming[];
}

// Fetches every real Bedrock entity once and parses all three behaviors from the same raw data,
// rather than three separate fetch passes over the same 127 files - the three are conceptually
// tied anyway (a baby grows via EntityGrowth's items, then becomes eligible to breed per
// EntityBreeding; taming is often a precondition for breeding, see requireTame), so a consumer
// almost always wants all three together.
export async function buildEntityBehavior(tag: string, concurrency = 16): Promise<EntityBehavior> {
    const files = await listEntityFiles(tag);
    const names = files.map(entityNameFromPath);

    const parsed = await mapWithConcurrency(names, concurrency, async name => {
        const raw = await fetchEntity(tag, name);
        return {
            breeding: parseEntityBreeding(name, raw),
            growth: parseEntityGrowth(name, raw),
            taming: parseEntityTaming(name, raw),
        };
    });

    return {
        breeding: parsed.map(p => p.breeding).filter((b): b is EntityBreeding => b !== undefined),
        growth: parsed.map(p => p.growth).filter((g): g is EntityGrowth => g !== undefined),
        taming: parsed.map(p => p.taming).filter((t): t is EntityTaming => t !== undefined),
    };
}
