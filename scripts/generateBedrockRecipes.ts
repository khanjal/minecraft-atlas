import * as fs from 'fs';
import * as path from 'path';
import { buildBedrockRecipes } from '../src/transform/bedrock/recipes';

async function main(): Promise<void> {
    const tag = process.argv[2] || 'v1.26.40.05';
    console.log(`Fetching and parsing Bedrock recipes for ${tag}...`);

    const started = Date.now();
    const recipes = await buildBedrockRecipes(tag);
    const seconds = ((Date.now() - started) / 1000).toFixed(1);

    const outDir = path.join(__dirname, '..', 'data', 'bedrock', tag);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'recipes.json'), JSON.stringify(recipes, null, 2));

    console.log(`Wrote ${recipes.length} recipes to data/bedrock/${tag}/recipes.json (${seconds}s)`);
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
