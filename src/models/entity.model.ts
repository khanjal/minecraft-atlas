export interface Entity {
    id: string;
    // Java only - minecraft-data carries a real human-readable name ("Cow"). Bedrock's behavior
    // pack has no equivalent field at all; a display name only exists in a resource pack's lang
    // file (entity.minecraft:cow.name=Cow), which is a separate, unmerged source - genuinely
    // absent here rather than omitted by choice.
    displayName?: string;
    // Java only - minecraft-data's broad taxonomy ("animal", "hostile", "projectile", ...).
    // Bedrock's closest analog is `family` below, which is a different shape (a list, not one
    // value) and a different vocabulary, so it isn't folded into this field.
    type?: string;
    // Java: minecraft-data's human-readable grouping ("Passive mobs"). Bedrock: the behavior
    // pack's raw `spawn_category` ("creature", "monster", "misc") when present - related in
    // purpose but a different vocabulary per edition, not reconciled into one shared meaning.
    category?: string;
    // Bedrock only - minecraft:type_family's `family` list (e.g. cow: ["cow", "mob"]). Absent on
    // 30/127 entities at v1.26.40.05 (mostly non-mob entities like xp_orb, area_effect_cloud)
    // rather than missing due to a parsing gap.
    family?: string[];
    // Present on both editions but optional: Bedrock's minecraft:collision_box component is
    // missing on 10/127 entities at v1.26.40.05.
    width?: number;
    height?: number;
}
