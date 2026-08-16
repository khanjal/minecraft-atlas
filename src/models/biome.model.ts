export interface Biome {
    id: string;
    displayName: string;
    category: string;
    dimension: string;
    temperature: number;
    hasPrecipitation: boolean;
    // The biome's map/foliage tint, as a hex string ("#6ebaff") - minecraft-data stores this as a
    // packed decimal RGB int, converted here since a hex string is what anyone actually wants.
    color: string;
}
