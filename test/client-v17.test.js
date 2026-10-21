// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// VERSION 17: the client is version 16's file with its comments cleaned - what its tool writes, no ticket number, no name and no old
// project name left, and only lines that carried one changed; the signed manifest stands on version 16 and adds this file's hash
// beside the older clients'.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { buildV17, FORBIDDEN } from '../tools/build-client-v17.mjs';
import { MANIFEST_V16, GAME_ID_V16 } from '../plugin/btc-updown-v16.js';
import { MANIFEST_V17, GAME_ID_V17, GAME } from '../plugin/btc-updown-v17.js';
import { manifestStands } from 'arena-sdk/manifest';
import { verifyEd25519 } from 'arena-sdk/ed25519';
import { toHex } from 'arena-sdk/hash';

const V16 = readFileSync(new URL('../client/index-v16.html', import.meta.url), 'utf8');
const V17 = readFileSync(new URL('../client/index-v17.html', import.meta.url), 'utf8');

test('the file is what the tool writes from version 16\'s', () => {
  assert.equal(buildV17(V16), V17, 'client/index-v17.html is out of date: run tools/build-client-v17.mjs');
});

test('no ticket number, name or old project name left; only the lines that carried one changed', () => {
  const a = V16.split('\n'), b = V17.split('\n');
  assert.equal(a.length, b.length);
  assert.deepEqual(b.map((l, i) => [i + 1, l]).filter(([, l]) => FORBIDDEN.test(l)), []);
  const changed = a.map((l, i) => [l, b[i]]).filter(([x, y]) => x !== y);
  assert.ok(changed.length > 0);
  for (const [was] of changed) assert.match(was, FORBIDDEN, 'a line changed that carried nothing to clean');
});

test('the manifest stands on version 16, its developer\'s, and pins this file beside the older clients', () => {
  const stands = manifestStands(MANIFEST_V17, { verify: verifyEd25519, parentOf: (id) => (toHex(id) === toHex(GAME_ID_V16) ? MANIFEST_V16 : null) });
  assert.ok(stands.ok, stands.why);
  assert.equal(MANIFEST_V17.version, MANIFEST_V16.version + 1);
  assert.equal(toHex(MANIFEST_V17.parentManifestId), toHex(GAME_ID_V16));
  assert.equal(toHex(MANIFEST_V17.gameDevPubkey), toHex(MANIFEST_V16.gameDevPubkey));
  const pins = MANIFEST_V17.clients.map(toHex);
  assert.ok(pins.includes(createHash('sha256').update(V17).digest('hex')), 'version 17 pins its own client');
  for (const c of MANIFEST_V16.clients) assert.ok(pins.includes(toHex(c)), 'version 16\'s clients stay pinned');
  assert.equal(toHex(GAME.gameId), toHex(GAME_ID_V17));
});
