export interface EntityTaming {
    entityId: string;
    // Bedrock's own raw item-id strings for what tames this entity when fed - same "not mapped to
    // a real item registry id" caveat as EntityBreeding.breedItems. Ride-based taming (horses,
    // donkeys, llamas - no item involved at all) has no minecraft:tameable component in the real
    // data, so those entities simply don't appear in this list - a real absence, not a parsing gap.
    tameItems: string[];
}
