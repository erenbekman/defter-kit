// Defter derleyicisi: content/*.md + data/*.json → dist/ (çok sayfalı site) ve dist/defter.html (tek dosya).
// Tek bağımlılık: marked. Kalan her şey burada, okunabilir kalsın diye tek dosyada.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'dist');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const strip = s => String(s).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const pad = n => String(n).padStart(2, '0');

// ---------------------------------------------------------------- içerik
const CFG = JSON.parse(read('defter.config.json'));   // ad, sahip, imza, metinler; skill de buradan okur
const CATS = JSON.parse(read('data/categories.json'));
const QUEUE = JSON.parse(read('data/queue.json'));

function frontmatter(src, file) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) throw new Error(file + ': frontmatter yok');
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: src.slice(m[0].length) };
}

const PAGES = [];
for (const cat of CATS) {
  const dir = path.join(ROOT, 'content', cat.id);
  if (!fs.existsSync(dir)) { cat.pages = []; continue; }
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  const list = files.map(f => {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    const { meta, body } = frontmatter(src, f);
    return { ...meta, order: Number(meta.order || 99), category: cat.id, body, file: `content/${cat.id}/${f}` };
  }).sort((a, b) => a.order - b.order);
  cat.pages = list.map(p => p.id);
  PAGES.push(...list);
}
PAGES.forEach((p, i) => { p.num = i + 1; });
const PAGE = Object.fromEntries(PAGES.map(p => [p.id, p]));
const CAT = Object.fromEntries(CATS.map(c => [c.id, c]));

// Bölümleri ayır: "## Başlık {#id}" + isteğe bağlı "?> soru"
for (const p of PAGES) {
  const lines = p.body.split('\n');
  const intro = [], secs = [];
  let cur = null, fence = null;
  for (const line of lines) {
    const f = line.match(/^(`{3,}|~{3,})/);
    if (f) { if (!fence) fence = f[1]; else if (line.startsWith(fence)) fence = null; }
    const h = !fence && line.match(/^## (.+?)\s*\{#([\w-]+)\}\s*$/);
    if (h) { cur = { title: h[1], id: h[2], q: '', lines: [] }; secs.push(cur); continue; }
    if (cur && !cur.q && !cur.lines.length && line.startsWith('?> ')) { cur.q = line.slice(3); continue; }
    (cur ? cur.lines : intro).push(line);
  }
  // sayfa sonu blokları (kaynaklar, "sıradaki sayfa") son bölümden ayrılır
  p.footer = [];
  const last = secs[secs.length - 1];
  if (last) {
    const text = last.lines.join('\n');
    const cut = text.search(/\n(?=:::kaynaklar|<div class="next")/);
    if (cut > -1) { p.footer = text.slice(cut).split('\n'); last.lines = text.slice(0, cut).split('\n'); }
  }
  p.intro = intro.join('\n');
  p.secs = secs;
  p.mins = Math.max(5, Math.round(p.body.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 200 / 5) * 5);
}
const SEC_PAGE = {};
for (const p of PAGES) for (const s of p.secs) SEC_PAGE[s.id] = p.id;

// ---------------------------------------------------------------- bağlantılar
// mode: 'site' (dist/<id>/index.html) | 'spa' (tek dosya, #id)
let MODE = 'site';
function href(id) {
  if (MODE === 'spa') return id ? '#' + id : '#ana-sayfa';
  if (!id || id === 'ana-sayfa') return '/';
  if (id === 'kuyruk' || id === 'queue') return '/kuyruk/';
  if (PAGE[id]) return `/${id}/`;
  if (SEC_PAGE[id]) return `/${SEC_PAGE[id]}/#${id}`;
  return '#' + id;
}
const fixHashLinks = html => html.replace(/href="#([\w-]+)"/g, (m, id) =>
  (PAGE[id] || SEC_PAGE[id] || id === 'queue') ? `href="${href(id === 'queue' ? 'kuyruk' : id)}"` : m);

// ---------------------------------------------------------------- vurgulama (derleme anında)
const KW = {
  js: 'const|let|var|function|return|if|else|for|while|new|class|extends|this|async|await|of|in|typeof|null|undefined|true|false|try|catch|throw|super|delete|import|export|from|default|switch|case|break|continue|yield',
  ts: 'const|let|var|function|return|if|else|for|while|new|class|extends|this|async|await|of|in|typeof|null|undefined|true|false|try|catch|throw|import|export|from|interface|type|implements|public|private|readonly',
  php: 'function|return|if|else|foreach|for|while|new|class|extends|implements|public|private|protected|static|fn|use|namespace|echo|null|true|false|try|catch|throw|as|match|readonly',
  sql: 'SELECT|FROM|WHERE|UPDATE|SET|AND|OR|NOT|BEGIN|COMMIT|ROLLBACK|FOR|INSERT|INTO|VALUES|CREATE|TABLE|INDEX|ON|EXPLAIN|COUNT|SUM|AVG|JOIN|LEFT|RIGHT|INNER|GROUP|BY|ORDER|HAVING|LIMIT|AS|WITH|RECURSIVE|OVER|PARTITION|CASE|WHEN|THEN|END|NULL|IS|IN|PRIMARY|KEY|REFERENCES|DELETE|ALTER|ADD|DISTINCT|UNION|ALL|EXISTS|DESC|ASC|USING',
  bash: 'sudo|cd|ls|echo|export|if|then|fi|for|do|done|apt|git|docker|npm|systemctl|chmod|chown',
  python: 'def|return|if|else|elif|for|while|import|from|class|None|True|False|try|except|with|as|in|not|and|or|lambda|async|await|yield',
};
KW.vue = KW.js; KW.json = 'true|false|null';
const HASH_LANGS = new Set(['bash', 'python', 'yaml', 'nginx', 'dockerfile', 'sh', 'ini', 'conf']);
function highlight(src, lang) {
  const words = KW[lang] || KW.js + '|' + KW.php.split('|').slice(0, 10).join('|') + '|SELECT|FROM|WHERE|UPDATE|SET|INSERT|INTO|CREATE';
  const flags = lang === 'sql' ? 'gi' : 'g';
  const comment = HASH_LANGS.has(lang) ? '(?:^|(?<=\\s))#[^\\n]*' : (lang === 'sql' ? '--[^\\n]*' : '\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/|--\\s[^\\n]*');
  const re = new RegExp(`(${comment})|('(?:[^'\\\\\\n]|\\\\.)*'|"(?:[^"\\\\\\n]|\\\\.)*"|\`(?:[^\`\\\\]|\\\\.)*\`)|\\b(${words})\\b|\\b(\\d[\\d_]*(?:\\.\\d+)?)\\b`, flags + 'm');
  let out = '', last = 0, m;
  while ((m = re.exec(src))) {
    if (m[0] === '') { re.lastIndex++; continue; }
    out += esc(src.slice(last, m.index));
    const cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : 'd';
    out += `<span class="${cls}">${esc(m[0])}</span>`;
    last = re.lastIndex;
  }
  return out + esc(src.slice(last));
}

// ---------------------------------------------------------------- markdown
const md = new Marked({ gfm: true, breaks: false });
md.use({
  renderer: {
    code({ text, lang }) {
      const info = lang || '';
      const tm = info.match(/title="(.*)"\s*$/);
      const title = tm ? tm[1] : '';
      const lg = info.replace(/title=".*"\s*$/, '').trim().split(/\s+/)[0] || '';
      const bar = `<div class="code-bar"><span>${esc(title)}</span><span class="code-tools">${lg ? `<span class="lang">${esc(lg)}</span> ` : ''}<button class="copy" type="button">Kopyala</button></span></div>`;
      return `<div class="codeblock">${bar}<pre><code>${highlight(text, lg)}</code></pre></div>\n`;
    },
    heading({ tokens, depth }) {
      const t = this.parser.parseInline(tokens);
      return depth === 3 ? `<h3 class="sub">${t}</h3>\n` : `<h${depth}>${t}</h${depth}>\n`;
    },
    link({ href: h, title, tokens }) {
      const t = this.parser.parseInline(tokens);
      if (/^https?:/.test(h)) return `<a href="${esc(h)}" target="_blank" rel="noopener">${t}</a>`;
      if (h.startsWith('#')) return `<a href="${esc(href(h.slice(1)))}">${t}</a>`;
      return `<a href="${esc(h)}">${t}</a>`;
    },
    table(token) {
      const head = token.header.map(c => `<th>${this.parser.parseInline(c.tokens)}</th>`).join('');
      const rows = token.rows.map(r => '<tr>' + r.map(c => `<td>${this.parser.parseInline(c.tokens)}</td>`).join('') + '</tr>').join('\n');
      return `<div class="tbl"><table>\n<thead><tr>${head}</tr></thead>\n<tbody>\n${rows}\n</tbody></table></div>\n`;
    },
    paragraph({ tokens }) {
      const t = this.parser.parseInline(tokens);
      const cls = /^(Ek kaynak|Kaynak|Kaynaklar):/.test(strip(t)) ? ' class="src"' : '';
      return `<p${cls}>${t}</p>\n`;
    },
    blockquote({ tokens }) {
      const inner = this.parser.parse(tokens).replace(/^<p>/, '').replace(/<\/p>\n?$/, '');
      return `<p class="cpt-b">${inner}</p>\n`;
    },
  },
});

// ::: direktifleri (iç içe ve kod bloklarına duyarlı)
function splitDirectives(text) {
  const lines = text.split('\n'), out = [];
  let buf = [], fence = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const f = line.match(/^(`{3,}|~{3,})/);
    if (f) { if (!fence) fence = f[1]; else if (line.startsWith(fence)) fence = null; }
    const open = !fence && line.match(/^:::([a-z]+)\s*(.*)$/);
    if (!open) { buf.push(line); continue; }
    if (buf.length) { out.push({ md: buf.join('\n') }); buf = []; }
    const inner = []; let depth = 1, fz = null, j = i + 1;
    for (; j < lines.length; j++) {
      const l = lines[j];
      const ff = l.match(/^(`{3,}|~{3,})/);
      if (ff) { if (!fz) fz = ff[1]; else if (l.startsWith(fz)) fz = null; }
      if (!fz && /^:::[a-z]+/.test(l)) depth++;
      else if (!fz && /^:::\s*$/.test(l)) { depth--; if (!depth) break; }
      inner.push(l);
    }
    out.push({ name: open[1], arg: open[2], body: inner.join('\n') });
    i = j;
  }
  if (buf.length) out.push({ md: buf.join('\n') });
  return out;
}

const ALIAS = { okuma: 'medium' };   // :::okuma, :::medium ile aynı (Medium dışı kaynaklar için daha doğru ad)
const LABEL = { tuzak: 'Tuzak', duzeltme: 'Düzeltme', medium: 'Okumadan', not: 'Not' };
function render(text) {
  return splitDirectives(text).map(b => {
    if (b.md !== undefined) return md.parse(b.md);
    const inner = () => render(b.body);
    if (ALIAS[b.name]) b.name = ALIAS[b.name];
    switch (b.name) {
      case 'kisaca': return `<div class="kisaca"><span class="lbl">Kısaca</span>${inner()}</div>\n`;
      case 'tuzak': case 'duzeltme': case 'medium': case 'not': {
        const title = b.arg.replace(/^Tuzak:\s*/, '');
        return `<aside class="callout c-${b.name}"><p class="callout-title"><span class="tag">${LABEL[b.name]}</span>${md.parseInline(title)}</p><div class="callout-body">${inner()}</div></aside>\n`;
      }
      case 'ozet': return `<p class="ozet"><small>Özetle</small><span>${md.parseInline(b.body.trim())}</span></p>\n`;
      case 'quiz': {
        const [q, ...a] = b.body.split(/\n---\n/);
        return `<details class="quiz"><summary>Kendini test et</summary>${render(q)}<div class="ans">${render(a.join('\n---\n'))}</div></details>\n`;
      }
      case 'ilke': return `<div class="ilke">${inner()}</div>\n`;
      case 'kurallar': return inner().replace(/^<ol>/, '<ol class="kurallar">');
      case 'akis': {
        // "- düğüm" satırları; aradaki "→ etiket" satırı oka yazı ekler, "~" son düğümü kesik çizgiyle çizer
        const parts = []; let label = '';
        for (const l of b.body.split('\n')) {
          if (l.startsWith('→ ')) { label = l.slice(2); continue; }
          if (!l.startsWith('- ')) continue;
          const n = l.slice(2), end = n.startsWith('~');
          if (parts.length) parts.push(`<span class="ar">${label ? md.parseInline(label) + ' ' : ''}→</span>`);
          const cls = !parts.length ? 'node me' : end ? 'node end' : 'node';
          parts.push(`<span class="${cls}">${md.parseInline(end ? n.slice(1) : n)}</span>`);
          label = '';
        }
        if (label) parts.push(`<span class="ar">${md.parseInline(label)}</span>`);
        return `<div class="chain" aria-label="${esc(b.arg)}">${parts.join('')}</div>\n`;
      }
      case 'kavramlar': {
        const items = b.body.split(/^#### /m).filter(s => s.trim());
        return '<div class="cpts">' + items.map(it => {
          const nl = it.indexOf('\n');
          const head = nl < 0 ? it : it.slice(0, nl), body = nl < 0 ? '' : it.slice(nl + 1);
          const [k, small] = head.split(' | ');
          return `<div class="cpt"><div class="cpt-k">${md.parseInline(k)}${small ? `<small>${md.parseInline(small)}</small>` : ''}</div><div class="cpt-v">${render(body)}</div></div>`;
        }).join('') + '</div>\n';
      }
      case 'kaynaklar': return `<div class="sources"><h2>${esc(b.arg || 'Kaynaklar')}</h2>${inner()}</div>\n`;
      default: throw new Error('Bilinmeyen direktif: ' + b.name);
    }
  }).join('');
}

// ---------------------------------------------------------------- sayfa parçaları
const words = s => strip(s).split(/\s+/).filter(Boolean).length;
const ICON_SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';

function jumpMenu(current) {
  return CATS.filter(c => c.pages.length).map(c => `<p>${esc(c.name)}</p>` + c.pages.map(id => {
    const p = PAGE[id];
    return `<a href="${href(id)}"${id === current ? ' aria-current="page"' : ''}><span class="n">${pad(p.num)}</span>${esc(p.short)}</a>`;
  }).join('')).join('');
}

function header(current, label) {
  return `<a class="skip" href="#icerik">İçeriğe geç</a>
<header class="site-head">
  <a class="brand" href="${href('')}"><span class="mark">${esc(CFG.ad.charAt(0).toLocaleLowerCase(CFG.dil))}</span><span class="txt">${esc(CFG.ad)}</span><span class="by">${esc(CFG.sahip)}</span></a>
  <span class="crumb-sep">/</span>
  <details class="jump"><summary data-jump-label>${esc(label)}</summary><nav class="jump-menu" aria-label="Bölümler">${jumpMenu(current)}<p>${esc(CFG.ad)}</p><a href="${href('kuyruk')}">Okuma kuyruğu</a></nav></details>
  <div class="head-actions">
    <button class="search-btn" type="button" data-search-open><span class="sb-lbl">Ara</span><kbd>/</kbd><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></button>
    <button class="icon-btn" type="button" data-theme-toggle aria-label="Temayı değiştir">${ICON_SUN}</button>
  </div>
</header>
<div class="read-bar" aria-hidden="true"><i></i></div>`;
}

function sectionHtml(s, i) {
  const n = pad(i + 1);
  return `<section class="topic" id="${s.id}">
<header class="t-head"><span class="t-num">${n}</span><h2><a class="anchor" href="${href(s.id)}" aria-label="Bu bölüme bağlantı">#</a>${md.parseInline(s.title)}</h2>${s.q ? `<p class="question">${md.parseInline(s.q)}</p>` : ''}</header>
${render(s.lines.join('\n'))}
<div class="done-row"><button class="done-btn" type="button" data-done="${s.id}" aria-pressed="false"><span class="box"></span>Öğrendim</button></div>
</section>`;
}

function chapterHtml(p) {
  const cat = CAT[p.category];
  const secs = p.secs.map(sectionHtml).join('\n');
  const mins = p.mins;
  const toc = `<ol class="toc">${p.secs.map((s, i) => `<li><a href="${href(s.id)}" data-sec="${s.id}"><span class="n">${pad(i + 1)}</span><span class="t">${strip(md.parseInline(s.title))}</span></a></li>`).join('')}</ol>`;
  const idx = PAGES.indexOf(p), prev = PAGES[idx - 1], next = PAGES[idx + 1];
  const nav = `<nav class="ch-nav" aria-label="Önceki ve sonraki bölüm">${prev ? `<a href="${href(prev.id)}"><small>← Önceki · Bölüm ${pad(prev.num)}</small><b>${esc(prev.short)}</b></a>` : '<span></span>'}${next ? `<a class="next-c" href="${href(next.id)}"><small>Sonraki · Bölüm ${pad(next.num)} →</small><b>${esc(next.short)}</b></a>` : ''}</nav>`;
  return `<div class="chapter-grid">
<aside class="rail" aria-label="Bu sayfada">
  <a class="back" href="${href('')}">← Defter</a>
  <p class="rail-h">Bu sayfada</p>
  ${toc}
  <div class="rail-prog" data-page-prog="${p.id}"><span>0 / ${p.secs.length} öğrenildi</span><div class="bar"><i></i></div></div>
</aside>
<article class="chapter" data-page="${p.id}">
<header class="ch-head">
  <p class="eyebrow"><span class="num">Bölüm ${pad(p.num)}</span> · ${esc(cat.name)} · ~${mins} dk${p.updated ? ' · ' + esc(p.updated) : ''}</p>
  <h1>${esc(p.title)}</h1>
  ${p.lede ? `<p class="lede">${md.parseInline(p.lede)}</p>` : ''}
  <details class="toc-m"><summary>Bu sayfada · ${p.secs.length} konu</summary>${toc}</details>
</header>
${render(p.intro)}
${secs}
${render(p.footer.join('\n'))}
${nav}
</article>
</div>`;
}

function homeHtml() {
  const totalSecs = PAGES.reduce((a, p) => a + p.secs.length, 0);
  const qDone = QUEUE.items.filter(it => it[3] !== 'b').length;
  const parts = CATS.map(c => {
    const nums = c.pages.map(id => PAGE[id].num);
    const range = nums.length ? (nums.length > 1 ? `${pad(nums[0])}–${pad(nums[nums.length - 1])}` : pad(nums[0])) : '—';
    const secN = c.pages.reduce((a, id) => a + PAGE[id].secs.length, 0);
    const cards = c.pages.map(id => {
      const p = PAGE[id];
      return `<a class="card" href="${href(id)}" data-card="${id}"><h3><span class="n">${pad(p.num)}</span>${esc(p.short)}</h3><p>${esc(strip(md.parseInline(p.lede || '')))}</p><div class="meta"><span>${p.secs.length} konu · ~${p.mins} dk</span><span class="pr" data-card-prog></span></div><div class="bar"><i></i></div></a>`;
    }).join('');
    const soon = (c.soon || []).length ? `<div class="soon">${c.soon.map(s => `<span>${esc(s)}</span>`).join('')}</div>` : '';
    return `<section class="part" id="kisim-${c.id}">
<div class="part-head"><h2>${esc(c.name)}</h2><span class="range">${range}${secN ? `<br><span data-cat-prog="${c.id}">0 / ${secN}</span>` : ''}</span><p>${esc(c.desc)}</p></div>
${cards ? `<div class="cards">${cards}</div>` : ''}${soon}
</section>`;
  }).join('\n');
  const first = PAGES[0];
  return `<div class="home">
<section class="hero">
  <p class="eyebrow"><b>${esc(CFG.imza)}</b> · ${PAGES.length} bölüm</p>
  <h1>${CFG.baslik}</h1>
  <p class="lede">${esc(CFG.lede)}</p>
  <div class="cta"><a class="btn pri" href="${href(first.id)}">Bölüm 01'den başla →</a><button class="btn" type="button" data-search-open>Defterde ara</button></div>
  <dl class="stats">
    <div><dt>Bölüm</dt><dd>${PAGES.length}</dd></div>
    <div><dt>Konu</dt><dd>${totalSecs}</dd></div>
    <div><dt>İşlenen yazı</dt><dd>${qDone}<small> / ${QUEUE.items.length}</small></dd></div>
    <div><dt>Öğrendiğin</dt><dd data-total-prog>0<small> / ${totalSecs}</small></dd></div>
  </dl>
</section>
${parts}
<a class="queue-card" href="${href('kuyruk')}"><b>Okuma kuyruğu</b><span>${qDone} / ${QUEUE.items.length} işlendi →</span><span class="q-mini">Kaydedilen yazılar sırayla okunuyor; sadece defterde olmayan bilgi, kaynağıyla birlikte ilgili bölüme ekleniyor.</span></a>
<footer class="home-foot"><span>${esc(CFG.ad)} · ${esc(CFG.sahip)} · ${new Date().getFullYear()}</span><em>${esc(CFG.slogan)}</em></footer>
</div>`;
}

function queueHtml() {
  const catOpts = CATS.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
  return `<div class="home queue-page">
<header class="ch-head"><p class="eyebrow"><b>Kuyruk</b> · okunacaklar ve işlenenler</p><h1>Okuma kuyruğu</h1>
<p class="lede">Beğendiğin yazının linkini buraya bırak, sırasını sen belirle. Her hafta en üstteki yazılar okunur; sadece defterde olmayan bilgi kendi cümlelerimizle ve kaynağıyla ilgili bölüme eklenir, yeni bilgi yoksa neden atlandığı yazılır.</p></header>

<section class="q-pending" aria-labelledby="qp-h">
  <div class="qp-head"><h2 id="qp-h">Sıradakiler</h2><span class="qp-count" data-qp-count></span></div>
  <form class="q-add" data-q-add hidden>
    <label for="q-links">Link ya da not ekle</label>
    <textarea id="q-links" rows="3" placeholder="Bir ya da birden çok link yapıştır. Link yoksa yazdığın metin not olarak eklenir."></textarea>
    <div class="q-add-row">
      <label class="q-sel"><span>Kategori</span><select id="q-cat"><option value="">Otomatik (okurken seçilsin)</option>${catOpts}</select></label>
      <label class="q-sel"><span>Nasıl işlensin?</span><select id="q-mod"><option value="standart">Standart: doğrula, yeniyi ekle</option><option value="direkt">Direkt: olduğu gibi</option><option value="detayli">Detaylı: araştır, derinleştir</option></select></label>
      <label class="q-sel"><span>Konum</span><select id="q-pos"><option value="end">Sıranın sonuna</option><option value="top">En üste</option></select></label>
      <button class="btn pri" type="submit">Kuyruğa ekle</button>
    </div>
    <p class="q-add-msg" data-q-msg aria-live="polite"></p>
  </form>
  <p class="qp-ro" data-qp-ro>Bu kopyada kuyruk salt okunur. Eklemek ve sıralamak için defteri claude.ai'de, oturum açıkken aç.</p>
  <ol class="qp-list" data-qp-list></ol>
</section>

<section class="q-done" aria-labelledby="qd-h">
  <div class="qp-head"><h2 id="qd-h">İşlenenler</h2></div>
  <dl class="q-stats" data-q-stats></dl><div class="q-bar" data-q-bar></div>
  <div class="q-filter" role="group" aria-label="Durum filtresi"><button type="button" data-f="all" aria-pressed="true">Hepsi</button><button type="button" data-f="e" aria-pressed="false">Eklendi</button><button type="button" data-f="k" aria-pressed="false">Kısmen</button><button type="button" data-f="a" aria-pressed="false">Atlandı</button></div>
  <div data-q-lists></div>
</section>
</div>`;
}

// arama dizini + kuyruk için bölüm başlıkları
function searchIndex() {
  return PAGES.flatMap(p => p.secs.map(s => ({
    p: p.id, s: s.id, n: p.num, pt: p.short,
    t: strip(md.parseInline(s.title)), q: strip(md.parseInline(s.q || '')),
    x: strip(render(s.lines.join('\n')).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').replace(/ ([.,;:!?)])/g, '$1').slice(0, 20000),
  })));
}

const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400..700&family=JetBrains+Mono:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400..500&display=swap">';
const THEME_BOOT = `<script>try{var t=localStorage.getItem('defter:theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>`;
const SEARCH_UI = `<div class="search" data-search hidden><div class="search-box" role="dialog" aria-modal="true" aria-label="Defterde ara"><input id="search-q" type="search" placeholder="Konu, kavram ya da soru ara…" autocomplete="off"><div class="search-res" data-search-res></div></div></div>`;

// ---------------------------------------------------------------- yazdır
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
const CSS = read('src/style.css');
const APP = read('src/app.js');
const ENH = read('src/enhance.js').replace('export function enhance', 'function enhance');
const META = { ad: CFG.ad, sahip: CFG.sahip, pages: PAGES.map(p => ({ id: p.id, n: p.num, short: p.short, cat: p.category, secs: p.secs.map(s => s.id) })), cats: CATS.map(c => ({ id: c.id, pages: c.pages })) };
const SEC_TITLES = Object.fromEntries(PAGES.flatMap(p => p.secs.map(s => [s.id, strip(md.parseInline(s.title))])));

// 1) site
MODE = 'site';
const siteHome = homeHtml();
const siteChapters = Object.fromEntries(PAGES.map(p => [p.id, fixHashLinks(chapterHtml(p))]));
const siteQueue = queueHtml();
fs.writeFileSync(path.join(OUT, 'assets/style.css'), CSS);
fs.writeFileSync(path.join(OUT, 'assets/app.js'), `${ENH}\n${APP}`);
fs.writeFileSync(path.join(OUT, 'search.json'), JSON.stringify(searchIndex()));
const shell = (title, desc, label, current, body, extra = '') => `<!doctype html>
<html lang="${esc(CFG.dil)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="author" content="${esc(CFG.sahip)}">
${THEME_BOOT}${FONTS}<link rel="stylesheet" href="/assets/style.css"></head>
<body data-mode="site"><div id="top"></div>${header(current, label)}
<main id="icerik">${body}</main>${SEARCH_UI}
<script type="application/json" id="defter-meta">${JSON.stringify({ ...META, mode: 'site' })}</script>${extra}
<script src="/assets/app.js" defer></script></body></html>`;
const homeBody = fixHashLinks(siteHome);
fs.writeFileSync(path.join(OUT, 'index.html'), shell(`${CFG.ad} · ${CFG.sahip}`, CFG.aciklama, 'Bölümler', '', homeBody));
for (const p of PAGES) {
  fs.mkdirSync(path.join(OUT, p.id), { recursive: true });
  fs.writeFileSync(path.join(OUT, p.id, 'index.html'), shell(`${p.short} · ${CFG.ad}`, strip(md.parseInline(p.lede || p.title)), `Bölüm ${pad(p.num)}`, p.id, siteChapters[p.id]));
}
fs.mkdirSync(path.join(OUT, 'kuyruk'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'kuyruk/index.html'), shell(`Okuma kuyruğu · ${CFG.ad}`, 'Kaydedilen yazıların işlenme durumu.', 'Okuma kuyruğu', '', siteQueue,
  `<script type="application/json" id="queue-data">${JSON.stringify({ ...QUEUE, titles: SEC_TITLES, cats: Object.fromEntries(CATS.map(c => [c.id, c.name])), links: Object.fromEntries(Object.keys(SEC_TITLES).map(k => [k, href(k)])) }).replace(/</g, '\\u003c')}</script>`));

// 2) tek dosya (artifact): bütün görünümler tek belgede, #id ile gezinme
MODE = 'spa';
const views = [`<div class="view" data-view="ana-sayfa" data-label="Bölümler">${homeHtml()}</div>`]
  .concat(PAGES.map(p => `<div class="view" data-view="${p.id}" data-label="Bölüm ${pad(p.num)}" hidden>${chapterHtml(p)}</div>`))
  .concat([`<div class="view" data-view="kuyruk" data-label="Okuma kuyruğu" hidden>${queueHtml()}</div>`]);
const single = `<title>${esc(CFG.sahip)} · ${esc(CFG.ad)}</title>
${THEME_BOOT}${FONTS}
<style>${CSS}</style>
<div id="top"></div>${header('', 'Bölümler')}
<main id="icerik">${views.join('\n')}</main>${SEARCH_UI}
<script type="application/json" id="defter-meta">${JSON.stringify({ ...META, mode: 'spa' })}</script>
<script type="application/json" id="search-data">${JSON.stringify(searchIndex()).replace(/</g, '\\u003c')}</script>
<script type="application/json" id="queue-data">${JSON.stringify({ ...QUEUE, titles: SEC_TITLES, cats: Object.fromEntries(CATS.map(c => [c.id, c.name])), links: Object.fromEntries(Object.keys(SEC_TITLES).map(k => [k, '#' + k])) }).replace(/</g, '\\u003c')}</script>
<script>${ENH}\n${APP}</script>`;
fs.writeFileSync(path.join(OUT, 'defter.html'), single);

const kb = n => (n / 1024).toFixed(0) + ' KB';
console.log(`✓ ${PAGES.length} bölüm, ${Object.keys(SEC_PAGE).length} konu`);
console.log(`  site  → dist/ (${PAGES.length + 2} sayfa)`);
console.log(`  tek   → dist/defter.html (${kb(single.length)})`);
