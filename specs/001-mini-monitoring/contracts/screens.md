# Contract: layar dan navigasi

## Alur masuk
Intro ("Mini Monitoring DC Tallo Makassar" + 10 logo) → bila belum ada sesi: layar Masuk (NIK)
→ Home. Bila ada sesi: langsung Home.

## Tab bawah (3)
| Tab | Halaman |
|-----|---------|
| Home | 5 kartu (Akurasi, Value damage, Occupancy, Incoming Container, SLA Outbound) + banner pemberitahuan Manager |
| List | kisi menu yang boleh dibuka (`IMMAuth.visibleMenus`), badge jumlah WO perlu tindakan |
| Settings | Akun, Versi APK, Tampilan, Kurangi Animasi, Live Akses, Pembaruan, Database Spreadsheet, Tentang, Keluar |

## Bilah atas
Judul halaman + dropdown BU (logo) + pilihan periode (bila halaman memakai periode).

## Rute List (hash `#/list/<menu>/<sub>`)
| menu | sub | isi |
|------|-----|-----|
| dashboard | inbound, storing, outbound, inventory, planner, lp, mhe | dropdown departemen; kartu KPI; ⛔ = "Belum tersambung ke data" |
| monitoring | lcdc, container | aging LC di DC; Monitoring Kontainer (5 tahap) |
| occupancy | capacity, layout | occupancy & kapasitas; denah lorong × bay × level berwarna |
| sloc | value, qty | 1001 damage, 1007-, 1007+, 1009-, 1009+ |
| schedule | project, official | daftar + Tambah/Ubah (berhak) |
| demand | inbound, storing, inventory, planner, outbound | demand per hari |
| lppb | inbound, outbound | bawaan Bulan ini; outbound = "Belum tersambung" |
| report | daily, status | 9 laporan (buka di browser); persen terisi hari ini |
| tto | list | daftar + form (Yang menyerahkan, Input by NIK) + scan foto |
| infra | workorder, reminder | daftar WO + Tambah; detail dengan riwayat dan aksi status |
| mpp | kebutuhan | "Menunggu data MPP" |
| lp | inout, observasi | ringkasan & daftar In/Out; daftar OBS + Tambah, check-in, isi, tutup |

Tombol kembali Android: lembar detail → tutup; sub menu → List; List/Settings → Home; Home →
keluar aplikasi.

## Kebutuhan tampilan bersama
- Kartu jawaban di atas tiap halaman (pola `lead()`), angka nol diringkas.
- Setiap angka menyebut tanggal datanya bila bukan hari ini.
- Status muat per kartu: memuat (kerangka), gagal (pesan + Coba lagi), kosong, belum tersambung.
- Batas keterbacaan konstitusi V.
