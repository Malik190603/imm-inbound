# Mini Monitoring DC Tallo Constitution

## Core Principles

### I. Privasi & Rahasia (TIDAK BISA DITAWAR)

- Nama pribadi customer, nomor HP, dan NIK orang lain MUST NOT tampil di aplikasi; kolom
  seperti itu di sheet publik disaring sebelum dirender.
- Aplikasi MUST hanya memuat kunci Supabase **anon**. Kunci AI dan rahasia lain hanya di
  Supabase (Vault / secret fungsi).
- Sandi menu Inbound MUST NOT tertulis terang di repo; hanya hash. `scripts/check.mjs`
  menjadi penjaga otomatisnya.
- Kunci yang ditempel pengguna di chat MUST NOT ditulis ke file.

Alasan: repo publik dan sebagian sumber data adalah spreadsheet yang bisa dibaca siapa pun.

### II. Rilis Terkendali

- Push ke `main` = rilis ke semua HP. Itu MUST terjadi hanya ketika pemilik menulis
  "gaspol". Tanpa itu: commit lokal + push ke branch cadangan.
- Commit teratas saat rilis MUST merangkum perubahan untuk pengguna dan developer.

Alasan: setiap rilis memaksa pembaruan di semua HP gudang.

### III. Update Kilat Dulu

- Perubahan SHOULD berada di `www/` agar terbit sebagai update kilat. Perubahan native
  (`android/`, plugin Capacitor) MUST disebut jelas karena memaksa instal APK baru.
- Fitur yang butuh native (mis. notifikasi asli) dibuat bertahap: versi dalam-aplikasi dulu.

### IV. Tes Dulu

- Logika murni ditulis bersama tes unit yang gagal dulu (`npm test`), lalu kode.
- `npm test` dan `npm run check` MUST lulus sebelum klaim selesai; tes layar Playwright lokal
  dijalankan untuk perubahan tampilan.
- Data uji MUST tiruan atau disamarkan bila ikut repo.

### V. Terbaca di HP Gudang

- Teks ≥ 12 px, target sentuh ≥ 44 px (ikon 40 px), kontras token ≥ 4,5:1.
- Tanpa geser samping di lebar 360, 400, dan 1280 px; tema terang dan gelap.
- Setiap layar menjawab pertanyaannya di bagian atas (kartu jawaban), angka nol diringkas.
- Semua teks antarmuka dalam bahasa Indonesia.

### VI. Data Mengikuti Sumbernya

- Kolom spreadsheet MUST dicari berdasarkan teks header, bukan huruf kolom.
- Tanggal dan angka dari sheet diurai secara toleran (format campuran, "Rp", "%", koma
  ribuan); sel yang gagal diurai ditampilkan sebagai kosong, bukan nol palsu.
- Data yang diinput lewat aplikasi disimpan di Supabase dan tidak dihapus: perubahan status
  ditandai, bukan dihapus.

## Batasan Teknis

- Aplikasi Android Capacitor 8; isi web statis di `www/` tanpa framework (fungsi JS yang
  menghasilkan string HTML).
- Sumber baca: Google Sheets lewat gviz. Sumber tulis: Supabase project `IMM`
  (ref `rmvttktlzkecvooqvkpp`); project lain di akun yang sama MUST NOT disentuh.
- SQL lewat connector tanpa `drop`/`delete`.

## Alur Kerja

- Fitur besar mengikuti Spec Kit: spec → plan → tasks → implement → converge.
- Spesifikasi di `specs/NNN-nama/`; `spec.md` adalah sumber kebenaran fitur.
- Komunikasi dengan pemilik dalam bahasa Indonesia; langkah dashboard dikerjakan lewat
  connector, bukan disuruh ke pengguna.

## Governance

Konstitusi ini mengalahkan kebiasaan lain di repo kecuali instruksi langsung pemilik.
Perubahan dicatat sebagai amandemen dengan versi semantik (MAJOR: prinsip dihapus/diubah
maknanya; MINOR: prinsip/bagian baru; PATCH: perbaikan kata). Setiap rencana (`plan.md`)
MUST memuat Constitution Check terhadap prinsip I–VI. `CLAUDE.md` tetap menjadi catatan
operasional harian.

**Version**: 1.0.0 | **Ratified**: 2026-10-10 | **Last Amended**: 2026-10-10
