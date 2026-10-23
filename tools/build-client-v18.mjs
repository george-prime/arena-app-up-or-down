// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// BITCOIN UP OR DOWN'S CLIENT, VERSION 18: both halves of the book. Version 16's frame (version 15's head and history, the view's bundle,
// the market's script) built from client/src-v18.js and the view of version 18 - Buy or Sell on the sheet, the sell sheet, My shares
// and the sells as cards - with the styles they add, and every comment cleaned as version 17's were.
//
//   node packages/btc-updown/tools/build-view.mjs && node packages/btc-updown/tools/build-client-v18.mjs
// Writes client/index-v18.html; a new hash, so the manifest is signed next (tools/sign-manifest-v18.mjs).
import { readFileSync, writeFileSync } from 'node:fs';
import { buildV16, HEAD_END } from './build-client-v16.mjs';
import { FORBIDDEN, cleanText } from './build-client-v17.mjs';

const V15 = new URL('../client/index.html', import.meta.url);
const SRC = new URL('../client/src-v18.js', import.meta.url);
const BUNDLE = new URL('../dist/updown-view.js', import.meta.url);
const OUT = new URL('../client/index-v18.html', import.meta.url);

/** The styles version 18 adds: the Buy/Sell switch, Max, a side's Sell, Cancel all, My shares, a sell's card. */
export const CSS_V18 = `
  .bs { display:flex; gap:4px; padding:3px; border-radius:11px; background:#11151d; border:1px solid var(--line); }
  .bs button { font:700 14px system-ui; padding:6px 16px; border-radius:8px; border:0; background:transparent; color:var(--dim); }
  .bs button.on { background:#232937; color:var(--text); box-shadow:0 0 0 1px var(--line); }
  .max { background:#2a3040; border:0; border-radius:8px; padding:3px 9px; font:700 12px system-ui; margin-left:6px; }
  .sellbtn { background:#3a1216; color:#ff8a94; border:0; border-radius:8px; padding:4px 12px; font:700 12.5px system-ui; }
  .cancelall { float:right; background:none; border:1px solid var(--line); border-radius:7px; padding:1px 8px; font:600 11.5px system-ui; color:var(--dim); text-transform:none; letter-spacing:0; }
  .shares h3 { margin:0 0 6px !important; }
  .shares table.past td, .shares table.past th { padding:6px 5px; }
  .shares .nw { white-space:nowrap; }
  .ord.sell { border-style:dashed; }
`;

export function buildV18(v15, src, bundle) {
  const at = v15.indexOf(HEAD_END);
  if (at < 0) throw new Error('version 15 has no end of head');
  const styled = v15.slice(0, at) + CSS_V18 + v15.slice(at);
  return buildV16(styled, src, bundle).split('\n').map((l) => (FORBIDDEN.test(l) ? cleanText(l) : l)).join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = buildV18(readFileSync(V15, 'utf8'), readFileSync(SRC, 'utf8'), readFileSync(BUNDLE, 'utf8'));
  if (out.split('\n').some((l) => FORBIDDEN.test(l))) throw new Error('a forbidden word is left in version 18');
  writeFileSync(OUT, out);
  console.log(`client/index-v18.html: ${out.length} bytes`);
}
