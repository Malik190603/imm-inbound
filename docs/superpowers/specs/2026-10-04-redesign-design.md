# IMM v1.4.0 — Redesign isi aplikasi

Tanggal: 4 Oktober 2026 · Status: menunggu persetujuan rencana

## Tujuan

Orang yang membuka IMM langsung paham keadaan hari itu dan terkesan dengan tampilannya. Berlaku untuk dua kelompok sekaligus: atasan yang melihat sekilas dan tim yang bekerja harian. Gaya yang sekarang dinaikkan, bukan diganti. Semua halaman dirilis sekaligus.

## Yang tidak berubah

- Data, sumber data, dan cara hitung.
- Menu bawah (Beranda, Inbound, Role, Monitoring, Pengaturan), kunci Inbound, wajib update.
- Identitas: kartu putih di atas abu hangat, aksen gelap dan kuning, huruf Plus Jakarta Sans dan JetBrains Mono, warna Storing/Outbound/Customer dan warna BU.
- Bagian native (tetap update di dalam aplikasi).

## Prinsip: jawaban dulu, rincian kemudian

Layar pertama tiap halaman menjawab satu pertanyaan dengan kalimat biasa dan satu angka besar. Rincian ada di bawahnya.

## Komponen bersama

1. **Kartu jawaban** (kartu gelap di puncak tiap halaman): satu kalimat ringkas yang dihasilkan dari data, satu angka besar bersatuan, dua sampai tiga angka pendukung, dan satu baris pembanding ("naik 12% dari rata-rata 7 hari"). Warna sorot mengikuti halaman: Beranda kuning, Storing hijau, Outbound oranye, Monitoring biru, Inbound kuning.
2. **Strip minggu** (di kartu jawaban Beranda, Storing, Outbound): 7 hari dari kemarin sampai 5 hari ke depan, tiap hari satu batang CBM. Hari ini ditandai. Ketuk satu hari untuk pindah ke tanggal itu. Kalau filter sedang berupa rentang, tidak ada hari yang terpilih.
3. **Perlu perhatian**: tepat di bawah kartu jawaban, paling banyak 3 butir yang bisa diketuk (jumlah + keterangan, kuning atau merah). Kalau tidak ada: satu baris tenang "Tidak ada yang perlu ditindak".
4. **Baris kosong diringkas**: baris bernilai nol tidak ditampilkan satu per satu, diganti satu baris, misalnya "4 BU lain belum ada kiriman".
5. **Judul bagian yang menjelaskan**: judul, satu baris penjelasan apa yang ditampilkan, dan tombol "i" bila ada istilah.
6. **Kamus istilah**: tombol "i" membuka penjelasan singkat istilah di bagian itu (CBM, TEUs, LC, LPN, Dept, BU, Yard, Dooring, Lead time, "9 dari 10", Campur Dept, LPPBDO, TTO). Kamus lengkap juga ada di Pengaturan.
7. **Ringkasan pintar** tetap berupa kartu geser, ditambah penanda "1/4".

## Aturan keterbacaan

- Teks paling kecil 12 px (sekarang ada 10,5–11,5 px).
- Kontras teks minimal 4,5:1 di mode terang dan gelap (abu keterangan yang sekarang hanya sekitar 3:1).
- Tombol, chip, dan pilihan minimal 44 px tingginya; tombol ikon kecil (hapus foto, panah kartu geser) minimal 40 px.
- Animasi 150–250 ms dan hanya untuk perubahan keadaan; "Kurangi animasi" tetap dihormati.

## Per halaman

### Beranda
Sapaan satu baris → kartu jawaban (CBM masuk, pembagian Storing/Outbound/Customer, TEUs, pembanding, strip minggu) → perlu perhatian (LC belum dijadwalkan, nomor kontainer tidak seragam, LC belum ada di MASTER_LC) → ringkasan pintar → **jadwal bongkar sebagai garis waktu per jam** → per BU (baris nol diringkas).

### Role — Storing dan Outbound
Tab tetap. Kartu jawaban (CBM, LC, baris SKU, qty, pembanding, strip minggu) → ringkasan pintar → per dept atau per tujuan → per BU (baris nol diringkas) → daftar LC.

### Monitoring — Kontainer
Kartu jawaban berisi alur posisi (POO → Berlayar → Yard → Dooring → Delivered) dengan kalimat "101 TEUs belum dibongkar, 53 di Yard" → perlu perhatian (Yard belum dijadwalkan, aging lebih dari 3 hari, rumus error) → ringkasan pintar → **daftar kontainer tahap terpilih naik ke sini** → lead time → perkiraan bongkar → dibongkar per hari → jalur aktif per BU.

### Monitoring — LPPBDO
Kartu jawaban (jumlah LPPBDO, item, selisih) → isi yang sekarang dengan judul bagian baru.

### Inbound
Layar kunci dirapikan. Daftar empat menu menjadi **empat kartu dengan angka langsung**: Putaway (LPN hari ini, belum ada foto), TTO/Dokumen (TTO hari ini), Productivity (CBM tim hari ini), MPP detail (jumlah orang). Putaway, TTO, dan Productivity masing-masing mendapat kartu jawaban; isi di bawahnya tetap.

### Pengaturan
Kepala halaman: logo, versi, dan role kamu. Lalu Tampilan, Pengguna, Pembaruan, Data, Kamus istilah, Tentang.

### Lembar detail, pertanyaan role, layar wajib update, intro
Hanya mengikuti aturan keterbacaan dan token baru; alurnya tidak berubah.

## Yang tidak termasuk

- Fitur baru di luar yang tertulis di atas.
- Perubahan menu, sumber data, atau cara hitung.
- Peta, notifikasi, atau grafik jenis baru.

## Pengujian

- Semua tes yang ada (44 tes logika, 179 pemeriksaan tampilan) harus tetap lolos.
- Tes baru: kontras token, strip minggu, baris nol diringkas, kamus istilah, urutan bagian Monitoring, kartu Inbound berangka, dan untuk tiap halaman di lebar 360, 400, dan 1280 px, terang dan gelap: tidak ada geser samping, tidak ada error, ada kartu jawaban, teks minimal 12 px, target sentuh sesuai aturan.
- Pemeriksa desain Impeccable (detector, audit, tinjauan akhir) dijalankan sekali di akhir.
