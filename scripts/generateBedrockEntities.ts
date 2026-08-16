import * as fs from 'fs';
import * as path from 'path';
import { buildBedrockEntities } from '../src/transform/bedrock/entities';

async function main(): Promise<void> {
    const tag = process.argv[2] || 'v1.26.40.05';
    console.log(`Fetching and parsing Bedrock entities for ${tag}...`);

    const started = Date.now();
    const entities = await buildBedrockEntities(tag);
    const seconds = ((Date.now() - started) / 1000).toFixed(1);

    const outDir = path.join(__dirname, '..', 'data', 'bedrock', tag);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'entities.json'), JSON.stringify(entities, null, 2));

    console.log(`Wrote ${entities.length} entities to data/bedrock/${tag}/entities.json (${seconds}s)`);
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
