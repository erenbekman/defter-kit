# defter-kit

Kendi öğrenme defterini kur. Okuduğun yazıyı, izlediğin videoyu ya da Claude'la yaptığın bir sohbeti "deftere ekle" dersin; bilgi doğrulanır, defterde zaten olan ayıklanır, kalan kısım kendi cümlelerinle ve kaynağıyla doğru bölüme yazılır. Okumayı dış sitelerde değil, kendi defterinde yaparsın.

*Build your own learning notebook: tell Claude "add this to my defter" from any chat and it lands in the right chapter, verified and sourced. Turkish first.*

## Ne var içinde?

| Parça | Ne yapar |
|---|---|
| **Motor** (`src/`) | Markdown'ı çok sayfalı bir siteye ve tek dosyalık bir Claude artifact'ına derler: arama, "öğrendim" işaretleri, açık/koyu tema, okuma kuyruğu. Tek bağımlılık: `marked`. |
| **`defter` eklentisi** (`plugin/`) | Herkes için aynı skill. Defterini kendisi bulur; herhangi bir Claude sohbetinden ekler, ilgili konuyu bulur, yoksa konu, sayfa ya da kategori açar. Kişisel adres içermez. |
| **Kurulum** (`scripts/yeni-defter.mjs`) | Adın, konun ve kategorilerinle boş bir defter kurar. |
| **Kural dosyası** (`CLAUDE.md`) | Defterin üslubu ve blok sözlüğü. Senin defterin, senin kuralların: değiştirebilirsin. |

Bu depo aynı zamanda derlenebilen bir örnek defterdir: `npm install && npm run dev`.

## Kurmak

**1. Skill'i kur (bir kez).**

```bash
npx skills add erenbekman/defter-kit -g
```

Claude Code, Cursor, Codex, OpenCode ve diğer kodlama ajanlarına kurar (`-g`: bütün projelerde; Claude Code için `~/.claude/skills/defter`). Güncellemek için `npx skills update defter`. ([skills.sh](https://skills.sh))

Diğer yollar:

- **claude.ai, masaüstü ve mobil:** Customize → Plugins → pazar ekle: `erenbekman/defter-kit` → `defter`'i kur. Hesabına bağlanır, Claude Code'a da kendiliğinden gelir.
- **Claude Code eklentisi olarak:**
  ```bash
  claude plugin marketplace add erenbekman/defter-kit
  claude plugin install defter@defter-kit
  ```

**2. Defterini kur.** Herhangi bir sohbette "yeni defter kur" de. Adını, konunu ve başlangıç kategorilerini sorar; GitHub'da açtığın boş depoya (varsayılan adı `defter`) kurar, artifact olarak yayınlar ve ilk eklemeyi seninle yapar.

**3. Kullan.** Bundan sonra her sohbette "deftere ekle". Skill defterini kendisi bulur: çalışma klasörü → mesajın → hafızandaki `defterim: sahip/depo` satırı → `<github-adın>/defter`.

**Kendi defterin, kendi kuralların.** Üslup, okur ve kurallar defterinin `CLAUDE.md`'sinde; ad ve görünüm `defter.config.json`'da. İstediğin gibi değiştir ya da "defterimi özelleştir: …" de. Eklenti ve motor güncellemeleri bu dosyalara dokunmaz; motoru güncellemek için "motoru güncelle" de.

**Elle.**

```bash
git clone --depth 1 https://github.com/erenbekman/defter-kit
cd defter-kit
node scripts/yeni-defter.mjs ../benim-defterim --sahip "Ayşe Yılmaz" --konu "ürün yönetimi ve UX" \
  --kategoriler "ux=UX: Kullanıcı araştırması ve arayüz|urun=Ürün: Yol haritası ve metrikler"
cd ../benim-defterim && npm install && npm run dev
```

Eklentiyi kurduktan sonra skill bu defteri `<github-adın>/defter` adından ya da çalışma klasöründen bulur.

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
| "defterimi özelleştir: …" | Üslup, kategori ya da görünüm değişikliği senin dosyalarına yazılır |
| "motoru güncelle" | Sadece motor yenilenir; içeriğine ve kurallarına dokunulmaz |
| "defterimi yayınla" | Herkese açık site (Vercel) |

Sohbet depoya yazamıyorsa skill kaydı kuyruğa bırakır: defter deposunda `kuyruk` etiketli bir issue ya da artifact'taki okuma kuyruğu. Telefondan ya da tarayıcıdan da issue açarak kuyruğa ekleyebilirsin.

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
