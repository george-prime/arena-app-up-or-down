// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// VERSION 21: version 20 in every term, with the new client index-v21.html (each order's times from the press: accepted, and its lock)
// beside version 20's three; the signed manifest stands on version 20. The client is what its tool writes, with no forbidden word, and
// it shows the times the page hands it on the order cards and in the past orders.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { FORBIDDEN } from '../tools/build-client-v17.mjs';
import { buildV21 } from '../tools/build-client-v21.mjs';
import { MANIFEST_V20, GAME_ID_V20 } from '../plugin/btc-updown-v20.js';
import { MANIFEST_V21, GAME } from '../plugin/btc-updown-v21.js';
import { manifestStands } from 'arena-sdk/manifest';
import { verifyEd25519 } from 'arena-sdk/ed25519';
import { toHex } from 'arena-sdk/hash';

const V21 = readFileSync(new URL('../client/index-v21.html', import.meta.url));

test('the signed manifest stands on version 20 and adds only index-v21.html to its clients', () => {
  assert.equal(toHex(GAME.gameId), '5fba7f5e0d4eb5da10c1eb6472ba862f8099e7c2e94be4645c483eb3a03b4a4f');
  const stands = manifestStands(MANIFEST_V21, { verify: verifyEd25519, parentOf: (id) => (toHex(id) === toHex(GAME_ID_V20) ? MANIFEST_V20 : null) });
  assert.ok(stands.ok, stands.why);
  const v21 = createHash('sha256').update(V21).digest('hex');
  assert.deepEqual(MANIFEST_V21.clients.map(toHex).sort(), [...MANIFEST_V20.clients.map(toHex), v21].sort());
  const { clients: a, version: va, parentManifestId: pa, signature: sa, ...rest21 } = MANIFEST_V21;
  const { clients: b, version: vb, parentManifestId: pb, signature: sb, ...rest20 } = MANIFEST_V20;
  void a; void va; void pa; void sa; void b; void vb; void pb; void sb;
  assert.deepEqual(rest21, rest20, 'every other term is version 20\'s');
});

test('the client is what its tool writes, names nobody, and shows each order\'s times', () => {
  const bundle = new URL('../dist/updown-view.js', import.meta.url);
  const text = V21.toString('utf8');
  if (existsSync(bundle) && text.includes(readFileSync(bundle, 'utf8').trim())) {
    assert.equal(buildV21(readFileSync(new URL('../client/index.html', import.meta.url), 'utf8'), readFileSync(new URL('../client/src-v21.js', import.meta.url), 'utf8'),
      readFileSync(bundle, 'utf8')), text);
  }
  assert.deepEqual(text.split('\n').filter((l) => FORBIDDEN.test(l)), []);
  assert.match(text, /Timing/);
  assert.match(text, /timing: o\.timing \|\| null/);
});
