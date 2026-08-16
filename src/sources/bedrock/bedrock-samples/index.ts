// Wraps Mojang/bedrock-samples: the official vanilla behavior pack, including its recipes/ folder
// (Bedrock's equivalent of a Java data pack's recipe JSON, in Bedrock's own format). Unlike
// mcmeta, this is Mojang's own repo, not a third party's processed mirror.
//
// Versioned by git tag ("v1.26.40.05"), not by a Minecraft version string the way mcmeta's
// "{version}-data" tags are - Bedrock's own version numbers don't correspond 1:1 with Java's, and
// there are many pre-release tags per release ("v1.26.40.05-preview") alongside the stable one.
// Callers pass the exact tag rather than this module guessing which one is "latest stable".

const REPO = 'Mojang/bedrock-samples';

function rawUrl(tag: string, path: string): string {
    return `https://raw.githubusercontent.com/${REPO}/${tag}/${path}`;
}

// Same reasoning as mcmeta's listFiles: one tree call for the whole tag instead of one REST
// `contents` call per directory, which would burn through the unauthenticated API's 60/hour limit
// against ~1,000 recipe files.
export async function listFiles(tag: string, pathPrefix: string): Promise<string[]> {
    const url = `https://api.github.com/repos/${REPO}/git/trees/${tag}?recursive=1`;
    const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) {
        throw new Error(`bedrock-samples: failed to list ${tag} (${res.status} ${res.statusText})`);
    }
    const body = await res.json() as { tree: { path: string; type: string }[]; truncated: boolean };
    if (body.truncated) {
        throw new Error(`bedrock-samples: tree listing for ${tag} was truncated by the GitHub API`);
    }
    return body.tree
        .filter(entry => entry.type === 'blob' && entry.path.startsWith(pathPrefix) && entry.path.endsWith('.json'))
        .map(entry => entry.path);
}

export async function fetchJson<T = any>(tag: string, path: string): Promise<T> {
    const res = await fetch(rawUrl(tag, path));
    if (!res.ok) {
        throw new Error(`bedrock-samples: failed to fetch ${path} @ ${tag} (${res.status} ${res.statusText})`);
    }
    return res.json() as Promise<T>;
}

const RECIPES_DIR = 'behavior_pack/recipes/';

export async function listRecipeFiles(tag: string): Promise<string[]> {
    return listFiles(tag, RECIPES_DIR);
}

export function recipeNameFromPath(path: string): string {
    return path.replace(RECIPES_DIR, '').replace(/\.json$/, '');
}

export async function fetchRecipe(tag: string, name: string): Promise<any> {
    return fetchJson(tag, `${RECIPES_DIR}${name}.json`);
}
