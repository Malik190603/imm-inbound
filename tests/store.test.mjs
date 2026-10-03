import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const S = require('../www/store.js');
const eq = assert.equal, deepEq = assert.deepEqual, rejects = assert.rejects, match = assert.match;
const URL0 = 'https://x.supabase.co';
const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' });
let fake;
const json = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) });
function makeFake() {
  const f = { count: 0, failInsert: false, failUpload: false, order: [], uploads: 0, deleted: [], inserted: [], rowsDeleted: [], headers: [], urls: [] };
  f.fetch = async (url, o = {}) => {
    const m = (o.method || 'GET').toUpperCase(); f.headers.push(o.headers || {}); f.urls.push(m + ' ' + url);
    if (url.startsWith(URL0 + '/storage/v1/object/imm-photos/')) {
      const p = url.split('/imm-photos/')[1];
      if (m === 'POST') { f.order.push('upload'); if (f.failUpload) return json(500, { message: 'x' }); f.uploads++; f.lastUpload = { path: p, body: o.body, headers: o.headers }; return json(200, { Key: p }); }
      if (m === 'DELETE') { f.order.push('remove'); f.deleted.push(p); return json(200, {}); }
    }
    if (url.startsWith(URL0 + '/rest/v1/')) {
      const table = url.split('/rest/v1/')[1].split('?')[0];
      if (m === 'GET') { f.order.push(/select=id(&|$)/.test(url) ? 'count' : 'list'); return json(200, Array.from({ length: f.count }, (_, i) => ({ id: i + 1, lpn: 'ID001', toloc: 'FLR-01', path: 'putaway/ID001/' + i + '.jpg', created_at: '2026-10-01T00:00:00Z' }))); }
      if (m === 'POST') { f.order.push('insert'); if (f.failInsert) return json(500, { message: 'x' }); const row = { id: 99, ...JSON.parse(o.body) }; f.inserted.push({ table, row }); return json(201, [row]); }
      if (m === 'DELETE') { f.order.push('delrow'); f.rowsDeleted.push(url); return json(204, {}); }
    }
    return json(404, {});
  };
  return f;
}
beforeEach(() => { fake = makeFake(); S._config(URL0, 'anon-key'); S._setFetch(fake.fetch); });

test('configured is false with empty config, true once set', () => { S._config('', ''); eq(S.configured(), false); S._config(URL0, 'k'); eq(S.configured(), true); });
test('photoUrl points at the public bucket', () => { eq(S.photoUrl('putaway/ID001/a.jpg'), URL0 + '/storage/v1/object/public/imm-photos/putaway/ID001/a.jpg'); });
test('every request carries apikey and bearer token', async () => { await S.listPutawayPhotos(['ID001']); eq(fake.headers[0].apikey, 'anon-key'); eq(fake.headers[0].Authorization, 'Bearer anon-key'); });
test('listPutawayPhotos with no LPNs makes no request', async () => { deepEq(await S.listPutawayPhotos([]), []); eq(fake.urls.length, 0); });
test('listPutawayPhotos asks in chunks of 80 LPNs', async () => { await S.listPutawayPhotos(Array.from({ length: 170 }, (_, i) => 'ID' + i)); eq(fake.urls.length, 3); });
test('addPutawayPhoto rejects MAX when 4 already stored', async () => { fake.count = 4; await rejects(S.addPutawayPhoto('ID001', 'FLR-01', blob), /MAX/); eq(fake.uploads, 0); });
test('addPutawayPhoto uploads then inserts', async () => {
  fake.count = 1; const r = await S.addPutawayPhoto('ID001', 'FLR-01', blob, 'dev1');
  match(r.path, /^putaway\/ID001\/\d+-[a-z0-9]+\.jpg$/); deepEq(fake.order, ['count', 'upload', 'insert']);
  eq(fake.inserted[0].table, 'putaway_photos'); eq(fake.inserted[0].row.lpn, 'ID001'); eq(fake.inserted[0].row.toloc, 'FLR-01'); eq(fake.inserted[0].row.device, 'dev1');
  eq(fake.lastUpload.headers['Content-Type'], 'image/jpeg'); eq(fake.lastUpload.path, r.path);
});
test('failed upload inserts nothing', async () => { fake.failUpload = true; await rejects(S.addPutawayPhoto('ID001', 'FLR-01', blob)); eq(fake.inserted.length, 0); eq(fake.deleted.length, 0); });
test('failed insert removes the uploaded object', async () => { fake.failInsert = true; await rejects(S.addPutawayPhoto('ID001', 'FLR-01', blob)); eq(fake.deleted.length, 1); eq(fake.deleted[0], fake.lastUpload.path); });
test('LPN with unsafe characters gets a safe storage path', async () => { const r = await S.addPutawayPhoto('ID 0/1?', 'FLR-01', blob); match(r.path, /^putaway\/ID_0_1_\//); });
test('removePutawayPhoto deletes the row, then the object', async () => { await S.removePutawayPhoto({ id: 7, path: 'putaway/ID001/a.jpg' }); deepEq(fake.order, ['delrow', 'remove']); match(fake.rowsDeleted[0], /putaway_photos\?id=eq\.7$/); deepEq(fake.deleted, ['putaway/ID001/a.jpg']); });
test('calls reject with NOCONFIG when Supabase is not set', async () => { S._config('', ''); await rejects(S.listPutawayPhotos(['ID001']), /NOCONFIG/); });

// ---------- TTO ----------
const entry = { tgl: '2026-10-03', no_tto: 'TTO/001/X', barang: 'Dokumen retur', koli: 3, pic: 'Malik', penerima: 'Budi' };
test('addTto uploads each photo, then inserts once with their paths', async () => {
  const r = await S.addTto(entry, [blob, blob], 'dev1');
  eq(fake.uploads, 2); deepEq(fake.order, ['upload', 'upload', 'insert']); eq(fake.inserted.length, 1); eq(fake.inserted[0].table, 'tto');
  eq(r.photos.length, 2); match(r.photos[0], /^tto\/TTO_001_X\/\d+-0-[a-z0-9]+\.jpg$/); match(r.photos[1], /-1-[a-z0-9]+\.jpg$/);
  eq(r.no_tto, 'TTO/001/X'); eq(r.koli, 3); eq(r.device, 'dev1'); eq(r.tgl, '2026-10-03');
});
test('addTto without photos inserts with an empty list', async () => { const r = await S.addTto(entry, []); eq(fake.uploads, 0); deepEq(r.photos, []); });
test('addTto: failed insert deletes every uploaded photo', async () => { fake.failInsert = true; await rejects(S.addTto(entry, [blob, blob])); eq(fake.deleted.length, 2); });
test('addTto: a failed upload deletes the photos already uploaded and inserts nothing', async () => {
  let n = 0; const orig = fake.fetch; S._setFetch(async (u, o = {}) => { if ((o.method || 'GET') === 'POST' && u.includes('/storage/') && ++n === 2) return { ok: false, status: 500, json: async () => ({}) }; return orig(u, o); });
  await rejects(S.addTto(entry, [blob, blob, blob])); eq(fake.inserted.length, 0); eq(fake.deleted.length, 1);
});
test('addTto with 5 photos rejects MAX before uploading', async () => { await rejects(S.addTto(entry, [blob, blob, blob, blob, blob]), /MAX/); eq(fake.uploads, 0); });
test('addTto rejects INVALID for a missing field or koli < 1', async () => {
  await rejects(S.addTto({ ...entry, no_tto: ' ' }, []), /INVALID/); await rejects(S.addTto({ ...entry, koli: 0 }, []), /INVALID/); await rejects(S.addTto({ ...entry, koli: 1.5 }, []), /INVALID/); await rejects(S.addTto({ ...entry, tgl: '03/10/2026' }, []), /INVALID/); eq(fake.urls.length, 0);
});
test('listTto filters by date range, newest first', async () => { await S.listTto({ from: '2026-10-01', to: '2026-10-03' }); match(fake.urls[0], /tto\?select=\*&tgl=gte\.2026-10-01&tgl=lte\.2026-10-03&order=tgl\.desc,created_at\.desc$/); });
test('removeTto deletes the row, then its photos', async () => { await S.removeTto({ id: 5, photos: ['tto/a/1.jpg', 'tto/a/2.jpg'] }); deepEq(fake.order, ['delrow', 'remove', 'remove']); match(fake.rowsDeleted[0], /tto\?id=eq\.5$/); });
