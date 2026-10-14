#!/usr/bin/env node
// Yeni bir defter kurar: motoru (src/) kopyalar, ayar dosyasını, kurallarını, kategorilerini ve ilk sayfayı yazar.
//
//   node scripts/yeni-defter.mjs ../ayse-defter --sahip "Ayşe Yılmaz" --konu "ürün yönetimi ve UX" \
//        --kategoriler "ux=UX: Kullanıcı araştırması ve arayüz|urun=Ürün: Yol haritası, metrikler"
//
// Bağımlılığı yok; sadece Node 18+.
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { values: o, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    ad: { type: 'string', default: 'Defter' },
    sahip: { type: 'string' },
    imza: { type: 'string' },
    konu: { type: 'string', default: 'öğrendiğim her şey' },
    okur: { type: 'string', default: 'konuyu öğrenmek isteyen bir yetişkin; kısa ve net' },
    kategoriler: { type: 'string', default: '' },
    repo: { type: 'string', default: '' },
    artifact: { type: 'string', default: '' },
    zorla: { type: 'boolean', default: false },
  },
});
const hedef = positionals[0];
if (!hedef || !o.sahip) {
  console.error('Kullanım: node scripts/yeni-defter.mjs <klasör> --sahip "Ad Soyad" [--ad Defter] [--konu "..."] [--kategoriler "id=Ad: açıklama|..."]');
  process.exit(1);
}
const OUT = path.resolve(hedef);
if (fs.existsSync(OUT) && fs.readdirSync(OUT).filter(f => f !== '.git').length && !o.zorla) {
  console.error(`${OUT} boş değil. Üzerine yazmak için --zorla ekle.`);
  process.exit(1);
}

// "Eren Bekman" → "Eren Bekman'ın", "Ayşe" → "Ayşe'nin": Türkçe iyelik eki (ünlü uyumu)
function iyelik(ad) {
  const kucuk = ad.toLocaleLowerCase('tr');
  const unluler = kucuk.match(/[aeıioöuü]/g) || ['e'];
  const son = unluler[unluler.length - 1];
  const ek = { a: 'ın', ı: 'ın', e: 'in', i: 'in', o: 'un', u: 'un', ö: 'ün', ü: 'ün' }[son];
  const unluyleBiter = /[aeıioöuü]$/.test(kucuk);
  return `${ad}'${unluyleBiter ? 'n' : ''}${ek}`;
}
const slug = s => s.toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const imza = o.imza || (o.ad === 'Defter' ? `${iyelik(o.sahip)} defteri` : `${iyelik(o.sahip)} ${o.ad} defteri`);
const kategoriler = (o.kategoriler ? o.kategoriler.split('|') : ['genel=Genel: Henüz kendi kategorisi olmayan notlar.'])
  .map(k => k.trim()).filter(Boolean).map(k => {
    const m = k.match(/^([^=]+)=([^:]+)(?::\s*(.*))?$/);
    if (!m) throw new Error('Kategori biçimi "id=Ad: açıklama" olmalı: ' + k);
    return { id: slug(m[1]), name: m[2].trim(), desc: (m[3] || '').trim() || 'Henüz not yok.', soon: [] };
  });
const doldur = s => s.replaceAll('{{AD}}', o.ad).replaceAll('{{SAHIP}}', o.sahip).replaceAll('{{IMZA}}', imza)
  .replaceAll('{{KONU}}', o.konu).replaceAll('{{OKUR}}', o.okur).replaceAll('{{KATEGORI}}', kategoriler[0].id);

const yaz = (p, icerik) => { fs.mkdirSync(path.dirname(path.join(OUT, p)), { recursive: true }); fs.writeFileSync(path.join(OUT, p), icerik); };
const kopyala = p => yaz(p, fs.readFileSync(path.join(ROOT, p)));

for (const f of fs.readdirSync(path.join(ROOT, 'src'))) kopyala(path.join('src', f));
for (const f of ['.gitignore', 'vercel.json', 'scripts/yeni-defter.mjs', 'kit/CLAUDE.md', 'kit/hos-geldin.md']) kopyala(f);
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
yaz('package.json', JSON.stringify({ ...pkg, name: slug(`${o.ad}-${o.sahip}`), description: `${imza}: ${o.konu}.`, author: o.sahip }, null, 2) + '\n');
yaz('defter.config.json', JSON.stringify({
  ad: o.ad,
  sahip: o.sahip,
  imza,
  aciklama: `${imza}: ${o.konu} üzerine, okunanlardan süzülen notlar.`,
  baslik: 'Öğrendiklerim, <em>tek bir defterde.</em>',
  lede: `${o.sahip} okuduklarından, izlediklerinden ve sohbetlerinden öğrendiklerini kendi cümleleriyle ve kaynağıyla burada topluyor. Her konu bir benzetmeyle başlar, gerçekte ne olduğuna, örneğe ve en sık düşülen tuzağa iner.`,
  slogan: 'Okuduğunu değil, anladığını yaz.',
  dil: 'tr',
  repo: o.repo,
  artifact: o.artifact,
}, null, 2) + '\n');
yaz('data/categories.json', JSON.stringify(kategoriler, null, 2) + '\n');
yaz('data/queue.json', '{\n"lists": {},\n"items": [\n]\n}\n');
yaz('CLAUDE.md', doldur(fs.readFileSync(path.join(ROOT, 'kit/CLAUDE.md'), 'utf8')));
yaz(`content/${kategoriler[0].id}/hos-geldin.md`, doldur(fs.readFileSync(path.join(ROOT, 'kit/hos-geldin.md'), 'utf8')));
for (const k of kategoriler.slice(1)) fs.mkdirSync(path.join(OUT, 'content', k.id), { recursive: true });
yaz('README.md', `# ${o.ad} · ${o.sahip}\n\n${imza}: ${o.konu}. [defter-kit](https://github.com/erenbekman/defter-kit) ile kuruldu.\n\n\`\`\`bash\nnpm install\nnpm run dev      # http://localhost:4321\n\`\`\`\n\nİçerik eklemek için Claude'da \`defter\` eklentisini kur (bkz. [defter-kit](https://github.com/erenbekman/defter-kit)) ve herhangi bir sohbette \"deftere ekle\" de. Üslup ve kurallar [CLAUDE.md](CLAUDE.md)'de; bu dosya senin, istediğin gibi değiştir.\n`);

console.log(`✓ ${imza} kuruldu: ${OUT}`);
console.log(`  ${kategoriler.length} kategori: ${kategoriler.map(k => k.name).join(', ')}`);
console.log('  Sıradaki: cd ' + path.relative(process.cwd(), OUT) + ' && npm install && npm run build && npm run check');
