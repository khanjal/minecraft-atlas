import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stripJsonComments } from './jsonc';

test('strips a real line comment (from armadillo.json) and leaves valid JSON', () => {
    const input = `{
      "a": 1,
      // Every four ticks, the Armadillo scans for threats.
      "b": 2
    }`;
    const result = JSON.parse(stripJsonComments(input));
    assert.deepEqual(result, { a: 1, b: 2 });
});

test('strips an inline trailing comment on the same line as real data (from zombie.json)', () => {
    const input = `{ "height": 1.96, // 0.98/0.5\n  "width": 0.98 }`;
    const result = JSON.parse(stripJsonComments(input));
    assert.deepEqual(result, { height: 1.96, width: 0.98 });
});

test('does not strip "//" that appears inside a real string value', () => {
    const input = `{ "url": "https://example.com/path" }`;
    const result = JSON.parse(stripJsonComments(input));
    assert.equal(result.url, 'https://example.com/path');
});

test('does not let an escaped quote inside a string end the string early', () => {
    const input = `{ "text": "say \\"hi\\" // not a comment" }`;
    const result = JSON.parse(stripJsonComments(input));
    assert.equal(result.text, 'say "hi" // not a comment');
});

test('is a no-op on plain JSON with no comments', () => {
    const input = `{"a":1,"b":[1,2,3]}`;
    assert.equal(JSON.parse(stripJsonComments(input)).a, 1);
});
