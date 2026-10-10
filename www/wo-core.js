// Work Order, Observasi, Project & Schedule (tanpa DOM): window.IMMWo di aplikasi, module.exports di Node.
// Aturan yang sama dicek ulang oleh fungsi Supabase (imm_wo_move, imm_obs_move, imm_obs_add).
(function (root, factory) { const m = factory(); if (typeof module === 'object' && module.exports) module.exports = m; else root.IMMWo = m; })(typeof self !== 'undefined' ? self : this, function () {
  const str = (v) => String(v == null ? '' : v).trim();
  const ALAT = ['Electric Reachtruk', 'Forklift', 'Hand Pallet', 'Pallet Mover', 'Stock Picker', 'Battery Charger Pallet Mover', 'Battery Charger Electric Reachtruk', 'Lampu', 'Kelistrikan'];
  const PEKERJAAN = ['Perawatan Berkala', 'Perbaikan Kerusakan', 'Pemeriksaan Alat', 'Penggantian Komponen', 'Pemasangan', 'Pembongkaran', 'Pekerjaan Kelistrikan', 'Penanganan Gangguan', 'Pembersihan', 'Pengujian Fungsi', 'Modifikasi', 'Lain Lain'];
  const LOKASI = ['Pintu Inbound', 'Pintu Outbound A', 'Pintu Outbound B', 'Area MHE', 'Office', 'Dispatching', 'Floor', 'Rak', 'Area Luar', 'Area Parkir Armada', 'Area Parkir Karyawan', 'Area WC', 'Area Mess'];
  const CHECKLIST = ['Lampu', 'CCTV', 'Apar', 'Tempat Sampah', 'Charger Lifttruck / Pallet Mover', 'Stop Kontak', 'Alarm', 'Hand Talkie'];
  const KONDISI = ['Aman / Baik', 'Tidak menyala', 'Bersih', 'Kotor', 'Tergembok', 'Lengkap', 'Aktif', 'Tidak Aktif', 'Berbahaya'];
  const BAD_KONDISI = ['Tidak menyala', 'Kotor', 'Tidak Aktif', 'Berbahaya'];
  const WO_STATUS = { menunggu: 'Menunggu persetujuan', disetujui: 'Disetujui', ditolak: 'Ditolak', pending: 'Pending', selesai: 'Selesai' };
  const WO_NEXT = { menunggu: ['disetujui', 'ditolak'], disetujui: ['pending', 'selesai'], pending: ['disetujui', 'selesai'], selesai: [], ditolak: [] };
  const OBS_STATUS = { open: 'Open', ongoing: 'Ongoing', closed: 'Closed' };
  const OBS_NEXT = { open: ['ongoing'], ongoing: ['closed'], closed: [] };
  const SCHED_JENIS = { project: 'DC Project', official: 'Official Schedule' };
  const SCHED_STATUS = { rencana: 'Rencana', berjalan: 'Berjalan', selesai: 'Selesai', batal: 'Batal' };
  const MAX_PHOTOS = 4;

  const pad = (n, w) => String(n).padStart(w, '0');
  const fmtNo = (prefix, day, n) => `${prefix}-${day.replace(/-/g, '')}-${pad(n, 4)}`;
  function parseNo(no) {
    const m = str(no).match(/^([A-Z]+)-(\d{4})(\d{2})(\d{2})-(\d{4,})$/);
    return m ? { prefix: m[1], day: `${m[2]}-${m[3]}-${m[4]}`, n: +m[5] } : null;
  }

  const isMgr = (u) => !!u && u.jabatan === 'MANAGER';
  const isAdmin = (u) => !!u && u.jabatan === 'ADMIN';
  const isMhe = (u) => !!u && u.role === 'MHE' && u.jabatan !== 'WAREHOUSEMAN';
  function canMove(u, wo, to, photos) {
    const from = wo && wo.status;
    if (!u || !WO_NEXT[from] || WO_NEXT[from].indexOf(to) < 0) return { ok: false, why: 'Status ini tidak bisa diubah ke ' + (WO_STATUS[to] || to) };
    if (from === 'menunggu' || (from === 'pending' && to === 'disetujui')) return isMgr(u) ? { ok: true } : { ok: false, why: 'Hanya Manager yang bisa menyetujui' };
    if (to === 'pending') return isMhe(u) || isMgr(u) || isAdmin(u) ? { ok: true } : { ok: false, why: 'Hanya MHE atau Manager' };
    if (to === 'selesai') {
      if (!isMhe(u)) return { ok: false, why: 'Hanya MHE yang menandai selesai' };
      if (photos == null) return { ok: true };
      if (photos < 1) return { ok: false, why: 'Lampirkan minimal 1 foto dokumentasi' };
      if (photos > MAX_PHOTOS) return { ok: false, why: 'Maksimal 4 foto' };
      return { ok: true };
    }
    return { ok: false, why: 'Tidak diizinkan' };
  }
  const actions = (u, wo) => (WO_NEXT[wo && wo.status] || []).filter((to) => canMove(u, wo, to).ok);

  function canMoveObs(u, obs, to) {
    const from = obs && obs.status;
    if (!OBS_NEXT[from] || OBS_NEXT[from].indexOf(to) < 0) return { ok: false, why: 'Status ini tidak bisa diubah' };
    const ok = !!u && u.jabatan !== 'WAREHOUSEMAN' && (u.role === 'LP' || ['MANAGER', 'ASST. MANAGER', 'ADMIN'].indexOf(u.jabatan) >= 0);
    return ok ? { ok: true } : { ok: false, why: 'Hanya LP atau Manager' };
  }

  const P = (typeof require === 'function') ? (() => { try { return require('./parse-core.js'); } catch (e) { return null; } })() : null;
  const money = (v) => { const IP = P || (typeof self !== 'undefined' && self.IMMParse); return IP ? IP.num(v) : (parseFloat(str(v).replace(/[^\d.-]/g, '')) || null); };
  function maxLen(errors, k, v, n) { if (str(v).length > n) errors[k] = `Maksimal ${n} karakter`; }
  function validateWo(f) {
    const e = {};
    if (ALAT.indexOf(f.alat) < 0) e.alat = 'Pilih alat / mesin';
    if (PEKERJAAN.indexOf(f.pekerjaan) < 0) e.pekerjaan = 'Pilih nama pekerjaan';
    if (!str(f.detail)) e.detail = 'Isi detail pekerjaan'; else maxLen(e, 'detail', f.detail, 1000);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str(f.mulai))) e.mulai = 'Isi tanggal dan jam mulai';
    if (!str(f.tim)) e.tim = 'Isi tim yang terlibat'; else maxLen(e, 'tim', f.tim, 200);
    let biaya = null;
    if (str(f.biaya)) { biaya = money(f.biaya); if (biaya == null || biaya < 0) e.biaya = 'Biaya harus angka 0 atau lebih'; }
    maxLen(e, 'catatan', f.catatan, 1000);
    const ok = !Object.keys(e).length;
    return { ok, errors: e, value: ok ? { alat: f.alat, pekerjaan: f.pekerjaan, detail: str(f.detail), mulai: str(f.mulai), tim: str(f.tim), biaya, catatan: str(f.catatan) } : undefined };
  }
  function validateObsEntry(f) {
    const e = {};
    const list = f.jenis === 'checklist' ? CHECKLIST : LOKASI;
    if (list.indexOf(f.objek) < 0) e.objek = f.jenis === 'checklist' ? 'Pilih item checklist' : 'Pilih lokasi';
    const k = f.kondisi || [];
    if (!k.length || k.some((x) => KONDISI.indexOf(x) < 0)) e.kondisi = 'Pilih minimal 1 kondisi';
    maxLen(e, 'detail', f.detail, 500);
    if ((f.photos || 0) > MAX_PHOTOS) e.photos = 'Maksimal 4 foto';
    return { ok: !Object.keys(e).length, errors: e };
  }
  function validateSchedule(f) {
    const e = {};
    if (!SCHED_JENIS[f.jenis]) e.jenis = 'Pilih jenis';
    if (!str(f.nama)) e.nama = 'Isi nama'; else maxLen(e, 'nama', f.nama, 200);
    const d = /^\d{4}-\d{2}-\d{2}$/;
    if (!d.test(str(f.mulai))) e.mulai = 'Isi tanggal mulai';
    if (str(f.selesai) && (!d.test(str(f.selesai)) || str(f.selesai) < str(f.mulai))) e.selesai = 'Tanggal selesai tidak boleh sebelum mulai';
    if (!SCHED_STATUS[f.status]) e.status = 'Pilih status';
    maxLen(e, 'keterangan', f.keterangan, 1000);
    return { ok: !Object.keys(e).length, errors: e };
  }

  function reminders(wos, now) {
    const t = str(now).slice(0, 16);
    const r = { menunggu: [], terlambat: [], pending: [] };
    for (const w of wos || []) {
      if (w.status === 'menunggu') r.menunggu.push(w);
      else if (w.status === 'pending') r.pending.push(w);
      else if (w.status === 'disetujui' && str(w.mulai).slice(0, 16) < t) r.terlambat.push(w);
    }
    r.total = r.menunggu.length + r.terlambat.length + r.pending.length;
    return r;
  }
  function summary(wos) {
    const byStatus = {}; Object.keys(WO_STATUS).forEach((k) => { byStatus[k] = 0; });
    const alat = {}, kerja = {}, week = {};
    let biaya = 0;
    for (const w of wos || []) {
      if (byStatus[w.status] != null) byStatus[w.status]++;
      if (w.status === 'ditolak') continue;
      alat[w.alat] = (alat[w.alat] || 0) + 1;
      kerja[w.pekerjaan] = (kerja[w.pekerjaan] || 0) + 1;
      biaya += +w.biaya || 0;
      const d = str(w.tanggal).slice(0, 10); if (d) week[d] = (week[d] || 0) + 1;
    }
    const sorted = (o) => Object.entries(o).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
    return { byStatus, byAlat: sorted(alat), byPekerjaan: sorted(kerja), biaya, perHari: Object.entries(week).sort(), open: byStatus.menunggu + byStatus.disetujui + byStatus.pending };
  }

  return { ALAT, PEKERJAAN, LOKASI, CHECKLIST, KONDISI, BAD_KONDISI, WO_STATUS, WO_NEXT, OBS_STATUS, OBS_NEXT, SCHED_JENIS, SCHED_STATUS, MAX_PHOTOS, fmtNo, parseNo, canMove, actions, canMoveObs, validateWo, validateObsEntry, validateSchedule, reminders, summary };
});
