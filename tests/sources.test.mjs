import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const S = require('../www/sources.js');
const eq = assert.equal, deepEq = assert.deepEqual;
const ctx = { today: '2026-10-10' };
const resp = (body, status = 200) => ({ ok: status < 400, status, text: async () => body });
let calls;
function fake(map) { calls = []; S.setFetch(async (u) => { calls.push(decodeURIComponent(u)); for (const [k, v] of map) if (decodeURIComponent(u).includes(k)) return typeof v === 'function' ? v() : v; return resp('', 404); }); }
beforeEach(() => { S.clear(); S.setStore(null); });

test('every registry entry has doc, title and a sheet/gid', () => {
  for (const [k, s] of Object.entries(S.REG)) {
    assert.ok(S.DOCS[s.doc], k + ' doc');
    assert.ok(s.title, k + ' title');
    assert.ok(s.sheet || s.gid, k + ' sheet');
    assert.ok(s.need || s.mark, k + ' validation');
  }
  eq(S.REPORTS.length, 9);
});

test('url: month tab names, encoded sheet, unique cache buster, date filters', () => {
  const u = decodeURIComponent(S.url('ldH', ctx));
  assert.match(u, /sheet=RDC Tallo HCI Okt 2026/);
  assert.match(u, /^https:\/\/docs\.google\.com\/spreadsheets\/d\/1-DrDOPp/);
  assert.match(u, /range=A1:AN230/); // seluruh matriks sampai blok WH Man Hadir
  assert.match(decodeURIComponent(S.url('rep3', ctx)), /sheet=RDC Tallo HCI Okt&/);
  assert.match(decodeURIComponent(S.url('rep6', ctx)), /sheet=W41/);
  assert.match(decodeURIComponent(S.url('dp', ctx)), /sheet=okt/);
  assert.match(decodeURIComponent(S.url('wtwH', ctx)), /A >= date '2026-08-26' and A <= date '2026-10-10'/);
  assert.match(decodeURIComponent(S.url('rit', ctx)), /A starts with '261010' or A starts with '261011'/);
  assert.notEqual(S.url('occH', ctx).match(/r=([^&]+)/)[1], S.url('occH', ctx).match(/r=([^&]+)/)[1]);
});

test('private columns are never requested', () => {
  // Logbook visitor: kolom C (Nama Tamu), E (Nomor Telepon), G (No. Dokumen), K (LP) tidak diminta
  const v = decodeURIComponent(S.url('visitor', ctx));
  assert.match(v, /select A,F,I,J /);
  assert.match(decodeURIComponent(S.url('karyawan', ctx)), /select A,C,E,G,H,I,J /); // tanpa D (nama), F (NIK), K (petugas)
  assert.match(decodeURIComponent(S.url('seal', ctx)), /select A,C,D$/);           // tanpa NO POL
  assert.match(decodeURIComponent(S.url('jemput', ctx)), /select B,C,F,I$/);       // tanpa nama customer/driver/nopol
  assert.match(decodeURIComponent(S.url('kardus', ctx)), /select C,E,F,G,K$/);     // tanpa email/pelapor/petugas
});

test('load parses CSV and validates headers; wrong tab is rejected', async () => {
  fake([['OCCUPANCY HCI', resp('"TGL","BU","Capasity","Used Space","%","Inbound","Outbound"\n"10 Oct 26","HCI","7354","7053.41","95.91%","",""\n')]]);
  const r = await S.load('occH', ctx);
  eq(r.from, 'net'); eq(r.rows.length, 2); eq(r.rows[1][3], '7053.41');
  S.clear();
  fake([['OCCUPANCY HCI', resp('"Foo","Bar"\n"1","2"\n')]]);
  await assert.rejects(S.load('occH', ctx), (e) => e.code === 'WRONGTAB');
});

test('mark validation for headerless tabs', async () => {
  fake([['Virtual', resp('"","10 Oct 2026"\n"","FLOOR","1"\n"","PACK","2"\n')]]);
  eq((await S.load('virtual', ctx)).rows.length, 3);
  S.clear();
  fake([['Virtual', resp('"x","y"\n')]]);
  await assert.rejects(S.load('virtual', ctx), (e) => e.code === 'WRONGTAB');
});

test('empty results: allowed for count/filters, error otherwise', async () => {
  fake([['Form Visitor', resp('"Timestamp","Tujuan Kunjungan","Jam Masuk","Jam Keluar"\n')], ['TTO', resp('')]]);
  eq((await S.load('visitor', ctx)).rows.length, 1);
  fake([['TERBARU', resp('')], ['sheet=TTO', resp('')]]);
  await assert.rejects(S.load('ttoOut', ctx), (e) => e.code === 'EMPTY');
});

test('html response means the sheet is not shared', async () => {
  fake([['OCCUPANCY AHI', resp('<!DOCTYPE html><html>login</html>')]]);
  await assert.rejects(S.load('occA', ctx), (e) => e.code === 'PRIVATE');
});

test('cache: fresh hit skips network; failure falls back to stale cache', async () => {
  const mem = new Map();
  S.setStore({ get: (k) => mem.get(k) || null, set: (k, v) => mem.set(k, v) });
  fake([['OCCUPANCY HCI', resp('"TGL","BU","Capasity","Used Space"\n"10 Oct 26","HCI","1","2"\n')]]);
  await S.load('occH', ctx); eq(calls.length, 1);
  await S.load('occH', ctx); eq(calls.length, 1);
  S.clear();
  fake([['OCCUPANCY HCI', () => { throw new Error('offline'); }]]);
  const r = await S.load('occH', ctx, { force: true });
  eq(r.stale, true); eq(r.rows[1][3], '2'); eq(r.error.code, 'NETWORK');
});

test('master users are never written to persistent storage', async () => {
  const mem = new Map();
  S.setStore({ get: (k) => mem.get(k) || null, set: (k, v) => mem.set(k, v) });
  fake([['Master User APK', resp('"USER","ROLE","JABATAN"\n"123456.NAMA","INBOUND","STAFF"\n')]]);
  await S.load('users', ctx);
  eq(mem.size, 0);
});

test('concurrent loads of the same source share one request', async () => {
  fake([['OCCUPANCY HCI', resp('"TGL","BU","Capasity","Used Space"\n"10 Oct 26","HCI","1","2"\n')]]);
  await Promise.all([S.load('occH', ctx), S.load('occH', ctx), S.load('occH', ctx)]);
  eq(calls.length, 1);
});

test('loadMany returns errors per source', async () => {
  fake([['OCCUPANCY HCI', resp('"TGL","BU","Capasity","Used Space"\n"x","HCI","1","2"\n')]]);
  const r = await S.loadMany(['occH', 'occA'], ctx);
  eq(r.occH.rows.length, 2);
  eq(r.occA.rows, null); assert.ok(r.occA.error);
});
