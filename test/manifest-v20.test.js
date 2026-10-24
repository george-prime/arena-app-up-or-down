// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// VERSION 20: version 19 in every term but its clients - only the pages with no ticket number, name or old project name in them
// (index-v17.html, index-v18.html, index-v19.html); the signed manifest stands on version 19.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { FORBIDDEN } from '../tools/build-client-v17.mjs';
import { MANIFEST_V19, GAME_ID_V19 } from '../plugin/btc-updown-v19.js';
import { MANIFEST_V20, GAME } from '../plugin/btc-updown-v20.js';
import { manifestStands } from 'arena-sdk/manifest';
import { verifyEd25519 } from 'arena-sdk/ed25519';
import { toHex } from 'arena-sdk/hash';

test('the signed manifest stands on version 19 and pins only the three clean pages', () => {
  assert.equal(toHex(GAME.gameId), '04f468bf514c2af3cefee153d1cccf7b06c18ce1cb08f8e5fede7e92338857d6');
  const stands = manifestStands(MANIFEST_V20, { verify: verifyEd25519, parentOf: (id) => (toHex(id) === toHex(GAME_ID_V19) ? MANIFEST_V19 : null) });
  assert.ok(stands.ok, stands.why);
  const pages = [17, 18, 19].map((n) => readFileSync(new URL(`../client/index-v${n}.html`, import.meta.url)));
  assert.deepEqual(MANIFEST_V20.clients.map(toHex).sort(), pages.map((b) => createHash('sha256').update(b).digest('hex')).sort());
  for (const b of pages) assert.deepEqual(b.toString('utf8').split('\n').filter((l) => FORBIDDEN.test(l)), []);
  const { clients: a, version: va, parentManifestId: pa, signature: sa, ...rest20 } = MANIFEST_V20;
  const { clients: b, version: vb, parentManifestId: pb, signature: sb, ...rest19 } = MANIFEST_V19;
  void a; void va; void pa; void sa; void b; void vb; void pb; void sb;
  assert.deepEqual(rest20, rest19, 'every other term is version 19\'s');
});
