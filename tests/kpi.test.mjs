import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const K = require('../www/kpi-core.js');
const eq = assert.equal, deepEq = assert.deepEqual;
const near = (a, b, d = 0.01) => assert.ok(Math.abs(a - b) < d, `${a} ≈ ${b}`);
const T = '2026-10-10';

// ---------- Home ----------
const WTW_H = ['TGL', 'TARGET', 'PLUS', 'MINUS', 'LOC KOSONG', 'RALISASI', 'ACCURASI LOC', 'Disc.Awal', 'PLUS', 'MINUS', 'HIT', 'TOTAL COUNT', 'ACCURASI COUNT', 'Disc.Awal', 'PLUS', 'MINUS', 'HIT', 'TOTAL  QTY', 'ACCURASI QTY', 'Column 1', 'DONE LOC', 'PLUS', 'MINUS', 'ACCURASI LOC', 'DONE COUNT', 'PLUS', 'MINUS', 'ACCURASI COUNT', 'DONE QTY', 'PLUS', 'MINUS', 'ACCURASI QTY'];
const row = (d, t, p, m, k, r, cnt, accC, qty, accQ, done) => [d, t, p, m, k, r, '', '1', '0', '1', String(cnt - 1), String(cnt), accC, '2', '0', '2', String(qty - 2), String(qty), accQ, '', ...done];
const wtwH = [WTW_H, row('9 Oct 2026', '230', '0', '2', '40', '190', 751, '99.87%', 2261, '99.96%', ['3', '1', '0', '146.25%', '0', '0', '0', '0', '0', '0', '0', '0']), row('10 Oct 2026', '230', '1', '0', '50', '179', 751, '99.87%', 2261, '99.96%', ['0', '0', '0', '99.57%', '0', '0', '0', '0', '0', '0', '0', '0'])];
const wtwA = [WTW_H.map((h) => (h === 'RALISASI' ? 'REALISASI' : h)), row('10 Oct 2026', '39', '0', '0', '6', '33', 284, '100.00%', 4302, '100.00%', ['0', '0', '0', '100%', '0', '0', '0', '0', '0', '0', '0', '0'])];

test('akurasi: location accuracy = (target-plus-minus)/target, latest day, combined HCI+AHI', () => {
  const a = K.akurasi(wtwH, wtwA, 'ALL', T);
  near(a.pct, 99.63); eq(a.date, T);
  near(a.perBu.HCI.pct, 99.57); near(a.perBu.AHI.pct, 100);
  eq(a.perBu.HCI.target, 230); eq(a.perBu.HCI.kosong, 50); eq(a.perBu.HCI.aktual, 179);
  near(K.akurasi(wtwH, wtwA, 'HCI', T).pct, 99.57);
  eq(K.akurasi(wtwH, wtwA, 'KWI', T).missing, true);
  eq(K.akurasi([WTW_H], [WTW_H], 'ALL', T).missing, true);
});
test('akurasi ignores future prepared rows', () => {
  const w = [...wtwH, row('11 Oct 2026', '230', '0', '0', '0', '0', 1, '0%', 2, '0%', ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0'])];
  eq(K.akurasi(w, wtwA, 'HCI', T).date, T);
});
test('wtw detail: count & qty accuracy, perbaikan capped at 100%', () => {
  const w = K.wtw(wtwH, T);
  eq(w.latest.date, T); near(w.latest.accCount, 99.87); near(w.latest.accQty, 99.96);
  const d9 = w.rows.find((r) => r.date === '2026-10-09');
  eq(d9.done.loc, 3); eq(d9.done.acc, 100);
});

const OCC = ['TGL', 'BU', 'Capasity', 'Used Space', '%', 'Inbound', 'Outbound'];
const occH = [OCC, ['8 Oct 26', 'HCI', '7354', '7090', '96.41%', '30.1', '40.2'], ['9 Oct 26', 'HCI', '7354', '7092.74', '96.45%', '25.19', '64.52'], ['10 Oct 26', 'HCI', '7354', '7053.41', '95.91%', '', '']];
const occA = [OCC, ['9 Oct 26', 'AHI', '1153.15', '1408', '122.1%', '0', '24.08'], ['10 Oct 26', 'AHI', '1153.15', '1383.70', '119.99%', '', '']];
const occAll = [['Kamis', '9 Oct 2026', 'FBI', '130.42', '60.0', '46%', '▲', '1', '2'], ['Jumat', '10 Oct 2026', 'FBI', '130.42', '63.28', '48.52%', '▲', '', '']];
test('occupancy: latest used/capacity per BU and total; in/out from last complete day', () => {
  const o = K.occupancy(occH, occA, occAll, 'ALL', T);
  near(o.used, 7053.41 + 1383.7 + 63.28); near(o.cap, 7354 + 1153.15 + 130.42);
  near(o.pct, (7053.41 + 1383.7 + 63.28) / (7354 + 1153.15 + 130.42) * 100);
  eq(o.date, T);
  near(o.perBu.AHI.pct, 119.99); near(o.perBu.FBI.used, 63.28);
  eq(o.flowDate, '2026-10-09'); near(o.inCbm, 25.19 + 0 + 1); near(o.outCbm, 64.52 + 24.08 + 2);
  eq(o.trend.length, 2); // hanya hari yang lengkap untuk semua BU
  near(K.occupancy(occH, occA, occAll, 'HCI', T).pct, 95.91);
  eq(K.occupancy(occH, occA, occAll, 'TGI', T).missing, true);
});

const barus = [['', 'UPDATE BARUS OKTOBER 2026 HCI'], ['', 'status', 'TOTAL SKU', 'QTY'], ['', 'BELUM DI ADF', '12', '20'], ['', 'ON HAND HCI', '1,020', '1,131', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'ON HAND AHI', '35', '75']];
test('damage: SKU/qty on hand per BU; rupiah not available', () => {
  const d = K.damage(barus, 'ALL');
  eq(d.sku, 1055); eq(d.qty, 1206); eq(d.value, null); eq(d.perBu.HCI.qty, 1131);
  eq(K.damage(barus, 'AHI').qty, 75);
  eq(K.damage(barus, 'FBI').missing, true);
  eq(K.damage([['x']], 'ALL').missing, true);
});

const ld = (vals) => [['', 'DC Daily'], ['', 'PERFORMANCE', 'STANDARD', '', ' 1 Oct-26', ' 9 Oct-26', '10 Oct-26'], ['', 'SLA Customer', '99%', '', '100.00%', vals[0], ''], ['', 'SLA Store', '99%', '', '100%', vals[1], ''], ['', 'Occupancy', '85%-115%', '', '95%', '96%', '95.91%']];
test('slaOutbound: last filled day up to today vs standard', () => {
  const s = K.slaOutbound(ld(['98.50%', '100.00%']), ld(['100.00%', '97.00%']), 'ALL', T);
  eq(s.date, '2026-10-09'); near(s.perBu.HCI.cust, 98.5); near(s.perBu.AHI.store, 97); eq(s.std, 99);
  near(s.cust, 99.25); near(s.store, 98.5);
  eq(K.slaOutbound(ld(['98.50%', '100.00%']), null, 'HCI', T).perBu.HCI.cust, 98.5);
  eq(K.slaOutbound(null, null, 'ALL', T).missing, true);
  eq(K.slaOutbound(ld(['98.50%', '100.00%']), ld(['1', '1']), 'TGI', T).missing, true);
});

test('incoming containers: POO, OTW, POD counts and TEUs', () => {
  const r = [{ p: 0, te: 1, bu: 'HCI' }, { p: 1, te: 2, bu: 'AHI' }, { p: 1, te: 1, bu: 'HCI' }, { p: 2, te: 2, bu: 'HCI' }, { p: 3, te: 1, bu: 'HCI' }, { p: 4, te: 1, bu: 'HCI' }];
  deepEq(K.incoming(r, 'ALL'), { poo: { n: 1, te: 1 }, otw: { n: 2, te: 3 }, pod: { n: 1, te: 2 }, total: { n: 4, te: 6 } });
  deepEq(K.incoming(r, 'AHI').otw, { n: 1, te: 2 });
});
