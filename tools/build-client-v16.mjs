// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// BITCOIN UP OR DOWN'S CLIENT, VERSION 16: everything on the screen drawn by React. Written from three parts - version 15's file
// (client/index.html: its head and stylesheet, unchanged, its history block <history> ... </history> line for line, and its end), the
// view's bundle (dist/updown-view.js, from view/), and the market's script (client/src-v16.js: the rows, the book, the prices, the
// orders and what the sheet asks, as version 15 kept them, handing one view model to the view at every draw).
//
//   node packages/btc-updown/tools/build-view.mjs && node packages/btc-updown/tools/build-client-v16.mjs
// Writes client/index-v16.html; a new hash, so the manifest is signed next (tools/sign-manifest-v16.mjs).
import { readFileSync, writeFileSync } from 'node:fs';

const V15 = new URL('../client/index.html', import.meta.url);
const SRC = new URL('../client/src-v16.js', import.meta.url);
const BUNDLE = new URL('../dist/updown-view.js', import.meta.url);
const OUT = new URL('../client/index-v16.html', import.meta.url);
export const HEAD_END = '</style></head><body>';
export const HISTORY_PLACE = "// <history> (version 15's block, placed here by the tool)";
// the page's frame around the view: the back button and the title stay markup; the chip and the market are React's hosts
export const BODY = `
<button class="back" type="button" id="back" title="Back to Bitcoin Arena">&larr; Arena</button>
<header><h1>Bitcoin Up or Down<span class="arrows" aria-hidden="true"><span class="up">&#9650;</span><span class="down">&#9660;</span></span></h1><span id="kind-host" style="display:contents"></span></header>
<div id="view" style="display:contents"></div>
`;

/** Version 15's history block, exactly. */
export const historyOf = (v15) => {
  const a = v15.indexOf('// <history>'), b = v15.indexOf('// </history>');
  if (a < 0 || b < a) throw new Error('version 15 has no <history> block');
  return v15.slice(a, b + '// </history>'.length);
};

export function buildV16(v15, src, bundle) {
  const at = v15.indexOf(HEAD_END);
  if (at < 0) throw new Error('version 15 has no end of head');
  if (src.split(HISTORY_PLACE).length !== 2) throw new Error('src-v16.js names the history block once');
  const script = src.replace(HISTORY_PLACE, () => historyOf(v15));
  const end = v15.slice(v15.lastIndexOf('</script>') + '</script>'.length);
  return v15.slice(0, at + HEAD_END.length) + BODY + '<script>\n' + bundle.trim() + '\n</script>\n<script>\n' + script.trim() + '\n</script>' + end;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = buildV16(readFileSync(V15, 'utf8'), readFileSync(SRC, 'utf8'), readFileSync(BUNDLE, 'utf8'));
  writeFileSync(OUT, out);
  console.log(`client/index-v16.html: ${out.length} bytes`);
}
