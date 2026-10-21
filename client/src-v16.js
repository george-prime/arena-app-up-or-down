const A = window.parent && window.parent.ARENA_GAME;
const $ = (id) => document.getElementById(id);
const SCALE = 100000, TICK = 1000, PERIOD_MS = 15 * 60000;
const MIN_SHARES = 5, FEE_BPS = 100, MIN_SAT = 1, MAX_SAT = 100000;   // the book's minimum shares; 1 % fee; order-book.js limits
const usd = (c) => (c === null || c === undefined ? '…' : '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const sats = (n) => Math.floor(n).toLocaleString('en-US') + ' sats';
const hhmm = (ms) => new Date(ms).toISOString().slice(11, 16);
const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
// <history> (version 15's block, placed here by the tool)

// EVERYTHING ON THE SCREEN IS REACT'S (version 16): the view (view/UpDownView.jsx, inlined above) is handed one view model at every draw
// and every press and keystroke comes back through `on`; this script keeps the market - its rows, the book, the prices, the orders and
// what the sheet asks - as version 15 did
const VIEW = window.UpDownView.mount($('view'), $('kind-host'));
VIEW.kind('…');
if (!A || !A.market) {
  VIEW.draw({ outside: true });
} else {
  window.UPDOWN_CLIENT = { hash: A.clientHash, game: A.game.id, state: {} };
  // this client says its orders' progress itself: the page's strip over it stays away
  try { window.parent.ARENA_CLIENT_SAYS_JOIN = true; } catch {}
  $('back').onclick = () => A.back();
  const outcomes = A.game.outcomes.length ? A.game.outcomes : ['Up', 'Down'];
  // THE FEE AS THE MARKET'S TERMS NAME IT (version 13): the page hands the chosen version's terms (ARENA_GAME.game.fees)
  const fee = (() => {
    const F = A.game.fees, pc = (b) => `${(b / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })} %`;
    if (F && Number.isInteger(F.node) && Number.isInteger(F.donation)) return `Fee ${pc(F.node + F.donation)}: ${pc(F.node)} nodes + ${pc(F.donation - (F.reserve || 0))} donation`
      + `${F.reserve ? ` + ${pc(F.reserve)} protocol reserve` : ''}, due when the market resolves; all back if it is void.`;
    return 'Fee 1 %: 0.5 % nodes + 0.5 % donation, due when the market resolves; all back if it is void.';
  })();
  let pick = 0, mode = 'market', current = null, book = null, live = { now: null, beat: null, beatFor: null };
  // THE SHEET'S FIELDS, kept here: the view shows them and hands every keystroke back
  const form = { amt: '100', lp: '50', sh: '100', exp: '0' };
  let menuOpen = false, said = '', adv = false, xv = null, xvEl = null;
  const cancelling = new Set();
  // the window's card as last read: kept when no window is open
  let card = { kind: '…', q: '…', left: '', poly: null, beat: '…', now: '…', delta: { text: '…', color: '' } };
  // THE WINDOW AN ORDER CAN JOIN (version 5): the soonest joinable one, else the soonest open one
  const windowNow = () => {
    const open = (A.allRows ? A.allRows() : A.rows()).filter((r) => r.entryCloseMs && r.entryCloseMs > Date.now()).sort((x, y) => x.entryCloseMs - y.entryCloseMs);
    return open.find((r) => r.joinable) || open[0] || null;
  };
  // THE ORDER IN FLIGHT: the page's join and the pick it carries, said in the sheet and in My orders until the order is the page's
  let placing = null;
  function joinStatus() {
    const j = A.state().join;
    if (!j || !placing || j.round !== placing.round) return null;
    let line, cls = '';
    const st = String(j.stage || ''), starts = /round starts in ([0-9:]+)/.exec(st);
    if (j.state === 'refused') { line = 'Order not placed: ' + (j.why || 'refused'); cls = 'bad'; }
    else if (j.state === 'joining' && starts) { line = '✓ Order locked · the window starts in ' + starts[1]; cls = 'ok'; }
    else if (j.state === 'joining') { line = 'Placing your order … ' + (/^stake lock/.test(st) ? 'locking your stake in the federation' : (st || 'asking the round\'s seats')); }
    else { line = '✓ Order placed'; cls = 'ok'; }
    if (cls && !placing.doneAt) placing.doneAt = Date.now();
    if (!cls) placing.doneAt = 0;
    if (placing.doneAt && Date.now() - placing.doneAt > (cls === 'bad' ? 20000 : 10000) && !starts) { placing = null; return null; }
    return { state: j.state, line, cls };
  }
  // THE PRICE OF UP: the last certified batch's, else 50¢; Down is 1 less it
  const upCents = () => { const b = book && book.batches ? book.batches.filter((x) => x.price) : []; return b.length ? Math.round(Number(b[b.length - 1].price) / TICK) : 50; };
  const priceOf = (i) => (i === 0 ? upCents() : 100 - upCents());
  const net = (s) => s * (1 - FEE_BPS / 10000);
  async function prices() {
    try { const j = await (await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot', { cache: 'no-store' })).json(); live.now = Math.round(Number(j.data.amount) * 100); } catch {}
    if (current && live.beatFor !== current.id && Date.now() >= current.entryCloseMs - PERIOD_MS) {
      try {
        const start = current.entryCloseMs - PERIOD_MS, iso = (ms) => new Date(ms).toISOString();
        const c = await (await fetch(`https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=60&start=${iso(start - 60000)}&end=${iso(start)}`)).json();
        const before = c.filter((x) => x[0] * 1000 < start).sort((a, b) => b[0] - a[0])[0];
        if (before) { live.beat = Math.round(before[4] * 100); live.beatFor = current.id; }
      } catch {}
    }
    draw();
  }
  async function readBook() { if (current) { try { book = await A.market.book(current.id); } catch { book = null; } } draw(); }
  // WHAT THE SHEET ASKS: { stakeSat, limitCents, expiryMs, shares, win } or why not
  function asked() {
    if (mode === 'market') {
      const amt = Math.floor(Number(form.amt));
      const p = Math.min(99, priceOf(pick) + 10);               // a market order: at most 10¢ over the price now, filled at the batch's
      if (!(amt >= MIN_SAT && amt <= MAX_SAT)) return { why: `an amount of ${MIN_SAT} to ${MAX_SAT.toLocaleString('en-US')} sats` };
      const shares = Math.floor(net(amt) / (priceOf(pick) / 100));
      if (Math.floor(net(amt) / (p / 100)) < MIN_SHARES) return { why: `at this price an order is at least ${Math.ceil(MIN_SHARES * p / 100 / (1 - FEE_BPS / 10000))} sats` };
      // A MARKET ORDER DOES NOT REST: what its first batches do not fill expires 60 s on and comes back at settlement
      return { stakeSat: amt, limitCents: p, expiryMs: Date.now() + 60000, shares, win: shares };
    }
    const lp = Math.floor(Number(form.lp)), sh = Math.floor(Number(form.sh));
    if (!(lp >= 1 && lp <= 99)) return { why: 'a limit price of 1 to 99¢' };
    if (!(sh >= MIN_SHARES)) return { why: `at least ${MIN_SHARES} shares` };
    const stakeSat = Math.ceil(sh * lp / 100 / (1 - FEE_BPS / 10000));
    if (stakeSat > MAX_SAT) return { why: `at most ${MAX_SAT.toLocaleString('en-US')} sats an order` };
    const e = Number(form.exp);
    return { stakeSat, limitCents: lp, expiryMs: e ? Date.now() + e : 0, shares: sh, win: sh, total: sh * lp / 100 };
  }
  const PAST_KEY = 'arena.updown.past.v1';
  function draw() {
    current = windowNow();
    const now = Date.now();
    if (current) {
      const start = current.entryCloseMs - PERIOD_MS;
      const d = live.now !== null && live.beat !== null && now >= start ? live.now - live.beat : null;
      card = { kind: current.free ? 'FREE' : 'PAID', q: `BTC up or down, ${hhmm(start)}–${hhmm(current.entryCloseMs)} UTC?`,
        left: (now < start ? 'opens in ' + mmss(start - now) + ', ' : '') + 'closes in ' + mmss(current.entryCloseMs - now),
        poly: 'https://polymarket.com/event/btc-updown-15m-' + Math.floor(start / 1000), beat: now < start ? 'at ' + hhmm(start) : usd(live.beat), now: usd(live.now),
        delta: { text: d === null ? '–' : (d >= 0 ? '▲ ' : '▼ ') + usd(Math.abs(d)), color: d === null ? '' : d >= 0 ? 'var(--up)' : 'var(--down)' } };
    } else card = { ...card, q: 'No window is open on these nodes right now.' };
    const a = asked();
    const js = joinStatus();
    // MY ORDERS: one card per order, its result in it - the order (side, amount, limit, window) and the page's line for its entry
    const mine = A.market.orders();
    const lines = (A.state().picks || []).filter((l) => l && l.text);
    const lineOf = (o) => lines.find((l) => l.entry && l.entry === o.entry) || lines.find((l) => l.round === o.round && Number(l.pick) === Number(o.pick));
    const win = HISTORY.roundOf;
    const satsOf = (msat) => sats(Number(msat) / 1000);
    const flight = placing && js && !mine.some((o) => o.round === placing.round && o.placedMs >= placing.at - 1000)
      ? { key: 'flight', side: placing.pick, amount: sats(placing.stakeSat), limit: placing.limitCents, window: win(placing.entryCloseMs), cancel: null, cls: ' flight',
        chip: js.cls === 'bad' ? ['lost', 'not placed'] : js.cls ? ['open', js.line.includes('locked') ? 'locked' : 'placed'] : ['wait', 'placing…'] } : null;
    const rows = mine.map((o) => ({ o, l: lineOf(o) })).reverse();
    const isClosed = ({ o, l }) => HISTORY.isClosed(o, l);
    const open = rows.filter((r) => !isClosed(r)), closed = rows.filter(isClosed);
    const openCards = open.map(({ o, l }) => {
      const canCancel = !o.cancelled && o.entryCloseMs > Date.now() && !(l && l.state && l.state !== 'open');
      return { key: o.entry, side: Number(o.pick), amount: satsOf(o.stakeMsat), limit: Math.round(o.limitPrice / TICK), window: win(o.entryCloseMs),
        chip: HISTORY.resultOf(o, l, now), cancel: canCancel ? { entry: o.entry, busy: cancelling.has(o.entry) } : null };
    });
    // PAST ORDERS, KEPT IN THIS BROWSER (version 9): each closed order's summary - no key, no secret - merged with the tab's live ones
    let kept = []; try { kept = JSON.parse(window.localStorage.getItem(PAST_KEY) || '[]'); } catch { kept = []; }
    const past = HISTORY.merge(kept, closed, now);
    try { window.localStorage.setItem(PAST_KEY, JSON.stringify(past)); } catch { /* private window: this tab's only */ }
    const resultLine = (p) => HISTORY.resultLine(p, outcomes), isFinal = (p) => HISTORY.isFinal(p, now), statusLine = (p) => HISTORY.statusLine(p, now);
    const pastRows = past.map((p) => ({ entry: p.entry, side: p.side, window: win(p.closeMs), final: isFinal(p), status: statusLine(p), stake: satsOf(p.stakeMsat),
      limit: p.limit, result: resultLine(p), pl: HISTORY.plLine(p), plCls: HISTORY.plCls(p) }));
    const won = past.reduce((t, p) => t + (p.pnlMsat > 0 ? p.pnlMsat : 0), 0);
    const lost = past.reduce((t, p) => t + (p.pnlMsat < 0 ? -p.pnlMsat : 0), 0);
    const num = (msat) => Math.floor(Math.abs(Number(msat)) / 1000).toLocaleString('en-US');
    const totals = { count: past.length, won: satsOf(won), lost: satsOf(lost), net: satsOf(Math.abs(won - lost)), netMsat: won - lost,
      wonNum: num(won), lostNum: num(lost), netNum: num(won - lost), pend: past.filter((p) => !isFinal(p)).length };
    VIEW.kind(card.kind);
    VIEW.draw({ outcomes, view: adv ? 'advanced' : 'compact', ...card, chance: upCents() + '%', prices: [priceOf(0) + '¢', priceOf(1) + '¢'], pick, sideName: outcomes[pick],
      mode, modeLabel: 'Buy · ' + (mode === 'market' ? 'Market' : 'Limit'), menuOpen, form: { ...form },
      mwin: a.why ? '–' : sats(a.win), mprice: a.why ? '' : 'at ' + priceOf(pick) + '¢', ltotal: a.why ? '–' : sats(a.stakeSat), lwin: a.why ? '–' : sats(a.win),
      err: current && current.free ? 'Orders need a paid round' : (a.why || said),
      go: { disabled: !current || !!a.why || current.free || !!(js && js.state === 'joining' && !js.cls), text: 'Buy ' + outcomes[pick] },
      status: js ? { line: js.line, cls: js.cls } : null, fee,
      flight, open: openCards, mineEmpty: open.length || flight ? null : closed.length ? 'No open orders.' : 'No orders yet. Pick Up or Down and buy: your orders and their results show here.',
      past: pastRows, totals }, on);
    window.UPDOWN_CLIENT.history = past.map((p) => ({ entry: p.entry, round: win(p.closeMs), side: outcomes[p.side], stake: satsOf(p.stakeMsat), result: resultLine(p), pl: HISTORY.plLine(p), status: statusLine(p), final: isFinal(p), finalAtMs: p.finalAtMs }));
    window.UPDOWN_CLIENT.status = js;
    if (current) window.UPDOWN_CLIENT.state = { round: current.id, free: current.free, window: [current.entryCloseMs - PERIOD_MS, current.entryCloseMs], beat: live.beat, now: live.now, pick, mode, asked: a, orders: mine.length, upCents: upCents() };
  }
  // THE AMOUNT KEPT (version 12): the last one set, in this browser, read back on the next visit; 100 sats else
  const AMOUNT_KEY = 'arena.updown.amount';
  const keepAmount = () => { try { const v = Math.floor(Number(form.amt)); if (v >= MIN_SAT && v <= MAX_SAT) window.localStorage.setItem(AMOUNT_KEY, String(v)); } catch { /* this visit only */ } };
  try { const k = Math.floor(Number(window.localStorage.getItem(AMOUNT_KEY))); if (k >= MIN_SAT && k <= MAX_SAT) form.amt = String(k); } catch { /* 100 */ }
  // − AND +: a step that grows with the amount - 10 below 100, 100 below 1,000, 1,000 below 10,000, 10,000 above; − takes the step of
  // the amount just below, so 100 goes to 90 and 1,000 to 900
  const stepAt = (v) => (v < 100 ? 10 : v < 1000 ? 100 : v < 10000 ? 1000 : 10000);
  // THE EXCHANGE, ON A WIDE SCREEN OR IN ADVANCED: mounted into its host once, a tapped level fills a limit order on that side at that price
  const wide = window.matchMedia('(min-width:1000px)');
  const VIEW_KEY = 'arena.updown.view';
  try { adv = localStorage.getItem(VIEW_KEY) === 'advanced'; } catch { adv = false; }
  const mountXv = () => {
    if (xv || !xvEl || !(wide.matches || adv) || typeof A.market.exchange !== 'function') return;
    xv = A.market.exchange(xvEl, { round: () => current && current.id, label: (side) => 'Chance of ' + outcomes[side],
      onPrice: (cents, side) => { pick = side; mode = 'limit'; form.lp = String(Math.min(99, Math.max(1, cents))); draw(); } });
    window.UPDOWN_CLIENT.exchange = xv;
  };
  const setView = (v) => {
    adv = v === 'advanced';
    document.body.classList.toggle('adv', adv);
    try { localStorage.setItem(VIEW_KEY, adv ? 'advanced' : 'compact'); } catch { /* this view only */ }
    window.UPDOWN_CLIENT.view = adv ? 'advanced' : 'compact';
    mountXv(); draw();
  };
  // EVERY PRESS AND KEYSTROKE, from the view
  const on = {
    pick: (i) => { pick = i; draw(); },
    menu: () => { menuOpen = !menuOpen; draw(); },
    mode: (m) => { mode = m; menuOpen = false; if (m === 'limit') form.lp = String(priceOf(pick)); draw(); },
    input: (k, v) => { form[k] = v; if (k === 'amt') keepAmount(); draw(); },
    step: (dir) => {
      const v = Math.floor(Number(form.amt)) || 0;
      const next = dir > 0 ? v + stepAt(v) : v - stepAt(Math.max(1, v - 1));
      form.amt = String(Math.min(MAX_SAT, Math.max(MIN_SAT, next))); keepAmount(); draw();
    },
    add: (n) => { form.amt = String(Math.min(MAX_SAT, (Math.floor(Number(form.amt)) || 0) + n)); keepAmount(); draw(); },
    sh: (n) => { form.sh = String(Math.max(0, (Math.floor(Number(form.sh)) || 0) + n)); draw(); },
    lp: (n) => { form.lp = String(Math.min(99, Math.max(1, (Math.floor(Number(form.lp)) || 50) + n))); draw(); },
    cancel: async (id) => {
      cancelling.add(id); draw();
      const r = await A.market.cancel(id);
      cancelling.delete(id); said = r.ok ? '' : 'Cancel refused: ' + (r.why || (r.seats || []).map((s) => s.why).join('; ')); draw();
    },
    go: () => {
      const a = asked(); if (a.why) return;
      said = '';
      placing = { round: current.id, pick, limitCents: a.limitCents, stakeSat: a.stakeSat, entryCloseMs: current.entryCloseMs, at: Date.now(), doneAt: 0 };
      const ok = A.market.order(current.id, pick, a.limitCents * TICK, a.expiryMs, a.stakeSat * 1000);
      if (ok === false) { placing = null; said = 'The page did not take the order: ' + ((A.state().join || {}).why || 'no answer'); }
      draw();
      setTimeout(draw, 500);
    },
    view: (v) => setView(v),
    // the exchange's host, once React has made it: mounted after this draw
    xvHost: (el) => { xvEl = el; if (el) setTimeout(mountXv, 0); },
  };
  setView(adv ? 'advanced' : 'compact');
  prices(); readBook();
  setInterval(draw, 1000); setInterval(prices, 5000); setInterval(readBook, 3000);
  if (wide.addEventListener) wide.addEventListener('change', mountXv);
}
