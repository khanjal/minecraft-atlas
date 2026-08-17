import * as fs from 'fs';
import * as path from 'path';
import { buildEntityBehavior } from '../src/transform/bedrock/entityBehavior';

async function main(): Promise<void> {
    const tag = process.argv[2] || 'v1.26.40.05';
    console.log(`Fetching and parsing Bedrock entity breeding/growth/taming for ${tag}...`);

    const started = Date.now();
    const { breeding, growth, taming } = await buildEntityBehavior(tag);
    const seconds = ((Date.now() - started) / 1000).toFixed(1);

    const outDir = path.join(__dirname, '..', 'data', 'bedrock', tag);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'entity-breeding.json'), JSON.stringify(breeding, null, 2));
    fs.writeFileSync(path.join(outDir, 'entity-growth.json'), JSON.stringify(growth, null, 2));
    fs.writeFileSync(path.join(outDir, 'entity-taming.json'), JSON.stringify(taming, null, 2));

    console.log(
        `Wrote ${breeding.length} breeding, ${growth.length} growth, ${taming.length} taming ` +
        `entries to data/bedrock/${tag}/ (${seconds}s)`
    );
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
