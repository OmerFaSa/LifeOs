# kalite/veri

Eğrilerin (kalite/egri/) okuduğu veri. olcum.py tarayıcı açmaz; tarayıcı isteyen ölçüm kendi komutuyla buraya yazar.

- `anlama.jsonl` — Anlama eğrisinin etiketli seti, **boş gelir**. Satır başına bir mesaj:
  `{"metin": "…", "niyet": "sohbet|kayit|ogren|arastir|yonet", "kaynak": "…", "king": "<niyet>"}`.
  `niyet` sahibinin verdiği doğru niyet; `kaynak` mesajın nereden geldiği (ör. `yanlis-anladin`, `ornek`);
  `king` King'in o an seçtiği niyet (isteğe bağlı; yoksa satır sayılır ama isabete girmez). Yalnız bu bilgisayarda kalır.
- `sinav-sonuc.json` — King sınavının son koşusu (`python kalite/egri/_sinav.py`); Anlama ve Kontrol vekilleri okur.
- `acilis.json` — üç modülün açılış süresi (`python kalite/egri/optimizasyon.py --acilis`); Optimizasyon okur.
