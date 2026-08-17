import * as fs from 'fs';
import * as path from 'path';
import { buildItems } from '../src/transform/java/items';
import { buildEntities } from '../src/transform/java/entities';
import { buildEffects } from '../src/transform/java/effects';
import { buildEnchantments } from '../src/transform/java/enchantments';
import { buildBlocks } from '../src/transform/java/blocks';
import { buildBiomes } from '../src/transform/java/biomes';
import { buildStructures } from '../src/transform/java/structures';

async function main(): Promise<void> {
    const version = process.argv[2] || '26.1';
    console.log(`Fetching and parsing items/entities/effects/enchantments/blocks/biomes/structures for ${version}...`);

    const [items, entities, effects, enchantments, blocks, biomes, structures] = await Promise.all([
        buildItems(version),
        buildEntities(version),
        buildEffects(version),
        buildEnchantments(version),
        buildBlocks(version),
        buildBiomes(version),
        buildStructures(version),
    ]);

    const outDir = path.join(__dirname, '..', 'data', 'java', version);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'items.json'), JSON.stringify(items, null, 2));
    fs.writeFileSync(path.join(outDir, 'entities.json'), JSON.stringify(entities, null, 2));
    fs.writeFileSync(path.join(outDir, 'effects.json'), JSON.stringify(effects, null, 2));
    fs.writeFileSync(path.join(outDir, 'enchantments.json'), JSON.stringify(enchantments, null, 2));
    fs.writeFileSync(path.join(outDir, 'blocks.json'), JSON.stringify(blocks, null, 2));
    fs.writeFileSync(path.join(outDir, 'biomes.json'), JSON.stringify(biomes, null, 2));
    fs.writeFileSync(path.join(outDir, 'structures.json'), JSON.stringify(structures, null, 2));

    console.log(
        `Wrote ${items.length} items, ${entities.length} entities, ${effects.length} effects, ` +
        `${enchantments.length} enchantments, ${blocks.length} blocks, ${biomes.length} biomes, ` +
        `${structures.length} structures to data/java/${version}/`
    );
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
