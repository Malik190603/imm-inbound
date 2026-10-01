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
2. Selanjutnya update dari dalam aplikasi (sama seperti Active Coach): titik merah muncul di menu **Pengaturan**, lalu ketuk **Perbarui sekarang**.
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
| MASTER_LC | A No LC, E TradingPartner, F KODE SITE, G SITE NAME, P SITE, Q SKU, R DESCR, S Dept, T ORIGINALQTY, Z CBM_ORIGINAL_QTY |
| LPPBDO_HCI, LPPBDO_AHI | A UPDATE, B Tgl, C Bulan, D BU, E LPPBDO No., F Site Receiver, H Driver, L Artikel, M Desc, O Qty OD, P Qty Receive, Q Remark, R Status, S Kategori, T Qty LPPBDO, W Dept, AA Tanggal |
| RDC (spreadsheet terpisah, gid 345900811) | A asal, B SI (= No LC), D type armada, G delivery date, H checkout, J no container, L nama kapal, M POO, N ETD, O ATD, P ETA, Q ATA, S request dooring, T actual dooring, U tanggal bongkar, V position, W status shipment, Y BU, Z aging yard, AA kategori aging, AJ BU NAME (difilter Makassar), AL TEUs, AM–AP aging POO/OTW/POD & lead time |

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

Kode tampilan dan logika ada di `www/index.html`. Proyek Android dibuat dengan Capacitor. Kunci tanda tangan ada di `android/app/imm-inbound.keystore`; jangan dihapus atau diganti, karena tanpa kunci yang sama APK baru tidak bisa dipasang menimpa versi lama. Karena kunci ini ada di repo, **repo harus tetap Private**.
