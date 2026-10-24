// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// BITCOIN UP OR DOWN'S CLIENT, DRAWN BY REACT (version 16): everything version 15 built as markup and wrote by hand - the window's
// question and prices, Buy Up / Buy Down, the buy sheet (Market: the amount and its steps; Limit: price, shares, expiry), the order's
// progress, My orders as cards, the history and the past orders' table with their totals - drawn from one view model the client's
// draw() makes each second and on every change. Version 18 adds the other half of the book: Buy or Sell on the sheet, the sell sheet
// (Market or Limit, the shares and Max, what it brings), My shares with a Sell on each side, and each sell as a card. The client keeps the market (its rows, the book, the prices, the orders, what the sheet
// asks); these components hand every press and keystroke back through `on`. The classes and ids are version 15's: its CSS, unchanged.
import React from 'react';

const sideMark = (side) => (side === 0 ? '▲' : '▼');
const sideCls = (side) => (side === 0 ? 'up' : 'down');

/** The header's chip: { text } - FREE, PAID, or … before the first window is read. */
export const KindChip = ({ text }) => <span className="chip" id="kind">{text}</span>;

/** One order as a card: { side, amount, limit, window, chip: [class, text], cancel: { entry, busy } | null, cls }. */
/** HOW LONG AN ORDER TOOK, FROM THE PRESS (version 21, Daniel 2026-10-24: "Display the order accept time and lock time"; version 22, the same day:
 *  "ich seh keine 0.5s submitted. Es muss submitted und lock dastehen" - the card names what the note at the foot says): submitted to the
 *  first seat, placed on enough seats, its lock accepted by the guardians, in seconds to two places. */
export function timingLine(t) {
  if (!t) return '';
  const s = (ms) => (Number(ms) / 1000).toFixed(2) + ' s';
  return [t.submittedMs !== undefined ? 'submitted ' + s(t.submittedMs) : '', t.placedMs !== undefined ? 'placed ' + s(t.placedMs) : '',
    t.lockMs !== undefined ? 'lock ' + s(t.lockMs) : ''].filter(Boolean).join(' · ');
}
export function OrderCard({ c, outcomes, onCancel }) {
  return (
    <div className={`ord${c.cls || ''}`}>
      <span className={`sd ${sideCls(c.side)}`}>{sideMark(c.side)} {outcomes[c.side] || c.side}</span>
      <div className="what"><b>{c.amount}</b> <span className="lim">≤ {c.limit}¢</span><div className="win">{c.window}</div>
        {timingLine(c.timing) ? <div className="tm">{timingLine(c.timing)}</div> : null}</div>
      <div className="st"><span className={`chip2 ${c.chip[0]}`}>{c.chip[1]}</span>
        {c.cancel ? <button type="button" data-cancel={c.cancel.entry} disabled={!!c.cancel.busy} onClick={() => onCancel(c.cancel.entry)}>cancel</button> : null}</div>
    </div>);
}

/** A past order as a card (a phone's history): { side, window, final, status, stake, result, pl, plCls }. */
export function PastCard({ p, outcomes }) {
  return (
    <div className="pastc">
      <div className="ph"><span className={`sd ${sideCls(p.side)}`}>{sideMark(p.side)} {outcomes[p.side] || p.side}</span>
        <b className="rd">{p.window}</b><span className={`fin${p.final ? '' : ' pend'}`}>{p.status}</span></div>
      <div className="pg"><div><span>Stake</span><b>{p.stake}</b></div><div><span>Result</span><b>{p.result}</b></div>
        <div><span>P/L</span><b className={p.plCls}>{p.pl}</b></div></div>
      {timingLine(p.timing) ? <div className="tm">{timingLine(p.timing)}</div> : null}
    </div>);
}

/** The past orders as a table (a desktop's): the same rows. */
export function PastTable({ past, outcomes }) {
  if (!past.length) return <div className="sub">No past orders yet: an order shows here once its round has a result.</div>;
  return (
    <table className="past"><thead><tr><th>Round</th><th>Side</th><th className="n">Stake</th><th>Result</th><th className="n">P/L</th><th>Status</th><th>Timing</th></tr></thead>
      <tbody>{past.map((p) => (
        <tr key={p.entry}><td>{p.window}</td><td className={sideCls(p.side)}>{sideMark(p.side)} {outcomes[p.side] || p.side}</td>
          <td className="n">{p.stake} <span className="sub">≤ {p.limit}¢</span></td><td>{p.result}</td><td className={`n ${p.plCls}`}>{p.pl}</td>
          <td className={p.final ? '' : 'pend'}>{p.status}</td><td className="tm">{timingLine(p.timing) || '–'}</td></tr>))}</tbody></table>);
}

/** The totals: { count, won, lost, net, wonNum, lostNum, netNum, pend } - the full words, and on a phone one short line. */
export function TotalsLong({ t }) {
  return (
    <>{t.count} closed · won <b className="won">+{t.won}</b> · lost <b className="lost">−{t.lost}</b> · net <b className={t.netMsat >= 0 ? 'won' : 'lost'}>{t.netMsat >= 0 ? '+' : '−'}{t.net}</b>
      {t.pend ? ` · ${t.pend} pending` : ''}</>);
}
export function TotalsShort({ t }) {
  return (
    <>{t.count} closed · <b className="won">+{t.wonNum}</b> · <b className="lost">−{t.lostNum}</b> · net <b className={t.netMsat >= 0 ? 'won' : 'lost'}>{t.netMsat > 0 ? '+' : t.netMsat < 0 ? '−' : '±'}{t.netNum} sats</b>
      {t.pend ? ` · ${t.pend} pending` : ''}</>);
}

/** One sell as a card: { side, shares, limit, window, chip: [class, text], cancel: { entry, busy } | null } - version 19: a resting sell
 *  is cancelled with its order (the order's cancel takes its resting buy and sells out of the book). */
export function SellCard({ c, outcomes, onCancel }) {
  return (
    <div className="ord sell">
      <span className={`sd ${sideCls(c.side)}`}>{sideMark(c.side)} {outcomes[c.side] || c.side}</span>
      <div className="what"><b>Sell {c.shares}</b> <span className="lim">≥ {c.limit}¢</span><div className="win">{c.window}</div></div>
      <div className="st"><span className={`chip2 ${c.chip[0]}`}>{c.chip[1]}</span>
        {c.cancel && onCancel ? <button type="button" data-cancel-sell={c.key} disabled={!!c.cancel.busy} onClick={() => onCancel(c.cancel.entry)}>cancel</button> : null}</div>
    </div>);
}

/** My shares in the window: per side { side, shares, avg, now, value, offered, canSell } - each with its Sell. */
export function SharesCard({ rows, outcomes, onSell }) {
  if (!rows.length) return null;
  return (
    <div className="card shares" id="shares"><h3>My shares</h3>
      <table className="past"><thead><tr><th>Side</th><th className="n">Shares</th><th className="n">Avg</th><th className="n">Now</th><th className="n">Value</th><th /></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.side}><td className={`${sideCls(r.side)} nw`}>{sideMark(r.side)} {outcomes[r.side] || r.side}</td>
            <td className="n">{r.shares}{r.offered ? <div className="sub">{r.offered} offered</div> : null}</td><td className="n">{r.avg}</td><td className="n">{r.now}</td><td className="n nw">{r.value}</td>
            <td className="n">{r.canSell ? <button type="button" className="sellbtn" data-sell={r.side} onClick={() => onSell(r.side)}>Sell</button> : <span className="sub">{r.why}</span>}</td></tr>))}</tbody></table>
    </div>);
}

/** The buy sheet: Market (the amount, its steps and To win) or Limit (price, shares, expiry, Total, To win), the error, Buy and its progress. */
export class Sheet extends React.Component {
  render() {
    const { v, on } = this.props;
    const f = v.form;
    return (
      <div className="sheet">
        <div className="top">
          <div className="bs" role="group" aria-label="buy or sell">
            {['buy', 'sell'].map((d) => <button type="button" key={d} data-dir={d} className={v.dir === d ? 'on' : undefined} aria-pressed={String(v.dir === d)} onClick={() => on.dir(d)}>{d === 'buy' ? 'Buy' : 'Sell'}</button>)}
          </div>
          <span><span className="pill" id="mode">{v.modeLabel}</span><button type="button" className="gear" id="gear" aria-label="order type" onClick={on.menu}>⚙︎</button></span></div>
        <div className={`menu${v.menuOpen ? ' open' : ''}`} id="menu">
          {['market', 'limit'].map((m) => <button type="button" key={m} data-mode={m} className={v.mode === m ? 'on' : undefined} onClick={() => on.mode(m)}>{m === 'market' ? 'Market' : 'Limit'}</button>)}
        </div>
        <div id="sell" hidden={v.dir !== 'sell'}>
          <div className="line"><span>You hold</span><span><b id="held">{v.held}</b> <button type="button" className="max" id="max" onClick={on.max}>Max</button></span></div>
          <div className="line" hidden={v.mode !== 'limit'}><span>Limit price</span><span className="stepper"><button type="button" data-slp="-1" onClick={() => on.slp(-1)}>−</button>
            <input id="slp" inputMode="numeric" value={f.slp} onChange={(e) => on.input('slp', e.target.value)} /><button type="button" data-slp="1" onClick={() => on.slp(1)}>+</button></span></div>
          <div className="line"><span>Shares</span><input id="ssh" inputMode="numeric" value={f.ssh} onChange={(e) => on.input('ssh', e.target.value)} /></div>
          <div className="chips" style={{ justifyContent: 'flex-end' }}>{[-10, 10, 100].map((n) => <button type="button" key={n} data-ssh={n} onClick={() => on.ssh(n)}>{n < 0 ? `−${-n}` : `+${n}`}</button>)}</div>
          <div className="line"><span>You'll receive</span><span className="bigwin" id="sget">{v.sget}</span></div>
          <div className="center sub" id="snote">{v.snote}</div>
        </div>
        <div id="market" hidden={v.dir !== 'buy' || v.mode !== 'market'}>
          <div className="amount"><button type="button" className="step" data-step="-1" aria-label="less" onClick={() => on.step(-1)}>−</button>
            <input id="amt" inputMode="numeric" value={f.amt} aria-label="amount in sats" onChange={(e) => on.input('amt', e.target.value)} />
            <button type="button" className="step" data-step="1" aria-label="more" onClick={() => on.step(1)}>+</button></div>
          <div className="center sub">sats · <span id="side">{v.sideName}</span></div>
          <div className="chips">{[100, 500, 1000, 10000].map((n) => <button type="button" key={n} data-add={n} onClick={() => on.add(n)}>+{n.toLocaleString('en-US')}</button>)}</div>
          <div className="center">To win <span className="win" id="mwin">{v.mwin}</span> <span className="sub" id="mprice">{v.mprice}</span></div>
        </div>
        <div id="limit" hidden={v.dir !== 'buy' || v.mode !== 'limit'}>
          <div className="line"><span>Limit price</span><span className="stepper"><button type="button" data-lp="-1" onClick={() => on.lp(-1)}>−</button>
            <input id="lp" inputMode="numeric" value={f.lp} onChange={(e) => on.input('lp', e.target.value)} /><button type="button" data-lp="1" onClick={() => on.lp(1)}>+</button></span></div>
          <div className="line"><span>Shares</span><input id="sh" inputMode="numeric" value={f.sh} onChange={(e) => on.input('sh', e.target.value)} /></div>
          <div className="chips" style={{ justifyContent: 'flex-end' }}>{[-100, -10, 10, 100].map((n) => <button type="button" key={n} data-sh={n} onClick={() => on.sh(n)}>{n < 0 ? `−${-n}` : `+${n}`}</button>)}</div>
          <div className="line"><span className="sub">Expires</span><select id="exp" value={f.exp} onChange={(e) => on.input('exp', e.target.value)}><option value="0">at the close</option><option value="60000">in 1 min</option><option value="300000">in 5 min</option></select></div>
          <div className="line"><span>Total</span><span className="total" id="ltotal">{v.ltotal}</span></div>
          <div className="line"><span>To win</span><span className="bigwin" id="lwin">{v.lwin}</span></div>
        </div>
        <div className="err" id="err">{v.err}</div>
        <button type="button" className="go" id="go" disabled={v.go.disabled} onClick={on.go}>{v.go.text}</button>
        <div className={`status${v.status ? ` on${v.status.cls ? ` ${v.status.cls}` : ''}` : ''}`} id="status" role="status" aria-live="polite"><span className="spin" /><span id="statustxt">{v.status ? v.status.line : ''}</span></div>
        <div className="center sub" id="fee">{v.fee}</div>
      </div>);
  }
}

/** The whole market: { outside } outside the Arena page, else the view model of draw(). */
export class UpDownView extends React.Component {
  render() {
    const { vm: v, on } = this.props;
    if (v.outside) return <div className="none">This market runs inside the Bitcoin Arena page, which hands it the market.</div>;
    const o = v.outcomes;
    return (
      <div className="cols">
        <div className="colL">
          <div className="vsw" role="group" aria-label="view">
            {['compact', 'advanced'].map((k) => <button type="button" key={k} data-v={k} aria-pressed={String(v.view === k)} onClick={() => on.view(k)}>{k === 'compact' ? 'Compact' : 'Advanced'}</button>)}
          </div>
          <div className="card"><div className="q" id="q">{v.q}</div>
            <div className="sub"><span id="left">{v.left}</span> · <a id="poly" target="_blank" rel="noopener" href={v.poly || undefined}>Polymarket</a></div>
            <div className="row3"><div><b id="beat">{v.beat}</b><span>price to beat</span></div><div><b id="now">{v.now}</b><span>BTC now</span></div>
              <div><b id="delta" style={v.delta.color ? { color: v.delta.color } : undefined}>{v.delta.text}</b><span>change</span></div></div>
            <div className="odds"><span className="sub">chance of Up</span><b id="chance">{v.chance}</b></div></div>
          <div id="xv" ref={on.xvHost} />
          <div className="card" id="pastd"><div className="hist" style={{ marginTop: 0 }}><h3>Past orders</h3><span className="tot" id="totd">{v.totals ? <TotalsLong t={v.totals} /> : null}</span></div>
            <div id="pastt"><PastTable past={v.past} outcomes={o} /></div></div>
        </div>
        <div className="colR">
          <div className="sides">
            {[0, 1].map((i) => <button type="button" key={i} className={`side ${i === 0 ? 'up' : 'down'}${v.pick === i ? ' on' : ''}`} id={`s${i}`} onClick={() => on.pick(i)}>{v.dir === 'sell' ? 'Sell' : 'Buy'} {o[i]} <span id={`p${i}`}>{v.prices[i]}</span></button>)}
          </div>
          <Sheet v={v} on={on} />
          <SharesCard rows={v.shares || []} outcomes={o} onSell={on.sellSide} />
          <div className="card list"><h3>My orders{v.cancelAll ? <button type="button" className="cancelall" id="cancelall" disabled={!!v.cancelAll.busy} onClick={on.cancelAll}>Cancel all</button> : null}</h3>
            <div id="mine" className="ords">
              {v.flight ? <OrderCard c={v.flight} outcomes={o} onCancel={on.cancel} /> : null}
              {v.open.map((c) => <OrderCard key={c.key} c={c} outcomes={o} onCancel={on.cancel} />)}
              {(v.sells || []).map((c) => <SellCard key={c.key} c={c} outcomes={o} onCancel={on.cancel} />)}
              {v.mineEmpty ? <div className="sub">{v.mineEmpty}</div> : null}
            </div>
            <div className="hist" id="histhead" hidden={!v.past.length}><h3>History</h3>
              <span className="tot" id="tot">{v.totals ? <><span className="tl"><TotalsLong t={v.totals} /></span><span className="ts"><TotalsShort t={v.totals} /></span></> : null}</span></div>
            <div id="hist" className="ords">{v.past.map((p) => <PastCard key={p.entry} p={p} outcomes={o} />)}</div>
          </div>
        </div>
      </div>);
  }
}
