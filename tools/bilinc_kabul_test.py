#!/usr/bin/env python3
"""Kabul testi: brand/ortak/bilinc.js (LIFEOS.Bilinc), Ana sayfa › Kişisel araçlar › Bilinç haritası.

   Saf katman: temizlik ve sınırlar, [[bağ]] / [[!çelişki]] ayrıştırma, ağ, yerleşimin
   belirlenimci olması, profil yalnız yazılandan, King'e giden kayıtlar ve satırlar.

   python3 tools/bilinc_kabul_test.py     (cikis 0 temiz, 1 kirmizi)"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import kabul_js as J  # noqa: E402

DOSYA = ["brand/ortak/bilinc.js"]
hata = []


def bekle(ad, kosul):
    if not kosul:
        hata.append(ad)


def js(ifade):
    return J.calistir("", DOSYA, "(function(){ var B = LIFEOS.Bilinc; " + ifade + " })()")


ORNEK = """var d = B.temiz({ dusunceler:[
  { id:'a', baslik:'Disiplin özgürlüktür', metin:'Rutin kafamı boşaltır. [[Sabah yazmak]] buna örnek. [[!Canım isteyince çalışırım]]', konu:'Çalışma', tur:'inanc', kesinlik:5, etiket:['#Rutin'] },
  { id:'b', baslik:'Sabah yazmak', metin:'Her sabah 10 dakika.', konu:'Çalışma', tur:'karar', kesinlik:4, etiket:['rutin'] },
  { id:'c', baslik:'Canım isteyince çalışırım', metin:'', konu:'Çalışma', tur:'fikir' },
  { id:'e', baslik:'Ölümden sonra ne var?', metin:'', konu:'Felsefe', tur:'soru', zaman:5 },
  { id:'f', baslik:'', metin:'başlıksız düşer' },
  { id:'a', baslik:'kopya id düşer' } ] });"""

r = js(ORNEK + " return { n:d.dusunceler.length, izin:d.izin, et:d.dusunceler[0].etiket, kes:d.dusunceler[2].kesinlik, tur:B.temiz({dusunceler:[{baslik:'x',tur:'yok'}]}).dusunceler[0].tur };")
bekle("başlıksız ve kopya id düşer", r["n"] == 4)
bekle("izin varsayılan açık", r["izin"] is True)
bekle("etiket küçük harf, # yok, tekil", r["et"] == ["rutin"])
bekle("kesinlik varsayılan 3", r["kes"] == 3)
bekle("bilinmeyen tür fikir olur", r["tur"] == "fikir")

r = js("return B.baglar('x [[Bir]] y [[!İki Şey]] [[]] [[a\\nb]]');")
bekle("bağ ve çelişki ayrışır", r == [{"hedef": "bir", "celiski": False}, {"hedef": "iki şey", "celiski": True}])

r = js(ORNEK + " var g = B.ag(d); return { k:g.kenar, der:g.dugum };")
turler = sorted((k["a"] + k["b"], k["tur"]) for k in r["k"])
bekle("ağ: bağ, çelişki; etiket bağı açık bağın altında kalır", turler == [("ab", "bag"), ("ac", "celiski")])
bekle("derece sayılır", {x["id"]: x["derece"] for x in r["der"]} == {"a": 2, "b": 1, "c": 1, "e": 0})

r = js(ORNEK + " var g = B.ag(d), y1 = B.yerlesim(d, g, 600, 400), y2 = B.yerlesim(B.temiz(d), B.ag(d), 600, 400);"
       " var ic = Object.keys(y1).every(function(k){ return y1[k].x >= 24 && y1[k].x <= 576 && y1[k].y >= 24 && y1[k].y <= 376; });"
       " return { ayni:JSON.stringify(y1) === JSON.stringify(y2), ic:ic, n:Object.keys(y1).length };")
bekle("yerleşim belirlenimci", r["ayni"])
bekle("yerleşim çerçevede", r["ic"] and r["n"] == 4)

r = js(ORNEK + " var p = B.profil(d); return { t:p.toplam, kon:p.konular, mer:p.merkez[0].id, kes:p.kesin.map(function(x){return x.id;}), sor:p.sorular.map(function(x){return x.id;}), cel:p.celiski.length, yal:p.yalniz, bag:p.bag };")
bekle("profil: konular sayılır", r["kon"] == [["Çalışma", 3], ["Felsefe", 1]])
bekle("profil: merkez en çok bağlı", r["mer"] == "a")
bekle("profil: kesin inanç ve karar", r["kes"] == ["a", "b"])
bekle("profil: açık soru, çelişki, yalnız", r["sor"] == ["e"] and r["cel"] == 1 and r["yal"] == 1 and r["bag"] == 2)

r = js("return B.profil(B.temiz({})).toplam;")
bekle("boş harita: sıfır düşünce, uydurma yok", r == 0)

r = js(ORNEK + " var k = B.kisiKayitlari(d); d.izin = false; return { k:k, kapali:B.kisiKayitlari(d).length };")
bekle("King kayıtları: izin kapalıyken yok", r["kapali"] == 0)
bekle("King kayıtları: kişinin sözü, yalnız King alanları", r["k"] and all(x["katman"] == "soz" and x["alan"] in ("gorus", "deger") for x in r["k"]))
bekle("King kayıtları: [[ ]] işaretleri temizlenir", all("[[" not in x["metin"] for x in r["k"]))
bekle("King kayıtları: kesin inanç değer alanında", any(x["alan"] == "deger" and "Disiplin" in x["metin"] for x in r["k"]))

r = js(ORNEK + " d.dusunceler[0].sohbet = [{kim:'king', metin:'Bence güçlü.'}]; return B.kingSatirlar(B.temiz(d), 'a', 'Haklı mıyım?');")
bekle("King satırları: düşünce, çelişki, geçmiş, soru", any("Disiplin" in s for s in r) and any(s.startswith("Çelişkili") for s in r)
      and any(s.startswith("King daha önce") for s in r) and r[-1].startswith("Kullanıcının sorusu"))
bekle("King satırları ≤160 ve ≤16", all(len(s) <= 160 for s in r) and len(r) <= 16)

r = js(ORNEK + " var g = B.ag(d), s = B.haritaSvg(d, g, B.yerlesim(d, g, 600, 400), { w:600, h:400, secili:'a' }); return s;")
bekle("harita: her düşünce bir düğüm, aria-label sayıyla", r.count('data-bh-sec=') == 4 and 'aria-label="Bilinç haritası: 4 düşünce, 2 bağ"' in r)
r = js("return B.haritaSvg(B.temiz({dusunceler:[{id:'x', baslik:'<img onerror=1>'}]}), {kenar:[], dugum:[]}, {x:{x:1,y:1}});")
bekle("harita: başlık kaçışlı", "<img" not in r)

r = js(ORNEK + " return { g:B.geriBaglar(d, 'b'), c:B.cozulmemis(d, '[[Sabah yazmak]] [[Yeni Fikir]] [[yeni fikir]]'), o:B.oneriler(d, 'sa', 'a').map(function(x){return x.id;}), a:B.ara(d, 'Rutİn'), bos:B.ara(d, ' '), h:B.haritaSatirlar(d), hb:B.haritaSatirlar(B.temiz({})) };")
bekle("geri bağlar", r["g"] == [{"id": "a", "baslik": "Disiplin özgürlüktür", "celiski": False}])
bekle("çözülmemiş bağ tekil", r["c"] == ["yeni fikir"])
bekle("öneri: başlıkta geçen, kendisi hariç", r["o"] == ["b"])
bekle("arama: etiket/metin, büyük-küçük harf", sorted(r["a"]) == ["a", "b"] and r["bos"] is None)
bekle("harita satırları: sayılar profilden, boşta yok", r["h"][0].startswith("Haritada 4 düşünce ve 2 bağ") and r["hb"] == [] and all(len(x) <= 160 for x in r["h"]))
r = js(ORNEK + " var g = B.ag(d); return B.haritaSvg(d, g, B.yerlesim(d, g, 600, 400), { w:600, h:400, vb:'10 10 300 200', bulunan:['a'] });")
bekle("harita: görüş kutusu ve arama sönükleştirir", 'viewBox="10 10 300 200"' in r and r.count("is-sonuk") >= 3)

CAT = """var d = B.temiz({ dusunceler:[
  { id:'k', baslik:'İş mi tutku mu', tur:'catisma', taraf:[{ ad:'Güvenli yan', ister:'düzenli maaş', korkar:'parasız kalmak', fazla:1 }, { ister:'müzik yapmak' }], durum:'garip' },
  { id:'z', baslik:'Gizli korkum', tur:'his', ozel:true, metin:'[[İş mi tutku mu]]' },
  { id:'v', baslik:'Dürüstlük', tur:'deger', kesinlik:5, evrim:[{ zaman:9, metin:'Artık daha da eminim', kesinlik:5 }, { metin:'' }] },
  { id:'f', baslik:'Fikir', tur:'fikir', taraf:[{ ad:'x' }], metin:'Bak [[not:esp/n123|Stoacılık]] ve [[Dürüstlük]] https://youtu.be/dQw4w9WgXcQ' } ] });"""
r = js(CAT + " var k = d.dusunceler[0]; return { taraf:k.taraf, durum:k.durum, fTaraf:d.dusunceler[3].taraf === undefined, evrim:d.dusunceler[2].evrim.length, ozel:d.dusunceler[1].ozel };")
bekle("çatışma: iki yan, fazla alan düşer, bilinmeyen durum açık", r["taraf"] == [{"ad": "Güvenli yan", "ister": "düzenli maaş", "korkar": "parasız kalmak"}, {"ad": "", "ister": "müzik yapmak", "korkar": ""}] and r["durum"] == "acik")
bekle("çatışma olmayanda taraf yok", r["fTaraf"])
bekle("evrim: boş girdi düşer; yalnız bana korunur", r["evrim"] == 1 and r["ozel"] is True)
r = js(CAT + " var p = B.profil(d), k = B.kisiKayitlari(d), s = B.kingSatirlar(d, 'k', ''), h = B.haritaSatirlar(d);"
       " return { cat:p.catisma.map(function(x){return x.id;}), deg:p.degerler.map(function(x){return x.id;}), degisen:p.degisen.map(function(x){return x.id;}),"
       " kis:k.map(function(x){return x.metin;}).join('|'), s:s, h:h.join('|'), ksz:B.kingSatirlar(d, 'v', '') };")
bekle("profil: açık çatışma, değer, değişen", r["cat"] == ["k"] and r["deg"] == ["v"] and r["degisen"] == ["v"])
bekle("yalnız bana: King kayıtlarına ve harita özetine girmez", "Gizli korkum" not in r["kis"] and "Gizli korkum" not in r["h"])
bekle("King kayıtları: değer ve çatışma", "Değer verdiği: «Dürüstlük»" in r["kis"] and "Yaşadığı iç çatışma" in r["kis"])
bekle("King satırları: iki yan ve durum", any(x.startswith("Bir yanı («Güvenli yan»)") for x in r["s"]) and any(x.startswith("Öbür yanı") for x in r["s"]) and "Durum: hâlâ açık" in r["s"])
bekle("King satırları: yeniden düşünme", any("Sonradan şöyle düşündü" in x for x in r["ksz"]))
r = js(CAT + " var g = B.ag(d); return { k:g.kenar.map(function(e){return e.a+e.b;}), at:B.atiflar(d.dusunceler[3].metin), yaz:B.atifYaz('esp', 'n1', 'A|b]'), akis:B.akis(d).map(function(x){return x.olay;}),"
       " kv:B.kivilcimlar(d, '2026-11-09', 3).length, kv2:JSON.stringify(B.kivilcimlar(d, '2026-11-09', 3)) === JSON.stringify(B.kivilcimlar(d, '2026-11-09', 3)),"
       " m:['https://a.com/x.PNG','https://a.com/v.mp4','http://a.com/s.mp3','https://youtu.be/dQw4w9WgXcQ','https://www.youtube.com/watch?v=dQw4w9WgXcQ','javascript:alert(1)','https://www.ornek.org/yazi'].map(function(u){ var t = B.medyaTuru(u); return t ? t.tur : null; }),"
       " svg:B.haritaSvg(d, g, B.yerlesim(d, g, 600, 400), { w:600, h:400 }) };")
bekle("atıf düşünce bağı sayılmaz, [[Dürüstlük]] bağlanır", sorted(r["k"]) == ["fv", "kz"] or sorted(r["k"]) == ["fv", "zk"])
bekle("atıf ayrışır ve güvenli yazılır", r["at"] == [{"modul": "esp", "id": "n123", "baslik": "Stoacılık"}] and r["yaz"] == "[[not:esp/n1|A b ]]")
bekle("akış: yazılan ve yeniden düşünülen", r["akis"].count("yeniden") == 1 and r["akis"].count("yazdi") == 4)
bekle("kıvılcım: üç, güne göre sabit", r["kv"] == 3 and r["kv2"])
bekle("medya türü: görsel, video, ses, YouTube, javascript yok", r["m"] == ["gorsel", "video", "ses", "youtube", "youtube", None, "baglanti"])
bekle("harita: çatışma eşkenar, yalnız bana işaretli", "is-catisma" in r["svg"] and "<rect" in r["svg"] and "is-ozel" in r["svg"])

if hata:
    print("KIRMIZI: " + "; ".join(hata))
    sys.exit(1)
print("bilinc kabul: temiz")
