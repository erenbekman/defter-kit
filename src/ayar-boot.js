(function () {
  var r = document.documentElement, K = 'defter:ayar';
  var D = { tema: 'oto', kalem: 'mavi', fosfor: 'sari', harita: '1', numara: '0', odak: '0', font: 'serif', boyut: 0, aralik: 'dengeli', genislik: 'dengeli', hiza: 'sol', paragraf: 'aralik', cevap: 'dengeli', kapsam: 'bolum' };
  var TEMA = { kagit: ['light'], sepya: ['light', 'sepya'], kar: ['light', 'kar'], gece: ['dark'], murekkep: ['dark', 'murekkep'] };
  var FONT = { kitap: 'Literata:ital,opsz,wght@0,7..72,400..600;1,7..72,400', okunakli: 'Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400' };
  function oku() {
    var s = {};
    try { s = JSON.parse(localStorage.getItem(K) || '{}') || {}; } catch (e) {}
    if (!s.tema) { try { var t = localStorage.getItem('defter:theme'); if (t) s.tema = t === 'dark' ? 'gece' : 'kagit'; } catch (e) {} }
    var o = {}; for (var k in D) o[k] = s[k] == null ? D[k] : s[k];
    return o;
  }
  function uygula(s) {
    var t = TEMA[s.tema] || [];
    if (t[0]) r.setAttribute('data-theme', t[0]); else r.removeAttribute('data-theme');
    if (t[1]) r.setAttribute('data-palette', t[1]); else r.removeAttribute('data-palette');
    for (var k in D) {
      if (k === 'tema' || k === 'boyut') continue;
      if (String(s[k]) !== String(D[k])) r.setAttribute('data-' + k, s[k]); else r.removeAttribute('data-' + k);
    }
    if (s.boyut) r.style.setProperty('--t-base', s.boyut + 'px'); else r.style.removeProperty('--t-base');
    fontYukle(s.font);
  }
  function fontYukle(k) {
    var f = FONT[k];
    if (!f || document.getElementById('font-' + k)) return;
    var l = document.createElement('link'); l.id = 'font-' + k; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + f + '&display=swap';
    document.head.appendChild(l);
  }
  function yaz(s) { try { localStorage.setItem(K, JSON.stringify(s)); } catch (e) {} uygula(s); }
  window.defterAyar = { D: D, oku: oku, yaz: yaz, uygula: uygula, fontYukle: fontYukle };
  uygula(oku());
})();
