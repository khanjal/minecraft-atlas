// The stable versioned output shape actually published (v1). This is the primary entry point for
// a consumer that just wants "everything for this Minecraft version" - merge/overlay.ts and
// diff/coverageReport.ts stay separate exports rather than part of this, since both need a
// consumer's own curated data as an argument and can't be produced from a version string alone.

import { buildItems } from '../transform/items';
import { buildEntities } from '../transform/entities';
import { buildEffects } from '../transform/effects';
import { buildEnchantments } from '../transform/enchantments';
import { buildRecipes } from '../transform/recipes';
import { Snapshot } from '../models/snapshot.model';

export async function buildSnapshot(minecraftVersion: string): Promise<Snapshot> {
    const [items, entities, effects, enchantments, recipes] = await Promise.all([
        buildItems(minecraftVersion),
        buildEntities(minecraftVersion),
        buildEffects(minecraftVersion),
        buildEnchantments(minecraftVersion),
        buildRecipes(minecraftVersion),
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
    };
}
