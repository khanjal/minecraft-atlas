// Real per-structure symbol+colour identity - unlike items/blocks/entities, the full real catalog
// is only 34 structures (verified: misode/mcmeta's data/minecraft/worldgen/structure/*.json for
// 26.1), small enough to hand-curate every single one directly with real thematic reasoning, the
// same way the original ~180-entry item RESERVED_SYMBOLS does - no family system or category
// fallback needed here, this is 100% real, deliberate coverage.
//
// Colours lean on genuine material/thematic association with the real structure (ocean monument's
// prismarine, desert pyramid's sandstone, trial chambers' copper, ...) rather than being picked
// arbitrarily. Shapes group loosely by real kind (settlement/nether/ocean/underground/portal/
// landmark) since structures aren't rendered competing for distinctness within one small set the
// way recipe ingredients are - colour still carries the actual per-structure identity.

import { ItemSymbol } from '../models/item-symbol.model';

export const STRUCTURE_COLORS: Record<string, ItemSymbol> = {
    // Settlements - a warm, welcoming green/tan, varied per biome the village actually generates in.
    'minecraft:village_plains': { symbol: '●', color: '#8fb84a' },
    'minecraft:village_desert': { symbol: '●', color: '#d4c47a' },
    'minecraft:village_savanna': { symbol: '●', color: '#c9a24a' },
    'minecraft:village_snowy': { symbol: '●', color: '#e8f0f5' },
    'minecraft:village_taiga': { symbol: '●', color: '#3a5a3a' },
    // Pillager outpost - a watchtower, grey stone with the same threat-red accent pillagers
    // themselves carry.
    'minecraft:pillager_outpost': { symbol: '■', color: '#8a4a4a' },
    // Ruined portals - genuinely obsidian, so it reuses that item's own reserved colour
    // (itemSymbols.ts) rather than inventing a new purple-black. All seven biome variants share one
    // identity - they're the same structure, just generating in a different biome.
    'minecraft:ruined_portal': { symbol: '◆', color: '#2a1a3d' },
    'minecraft:ruined_portal_desert': { symbol: '◆', color: '#2a1a3d' },
    'minecraft:ruined_portal_jungle': { symbol: '◆', color: '#2a1a3d' },
    'minecraft:ruined_portal_mountain': { symbol: '◆', color: '#2a1a3d' },
    'minecraft:ruined_portal_nether': { symbol: '◆', color: '#2a1a3d' },
    'minecraft:ruined_portal_ocean': { symbol: '◆', color: '#2a1a3d' },
    'minecraft:ruined_portal_swamp': { symbol: '◆', color: '#2a1a3d' },
    // Desert pyramid - sandstone, reusing that item's own reserved colour.
    'minecraft:desert_pyramid': { symbol: '▲', color: '#d4c47a' },
    // Jungle temple - mossy stone, a real overgrown-ruin green-grey.
    'minecraft:jungle_pyramid': { symbol: '▲', color: '#5c7a5c' },
    // Igloo - obviously ice/snow white.
    'minecraft:igloo': { symbol: '▲', color: '#e8f0f5' },
    // Swamp hut (witch hut) - a dark, murky swamp green.
    'minecraft:swamp_hut': { symbol: '▲', color: '#4a5a3a' },
    // Woodland mansion - dark oak, reusing that species' own real wood tone.
    'minecraft:mansion': { symbol: '▲', color: '#4a3728' },
    // Nether structures - a hot, dangerous red/orange family.
    'minecraft:fortress': { symbol: '▲', color: '#5c1f22' },
    // Bastion remnant - piglin gold, since bastions are genuinely built from gilded blackstone.
    'minecraft:bastion_remnant': { symbol: '▲', color: '#a67c2e' },
    // Nether fossil - bone, reusing that item's own reserved colour.
    'minecraft:nether_fossil': { symbol: '■', color: '#e8e0d0' },
    // End structures - the real, iconic end purple/pale palette.
    'minecraft:end_city': { symbol: '◆', color: '#a878b8' },
    // Ocean structures - blue/teal, matching the real material or setting each is built from.
    // The real structure id is "monument" (not "ocean_monument"), verified against the actual
    // mcmeta filename.
    'minecraft:monument': { symbol: '◇', color: '#5f9e94' },
    'minecraft:ocean_ruin_cold': { symbol: '◇', color: '#6a9db0' },
    'minecraft:ocean_ruin_warm': { symbol: '◇', color: '#4ab0a8' },
    'minecraft:buried_treasure': { symbol: '◇', color: '#e8c85a' },
    'minecraft:shipwreck': { symbol: '◇', color: '#6a5a4a' },
    'minecraft:shipwreck_beached': { symbol: '◇', color: '#6a5a4a' },
    // Underground/cave structures - enclosed, a real deep-dark/mineral palette.
    'minecraft:mineshaft': { symbol: '■', color: '#8a6a4a' },
    'minecraft:mineshaft_mesa': { symbol: '■', color: '#a8532f' },
    'minecraft:stronghold': { symbol: '■', color: '#6a5a7a' },
    // Ancient city - the real deep dark biome's own sculk teal-black.
    'minecraft:ancient_city': { symbol: '■', color: '#1a3a3a' },
    // Trial chambers - copper, reusing that item's own reserved colour (the structure is
    // genuinely built from copper bulbs/vaults).
    'minecraft:trial_chambers': { symbol: '■', color: '#c87f4a' },
    // Trail ruins - archaeological terracotta/clay, matching the real pottery-sherd theme.
    'minecraft:trail_ruins': { symbol: '■', color: '#8a7355' },
};
