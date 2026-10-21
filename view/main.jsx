// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// BITCOIN UP OR DOWN'S VIEW, MOUNTED (version 16): window.UpDownView.mount(view, kindHost) answers { draw(vm, on), kind(text) } - the
// client's draw() hands each view model to it, at once (the client reads what it drew right after, as version 15 did). Built as one
// plain script (dist/updown-view.js) and inlined into client/index-v16.html, whose hash the manifest pins: nothing is fetched.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { UpDownView, KindChip } from './UpDownView.jsx';

export function mount(view, kindHost) {
  const root = createRoot(view), kindRoot = createRoot(kindHost);
  return {
    draw(vm, on = {}) { flushSync(() => root.render(<UpDownView vm={vm} on={on} />)); },
    kind(text) { flushSync(() => kindRoot.render(<KindChip text={text} />)); },
  };
}
if (typeof window !== 'undefined') window.UpDownView = { mount };
