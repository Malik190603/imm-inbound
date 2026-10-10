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

// ---------- Dashboard ----------
const LDROWS = [['', 'RDC Tallo AHI'], ['', 'PERFORMANCE', 'STANDARD', '', ' 9 Oct-26', '10 Oct-26'], ['', 'SLA Customer', '99%', 'ACHIVEMENT', '100%', ''],
  ['', 'MHE', 'ASSET', 'PEMAKAIAN', '', ''], ['', 'Hand Pallet', '6', '', '4', ''], ['', 'Forklift', '0', '', '', ''],
  ['', 'UNLOADING', 'UoM', 'PLAN', '', ''], ['', '- Container', 'teus', '', '4', '6'], ['', '- Darat', 'armada', '', '1', ''],
  ['', 'OUTSTANDING ORDER', 'UoM', 'AKAN DATANG', '', ''], ['', 'Customer', 'cbm', '', '3.5', '2'], ['', '- DC', 'cbm', '', '3.5', '2'], ['', '- Transit', 'cbm', '', '0', '0'], ['', 'Customer', 'OD', '', '16', '9'], ['', '- DC', 'OD', '', '16', '9'],
  ['', 'DC Process', 'UoM', 'Realisasi', '', ''], ['', 'STORING', '', '', '', ''], ['', 'Pressing', 'cbm', '', '7.5', ''], ['', 'Putaway (ke racking)', 'cbm', '', '20', '']];
test('ld: sections, parents, units, last filled day', () => {
  const L = K.ld(LDROWS, T);
  deepEq(L.dates, ['2026-10-09', '2026-10-10']);
  eq(L.get('OUTSTANDING ORDER|AKAN DATANG', 'DC', '2026-10-10', 'Customer'), 2);
  eq(L.find('OUTSTANDING ORDER|AKAN DATANG', 'DC', 'Customer').unit, 'cbm');
  eq(L.lastDay('DC PROCESS|REALISASI', T), '2026-10-09');
  eq(L.get('DC PROCESS|REALISASI', 'Pressing', '2026-10-09'), 7.5);
  eq(L.std('SLA Customer'), '99%');
  const sec = K.ldSection([L, L], 'UNLOADING|PLAN', T, T);
  eq(sec.date, T); eq(sec.items.find((x) => x.label === 'Container').v, 12);
  eq(K.ldSection([L], 'DC PROCESS|REALISASI', T, T).date, '2026-10-09');
  eq(K.ld([['x']], T), null);
});

const CASE = [['ADDDATE', 'TYPE', 'Level', 'count CASEID'], ['2026-10-9', 'GRW', 'Level Atas', '160'], ['2026-10-10', 'Customer', 'Level Atas', '10'], ['2026-10-10', 'GRW', 'Level Atas', '24'], ['2026-10-10', 'GRW', 'Level Bawah', '78'], ['2026-10-10', 'GRW', 'Floor', '7']];
const TRANS = [['ADDDATE', 'Level', 'LVL', 'BATCH', 'count No', 'sum QTY', 'sum CM3'], ['2026-10-10', 'Level Atas', '3', 'PAGI', '30', '40', '1000000'], ['2026-10-10', 'Level Bawah', '1', 'PAGI', '70', '90', '2500000'], ['2026-10-10', 'Floor', 'flr', 'SIANG', '7', '9', '500000']];
test('storing: released/picked/open per level for the latest day', () => {
  const s = K.storing(CASE, TRANS, T);
  eq(s.date, T); eq(s.released, 119); eq(s.picked, 107); eq(s.open, 12); near(s.pct, 89.92);
  deepEq(s.levels.map((x) => [x.k, x.released, x.picked, x.open]), [['bawah', 78, 70, 8], ['atas', 34, 30, 4], ['floor', 7, 7, 0]]);
  eq(s.cbm, 4); deepEq(s.rak.map((x) => x[0]), ['1', '3', 'FLR']); eq(s.shift.PAGI, 100);
  eq(K.storing([CASE[0]], [TRANS[0]], T).missing, true);
});

const DP = [['diman picking'], ['tgl'], ['', 'OD'], ['Friday, 9 Oct ', '142', '540', '285', '1629', '24.96', '6', '12', '7', '15', '1.76', '148', '552', '292', '1644', '26.72']];
test('dpDay: demand picking groups for one day (no year in sheet)', () => {
  const d = K.dpDay(DP, '2026-10-09', T);
  deepEq(d.total, { od: 148, cid: 552, sku: 292, qty: 1644, cbm: 26.72 }); eq(d.grw.cid, 540);
  eq(K.dpDay(DP, T, T), null);
});

const PLR = [['10', 'DASHBOARD PLANNER 2026'], ['', 'SATURDAY 10 OCTOBER 2026'], ['', 'BY CUSTOMER'], ['', 'HCI'], ['', 'TYPE'],
  ['', 'Customer RDC', '', '138', '65.75', '511', '0', '0.00', '0', '0.00%', '', '38', '17.86', '128', '', '94', '46.55', '295', '', '55', '41.82', '255', '', '164', '145.18', '1205'],
  ['', 'TOTAL', '', '175', '84.82', '576', '10', '5.00', '20', '5.89%', '', '45', '20.82', '153', '', '107', '48.14', '316', '', '87', '105.51', '932', '', '219', '215.20', '1590'],
  ['', 'AHI'], ['', 'TOTAL', '', '35', '21.88', '66', '0', '0.00', '0', '0.00%', '', '0', '0.00', '0', '', '9', '1.55', '18', '', '6', '1.65', '15', '', '1', '0.30', '1'],
  ['', 'BY STORE (GRW)', '', '', '', '', '', '', '', '', '', 'AGING INTRANSIT CUSTOMER IN DC'], ['', 'HCI', '', '', '', '', '', '', '', '', '', 'STORE/DAY', '', '1-3', '4-7', '8-15'],
  ['', 'TYPE', '', '', '', '', '', '', '', '', '', 'Latanete', '', '29.01', '', '12.32', '2.09']];
test('planner: plan vs realisasi, outstanding by day, aging per store', () => {
  const p = K.planner(PLR, 'ALL');
  eq(p.date, T); near(p.total.plan.cbm, 106.7); eq(p.total.real.od, 10);
  deepEq(p.outstanding.map((x) => x.od), [45, 116, 93, 220]);
  eq(p.types[0].plan.od, 138); eq(p.aging[0].store, 'Latanete'); deepEq(p.aging[0].v, [29.01, 0, 12.32, 2.09, 0]);
  eq(K.planner(PLR, 'AHI').total.plan.od, 35);
  eq(K.planner(PLR, 'KWI').missing, true);
});

const VIRT = [['', '10 Oct 2026'], ['', 'HCI'], ['', 'INTRANSIT', '0', '0'], ['', 'PACK', '527', '398', '3', '3', '9', '9', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '539', '410', '68', '12', '12'], ['', 'FLOOR', '2008', '157', '760', '141', '39', '12', '59', '15', '46', '45', '6', '4', '0', '0', '0', '0', '2749', '349', '259', '910', '217'], ['', 'AHI'], ['', 'FLOOR', '1000', '100', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '1310', '161', '18.41', '97', '9']];
test('virtual & floor aging', () => {
  const v = K.virtualLoc(VIRT, 'ALL');
  eq(v.date, T); eq(v.floor.qty, 4059); eq(v.floor.old.qty, 1007); eq(v.pack.sku, 410); eq(v.floor.buckets[0].qty, 3008);
  eq(K.virtualLoc(VIRT, 'AHI').floor.qty, 1310);
});

const SLOC = [['', '8 Oct 2026', '0', '0', 'RP0', '0', '0', 'RP0', '219', '678', 'RP413,847,710', '84', '245', 'RP166,768,404', '', '0', '0', 'RP0', '0', '0', 'RP0', '18', '36', 'RP12,545,082', '26', '122', 'RP13,280,106'], ['', '9 Oct 2026', '', '', '']];
test('sloc 1007/1009: latest filled day, HCI and AHI blocks', () => {
  const s = K.sloc(SLOC, 'ALL', T);
  eq(s.date, '2026-10-08'); deepEq(s.items[2], { k: '1009-', sku: 237, qty: 714, value: 426392792 });
  eq(K.sloc(SLOC, 'HCI', T).items[3].value, 166768404); eq(K.sloc(SLOC, 'TGI', T).missing, true);
});

test('barus budget per BU', () => {
  const b = K.barusBudget([['', 'KODE STORE', 'H019', 'RP46,758,915', 'RP46,758,915', 'RP0', 'RP0', 'A017', 'RP0', '-RP785,660', 'RP3,980', 'RP781,680']], 'ALL');
  eq(b.limit, 46758915); eq(b.sisa, 46758915 - 785660); eq(b.store, 781680);
});

// ---------- Menu List ----------
test('lcAging: containers arrived but not unloaded, buckets 0-7 / 8-14 / 15+', () => {
  const rdc = [{ si: 'A', ata: '2026-10-08', bu: 'HCI', te: 2 }, { si: 'B', ata: '2026-09-28', acd: '2026-10-09', bu: 'AHI', te: 1 }, { si: 'C', ata: '2026-09-20', bu: 'HCI', te: 1 },
    { si: 'D', ata: '2026-10-01', bk: '2026-10-05', bu: 'HCI', te: 1 }, { si: 'E', ata: '2026-09-01', bk: '2026-09-20', bu: 'HCI', te: 1 }, { si: 'F', bu: 'HCI' }];
  const a = K.lcAging(rdc, T, 'ALL');
  deepEq(a.rows.map((r) => [r.lc, r.ag]), [['C', 20], ['B', 12], ['A', 2]]);
  deepEq(a.buckets.map((b) => b.n), [1, 1, 1]); eq(a.buckets[0].te, 2); eq(a.atDc, 1);
  eq(a.sla, 50); eq(a.done30, 2);
  eq(K.lcAging(rdc, T, 'AHI').total, 1);
});
test('reportStatus: per-report rules, idle days excluded from the percentage', () => {
  const day = T;
  const src = { rep1: [['count B'], ['3']], rep2: [['count B'], ['0']], rep9: [['count B']],
    rep3: [['', 'INBOUND', '', '', ' 9 Oct-26', '10 Oct-26'], ['', 'REALISASI', '', '', '5', '7']],
    rep4: [['', 'INBOUND', '', '', ' 9 Oct-26', '10 Oct-26'], ['', 'REALISASI', '', '', '5', '']],
    rep5: [['10', '', '', '', '10 October '], ['', 'RDC TALLO', '', '12', '9']], rep6: [['', 'PLAN BONGKAR', '09 Oct 26', '10 Oct 26'], ['', 'MAKASSAR', '161', '-']],
    rep7: [['', '', ''], ['10 Oct 2026', '', '0'], ['09 Oct 2026', '99.73%', '732']],
    ldH: [['', 'X'], ['', 'PERFORMANCE', 'STANDARD', '', '10 Oct-26'], ['', 'SLA Customer', '99%', '', '100%']], ldA: [['', 'X'], ['', 'PERFORMANCE', 'STANDARD', '', '10 Oct-26'], ['', 'SLA Customer', '99%', '', '']] };
  const r = K.reportStatus(src, day, T, false);
  deepEq(r.st, { rep1: 'ok', rep2: 'no', rep9: 'no', rep3: 'ok', rep4: 'no', rep5: 'ok', rep6: 'ok', rep7: 'no', rep8: 'no' });
  eq(r.filled, 4); eq(r.of, 9); eq(r.pct, 44);
  const idle = K.reportStatus(src, day, T, true);
  deepEq(idle.idle, ['rep2', 'rep9']); eq(idle.of, 7); eq(idle.pct, 57);
  const none = K.reportStatus({}, day, T, false); eq(none.pct, null); eq(none.unknown.length, 9);
});
test('layout: zones per BU from location codes', () => {
  const rows = [['Location', 'Zone', 'Cubic Capacity', 'Location Level', 'Section'], ['A01.066.5', 'LORONG.A1', '2,798,400', '5', 'HCI'], ['A01.066.4', 'LORONG.A1', '2,798,400', '4', 'HCI'], ['A01.067.1', 'LORONG.A1', '1,000,000', '1', 'HCI'], ['C09.001.1', 'LORONG.C9', '1,000,000', '1', 'FBI'], ['TOTAL', '', '9', '', '']];
  const l = K.layout(rows, 'ALL');
  eq(l.total, 4); eq(l.zones[1].zone, 'A1'); eq(l.zones[1].n, 3); eq(l.zones[1].bays, 2); near(l.zones[1].cap, 6.5968);
  eq(K.layout(rows, 'FBI').zones.length, 1); eq(K.layout(rows, 'KWI').missing, true);
});

test('lpStats: counts per period from LP sheets, date separators, LC codes, kardus units', () => {
  const src = {
    visitor: [['Timestamp', 'Tujuan Kunjungan', 'Jam Masuk', 'Jam Keluar'], ['10/10/2026 08:10:00', 'Service', '08:10:00', ''], ['09/10/2026 11:00:00', 'Service', '11:00', '12:00'], ['22/09/2026 11:10:40', 'Interview', '', '']],
    karyawan: [['Timestamp', 'Kode Store', 'Bagian', 'Status', 'Keterangan', 'Jam Keluar', 'Jam Masuk'], ['10/10/2026 12:00:00', 'H019', 'Inbound', 'Keluar', 'ISOMA', '12:00:00', '']],
    jemput: [['Kamis 08/10/2026', '', '', ''], ['RT1', 'OD1', '3', 'J337 / HCI LATANETE'], ['RT2', 'OD2', '2', ''], ['Sabtu 10/10/2026', '', '', ''], ['RT3', 'OD3', '5', 'A390 / AHI']],
    seal: [['', '', 'TUJUAN'], ['Jumat 09/10/2026', '', ''], ['1', '1234567', 'J387+J305'], ['2', '1234568', ' A390 ']],
    ttoOut: [['TANGGAL', 'NO TTO'], ['10/10/2026', 'T1'], ['18/09/2026', 'T2']],
    ttoIn: [['Kamis 08/10/2026', 'BAIK', 'TTO/1'], ['', 'BAIK', 'TTO/2']],
    palopo: [['261001C001'], ['261006C002'], ['260930C001']], lbSum: [['TOTAL OD 2026 SEMESTER 2', '42,677'], ['RUPA-RUPA SEMESTER 2', '332']],
    tugu: [['count NO.DOKUMEN'], ['622']],
    kardus: [['TGL PROSES', 'JUMLAH /KG', 'TOTAL HASIL PENJUALAN', 'KETERANGAN', 'Total'], ['2-Oct-2026', '198 kg', '218', 'KARDUS', ''], ['5-Oct-2026', '254', 'Rp280,000', 'BESI WO', ''], ['6-Oct-2026', '10 kg', '', 'KARDUS', '']],
  };
  const L = K.lpStats(src, '2026-10-01', '2026-10-10', '2026-10-10');
  eq(L.tamu.n, 2); eq(L.tamu.didalam, 1); deepEq(L.tamu.by[0], ['Service', 2]);
  eq(L.karyawan.n, 1); eq(L.karyawan.belum, 1);
  eq(L.jemput.n, 3); eq(L.jemput.koli, 10); eq(L.jemput.rows[1].store, 'J337 / HCI LATANETE'); eq(L.jemput.last, '2026-10-10');
  eq(L.seal.date, '2026-10-09'); eq(L.seal.armada, 2); deepEq(L.seal.tujuan, ['J387', 'J305', 'A390']);
  eq(L.ttoOut.n, 1); eq(L.ttoIn.n, 2);
  eq(L.palopo.n, 2); eq(L.palopo.total, 3); eq(L.summary.odS2, 42677); eq(L.summary.rupaS2, 332); eq(L.tugu, 622);
  eq(L.kardus.kg, 462); eq(L.kardus.rp, 218000 + 280000); eq(L.kardus.unpaid, 1);
  eq(K.lpStats({}, '2026-10-01', '2026-10-10', '2026-10-10').tamu, undefined);
});
