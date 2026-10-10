# Contract: modul logika murni (diuji dengan `npm test`)

Semua modul memakai pola yang sama dengan `inbound-core.js`: objek global di browser
(`window.IMMx`) dan `module.exports` di Node.

## `www/parse-core.js` → `IMMParse`
- `num(v): number|null` — "Rp 1.234.567", "RP1,234", "99.57%"→99.57, "262 kg"→262, "-"→0,
  "", "#N/A", "#DIV/0!", "#VALUE!", "#REF!" → null.
- `pct(v): number|null` — "86.32%"→86.32; 0.8632→86.32 bila ≤ 1 dan `asFraction`.
- `date(v, ctx={year}): Date|null` — format di research R2; tanggal tanpa tahun memakai
  `ctx.year`; serial Sheets (> 30000) dari 1899-12-30.
- `sepDate(text): Date|null` — "Kamis 01/01/2026", "Jumat 09/10/2026".
- `codeDate(code): Date|null` — `260923T036` → 2026-09-23.
- `isoWeek(d): number`, `weekTab(d): 'W41'`.
- `monthTab(prefix, d): 'RDC Tallo HCI Okt 2026'` (nama bulan Indonesia 3 huruf).
- `col(headers, ...names): number` — indeks kolom berdasarkan teks header (case/spasi
  toleran), -1 bila tidak ada.
- `hasHeaders(headers, need[]): boolean`.
- `fillSep(rows, dateCol)` — isi tanggal baris data dari baris pemisah terdekat di atasnya.
- `matrixDay(rows, {labelCol, dateRow, firstDateCol, ctx}) → {dates:Date[], get(label, date)}`.
- `stripPrivate(headers, rows, privateNames[])` → `{headers, rows}` tanpa kolom privat.

## `www/auth-core.js` → `IMMAuth`
- `normNik(s): string`.
- `parseMaster(rows): Map<nik,{nik,name,role,jabatan}>` — baris terakhir menang; baris tanpa
  NIK diabaikan; ROLE/JABATAN dinormalisasi ("Asst Manager" → "ASST. MANAGER").
- `MENUS`: daftar menu dan sub menu (id, label, ikon) sesuai FR-010.
- `ACCESS`: `{menuId: {roles:[…], jabatan:[…]}}`; `'*'` = semua.
- `can(user, menuId): boolean` — ADMIN selalu true; WAREHOUSEMAN hanya `demand`.
- `visibleMenus(user): MenuId[]`.
- `dashDepts(user): string[]` — urutan dropdown, departemen milik pengguna di depan; LP/MHE
  hanya departemennya bila tidak punya akses penuh Dashboard.
- `homeLinks(user)` — kartu Home mana yang boleh membuka menu.

## `www/kpi-core.js` → `IMMKpi`
Setiap fungsi menerima baris sumber yang sudah diurai dan filter, lalu mengembalikan objek angka
atau `{missing:true, reason}` untuk ⛔.
- `akurasi(wtwHci, wtwAhi, bu)` → `{pct, date, perBu}`
- `occupancy(occHci, occAhi, occFbi, bu)` → `{pct, used, cap, inCbm, outCbm, date, trend[]}`
- `damage(barus, bu)` → `{sku, qty, value:null, date}`
- `slaOutbound(ldHci, ldAhi, bu, today)` → `{cust, store, std, date}`
- `sloc(rows1007, bu)` → `{'1007-':{sku,qty,value}, …}`
- `storing(caseId, trans, demand, today)`, `outbound(...)`, `planner(...)`, `inventory(...)`,
  `lp(sources, period)`, `mhe(workOrders, period)`
- `lppb(rows, {bu, period})` → `{docs, items, qty, byOrigin, byKat, byStatus, topDamageDept}`
- `lcAging(backup, today)` → `{rows:[{lc, ata, ag, bucket}], buckets}`
- `reportStatus(checks, day)` → `{pct, filled:[], missing:[], idle:[]}`

## `www/wo-core.js` → `IMMWo`
- `fmtNo(prefix, day, n)` → `WO-20261010-0004`.
- `ALAT[9]`, `PEKERJAAN[12]`, `LOKASI[13]`, `CHECKLIST[8]`, `KONDISI[9]`.
- `WO_NEXT = {menunggu:['disetujui','ditolak'], disetujui:['pending','selesai'],
  pending:['disetujui','selesai'], selesai:[], ditolak:[]}`.
- `canMove(user, wo, to)` — aturan jabatan/role/foto; mengembalikan `{ok, why}`.
- `validateWo(form)`, `validateObsEntry(form)`, `validateSchedule(form)` → `{ok, errors:{field:msg}}`.
- `reminders(wos, now)` → menunggu, lewat waktu mulai, pending.
