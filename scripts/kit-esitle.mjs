#!/usr/bin/env node
// Motoru (içerik değil) defter-kit deposuna kopyalar: src/, scripts/, kit/, plugin/ (skill) ve pazar dosyası.
//   node scripts/kit-esitle.mjs ../defter-kit
// Sonra kit klasöründe: npm run build && npm run check, commit, push.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hedef = process.argv[2];
if (!hedef || !fs.existsSync(path.join(hedef, 'defter.config.json'))) {
  console.error('Kullanım: node scripts/kit-esitle.mjs <defter-kit klasörü> (içinde defter.config.json olmalı)');
  process.exit(1);
}
const MOTOR = ['src', 'scripts', 'kit', 'plugin', '.claude-plugin', '.gitignore', 'vercel.json'];
let n = 0;
function kopyala(rel) {
  const from = path.join(ROOT, rel), to = path.join(hedef, rel);
  if (fs.statSync(from).isDirectory()) return fs.readdirSync(from).forEach(f => kopyala(path.join(rel, f)));
  fs.mkdirSync(path.dirname(to), { recursive: true });
  const yeni = fs.readFileSync(from);
  if (!fs.existsSync(to) || !yeni.equals(fs.readFileSync(to))) { fs.writeFileSync(to, yeni); console.log('  ' + rel); n++; }
}
MOTOR.forEach(kopyala);
console.log(n ? `✓ ${n} dosya güncellendi` : '✓ kit zaten güncel');
