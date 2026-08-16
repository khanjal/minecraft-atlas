import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as atlas from './index';

test('the public barrel exports every function a consumer needs', () => {
    const expectedFunctions = [
        'buildSnapshot', 'overlay', 'buildCoverageReport',
        'buildItems', 'buildEntities', 'buildEffects', 'buildEnchantments', 'buildRecipes',
    ];
    for (const name of expectedFunctions) {
        assert.equal(typeof (atlas as Record<string, unknown>)[name], 'function', `expected ${name} to be an exported function`);
    }
});
