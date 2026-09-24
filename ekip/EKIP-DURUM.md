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
- **Biten** (adım ya da özellik · commit): —
- **Yarım / sıradaki:** T1 → (Kapı 1 + T0 cevabı) → T2 kabuk, T3 AYS
- **Soru / öneri:** —

## HATA (H)

- **Şu an:** H0b işleyici testleri (T3'ün taşıyacağı ekranlar, AYS önce)
- **Biten:** H0 taban envanteri · 1600f75 — `node tools/envanter.js` her push'ta CI'da koşar
- **T ve K için:** taşıdığın ekrandan sonra `node tools/envanter.js <MODÜL>` koş (~1 dk). «KAYIP» çıkarsa ya geri koy ya da kullanıcı onayıyla `ekip/envanter/kaldirilan.json`'a yaz. Envanter ekran ölçülerini de verir (sadelik bütçesi, H1)
- **Bulgu özeti** (`T2-NN → sahip · durum`): —
- **Son tam koşum:** —
- **Katalog kapsamı** (envanter çıktısı): 0 / 183
- **Yarım / sıradaki:** H0b → H1 sadelik denetimi
