import * as fs from 'fs';
import * as path from 'path';
import { buildItems } from '../src/transform/java/items';
import { buildEntities } from '../src/transform/java/entities';
import { buildEffects } from '../src/transform/java/effects';
import { buildEnchantments } from '../src/transform/java/enchantments';

async function main(): Promise<void> {
    const version = process.argv[2] || '26.1';
    console.log(`Fetching and parsing items/entities/effects/enchantments for ${version}...`);

    const [items, entities, effects, enchantments] = await Promise.all([
        buildItems(version),
        buildEntities(version),
        buildEffects(version),
        buildEnchantments(version),
    ]);

    const outDir = path.join(__dirname, '..', 'data', 'java', version);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'items.json'), JSON.stringify(items, null, 2));
    fs.writeFileSync(path.join(outDir, 'entities.json'), JSON.stringify(entities, null, 2));
    fs.writeFileSync(path.join(outDir, 'effects.json'), JSON.stringify(effects, null, 2));
    fs.writeFileSync(path.join(outDir, 'enchantments.json'), JSON.stringify(enchantments, null, 2));

    console.log(`Wrote ${items.length} items, ${entities.length} entities, ${effects.length} effects, ${enchantments.length} enchantments to data/java/${version}/`);
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
