import { Item } from './item.model';
import { Entity } from './entity.model';
import { Effect } from './effect.model';
import { Enchantment } from './enchantment.model';
import { Recipe } from './recipe.model';

// The stable, versioned shape buildSnapshot() returns - this is the actual public contract.
// schemaVersion exists so a future breaking change to this shape bumps it explicitly rather than
// silently changing what consumers get back.
export interface Snapshot {
    schemaVersion: 1;
    minecraftVersion: string;
    generatedAt: string;
    items: Item[];
    entities: Entity[];
    effects: Effect[];
    enchantments: Enchantment[];
    recipes: Recipe[];
}
