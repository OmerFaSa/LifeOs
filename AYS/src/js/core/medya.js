/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/medya.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* MEDYA KUNYESI — URETILMIS DOSYA, ELLE DUZENLEME.

   `python3 tools/marka.py --kunye` uretir, `--kunye --denetle` tazeligini
   sinar (CI'da kosar). Iceriginin kaynagi `brand/medya/` altindaki
   DOSYALARIN KENDISIDIR.

   NE ISE YARAR: ekran bir kimlikten gorsel adi turetir
   (`brand/ortak/simge.js`). Kimlik katalogda var ama gorseli gelmemisse
   istek her acilista 404 doner. Kunye, `SIMGE_ADI`nin listede olmayan
   kimlik icin bos donmesini saglar: gorsel yoksa yazi kalir, istek hic
   yapilmaz. */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.MEDYA = {
  ders:['ayt-biyoloji','ayt-fizik','ayt-kimya','ayt-matematik','tyt-fen','tyt-matematik','tyt-sosyal','tyt-turkce'],
  disiplin:['diction','history','lang','philo','reading','writing'],
  olcum:['bodyfat','dbp','hrv','lab','ogun','rhr','sbp','sleep','spo2','temp','train','waist','weight'],
  simge:['agirlik','artis','ayar','dinginlik','ekran','hedef','kalp','kitap','liste','saat','seri','takvim','topluluk','uyku','yaprak','yildiz'],
};
