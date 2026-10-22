#!/usr/bin/env python3
"""veri/ham/*.txt -> veri/temiz/<sistem>/*.jsonl. Yalniz standart kutuphane.

Iki yol, iki guven duzeyi:
  1) TABLO satirlari  -> kodla ayristirilir, model YOK (sayi modelden gecmez).
  2) DUZ METIN        -> yerel model (Ollama) ipucu cikarir; her kaydin `alinti` alani
                         kaynak parcada BIREBIR bulunmuyorsa kayit reddedilir.
Etiket: ikincil kaynaktan gelen hicbir sey 'olculdu' olmaz; en fazla 'tahmin'.
"""
import json, re, sys, time, urllib.request
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
HAM, TEMIZ = KOK / "veri" / "ham", KOK / "veri" / "temiz"
OLLAMA = "http://127.0.0.1:11434/api/chat"
NL = chr(10)
TIRE = {"-", "–", "—", ""}


def norm(s):
    return re.sub(r"\s+", " ", s.replace("’", "'").replace("“", '"').replace("”", '"')).strip().lower()


def parse_tablolar(metin, kaynak, duzey="ikincil"):
    """'Konu | 2025 | 2024' baslikli tablolari kayda cevirir. Tire = kaynakta deger yok -> None."""
    kayit, yillar, bolum, son_metin, toplam_modu = [], None, "", "", False
    for ham in metin.splitlines():
        s = ham.strip()
        if " | " in s and re.search(r"\b20\d\d\b", s) and re.match(r"^\S.*? \| (?:20\d\d)", s):
            yillar = [c.strip() for c in s.split("|")[1:]]
            bolum, toplam_modu = son_metin, False
            continue
        if re.match(r"^Konu \| Toplam", s):
            yillar, toplam_modu, bolum = None, True, son_metin
            continue
        if toplam_modu and " | " in s:
            hucre = [c.strip() for c in s.split("|")]
            if len(hucre) == 2 and re.fullmatch(r"\d{1,4}", hucre[1]):
                kayit.append({"kaynak": kaynak, "duzey": duzey, "bolum": bolum, "konu": hucre[0],
                              "toplam": int(hucre[1]), "etiket": "tahmin"})
            continue
        if yillar and " | " in s:
            hucre = [c.strip() for c in s.split("|")]
            ad, degerler = hucre[0], hucre[1:]
            if len(degerler) != len(yillar) or not ad:
                continue
            yil_deger = {}
            gecerli = True
            for y, d in zip(yillar, degerler):
                if d in TIRE:
                    yil_deger[y] = None
                elif re.fullmatch(r"\d{1,3}", d):
                    yil_deger[y] = int(d)
                else:
                    gecerli = False
            if gecerli:
                kayit.append({"kaynak": kaynak, "duzey": duzey, "bolum": bolum, "konu": ad,
                              "yillar": yil_deger, "etiket": "tahmin"})
            continue
        if s and " | " not in s:
            yillar = yillar if len(s) > 100 else None  # uzun paragraf tabloyu bitirir
            if len(s) <= 80 and not s.startswith("Kaynak:"):
                son_metin = s
            toplam_modu = toplam_modu and len(s) <= 100
    return kayit


def parcala(metin, boyut=2800):
    out, cur = [], ""
    for p in metin.split("\n"):
        if " | " in p:
            continue  # tablolar zaten kodla okundu
        if len(cur) + len(p) > boyut and cur:
            out.append(cur)
            cur = ""
        cur += p + "\n"
    if cur.strip():
        out.append(cur)
    return out


def alinti_dogru(alinti, parca):
    a = norm(alinti)
    return len(a) >= 25 and a in norm(parca)


ISTEM = """Sen bir veri çıkarma aracısın. Aşağıdaki metin YKS (TYT/AYT) hazırlığı hakkındadır.
Görevin: metinde AÇIKÇA yazan, çalışma yöntemi, konu önceliği ya da soru çözme ile ilgili kısa ipuçlarını çıkarmak.
KURALLAR:
- Metinde yazmayan hiçbir şeyi ekleme, kendi bilgini kullanma, sayı uydurma.
- Her ipucu için "alinti" alanına metinden AYNEN kopyalanmış, en az 25 karakterlik bir cümle yaz.
- ders alanı şunlardan biri olsun: Türkçe, Matematik, Geometri, Fizik, Kimya, Biyoloji, Tarih, Coğrafya, Felsefe, Edebiyat, Genel. Emin değilsen Genel.
- İpucu yoksa {"ipuclari": []} döndür.
Yalnızca şu JSON biçiminde yanıt ver:
{"ipuclari":[{"ders":"...","konu":"...","ipucu":"kısa Türkçe cümle","alinti":"metinden aynen"}]}"""


SEMA = {"type": "object", "required": ["ipuclari"], "properties": {"ipuclari": {"type": "array", "items": {
    "type": "object", "required": ["ders", "konu", "ipucu", "alinti"],
    "properties": {"ders": {"type": "string"}, "konu": {"type": "string"},
                   "ipucu": {"type": "string"}, "alinti": {"type": "string"}}}}}}


def model_cagir(model, parca, saniye=240, deneme=3, istem=None, sema=None):
    govde = {"model": model, "stream": False, "format": sema or SEMA,
             "options": {"temperature": 0, "num_ctx": 8192},
             "messages": [{"role": "system", "content": istem or ISTEM},
                          {"role": "user", "content": "METIN:" + NL + parca + NL + "Her ipucunda alinti alani ZORUNLU: metinden aynen kopyala."}]}
    son = None
    for i in range(deneme):
        try:
            r = urllib.request.Request(OLLAMA, data=json.dumps(govde).encode(), headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(r, timeout=saniye) as f:
                return json.loads(json.loads(f.read())["message"]["content"])
        except Exception as e:
            son = e
            time.sleep(5 * (i + 1))
    raise son


def ipuclari(metin, kaynak, model, duzey="ikincil", log=print):
    kabul, red = [], []
    for i, parca in enumerate(parcala(metin)):
        try:
            sonuc = model_cagir(model, parca)
        except Exception as e:
            log("model hatasi", kaynak, i, e)
            continue
        for k in sonuc.get("ipuclari", []) if isinstance(sonuc, dict) else []:
            if not isinstance(k, dict) or not all(isinstance(k.get(a), str) for a in ("ders", "konu", "ipucu", "alinti")):
                red.append({"kaynak": kaynak, "neden": "sema", "kayit": k})
            elif not alinti_dogru(k["alinti"], parca):
                red.append({"kaynak": kaynak, "neden": "alinti-kaynakta-yok", "kayit": k})
            else:
                kabul.append({"kaynak": kaynak, "duzey": duzey, "parca": i, "model": model, **k,
                              "etiket": "kaynakli-ikincil"})
    return kabul, red


def yaz(yol, kayitlar):
    yol.parent.mkdir(parents=True, exist_ok=True)
    with yol.open("w", encoding="utf-8") as f:
        for k in kayitlar:
            f.write(json.dumps(k, ensure_ascii=False) + "\n")


def main():
    model = sys.argv[1] if len(sys.argv) > 1 else "gemma3:4b"
    sistem = "ays"
    kaynaklar = json.loads((KOK / "veri" / "KAYNAKLAR.json").read_text(encoding="utf-8"))["kaynaklar"]
    tablo_hepsi, ipucu_hepsi, red_hepsi = [], [], []
    for k in kaynaklar:
        if k["sistem"].lower() != sistem:
            continue
        yol = HAM / (k["id"] + ".txt")
        if not yol.exists():
            print("ham yok, atlandi:", k["id"])
            continue
        metin = yol.read_text(encoding="utf-8")
        tablo = parse_tablolar(metin, k["id"], k["duzey"])
        print(time.strftime("%H:%M:%S"), k["id"], "tablo satiri:", len(tablo), flush=True)
        tablo_hepsi += tablo
        kabul, red = ipuclari(metin, k["id"], model, k["duzey"], log=lambda *a: print(*a, flush=True))
        print(time.strftime("%H:%M:%S"), k["id"], "ipucu kabul:", len(kabul), "red:", len(red), flush=True)
        ipucu_hepsi += kabul
        red_hepsi += red
        yaz(TEMIZ / sistem / "konu_dagilimi.jsonl", tablo_hepsi)
        yaz(TEMIZ / sistem / "ipuclari.jsonl", ipucu_hepsi)
        yaz(TEMIZ / sistem / "reddedilen.jsonl", red_hepsi)


if __name__ == "__main__":
    main()
