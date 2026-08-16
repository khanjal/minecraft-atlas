import { fetchTag } from '../../sources/java/mcmeta';
import { namespaced } from '../../util/id';

// Recursively resolves a tag id (e.g. "minecraft:planks") to its full list of concrete item ids,
// via mcmeta's data/minecraft/tags/item/*.json. Tag files can reference other tags (a value
// prefixed with "#"), so this recurses. The same tag is referenced by many recipes (every wood
// type's boat/button/door/... pulls in "minecraft:planks"), so results are cached per version -
// stores the in-flight promise, not just the resolved value, so concurrent callers awaiting the
// same tag share one fetch instead of racing duplicate requests.
const cache = new Map<string, Promise<string[]>>();

export async function resolveTag(version: string, tagId: string): Promise<string[]> {
    const id = namespaced(tagId);
    const key = `${version}:${id}`;
    let pending = cache.get(key);
    if (!pending) {
        pending = resolveTagUncached(version, id);
        cache.set(key, pending);
    }
    return pending;
}

async function resolveTagUncached(version: string, tagId: string): Promise<string[]> {
    const tag = await fetchTag(version, tagId);
    const items: string[] = [];
    for (const entry of tag.values) {
        const raw = typeof entry === 'string' ? entry : entry.id;
        // Namespace after stripping a leading "#", not before - namespaced() only recognizes
        // "already has a namespace" by the presence of a colon, and "#planks" (no explicit
        // namespace on the tag reference itself) would otherwise become "minecraft:#planks"
        // instead of the intended "#minecraft:planks".
        if (raw.startsWith('#')) {
            items.push(...await resolveTag(version, namespaced(raw.slice(1))));
        } else {
            items.push(namespaced(raw));
        }
    }
    return items;
}
