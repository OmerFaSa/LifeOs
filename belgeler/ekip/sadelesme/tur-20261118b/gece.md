# Tur 2026-11-18b · Gece sahneleri (sıcak ışık, gök derinliği)

Sahibin isteği: «görsel kaliteyi arttır» → «daha güzel olsun». Sorun (sahibin ekranından): gece sahneleri boş ve sönük; Bugün'ün otağı gece minicik ve karanlık. Dosya: `brand/ortak/piksel-doga.js` (kabuğa dokunulmadı).

Ajan hesap sınırında kesildi (kod bitmiş, ölçüm ve kapı yarımdı); 2026-11-18 oturum 2209a43f gözden geçirip panoları çekti ve kapıdan geçirdi.

## Ne değişti
- **Ortak:** `isik()` yumuşak sıcak ışık havuzu (tam piksel); `samanyolu()` gök kuşağı hazır gürültü tablosuyla (her pikselde sinüs yok), kuşak dışı yarık, ayın halesi; `ocak()` küçük ateş + yer ışığı.
- **Işık kuralı:** pencere, kapı, kandil gece ve mavi saatte yanar; şafak ve gün batımında güneş ufkun altına inince. Güneş ufkun altındayken pencereden gün ışığı düşmez; alçak güneşte gölge uzun ve eğik.
- **Sahne sahne:** Ötüken obanın öbür ucunda yanan kapı + otağ önünde ocak (odak tek otağa sıkışmaz), yol ucunda konak; kale burcunda nöbet ateşi; ırmakta ay; kervansaray kapısında iki meşale, yalakta fener yansıması; havuzda yanan pencerelerin yansıması; levha ile kandil havuzu üst üste binmesin diye ay ışığı kaldırıldı.

## Önce/sonra
`gece-gorsel/<sahne>.png`: solda önce (a7e09e54), sağda sonra; satırlar 22:00 ve 06:18, masaüstü 480×100, telefon 195×72 (Ötüken'de 480×127 de).

## Ölçüm
`binaCiz` en uzun: Ötüken 22:00 480×127 ≈ 4,9 ms (boşta, önceden çizilir).
