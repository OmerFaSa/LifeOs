"""python kalite/katman_test.py — katman denetiminin testi (geçici klasörde sahte depo + bugünkü ağaç). Çıkış 0/1."""
import json
import os
import sys
import tempfile
from pathlib import Path

BURASI = Path(__file__).resolve().parent
sys.path.insert(0, str(BURASI))
import katman  # noqa: E402

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

MOTOR_A = """(function(kok){
  function ic(){ return 1; }            // iç iş
  function acik(){ return ic(); }
  const A = Object.freeze({ acik, SABIT: 1, yontem(x){ return x; } });
  A.sonradan = 2;
  kok.LIFEOS = kok.LIFEOS || {}; kok.LIFEOS.Motor = kok.LIFEOS.Motor || {};
  kok.LIFEOS.Motor.A = A;
  if (typeof module !== 'undefined' && module.exports) module.exports = A;
})(globalThis);
"""
MOTOR_B = """(function(kok){
  var B = { b: 1 };
  var x = kok.LIFEOS.Motor.A.ic();      // başka motorun iç işine uzanır
  var y = kok.LIFEOS.Kabuk;             // motor kabuğa uzanır
  kok.LIFEOS.Motor.B = B;
})(globalThis);
"""
TEMIZ = {
    "motor/a.js": MOTOR_A,
    "motor/a.test.js": "A.ic();\n",  # test dosyası denetlenmez
    "kabuk/k.js": "var A = L.Motor && L.Motor.A;\nA.acik(); A.SABIT; A.yontem(1); A.sonradan;\n"
                  "// A.ic() yorumda sayılmaz\nvar s = 'A.ic()';\nvar r = /A.ic/;\n",
    "king/kopru.js": "const M = require(path.join(KOK, 'motor', 'a.js'));\nM.acik();\n",
    "alan/x/asama-1.json": json.dumps({"kaynaklar": [{"tur": "depo", "yol": "SPI/src/js/core/bio.js"}],
                                       "metin": "alan/x/ kendi yolu serbest"}),
    "alan/x/README.md": "not\n",
}
BOZUK = {
    "motor/b.js": MOTOR_B,
    "kabuk/k2.js": "var Al = kok.LIFEOS.Motor.A;\nAl.ic();\n",
    "king/k2.js": "const M = require('../motor/a.js');\nM.ic();\n",
    "alan/x/cevir.js": "// kod\n",
    "alan/y/asama-1.json": json.dumps({"ders": [{"metin": "bkz. alan/x/asama-1.json"},
                                                {"metin": "LIFEOS.Motor.A.acik()"}],
                                       "kaynaklar": [{"tur": "web", "yol": "motor/a.js"}]}),
}


def kur(d, dosyalar):
    for yol, metin in dosyalar.items():
        p = Path(d) / yol
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(metin, encoding="utf-8")


hatalar = []


def dene(ad, kosul):
    print(("✓ " if kosul else "✗ ") + ad)
    if not kosul:
        hatalar.append(ad)


with tempfile.TemporaryDirectory() as d:
    kur(d, TEMIZ)
    arayuz, dosya_motor = katman.acik_arayuz(Path(d))
    dene("açık arayüz: freeze gövdesi + yöntem + sonradan eklenen; iç işlev yok",
         arayuz.get("A") == {"acik", "SABIT", "yontem", "sonradan"})
    dene("motor dosyası adıyla eşlenir", dosya_motor == {"motor/a.js": "A"})
    hata, bilinen = katman.denetle(Path(d), istisnalar={})
    dene("temiz ağaç geçer (yorum, dizgi, düzenli ifade, test dosyası, künye sayılmaz)", hata == [] and bilinen == [])
    os.makedirs(os.path.join(d, "alan", "__pycache__"), exist_ok=True)
    open(os.path.join(d, "alan", "__pycache__", "denetle.cpython-312.pyc"), "wb").close()
    dene("alan/__pycache__ alan sayılmaz (CI'da denetle_test bayt kodu yazar)", katman.denetle(Path(d), istisnalar={})[0] == [])

    kur(d, BOZUK)
    b = katman.bulgular(Path(d))
    kurallar = {(x[0], x[2], x[3]) for x in b}
    dene("motor başka motorun iç işine uzanamaz", ("motor/b.js", "motor-ic", "A.ic") in kurallar)
    dene("motor kabuğa uzanamaz", ("motor/b.js", "motor-kabuk", "LIFEOS.Kabuk") in kurallar)
    dene("kabuk takma adla iç işe uzanamaz", ("kabuk/k2.js", "motor-ic", "A.ic") in kurallar)
    dene("king require ile iç işe uzanamaz", ("king/k2.js", "motor-ic", "A.ic") in kurallar)
    dene("alanda kod dosyası olamaz", ("alan/x/cevir.js", "alan-kod", "") in kurallar)
    dene("alan başka alana uzanamaz", ("alan/y/asama-1.json", "alan-ici", "alan/x/") in kurallar)
    dene("alan verisinde kod izi olamaz", ("alan/y/asama-1.json", "alan-ici", "LIFEOS.") in kurallar)
    dene("künye dışı kaynakta kod yolu yakalanır", ("alan/y/asama-1.json", "alan-ici", "motor/a.js") in kurallar)
    dene("satır numarası doğru", any(x[0] == "motor/b.js" and x[2] == "motor-ic" and x[1] == 3 for x in b))
    hata, _ = katman.denetle(Path(d), istisnalar={})
    dene("yeni bozulma çıkış 1 satırı verir", len(hata) == len(b) and all(h.startswith("KATMAN: ") for h in hata))

    ist = {k: "bilinen" for k in kurallar}
    hata, bilinen = katman.denetle(Path(d), istisnalar=ist)
    dene("istisna listedeyse bilinen sayılır", hata == [] and len(bilinen) == len(b))
    (Path(d) / "alan/x/cevir.js").unlink()
    hata, _ = katman.denetle(Path(d), istisnalar=ist)
    dene("kapanan istisna listede kalamaz (liste yalnız küçülür)",
         len(hata) == 1 and hata[0].startswith("KAPANDI: alan/x/cevir.js"))

hata, bilinen = katman.denetle()
dene("bugünkü ağaç: yeni bozulma yok", hata == [])
dene("bugünkü ağaç: her istisna hâlâ gerçek", len(bilinen) == len(katman.ISTISNALAR))
arayuz, _ = katman.acik_arayuz(katman.KOK)
dene("bugünkü ağaç: altı motorun arayüzü okunur", {"Yol", "Not", "Tekrar", "Kayit", "Plan", "Soru"} <= set(arayuz))

print(f"\n{'TAMAM' if not hatalar else 'HATA'}: katman_test {len(hatalar)} hata")
sys.exit(1 if hatalar else 0)
