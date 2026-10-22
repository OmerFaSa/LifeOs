#!/usr/bin/env python3
"""KONULAR.json icindeki 745 basligin tamamini resmi Vikipedi REST API'sinden ceker.
Her kayit:
- 'extract' (resmi ansiklopedik tanim)
- 'alinti' (extract ile ayni, birebir dogrulanmis)
- 'kaynak' (sayfa URL'si)
- 'lisans' ('CC BY-SA 4.0 (Vikipedi)')
- 'etiket' ('kaynakli-ikincil' - LifeOS doktrini)
- 'duzey' ('ikincil')
- 'alinma' (tarih)
"""
import json
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
VERI = KOK / "veri"
TEMIZ = VERI / "temiz"
KONULAR_JSON = VERI / "KONULAR.json"

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) LifeOS-Veri/2.0 (arastirma-egitim; tr.wikipedia.org)"}

def ara_ve_ozet_al(baslik, en_mi=False):
    dil = "en" if en_mi else "tr"
    temiz_baslik = baslik[3:] if baslik.startswith("en:") else baslik
    safe_title = urllib.parse.quote(temiz_baslik.replace(" ", "_"))
    
    url = f"https://{dil}.wikipedia.org/api/rest_v1/page/summary/{safe_title}"
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            extract = data.get("extract", "").strip()
            page_url = data.get("content_urls", {}).get("desktop", {}).get("page", f"https://{dil}.wikipedia.org/wiki/{safe_title}")
            desc = data.get("description", "")
            if extract and len(extract) >= 30:
                return {
                    "baslik": data.get("title", temiz_baslik),
                    "aciklama": desc,
                    "olgu": extract,
                    "alinti": extract,
                    "url": page_url,
                    "dil": dil
                }
    except urllib.error.HTTPError as e:
        if e.code != 404:
            pass
    except Exception:
        pass

    # Eger tr'de bulunamadiysa veya bos geldiyse ve en_mi degilse, OpenSearch API ile ara
    if not en_mi:
        try:
            search_url = f"https://tr.wikipedia.org/w/api.php?action=opensearch&search={urllib.parse.quote(temiz_baslik)}&limit=1&namespace=0&format=json"
            req = urllib.request.Request(search_url, headers=UA)
            with urllib.request.urlopen(req, timeout=8) as resp:
                sdata = json.loads(resp.read().decode("utf-8"))
                if len(sdata) >= 2 and sdata[1]:
                    bulunan = sdata[1][0]
                    return ara_ve_ozet_al(bulunan, en_mi=False)
        except Exception:
            pass
            
        # Son care İngilizce Wikipedia'da dene
        return ara_ve_ozet_al(temiz_baslik, en_mi=True)

    return None

def main():
    print("=" * 70)
    print("LifeOS Ansiklopedik Bilgi Derleyici (745 Konu Başlığı)")
    print("=" * 70)

    data = json.loads(KONULAR_JSON.read_text(encoding="utf-8"))
    kategoriler = data.get("kategoriler", [])
    
    ays_kayitlar = []
    spi_kayitlar = []
    esp_kayitlar = []
    
    tarih = time.strftime("%Y-%m-%d")
    toplam = sum(len(c["basliklar"]) for c in kategoriler)
    islenen = 0
    basarili = 0

    for kat in kategoriler:
        sistem = kat["sistem"]
        kategori_adi = kat["kategori"]
        basliklar = kat["basliklar"]
        print(f"\n[{sistem}] {kategori_adi} ({len(basliklar)} baslik) isleniyor...")

        for b in basliklar:
            islenen += 1
            en_mi = b.startswith("en:")
            res = ara_ve_ozet_al(b, en_mi=en_mi)
            if res:
                basarili += 1
                kayit = {
                    "sistem": sistem,
                    "kategori": kategori_adi,
                    "konu": b,
                    "baslik": res["baslik"],
                    "aciklama": res["aciklama"],
                    "olgu": res["olgu"],
                    "alinti": res["alinti"],
                    "dil": res["dil"],
                    "kaynak": res["url"],
                    "lisans": "CC BY-SA 4.0 (Vikipedi)",
                    "duzey": "ikincil",
                    "alinma": tarih,
                    "etiket": "kaynakli-ikincil"
                }
                if sistem == "AYS":
                    ays_kayitlar.append(kayit)
                elif sistem == "SPI":
                    spi_kayitlar.append(kayit)
                elif sistem == "ESP":
                    esp_kayitlar.append(kayit)
            else:
                pass
            
            # Kibar gecis (rate limit onleme)
            time.sleep(0.08)

            if islenen % 50 == 0 or islenen == toplam:
                print(f"  -> Durum: {islenen}/{toplam} konu tarandi ({basarili} basarili olgu cikarildi)")

    # JSONL kayit
    ays_path = TEMIZ / "ays" / "ansiklopedi_yks.jsonl"
    with open(ays_path, "w", encoding="utf-8") as f:
        for r in ays_kayitlar:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    spi_path = TEMIZ / "spi" / "ansiklopedi_saglik.jsonl"
    with open(spi_path, "w", encoding="utf-8") as f:
        for r in spi_kayitlar:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    esp_path = TEMIZ / "esp" / "ansiklopedi_genel.jsonl"
    with open(esp_path, "w", encoding="utf-8") as f:
        for r in esp_kayitlar:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    print("\n" + "=" * 70)
    print("TAMAMLANDI:")
    print(f"  AYS Ansiklopedi: {len(ays_kayitlar)} olgu ({ays_path.stat().st_size / 1024:.1f} KB)")
    print(f"  SPİ Ansiklopedi: {len(spi_kayitlar)} olgu ({spi_path.stat().st_size / 1024:.1f} KB)")
    print(f"  ESP Ansiklopedi: {len(esp_kayitlar)} olgu ({esp_path.stat().st_size / 1024:.1f} KB)")
    print(f"  TOPLAM: {len(ays_kayitlar) + len(spi_kayitlar) + len(esp_kayitlar)} / {toplam} basarili kayit.")
    print("=" * 70)

if __name__ == "__main__":
    main()
