// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// VERSION 16: the client is what its tool writes from version 15's file, the view's bundle and the market's script; version 15's head and
// stylesheet and its history block are kept byte for byte; nothing in the market's script draws by hand; the signed manifest stands on
// version 15 and adds this file's hash beside the older clients'.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { buildV16, historyOf, HEAD_END } from '../tools/build-client-v16.mjs';

const V15 = readFileSync(new URL('../client/index.html', import.meta.url), 'utf8');
const V16 = readFileSync(new URL('../client/index-v16.html', import.meta.url), 'utf8');
const SRC = readFileSync(new URL('../client/src-v16.js', import.meta.url), 'utf8');
const BUNDLE = new URL('../dist/updown-view.js', import.meta.url);
const script = V16.slice(V16.lastIndexOf('<script>'));

// the view has moved on since (version 18 draws Sell too): the file is rebuilt only from the bundle it carries
const bundleIsV16 = existsSync(BUNDLE) && V16.includes(readFileSync(BUNDLE, 'utf8').trim());
test('the file is what the tool writes (when the view is built here)', { skip: !bundleIsV16 && 'tools/build-view.mjs not run, or the view is a later version\'s' }, () => {
  assert.equal(buildV16(V15, SRC, readFileSync(BUNDLE, 'utf8')), V16, 'client/index-v16.html is out of date: run tools/build-client-v16.mjs');
});

test('version 15\'s head, stylesheet and history block, byte for byte', () => {
  assert.equal(V16.slice(0, V16.indexOf(HEAD_END)), V15.slice(0, V15.indexOf(HEAD_END)));
  assert.equal(historyOf(V16), historyOf(V15));
});

test('the market\'s script draws nothing by hand: one view model to React at every draw', () => {
  for (const gone of ['innerHTML', '.textContent =', 'querySelectorAll', 'classList.toggle(\'on\'', 'esc(', '.hidden =', '.disabled ='])
    assert.ok(!script.includes(gone), gone);
  assert.match(script, /const VIEW = window\.UpDownView\.mount\(\$\('view'\), \$\('kind-host'\)\);/);
  assert.match(script, /VIEW\.draw\(\{ outside: true \}\);/);
  assert.match(script, /VIEW\.draw\(\{ outcomes, view: adv \? 'advanced' : 'compact', \.\.\.card,/);
  assert.match(V16, /<span id="kind-host" style="display:contents"><\/span><\/header>\n<div id="view" style="display:contents"><\/div>/);
  assert.doesNotThrow(() => new Function(script.slice('<script>'.length, script.lastIndexOf('</script>'))));
});

test('the signed manifest stands on version 15 and pins this client beside the older ones', async () => {
  const { MANIFEST_V16, GAME_ID_V16, GAME } = await import('../plugin/btc-updown-v16.js');
  const { MANIFEST_V15, GAME_ID_V15 } = await import('../plugin/btc-updown-v15.js');
  const { manifestStands } = await import('arena-sdk/manifest');
  const { verifyEd25519 } = await import('arena-sdk/ed25519');
  const hex = (b) => Buffer.from(b).toString('hex');
  assert.equal(MANIFEST_V16.version, 16);
  assert.equal(hex(MANIFEST_V16.parentManifestId), hex(GAME_ID_V15));
  const v16 = createHash('sha256').update(V16).digest('hex');
  assert.deepEqual(MANIFEST_V16.clients.map(hex).sort(), [...new Set([v16, ...MANIFEST_V15.clients.map(hex)])].sort());
  assert.deepEqual(MANIFEST_V16.cores.map((c) => hex(c.hash)), MANIFEST_V15.cores.map((c) => hex(c.hash)));
  assert.equal(MANIFEST_V16.requiredProtocolVersion, MANIFEST_V15.requiredProtocolVersion);
  assert.equal(manifestStands(MANIFEST_V16, { verify: verifyEd25519, parentOf: (id) => (hex(id) === hex(GAME_ID_V15) ? MANIFEST_V15 : null) }).ok, true);
  assert.equal(hex(GAME.gameId), hex(GAME_ID_V16));
});
