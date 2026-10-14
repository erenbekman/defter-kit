// Derlenmiş çıktıyı denetler: kırık iç bağlantı, tekrar eden id, eksik bölüm.
// Kullanım: npm run build && npm run check  (hata varsa çıkış kodu 1)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(ROOT, 'dist/defter.html'), 'utf8');
const errors = [];
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
const seen = new Set();
for (const id of ids) { if (seen.has(id)) errors.push(`Tekrar eden id: ${id}`); seen.add(id); }
const views = new Set([...html.matchAll(/data-view="([^"]+)"/g)].map(m => m[1]));
for (const [, id] of html.matchAll(/href="#([^"]*)"/g)) {
  if (id && !seen.has(id) && !views.has(id) && id !== 'ana-sayfa') errors.push(`Kırık bağlantı: #${id}`);
}
const q = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/queue.json'), 'utf8'));
for (const it of q.items) for (const sid of it[5] || []) if (!seen.has(sid)) errors.push(`Kuyrukta bilinmeyen bölüm: ${sid} (${it[1]})`);
if (errors.length) { console.error([...new Set(errors)].join('\n')); process.exit(1); }
console.log(`✓ denetim temiz: ${seen.size} id, ${views.size} görünüm`);
