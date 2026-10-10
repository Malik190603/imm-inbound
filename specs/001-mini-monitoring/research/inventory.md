# Pemetaan KPI Inventory → Google Sheets (DC Tallo)

Tanggal riset: 10 Okt 2026. Metode: WebFetch gviz saja. Privasi: tidak ada nama/NIK/HP yang disalin.

Singkatan ID:
- **SCR** = `1Lah0IepAbVPJ1wpE6hjtEwOqojgKJniJvYn5FJtcob0` (Dashboard inventory SCR)
- **INV02** = `10CJOU1DCjNnm6HePh0Xt_GT_i243XLJwo07MkaDyLNo` (Dashboard inventory02)
- **INV26** = `1_HLTa4UBkM74DnebjIS4lhj5iLN9HSApRoFpBYeLgHE` (DASHBOARD INVENTORY 2026)
- **LAYH** = `1HTmVQq7pnId3WdH-i-cG0H1LXfdiqaqMEkUs72z5dJM` (Layout HCI)
- **LAYA** = `1Fh9ZBo3sTW4u4upoWslDzT0Vl2Nh6ikJ5TJGiOx6GrQ` (Layout AHI)

Basis URL: `https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&sheet=<tab>&tq=<query>`

## Pelajaran teknis gviz (penting untuk implementasi)

1. **Urutan klausa**: `limit` harus sebelum `offset` (`limit 12 offset 262`), kalau terbalik → `PARSE_ERROR`.
2. **Kolom tanggal bertipe date** di tab data (WTW HCI/AHI, Update 1007 & 1009, CC PICKING). Filter: `where A >= date '2026-10-01'`. `max(A)` mengembalikan `2026-10-10`.
3. **Teks di kolom yang mayoritas angka dibuang gviz** (label dashboard hilang). Trik: `&headers=0&range=C1:T70` (rentang kecil yang mayoritas teks) memunculkan label. Untuk tab dashboard selalu pakai `range=`.
4. Tab data punya **baris tanggal masa depan yang sudah disiapkan** (sampai Feb 2027) dengan nilai `0`/kosong. Ambil baris terakhir dengan `TARGET > 0` (atau kolom realisasi > 0), bukan baris terakhir.
5. Angka sering teks: `"99.57%"`, `"RP415,441,261"`, `"1,131"`, `"-"` (= 0). Perlu parser.
6. Nama header berulang (PLUS/MINUS/ACCURASI …) → baca berdasarkan **posisi kolom** dalam grup, bukan teks saja.

---

## 1. Home "Akurasi DC Tallo" — **READY**

**Sumber utama**: INV02 tab `WTW HCI` (= gid 1494837787) dan `WTW AHI` (struktur identik; AHI memakai ejaan `REALISASI`, HCI `RALISASI`). Satu baris per tanggal, 1 Jan 2026 … (baris kosong disiapkan s.d. Feb 2027). ±252 (HCI) / 250 (AHI) baris berisi.

Header (kolom A…AR):
`TGL | TARGET | PLUS | MINUS | LOC KOSONG | RALISASI | ACCURASI LOC | Disc.Awal | PLUS | MINUS | HIT | TOTAL COUNT | ACCURASI COUNT | Disc.Awal | PLUS | MINUS | HIT | TOTAL  QTY | ACCURASI QTY | Column 1 | DONE LOC | PLUS | MINUS | ACCURASI LOC | DONE COUNT | PLUS | MINUS | ACCURASI COUNT | DONE QTY | PLUS | MINUS | ACCURASI QTY | ON LOC | PLUS | MINUS | ACCURASI LOC | ON COUNT | PLUS | MINUS | ACCURASI COUNT | ON QTY | PLUS | MINUS | ACCURASI QTY`
(perhatikan `TOTAL  QTY` dengan dua spasi).

Tiga akurasi (dicek terhadap data):
- **Akurasi lokasi** `ACCURASI LOC` (G) = (TARGET − PLUS − MINUS) / TARGET. Cek: HCI 9 Okt (230−0−2)/230 = 99.13% ✓.
- **Akurasi count** `ACCURASI COUNT` (M) = HIT / TOTAL COUNT (L), TOTAL COUNT = Disc.Awal + HIT.
- **Akurasi qty** `ACCURASI QTY` (S) = HIT qty / TOTAL QTY (R).
- Grup `DONE …` (U–AF) = setelah perbaikan; grup `ON …` (AG–AR) = discrepancy yang masih on progress.

Filter tanggal: `where A >= date 'YYYY-MM-DD'` lalu ambil baris terakhir dengan `B > 0`. Filter BU: pilih tab (HCI / AHI). Tidak ada tab WTW untuk TGI/FBI/KWI.

Rumus "Akurasi DC Tallo" yang disarankan (gabungan BU, akurasi lokasi — KPI utama cycle count):
`(ΣTARGET − ΣPLUS − ΣMINUS) / ΣTARGET` atas HCI + AHI pada tanggal terbaru. Alternatif: akurasi qty `ΣHIT_qty / ΣTOTAL QTY`.

Sampel terbaru (10 Okt 2026):
| BU | TARGET | PLUS | MINUS | LOC KOSONG | REALISASI | ACC LOC | TOTAL COUNT | ACC COUNT | TOTAL QTY | ACC QTY |
|---|---|---|---|---|---|---|---|---|---|---|
| HCI | 230 | 1 | 0 | 50 | 179 | 99.57% | 751 | 99.87% | 2261 | 99.96% |
| AHI | 39 | 0 | 0 | 6 | 33 | 100.00% | 284 | 100.00% | 4302 | 100.00% |
→ gabungan akurasi lokasi DC = (269−1)/269 = **99.63%**.

URL yang berhasil:
- `.../d/INV02/gviz/tq?tqx=out:csv&sheet=WTW%20HCI&tq=select%20A,B,C,D,E,F,G,L,M,R,S,U,V,W,X,AH,AI,AJ,AK%20where%20A%3E%3Ddate%20%272026-10-01%27`
- sama untuk `sheet=WTW%20AHI`
- `...&sheet=WTW%20HCI&tq=select%20count(A),max(A)%20where%20F%3E0`
(Disarankan tambah `and B>0` supaya baris masa depan tidak ikut.)

Cadangan: INV26 tab `Cycle Count` (dashboard) memuat baris 9–10 Okt untuk HCI/AHI per lokasi/count/qty, tetapi tanpa label (lihat §4).

---

## 2. Value barang damage (Sloc 1001) dan daftar Sloc — **PARTIAL**

### 2a. Sloc 1007-/1007+/1009-/1009+ — **READY (HCI & AHI)**, PARTIAL untuk BU lain
**Sumber**: INV02 tab `Update 1007 & 1009`. Satu baris per tanggal (data sejak 1 Agu 2026), kolom B = tanggal (tipe date).
Header (A…AB):
`"" | TGL  | Lebih Kirim (1007-) SKU | QTY | VALUE | Kurang Kirim (1007+) SKU | QTY | VALUE | Discrepancy Plus (1009-) SKU | QTY | VALUE | Discrepancy Minus (1009+) SKU | QTY | VALUE | "" | (blok kedua, label sama) …`
- Blok 1 (C–N) = **HCI**, blok 2 (P–AA) = **AHI** (dicocokkan dengan dashboard "Sloc HCI"/"Sloc AHI"). Label BU tidak ada di header → posisi.
- VALUE teks `"RP413,847,710"`.
- Filter tanggal: `where B >= date '…'`; **9 & 10 Okt masih kosong** → ambil baris terakhir yang terisi.

Sampel terbaru terisi (8 Okt 2026):
| Sloc | HCI SKU/Qty/Rp | AHI SKU/Qty/Rp |
|---|---|---|
| 1007- Lebih Kirim | 0 / 0 / Rp0 | 0 / 0 / Rp0 |
| 1007+ Kurang Kirim | 0 / 0 / Rp0 | 0 / 0 / Rp0 |
| 1009- Discrepancy Plus | 219 / 678 / Rp413.847.710 | 18 / 36 / Rp12.545.082 |
| 1009+ Discrepancy Minus | 84 / 245 / Rp166.768.404 | 26 / 122 / Rp13.280.106 |

URL: `.../d/INV02/gviz/tq?tqx=out:csv&sheet=Update%201007%20%26%201009&tq=select%20*%20where%20B%3E%3Ddate%20%272026-10-08%27%20and%20B%3C%3Ddate%20%272026-10-10%27`

Nilai per 4 BU (hanya Rp, tanpa SKU/Qty) ada di INV26 `Cycle Count` (dashboard) baris "SLOC / VALUE (Rp.)" kolom Q–T, urutan BU di dashboard itu HCI, AHI, TGI, FBI: 1009- = RP415,441,261 / RP12,762,950 / RP716,220 / RP0; 1009+ = RP168,144,534 / RP12,790,234 / RP143,244 / RP0 (nilai 10 Okt). Label kolom BU di blok ini tidak terbaca → urutan BU adalah dugaan. KWI tidak ada.

INV26 tab `1007 & 1009` = **detail kasus per artikel** (bukan ringkasan): header `NO | ARTICLE | DESCRIPTION | QTY | UOM | VALUE | SITE | TOTALVALUE | BU | Status | KET` (mulai kolom T), Status ∈ `1009Minus`/`1009Plus`, SITE/BU = kode store (H019 = HCI). Berguna untuk drill-down, kolom KET berisi alasan. Blok kiri `Sloc | KETERANGAN CASE HCI | … | TOTAL VALUE` berisi ringkasan bernilai 0.
SCR tab `1007 & 1009` **kosong** lewat gviz (dua percobaan).

### 2b. Sloc 1001 damage (BARUS) dalam Rupiah — **NO SOURCE (nilai Rp)**, qty READY
- Tidak ditemukan nilai **Rupiah** stok Sloc 1001/1000 di kelima spreadsheet. Yang ada hanya SKU/Qty:
  - INV26 `Update barus` (bulan berjalan, judul "UPDATE BARUS OKTOBER 2026 HCI" / "… AZKO"): baris status `BELUM DI ADF, BELUM APPROVAL, APPROVAL DISKON, APPROVAL REPAIR, APPROVAL WO, APPROVAL ASURANSI, NOT APPROVAL, REPAIR DI DC, SUDAH DI KIRIM & WO, KELUAR, MASUK, SALDO AWAL, ON HAND HCI/ON HAND AHI`; kolom (header gviz versi survei) `status, TOTAL SKU, QTY, %, RC SKU, QTY, HD SKU, QTY, PR SKU, QTY, TG SKU, QTY`. HCI di kolom B–M, AHI di kolom T–AE. Sampel ON HAND: HCI 1.020 SKU / 1.131 qty; AHI 35 SKU / 75 qty.
  - SCR `BARUS`: harian `TGL | SKU | QTY | SKU | QTY` (blok HCI A–E, blok AHI G–K; pasangan pertama = masuk, kedua = keluar — dugaan dari dashboard "IN & OUT BARUS") + tabel status per BU di M–P / R–U.
  - INV26 `IN & OUT BARUS`: SALDO AWAL, ON HAND, BARUS MASUK weekly n, BARUS KELUAR weekly n per BU.
- Rp yang ada di dashboard INV02 `Dashboard` blok "IN & OUT BARUS" ternyata angka 1009-/1009+ (bukan damage).
- Kesimpulan: kartu "Value barang damage (Rp)" butuh sumber baru (ekspor SAP stok Sloc 1001 dengan nilai, atau kolom harga di tab BARUS). Sementara bisa tampil **Qty/SKU ON HAND** dari `Update barus`.

URL: `.../d/INV26/gviz/tq?tqx=out:csv&sheet=Update%20barus&headers=1&tq=limit%2034`; `.../d/SCR/gviz/tq?tqx=out:csv&sheet=BARUS&tq=limit%206`; `.../d/INV26/gviz/tq?tqx=out:csv&sheet=IN%20%26%20OUT%20BARUS&headers=0&range=A1:Z8`

---

## 3. Occupancy — **READY** (HCI, AHI; FBI lewat INV02), TGI/KWI PARTIAL

### Sumber utama: SCR `OCCUPANCY HCI` dan `OCCUPANCY AHI`
Header: `TGL | BU | Capasity | Used Space | % | Inbound | Outbound` (+ kolom kosong). TGL teks `d MMM yy` ("10 Oct 26"); angka CBM desimal; `%` teks. Satu baris per hari sejak 1 Jan 2026 (±283 baris). Hari ini: Used terisi, Inbound/Outbound masih kosong.
- Occupancy % = Used Space / Capasity. CBM inbound/outbound harian = kolom Inbound/Outbound. Kapasitas tersisa = Capasity − Used Space. Tren harian = seluruh baris.
- Filter tanggal: TGL teks → ambil semua lalu parse, atau `where D is not null offset N`.
- Sampel 10 Okt 2026: HCI 7.053,41 / 7.354 CBM = 95,91% (9 Okt: in 25,19, out 64,52). AHI 1.383,70 / 1.153,15 = 119,99% (9 Okt: in 0, out 24,08).

URL: `.../d/SCR/gviz/tq?tqx=out:csv&sheet=OCCUPANCY%20HCI&tq=select%20A,B,C,D,E,F,G%20where%20D%20is%20not%20null%20offset%20270` (sama untuk `OCCUPANCY%20AHI`).

### Sumber lengkap 3 BU: INV02 `Occupancy`
Baris per hari, blok lebar tanpa header bermakna (baris 1 = tanggal filter). Kolom: Q hari ("Kamis"), R tanggal (`d MMM yyyy`), lalu per BU 9 kolom: `BU | Capacity | Used | % | Δ% (teks ▲/▼) | Inbound CBM | Outbound CBM | n1 | n2` — HCI S–AA, AHI AB–AJ, FBI AK–AQ (FBI tanpa n1/n2). n1/n2 belum diketahui (kemungkinan jumlah dokumen/SKU masuk/keluar). Kapasitas FBI 130,42.
URL: `.../d/INV02/gviz/tq?tqx=out:csv&sheet=Occupancy&tq=limit%205`
Catatan: AHI 1 Jan di sini 697,94 CBM (60,52%) — cek konsistensi dengan SCR sebelum memilih sumber.

### Total DC
Dashboard INV26 `Cycle Count`/`NEW DASHBOARD` menampilkan HCI 6331(!)/7354, AHI 1153→1384 (119,99%), TGI 80→0 (0%), FBI 130→63,28 (48,52%). Total = ΣUsed/ΣCapacity. Total 10 Okt (HCI+AHI+FBI+TGI) ≈ (7053,41+1383,7+63,28+0)/(7354+1153,15+130,42+80) = **97,5%**. TGI hanya ada di dashboard (tanpa tren); KWI tidak ada. Kapasitas HCI berbeda (6331 vs 7354) antar tab — perlu dikonfirmasi pemilik.

---

## 4. Inventory dashboard

### 4a. Aging lokasi virtual & floor — **READY**
INV26 tab `Virtual` (judul "DASHBOARD LOKASI VIRTUAL & FLOOR"). Baris 2 = header bucket (perlu `headers=0&range=`):
`"" | "" | 1-3 hari | "" | 4-10 hari | "" | 11-20 hari | "" | 21-30 hari | "" | 31-90 hari | "" | 91-150 hari | "" | 151-300 | "" | 301-500 hari | "" | QTY | SKU | CBM | Total | ""`
- Tiap bucket 2 kolom = **(QTY, SKU)** (diverifikasi: total S = jumlah QTY bucket). S = total QTY, T = total SKU, U = CBM, V/W = QTY/SKU yang umurnya > 3 hari.
- Baris (kolom B): blok HCI: `INTRANSIT, PACK, STAGE, PICKTO, C0, CAH019, CJ3, CJ4, FLOOR`; blok AHI: `INTRANSIT, PACK, STAGE, PICKTO, C0, FLOOR`. Tanggal snapshot di B1 ("10 Oct 2026"). Tidak ada histori (snapshot).
- Sampel 10 Okt: HCI FLOOR total 2.749 qty / 349 SKU / 259 CBM (> 3 hari 910 qty / 217 SKU); HCI PACK 539 qty / 410 SKU; HCI INTRANSIT 0. AHI FLOOR 1.310 qty / 161 SKU / 18,41 CBM (> 3 hari 97/9); AHI PACK 41/36.
- Di bawahnya (baris ±20–40) blok aging stok per rak (R1100A, R100AT …) dengan bucket bulan (0, 3-6, 6-12, 12-24 …) — belum dipetakan penuh.
URL: `.../d/INV26/gviz/tq?tqx=out:csv&sheet=Virtual&headers=0&range=A1:W60` dan `…&range=A1:W3` (label bucket).

### 4b. Akurasi count + root cause — **PARTIAL**
- Akurasi count: lihat §1 (`ACCURASI COUNT`).
- Root cause: tersedia per jenis count di INV26:
  - `CC PICKING`: header `"" | HCI  | DISC AWAL PICKING PLUS | MINUS | HIT | TOTAL COUNT | ACCURASI COUNT | PERBAIKAN PLUS | MINUS | ACCURASI COUNT | ON PROGRES PLUS | MINUS | ACCURASI COUNT | "" | AHI  | (sama)`. Kolom A = minggu ("W02"), B = tanggal. Dua baris teratas = total (HCI: disc 1+5 dari 3.188 → 99,82%; 3+3 dari 4.828 → 99,89%). Minggu berjalan (6–9 Okt) masih nol.
  - `CC MOVE`: header sama dengan "DISC AWAL MOVE PLUS". Total HCI 0/0 dari 1.933 (100%) dan 2/2 dari 3.056 (99,92%); AHI 0/4 dari 985 (98,32%).
  - `CC WTW`: `"" | HCI | Pencapaian | "" | DISC AWAL WTW | … | PERBAIKAN | … | ON PROGRES | …` total HCI pencapaian 4.450 (115,95%), disc plus 384 / minus 345, HIT 12.850 / total 13.579 → 94,54%.
- **Pressing, Adjustment Plus, Adjustment Minus, Miss Cycle: tidak ditemukan** sebagai kolom/label di tab yang dibaca (Cycle Count, NEW DASHBOARD, CC *). Kemungkinan ada di tab yang belum dibaca (`HCI`, `Sheet31`, `Sheet26`, `Sheet18`, INV02 `Sheet2`) atau di chart. Status root-cause: Move & Picking READY (per minggu), sisanya NO SOURCE.
URL: `.../d/INV26/gviz/tq?tqx=out:csv&sheet=CC%20PICKING&tq=limit%208`, `…sheet=CC%20MOVE…`, `…sheet=CC%20WTW…`.

### 4c. Cycle count wall to wall (target, plus, minus, lokasi kosong, aktual, %) — **READY**
Sama dengan §1: `TARGET, PLUS, MINUS, LOC KOSONG, RALISASI/REALISASI, ACCURASI LOC` di INV02 `WTW HCI`/`WTW AHI`. "Aktual" = RALISASI (= TARGET − LOC KOSONG). Contoh HCI 10 Okt: 230 / 1 / 0 / 50 / 179 / 99,57%.
Dashboard INV26 `NEW DASHBOARD` (baris "CYCLE COUNT WTW", `LOKASI | DISC AWAL | TARGET`) menampilkan hal yang sama untuk H-1 (9 Okt), plus pencapaian kumulatif (5027 / 761).

### 4d. Perbaikan wall to wall (done lokasi, plus, minus, akurasi) per lokasi/count/qty — **READY**
INV02 `WTW HCI/AHI` grup `DONE LOC | PLUS | MINUS | ACCURASI LOC` (U–X), `DONE COUNT…` (Y–AB), `DONE QTY…` (AC–AF); sisa belum diperbaiki di grup `ON …` (AG–AR). Contoh HCI 10 Okt: DONE LOC 0, ACC 99,57%, ON LOC plus 1 (0,43%). AHI 9 Okt: ON COUNT 8.
Catatan: pada Jan nilai `ACCURASI LOC` grup DONE > 100% (146,25%) → rumus sheet tidak dibatasi; tampilkan dengan clamp atau hitung sendiri.
Total kumulatif per jenis ada di INV26 `CC WTW` (PERBAIKAN …).

### 4e. Update BARUS (budget limit, sisa budget, penggunaan DC & Store) — **PARTIAL**
INV26 `Update barus`, blok "KODE STORE" (baris ±16–31). Label kolom budget dibuang gviz di tab ini, tetapi `NEW DASHBOARD` menampilkan label `Budget Limit` dan `Penggunaan Budget` → `DC` | `STORE`.
- HCI: baris `H019` kolom J–M = `RP46,758,915 | RP46,758,915 | RP0 | RP0` → Budget limit 46.758.915; sisa 46.758.915; pakai DC 0; pakai Store 0.
- AHI: baris `A017` kolom AA–AD = `RP0 | -RP785,660 | RP3,980 | RP781,680` → limit 0; sisa −785.660; DC 3.980; Store 781.680 (sisa = limit − DC − Store ✓).
- Daftar store (HCI J361, J337 …; AHI A592, A433 …) dengan qty dan nilai per store (AHI A592 6 qty Rp781.680 = 99%).
- Urutan kolom budget disimpulkan dari angka (tidak ada header di gviz) → **PARTIAL**: posisi sel tetap, rawan bergeser bila sheet diubah. Judul berganti tiap bulan.

---

## 5. Layout Gudang — **PARTIAL**

### Yang bisa digambar
1. **Master lokasi (paling cocok untuk grid)**: LAYH `Mst_Lokasi_All` (juga `Mst_Lokasi_HCI/AHI/TGI/FBI`). Ekspor WMS, satu baris per lokasi. Header:
   `MESSAGES | Location | Location Type | Location Category | Location Handling | ABC | Location Flag | Zone | Allow Items to Commingle in Location | Allow Lots to Commingle in Location | Lose LPN in location | Cubic Capacity | Weight Capacity | Route Sequence | Interleaving Sequence | Stack Limit | Foot Print | Height | Length | width | Location Level | X Coordinate | Y Coordinate | Z Coordinate | Orientation | Automatically ship picks when moved to the location | Section | Location Group ID`
   - Kode lokasi `A01.066.5` = lorong `A01` . bay `066` . level `5`; Zone `LORONG.A1`; `Location Level` 1–6; `Cubic Capacity` cm³ teks ("2,798,400"); `Section` = BU (HCI/AHI/TGI/FBI). X/Y/Z Coordinate = 0 (tidak dipakai) → posisi harus diturunkan dari kode (lorong × bay × level).
   - Jumlah lokasi per Section/Zone (query `select AA,H,count(B) group by AA,H`): **HCI ±4.234** (LORONG A1–A5, B1–B9, C1–C9, IN, WB1, WB2), **AHI 683** (A1–A3), FBI 78 (C9, C10), TGI 23; ±20 baris sampah di bawah (angka ringkasan CBM per BU).
2. **Layout visual**: LAYH/LAYA `Layout Loc` = grid sel seperti denah (judul area "AREA MHE", "AREA STAGE OUT AZKO"; sel berisi kode lokasi, kolom bay tiap ±8 kolom, level 1–5 menurun per baris, ±31 baris × ±80 kolom). Warna (dept/occupancy) tidak terbawa gviz. Bisa dipakai sebagai cetakan posisi (row/col sel → koordinat) bila ingin meniru denah persis.
3. LAYH `Layout CBM`: grid sama berisi kapasitas per sel (mis. 1584000 cm³) + ringkasan "LUAS GUDANG A": `LORONG | (luas/CBM, mis. 462.53) | (jumlah lokasi, mis. 554)` untuk AA, A01–A05, WA1, WA2, TOTAL.
4. `Heat Map` (LAYH dan LAYA): "LAYOUT HEAT MAP CAPASITY", blok LUAS GUDANG A/B/C, `LORONG | CAPASITY | OCCUPANCY` per lorong — **rusak (#REF!)** di kedua file.

### Occupancy per lokasi
- Butuh stok per lokasi: `Update Stock By Location` (LAYH header: `NO., STORERKEY, LOT, LOC, LOC CATEGORY, ID, SKU, DESCR, SKUGROUP, LOTVAL, UOM, QTY, QTY CARTON, QTY INNER, QTY EA, QTYALLOCATED, QTYPICKED, AVAILABLE, STATUS, EDITDATE, EDITWHO, NON ORPACK, COM LOT SKU, Expiry Date, TOEXPIREDAYS, LOTTABLE04, SHELF LIFE, FLAG, CM3, KET`). Occupancy lokasi = Σ CM3 per LOC / Cubic Capacity (Mst_Lokasi). Dept dari SKUGROUP.
- **Data basi**: LAYH 20.561 baris, `max(EDITDATE)` = **17 Okt 2025**; LAYA 4.844 baris, max EDITDATE **21 Apr 2026**. Tanpa ekspor stok baru, heat map tidak mencerminkan kondisi sekarang.
- Ukuran unduhan: Mst_Lokasi_All ±5.800 baris × 28 kolom (pilih kolom `B,H,L,U,AA` saja); stok per lokasi 20 rb baris (pilih `D,G,I,L,AC` + agregasi `select D,sum(AC) group by D` di gviz → satu baris per lokasi).

Status: geometri READY (dari kode lokasi Mst_Lokasi), occupancy per lokasi PARTIAL (sumber stok basi), dept per lokasi PARTIAL (SKUGROUP di stok basi; tab `Layout Dept`/`By Dept` belum dibaca).

URL:
- `.../d/LAYH/gviz/tq?tqx=out:csv&sheet=Mst_Lokasi_HCI&tq=limit%208`
- `.../d/LAYH/gviz/tq?tqx=out:csv&sheet=Mst_Lokasi_All&tq=select%20AA,H,count(B)%20group%20by%20AA,H`
- `.../d/LAYH/gviz/tq?tqx=out:csv&sheet=Update%20Stock%20By%20Location&tq=select%20count(D),sum(AC),max(T)`
- `.../d/LAYA/gviz/tq?tqx=out:csv&sheet=Update%20Stock%20By%20Location&tq=select%20count(A),max(T)`
- `.../d/LAYH/gviz/tq?tqx=out:csv&sheet=Layout%20Loc&headers=0&range=A1:BZ60`
- `.../d/LAYH/gviz/tq?tqx=out:csv&sheet=Heat%20Map&headers=0&range=A1:BZ50` (dan LAYA)

---

## Belum dibaca / tindak lanjut
- Tab kandidat root cause Pressing/Adjustment/Miss Cycle: INV26 `HCI`, `AZKO`, `Sheet31`, `Sheet26`, `Sheet18`; INV02 `Sheet2`, `Helper WTW HCI/AHI`.
- Sumber nilai Rp Sloc 1001 (damage) — tanya pemilik.
- LAYA `Mst_Lokasi`/`Master Loc`, `Layout Dept`, `By Dept` belum dibaca.
- Konfirmasi kapasitas HCI (6331 vs 7354) dan sumber occupancy AHI (SCR vs INV02 berbeda di Jan).
