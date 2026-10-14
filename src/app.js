// Defter istemci betiği: tema, ilerleme, arama, okuma çubuğu, kuyruk ve (tek dosya modunda) sayfa geçişi.
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const META = JSON.parse($('#defter-meta').textContent);
  const SPA = META.mode === 'spa';
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  if (typeof enhance === 'function') { try { enhance(); } catch (e) { console.error(e); } }

  // ---------- tema ----------
  const root = document.documentElement;
  const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  $$('[data-theme-toggle]').forEach(b => b.addEventListener('click', () => {
    const t = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('defter:theme', t); } catch (e) {}
  }));

  // ---------- ilerleme (yalnızca bu tarayıcıda) ----------
  let done = store.get('defter:done', null);
  if (!done) { done = store.get('dev-defteri:js-nasil-dusunur', {}) || {}; store.set('defter:done', done); }
  const secPage = {};
  META.pages.forEach(p => p.secs.forEach(s => { secPage[s] = p.id; }));
  function syncProgress() {
    $$('.done-btn').forEach(b => b.setAttribute('aria-pressed', String(!!done[b.dataset.done])));
    $$('.toc a[data-sec]').forEach(a => a.classList.toggle('done', !!done[a.dataset.sec]));
    let total = 0, all = 0;
    const per = {};
    META.pages.forEach(p => {
      const d = p.secs.filter(s => done[s]).length;
      per[p.id] = d; total += d; all += p.secs.length;
      $$(`[data-page-prog="${p.id}"]`).forEach(el => {
        el.querySelector('span').textContent = `${d} / ${p.secs.length} öğrenildi`;
        el.querySelector('i').style.width = (d / p.secs.length * 100) + '%';
      });
      $$(`[data-card="${p.id}"]`).forEach(el => {
        el.querySelector('[data-card-prog]').textContent = d ? `${d} öğrenildi` : '';
        el.querySelector('.bar i').style.width = (d / p.secs.length * 100) + '%';
      });
    });
    META.cats.forEach(c => {
      const n = c.pages.reduce((a, id) => a + META.pages.find(p => p.id === id).secs.length, 0);
      const d = c.pages.reduce((a, id) => a + per[id], 0);
      $$(`[data-cat-prog="${c.id}"]`).forEach(el => { el.textContent = `${d} / ${n}`; });
    });
    $$('[data-total-prog]').forEach(el => { el.innerHTML = `${total}<small> / ${all}</small>`; });
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('.done-btn');
    if (!b) return;
    done[b.dataset.done] = !done[b.dataset.done];
    if (!done[b.dataset.done]) delete done[b.dataset.done];
    store.set('defter:done', done);
    syncProgress();
  });
  syncProgress();

  // ---------- kodu kopyala ----------
  document.addEventListener('click', e => {
    const b = e.target.closest('.codeblock .copy');
    if (!b) return;
    const code = b.closest('.codeblock').querySelector('code').textContent;
    const ok = () => { b.textContent = 'Kopyalandı'; setTimeout(() => { b.textContent = 'Kopyala'; }, 1400); };
    const fallback = () => {
      const r = document.createRange(); r.selectNodeContents(b.closest('.codeblock').querySelector('code'));
      const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Seçildi';
      setTimeout(() => { b.textContent = 'Kopyala'; }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(ok, fallback);
    else fallback();
  });

  // ---------- görünüm (tek dosya modunda sayfa geçişi) ----------
  const views = $$('.view');
  const jumpLabel = $('[data-jump-label]');
  let current = null;
  function activeArticle() { return current ? $('.chapter', current) : $('.chapter'); }
  function show(id, scroll) {
    if (!SPA) return;
    let target = null, el = null;
    if (!id || id === 'ana-sayfa' || id === 'top') target = views[0];
    else {
      el = document.getElementById(id);
      target = views.find(v => v.dataset.view === id) || (el && el.closest('.view'));
      if (!target) return false;
    }
    views.forEach(v => { v.hidden = v !== target; });
    current = target;
    if (jumpLabel) jumpLabel.textContent = target.dataset.label;
    $$('.jump-menu a').forEach(a => a.toggleAttribute('aria-current', a.getAttribute('href') === '#' + target.dataset.view));
    $$('.jump-menu a').forEach(a => { if (a.hasAttribute('aria-current')) a.setAttribute('aria-current', 'page'); });
    const ev = `${META.sahip} · ${META.ad}`;
    document.title = target.dataset.view === 'ana-sayfa' ? ev : (target.querySelector('h1') ? target.querySelector('h1').textContent + ' · ' + META.sahip : ev);
    if (scroll !== false) {
      if (el && el !== target && !el.classList.contains('view')) el.scrollIntoView();
      else window.scrollTo(0, 0);
    }
    observeToc();
    onScroll();
    return true;
  }
  if (SPA) {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = decodeURIComponent(a.getAttribute('href').slice(1));
      if (id === 'icerik') return;
      e.preventDefault();
      const jm = a.closest('details.jump'); if (jm) jm.open = false;
      if (show(id) !== false) { try { history.pushState(null, '', '#' + (id || 'ana-sayfa')); } catch (err) {} }
    });
    window.addEventListener('popstate', () => show(location.hash.slice(1)));
    window.addEventListener('hashchange', () => show(location.hash.slice(1)));
  }
  document.addEventListener('click', e => {
    const jm = $('details.jump[open]');
    if (jm && !e.target.closest('details.jump')) jm.open = false;
  });

  // ---------- "bu sayfada" vurgusu ve okuma çubuğu ----------
  let io = null;
  function observeToc() {
    if (io) io.disconnect();
    const art = activeArticle();
    if (!art || !('IntersectionObserver' in window)) return;
    const scope = art.closest('.chapter-grid');
    const links = $$('.rail .toc a', scope);
    io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) links.forEach(a => a.classList.toggle('active', a.dataset.sec === en.target.id));
      });
    }, { rootMargin: '-25% 0px -65% 0px' });
    $$('section.topic', art).forEach(s => io.observe(s));
  }
  const bar = $('.read-bar i');
  function onScroll() {
    const art = activeArticle();
    if (!bar) return;
    if (!art || (current && current.dataset.view === 'ana-sayfa')) { bar.style.width = '0'; return; }
    const r = art.getBoundingClientRect();
    const total = r.height - innerHeight;
    const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
    bar.style.width = (p * 100) + '%';
  }
  addEventListener('scroll', onScroll, { passive: true });
  if (!SPA) observeToc();
  onScroll();

  // ---------- arama ----------
  const box = $('[data-search]'), input = $('#search-q'), res = $('[data-search-res]');
  let INDEX = null, sel = 0, hits = [];
  const norm = s => s.toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/â/g, 'a');
  async function loadIndex() {
    if (INDEX) return INDEX;
    const inline = $('#search-data');
    if (inline) INDEX = JSON.parse(inline.textContent);
    else { const r = await fetch('/search.json'); INDEX = await r.json(); }
    INDEX.forEach(d => { d._t = norm(d.t); d._q = norm(d.q); d._x = norm(d.x); });
    return INDEX;
  }
  const link = (d) => SPA ? '#' + d.s : `/${d.p}/#${d.s}`;
  function snippet(d, terms) {
    const i = terms.length ? d._x.indexOf(terms[0]) : -1;
    if (i < 0) return d.q || d.x.slice(0, 140);
    const a = Math.max(0, i - 60);
    let s = (a ? '…' : '') + d.x.slice(a, i + 110) + '…';
    return s;
  }
  function mark(text, terms) {
    let out = esc(text);
    terms.forEach(t => {
      if (t.length < 2) return;
      const nt = norm(text); let idx = nt.indexOf(t);
      if (idx < 0) return;
      const raw = text.slice(idx, idx + t.length);
      out = out.replace(esc(raw), `<mark>${esc(raw)}</mark>`);
    });
    return out;
  }
  function search(q) {
    if (!INDEX) return;
    const terms = norm(q).split(/\s+/).filter(Boolean);
    if (!terms.length) { hits = INDEX.slice(0, 0); res.innerHTML = '<p class="search-empty">Bir kavram yaz: closure, idempotency, RAG, index…</p>'; return; }
    hits = INDEX.map(d => {
      let sc = 0;
      for (const t of terms) {
        const a = d._t.includes(t) ? 12 : 0, b = d._q.includes(t) ? 5 : 0, c = d._x.includes(t) ? 1 + Math.min(3, d._x.split(t).length - 2) : 0;
        if (!a && !b && !c) return null;
        sc += a + b + c;
      }
      return { d, sc };
    }).filter(Boolean).sort((x, y) => y.sc - x.sc).slice(0, 30);
    sel = 0;
    res.innerHTML = hits.length ? hits.map((h, i) => `<a href="${link(h.d)}" class="${i === 0 ? 'sel' : ''}"><small>Bölüm ${String(h.d.n).padStart(2, '0')} · ${esc(h.d.pt)}</small><b>${mark(h.d.t, terms)}</b><span>${mark(snippet(h.d, terms), terms)}</span></a>`).join('')
      : '<p class="search-empty">Sonuç yok. Daha kısa ya da farklı bir kelime dene.</p>';
  }
  async function openSearch() {
    box.hidden = false; input.value = ''; input.focus();
    await loadIndex(); search(input.value);
  }
  function closeSearch() { box.hidden = true; }
  $$('[data-search-open]').forEach(b => b.addEventListener('click', openSearch));
  box.addEventListener('click', e => {
    if (e.target === box) closeSearch();
    if (e.target.closest('.search-res a')) closeSearch();
  });
  input.addEventListener('input', () => search(input.value));
  input.addEventListener('keydown', e => {
    const as = $$('a', res);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      sel = Math.max(0, Math.min(as.length - 1, sel + (e.key === 'ArrowDown' ? 1 : -1)));
      as.forEach((a, i) => a.classList.toggle('sel', i === sel));
      if (as[sel]) as[sel].scrollIntoView({ block: 'nearest' });
    }
    if (e.key === 'Enter' && as[sel]) { e.preventDefault(); as[sel].click(); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !box.hidden) closeSearch();
    const tag = (e.target.tagName || '').toLowerCase();
    if (e.key === '/' && box.hidden && tag !== 'input' && tag !== 'textarea') { e.preventDefault(); openSearch(); }
  });

  // ---------- okuma kuyruğu ----------
  // İşlenenler: derlemede gömülen data/queue.json (arşiv).
  // Sıradakiler: artifact veritabanındaki "kuyruk" koleksiyonu; sırayı ve içeriği sen yönetirsin.
  // Veritabanı yoksa (site kopyası, oturum kapalı) sıradakiler arşivden salt okunur gösterilir.
  const qEl = $('#queue-data'), lists = $('[data-q-lists]');
  if (qEl && lists) {
    const Q = JSON.parse(qEl.textContent);
    const SN = { b: 'bekliyor', e: 'eklendi', k: 'kısmen', a: 'atlandı' };
    const WEEKLY = 25;
    const MODS = { direkt: 'direkt', detayli: 'detaylı' };   // standart gösterilmez
    const listName = k => (k && (Q.lists[k] || (Q.cats && Q.cats[k]))) || 'Otomatik';

    // --- işlenenler
    const doneItems = Q.items.filter(it => it[3] !== 'b');
    const cnt = { e: 0, k: 0, a: 0 };
    doneItems.forEach(it => { cnt[it[3]]++; });
    const total = doneItems.length || 1;
    $('[data-q-stats]').innerHTML = [['İşlendi', doneItems.length], ['Eklendi', cnt.e], ['Kısmen', cnt.k], ['Atlandı', cnt.a]].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    $('[data-q-bar]').innerHTML = [['e', 'var(--ok)'], ['k', 'var(--accent)'], ['a', 'var(--warn)']].map(([s, c]) => `<i style="width:${cnt[s] / total * 100}%;background:${c}"></i>`).join('');
    const groups = {};
    doneItems.forEach(it => { (groups[it[0]] = groups[it[0]] || []).push(it); });
    lists.innerHTML = Object.keys(groups).map(l => {
      const its = groups[l];
      return `<details class="q-list"><summary><span>${esc(listName(l))}</span><small>${its.length} yazı</small></summary><ol>` +
        its.map(it => {
          const links = (it[5] || []).map(sid => `<a href="${Q.links[sid] || '#' + sid}">${esc(Q.titles[sid] || sid)}</a>`).join(', ');
          const note = it[4] ? esc(it[4]) + (links ? ' → ' + links : '') : links;
          const url = it[6] || `https://medium.com/p/${it[2]}`;
          return `<li data-s="${it[3]}"><span class="q-chip ${it[3]}">${SN[it[3]]}</span><span><a class="t" href="${esc(url)}" target="_blank" rel="noopener">${esc(it[1])}</a>${note ? `<span class="nt">${note}</span>` : ''}</span></li>`;
        }).join('') + '</ol></details>';
    }).join('');
    $$('.q-filter button').forEach(btn => btn.addEventListener('click', () => {
      $$('.q-filter button').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      const f = btn.dataset.f;
      $$('li', lists).forEach(li => { li.hidden = f !== 'all' && li.dataset.s !== f; });
      $$('.q-list', lists).forEach(dl => { dl.hidden = !dl.querySelector('li:not([hidden])'); if (f !== 'all') dl.open = true; });
    }));

    // --- sıradakiler
    const listEl = $('[data-qp-list]'), countEl = $('[data-qp-count]'), form = $('[data-q-add]'), msg = $('[data-q-msg]'), ro = $('[data-qp-ro]');
    let rows = Q.items.filter(it => it[3] === 'b').map((it, i) => ({ id: 'm-' + it[2], url: it[6] || `https://medium.com/p/${it[2]}`, title: it[1], liste: it[0], not: '', sira: (i + 1) * 1000 }));
    let editable = false, db = null, col = null;
    const doneKeys = new Set(doneItems.map(it => 'm-' + it[2]));

    const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
    function mediumId(u) {
      try {
        const x = new URL(u);
        if (!/medium\.com$|\.medium\.com$|^medium\.|itnext\.io|plainenglish\.io|stackademic\.com|towardsdatascience\.com|betterprogramming\.pub|levelup\.gitconnected\.com|learningdaily\.dev|blog\.gopenai\.com/.test(x.hostname) && !/\/p\/[0-9a-f]{8,12}/.test(x.pathname)) return null;
        const m = x.pathname.match(/(?:-|\/p\/)([0-9a-f]{10,12})\/?$/);
        return m ? m[1] : null;
      } catch (e) { return null; }
    }
    function keyOf(u) {
      const mid = mediumId(u);
      if (mid) return 'm-' + mid;
      let h = 5381; const n = u.replace(/[?#].*$/, '').replace(/\/$/, '').toLowerCase();
      for (let i = 0; i < n.length; i++) h = ((h << 5) + h + n.charCodeAt(i)) >>> 0;
      return 'u-' + h.toString(36);
    }
    function titleFrom(u) {
      try {
        const x = new URL(u);
        const seg = x.pathname.split('/').filter(Boolean).pop() || x.hostname;
        if (/^[0-9a-f]{10,12}$/.test(seg) || seg === 'p') return host(u) + x.pathname;
        let slug = decodeURIComponent(seg).replace(/-[0-9a-f]{10,12}$/, '');
        if (/(^|\.)dev\.to$/.test(x.hostname)) slug = slug.replace(/-[a-z0-9]{4,6}$/, '');
        const words = slug.replace(/[-_]+/g, ' ').replace(/\.\w+$/, '').trim();
        return words ? words.charAt(0).toLocaleUpperCase('tr') + words.slice(1) : host(u);
      } catch (e) { return u; }
    }

    function render() {
      countEl.textContent = rows.length ? `${rows.length} yazı · ilk ${Math.min(WEEKLY, rows.length)} bu hafta` : '';
      if (!rows.length) {
        listEl.innerHTML = `<li class="qp-empty">Kuyruk boş. ${editable ? 'Yukarıya bir link yapıştırarak başla.' : ''}</li>`;
        return;
      }
      listEl.innerHTML = rows.map((r, i) => {
        const cut = i === WEEKLY ? '<li class="qp-cut" aria-hidden="true"><span>Bu haftanın partisi burada biter</span></li>' : '';
        const act = editable ? `<div class="qp-act"><button type="button" data-a="top" title="En üste taşı" aria-label="En üste taşı">⤒</button><button type="button" data-a="up" aria-label="Yukarı">↑</button><button type="button" data-a="down" aria-label="Aşağı">↓</button><button type="button" data-a="note">Not</button><button type="button" data-a="del" class="del">Sil</button></div>` : '';
        return cut + `<li class="qp-item${i < WEEKLY ? ' next-up' : ''}" data-id="${esc(r.id)}"${editable ? ' draggable="true"' : ''}>
          ${editable ? '<span class="qp-grip" aria-hidden="true"></span>' : ''}<span class="qp-n">${String(i + 1).padStart(2, '0')}</span>
          <div class="qp-main">${r.url ? `<a class="t" href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title || titleFrom(r.url))}</a>` : `<span class="t">${esc(r.title || 'Not')}</span>`}
          <span class="qp-meta">${r.url ? esc(host(r.url)) : 'not'} · ${esc(listName(r.liste))}${MODS[r.mod] ? ` · <b class="qp-mod">${MODS[r.mod]}</b>` : ''}${r.hedef ? ` · → ${esc(r.hedef)}` : ''}</span>${r.not ? `<span class="qp-note">${esc(r.not)}</span>` : ''}${r.icerik ? `<details class="qp-body"><summary>İçerik</summary><p>${esc(r.icerik)}</p></details>` : ''}</div>${act}</li>`;
      }).join('');
    }
    render();

    const sorted = () => rows.slice().sort((a, b) => a.sira - b.sira);
    async function setOrder(id, sira) {
      const r = rows.find(x => x.id === id); if (!r) return;
      r.sira = sira; rows = sorted(); render();
      try { await col.doc(id).update({ sira }); } catch (e) { flash('Sıra kaydedilemedi: ' + (e.message || e.code)); }
    }
    async function renumber() {
      rows = sorted();
      for (let i = 0; i < rows.length; i++) {
        const s = (i + 1) * 1000;
        if (rows[i].sira !== s) { rows[i].sira = s; try { await col.doc(rows[i].id).update({ sira: s }); } catch (e) {} }
      }
    }
    function between(i) { // i konumuna yerleşecek sıra değeri (rows sıralı)
      const prev = rows[i - 1], next = rows[i];
      if (!prev) return next ? next.sira - 1000 : 1000;
      if (!next) return prev.sira + 1000;
      return (prev.sira + next.sira) / 2;
    }
    async function moveTo(id, idx) {
      const from = rows.findIndex(x => x.id === id); if (from < 0) return;
      const rest = rows.filter(x => x.id !== id);
      idx = Math.max(0, Math.min(rest.length, idx));
      const prev = rest[idx - 1], next = rest[idx];
      let sira = !prev ? (next ? next.sira - 1000 : 1000) : !next ? prev.sira + 1000 : (prev.sira + next.sira) / 2;
      if (prev && next && next.sira - prev.sira < 1e-6) { await renumber(); return moveTo(id, idx); }
      await setOrder(id, sira);
    }
    function flash(t) { msg.textContent = t; clearTimeout(flash.t); flash.t = setTimeout(() => { msg.textContent = ''; }, 5000); }

    listEl.addEventListener('click', async e => {
      const b = e.target.closest('.qp-act button'); if (!b || !editable) return;
      const li = b.closest('.qp-item'), id = li.dataset.id, i = rows.findIndex(x => x.id === id);
      const a = b.dataset.a;
      if (a === 'top') return moveTo(id, 0);
      if (a === 'up') return moveTo(id, i - 1);
      if (a === 'down') return moveTo(id, i + 1);
      if (a === 'del') {
        if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = 'Emin misin?'; setTimeout(() => { b.dataset.sure = ''; b.textContent = 'Sil'; }, 2500); return; }
        rows = rows.filter(x => x.id !== id); render();
        try { await col.doc(id).delete(); } catch (err) { flash('Silinemedi: ' + (err.message || err.code)); }
        return;
      }
      if (a === 'note') {
        const main = li.querySelector('.qp-main');
        if (main.querySelector('input')) return;
        const r = rows[i];
        const inp = document.createElement('input');
        inp.type = 'text'; inp.className = 'qp-note-input'; inp.id = 'qp-note-' + id; inp.value = r.not || '';
        inp.placeholder = 'Neden kaydettin, neye bakılsın? (Enter kaydeder, Esc vazgeçer)';
        main.appendChild(inp); inp.focus();
        const save = async () => {
          const v = inp.value.trim();
          if (v !== (r.not || '')) { r.not = v; try { await col.doc(id).update({ not: v }); } catch (err) { flash('Not kaydedilemedi.'); } }
          render();
        };
        inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); save(); } if (ev.key === 'Escape') render(); });
        inp.addEventListener('blur', save, { once: true });
      }
    });

    // sürükle-bırak (masaüstü)
    let dragId = null;
    listEl.addEventListener('dragstart', e => {
      const li = e.target.closest('.qp-item'); if (!li || !editable) return;
      dragId = li.dataset.id; li.classList.add('dragging');
      try { e.dataTransfer.setData('text/plain', dragId); e.dataTransfer.effectAllowed = 'move'; } catch (err) {}
    });
    listEl.addEventListener('dragend', () => { dragId = null; $$('.qp-item', listEl).forEach(x => x.classList.remove('dragging', 'drop-before', 'drop-after')); });
    listEl.addEventListener('dragover', e => {
      if (!dragId) return;
      const li = e.target.closest('.qp-item'); if (!li) return;
      e.preventDefault();
      const r = li.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2;
      $$('.qp-item', listEl).forEach(x => x.classList.remove('drop-before', 'drop-after'));
      li.classList.add(after ? 'drop-after' : 'drop-before');
    });
    listEl.addEventListener('drop', e => {
      if (!dragId) return;
      const li = e.target.closest('.qp-item'); if (!li) return;
      e.preventDefault();
      const r = li.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2;
      const rest = rows.filter(x => x.id !== dragId);
      let idx = rest.findIndex(x => x.id === li.dataset.id); if (idx < 0) return;
      moveTo(dragId, after ? idx + 1 : idx);
    });

    // link ekleme
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const ta = $('#q-links');
      const urls = Array.from(new Set((ta.value.match(/https?:\/\/[^\s<>"')]+/g) || []).map(u => u.replace(/[.,;]+$/, ''))));
      const cat = $('#q-cat').value, pos = $('#q-pos').value, mod = $('#q-mod').value;
      const text = ta.value.trim();
      if (!urls.length && !text) { flash('Bir link ya da not yaz.'); return; }
      const have = new Set(rows.map(r => r.id));
      let added = 0, dup = 0;
      const fresh = [];
      for (const u of urls) {
        const id = keyOf(u);
        if (have.has(id) || doneKeys.has(id)) { dup++; continue; }
        have.add(id); fresh.push({ id, url: u, title: titleFrom(u), icerik: '' });
      }
      if (!urls.length) {   // link yok: metnin kendisi not olarak girer
        let h = 5381; for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
        const first = text.split('\n')[0].trim();
        fresh.push({ id: 'n-' + h.toString(36), url: '', title: first.length > 80 ? first.slice(0, 77) + '…' : first, icerik: text.slice(0, 8000) });
      }
      const base = pos === 'top' ? (rows.length ? rows[0].sira : 1000) - 1000 * fresh.length : (rows.length ? rows[rows.length - 1].sira : 0) + 1000;
      for (let k = 0; k < fresh.length; k++) {
        const f = fresh[k];
        const doc = { url: f.url, title: f.title, liste: cat, not: '', mod, hedef: '', icerik: f.icerik, sira: base + k * 1000, durum: 'b', eklenme: new Date().toISOString() };
        rows.push({ id: f.id, ...doc });
        try { await col.doc(f.id).set(doc); added++; }
        catch (err) { rows = rows.filter(x => x.id !== f.id); flash(err.code === 'quota_exceeded' ? 'Kuyruk dolu: eski kayıtları silmeden yenisi eklenemez.' : 'Eklenemedi: ' + (err.message || err.code)); }
      }
      rows = sorted(); render();
      ta.value = '';
      flash(`${added} kayıt eklendi${dup ? `, ${dup} tanesi zaten kuyrukta ya da işlenmiş` : ''}.`);
    });

    // veritabanına bağlan
    (async () => {
      try {
        if (!window.claude || !window.claude.use) return;
        db = await window.claude.use('db');
        if (!db) return;
        const user = await window.claude.use('user');
        const can = user && user.can ? await user.can('data.write') : null;
        col = db.collection('kuyruk');
        let first = true;
        col.orderBy('sira').onSnapshot(snap => {
          rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          if (first) {
            first = false;
            editable = can !== false;
            form.hidden = !editable; ro.hidden = editable;
          }
          if (!listEl.querySelector('input')) render();
        }, err => { flash('Kuyruk okunamadı (' + err.code + ').'); });
      } catch (e) { /* salt okunur kalır */ }
    })();
  }

  // tek dosya modunda ilk görünüm, her şey hazır olduktan sonra
  if (SPA) show(location.hash.slice(1), !!location.hash);
})();
