// Pemeriksaan sebelum rilis (dijalankan di GitHub Actions). Gagal = tidak ada rilis.
// 1) sintaks skrip di www/index.html  2) konfigurasi valid  3) tidak ada kunci rahasia ikut ke APK
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let bad = 0;
const fail = (m) => { bad++; console.error('✗ ' + m); };
const ok = (m) => console.log('✓ ' + m);

const htmlPath = path.join(ROOT, 'www', 'index.html');
if (!fs.existsSync(htmlPath)) { console.error('www/index.html tidak ada'); process.exit(1); }
const html = fs.readFileSync(htmlPath, 'utf8');
const re = /<script>([\s\S]*?)<\/script>/g;
let m, n = 0;
while ((m = re.exec(html))) {
  n++;
  try { new vm.Script(m[1], { filename: 'index.html#script' + n }); }
  catch (e) { fail('index.html skrip ke-' + n + ': ' + e.message); }
}
if (!n) fail('tidak ada skrip di index.html'); else ok(n + ' skrip di index.html');
// file .js terpisah di www/ (kecuali config.js yang dibuat saat build)
const jsFiles = fs.readdirSync(path.join(ROOT, 'www')).filter((f) => f.endsWith('.js') && f !== 'config.js');
for (const f of jsFiles) {
  try { new vm.Script(fs.readFileSync(path.join(ROOT, 'www', f), 'utf8'), { filename: f }); }
  catch (e) { fail(f + ': ' + e.message); }
}
ok(jsFiles.length + ' file .js di www/');
for (const f of ['inbound-core.js', 'store.js', 'inbound.js', 'inbound.css']) {
  if (!fs.existsSync(path.join(ROOT, 'www', f))) fail('www/' + f + ' tidak ada');
  else if (!html.includes('"' + f + '"')) fail('index.html tidak memuat ' + f);
}
const allWww = fs.readdirSync(path.join(ROOT, 'www')).filter((f) => /\.(js|css|html)$/.test(f)).map((f) => fs.readFileSync(path.join(ROOT, 'www', f), 'utf8')).join('\n');
for (const gid of ['349104626', '2022396471']) if (!allWww.includes(gid)) fail('sheet inbound gid ' + gid + ' tidak dibaca aplikasi');
if (/<sandi>/.test(allWww)) fail('kata sandi Inbound tertulis terang di www/ (harus hash saja)');
else ok('kata sandi Inbound tidak tertulis terang');
for (const s of ['MASTER_PLAN', 'MASTER_LC', 'LOGIC', 'LPPBDO_HCI', 'LPPBDO_AHI', 'RDC']) {
  if (!html.includes("'" + s + "'")) fail('sheet ' + s + ' tidak dibaca aplikasi');
}
ok('semua sheet yang dibutuhkan dibaca');
for (const f of ['package.json', 'capacitor.config.json']) {
  try { JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8')); ok(f); } catch (e) { fail(f + ': ' + e.message); }
}
const cap = JSON.parse(fs.readFileSync(path.join(ROOT, 'capacitor.config.json'), 'utf8'));
if (!(cap.plugins && cap.plugins.CapacitorHttp && cap.plugins.CapacitorHttp.enabled)) fail('CapacitorHttp harus aktif (tanpa itu Google Sheets diblokir CORS)'); else ok('CapacitorHttp aktif');
const cu = (cap.plugins || {}).CapacitorUpdater;
if (!cu || cu.autoUpdate !== false || cu.statsUrl !== '' || cu.updateUrl !== '' || cu.channelUrl !== '') fail('CapacitorUpdater harus mode manual tanpa server pihak ketiga'); else ok('update kilat: mode manual, tanpa statistik pihak ketiga');
if (!fs.existsSync(path.join(ROOT, 'www', 'config.js'))) fail('www/config.js tidak ada'); else ok('config.js');
if (!fs.readFileSync(path.join(ROOT, 'android/app/src/main/AndroidManifest.xml'), 'utf8').includes('REQUEST_INSTALL_PACKAGES')) fail('izin REQUEST_INSTALL_PACKAGES tidak ada'); else ok('izin pasang update');
const PATTERNS = [[/-----BEGIN (?:RSA )?PRIVATE KEY-----/, 'private key'], [/AIza[0-9A-Za-z_-]{30,}/, 'Google API key'], [/ghp_[0-9A-Za-z]{30,}/, 'GitHub token']];
for (const [p, name] of PATTERNS) if (p.test(allWww)) fail('kunci rahasia ikut ke aplikasi: ' + name);
// Kunci Supabase service_role (JWT dengan role service_role) tidak boleh ada di aplikasi; yang boleh hanya anon.
for (const m of allWww.matchAll(/eyJ[A-Za-z0-9_-]+\.(eyJ[A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g)) {
  try { if (JSON.parse(Buffer.from(m[1], 'base64url').toString()).role === 'service_role') fail('kunci Supabase service_role ikut ke aplikasi'); } catch { /* bukan JWT */ }
}
ok('tidak ada kunci rahasia di www/');
if (bad) { console.error(bad + ' masalah — rilis dibatalkan'); process.exit(1); }
console.log('Semua pemeriksaan lolos');
