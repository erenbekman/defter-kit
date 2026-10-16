// Okuma deneyimi: mini harita (sol), not kenarı (sağ), sayfaya sor (alt).
// Claude ve veritabanı varsa (artifact) sohbet ve kalıcı notlar açılır; yoksa sohbet gizlenir, notlar bu tarayıcıda kalır.
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const META = JSON.parse($('#defter-meta').textContent);
  const BLOCKS = 'h2, h3, p, li, pre, table, .callout, .kisaca, .ozet, .quiz, .akis, .cpts, .ilke, .demo, .sim';
  const ROOT = ':scope > *, .topic > *';

  let art = null;          // görünen bölüm (<article class="chapter">)
  let pageId = null;

  // ------------------------------------------------------------ yardımcılar
  const raf = fn => { let t = 0; return (...a) => { if (!t) t = requestAnimationFrame(() => { t = 0; fn(...a); }); }; };
  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const absTop = el => el.getBoundingClientRect().top + window.scrollY;
  function blocksOf(a) {
    // en dıştaki okunur bloklar: iç içe olanları (li içindeki p gibi) bir kez say
    return $$(BLOCKS, a).filter(el => !el.parentElement.closest(BLOCKS) && !el.closest('.ask, .toc-m'));
  }
  function blockKind(el) {
    if (el.matches('h2')) return 'h2';
    if (el.matches('h3')) return 'h3';
    if (el.matches('pre') || el.closest('.codeblock')) return 'code';
    if (el.matches('table')) return 'table';
    if (el.matches('.callout.c-tuzak')) return 'warn';
    if (el.matches('.callout.c-duzeltme')) return 'fix';
    if (el.matches('.callout, .kisaca, .ozet, .quiz, .ilke')) return 'box';
    return 'text';
  }

  // ------------------------------------------------------------ mini harita
  const mini = { el: null, cv: null, win: null, tip: null, lines: [], dragging: false };
  function miniMount() {
    mini.el = art ? $('.minimap', art.closest('.chapter-grid')) : null;
    if (!mini.el) return;
    mini.cv = $('canvas', mini.el); mini.win = $('.mm-win', mini.el); mini.tip = $('.mm-tip', mini.el);
    if (!mini.el.dataset.bound) {
      mini.el.dataset.bound = '1';
      const go = e => {
        const r = mini.cv.getBoundingClientRect();
        const f = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
        const top = absTop(art), h = art.offsetHeight;
        window.scrollTo({ top: top + f * h - innerHeight / 2, behavior: mini.dragging ? 'auto' : 'smooth' });
      };
      mini.el.addEventListener('pointerdown', e => { mini.dragging = true; mini.el.setPointerCapture(e.pointerId); go(e); });
      mini.el.addEventListener('pointermove', e => {
        if (mini.dragging) go(e);
        const r = mini.cv.getBoundingClientRect(), f = (e.clientY - r.top) / r.height;
        const sec = nearestSection(f);
        mini.tip.textContent = sec || ''; mini.tip.hidden = !sec;
        mini.tip.style.top = Math.max(0, e.clientY - r.top - 10) + 'px';
      });
      mini.el.addEventListener('pointerup', () => { mini.dragging = false; });
      mini.el.addEventListener('pointerleave', () => { mini.tip.hidden = true; });
    }
    miniBuild();
  }
  function nearestSection(f) {
    const hs = mini.lines.filter(l => l.kind === 'h2');
    let best = null;
    for (const l of hs) if (l.f <= f + 0.004) best = l;
    return best ? best.title : '';
  }
  function miniBuild() {
    if (!mini.el || !art) return;
    const top = absTop(art), h = Math.max(1, art.offsetHeight);
    mini.lines = [];
    const doneSecs = new Set($$('.toc a.done[data-sec]', art.closest('.chapter-grid')).map(a => a.dataset.sec));
    for (const el of blocksOf(art)) {
      const r = el.getBoundingClientRect();
      if (!r.height) continue;
      const kind = blockKind(el);
      const f0 = (r.top + window.scrollY - top) / h, fh = r.height / h;
      const text = (el.textContent || '').trim();
      const n = kind === 'h2' || kind === 'h3' ? 1 : Math.max(1, Math.round(r.height / 28));
      const done = doneSecs.has((el.closest('.topic') || {}).id);
      for (let i = 0; i < n; i++) {
        // satır uzunluğu: son satır kısa, diğerleri uzun ama biraz dalgalı
        const last = i === n - 1;
        const w = kind === 'h2' ? 1 : kind === 'h3' ? .7 : last ? .35 + ((text.length * 7 + i) % 40) / 100 : .78 + ((i * 13 + text.length) % 20) / 100;
        mini.lines.push({ f: f0 + (fh * i) / n, kind, w, done, title: kind === 'h2' ? text.replace(/#$/, '').trim() : '' });
      }
    }
    miniDraw();
  }
  function miniDraw() {
    if (!mini.cv || !mini.el.offsetHeight) return;
    const dpr = devicePixelRatio || 1, W = mini.cv.clientWidth, H = mini.cv.clientHeight;
    mini.cv.width = W * dpr; mini.cv.height = H * dpr;
    const g = mini.cv.getContext('2d'); g.scale(dpr, dpr); g.clearRect(0, 0, W, H);
    // sade: gri satırlar, koyu başlıklar; tuzak ve düzeltme solda küçük bir renk işaretiyle
    const ink = css('--ink'), mute = css('--ink-3'), mark = { warn: css('--warn'), fix: css('--accent') }, ok = css('--ok');
    for (const l of mini.lines) {
      const y = Math.round(l.f * H);
      const inset = l.kind === 'code' || l.kind === 'box' || l.kind === 'warn' || l.kind === 'fix' || l.kind === 'table' ? 4 : 0;
      if (l.kind === 'h2') { g.globalAlpha = .9; g.fillStyle = l.done ? ok : ink; g.fillRect(0, y, W, 2); continue; }
      g.globalAlpha = l.kind === 'h3' ? .75 : l.kind === 'code' ? .5 : .32;
      g.fillStyle = l.kind === 'h3' ? ink : mute;
      g.fillRect(inset, y, Math.max(3, (W - inset) * l.w), 1);
      if (mark[l.kind]) { g.globalAlpha = .9; g.fillStyle = mark[l.kind]; g.fillRect(0, y - 1, 2, 3); }
    }
    g.globalAlpha = 1;
    miniWin();
  }
  const miniWin = raf(() => {
    if (!mini.win || !art) return;
    const H = mini.cv.clientHeight, top = absTop(art), h = Math.max(1, art.offsetHeight);
    const f0 = Math.max(0, (scrollY - top) / h), f1 = Math.min(1, (scrollY + innerHeight - top) / h);
    mini.win.style.top = (f0 * H) + 'px';
    mini.win.style.height = Math.max(14, (f1 - f0) * H) + 'px';
    mini.win.hidden = f1 <= 0 || f0 >= 1;
  });

  // ------------------------------------------------------------ notlar
  const notes = { list: [], db: null, col: null, local: false, editing: null };
  const LKEY = 'defter:notlar';
  const loadLocal = () => { try { return JSON.parse(localStorage.getItem(LKEY) || '[]'); } catch (e) { return []; } };
  const saveLocal = () => { try { localStorage.setItem(LKEY, JSON.stringify(notes.list)); } catch (e) {} };
  notes.list = loadLocal(); notes.local = true;

  function blockIndex(el) { return blocksOf(art).indexOf(el); }
  function findBlock(n) {
    const bs = blocksOf(art);
    const q = (n.quote || '').slice(0, 60);
    if (bs[n.blk] && (!q || bs[n.blk].textContent.includes(q))) return bs[n.blk];
    return bs.find(b => q && b.textContent.includes(q)) || bs[n.blk] || null;
  }
  async function noteSave(n) {
    n.at = new Date().toISOString();
    const i = notes.list.findIndex(x => x.id === n.id);
    if (i >= 0) notes.list[i] = n; else notes.list.push(n);
    if (notes.col) { try { await notes.col.doc(n.id).set(n); return; } catch (e) { notes.col = null; notes.local = true; } }
    saveLocal(); notesRender();
  }
  async function noteDelete(id) {
    notes.list = notes.list.filter(x => x.id !== id);
    if (notes.col) { try { await notes.col.doc(id).delete(); return; } catch (e) { notes.col = null; notes.local = true; } }
    saveLocal(); notesRender();
  }
  const pageNotes = () => notes.list.filter(n => n.page === pageId).sort((a, b) => (a.blk - b.blk) || a.at.localeCompare(b.at));
  function fmtTime(iso) {
    try { return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }); } catch (e) { return ''; }
  }
  function noteCard(n, editing) {
    const q = n.quote ? `<blockquote>${esc(n.quote.length > 160 ? n.quote.slice(0, 157) + '…' : n.quote)}</blockquote>` : '';
    if (editing) return `<div class="note editing" data-note="${esc(n.id)}">${q}<textarea class="note-ta" rows="3" placeholder="Notun… (⌘/Ctrl + Enter kaydeder)">${esc(n.text || '')}</textarea><div class="note-act"><button type="button" data-n="save" class="pri">Kaydet</button><button type="button" data-n="cancel">Vazgeç</button></div></div>`;
    return `<div class="note" data-note="${esc(n.id)}">${q}<p>${esc(n.text)}</p><div class="note-meta"><span>${fmtTime(n.at)}</span><span class="note-act"><button type="button" data-n="ask" title="Bu notu Claude'a sor">Sor</button><button type="button" data-n="edit">Düzenle</button><button type="button" data-n="del">Sil</button></span></div></div>`;
  }
  function notesRender() {
    if (!art) return;
    const grid = art.closest('.chapter-grid');
    const margin = grid && $('.margin', grid);
    $$('.has-note', art).forEach(b => b.classList.remove('has-note'));
    const list = pageNotes();
    if (notes.editing && notes.editing.page === pageId && !list.some(n => n.id === notes.editing.id)) list.push(notes.editing);
    for (const n of list) { const b = findBlock(n); if (b) b.classList.add('has-note'); }
    // alt panel sekmesi
    const cnt = $('[data-notes-count]', art); if (cnt) cnt.textContent = list.filter(n => n.text).length || '';
    const drawer = $('[data-notes-list]', art);
    if (drawer) drawer.innerHTML = list.length ? list.map(n => noteCard(n, notes.editing && notes.editing.id === n.id)).join('') : '<p class="ask-empty">Henüz not yok. Bir paragraf seçip <b>Not al</b>’a bas.</p>';
    if (!margin) return;
    const stack = $('.margin-notes', margin);
    stack.innerHTML = list.map(n => noteCard(n, notes.editing && notes.editing.id === n.id)).join('');
    $('.margin-hint', margin).hidden = list.length > 0;
    layoutMargin();
  }
  const layoutMargin = raf(() => {
    if (!art) return;
    const margin = $('.margin', art.closest('.chapter-grid')); if (!margin || !margin.offsetParent) return;
    const base = margin.getBoundingClientRect().top;
    let y = 0;
    for (const card of $$('.margin-notes .note', margin)) {
      const n = notes.list.find(x => x.id === card.dataset.note) || notes.editing;
      const b = n && findBlock(n);
      const want = b ? b.getBoundingClientRect().top - base : y;
      const top = Math.max(want, y);
      card.style.top = top + 'px';
      y = top + card.offsetHeight + 10;
    }
  });
  function startNote(quote, block) {
    notes.editing = { id: 'n' + Date.now().toString(36), page: pageId, sec: (block.closest('.topic') || {}).id || '', blk: blockIndex(block), quote: quote.slice(0, 600), text: '', at: new Date().toISOString() };
    notesRender();
    const wide = $('.margin', art.closest('.chapter-grid'));
    if (!wide || !wide.offsetParent) openAsk('notes');
    const ta = $(`[data-note="${notes.editing.id}"] .note-ta`, wide && wide.offsetParent ? wide : art);
    if (ta) ta.focus({ preventScroll: true });
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-n]'); if (!b) return;
    const card = b.closest('[data-note]'), id = card.dataset.note;
    const n = notes.list.find(x => x.id === id) || (notes.editing && notes.editing.id === id ? notes.editing : null);
    if (!n) return;
    const act = b.dataset.n;
    if (act === 'save') {
      const t = $('.note-ta', card).value.trim();
      notes.editing = null;
      if (t) noteSave({ ...n, text: t }); else notesRender();
    } else if (act === 'cancel') { notes.editing = null; notesRender(); }
    else if (act === 'edit') { notes.editing = { ...n }; notesRender(); const ta = $(`[data-note="${id}"] .note-ta`); if (ta) ta.focus(); }
    else if (act === 'del') {
      if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = 'Emin misin?'; setTimeout(() => { b.dataset.sure = ''; b.textContent = 'Sil'; }, 2500); return; }
      noteDelete(id);
    } else if (act === 'ask') { openAsk('chat', n.quote, `Notum: "${n.text}". Bunu defterdeki metinle karşılaştır; doğru mu, eksik mi?`); }
  });
  document.addEventListener('keydown', e => {
    if (e.target.classList && e.target.classList.contains('note-ta') && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault(); $('[data-n="save"]', e.target.closest('.note')).click();
    }
  });
  document.addEventListener('mouseover', e => {
    const card = e.target.closest('.note[data-note]');
    $$('.note-hover').forEach(x => x.classList.remove('note-hover'));
    if (!card || !art) return;
    const n = notes.list.find(x => x.id === card.dataset.note); const b = n && findBlock(n);
    if (b) b.classList.add('note-hover');
  });

  // ------------------------------------------------------------ seçim araç çubuğu
  const pop = document.createElement('div');
  pop.className = 'sel-pop'; pop.hidden = true;
  pop.innerHTML = '<button type="button" data-s="note">Not al</button><button type="button" data-s="ask" data-needs-claude hidden>Claude’a sor</button>';
  document.body.appendChild(pop);
  let selQuote = '', selBlock = null;
  function readSelection() {
    const s = getSelection();
    if (!art || !s || s.isCollapsed || !s.rangeCount) return null;
    const r = s.getRangeAt(0);
    if (!art.contains(r.commonAncestorContainer) || r.commonAncestorContainer.parentElement?.closest('.ask, .margin, input, textarea')) return null;
    const text = s.toString().replace(/\s+/g, ' ').trim();
    if (text.length < 3) return null;
    const node = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentElement;
    const block = blocksOf(art).find(b => b.contains(node)) || node.closest(BLOCKS);
    return block ? { text, rect: r.getBoundingClientRect(), block } : null;
  }
  const updatePop = raf(() => {
    const sel = readSelection();
    if (!sel) { pop.hidden = true; return; }
    selQuote = sel.text; selBlock = sel.block;
    pop.hidden = false;
    const x = Math.min(innerWidth - pop.offsetWidth - 8, Math.max(8, sel.rect.left + sel.rect.width / 2 - pop.offsetWidth / 2));
    const y = sel.rect.top > 60 ? sel.rect.top - pop.offsetHeight - 8 : sel.rect.bottom + 8;
    pop.style.left = x + 'px'; pop.style.top = (y + scrollY) + 'px';
  });
  document.addEventListener('selectionchange', updatePop);
  pop.addEventListener('mousedown', e => e.preventDefault());   // seçimi kaybetme
  pop.addEventListener('click', e => {
    const b = e.target.closest('[data-s]'); if (!b) return;
    const q = selQuote, blk = selBlock;
    getSelection().removeAllRanges(); pop.hidden = true;
    if (b.dataset.s === 'note' && blk) startNote(q, blk);
    if (b.dataset.s === 'ask') openAsk('chat', q);
  });
  // seçim varken yazmaya başlamak: soru kutusuna geç
  document.addEventListener('keydown', e => {
    if (!ask.sample || pop.hidden || e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
    const tag = (e.target.tagName || '').toLowerCase(); if (tag === 'input' || tag === 'textarea') return;
    const q = selQuote; getSelection().removeAllRanges(); pop.hidden = true;
    e.preventDefault();
    openAsk('chat', q); const inp = $('.ask-in', art); inp.value = e.key; inp.setSelectionRange(1, 1);
  });

  // ------------------------------------------------------------ sayfaya sor
  const ask = { sample: null, turns: {}, ctl: null, quote: {} };
  const ERR = {
    rate_limited: 'Şu an çok fazla istek var ya da kullanım sınırına gelindi. Biraz sonra tekrar dene.',
    session_expired: 'Oturum süresi dolmuş; Claude’a yeniden giriş yap.',
    refused: 'Claude bu soruyu cevaplamadı. Soruyu farklı sormayı dene.',
    empty_completion: 'Boş cevap geldi. Soruyu daha kısa sor.',
    prompt_too_large: 'Sayfa ve sohbet birlikte çok uzun. Sohbeti temizleyip tekrar dene.',
    upstream_error: 'Bağlantı koptu. Tekrar dene.',
  };
  const HIDE = new Set(['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed']);
  function md(src) {   // küçük, güvenli markdown: önce kaçır, sonra işaretle
    const blocks = String(src).replace(/\r/g, '').split(/```/);
    return blocks.map((b, i) => {
      if (i % 2) return `<pre><code>${esc(b.replace(/^[\w-]*\n/, ''))}</code></pre>`;
      return b.split(/\n{2,}/).map(par => {
        const lines = par.split('\n').filter(l => l.trim());
        if (!lines.length) return '';
        const inline = t => esc(t).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<i>$2</i>');
        if (lines.every(l => /^\s*([-*•]|\d+[.)])\s+/.test(l))) {
          const ol = /^\s*\d/.test(lines[0]);
          return `<${ol ? 'ol' : 'ul'}>${lines.map(l => `<li>${inline(l.replace(/^\s*([-*•]|\d+[.)])\s+/, ''))}</li>`).join('')}</${ol ? 'ol' : 'ul'}>`;
        }
        if (/^#{1,4}\s/.test(lines[0])) return `<p><b>${inline(lines[0].replace(/^#+\s*/, ''))}</b>${lines.slice(1).map(l => '<br>' + inline(l)).join('')}</p>`;
        return `<p>${lines.map(inline).join('<br>')}</p>`;
      }).join('');
    }).join('');
  }
  function pageText() {
    const clone = art.cloneNode(true);
    $$('.ask, .toc-m, .ch-nav, .done-btn, .gloss, script, style', clone).forEach(x => x.remove());
    return clone.textContent.replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n\n').trim().slice(0, 60000);
  }
  function rules() {
    const title = ($('h1', art) || {}).textContent || '';
    return `Sen "${META.ad}" adlı kişisel öğrenme defterinin okuma yardımcısısın. Okur şu an "${title}" bölümünü okuyor; bölümün metni aşağıda <bolum> etiketinin içinde.\n\n` +
      `- Türkçe, kısa ve net cevap ver; yetişkin bir okura anlatır gibi. Gerekirse somut bir benzetme kullan.\n` +
      `- Önce bölüm metnine dayan. Metinde olmayan bir şey eklersen başına "Defterde yok:" yaz.\n` +
      `- Bir konuya atıf yaparken konu başlığını kullan.\n` +
      `- Biçim: kısa paragraflar, gerekiyorsa madde listesi. Başlık kullanma.\n\n<bolum>\n${pageText()}\n</bolum>`;
  }
  const PRESETS = {
    gloss: 'Bu bölümü okumaya başlamadan önce bana bir çerçeve ver: tek cümlelik ana fikir, en önemli 3-5 iddia (kısa madde) ve konuların sırası (hangi konu neyi cevaplıyor).',
    quiz: 'Bu bölümden beni 3 soruyla sına. Soruları tek tek, numaralı yaz; cevapları verme. Ben cevaplayınca değerlendir.',
    simple: 'Bu bölümün en zor kısmını seç ve onu somut bir benzetmeyle, 5 cümleyi geçmeden anlat.',
  };
  const LABELS = { gloss: 'Okumadan önce özetle', quiz: 'Beni 3 soruyla sına', simple: 'En zor kısmı basitçe anlat' };
  function openAsk(tab, quote, text) {
    if (!art) return;
    const box = $('.ask', art); if (!box) return;
    box.classList.add('open');
    setTab(tab || 'chat');
    if (quote) { ask.quote[pageId] = quote; renderQuote(); }
    const inp = $('.ask-in', art);
    if (text != null) inp.value = text;
    if ((tab || 'chat') === 'chat') inp.focus();
  }
  function setTab(t) {
    const box = $('.ask', art);
    $$('[data-tab]', box).forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
    $('[data-pane="chat"]', box).hidden = t !== 'chat';
    $('[data-pane="notes"]', box).hidden = t !== 'notes';
    box.dataset.tab = t;
  }
  function renderQuote() {
    const q = ask.quote[pageId], el = $('.ask-quote', art);
    if (!el) return;
    el.hidden = !q;
    $('span', el).textContent = q ? '“' + (q.length > 120 ? q.slice(0, 117) + '…' : q) + '”' : '';
  }
  function renderChat() {
    const log = $('.ask-log', art); if (!log) return;
    const turns = ask.turns[pageId] || [];
    log.innerHTML = turns.length ? turns.map(t => `<div class="msg ${t.role}">${t.role === 'user' ? `${t.quote ? `<blockquote>${esc(t.quote.slice(0, 200))}</blockquote>` : ''}<p>${esc(t.show || t.content)}</p>` : `<div class="md">${md(t.content)}</div>`}</div>`).join('')
      : `<div class="ask-empty"><p>Bu bölüm hakkında sor. Claude sadece bu sayfanın metnini görür.</p><div class="chips"><button type="button" data-preset="gloss">Okumadan önce özetle</button><button type="button" data-preset="simple">En zor kısmı basitçe anlat</button><button type="button" data-preset="quiz">Beni 3 soruyla sına</button></div></div>`;
    log.scrollTop = log.scrollHeight;
  }
  async function send(text, show) {
    if (!ask.sample || ask.ctl || !text.trim()) return;
    const turns = ask.turns[pageId] = ask.turns[pageId] || [];
    const quote = ask.quote[pageId] || '';
    const content = (quote ? `Seçtiğim kısım:\n<secili>\n${quote}\n</secili>\n\n` : '') + text.trim();
    turns.push({ role: 'user', content, show: show || text.trim(), quote });
    ask.quote[pageId] = ''; renderQuote();
    const reply = { role: 'assistant', content: '' };
    turns.push(reply);
    renderChat();
    const log = $('.ask-log', art), last = log.lastElementChild;
    last.classList.add('pending'); last.innerHTML = '<p class="thinking">Düşünüyor…</p>';
    const form = $('.ask-form', art); form.classList.add('busy');
    ask.ctl = new AbortController();
    const history = turns.slice(0, -1).slice(-10).map(t => ({ role: t.role, content: t.content })).filter(t => t.content);
    while (history.length && history[0].role !== 'user') history.shift();
    try {
      const res = await ask.sample([{ role: 'user', content: rules() }, ...history], {
        cache: false, signal: ask.ctl.signal,
        onText: ({ text }) => { reply.content = text; last.classList.remove('pending'); last.innerHTML = `<div class="md">${md(text)}</div>`; log.scrollTop = log.scrollHeight; },
      });
      reply.content = res.text + (res.truncated ? '\n\n*(Cevap kesildi; daha dar bir soru sor.)*' : '');
    } catch (e) {
      reply.content = (e.text || '') + (e.code === 'cancelled' ? '' : `\n\n*${ERR[e.code] || ERR.upstream_error}*`);
      if (!reply.content.trim()) turns.pop();
      if (HIDE.has(e.code)) disableAsk();
    } finally {
      form.classList.remove('busy'); ask.ctl = null; renderChat();
    }
  }
  function disableAsk() {
    ask.sample = null;
    $$('[data-needs-claude]').forEach(el => { el.hidden = true; });
    $$('.ask').forEach(b => b.classList.add('no-claude'));
  }
  document.addEventListener('submit', e => {
    const f = e.target.closest('.ask-form'); if (!f) return;
    e.preventDefault();
    const inp = $('.ask-in', f);
    if (!ask.sample) return;
    if (ask.ctl) return;
    const v = inp.value; inp.value = '';
    openAsk('chat'); send(v);
  });
  document.addEventListener('click', e => {
    const p = e.target.closest('[data-preset]'); if (p) { openAsk('chat'); send(PRESETS[p.dataset.preset], LABELS[p.dataset.preset]); return; }
    const t = e.target.closest('[data-tab]'); if (t) { openAsk(t.dataset.tab); return; }
    if (e.target.closest('[data-ask-close]')) { $('.ask', art).classList.remove('open'); return; }
    if (e.target.closest('[data-ask-stop]')) { if (ask.ctl) ask.ctl.abort(); return; }
    if (e.target.closest('[data-ask-clear]')) { ask.turns[pageId] = []; renderChat(); return; }
    if (e.target.closest('[data-quote-x]')) { ask.quote[pageId] = ''; renderQuote(); return; }
    if (e.target.closest('.ask-in') || e.target.closest('[data-ask-open]')) { openAsk(e.target.closest('[data-ask-open]') ? 'chat' : ($('.ask', art).dataset.tab || 'chat')); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && art) { const box = $('.ask', art); if (box && box.classList.contains('open')) { box.classList.remove('open'); $('.ask-in', art).blur(); } }
  });

  // ------------------------------------------------------------ görünüm değişimi
  function mount() {
    const view = $$('.view').find(v => !v.hidden) || document;
    art = $('.chapter', view);
    pageId = art ? art.dataset.page : null;
    pop.hidden = true;
    if (!art) return;
    miniMount(); notesRender(); renderChat(); renderQuote();
    if (!ask.sample) $$('[data-needs-claude]', art).forEach(el => { el.hidden = true; });
  }
  document.addEventListener('defter:view', () => requestAnimationFrame(mount));
  document.addEventListener('click', e => { if (e.target.closest('.done-btn')) setTimeout(miniBuild, 0); });
  addEventListener('scroll', () => { miniWin(); layoutMargin(); }, { passive: true });
  const rebuild = raf(() => { miniBuild(); layoutMargin(); });
  addEventListener('resize', rebuild);
  if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe(document.body);
  new MutationObserver(() => miniDraw()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => miniDraw());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuild);
  mount();

  // ------------------------------------------------------------ Claude ve veritabanı
  (async () => {
    if (!window.claude || !window.claude.use) return;
    try {
      const s = await window.claude.use('sample');
      if (s) {
        ask.sample = s;
        $$('[data-needs-claude]').forEach(el => { el.hidden = false; });
        $$('.ask').forEach(b => b.classList.remove('no-claude'));
      }
    } catch (e) {}
    try {
      const db = await window.claude.use('db');
      if (!db) return;
      const col = db.collection('notlar');
      const local = loadLocal();
      col.onSnapshot(snap => {
        notes.col = col; notes.local = false;
        notes.list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        notesRender();
      }, () => { notes.col = null; notes.local = true; notes.list = loadLocal(); notesRender(); });
      // bu tarayıcıda biriken yerel notları bir kez taşı
      if (local.length) {
        for (const n of local) { try { await col.doc(n.id).set(n); } catch (e) { return; } }
        try { localStorage.removeItem(LKEY); } catch (e) {}
      }
    } catch (e) {}
  })();
})();
