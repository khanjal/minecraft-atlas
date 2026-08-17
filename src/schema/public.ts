// The stable versioned output shape actually published (v1). This is the primary entry point for
// a consumer that just wants "everything for this Minecraft version" - merge/overlay.ts and
// diff/coverageReport.ts stay separate exports rather than part of this, since both need a
// consumer's own curated data as an argument and can't be produced from a version string alone.
//
// Java only for now: Bedrock only has a complete public source for recipes (see
// transform/bedrock/recipes.ts's header) - no equivalent items/entities/effects/enchantments
// source exists yet, so there's nothing to build a full Bedrock Snapshot from. buildBedrockRecipes
// stays a standalone export for that reason rather than an edition parameter here that would only
// half-work.

import { buildItems } from '../transform/java/items';
import { buildEntities } from '../transform/java/entities';
import { buildEffects } from '../transform/java/effects';
import { buildEnchantments } from '../transform/java/enchantments';
import { buildRecipes } from '../transform/java/recipes';
import { buildBlocks } from '../transform/java/blocks';
import { buildBiomes } from '../transform/java/biomes';
import { buildStructures } from '../transform/java/structures';
import { Snapshot } from '../models/snapshot.model';

export async function buildSnapshot(minecraftVersion: string): Promise<Snapshot> {
    const [items, entities, effects, enchantments, recipes, blocks, biomes, structures] = await Promise.all([
        buildItems(minecraftVersion),
        buildEntities(minecraftVersion),
        buildEffects(minecraftVersion),
        buildEnchantments(minecraftVersion),
        buildRecipes(minecraftVersion),
        buildBlocks(minecraftVersion),
        buildBiomes(minecraftVersion),
        buildStructures(minecraftVersion),
    ]);

    return {
        schemaVersion: 1,
        minecraftVersion,
        generatedAt: new Date().toISOString(),
        items,
        entities,
        effects,
        enchantments,
        recipes,
        blocks,
        biomes,
        structures,
    };
}
