"""Ekranda gorunen basliklarin yazi denetimi (2026-10-16).

Kullanici: «yazi karisikliklarinin onune gec». Ekran basliklari sistemin
geri kalaniyla ayni dilde olur: cumle duzeni (yalniz ilk sozcuk buyuk),
«&» yerine «ve», emoji yok, «cert: estimated» gibi ic terim yok.

    python3 tools/yazi.py            # bulgulari yazar
    python3 tools/yazi.py --denetle  # bulgu varsa cikis 1
"""
import glob
import io
import re
import sys

KEL = r"[A-ZÇĞİÖŞÜ][a-zçğıöşüâîû]+"
EMO = re.compile('[\U0001F300-\U0001FAFF☀-➿]')
IC = re.compile(r"\b(cert|source|estimated|measured|computed|missing):")
# Ozel adlar ve kisaltmalar baslik buyuklugu sayilmaz.
ISTISNA = re.compile(r"(TYT|AYT|YKS|MEB|ÖSYM|MET|HKM|BAM|King|Universal Dependencies|Adult Compendium)")


def tara():
    out = []
    for m in ("AYS", "SPI", "ESP"):
        for f in sorted(glob.glob(m + "/src/js/screens/*.js") + [m + "/src/js/core/parts.js"]):
            try:
                s = io.open(f, encoding="utf-8").read()
            except OSError:
                continue
            for mm in re.finditer(r"(title|label|sub|baslik):\s*'([^'\n]{3,90})'", s):
                t = mm.group(2)
                satir = s.count("\n", 0, mm.start()) + 1
                yer = "%s:%d  %s" % (f.replace("\\", "/"), satir, t)
                temiz = ISTISNA.sub("", t)
                kel = temiz.split()
                if len(kel) >= 3 and sum(1 for k in kel if re.fullmatch(KEL, k.strip("(),.:·"))) >= 3:
                    out.append("Her Kelimesi Büyük başlık: " + yer)
                if " & " in t:
                    out.append("«&» yerine «ve»: " + yer)
                if EMO.search(t):
                    out.append("emoji: " + yer)
                if IC.search(t):
                    out.append("iç terim: " + yer)
    return out


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    b = tara()
    for x in b:
        print(x)
    print("Yazı denetimi: %s" % ("temiz" if not b else "%d bulgu" % len(b)))
    return 1 if (b and "--denetle" in sys.argv) else 0


if __name__ == "__main__":
    sys.exit(main())
