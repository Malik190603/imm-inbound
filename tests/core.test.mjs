import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const C = require('../www/inbound-core.js');
const eq = assert.equal, deepEq = assert.deepEqual;
const csv = (f) => fs.readFileSync(new URL('./fixtures/' + f, import.meta.url), 'utf8').trim().split('\n').map((l) => l.split(','));
const stock = C.toObjects(csv('stock.csv')).rows;
const transit = C.toObjects(csv('transit.csv')).rows;
const D = '2026-10-01';
const opt = { from: D, to: D, bu: 'ALL' };
const byLpn = (id) => C.putawayLpns(stock, opt).find((x) => x.lpn === id);
const op = (p, id) => p.ops.find((o) => o.id === id);
const sum = (a, k) => +a.reduce((t, x) => t + x[k], 0).toFixed(6);

test('constants: 5 operators, 8 PICs, 9 MPP people', () => {
  deepEq(C.OPERATORS.map((o) => o.id), ['129057', '148453', '187606', '188400', '192831']);
  deepEq(C.PICS, ['Aan', 'Ramadhan', 'Malik', 'Armin', 'Akmal', 'Abi', 'Adit', 'Fikri']);
  eq(C.MPP.length, 9); eq(C.MPP[0].name, 'Sumarni'); eq(C.MPP[0].title, 'Assistant Manager');
  eq(C.MPP[3].bu, 'PT Aspirasi Hidup Indonesia (AHI)'); eq(C.MPP.filter((m) => m.title === 'Warehouseman').length, 5);
});
test('toObjects maps cells by trimmed header', () => {
  const o = C.toObjects([[' A ', 'B'], ['1', '2'], ['3']]);
  deepEq(o.headers, ['A', 'B']); deepEq(o.rows, [{ A: '1', B: '2' }, { A: '3', B: '' }]);
});
test('lpnKind', () => { eq(C.lpnKind('ID00244984'), 'good'); eq(C.lpnKind('rc0012'), 'damage'); eq(C.lpnKind('X1'), 'other'); eq(C.lpnKind(''), 'other'); });
test('usDate', () => { eq(C.usDate('07/31/2026'), '2026-07-31'); eq(C.usDate('8/3/2026'), '2026-08-03'); eq(C.usDate(''), ''); eq(C.usDate('31 Jul'), ''); eq(C.usDate('13/40/2026'), ''); });
test('missingHeaders', () => { deepEq(C.missingHeaders(['Toid', 'Toloc'], ['Toid', 'Trantype']), ['Trantype']); eq(C.missingHeaders(C.toObjects(csv('stock.csv')).headers, C.STOCK_HEADERS).length, 0); eq(C.missingHeaders(C.toObjects(csv('transit.csv')).headers, C.TRANSIT_HEADERS).length, 0); });
test('putaway keeps only Move + NSPRFPA02 + FLR', () => { const l = C.putawayLpns(stock, opt); deepEq(l.map((x) => x.lpn).sort(), ['ID001', 'ID002', 'RC001']); });
test('putaway flags mixed dept and damage', () => { const rc = byLpn('RC001'); eq(rc.kind, 'damage'); eq(rc.mixed, true); eq(rc.depts.length, 2); eq(byLpn('ID001').mixed, false); eq(byLpn('ID001').kind, 'good'); });
test('putaway sums qty and cbm, filters BU and date', () => {
  eq(byLpn('ID001').qty, 20); eq(byLpn('ID001').cbm, 1.5); eq(byLpn('ID001').items.length, 2); deepEq(byLpn('ID001').tolocs, ['FLR-A01']);
  eq(C.putawayLpns(stock, { from: D, to: D, bu: 'AHI' }).length, 1); eq(C.putawayLpns(stock, { from: '2026-01-01', to: '2026-01-01', bu: 'ALL' }).length, 0);
});
test('putaway is newest first and names the operator', () => { const l = C.putawayLpns(stock, opt); deepEq(l.map((x) => x.lpn), ['RC001', 'ID002', 'ID001']); eq(l[0].time, '13:10'); eq(l[0].operator, 'Akmal'); eq(byLpn('ID002').tolocs[0], 'FLR-01'); });
test('productivity: stock uses CM3 for Receiving, CM3 (Final) for Putaway, only Ya', () => { const p = C.productivity(stock, [], opt); eq(op(p, '192831').rcvStock, 2); eq(op(p, '192831').putStock, 3); eq(op(p, '148453').putStock, 0.6); });
test('productivity: transit counts the same CBM for receive and putaway', () => { const p = C.productivity([], transit, opt); eq(op(p, '148453').rcvTransit, 2.3); eq(op(p, '148453').putTransit, 2.3); eq(op(p, '148453').rcv, 2.3); });
test('productivity: unknown operators and empty dates are ignored; all 5 operators listed', () => {
  const p = C.productivity(stock, transit, opt); eq(p.ops.length, 5); eq(p.team.rcv, sum(p.ops, 'rcv')); eq(p.team.rcv, 4.3); eq(p.team.put, 5.9);
  eq(p.ops[0].id, '148453'); eq(op(p, '129057').rcv, 0);
});
test('productivity: BU filter and per-day totals', () => {
  eq(C.productivity(stock, transit, { from: D, to: D, bu: 'AHI' }).team.put, 0.5);
  const p = C.productivity(stock, transit, { from: D, to: '2026-10-02', bu: 'ALL' }); deepEq(p.days.map((d) => d.d), [D, '2026-10-02']); eq(p.days[1].rcv, 3); eq(p.days[1].put, 2);
});
test('password', async () => { eq(await C.checkPassword('<sandi>'), true); eq(await C.checkPassword('inbound78'), false); eq(await C.checkPassword(''), false); });
test('unlockValid', () => { const H = 3600e3; eq(C.unlockValid(1000, 1000 + 2 * H - 1), true); eq(C.unlockValid(1000, 1000 + 2 * H), false); eq(C.unlockValid(5000, 1000), false); eq(C.unlockValid(0, 1000), false); eq(C.unlockValid(null, 1000), false); });
test('stampText', () => { eq(C.stampText(new Date('2026-10-03T12:05:00Z')), '03/10/2026 20:05 WITA'); });
