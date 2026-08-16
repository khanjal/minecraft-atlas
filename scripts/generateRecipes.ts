import * as fs from 'fs';
import * as path from 'path';
import { buildRecipes } from '../src/transform/recipes';

async function main(): Promise<void> {
    const version = process.argv[2] || '26.1';
    console.log(`Fetching and parsing recipes for ${version}...`);

    const started = Date.now();
    const recipes = await buildRecipes(version);
    const seconds = ((Date.now() - started) / 1000).toFixed(1);

    const outDir = path.join(__dirname, '..', 'data', version);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'recipes.json'), JSON.stringify(recipes, null, 2));

    console.log(`Wrote ${recipes.length} recipes to data/${version}/recipes.json (${seconds}s)`);
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
