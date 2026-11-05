"""Tanitim filminin anlatimini seslendirir: is klasorune ses/NN.wav (satir basina bir dosya).

    python tools/sinematik/seslendir.py ema            # King'in yerel sesi, ucretsiz, satir satir
    python tools/sinematik/seslendir.py gemini [Kore]  # Gemini TTS, TEK istek; sessizliklerden satirlara bolunur

Gemini ucretsiz katmani gunde 10 TTS istegi verir: butun anlatim tek istekte okunur.
Istek HKM'nin butce kapisindan gecer ve deftere yazilir (HKM/core/ses.py).
Sonra: python tools/sinematik/sunucu.py ve tarayicida karistir.html (OKU.md)."""
import json
import os
import struct
import sys
import tempfile
import wave

BURA = os.path.dirname(os.path.abspath(__file__))
HKM = os.path.join(BURA, "..", "..", "HKM")
IS = os.path.join(tempfile.gettempdir(), "lifeos-sinematik")
sys.path.insert(0, HKM)
from core import ses, db  # noqa: E402

SATIR = json.load(open(os.path.join(BURA, "satirlar.json"), encoding="utf-8"))
STIL = "Sıcak, sakin ve ilham veren bir belgesel anlatıcısı gibi, acele etmeden oku; her satırdan sonra iki saniyelik bir sessizlik bırak:\n\n"


def sure(p):
    with wave.open(p) as w:
        return w.getnframes() / w.getframerate()


def bol(tum, n_bek):
    """Tek parca kaydi 550 ms ve uzeri sessizliklerden boler."""
    with wave.open(tum) as w:
        hz, veri = w.getframerate(), w.readframes(w.getnframes())
    x = struct.unpack("<%dh" % (len(veri) // 2), veri)
    pen = hz // 50
    enerji = [max(abs(v) for v in x[i:i + pen]) for i in range(0, len(x), pen)]
    parca, bas, sessiz = [], None, 0
    for i, e in enumerate(enerji):
        if e > 500:
            bas = i if bas is None else bas
            sessiz = 0
        elif bas is not None:
            sessiz += 1
            if sessiz >= 28:
                parca.append((bas, i - sessiz + 1))
                bas, sessiz = None, 0
    if bas is not None:
        parca.append((bas, len(enerji)))
    if len(parca) != n_bek:
        sys.exit("HATA: %d parca bulundu, %d bekleniyordu (esik ya da sessizlik ayari)" % (len(parca), n_bek))
    for j, (a, b) in enumerate(parca):
        a0, b0 = max(0, (a - 3) * pen), min(len(x), (b + 5) * pen)
        with wave.open(os.path.join(IS, "ses", "%02d.wav" % j), "wb") as o:
            o.setnchannels(1); o.setsampwidth(2); o.setframerate(hz)
            o.writeframes(struct.pack("<%dh" % (b0 - a0), *x[a0:b0]))


def main():
    motor = sys.argv[1] if len(sys.argv) > 1 else "ema"
    os.makedirs(os.path.join(IS, "ses"), exist_ok=True)
    cfg = json.load(open(os.path.join(HKM, "config.json"), encoding="utf-8"))
    if motor == "gemini":
        cfg.setdefault("ses", {})["gemini_ses"] = sys.argv[2] if len(sys.argv) > 2 else "Kore"
        veri, neden = ses.gemini(db.connect(), cfg, STIL + "\n\n".join(s["gemini"] for s in SATIR))
        if not veri:
            sys.exit("HATA: " + neden)
        tum = os.path.join(IS, "ses", "tum.wav")
        open(tum, "wb").write(veri)
        bol(tum, len(SATIR))
    else:
        for i, s in enumerate(SATIR):
            veri, neden = ses.ema(cfg, s["ema"])
            if not veri:
                sys.exit("HATA %d: %s" % (i, neden))
            open(os.path.join(IS, "ses", "%02d.wav" % i), "wb").write(veri)
    for i in range(len(SATIR)):
        print("%2d  %.2f sn  %s" % (i, sure(os.path.join(IS, "ses", "%02d.wav" % i)), SATIR[i]["gemini"]))
    print("Sureler sinematik.js SATIR'a yazilir (baslangic + sure, ust uste binmeden). Is klasoru:", IS)


if __name__ == "__main__":
    main()
