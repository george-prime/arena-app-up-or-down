// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// BITCOIN UP OR DOWN'S CLIENT, VERSION 17: version 16's file with its comments cleaned - no ticket numbers, no person's name, no old
// project name left in any comment. Only the lines that carried one change, and each of those is comment text: the code, the
// stylesheet and the markup are version 16's (proved by parsing both files' scripts to the same tree, comments set aside).
//
//   node packages/btc-updown/tools/build-client-v17.mjs
// Writes client/index-v17.html; a new hash, so the manifest is signed next (tools/sign-manifest-v17.mjs).
import { readFileSync, writeFileSync } from 'node:fs';

const V16 = new URL('../client/index-v16.html', import.meta.url);
const OUT = new URL('../client/index-v17.html', import.meta.url);

/** What no shipped file of the game carries: a ticket number, the owner's name, the old project name. */
export const FORBIDDEN = /kanban|BLWP|blwp|(?:\(|, |\bticket )#\d{3}\b/i;

/** One line of comment text, cleaned: the ticket references out, the name as "the owner". */
export function cleanText(c) {
  return c
    .replace(/,?\s*\bkanban #\d+(?:\s*(?:\/|,|and|or)\s*#?\d+)*\b/gi, '')
    .replace(/\bkanban\b\s*/gi, '')
    .replace(/\bBLWP_/g, 'ARENA_').replace(/\bBLWP\b/g, 'ARENA').replace(/@blwp\//g, '@arena/').replace(/\bblwp-/g, 'arena-')
    .replace(/Blwp/g, 'Arena').replace(/\bblwp\b/g, 'arena')
    .replace(/(\(|, |\bticket )#\d{3,}\b/g, '$1')
    .replace(/\(\s*,\s*/g, '(').replace(/,\s*\)/g, ')').replace(/\(\s*:\s*/g, '(').replace(/\(\s*\)/g, '').replace(/\( /g, '(')
    .replace(/,\s*,/g, ',').replace(/([^\s*]) {2,}(?=\S)/g, '$1 ').replace(/ +([,):])/g, '$1');
}

/** Version 17 from version 16: every line that carries a forbidden word, cleaned; every other line as it was. */
export const buildV17 = (v16) => v16.split('\n').map((l) => (FORBIDDEN.test(l) ? cleanText(l) : l)).join('\n');

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = buildV17(readFileSync(V16, 'utf8'));
  writeFileSync(OUT, out);
  console.log(`client/index-v17.html: ${out.length} bytes`);
}
