# Riset: Status Laporan Harian, LPPBDO, Aging LC — DC Tallo

Tanggal riset: Sabtu 10 Okt 2026 (WITA). Hanya WebFetch ke gviz. Tanpa nama orang/HP/NIK.
Hari acuan: **Jum 9 Okt 2026** dan **Sab 10 Okt 2026** (hari berjalan).

## Catatan teknis gviz / WebFetch
- `tqx=out:csv` + `sheet=<nama tab>` paling andal. `tq` (select/where/group by) jalan, termasuk `where X >= date '2026-10-05'` dan agregasi `count/sum/max`.
- **WebFetch kadang mengembalikan hasil fetch sebelumnya** untuk URL yang mirip. Solusi yang terbukti: taruh parameter unik di **awal** query string, mis. `gviz/tq?r=abc1&tqx=out:csv&...`.
- Query `where (A or B)` dengan perbandingan tanggal di kolom bertipe campuran **gagal diam-diam** (gviz mengembalikan seluruh sheet). Pakai satu kondisi tanggal per query, atau baca CSV mentah lalu filter di aplikasi.
- Kolom tanggal campuran (teks "9 Okt 26", "09 Okt 26", "9 Okt 2026", "1/5/2026", tanggal asli) → di aplikasi baca sebagai teks (`out:csv` memberi teks terformat) dan parse sendiri: bulan Indonesia (Jan Feb Mar Apr Mei Jun Jul Agu/Ags Sep Okt Nov Des) + Inggris (Oct, Aug, Dec, May), tahun 2 atau 4 digit.
- gviz salah membaca beberapa tanggal M/D sebagai D/M (contoh EDITDATE MASTER_LC: "2026-12-9"). Jangan pakai max()/min() gviz pada kolom itu.

---

## Tugas 1 — Status 9 laporan

Ringkasan aturan "terisi untuk tanggal D" dan keadaan nyata:

| # | Laporan | Tab & sel yang dicek | 9 Okt | 10 Okt (berjalan) |
|---|---|---|---|---|
| 1 | MONITORING CONTAINER 2026 | gid 1795026471 (tab tujuan Makassar, kolom "MAKASSAR SI"): ada baris dengan **Delivery Date = D** (atau POO/ATD/ATA/Dooring = D) | Terisi (6 LC Delivery 9 Okt; Dooring 9 Okt ×2) | Sebagian (belum ada Delivery 10 Okt; ada POO/ATD/Dooring 10 Okt) |
| 2 | Monitoring Container - Update | tab **BACKUP** (data; gid 63428621 hanya dashboard): baris TUJUAN Makassar dengan **TANGGAL BONGKAR = D** atau ACTUAL DOORING = D | Terisi (H019 3, Q332 2, A017 0) | Terisi (H019 3, A017 1) |
| 3 | Salinan DC Daily Report - HCI | tab `RDC Tallo HCI Okt`, kolom header `" 9 Oct-26"` (E=1 Okt … M=9, N=10): baris **REALISASI** tidak kosong | Terisi (116 sel) | Belum (73 sel; semua REALISASI kosong) |
| 4 | Salinan dari Daily Report DC - AHI & NEKA | tab `RDC Tallo AHI Okt`, sama dengan #3 | Terisi (112 sel) | Belum (69 sel) |
| 5 | Daily Report HCI - RDC SDC | tab `HCI` (E1 = "10 October ") + tab `BackUp_<dd Mon>` | Terisi (BackUp_09 Okt ada; BackUp_10 Okt belum) | Tab HCI ber-cap "10 October" & baris RDC TALLO terisi (isi = data H-1) |
| 6 | Occupancy & Planning Inbound RDC SDC 2026 | tab mingguan `W<ISO week>` (W41 = 5–11 Okt), blok "PLAN BONGKAR CONTAINER [CBM]", kolom `"09 Oct 26"`, baris MAKASSAR | Terisi (TOTAL 161) | Terisi (TOTAL 138) — ini **rencana**, diisi di awal minggu |
| 7 | Salinan dari Daily 2026 TALLO | gid 1213798625 = tab **Occupancy & Akurasi**: baris kolom B = `"09 Oct 2026"`, kolom **Accuracy** tidak kosong dan Total Cycle > 0 | Terisi (Accuracy 99.73%, cycle 732) | Belum (Occupancy terisi; Accuracy kosong, cycle 0) |
| 8 | Laporan Daily Update 2026 | tab `RDC Tallo HCI Okt 2026` dan `RDC Tallo AHI Okt 2026` (gid 942353395 = tab Jun AHI lama!), kolom L/M/N = 8/9/10 Okt; baris PERFORMANCE (SLA Customer, SLA Store, LPPB DO, Accuracy, Tugu, Picking L1) + blok "DC Process Realisasi" | Terisi HCI & AHI | Belum (hanya Occupancy, MHE, plan, outstanding) |
| 9 | Data Container RDC -SDC | gid 336408577 (data kontainer tujuan Makassar: H019/A017/Q332), kolom T **TANGGAL BONGKAR = D** | Terisi (H019 3, Q332 2) | Terisi (H019 3, A017 1) |

Perkiraan hari ini (10 Okt, siang): terisi 4/9 (#2, #5, #6, #9) + #1 sebagian; 9 Okt: 9/9 terisi.

### Rincian per laporan

**1. MONITORING CONTAINER 2026** (`1yJpdmsa…`)
- Tab: SHIPTO, SUMMARY, Inputan, lalu satu tab per tujuan (MANADO HCI, AMBON, BAU BAU, MANADO AHI, TIMIKA, **MAKASSAR**, BALIKPAPAN, … BATU LICIN). gid 1795026471 berisi baris tujuan Makassar (Kode Site H019) → hampir pasti tab `MAKASSAR`.
- Header (26 kol): ORIGIN, MAKASSAR SI (=No LC), Vendor, Type Armada, Shipping Line, TUJUAN, Stuffing Date ("01 Jan 26, 08.00"), Delivery Date, Checkout, Moda, LT, No Container, PELAYARAN, Nama Kapal, POO, ETD, ATD, ETA, ATA, Dooring, Tiba Ditujuan, Bongkar, Position (POO/On Sailling/Yard/Delivered), Status Shipment (On Shipment/Close Shipment), Kode Site, BU (HCI/AHI/KLO).
- Position × Status: Delivered/Close 724, Yard/Close 789, On Sailling/On Shipment 27, POO/On Shipment 18, Yard/On Shipment 20.
- Ini laporan sisi **NDC** (diisi pengirim). Kolom Bongkar tertinggal: 2 LC Dooring 9 Okt (260928T039, 260929T034) Tiba/Bongkar masih kosong.
- Aturan usul: terisi(D) = ada ≥1 baris dengan Delivery Date = D (update kiriman harian NDC). Cek tambahan (opsional, peringatan): baris dengan Dooring ≤ D−1 tetapi Bongkar kosong.
- URL: `.../d/1yJpdmsaMT2nRGFXj21aSix9qQENJqy16D5g4U73ggww/gviz/tq?tqx=out:csv&gid=1795026471&tq=select B,H,K,O,P,Q,R,S,T,U,V,W,X,Z where H >= date '2026-09-28' order by H`

**2. Monitoring Container - Update** (`1IdI7WJr…`)
- Tab: Cut Off Dooring, BACKUP, Sheet1, Dashboard, Sheet19, update hari ini, _STAGING_CONTAINER_SYNC, Kemampuan Bongkar, Summary 40 Feet, Sandar/Tanggal, HISTORI, SYNC_LOG, summary_json, Sheet14, Sheet15.
- gid 63428621 = dashboard "Update Data di link VM": kolom tanggal bergulir "10 Oct"…"16 Oct" (= TODAY()+0..6), baris HCI MAKASSAR / AHI MAKASSAR / RDC MAKASSAR. Rumus → tidak bisa dipakai untuk status.
- **BACKUP** (data, ±60 kol): BU, SI, Vendor, Type Armada, TUJUAN, Stuffing Date, Delivery Date, Checkout, Moda, No Container, PELAYARAN, Nama Kapal, POO, ETD, ATD, ETA, Q `ATA BY DC (DATE)`, R `TGL DOCUMENT DITERIMA`, S `REQUEST DOORING (DATE)`, T `ACTUAL DOORING (DATE)`, U `TANGGAL BONGKAR`, V `Position BY NDC-RDC`, W Status Shipment, X Kode Site, Y BU, AGING YARD, KATEGORI AGING YARD, BU NAME, TERITORI, TEUs, Aging POO, Aging OTW, AGING POD (ATA-RCV), LEAD TIME, Occupancy <hari ini>, SLA UNLOAD, SLA Category, … dan kolom sinkron `FIRST_IMPORTED_AT`, `LAST_UPDATED_AT`, `LAST_SEEN_AT` (semua 10/10/2026 → disinkron otomatis tiap jam).
- H019: Delivered 906, On Sailling 15, POO 11.
- SYNC_LOG berhenti di 23 Sep 2026 17:57 (222 baris) — log tidak lagi ditulis, tetapi BACKUP tetap baru.
- Aturan usul: terisi(D) = ada baris TUJUAN Makassar (X ∈ H019, A017, Q332, …) dengan U (TANGGAL BONGKAR) = D. Peringatan: T (ACTUAL DOORING) ≤ D tapi U kosong.
- Isi BACKUP untuk Makassar identik dengan #9 (kemungkinan sumbernya #9).
- URL: `.../d/1IdI7WJr1SzyAL8WWASoO3ZkbFu3fp-xpGEn2Mm-W7VI/gviz/tq?tqx=out:csv&sheet=BACKUP&tq=select X,E,U,count(B) where U >= date '2026-10-06' group by X,E,U`

**3 & 4. Salinan DC Daily Report - HCI** (`1EvZus41…`) / **Daily Report DC - AHI & NEKA** (`1xDo4qqU…`)
- Tab bulan: `RDC Tallo HCI Okt` / `RDC Tallo AHI Okt` (nama bulan Indonesia: Jan, Feb, Mar, Apr, Mei, Jun, Jul, Agust(?), Sept, Okt). Perlu cek ejaan tab bulan lain bila dipakai (survei lama: "Sept", "Agust").
- Matriks lebar: kolom B label, C UoM/sub-label, kolom tanggal mulai E = `" 1 Oct-26"` (teks, spasi di depan, bulan Inggris) → kolom = E + (hari−1); 9 Okt = M, 10 Okt = N. Header tanggal diulang di tiap seksi (INBOUND VENDOR LOCAL, INBOUND DOMESTIK, OUTBOUND STORE, OUTBOUND STORE (TRANSIT), OUTBOUND CUSTOMER, OUTBOUND CUSTOMER (TRANSIT), OUTBOUND ALL, OTHERS DC DAILY REPORT, blok CBM).
- Banyak baris rumus terisi 0 sebelum diisi; baris **REALISASI** (dan ACCURACY, WTW, LPPB DO, TUGU, 1007/1009, OTIF, MPP, MHE) kosong sampai diinput.
- Aturan usul: cari kolom yang header-nya cocok `^\s*D Mon-yy$`; terisi(D) = sel di baris-baris berlabel `REALISASI` + `ACCURACY (%)` + `MPP … REALISASI` tidak kosong (≥ 80 % dari baris itu). Alternatif kasar: jumlah sel tak kosong di kolom D ≥ 100 (HCI) / ≥ 100 (AHI); hari penuh = 116/112, hari belum = 73/69.
- URL: `.../d/1EvZus41LoHBFBEGyVz9Ri6Re_q5G0c-cZtAcsAxy7vU/gviz/tq?tqx=out:csv&sheet=RDC%20Tallo%20HCI%20Okt` dan `.../d/1xDo4qqUeBbbb_lLdAzSaBFDnylDZ7N56SjNcD59mWbw/gviz/tq?tqx=out:csv&sheet=RDC%20Tallo%20AHI%20Okt`

**5. Daily Report HCI - RDC SDC** (`1Vp7QyadO…`)
- Tab: HCI, Sheet6, BackUp_08 Aug … BackUp_31 Aug, BackUp_01 Sep … BackUp_30 Sep, BackUp_01 Oct … **BackUp_09 Oct** (belum ada BackUp_10 Oct). Nama tab pakai bulan Inggris 3 huruf + hari 2 digit.
- Tab `HCI` (gid 1534527254): cap tanggal di **E1 = "10 October "** (hari ini), seksi INBOUND VENDOR IMPORT / LOCAL / DOMESTIK / OUTBOUND CUSTOMER untuk ±20 DC nasional; baris **RDC TALLO** (baris 9, 16, 35–37) berisi plan/realisasi (angka H-1).
- BackUp_09 Oct ber-cap "08-Oct-2026" → snapshot diambil pada tanggal di nama tab, isinya laporan hari sebelumnya.
- Aturan usul: hari ini → E1 tab HCI = hari ini dan baris RDC TALLO kolom D/E tidak kosong. Hari lalu D → tab `BackUp_<dd Mon>` untuk D (atau D+1) ada. Ini laporan nasional otomatis (bukan input DC Tallo) → bobot rendah / "dipantau".

**6. Occupancy & Planning Inbound RDC SDC 2026** (`1o8GxDc7…`)
- Satu tab per minggu `W1`…`W52`, `W1-2027`; nomor = minggu ISO (W41 = Sen 5 – Min 11 Okt 2026). Tab: cap "05 Oct 26" / "12 Oct 26".
- Tiga blok: OCCUPANCY DC DAERAH (Regional, DC, OWNER, kolom angka tanpa label + status Available/Near Capacity/Overload), MONITORING CONTAINER, **PLAN BONGKAR CONTAINER [CBM]** (Region, DC, OWNER, `"05 Oct 26"` … `"11 Oct 26"`, Total). Baris MAKASSAR: TOTAL, HCI, AHI, FBI, TGI. "-" = 0 (bukan kosong).
- 9 Okt: TOTAL 161 (HCI 128, AHI 24, FBI 9). 10 Okt: 138 (115/23/-). Occupancy Makassar TOTAL 93.49 % (HCI 90.51 %, AHI 123.41 % Overload).
- Laporan **mingguan** (rencana diisi di awal minggu). Aturan usul: terisi(D) = tab `W<isoWeek(D)>` ada dan sel baris MAKASSAR TOTAL pada kolom `dd Mon yy` = D tidak kosong. Di layar beri label "mingguan".
- URL: `.../d/1o8GxDc72nZTcHdj9oBH2CuYPZHbHvd1And4mG0yzRFw/gviz/tq?tqx=out:csv&sheet=W41`

**7. Salinan dari Daily 2026 TALLO** (`1iXNQJ3m…`)
- gid 1213798625 = tab **Occupancy & Akurasi**: kolom A kosong, B tanggal `"09 Oct 2026"` (dd Mon yyyy), C Capacity, D Use Space, E Occupancy, F Total Lokasi, G Accuracy, H Total Cycle, I Jumlah Count Hit, J Miss. Ada baris subtotal bulanan (tanggal kosong) dan tanggal yang sama muncul lagi di blok bulan Oktober.
- 9 Okt: 7354 / 7093 / 96 % / 197 / 99.73 % / 732 / 730 / 2. 10 Okt: occupancy terisi, Accuracy kosong, lain 0.
- Aturan usul: baris pertama dengan B = D; terisi = G (Accuracy) tidak kosong dan H (Total Cycle) > 0. Tab lain (Inbound, SLA & Outstanding Store, SLA Customer HCI/AHI) bisa dicek serupa bila perlu.
- URL: `.../d/1iXNQJ3mLv7mw3X1x9n_IvVEroprL-scWhe13-dFGONY/gviz/tq?tqx=out:csv&gid=1213798625`

**8. Laporan Daily Update 2026** (`1-DrDOPp…`)
- gid 942353395 ternyata tab **RDC Tallo AHI Jun 2026** (1 Jun–5 Jul) → jangan pakai gid; pakai `sheet=RDC Tallo HCI Okt 2026` dan `sheet=RDC Tallo AHI Okt 2026` (pola: `RDC Tallo <BU> <Bln-ID> 2026`).
- B "PERFORMANCE", C "STANDARD", kolom tanggal E = "1 Oct-26" → 9 Okt = M, 10 Okt = N. Blok: PERFORMANCE (SLA Customer 99 %, SLA Store 99 %, LPPB DO 0.20 %, Accuracy 99 %, Occupancy 85–115 %, Tugu 0.20 %, Picking Level 1 30 %), MHE, SLOC VALUE, INCOMING, UNLOADING PLAN/REALISASI/PENDING, OUTBOUND PLANNING, OUTSTANDING ORDER, BACKLOG STORE, DC Process Forecast/Plan/**Realisasi**/WH Man Hadir.
- 9 Okt HCI: SLA 100/100, LPPB DO 0.06 %, Accuracy 99.70 %, Occ 96.45 %, Tugu 0.2 %, Picking L1 24 %. AHI: 100/100, 0.04 %, 99.94 %, 122.15 %, 0 %, 37 %. 10 Okt: hanya Occupancy (95.91 % / 119.99 %).
- Aturan usul: terisi(D) = di kedua tab, 6 baris PERFORMANCE selain Occupancy tidak kosong di kolom D (dan/atau "Unloading (total) Realisasi" ≠ kosong). Bisa dihitung per BU (HCI, AHI) → 2 sub-status.
- **Bonus**: tab ini sudah berisi KPI harian vs STANDARD — sumber bagus untuk dashboard manajer.

**9. Data Container RDC -SDC** (`1F2JiOJp…`)
- gid 336408577: header A ORIGIN, B SI (=No LC), C Vendor, D Type Armada, E TUJUAN, F Delivery Date, G Checkout, H Moda, I No Container, J PELAYARAN, K Nama Kapal, L POO, M ETD, N ATD, O ETA, P ATA BY DC (DATE), Q TGL DOCUMENT DITERIMA, R REQUEST DOORING (DATE), S ACTUAL DOORING (DATE), T TANGGAL BONGKAR, U POSITION, V Status Shipment, W Kode Site, X BU, Y AGING, Z KATEGORI AGING, AB UPDATE STATUS, AC NO, AD QEY, AE COUNTA POSITION, AF SLA DOCUMENT. Tanggal "dd Mon yy". Semua TUJUAN Makassar → tab `RDC TALLO`.
- TANGGAL BONGKAR per hari: 5 Okt H019 5; 6 Okt H019 5 + A017 1; 7 Okt 3+2; 8 Okt 3+2; **9 Okt H019 3 + Q332 2**; **10 Okt H019 3 + A017 1**.
- Aturan usul: terisi(D) = ≥1 baris dengan T = D (dan semua baris dengan S ≤ D sudah punya T). Ini laporan yang paling jelas diisi DC Tallo.
- URL: `.../d/1F2JiOJpp2F7ITOjoMkchLE-HTCYUE6ZODRcvaqRhLwk/gviz/tq?tqx=out:csv&gid=336408577&tq=select W,T,count(B) where T >= date '2026-10-05' group by W,T`

Catatan umum Tugu 1: hari tanpa bongkar (Minggu/libur) membuat aturan "ada baris = D" salah merah. Usul: bandingkan dengan rencana (MASTER_PLAN `TGL BONGKAR` = D, atau PLAN BONGKAR #6 = "-") → bila plan 0, status "tidak ada kegiatan" (abu-abu), bukan "belum".

---

## Tugas 2 — LPPBDO

Sumber: IMM master `LPPBDO_HCI`, `LPPBDO_AHI` (28 kol). `INBOUND (SCRIPT)` tab `LPPBDO` = salinan HCI yang sama (+1 kolom kosong di depan dan kolom UPDATE di akhir). `Dashboard Inbound Semester 2` tab `LPPBDO` = juga salinan baris yang sama (tanpa kolom Tgl). **Tidak ditemukan varian LPPBPO/outbound** di ketiga file maupun di `Source Link`. Satu-satunya angka outbound = baris "LPPB DO (%)" di laporan harian (#3/#4/#8).

Kolom: A UPDATE (DONE/PENDING), B Tgl (angka hari 1–31), C Bulan (nama Indonesia: Januari…Oktober), D BU, E LPPBDO No. (`LPPBDO/H019/2026/10/0001` = DC Tallo HCI; `LPPBDO/A017/…` = DC Tallo AHI), F Site Receiver, G Load Id, H Driver (kode/nama — jangan tampil), I Receiver (nama orang), J Tujuan (teks bebas, mis. "BARANG CACAT DEPT … TUJUAN DC TALLO"), K Do No., L Artikel, M Desc, N dept_code (HCI kosong; AHI 2 huruf mis. "AJ"), O Qty OD, P Qty Receive, Q Remark Detail, R Status, S Kategori, T Qty LPPBDO, U Created by / V Posted by (ID + nama orang), W Dept (mis. R1100E / R100AJ; sering `#N/A`), X JGN DIRUBAH (=salinan LPPBDO No.), Y (tanpa judul, 0/1 — bernilai 1 pada salah satu baris per dokumen; sum ≈ jumlah dokumen, tapi lebih aman hitung distinct E), Z kosong, AA Tanggal ("1 Januari 2026"), AB Week (= WEEKNUM Senin + 1: 1 Okt = 41, 5 Okt = 42).

Tanggal: pakai AA (teks "d MMMM yyyy" bulan Indonesia) atau B+C+tahun dari E.

**Jumlah baris**: HCI 375, AHI 186.
- September 2026: HCI 29 baris, AHI 31 baris.
- Oktober 2026 (s.d. 10 Okt): HCI 4 baris / 3 dokumen (semua Pending, Jababeka), AHI 0.

**BU**: HCI 375 (tab HCI), AHI 186 (tab AHI). Tidak ada KWI/TGI/FBI.

**Site Receiver** (sebenarnya = asal kirim):
- HCI: Jababeka 236, Sidoarjo 74, Cikupa 64, WH TALLO MAKASSAR 1 (Jul, Damage).
- AHI: Sidoarjo 154, Jababeka 29, Nipah 2, Mari 1.

**Status**:
- HCI: Accepted 369, Pending 5 (Sep 1, Okt 4), accepted (huruf kecil) 1.
- AHI: Accepted 89, Head Office 35, Rejected 31, accepted (kecil) 19, CIS 6, Cancel from CIS 5, Pending 1.
- → normalisasi huruf; kelompok: Selesai (Accepted), Proses (Pending, CIS, Head Office), Batal (Rejected, Cancel from CIS).

**Kategori** (baris):
- HCI: DAMAGE GOODS 168, GOODS WITHOUT OD 126, OD WITHOUT GOODS 38, GOODS SHORTAGE 32, GOODS OVER 10, SPAREPARTS SHORTAGE 1.
- AHI: DAMAGE GOODS 68, GOODS WITHOUT OD 51, OD WITHOUT GOODS 18, GOODS SHORTAGE 18, GOODS OVER 15, SPAREPARTS SHORTAGE 15, OTHERS 1.
- **Damage = `DAMAGE GOODS`**.

**Dept untuk DAMAGE GOODS** (baris / qty):
- HCI: R110AE 42/102, #N/A 28/37, R1100K 16/27, R1100C 15/44, R1100A 12/21, R1100B 11/24, R1100E 7/7, R1100D 5/5, R1100F 5/5, R1100O 5/16, R110AC 4/4, R110AQ 4/4, R110AK 3/9, lainnya ≤2.
- AHI: #N/A 32/60, R100AD 11/93, R100BN 4/13, R100AN 3/3, R100AG 2/8, R100AJ 2/32, R100AO 2/27, R100AW 2/2, R100AY 2/70, R100BM 2/2, sisanya 1.
- `#N/A` besar → di aplikasi fallback: AHI `R100` + dept_code (N); HCI: lookup Artikel ke MASTER_LC.Dept atau tampil "Dept belum dipetakan".

**Inbound vs outbound**: semua baris di dua tab = **inbound ke DC Tallo** (nomor dokumen ber-kode DC Tallo H019/A017; Tujuan "… TUJUAN DC TALLO"). Pembeda "ship by":
- Ship by NDC = Site Receiver ∈ {Jababeka, Cikupa, Sidoarjo} (HCI 374, AHI 183).
- Ship by store/lainnya = selain itu (Nipah, Mari = store AHI Makassar; WH TALLO MAKASSAR) (HCI 1, AHI 3).
- Data LPPBPO (DC kirim ke store, store yang melapor) tidak ada di sheet mana pun yang disurvei → tampilkan "belum ada sumber" atau minta link baru ke pemilik.

**KPI usul (layar LPPBDO)**:
1. Kartu ringkasan periode: jumlah dokumen (distinct E), item (baris), qty (sum T), % dokumen masih proses.
2. Per BU (HCI/AHI) dan per asal: NDC Jababeka / Cikupa / Sidoarjo vs store.
3. Per Kategori (bar, urut terbanyak) — Damage, Goods without OD, OD without goods, Shortage, Over, Spareparts.
4. Status (Selesai / Proses / Batal) + daftar yang Pending > N hari (dari AA).
5. Top dept_code damage (Kategori = DAMAGE GOODS, group by Dept dengan fallback).
6. Tren per minggu (AB) atau per bulan (C).
7. Selisih qty = |Qty OD − Qty Receive| sebagai cek silang T.

URL yang berhasil:
- `.../d/1Dxejz_FVQqE6t3xg6dWsLwlJoB7qBFOyZKRqvsfonQs/gviz/tq?tqx=out:csv&sheet=LPPBDO_HCI&tq=select+C,R,S,count(E),sum(Y),sum(T)+group+by+C,R,S`
- `…&sheet=LPPBDO_AHI&tq=select+D,F,C,R,S,count(E),sum(Y),sum(T)+group+by+D,F,C,R,S`
- `…&sheet=LPPBDO_HCI&tq=select+W,count(E),sum(T)+where+S='DAMAGE+GOODS'+group+by+W+order+by+count(E)+desc`
- `…&sheet=LPPBDO_HCI&tq=select B,C,E,F,O,P,R,S,T,W,Y,AB where C = 'Oktober'` (URL-encoded)
- INBOUND (SCRIPT): `.../d/1T6uWLA_8eDa5TYaKGZATHUoGMYXc6JzrR4wHEFK4mi4/gviz/tq?tqx=out:csv&sheet=LPPBDO&tq=select E,G,D,S,T,count(F) group by E,G,D,S,T` (kolom bergeser 1)

---

## Tugas 3 — Aging LC di DC (MASTER_LC)

Header: A No LC, B ORDERKEY, C EXTERNORDERKEY (OD.…), D AreaPengiriman, E TradingPartner, F KODE SITE (store/customer tujuan, mis. J337), G SITE NAME, H ORDERDATE (`MM/DD/YYYY HH:MM`), I REQUESTEDSHIPDATE (`MM/DD/YYYY`), J POKEY, K TYPE, L STATUS, M ADDDATE, N EDITDATE, O EDITWHO (`wmwhse4` = akun WMS sistem), P SITE (BU), Q SKU, R DESCR, S Dept, T ORIGINALQTY, U OPENQTY, V QTYPREALLOCATED, W QTYALLOCATED, X QTYPICKED, Y SHIPPEDQTY, Z CBM_ORIGINAL_QTY, AA CBM_SHIPPED_QTY.

**STATUS** (baris):
- `Shipped Complete` 43.785
- kosong 1.490 (count ORDERKEY) — hanya 5 LC dengan format ekspor berbeda (tanpa ORDERDATE/ADDDATE/TYPE/ORIGINALQTY): 260929T034 HCI 179, 260928T004 KWI 398, 260929T018 KWI 0, 260925T021 AHI 774 + TGI 139.
- Tidak ada status lain (tidak ada Released/Picked/In Picking dll).

TYPE (Shipped Complete): Customer (HCI 18.741, AHI 50), GRW (AHI 16.830, HCI 7.639, FBI 442), Flow Thru (HCI 198, AHI 8), Custom Made (HCI 98), Customer Sales Order (HCI 18, AHI 3), Damage (HCI 4), Tugu (HCI 1).
Baris per SITE dengan No LC: HCI 26.724, AHI 17.611, FBI 403, KWI 398, TGI 139. Baris tanpa No LC: 247 (semua Shipped Complete).
No LC = `YYMMDD` + jenis (T/O/L/H) + urut, mis. `261003T052` = LC 3 Okt 2026. ORDERDATE/ADDDATE 1–4 hari sebelum tanggal LC (order dibuat lalu dimuat). ORDERDATE terbaru 3 Okt 2026.

**Kesimpulan**: MASTER_LC adalah ekspor order **NDC** (status order di gudang pengirim). `Shipped Complete` = sudah dikirim dari NDC — **tidak** menggambarkan barang di DC Tallo, jadi STATUS tidak bisa jadi titik akhir aging di DC.

**Usulan perhitungan aging LC di DC** (join No LC = SI di Data Container RDC-SDC #9 / BACKUP #2 = "MAKASSAR SI" #1 = No LC di MASTER_PLAN):
1. Tanggal LC = parse 6 digit pertama No LC (cadangan: max ADDDATE).
2. **Aging POD / yard (utama)** = hari ini − `ATA BY DC (DATE)` (kapal sandar di Makassar), berhenti saat `TANGGAL BONGKAR` terisi. Kelompok sama dengan laporan harian: 0–7, 8–14, 15+ hari; SLA UNLOAD Hit ≤ 7 hari. Kolom `AGING POD (ATA-RCV)` dan `SLA Category` di BACKUP sudah menghitung ini untuk yang selesai.
3. **Aging di DC sejak tiba** (opsional) = hari ini − `ACTUAL DOORING (DATE)` sampai `TANGGAL BONGKAR` (kontainer sudah di halaman DC tapi belum dibongkar).
4. **Aging perjalanan** (konteks) = hari ini − tanggal LC selama Position ∈ POO/On Sailling.
5. Setelah bongkar, barang Flow Thru/GRW (transit ke store) perlu status keluar DC; sumber itu tidak ada di sheet yang disurvei (MASTER_LC hanya NDC). Tampilkan CBM/qty per TYPE dari MASTER_LC sebagai isi LC saja.
- Hindari agregat tanggal gviz pada EDITDATE (tipe campur, dibaca D/M).

URL:
- `.../d/1Dxejz_FVQqE6t3xg6dWsLwlJoB7qBFOyZKRqvsfonQs/gviz/tq?tqx=out:csv&sheet=MASTER_LC&tq=select+L,K,P,count(B),min(H),max(H),min(M),max(M),min(N),max(N)+group+by+L,K,P`
- `…&sheet=MASTER_LC&tq=select+A,P,count(B),sum(Y)+where+L+is+null+group+by+A,P+order+by+A+desc`
- `…/gviz/tq?r=lcagg1&tqx=out:csv&sheet=MASTER_LC&tq=select+A,L,count(B),max(H),max(M)+where+A+is+not+null+group+by+A,L+order+by+A+desc+limit+40`

Tambahan: `MASTER_PLAN` saat ini ber-header `Week, Month, DAY, TGL BONGKAR ("2 May 2026"), PLAN JAM TIBA, URUT, NO.KONTAINER, No LC, SITE, DATA PLANNING BONGKARAN KONTAINER TO STOCK OD, SKU, QTY, …` — beda dari survei lama; TGL BONGKAR di sini = rencana bongkar per LC.
