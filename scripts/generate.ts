import * as fs from 'fs';
import * as path from 'path';
import { buildSnapshot } from '../src/schema/public';

async function main(): Promise<void> {
    const version = process.argv[2] || '26.1';
    console.log(`Building snapshot for ${version}...`);

    const started = Date.now();
    const snapshot = await buildSnapshot(version);
    const seconds = ((Date.now() - started) / 1000).toFixed(1);

    const outDir = path.join(__dirname, '..', 'data', version);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'snapshot.json'), JSON.stringify(snapshot, null, 2));

    console.log(
        `Wrote data/${version}/snapshot.json (${seconds}s): ` +
        `${snapshot.items.length} items, ${snapshot.entities.length} entities, ` +
        `${snapshot.effects.length} effects, ${snapshot.enchantments.length} enchantments, ` +
        `${snapshot.recipes.length} recipes`
    );
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
