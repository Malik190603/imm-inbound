import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const S = require('../www/store.js');
const eq = assert.equal, deepEq = assert.deepEqual, rejects = assert.rejects, match = assert.match;
const URL0 = 'https://x.supabase.co';
const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' });
const json = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) });
let f;
beforeEach(() => {
  f = { calls: [], reply: null, uploads: [], failUploadAt: -1 };
  S._config(URL0, 'anon-key');
  S._setFetch(async (url, o = {}) => {
    const m = (o.method || 'GET').toUpperCase();
    f.calls.push({ m, url, body: o.body ? (typeof o.body === 'string' ? JSON.parse(o.body) : '[blob]') : null });
    if (url.includes('/storage/v1/object/imm-photos/')) {
      if (m === 'POST') { if (f.uploads.length === f.failUploadAt) return json(500, {}); f.uploads.push(url.split('/imm-photos/')[1]); return json(200, {}); }
      return json(200, {});
    }
    if (f.reply) return f.reply(url, o);
    return json(200, m === 'GET' ? [] : { ok: 1 });
  });
});

test('rpc posts JSON args to /rest/v1/rpc/<name>', async () => {
  await S.rpc('imm_wo_create', { p: { a: 1 } });
  eq(f.calls[0].m, 'POST'); eq(f.calls[0].url, URL0 + '/rest/v1/rpc/imm_wo_create'); deepEq(f.calls[0].body, { p: { a: 1 } });
});

test('rpc maps IMM_RULE errors to RULE with the friendly reason', async () => {
  f.reply = () => json(400, { code: 'P0001', message: 'IMM_RULE: Lampirkan minimal 1 foto dokumentasi' });
  await rejects(S.rpc('imm_wo_move', {}), (e) => e.message === 'RULE' && e.why === 'Lampirkan minimal 1 foto dokumentasi');
  f.reply = () => json(500, { message: 'boom' });
  await rejects(S.rpc('imm_wo_move', {}), /HTTP 500/);
});

test('woCreate sends the validated form with the NIK', async () => {
  f.reply = (u, o) => json(200, { no: 'WO-20261010-0001', ...JSON.parse(o.body).p });
  const r = await S.woCreate({ alat: 'Forklift', pekerjaan: 'Pembersihan', detail: 'x', mulai: '2026-10-10T08:00', tim: 'MHE', biaya: 1000, catatan: '' }, '123456');
  eq(r.no, 'WO-20261010-0001');
  deepEq(f.calls[0].body.p, { alat: 'Forklift', pekerjaan: 'Pembersihan', detail: 'x', mulai: '2026-10-10T08:00', tim: 'MHE', biaya: '1000', catatan: '', nik: '123456' });
});

test('woMove uploads photos first, then moves with their paths', async () => {
  const user = { nik: '1', role: 'MHE', jabatan: 'STAFF COORDINATOR' };
  await S.woMove('WO-20261010-0001', 'selesai', user, [blob, blob], 'beres');
  eq(f.uploads.length, 2); match(f.uploads[0], /^wo\/WO-20261010-0001\/\d+-0-[a-z0-9]+\.jpg$/);
  const call = f.calls.find((c) => c.url.endsWith('/rpc/imm_wo_move'));
  deepEq(call.body, { p_no: 'WO-20261010-0001', p_to: 'selesai', p_nik: '1', p_role: 'MHE', p_jabatan: 'STAFF COORDINATOR', p_photos: f.uploads, p_note: 'beres' });
});

test('woMove: failed upload stops before the status change', async () => {
  f.failUploadAt = 1;
  await rejects(S.woMove('WO-1', 'selesai', { nik: '1', role: 'MHE', jabatan: 'STAFF' }, [blob, blob]));
  eq(f.calls.some((c) => c.url.endsWith('/rpc/imm_wo_move')), false);
});

test('woMove rejects more than 4 photos before uploading', async () => {
  await rejects(S.woMove('WO-1', 'selesai', { nik: '1' }, [blob, blob, blob, blob, blob]), /MAX/);
  eq(f.uploads.length, 0);
});

test('lists ask for the newest rows with sane limits', async () => {
  await S.woList(); match(f.calls[0].url, /\/rest\/v1\/work_order\?select=\*&order=created_at\.desc&limit=300$/);
  await S.woEvents('WO-1'); match(f.calls[1].url, /wo_event\?select=\*&no=eq\.WO-1&order=at\.asc$/);
  await S.obsList(); match(f.calls[2].url, /observasi\?select=\*&order=created_at\.desc&limit=200$/);
  await S.obsEntries('OBS-1'); match(f.calls[3].url, /obs_entry\?select=\*&no=eq\.OBS-1&batal=is\.false&order=at\.asc$/);
  await S.schedList(); match(f.calls[4].url, /dc_schedule\?select=\*&order=mulai\.asc&limit=500$/);
  await S.notifList('2026-09-10'); match(f.calls[5].url, /notif\?select=\*&untuk=eq\.MANAGER&at=gte\.2026-09-10&order=at\.desc&limit=100$/);
});

test('observasi calls', async () => {
  const u = { nik: '9', role: 'LP', jabatan: 'STAFF LP' };
  await S.obsCreate({ mulai: '2026-10-10T10:00', tim: 'LP 1' }, u);
  deepEq(f.calls[0].body, { p: { mulai: '2026-10-10T10:00', tim: 'LP 1', nik: '9', role: 'LP', jabatan: 'STAFF LP' } });
  await S.obsMove('OBS-1', 'ongoing', u);
  deepEq(f.calls[1].body, { p_no: 'OBS-1', p_to: 'ongoing', p_nik: '9', p_role: 'LP', p_jabatan: 'STAFF LP' });
  await S.obsAdd({ no: 'OBS-1', jenis: 'lokasi', objek: 'Rak', kondisi: ['Bersih'], detail: 'ok' }, [blob], u);
  match(f.uploads[0], /^obs\/OBS-1\//);
  deepEq(f.calls.at(-1).body.p, { no: 'OBS-1', jenis: 'lokasi', objek: 'Rak', kondisi: ['Bersih'], detail: 'ok', photos: f.uploads, nik: '9' });
  await S.obsCancel(5, u); deepEq(f.calls.at(-1).body, { p_id: 5, p_nik: '9' });
});

test('schedule and notif calls', async () => {
  await S.schedSave({ jenis: 'project', nama: 'Rak', mulai: '2026-10-01', selesai: '', status: 'rencana', keterangan: '' }, { nik: '5', jabatan: 'SUPERVISOR' });
  deepEq(f.calls[0].body.p, { jenis: 'project', nama: 'Rak', mulai: '2026-10-01', selesai: '', status: 'rencana', keterangan: '', nik: '5', jabatan: 'SUPERVISOR' });
  await S.notifRead([1, 2], '999'); deepEq(f.calls[1].body, { p_ids: [1, 2], p_nik: '999' });
});

test('addTto records who entered it (input_by)', async () => {
  f.reply = (u, o) => json(201, [{ id: 1, ...JSON.parse(o.body) }]);
  const r = await S.addTto({ tgl: '2026-10-03', no_tto: 'T1', barang: 'x', koli: 1, pic: 'Pak Budi (gudang)', penerima: 'Ani' }, [], 'dev', '123456');
  eq(r.input_by, '123456'); eq(r.pic, 'Pak Budi (gudang)');
});
