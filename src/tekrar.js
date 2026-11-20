// Tekrar: aralıklı tekrar (Leitner kutuları). Kartlar build'de :::quiz ve :::kartlar bloklarından çıkar (#kart-data).
// Bir konunun kartları "Öğrendim" deyince ya da rafı tekrara açınca sıraya girer. İlerleme veritabanında (tekrar),
// veritabanı yoksa bu tarayıcıda tutulur.
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const kartEl = document.getElementById('kart-data');
  const view = $('[data-view="tekrar"]');
  if (!kartEl || !view) return;
  const KARTLAR = JSON.parse(kartEl.textContent);
  const META = JSON.parse(document.getElementById('defter-meta').textContent);
  const box = $('[data-tk]', view);

  const ARALIK = [1, 2, 4, 7, 15, 30, 60, 120];       // kutu → gün
  const YENI_GUNLUK = 12;
  const katRaf = Object.fromEntries((META.cats || []).map(c => [c.id, c.raf || '']));
  const katAd = Object.fromEntries((META.cats || []).map(c => [c.id, c.name]));
  const rafAd = Object.fromEntries((META.raflar || []).map(r => [r.id, r.ad]));
  const sayfa = Object.fromEntries((META.pages || []).map(p => [p.id, p]));
  const RAFLAR = (META.raflar || []).filter(r => KARTLAR.some(k => katRaf[k.c] === r.id));

  const bugun = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const gunEkle = n => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const gunYazi = n => n <= 1 ? 'yarın' : n < 30 ? `${n} gün` : n < 60 ? '1 ay' : `${Math.round(n / 30)} ay`;
  const LKEY = 'defter:tekrar';
  const yerel = () => { try { return JSON.parse(localStorage.getItem(LKEY) || '{}') || {}; } catch (e) { return {}; } };
  const bitti = () => { try { return JSON.parse(localStorage.getItem('defter:done') || '{}') || {}; } catch (e) { return {}; } };

  const S = { col: null, il: {}, ayar: { raflar: [] }, raf: 'hepsi', sira: [], i: 0, acik: false, tekrar: new Set(), oturum: { dogru: 0, toplam: 0 } };

  function uygun(k) {
    return !!(S.il[k.id] || bitti()[k.s] || (S.ayar.raflar || []).includes(katRaf[k.c]));
  }
  function durum() {
    const t = bugun(), hepsi = KARTLAR.filter(uygun);
    const vadeli = hepsi.filter(k => S.il[k.id] && S.il[k.id].sonraki <= t);
    const bugunYeni = Object.values(S.il).filter(x => x && x.ilk === t).length;
    const yeniler = hepsi.filter(k => !S.il[k.id]);
    return { hepsi, vadeli, yeniler, yeniHak: Math.max(0, YENI_GUNLUK - bugunYeni), usta: Object.values(S.il).filter(x => x && x.kutu >= 5).length };
  }
  function siraKur() {
    const d = durum(), f = k => S.raf === 'hepsi' || katRaf[k.c] === S.raf;
    const vade = d.vadeli.filter(f).sort((a, b) => S.il[a.id].sonraki.localeCompare(S.il[b.id].sonraki) || Math.random() - .5);
    const yeni = d.yeniler.filter(f).slice(0, d.yeniHak);
    S.sira = vade.concat(yeni); S.i = 0; S.acik = false; S.tekrar = new Set(); S.oturum = { dogru: 0, toplam: 0 };
  }

  function ctaCiz() {
    const d = durum(), n = d.vadeli.length + Math.min(d.yeniler.length, d.yeniHak);
    $$('[data-tekrar-cta]').forEach(a => { a.textContent = n ? `Bugünün tekrarı: ${n} kart →` : 'Tekrar →'; });
  }

  function aralikIcin(k, not) {
    const x = S.il[k.id] || { kutu: 0 };
    if (not === 0) return 1;
    if (not === 1) return Math.max(1, Math.floor(ARALIK[Math.min(x.kutu, ARALIK.length - 1)] / 2));
    return ARALIK[S.il[k.id] ? Math.min((x.kutu || 0) + 1, ARALIK.length - 1) : 1];
  }

  function ciz() {
    const d = durum();
    const chips = [['hepsi', 'Hepsi']].concat(RAFLAR.map(r => [r.id, r.ad]));
    const say = id => d.vadeli.filter(k => id === 'hepsi' || katRaf[k.c] === id).length + Math.min(d.yeniHak, d.yeniler.filter(k => id === 'hepsi' || katRaf[k.c] === id).length);
    const k = S.sira[S.i];
    let govde;
    if (!d.hepsi.length) {
      govde = `<div class="tk-bos"><h2>Tekrarda henüz kart yok</h2><p>Bir konuyu okuyup <b>Öğrendim</b> dediğinde o konunun soruları buraya gelir. Ya da bir rafı bütünüyle tekrara aç:</p><div class="tk-raflar">${RAFLAR.map(r => `<button type="button" class="btn" data-raf-ac="${r.id}">${esc(r.ad)} rafını aç <small>${KARTLAR.filter(x => katRaf[x.c] === r.id).length} kart</small></button>`).join('')}</div></div>`;
    } else if (!k) {
      const yarin = d.hepsi.filter(x => S.il[x.id] && S.il[x.id].sonraki === gunEkle(1)).length;
      govde = `<div class="tk-bos tk-bitti"><h2>${S.oturum.toplam ? 'Bugünlük bitti' : 'Bugün tekrar edilecek kart yok'}</h2>${S.oturum.toplam ? `<p>${S.oturum.toplam} kart, ${S.oturum.dogru} tanesini bildin.</p>` : ''}<p>Yarın ${yarin} kart seni bekliyor.${d.yeniler.length && !d.yeniHak ? ' Bugünün yeni kart hakkı doldu.' : ''}</p>
${RAFLAR.filter(r => !(S.ayar.raflar || []).includes(r.id)).length ? `<div class="tk-raflar">${RAFLAR.filter(r => !(S.ayar.raflar || []).includes(r.id)).map(r => `<button type="button" class="btn" data-raf-ac="${r.id}">${esc(r.ad)} rafını aç</button>`).join('')}</div>` : ''}</div>`;
    } else {
      const p = sayfa[k.p], yeni = !S.il[k.id];
      govde = `<article class="tk-k${S.acik ? ' acik' : ''}" data-id="${esc(k.id)}">
<p class="tk-meta"><span class="tk-raf">${esc(rafAd[katRaf[k.c]] || katAd[k.c] || '')}</span> · ${esc(p ? p.short : '')}${yeni ? ' · <b>yeni</b>' : ''}<span class="tk-n">${S.i + 1} / ${S.sira.length}</span></p>
<div class="tk-q">${k.q}</div>
${S.acik ? `<div class="tk-a">${k.a}</div>
<div class="tk-btns"><button type="button" data-not="0">Bilemedim<small>${S.tekrar.has(k.id) ? 'yarın' : 'birazdan + yarın'}</small><kbd>1</kbd></button><button type="button" data-not="1">Zor<small>${gunYazi(aralikIcin(k, 1))}</small><kbd>2</kbd></button><button type="button" data-not="2" class="pri">Bildim<small>${gunYazi(aralikIcin(k, 2))}</small><kbd>3</kbd></button></div>
<a class="tk-git" href="${'#' + k.s}">Konuyu aç →</a>` : `<button type="button" class="btn pri tk-goster" data-goster>Cevabı göster <kbd>Boşluk</kbd></button>`}
</article>`;
    }
    box.innerHTML = `<header class="tk-head"><p class="eyebrow"><b>Tekrar</b> · ${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}</p><h1>Bugünün tekrarı</h1>
<p class="lede">Bildiğin kart seyrekleşir, takıldığın sıklaşır. Günde birkaç dakika, okuduğunu kalıcı yapar.</p>
<dl class="tk-stat"><div><dt>Bugün</dt><dd>${say('hepsi')}</dd></div><div><dt>Takipte</dt><dd>${d.hepsi.length}</dd></div><div><dt>Ustalaşılan</dt><dd>${d.usta}</dd></div><div><dt>Toplam kart</dt><dd>${KARTLAR.length}</dd></div></dl>
${RAFLAR.length > 1 ? `<div class="nv-chips" role="toolbar" aria-label="Raf">${chips.map(([id, ad]) => `<button type="button" data-tk-raf="${id}" aria-pressed="${S.raf === id}">${esc(ad)}<span>${say(id)}</span></button>`).join('')}</div>` : ''}</header>
<div class="tk-alan">${govde}</div>`;
    ctaCiz();
  }

  async function kaydet(id, x) {
    S.il[id] = x;
    if (S.col) { try { await S.col.doc(id).set(x); } catch (e) { /* yerelde kalır */ } }
    else { const y = yerel(); y[id] = x; try { localStorage.setItem(LKEY, JSON.stringify(y)); } catch (e) {} }
  }
  async function notVer(not) {
    const k = S.sira[S.i]; if (!k || !S.acik) return;
    const eski = S.il[k.id], t = bugun();
    const gun = aralikIcin(k, not);
    const kutu = not === 0 ? 0 : not === 1 ? Math.max(1, eski ? eski.kutu : 1) : (eski ? Math.min(eski.kutu + 1, ARALIK.length - 1) : 1);
    S.oturum.toplam++; if (not === 2) S.oturum.dogru++;
    if (not === 0 && !S.tekrar.has(k.id)) { S.tekrar.add(k.id); S.sira.push(k); }   // bilemediğin kart bu oturumda bir kez daha gelir
    S.i++; S.acik = false; ciz();
    await kaydet(k.id, { kutu, sonraki: gunEkle(gun), son: new Date().toISOString(), ilk: eski ? eski.ilk || t : t, dogru: (eski ? eski.dogru || 0 : 0) + (not === 2 ? 1 : 0), yanlis: (eski ? eski.yanlis || 0 : 0) + (not === 0 ? 1 : 0) });
  }
  async function rafAc(id) {
    S.ayar = { raflar: Array.from(new Set([...(S.ayar.raflar || []), id])) };
    if (S.col) { try { await S.col.doc('_ayar').set(S.ayar); } catch (e) {} }
    else { const y = yerel(); y._ayar = S.ayar; try { localStorage.setItem(LKEY, JSON.stringify(y)); } catch (e) {} }
    siraKur(); ciz();
  }

  box.addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.hasAttribute('data-goster')) { S.acik = true; ciz(); const b = $('[data-not="2"]', box); if (b) b.focus({ preventScroll: true }); }
    else if (t.dataset.not) notVer(Number(t.dataset.not));
    else if (t.dataset.tkRaf) { S.raf = t.dataset.tkRaf; siraKur(); ciz(); }
    else if (t.dataset.rafAc) rafAc(t.dataset.rafAc);
  });
  document.addEventListener('keydown', e => {
    if (view.hidden || e.metaKey || e.ctrlKey || e.altKey || e.target.closest('input, textarea, select, [contenteditable]')) return;
    if ((e.key === ' ' || e.key === 'Enter') && !S.acik && S.sira[S.i]) { e.preventDefault(); S.acik = true; ciz(); }
    else if (S.acik && ['1', '2', '3'].includes(e.key)) { e.preventDefault(); notVer(Number(e.key) - 1); }
  });
  document.addEventListener('defter:view', e => { if (e.detail && e.detail.id === 'tekrar') { if (!S.sira[S.i]) siraKur(); ciz(); } else ctaCiz(); });
  document.addEventListener('click', e => { if (e.target.closest('.done-btn')) setTimeout(ctaCiz, 0); });

  // başlangıç: önce yerel, sonra veritabanı
  const y0 = yerel(); S.ayar = y0._ayar || { raflar: [] }; delete y0._ayar; S.il = y0;
  siraKur(); ciz();
  (async () => {
    if (!window.claude || !window.claude.use) return;
    try {
      const db = await window.claude.use('db'); if (!db) return;
      const user = await window.claude.use('user');
      if (user && user.canEdit && (await user.canEdit()) === false) return;
      const col = db.collection('tekrar');
      let ilk = true;
      col.onSnapshot(async snap => {
        const il = {}; let ayar = null;
        snap.docs.forEach(d => { if (d.id === '_ayar') ayar = d.data(); else il[d.id] = d.data(); });
        if (ilk) {
          ilk = false; S.col = col;
          // bu tarayıcıda birikmiş ilerlemeyi bir kez taşı
          const yy = yerel(); const yAyar = yy._ayar; delete yy._ayar;
          for (const [id, x] of Object.entries(yy)) if (!il[id]) { il[id] = x; try { await col.doc(id).set(x); } catch (e) {} }
          if (yAyar && yAyar.raflar && yAyar.raflar.length) { ayar = { raflar: Array.from(new Set([...((ayar && ayar.raflar) || []), ...yAyar.raflar])) }; try { await col.doc('_ayar').set(ayar); } catch (e) {} }
          try { localStorage.removeItem(LKEY); } catch (e) {}
          S.il = il; S.ayar = ayar || { raflar: [] }; siraKur(); ciz(); return;
        }
        S.il = il; if (ayar) S.ayar = ayar;
        if (!S.sira[S.i]) siraKur();
        ctaCiz(); if (!view.hidden && !S.acik) ciz();
      }, () => { S.col = null; });
    } catch (e) { /* yerelde devam */ }
  })();
})();
