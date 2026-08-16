export interface Block {
    id: string;
    displayName: string;
    hardness: number;
    resistance: number;
    diggable: boolean;
    material: string;
    transparent: boolean;
    emitLight: number;
    filterLight: number;
    // Item ids this block can be harvested with (empty/undefined if any tool - or no tool - works).
    harvestTools?: string[];
    // Item ids this block drops when broken.
    drops: string[];
    boundingBox: string;
}
