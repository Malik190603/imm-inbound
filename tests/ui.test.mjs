import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const U = require('../www/ui-core.js');
const eq = assert.equal, deepEq = assert.deepEqual, ok = assert.ok;
const near = (a, b, tol = 0.01) => ok(Math.abs(a - b) <= tol, `${a} ≉ ${b}`);

test('contrast', () => { near(U.contrast('#000000', '#ffffff'), 21); near(U.contrast('#777777', '#ffffff'), 4.48, 0.02); eq(U.contrast('#fff', '#fff'), 1); near(U.contrast('#ffffff', '#000000'), 21); });
test('weekDays', () => { deepEq(U.weekDays('2026-10-04'), ['2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09']); eq(U.weekDays('2026-12-31')[6], '2027-01-05'); eq(U.weekDays('2026-03-01')[0], '2026-02-28'); });
test('splitZeros', () => { const r = U.splitZeros([{ k: 'a', v: 2 }, { k: 'b', v: 0 }, { k: 'c', v: 1 }, { k: 'd', v: null }], (x) => x.v); deepEq(r.shown.map((x) => x.k), ['a', 'c']); deepEq(r.zeros.map((x) => x.k), ['b', 'd']); deepEq(U.splitZeros([], (x) => x), { shown: [], zeros: [] }); });
test('deltaInfo', () => { deepEq(U.deltaInfo(112, 100), { dir: 'up', pct: 12 }); deepEq(U.deltaInfo(88, 100), { dir: 'down', pct: 12 }); eq(U.deltaInfo(100.4, 100).dir, 'same'); eq(U.deltaInfo(5, 0), null); eq(U.deltaInfo(NaN, 10), null); eq(U.deltaInfo(10, Infinity), null); deepEq(U.deltaInfo(0, 50), { dir: 'down', pct: 100 }); });
test('glossary has the 13 terms, each with a title and a one-sentence explanation', () => {
  deepEq(Object.keys(U.GLOSSARY).sort(), ['bu', 'campur', 'cbm', 'dept', 'dooring', 'lc', 'leadtime', 'lpn', 'lppbdo', 'p90', 'teus', 'tto', 'yard']);
  for (const g of Object.values(U.GLOSSARY)) { ok(g.t.length > 1); ok(g.d.length > 20 && g.d.length < 220, g.t + ' ' + g.d.length); }
});

// ---------- kontras token warna (terang + gelap), setelah ui.css ----------
function tokens() {
  const html = fs.readFileSync(new URL('../www/index.html', import.meta.url), 'utf8'), css = fs.readFileSync(new URL('../www/ui.css', import.meta.url), 'utf8');
  const vars = (block) => Object.fromEntries([...block.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})/g)].map((m) => [m[1], m[2]]));
  const first = (src, re) => { const m = src.match(re); return m ? vars(m[1]) : {}; };
  const light = { ...first(html, /:root\{([\s\S]*?)\}/), ...first(css, /:root\{([\s\S]*?)\}/) };
  const dark = { ...light, ...first(html, /:root\[data-theme="dark"\]\{([\s\S]*?)\}/), ...first(css, /:root\[data-theme="dark"\]\{([\s\S]*?)\}/) };
  return { light, dark };
}
test('text tokens meet 4.5:1 on their surfaces in light and dark', () => {
  const T = tokens(); const pairs = [];
  for (const [name, t] of Object.entries(T)) {
    for (const ink of ['--ink', '--ink-2', '--ink-3']) for (const bg of ['--surface', '--surface-2', '--bg', '--sunk']) pairs.push([name, ink, bg, U.contrast(t[ink], t[bg])]);
    for (const k of ['good', 'warn', 'crit']) for (const bg of ['--' + k + '-bg', '--surface', '--surface-2']) pairs.push([name, '--' + k, bg, U.contrast(t['--' + k], t[bg])]);
    pairs.push([name, '--accent-ink', '--accent', U.contrast(t['--accent-ink'], t['--accent'])]);
  }
  const bad = pairs.filter((p) => !(p[3] >= 4.5)).map((p) => `${p[0]} ${p[1]} on ${p[2]} = ${p[3].toFixed(2)}`);
  deepEq(bad, []);
});
test('dark media-query block and data-theme block define the same overrides in ui.css', () => {
  const css = fs.readFileSync(new URL('../www/ui.css', import.meta.url), 'utf8');
  const a = css.match(/@media \(prefers-color-scheme: dark\)\{:root:not\(\[data-theme="light"\]\)\{([\s\S]*?)\}\}/), b = css.match(/:root\[data-theme="dark"\]\{([\s\S]*?)\}/);
  ok(a && b); eq(a[1].replace(/\s+/g, ''), b[1].replace(/\s+/g, ''));
});
test('compact shortens only numbers that would not fit (≥ 10.000)', () => {
  eq(U.compact(0), null); eq(U.compact(9999.4), null); eq(U.compact(NaN), null);
  eq(U.compact(10000), '10 rb'); eq(U.compact(12345), '12,3 rb'); eq(U.compact(123456), '123 rb'); eq(U.compact(999999), '1 jt');
  eq(U.compact(1234567), '1,2 jt'); eq(U.compact(25800000), '25,8 jt'); eq(U.compact(123456789), '123 jt'); eq(U.compact(2.5e9), '2,5 M');
});
