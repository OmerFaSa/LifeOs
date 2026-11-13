"""python kalite/anlama_test.py — «yanlış anladın» setinin biçimi, denetimi ve Anlama eğrisi (geçici klasör). Çıkış 0/1."""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

BURASI = Path(__file__).resolve().parent
sys.path.insert(0, str(BURASI / "egri"))
import anlama  # noqa: E402

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

hatalar = []


def dene(ad, kosul, ayrinti=""):
    print(("✓ " if kosul else "✗ ") + ad + ("" if kosul else f"  {ayrinti}"))
    if not kosul:
        hatalar.append(ad)


H = anlama.satir_hatalari
dene("işaretli satır, doğru niyet beklerken geçerli",
     H({"metin": "yarın 7'de kalk", "kaynak": "yanlis-anladin", "king": "sohbet", "niyet": None}) == [])
dene("işaretli satır, doğru niyetle geçerli",
     H({"metin": "x", "kaynak": "yanlis-anladin", "king": "sohbet", "niyet": "yonet", "tarih": "2026-11-13"}) == [])
dene("işaretsiz satırda niyet zorunlu", H({"metin": "x", "kaynak": "ornek"}) != [])
dene("işaretli satırda king zorunlu", any("king" in h for h in H({"metin": "x", "kaynak": "yanlis-anladin"})))
dene("işaretli satırda niyet = king çelişkidir",
     any("çelişki" in h for h in H({"metin": "x", "kaynak": "yanlis-anladin", "king": "kayit", "niyet": "kayit"})))
dene("beş niyet dışı değer reddedilir", H({"metin": "x", "kaynak": "ornek", "niyet": "uydurma"}) != [])
dene("bilinmeyen alan reddedilir (kişisel veri sızmaz)",
     any("bilinmeyen" in h for h in H({"metin": "x", "kaynak": "ornek", "niyet": "kayit", "kullanici": "a"})))
dene("boş metin ve bozuk tarih reddedilir",
     len(H({"metin": " ", "kaynak": "ornek", "niyet": "kayit", "tarih": "13.11.2026"})) == 2)
dene("nesne olmayan satır reddedilir", H([1, 2]) != [])

with tempfile.TemporaryDirectory() as d:
    kok = Path(d)
    o = anlama.olc(kok)
    dene("set yokken eğri ölçülmedi, «veri yok»", o["deger"] is None and o["etiket"] == "veri yok"
         and o["durum"] == "ölçülmedi", o)

    dene("isaretle doğrulanmayan satırı yazmaz", anlama.isaretle(kok, "", "sohbet") != []
         and not (kok / anlama.SET).exists())
    dene("isaretle geçerli satırı yerel sete ekler",
         anlama.isaretle(kok, "su içtim 2 bardak", "sohbet", tarih="2026-11-13") == []
         and anlama.isaretle(kok, "planı ertele", "kayit", niyet="yonet", tarih="2026-11-13") == [])
    o = anlama.olc(kok)
    dene("yalnız işaretli satır varken değer yok (örneklem yanlı, isabet hep 0 olurdu)",
         o["deger"] is None and o["ayrinti"]["yanlis_anladin"] == 2 and o["ayrinti"]["etiket_bekleyen"] == 1
         and "neden_degersiz" in o["ayrinti"], o["ayrinti"])

    with open(kok / anlama.SET, "a", encoding="utf-8") as f:
        for r in ({"metin": "a", "niyet": "kayit", "kaynak": "ornek", "king": "kayit"},
                  {"metin": "b", "niyet": "ogren", "kaynak": "ornek", "king": "ogren"}):
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
        f.write("{bozuk\n")
    o = anlama.olc(kok)
    dene("işaretsiz örneklem gelince eğri ölçülür: 3 kararlı satırın 2'si doğru, etiket bekleyen dışarıda",
         o["deger"] == 0.667 and o["etiket"] == "ölçüldü" and o["ayrinti"]["king_kararli"] == 3
         and o["ayrinti"]["gecersiz_satir"] == 1, o["ayrinti"])

    _, bozuk = anlama.etiketli(kok)
    dene("denetim bozuk satırı numarasıyla verir", [no for no, _ in bozuk] == [5], bozuk)

r = subprocess.run([sys.executable, str(BURASI / "egri" / "anlama.py"), "--denetle"], capture_output=True)
dene("bugünkü set denetimden geçer (--denetle çıkış 0)", r.returncode == 0, r.stdout.decode("utf-8", "replace"))
dene("set git dışı", (BURASI / "veri" / "yerel" / ".gitignore").read_text(encoding="utf-8").splitlines()[1] == "*")

print(f"\n{'TAMAM' if not hatalar else 'HATA'}: anlama_test {len(hatalar)} hata")
sys.exit(1 if hatalar else 0)
