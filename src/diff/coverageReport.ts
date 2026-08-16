// Flags base-layer records with no match in the curated data - catches renames and new items
// the curated layer hasn't picked up yet (surfaced a real 254-item gap between minecraft-data
// 26.1 and Craft Helper's sheet during investigation, several of them Mojang renames like
// "Iron Block" -> "Block of Iron").

import { CuratedRecord } from '../models/curated-record.model';
import { normalizeName, tokenize, sameTokens } from '../util/match';

export interface CoverageGap {
    name: string;
    // A curated record's name sharing the same word set (order-independent) - a likely Mojang
    // rename the curated data hasn't picked up yet. Null when nothing matched even loosely,
    // which more often means a genuinely new addition. See util/match.ts's tokenize for what
    // this catches (word reordering) and doesn't (a name gaining or losing a word entirely).
    likelyRenameOf: string | null;
}

export function buildCoverageReport<Base, Curated extends CuratedRecord>(
    baseRecords: Base[],
    curatedRecords: Curated[],
    nameOf: (record: Base) => string
): CoverageGap[] {
    const curatedNames = new Set(curatedRecords.map(curated => normalizeName(curated.name)));
    const curatedTokenSets = curatedRecords.map(curated => ({ name: curated.name, tokens: tokenize(curated.name) }));

    const gaps: CoverageGap[] = [];
    for (const base of baseRecords) {
        const name = nameOf(base);
        if (curatedNames.has(normalizeName(name))) {
            continue;
        }

        const baseTokens = tokenize(name);
        const renameCandidate = curatedTokenSets.find(curated => sameTokens(curated.tokens, baseTokens));

        gaps.push({ name, likelyRenameOf: renameCandidate?.name ?? null });
    }
    return gaps;
}
