# Ekip durumu — canlı pano

> Plan: `ekip/EKIP-PLANI.md` (sabit). Bu dosya canlıdır.
> **Kural:** herkes yalnız kendi bölümüne yazar. Teslim tablosuna T, kapı satırına ve bulgu
> özetine H yazar. Her satır kısa olur: numara · durum · commit.
> Başlarken oku; bitirirken ya da limit yaklaşınca kendi bölümünü güncelle ve push et.

## Kapılar (H yazar)

| Kapı | Durum | Commit |
|---|---|---|
| Kapı 1 · H0 taban envanteri (`ekip/envanter/taban-2026-09-24.json`) | ✅ **açık** — T2 ve T3 başlayabilir | 1600f75 |

## Teslim tablosu (T yazar)

Bir modülün satırı «teslim» olunca o modülün `screens/*.js` dosyaları K'ye geçer.

| Modül | İskelet (T3) | Teslim commit | K aldı |
|---|---|---|---|
| AYS | ⏳ | — | — |
| SPİ | ⏳ | — | — |
| ESP | ⏳ | — | — |
| HKM yüzü | kullanıcı onayı bekliyor | — | — |

## KARTLAR (K)

- **Şu an:** —
- **Sahiplendiğim çekirdek dosyalar:** —
- **Biten** (özellik · commit): —
- **Yarım / sıradaki:** K1 · P1 ortak bileşenler
- **Soru / öneri:** —

## TASARIM (T)

- **Şu an:** T1 temel (jetonlar, tema, Inter, temel bileşenler)
- **T0 kararları:** soruldu (2026-09-24), cevap bekleniyor — T2 menüsü ve T3 cevaba kadar başlamaz
- **Biten** (adım ya da özellik · commit): T1 jetonlar `brand/ortak/jeton.css` · 23e3a7c;
  T1 temel kalıplar `brand/ortak/temel.css` + `C.Kutu` (02) + `C.ModulIsareti` (165) +
  alt çekmece tutamağı (162) · (bu commit)
- **K için:** renk/ölçü/süre yalnız jetonlardan: `--ays --spi --esp --mer` (+ `-ink` yazı,
  `-t` açık ton), `--ok --bad --now`, `--r-xs/-sm/-md/-r`, `--sp-*`, `--dur-press/--dur/
  --dur-lg/--dur-in`. Kart iskeleti: `C.Kutu({ simge, ad, yuva, govde, ayak, bitisik })`;
  yuva = kesinlik yeri (sizin sayı bileşeniniz). Düğme tonları: `primary` (modül),
  `ink` (siyah), `ghost`.
- **Not (H):** üç `src/tests/index.html`'e `jeton.css` ve `temel.css` bağlantısı eklendi
  (test sayfası gerçek stil ortamında koşsun diye); test değiştirilmedi.
- **Yarım / sıradaki:** T1 sürüyor (paletler/düzenler §8-4 cevabını bekliyor) →
  (Kapı 1 + T0 cevabı) → T2 kabuk, T3 AYS
- **Soru / öneri:** —

## HATA (H)

- **Şu an:** H0b tıklama taraması (`tools/tiklama.js`: her ekranın her düğmesine temiz sayfada basar; ilk koşum sürüyor)
- **Biten:** H0 taban envanteri · 1600f75 — `node tools/envanter.js` her push'ta CI'da koşar
- **Biten:** H1 sadelik denetimi (`tools/sadelik.js`, plan §1.2 bütçesi) — CI'da envanterle aynı gezintiden; teslim tablosunda ✅ olan modülde kırmızı olur, diğerlerinde yalnız ölçer
- **Denetlenen push'lar:** T1 23e3a7c ✅ (üç modülde runtests, duman, a11y, 390 px, palet, dist, ortak/seviye temiz)
- **T ve K için:** taşıdığın ekrandan sonra `node tools/envanter.js <MODÜL>` koş (~1 dk). «KAYIP» çıkarsa ya geri koy ya da kullanıcı onayıyla `ekip/envanter/kaldirilan.json`'a yaz. Envanter ekran ölçülerini de verir (sadelik bütçesi, H1)
- **Bulgu özeti** (`T2-NN → sahip · durum`): —
- **Son tam koşum:** —
- **Katalog kapsamı** (envanter çıktısı): 0 / 183
- **Yarım / sıradaki:** H0b tıklama taraması → bulguları düzelt → T1 9b12bef denetimi
