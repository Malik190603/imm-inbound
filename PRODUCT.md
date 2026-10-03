# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Tim inbound DC Tallo Makassar (Inbound, Storing, Outbound, Inventory, Planner, MHE, Ekspediter): membuka aplikasi di HP Android di lantai gudang untuk melihat apa yang masuk hari ini dan besok, mengecek LPN yang diputaway, mendokumentasikan foto, dan mencatat serah terima.
- Manager dan Assistant Manager: melihat sekilas untuk mengetahui volume, posisi kontainer, dan hal yang perlu perhatian.
- Dua kelompok ini sama pentingnya (dikonfirmasi pemilik aplikasi, 4 Okt 2026).

## Product Purpose

IMM (Inbound Mini Monitoring) menampilkan data inbound DC Tallo yang sumbernya tetap di Google Sheets: jadwal bongkar kontainer, CBM ke storing/store/customer, posisi kontainer dan lead time, LPPBDO, putaway per LPN, produktivitas operator, dan dokumentasi (foto putaway, TTO). Berhasil kalau orang membuka aplikasi dan langsung paham keadaan hari itu tanpa membuka spreadsheet.

## Positioning

Aplikasi khusus satu DC yang membaca langsung spreadsheet kerja tim itu sendiri; tidak ada input ganda dan tidak ada server selain penyimpanan foto dan TTO.

## Operating Context

- Dipakai di HP Android (aplikasi Capacitor), sebagian besar satu tangan, di gudang; juga dibuka di desktop saat rapat.
- Data: spreadsheet IMM (LOGIC, MASTER_PLAN, MASTER_LC, LPPBDO), sheet kontainer RDC, sheet inbound stock dan transit, Supabase untuk foto dan TTO.
- Istilah kerja yang dipakai apa adanya: CBM, TEUs, LC, LPN, Dept, BU (HCI, AHI, FBI, TGI, KWI), Storing, Outbound, Yard, Dooring, LPPBDO, TTO.

## Capabilities and Constraints

- Menu: Beranda, Inbound (terkunci sandi 2 jam), Role (Storing | Outbound), Monitoring (Kontainer | LPPBDO), Pengaturan.
- Bahasa antarmuka: Indonesia. Nama pribadi customer tidak pernah ditampilkan.
- Kontainer dihitung dalam TEUs. CBM dan qty memakai angka shipped.
- Update wajib lewat update di dalam aplikasi; perubahan tampilan tidak boleh mengubah bagian native.
- Tanpa framework: HTML, CSS, dan JavaScript biasa di `www/`.

## Brand Commitments

- Nama: IMM – Inbound Mini Monitoring DC Tallo. Sapaan "Selamat pagi/siang/sore/malam RDC Tallo". Intro memuat "Created by Inbound DC Tallo".
- Warna yang mengikat: Storing hijau, Store/Outbound oranye, Customer biru; BU: HCI biru, AHI merah, TGI biru muda, FBI ungu, KWI oranye.
- Pemilik meminta tampilan yang minimalis, interaktif, dan mudah dipahami; pada 4 Okt 2026 memilih "naikkan gaya yang sekarang", bukan identitas baru.

## Evidence on Hand

- Data nyata dari spreadsheet di atas; data contoh sintetis di `tests/fixtures/` untuk pratinjau dan tes.
- Tidak ada testimoni, logo perusahaan, atau angka kinerja selain yang dihitung dari sheet. Jangan dikarang.

## Product Principles

1. Jawaban dulu, rincian kemudian: tiap halaman menjawab satu pertanyaan di layar pertama.
2. Angka selalu punya satuan dan konteks (dibanding apa, untuk periode mana).
3. Yang perlu ditindak ditampilkan di atas, yang kosong tidak memakan tempat.
4. Istilah gudang dipakai apa adanya, dengan penjelasan satu ketukan bagi yang belum tahu.
5. Sumber kebenaran tetap spreadsheet; aplikasi tidak pernah menampilkan angka yang tidak bisa ditelusuri ke sheet.

## Accessibility & Inclusion

- Dibaca di HP di lingkungan gudang: teks minimal 12 px, kontras teks minimal 4,5:1, target sentuh minimal 44 px.
- Mode terang dan gelap, dan pilihan "Kurangi animasi".
