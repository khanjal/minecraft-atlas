export interface EntityGrowth {
    entityId: string;
    // Real Bedrock field, in game ticks (20 ticks/second) - how long a baby takes to grow up on
    // its own, with no feeding.
    durationTicks?: number;
    // Bedrock's own raw item-id strings that speed up growth when fed to a baby - same "not mapped
    // to a real item registry id" caveat as EntityBreeding.breedItems.
    growUpItems: string[];
}
