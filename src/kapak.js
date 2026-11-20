// Kapak üretici: her kategori ya da not grubu, adından türetilen bir palet ve desenle kendi kapağını alır.
// Rastgele değil: aynı ad hep aynı kapağı verir. Resim dosyası yok, hepsi SVG.
var defterKapak = (function () {
  function hash(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed || 1; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // [zemin, yazı, vurgu, ikinci renk] — yazı/zemin kontrastı 4.5:1 üstünde
  const PALET = [
    ['#cbb8ea', '#1f1a44', '#d4572a', '#1f1a44'],
    ['#f1ead6', '#1d2a6b', '#3346c9', '#6b6f8a'],
    ['#a3a982', '#25260f', '#6a3fd0', '#25260f'],
    ['#e3a08b', '#3e1210', '#c2402e', '#4a1712'],
    ['#efede6', '#16161a', '#d65c2c', '#16161a'],
    ['#2f5a3f', '#f3ecd2', '#f0e1a8', '#c9d8b8'],
    ['#bfd3e2', '#14233a', '#c7432f', '#14233a'],
    ['#18181a', '#f4f2ea', '#d4ec5a', '#f4f2ea'],
    ['#d5713b', '#fff6ec', '#fff6ec', '#7a2d10'],
    ['#dcc24d', '#221f0b', '#221f0b', '#5d4f0e'],
    ['#1b2650', '#eef1fb', '#8fb3ff', '#eef1fb'],
    ['#efe6d4', '#2b2214', '#c9971f', '#2b2214'],
    ['#3a2c66', '#f3eefe', '#f08a4b', '#f3eefe'],
    ['#d3e3cf', '#14301e', '#3b6fd6', '#14301e'],
    ['#ecdcd8', '#4a1420', '#b8344a', '#4a1420'],
    ['#e4e7ee', '#121725', '#3c55d6', '#121725'],
  ];

  // Desenler 100×100'lük alana çizer; r() tohumlu rastgele, p palet
  const DESEN = [
    function sekiller(r, p) {          // şekil ızgarası, bazıları vurgulu
      let s = '';
      for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) {
        const cx = 10 + x * 16, cy = 10 + y * 16, k = (x + y * 3) % 4, on = r() < .3, fill = y === 0 ? p[1] : on ? p[2] : 'none', st = y === 0 ? 'none' : on ? 'none' : p[1];
        const a = `fill="${fill}" stroke="${st}" stroke-width="1.1" opacity="${on || !y ? 1 : .55}"`;
        if (k === 0) s += `<circle cx="${cx}" cy="${cy}" r="4.6" ${a}/>`;
        else if (k === 1) s += `<rect x="${cx - 4.3}" y="${cy - 4.3}" width="8.6" height="8.6" ${a}/>`;
        else if (k === 2) s += `<path d="M${cx} ${cy - 5}L${cx + 5} ${cy + 4}H${cx - 5}Z" ${a}/>`;
        else s += `<path d="M${cx} ${cy - 5.5}L${cx + 5.5} ${cy}L${cx} ${cy + 5.5}L${cx - 5.5} ${cy}Z" ${a}/>`;
      }
      return s;
    },
    function noktaDalga(r, p) {        // dağınık noktalar ve iki kesişen dalga
      let s = '';
      for (let i = 0; i < 90; i++) s += `<circle cx="${(r() * 100).toFixed(1)}" cy="${(r() * 100).toFixed(1)}" r="${(.5 + r() * .7).toFixed(2)}" fill="${p[3]}" opacity=".55"/>`;
      const f = 1 + r() * 1.5, ph = r() * 6;
      for (let x = 0; x <= 100; x += 3.4) {
        s += `<circle cx="${x}" cy="${(50 + 22 * Math.sin(x / 100 * Math.PI * 2 * f + ph)).toFixed(1)}" r="1.9" fill="${p[2]}"/>`;
        s += `<circle cx="${x}" cy="${(50 - 22 * Math.sin(x / 100 * Math.PI * 2 * f + ph)).toFixed(1)}" r="1.9" fill="${p[2]}"/>`;
      }
      return s;
    },
    function yaylar(r, p) {            // dönen yay ızgarası
      let s = '';
      for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
        const cx = 12 + x * 19, cy = 12 + y * 19, rot = (x + y) * 18 + r() * 20, on = x > y;
        s += `<path d="M${cx + 7} ${cy}A7 7 0 1 1 ${cx} ${cy - 7}" fill="none" stroke="${on ? p[2] : p[1]}" stroke-width="2" stroke-linecap="round" transform="rotate(${rot.toFixed(0)} ${cx} ${cy})"/>`;
      }
      return s;
    },
    function lekeler(r, p) {           // yuvarlak lekeler ızgarası
      let s = '';
      for (let y = 0; y < 5; y++) for (let x = 0; x < 4; x++) {
        const cx = 14 + x * 24, cy = 12 + y * 19, rr = 7 + r() * 2.5, c = r() < .3 ? p[1] : p[2];
        const n = 5 + Math.floor(r() * 4); let d = '';
        for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, q = rr * (.82 + r() * .3); d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * q).toFixed(1)} ${(cy + Math.sin(a) * q).toFixed(1)}`; }
        s += `<path d="${d}Z" fill="${c}" stroke="${c}" stroke-width="3" stroke-linejoin="round"/>`;
      }
      return s;
    },
    function ag(r, p) {                // ağ: düğümler ve bağlantılar
      const n = 9, pts = [];
      for (let i = 0; i < n; i++) pts.push([12 + r() * 76, 12 + r() * 76]);
      let s = '';
      const c = [50, 50];
      pts.forEach((q, i) => { s += `<line x1="${c[0]}" y1="${c[1]}" x2="${q[0].toFixed(1)}" y2="${q[1].toFixed(1)}" stroke="${p[1]}" stroke-width="1"/>`; const o = pts[(i + 3) % n]; if (r() < .5) s += `<line x1="${q[0].toFixed(1)}" y1="${q[1].toFixed(1)}" x2="${o[0].toFixed(1)}" y2="${o[1].toFixed(1)}" stroke="${p[1]}" stroke-width=".6" stroke-dasharray="1.5 2"/>`; });
      pts.forEach(q => { s += `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="2.6" fill="${p[1]}"/>`; });
      for (let i = 0; i < 26; i++) s += `<circle cx="${(r() * 100).toFixed(1)}" cy="${(r() * 100).toFixed(1)}" r=".7" fill="${p[3]}" opacity=".6"/>`;
      return s + `<circle cx="50" cy="50" r="5" fill="${p[2]}"/>`;
    },
    function halkalar(r, p) {          // köşeden yayılan halkalar
      const cx = r() < .5 ? 8 : 92, cy = 70 + r() * 25; let s = '';
      for (let i = 1; i < 16; i++) s += `<circle cx="${cx}" cy="${cy}" r="${(i * i * .55 + 2).toFixed(1)}" fill="none" stroke="${i < 6 ? p[2] : p[3]}" stroke-width="${i < 6 ? 1.3 : .7}" opacity="${i < 6 ? 1 : .7}"/>`;
      return s;
    },
    function pikseller(r, p) {         // köşegende toplanan piksel kümeleri
      let s = '';
      for (let y = 0; y < 25; y++) for (let x = 0; x < 25; x++) {
        const d = Math.abs(x - y - 2 + Math.sin(y / 3) * 3), q = d < 3 ? .75 : d < 6 ? .25 : .03;
        if (r() < q) s += `<rect x="${x * 4}" y="${y * 4}" width="3.4" height="3.4" fill="${d < 3 ? p[2] : p[1]}"/>`;
      }
      return s;
    },
    function sutunlar(r, p) {          // sütunlar, biri vurgulu
      const n = 3 + Math.floor(r() * 2), w = 80 / n, hi = Math.floor(r() * n); let s = '';
      for (let i = 0; i < n; i++) {
        const x = 10 + i * w + 3, ww = w - 6, c = i === hi ? p[2] : p[1];
        s += `<rect x="${x - 2}" y="14" width="${ww + 4}" height="4" fill="${c}"/><rect x="${x - 2}" y="82" width="${ww + 4}" height="4" fill="${c}"/>`;
        for (let k = 0; k < 5; k++) s += `<rect x="${(x + k * ww / 5 + .6).toFixed(1)}" y="19" width="${(ww / 5 - 1.4).toFixed(1)}" height="62" fill="${c}"/>`;
      }
      return s;
    },
    function dalgalar(r, p) {          // ince dalga çizgileri, bir kalın vurgu
      let s = ''; const f = 1 + r(), ph = r() * 6;
      for (let i = 0; i < 14; i++) {
        let d = ''; const y0 = 4 + i * 7.2, amp = 4 + i * .5;
        for (let x = 0; x <= 100; x += 4) d += `${x ? 'L' : 'M'}${x} ${(y0 + amp * Math.sin(x / 100 * Math.PI * 2 * f + ph + i * .25)).toFixed(1)}`;
        s += `<path d="${d}" fill="none" stroke="${i === 7 ? p[2] : p[1]}" stroke-width="${i === 7 ? 5 : .6}" stroke-linecap="round" opacity="${i === 7 ? 1 : .8}"/>`;
      }
      return s;
    },
    function kure(r, p) {              // yarım ton küre
      let s = '';
      for (let y = 0; y < 22; y++) for (let x = 0; x < 22; x++) {
        const cx = 6 + x * 4.2, cy = 6 + y * 4.2, d = Math.hypot(cx - 50, cy - 50);
        if (d > 44) continue;
        const rr = 1.6 * (1 - d / 50) + .25;
        s += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rr.toFixed(2)}" fill="${d < 22 + r() * 6 ? p[2] : p[3]}"/>`;
      }
      return s;
    },
    function sarmal(r, p) {            // DNA benzeri sarmal
      let s = '';
      for (let i = 0; i < 26; i++) {
        const y = 6 + i * 3.4, a = i * .55 + r() * .1, x1 = 50 + 26 * Math.sin(a), x2 = 50 - 26 * Math.sin(a);
        s += `<line x1="${x1.toFixed(1)}" y1="${y}" x2="${x2.toFixed(1)}" y2="${y}" stroke="${p[3]}" stroke-width=".5" opacity=".6"/>`;
        s += `<circle cx="${x1.toFixed(1)}" cy="${y}" r="2" fill="${p[2]}"/><circle cx="${x2.toFixed(1)}" cy="${y}" r="2" fill="${p[1]}"/>`;
      }
      return s;
    },
    function kafes(r, p) {             // kutu ve bağlantı şeması (sistem)
      let s = ''; const boxes = [];
      for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) if (r() < .7) boxes.push([10 + x * 30, 8 + y * 18]);
      boxes.forEach((b, i) => { const o = boxes[i + 1]; if (o) s += `<path d="M${b[0] + 20} ${b[1] + 5}H${o[0]}V${o[1] + 5}" fill="none" stroke="${p[1]}" stroke-width=".8"/>`; });
      boxes.forEach(b => { const on = r() < .3; s += `<rect x="${b[0]}" y="${b[1]}" width="20" height="10" fill="${on ? p[2] : 'none'}" stroke="${p[1]}" stroke-width="1"/>`; });
      return s;
    },
  ];

  const nf = new Intl.NumberFormat('tr-TR');
  // kapak({id, ad, alt, kelime, imza, sira}) → HTML. kalınlık kelime sayısıyla büyür.
  function kapak(o) {
    const h = hash(o.id || o.ad), r = rng(h), i = o.sira;
    // rafta sırası bilinen kapaklar birbirinden farklı palet ve desen alır (5 ve 7, 16 ve 12 ile aralarında asal)
    const p = PALET[i != null ? (i * 5 + 3) % PALET.length : h % PALET.length], desen = DESEN[i != null ? (i * 7 + 1) % DESEN.length : (h >>> 4) % DESEN.length];
    const kat = Math.max(0, Math.min(8, Math.round(Math.log2(Math.max(1, (o.kelime || 0) / 400)))));
    const ad = String(o.ad || '').trim();
    const sp = ad.indexOf(' ');
    const ust = sp > 0 && ad.length > 14 ? ad.slice(0, sp) : ad, alt1 = sp > 0 && ad.length > 14 ? ad.slice(sp + 1) : '';
    const yerAlt = (h >>> 8) % 3 === 0;    // başlık bazen altta
    const baslik = `<div class="kp-t"><b>${esc(ust)}</b>${alt1 ? `<i>${esc(alt1)}</i>` : ''}${o.alt ? `<small>${esc(o.alt)}</small>` : ''}</div>`;
    const resim = `<svg class="kp-i" viewBox="0 0 100 100" aria-hidden="true" preserveAspectRatio="xMidYMid meet">${desen(r, p)}</svg>`;
    return `<span class="kapak${yerAlt ? ' alt' : ''}" style="--kp-bg:${p[0]};--kp-ink:${p[1]};--kp-ac:${p[2]};--kp-kat:${kat}">` +
      `<span class="kp-yuz">${yerAlt ? resim + '<span class="kp-cizgi"></span>' + baslik : baslik + resim}` +
      `<span class="kp-f"><span>${esc(o.imza || '')}</span><span>${nf.format(o.kelime || 0)} kelime</span></span></span></span>`;
  }
  return { kapak, hash };
})();
