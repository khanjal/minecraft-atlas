// Joins curated data (synonyms, tips, breeding/taming, ...) onto the base layer, by name.

import { CuratedRecord } from '../models/curated-record.model';
import { normalizeName } from '../util/match';

export interface Overlaid<Base, Curated extends CuratedRecord> {
    base: Base;
    curated: Curated | null;
}

// `nameOf` extracts the name to match on from a base record (e.g. an Item's displayName) - the
// base models don't share a fixed "name" field, so this can't be inferred generically.
export function overlay<Base, Curated extends CuratedRecord>(
    baseRecords: Base[],
    curatedRecords: Curated[],
    nameOf: (record: Base) => string
): Overlaid<Base, Curated>[] {
    const curatedByName = new Map<string, Curated>();
    for (const curated of curatedRecords) {
        curatedByName.set(normalizeName(curated.name), curated);
    }

    return baseRecords.map(base => ({
        base,
        curated: curatedByName.get(normalizeName(nameOf(base))) ?? null,
    }));
}
