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

  return { miss, wtw, akurasi, occSeries, occupancy, damage, ldMatrix, slaOutbound, incoming };
});
