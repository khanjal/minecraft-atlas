import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCoverageReport } from './coverageReport';

interface FakeItem { displayName: string }
interface FakeCurated { name: string }

test('flags a Mojang word-order rename as likely, not new', () => {
    const base: FakeItem[] = [{ displayName: 'Block of Iron' }];
    const curated: FakeCurated[] = [{ name: 'Iron Block' }];

    const gaps = buildCoverageReport(base, curated, item => item.displayName);

    assert.equal(gaps.length, 1);
    assert.equal(gaps[0].likelyRenameOf, 'Iron Block');
});

test('reports a genuinely new item with no rename candidate', () => {
    const base: FakeItem[] = [{ displayName: 'Open Eyeblossom' }];
    const curated: FakeCurated[] = [{ name: 'Poppy' }];

    const gaps = buildCoverageReport(base, curated, item => item.displayName);

    assert.equal(gaps.length, 1);
    assert.equal(gaps[0].likelyRenameOf, null);
});

test('a matched item produces no gap', () => {
    const base: FakeItem[] = [{ displayName: 'Oak Planks' }];
    const curated: FakeCurated[] = [{ name: 'oak planks' }];

    assert.equal(buildCoverageReport(base, curated, item => item.displayName).length, 0);
});
