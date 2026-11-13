"""Sistem · Anlaşılabilirlik (plan §6): bir işe kaç adımda varılıyor, iç içelik.

Değer: sistem haritasındaki yer başına ortalama adım. Kabuk adımı kabuğun kendi kuralından gelir
(kabuk/harita.js halkaAdimi: halkada 1, dal sayfası ya da sistem haritası halkadaysa 2). Yer henüz
eski modüldeyse (durum «eski») o modülün iç içe katları eklenir (olcum.py ic_icelik: çekmece › disiplin ›
sekme › açılır araç); bu bir üst sınırdır, tıklama sayımı değil.
"""
import json
import re
import subprocess
from pathlib import Path

AD = "Sistem · Anlaşılabilirlik"
TANIM = "bir işe kaç adımda varılıyor, iç içelik"
JS = ("const H=require(process.argv[1]);console.log(JSON.stringify(H.YERLER.map(y=>"
      "({id:y.id,durum:y.durum,eski:y.eski||null,adim:H.halkaAdimi(y.id)}))))")


def olc(kok):
    import olcum  # ic_icelik sayımı tek yerde kalsın (kural 3)
    harita = Path(kok) / "kabuk/harita.js"
    yok = {"deger": None, "birim": "adım (yer başına ortalama)", "etiket": "veri yok", "durum": "ölçülmedi",
           "komut": "python kalite/olcum.py (node ile kabuk/harita.js okunur)"}
    if not harita.is_file():
        return dict(yok, ayrinti={"gereken": "kabuk/harita.js"})
    r = subprocess.run(["node", "-e", JS, str(harita.resolve())], capture_output=True, timeout=60)
    yerler = json.loads(r.stdout.decode("utf-8"))
    kat = olcum.ic_icelik(Path(kok))[0]["ayrinti"]
    adim, ulasilmayan = {}, []
    for y in yerler:
        if not isinstance(y["adim"], int):  # JSON'da Infinity null olur: halkadan ulaşılmıyor
            ulasilmayan.append(y["id"])
            continue
        modul = re.search(r"\.\./(\w+)/", y["eski"] or "") if y["durum"] == "eski" else None
        adim[y["id"]] = y["adim"] + (kat.get(modul.group(1), 0) if modul else 0)
    if not adim:
        return dict(yok, ayrinti={"ulasilmayan": ulasilmayan})
    kabuk = [y["adim"] for y in yerler if isinstance(y["adim"], int)]
    return dict(yok, deger=round(sum(adim.values()) / len(adim), 2), etiket="hesaplandı", durum="ölçüldü", ayrinti={
        "yer": len(yerler), "kabuk_ortalama": round(sum(kabuk) / len(kabuk), 2), "kabuk_en_cok": max(kabuk),
        "en_cok": max(adim.values()), "eski_yer": sum(1 for y in yerler if y["durum"] == "eski"),
        "eski_modul_kat": kat, "ulasilmayan": ulasilmayan, "yer_adimi": dict(sorted(adim.items())),
        "komut_cubugu": "her yer 1 adım (kural; kabuk/kabuk.test.js sınar, bu araç saymaz)",
        "sinir": "kabuk adımı kuraldan hesaplanır, tarayıcıda tıklanmaz; eski modül katı en derin yolun üst sınırıdır"})
