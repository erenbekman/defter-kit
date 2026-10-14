# Defter projesi: plan

> Bu dosya projenin tek plan kaynağıdır. Claude Code oturumları buradan devam eder: önce bu dosyayı oku, "Şimdi" bölümündeki ilk açık maddeyi al, bitince işaretle ve "Karar günlüğü"ne yaz.
> Son güncelleme: 14 Ekim 2026
>
> Bu dosya herkese açık: ürün ve teknik plan. Gelir, hedef kitle, ad ve alan adı, başarı hedefleri ve Eren'in kendi defterine ait işler özel `erenbekman/defter` deposundaki `PLAN-OZEL.md`'de.

## 1. Ne yapıyoruz?

**Sorun:** Okuduğumuz yazılar, izlediğimiz videolar ve AI sohbetlerinde öğrendiklerimiz dağılıyor. Medium listesine kaydedilir ve unutulur. Not uygulamalarına kopyalanır ve bir daha açılmaz.

**Çözüm:** Herkesin kendi öğrenme defteri olsun. Bir şey öğrendiğinde herhangi bir Claude sohbetinde "deftere ekle" dersin:
- Bilgi doğrulanır ve defterde zaten olan kısmı ayıklanır.
- Kalan kısım kendi cümlelerinle, kaynağıyla birlikte doğru bölüme yazılır.
- Kaynaktaki hatalar işaretlenir.
- Her konu bir benzetmeyle başlar, bir özet ve bir soruyla biter.

Okuma dış sitelerde değil, defterde yapılır.

**Kimin için:** Önce Türkçe konuşan öğrenenler. Sonra başka diller ve konular; motor konudan bağımsızdır.

**Ürün ölçüsü:** skill "deftere ekle" isteklerinin en az %90'ında yeri doğru seçiyor (bkz. Faz 2 eval).

Kimlerin ne için kullanacağı, deftere bilgi girme yolları, okuma ve tekrar biçimleri ve öncelik önerisi: [KULLANIM.md](KULLANIM.md). Fazların sırası oradaki önceliklere göre güncellenecek.

## 2. Bugün ne var? (v0.1)

| Parça | Nerede | Durum |
|---|---|---|
| Motor | `src/`: `build.mjs`, `app.js`, `style.css`, `check.mjs`, `serve.mjs`, `enhance.js` | Çalışıyor. Markdown'ı çok sayfalı site (`dist/`) ve tek dosya artifact'a (`dist/defter.html`) derliyor. Arama, ilerleme, tema, okuma kuyruğu var. Tek bağımlılık: `marked`. |
| Ayar | `defter.config.json` | Ad, sahip, imza, ana sayfa metinleri, repo, artifact. |
| Kural dosyası | Her defterin `CLAUDE.md`'si (şablon: `kit/CLAUDE.md`) | Üslup, blok sözlüğü, ekleme modları, kuyruk şeması. |
| Skill | `plugin/skills/defter/SKILL.md` (Claude eklentisi, pazar: `.claude-plugin/marketplace.json`) | v0.2. Global: defteri kendisi bulur. Ekle (direkt / standart / detaylı), yer seçme, sohbetten süzme, ara, düzelt, taşı, kuyruğu işle (issue + artifact), özelleştir, motoru güncelle, yayınla, yeni defter kur. |
| Kurulum | `scripts/yeni-defter.mjs` + `kit/` | Boş defter kuruyor; Türkçe iyelik ekini kendisi yapıyor. |
| Kuyruk | Artifact veritabanı, `kuyruk` koleksiyonu | Link ya da linksiz not; `mod` ve `hedef` alanları. |

İki depo var:

- **`erenbekman/defter-kit` (herkese açık):** motor, skill, kurulum ve örnek defter.
- **`erenbekman/defter` (özel):** Eren'in kişisel defteri; motorun ilk kullanıcısı.
  - Motor şu an orada geliştiriliyor ve `scripts/kit-esitle.mjs` ile kite kopyalanıyor.
  - Bu geçici bir düzen (K1).

## 3. Kararlar

Her açık kararın bir önerisi var. Onaylananlar "Karar günlüğü"ne taşınır.

### K1. Motorun evi neresi? *(açık, en önemli karar)*

| Seçenek | Artı | Eksi |
|---|---|---|
| A. Kopyala-eşitle (bugünkü durum) | Basit | Her defter motorun bir kopyasını taşır. Kullanıcıya güncelleme ulaşmaz. İki depo kayar. |
| B. **npm paketi** (`defter` CLI): defter deposu sadece `content/`, `data/`, `defter.config.json` ve `CLAUDE.md` taşır | Tek kaynak. Güncelleme `npm update` ile gelir. Eren'in defteri de bir kullanıcı olur. | Paket yayınlama ve sürümleme disiplini gerekir. |
| C. Git submodule/subtree | Paket yok | Kullanıcı için zor; skill için kırılgan |

**Öneri: B.**
- Geliştirme `defter-kit`'te yapılır; kit motorun tek kaynağı olur.
- Paket adı `defter` doluysa `@erenbekman/defter`. npm'de ad kontrolü yapılacak.
- Defterin kendine özel etkileşimli deneyleri (Eren'in softmax ve gradient descent deneyleri) motordan çıkar. Defterin kendi `enhance/` klasöründen yüklenir.

### K2. Lisans *(açık)*

**Öneri: MIT.** En serbest seçenek; sadece telif satırının korunmasını şart koşar.
- Lisans olmadan kod herkese açık görünür ama başkaları yasal olarak kullanamaz.
- Defter içerikleri her kullanıcının kendisine aittir; motor lisansı içeriği kapsamaz. Bunu README'ye yaz.

### K3. Skill nasıl dağıtılır? *(karar verildi: 14 Ekim 2026)*

1. **Claude Code eklentisi.**
   - Kit deposu aynı zamanda eklenti pazarı olur:
     - kökte `.claude-plugin/marketplace.json`;
     - `plugins/defter/` altında `.claude-plugin/plugin.json` ve `skills/defter/SKILL.md`.
   - Kullanıcı şu iki komutu çalıştırır:
     ```bash
     claude plugin marketplace add erenbekman/defter-kit
     claude plugin install defter@defter-kit
     ```
   - Doğrulandı: code.claude.com, "Create a marketplace", Ekim 2026.
2. **claude.ai skill'i:** aynı SKILL.md dosyası. Yükleme adımları resmî dokümandan doğrulanıp README'ye yazılacak.
3. **Kişiye özel adresler skill'de değil, depoda durur.**
   - Kişiye özel adresler: repo ve artifact.
   - Skill önce çalışma dizininde `defter.config.json` arar.
   - Bulamazsa kullanıcıya sorar ve cevabı hafızaya ya da proje dosyasına yazmayı önerir.
   - Böylece herkes aynı skill'i kurar ve güncelleme tek yerden gelir.

**Karar:** tek eklenti, tek SKILL.md (`plugin/skills/defter/SKILL.md`). claude.ai'de Customize → Plugins'ten eklenen pazar hesaba bağlanır ve Claude Code'a kendiliğinden gelir; skill sohbette, Cowork'te ve Claude Code'da yüklenir (claude.com/docs/plugins/platform-support, Ekim 2026). Kişisel adres skill'de yok; defter sırayla bulunur: çalışma klasörü → mesaj → hafızadaki `defterim:` satırı → `<github-adı>/defter`. Eklentinin `userConfig` özelliği kullanılmadı: claude.ai sohbetinde değer sormuyor. Aynı SKILL.md `npx skills add erenbekman/defter-kit -g` ile de kuruluyor (skills.sh CLI; Claude Code, Cursor, Codex ve diğer ajanlar); 14 Ekim 2026'da denendi, `~/.claude/skills/defter`'e kuruldu.

### K4. Defterler nerede yaşar? *(açık)*

| Seçenek | Not |
|---|---|
| **Kullanıcının GitHub'ı + kendi artifact'ı (bugün)** | Sunucu yok, maliyet yok, veri kullanıcıda. GitHub gerektirir. |
| Barındırılan servis | Kolay başlangıç, ama hesap, depolama ve güvenlik yükü getirir. |

**Öneri:** sunucusuz kal; servis ancak talep görülürse açılır. GitHub hesabı olmayanlar için bir ara yol düşünülebilir: sadece artifact'ta yaşayan defter. İçerik artifact veritabanında durur, sonra GitHub'a taşınabilir. Bu Faz 4'e konacak bir fikir.

### K5. Dil

Önce Türkçe. Arayüz metinleri (`Bölüm`, `Ara`, `Kısaca`, `Özetle`…) şu an kodun içinde ve Türkçe. Faz 4'te bir sözlük dosyasına taşınır ve `dil` ayarı İngilizceyi açar.

### K6. Ad ve alan adı

Ürün adı şimdilik "Defter". Alan adı kararı özel planda; Faz 3'teki tanıtım sayfasına kadar bekleyebilir.

## 4. Yol haritası

Her faz bir **kabul ölçütüyle** biter; ölçüt sağlanmadan sonraki faza geçilmez.

### Faz 0: Temizlik (1–2 oturum)

- [ ] **Lisans:** K2 onaylanınca `LICENSE` (MIT) ekle; README'ye "içerik sizindir" notunu yaz.
- [ ] **Geliştirici kuralları:** kit kökündeki `CLAUDE.md` şu an örnek defterin içerik kurallarını taşıyor. Ayır:
  - kök `CLAUDE.md` geliştirici rehberi olur (bu plan, komutlar, motor mimarisi, test);
  - içerik kuralları `kit/CLAUDE.md` şablonunda kalır.
- [ ] **CI:** GitHub Actions, her push ve PR'da `npm ci && npm run build && npm run check`. Ayrıca `scripts/yeni-defter.mjs` ile geçici bir defter kurup onu da derlesin.
- [ ] **Gizli bilgi taraması:** `check.mjs` içerikte anahtar, token ve özel anahtar kalıplarını arasın ve bulursa derlemeyi durdursun. Kalıp örnekleri: `sk-`, `ghp_`, `AKIA`, `-----BEGIN`, `xox[bp]-`. Defterler herkese açık depolarda yaşayacağı için bu zorunlu.

**Kabul ölçütü:** CI yeşil; temiz klondan `yeni-defter` → build → check hatasız; gizli bilgi taraması bir test anahtarını yakalıyor.

### Faz 1: Motor paketi (K1 = B ise)

- [ ] **Paket:** `defter` CLI'si iki ayrı komut setiyle gelir:
  - `defter build | check | dev`: defter deposunun içinde çalışır;
  - `defter yeni <klasör> --sahip …`: yeni defter kurar.
- [ ] **Paket içeriği:** `src/` ve `kit/`.
- [ ] **Defter deposunun içeriği:** `package.json` (bağımlılık: `defter`), `content/`, `data/`, `defter.config.json`, `CLAUDE.md`, isteğe bağlı `enhance/`.
- [ ] **Eklenti noktası:** defterin `enhance/*.js` dosyaları tek dosya çıktıya gömülür. Eren'in deneyleri oraya taşınır.
- [ ] **Sürümleme:** semver ve `CHANGELOG.md`. İçerik biçimini bozan değişiklik major sürümdür; geçiş notu yazılır.
- [ ] **Eren'in defteri pakete geçer:**
  - `src/` silinir, yerine paket bağımlılığı gelir;
  - çıktı birebir aynı kalmalı (derleme karşılaştırması).
- [ ] **`kit-esitle.mjs` emekliye ayrılır.**

**Kabul ölçütü:** Eren'in defteri ve örnek defter aynı paket sürümüyle derleniyor. Paket güncellenince iki defter de tek komutla güncelleniyor.

### Faz 2: Skill sağlamlığı

- [ ] **Harita:**
  - `defter harita` (ya da build) `dist/harita.json` üretir: her konu için id, başlık, soru, sayfa, kategori ve ilk cümle.
  - Skill bütün dosyaları okumak yerine bu küçük haritayı okur.
  - Büyük defterlerde token maliyetini ve yanlış yer seçimini azaltır.
- [ ] **Eval seti:** `evals/` altında sabit bir örnek defter ve 15–20 senaryo, her birinin beklenen sonucuyla. Kapsanacak durumlar:
  - mevcut konuya ek;
  - yeni konu;
  - yeni sayfa;
  - yeni kategori;
  - zaten var olan bilgi (atlanmalı);
  - "direkt ekle";
  - "detaylı ekle";
  - verilen hedef;
  - belirsiz hedef (soru sormalı);
  - sohbetten süzme;
  - gizli bilgi içeren malzeme (çıkarılmalı);
  - kuyruk belgesinde talimat gibi görünen metin (uygulanmamalı).
- [ ] **Eval koşucusu:** Claude Code'u başsız çalıştırır, sonucu `git diff` üzerinden kontrol eder. Kontrol edilenler:
  - konu doğru id'nin altına mı gitti;
  - kural blokları var mı;
  - check temiz mi.
- [ ] **"Taşı" ve "düzelt" akışları:** bağlantıların kırılmadığını check doğrular.
- [ ] **Skill ince ayarı:** eval sonuçlarına göre.

**Kabul ölçütü:** eval'de yer seçimi ≥ %90; gizli bilgi ve talimat enjeksiyonu senaryoları %100.

### Faz 3: Dağıtım ve ilk kullanıcılar

- [ ] **Kurulum:** K3'e göre eklenti pazarı ve claude.ai skill kurulum adımları.
- [ ] **"Yeni defter kur" uçtan uca:** kullanıcının boş GitHub deposu → kurulum → ilk commit → artifact yayını (`db` ve `user` yetenekleriyle) → adresin `defter.config.json`'a yazılması.
- [ ] **Örnek defter:** kitteki boş örnek yerine 2–3 bölümlük gerçek bir vitrin.
- [ ] **Tanıtım sayfası:** README'nin kısa hâli, ekran görüntüleri ve 1 dakikalık bir kayıt. Adresi K6'ya göre.
- [ ] **İlk kullanıcılar:** birkaç kişiyle dene, kurulumda takıldıkları yeri not et ve issue aç.

**Kabul ölçütü:** Daha önce görmemiş biri 10 dakikadan kısa sürede defterini kurup ilk eklemesini yapabiliyor.

### Faz 4: Okuma deneyimi

- [ ] **Tekrar kartları:** quiz'ler aralıklı tekrar kartı olur. Hangi konunun tekrar zamanı geldiği ana sayfada görünür.
- [ ] **İlerleme senkronu:** şu an "öğrendim" işaretleri sadece tarayıcıda; artifact veritabanıyla cihazlar arası senkron.
- [ ] **Haftalık kuyruk işleme:** zamanlanmış görev olarak; kuyruğun ilk 25 kaydı işlenir ve özet gönderilir.
- [ ] **İçe aktarma:** Medium listeleri, RSS, Readwise ya da Pocket dışa aktarımı kuyruğa alınır.
- [ ] **Dil ve görünüm:** sözlük (K5), `defter.config.json`'dan vurgu rengi ve yazı tipi.
- [ ] **Doğrulama rozeti:** bağımsız bir ajan konuyu kaynaklarıyla kontrol eder ve "doğrulandı (tarih)" işareti koyar.

### Faz 5: Topluluk (talep olursa)

- [ ] Herkese açık defterler galerisi.
- [ ] Bir başkasının defterinden bölüm "içe alma"; kaynağı korunarak.
- [ ] Katkı rehberi ve issue şablonları.

## 5. Riskler (pre-mortem)

"6 ay sonra proje öldü. Neden?"

| Risk | Olasılık | Önlem |
|---|---|---|
| Skill tutarsız: yanlış yere ekliyor, tekrar yazıyor, üslubu bozuyor | Yüksek | Faz 2 eval seti ve harita; her skill değişikliğinden önce eval |
| Kurulum zor: GitHub, npm ve artifact üçlüsü yeni kullanıcıyı kaçırıyor | Yüksek | "Yeni defter kur" tek sohbette bitmeli (Faz 3); GitHub'sız ara yol (K4) |
| Herkese açık defterde gizli bilgi sızıntısı | Orta | Faz 0 gizli bilgi taraması, skill kuralı, CI |
| Telif: kaynaktan fazla alıntı | Orta | "Kendi cümlelerimizle" kuralı, kısa alıntı sınırı, kaynak zorunluluğu; eval'de kontrol |
| Motor ve defterler kayıyor; kullanıcılar eski sürümde kalıyor | Orta | Faz 1 paket ve semver |
| Ücretli duvarlar (Medium) skill'in okumasını engelliyor | Orta | Tarayıcı aracıyla okuma; açılmazsa "atlandı" ile gerekçe, asla tahminle yazma |
| Artifact veritabanı kotası ya da yetenek değişikliği | Düşük–orta | Kuyruk küçük kalsın (işlenen silinir); site sürümü veritabanısız salt okunur çalışıyor |
| Claude'a bağımlılık | Düşük | Motor ve içerik düz Markdown, herhangi bir yerde derlenir; SKILL.md diğer ajanlara uyarlanabilir |
| Defter büyüdükçe skill'in token maliyeti artıyor | Orta | Harita dosyası; skill sadece ilgili sayfayı okur |

## 6. Claude Code ile nasıl çalışıyoruz?

- **Depo:** ürün işi `defter-kit`'te; Eren'in içeriği `defter`'de. Bir oturumda iki depoya birden dokunulmaz (Faz 1'e kadar istisna: `kit-esitle`).
- **Oturum başı:**
  1. Bu dosyayı oku;
  2. "Şimdi" bölümündeki ilk açık maddeyi seç;
  3. büyükse önce plan modunda planla.
- **Dal ve PR:** `main` her zaman derlenir. İş `faz-0/lisans` gibi bir dalda yapılır, PR açılır, CI yeşilse birleştirilir.
- **Bitti tanımı:**
  - build + check temiz;
  - davranış değiştiyse README ya da CLAUDE.md güncel;
  - bu dosyada madde işaretli;
  - gerekiyorsa "Karar günlüğü"ne bir satır yazılmış.
- **Ürün iddiaları:** Claude Code, artifact ve npm gibi araçların özellikleri resmî dokümandan doğrulanır ve yanına tarih yazılır.
- **Bu dosya:** yeni bir fikir önce "Fikir kutusu"na yazılır, sonra bir faza alınır.

## 7. Şimdi (ilk hafta)

1. [ ] Açık kararları (K1 motor paketi, K2 lisans, K4 GitHub şartı) Eren'e öneriyle sor, cevabı karar günlüğüne yaz. K3 verildi.
2. [ ] Faz 0'ın tamamı.
3. [ ] Faz 1 için npm paket adını kontrol et ve CLI iskeletini kur.
4. [ ] Skill'i gerçek bir okuma kuyruğu partisiyle dene; takılınan her yer bir issue olur.

## 8. Konuşmamız gereken sorular

1. **K1:** Motoru npm paketine çevirmeyi onaylıyor musun? Eren'in defteri de pakete geçecek.
2. **K2:** MIT uygun mu?
3. **K4:** GitHub'ı olmayan kullanıcıyı ilk sürümde hedefliyor muyuz, yoksa "GitHub şart" mı? (İlk kitle P1+P2 olduğu için öneri: ilk sürümde GitHub şart.)

## Karar günlüğü

| Tarih | Karar | Neden |
|---|---|---|
| 2026-10-14 | Kişiye özel bilgiler (ad, sahip, metinler, adresler) `defter.config.json`'a taşındı | Motor herkes için aynı olsun |
| 2026-10-14 | `defter-kit` herkese açık depo olarak açıldı; Eren'in defteri özel kalır | Motor paylaşılsın, kişisel içerik paylaşılmasın |
| 2026-10-14 | Ekleme modları: `direkt`, `standart` (varsayılan), `detayli` | Kullanıcı araştırma derinliğini seçebilsin |
| 2026-10-14 | Depoya yazamayan sohbet, kaydı artifact kuyruğuna bırakır | Her sohbetten ekleme yapılabilsin |
| 2026-10-14 | `:::okuma` bloğu eklendi (`:::medium` ile aynı) | Kaynak sadece Medium değil |
| 2026-10-14 | İlk kitle: kişisel geliştirici (P1) ve yazılım ekibi (P2) | Ürün zaten bunun için var; Claude Code dağıtım kanalı hazır |
| 2026-10-14 | GitHub Issue kutusu ikinci kuyruk olarak açılır | Telefon, tarayıcı ve depoya yazamayan sohbet tek mekanizmaya yazsın |
| 2026-10-14 | Herkese açık defterler ürünün parçası (site olarak yayın) | Öğretmen ve içerik üretici kullanımı; paylaşılabilir bilgi |
| 2026-10-14 | Global eklenti: herkes aynı skill'i kurar; kurallar ve görünüm kullanıcının deposunda, motor kit'ten güncellenir (K3) | Herkeste aynı mantık, herkesin kendi defteri, isteyen özelleştirir |

## Fikir kutusu

- Tarayıcı eklentisi: okuduğun sayfada "deftere ekle" düğmesi, kaydı kuyruğa yazar.
- Telefon: paylaşım menüsünden kuyruğa link gönderme.
- "Bu hafta öğrendiklerin" e-postası ya da özet sayfası.
- Konu grafiği: konular arası bağlantıların haritası.
- Ekip defteri: birden çok kişinin yazdığı ortak defter (rol ve onay akışıyla).
