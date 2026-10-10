# Implementation Plan: Mini Monitoring DC Tallo Makassar

**Branch**: `feat/mini-monitoring` | **Date**: 2026-10-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-mini-monitoring/spec.md`

## Summary

IMM dibangun ulang menjadi **Mini Monitoring**: login NIK dari `Master User APK`, hak akses
Role × Jabatan, navigasi Home / List / Settings, filter BU dropdown berlogo, 12 menu List
(dashboard 7 departemen dan menu operasional), serta tiga alur input baru di Supabase (Work
Order dengan persetujuan Manager, Observasi LP, Project & Schedule). Data monitoring tetap dibaca
dari Google Sheets lewat gviz, kini melalui registri sumber yang memvalidasi header, pengurai
toleran, dan cache per sumber. KPI tanpa sumber tampil "Belum tersambung" (lihat
[research.md](research.md) R6).

## Technical Context

**Language/Version**: JavaScript ES2020 (WebView Android), tanpa framework; SQL Postgres 15
(Supabase); Node 20 untuk tes.

**Primary Dependencies**: Capacitor 8 (+ plugin yang sudah ada: CapacitorHttp, SystemBars,
CapacitorUpdater, App, Filesystem, FileTransfer, file-opener; kamera lewat `<input capture>`);
Supabase REST; Google Sheets gviz.
Tidak ada dependensi baru.

**Storage**: Supabase project IMM (tabel baru di [data-model.md](data-model.md)); `localStorage`
untuk sesi, master user ringkas, dan cache sumber.

**Testing**: `node --test` (`tests/*.test.mjs`), `scripts/check.mjs`, Playwright lokal
(`test/`, tidak ikut repo), Postgres lokal untuk fungsi SQL.

**Target Platform**: Android 8+ (APK Capacitor), uji layar di 360/400/1280 px.

**Project Type**: aplikasi mobile (web statis di dalam Capacitor) + backend Supabase.

**Performance Goals**: Home tampil ≤ 5 detik setelah masuk dengan 4G; menu List dari cache
langsung tampil, segar ≤ 10 detik; maksimal 4 permintaan gviz bersamaan.

**Constraints**: hanya kunci anon; tanpa perintah hapus di SQL lewat connector; teks ≥ 12 px,
target ≥ 44 px; data pribadi dibuang sebelum disimpan atau dirender.

**Scale/Scope**: ±88 pengguna, 29 spreadsheet, 12 menu × ±30 sub layar, ratusan WO/OBS per
bulan.

## Constitution Check

| Prinsip | Status | Catatan |
|---------|--------|---------|
| I Privasi & Rahasia | ✅ | `private` per sumber + `stripPrivate`; nama hanya untuk diri sendiri; uji penanda privat di e2e; tidak ada kunci baru |
| II Rilis Terkendali | ✅ | kerja di `feat/mini-monitoring`; rilis 2.0.0 hanya saat "gaspol" |
| III Update Kilat Dulu | ⚠️ dibenarkan | ganti nama aplikasi = perubahan native (APK baru). Dicatat di Complexity Tracking |
| IV Tes Dulu | ✅ | 4 modul murni baru dengan tes unit lebih dulu; e2e lokal per alur |
| V Terbaca di HP | ✅ | memakai komponen v1.4 (`lead`, `secHead`, `hbars`, `attention`) dan tes desain yang ada |
| VI Data Mengikuti Sumber | ✅ | `col()` berdasarkan header, `hasHeaders` untuk validasi tab, tanpa hapus di Supabase |

Re-check setelah desain: tetap lulus; satu pengecualian (III) dibenarkan.

## Project Structure

### Documentation (this feature)

```text
specs/001-mini-monitoring/
├── spec.md
├── plan.md
├── research.md          # keputusan + peta KPI → sumber
├── research/            # lampiran riset per departemen
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── core-modules.md  # API modul murni
│   ├── supabase.md      # RPC, tabel, storage
│   └── screens.md       # navigasi dan rute layar
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
www/
├── index.html          # kerangka, CSS dasar, shell 3 tab, Home, Settings, intro, login (diubah)
├── brand/*.png         # 10 logo brand (baru)
├── parse-core.js       # pengurai toleran (baru, murni)
├── auth-core.js        # master user, MENUS, ACCESS, can() (baru, murni)
├── kpi-core.js         # perhitungan KPI (baru, murni)
├── wo-core.js          # nomor, pilihan, transisi, validasi (baru, murni)
├── sources.js          # registri 29 sumber + loader gviz bervalidasi + cache (baru)
├── list.js             # List hub + rute menu (baru)
├── dash.js             # dashboard 7 departemen (baru)
├── menus.js            # Monitoring, Occupancy/Layout, Sloc, Demand, LPPB, Report, MPP (baru)
├── forms.js            # Work Order, Observasi, Project & Schedule (baru)
├── lp.js               # LP In/Out (baru)
├── inbound*.js, store.js, ui*.js   # yang ada; store.js ditambah RPC baru, inbound.js TTO baru
supabase/schema.sql     # tabel & fungsi baru (ditambahkan, tanpa drop)
android/…/strings.xml, capacitor.config.json   # nama "Mini Monitoring"
package.json            # versi dasar 2.0.0
tests/parse.test.mjs, auth.test.mjs, kpi.test.mjs, wo.test.mjs   # baru
test/ (lokal)           # e2e-mm-*.js + mock baru
```

**Structure Decision**: tetap satu aplikasi web statis tanpa build step. File baru dipisah per
tanggung jawab agar `index.html` (sudah 1.477 baris) tidak membengkak; modul murni dipisah dari
render agar bisa diuji di Node.

## Urutan kerja (fase)

1. **Fondasi murni** (TDD): parse-core, auth-core, wo-core, kpi-core.
2. **Data**: sources.js (registri, validasi header, cache, konkurensi), migrasi Supabase + fungsi,
   store.js RPC baru.
3. **Shell**: intro + logo, login NIK, 3 tab, dropdown BU berlogo, filter bawaan, Settings baru,
   hapus bagian Pengguna, back button.
4. **Home** 5 kartu.
5. **List**: hub + akses; pindahkan fitur lama (Beranda → Dashboard Inbound, Role → Demand,
   Monitoring → Monitoring/LPPB, TTO → TTO & Dokumen).
6. **Dashboard** 6 departemen baru + MHE.
7. **Menu lain**: Occupancy/Layout, Sloc, Demand, Report (+Status), MPP, LP In/Out.
8. **Form**: Work Order + Reminder + pemberitahuan, Observasi, Project & Schedule, TTO baru.
9. **Native & versi**: nama aplikasi, versi 2.0.0, catatan rilis.
10. **Verifikasi**: unit, check, e2e semua, desain, privasi, uji server lewat connector.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Perubahan native (nama aplikasi) → APK baru | Pemilik meminta nama "Mini Monitoring" tampil di HP | Mengganti nama hanya di dalam aplikasi membuat ikon di HP tetap "IMM" |
| Login tanpa PIN, aturan persetujuan dicek di aplikasi | Pilihan pemilik (cepat dipakai) | NIK + PIN di Supabase ditolak pemilik untuk rilis ini; bisa ditambah nanti |
