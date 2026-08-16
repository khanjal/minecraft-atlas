import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEntity } from './entities';

// Real minecraft-data 26.1 fixture (data/pc/26.1/entities.json), verified against the live
// source earlier - metadataKeys deliberately omitted from RawEntity (protocol-level detail this
// project doesn't surface), so it's fine for the fixture to include it and have it ignored.
test('parseEntity maps a real entity entry', () => {
    const entity = parseEntity({
        id: 0,
        internalId: 0,
        name: 'acacia_boat',
        displayName: 'Acacia Boat',
        width: 1.375,
        height: 0.5625,
        type: 'other',
        category: 'Vehicles',
    } as any);

    assert.deepEqual(entity, {
        id: 'minecraft:acacia_boat',
        displayName: 'Acacia Boat',
        type: 'other',
        category: 'Vehicles',
        width: 1.375,
        height: 0.5625,
    });
});
