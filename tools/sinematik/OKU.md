# Tanıtım filminin sesi

Film `brand/ortak/sinematik.js`; sesi tek dosya: `brand/medya/tanitim/tanitim-sinematik.mp4`
(anlatım + müzik, AAC, düz MP4). Bu klasör o dosyayı yeniden üretir. Bu bilgisayarda ffmpeg
yok: müzik tarayıcıda sentezlenir, WebCodecs ile AAC'ye kodlanır, `mux.py` düz MP4'e sarar
(MediaRecorder'ın parçalı MP4'ü ileri sarılamıyordu).

1. Anlatım: `python tools/sinematik/seslendir.py gemini Kore` (tek Gemini isteği; ücretsiz
   katman günde 10 TTS isteği verir) ya da `... ema` (King'in yerel sesi). Metin
   `satirlar.json`'da: `gemini` yazılış, `ema` okunuş (kısaltmalar hecelenir).
2. Çıkan süreleri `sinematik.js` › `SATIR`'a yaz (satırlar üst üste binmesin; gerekirse
   `SAHNE` zamanlarını ve `karistir.html` › `AKOR_T`, `GECIS`'i kaydır).
3. `python tools/sinematik/sunucu.py`, tarayıcıda `http://127.0.0.1:4598/karistir.html` › Kaydet.
4. `python tools/sinematik/mux.py %TEMP%/lifeos-sinematik/anlatim.aac brand/medya/tanitim/tanitim-sinematik.mp4`
5. `python tools/ortak.py --yay` ve üç `build.py`.
