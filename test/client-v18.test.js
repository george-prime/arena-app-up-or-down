// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// VERSION 18: both halves of the book. The client is what its tool writes from version 15's head, the view's bundle and the market's
// script; no ticket number, name or old project name in it; the script sells through the page (ARENA_GAME.market.sell) on the entries
// that hold the shares; the signed manifest stands on version 17 and adds this file's hash beside the older clients'.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { buildV18, CSS_V18 } from '../tools/build-client-v18.mjs';
import { FORBIDDEN } from '../tools/build-client-v17.mjs';
import { HEAD_END } from '../tools/build-client-v16.mjs';
import { MANIFEST_V17, GAME_ID_V17 } from '../plugin/btc-updown-v17.js';
import { MANIFEST_V18, GAME_ID_V18, GAME } from '../plugin/btc-updown-v18.js';
import { manifestStands } from 'arena-sdk/manifest';
import { verifyEd25519 } from 'arena-sdk/ed25519';
import { toHex } from 'arena-sdk/hash';

const V15 = readFileSync(new URL('../client/index.html', import.meta.url), 'utf8');
const V18 = readFileSync(new URL('../client/index-v18.html', import.meta.url), 'utf8');
const SRC = readFileSync(new URL('../client/src-v18.js', import.meta.url), 'utf8');
const BUNDLE = new URL('../dist/updown-view.js', import.meta.url);
const script = V18.slice(V18.lastIndexOf('<script>'));

test('the file is what the tool writes (when the view is built here)', { skip: !existsSync(BUNDLE) && 'tools/build-view.mjs not run' }, () => {
  assert.equal(buildV18(V15, SRC, readFileSync(BUNDLE, 'utf8')), V18, 'client/index-v18.html is out of date: run tools/build-client-v18.mjs');
});

test('version 15\'s head with the styles version 18 adds; no ticket number, name or old project name', () => {
  assert.ok(V18.includes(CSS_V18 + HEAD_END));
  assert.deepEqual(V18.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => FORBIDDEN.test(l)), []);
});

test('the script sells through the page, split over the entries that hold the shares, and never more than they hold unoffered', () => {
  assert.doesNotThrow(() => new Function(script.slice('<script>'.length, script.lastIndexOf('</script>'))));
  assert.match(script, /await A\.market\.sell\(e\.entry, pick, a\.limitCents \* TICK, n \* SHARE\)/);
  assert.match(script, /const held = Math\.max\(0, sh\[side\] - sh\[1 - side\]\), free = Math\.max\(0, held - offered\)/);
  assert.match(script, /if \(sh > H\.free\) return \{ sell: true, why: /);
  // a market sell takes at least 10¢ under the best bid; a market buy at most 10¢ over the price or the best ask
  assert.match(script, /const limitCents = mode === 'market' \? Math\.max\(1, at - 10\) : at;/);
  assert.match(script, /Math\.min\(99, Math\.max\(priceOf\(pick\), ask !== null \? ask : 0\) \+ 10\)/);
  for (const k of ["data-dir", 'id:"sell"', 'id:"shares"', 'id:"cancelall"', 'id:"max"']) assert.ok(V18.includes(k) || V18.includes(k.replace(/"/g, "'")), k);
});

test('the manifest stands on version 17, its developer\'s, and pins this file beside the older clients', () => {
  const stands = manifestStands(MANIFEST_V18, { verify: verifyEd25519, parentOf: (id) => (toHex(id) === toHex(GAME_ID_V17) ? MANIFEST_V17 : null) });
  assert.ok(stands.ok, stands.why);
  assert.equal(MANIFEST_V18.version, MANIFEST_V17.version + 1);
  assert.equal(toHex(MANIFEST_V18.parentManifestId), toHex(GAME_ID_V17));
  assert.equal(toHex(MANIFEST_V18.gameDevPubkey), toHex(MANIFEST_V17.gameDevPubkey));
  const pins = MANIFEST_V18.clients.map(toHex);
  assert.ok(pins.includes(createHash('sha256').update(V18).digest('hex')), 'version 18 pins its own client');
  for (const c of MANIFEST_V17.clients) assert.ok(pins.includes(toHex(c)), 'version 17\'s clients stay pinned');
  assert.equal(toHex(GAME.gameId), toHex(GAME_ID_V18));
});
