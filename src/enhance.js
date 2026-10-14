// Bölümlerdeki etkileşimli deneyler: call stack / event loop / kilit simülasyonları, softmax ve gradient descent.
// Eski tek dosyalık defterden taşındı; içerik sayfadaki data-sim ve id işaretlerine bağlanır.
export function enhance() {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // ---------- Simülasyonlar ----------
  const SIMS = {
    stack: {
      title: 'Tabak yığını', sub: 'call stack simülasyonu',
      panels: ['stack', 'out'],
      code: [
        'function multiply(a, b) {',
        '  return a * b;',
        '}',
        'function square(n) {',
        '  return multiply(n, n);',
        '}',
        'function printSquare(n) {',
        '  const s = square(n);',
        '  console.log(s);',
        '}',
        'printSquare(4);'
      ],
      steps: [
        { l: -1, stack: [['global()', 'multiply, square, printSquare hazır']], out: [], note: 'Oluşturma aşaması: Global Execution Context stack\'in dibine kondu. Üç function declaration da hoisting ile şimdiden hafızada.' },
        { l: 10, stack: [['global()', ''], ['printSquare(4)', 'n = 4, s = TDZ']], out: [], note: 'printSquare çağrıldı → yeni execution context açıldı ve yığının üstüne kondu. s henüz const olduğu için ölü bölgede.' },
        { l: 7, stack: [['global()', ''], ['printSquare(4)', 'n = 4, s = TDZ'], ['square(4)', 'n = 4']], out: [], note: 's\'yi hesaplamak için square çağrıldı. printSquare bekliyor, şef sadece en üstteki tabağa bakıyor.' },
        { l: 4, stack: [['global()', ''], ['printSquare(4)', 'n = 4, s = TDZ'], ['square(4)', 'n = 4'], ['multiply(4, 4)', 'a = 4, b = 4']], out: [], note: 'square da multiply\'ı çağırdı. Yığında 4 tabak var. Her tabağın kendi n / a / b değişkenleri ayrı.' },
        { l: 1, stack: [['global()', ''], ['printSquare(4)', 'n = 4, s = TDZ'], ['square(4)', 'n = 4']], out: [], note: 'multiply 16 döndürdü ve tabağı kaldırıldı (pop). Kontrol square\'e geri döndü.' },
        { l: 4, stack: [['global()', ''], ['printSquare(4)', 'n = 4, s = 16']], out: [], note: 'square da 16\'yı döndürüp yığından çıktı. printSquare\'deki s artık 16.' },
        { l: 8, stack: [['global()', ''], ['printSquare(4)', 'n = 4, s = 16'], ['console.log(16)', '']], out: ['16'], note: 'console.log da bir fonksiyon: o da kısa bir süre için yığına çıkıp konsola 16 yazdı.' },
        { l: 9, stack: [['global()', ''], ['printSquare(4)', 'n = 4, s = 16']], out: ['16'], note: 'console.log bitti ve kalktı. printSquare\'in kapanış süslü parantezine gelindi.' },
        { l: -1, stack: [['global()', '']], out: ['16'], note: 'printSquare bitti, tabağı kaldırıldı. Geriye sadece global kaldı. Script tamamen bitince o da stack\'ten çıkar.' }
      ]
    },
    loop: {
      title: 'Lunapark sırası', sub: 'event loop simülasyonu',
      panels: ['stack', 'web', 'micro', 'macro', 'out'],
      code: [
        "console.log('1');",
        "setTimeout(() => console.log('2'), 0);",
        "Promise.resolve().then(() => console.log('3'));",
        "queueMicrotask(() => console.log('4'));",
        "console.log('5');"
      ],
      steps: [
        { l: -1, stack: [['script', 'ilk task']], web: [], micro: [], macro: [], out: [], note: 'Script\'in kendisi ilk task olarak çalışmaya başlıyor. Bitene kadar başka hiçbir şey araya giremez.' },
        { l: 0, stack: [['script', ''], ["console.log('1')", '']], web: [], micro: [], macro: [], out: ['1'], note: 'Senkron kod: hemen çalıştı, konsola 1 yazıldı.' },
        { l: 1, stack: [['script', ''], ['setTimeout', '']], web: ['timer 0 ms → cb2'], micro: [], macro: [], out: ['1'], note: 'setTimeout bekleme işini tarayıcıya (mutfağa) devretti. JS beklemeden bir sonraki satıra geçecek.' },
        { l: 1, stack: [['script', '']], web: [], micro: [], macro: ['cb2 → log 2'], out: ['1'], note: 'Süre (0 ms) doldu, callback normal sıraya (Task Queue) girdi. Ama script hâlâ çalışıyor, sırası gelmedi.' },
        { l: 2, stack: [['script', ''], ['Promise.then', '']], web: [], micro: ['cb3 → log 3'], macro: ['cb2 → log 2'], out: ['1'], note: 'Promise zaten çözülmüş; .then callback\'i doğrudan hızlı geçiş sırasına (Microtask Queue) girdi.' },
        { l: 3, stack: [['script', ''], ['queueMicrotask', '']], web: [], micro: ['cb3 → log 3', 'cb4 → log 4'], macro: ['cb2 → log 2'], out: ['1'], note: 'queueMicrotask da hızlı geçiş sırasına ekledi. Sıra: cb3, cb4.' },
        { l: 4, stack: [['script', ''], ["console.log('5')", '']], web: [], micro: ['cb3 → log 3', 'cb4 → log 4'], macro: ['cb2 → log 2'], out: ['1', '5'], note: 'Son senkron satır: 5 yazıldı.' },
        { l: -1, stack: [], web: [], micro: ['cb3 → log 3', 'cb4 → log 4'], macro: ['cb2 → log 2'], out: ['1', '5'], note: 'Script bitti, stack boş. Event loop kuralı: önce microtask kuyruğunun TAMAMI boşaltılır.' },
        { l: 2, stack: [['cb3', 'microtask']], web: [], micro: ['cb4 → log 4'], macro: ['cb2 → log 2'], out: ['1', '5', '3'], note: 'cb3 çalıştı: 3 yazıldı.' },
        { l: 3, stack: [['cb4', 'microtask']], web: [], micro: [], macro: ['cb2 → log 2'], out: ['1', '5', '3', '4'], note: 'cb4 çalıştı: 4 yazıldı. Hızlı geçiş sırası boşaldı.' },
        { l: -1, stack: [], web: [], micro: [], macro: ['cb2 → log 2'], out: ['1', '5', '3', '4'], note: 'Tarayıcı bu boşlukta ekranı çizebilir. Sonra normal sıradan sadece BİR task alınır.' },
        { l: 1, stack: [['cb2', 'task']], web: [], micro: [], macro: [], out: ['1', '5', '3', '4', '2'], note: 'Ve nihayet setTimeout\'un callback\'i: 2 yazıldı. "0 ms" dediği hâlde en sona kaldı.' },
        { l: -1, stack: [], web: [], micro: [], macro: [], out: ['1', '5', '3', '4', '2'], note: 'Bitti. Sonuç: 1 5 3 4 2 → önce senkron, sonra bütün microtask\'lar, en son task.' }
      ]
    },
    race: {
      title: 'Son ürün', sub: 'kilitsiz: race condition', stacked: true,
      panels: ['reqA', 'reqB', 'db', 'resBad'],
      code: [
        '$urun = Urun::find(1);              // stoğu oku',
        'if ($urun->stok > 0) {               // karar ver',
        '    $urun->stok = $urun->stok - 1;',
        '    $urun->save();                   // yaz',
        '    Siparis::create([...]);',
        '}'
      ],
      steps: [
        { l: -1, reqA: [], reqB: [], db: ['stok = 1'], resBad: [], note: 'Depoda tek ürün kaldı. Ayşe ve Burak aynı anda "Satın al"a bastı. İki ayrı PHP-FPM worker aynı kodu çalıştırıyor.' },
        { l: 0, reqA: ['okudu: stok = 1'], reqB: [], db: ['stok = 1'], resBad: [], note: 'A satırı okudu, hafızasında stok = 1.' },
        { l: 0, reqA: ['okudu: stok = 1'], reqB: ['okudu: stok = 1'], db: ['stok = 1'], resBad: [], note: 'A henüz yazmadan B de okudu. İkisi de aynı eski değeri görüyor. Boşluk burada açıldı.' },
        { l: 1, reqA: ['okudu: stok = 1', '1 > 0 ✓'], reqB: ['okudu: stok = 1', '1 > 0 ✓'], db: ['stok = 1'], resBad: [], note: 'İkisinin kararı da "stok var". İkisi de kendi hafızasındaki değere göre karar verdi.' },
        { l: 3, reqA: ['okudu: stok = 1', '1 > 0 ✓', 'yazdı: stok = 0'], reqB: ['okudu: stok = 1', '1 > 0 ✓'], db: ['stok = 0'], resBad: [], note: 'A, 1 − 1 = 0 hesaplayıp yazdı.' },
        { l: 3, reqA: ['okudu: stok = 1', '1 > 0 ✓', 'yazdı: stok = 0'], reqB: ['okudu: stok = 1', '1 > 0 ✓', 'yazdı: stok = 0'], db: ['stok = 0'], resBad: [], note: 'B de kendi hafızasındaki 1\'den 1 çıkarıp 0 yazdı. A\'nın yazdığını ezdi (lost update). Veritabanında hiçbir şey garip görünmüyor.' },
        { l: 4, reqA: ['okudu: stok = 1', '1 > 0 ✓', 'yazdı: stok = 0', 'sipariş #101'], reqB: ['okudu: stok = 1', '1 > 0 ✓', 'yazdı: stok = 0', 'sipariş #102'], db: ['stok = 0'], resBad: ['2 sipariş', '1 ürün'], note: 'Sonuç: elinde olmayan bir ürünü ikinci kez sattın. Hata yok, exception yok, log yok. Race condition\'ları sinsi yapan şey bu.' }
      ]
    },
    lock: {
      title: 'Son ürün', sub: 'satır kilidiyle', stacked: true,
      panels: ['reqA', 'reqB', 'db', 'res'],
      code: [
        'DB::transaction(function () {',
        '    $urun = Urun::lockForUpdate()->find(1);  // SELECT ... FOR UPDATE',
        '    if ($urun->stok > 0) {',
        '        $urun->decrement(\'stok\');',
        '        Siparis::create([...]);',
        '    }',
        '});                                          // COMMIT, kilit bırakılır'
      ],
      steps: [
        { l: -1, reqA: [], reqB: [], db: ['stok = 1'], res: [], note: 'Aynı senaryo: tek ürün, iki eş zamanlı istek. Bu kez okuma satırı kilitliyor.' },
        { l: 1, reqA: ['BEGIN', 'kilitledi, okudu: stok = 1'], reqB: [], db: ['stok = 1', 'kilit: A'], res: [], note: 'A satırı okurken kilitledi. Kumbaranın anahtarı artık A\'da.' },
        { l: 1, reqA: ['BEGIN', 'kilitledi, okudu: stok = 1'], reqB: ['BEGIN', 'kilit bekliyor…'], db: ['stok = 1', 'kilit: A'], res: [], note: 'B aynı satırı okumak istiyor ama kilit A\'da. B bekler; eski değeri göremez.' },
        { l: 3, reqA: ['BEGIN', 'kilitledi, okudu: stok = 1', '1 > 0 ✓ → stok = 0'], reqB: ['BEGIN', 'kilit bekliyor…'], db: ['stok = 0', 'kilit: A'], res: [], note: 'A karar verdi ve stoğu düşürdü.' },
        { l: 6, reqA: ['BEGIN', 'kilitledi, okudu: stok = 1', '1 > 0 ✓ → stok = 0', 'COMMIT · kilit bırakıldı'], reqB: ['BEGIN', 'kilit bekliyor…'], db: ['stok = 0'], res: [], note: 'A commit etti ve kilidi bıraktı. Sıra B\'de.' },
        { l: 1, reqA: ['BEGIN', 'kilitledi, okudu: stok = 1', '1 > 0 ✓ → stok = 0', 'COMMIT · kilit bırakıldı'], reqB: ['BEGIN', 'kilitledi, okudu: stok = 0'], db: ['stok = 0', 'kilit: B'], res: [], note: 'B şimdi kilidi aldı ve güncel değeri okudu: 0.' },
        { l: 2, reqA: ['BEGIN', 'kilitledi, okudu: stok = 1', '1 > 0 ✓ → stok = 0', 'COMMIT · kilit bırakıldı'], reqB: ['BEGIN', 'kilitledi, okudu: stok = 0', '0 > 0 ✗ → "Stok tükendi"', 'COMMIT'], db: ['stok = 0'], res: ['1 sipariş', '1 ürün', 'B\'ye doğru cevap'], note: 'Doğru sonuç. Bedeli: B birkaç milisaniye bekledi. Kilitli bölgeyi kısa tuttuğun sürece bu bekleme fark edilmez.' }
      ]
    }
  };
  const PANEL = {
    stack: ['Call Stack', 'stack', 'boş'],
    web: ['Web API (mutfak)', 'queue', 'bekleyen iş yok'],
    micro: ['Microtask Queue (hızlı geçiş)', 'queue micro', 'boş'],
    macro: ['Task Queue (normal sıra)', 'queue', 'boş'],
    out: ['Konsol', 'out', 'henüz çıktı yok'],
    reqA: ['İstek A · Ayşe', 'log', 'henüz başlamadı'],
    reqB: ['İstek B · Burak', 'log', 'henüz başlamadı'],
    db: ['Veritabanı · ürün #1', 'log db', '—'],
    res: ['Sonuç', 'out', 'henüz yok'],
    resBad: ['Sonuç', 'out bad', 'henüz yok']
  };

  document.querySelectorAll('.sim[data-sim]').forEach(root => {
    const def = SIMS[root.dataset.sim];
    let i = 0;
    if (def.stacked) root.classList.add('stacked');
    root.innerHTML =
      '<div class="sim-top"><div class="sim-title">' + def.title + '<small>' + def.sub + '</small></div>' +
      '<div class="sim-ctl"><button data-a="reset" type="button">Baştan</button><button data-a="prev" type="button">← Geri</button><button data-a="next" class="pri" type="button">İleri →</button></div></div>' +
      '<div class="sim-grid"><div class="sim-code">' +
      def.code.map((c, n) => '<div data-l="' + n + '"><span class="ln">' + (n + 1) + '</span>' + esc(c) + '</div>').join('') +
      '</div><div class="sim-panels">' +
      def.panels.map(p => '<div class="pnl ' + PANEL[p][1] + '" data-p="' + p + '"><h4><span>' + PANEL[p][0] + '</span></h4><div class="items"></div></div>').join('') +
      '</div></div><div class="sim-note" aria-live="polite"></div>';

    const lines = root.querySelectorAll('.sim-code div');
    const note = root.querySelector('.sim-note');
    const btn = a => root.querySelector('[data-a="' + a + '"]');

    function chip(item, p) {
      if (p === 'stack') return '<div class="chip">' + esc(item[0]) + (item[1] ? '<small>' + esc(item[1]) + '</small>' : '') + '</div>';
      return '<div class="chip">' + esc(item) + '</div>';
    }
    function draw() {
      const s = def.steps[i];
      lines.forEach((el, n) => el.classList.toggle('on', n === s.l));
      def.panels.forEach(p => {
        const box = root.querySelector('[data-p="' + p + '"] .items');
        const arr = s[p] || [];
        // stack: column-reverse → son eleman en üstte; ilk chip vurgulu olsun diye ters sırada yaz
        const list = p === 'stack' ? arr.slice().reverse() : arr;
        box.innerHTML = list.length ? list.map(x => chip(x, p)).join('') : '<span class="empty">' + PANEL[p][2] + '</span>';
        if (p === 'stack') box.style.flexDirection = 'column';
      });
      note.innerHTML = '<b>Adım ' + (i + 1) + '/' + def.steps.length + '</b>' + esc(s.note);
      btn('prev').disabled = i === 0;
      btn('next').disabled = i === def.steps.length - 1;
    }
    root.addEventListener('click', e => {
      const a = e.target.closest('button') && e.target.closest('button').dataset.a;
      if (!a) return;
      if (a === 'next' && i < def.steps.length - 1) i++;
      if (a === 'prev' && i > 0) i--;
      if (a === 'reset') i = 0;
      draw();
    });
    draw();
  });

  // ---------- Softmax / temperature deneyi ----------
  (function () {
    const LOG = [['oturdu', 4.0], ['uzandı', 3.2], ['atladı', 2.5], ['uyudu', 2.2], ['demokrasi', -3.0]];
    const inp = document.getElementById('temp');
    if (!inp) return;
    const box = document.getElementById('sm-bars'), val = document.getElementById('temp-val'), note = document.getElementById('sm-note');
    box.innerHTML = LOG.map(([w, z]) => '<div class="bar-row"><span>' + w + '<span class="lg">logit ' + z.toFixed(1) + '</span></span><div class="tr"><div class="fl"></div></div><span class="pc"></span></div>').join('');
    const rows = box.querySelectorAll('.bar-row');
    function draw() {
      const T = parseFloat(inp.value);
      const mx = Math.max(...LOG.map(l => l[1]));
      const ex = LOG.map(l => Math.exp((l[1] - mx) / T));
      const Z = ex.reduce((a, b) => a + b, 0);
      ex.forEach((e, k) => {
        const p = e / Z;
        rows[k].querySelector('.fl').style.width = (p * 100) + '%';
        rows[k].querySelector('.pc').textContent = p < 0.001 ? '<0.1%' : (p * 100).toFixed(1) + '%';
      });
      val.textContent = T.toFixed(1);
      const top = ex[0] / Z;
      note.innerHTML = '<b>T = ' + T.toFixed(1) + '</b>' + (T <= 0.3 ? 'Neredeyse deterministik: "oturdu" %' + (top * 100).toFixed(0) + '. Hep aynı cevap.' : T < 1 ? 'Keskin dağılım: en olası seçenek baskın, ara sıra ikinci çıkar.' : T <= 1.2 ? 'Modelin ham dağılımı: softmax tek başına.' : 'Düz dağılım: seçenekler yaklaşıyor, "demokrasi" bile %' + (ex[4] / Z * 100).toFixed(1) + ' şansa çıktı.');
    }
    inp.addEventListener('input', draw);
    draw();
  })();

  // ---------- Gradient descent deneyi ----------
  (function () {
    const svg = document.getElementById('gd-svg');
    if (!svg) return;
    const lr = document.getElementById('lr'), lrv = document.getElementById('lr-val'), note = document.getElementById('gd-note');
    const W0 = -2, X0 = 40, X1 = 400, Y0 = 20, Y1 = 190, WMIN = -4, WMAX = 10, LMAX = 50;
    const L = w => (w - 3) * (w - 3);
    const sx = w => X0 + (w - WMIN) / (WMAX - WMIN) * (X1 - X0);
    const sy = l => Y1 - Math.min(l, LMAX) / LMAX * (Y1 - Y0);
    let hist = [W0];
    let curve = '';
    for (let w = WMIN; w <= WMAX + 1e-9; w += 0.1) curve += (curve ? 'L' : 'M') + sx(w).toFixed(1) + ' ' + sy(L(w)).toFixed(1);
    let ticks = '';
    for (let w = -4; w <= 10; w += 2) ticks += '<line x1="' + sx(w) + '" y1="' + Y1 + '" x2="' + sx(w) + '" y2="' + (Y1 + 4) + '" stroke="var(--muted)"/><text x="' + sx(w) + '" y="' + (Y1 + 17) + '" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="var(--f-mono)">' + w + '</text>';
    function draw() {
      const eta = parseFloat(lr.value);
      lrv.textContent = eta.toFixed(2);
      let path = '', dots = '';
      hist.forEach((w, k) => {
        const x = sx(Math.max(WMIN, Math.min(WMAX, w))), y = sy(L(w));
        path += (k ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
        const last = k === hist.length - 1;
        dots += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (last ? 6 : 3.5) + '" fill="' + (last ? 'var(--hl)' : 'var(--accent)') + '" stroke="var(--ink)" stroke-width="' + (last ? 1.5 : 0) + '"/>';
      });
      svg.innerHTML =
        '<line x1="' + X0 + '" y1="' + Y1 + '" x2="' + X1 + '" y2="' + Y1 + '" stroke="var(--line)"/>' + ticks +
        '<text x="' + X1 + '" y="' + (Y1 - 6) + '" text-anchor="end" font-size="11" fill="var(--muted)" font-family="var(--f-mono)">w</text>' +
        '<text x="' + (X0 + 4) + '" y="' + (Y0 + 4) + '" font-size="11" fill="var(--muted)" font-family="var(--f-mono)">ℒ</text>' +
        '<path d="' + curve + '" fill="none" stroke="var(--muted)" stroke-width="2"/>' +
        '<line x1="' + sx(3) + '" y1="' + Y0 + '" x2="' + sx(3) + '" y2="' + Y1 + '" stroke="var(--ok)" stroke-dasharray="3 4"/>' +
        '<text x="' + (sx(3) + 5) + '" y="' + (Y0 + 12) + '" font-size="11" fill="var(--ok)" font-family="var(--f-mono)">dip: w = 3</text>' +
        '<path d="' + path + '" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="4 3"/>' + dots;
      const w = hist[hist.length - 1], n = hist.length - 1;
      const diverged = Math.abs(w - 3) > 50;
      note.innerHTML = '<b>Adım ' + n + '</b>w = ' + (diverged ? (w > 0 ? '+' : '−') + 'çok büyük' : w.toFixed(3)) + ' · ℒ = ' + (diverged ? '∞\'a gidiyor' : L(w).toFixed(3)) +
        (n === 0 ? ' · Gradyan = 2(w − 3) = −10: eğim aşağı, sağa doğru adım atılacak.' : Math.abs(w - 3) < 0.01 ? ' · Dibe ulaştı.' : Math.abs(w - 3) > 25 ? ' · Sapıyor: adımlar dipten uzaklaşıyor. η çok büyük.' : '');
    }
    document.getElementById('gd-step').addEventListener('click', () => {
      const eta = parseFloat(lr.value), w = hist[hist.length - 1];
      if (Math.abs(w - 3) > 1e6) return;
      hist.push(w - eta * 2 * (w - 3));
      draw();
    });
    document.getElementById('gd-reset').addEventListener('click', () => { hist = [W0]; draw(); });
    lr.addEventListener('input', () => { hist = [W0]; draw(); });
    draw();
  })();
}
