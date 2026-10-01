# IMM – Inbound Mini Monitoring DC Tallo

Aplikasi Android untuk tim Inbound DC Tallo Makassar. Datanya dibaca langsung dari spreadsheet **IMM** di Google Sheets. Semua edit tetap dilakukan di spreadsheet, dan aplikasi mengambil data terbaru setiap kali dibuka, saat tombol **Muat ulang** diketuk, atau setelah aplikasi ditinggal lebih dari 5 menit.

## Halaman
- **Beranda**: ringkasan pintar, CBM masuk (storing vs outbound), jadwal bongkar per hari, hal yang perlu dicek, CBM per hari, per BU, dan ketepatan ekspedisi.
- **Storing**: CBM ke gudang stock per dept, per BU, dan per No LC. Ketuk LC untuk melihat isi SKU dan posisinya.
- **Outbound**: CBM ke store dan customer per tujuan.
- **Monitoring**
  - *Kontainer*: posisi kontainer dari sheet **RDC Tallo** (POO → Berlayar → Yard → Dooring → Delivered), aging, ETA, jadwal bongkar dari MASTER_PLAN, CBM dari MASTER_LC, lead time, dan SLA dokumen. Kolom vendor tidak dipakai.
  - *LPPBDO*: ringkasan pintar per kategori, asal kiriman, dept, artikel berulang, rasio per 100 kontainer, dan daftar dokumen.

Filter BU dan periode di bagian atas berlaku untuk semua menu. Tarik layar ke bawah atau ketuk jam di pojok kanan atas untuk memuat ulang data.

## Cara pasang di HP
1. Buka halaman **Releases** repo ini dari HP, lalu unduh file `IMM-Tallo-v1.x.x.apk` yang terbaru.
2. Buka file tersebut. Kalau Android meminta izin "Instal aplikasi tidak dikenal", izinkan untuk browser atau aplikasi File yang dipakai.
3. Untuk update, cukup instal APK versi baru di atas versi lama. Tidak perlu uninstall.

## Syarat spreadsheet
- Kedua spreadsheet (IMM dan RDC Tallo) harus dibagikan **"Siapa saja yang memiliki link" sebagai Pelihat**. Kalau aksesnya ditutup, aplikasi menampilkan pesan gagal memuat.
- **Jangan ganti nama sheet dan jangan menggeser kolom** yang dibaca aplikasi. Menambah baris atau mengubah isi sel aman.

| Sheet | Kolom yang dibaca |
|---|---|
| LOGIC | A (kode Stock), D (kode Store) |
| MASTER_PLAN | D tgl bongkar, E jam, G no. kontainer, H No LC, I site/BU, M CBM to stock, R CBM to store, W CBM to customer, Z ekspedisi, AA fleet, AB ship from, AC TEUs |
| MASTER_LC | A No LC, E TradingPartner, F KODE SITE, G SITE NAME, P SITE, Q SKU, R DESCR, S Dept, T ORIGINALQTY, Z CBM_ORIGINAL_QTY |
| LPPBDO_HCI, LPPBDO_AHI | A UPDATE, B Tgl, C Bulan, D BU, E LPPBDO No., F Site Receiver, H Driver, L Artikel, M Desc, O Qty OD, P Qty Receive, Q Remark, R Status, S Kategori, T Qty LPPBDO, W Dept, AA Tanggal |
| VENDOR | B tgl bongkar, G site, H TEUs, I ekspedisi, J status, K–P penilaian YA/TIDAK |
| RDC Tallo (spreadsheet terpisah) | A origin, B SI (= No LC), D type armada, F delivery date, H moda, I no container, K nama kapal, M ETD, N ATD, O ETA, P ATA, Q dokumen diterima, R request dooring, S actual dooring, T tanggal bongkar, U POSITION, V status shipment, W kode site, X BU, Y aging, Z kategori aging, AF SLA document |

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
