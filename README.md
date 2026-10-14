# defter-kit

Kendi öğrenme defterini kur. Okuduğun yazıyı, izlediğin videoyu ya da Claude'la yaptığın bir sohbeti "deftere ekle" dersin; bilgi doğrulanır, defterde zaten olan ayıklanır, kalan kısım kendi cümlelerinle ve kaynağıyla doğru bölüme yazılır. Okumayı dış sitelerde değil, kendi defterinde yaparsın.

*Build your own learning notebook: tell Claude "add this to my defter" from any chat and it lands in the right chapter, verified and sourced. Turkish first.*

## Ne var içinde?

| Parça | Ne yapar |
|---|---|
| **Motor** (`src/`) | Markdown'ı çok sayfalı bir siteye ve tek dosyalık bir Claude artifact'ına derler: arama, "öğrendim" işaretleri, açık/koyu tema, okuma kuyruğu. Tek bağımlılık: `marked`. |
| **`defter` skill'i** (`skill/defter/SKILL.md`) | Herhangi bir Claude sohbetinden deftere ekler; ilgili konuyu bulur, yoksa konu, sayfa ya da kategori açar. |
| **Kurulum** (`scripts/yeni-defter.mjs`) | Adın, konun ve kategorilerinle boş bir defter kurar. |
| **Kural dosyası** (`CLAUDE.md`) | Defterin üslubu ve blok sözlüğü. Senin defterin, senin kuralların: değiştirebilirsin. |

Bu depo aynı zamanda derlenebilen bir örnek defterdir: `npm install && npm run dev`.

## Kurmak

**Claude ile (önerilen).** `skill/defter/SKILL.md` dosyasını Claude'a skill olarak ekle, sonra bir sohbette "yeni defter kur" de. Adını, konunu ve başlangıç kategorilerini sorar; GitHub'da açtığın boş depoya kurar ve defteri bir artifact olarak yayınlar.

**Elle.**

```bash
git clone --depth 1 https://github.com/erenbekman/defter-kit
cd defter-kit
node scripts/yeni-defter.mjs ../benim-defterim --sahip "Ayşe Yılmaz" --konu "ürün yönetimi ve UX" \
  --kategoriler "ux=UX: Kullanıcı araştırması ve arayüz|urun=Ürün: Yol haritası ve metrikler"
cd ../benim-defterim && npm install && npm run dev
```

Yeni defterin içinde adresleri doldurulmuş kendi `skill/defter/SKILL.md`'si de olur; onu Claude'a eklersin.

## Kullanmak

| Ne dersin | Ne olur |
|---|---|
| "deftere ekle" + link, metin, görsel | Doğrulanır, defterde olmayan kısım ilgili konuya eklenir |
| "direkt ekle" | Araştırma yapılmaz; verdiğin bilgi defter biçimine sokulur |
| "daha detaylı ekle" | Birincil kaynaklardan araştırılır, kod örnekleri çalıştırılır |
| "şu konunun altına ekle", "yeni bölüm aç: Redis" | Yeri sen seçersin |
| "bu sohbetten öğrendiklerimi ekle" | Sohbetteki kalıcı bilgi süzülür |
| "defterde X ne diyor?" | Defterden cevaplar, bağlantı verir |
| "kuyruğu işle" | Okuma kuyruğundaki linkler ve notlar sırayla işlenir |

Sohbet depoya yazamıyorsa skill kaydı defterin okuma kuyruğuna bırakır; kuyruğa artifact'taki formdan link ya da not da eklenebilir.

## Bir konu nasıl görünür?

```markdown
## Idempotency {#idempotency}
?> Aynı isteği iki kez göndermek neden tehlikeli?

:::kisaca
Asansör düğmesine beş kez basmak asansörü beş kez çağırmaz.
:::

Gövde: açıklama, tablo, kod.

:::tuzak Tuzak: retry'ı idempotency'siz açmak
...
:::

:::ozet
Tek cümlelik özet.
:::

:::quiz
Soru?
---
**Cevap.** Açıklama.
:::
```

Bütün bloklar (`:::okuma`, `:::duzeltme`, `:::akis`, `:::kavramlar`…) [CLAUDE.md](CLAUDE.md)'de.

## Komutlar

```bash
npm run build   # content/ → dist/ (site) + dist/defter.html (tek dosya, artifact)
npm run check   # kırık bağlantı, tekrar eden id
npm run dev     # http://localhost:4321
```

`dist/` Vercel'e doğrudan yüklenebilir (`vercel.json` hazır).

---

[Eren Bekman](https://github.com/erenbekman)'ın kendi defteri için yazdığı motordan çıkarıldı.
