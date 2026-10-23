// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// VERSION 19: version 18 with a cancel on each resting sell. The client is what its tool writes from version 15's head, the view's bundle and the market's
// script; no ticket number, name or old project name in it; the script sells through the page (ARENA_GAME.market.sell) on the entries
// that hold the shares; the signed manifest stands on version 18 and adds this file's hash beside the older clients'.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { buildV19, CSS_V19 } from '../tools/build-client-v19.mjs';
import { FORBIDDEN } from '../tools/build-client-v17.mjs';
import { HEAD_END } from '../tools/build-client-v16.mjs';
import { MANIFEST_V18, GAME_ID_V18 } from '../plugin/btc-updown-v18.js';
import { MANIFEST_V19, GAME_ID_V19, GAME } from '../plugin/btc-updown-v19.js';
import { manifestStands } from 'arena-sdk/manifest';
import { verifyEd25519 } from 'arena-sdk/ed25519';
import { toHex } from 'arena-sdk/hash';

const V15 = readFileSync(new URL('../client/index.html', import.meta.url), 'utf8');
const V19 = readFileSync(new URL('../client/index-v19.html', import.meta.url), 'utf8');
const SRC = readFileSync(new URL('../client/src-v19.js', import.meta.url), 'utf8');
const BUNDLE = new URL('../dist/updown-view.js', import.meta.url);
const script = V19.slice(V19.lastIndexOf('<script>'));

// the view has moved on since (version 19 cancels a resting sell): the file is rebuilt only from the bundle it carries
const bundleIsV19 = existsSync(BUNDLE) && V19.includes(readFileSync(BUNDLE, 'utf8').trim());
test('the file is what the tool writes (when the view is built here)', { skip: !bundleIsV19 && 'tools/build-view.mjs not run, or the view is a later version\'s' }, () => {
  assert.equal(buildV19(V15, SRC, readFileSync(BUNDLE, 'utf8')), V19, 'client/index-v19.html is out of date: run tools/build-client-v19.mjs');
});

test('version 15\'s head with the styles version 18 adds; no ticket number, name or old project name', () => {
  assert.ok(V19.includes(CSS_V19 + HEAD_END));
  assert.deepEqual(V19.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => FORBIDDEN.test(l)), []);
});

test('the script sells through the page, split over the entries that hold the shares, and never more than they hold unoffered', () => {
  assert.doesNotThrow(() => new Function(script.slice('<script>'.length, script.lastIndexOf('</script>'))));
  assert.match(script, /await A\.market\.sell\(e\.entry, pick, a\.limitCents \* TICK, n \* SHARE\)/);
  assert.match(script, /const held = Math\.max\(0, sh\[side\] - sh\[1 - side\]\), free = Math\.max\(0, held - offered\)/);
  assert.match(script, /if \(sh > H\.free\) return \{ sell: true, why: /);
  // a market sell takes at least 10¢ under the best bid; a market buy at most 10¢ over the price or the best ask
  assert.match(script, /const limitCents = mode === 'market' \? Math\.max\(1, at - 10\) : at;/);
  assert.match(script, /Math\.min\(99, Math\.max\(priceOf\(pick\), ask !== null \? ask : 0\) \+ 10\)/);
  for (const k of ["data-dir", 'id:"sell"', 'id:"shares"', 'id:"cancelall"', 'id:"max"', '"data-cancel-sell"']) assert.ok(V19.includes(k) || V19.includes(k.replace(/"/g, "'")), k);
  // A RESTING SELL IS CANCELLED WITH ITS ORDER, and then says so
  assert.match(script, /const cancel = chip\[1\] === 'offered' \? \{ entry: o\.entry, busy: cancelling\.has\(o\.entry\) \} : null;/);
  assert.match(script, /o\.cancelled \? \['lost', 'cancelled'\]/);
});

test('the manifest stands on version 18, its developer\'s, and pins this file beside the older clients', () => {
  const stands = manifestStands(MANIFEST_V19, { verify: verifyEd25519, parentOf: (id) => (toHex(id) === toHex(GAME_ID_V18) ? MANIFEST_V18 : null) });
  assert.ok(stands.ok, stands.why);
  assert.equal(MANIFEST_V19.version, MANIFEST_V18.version + 1);
  assert.equal(toHex(MANIFEST_V19.parentManifestId), toHex(GAME_ID_V18));
  assert.equal(toHex(MANIFEST_V19.gameDevPubkey), toHex(MANIFEST_V18.gameDevPubkey));
  const pins = MANIFEST_V19.clients.map(toHex);
  assert.ok(pins.includes(createHash('sha256').update(V19).digest('hex')), 'version 19 pins its own client');
  for (const c of MANIFEST_V18.clients) assert.ok(pins.includes(toHex(c)), 'version 18\'s clients stay pinned');
  assert.equal(toHex(GAME.gameId), toHex(GAME_ID_V19));
});
