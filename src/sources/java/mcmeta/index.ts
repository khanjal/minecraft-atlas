// Wraps misode/mcmeta's {version}-data tag: raw recipe files and tag (e.g. #minecraft:planks)
// definitions, in Mojang's native data pack format.

const REPO = 'misode/mcmeta';

function rawUrl(version: string, path: string): string {
    return `https://raw.githubusercontent.com/${REPO}/${version}-data/${path}`;
}

// One request lists every file in the version's data pack, via the tag's tree, recursively -
// far cheaper than one GitHub REST `contents` call per directory, which would burn through
// the unauthenticated API's 60/hour limit long before listing ~1,500 recipe files. Raw content
// fetches below go through raw.githubusercontent.com instead, which isn't subject to that limit.
export async function listFiles(version: string, pathPrefix: string): Promise<string[]> {
    const url = `https://api.github.com/repos/${REPO}/git/trees/${version}-data?recursive=1`;
    const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) {
        throw new Error(`mcmeta: failed to list ${version}-data (${res.status} ${res.statusText})`);
    }
    const body = await res.json() as { tree: { path: string; type: string }[]; truncated: boolean };
    if (body.truncated) {
        throw new Error(`mcmeta: tree listing for ${version}-data was truncated by the GitHub API`);
    }
    return body.tree
        .filter(entry => entry.type === 'blob' && entry.path.startsWith(pathPrefix) && entry.path.endsWith('.json'))
        .map(entry => entry.path);
}

export async function fetchJson<T = any>(version: string, path: string): Promise<T> {
    const res = await fetch(rawUrl(version, path));
    if (!res.ok) {
        throw new Error(`mcmeta: failed to fetch ${path} @ ${version} (${res.status} ${res.statusText})`);
    }
    return res.json() as Promise<T>;
}

export async function listRecipeFiles(version: string): Promise<string[]> {
    return listFiles(version, 'data/minecraft/recipe/');
}

export function recipeNameFromPath(path: string): string {
    return path.replace('data/minecraft/recipe/', '').replace(/\.json$/, '');
}

export async function fetchRecipe(version: string, name: string): Promise<any> {
    return fetchJson(version, `data/minecraft/recipe/${name}.json`);
}

export interface TagFile {
    values: (string | { id: string; required?: boolean })[];
}

export async function fetchTag(version: string, tagId: string): Promise<TagFile> {
    const [namespace, name] = tagId.includes(':') ? tagId.split(':') : ['minecraft', tagId];
    return fetchJson<TagFile>(version, `data/${namespace}/tags/item/${name}.json`);
}

// Structures reference which biomes they can generate in via a tag too (e.g.
// "#minecraft:has_structure/village_plains"), in Mojang's separate worldgen/biome tag registry -
// same {values: [...]} shape as an item tag, real and resolvable the same recursive way (verified:
// data/minecraft/tags/worldgen/biome/has_structure/village_plains.json really does list
// "minecraft:plains"/"minecraft:meadow"), just a different registry path.
export async function fetchBiomeTag(version: string, tagId: string): Promise<TagFile> {
    const [namespace, name] = tagId.includes(':') ? tagId.split(':') : ['minecraft', tagId];
    return fetchJson<TagFile>(version, `data/${namespace}/tags/worldgen/biome/${name}.json`);
}

const STRUCTURE_DIR = 'data/minecraft/worldgen/structure/';

export async function listStructureFiles(version: string): Promise<string[]> {
    return listFiles(version, STRUCTURE_DIR);
}

export function structureNameFromPath(path: string): string {
    return path.replace(STRUCTURE_DIR, '').replace(/\.json$/, '');
}

export async function fetchStructure(version: string, name: string): Promise<any> {
    return fetchJson(version, `${STRUCTURE_DIR}${name}.json`);
}
