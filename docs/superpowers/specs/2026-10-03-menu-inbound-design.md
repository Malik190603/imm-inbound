# IMM v1.3.0 — Menu Inbound, menu Role, wajib update

Tanggal: 3 Oktober 2026 · Status: menunggu persetujuan

## Tujuan

Tim inbound DC Tallo bisa memantau putaway, mendokumentasikan barang dan serah terima TTO dengan foto, dan melihat produktivitas operator dari satu aplikasi. Semua pengguna selalu memakai versi terbaru.

Dirilis sekaligus sebagai satu APK baru (v1.3.0) yang dipasang ulang.

## 1. Kerangka aplikasi

### Menu bawah
Beranda · Inbound · Role · Monitoring · Pengaturan.

- **Role** = gabungan Storing dan Outbound. Dua tab di atas halaman (Storing | Outbound); isi tiap tab sama persis dengan menu yang sekarang, termasuk filter default (semua BU + besok).
- **Inbound** = menu baru, terkunci sandi.

### Kunci menu Inbound
- Mengetuk menu Inbound memunculkan kolom sandi. Sandi benar membuka akses selama 2 jam di HP itu (waktu buka disimpan di HP), lalu diminta lagi.
- Sandi: `<sandi>`. Di kode hanya disimpan hash SHA-256 bergaram, bukan teks aslinya, karena repo publik.
- Ini kunci ringan (pencegah orang iseng), bukan pengaman kuat.

### Halaman Inbound
Daftar vertikal 4 baris: Putaway, TTO/Dokumen, Productivity, MPP detail. Ketuk untuk masuk, ada tombol kembali (tombol back HP juga kembali ke daftar). Filter default: hari ini + semua BU.

### MPP detail
Kartu profil, dikelompokkan per jabatan:

| Nama | Jabatan | Business unit |
|---|---|---|
| Sumarni | Assistant Manager | PT Home Center Indonesia (HCI) |
| Aan Kurniawan | Inbound Supervisor | PT Home Center Indonesia (HCI) |
| Ramadhan | Inbound Coordinator Staff | PT Home Center Indonesia (HCI) |
| M. Malik | Inbound Staff | PT Aspirasi Hidup Indonesia (AHI) |
| Armin Rahman | Warehouseman | PT Home Center Indonesia (HCI) |
| Akmal | Warehouseman | PT Home Center Indonesia (HCI) |
| Muh Putra Abidzar | Warehouseman | PT Home Center Indonesia (HCI) |
| Muh Aditya Putra | Warehouseman | PT Home Center Indonesia (HCI) |
| M Fikri Firmansyah | Warehouseman | PT Aspirasi Hidup Indonesia (AHI) |

### Wajib update
- Setiap dibuka (dan saat kembali dari latar belakang), aplikasi mengecek rilis terbaru di GitHub. Kalau ada versi lebih baru: layar terkunci penuh dengan tombol "Perbarui" dan "Keluar". Tidak bisa ditutup.
- Kalau build aslinya sama: update kilat di dalam aplikasi. Kalau beda: unduh APK lalu pasang.
- Tampilan "Yang baru di versi ini" dihapus seluruhnya.
- Tanpa internet: aplikasi tetap terbuka dengan data terakhir; pengecekan diulang saat internet tersambung.
- Versi lama (v1.2.6 ke bawah, build 1.2.0): diberi satu update kilat terakhir (v1.2.7) yang isinya hanya layar "Versi ini sudah tidak dipakai, pasang APK baru" dengan tombol unduh. Keterbatasan: HP yang tidak pernah menekan "Perbarui" tetap bisa memakai versi lama.
- Build asli baru: 1.3.0, sehingga rilis v1.3.0+ tidak dianggap update kilat oleh versi lama.

### Pengaturan
- Dihapus: "Muat ulang data", "Hapus data tersimpan", "Aturan perhitungan", "Yang baru di versi ini".
- Bagian Data: hanya daftar sumber data (spreadsheet IMM, monitoring kontainer, spreadsheet inbound stock + transit) dengan status OK/Gagal.
- Bagian Pengguna: hanya jumlah per role + baris "Role kamu". Angka unduhan GitHub dan grafik per versi dihapus.

## 2. Fitur data

Sumber baru: spreadsheet `1crYUpCJSYHrfBbZ99aUee3v4hRJrxWw4XRIryl9rong`
- Stock: gid `349104626`
- Transit: gid `2022396471`

Dibaca lewat gviz CSV seperti sheet kontainer, dimuat saat menu Inbound dibuka pertama kali (bukan saat aplikasi dibuka).

### Putaway
- Baris yang dipakai: `Trantype` = Move, `Source type` = NSPRFPA02, `Toloc` berawalan FLR (ketiganya tanpa membedakan huruf besar/kecil).
- Filter tanggal: kolom `Date`. Filter BU: kolom `Storerkey`.
- Dikelompokkan per LPN (`Toid`). Kartu: nomor LPN, lokasi tujuan (`Toloc`), jumlah SKU, qty, CBM (CM3 ÷ 1.000.000), jam, operator.
- **Awalan ID = barang good (kartu biasa). Awalan RC = barang damage (kartu merah, label "Damage").**
- Peringatan kuning "Campur Dept" kalau satu LPN berisi lebih dari satu `Sku Group`, dengan daftar Dept-nya.
- Ketuk kartu → detail: daftar SKU (kode, deskripsi, Dept, qty) dan foto.
- Kolom cari LPN/lokasi. Ringkasan di atas: jumlah LPN, jumlah damage, jumlah campur Dept, jumlah yang belum ada fotonya.

### Foto (Putaway dan TTO)
- Sumber: kamera atau galeri (pemilih file bawaan Android).
- Maksimal 4 foto per LPN dan 4 foto per TTO.
- Sebelum diunggah, foto dikecilkan (sisi terpanjang ±1280 px, JPEG ±200 KB) dan **diberi cap waktu** di pojok bawah: tanggal + jam WITA saat foto ditambahkan, serta nomor LPN + lokasi (Putaway) atau No TTO (TTO).
- Bisa diperbesar dan dihapus (dengan konfirmasi).
- Kartu LPN yang sudah ada fotonya diberi tanda kamera + jumlah foto.

### TTO/Dokumen
- Form: Tanggal serah terima (default hari ini), No TTO, Nama barang, Jumlah koli (angka), PIC yang menyerahkan (dropdown: Aan, Ramadhan, Malik, Armin, Akmal, Abi, Adit, Fikri), Penerima, Dokumentasi (foto, maks 4).
- Semua kolom wajib kecuali foto (minimal 0).
- Daftar TTO mengikuti filter tanggal (tanggal serah terima), bisa dicari (No TTO / nama barang / penerima). Ketuk → detail + foto.
- Hapus dengan konfirmasi. Koreksi = hapus lalu input ulang.
- TTO tidak punya BU, jadi filter BU tidak berpengaruh di halaman ini.

### Productivity
Operator yang dihitung (awalan ID):

| ID | Nama |
|---|---|
| 129057 | Armin Rahman |
| 148453 | Akmal |
| 187606 | Muh Putra Abidzar |
| 188400 | Muh Aditya Putra |
| 192831 | M Fikri Firmansyah |

- **Stock**: hanya baris `Hitung Produktivitas?` = Ya dan `Id Operator` termasuk daftar.
  - Receive: `Kategori` = Receiving → CBM = `CM3` ÷ 1.000.000.
  - Putaway: `Kategori` = Putaway → CBM = `CM3 (Final)` ÷ 1.000.000.
  - Tanggal: `Date`. BU: `Storerkey`.
- **Transit**: hanya baris `Hitung Transit?` = Ya dan `Received By` berawalan ID di daftar.
  - CBM = `CBM Received`, dihitung sama besar untuk Receive dan Putaway, orang yang sama.
  - Tanggal: `Date`. BU: `Owner`.
- Tampilan: total tim (Receive, Putaway), kartu per operator (CBM Receive, CBM Putaway, pembagian stock/transit), peringkat.
- Ringkasan pintar: tertinggi, porsi tiap orang terhadap tim, perbandingan dengan periode sebelumnya, grafik CBM per hari.
- Tidak ada hitungan per jam (keputusan pengguna).

### Supabase (project baru khusus IMM)
- Bucket `imm-photos` (publik untuk dibaca).
- Tabel `putaway_photos`: `id`, `lpn`, `toloc`, `path`, `created_at`, `device`.
- Tabel `tto`: `id`, `tgl`, `no_tto`, `barang`, `koli`, `pic`, `penerima`, `photos` (daftar path), `created_at`, `device`.
- Akses lewat REST dengan anon key; RLS mengizinkan baca, tambah, hapus untuk anon.
- Risiko yang diterima: karena anon key ada di aplikasi dan repo publik, orang yang paham teknis bisa membaca/menulis data ini di luar aplikasi.
- Yang perlu dari pengguna: Project URL + anon public key, dan menjalankan satu skrip SQL yang disediakan.

## Yang tidak termasuk
- Login per orang. Sandi Inbound sama untuk semua.
- Edit entri TTO (hanya hapus + input ulang).
- Produktivitas per jam, jumlah LPN/qty per operator.
- Menutup paksa versi lama yang tidak pernah update.

## Pengujian
- Otomatis (Playwright, data tiruan): menu dan tab Role, kunci sandi + kedaluwarsa 2 jam, layar wajib update, filter Putaway (Move/NSPRFPA02/FLR), warna RC vs ID, peringatan campur Dept, hitungan Productivity stock + transit terhadap angka yang dihitung manual, form TTO, batas 4 foto, cap waktu pada foto, tampilan terang/gelap tanpa geser samping.
- Manual di HP (oleh pengguna): kamera, unggah ke Supabase asli, pasang APK, layar penutup di versi lama.
