# Defter: kim, nasıl kullanır?

> PLAN.md'deki fazlardan önce gelen soru: insanlar defteri ne için ve nasıl kullanacak? Bu dosya kullanım senaryolarını, deftere bilgi girme yollarını, okuma ve tekrar biçimlerini ve öncelik önerisini toplar. Tartışma belgesidir; kararlar PLAN.md'nin karar günlüğüne geçer.
> Son güncelleme: 14 Ekim 2026

## 1. Defter ne değildir, ne farklıdır?

| Araç | Ne yapar | Defterden farkı |
|---|---|---|
| Notion, Obsidian | Notu sen yazarsın, sen düzenlersin | Defterde yazan ve yer bulan Claude; sen sadece "ekle" dersin |
| Readwise, Pocket | Okunacakları ve vurguları biriktirir | Biriktirir ama sindirmez: tekrarı ayıklamaz, hatayı düzeltmez, konuya yerleştirmez |
| NotebookLM | Yüklenen kaynaklardan cevap verir | Kaynakları tutar ama kalıcı, düzenli, tekrarsız bir metin üretmez |
| Anki | Aralıklı tekrar kartları | Kartı sen yazarsın; bağlam yoktur |

**Defterin vaadi:** okuduğun her şey tek bir yerde, tekrarsız, kaynaklı, düzeltilmiş ve sınanabilir. Yazan Claude, sahibi sensin: düz Markdown, kendi deponda, kilit yok.

## 2. Kimler kullanır?

| # | Kim | Ne ekler | Defterden ne bekler | Engel |
|---|---|---|---|---|
| P1 | **Kendi kendine öğrenen geliştirici** | Medium, dev.to, doküman, video, AI sohbeti | Okumayı tek yerde yapmak, mülakat hazırlığı | Yok; bugünkü ürün bunun için |
| P2 | **Yazılım ekibi** | PR'dan, olaydan (postmortem), Claude Code oturumundan çıkan öğrenimler | Ortak bilgi; yeni gelen için onboarding; aynı hatayı ikinci kez yapmamak | Ortak yazma, onay akışı |
| P3 | **Öğrenci, sınav hazırlığı** (YKS, KPSS, tıp, hukuk) | Ders notu, PDF, ders videosu | Özet + soru + tekrar; çıktı alıp çalışmak | GitHub; mobil kullanım |
| P4 | **Mevzuat takip eden meslekler** (muhasebe, hukuk, İK) | Resmî Gazete, tebliğ, sirküler | Tarihli, kaynaklı, "yürürlükte mi?" bilgisi | Bilginin eskimesi; yanlışın bedeli yüksek |
| P5 | **Araştırmacı** | Makale, kitap bölümü | Literatür defteri; iddia → kaynak bağı | Atıf biçimi |
| P6 | **Dil öğrenen** | Kelime, gramer kuralı, örnek cümle | Kelime kartları, tekrar | Defterin biçimi kelime için fazla ağır |
| P7 | **Hobi ve kişisel konular** (finans okuryazarlığı, yemek, satranç, sağlıklı yaşam) | Video, yazı, deneyim | Dağınık bilgiyi toplamak | Yok, ama sağlık/finans gibi konularda sorumluluk notu gerekir |
| P8 | **Öğretmen, içerik üretici** | Kendi ders notları | Öğrencilerine quiz'li, herkese açık bir defter yayınlamak | Herkese açık site ve paylaşım |

## 3. Bilgi deftere nasıl girer?

Kullanıcının bir şeyi gördüğü an ile deftere girdiği an arasındaki adım sayısı ürünün kaderini belirler.

| Giriş | Nasıl | Bugün | Not |
|---|---|---|---|
| **Claude sohbeti** | "deftere ekle" + link, metin, görsel, PDF | Var (skill) | Ana giriş |
| **"Bu sohbetten ekle"** | Uzun bir sohbetin sonunda öğrenilenleri süzmek | Var (skill) | En az zahmetli; sohbet zaten öğrenme |
| **Claude Code oturumu** | Kod yazarken "bunu deftere ekle"; oturum sonunda "öğrendiklerimizi ekle" | Var (aynı skill) | P2 için ana giriş |
| **Artifact formu** | Defterin kuyruk sayfasına link ya da not | Var | Masaüstünde iyi; mobilde zahmetli |
| **Telefonda paylaş menüsü** | Okurken "Paylaş → Deftere" | Yok | P1, P3, P7 için kritik. Kayıt ya Claude uygulamasına gider ya da GitHub Issue olarak açılır (aşağıda) |
| **GitHub Issue kutusu** | `kuyruk` etiketli issue = bekleyen kayıt | Yok | Artifact veritabanına bağlı değil, her yerden yazılabilir (iOS Kestirmeler, e-posta → issue, bookmarklet). Haftalık iş issue'ları da işler ve kapatır. |
| **Tarayıcı eklentisi / bookmarklet** | Sayfadayken tek tık | Yok | Issue kutusuna yazar |
| **Bülten e-postaları** | Medium Daily Digest gibi bültenleri bir adrese yönlendirmek | Yok | İleri faz; e-posta → issue köprüsüyle çözülebilir |
| **Toplu içe aktarma** | Medium listesi, Pocket/Readwise dışa aktarımı, RSS | Yok | İlk kurulumda "eski okumalarını getir" anı için değerli |

**Öneri:** sıradaki giriş **GitHub Issue kutusu**. Tek bir mekanizma; telefon, eklenti ve e-posta hepsi ona yazar. Artifact veritabanının yanında ikinci, herkese açık bir kuyruk olur.

## 4. Defter nasıl okunur ve kullanılır?

| Kullanım | Ne | Bugün |
|---|---|---|
| **Okumak** | Bölüm bölüm, "öğrendim" işaretiyle | Var |
| **Aramak** | Türkçe karakter duyarsız tam metin arama | Var |
| **Sormak** | "Defterime göre X nedir?": Claude defterden cevaplar ve konuya bağlantı verir | Var (skill) |
| **Tekrar etmek** | Quiz'ler aralıklı tekrar kartı olur; ana sayfada "bugün 6 kart" | Yok, P1, P3, P6 için yüksek değer |
| **Haftalık özet** | "Bu hafta 12 kayıt işlendi: 7 eklendi, 3 atlandı (neden), 2 düzeltme" + yeni konulara bağlantı | Yok |
| **Bakım** | Eskiyen bilgi uyarısı: "Şu 5 konuda 6 aydan eski sürüm/fiyat iddiası var, yeniden doğrulayayım mı?" | Yok, P4 için şart, herkes için ayırt edici |
| **Paylaşmak** | Bir konunun bağlantısı; defterin herkese açık site sürümü | Kısmen (site var, paylaşım akışı yok) |
| **Dışa aktarmak** | PDF/çıktı (sınav), Anki desteleri (quiz'lerden) | Yok |
| **Ajan hafızası** | Ekip defterinin haritası CLAUDE.md'den içe aktarılır; Claude Code kod yazarken ekibin öğrenimlerini bilir | Yok, P2 için ayırt edici |

## 5. Defter türleri (hazır ayarlar)

Motor aynı kalır; değişen `CLAUDE.md` üslubu, varsayılan kategoriler ve birkaç blok.

```bash
node scripts/yeni-defter.mjs ../defterim --sahip "Ayşe" --tur sinav
```

| Tür | Üslup farkı | Ek blok fikri |
|---|---|---|
| `yazilim` (bugünkü) | Benzetme → mekanizma → kod → tuzak → quiz | Var olanlar |
| `ekip` | Daha kısa; "neden böyle karar verdik"; olay → ders | `:::karar` (ADR), `:::olay` |
| `sinav` | Kısa özet, çok soru, ezber tablosu | `:::formul`, daha çok quiz |
| `mevzuat` | Her bilgi tarihli; yürürlük ve kaynak zorunlu | `:::yururluk` (tarih, kaynak, durum) |
| `arastirma` | İddia → kaynak; yöntem ve sınırlılık | `:::iddia` |
| `dil` | Kelime ve örnek cümle odaklı | `:::kelime` (kelime, anlam, örnek) |
| `genel` | Varsayılan, sade | — |

## 6. Kullanıcı yolculukları

### İlk 10 dakika (kazanmak ya da kaybetmek burada)

1. Skill'i kurar: Claude Code'da iki komut ya da claude.ai'de skill yükleme.
2. "Yeni defter kur" der. Üç soru gelir: adın, konun, defter türün. GitHub deposu isteğe bağlı olmalı (bkz. PLAN K4).
3. Defter artifact olarak açılır. Başlangıç sayfası tek ekranlık ve "şimdi son okuduğun bir yazının linkini ver" diye biter.
4. İlk ekleme canlı olur: yazı okunur, bir konu açılır, kullanıcı defterinde kendi ilk konusunu görür.
5. Kapanış: "telefondan eklemek için şunu kur" (paylaş menüsü / Kestirme).

**Kabul ölçütü:** 10 dakikadan kısa sürede, defterinde kendi eklediği ilk konuyu görmek.

### Gündelik

- Okurken paylaş → kuyruk. Sohbet ederken "deftere ekle". Kod yazarken "bunu deftere ekle".
- Kullanıcı hiçbir şeyi düzenlemez, yer seçmez, biçimlendirmez.

### Haftalık

- Zamanlanmış görev kuyruğu işler.
- Özet gelir: ne eklendi, ne atlandı ve neden, hangi iddialar düzeltildi.
- Kullanıcı yeni konuları okur ve tekrar kartlarını çözer.

### Aylık

- Bakım raporu: eskiyen bilgiler, birleştirilebilecek benzer konular, hiç okunmamış bölümler.

## 7. Öncelik önerisi

Her şeyi aynı anda yapmak yerine iki kullanıcı tipiyle başla, gerisini bunlar oturunca aç.

| Sıra | Ne | Neden |
|---|---|---|
| 1 | **P1 kişisel geliştirici defteri**: bugünkü ürünün cilası, "İlk 10 dakika" akışı, Claude Code eklentisi | Ürün zaten bunun için var; dağıtım kanalı (Claude Code) hazır |
| 2 | **GitHub Issue kutusu** + telefondan paylaş | Giriş zahmetini düşürür; artifact veritabanına bağımlılığı azaltır |
| 3 | **Aralıklı tekrar** (quiz → kart) | "Okudum, unuttum" sorununu kapatır; en görünür değer |
| 4 | **P2 ekip defteri** + ajan hafızası | Claude Code kullanıcıları için güçlü ve farklı bir hikâye |
| 5 | **Defter türleri** (`sinav`, `mevzuat`, `dil`…) + GitHub'sız defter | P3–P6'ya açılmak için; GitHub engeli kalkmadan anlamsız |
| 6 | Bakım raporu, haftalık özet, dışa aktarma, içe aktarma | Kalıcılık ve sadakat |

## 8. Konuşulacaklar

**Karar verilenler (14 Ekim 2026):** ilk kitle P1 + P2; GitHub Issue kutusu ikinci kuyruk olarak açılır; herkese açık defterler ürünün parçası; skill global bir eklenti olarak dağıtılır (PLAN K3).

Açık kalanlar:

1. **İlk iki kullanıcı tipi:** P1 + P2 önerisine katılıyor musun, yoksa P3 (öğrenci) gibi daha geniş bir kitle mi?
2. **Giriş kanalı:** GitHub Issue kutusunu ikinci kuyruk olarak açmak mantıklı mı, yoksa tek kuyruk (artifact) mı kalsın?
3. **Aralıklı tekrar:** ilerleme şu an sadece tarayıcıda. Tekrar kartları cihazlar arası senkron gerektirir (artifact veritabanı). Bu, K4 kararını da etkiler.
4. **Herkese açık defterler:** kullanıcının defterini site olarak yayınlaması ürünün parçası mı (P8), yoksa sadece kişisel mi kalsın?
5. **Sorumluluk:** sağlık, hukuk ve finans konularında defterin "bu bir not defteridir, tavsiye değildir" uyarısını otomatik koyması gerekir mi?
