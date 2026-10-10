import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const W = require('../www/wo-core.js');
const eq = assert.equal, deepEq = assert.deepEqual;
const U = (role, jabatan) => ({ nik: '1', role, jabatan });

test('run numbers', () => {
  eq(W.fmtNo('WO', '2026-10-10', 4), 'WO-20261010-0004');
  eq(W.fmtNo('OBS', '2026-01-02', 12), 'OBS-20260102-0012');
  deepEq(W.parseNo('WO-20261010-0004'), { prefix: 'WO', day: '2026-10-10', n: 4 });
  eq(W.parseNo('X'), null);
});

test('fixed choice lists from the owner document', () => {
  deepEq(W.ALAT, ['Electric Reachtruk', 'Forklift', 'Hand Pallet', 'Pallet Mover', 'Stock Picker', 'Battery Charger Pallet Mover', 'Battery Charger Electric Reachtruk', 'Lampu', 'Kelistrikan']);
  deepEq(W.PEKERJAAN, ['Perawatan Berkala', 'Perbaikan Kerusakan', 'Pemeriksaan Alat', 'Penggantian Komponen', 'Pemasangan', 'Pembongkaran', 'Pekerjaan Kelistrikan', 'Penanganan Gangguan', 'Pembersihan', 'Pengujian Fungsi', 'Modifikasi', 'Lain Lain']);
  deepEq(W.LOKASI, ['Pintu Inbound', 'Pintu Outbound A', 'Pintu Outbound B', 'Area MHE', 'Office', 'Dispatching', 'Floor', 'Rak', 'Area Luar', 'Area Parkir Armada', 'Area Parkir Karyawan', 'Area WC', 'Area Mess']);
  deepEq(W.CHECKLIST, ['Lampu', 'CCTV', 'Apar', 'Tempat Sampah', 'Charger Lifttruck / Pallet Mover', 'Stop Kontak', 'Alarm', 'Hand Talkie']);
  deepEq(W.KONDISI, ['Aman / Baik', 'Tidak menyala', 'Bersih', 'Kotor', 'Tergembok', 'Lengkap', 'Aktif', 'Tidak Aktif', 'Berbahaya']);
  deepEq(Object.keys(W.WO_STATUS), ['menunggu', 'disetujui', 'ditolak', 'pending', 'selesai']);
  eq(W.WO_STATUS.menunggu, 'Menunggu persetujuan');
});

test('work order transitions', () => {
  deepEq(W.WO_NEXT, { menunggu: ['disetujui', 'ditolak'], disetujui: ['pending', 'selesai'], pending: ['disetujui', 'selesai'], selesai: [], ditolak: [] });
  const wo = { status: 'menunggu' };
  deepEq(W.canMove(U('MANAGER', 'MANAGER'), wo, 'disetujui'), { ok: true });
  eq(W.canMove(U('ASST. MANAGER', 'ASST. MANAGER'), wo, 'disetujui').ok, false);
  eq(W.canMove(U('INBOUND', 'SUPERVISOR'), wo, 'ditolak').ok, false);
  eq(W.canMove(U('MANAGER', 'MANAGER'), wo, 'selesai').ok, false);
  const ok = { status: 'disetujui' };
  deepEq(W.canMove(U('MHE', 'STAFF COORDINATOR'), ok, 'selesai', 0), { ok: false, why: 'Lampirkan minimal 1 foto dokumentasi' });
  deepEq(W.canMove(U('MHE', 'STAFF COORDINATOR'), ok, 'selesai', 1), { ok: true });
  deepEq(W.canMove(U('MHE', 'STAFF COORDINATOR'), ok, 'selesai', 4), { ok: true });
  deepEq(W.canMove(U('MHE', 'STAFF COORDINATOR'), ok, 'selesai', 5), { ok: false, why: 'Maksimal 4 foto' });
  eq(W.canMove(U('INBOUND', 'SUPERVISOR'), ok, 'selesai', 2).ok, false);
  eq(W.canMove(U('MHE', 'STAFF COORDINATOR'), ok, 'pending').ok, true);
  eq(W.canMove(U('MANAGER', 'MANAGER'), { status: 'pending' }, 'disetujui').ok, true);
  eq(W.canMove(U('MHE', 'STAFF COORDINATOR'), { status: 'pending' }, 'disetujui').ok, false);
  eq(W.canMove(U('MANAGER', 'MANAGER'), { status: 'selesai' }, 'pending').ok, false);
  deepEq(W.actions(U('MANAGER', 'MANAGER'), wo), ['disetujui', 'ditolak']);
  deepEq(W.actions(U('MHE', 'STAFF COORDINATOR'), ok), ['pending', 'selesai']);
  deepEq(W.actions(U('INBOUND', 'STAFF'), ok), []);
});

test('validateWo', () => {
  const good = { alat: 'Forklift', pekerjaan: 'Perawatan Berkala', detail: 'Ganti oli', mulai: '2026-10-10T08:00', tim: 'MHE', biaya: '150000', catatan: '' };
  deepEq(W.validateWo(good), { ok: true, errors: {}, value: { alat: 'Forklift', pekerjaan: 'Perawatan Berkala', detail: 'Ganti oli', mulai: '2026-10-10T08:00', tim: 'MHE', biaya: 150000, catatan: '' } });
  const bad = W.validateWo({ alat: 'Mobil', pekerjaan: '', detail: '', mulai: '', tim: '', biaya: '-5', catatan: 'x'.repeat(1001) });
  eq(bad.ok, false);
  deepEq(Object.keys(bad.errors).sort(), ['alat', 'biaya', 'catatan', 'detail', 'mulai', 'pekerjaan', 'tim']);
  eq(W.validateWo({ ...good, detail: 'x'.repeat(1001) }).errors.detail, 'Maksimal 1000 karakter');
  eq(W.validateWo({ ...good, tim: 'x'.repeat(201) }).errors.tim, 'Maksimal 200 karakter');
  eq(W.validateWo({ ...good, biaya: '' }).value.biaya, null);
  eq(W.validateWo({ ...good, biaya: 'Rp 1.500.000' }).value.biaya, 1500000);
});

test('validateObsEntry', () => {
  deepEq(W.validateObsEntry({ jenis: 'lokasi', objek: 'Area MHE', kondisi: ['Bersih', 'Aktif'], detail: 'ok', photos: 2 }).ok, true);
  const b = W.validateObsEntry({ jenis: 'lokasi', objek: 'Lampu', kondisi: [], detail: 'x'.repeat(501), photos: 5 });
  deepEq(Object.keys(b.errors).sort(), ['detail', 'kondisi', 'objek', 'photos']);
  eq(W.validateObsEntry({ jenis: 'checklist', objek: 'Lampu', kondisi: ['Tidak menyala'], detail: '', photos: 0 }).ok, true);
  eq(W.validateObsEntry({ jenis: 'checklist', objek: 'Lampu', kondisi: ['Rusak'], detail: '', photos: 0 }).ok, false);
});

test('observasi transitions', () => {
  deepEq(W.OBS_NEXT, { open: ['ongoing'], ongoing: ['closed'], closed: [] });
  eq(W.canMoveObs(U('LP', 'STAFF LP'), { status: 'open' }, 'ongoing').ok, true);
  eq(W.canMoveObs(U('LP', 'STAFF LP'), { status: 'open' }, 'closed').ok, false);
  eq(W.canMoveObs(U('INBOUND', 'SUPERVISOR'), { status: 'open' }, 'ongoing').ok, false);
});

test('validateSchedule', () => {
  eq(W.validateSchedule({ jenis: 'project', nama: 'Rak baru', mulai: '2026-10-01', selesai: '2026-10-31', status: 'berjalan' }).ok, true);
  const b = W.validateSchedule({ jenis: 'x', nama: '', mulai: '2026-10-05', selesai: '2026-10-01', status: 'z' });
  deepEq(Object.keys(b.errors).sort(), ['jenis', 'nama', 'selesai', 'status']);
});

test('reminders: waiting, overdue start, pending', () => {
  const now = '2026-10-10T10:00';
  const wos = [
    { no: 'A', status: 'menunggu', mulai: '2026-10-11T08:00' },
    { no: 'B', status: 'disetujui', mulai: '2026-10-09T08:00' },
    { no: 'C', status: 'disetujui', mulai: '2026-10-12T08:00' },
    { no: 'D', status: 'pending', mulai: '2026-10-01T08:00' },
    { no: 'E', status: 'selesai', mulai: '2026-10-01T08:00' }];
  const r = W.reminders(wos, now);
  deepEq(r.menunggu.map((w) => w.no), ['A']);
  deepEq(r.terlambat.map((w) => w.no), ['B']);
  deepEq(r.pending.map((w) => w.no), ['D']);
  eq(r.total, 3);
});

test('mhe summary', () => {
  const wos = [
    { status: 'selesai', alat: 'Forklift', pekerjaan: 'Perbaikan Kerusakan', biaya: 100, tanggal: '2026-10-01' },
    { status: 'menunggu', alat: 'Forklift', pekerjaan: 'Perawatan Berkala', biaya: 50, tanggal: '2026-10-08' },
    { status: 'ditolak', alat: 'Lampu', pekerjaan: 'Pemasangan', biaya: 999, tanggal: '2026-10-08' }];
  const s = W.summary(wos);
  deepEq(s.byStatus, { menunggu: 1, disetujui: 0, ditolak: 1, pending: 0, selesai: 1 });
  deepEq(s.byAlat, [['Forklift', 2]]); // ditolak tidak dihitung
  eq(s.biaya, 150);
  eq(s.open, 1);
});
