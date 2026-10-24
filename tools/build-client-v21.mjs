// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// BITCOIN UP OR DOWN'S CLIENT, VERSION 21: version 19 with each order's times from the press - accepted, and its lock - on its card,
// its history card and its past orders' row (from the page's ARENA_GAME.market.orders() `timing`).
// VERSION 19 WAS: version 18 with a cancel on each resting sell (the order's cancel takes it out of the book). Version 16's frame (version 15's head and history, the view's bundle,
// the market's script) built from client/src-v19.js and the view of version 19 - Buy or Sell on the sheet, the sell sheet, My shares
// and the sells as cards - with the styles they add, and every comment cleaned as version 17's were.
//
//   node packages/btc-updown/tools/build-view.mjs && node packages/btc-updown/tools/build-client-v21.mjs
// Writes client/index-v21.html; a new hash, so the manifest is signed next (tools/sign-manifest-v21.mjs).
import { readFileSync, writeFileSync } from 'node:fs';
import { buildV16, HEAD_END } from './build-client-v16.mjs';
import { FORBIDDEN, cleanText } from './build-client-v17.mjs';
import { CSS_V19 } from './build-client-v19.mjs';

const V15 = new URL('../client/index.html', import.meta.url);
const SRC = new URL('../client/src-v21.js', import.meta.url);
const BUNDLE = new URL('../dist/updown-view.js', import.meta.url);
const OUT = new URL('../client/index-v21.html', import.meta.url);

/** The styles version 21 adds to version 19's: an order's times, small under its window. */
export const CSS_V21 = CSS_V19 + `
  .tm { font:600 11.5px system-ui; color:var(--dim); margin-top:2px; white-space:nowrap; }
  table.past td.tm { margin:0; }
`;

export function buildV21(v15, src, bundle) {
  const at = v15.indexOf(HEAD_END);
  if (at < 0) throw new Error('version 15 has no end of head');
  const styled = v15.slice(0, at) + CSS_V21 + v15.slice(at);
  return buildV16(styled, src, bundle).split('\n').map((l) => (FORBIDDEN.test(l) ? cleanText(l) : l)).join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = buildV21(readFileSync(V15, 'utf8'), readFileSync(SRC, 'utf8'), readFileSync(BUNDLE, 'utf8'));
  if (out.split('\n').some((l) => FORBIDDEN.test(l))) throw new Error('a forbidden word is left in version 21');
  writeFileSync(OUT, out);
  console.log(`client/index-v21.html: ${out.length} bytes`);
}
