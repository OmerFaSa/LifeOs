# Notlar: klasörler ve yazma (2026-11-18k)

Sahibin sözü: «Yeni not yazma kısmını daha güzel yap ve notlar kısmını klasörlendirebileyim, çünkü notlar çok arttığında sıkıntı olacak.»
Durum: **bitti**, commit yok.

## Ne yapıldı
**Klasörler (Not sayfası, `#/motor/not?klasor=<ad>`)**
- Hızlı kutunun altında klasör çipleri: Hepsi · her klasör (ad + not sayısı; «Ders/Tarih»da üst kat soluk) · Klasörsüz · «+ Yeni klasör». Seçili klasör adreste (`?klasor=` boş = Klasörsüz, parametre yok = Hepsi).
- Yeni klasör: çipin içinde açılan küçük form. Henüz notu olmayan klasör adları `lifeos.not.klasorler` anahtarında durur (kayıt; `kabuk/depo.test.js` KAYITLAR'a eklendi).
- Klasör içindeyken: başlık klasörün adı, arama yalnız o klasörde arar, hızlı not o klasöre girer (ipucu söyler), «Ayrıntılı not» klasörü dolu açar, not ağı o klasörün notlarını çizer, Araçlar bölümü yalnız Hepsi'de görünür.
- Yeniden adlandır (alt klasörler de taşınır) ve Klasörü sil. Silmek **notu silmez**: notlar Klasörsüz'e düşer; onay penceresi yerine evdeki kural 9 düzeni, ekranda «Geri al» (notlar ve boş klasör listesi birlikte geri gelir).
- Araç klasörleri listede görünür (altın nokta). Araç klasörü (ya da araç klasörü taşıyan üst klasör) buradan adlandırılamaz/silinemez; «Aracı aç» bağlantısı çıkar. Gerekçe: Başbuğ'un okuma izni klasöre bağlı, klasör değişirse kapalı aracın notları açılırdı (aracKaydet'in «klasör değişmez» kuralıyla aynı).
- Hepsi görünümünde not satırında notun klasörü küçük bir çiple görünür.

**Yazma ekranı (`#/motor/not/yeni`, `#/motor/not/<id>`)**
- Başlık ve metin tek kâğıt yaprağında (yüzey + yumuşak gölge, kenar yok): büyük serif başlık, metne göre büyüyen gövde (`field-sizing:content`, desteklemeyen tarayıcıda yazarken JS ile büyür), «Başlık boş kalırsa ilk satır notun adı olur» ipucu.
- Altında ayar satırı: Klasör (var olanlar `<datalist>` önerisi, yeni ad yazılabilir; not bir aracın klasöründeyse ipucu aracı ve Başbuğ iznini söyler), bağ ekle, Özel / Üstte tut yan yana.
- Ctrl + Enter formdaki her alandan kaydeder (düğmenin yanında «Ctrl + Enter», telefonda gizli). Kırıntı ve «Notlara dön» notun klasörüne döner. Boş başlık kuralı aynı kaldı (motorun kuralı).
- Var olan notun klasörü artık değiştirilebiliyor (`notKaydet`: formda `klasor` varsa uygulanır, yoksa yerinde kalır).

## Dosyalar
- `motor/not.js`: `Not.klasorler(notlar, ekler)`, `Not.klasorTasi({ notlar, bos, araclar, eski, yeni, zaman })` (saf; yeni boşsa sil → Klasörsüz; araç koruması; 3 kat sınırı). Not nesnesi dondurulmuş olduğu için ana bloğa eklendi.
- `motor/not.test.js`: 2 test. `kabuk/kabuk.test.js`: notKaydet klasör testi (1).
- `kabuk/araclar.js`: klasör çubuğu/eylemleri, liste süzme, yazma ekranı, `klasorFormKaydet`, `klasor-sil`, Ctrl+Enter, büyüme; `silGeriAlinir` birden çok anahtarı geri alabiliyor.
- `kabuk/kabuk.css`: sonda tek blok «/* Notlar: klasörler ve yazma (2026-11-18k) */».
- `kabuk/depo.test.js`: KAYITLAR'a `lifeos.not.klasorler` (aynı satıra başka ajan `lifeos.not.konularim` eklemiş, ikisi birlikte duruyor).
- `tools/kabuk_gez.js`: 8 yeni klasör denetimi (aç, hızlı not klasöre, notu taşı + Ctrl+Enter + kırıntı, klasör içi liste, klasörde arama, adlandır, sil → notlar kalır, geri al) + `not-klasor` görüntüsü. Sonunda not deposu geri yüklenir; mevcut not denetimlerinin hiçbiri değişmedi.

## Testler
- `node motor/not.test.js` 30/30, `node motor/not-hkm.test.js` 7/7, `node kabuk/kabuk.test.js` 76 geçti, `node kabuk/depo.test.js` 19, `node kabuk/bilesen.test.js` 24.
- `node tools/kabuk_gez.js`: **hepsi geçti** (395 ✓, çıkış 0).

## Görüntüler (`belgeler/ekip/sadelesme/tur-20261118k/notlar-goruntu/`)
liste, klasor-ici (Ders/Tarih), yeni-not (Felsefe klasöründe), not-duzenle × {masaustu, telefon} × {light, dark} = 16 görüntü. 390 px'te yatay taşma 0, sayfa hatası yok. Betik: scratchpad `cek_notlar.js`.

## Açık kalanlar
- Klasör çok olursa (onlarca) çipler satır satır sarar; ayrı bir klasör araması yok.
- «Ders/Tarih» iki düzey gibi ağaç olarak gösterilmiyor, tek çip; üst klasör («Ders») kendi notu yoksa ayrı çip olmaz.
- Klasör adlandırma/silme notların `guncelleme` zamanını ilerletir (eşitleme için doğru), bu yüzden taşınan notlar Hepsi listesinde üste çıkar.
