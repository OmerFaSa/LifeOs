# İş bölüşümü — iki Claude, tek `main` (2026-09-24)

Kaynak: `ekip/HATALAR.md` (45 bulgu). Bulgu kodları (KR-1, Y-3, O-7, D-12…)
oradaki gibidir; her bulgunun «Konum», «Tekrar» ve «Düzeltme yönü» satırı
orada yazılı. (`OZELLIK-ANALIZI.md` depoda yok; «Düzeltme yönü» yeterli.)

Kural tek: **iki oturum aynı dosyaya dokunmaz.** İş dizine göre ayrıldı.

## Claude A (ilk oturum) — yalnız `HKM/` ve `ekip/DEVIR.md`

Y-1 · Y-9 · Y-3 · O-1 · O-2 · O-7 · O-9 · Y-2 (HKM tarafı: `precedence.py`
negatif gün) · D-1 · D-2 · D-3 · D-4 · D-7 · D-13 · D-15 · D-16 · D-18 · KO-1 ·
B-1 · B-4 · D-12 (yalnız HKM testi: üç `beacon.js`'in `INTENT_KINDS`'ini OKUR,
`intents.KINDS` ile karşılaştırır; modül dosyasına YAZMAZ).
En sonda `python3 tools/sayilar.py --tam --yaz` (README sayıları) — yalnız A.

## Claude B (ikinci oturum) — yalnız `AYS/`, `SPI/`, `ESP/`, `brand/`, `tools/ortak.py`, `tools/seviye.py`, `.github/`, `README.md` metni, `NOTLAR.md`

1. **KR-1 (kritik, önce bu):** olumsuzluk ve kip süzgeci — «7 saat uyumadım»,
   «40 soru çözmedim», «… istemiyorum», «kapatma» ölçüm/eylem OLMAZ. Tek kaynak
   `brand/ortak/` altında yeni bir dosya (`tools/ortak.py` DOSYALAR'a ekle,
   `--yay`), üç ayrıştırıcı (`AYS/src/js/core/komut.js`, `SPI/src/js/core/quickentry.js`
   + `proposals.js fromText`, `ESP/src/js/core/komut.js`) onu kullanır. Ölçüm
   YAZAN eylem hiçbir ayarda sormadan uygulanmaz (önizleme + onay). Örnek:
   `HKM/core/dil.py` `olumsuz()` (okumak serbest, değiştirmek A'nın işi).
2. Y-6 geri al (delta tabanlı; sonraki kaydı silmez, blok durumunu geri çevirir)
3. Y-5 · O-4 · D-6 geçmiş gönderimi (geçmiş güne bugünün değeri gitmez; tek
   bozuk gün geri kalanı durdurmaz, hangi gün neden — söylenir)
4. Y-4 SPİ işareti: ince toparlanma (`readiness().thin`) `estimated` gider
5. Y-8 · B-2 · B-3 onay kartı ve belge metinleri (tam yedek de gider — söylenir)
6. Y-2 AYS tarafı (sınav sonrası eksi gün yok: başlık ve `exam_days_left`)
7. Y-7 modül tarafı: HKM'ye aynı anda TEK profil bağlanabilir (öteki profilde
   «HKM başka profile bağlı» denir)
8. O-3 · O-5 · O-8 · O-10 · O-11
9. ~~D-8 · D-9 · D-10 · D-11 · D-14 · D-17 · D-19~~ → **Claude A aldı**
   (2026-09-24, kullanıcı iletti). B bunlara dokunmaz.

İlerlemeyi **`ekip/HATALAR-ILERLEME-B.md`**'ye yaz (DEVIR'e değil; A birleştirir).

## İkisi için de

- Doktrin `AGENTS.md`; her hata için ÖNCE onu yakalayan test, sonra düzeltme.
- `main`'e doğrudan: `git fetch origin main && git rebase origin/main` (yalnız
  kendi itilmemiş commit'lerin), sonra `git push origin HEAD:main`. **Force yok.**
- Dokunduğun sistemin `runtests` + `smoke`'u geçmeden itme; modül değiştiyse
  o modülün `python3 build.py`'si (dist) aynı commit'te.
- `tools/sayilar.py --yaz` YALNIZ A koşar (README sayıları çakışmasın).
- Yeni özellik yok: bu tur yalnız `HATALAR.md`. Part 9 (tasarım), para
  fişi, sunucu/telefon A'da ve kullanıcı kararı bekliyor.
