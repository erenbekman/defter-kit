// Okuma ayarları: "Aa" paneli (görünüm, metin, cevaplar), odak modu ve sesli okuma.
// Seçimler bu tarayıcıda kalır (defter:ayar); uygulama ayar-boot.js'teki defterAyar ile yapılır.
(function () {
  const A = window.defterAyar;
  if (!A) return;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const r = document.documentElement;
  const raf = fn => { let q = 0; return () => { if (!q) { q = 1; requestAnimationFrame(() => { q = 0; fn(); }); } }; };
  let s = A.oku();

  const TEMALAR = [
    ['oto', 'Otomatik', '#f8f7f3', '#1a1916', '#111214', '#ebe9e4'],
    ['kagit', 'Kâğıt', '#f8f7f3', '#1a1916'],
    ['sepya', 'Sepya', '#f4ecd8', '#2b2418'],
    ['kar', 'Kar', '#ffffff', '#111111'],
    ['gece', 'Gece', '#111214', '#ebe9e4'],
    ['murekkep', 'Mürekkep', '#0e1420', '#e6e9ef'],
  ];
  const KOYU = { gece: 1, murekkep: 1 };
  const KALEM = { mavi: ['Mavi', '#2b45c0', '#93a6ff'], kiremit: ['Kiremit', '#b4462a', '#f08a62'], yesil: ['Yeşil', '#2c6a47', '#7fc495'], mor: ['Mor', '#6a3fb5', '#b9a0ff'] };
  const FOSFOR = { sari: ['Sarı', '#f3d34a'], yesil: ['Yeşil', '#8fd18a'], mavi: ['Mavi', '#8cc4f2'], pembe: ['Pembe', '#f2a2c6'] };
  const FONTLAR = [['serif', 'Serif', '"Newsreader", Georgia, serif'], ['kitap', 'Kitap', '"Literata", Georgia, serif'], ['sans', 'Sans', '"Instrument Sans", system-ui, sans-serif'], ['okunakli', 'Okunaklı', '"Atkinson Hyperlegible", system-ui, sans-serif']];
  const SEG = {
    aralik: ['Satır aralığı', [['sik', 'Sık'], ['dengeli', 'Dengeli'], ['ferah', 'Ferah']]],
    genislik: ['Genişlik', [['dar', 'Dar'], ['dengeli', 'Dengeli'], ['genis', 'Geniş']]],
    hiza: ['Hizalama', [['sol', 'Sola'], ['iki', 'İki yana']]],
    paragraf: ['Paragraflar', [['aralik', 'Aralıklı'], ['girinti', 'Girintili']]],
  };
  const CEVAP = { kisa: 'İki üç cümle.', dengeli: 'Yaklaşık bir paragraf.', detayli: 'Birkaç paragraf; örnek ve küçük kod parçası olabilir.' };
  const KAPSAM = { bolum: 'Cevap bu bölümün metnine dayanır.', genel: 'Bölüm temel alınır, Claude genel bilgisiyle tamamlar.' };
  const IC = {
    numara: '<path d="M10 4v16M16 4v16M10 4H7.5a4 4 0 0 0 0 8H10"/>',
    harita: '<path d="m9 4-5 2v14l5-2 6 2 5-2V4l-5 2-6-2zM9 4v14M15 6v14"/>',
    odak: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><circle cx="12" cy="12" r="2.5"/>',
    dinle: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>',
  };
  const svg = p => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const b = (k, v, inner, cls = '', extra = '') => `<button type="button" class="${cls}" data-k="${k}" data-v="${v}" aria-pressed="false"${extra}>${inner}</button>`;

  function tile([id, ad, p, i, p2, i2]) {
    const bg = p2 ? `linear-gradient(90deg, ${p} 50%, ${p2} 50%)` : p;
    const ink = p2 ? `<i style="color:${i}">A</i><i style="color:${i2}">a</i>` : `<i style="color:${i}">Aa</i>`;
    const pen = KOYU[id] ? 'var(--pen-d)' : p2 ? `linear-gradient(90deg, var(--pen-l) 50%, var(--pen-d) 50%)` : 'var(--pen-l)';
    return b('tema', id, `<span class="ay-sw" style="background:${bg}">${ink}<u style="background:${pen}"></u></span><span class="ay-sw-l">${ad}</span>`, 'ay-tema');
  }
  const html = `<div class="ayar" role="dialog" aria-label="Okuma ayarları" hidden>
<div class="ay-tabs" role="tablist"><button type="button" role="tab" data-ay-tab="gorunum" aria-selected="true">Görünüm</button><button type="button" role="tab" data-ay-tab="metin" aria-selected="false">Metin</button><button type="button" role="tab" data-ay-tab="cevap" aria-selected="false" data-needs-claude hidden>Cevaplar</button></div>
<section data-ay-pane="gorunum">
<p class="ay-h">Tema</p><div class="ay-temalar">${TEMALAR.map(tile).join('')}</div>
<div class="ay-row"><span class="ay-l">Kalem</span><div class="ay-dots">${Object.entries(KALEM).map(([k, [ad, l, d]]) => b('kalem', k, `<i style="--l:${l};--d:${d}"></i>`, 'ay-dot', ` aria-label="${ad}"`)).join('')}</div><span class="ay-v" data-ay-v="kalem"></span></div>
<div class="ay-row"><span class="ay-l">Fosforlu</span><div class="ay-dots">${Object.entries(FOSFOR).map(([k, [ad, c]]) => b('fosfor', k, `<i class="hl" style="--c:${c}"></i>`, 'ay-dot', ` aria-label="${ad}"`)).join('')}</div><span class="ay-v" data-ay-v="fosfor"></span></div>
<hr>
<div class="ay-tgl">
<button type="button" data-tgl="numara" aria-pressed="false">${svg(IC.numara)}Numaralar</button>
<button type="button" data-tgl="harita" aria-pressed="false">${svg(IC.harita)}Harita</button>
<button type="button" data-tgl="odak" aria-pressed="false">${svg(IC.odak)}Odak</button>
<button type="button" data-dinle aria-pressed="false">${svg(IC.dinle)}<span>Dinle</span></button>
</div>
</section>
<section data-ay-pane="metin" hidden>
<p class="ay-h">Yazı tipi</p><div class="ay-fonts">${FONTLAR.map(([k, ad, f]) => b('font', k, `<b style="font-family:${f}">Ag</b><span>${ad}</span>`, 'ay-font')).join('')}</div>
<div class="ay-row"><span class="ay-l">Boyut</span><div class="ay-size"><button type="button" data-boyut="-1" aria-label="Küçült">−</button><input type="range" min="15" max="24" step="1" aria-label="Yazı boyutu"><button type="button" data-boyut="1" aria-label="Büyüt">+</button><output></output></div></div>
${Object.entries(SEG).map(([k, [ad, ops]]) => `<div class="ay-row"><span class="ay-l">${ad}</span><div class="ay-seg">${ops.map(([v, l]) => b(k, v, l)).join('')}</div></div>`).join('')}
</section>
<section data-ay-pane="cevap" hidden>
<p class="ay-h">Cevap uzunluğu</p><div class="ay-seg wide">${[['kisa', 'Kısa'], ['dengeli', 'Dengeli'], ['detayli', 'Detaylı']].map(([v, l]) => b('cevap', v, l)).join('')}</div><p class="ay-hint" data-ay-v="cevap"></p>
<p class="ay-h">Kapsam</p><div class="ay-seg wide">${[['bolum', 'Sadece bu bölüm'], ['genel', 'Genel bilgiyle']].map(([v, l]) => b('kapsam', v, l)).join('')}</div><p class="ay-hint" data-ay-v="kapsam"></p>
</section>
<div class="ay-foot"><button type="button" data-ay-reset>Varsayılana dön</button></div>
</div>`;

  const wraps = $$('.ayar-wrap');
  wraps.forEach(w => w.insertAdjacentHTML('beforeend', html));

  const fontlariYukle = () => ['kitap', 'okunakli'].forEach(A.fontYukle);
  function boyutSimdi() {
    if (s.boyut) return s.boyut;
    const p = document.createElement('span'); p.style.cssText = 'position:absolute;visibility:hidden;font-size:var(--t-base)';
    document.body.appendChild(p); const v = Math.round(parseFloat(getComputedStyle(p).fontSize)); p.remove();
    return v || 18;
  }
  function yenile() {
    s = A.oku();
    const pen = KALEM[s.kalem] || KALEM.mavi;
    $$('.ayar').forEach(p => {
      p.style.setProperty('--pen-l', pen[1]); p.style.setProperty('--pen-d', pen[2]);
      $$('[data-k]', p).forEach(el => el.setAttribute('aria-pressed', String(String(s[el.dataset.k]) === el.dataset.v)));
      $$('[data-tgl]', p).forEach(el => el.setAttribute('aria-pressed', String(s[el.dataset.tgl] === '1')));
      const dn = $('[data-dinle]', p); dn.setAttribute('aria-pressed', String(ses.on)); $('span', dn).textContent = ses.on ? 'Durdur' : 'Dinle';
      dn.hidden = !('speechSynthesis' in window);
      $('[data-ay-v="kalem"]', p).textContent = pen[0];
      $('[data-ay-v="fosfor"]', p).textContent = (FOSFOR[s.fosfor] || FOSFOR.sari)[0];
      $('[data-ay-v="cevap"]', p).textContent = CEVAP[s.cevap] || '';
      $('[data-ay-v="kapsam"]', p).textContent = KAPSAM[s.kapsam] || '';
      const v = boyutSimdi(); $('.ay-size input', p).value = v; $('.ay-size output', p).textContent = v;
    });
  }
  function set(k, v) { s[k] = v; A.yaz(s); yenile(); if (k === 'odak') odak(); }

  // ---------------------------------------------------------------- panel aç/kapa
  function ac(w, open, klavye) {
    const p = $('.ayar', w), btn = $('[data-ayar-open]', w);
    p.hidden = !open; btn.setAttribute('aria-expanded', String(open));
    if (open) { yenile(); const t = $('[aria-selected="true"]', p); if (t && klavye) t.focus({ preventScroll: true }); }
  }
  wraps.forEach(w => {
    const p = $('.ayar', w);
    $('[data-ayar-open]', w).addEventListener('click', e => ac(w, p.hidden, e.detail === 0));
    p.addEventListener('click', e => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.ayTab) {
        $$('[data-ay-tab]', p).forEach(x => x.setAttribute('aria-selected', String(x === t)));
        $$('[data-ay-pane]', p).forEach(x => { x.hidden = x.dataset.ayPane !== t.dataset.ayTab; });
        if (t.dataset.ayTab === 'metin') fontlariYukle();
      } else if (t.dataset.k) set(t.dataset.k, t.dataset.v);
      else if (t.dataset.tgl) set(t.dataset.tgl, s[t.dataset.tgl] === '1' ? '0' : '1');
      else if (t.dataset.boyut) set('boyut', Math.min(24, Math.max(15, boyutSimdi() + Number(t.dataset.boyut))));
      else if (t.hasAttribute('data-dinle')) { ses.on ? sesDur() : sesBasla(); }
      else if (t.hasAttribute('data-ay-reset')) { s = Object.assign({}, A.D); A.yaz(s); yenile(); odak(); }
    });
    $('.ay-size input', p).addEventListener('input', e => set('boyut', Number(e.target.value)));
  });
  document.addEventListener('pointerdown', e => {
    wraps.forEach(w => { if (!$('.ayar', w).hidden && !w.contains(e.target)) ac(w, false); });
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    wraps.forEach(w => { if (!$('.ayar', w).hidden) { ac(w, false); $('[data-ayar-open]', w).focus(); } });
  });

  // ---------------------------------------------------------------- odak modu
  const bolum = () => $('.view:not([hidden]) .chapter') || $('.chapter');
  const odak = raf(() => {
    $$('.odak-on').forEach(el => { if (r.dataset.odak !== '1') el.classList.remove('odak-on'); });
    if (r.dataset.odak !== '1') return;
    const art = bolum(); if (!art) return;
    const y = innerHeight * 0.42;
    let best = null, bd = Infinity;
    for (const el of $$('.topic > *', art)) {
      const bb = el.getBoundingClientRect();
      if (!bb.height) continue;
      const d = bb.top > y ? bb.top - y : bb.bottom < y ? y - bb.bottom : 0;
      if (d < bd) { bd = d; best = el; }
      if (bb.top > y + innerHeight) break;
    }
    $$('.odak-on', art).forEach(el => { if (el !== best) el.classList.remove('odak-on'); });
    if (best) best.classList.add('odak-on');
  });
  addEventListener('scroll', odak, { passive: true });
  document.addEventListener('defter:view', () => { sesDur(); requestAnimationFrame(odak); });

  // ---------------------------------------------------------------- sesli okuma
  const ses = { on: false, q: [], i: 0, el: null, hiz: 1 };
  const bar = document.createElement('div');
  bar.className = 'dinle-bar'; bar.hidden = true;
  bar.innerHTML = '<span class="dl-dot"></span><span>Okunuyor</span><button type="button" data-dl-hiz>1×</button><button type="button" data-dl-dur>Durdur</button>';
  document.body.appendChild(bar);
  bar.addEventListener('click', e => {
    if (e.target.closest('[data-dl-dur]')) sesDur();
    else if (e.target.closest('[data-dl-hiz]')) {
      ses.hiz = ses.hiz >= 1.5 ? 1 : ses.hiz + 0.25;
      e.target.textContent = ses.hiz + '×';
      if (ses.on) { speechSynthesis.cancel(); oku(ses.i); }
    }
  });
  function parcala(t) {
    const out = []; let cur = '';
    for (const c of t.split(/(?<=[.!?…:;])\s+/)) {
      if ((cur + ' ' + c).length > 220 && cur) { out.push(cur); cur = c; } else cur = cur ? cur + ' ' + c : c;
    }
    if (cur) out.push(cur);
    return out;
  }
  function metin(el) {
    const c = el.cloneNode(true);
    $$('.anchor, .copy, .tag, svg, button', c).forEach(x => x.remove());
    return c.textContent.replace(/\s+/g, ' ').trim();
  }
  function sesBasla() {
    const art = bolum();
    if (!art || !('speechSynthesis' in window)) return;
    const els = $$('.t-head h2, .question, .topic > h3, .kisaca p, .topic > p, .topic > ul > li, .topic > ol > li, .callout-title, .callout-body p, .callout-body li, .ozet span', art)
      .filter(el => !el.closest('.quiz, .ask, .tbl, .codeblock'));
    const ilk = els.findIndex(el => el.getBoundingClientRect().bottom > 90);
    ses.q = [];
    els.slice(Math.max(0, ilk)).forEach(el => parcala(metin(el)).forEach(t => t && ses.q.push({ el, t })));
    if (!ses.q.length) return;
    ses.on = true; bar.hidden = false; yenile();
    oku(0);
  }
  function oku(i) {
    if (!ses.on) return;
    if (i >= ses.q.length) return sesDur();
    ses.i = i;
    const { el, t } = ses.q[i];
    if (ses.el !== el) {
      if (ses.el) ses.el.classList.remove('okunuyor');
      ses.el = el; el.classList.add('okunuyor');
      const bb = el.getBoundingClientRect();
      if (bb.top < 80 || bb.bottom > innerHeight - 120) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    const u = new SpeechSynthesisUtterance(t);
    const lang = (r.lang || 'tr').toLowerCase();
    const v = speechSynthesis.getVoices().find(x => x.lang.toLowerCase().startsWith(lang));
    if (v) u.voice = v;
    u.lang = v ? v.lang : lang; u.rate = ses.hiz;
    u.onend = () => { if (ses.on && ses.i === i) oku(i + 1); };
    u.onerror = e => { if (e.error !== 'interrupted' && e.error !== 'canceled') sesDur(); };
    speechSynthesis.speak(u);
  }
  function sesDur() {
    if (!ses.on && !ses.el) return;
    ses.on = false; bar.hidden = true;
    try { speechSynthesis.cancel(); } catch (e) {}
    if (ses.el) ses.el.classList.remove('okunuyor');
    ses.el = null; yenile();
  }

  yenile(); odak();
})();
