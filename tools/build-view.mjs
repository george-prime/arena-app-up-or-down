// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// BITCOIN UP OR DOWN'S VIEW, BUILT BY ITS OWN PACKAGE (version 16): view/ bundled with React into one plain script, dist/updown-view.js,
// which tools/build-client-v16.mjs inlines into the version-16 client (whose hash its manifest pins). esbuild and React come from this
// package or, inside the Arena's tree, from packages/arena-web.
//
//     node packages/btc-updown/tools/build-view.mjs
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const own = createRequire(join(root, 'package.json'));
const from = (() => { try { own.resolve('esbuild'); own.resolve('react'); return root; } catch { return join(root, '../arena-web'); } })();
const { build } = await import(createRequire(join(from, 'package.json')).resolve('esbuild'));
await build({ entryPoints: [join(root, 'view/main.jsx')], bundle: true, format: 'iife', minify: true, jsx: 'automatic', target: ['es2020', 'safari15'],
  define: { 'process.env.NODE_ENV': '"production"' }, outfile: join(root, 'dist/updown-view.js'), legalComments: 'none', nodePaths: [join(from, 'node_modules')] });
console.log(`built dist/updown-view.js (esbuild and React from ${from === root ? 'this package' : 'packages/arena-web'})`);
