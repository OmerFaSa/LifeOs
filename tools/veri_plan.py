#!/usr/bin/env python3
"""veri/plan/*.txt -> veri/konu_plani.txt, veri/gezgin_metni_tam.txt, veri/plan/konular.json. Yalniz standart kutuphane.
Modeli ya da interneti CALISTIRMAZ; yalniz dosyalari birlestirir ve sayar.

    python tools/veri_plan.py            # uret ve say
    python tools/veri_plan.py --denetle  # uretilenler guncel mi (CI icin)
"""
import json, re, sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
PLAN = KOK / "veri" / "plan"
NL = chr(10)
SATIR = re.compile(r"^\[(\d+\.[A-Z]\.\d+)\]\s+(.+?)\s+\|\s+([A-ZÇĞİÖŞÜ ]+)$")
SISTEM = {"1": "AYS", "2": "SPI", "3": "ESP", "4": "ESP"}
KODLAR = ("KODLAR (her satırın sonundaki harfler, o başlıkta NE aranacağını söyler):" + NL +
          "T=tanım  K=kural  F=formül (aynen kopyala)  A=adım/yapılış  Ö=örnek  İ=istisna  H=sık yapılan hata" + NL +
          "S=sayı/tarih/yıl  N=neden-sonuç  Y=yöntem/öneri  B=biyografi/kişi  G=görev/işleyiş  V=sıra/aşama/evre" + NL +
          "E=eser/kavram  R=resmî eşik/öneri (kurum adıyla, birimiyle)" + NL)
KULLANIM = ("KONU PLANI NASIL KULLANILIR" + NL +
            "Aşağıda konu başlıkları hiyerarşik satırlardır: [no] Ders > Konu > Alt başlık | kodlar." + NL +
            "Bir sayfa okurken önce sayfanın HANGİ satırla ilgili olduğuna bak; yalnızca o satırın kodlarındaki bilgi türlerini çıkar." + NL +
            "Satırda yazması bilginin sayfada olduğu anlamına gelmez: sayfada yoksa çıkarma. Plan bir ARAMA LİSTESİdir, bilgi kaynağı değil." + NL +
            "Her çıkarılan olguya 'baslik' olarak satırın alt başlığını (ya da en yakın ifadesini) yaz." + NL)


def dosyalar():
    return sorted(PLAN.glob("[0-9]-*.txt"))


def uret():
    parcalar = [d.read_text(encoding="utf-8").strip() for d in dosyalar()]
    plan = KULLANIM + NL + KODLAR + NL + (NL * 2).join(parcalar) + NL
    tam = (KOK / "veri" / "gezgin_metni.txt").read_text(encoding="utf-8").rstrip() + NL * 3 + plan
    kayit = []
    for d in dosyalar():
        for s in d.read_text(encoding="utf-8").splitlines():
            m = SATIR.match(s.strip())
            if m:
                no, yol, kodlar = m.groups()
                kayit.append({"no": no, "sistem": SISTEM[no.split(".")[0]], "yol": [p.strip() for p in yol.split(">")],
                              "kodlar": kodlar.split()})
    return plan, tam, kayit


def main():
    plan, tam, kayit = uret()
    hedefler = {"konu_plani.txt": plan, "gezgin_metni_tam.txt": tam}
    json_metin = json.dumps(kayit, ensure_ascii=False, indent=0)
    if "--denetle" in sys.argv:
        eski = all((KOK / "veri" / a).exists() and (KOK / "veri" / a).read_text(encoding="utf-8") == m for a, m in hedefler.items())
        eski = eski and (PLAN / "konular.json").exists() and (PLAN / "konular.json").read_text(encoding="utf-8") == json_metin
        print("guncel" if eski else "ESKI: python tools/veri_plan.py")
        sys.exit(0 if eski else 1)
    for a, m in hedefler.items():
        (KOK / "veri" / a).write_text(m, encoding="utf-8")
    (PLAN / "konular.json").write_text(json_metin, encoding="utf-8")
    satir_sayisi = sum(1 for d in dosyalar() for s in d.read_text(encoding="utf-8").splitlines() if s.strip())
    print("plan satiri:", satir_sayisi, "| ayristirilan baslik:", len(kayit))
    for sis in ("AYS", "SPI", "ESP"):
        print("  ", sis, sum(1 for k in kayit if k["sistem"] == sis), "baslik")
    print("konu_plani.txt:", len(plan), "karakter, ~%d token" % (len(plan) // 3))
    print("gezgin_metni_tam.txt:", len(tam), "karakter, ~%d token" % (len(tam) // 3), "| toplam satir:", len(tam.splitlines()))
    ayrilamayan = [s for d in dosyalar() for s in d.read_text(encoding="utf-8").splitlines() if s.startswith("[") and not SATIR.match(s.strip())]
    if ayrilamayan:
        print("AYRISTIRILAMAYAN SATIR:", len(ayrilamayan))
        for s in ayrilamayan[:8]:
            print("   ", s[:110])


if __name__ == "__main__":
    main()
