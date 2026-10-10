// Perhitungan KPI Mini Monitoring dari baris Google Sheets (tanpa DOM): window.IMMKpi di aplikasi, module.exports di Node.
// Masukan: baris CSV mentah (array of array of string) dari IMMSrc. Keluaran: angka siap tampil, atau {missing:true, reason}.
// Sumber tiap KPI: specs/001-mini-monitoring/research.md (R6) dan research/*.md.
(function (root, factory) {
  const P = (typeof module === 'object' && module.exports) ? require('./parse-core.js') : root.IMMParse;
  const m = factory(P);
  if (typeof module === 'object' && module.exports) module.exports = m; else root.IMMKpi = m;
})(typeof self !== 'undefined' ? self : this, function (P) {
  const N = (v) => P.num(v);
  const n0 = (v) => P.num(v) || 0;
  const r2 = (x) => Math.round(x * 100) / 100;
  const miss = (reason) => ({ missing: true, reason: reason || 'Belum tersambung ke data' });
  const yearOf = (today) => +String(today).slice(0, 4);
  const has = (rows) => Array.isArray(rows) && rows.length > 1;
  const sum = (a, f) => a.reduce((t, x) => t + (f ? f(x) : x), 0);
  const cap100 = (x) => (x == null ? null : Math.min(100, x));

  // ---------- Akurasi / wall to wall (INV02 tab WTW HCI / WTW AHI) ----------
  function wtw(rows, today) {
    if (!has(rows)) return { rows: [], latest: null };
    const h = rows[0], c = (...n) => P.col(h, ...n);
    const iT = c('TGL'), iTg = c('TARGET'), iP = c('PLUS'), iM = c('MINUS'), iK = c('LOC KOSONG'), iR = c('RALISASI', 'REALISASI');
    const iTC = c('TOTAL COUNT'), iAC = c('ACCURASI COUNT'), iTQ = c('TOTAL QTY'), iAQ = c('ACCURASI QTY'), iD = c('DONE LOC'), iON = c('ON LOC');
    const ctx = { year: yearOf(today) };
    const out = [];
    for (const r of rows.slice(1)) {
      const date = P.date(r[iT], ctx); const target = n0(r[iTg]);
      if (!date || date > today || target <= 0) continue;
      const plus = n0(r[iP]), minus = n0(r[iM]);
      const grp = (i) => (i < 0 ? null : { loc: n0(r[i]), plus: n0(r[i + 1]), minus: n0(r[i + 2]), acc: cap100(P.pct(r[i + 3])) });
      out.push({ date, target, plus, minus, kosong: n0(r[iK]), aktual: n0(r[iR]), pct: r2((target - plus - minus) / target * 100),
        totalCount: n0(r[iTC]), accCount: P.pct(r[iAC]), totalQty: n0(r[iTQ]), accQty: P.pct(r[iAQ]),
        done: grp(iD), on: grp(iON), countDone: iD < 0 ? null : grp(iD + 4), qtyDone: iD < 0 ? null : grp(iD + 8) });
    }
    out.sort((a, b) => (a.date < b.date ? -1 : 1));
    return { rows: out, latest: out[out.length - 1] || null };
  }
  function akurasi(wH, wA, bu, today) {
    if (bu !== 'ALL' && bu !== 'HCI' && bu !== 'AHI') return miss('Cycle count hanya tersedia untuk HCI dan AHI');
    const L = { HCI: wtw(wH, today).latest, AHI: wtw(wA, today).latest };
    const use = (bu === 'ALL' ? ['HCI', 'AHI'] : [bu]).filter((b) => L[b]);
    if (!use.length) return miss('Belum ada data cycle count');
    const t = sum(use, (b) => L[b].target), bad = sum(use, (b) => L[b].plus + L[b].minus);
    const perBu = {}; use.forEach((b) => { perBu[b] = L[b]; });
    return { pct: r2((t - bad) / t * 100), target: t, selisih: bad, date: use.map((b) => L[b].date).sort().pop(), perBu };
  }

  // ---------- Occupancy (SCR OCCUPANCY HCI/AHI + INV02 Occupancy untuk FBI) ----------
  function occSeries(rows, today, kind) {
    if (!Array.isArray(rows)) return [];
    const ctx = { year: yearOf(today) }, out = [];
    if (kind === 'wide') {
      for (const r of rows) {
        const date = P.date(r[1], ctx), cap = N(r[3]), used = N(r[4]);
        if (!date || date > today || !cap || used == null) continue;
        out.push({ date, cap, used, inC: N(r[7]), outC: N(r[8]) });
      }
    } else if (rows.length > 1) {
      const h = rows[0], iT = P.col(h, 'TGL'), iC = P.col(h, 'Capasity', 'Capacity'), iU = P.col(h, 'Used Space'), iI = P.col(h, 'Inbound'), iO = P.col(h, 'Outbound');
      for (const r of rows.slice(1)) {
        const date = P.date(r[iT], ctx), cap = N(r[iC]), used = N(r[iU]);
        if (!date || date > today || !cap || !used) continue;
        out.push({ date, cap, used, inC: N(r[iI]), outC: N(r[iO]) });
      }
    }
    return out.sort((a, b) => (a.date < b.date ? -1 : 1));
  }
  function occupancy(oH, oA, oAll, bu, today) {
    const S = { HCI: occSeries(oH, today), AHI: occSeries(oA, today), FBI: occSeries(oAll, today, 'wide') };
    if (bu !== 'ALL' && !S[bu]) return miss('Occupancy ' + bu + ' belum ada di spreadsheet');
    const use = (bu === 'ALL' ? Object.keys(S) : [bu]).filter((b) => S[b].length);
    if (!use.length) return miss('Belum ada data occupancy');
    const perBu = {};
    use.forEach((b) => { const l = S[b][S[b].length - 1]; perBu[b] = { date: l.date, cap: l.cap, used: l.used, pct: r2(l.used / l.cap * 100) }; });
    const used = sum(use, (b) => perBu[b].used), cap = sum(use, (b) => perBu[b].cap);
    // arus masuk/keluar: hari terakhir yang sudah terisi (hari ini biasanya masih kosong)
    const flowDays = new Set(); use.forEach((b) => S[b].forEach((x) => { if (x.inC != null || x.outC != null) flowDays.add(x.date); }));
    const flowDate = [...flowDays].sort().pop() || null;
    const at = (b, d) => S[b].find((x) => x.date === d);
    const inCbm = flowDate ? sum(use, (b) => (at(b, flowDate) || {}).inC || 0) : null;
    const outCbm = flowDate ? sum(use, (b) => (at(b, flowDate) || {}).outC || 0) : null;
    const days = [...new Set(use.flatMap((b) => S[b].map((x) => x.date)))].sort().slice(-30);
    const trend = days.map((d) => { const xs = use.map((b) => at(b, d)).filter(Boolean); if (xs.length < use.length) return null; const u = sum(xs, (x) => x.used), c = sum(xs, (x) => x.cap); return { date: d, used: r2(u), cap: r2(c), pct: c ? r2(u / c * 100) : null, inC: sum(xs, (x) => x.inC || 0), outC: sum(xs, (x) => x.outC || 0) }; }).filter(Boolean);
    return { pct: r2(used / cap * 100), used: r2(used), cap: r2(cap), free: r2(cap - used), date: use.map((b) => perBu[b].date).sort().pop(), perBu, flowDate, inCbm: inCbm == null ? null : r2(inCbm), outCbm: outCbm == null ? null : r2(outCbm), trend };
  }

  // ---------- Barang damage (INV26 Update barus): SKU & qty ON HAND; nilai rupiah belum ada sumbernya ----------
  function damage(rows, bu) {
    const per = {};
    for (const r of rows || []) {
      r.forEach((c, i) => {
        const m = /^ON HAND\s+(HCI|AHI|AZKO)\b/i.exec(P.str(c));
        if (m) { const b = m[1].toUpperCase() === 'HCI' ? 'HCI' : 'AHI'; per[b] = { sku: n0(r[i + 1]), qty: n0(r[i + 2]) }; }
      });
    }
    let month = null; for (const r of rows || []) for (const c of r) { const m = /UPDATE BARUS\s+([A-Z]+\s+\d{4})/i.exec(P.str(c)); if (m && !month) month = m[1]; }
    if (bu !== 'ALL' && !per[bu]) return miss(bu === 'HCI' || bu === 'AHI' ? 'Belum ada data barang damage' : 'Data barang damage hanya untuk HCI dan AHI');
    const use = bu === 'ALL' ? Object.keys(per) : [bu];
    if (!use.length) return miss('Belum ada data barang damage');
    const perBu = {}; use.forEach((b) => { perBu[b] = per[b]; });
    return { sku: sum(use, (b) => per[b].sku), qty: sum(use, (b) => per[b].qty), value: null, valueReason: 'Nilai rupiah Sloc 1001 belum ada di spreadsheet', month, perBu };
  }

  // ---------- Laporan Daily Update (matriks KPI harian vs standar) ----------
  function ldMatrix(rows, today) {
    if (!Array.isArray(rows) || !rows.length) return null;
    const dateRow = rows.findIndex((r) => P.norm(r[1]) === 'PERFORMANCE');
    if (dateRow < 0) return null;
    return P.matrixDay(rows, { labelCol: 1, dateRow, firstDateCol: 4, year: yearOf(today) });
  }
  function slaOutbound(ldH, ldA, bu, today) {
    if (bu !== 'ALL' && bu !== 'HCI' && bu !== 'AHI') return miss('SLA Outbound hanya dilaporkan untuk HCI dan AHI');
    const M = { HCI: ldMatrix(ldH, today), AHI: ldMatrix(ldA, today) };
    const perBu = {};
    for (const b of bu === 'ALL' ? ['HCI', 'AHI'] : [bu]) {
      const m = M[b]; if (!m) continue;
      const d = m.last('SLA Customer', today); if (!d) continue;
      perBu[b] = { date: d, cust: P.pct(m.get('SLA Customer', d)), store: P.pct(m.get('SLA Store', d)), std: P.pct(m.cell('SLA Customer', 2)) };
    }
    const use = Object.keys(perBu);
    if (!use.length) return miss('Laporan Daily Update belum terbaca');
    const avg = (k) => { const v = use.map((b) => perBu[b][k]).filter((x) => x != null); return v.length ? r2(sum(v) / v.length) : null; };
    return { cust: avg('cust'), store: avg('store'), std: perBu[use[0]].std, date: use.map((b) => perBu[b].date).sort().pop(), perBu };
  }

  // ---------- Kontainer masuk (model Monitoring Kontainer: p = 0 POO, 1 Berlayar, 2 Yard, 3 Dooring, 4 Delivered) ----------
  function incoming(list, bu) {
    const z = () => ({ n: 0, te: 0 });
    const o = { poo: z(), otw: z(), pod: z(), total: z() };
    const key = ['poo', 'otw', 'pod'];
    for (const c of list || []) {
      if (bu !== 'ALL' && c.bu !== bu) continue;
      const k = key[c.p]; if (!k) continue;
      o[k].n++; o[k].te += +c.te || 0; o.total.n++; o.total.te += +c.te || 0;
    }
    return o;
  }


  // ---------- Laporan Daily Update: seluruh matriks dibaca per bagian ----------
  // Bagian dimulai di baris yang kolom C-nya "UoM"/"WHM" (judul = kolom B + kolom D), mis. "OUTSTANDING ORDER|AKAN DATANG",
  // "DC PROCESS|REALISASI", "UNLOADING|PLAN", "BACKLOG STORE|1-3". Baris "- DC" menempel pada baris induk di atasnya.
  function ld(rows, today) {
    if (!Array.isArray(rows) || !rows.length) return null;
    const dr = rows.findIndex((r) => P.norm(r[1]) === 'PERFORMANCE');
    if (dr < 0) return null;
    const ctx = { year: yearOf(today) }, cols = {}, dates = [];
    for (let c = 4; c < rows[dr].length; c++) { const d = P.date(rows[dr][c], ctx); if (d && !cols[d]) { cols[d] = c; dates.push(d); } }
    const secs = {}; let cur = 'PERFORMANCE', parent = '';
    secs[cur] = [];
    rows.forEach((r, i) => {
      if (i <= dr) return;
      const b = P.str(r[1]), c = P.str(r[2]).toUpperCase(), d = P.str(r[3]);
      if (!b && !c) return;
      if ((c === 'UOM' || c === 'WHM' || c === 'ASSET' || ['SLOC', 'INCOMING'].indexOf(P.norm(b)) >= 0) && b) { cur = P.norm(b) + (d ? '|' + P.norm(d) : ''); secs[cur] = secs[cur] || []; parent = ''; return; }
      if (!b) { if (cur && secs[cur]) secs[cur].push({ label: c, parent, unit: P.str(r[3]), row: i, sub: true }); return; }
      const isSub = /^-\s*/.test(b); const label = b.replace(/^-\s*/, '');
      const item = { label, parent: isSub ? parent : '', unit: P.str(r[2]), row: i, group: !P.str(r[2]) && !isSub };
      if (!isSub) parent = label;
      secs[cur].push(item);
    });
    const val = (it, d) => (it && cols[d] != null ? P.num(rows[it.row][cols[d]]) : null);
    function find(sec, label, par) { const a = secs[P.norm(sec)] || secs[sec] || []; const L = P.norm(label); return a.find((x) => P.norm(x.label) === L && (par == null || P.norm(x.parent) === P.norm(par))) || null; }
    function lastDay(sec, upTo) { const a = secs[P.norm(sec)] || []; for (let k = dates.length - 1; k >= 0; k--) { if (dates[k] > upTo) continue; if (a.some((it) => P.str(rows[it.row][cols[dates[k]]]) !== '')) return dates[k]; } return null; }
    return { dates, secs, cols, rows, val, find, lastDay,
      get(sec, label, d, par) { return val(find(sec, label, par), d); },
      std(label) { const it = find('PERFORMANCE', label); return it ? P.str(rows[it.row][2]) : ''; } };
  }
  // Satu bagian pada satu tanggal (atau tanggal terakhir yang terisi), dijumlah untuk beberapa BU.
  function ldSection(Ls, sec, day, today) {
    const use = Ls.filter(Boolean); if (!use.length) return null;
    let d = day;
    if (!d || !use.some((L) => (L.secs[P.norm(sec)] || []).some((it) => L.val(it, d) != null))) d = use.map((L) => L.lastDay(sec, today)).filter(Boolean).sort().pop();
    if (!d) return { date: null, items: [] };
    const out = []; const key = (it) => it.parent + '|' + it.label + '|' + it.unit;
    use.forEach((L) => (L.secs[P.norm(sec)] || []).forEach((it) => {
      let o = out.find((x) => key(x) === key(it)); if (!o) { o = { label: it.label, parent: it.parent, unit: it.unit, group: it.group, v: null }; out.push(o); }
      const v = L.val(it, d); if (v != null) o.v = (o.v || 0) + v;
    }));
    return { date: d, items: out };
  }

  // ---------- Storing AHI: case id & picking (DASHBOARD STORING & OUTBOUND AHI) ----------
  const LEVEL = (s) => { const t = P.norm(s); return t.indexOf('ATAS') >= 0 ? 'atas' : t.indexOf('BAWAH') >= 0 ? 'bawah' : t.indexOf('FLOOR') >= 0 || t === 'FLR' ? 'floor' : 'lain'; };
  function storing(caseRows, transRows, today) {
    const ctx = { year: yearOf(today) };
    const cr = (caseRows || []).slice(1).map((r) => ({ d: P.date(r[0], ctx), type: P.str(r[1]), lvl: LEVEL(r[2]), n: n0(r[3]) })).filter((x) => x.d && x.d <= today);
    const tr = (transRows || []).slice(1).map((r) => ({ d: P.date(r[0], ctx), lvl: LEVEL(r[1]), rak: P.str(r[2]).toUpperCase(), batch: P.str(r[3]).toUpperCase(), n: n0(r[4]), qty: n0(r[5]), cm3: n0(r[6]) })).filter((x) => x.d && x.d <= today);
    const days = [...new Set(cr.map((x) => x.d).concat(tr.map((x) => x.d)))].sort();
    if (!days.length) return miss('Belum ada case ID di sheet Storing');
    const day = days[days.length - 1];
    const C = cr.filter((x) => x.d === day), Tt = tr.filter((x) => x.d === day);
    const by = (a, k, f) => { const o = {}; a.forEach((x) => { o[x[k]] = (o[x[k]] || 0) + f(x); }); return o; };
    const rel = by(C, 'lvl', (x) => x.n), pick = by(Tt, 'lvl', (x) => x.n);
    const lv = ['bawah', 'atas', 'floor'].map((k) => ({ k, released: rel[k] || 0, picked: pick[k] || 0, open: Math.max(0, (rel[k] || 0) - (pick[k] || 0)) }));
    const released = sum(C, (x) => x.n), picked = sum(Tt, (x) => x.n);
    const rak = by(Tt, 'rak', (x) => x.n), shift = by(Tt, 'batch', (x) => x.n), type = by(C, 'type', (x) => x.n);
    return { date: day, released, picked, open: Math.max(0, released - picked), pct: released ? r2(Math.min(picked, released) / released * 100) : null,
      levels: lv, rak: Object.entries(rak).sort((a, b) => (a[0] === 'FLR' ? 1 : b[0] === 'FLR' ? -1 : a[0] < b[0] ? -1 : 1)), shift, type,
      qty: sum(Tt, (x) => x.qty), cbm: r2(sum(Tt, (x) => x.cm3) / 1e6) };
  }
  // Demand Picking (tab bulanan, tanpa tahun): grup OD, CID, SKU, QTY, CBM
  function dpDay(rows, day, today) {
    const ctx = { year: yearOf(today) };
    const r = (rows || []).find((x) => P.date(x[0], ctx) === day);
    if (!r) return null;
    const g = (i) => ({ od: n0(r[i]), cid: n0(r[i + 1]), sku: n0(r[i + 2]), qty: n0(r[i + 3]), cbm: n0(r[i + 4]) });
    return { date: day, grw: g(1), cust: g(6), total: g(11), transitStore: g(31) };
  }
  function dpRange(rows, today, n) { const out = []; for (let k = n - 1; k >= 0; k--) { const d = P.addDays(today, -k); const x = dpDay(rows, d, today); out.push({ d, v: x ? x.total.cbm : 0, x }); } return out; }

  // ---------- Planner (Dashboard Planner, tata letak tetap) ----------
  function planner(rows, bu) {
    if (!Array.isArray(rows) || !rows.length) return miss('Dashboard Planner belum terbaca');
    const blocks = {}; let cur = null;
    rows.forEach((r) => {
      const b = P.norm(r[1]);
      if (b === 'HCI' || b === 'AHI') { cur = b; blocks[cur] = blocks[cur] || {}; return; }
      if (b.indexOf('BY STORE') === 0) { cur = null; return; }
      if (cur && ['CUSTOMER RDC', 'CUSTOMER NDC', 'RT', 'TOTAL'].indexOf(b) >= 0 && !blocks[cur][b]) {
        const t = (i) => ({ od: n0(r[i]), cbm: n0(r[i + 1]), qty: n0(r[i + 2]) });
        blocks[cur][b] = { plan: t(3), real: t(6), pct: P.pct(r[9]), today: t(11), h1: t(15), h2: t(19), h3: t(23) };
      }
    });
    // aging intransit customer per store (kolom L = nama store, N..R = 1-3, 4-7, 8-15, 16-30, >30)
    const aging = []; let on = false;
    rows.forEach((r) => {
      if (P.norm(r[11]) === 'STORE/DAY') { on = true; return; }
      if (!on) return; const name = P.str(r[11]); if (!name) return;
      const v = [13, 14, 15, 16, 17].map((i) => N(r[i]) || 0); if (v.some((x) => x > 0)) aging.push({ store: name, v, total: r2(sum(v)) });
    });
    const use = (bu === 'ALL' ? ['HCI', 'AHI'] : [bu]).filter((b) => blocks[b] && blocks[b].TOTAL);
    if (!use.length) return miss(bu === 'HCI' || bu === 'AHI' || bu === 'ALL' ? 'Dashboard Planner belum terbaca' : 'Dashboard Planner hanya untuk HCI dan AHI');
    const add = (k, f) => { const o = { od: 0, cbm: 0, qty: 0 }; use.forEach((b) => { const x = blocks[b][k]; if (!x) return; const y = f(x); o.od += y.od; o.cbm += y.cbm; o.qty += y.qty; }); o.cbm = r2(o.cbm); return o; };
    const types = ['CUSTOMER RDC', 'CUSTOMER NDC', 'RT'].map((k) => ({ k, plan: add(k, (x) => x.plan), real: add(k, (x) => x.real) }));
    const total = { plan: add('TOTAL', (x) => x.plan), real: add('TOTAL', (x) => x.real) };
    total.pct = total.plan.cbm ? r2(total.real.cbm / total.plan.cbm * 100) : null;
    const out = ['today', 'h1', 'h2', 'h3'].map((k) => ({ k, ...add('TOTAL', (x) => x[k]) }));
    let title = ''; for (const r of rows.slice(0, 4)) for (const c of r) { const m = /\d{1,2}\s+[A-Z]+\s+\d{4}/i.exec(P.str(c)); if (m && !title) title = m[0]; }
    return { date: P.date(title, {}), types, total, outstanding: out, aging: bu === 'AHI' ? [] : aging, bus: use };
  }

  // ---------- Inventory ----------
  function virtualLoc(rows, bu) {
    if (!Array.isArray(rows) || !rows.length) return miss('Tab lokasi virtual belum terbaca');
    const date = P.date(rows[0] && rows[0][1], {}); const per = {}; let cur = null;
    rows.forEach((r) => {
      const b = P.norm(r[1]); if (b === 'HCI' || b === 'AHI') { cur = b; per[cur] = []; return; }
      if (!cur || !b || /\d{1,2} [A-Z]{3}/.test(b)) return;
      const buckets = [2, 4, 6, 8, 10, 12, 14, 16].map((i) => ({ qty: n0(r[i]), sku: n0(r[i + 1]) }));
      per[cur].push({ loc: b, qty: n0(r[18]), sku: n0(r[19]), cbm: n0(r[20]), old: { qty: n0(r[21]), sku: n0(r[22]) }, buckets });
    });
    const use = (bu === 'ALL' ? ['HCI', 'AHI'] : [bu]).filter((b) => per[b]);
    if (!use.length) return miss('Lokasi virtual hanya untuk HCI dan AHI');
    const merged = {}; use.forEach((b) => per[b].forEach((x) => { const m = merged[x.loc] || (merged[x.loc] = { loc: x.loc, qty: 0, sku: 0, cbm: 0, old: { qty: 0, sku: 0 }, buckets: x.buckets.map(() => ({ qty: 0, sku: 0 })) });
      m.qty += x.qty; m.sku += x.sku; m.cbm = r2(m.cbm + x.cbm); m.old.qty += x.old.qty; m.old.sku += x.old.sku; x.buckets.forEach((y, i) => { m.buckets[i].qty += y.qty; m.buckets[i].sku += y.sku; }); }));
    const pick = (k) => merged[k] || { loc: k, qty: 0, sku: 0, cbm: 0, old: { qty: 0, sku: 0 }, buckets: [] };
    return { date, intransit: pick('INTRANSIT'), pack: pick('PACK'), floor: pick('FLOOR'), all: Object.values(merged), BUCKETS: ['1-3', '4-10', '11-20', '21-30', '31-90', '91-150', '151-300', '301-500'] };
  }
  // Sloc 1007/1009 (tanpa baris judul): B tanggal, C..N HCI, P..AA AHI; tiap Sloc = SKU, QTY, VALUE
  const SLOCS = ['1007-', '1007+', '1009-', '1009+'];
  function sloc(rows, bu, today) {
    const ctx = { year: yearOf(today) };
    const ok = (rows || []).map((r) => ({ d: P.date(r[1], ctx), r })).filter((x) => x.d && x.d <= today && P.str(x.r[2]) !== '');
    if (!ok.length) return miss('Belum ada data Sloc 1007/1009');
    const last = ok[ok.length - 1];
    const blk = (start) => SLOCS.map((k, i) => ({ k, sku: n0(last.r[start + i * 3]), qty: n0(last.r[start + i * 3 + 1]), value: n0(last.r[start + i * 3 + 2]) }));
    const per = { HCI: blk(2), AHI: blk(15) };
    if (bu !== 'ALL' && !per[bu]) return miss('Sloc 1007/1009 hanya untuk HCI dan AHI');
    const use = bu === 'ALL' ? ['HCI', 'AHI'] : [bu];
    const items = SLOCS.map((k, i) => ({ k, sku: sum(use, (b) => per[b][i].sku), qty: sum(use, (b) => per[b][i].qty), value: sum(use, (b) => per[b][i].value) }));
    const trend = ok.slice(-14).map((x) => ({ d: x.d, value: sum(use, (b) => sum([0, 1, 2, 3], (i) => n0(x.r[(b === 'HCI' ? 2 : 15) + i * 3 + 2]))) }));
    return { date: last.d, items, perBu: per, trend };
  }
  // Cycle count per jenis (CC PICKING / CC MOVE): baris total teratas per BU → akurasi count
  function ccTotal(rows) {
    if (!Array.isArray(rows)) return null;
    const out = {};
    rows.forEach((r) => r.forEach((c, i) => { const b = P.norm(c); if ((b === 'HCI' || b === 'AHI') && !out[b]) out[b] = { col: i }; }));
    for (const b of Object.keys(out)) {
      const i = out[b].col; const r = rows.find((x) => N(x[i + 4]) > 0 && /%/.test(P.str(x[i + 5]))) || null;
      if (!r) { delete out[b]; continue; }
      out[b] = { plus: n0(r[i + 1]), minus: n0(r[i + 2]), hit: n0(r[i + 3]), total: n0(r[i + 4]), acc: P.pct(r[i + 5]) };
    }
    return out;
  }
  // Budget BARUS: blok KODE STORE, baris H019 (HCI) / A017 (AHI): limit, sisa, pakai DC, pakai Store
  function barusBudget(rows, bu) {
    const per = {};
    (rows || []).forEach((r) => r.forEach((c, i) => { const k = P.str(c); const b = k === 'H019' ? 'HCI' : k === 'A017' ? 'AHI' : null; if (b && P.num(r[i + 1]) != null) per[b] = { limit: n0(r[i + 1]), sisa: n0(r[i + 2]), dc: n0(r[i + 3]), store: n0(r[i + 4]) }; }));
    const use = (bu === 'ALL' ? ['HCI', 'AHI'] : [bu]).filter((b) => per[b]);
    if (!use.length) return miss('Budget BARUS hanya untuk HCI dan AHI');
    const t = (k) => sum(use, (b) => per[b][k]);
    return { limit: t('limit'), sisa: t('sisa'), dc: t('dc'), store: t('store'), perBu: per };
  }

  return { miss, wtw, akurasi, occSeries, occupancy, damage, ldMatrix, slaOutbound, incoming, ld, ldSection, storing, dpDay, dpRange, planner, virtualLoc, sloc, SLOCS, ccTotal, barusBudget };
});
