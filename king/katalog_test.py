#!/usr/bin/env python3
"""king/katalog.py sınaması: on iki kapı ve eski araç haritası. Çıkış 0 yeşil, 1 kırmızı. python king/katalog_test.py"""
import os
import shutil
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.dont_write_bytecode = True
import katalog  # noqa: E402
import mcp  # noqa: E402

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass
kirmizi = 0


def dogru(ad, kosul, ek=""):
    global kirmizi
    print(("  ✓ " if kosul else "  ✕ ") + ad + ("" if kosul else "  %r" % (ek,)))
    kirmizi += 0 if kosul else 1


print("Kapılar")
dogru("en çok 12 kapı (%d)" % len(katalog.KAPILAR), 0 < len(katalog.KAPILAR) <= 12)
dogru("her kapının şeması var", set(katalog.KAPI_SEMA) == set(katalog.KAPILAR))
for ad, (motor, aciklama, okur, eylemler, mcp_arac) in katalog.KAPILAR.items():
    sema = katalog.KAPI_SEMA[ad]
    dogru("%s: Türkçe açıklama, eylem zorunlu, «katalog» eylemi" % ad, len(aciklama) > 20 and sema["required"] == ["eylem"]
          and "katalog" in sema["properties"]["eylem"]["enum"] and sema["additionalProperties"] is False, sema)
    dogru("%s: okuyan eylemler eylemlerin içinde" % ad, set(okur) <= set(eylemler), (okur, eylemler))
    dogru("%s: bugünkü mcp aracı var ve okur" % ad, all(a in mcp.ARAC for a in mcp_arac), mcp_arac)
dogru("mcp.py'nin her aracı tam bir kapıda", sorted(a for k in katalog.KAPILAR.values() for a in k[4]) == sorted(mcp.ARAC))

print("Niyet masaları")
dogru("beş niyetin masası var", set(katalog.NIYET_KAPILARI) == {"sohbet", "kayit", "ogren", "arastir", "yonet"})
dogru("sohbet ve kayıt masası boş", katalog.NIYET_KAPILARI["sohbet"] == () == katalog.NIYET_KAPILARI["kayit"])
for n, kapilar in katalog.NIYET_KAPILARI.items():
    araclar = katalog.model_araclari(n)
    dogru("%s: tanımlı kapılar, sağlayıcı biçimi" % n, len(araclar) == len(kapilar) <= 12 and all(
        set(a) == {"name", "description", "input_schema"} and a["name"] in katalog.KAPILAR for a in araclar), araclar)

print("Eski araç haritası")
h = katalog.harita()
dogru("her ad tam bir yerde (kapı ya da arşiv)", all(k in katalog.KAPILAR or k == "arşiv" for k, _ in h.values()))
dogru("her eşlemenin nedeni var", all(n for _, n in h.values()))
eski = dict(katalog.ESKI)
katalog.ESKI["ara"] = (katalog.ESKI["ara"][0], katalog.ESKI["ara"][1] + " soru_sor")
try:
    katalog.harita()
    dogru("iki kez eşlenen ad hata verir", False)
except ValueError as e:
    dogru("iki kez eşlenen ad hata verir", "soru_sor" in str(e), e)
katalog.ESKI.clear()
katalog.ESKI.update(eski)

print("İstemci kaydının taranması (depodaki kaynak)")
s = katalog.sayim()
dogru("tarama boş değil (%d araç)" % s["toplam"], s["toplam"] >= 40, s["toplam"])
dogru("eşlenmeyen eski araç yok", s["eslenmeyen"] == [], s["eslenmeyen"])
dogru("haritada bayat ad yok", s["bayat"] == [], s["bayat"])
dogru("kapı sayıları toplamı = taranan", sum(s["kapi_basina"].values()) == s["toplam"], s)
dogru("model kataloğu + yetki = toplam", s["model_katalogu"] + s["yetki"] == s["toplam"], s)

print("Tarayıcı geçici kaynakta")
t = tempfile.mkdtemp(prefix="lifeos-katalog-test-")
Path(t, "brand", "ortak").mkdir(parents=True)
Path(t, "brand", "ortak", "king-arac.js").write_text("liste.push({ ad: 'not_ara' }); dis('pc_dosya_ac', 1); {ad: 'eylem_'}",
                                                     encoding="utf-8")
Path(t, "brand", "ortak", "yetki.js").write_text("{ id: 'tema', seviye: 1 }", encoding="utf-8")
b = katalog.tara(t)
dogru("ad, dis(), yetki öneki bulunur; «eylem_» öneki atlanır",
      sorted(b) == ["not_ara", "pc_dosya_ac", "yetki:tema"], sorted(b))
s = katalog.sayim(b)
dogru("eksik modül dosyası atlanır, sayım eşler", s["eslenmeyen"] == [] and s["kapi_basina"]["not"] == 1
      and s["kapi_basina"]["dis_dunya"] == 1 and s["kapi_basina"]["ayar"] == 1, s)
dogru("tanınmayan ad «eşlenmeyen» olur", katalog.sayim({"yeni_arac": ["x"]})["eslenmeyen"] == ["yeni_arac"])
shutil.rmtree(t, ignore_errors=True)

print("\n%s · kırmızı %d" % ("YEŞİL" if not kirmizi else "KIRMIZI", kirmizi))
sys.exit(1 if kirmizi else 0)
