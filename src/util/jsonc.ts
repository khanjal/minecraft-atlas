// ~40% of bedrock-samples' entities/*.json files (verified: 51/127 at v1.26.40.05) use `//` line
// comments despite the .json extension - real JSONC, not strict JSON, confirmed by JSON.parse
// failing on files like armadillo.json and zombie.json until comments are stripped first. No block
// comments were found in the survey (0/127), so only `//` is handled.
//
// A naive `text.replace(/\/\/.*/g, '')` would corrupt any string value that legitimately contains
// "//" (a URL, for instance) - this walks the text respecting string boundaries (including escaped
// quotes) so a `//` is only ever treated as a comment when it appears outside a string literal.
export function stripJsonComments(text: string): string {
    let result = '';
    let inString = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const next = text[i + 1];

        if (inString) {
            result += char;
            if (char === '\\') {
                // Copy the escaped character as-is too, so an escaped quote (\") doesn't end the
                // string early on the next iteration.
                result += next ?? '';
                i++;
            } else if (char === '"') {
                inString = false;
            }
            continue;
        }

        if (char === '"') {
            inString = true;
            result += char;
            continue;
        }

        if (char === '/' && next === '/') {
            while (i < text.length && text[i] !== '\n') {
                i++;
            }
            result += '\n';
            continue;
        }

        result += char;
    }
    return result;
}
