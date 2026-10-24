// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// VERSION 22: version 21 in every term, with the new client index-v22.html (the card's times named submitted, placed, lock)
// beside version 21's four; the signed manifest stands on version 21. The client is what its tool writes, with no forbidden word, and
// it shows the times the page hands it on the order cards and in the past orders.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { FORBIDDEN } from '../tools/build-client-v17.mjs';
import { buildV22 } from '../tools/build-client-v22.mjs';
import { MANIFEST_V21, GAME_ID_V21 } from '../plugin/btc-updown-v21.js';
import { MANIFEST_V22, GAME } from '../plugin/btc-updown-v22.js';
import { manifestStands } from 'arena-sdk/manifest';
import { verifyEd25519 } from 'arena-sdk/ed25519';
import { toHex } from 'arena-sdk/hash';

const V22 = readFileSync(new URL('../client/index-v22.html', import.meta.url));

test('the signed manifest stands on version 20 and adds only index-v22.html to its clients', () => {
  assert.equal(toHex(GAME.gameId), '9a49869c11c5cd52cf0e5a2ca49f42a549c20f7b86f1fbd9fba0f065bc608556');
  const stands = manifestStands(MANIFEST_V22, { verify: verifyEd25519, parentOf: (id) => (toHex(id) === toHex(GAME_ID_V21) ? MANIFEST_V21 : null) });
  assert.ok(stands.ok, stands.why);
  const v22 = createHash('sha256').update(V22).digest('hex');
  assert.deepEqual(MANIFEST_V22.clients.map(toHex).sort(), [...MANIFEST_V21.clients.map(toHex), v22].sort());
  const { clients: a, version: va, parentManifestId: pa, signature: sa, ...rest22 } = MANIFEST_V22;
  const { clients: b, version: vb, parentManifestId: pb, signature: sb, ...rest21 } = MANIFEST_V21;
  void a; void va; void pa; void sa; void b; void vb; void pb; void sb;
  assert.deepEqual(rest22, rest21, 'every other term is version 21\'s');
});

test('the client is what its tool writes, names nobody, and shows each order\'s times', () => {
  const bundle = new URL('../dist/updown-view.js', import.meta.url);
  const text = V22.toString('utf8');
  if (existsSync(bundle) && text.includes(readFileSync(bundle, 'utf8').trim())) {
    assert.equal(buildV22(readFileSync(new URL('../client/index.html', import.meta.url), 'utf8'), readFileSync(new URL('../client/src-v22.js', import.meta.url), 'utf8'),
      readFileSync(bundle, 'utf8')), text);
  }
  assert.deepEqual(text.split('\n').filter((l) => FORBIDDEN.test(l)), []);
  assert.match(text, /Timing/);
  assert.match(text, /timing: o\.timing \|\| null/);
  for (const word of ['"submitted "', '"placed "', '"lock "']) assert.ok(text.includes(word), `the card names ${word}`);
});
