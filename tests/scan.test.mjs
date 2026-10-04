// Scan TTO dari foto: pemetaan hasil scan ke form (di aplikasi) dan fungsi server scan-tto.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const C = require('../www/inbound-core.js');
const eq = assert.equal, deepEq = assert.deepEqual, ok = assert.ok;

// index.ts ditulis dengan sintaks JavaScript biasa supaya bisa ditempel di dashboard Supabase sebagai satu file;
// untuk diuji di Node, isinya disalin ke file .mjs sementara.
const SRC = new URL('../supabase/functions/scan-tto/index.ts', import.meta.url);
async function server() {
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'scan-')), 'scan-tto.mjs');
  fs.copyFileSync(SRC, tmp); return import(pathToFileURL(tmp).href);
}
const SAMPLE = { no_tto: 'TTO/H001/2026/09/0721', trans_no: 'TTO.H001.2026.09.0725', tgl_dok: '2026-09-19', tujuan: 'HCIR INFORMA MARICAYA LATANETTE MAKASAR',
  items: [{ nama: 'BATU KACANG', qty: 1, satuan: 'KOLI' }, { nama: 'VAS KRAMIK', qty: 3, satuan: 'KOLI' }, { nama: 'PAHON + BATU', qty: 1, satuan: 'KOLI' }, { nama: 'VAS TRASO', qty: 1, satuan: 'KOLI' }], total: 6 };

// ---------- pemetaan ke form ----------
test('scanToForm: dokumen contoh mengisi No TTO, daftar barang, dan total koli', () => {
  deepEq(C.scanToForm(SAMPLE), { no_tto: 'TTO/H001/2026/09/0721', barang: 'BATU KACANG (1), VAS KRAMIK (3), PAHON + BATU (1), VAS TRASO (1)', koli: 6, notes: [] });
});
test('scanToForm: total tidak terbaca → koli dijumlah dari tiap baris', () => {
  const f = C.scanToForm({ ...SAMPLE, total: null }); eq(f.koli, 6); deepEq(f.notes, []);
});
test('scanToForm: total berbeda dari jumlah baris → pakai total dan beri catatan', () => {
  const f = C.scanToForm({ ...SAMPLE, items: SAMPLE.items.slice(0, 3) });
  eq(f.koli, 6); eq(f.notes.length, 1); ok(/Total di dokumen 6/.test(f.notes[0]) && /5/.test(f.notes[0]), f.notes[0]);
});
test('scanToForm: tanpa barang dan tanpa total → koli kosong, No TTO tetap terisi', () => {
  const f = C.scanToForm({ no_tto: ' TTO/1 ', items: [], total: null });
  eq(f.no_tto, 'TTO/1'); eq(f.barang, ''); eq(f.koli, ''); ok(f.notes.some((n) => /barang tidak terbaca/i.test(n)));
});
test('scanToForm: No TTO tidak terbaca → kosong dengan catatan', () => {
  const f = C.scanToForm({ ...SAMPLE, no_tto: '' }); eq(f.no_tto, ''); ok(f.notes.some((n) => /No TTO tidak terbaca/.test(n)));
});
test('scanToForm: daftar barang panjang dipotong di batas kolom dan menyebut sisanya', () => {
  const items = Array.from({ length: 30 }, (_, i) => ({ nama: 'BARANG NOMOR ' + (i + 1), qty: 2 }));
  const f = C.scanToForm({ no_tto: 'X', items, total: 60 });
  ok(f.barang.length <= C.TTO_BARANG_MAX, String(f.barang.length)); ok(/\+\d+ lainnya$/.test(f.barang), f.barang);
  const shown = (f.barang.match(/BARANG NOMOR/g) || []).length; eq(Number(f.barang.match(/\+(\d+) lainnya$/)[1]), 30 - shown);
});
test('scanToForm: masukan rusak tidak melempar galat', () => {
  for (const bad of [null, undefined, 'x', { items: 'x' }, { items: [null, { nama: '', qty: 'abc' }], total: -3 }]) {
    const f = C.scanToForm(bad); eq(typeof f.barang, 'string'); ok(f.koli === '' || Number.isInteger(f.koli));
  }
});

// ---------- fungsi server ----------
const b64 = (n) => Buffer.alloc(n, 1).toString('base64');
const post = (body, headers = {}) => new Request('https://x.supabase.co/functions/v1/scan-tto', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
const gemOK = (obj) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: typeof obj === 'string' ? obj : JSON.stringify(obj) }] } }] }), { status: 200 });
const claudeOK = (obj) => new Response(JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(obj) }] }), { status: 200 });
// fetch tiruan: mencatat panggilan; rpc kuota menjawab true kecuali diatur lain
function fake(o = {}) {
  const calls = [];
  const f = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    if (/\/rest\/v1\/rpc\/imm_scan_take/.test(url)) return o.rpc ? o.rpc() : new Response('true', { status: 200 });
    if (/generativelanguage/.test(url)) return o.gemini ? o.gemini() : gemOK(SAMPLE);
    if (/api\.anthropic\.com/.test(url)) return o.claude ? o.claude() : claudeOK(SAMPLE);
    return new Response('not found', { status: 404 });
  };
  return { f, calls };
}
const ENV = { GEMINI_API_KEY: 'g-key', SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'srv' };

test('server: pickProvider memilih dari kunci yang dipasang', async () => {
  const S = await server();
  eq(S.pickProvider({}), null); eq(S.pickProvider({ GEMINI_API_KEY: 'a' }), 'gemini'); eq(S.pickProvider({ ANTHROPIC_API_KEY: 'a' }), 'claude');
  eq(S.pickProvider({ GEMINI_API_KEY: 'a', ANTHROPIC_API_KEY: 'b' }), 'gemini');
  eq(S.pickProvider({ GEMINI_API_KEY: 'a', ANTHROPIC_API_KEY: 'b', SCAN_PROVIDER: 'claude' }), 'claude');
  eq(S.pickProvider({ ANTHROPIC_API_KEY: 'b', SCAN_PROVIDER: 'gemini' }), 'claude');
});
test('server: Gemini — foto dikirim sebagai inline_data dengan kunci di header, hasil dirapikan', async () => {
  const S = await server(); const { f, calls } = fake();
  const r = await S.handle(post({ image: b64(1000), mime: 'image/jpeg', device: 'd1' }), ENV, f); eq(r.status, 200);
  const j = await r.json(); eq(j.provider, 'gemini'); deepEq(j.scan, SAMPLE);
  const g = calls.find((c) => /generativelanguage/.test(c.url)); ok(/models\/[\w.-]+:generateContent$/.test(g.url), g.url);
  eq(g.init.headers['x-goog-api-key'], 'g-key'); ok(!g.url.includes('g-key'));
  const body = JSON.parse(g.init.body); const parts = body.contents[0].parts;
  ok(parts.some((p) => p.inline_data && p.inline_data.mime_type === 'image/jpeg' && p.inline_data.data === b64(1000)));
  ok(parts.some((p) => typeof p.text === 'string' && /Document No/.test(p.text))); eq(body.generationConfig.responseMimeType, 'application/json');
  eq(r.headers.get('access-control-allow-origin'), '*');
});
test('server: Claude — dipakai bila hanya kunci Anthropic yang ada', async () => {
  const S = await server(); const { f, calls } = fake();
  const r = await S.handle(post({ image: b64(500), mime: 'image/png' }), { ...ENV, GEMINI_API_KEY: '', ANTHROPIC_API_KEY: 'a-key' }, f); eq(r.status, 200);
  eq((await r.json()).provider, 'claude');
  const c = calls.find((x) => /anthropic/.test(x.url)); eq(c.init.headers['x-api-key'], 'a-key'); ok(c.init.headers['anthropic-version']);
  const body = JSON.parse(c.init.body); const img = body.messages[0].content.find((p) => p.type === 'image');
  eq(img.source.type, 'base64'); eq(img.source.media_type, 'image/png'); ok(body.max_tokens > 0 && body.model);
});
test('server: model bisa diganti lewat secret', async () => {
  const S = await server(); const { f, calls } = fake();
  await S.handle(post({ image: b64(10), mime: 'image/jpeg' }), { ...ENV, GEMINI_MODEL: 'gemini-x-test' }, f);
  ok(calls.some((c) => c.url.endsWith('/models/gemini-x-test:generateContent')));
});
test('server: jawaban AI dibungkus pagar kode atau berisi teks lain tetap terbaca', async () => {
  const S = await server(); const { f } = fake({ gemini: () => gemOK('Berikut hasilnya:\n```json\n' + JSON.stringify(SAMPLE) + '\n```') });
  const r = await S.handle(post({ image: b64(10), mime: 'image/jpeg' }), ENV, f); eq(r.status, 200); deepEq((await r.json()).scan.items.length, 4);
});
test('server: hasil AI dirapikan — angka dari teks, baris kosong dibuang, teks dipangkas', async () => {
  const S = await server();
  const s = S.normalizeScan({ no_tto: '  TTO/1 ', items: [{ nama: ' A ', qty: '3' }, { nama: '', qty: 2 }, { nama: 'B', qty: 'x' }, null], total: '5', tgl_dok: '19-09-2026', tujuan: 'T'.repeat(500) });
  eq(s.no_tto, 'TTO/1'); deepEq(s.items, [{ nama: 'A', qty: 3, satuan: '' }, { nama: 'B', qty: null, satuan: '' }]); eq(s.total, 5); eq(s.tgl_dok, '2026-09-19'); ok(s.tujuan.length <= 120);
});
test('server: bukan dokumen TTO (tanpa nomor dan tanpa barang) → 422 UNREADABLE', async () => {
  const S = await server(); const { f } = fake({ gemini: () => gemOK({ no_tto: '', items: [], total: null }) });
  const r = await S.handle(post({ image: b64(10), mime: 'image/jpeg' }), ENV, f); eq(r.status, 422); eq((await r.json()).error, 'UNREADABLE');
});
test('server: jawaban AI bukan JSON → 422 UNREADABLE', async () => {
  const S = await server(); const { f } = fake({ gemini: () => gemOK('maaf, tidak bisa') });
  const r = await S.handle(post({ image: b64(10), mime: 'image/jpeg' }), ENV, f); eq(r.status, 422);
});
test('server: tanpa kunci AI → 503 NOKEY, AI tidak dipanggil', async () => {
  const S = await server(); const { f, calls } = fake();
  const r = await S.handle(post({ image: b64(10), mime: 'image/jpeg' }), { ...ENV, GEMINI_API_KEY: '' }, f); eq(r.status, 503); eq((await r.json()).error, 'NOKEY'); eq(calls.length, 0);
});
test('server: foto terlalu besar atau bukan gambar ditolak sebelum memanggil AI', async () => {
  const S = await server(); const { f, calls } = fake();
  let r = await S.handle(post({ image: b64(S.LIMITS.maxBytes + 10), mime: 'image/jpeg' }), ENV, f); eq(r.status, 413); eq((await r.json()).error, 'TOOBIG');
  r = await S.handle(post({ image: b64(10), mime: 'application/pdf' }), ENV, f); eq(r.status, 400);
  r = await S.handle(post({ mime: 'image/jpeg' }), ENV, f); eq(r.status, 400);
  r = await S.handle(new Request('https://x/f', { method: 'POST', body: 'bukan json' }), ENV, f); eq(r.status, 400);
  eq(calls.length, 0);
});
test('server: batas harian — kuota habis → 429 QUOTA tanpa memanggil AI; batas dikirim ke database', async () => {
  const S = await server(); const { f, calls } = fake({ rpc: () => new Response('false', { status: 200 }) });
  const r = await S.handle(post({ image: b64(10), mime: 'image/jpeg', device: 'd9' }), { ...ENV, SCAN_DAILY_LIMIT: '50' }, f); eq(r.status, 429); eq((await r.json()).error, 'QUOTA');
  eq(calls.length, 1); const b = JSON.parse(calls[0].init.body); eq(b.p_limit, 50); eq(b.p_device, 'd9'); eq(calls[0].init.headers.Authorization, 'Bearer srv');
  const d = fake(); await S.handle(post({ image: b64(10), mime: 'image/jpeg' }), ENV, d.f); eq(JSON.parse(d.calls[0].init.body).p_limit, S.LIMITS.perDay);
});
test('server: pencatat kuota belum dipasang (SQL belum dijalankan) → 503 NOLOG, AI tidak dipanggil', async () => {
  const S = await server(); const { f, calls } = fake({ rpc: () => new Response('{"message":"function not found"}', { status: 404 }) });
  const r = await S.handle(post({ image: b64(10), mime: 'image/jpeg' }), ENV, f); eq(r.status, 503); eq((await r.json()).error, 'NOLOG'); eq(calls.length, 1);
});
test('server: AI menolak karena kuota → 429 AIQUOTA; galat lain → 502 AIFAIL tanpa membocorkan isi', async () => {
  const S = await server();
  let x = fake({ gemini: () => new Response('{"error":{"message":"quota key=SECRET"}}', { status: 429 }) });
  let r = await S.handle(post({ image: b64(10), mime: 'image/jpeg' }), ENV, x.f); eq(r.status, 429); eq((await r.json()).error, 'AIQUOTA');
  x = fake({ gemini: () => new Response('{"error":{"message":"bad key SECRET"}}', { status: 400 }) });
  r = await S.handle(post({ image: b64(10), mime: 'image/jpeg' }), ENV, x.f); eq(r.status, 502); const t = await r.text(); ok(/AIFAIL/.test(t) && !/SECRET/.test(t), t);
  x = fake({ gemini: () => { throw new Error('network'); } });
  r = await S.handle(post({ image: b64(10), mime: 'image/jpeg' }), ENV, x.f); eq(r.status, 502);
});
test('server: OPTIONS dijawab untuk CORS, metode lain ditolak', async () => {
  const S = await server(); const { f } = fake();
  let r = await S.handle(new Request('https://x/f', { method: 'OPTIONS' }), ENV, f); ok(r.status === 204 || r.status === 200); ok(/authorization/i.test(r.headers.get('access-control-allow-headers')));
  r = await S.handle(new Request('https://x/f', { method: 'GET' }), ENV, f); eq(r.status, 405);
});
test('server: prompt melarang nama orang dan meminta Document No', async () => {
  const S = await server(); ok(/Document No/.test(S.PROMPT)); ok(/nama orang|tanda tangan/i.test(S.PROMPT));
});
