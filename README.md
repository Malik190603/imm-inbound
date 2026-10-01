# IMM Inbound

Aplikasi Android untuk tim Inbound DC Tallo Makassar. Datanya dibaca langsung dari spreadsheet **IMM** di Google Sheets. Semua edit tetap dilakukan di spreadsheet, dan aplikasi mengambil data terbaru setiap kali dibuka, saat tombol **Muat ulang** diketuk, atau setelah aplikasi ditinggal lebih dari 5 menit.

## Halaman
- **Dashboard**: ringkasan otomatis, kontainer dan CBM, jadwal bongkar, rincian per BU, kinerja ekspedisi, dan daftar data yang perlu dicek.
- **to Storing**: CBM ke gudang stock per dept, per BU, dan per No LC. Ketuk sebuah LC untuk melihat isi SKU-nya.
- **to Outbound**: CBM ke store dan customer per tujuan.
- **LPPBDO**: ringkasan selisih barang per kategori, ekspedisi, asal kiriman, dept, artikel berulang, dan daftar dokumen.

Filter BU dan periode di bagian atas berlaku untuk semua halaman.

## Cara pasang di HP
1. Buka halaman **Releases** repo ini dari HP, lalu unduh file `IMM-Inbound-v1.0.x.apk` yang terbaru.
2. Buka file tersebut. Kalau Android meminta izin "Instal aplikasi tidak dikenal", izinkan untuk browser atau aplikasi File yang dipakai.
3. Untuk update, cukup instal APK versi baru di atas versi lama. Tidak perlu uninstall.

## Syarat spreadsheet
- Spreadsheet harus dibagikan **"Siapa saja yang memiliki link" sebagai Pelihat**. Kalau aksesnya ditutup, aplikasi menampilkan pesan gagal memuat.
- **Jangan ganti nama sheet dan jangan menggeser kolom** yang dibaca aplikasi. Menambah baris atau mengubah isi sel aman.

| Sheet | Kolom yang dibaca |
|---|---|
| LOGIC | A (kode Stock), D (kode Store) |
| MASTER_PLAN | D tgl bongkar, E jam, G no. kontainer, H No LC, I site/BU, M CBM to stock, R CBM to store, W CBM to customer, Z ekspedisi, AA fleet, AB ship from, AC TEUs |
| MASTER_LC | A No LC, E TradingPartner, F KODE SITE, G SITE NAME, P SITE, Q SKU, R DESCR, S Dept, T ORIGINALQTY, Z CBM_ORIGINAL_QTY |
| LPPBDO_HCI, LPPBDO_AHI | A UPDATE, B Tgl, C Bulan, D BU, E LPPBDO No., F Site Receiver, H Driver, L Artikel, M Desc, O Qty OD, P Qty Receive, Q Remark, R Status, S Kategori, T Qty LPPBDO, W Dept, AA Tanggal |
| VENDOR | B tgl bongkar, G site, H TEUs, I ekspedisi, J status, K–P penilaian YA/TIDAK |

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
