# kalite/veri

Eğrilerin (kalite/egri/) okuduğu veri. olcum.py tarayıcı açmaz; tarayıcı isteyen ölçüm kendi komutuyla buraya yazar.

- `sinav-sonuc.json` — King sınavının son koşusu (`python kalite/egri/_sinav.py`); Anlama ve Kontrol vekilleri okur.
- `acilis.json` — üç modülün açılış süresi (`python kalite/egri/optimizasyon.py --acilis`); Optimizasyon okur.

## yerel/ — yalnız bu bilgisayarda (git dışı, `yerel/.gitignore`)

Sahibinin gerçek kullanımından gelen veri. Depoya girmez, hiçbir yere gönderilmez. Dosya yoksa ölçüm `veri yok` der.

- `yerel/anlama.jsonl` — Anlama eğrisinin etiketli seti («yanlış anladın» seti, plan A7). Satır başına bir mesaj,
  yalnız şu alanlar:
  `{"metin": "…", "niyet": "sohbet|kayit|ogren|arastir|yonet", "kaynak": "…", "king": "<niyet>", "tarih": "YYYY-AA-GG"}`.
  - `niyet`: sahibinin verdiği doğru niyet. Yalnız `kaynak: "yanlis-anladin"` satırında boş (`null`) olabilir: işaret
    basıldı, doğru niyet henüz söylenmedi («etiket bekliyor»; isabete girmez).
  - `kaynak`: mesajın nereden geldiği. `yanlis-anladin` = King'in cevabının altındaki işaret; başka değer (ör.
    `ornek`) = sahibinin işaretlemeden etiketlediği mesaj.
  - `king`: King'in o an seçtiği niyet. `yanlis-anladin` satırında zorunlu ve `niyet`'ten farklı olmalı; öteki
    satırlarda yoksa satır sayılır ama isabete girmez.
  - `tarih`: isteğe bağlı.
  - Denetim: `python kalite/egri/anlama.py --denetle`. Sunucunun yazma yolu `anlama.isaretle(kok, metin, king, niyet?)`:
    doğrulanmayan satırı yazmaz.
  - Yalnız işaretli satır varken eğri değer almaz: o örneklemde isabet hep 0'dır.
- `yerel/arama-aday.jsonl`, `yerel/anlama-aday.jsonl` — sahibin King'e gerçek mesajlarından kurulan setler
  (`python kalite/egri/_yerel_set.py`; kaynak tek depo, salt-okur kopya). Satırda `etiket` ve `etiketleyen`
  (`"sahip"` ya da `"model"`) durur; yalnız sahibin etiketi eğriye «ölçüldü» olarak girer, model taslağı «tahmin».
  Etiketleme `GET /api/kalite/etiket/adaylar?set=…` ve `POST /api/kalite/etiket` (yalnız bu bilgisayardan; `sistem/etiket.py`).
  Arama setinin yolu `LIFEOS_ARAMA_SET` ile değişir. Tek deponun yolu `LIFEOS_TEK_DEPO` (boş = yok; testler böyle).
- `yerel/kullanim.json` — kullanım sayacı (plan A2). Tarayıcıdaki `localStorage['lifeos.kullanim']` değerinin aynısı:
  `{"surum": 1, "gunler": {"YYYY-AA-GG": {"ekran/<yer>": n, "arac/<yer>": n}}}`. Yazan `kalite/kullanim.js`,
  okuyan `kalite/olcum.py` `kullanim` ölçütü (son 28 gün, verideki en yeni güne göre).
