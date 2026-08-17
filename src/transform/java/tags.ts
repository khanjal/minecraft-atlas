import { fetchTag, fetchBiomeTag } from '../../sources/java/mcmeta';
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

// Resolves a structure's real "biomes" field (e.g. "#minecraft:has_structure/village_plains") to
// its full list of concrete biome ids it can generate in - same recursive shape as resolveTag
// above, kept as its own separate function (not a shared helper parameterized on which fetch to
// call) after a real bug: passing fetchTag/fetchBiomeTag as a captured argument to a shared
// factory broke test mocking, since t.mock.method replaces the *module's* fetchTag export at test
// time, but a value already captured as a function argument at module-load time doesn't see that
// later replacement - only a direct call site (`fetchTag(...)`, resolved fresh each call) does.
// Its own cache, so a biome tag id can never collide with an item tag id of the same literal string.
const biomeCache = new Map<string, Promise<string[]>>();

export async function resolveBiomeTag(version: string, tagId: string): Promise<string[]> {
    const id = namespaced(tagId);
    const key = `${version}:${id}`;
    let pending = biomeCache.get(key);
    if (!pending) {
        pending = resolveBiomeTagUncached(version, id);
        biomeCache.set(key, pending);
    }
    return pending;
}

async function resolveBiomeTagUncached(version: string, tagId: string): Promise<string[]> {
    const tag = await fetchBiomeTag(version, tagId);
    const biomes: string[] = [];
    for (const entry of tag.values) {
        const raw = typeof entry === 'string' ? entry : entry.id;
        if (raw.startsWith('#')) {
            biomes.push(...await resolveBiomeTag(version, namespaced(raw.slice(1))));
        } else {
            biomes.push(namespaced(raw));
        }
    }
    return biomes;
}
