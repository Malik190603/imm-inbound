import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const P = require('../www/parse-core.js');
const eq = assert.equal, deepEq = assert.deepEqual;

test('num: rupiah, percent, kg, thousand separators, dash, sheet errors', () => {
  eq(P.num('Rp 1.234.567'), 1234567);
  eq(P.num('RP1,234'), 1234);
  eq(P.num('Rp 413.812.500,50'), 413812500.5);
  eq(P.num('99.57%'), 99.57);
  eq(P.num('262 kg'), 262);
  eq(P.num('1,234.5'), 1234.5);
  eq(P.num('7.053,2'), 7053.2);
  eq(P.num('0,75'), 0.75);
  eq(P.num(' 12 '), 12);
  eq(P.num(-3), -3);
  eq(P.num('-'), 0);
  eq(P.num('-1.5'), -1.5);
  eq(P.num('(Rp 785.660)'), -785660);
  for (const bad of ['', '#N/A', '#DIV/0!', '#VALUE!', '#REF!', 'abc', null, undefined]) eq(P.num(bad), null, String(bad));
});

test('num keeps plain decimals and comma thousands', () => {
  eq(P.num('1,153'), 1153);
  eq(P.num('1.153'), 1153);
  eq(P.num('3.50'), 3.5);
  eq(P.num('24.97'), 24.97);
  eq(P.num('1.234.567,8'), 1234567.8);
});

test('pct: percent text and fractions', () => {
  eq(P.pct('86.32%'), 86.32);
  eq(P.pct('100.00%'), 100);
  eq(P.pct(0.8632, true), 86.32);
  eq(P.pct('58%'), 58);
  eq(P.pct('#DIV/0!'), null);
});

test('date: many sheet formats to ISO yyyy-mm-dd', () => {
  eq(P.date('10/9/2026'), '2026-10-09');            // M/D/YYYY (default us)
  eq(P.date('10/9/2026 14:05:00'), '2026-10-09');
  eq(P.date('09/10/2026', { dmy: true }), '2026-10-09');
  eq(P.date('09/10/2026 14.05.00', { dmy: true }), '2026-10-09');
  eq(P.date('10 Oct 26'), '2026-10-10');
  eq(P.date(' 1 Oct-26'), '2026-10-01');
  eq(P.date('1 Januari 2026'), '2026-01-01');
  eq(P.date('17 Agustus 2026'), '2026-08-17');
  eq(P.date('10 October 2026'), '2026-10-10');
  eq(P.date('2026-10-10'), '2026-10-10');
  eq(P.date('2026-10-9'), '2026-10-09');           // tanggal hasil group by gviz
  eq(P.date('22/09/2026 11:10:40'), '2026-09-22'); // hari > 12 pasti hari/bulan
  eq(P.date('28-Jul-2026'), '2026-07-28');
  eq(P.date('10 October ', { year: 2026 }), '2026-10-10');
  eq(P.date('04 Oct 2026'), '2026-10-04');
  eq(P.date(46304), '2026-10-09');
  eq(P.date('46304'), '2026-10-09');
  eq(P.date('Thursday, 1 Oct', { year: 2026 }), '2026-10-01');
  eq(P.date('1 July', { year: 2026 }), '2026-07-01');
  eq(P.date('Date(2026,9,10)'), '2026-10-10');      // gviz Date(...) month is 0-based
  eq(P.date('10-Sep-2026'), '2026-09-10');
  for (const bad of ['', 'abc', '#N/A', '31/31/2026', null, 0]) eq(P.date(bad), null, String(bad));
});

test('sepDate: day separator rows', () => {
  eq(P.sepDate('Kamis 01/01/2026'), '2026-01-01');
  eq(P.sepDate('Jumat 09/10/2026'), '2026-10-09');
  eq(P.sepDate('JUMAT, 09/10/2026'), '2026-10-09');
  eq(P.sepDate('09/10/2026'), null);
  eq(P.sepDate('RT001'), null);
});

test('codeDate: LC / load codes yymmdd + letter', () => {
  eq(P.codeDate('260923T036'), '2026-09-23');
  eq(P.codeDate('261009A001'), '2026-10-09');
  eq(P.codeDate('261399T001'), null);
  eq(P.codeDate('ABC'), null);
});

test('isoWeek / weekTab / monthTab', () => {
  eq(P.isoWeek('2026-10-10'), 41);
  eq(P.isoWeek('2026-10-05'), 41);
  eq(P.isoWeek('2026-10-04'), 40);
  eq(P.weekTab('2026-10-10'), 'W41');
  eq(P.monthTab('RDC Tallo HCI', '2026-10-10'), 'RDC Tallo HCI Okt 2026');
  eq(P.monthTab('RDC Tallo AHI', '2026-08-01'), 'RDC Tallo AHI Agu 2026');
  eq(P.monthTab('RDC Tallo HCI', '2026-10-10', { year: false }), 'RDC Tallo HCI Okt');
});

test('col / hasHeaders: tolerant header matching', () => {
  const h = ['TGL', ' Used Space ', 'TOTAL  QTY', 'Capasity', 'SURAT JALAN '];
  eq(P.col(h, 'used space'), 1);
  eq(P.col(h, 'TOTAL QTY'), 2);
  eq(P.col(h, 'Capacity', 'Capasity'), 3);
  eq(P.col(h, 'surat jalan'), 4);
  eq(P.col(h, 'nope'), -1);
  eq(P.hasHeaders(h, ['TGL', 'Used Space']), true);
  eq(P.hasHeaders(h, ['TGL', 'BU']), false);
});

test('fillSep: rows take the date of the closest separator above', () => {
  const rows = [['Kamis 01/10/2026', ''], ['A1', '3'], ['A2', '4'], ['Jumat 02/10/2026', ''], ['A3', '5']];
  deepEq(P.fillSep(rows, 0), [{ date: '2026-10-01', row: ['A1', '3'] }, { date: '2026-10-01', row: ['A2', '4'] }, { date: '2026-10-02', row: ['A3', '5'] }]);
  deepEq(P.fillSep([['A0', '1']], 0), []);
});

test('matrixDay: dates as columns', () => {
  const rows = [
    ['', 'PERFORMANCE', 'STANDARD', '', ' 1 Oct-26', ' 2 Oct-26', ' 3 Oct-26'],
    ['', 'SLA Customer', '99%', '', '100.00%', '98.50%', ''],
    ['', 'SLA Store', '99%', '', '100%', '', '']];
  const m = P.matrixDay(rows, { labelCol: 1, dateRow: 0, firstDateCol: 4 });
  deepEq(m.dates, ['2026-10-01', '2026-10-02', '2026-10-03']);
  eq(m.get('sla customer', '2026-10-02'), '98.50%');
  eq(m.get('SLA Store', '2026-10-03'), '');
  eq(m.get('nope', '2026-10-01'), null);
  eq(m.cell('SLA Customer', 2), '99%');
  eq(m.last('SLA Customer'), '2026-10-02');
  eq(m.last('SLA Customer', '2026-10-01'), '2026-10-01');
});

test('stripPrivate drops private columns by header', () => {
  const r = P.stripPrivate(['Timestamp', 'Nama Tamu', 'Nomor Telepon', 'Tujuan'], [['1', 'X', '08', 'Y']], ['nama tamu', 'NOMOR TELEPON']);
  deepEq(r, { headers: ['Timestamp', 'Tujuan'], rows: [['1', 'Y']] });
});

test('parseCSV handles quotes, commas and newlines', () => {
  deepEq(P.parseCSV('"a","b,c"\n"1","x\ny"\n'), [['a', 'b,c'], ['1', 'x\ny']]);
  deepEq(P.parseCSV('a,"say ""hi"""'), [['a', 'say "hi"']]);
});

test('wita today and shifting', () => {
  eq(P.witaDay(new Date('2026-10-09T16:30:00Z')), '2026-10-10');
  eq(P.witaDay(new Date('2026-10-09T15:59:00Z')), '2026-10-09');
  eq(P.addDays('2026-10-31', 1), '2026-11-01');
  eq(P.addDays('2026-03-01', -1), '2026-02-28');
  eq(P.diffDays('2026-10-01', '2026-10-10'), 9);
});
