# IMM – Inbound Mini Monitoring DC Tallo

Aplikasi Android untuk tim Inbound DC Tallo Makassar. Datanya dibaca langsung dari spreadsheet **IMM** di Google Sheets. Semua edit tetap dilakukan di spreadsheet, dan aplikasi mengambil data terbaru setiap kali dibuka, saat tombol **Muat ulang** diketuk, atau setelah aplikasi ditinggal lebih dari 5 menit.

## Menu
- **Beranda** (bawaan: Semua BU, hari ini): ringkasan pintar, CBM masuk (storing vs outbound), kontainer dalam TEUs, jadwal bongkar, hal yang perlu dicek, CBM per hari, per BU.
- **Storing** (bawaan: Semua BU, besok): CBM ke gudang stock per dept, per BU, per No LC. Ketuk LC untuk isi SKU dan posisinya.
- **Outbound** (bawaan: Semua BU, besok): CBM ke store dan customer; daftar per tujuan hanya store.
- **Monitoring** (bawaan: Semua BU, 30 hari terakhir)
  - *Kontainer*: posisi kontainer dari sheet RDC (hanya BU NAME Makassar), dalam TEUs: POO → Berlayar → Yard → Dooring → Delivered, aging, ETA, jadwal bongkar, CBM per LC, lead time.
  - *LPPBDO*: ringkasan pintar per kategori, asal kiriman, dept, artikel berulang, rasio per 100 TEUs, daftar dokumen.
- **Pengaturan**: mode terang/malam/otomatis, kurangi animasi, periksa & pasang pembaruan (titik merah di menu bila ada versi baru), status data, muat ulang, hapus data tersimpan.

Setiap menu punya filter BU dan periode sendiri. Tarik layar ke bawah atau ketuk jam di pojok kanan atas untuk memuat ulang data.

Warna: Storing hijau, Store oranye, Customer biru. BU: HCI biru, AHI merah, TGI biru muda, FBI ungu, KWI oranye.

## Cara pasang & update
1. Pertama kali: unduh `IMM-Tallo-vX.apk` dari halaman **Releases**, buka, izinkan "Instal aplikasi tidak dikenal".
2. Update bersifat **wajib**: setiap dibuka, aplikasi mengecek rilis terbaru. Kalau ada versi lebih baru, layar terkunci sampai diperbarui (tanpa internet aplikasi tetap bisa dibuka).
   - Perubahan tampilan/logika saja → **update kilat** (±1 MB), langsung dipakai tanpa instal APK.
   - Perubahan native (plugin, izin, ikon) → APK diunduh di dalam aplikasi lalu dipasang menimpa versi lama. Tidak perlu uninstall.
3. Repo ini harus **publik** supaya aplikasi bisa membaca halaman Releases tanpa login.

## Syarat spreadsheet
- Kedua spreadsheet (IMM dan RDC) harus dibagikan **"Siapa saja yang memiliki link" sebagai Pelihat**. Kalau aksesnya ditutup, aplikasi menampilkan pesan gagal memuat.
- **Jangan ganti nama sheet dan jangan menggeser kolom** yang dibaca aplikasi. Menambah baris atau mengubah isi sel aman.

| Sheet | Kolom yang dibaca |
|---|---|
| LOGIC | A (kode Stock), D (kode Store) |
| MASTER_PLAN | D tgl bongkar, E jam, G no. kontainer, H No LC, I site/BU, M CBM to stock, R CBM to store, W CBM to customer, Z ekspedisi, AA fleet, AB ship from, AC TEUs |
| MASTER_LC | A No LC, E TradingPartner, F KODE SITE, G SITE NAME, P SITE, Q SKU, R DESCR, S Dept, Y SHIPPEDQTY, AA CBM_SHIPPED_QTY (yang dikirim, bukan original) |
| LPPBDO_HCI, LPPBDO_AHI | A UPDATE, B Tgl, C Bulan, D BU, E LPPBDO No., F Site Receiver, H Driver, L Artikel, M Desc, O Qty OD, P Qty Receive, Q Remark, R Status, S Kategori, T Qty LPPBDO, W Dept, AA Tanggal |
| RDC (spreadsheet terpisah, gid 345900811) | dicari lewat **judul kolom** (susunan kolomnya pernah berubah): BU (asal), SI (= No LC), Type Armada, Delivery Date, Checkout, No Container, Nama Kapal, POO, ETD, ATD, ETA, ATA…, REQUEST DOORING…, ACTUAL DOORING…, TANGGAL BONGKAR, Position…, Status Shipment, BU (kode, kemunculan kedua), AGING YARD, KATEGORI AGING YARD, BU NAME (difilter Makassar), TEUs, Aging POO…, Aging OTW…, AGING POD…, LEAD TIME… |

| Inbound stock (spreadsheet `1crYUpCJ…`, gid 349104626) | dicari lewat **judul kolom**: Storerkey, Trantype, SKU, Description, Sku Group, Toloc, Toid, Qty, Source type, CM3, Tanggal (WITA), Date, Kategori, Hitung Produktivitas?, Id Operator, Username Operator, CM3 (Final) |
| Inbound transit (gid 2022396471) | dicari lewat **judul kolom**: Owner, CBM Received, Received By, Date, Hitung Transit? |

Untuk dua sheet inbound, kolom boleh digeser asalkan **judulnya tidak diganti**.

## Menu Inbound
- Terkunci kata sandi; setelah benar terbuka 2 jam di HP itu. Di kode hanya ada hash sandinya (`PW_HASH` di `www/inbound-core.js`). Untuk mengganti sandi: hitung `sha256("imm-tallo:" + sandiBaru)` lalu ganti `PW_HASH`.
- **Putaway**: baris stock dengan Trantype `Move`, Source type `NSPRFPA02`, Toloc berawalan `FLR`, dikelompokkan per LPN (Toid). Awalan `ID` = good, `RC` = damage (kartu merah). Peringatan kalau satu LPN berisi lebih dari satu Sku Group.
- **Productivity**: hanya 5 operator (129057, 148453, 187606, 188400, 192831). Stock: baris `Hitung Produktivitas?` = Ya; Receive = `CM3` ÷ 1.000.000, Putaway = `CM3 (Final)` ÷ 1.000.000. Transit: baris `Hitung Transit?` = Ya; `CBM Received` dihitung sama untuk Receive dan Putaway.
- **TTO/Dokumen** dan **foto putaway** disimpan di Supabase (maksimal 4 foto per LPN/TTO, dikecilkan dan diberi cap waktu).

## Supabase (foto dan TTO)
1. Buat project Supabase khusus IMM.
2. SQL Editor → tempel isi `supabase/schema.sql` → Run (membuat tabel `putaway_photos`, `tto`, dan bucket `imm-photos`).
3. Project Settings → API: salin **Project URL** dan **anon public key** ke `SUPA` di `www/store.js`. Jangan pernah memakai kunci `service_role` (pemeriksaan rilis akan menolaknya).
4. Karena anon key ada di aplikasi dan repo ini publik, data TTO dan foto bisa diakses orang yang paham teknis di luar aplikasi.

## Scan TTO dari foto
Di form **Tambah TTO** ada bagian "Scan dari foto". Foto dokumen dikirim ke fungsi server `scan-tto` di Supabase, dibaca AI (Gemini atau Claude), lalu No TTO (dari *Document No*), daftar barang, dan jumlah koli terisi sendiri untuk dicek sebelum disimpan. Kunci AI hanya ada di Supabase, tidak di aplikasi dan tidak di repo ini.

Pemasangan (sekali):
1. **SQL**: Supabase → SQL Editor → tempel ulang seluruh isi `supabase/schema.sql` → Run. Ini menambah tabel `scan_log` serta fungsi `imm_scan_take` dan `imm_scan_refund` (batas scan per hari; scan yang gagal di sisi AI tidak memakan jatah). Aman dijalankan ulang.
2. **Fungsi**: Supabase → Edge Functions → **Deploy a new function** → **Via Editor** → beri nama `scan-tto` (harus persis) → hapus isi contoh, tempel seluruh isi `supabase/functions/scan-tto/index.ts` → **Deploy function**. Biarkan verifikasi JWT menyala.
3. **Kunci**: Supabase → Edge Functions → **Secrets** → isi Key `GEMINI_API_KEY` dan Value kunci dari aistudio.google.com → **Save**. Untuk Claude pakai `ANTHROPIC_API_KEY`. Kalau dua-duanya dipasang, Gemini yang dipakai kecuali `SCAN_PROVIDER` diisi `claude`.
4. Opsional: `SCAN_DAILY_LIMIT` (bawaan 200 scan per hari), `GEMINI_MODEL` (bawaan `gemini-3.5-flash-lite`), `ANTHROPIC_MODEL` (bawaan `claude-haiku-4-5-20251001`).

Batas harian berlaku untuk semua HP bersama-sama dan `SCAN_DAILY_LIMIT=0` mematikan scan. Karena kunci anon ada di aplikasi, orang iseng bisa menghabiskan jatah hari itu; tagihan tetap terlindungi dan form manual tetap jalan.

Sebelum langkah di atas selesai, tombol scan menampilkan "Scan belum diaktifkan di server" dan form tetap bisa diisi manual. Foto dokumen dikirim ke penyedia AI yang kuncinya dipasang. Fungsi memakai `SUPABASE_SERVICE_ROLE_KEY` bawaan Supabase hanya untuk mencatat pemakaian.

## Tes
- `npm test` — logika inti dan penyimpanan (dijalankan juga saat rilis).
- `npm run check` — sintaks, konfigurasi, kunci rahasia, sandi tidak tertulis terang.

## Aturan perhitungan
- Patokan tanggal adalah **tanggal bongkar di MASTER_PLAN**. Baris MASTER_LC hanya dihitung kalau No LC-nya ada di MASTER_PLAN.
- **Storing** = KODE SITE ada di daftar Stock pada sheet LOGIC.
- **Outbound** = KODE SITE ada di daftar Store pada sheet LOGIC (store), ditambah KODE SITE 0 (customer, dikelompokkan per TradingPartner).
- BU dibaca dari huruf depan kode: H/J = HCI, A = AHI, F = FBI, T = TGI, K = KWI.
- LC yang ada di MASTER_LC tapi belum ada di MASTER_PLAN ditampilkan sebagai peringatan "LC belum dijadwalkan".

## Rilis ("gaspol")
Alurnya sama dengan Active Coach:
1. Perubahan di-commit dan di-push ke `main`.
2. GitHub Actions (`.github/workflows/build-apk.yml`) menentukan versi, memeriksa kode, membangun APK rilis, memastikan tanda tangannya sama dengan versi sebelumnya, lalu menerbitkannya di **Releases**.
3. **Versi:** `package.json` berisi versi dasar (mis. 1.0.0). Perbaikan kecil otomatis naik PATCH (1.0.3 → 1.0.4 …). Untuk fitur besar, naikkan MINOR di `package.json` (mis. 1.1.0).
4. **Catatan rilis** diambil dari pesan commit. Pisahkan dengan baris `Untuk pengguna:` dan `Untuk developer:`.
5. Pesan commit berisi `[beta]` → rilis beta (prerelease), tidak menjadi versi terbaru.
6. Rilis dibatalkan bila pemeriksaan kode gagal, APK ditandatangani kunci lain, atau APK masih bisa di-debug.

Kode tampilan dan logika ada di `www/index.html`. Lapisan desain v1.4 ada di `www/ui.css` (gaya), `www/ui.js` (komponen: kartu jawaban, strip minggu, perlu perhatian, kamus istilah) dan `www/ui-core.js` (fungsi murni yang diuji). Aturan desainnya dicatat di `DESIGN.md`; konteks produk di `PRODUCT.md`. Huruf disimpan di `www/fonts/` (tidak lagi dimuat dari internet). Proyek Android dibuat dengan Capacitor. Kunci tanda tangan ada di `android/app/imm-inbound.keystore`; jangan dihapus atau diganti, karena tanpa kunci yang sama APK baru tidak bisa dipasang menimpa versi lama. Karena kunci ini ada di repo, **repo harus tetap Private**.
