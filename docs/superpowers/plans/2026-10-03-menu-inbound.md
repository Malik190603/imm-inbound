# IMM v1.3.0 — Inbound menu, Role menu, forced update: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a password-locked Inbound menu (Putaway with photos, TTO/Dokumen, Productivity, MPP detail), merge Storing+Outbound into a Role menu, make updates mandatory, and trim Pengaturan.

**Architecture:** The app stays a static Capacitor web app. New pure logic lives in `www/inbound-core.js` (unit-tested with `node --test`), Supabase access in `www/store.js`, Inbound UI in `www/inbound.js` + `www/inbound.css`; `www/index.html` keeps the shell and existing pages. Sheets are read through the existing `gviz()` CSV path; photos and TTO rows go to a new Supabase project over plain `fetch`.

**Tech Stack:** Vanilla JS, Capacitor 8 (CapacitorHttp, CapacitorUpdater — no new native plugins), Supabase REST + Storage, `node --test`, Playwright (local only).

**Spec:** `docs/superpowers/specs/2026-10-03-menu-inbound-design.md`

## Global Constraints

- (Revised after final review) v1.3.0 adds `<queries>` for `IMAGE_CAPTURE` to `AndroidManifest.xml`, so it is a new native base and ships as an APK. No new plugins or dependencies.
- `package.json` version becomes `1.3.0`.
- UI copy is Indonesian. Units: CBM = CM3 ÷ 1,000,000; containers stay in TEUs.
- Customer personal names are never shown.
- LPN prefix `ID` = good, `RC` = damage (case-insensitive, two letters only).
- Putaway rows: `Trantype` = Move, `Source type` = NSPRFPA02, `Toloc` starts with FLR — all case-insensitive, trimmed.
- Sheet columns are located by header text, never by position.
- Operators counted: 129057 Armin Rahman, 148453 Akmal, 187606 Muh Putra Abidzar, 188400 Muh Aditya Putra, 192831 M Fikri Firmansyah — matched by ID prefix.
- Password `<sandi>` never appears in the repo; only `sha256(PW_SALT + password)`. Unlock lasts 2 hours.
- Max 4 photos per LPN and per TTO; each photo ≤ 1280 px longest side, JPEG, stamped with `DD/MM/YYYY HH:mm WITA` plus LPN + Toloc (Putaway) or No TTO (TTO).
- Commits: identity `Claude <noreply@anthropic.com>`, message sections "Untuk pengguna:" / "Untuk developer:", trailers as in earlier commits. Push to `dev` only; `main` only on the user's "gaspol".
- Fixtures in `tests/` are synthetic; real sheet data stays in the gitignored `test/`.

## Review Focus

1. A sheet header is renamed or missing → the page shows "Kolom X tidak ditemukan di sheet …", other Inbound pages keep working. (Task 1 test `missingHeaders`, Task 3 e2e.)
2. A row has an empty or unparseable `Date` → the row is skipped, never counted under another day; transit `Date` is M/D/YYYY even though `Received At` is D/M/YYYY. (Task 1 tests.)
3. Photo upload fails (offline, Supabase down) → nothing is shown as saved, a toast says it failed, the user can retry, and the 4-photo limit still counts only stored photos. (Task 5 e2e.)
4. Two phones add photos to the same LPN → the count is re-read from Supabase just before upload so the total never passes 4. (Task 5 unit test on `IMMStore.addPutawayPhoto`.)
5. Phone clock moved → an unlock timestamp in the future counts as expired. (Task 1 test `unlockValid`.)

---

## File structure

| File | Responsibility |
|---|---|
| `www/inbound-core.js` (new) | Pure logic + constants: header mapping, dates, putaway grouping, productivity, password hash, unlock window, stamp text. Exposes `IMMCore` (browser global and `module.exports`). |
| `www/store.js` (new) | Supabase REST/Storage calls and photo preparation (resize + stamp). Exposes `IMMStore`. |
| `www/inbound.js` (new) | Inbound pages: lock gate, list, Putaway, LPN detail, TTO, Productivity, MPP. Exposes `pageInbound()`, `inboundClick(e)`, `inboundBack()`. |
| `www/inbound.css` (new) | Styles for the above. |
| `www/index.html` (modify) | Nav (5 menus), Role page with tabs, forced-update gate, Pengaturan cleanup, script/style tags. |
| `supabase/schema.sql` (new) | Tables, bucket, policies. |
| `scripts/check.mjs` (modify) | Syntax-check `www/*.js`; require the new sheet gids. |
| `.github/workflows/build-apk.yml` (modify) | Run `node --test tests/` before building. |
| `tests/core.test.mjs`, `tests/store.test.mjs`, `tests/fixtures/*.csv` (new) | Unit tests. |
| `test/e2e-inbound.js` (new, gitignored) | Playwright run against mocked sheets + mocked Supabase. |

---

### Task 1: Core logic (`IMMCore`)

**Files:** Create `www/inbound-core.js`, `tests/core.test.mjs`, `tests/fixtures/stock.csv`, `tests/fixtures/transit.csv`.

**Interfaces — Produces:**
- `OPERATORS: {id:string,name:string}[]`, `PICS: string[]` (Aan, Ramadhan, Malik, Armin, Akmal, Abi, Adit, Fikri), `MPP: {name,title,bu}[]` (9 people, spec table order).
- `toObjects(rows: string[][]): {headers: string[], rows: Record<string,string>[]}` — first row = headers, trimmed.
- `missingHeaders(headers: string[], needed: string[]): string[]`
- `STOCK_HEADERS`, `TRANSIT_HEADERS: string[]` — the headers each sheet must have.
- `usDate(s: string): string` — `M/D/YYYY` → `YYYY-MM-DD`, else `''`.
- `lpnKind(id: string): 'good'|'damage'|'other'`
- `putawayLpns(rows, {from,to,bu}): Lpn[]` where `Lpn = {lpn, kind, tolocs: string[], depts: string[], mixed: boolean, qty: number, cbm: number, date, time, operator, bu, items: {sku,desc,dept,qty,toloc}[]}`, newest first. `bu` = `'ALL'` or a Storerkey.
- `productivity(stockRows, transitRows, {from,to,bu}): {team:{rcv,put}, ops:{id,name,rcv,put,rcvStock,rcvTransit,putStock,putTransit}[], days:{d,rcv,put}[]}` — `ops` always has all 5 operators, sorted by `rcv+put` descending.
- `checkPassword(pw: string): Promise<boolean>`, `unlockValid(ts: number, now: number): boolean`
- `stampText(d: Date): string` — `DD/MM/YYYY HH:mm WITA` in Asia/Makassar.

- [ ] **Step 1: Write fixtures.** `stock.csv` with the real header row (`No,Storerkey,Trantype,SKU,Description,Sku Group,Lot,Fromloc,Fromid,Toloc,Toid,Sourcekey,Qty,Adddate,Addwho,Username,Extern,Doc No,Expired date,Source type,Trans No,CM3,Tanggal (WITA),Date,Jam (WITA),Rentang Jam,Kategori,Kategori Brand,Fromid=Toid?,Hitung Produktivitas?,Id Operator,Username Operator,Unreceive?,CM3 (Final)`) and synthetic rows covering: a Move/NSPRFPA02/FLR LPN `ID001` with two SKUs of one dept; `RC001` with two depts; a Move row to `STAGE`; a Move row with another source type; a `move`/`nsprfpa02`/`flr-01` lowercase row; a blank `Toid`; Receiving and Putaway rows for 2 operators with `Hitung Produktivitas?` Ya and Tidak; an operator not in the list; a row with empty `Date`. `transit.csv` with the real header row (`LC,Case ID,Sku,SKU Description,Order Key,Extern Order,Status Order,Mega DO,Owner,Ship From,Ship To,Qty Expected,CBM Expected,Qty Received,CBM Received,Selisih,Status,Received At,Received By,Loc,Remark,Tanggal (WITA),Date,Jam (WITA),Rentang Jam,Hitung Transit?`) with Ya/Tidak rows and one unknown receiver.
- [ ] **Step 2: Write failing tests** in `tests/core.test.mjs` (`node:test`, `node:assert/strict`):

```js
test('lpnKind', () => { eq(C.lpnKind('ID00244984'),'good'); eq(C.lpnKind('rc0012'),'damage'); eq(C.lpnKind('X1'),'other'); eq(C.lpnKind(''),'other'); });
test('usDate', () => { eq(C.usDate('07/31/2026'),'2026-07-31'); eq(C.usDate('8/3/2026'),'2026-08-03'); eq(C.usDate(''),''); eq(C.usDate('31 Jul'),''); });
test('missingHeaders', () => { deepEq(C.missingHeaders(['Toid','Toloc'],['Toid','Trantype']),['Trantype']); });
test('putaway keeps only Move + NSPRFPA02 + FLR', () => { const l=C.putawayLpns(stock,{from:D,to:D,bu:'ALL'}); deepEq(l.map(x=>x.lpn).sort(),['ID001','ID002','RC001']); });
test('putaway flags mixed dept and damage', () => { const rc=byLpn('RC001'); eq(rc.kind,'damage'); eq(rc.mixed,true); eq(rc.depts.length,2); eq(byLpn('ID001').mixed,false); });
test('putaway sums qty and cbm, filters BU and date', () => { eq(byLpn('ID001').qty,20); eq(byLpn('ID001').cbm,1.5); eq(C.putawayLpns(stock,{from:D,to:D,bu:'AHI'}).length,1); eq(C.putawayLpns(stock,{from:'2026-01-01',to:'2026-01-01',bu:'ALL'}).length,0); });
test('productivity: stock uses CM3 for Receiving, CM3 (Final) for Putaway, only Ya', () => { const p=C.productivity(stock,[],opt); eq(op(p,'192831').rcvStock,2); eq(op(p,'192831').putStock,3); });
test('productivity: transit counts the same CBM for receive and putaway', () => { const p=C.productivity([],transit,opt); eq(op(p,'148453').rcvTransit,2.3); eq(op(p,'148453').putTransit,2.3); });
test('productivity: unknown operators and empty dates are ignored; all 5 operators listed', () => { const p=C.productivity(stock,transit,opt); eq(p.ops.length,5); eq(p.team.rcv, sum(p.ops,'rcv')); });
test('password', async () => { eq(await C.checkPassword('<sandi>'),true); eq(await C.checkPassword('inbound78'),false); });
test('unlockValid', () => { const H=3600e3; eq(C.unlockValid(1000,1000+2*H-1),true); eq(C.unlockValid(1000,1000+2*H),false); eq(C.unlockValid(5000,1000),false); eq(C.unlockValid(0,1000),false); });
test('stampText', () => { eq(C.stampText(new Date('2026-10-03T12:05:00Z')),'03/10/2026 20:05 WITA'); });
```

Fixture numbers are chosen so the expected values above hold (e.g. `ID001`: qty 12 + 8, CM3 1,000,000 + 500,000).
- [ ] **Step 3: Run** `node --test tests/` — expect failures ("Cannot find module" / not a function).
- [ ] **Step 4: Implement `www/inbound-core.js`.** UMD wrapper: `(function(root,f){const m=f();if(typeof module==='object')module.exports=m;else root.IMMCore=m})(this,function(){…})`. Hash with `crypto.subtle.digest('SHA-256', …)`; `PW_SALT='imm-tallo:'`; `PW_HASH` = the hex of `sha256('imm-tallo:<sandi>')` computed once and pasted as a literal. Operator match: `String(v).trim().startsWith(id)`. Numbers parsed with `parseFloat(String(v).replace(/,/g,''))||0`. CBM rounded to 6 decimals when summing.
- [ ] **Step 5: Run** `node --test tests/` — all pass. `grep -rn "<sandi>" www scripts` — no output.
- [ ] **Step 6: Commit.**

### Task 2: Shell — nav, Role menu, Inbound lock, MPP

**Files:** Modify `www/index.html` (nav definition, `S`, `setPage`, `render`, back-button handler, filter defaults, script/style tags). Create `www/inbound.js`, `www/inbound.css`. Create `test/e2e-inbound.js`.

**Interfaces — Consumes:** `IMMCore.checkPassword`, `unlockValid`, `MPP`.
**Produces:**
- `S.page` values: `'home'|'inb'|'role'|'mon'|'set'`; `S.roleTab: 'stock'|'out'`; `S.inb: ''|'put'|'tto'|'prod'|'mpp'`; `S.f.inb` (default preset today, BU all); `S.f.stock` and `S.f.out` unchanged.
- `pageRole()` in `index.html`: `seg('roleTab',[['stock','Storing'],['out','Outbound']],S.roleTab)` followed by `pageStock()` or `pageOut()`; `F()` returns `S.f[S.roleTab]` while on the Role page.
- In `inbound.js`: `pageInbound(): string`, `inboundClick(e): boolean` (true = handled), `inboundBack(): boolean`.
- `LS` key `imm.inb.unlock` = timestamp (ms).

- [ ] **Step 1: Write the e2e** (Playwright, mobile 400×860, mocked gviz as in `test/run9.js`, `imm.role` pre-set in localStorage). Assertions: nav has exactly the labels `Beranda, Inbound, Role, Monitoring, Pengaturan`; Role shows tabs and switching to Outbound shows the Outbound page heading; tapping Inbound shows the password field and no list; wrong password shows "Sandi salah" and stays locked; `<sandi>` shows 4 rows `Putaway, TTO/Dokumen, Productivity, MPP detail`; leaving and returning within 2 h does not ask again; setting `imm.inb.unlock` to `Date.now()-2*3600e3-1` asks again; MPP page lists 9 names and contains "Assistant Manager"; `document.documentElement.scrollWidth === 400` on every page.
- [ ] **Step 2: Run** `NODE_PATH=$(npm root -g) node test/e2e-inbound.js` — fails.
- [ ] **Step 3: Implement.** Nav order and icons: Beranda `I.home`, Inbound `I.box`, Role `I.users`, Monitoring `I.mon`, Pengaturan `I.set`. The lock is a page state, not a modal: `pageInbound()` returns the password form while `!unlockValid(LS.get('imm.inb.unlock'),Date.now())`. Password input `type="password"`, `autocomplete="off"`, submit on Enter and on the "Buka" button. Sub-pages render under a header with a back button; Android back and `inboundBack()` return to the list. The global filter strip shows on Inbound sub-pages `put`, `tto`, `prod` only.
- [ ] **Step 4: Run** the e2e — passes. Run `node test/run5.js` and `node test/run7.js` — existing Monitoring screens still render without page errors.
- [ ] **Step 5: Commit.**

### Task 3: Inbound data + Putaway page (no photos)

**Files:** Modify `www/inbound.js`, `www/inbound.css`, `www/index.html` (source constants only). Extend `test/e2e-inbound.js`.

**Interfaces — Consumes:** `gviz({doc,gid,sheet,csv:true,tq,h})`, `IMMCore.toObjects/missingHeaders/putawayLpns`, `sheet()/sHead()`, `searchBox`, `lim`, `moreBtn`, `emptyState`, `range()`, `F()`.
**Produces:** `DOC_INB='1crYUpCJSYHrfBbZ99aUee3v4hRJrxWw4XRIryl9rong'`, `GID_STOCK='349104626'`, `GID_TRANSIT='2022396471'`; `INB = {state:'idle'|'loading'|'ok'|'error', stock: Record[], transit: Record[], err: {stock?:string, transit?:string}, at}`; `loadInbound(force?): Promise<void>` (called on first unlock and by pull-to-refresh on Inbound); `openLpn(lpn: string)`.

- [ ] **Step 1: Extend the e2e.** Route `gid=349104626` and `gid=2022396471` to `tests/fixtures/*.csv` with dates rewritten to today. Assert: Putaway shows 3 cards; the `RC001` card has class `dmg` and the text "Damage"; it shows "Campur Dept"; `ID001` does not; summary row shows `3 LPN · 1 damage · 1 campur Dept`; tapping `ID001` opens a sheet listing its 2 SKUs with dept and qty; search "RC" leaves 1 card; with BU filter AHI only AHI LPNs remain; a fixture missing the `Toid` header shows "Kolom Toid tidak ditemukan".
- [ ] **Step 2: Run** — fails.
- [ ] **Step 3: Implement.** Query `select *` (CSV) for both sheets; cache the parsed rows in memory only (not localStorage — too large). Card: LPN (mono), Toloc(s), `n SKU · qty · CBM`, time + operator; red treatment via `.lpn.dmg` using `--crit`/`--crit-bg`; warning chip uses `--warn`. 20 cards then `moreBtn`.
- [ ] **Step 4: Run** the e2e — passes, light and dark, no horizontal overflow.
- [ ] **Step 5: Commit.**

### Task 4: Productivity page

**Files:** Modify `www/inbound.js`, `www/inbound.css`. Extend `test/e2e-inbound.js`.

**Interfaces — Consumes:** `IMMCore.productivity`, `INB`, `insights()`, `stackChart()`, `cnt()`, `f1/f2`.

- [ ] **Step 1: Extend the e2e.** With the fixtures: team totals equal the unit-test numbers; 5 operator cards in descending order; the top card carries rank 1; each card shows Receive and Putaway with a stock/transit split; an operator with no rows shows `0`; the insight carousel contains "Tertinggi"; the daily chart exists when the range spans more than one day and is absent for a single day.
- [ ] **Step 2: Run** — fails.
- [ ] **Step 3: Implement.** Layout: two team tiles (Receive CBM, Putaway CBM, 2 decimals) → `insights('Ringkasan pintar', …)` with: tertinggi (name + CBM), porsi (top share of team %), perbandingan vs the previous period of equal length (omit for presets without bounds), kontribusi transit vs stock → operator cards (rank, name, two bars sharing one scale, split text) → `stackChart` per day (series Receive, Putaway). If one sheet failed, compute from the other and show its error line above the cards.
- [ ] **Step 4: Run** — passes.
- [ ] **Step 5: Commit.**

### Task 5: Supabase store + photos on Putaway

**Files:** Create `www/store.js`, `supabase/schema.sql`, `tests/store.test.mjs`. Modify `www/inbound.js`, `www/inbound.css`, `www/index.html` (script tag). Extend `test/e2e-inbound.js`.

**Interfaces — Produces (`IMMStore`):**
- `SUPA = {url:'', key:''}` literals (filled when the user sends them); `configured(): boolean`.
- `photoUrl(path: string): string` → `${url}/storage/v1/object/public/imm-photos/${path}`.
- `listPutawayPhotos(lpns: string[]): Promise<{id,lpn,toloc,path,created_at}[]>`
- `addPutawayPhoto(lpn, toloc, blob): Promise<row>` — re-reads the count for that LPN first; rejects with `Error('MAX')` at 4; uploads to `putaway/<lpn>/<ts>-<rand>.jpg`, then inserts the row; if the insert fails it deletes the uploaded object.
- `removePutawayPhoto(row): Promise<void>` — deletes row, then object.
- `preparePhoto(file: Blob, lines: string[]): Promise<Blob>` — longest side 1280, white text on a dark strip at the bottom, JPEG quality 0.72. Browser only.
- All calls use `fetch` with headers `apikey` and `Authorization: Bearer <key>`; `fetchImpl` is injectable for tests (`IMMStore._setFetch(fn)`).

`schema.sql`: table `putaway_photos(id bigint identity primary key, lpn text not null, toloc text, path text not null, device text, created_at timestamptz default now())` with index on `lpn`; table `tto(id bigint identity primary key, tgl date not null, no_tto text not null, barang text not null, koli integer not null, pic text not null, penerima text not null, photos text[] not null default '{}', device text, created_at timestamptz default now())`; RLS enabled on both with policies allowing `select`, `insert`, `delete` to `anon`; public bucket `imm-photos` with storage policies allowing `select`, `insert`, `delete` to `anon` for that bucket; file size limit 1 MB, mime `image/jpeg`.

- [ ] **Step 1: Write failing unit tests** (`tests/store.test.mjs`, fake fetch recording calls):

```js
test('addPutawayPhoto rejects MAX when 4 already stored', async () => { fake.count=4; await rejects(S.addPutawayPhoto('ID001','FLR-01',blob), /MAX/); eq(fake.uploads,0); });
test('addPutawayPhoto uploads then inserts', async () => { fake.count=1; const r=await S.addPutawayPhoto('ID001','FLR-01',blob); match(r.path,/^putaway\/ID001\//); deepEq(fake.order,['count','upload','insert']); });
test('failed insert removes the uploaded object', async () => { fake.failInsert=true; await rejects(S.addPutawayPhoto('ID001','FLR-01',blob)); eq(fake.deleted.length,1); });
test('configured is false with empty SUPA', () => { eq(S.configured(),false); });
```
- [ ] **Step 2: Run** `node --test tests/` — new tests fail.
- [ ] **Step 3: Implement `store.js` and `schema.sql`.** Run tests — pass.
- [ ] **Step 4: Extend the e2e** (mock `**/rest/v1/**` and `**/storage/v1/**`; inject a test PNG through the file input): LPN detail shows "Foto (0/4)" with buttons "Kamera" and "Galeri"; after adding one, a thumbnail appears, the label reads "Foto (1/4)" and the card shows a camera mark with `1`; the uploaded blob is `image/jpeg`, ≤ 1280 px, and its bottom strip is not the original pixels (stamp drawn); at 4 photos both buttons are disabled; a 500 from storage shows the toast "Foto gagal diunggah" and the count stays; delete asks for confirmation and removes the thumbnail; with `configured()` false the section shows "Penyimpanan foto belum diatur".
- [ ] **Step 5: Implement the UI.** Two hidden inputs: `<input type="file" accept="image/*" capture="environment">` (Kamera) and `<input type="file" accept="image/*">` (Galeri). Stamp lines: `[stampText(new Date()), lpn + ' → ' + toloc]`. Photos for the visible LPN list are fetched in one call after the list renders; a viewer sheet shows the full image. Summary row gains "n belum ada foto".
- [ ] **Step 6: Run** unit + e2e — pass.
- [ ] **Step 7: Commit.**

### Task 6: TTO/Dokumen

**Files:** Modify `www/store.js`, `www/inbound.js`, `www/inbound.css`, `tests/store.test.mjs`. Extend `test/e2e-inbound.js`.

**Interfaces — Produces (`IMMStore`):** `listTto({from,to}): Promise<Tto[]>` (by `tgl`, newest first), `addTto(entry: {tgl,no_tto,barang,koli,pic,penerima}, blobs: Blob[]): Promise<Tto>` (uploads to `tto/<id-safe no_tto>/<ts>-<n>.jpg`, then inserts with `photos`; removes uploaded objects if the insert fails), `removeTto(row): Promise<void>`.

- [ ] **Step 1: Unit tests:** `addTto` with 2 blobs uploads 2 objects then inserts once with 2 paths; failed insert deletes both; `addTto` with 5 blobs rejects `MAX`.
- [ ] **Step 2: e2e:** the page has a "Tambah TTO" button opening a form with exactly the fields Tanggal serah terima (today), No TTO, Nama barang, Jumlah koli, PIC yang menyerahkan (8 options in spec order), Penerima, Dokumentasi; submitting empty marks required fields and sends nothing; `koli` rejects 0 and non-numbers; a valid submit shows the entry in the list and the toast "TTO tersimpan"; search by No TTO filters; detail shows photos; delete confirms then removes; photo stamp second line is the No TTO.
- [ ] **Step 3: Run** both — fail. **Step 4: Implement.** **Step 5: Run** — pass. **Step 6: Commit.**

### Task 7: Forced update + Pengaturan cleanup

**Files:** Modify `www/index.html`. Create `test/e2e-update.js`.

**Interfaces — Consumes:** existing `checkForUpdate`, `runUpdate`, `liveCompatible`, `verNewer`. **Produces:** `enforceUpdate(): void` — renders `#updGate` (full-screen, z-index above everything, not dismissible) whenever `S.upd` is set.

- [ ] **Step 1: e2e** (mock `releases/latest`): with a newer tag the gate covers the app, shows the new version, a "Perbarui" button and "Keluar", and Android back does not close it; with the same tag there is no gate; with the API failing there is no gate and the app works; nothing with id `whatsNew` exists; Pengaturan has no "Muat ulang data", "Hapus data tersimpan", "Aturan perhitungan" or "Yang baru"; the Data card lists three sources including "Inbound (stock & transit)"; the Pengguna card shows "Per role" and "Role kamu" and no "perangkat"/"unduhan APK".
- [ ] **Step 2: Run** — fails.
- [ ] **Step 3: Implement.** Remove `showWhatsNew`, `loadStats`, `usersCard`'s download block and their callers; keep `rolesBlock`. `checkForUpdate` runs at boot, on resume after 5 minutes (existing), and on the `online` event; it calls `enforceUpdate()`. The gate reuses `runUpdate()` and its progress bar; "Keluar" calls `PL.App.exitApp()`.
- [ ] **Step 4: Run** — passes; re-run `test/e2e-inbound.js`.
- [ ] **Step 5: Commit.**

### Task 8: Build wiring, docs, full verification

**Files:** Modify `scripts/check.mjs`, `.github/workflows/build-apk.yml`, `package.json` (version `1.3.0`, script `"test": "node --test tests/"`), `README.md`. Rebuild `/home/claude/app/imm-inbound.html` preview with the new files inlined.

- [ ] **Step 1:** `check.mjs`: syntax-check every `www/*.js` with `vm.Script`; fail if `index.html` does not reference `inbound-core.js`, `store.js`, `inbound.js`, `inbound.css`; fail if the gids `349104626` / `2022396471` are absent; fail if the literal `<sandi>` appears anywhere under `www/`; add the pattern `/service_role/` to the secret scan.
- [ ] **Step 2:** Workflow: add `node --test tests/` after the existing check step.
- [ ] **Step 3:** Confirm no native change: `node scripts/live.mjs base` locally prints the same `LIVE_HASH` as the v1.2.6 release marker (`2152224e5fc8f4ec9c54451d`).
- [ ] **Step 4:** Run everything: `node --test tests/`, `node scripts/check.mjs`, `test/e2e-inbound.js`, `test/e2e-update.js`, `test/run5.js`, `test/run7.js`, `test/run9.js` — all pass, no `pageerror`.
- [ ] **Step 5:** README: new sheets and headers, Supabase setup (run `supabase/schema.sql`, where URL and anon key go), the Inbound password rule.
- [ ] **Step 6:** Commit, push to `dev`, republish the preview artifact. Release only on "gaspol", and only after `SUPA.url`/`SUPA.key` are filled.
