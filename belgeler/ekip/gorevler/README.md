# Görev kuyruğu (Antigravity)

Depo sahibinin kararı (2026-10-31): tasarım dışındaki tanımı net işleri
Antigravity yapar; Claude Code görevi yazar, gözden geçirir, `main`'e alır.

## Antigravity için akış

1. **Önce `AGENTS.md`'yi oku.** §1 sözleşmedir; görev onunla çelişiyorsa işi
   yapma, görev dosyasının «Sonuç» bölümüne nedenini yaz.
2. Yalnız `C:\Users\ASUS\LifeOs-ag` klasöründe çalış. `C:\Users\ASUS\LifeOs`
   (Claude Code'un klasörü) ve `C:\Users\ASUS\LifeOS-Sistem` (çalışan kopya)
   açılmaz, değiştirilmez.
3. Sıradaki görev: bu klasörde «Durum: bekliyor» olan en küçük numaralı dosya.
4. Görev dalını `main`'den aç:
   `git switch -c ag/<numara>-<kısa-ad> main`
5. Görevde yazanı yap; yazmayanı yapma. «Dokunma» listesindeki dosyalara
   dokunma. Belirsiz bir yer varsa tahmin etme, «Sonuç»a soru olarak yaz.
6. Görevdeki testleri koş. Tarayıcı testlerinde **yalnız aşağıdaki portlar**
   (Claude Code aynı anda öbür portları kullanıyor olabilir):
   `cd AYS && node tools/runtests.js 4378` · `cd SPI && node tools/runtests.js 4388`
   · `cd ESP && node tools/runtests.js 4398`. Python testleri her yerde koşar
   (`python tools/<ad>_test.py`). `smoke`, `layoutcheck`, `palettecheck`,
   `perfcheck`, `entegre` koşulmaz: onları birleştirmeden önce Claude Code koşar.
7. Görev dosyasında «Durum: bitti» yap, «Sonuç» bölümünü doldur (ne değişti,
   hangi test koştu, çıktısı, açık kalan), aynı dalda commit et ve push et:
   `git push -u origin ag/<numara>-<kısa-ad>`. Commit kimliği:
   `git -c user.name=OmerFaSa -c user.email=omerfaruksagsozz@gmail.com commit`
8. `main`'e merge etme, push etme. Kullanıcıya «ag/… bitti» de; gerisi Claude Code'da.

## Değişmez kurallar (özet; asıl metin AGENTS.md)

- Sıfır bağımlılık: paket, çerçeve, derleyici eklenmez. Python'da yalnız
  standart kütüphane.
- Ekranda görünen metin düzgün Türkçe. Kod yorumu ASCII olabilir.
- Eksik veri sıfır değildir; sayıyı kod üretir, uydurulmaz.
- `brand/ortak/` tek kaynaktır: modüllerdeki kopyalar (`*/src/js/core`,
  `*/src/css`, `*/src/tests`) **elle düzenlenmez**; önce `brand/ortak/`
  düzenlenir, sonra `python tools/ortak.py --yay`.
- `*/dist/` ve `*/src/js/data/build.js` elle değiştirilmez, commit'e girmez
  (derlemeyi Claude Code yapar).
- Kullanıcı verisi (`HKM/config.json*`, `*.db`, `AYS/debug.log`, `.claude/`)
  commit'e girmez.
- Düzeltilen her hata için önce o hatayı yakalayan test yazılır.

## Ofis: Claude Code'un Antigravity ekibi (`tools/ajan.py`)

Depo sahibinin kararı (2026-10-31): Antigravity'yi Claude Code bir ofis gibi
yönetir. Tasarım, `brand/ortak/` ve `sistem/` gibi kritik işler, son gözden
geçirme ve birleştirme Claude Code'da kalır; ekip tanımı net işleri yapar.

| Rol | Ne yapar | Klasör |
|---|---|---|
| **Uygulayıcı** | Görev dosyasını yapar, test koşar, dalını push eder | `LifeOs-ajan\<numara>` (dal hazır) |
| **Denetçi** | Teslim edilen dalı Claude Code'dan önce inceler: `KARAR: temiz` ya da §4 biçiminde bulgular | `LifeOs-ajan\ofis-denetim` (dala ayrık, salt okunur) |
| **Araştırmacı** | Sorulara kanıtla (dosya:satır) cevap verir | `LifeOs-ajan\ofis-arastirma` (main'e ayrık, salt okunur) |

```
python tools/ajan.py baslat 004                 Uygulayıcı; efor görev dosyasından
python tools/ajan.py baslat 001 --efor yuksek   efor dosyayı ezer; --yeni yeni sohbet açtırır
python tools/ajan.py sor "…"                    Araştırmacı (varsayılan efor düşük)
python tools/ajan.py gozden 004                 Denetçi (kanca teslimde kendisi çağırır)
python tools/ajan.py durum                      ekip ve açık işler
python tools/ajan.py bekle [ad …]               hazır olana dek bekler (arka planda koş; tek bildirim)
python tools/ajan.py rapor 004                  inceleme paketi: Sonuç, Denetçi, diff tek çıktıda
python tools/ajan.py cevap 004                  bu işin son cevabı
python tools/ajan.py mesaj 004 "…"              işe ek talimat (aynı sohbet)
python tools/ajan.py kapat 004                  klasörü kaldırır, dal kalır
python tools/ajan.py kur [--kaldir]             Antigravity koruma kancasını kurar/kaldırır
python tools/ajan.py pilot baslat|dur|durum     otomatik pilot: sırayı yürütür, birleştirmez
python tools/ajan.py testler 004                Testçi tablosu ve kırmızıların son satırları
```

- **Aynı sohbette devam:** bir rolün sohbeti boşsa, içinde 3'ten az iş varsa
  ve bağlamı 200 bin token'ın altındaysa yeni iş aynı sohbete mesajla gider:
  ajan AGENTS.md'yi yeniden okumaz, önbellek işler. Biri tutmazsa yeni sohbet
  açılır (uzun bağlam kaliteyi düşürür). Aynı sohbetteki işler adım
  aralığıyla ayrılır; kanca her an en son iş verilenin klasörünü uygular.
- **Teslim → Denetçi:** Uygulayıcı durduğunda görev dosyası «bitti», klasör
  temiz ve dal push edilmişse kanca Denetçi'yi kendiliğinden çağırır (bir
  kez). Denetçi'nin «temiz» demesi birleştirme izni değildir: Claude Code
  yine diff'i okur ve tam denetimleri koşar.
- **Efor modeli seçer:** düşük → `flash_lite`, orta → `flash`, yüksek → `pro`.
  Görev dosyasındaki «**Efor:**» satırı varsayılandır. Efor alt ajan sınırını
  da belirler: düşükte alt ajan yok, ortada en çok 2, yüksekte en çok 3.
  Denetçi bir üst kademede çalışır (düşük → orta, orta ve yüksek → yüksek) ve
  en az iki bozma denemesini `DENEME:` satırıyla yazar. Ölçülen: `pro` ile
  `flash` aynı modele açılıyor (OFIS.md §4).
- **Kabul testi:** görevde `**Kabul testi:**` varsa o dosya Claude Code'undur;
  Uygulayıcı onu değiştirmez (kanca engeller), kodu onu geçecek şekilde yazar.
  «Sonuç»taki dört alan dolu olmalı; geçmiş hatalar `DERSLER.md`'de.
- **Portlar:** Uygulayıcı yuva n (1–8): AYS `47n1`, SPİ `47n2`, ESP `47n3`;
  yuva 9 Denetçi'nindir. README'deki 4378/4388/4398 yalnız `LifeOs-ag`'de elle
  çalışırken geçerlidir.
- **Ucuz modelin cevabı doğrulanır:** Araştırmacı'nın (flash_lite) cevabı kanıtla
  gelir ama Claude Code onu iş vermeden önce kontrol eder (ilk soruda bir
  aracın testi «yok» denmişti, vardı).
- Antigravity'nin adresi ve CSRF anahtarı çalışan dil sunucusundan okunur;
  hiçbir dosyaya yazılmaz. Durum `LifeOs-ajan\ajanlar.json`'dadır (depoda değil).

## Otomatik pilot ve Testçi

Pilot (`tools/ofis_pilot.py`) Claude Code beklemeden kuyruğu yürütür: «bekliyor»
görevleri (en çok 3 paralel, günde 8) başlatır, Denetçi bulgusunu Uygulayıcı'ya
geri gönderir (en çok 2 tur), Testçi'yi koşturur, kırmızıyı bir kez geri
gönderir, sonra işi «hazır» yapar. Kota hatasında işi bir kez alt modelle
yeniden dener. Birleştirmez, push etmez, görev yazmaz. Testçi
(`tools/ofis_test.py`) bir model değil, betiktir: main + dal birleşmesinde
AGENTS.md §2 tam denetimlerini koşar, ham çıktıyı `LifeOs-ajan/test/<no>/`'ya
yazar. Karar tablosu ve ayrıntı: `belgeler/ekip/OFIS.md` §7.

Uygulayıcı'ya Testçi'den düzeltme gelirse: ham çıktıyı oku, aynı denetimi
**kendi yuva portunla** koş (ör. `cd AYS && node tools/smoke.js 4711`).

## Koruma kancası ve araçlar (`tools/ajan_kanca.py`)

İlk koşuda (2026-10-31) flash_lite ajan komutlarını `cd`'siz koştu ve bütün
işi ana klasörde yaptı: Antigravity'nin kabuğu ajanın klasöründe değil
`C:\Users\ASUS\LifeOs`'ta açılır. İstemdeki uyarı modele bırakılmış bir
sözdür; kanca onu koda çevirir. `python tools/ajan.py kur` kancayı
`~/.gemini/config/hooks.json`'a «lifeos-ajan» adıyla yazar (kullanıcının
diğer kancalarına dokunmaz; `--kaldir` yalnız kendisini siler).

- Yalnız `ajanlar.json`'daki açık konuşmalara ve onların alt ajanlarına
  dokunur; kullanıcının kendi Antigravity konuşmalarına `ask` döner ve
  Antigravity'nin normal izin akışı geçerli kalır. Boş cevap (`{}`)
  Antigravity'de «reddet» sayılır: ilk kurulumda kayıtsız bir konuşmada
  `git --version` engellendi, kanca kaldırılıp bu düzeltildi.
- **Komut:** ajanın klasöründe değilse başına `Set-Location` eklenir. Ana
  klasöre, çalışan kopyaya, `LifeOs-ag`'ye dokunan komut; main'e push, merge,
  rebase, dal değiştirme, `reset --hard`, worktree reddedilir. Mini ajan
  commit ve push edemez, dosya yazamaz.
- **Araçlar:** MCP'lerden yalnız **playwright** açık (ajan kendi portunda
  arayüzü görebilir). `hkm-sqlite` çalışan kopyanın kişisel veritabanına
  yazar; Notion, Linear, Netlify, Canva, Figma kullanıcının hesaplarıdır:
  bu işlerde kapalı. `ask_question` kapalı; soru «Sonuç»a yazılır.
- **Durma:** arka planda iş sürerken ya da görev dosyası «bitti/takıldı»
  olmadan, değişiklik commit/push edilmeden ajan durmak isterse devam
  ettirilir (en çok 3 kez).
- Her karar `LifeOs-ajan\olay\<ad>.jsonl`'e yazılır; Görev Takibi gösterir.

## İzleme

Masaüstündeki **Görev Takibi** (`tools/gorev_takip.py`) beş saniyede bir
yenilenir. Üstte tek cümlelik özet, ekip kartları (rol, model, şu an ne
yaptığı, kaçıncı işte, bağlam doluluğu, token) ve akış panosu (Sırada → Çalışıyor →
İncelemede → Bitti); bir işe tıklayınca ajanına iner. Her ajan: şu an ne
yaptığı düz Türkçe, eforu (çubuk) ve modeli, süre, adım, son hareket, token
(giriş/çıkış), commit ve açık dosya, kancanın müdahaleleri, zaman çizelgesi,
Denetçi raporu, son mesajı, alt ajanları; klasör, dal, port ve konuşma
«Teknik ayrıntı»da. Araştırmacı'nın soruları ve cevapları ayrı bölümde.
Kaynak Antigravity'nin konuşma dökümüdür (`brain/<id>/…/transcript.jsonl`).
Yalnız okur, hiçbir şeyi değiştirmez.

## Görev dosyası şablonu

`_SABLON.md`'yi kopyala: `NNN-kisa-ad.md`.
