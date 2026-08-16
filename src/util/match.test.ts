import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeName, tokenize, sameTokens } from './match';

test('normalizeName strips case, punctuation, and whitespace', () => {
    assert.equal(normalizeName('Block of Iron'), 'blockofiron');
    assert.equal(normalizeName('Iron  Ingot'), 'ironingot');
});

test('tokenize drops stopwords and lowercases', () => {
    assert.deepEqual(tokenize('Block of Iron'), new Set(['block', 'iron']));
});

test('sameTokens matches a Mojang word-order rename', () => {
    assert.ok(sameTokens(tokenize('Block of Iron'), tokenize('Iron Block')));
});

test('sameTokens does not match a token-count change', () => {
    assert.ok(!sameTokens(tokenize('Short Grass'), tokenize('Grass')));
});
