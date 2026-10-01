// Menulis www/config.js (versi, repo update, basis native) sebelum `cap sync`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const VERSION = process.env.APP_VERSION || pkg.version;
const conf = { version: VERSION, updateRepo: process.env.GITHUB_REPOSITORY || 'Malik190603/imm-inbound', nativeBase: process.env.NATIVE_BASE || VERSION, build: Number(process.env.VERSION_CODE || process.env.GITHUB_RUN_NUMBER || 0) };
fs.writeFileSync(path.join(ROOT, 'www', 'config.js'), '// Dibuat otomatis saat build\nwindow.IMM_CONFIG = ' + JSON.stringify(conf, null, 2) + ';\n');
console.log('config.js:', JSON.stringify(conf));
