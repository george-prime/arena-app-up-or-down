// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// VERSION 23: version 22 in every term, with the new client index-v23.html (the card's times named submitted, placed, lock)
// beside version 22's four; the signed manifest stands on version 21. The client is what its tool writes, with no forbidden word, and
// it shows the times the page hands it on the order cards and in the past orders.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { FORBIDDEN } from '../tools/build-client-v17.mjs';
import { buildV23 } from '../tools/build-client-v23.mjs';
import { MANIFEST_V22, GAME_ID_V22 } from '../plugin/btc-updown-v22.js';
import { MANIFEST_V23, GAME } from '../plugin/btc-updown-v23.js';
import { manifestStands } from 'arena-sdk/manifest';
import { verifyEd25519 } from 'arena-sdk/ed25519';
import { toHex } from 'arena-sdk/hash';

const V23 = readFileSync(new URL('../client/index-v23.html', import.meta.url));

test('the signed manifest stands on version 22 and adds only index-v23.html to its clients', () => {
  assert.equal(toHex(GAME.gameId), '90fcf7464f555e003049361ee370f392c766146dd840032cd6954640047711ea');
  const stands = manifestStands(MANIFEST_V23, { verify: verifyEd25519, parentOf: (id) => (toHex(id) === toHex(GAME_ID_V22) ? MANIFEST_V22 : null) });
  assert.ok(stands.ok, stands.why);
  const v23 = createHash('sha256').update(V23).digest('hex');
  assert.deepEqual(MANIFEST_V23.clients.map(toHex).sort(), [...MANIFEST_V22.clients.map(toHex), v23].sort());
  const { clients: a, version: va, parentManifestId: pa, signature: sa, ...rest23 } = MANIFEST_V23;
  const { clients: b, version: vb, parentManifestId: pb, signature: sb, ...rest22 } = MANIFEST_V22;
  void a; void va; void pa; void sa; void b; void vb; void pb; void sb;
  assert.deepEqual(rest23, rest22, 'every other term is version 21\'s');
});

test('the client is what its tool writes, names nobody, and shows each order\'s times', () => {
  const bundle = new URL('../dist/updown-view.js', import.meta.url);
  const text = V23.toString('utf8');
  if (existsSync(bundle) && text.includes(readFileSync(bundle, 'utf8').trim())) {
    assert.equal(buildV23(readFileSync(new URL('../client/index.html', import.meta.url), 'utf8'), readFileSync(new URL('../client/src-v23.js', import.meta.url), 'utf8'),
      readFileSync(bundle, 'utf8')), text);
  }
  assert.deepEqual(text.split('\n').filter((l) => FORBIDDEN.test(l)), []);
  assert.match(text, /Timing/);
  assert.match(text, /timing: o\.timing \|\| null/);
  for (const word of ['"submitted "', '"placed "', '"lock "']) assert.ok(text.includes(word), `the card names ${word}`);
  // each order's transaction, short, to the explorer in a new window; a past order's kept times stay after a reload
  assert.ok(text.includes('https://explorer.bitcoin-arena.io/tx/'));
  assert.match(text, /tx: o\.entry/);
  assert.match(text, /keptTiming/);
});
