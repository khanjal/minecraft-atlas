// Name-matching helpers shared by merge/overlay.ts and diff/coverageReport.ts - both need the
// same answer to "does this base record correspond to this curated record".

// Case/punctuation/whitespace-insensitive exact match - "Block of Iron" and "block of iron"
// are the same name, "Iron Ingot" and "Iron  Ingot" are the same name.
export function normalizeName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const STOPWORDS = new Set(['of', 'the', 'a', 'an']);

// The set of meaningful words in a name, order-independent - "Iron Block" and "Block of Iron"
// both tokenize to {iron, block}, so a straight set-equality check catches a Mojang word-order
// rename even though normalizeName's tighter check wouldn't. Doesn't catch every rename shape:
// "Grass" -> "Short Grass" adds a token rather than reordering existing ones, so this misses it -
// a real limitation, not an oversight, documented in diff/coverageReport.ts.
export function tokenize(name: string): Set<string> {
    return new Set(
        name.toLowerCase().split(/[^a-z0-9]+/).filter(word => word.length > 0 && !STOPWORDS.has(word))
    );
}

export function sameTokens(a: Set<string>, b: Set<string>): boolean {
    if (a.size !== b.size) {
        return false;
    }
    for (const word of a) {
        if (!b.has(word)) {
            return false;
        }
    }
    return true;
}
