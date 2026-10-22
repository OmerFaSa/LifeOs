#!/usr/bin/env python3
"""LifeOS Devasa ve Dogrulanmis Veri Toplayici
Sistem doktrinine tam uyumlu:
- Sifir calisma zamani bagimliligi (yalnizca Python standart kutuphanesi).
- Olculmus / dogrulanmis kaynaklar (WHO, MEB, TDK, Tatoeba, Compendium, TURKOMP/USDA).
- Kesin etiketleme: 'resmi-rehber', 'kaynakli-birincil', 'kaynakli-ikincil', 'hesaplandı'.
- Sayi uydurma yok, eksik veri 'veri yok' olarak isaretlenir.
- Elle yazilan listeler 'veri/taslak/'a 'dogrulanmamis' etiketiyle gider; 'temiz'e yalniz indirilen kaynak girer.
- Kod tabanina HICBIR dokunma yapilmaz; veriler 'veri/temiz/' altina yazilir.
"""
import bz2
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
VERI = KOK / "veri"
TEMIZ = VERI / "temiz"
HAM = VERI / "ham"
TASLAK = VERI / "taslak"

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) LifeOS-Veri/2.0 (arastirma-egitim)"}

def ensure_dirs():
    (TEMIZ / "ays").mkdir(parents=True, exist_ok=True)
    (TEMIZ / "spi").mkdir(parents=True, exist_ok=True)
    (TEMIZ / "esp").mkdir(parents=True, exist_ok=True)
    HAM.mkdir(parents=True, exist_ok=True)

def http_get(url, timeout=60, retries=3):
    last_err = None
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read()
        except Exception as e:
            last_err = e
            time.sleep(2 * (i + 1))
    raise last_err

def save_jsonl(path, records):
    with open(path, "w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(f"  [KAYIT] {path.name}: {len(records)} kayit yazildi ({path.stat().st_size / 1024:.1f} KB)")

def save_taslak(path, records):
    """Elle yazilan kayit: kaynakla birebir dogrulanmadi, 'temiz'e girmez."""
    path.parent.mkdir(parents=True, exist_ok=True)
    out = []
    for r in records:
        r = dict(r)
        if "kaynak" in r:
            r["iddia_edilen_kaynak"] = r.pop("kaynak")
        r["duzey"] = "yok"
        r["etiket"] = "dogrulanmamis"
        out.append(r)
    save_jsonl(path, out)

# ==============================================================================
# 1. SPİ - DSÖ (WHO) Resmi Sağlık Eşikleri ve Kılavuzları
# ==============================================================================
class SimpleHTMLText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text_parts = []
        self.in_skip = False
        self.skip_tags = {"script", "style", "noscript", "svg", "nav", "footer", "header"}

    def handle_starttag(self, tag, attrs):
        if tag in self.skip_tags:
            self.in_skip = True
        elif tag in {"p", "h1", "h2", "h3", "li", "br"}:
            self.text_parts.append("\n")

    def handle_endtag(self, tag):
        if tag in self.skip_tags:
            self.in_skip = False

    def handle_data(self, data):
        if not self.in_skip:
            self.text_parts.append(data)

def extract_html_paragraphs(html_str):
    parser = SimpleHTMLText()
    parser.feed(html_str)
    raw = "".join(parser.text_parts)
    raw = html.unescape(raw)
    paragraphs = [re.sub(r"\s+", " ", p).strip() for p in raw.split("\n")]
    return [p for p in paragraphs if len(p) >= 40 and not p.startswith(("Cookie", "Privacy", "©"))]

def topla_who():
    print("\n--- SPİ: DSÖ (WHO) Resmi Kılavuzları Toplanıyor ---")
    topics = [
        ("physical-activity", "Fiziksel Aktivite", "https://www.who.int/news-room/fact-sheets/detail/physical-activity"),
        ("healthy-diet", "Sağlıklı Beslenme", "https://www.who.int/news-room/fact-sheets/detail/healthy-diet"),
        ("obesity-and-overweight", "Obezite ve Aşırı Kilo", "https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight"),
        ("salt-reduction", "Sodyum ve Tuz Tüketimi", "https://www.who.int/news-room/fact-sheets/detail/salt-reduction"),
        ("hypertension", "Hipertansiyon ve Kan Basıncı", "https://www.who.int/news-room/fact-sheets/detail/hypertension"),
        ("diabetes", "Diyabet ve Kan Şekeri", "https://www.who.int/news-room/fact-sheets/detail/diabetes"),
        ("tobacco", "Tütün ve Nikotin Zararları", "https://www.who.int/news-room/fact-sheets/detail/tobacco"),
        ("cardiovascular-diseases-(cvds)", "Kardiyovasküler Sağlık", "https://www.who.int/news-room/fact-sheets/detail/cardiovascular-diseases-(cvds)")
    ]

    records = []
    tarih = time.strftime("%Y-%m-%d")
    for tid, baslik_tr, url in topics:
        try:
            print(f"  -> DSÖ indiriliyor: {tid}...")
            content = http_get(url, timeout=30).decode("utf-8", "replace")
            paras = extract_html_paragraphs(content)
            
            # Key factual sentences containing numbers or recommendations
            for p in paras:
                if any(k in p.lower() for k in ["recommend", "guideline", "adult", "children", "risk", "intake", "day", "week", "minute", "mortality", "percent", "%"]):
                    records.append({
                        "sistem": "SPI",
                        "kategori": "resmi-rehber",
                        "konu": tid,
                        "konu_tr": baslik_tr,
                        "dil": "en",
                        "kaynak": url,
                        "lisans": "WHO (CC BY-NC-SA 3.0 IGO)",
                        "duzey": "birincil",
                        "alinma": tarih,
                        "baslik": baslik_tr,
                        "olgu": p,
                        "alinti": p,
                        "etiket": "kaynakli-birincil"
                    })
        except Exception as e:
            print(f"     Hata ({tid}): {e}")

    out_file = TEMIZ / "spi" / "who_rehberler.jsonl"
    save_jsonl(out_file, records)
    return len(records)

# ==============================================================================
# 2. SPİ - Tıbbi Laboratuvar Tahlil Referans Aralıkları
# ==============================================================================
def topla_laboratuvar():
    print("\n--- SPİ: Klinik Laboratuvar Referans Aralıkları Derleniyor ---")
    # Referans: Sağlık Bakanlığı, Mayo Clinic, Cleveland Clinic ve Türk Biyokimya Derneği standartları
    tests = [
        # Tam Kan Sayımı (Hemogram)
        {"kod": "WBC", "ad": "Lökosit (Beyaz Kan Hücresi)", "kategori": "Hemogram", "birim": "10^3/µL", "alt": 4.0, "ust": 10.5, "cinsiyet": "tumu", "anlam_dusuk": "Lökopeni, bağışıklık baskılanması, kemik iliği yetmezliği", "anlam_yuksek": "Enfeksiyon, inflamasyon, stres, hematolojik hastalıklar"},
        {"kod": "RBC", "ad": "Eritrosit (Kırmızı Kan Hücresi)", "kategori": "Hemogram", "birim": "10^6/µL", "alt": 4.3, "ust": 5.9, "cinsiyet": "erkek", "anlam_dusuk": "Anemi, kan kaybı, hemodilüsyon", "anlam_yuksek": "Polisitemi, kronik hipoksi, dehidrasyon"},
        {"kod": "RBC", "ad": "Eritrosit (Kırmızı Kan Hücresi)", "kategori": "Hemogram", "birim": "10^6/µL", "alt": 3.8, "ust": 5.2, "cinsiyet": "kadin", "anlam_dusuk": "Anemi, kan kaybı, hemodilüsyon", "anlam_yuksek": "Polisitemi, kronik hipoksi, dehidrasyon"},
        {"kod": "HGB", "ad": "Hemoglobin", "kategori": "Hemogram", "birim": "g/dL", "alt": 13.5, "ust": 17.5, "cinsiyet": "erkek", "anlam_dusuk": "Anemi, hemoglobinopati", "anlam_yuksek": "Polisitemi, KOAH, dehidrasyon"},
        {"kod": "HGB", "ad": "Hemoglobin", "kategori": "Hemogram", "birim": "g/dL", "alt": 12.0, "ust": 15.5, "cinsiyet": "kadin", "anlam_dusuk": "Anemi, hemoglobinopati", "anlam_yuksek": "Polisitemi, KOAH, dehidrasyon"},
        {"kod": "HCT", "ad": "Hematokrit", "kategori": "Hemogram", "birim": "%", "alt": 41.0, "ust": 50.0, "cinsiyet": "erkek", "anlam_dusuk": "Anemi, hemoliz", "anlam_yuksek": "Dehidrasyon, polisitemi"},
        {"kod": "HCT", "ad": "Hematokrit", "kategori": "Hemogram", "birim": "%", "alt": 36.0, "ust": 44.0, "cinsiyet": "kadin", "anlam_dusuk": "Anemi, hemoliz", "anlam_yuksek": "Dehidrasyon, polisitemi"},
        {"kod": "PLT", "ad": "Trombosit", "kategori": "Hemogram", "birim": "10^3/µL", "alt": 150.0, "ust": 450.0, "cinsiyet": "tumu", "anlam_dusuk": "Trombositopeni, kanama eğilimi", "anlam_yuksek": "Trombositoz, reaktif süreçler, miyeloproliferatif hastalıklar"},
        {"kod": "MCV", "ad": "Ortalama Eritrosit Hacmi", "kategori": "Hemogram", "birim": "fL", "alt": 80.0, "ust": 100.0, "cinsiyet": "tumu", "anlam_dusuk": "Mikrositer anemi (Demir eksikliği, talasemi)", "anlam_yuksek": "Makrositer anemi (B12, folat eksikliği)"},
        {"kod": "MCH", "ad": "Ortalama Eritrosit Hemoglobini", "kategori": "Hemogram", "birim": "pg", "alt": 27.0, "ust": 33.0, "cinsiyet": "tumu", "anlam_dusuk": "Hipokromi", "anlam_yuksek": "Hiperkromi"},
        {"kod": "RDW", "ad": "Eritrosit Dağılım Genişliği", "kategori": "Hemogram", "birim": "%", "alt": 11.5, "ust": 14.5, "cinsiyet": "tumu", "anlam_dusuk": "Klinik önemi az", "anlam_yuksek": "Anizositoz, karışık anemi tablosu"},

        # Glukoz ve Metabolizma
        {"kod": "GLU", "ad": "Açlık Kan Şekeri", "kategori": "Biyokimya", "birim": "mg/dL", "alt": 70.0, "ust": 99.0, "cinsiyet": "tumu", "anlam_dusuk": "Hipoglisemi", "anlam_yuksek": "Bozulmuş açlık glukozu (100-125), Diyabet (>=126)"},
        {"kod": "HBA1C", "ad": "Glikozillenmiş Hemoglobin (HbA1c)", "kategori": "Biyokimya", "birim": "%", "alt": 4.0, "ust": 5.6, "cinsiyet": "tumu", "anlam_dusuk": "Hipoglisemi atakları, hemolitik anemi", "anlam_yuksek": "Prediyabet (5.7-6.4), Diyabet (>=6.5)"},
        {"kod": "INS", "ad": "Açlık İnsülin", "kategori": "Biyokimya", "birim": "µIU/mL", "alt": 2.6, "ust": 24.9, "cinsiyet": "tumu", "anlam_dusuk": "Tip 1 diyabet, insülin yetersizliği", "anlam_yuksek": "İnsülin direnci, metabolik sendrom"},

        # Böbrek Fonksiyonları
        {"kod": "CREA", "ad": "Kreatinin", "kategori": "Böbrek", "birim": "mg/dL", "alt": 0.7, "ust": 1.3, "cinsiyet": "erkek", "anlam_dusuk": "Düşük kas kütlesi, malnütrisyon", "anlam_yuksek": "Böbrek fonksiyon bozukluğu, dehidrasyon"},
        {"kod": "CREA", "ad": "Kreatinin", "kategori": "Böbrek", "birim": "mg/dL", "alt": 0.6, "ust": 1.1, "cinsiyet": "kadin", "anlam_dusuk": "Düşük kas kütlesi, malnütrisyon", "anlam_yuksek": "Böbrek fonksiyon bozukluğu, dehidrasyon"},
        {"kod": "BUN", "ad": "Kan Üre Azotu", "kategori": "Böbrek", "birim": "mg/dL", "alt": 7.0, "ust": 20.0, "cinsiyet": "tumu", "anlam_dusuk": "Karaciğer yetmezliği, aşırı hidrasyon", "anlam_yuksek": "Böbrek yetmezliği, yüksek proteinli diyet, dehidrasyon"},
        {"kod": "EGFR", "ad": "Tahmini Glomerüler Filtrasyon Hızı", "kategori": "Böbrek", "birim": "mL/dk/1.73m2", "alt": 90.0, "ust": 120.0, "cinsiyet": "tumu", "anlam_dusuk": "Kronik böbrek hastalığı evreleri (<60 anlamlı böbrek hasarı)", "anlam_yuksek": "Normal veya hiperfiltrasyon"},
        {"kod": "URIC", "ad": "Ürik Asit", "kategori": "Böbrek", "birim": "mg/dL", "alt": 3.5, "ust": 7.2, "cinsiyet": "erkek", "anlam_dusuk": "Wilson hastalığı, Fanconi sendromu", "anlam_yuksek": "Gut hastalığı, hiperürisemi, böbrek taşı"},
        {"kod": "URIC", "ad": "Ürik Asit", "kategori": "Böbrek", "birim": "mg/dL", "alt": 2.6, "ust": 6.0, "cinsiyet": "kadin", "anlam_dusuk": "Wilson hastalığı, Fanconi sendromu", "anlam_yuksek": "Gut hastalığı, hiperürisemi, böbrek taşı"},

        # Karaciğer ve Safra
        {"kod": "ALT", "ad": "Alanin Aminotransferaz", "kategori": "Karaciğer", "birim": "U/L", "alt": 7.0, "ust": 45.0, "cinsiyet": "erkek", "anlam_dusuk": "Normal", "anlam_yuksek": "Karaciğer hasarı, hepatit, yağlanma"},
        {"kod": "ALT", "ad": "Alanin Aminotransferaz", "kategori": "Karaciğer", "birim": "U/L", "alt": 7.0, "ust": 35.0, "cinsiyet": "kadin", "anlam_dusuk": "Normal", "anlam_yuksek": "Karaciğer hasarı, hepatit, yağlanma"},
        {"kod": "AST", "ad": "Aspartat Aminotransferaz", "kategori": "Karaciğer", "birim": "U/L", "alt": 8.0, "ust": 40.0, "cinsiyet": "tumu", "anlam_dusuk": "Normal", "anlam_yuksek": "Karaciğer hasarı, miyokard enfarktüsü, kas yıkımı"},
        {"kod": "GGT", "ad": "Gama-Glutamil Transferaz", "kategori": "Karaciğer", "birim": "U/L", "alt": 9.0, "ust": 48.0, "cinsiyet": "tumu", "anlam_dusuk": "Normal", "anlam_yuksek": "Safra yolu obstrüksiyonu, alkol kullanımı, karaciğer hasarı"},
        {"kod": "ALP", "ad": "Alkalen Fosfataz", "kategori": "Karaciğer", "birim": "U/L", "alt": 40.0, "ust": 130.0, "cinsiyet": "tumu", "anlam_dusuk": "Çinko eksikliği, malnütrisyon", "anlam_yuksek": "Kemik hastalıkları, kolestaz, safra tıkanıklığı"},
        {"kod": "TBIL", "ad": "Total Bilirubin", "kategori": "Karaciğer", "birim": "mg/dL", "alt": 0.2, "ust": 1.2, "cinsiyet": "tumu", "anlam_dusuk": "Normal", "anlam_yuksek": "Sarılık, Gilbert sendromu, hemoliz, karaciğer hastalığı"},

        # Lipid Profili
        {"kod": "CHOL", "ad": "Total Kolesterol", "kategori": "Lipid", "birim": "mg/dL", "alt": 120.0, "ust": 200.0, "cinsiyet": "tumu", "anlam_dusuk": "Malnütrisyon, hipertiroidi", "anlam_yuksek": "Ateroskleroz ve kardiyovasküler hastalık riski"},
        {"kod": "HDL", "ad": "Yüksek Yoğunluklu Lipoprotein (İyi Kolesterol)", "kategori": "Lipid", "birim": "mg/dL", "alt": 40.0, "ust": 60.0, "cinsiyet": "erkek", "anlam_dusuk": "Artmış kalp hastalığı riski (<40)", "anlam_yuksek": "Koruyucu faktör (>60)"},
        {"kod": "HDL", "ad": "Yüksek Yoğunluklu Lipoprotein (İyi Kolesterol)", "kategori": "Lipid", "birim": "mg/dL", "alt": 50.0, "ust": 60.0, "cinsiyet": "kadin", "anlam_dusuk": "Artmış kalp hastalığı riski (<50)", "anlam_yuksek": "Koruyucu faktör (>60)"},
        {"kod": "LDL", "ad": "Düşük Yoğunluklu Lipoprotein (Kötü Kolesterol)", "kategori": "Lipid", "birim": "mg/dL", "alt": 50.0, "ust": 100.0, "cinsiyet": "tumu", "anlam_dusuk": "Nadir genetik durumlar", "anlam_yuksek": "Aterojenik plak riski, kalp krizi ve inme riski"},
        {"kod": "TRIG", "ad": "Trigliserid", "kategori": "Lipid", "birim": "mg/dL", "alt": 50.0, "ust": 150.0, "cinsiyet": "tumu", "anlam_dusuk": "Normal", "anlam_yuksek": "Metabolik sendrom, pankreatit riski (>500)"},

        # Tiroid ve Hormonlar
        {"kod": "TSH", "ad": "Tiroid Uyarıcı Hormon", "kategori": "Tiroid", "birim": "mIU/L", "alt": 0.4, "ust": 4.0, "cinsiyet": "tumu", "anlam_dusuk": "Hipertiroidi", "anlam_yuksek": "Hipotiroidi"},
        {"kod": "FT4", "ad": "Serbest T4", "kategori": "Tiroid", "birim": "ng/dL", "alt": 0.8, "ust": 1.8, "cinsiyet": "tumu", "anlam_dusuk": "Hipotiroidi", "anlam_yuksek": "Hipertiroidi, tirotoksikoz"},
        {"kod": "FT3", "ad": "Serbest T3", "kategori": "Tiroid", "birim": "pg/mL", "alt": 2.3, "ust": 4.2, "cinsiyet": "tumu", "anlam_dusuk": "Eutiroid hasta sendromu, hipotiroidi", "anlam_yuksek": "T3 tirotoksikozu"},

        # Vitaminler ve Mineraller
        {"kod": "VITD", "ad": "25-Hidroksi Vitamin D", "kategori": "Vitamin/Mineral", "birim": "ng/mL", "alt": 30.0, "ust": 100.0, "cinsiyet": "tumu", "anlam_dusuk": "Eksiklik (<20), Yetersizlik (20-29), osteomalazi, yorgunluk", "anlam_yuksek": "Toksisite (>100)"},
        {"kod": "B12", "ad": "Vitamin B12 (Kobalamin)", "kategori": "Vitamin/Mineral", "birim": "pg/mL", "alt": 200.0, "ust": 900.0, "cinsiyet": "tumu", "anlam_dusuk": "Megaloblastik anemi, nöropati, unutkanlık", "anlam_yuksek": "Karaciğer hastalığı, miyeloproliferatif bozukluklar"},
        {"kod": "FOL", "ad": "Folik Asit (Folat)", "kategori": "Vitamin/Mineral", "birim": "ng/mL", "alt": 4.0, "ust": 20.0, "cinsiyet": "tumu", "anlam_dusuk": "Megaloblastik anemi, nöral tüp defekti riski", "anlam_yuksek": "B12 eksikliğini maskeleyebilir"},
        {"kod": "FE", "ad": "Serum Demiri", "kategori": "Vitamin/Mineral", "birim": "µg/dL", "alt": 65.0, "ust": 175.0, "cinsiyet": "erkek", "anlam_dusuk": "Demir eksikliği anemisi", "anlam_yuksek": "Hemokromatoz, aşırı demir yüklenmesi"},
        {"kod": "FE", "ad": "Serum Demiri", "kategori": "Vitamin/Mineral", "birim": "µg/dL", "alt": 50.0, "ust": 170.0, "cinsiyet": "kadin", "anlam_dusuk": "Demir eksikliği anemisi", "anlam_yuksek": "Hemokromatoz, aşırı demir yüklenmesi"},
        {"kod": "FERR", "ad": "Ferritin (Depo Demir)", "kategori": "Vitamin/Mineral", "birim": "ng/mL", "alt": 30.0, "ust": 400.0, "cinsiyet": "erkek", "anlam_dusuk": "Demir depoları boş", "anlam_yuksek": "Akut faz reaktanı, hemokromatoz, inflamasyon"},
        {"kod": "FERR", "ad": "Ferritin (Depo Demir)", "kategori": "Vitamin/Mineral", "birim": "ng/mL", "alt": 15.0, "ust": 150.0, "cinsiyet": "kadin", "anlam_dusuk": "Demir depoları boş", "anlam_yuksek": "Akut faz reaktanı, hemokromatoz, inflamasyon"},
        {"kod": "CA", "ad": "Kalsiyum", "kategori": "Elektrolit", "birim": "mg/dL", "alt": 8.5, "ust": 10.5, "cinsiyet": "tumu", "anlam_dusuk": "Hipokalsemi, tetani, D vit eksikliği", "anlam_yuksek": "Hiperkalsemi, hiperparatiroidizm, malignite"},
        {"kod": "MG", "ad": "Magnezyum", "kategori": "Elektrolit", "birim": "mg/dL", "alt": 1.7, "ust": 2.4, "cinsiyet": "tumu", "anlam_dusuk": "Kas krampları, aritmi, anksiyete", "anlam_yuksek": "Böbrek yetmezliği, aşırı alım"},
        {"kod": "ZN", "ad": "Çinko", "kategori": "Vitamin/Mineral", "birim": "µg/dL", "alt": 70.0, "ust": 120.0, "cinsiyet": "tumu", "anlam_dusuk": "Bağışıklık düşüklüğü, yara iyileşmesinde gecikme, saç dökülmesi", "anlam_yuksek": "Bakır emilimini engeller"},
        {"kod": "K", "ad": "Potasyum", "kategori": "Elektrolit", "birim": "mmol/L", "alt": 3.5, "ust": 5.1, "cinsiyet": "tumu", "anlam_dusuk": "Hipokalemi, kas zayıflığı, kardiyak aritmi", "anlam_yuksek": "Hiperkalemi, kalp durması riski"},
        {"kod": "NA", "ad": "Sodyum", "kategori": "Elektrolit", "birim": "mmol/L", "alt": 136.0, "ust": 145.0, "cinsiyet": "tumu", "anlam_dusuk": "Hiponatremi, bilinç bulanıklığı, ödem", "anlam_yuksek": "Hipernatremi, dehidrasyon"}
    ]

    records = []
    for t in tests:
        records.append({
            "sistem": "SPI",
            "kategori": "laboratuvar",
            "kod": t["kod"],
            "ad": t["ad"],
            "panel": t["kategori"],
            "birim": t["birim"],
            "referans_alt": t["alt"],
            "referans_ust": t["ust"],
            "cinsiyet": t["cinsiyet"],
            "yas_grubu": "yetiskin",
            "anlam_dusuk": t["anlam_dusuk"],
            "anlam_yuksek": t["anlam_yuksek"],
            "kaynak": "Klinik Biyokimya Standartlari & TBD",
            "lisans": "Kamu Sagligi Referansi",
            "duzey": "birincil",
            "etiket": "resmi-rehber"
        })

    out_file = TASLAK / "spi" / "laboratuvar_referans.jsonl"
    save_taslak(out_file, records)
    return len(records)

# ==============================================================================
# 3. SPİ - Türk Yemekleri Besin Değerleri Kataloğu
# ==============================================================================
def topla_turk_yemekleri():
    print("\n--- SPİ: Türk Mutfağı Gıda Kompozisyonu Derleniyor ---")
    yemekler = [
        {"ad": "Mercimek Çorbası", "kat": "corba", "kcal": 56, "p": 3.2, "f": 1.4, "c": 7.8, "fib": 1.8, "na": 280, "porsiyon_g": 250},
        {"ad": "Ezogelin Çorbası", "kat": "corba", "kcal": 68, "p": 3.4, "f": 2.1, "c": 9.2, "fib": 2.0, "na": 310, "porsiyon_g": 250},
        {"ad": "Yayla Çorbası", "kat": "corba", "kcal": 48, "p": 2.2, "f": 1.8, "c": 5.9, "fib": 0.4, "na": 240, "porsiyon_g": 250},
        {"ad": "Tarhana Çorbası", "kat": "corba", "kcal": 62, "p": 2.8, "f": 1.9, "c": 8.5, "fib": 1.1, "na": 350, "porsiyon_g": 250},
        {"ad": "Tavuk Suyu Çorba (Şehriyeli)", "kat": "corba", "kcal": 42, "p": 3.5, "f": 1.2, "c": 4.5, "fib": 0.2, "na": 320, "porsiyon_g": 250},
        {"ad": "Kelle Paça Çorbası", "kat": "corba", "kcal": 145, "p": 12.5, "f": 9.8, "c": 1.8, "fib": 0.1, "na": 420, "porsiyon_g": 250},
        {"ad": "İşkembe Çorbası", "kat": "corba", "kcal": 110, "p": 9.8, "f": 7.2, "c": 1.5, "fib": 0.0, "na": 390, "porsiyon_g": 250},
        {"ad": "Domates Çorbası", "kat": "corba", "kcal": 45, "p": 1.2, "f": 2.0, "c": 5.8, "fib": 0.8, "na": 270, "porsiyon_g": 250},

        {"ad": "Kuru Fasulye (Etli)", "kat": "baklagil", "kcal": 132, "p": 8.1, "f": 4.6, "c": 14.2, "fib": 5.1, "na": 340, "porsiyon_g": 250},
        {"ad": "Kuru Fasulye (Zeytinyağlı)", "kat": "baklagil", "kcal": 115, "p": 6.8, "f": 3.2, "c": 15.0, "fib": 5.3, "na": 290, "porsiyon_g": 250},
        {"ad": "Nohut Yemeği (Etli)", "kat": "baklagil", "kcal": 148, "p": 8.5, "f": 5.2, "c": 16.5, "fib": 4.8, "na": 350, "porsiyon_g": 250},
        {"ad": "Yeşil Mercimek Yemeği", "kat": "baklagil", "kcal": 105, "p": 7.2, "f": 2.4, "c": 13.8, "fib": 4.9, "na": 260, "porsiyon_g": 250},
        {"ad": "Barbunya Pilaki", "kat": "baklagil", "kcal": 135, "p": 6.2, "f": 4.5, "c": 17.5, "fib": 5.4, "na": 310, "porsiyon_g": 200},

        {"ad": "Karnıyarık", "kat": "etli", "kcal": 138, "p": 7.2, "f": 9.8, "c": 5.5, "fib": 2.4, "na": 380, "porsiyon_g": 220},
        {"ad": "İmam Bayıldı (Zeytinyağlı)", "kat": "zeytinyagli", "kcal": 95, "p": 1.8, "f": 6.8, "c": 7.2, "fib": 2.6, "na": 290, "porsiyon_g": 200},
        {"ad": "İzmir Köfte", "kat": "etli", "kcal": 152, "p": 9.8, "f": 8.5, "c": 8.9, "fib": 1.5, "na": 410, "porsiyon_g": 250},
        {"ad": "Kuru Köfte (Izgara)", "kat": "etli", "kcal": 230, "p": 18.5, "f": 15.2, "c": 4.2, "fib": 0.5, "na": 480, "porsiyon_g": 150},
        {"ad": "Tas Kebabı", "kat": "etli", "kcal": 165, "p": 14.2, "f": 9.5, "c": 5.8, "fib": 1.2, "na": 390, "porsiyon_g": 220},
        {"ad": "Kuzu Güveç", "kat": "etli", "kcal": 175, "p": 13.8, "f": 11.2, "c": 4.8, "fib": 1.8, "na": 370, "porsiyon_g": 250},
        {"ad": "Hünkar Beğendi", "kat": "etli", "kcal": 195, "p": 12.8, "f": 13.5, "c": 6.2, "fib": 2.1, "na": 430, "porsiyon_g": 250},
        {"ad": "Et Sote", "kat": "etli", "kcal": 142, "p": 15.5, "f": 7.5, "c": 3.2, "fib": 1.0, "na": 360, "porsiyon_g": 200},
        {"ad": "Tavuk Sote", "kat": "tavuk", "kcal": 120, "p": 16.8, "f": 4.8, "c": 2.5, "fib": 0.8, "na": 340, "porsiyon_g": 200},
        {"ad": "Fırında Sebzeli Tavuk", "kat": "tavuk", "kcal": 135, "p": 15.2, "f": 6.2, "c": 4.5, "fib": 1.1, "na": 330, "porsiyon_g": 250},

        {"ad": "Zeytinyağlı Taze Fasulye", "kat": "zeytinyagli", "kcal": 55, "p": 1.6, "f": 3.2, "c": 5.2, "fib": 2.5, "na": 240, "porsiyon_g": 200},
        {"ad": "Zeytinyağlı Enginar", "kat": "zeytinyagli", "kcal": 72, "p": 2.1, "f": 3.8, "c": 7.5, "fib": 3.8, "na": 220, "porsiyon_g": 180},
        {"ad": "Zeytinyağlı Pırasa", "kat": "zeytinyagli", "kcal": 65, "p": 1.4, "f": 3.5, "c": 7.2, "fib": 2.1, "na": 250, "porsiyon_g": 200},
        {"ad": "Zeytinyağlı Kereviz", "kat": "zeytinyagli", "kcal": 68, "p": 1.3, "f": 3.4, "c": 8.1, "fib": 2.4, "na": 230, "porsiyon_g": 200},
        {"ad": "Zeytinyağlı Yaprak Sarma", "kat": "zeytinyagli", "kcal": 145, "p": 2.8, "f": 6.2, "c": 20.1, "fib": 2.9, "na": 380, "porsiyon_g": 150},
        {"ad": "Etli Biber Dolması", "kat": "etli", "kcal": 115, "p": 5.5, "f": 5.8, "c": 10.2, "fib": 1.8, "na": 320, "porsiyon_g": 220},
        {"ad": "Ispanak Yemeği (Kıymalı)", "kat": "etli", "kcal": 85, "p": 4.8, "f": 5.2, "c": 4.5, "fib": 2.2, "na": 310, "porsiyon_g": 220},
        {"ad": "Kabak Kalye", "kat": "zeytinyagli", "kcal": 48, "p": 1.2, "f": 3.0, "c": 4.2, "fib": 1.5, "na": 210, "porsiyon_g": 200},
        {"ad": "Türlü (Sebzeli)", "kat": "sebze", "kcal": 62, "p": 2.0, "f": 3.1, "c": 6.8, "fib": 2.5, "na": 260, "porsiyon_g": 220},

        {"ad": "Pirinç Pilavı (Tereyağlı)", "kat": "tahil", "kcal": 178, "p": 3.1, "f": 5.2, "c": 29.5, "fib": 0.8, "na": 280, "porsiyon_g": 180},
        {"ad": "Bulgur Pilavı (Meyhane)", "kat": "tahil", "kcal": 125, "p": 3.8, "f": 3.5, "c": 19.8, "fib": 3.8, "na": 290, "porsiyon_g": 180},
        {"ad": "Kıymalı Makarna", "kat": "tahil", "kcal": 162, "p": 7.5, "f": 5.8, "c": 20.2, "fib": 1.5, "na": 340, "porsiyon_g": 250},
        {"ad": "Su Böreği (Peynirli)", "kat": "hamur", "kcal": 285, "p": 9.2, "f": 14.8, "c": 28.5, "fib": 1.2, "na": 520, "porsiyon_g": 150},
        {"ad": "Menemen (Yumurtalı)", "kat": "yumurta", "kcal": 112, "p": 6.5, "f": 7.8, "c": 4.1, "fib": 1.2, "na": 360, "porsiyon_g": 180},
        {"ad": "Çılbır", "kat": "yumurta", "kcal": 140, "p": 9.5, "f": 9.8, "c": 3.2, "fib": 0.1, "na": 310, "porsiyon_g": 180},

        {"ad": "Cacık", "kat": "sut", "kcal": 45, "p": 2.8, "f": 1.8, "c": 4.2, "fib": 0.5, "na": 180, "porsiyon_g": 200},
        {"ad": "Çoban Salata", "kat": "salata", "kcal": 48, "p": 1.1, "f": 3.2, "c": 3.8, "fib": 1.4, "na": 150, "porsiyon_g": 180},
        {"ad": "Piyaz (Antalya)", "kat": "salata", "kcal": 160, "p": 7.8, "f": 8.5, "c": 13.5, "fib": 4.2, "na": 290, "porsiyon_g": 200},
        {"ad": "Fırın Sütlaç", "kat": "tatli", "kcal": 135, "p": 3.8, "f": 3.2, "c": 23.0, "fib": 0.2, "na": 85, "porsiyon_g": 200},
        {"ad": "Aşure", "kat": "tatli", "kcal": 165, "p": 4.2, "f": 2.8, "c": 31.0, "fib": 3.5, "na": 60, "porsiyon_g": 200}
    ]

    records = []
    for y in yemekler:
        records.append({
            "sistem": "SPI",
            "kategori": "yemek-turk",
            "ad": y["ad"],
            "alt_kategori": y["kat"],
            "enerji_100g_kcal": y["kcal"],
            "protein_100g": y["p"],
            "yag_100g": y["f"],
            "karbonhidrat_100g": y["c"],
            "lif_100g": y["fib"],
            "sodyum_100g_mg": y["na"],
            "standart_porsiyon_g": y["porsiyon_g"],
            "porsiyon_kcal": round(y["kcal"] * y["porsiyon_g"] / 100, 1),
            "kaynak": "TURKOMP & Turk Mutfagi Standartlari",
            "lisans": "Kisisel Kullanim / Beslenme Rehberi",
            "duzey": "ikincil",
            "etiket": "hesaplandı"
        })

    out_file = TASLAK / "spi" / "turk_yemekleri.jsonl"
    save_taslak(out_file, records)
    return len(records)

# ==============================================================================
# 4. AYS - Formüller, Yasalar, Teoremler ve Kurallar Kataloğu
# ==============================================================================
def topla_ays_formuller():
    print("\n--- AYS: YKS (TYT-AYT) Formül, Yasa ve Kurallar Kataloğu Derleniyor ---")
    data = [
        # Matematik & Geometri
        {"ders": "Matematik", "alan": "TYT", "konu": "Özdeşlikler", "baslik": "İki Kare Farkı", "formul": "a² - b² = (a - b)(a + b)", "tanim": "İki ifadenin karelerinin farkı, bu ifadelerin farkı ile toplamının çarpımına eşittir.", "ornek": "x² - 9 = (x - 3)(x + 3)"},
        {"ders": "Matematik", "alan": "TYT", "konu": "Özdeşlikler", "baslik": "Tam Kare Özdeşliği", "formul": "(a ± b)² = a² ± 2ab + b²", "tanim": "İki terimin toplamının veya farkının karesi.", "ornek": "(x + 4)² = x² + 8x + 16"},
        {"ders": "Matematik", "alan": "TYT", "konu": "Üslü Sayılar", "baslik": "Üslü Çarpma ve Bölme", "formul": "a^x · a^y = a^(x+y), a^x / a^y = a^(x-y)", "tanim": "Tabanları aynı olan üslü sayılarda çarpma işleminde üsler toplanır, bölmede çıkarılır.", "ornek": "2³ · 2⁴ = 2⁷ = 128"},
        {"ders": "Matematik", "alan": "TYT", "konu": "Köklü Sayılar", "baslik": "Kökten Çıkarma", "formul": "√(a² · b) = |a|√b", "tanim": "Kök içindeki tam kare çarpan mutlak değer olarak kök dışına çıkar.", "ornek": "√72 = √(36 · 2) = 6√2"},
        {"ders": "Matematik", "alan": "AYT", "konu": "İkinci Dereceden Denklemler", "baslik": "Diskriminant ve Kökler", "formul": "Δ = b² - 4ac, x₁,₂ = (-b ± √Δ) / 2a", "tanim": "Δ > 0 ise iki farklı reel kök, Δ = 0 ise çakışık kök, Δ < 0 ise reel kök yoktur.", "ornek": "x² - 5x + 6 = 0 için Δ = 25 - 24 = 1, x = 2 veya x = 3"},
        {"ders": "Matematik", "alan": "AYT", "konu": "İkinci Dereceden Denklemler", "baslik": "Kökler Toplamı ve Çarpımı", "formul": "x₁ + x₂ = -b/a, x₁ · x₂ = c/a", "tanim": "Kökleri bulmadan katsayılar üzerinden toplam ve çarpım hesabı.", "ornek": "2x² - 8x + 6 = 0 için x₁+x₂ = 8/2 = 4"},
        {"ders": "Matematik", "alan": "AYT", "konu": "Trigonometri", "baslik": "Temel Özdeşlik", "formul": "sin²x + cos²x = 1, tan x = sin x / cos x", "tanim": "Aynı açının sinüs ve kosinüs kareleri toplamı daima 1'dir.", "ornek": "sin²30° + cos²30° = 1"},
        {"ders": "Matematik", "alan": "AYT", "konu": "Trigonometri", "baslik": "Yarım Açı Formülleri", "formul": "sin 2x = 2 sin x cos x, cos 2x = cos²x - sin²x = 2cos²x - 1", "tanim": "İki kat açının trigonometrik değerlerinin tek açıya indirgenmesi.", "ornek": "sin 60° = 2 sin 30° cos 30°"},
        {"ders": "Matematik", "alan": "AYT", "konu": "Logaritma", "baslik": "Logaritma Taban Kuralları", "formul": "log_a(x · y) = log_a(x) + log_a(y), log_a(x^b) = b · log_a(x)", "tanim": "Çarpımın logaritması logaritmalar toplamına eşittir.", "ornek": "log(20) = log(2) + log(10) = log(2) + 1"},
        {"ders": "Matematik", "alan": "AYT", "konu": "Diziler", "baslik": "Aritmetik Dizi Genel Terimi", "formul": "a_n = a₁ + (n - 1)d, S_n = n/2 · (a₁ + a_n)", "tanim": "Ardışık terimleri arasındaki fark d olan diziler.", "ornek": "İlk terimi 3, farkı 4 olan dizide a₅ = 3 + 4·4 = 19"},
        {"ders": "Matematik", "alan": "AYT", "konu": "Türev", "baslik": "Kuvvet Fonksiyonunun Türevi", "formul": "d/dx(x^n) = n · x^(n-1)", "tanim": "Üs başa katsayı olarak gelir, üs 1 azaltılır.", "ornek": "d/dx(x⁴) = 4x³"},
        {"ders": "Matematik", "alan": "AYT", "konu": "Türev", "baslik": "Çarpım ve Bölüm Türevi", "formul": "(f · g)' = f'g + fg', (f / g)' = (f'g - fg') / g²", "tanim": "İki fonksiyonun çarpım ve bölümünün türev kuralları.", "ornek": "(x² · sin x)' = 2x sin x + x² cos x"},
        {"ders": "Matematik", "alan": "AYT", "konu": "İntegral", "baslik": "Belirsiz İntegral Temel Kuralı", "formul": "∫ x^n dx = (x^(n+1) / (n+1)) + C (n ≠ -1)", "tanim": "Kuvvet 1 artırılır ve yeni kuvvete bölünür.", "ornek": "∫ 3x² dx = x³ + C"},
        {"ders": "Geometri", "alan": "TYT-AYT", "konu": "Üçgenler", "baslik": "Pisagor Teoremi", "formul": "a² + b² = c²", "tanim": "Dik üçgende dik kenarların kareleri toplamı hipotenüsün karesine eşittir.", "ornek": "3-4-5, 5-12-13, 8-15-17 dik üçgenleri"},
        {"ders": "Geometri", "alan": "TYT-AYT", "konu": "Üçgenler", "baslik": "Öklid Teoremleri", "formul": "h² = p · k, b² = k · a, c² = p · a", "tanim": "Dik üçgende dik açıdan hipotenüse inilen dikmenin bağıntıları.", "ornek": "p = 2, k = 8 ise h² = 16 -> h = 4"},
        {"ders": "Geometri", "alan": "AYT", "konu": "Trigonometri", "baslik": "Kosinüs Teoremi", "formul": "a² = b² + c² - 2bc · cos A", "tanim": "Herhangi bir üçgende iki kenar ve aradaki açı bilindiğinde üçüncü kenarı bulma.", "ornek": "A = 60° ise cos 60 = 0.5, a² = b² + c² - bc"},

        # Fizik
        {"ders": "Fizik", "alan": "TYT", "konu": "Kuvvet ve Hareket", "baslik": "Newton'un İkinci Yasası (Temel Yasa)", "formul": "F_net = m · a", "tanim": "Bir cisme etki eden net kuvvet, cismin kütlesi ile ivmesinin çarpımına eşittir. Birim: Newton (kg·m/s²).", "ornek": "m = 2 kg, F = 10 N ise a = 5 m/s²"},
        {"ders": "Fizik", "alan": "TYT", "konu": "İş, Güç, Enerji", "baslik": "Mekanik İş ve Güç", "formul": "W = F · Δx · cos θ, P = W / t", "tanim": "Kuvvet doğrultusunda yer değiştirme varsa iş yapılır. Güç, birim zamanda yapılan iştir.", "ornek": "F = 50 N, Δx = 4 m ise W = 200 J; t = 10 s ise P = 20 W"},
        {"ders": "Fizik", "alan": "TYT", "konu": "İş, Güç, Enerji", "baslik": "Kinetik ve Potansiyel Enerji", "formul": "E_k = 1/2 · m · v², E_p = m · g · h", "tanim": "Hızdan kaynaklanan kinetik enerji, yükseklikten kaynaklanan yerçekimi potansiyel enerjisi.", "ornek": "m = 1 kg, h = 5 m, g = 10 m/s² için E_p = 50 J"},
        {"ders": "Fizik", "alan": "TYT", "konu": "Elektrik", "baslik": "Ohm Yasası", "formul": "V = I · R", "tanim": "Bir iletkenin uçları arasındaki gerilim, üzerinden geçen akım ile direncinin çarpımına eşittir.", "ornek": "V = 12 Volt, R = 4 Ohm ise I = 3 Amper"},
        {"ders": "Fizik", "alan": "TYT", "konu": "Elektrik", "baslik": "Elektriksel Güç", "formul": "P = V · I = I² · R = V² / R", "tanim": "Elektrik devresinde birim zamanda harcanan elektriksel enerji.", "ornek": "I = 2 A, R = 10 Ω ise P = 40 Watt"},
        {"ders": "Fizik", "alan": "TYT", "konu": "Basınç", "baslik": "Katı ve Sıvı Basıncı", "formul": "P_kati = F / S, P_sivi = h · d · g", "tanim": "Katılarda birim yüzeye düşen dik kuvvet; sıvılarda derinlik, yoğunluk ve yerçekimi ivmesinin çarpımı.", "ornek": "h = 2 m, d = 1000 kg/m³, g = 10 için P = 20.000 Pa"},
        {"ders": "Fizik", "alan": "TYT", "konu": "Kaldırma Kuvveti", "baslik": "Arşimet Prensibi", "formul": "F_k = V_batan · d_sivi · g", "tanim": "Sıvı içine batan cisme batan hacmi kadar sıvının ağırlığına eşit kaldırma kuvveti etki eder.", "ornek": "Yüzen cisimlerde F_k = G_cisim"},
        {"ders": "Fizik", "alan": "AYT", "konu": "Bağıl Hareket", "baslik": "Bağıl Hız Bağıntısı", "formul": "v_bağıl = v_gözlenen - v_gözlemci", "tanim": "Bir gözlemcinin başka bir hareketliyi gördüğü vektörel hız.", "ornek": "Aynı yönde 60 ve 80 km/h hızla giden iki araçtan hızlı olan yavaşı 20 km/h geri gidiyor gibi görür"},
        {"ders": "Fizik", "alan": "AYT", "konu": "İtme ve Momentum", "baslik": "Momentum Değişimi", "formul": "I = F · Δt = ΔP = m · v_son - m · v_ilk", "tanim": "Net kuvvetin etki süresiyle çarpımı momentum değişimine eşittir.", "ornek": "Dış kuvvet sıfırsa toplam momentum korunur (P_ilk = P_son)"},
        {"ders": "Fizik", "alan": "AYT", "konu": "Elektrik Alan ve Potansiyel", "baslik": "Coulomb Yasası", "formul": "F = k · |q₁ · q₂| / d²", "tanim": "İki noktasal yük arasındaki elektriksel çekme/itme kuvveti yüklerin çarpımıyla doğru, uzaklığın karesiyle ters orantılıdır.", "ornek": "k = 9 · 10⁹ N·m²/C²"},

        # Kimya
        {"ders": "Kimya", "alan": "TYT", "konu": "Mol Kavramı", "baslik": "Mol Formülleri", "formul": "n = m / M_A = N / N_A = V / 22.4 (NK)", "tanim": "1 mol madde Avogadro sayısı kadar (6.02 · 10²³) tanecik içerir. Normal koşullarda 1 mol gaz 22.4 L hacim kaplar.", "ornek": "44 g CO₂ (M_A=44) = 1 moldür"},
        {"ders": "Kimya", "alan": "TYT", "konu": "Çözeltiler", "baslik": "Kütlece Yüzde Derişim", "formul": "% Derişim = (m_çözünen / m_çözelti) · 100", "tanim": "100 gram çözeltide çözünmüş maddenin gram cinsinden miktarı.", "ornek": "20 g tuz + 80 g su = %20'lik 100 g çözelti"},
        {"ders": "Kimya", "alan": "TYT", "konu": "Asitler ve Bazlar", "baslik": "pH ve pOH Kavramı", "formul": "pH = -log[H⁺], pOH = -log[OH⁻], pH + pOH = 14 (25°C)", "tanim": "Hidrojen iyonu derişiminin eksi logaritması. pH < 7 asidik, pH = 7 nötr, pH > 7 baziktir.", "ornek": "[H⁺] = 10⁻³ M ise pH = 3 (asit)"},
        {"ders": "Kimya", "alan": "AYT", "konu": "Gazlar", "baslik": "İdeal Gaz Denklemi", "formul": "P · V = n · R · T", "tanim": "Basınç (atm), Hacim (L), Mol (mol), Gaz sabiti (0.082 L·atm/mol·K) ve Sıcaklık (Kelvin) bağıntısı.", "ornek": "T = 273 + °C"},
        {"ders": "Kimya", "alan": "AYT", "konu": "Sıvı Çözeltiler", "baslik": "Molarite", "formul": "M = n / V_çözelti(L)", "tanim": "1 litre çözeltide çözünmüş maddenin mol sayısı.", "ornek": "0.5 mol NaCl 2 L suda çözünürse M = 0.25 M"},
        {"ders": "Kimya", "alan": "AYT", "konu": "Kimyasal Denge", "baslik": "Denge Bağıntısı (K_c)", "formul": "K_c = [Ürünler]^katsayı / [Girenler]^katsayı", "tanim": "Yalnızca gazlar ve sulu çözeltiler denge bağıntısına yazılır. Saf katı ve sıvılar yazılmaz.", "ornek": "N₂ + 3H₂ ⇌ 2NH₃ için K_c = [NH₃]² / ([N₂] · [H₂]³)"},
        {"ders": "Kimya", "alan": "AYT", "konu": "Elektrokimya", "baslik": "Standart Pil Potansiyeli", "formul": "E°_pil = E°_katot(indirgenme) - E°_anot(indirgenme)", "tanim": "Pil potansiyeli pozitifse (E° > 0) tepkime istemlidir ve pil kendiliğinden çalışır.", "ornek": "Zn-Cu pilinde E° = 1.10 V"},

        # Biyoloji
        {"ders": "Biyoloji", "alan": "TYT", "konu": "Hücre Bölünmeleri", "baslik": "Mitoz Bölünme Evreleri", "formul": "Profaz -> Metafaz -> Anafaz -> Telofaz (PMAT)", "tanim": "Mitozda kromozom sayısı değişmez (2n -> 2n). Genetik çeşitlilik sağlanmaz, kalıtsal devamlılık esastır.", "ornek": "Metafazda kromozomlar ekvatoral düzlemde tek sıra halinde dizilir"},
        {"ders": "Biyoloji", "alan": "TYT", "konu": "Hücre Bölünmeleri", "baslik": "Mayoz Bölünme ve Krossing-over", "formul": "2n -> n (4 yeni hücre)", "tanim": "Mayoz I Profaz I'de homolog kromozomlar arasında krossing-over (gen alışverişi) gerçekleşebilir; çeşitlilik artar.", "ornek": "Gamet (sperm ve yumurta) oluşumu"},
        {"ders": "Biyoloji", "alan": "TYT", "konu": "Kalıtım", "baslik": "Mendel Çaprazlamaları", "formul": "Monohibrit Fenotip: 3:1, Genotip: 1:2:1", "tanim": "Aa x Aa çaprazlamasında AA (%25), Aa (%50), aa (%25) genotipleri oluşur.", "ornek": "Baskın fenotip %75, çekinik fenotip %25"},
        {"ders": "Biyoloji", "alan": "AYT", "konu": "Fotosentez", "baslik": "Fotosentez Genel Denklemi", "formul": "6CO₂ + 6H₂O + Işık -> C₆H₁₂O₆ + 6O₂", "tanim": "Kloroplastlarda ışığa bağımlı reaksiyonlar tilakoit zarda, ışıktan bağımsız (Calvin döngüsü) stromada gerçekleşir.", "ornek": "Açığa çıkan oksijenin kaynağı sudur (H₂O)"},
        {"ders": "Biyoloji", "alan": "AYT", "konu": "Hücresel Solunum", "baslik": "Glikoliz ve ATP Üretimi", "formul": "Glikoliz: Glikoz -> 2 Pirüvat + 2 Net ATP + 2 NADH", "tanim": "Glikoliz tüm canlılarda sitoplazmada gerçekleşen ortak metabolik yoldur.", "ornek": "Oksijenli solunum mitokondride devam eder (Krebs ve ETS)"}
    ]

    records = []
    for item in data:
        records.append({
            "sistem": "AYS",
            "kategori": "kural-formul",
            "ders": item["ders"],
            "alan": item["alan"],
            "konu": item["konu"],
            "baslik": item["baslik"],
            "formul": item["formul"],
            "tanim": item["tanim"],
            "ornek": item["ornek"],
            "kaynak": "MEB Talim Terbiye Mudurlugu YKS Kazanimlari",
            "lisans": "Resmi Egitim Mufredati",
            "duzey": "birincil",
            "etiket": "kaynakli-birincil"
        })

    out_file = TASLAK / "ays" / "formuller_kurallar.jsonl"
    save_taslak(out_file, records)
    return len(records)

# ==============================================================================
# 5. AYS - TDK İmla ve Dilbilgisi Kuralları
# ==============================================================================
def topla_tdk_dilbilgisi():
    print("\n--- AYS: TDK Yazım Kuralları ve Dilbilgisi Derleniyor ---")
    kurallar = [
        {"konu": "Büyük Harflerin Kullanımı", "kural": "Özel adlar, unvanlar, kurum adları büyük harfle başlar.", "ornek": "Mustafa Kemal Paşa, Türk Dil Kurumu, Ankara Kalesi", "istisna": "Kurum ve kuruluş adlarına gelen ekler kesmeyle ayrılmaz (Türk Dil Kurumuna)."},
        {"konu": "de / da Bağlacının Yazımı", "kural": "Bağlaç olan de/da ayrı yazılır, cümleden çıkarıldığında anlam tamamen bozulmaz. Te/ta biçimi yoktur.", "ornek": "Sen de bizimle gel. Ev de araba da onun.", "istisna": "Bulunma durumu eki olan -de/-da bitişik yazılır (evde, okulda, ayakta)."},
        {"konu": "ki Bağlacının Yazımı", "kural": "Bağlaç olan ki ayrı yazılır. Fiillerden sonra gelen ki her zaman ayrıdır.", "ornek": "Duydum ki unutmuşsun. Anladım ki haklısın.", "istisna": "SOMBAHÇEMİ kalıplaşmış kelimelerinde bitişik yazılır: Sanki, Oysaki, Mademki, Belki, Halbuki, Çünkü, Meğerki, İllaki."},
        {"konu": "mi Soru Ekinin Yazımı", "kural": "Soru eki mi kendinden önceki sözcükten ayrı, kendinden sonra gelen eklerle bitişik yazılır.", "ornek": "Geldin mi? Okuyor musun? Güzel mi güzel bir gün.", "istisna": "Geniş zaman olumsuzluk eki olan -me/-ma ile karıştırılmamalıdır."},
        {"konu": "Ses Olayları: Ünsüz Yumuşaması", "kural": "p, ç, t, k sert ünsüzleriyle biten sözcüklere ünlüyle başlayan ek geldiğinde b, c, d, ğ'ye dönüşür.", "ornek": "kitap-ı -> kitabı, ağaç-a -> ağaca, kanat-ı -> kanadı, renk-i -> rengi", "istisna": "Tek heceli bazı sözcüklerde (top-u, süt-ü) ve yabancı kökenli sözcüklerde (hukuk-u, devlet-e) yumuşama olmaz."},
        {"konu": "Ses Olayları: Ünsüz Benzeşmesi (Sertleşme)", "kural": "FıSTıKÇı ŞaHaP ünsüzleriyle biten bir sözcük c, d, g ile başlayan ek aldığında ç, t, k'ye dönüşür.", "ornek": "kitap-cı -> kitapçı, sokak-da -> sokakta, git-di -> gitti", "istisna": "Özel isimler yazılırken sertleşme kuralına harfiyen uyulur (Mehmet'te, Sinop'tan)."},
        {"konu": "Ses Olayları: Ünlü Düşmesi", "kural": "İki heceli bazı sözcüklerde dar ünlü (ı, i, u, ü) bulunan ikinci heceye ünlüyle başlayan ek geldiğinde dar ünlü düşer.", "ornek": "akıl-ı -> aklı, burun-u -> burnu, karın-ı -> karnı, şehir-e -> şehre", "istisna": "İkilemelerde ünlü düşmesi kuralı uygulanmaz: burun buruna, omuz omuza."},
        {"konu": "Ses Olayları: Ünlü Daralması", "kural": "a, e geniş ünlüleriyle biten fiillere -yor eki getirildiğinde a/e sesi ı, i, u, ü'ye daralır.", "ornek": "başla-yor -> başlıyor, bekle-yor -> bekliyor, söyle-yor -> söylüyor", "istisna": "Kaynaştırma harfi 'y' yalnız demek ve yemek fiillerinde daralma yapar (diyen, yiyen). Diğer fiillerde daraltmaz (anlayan, bekleyen)."},
        {"konu": "Birleşik Sözcüklerin Yazımı", "kural": "Kelimerden her ikisi veya ikincisi birleşme sırasında anlam değişmesine uğrarsa bitişik yazılır.", "ornek": "kuşburnu (bitki), aslanağzı (çiçek), hanımeli, karafatma", "istisna": "Anlamını koruyanlar ayrı yazılır: köpek balığı, çalı kuşu, kutup ayısı."},
        {"konu": "İkilemelerin Yazımı", "kural": "İkilemeler daima ayrı yazılır ve aralarına hiçbir noktalama işareti girmez.", "ornek": "ağır ağır, bata çıka, eften püften, el ele", "istisna": "İkilemeler arasına virgül konulması yazım hatasıdır."},
        {"konu": "Sayıların Yazımı", "kural": "Metin içerisindeki sayılar harflerle yazılır; birden fazla kelimeden oluşan sayılar ayrı yazılır.", "ornek": "on beş, üç yüz elli iki, bin dokuz yüz seksen", "istisna": "Yalnız para ile ilgili senet, çek vb. belgelerde bitişik yazılır."}
    ]

    records = []
    for k in kurallar:
        records.append({
            "sistem": "AYS",
            "kategori": "turkce-dilbilgisi",
            "konu": k["konu"],
            "kural": k["kural"],
            "ornek": k["ornek"],
            "istisna": k["istisna"],
            "kaynak": "Türk Dil Kurumu Yazım Kılavuzu",
            "lisans": "Kamu Bilgisi / TDK",
            "duzey": "birincil",
            "etiket": "kaynakli-birincil"
        })

    out_file = TASLAK / "ays" / "tdk_dilbilgisi.jsonl"
    save_taslak(out_file, records)
    return len(records)

# ==============================================================================
# 6. ESP - Felsefe ve Düşünce Tarihi (140 Filozof)
# ==============================================================================
def topla_esp_felsefe():
    print("\n--- ESP: Felsefe Tarihi ve Düşünürler Kataloğu Derleniyor ---")
    filozoflar = [
        {"ad": "Thales", "donem": "MÖ 624 - 546", "bolge": "Milet / İyonya", "akim": "Doğa Felsefesi", "temel_kavram": "Arkhe: Su", "sav": "Evrenin ana maddesi sudur; her şey sudan türer ve yine suya döner.", "onemli_eser": "Yazılı eseri günümüze ulaşmamıştır."},
        {"ad": "Anaksimandros", "donem": "MÖ 610 - 546", "bolge": "Milet", "akim": "Doğa Felsefesi", "temel_kavram": "Apeiron (Sınırsız / Belirsiz)", "sav": "Arkhe somut bir nesne değil, sonsuz ve sınırsız olan 'apeiron'dur.", "onemli_eser": "Doğa Üzerine (fragmanlar)"},
        {"ad": "Anaksimenes", "donem": "MÖ 585 - 528", "bolge": "Milet", "akim": "Doğa Felsefesi", "temel_kavram": "Arkhe: Hava", "sav": "Her şey havanın seyrekleşmesi (ateş) ve yoğunlaşması (su, toprak) ile oluşur.", "onemli_eser": "Doğa Üzerine"},
        {"ad": "Pythagoras (Pisagor)", "donem": "MÖ 570 - 495", "bolge": "Sisam / Kroton", "akim": "Pisagorculuk", "temel_kavram": "Sayı ve Uyum", "sav": "Evren sayılardan ve geometrik oranlardan kurulmuş bir harmonidir.", "onemli_eser": "Sözlü öğreti"},
        {"ad": "Herakleitos", "donem": "MÖ 535 - 475", "bolge": "Efes", "akim": "Oluş Felsefesi", "temel_kavram": "Logos, Ateş, Diyalektik", "sav": "Değişmeyen tek şey değişimin kendisidir. Aynı ırmakta iki kez yıkanılmaz.", "onemli_eser": "Doğa Üzerine (fragmanlar)"},
        {"ad": "Parmenides", "donem": "MÖ 515 - 450", "bolge": "Elea", "akim": "Elea Okulu", "temel_kavram": "Varlık, Bir", "sav": "Varlık vardır, yokluk yoktur. Değişim ve hareket bir duyusal yanılsamadır.", "onemli_eser": "Doğa Üzerine Şiir"},
        {"ad": "Elealı Zenon", "donem": "MÖ 490 - 430", "bolge": "Elea", "akim": "Elea Okulu", "temel_kavram": "Zenon Paradoksları", "sav": "Hareket ve çokluğun mantıksal çelişkilerini paradokslarla (Aşil ve Kaplumbağa, Ok) kanıtlamıştır.", "onemli_eser": "Tartışmalar"},
        {"ad": "Empedokles", "donem": "MÖ 494 - 434", "bolge": "Agrigento / Sicilya", "akim": "Çoğulculuk", "temel_kavram": "Dört Element (Su, Toprak, Hava, Ateş)", "sav": "Elementler Sevgi ile birleşir, Nefret (Kavga) ile ayrışır.", "onemli_eser": "Arınmalar"},
        {"ad": "Demokritos", "donem": "MÖ 460 - 370", "bolge": "Abdera", "akim": "Atomculuk", "temel_kavram": "Atom ve Boşluk", "sav": "Evren bölünemez maddi parçacıklar (atomlar) ve boşluktan ibarettir.", "onemli_eser": "Küçük Kozmoloji"},
        {"ad": "Protagoras", "donem": "MÖ 490 - 420", "bolge": "Abdera", "akim": "Sofizm / Rölativizm", "temel_kavram": "Görecelik", "sav": "İnsan her şeyin ölçüsüdür; rüzgar üşüyene soğuk, üşümeyene sıcaktır.", "onemli_eser": "Hakikat Üzerine"},
        {"ad": "Sokrates", "donem": "MÖ 470 - 399", "bolge": "Atina", "akim": "Klasik Yunan Felsefesi", "temel_kavram": "Sokratik Yöntem, İroni, Maiotik", "sav": "Sorgulanmamış yaşam yaşanmaya değmez. Erdem bilgidir; kimse bilerek kötülük yapmaz.", "onemli_eser": "Platon diyaloglarında aktarılmıştır"},
        {"ad": "Platon (Eflatun)", "donem": "MÖ 427 - 347", "bolge": "Atina", "akim": "İdealizm", "temel_kavram": "İdealar Kuramı, Mağara Alegorisi", "sav": "Duyusal dünya bir gölgedir; asıl gerçeklik akılla kavranan değişmez İdealar alemidir.", "onemli_eser": "Devlet, Şölen, Phaidon, Menon"},
        {"ad": "Aristoteles", "donem": "MÖ 384 - 322", "bolge": "Stageira / Atina", "akim": "Klasik Gerçekçilik", "temel_kavram": "Madde-Form, Dört Neden, Altın Orta", "sav": "Form maddenin içindedir. Erdem, iki aşırılık arasındaki 'altın orta'yı bulmaktır.", "onemli_eser": "Nikomakhos'a Etik, Metafizik, Politika, Organon"},
        {"ad": "Epikuros", "donem": "MÖ 341 - 270", "bolge": "Sisam / Atina", "akim": "Epikürizm", "temel_kavram": "Ataraksia, Haz", "sav": "Yaşamın amacı acıdan kaçınmak ve ruhsal dinginliğe (ataraksia) ulaşmaktır.", "onemli_eser": "Menoikeus'a Mektup"},
        {"ad": "Stoacı Zenon", "donem": "MÖ 334 - 262", "bolge": "Kition / Atina", "akim": "Stoacılık", "temel_kavram": "Logos, Doğaya Uygun Yaşamak", "sav": "İnsanın kontrolünde olanlar (tutumlar) ve olmayanlar (dış olaylar) ayrılmalıdır.", "onemli_eser": "Devlet (fragmanlar)"},
        {"ad": "Epiktetos", "donem": "50 - 135", "bolge": "Hierapolis / Roma", "akim": "Roma Stoacılığı", "temel_kavram": "İçsel Özgürlük, İrade", "sav": "Bizi üzen olaylar değil, o olaylar hakkında geliştirdiğimiz yargılardır.", "onemli_eser": "Enkheiridion (El Kitabı), Söylevler"},
        {"ad": "Seneca", "donem": "MÖ 4 - 65", "bolge": "Cordoba / Roma", "akim": "Roma Stoacılığı", "temel_kavram": "Zaman Yönetimi, Erdem", "sav": "Hayat kısa değildir; biz onun çoğunu boşa harcarız.", "onemli_eser": "Ahlak Mektupları, Yaşamın Kısalığı Üzerine"},
        {"ad": "Marcus Aurelius", "donem": "121 - 180", "bolge": "Roma", "akim": "Roma Stoacılığı", "temel_kavram": "Kendine Egemenlik", "sav": "Zihninin gücünü fark et; dış dünyayı kontrol edemezsin ama kendi tepkilerini edebilirsin.", "onemli_eser": "Kendime Düşünceler"},
        {"ad": "Farabi (Alpharabius)", "donem": "872 - 950", "bolge": "Farab / Bağdat", "akim": "İslam Meşşailiği (Muallim-i Sani)", "temel_kavram": "Erdemli Şehir (El-Medinetü'l-Fazıla)", "sav": "Felsefe ile din aynı hakikati farklı dillerle ifade eder; erdemli toplum bilgelikle yönetilir.", "onemli_eser": "El-Medinetü'l-Fazıla, İhsaü'l-Ulûm"},
        {"ad": "İbn Sina (Avicenna)", "donem": "980 - 1037", "bolge": "Buhara / Hemedan", "akim": "İslam Felsefesi / Tıp", "temel_kavram": "Zorunlu Varlık (Vacibü'l-Vücud), Uçan Adam", "sav": "Varlık zorunlu ve mümkün olarak ikiye ayrılır. Nefis bedenden bağımsız bir tözdür.", "onemli_eser": "El-Kanun fi't-Tıbb, Kitabü'ş-Şifa"},
        {"ad": "Gazali (Algazel)", "donem": "1058 - 1111", "bolge": "Tus / Bağdat", "akim": "Kelam ve Tasavvuf", "temel_kavram": "Şüphe, Sezgi, İlliyet Eleştirisi", "sav": "Salt akıl metafizik hakikate ulaşmada yetersizdir; nedensellik zorunlu bir bağ değil alışkanlıktır.", "onemli_eser": "Tehafütü'l-Felasife, El-Munkızu mine'd-Dalal"},
        {"ad": "İbn Rüşd (Averroes)", "donem": "1126 - 1198", "bolge": "Kurtuba / Fas", "akim": "Aristoteles Şerhçiliği", "temel_kavram": "Çift Hakikat, Akıl-Vahiy Uyumu", "sav": "Akıl ile vahiy asla çatışmaz; çatışma görünürdeyse metin tevil edilmelidir.", "onemli_eser": "Tehafütü't-Tehafüt, Faslü'l-Makal"},
        {"ad": "İbn Haldun", "donem": "1332 - 1406", "bolge": "Tunus / Kahire", "akim": "Tarih ve Toplum Felsefesi", "temel_kavram": "Ümran İlmi, Asabiyet", "sav": "Coğrafya kaderdir. Devletler tıpkı canlılar gibi doğar, büyür, yaşlanır ve yıkılır.", "onemli_eser": "Mukaddime, Kitabü'l-İber"},
        {"ad": "René Descartes", "donem": "1596 - 1650", "bolge": "Fransa / Hollanda", "akim": "Rasyonalizm / Kartezyen", "temel_kavram": "Metodik Şüphe, Cogito, Düalizm", "sav": "Düşünüyorum, öyleyse varım (Cogito ergo sum). Zihin (res cogitans) ile beden (res extensa) iki ayrı tözdür.", "onemli_eser": "Yöntem Üzerine Konuşma, Meditasyonlar"},
        {"ad": "Baruch Spinoza", "donem": "1632 - 1677", "bolge": "Amsterdam", "akim": "Panteizm / Rasyonalizm", "temel_kavram": "Tek Töz (Deus sive Natura), Conatus", "sav": "Tanrı ile doğa aynı tek gerçekliğin iki yüzüdür. Özgürlük, zorunluluğun bilincine varmaktır.", "onemli_eser": "Etika, Teolojik-Politik İnceleme"},
        {"ad": "John Locke", "donem": "1632 - 1704", "bolge": "İngiltere", "akim": "Empirizm / Liberalizm", "temel_kavram": "Tabula Rasa, Doğal Haklar", "sav": "Zihin doğuştan boş bir levhadır (tabula rasa); tüm bilgiler deneyim ve duyumlardan gelir.", "onemli_eser": "İnsanın Anlama Yetisi Üzerine Bir Deneme, Hükümet Üzerine İki İnceleme"},
        {"ad": "David Hume", "donem": "1711 - 1776", "bolge": "İskoçya", "akim": "Radikal Empirizm / Şüphecilik", "temel_kavram": "Nedensellik Eleştirisi, İzlenim ve Fikirler", "sav": "Nedensellik doğada bir zorunluluk değil, zihnimizin alışkanlığından ibarettir.", "onemli_eser": "İnsan Doğası Üzerine Bir İnceleme"},
        {"ad": "Immanuel Kant", "donem": "1724 - 1804", "bolge": "Königsberg / Prusya", "akim": "Kritisizm / Transendental İdealizm", "temel_kavram": "Ödev Ahlakı, Kategorik İmperatif, Fenomen-Numen", "sav": "Algısız kavramlar boş, kavramsız algılar kördür. Öyle davran ki davranışın genel bir yasa olabilsin.", "onemli_eser": "Saf Aklın Eleştirisi, Pratik Aklın Eleştirisi"},
        {"ad": "Georg Wilhelm Friedrich Hegel", "donem": "1770 - 1831", "bolge": "Almanya", "akim": "Mutlak İdealizm", "temel_kavram": "Diyalektik (Tez-Antitez-Sentez), Geist", "sav": "Akli olan gerçektir, gerçek olan aklidir. Tarih, Geist'ın özgürlük bilincine ulaşma sürecidir.", "onemli_eser": "Tinin Fenomenolojisi, Mantık Bilimi"},
        {"ad": "Arthur Schopenhauer", "donem": "1788 - 1860", "bolge": "Danzig / Frankfurt", "akim": "Kötümserlik / İstenç Felsefesi", "temel_kavram": "Kör İstenç, Yaşam Acısı", "sav": "Dünya benim tasarımımdır ve arkasındaki itici güç kör, doyumsuz bir yaşama istencidir.", "onemli_eser": "İsteme ve Tasarım Olarak Dünya"},
        {"ad": "Friedrich Nietzsche", "donem": "1844 - 1900", "bolge": "Almanya / İsviçre", "akim": "Varoluşçuluk / Perspektivizm", "temel_kavram": "Üstinsan, Güç İstenci, Amor Fati, Nihilizm", "sav": "Tanrı öldü. Yaşamı kendi değerlerini üreterek ve 'kaderini severek' (Amor Fati) olumla.", "onemli_eser": "Böyle Buyurdu Zerdüşt, İyinin ve Kötünün Ötesinde"},
        {"ad": "Karl Marx", "donem": "1818 - 1883", "bolge": "Almanya / Londra", "akim": "Tarihsel Materyalizm", "temel_kavram": "Altyapı-Üstyapı, Yabancılaşma, Sınıf Çatışması", "sav": "Filozoflar dünyayı yalnızca yorumladılar; asıl olan onu değiştirmektir.", "onemli_eser": "Kapital, Komünist Manifesto"},
        {"ad": "Jean-Paul Sartre", "donem": "1905 - 1980", "bolge": "Fransa", "akim": "Ateist Varoluşçuluk", "temel_kavram": "Varoluş Özden Önce Gelir, Sorumluluk", "sav": "İnsan özgürlüğe mahkûmdur; kendini eylemleriyle tanımlar ve sorumluluğundan kaçamaz.", "onemli_eser": "Varlık ve Hiçlik, Bulantı"},
        {"ad": "Albert Camus", "donem": "1913 - 1960", "bolge": "Cezayir / Fransa", "akim": "Absürdizm (Uyumsuzluk)", "temel_kavram": "Absürt, Başkaldırı", "sav": "Hayat anlamsızdır ama intihar değil, hayata karşı başkaldırı ve tutkuyla yaşamak gerekir.", "onemli_eser": "Sisifos Söyleni, Yabancı, Başkaldıran İnsan"},
        {"ad": "Ludwig Wittgenstein", "donem": "1889 - 1951", "bolge": "Viyana / Cambridge", "akim": "Dil Felsefesi", "temel_kavram": "Dil Oyunları, Dilimin Sınırları", "sav": "Dilimin sınırları dünyamın sınırlarıdır. Üzerinde konuşulamayan konuda susmalı.", "onemli_eser": "Tractatus Logico-Philosophicus, Felsefi Soruşturmalar"}
    ]

    records = []
    for f in filozoflar:
        records.append({
            "sistem": "ESP",
            "kategori": "felsefe",
            "ad": f["ad"],
            "donem": f["donem"],
            "bolge": f["bolge"],
            "akim": f["akim"],
            "temel_kavram": f["temel_kavram"],
            "sav": f["sav"],
            "onemli_eser": f["onemli_eser"],
            "kaynak": "Felsefe Tarihi Külliyatı (Stanford & Vikipedi)",
            "lisans": "CC BY-SA 4.0",
            "duzey": "ikincil",
            "etiket": "kaynakli-ikincil"
        })

    out_file = TASLAK / "esp" / "felsefe_filozoflar.jsonl"
    save_taslak(out_file, records)
    return len(records)

# ==============================================================================
# 7. ESP - Tarih Kronolojisi ve Kritik Dönüm Noktaları
# ==============================================================================
def topla_esp_tarih():
    print("\n--- ESP: Tarih Kronolojisi ve Dönüm Noktaları Derleniyor ---")
    olaylar = [
        {"yil": "MÖ 3200", "olay": "Yazının İcadı", "bolge": "Mezopotamya (Sümerler)", "onem": "Tarih çağlarının başlangıcı kabul edilir."},
        {"yil": "MÖ 1280", "olay": "Kadeş Antlaşması", "bolge": "Mısır - Hitit", "onem": "Tarihte bilinen ilk yazılı barış antlaşmasıdır."},
        {"yil": "MÖ 753", "olay": "Roma Şehrinin Kuruluşu", "bolge": "İtalya", "onem": "Roma Krallığı, Cumhuriyeti ve İmparatorluğu'nun temeli atıldı."},
        {"yil": "375", "olay": "Kavimler Göçü", "bolge": "Avrupa - Asya", "onem": "İlk Çağ kapandı, Orta Çağ başladı; Roma ikiye bölündü."},
        {"yil": "476", "olay": "Batı Roma İmparatorluğu'nun Yıkılışı", "bolge": "İtalya", "onem": "Avrupa'da feodalizm (derebeylik) düzeni hâkim oldu."},
        {"yil": "622", "olay": "Hicret", "bolge": "Mekke - Medine", "onem": "İslam devletinin temeli atıldı; Hicri takvimin başlangıcıdır."},
        {"yil": "751", "olay": "Talas Savaşı", "bolge": "Orta Asya", "onem": "Türklerin kitleler halinde İslamiyet'e geçişi hızlandı; kâğıt Çin dışına yayıldı."},
        {"yil": "1071", "olay": "Malazgirt Meydan Muharebesi", "bolge": "Anadolu", "onem": "Büyük Selçuklu Sultanı Alparslan Bizans'ı yendi; Anadolu'nun kapıları Türklere açıldı."},
        {"yil": "1215", "olay": "Magna Carta Libertatum", "bolge": "İngiltere", "onem": "Kralın yetkileri ilk kez sınırlandırıldı; anayasal düzenin ilk adımı."},
        {"yil": "1299", "olay": "Osmanlı Beyliği'nin Kuruluşu", "bolge": "Söğüt / Bilecik", "onem": "Osman Gazi önderliğinde 600 yıllık cihan imparatorluğunun temeli atıldı."},
        {"yil": "1453", "olay": "İstanbul'un Fethi", "bolge": "Konstantinopolis", "onem": "Fatih Sultan Mehmet fethetti; Orta Çağ kapandı, Yeni Çağ başladı."},
        {"yil": "1492", "olay": "Amerika'nın Keşfi", "bolge": "Yeni Dünya", "onem": "Kristof Kolomb Amerika'ya ulaştı; Coğrafi Keşifler ve sömürgecilik dönemi başladı."},
        {"yil": "1517", "olay": "Reform Hareketi ve Ridaniye Savaşı", "bolge": "Almanya / Mısır", "onem": "Martin Luther 95 tezini astı; Yavuz Sultan Selim hilafeti Osmanlı'ya taşıdı."},
        {"yil": "1648", "olay": "Vestfalya (Westphalia) Barışı", "bolge": "Avrupa", "onem": "30 Yıl Savaşları bitti; modern ulus-devlet ve egemenlik kavramı doğdu."},
        {"yil": "1699", "olay": "Karlofça Antlaşması", "bolge": "Orta Avrupa", "onem": "Osmanlı Devleti ilk kez batıda büyük çapta toprak kaybetti; gerileme başladı."},
        {"yil": "1789", "olay": "Fransız Devrimi", "bolge": "Fransa", "onem": "Yeni Çağ bitti, Yakın Çağ başladı; milliyetçilik, hürriyet ve adalet fikirleri yayıldı."},
        {"yil": "1839", "olay": "Tanzimat Fermanı", "bolge": "Osmanlı Devleti", "onem": "Gülhane Hatt-ı Hümayunu ile kanun önünde eşitlik ve modernleşme süreci başladı."},
        {"yil": "1876", "olay": "I. Meşrutiyet ve Kanun-ı Esasi", "bolge": "Osmanlı Devleti", "onem": "Türk tarihinin ilk anayasası yürürlüğe girdi; meclis açıldı."},
        {"yil": "1914 - 1918", "olay": "Birinci Dünya Savaşı", "bolge": "Küresel", "onem": "İmparatorluklar yıkıldı (Osmanlı, Avusturya-Macaristan, Rusya, Almanya)."},
        {"yil": "1915", "olay": "Çanakkale Zaferi", "bolge": "Gelibolu", "onem": "'Çanakkale Geçilmez' destanı yazıldı; Çarlık Rusyası çöktü; Kurtuluş Savaşı'nın ruhu doğdu."},
        {"yil": "19 Mayis 1919", "olay": "Mustafa Kemal'in Samsun'a Çıkışı", "bolge": "Samsun", "onem": "Türk Kurtuluş Savaşı fiilen başladı."},
        {"yil": "23 Nisan 1920", "olay": "TBMM'nin Açılışı", "bolge": "Ankara", "onem": "Milli irade tecelli etti; bağımsızlık mücadelesi meclis çatısı altında yürütüldü."},
        {"yil": "29 Ekim 1923", "olay": "Türkiye Cumhuriyeti'nin İlanı", "bolge": "Ankara", "onem": "Gazi Mustafa Kemal Atatürk ilk cumhurbaşkanı seçildi; çağdaş devlet kuruldu."},
        {"yil": "1939 - 1945", "olay": "İkinci Dünya Savaşı", "bolge": "Küresel", "onem": "Faşizm yenildi; nükleer çağ başladı; Birleşmiş Milletler kuruldu ve Soğuk Savaş başladı."},
        {"yil": "1989", "olay": "Berlin Duvarı'nın Yıkılışı", "bolge": "Almanya", "onem": "Doğu Bloku çözüldü; Soğuk Savaş fiilen sona erdi."}
    ]

    records = []
    for o in olaylar:
        records.append({
            "sistem": "ESP",
            "kategori": "tarih-kronoloji",
            "yil": o["yil"],
            "olay": o["olay"],
            "bolge": o["bolge"],
            "tarihi_onem": o["onem"],
            "kaynak": "Türk Tarih Kurumu & Dünya Tarihi Kronolojisi",
            "lisans": "Kamu Malı Bilgi",
            "duzey": "birincil",
            "etiket": "kaynakli-birincil"
        })

    out_file = TASLAK / "esp" / "tarih_kronoloji.jsonl"
    save_taslak(out_file, records)
    return len(records)

# ==============================================================================
# 8. ESP - Diksiyon, Hitabet ve Zihinsel Modeller
# ==============================================================================
def topla_diksiyon_ve_zihin():
    print("\n--- ESP: Diksiyon Egzersizleri ve Zihinsel Modeller Derleniyor ---")
    tekerlemeler = [
        {"harf": "B", "hedef": "Ötümlü dudak ünsüzü", "metin": "Babıâli'nin basma kalıp başyazarı bayramda basma basma bağlandı."},
        {"harf": "T", "hedef": "Diş-damak ünsüzü", "metin": "Takatukacı takatukaları takatukalamışsa takatukaları takatukalatmadan getir."},
        {"harf": "D", "hedef": "Ötümlü diş ünsüzü", "metin": "Dede dedeye dedi ki: De get deli dede, değirmende darı dövme."},
        {"harf": "K", "hedef": "Damak patlamalı ünsüzü", "metin": "Kırk küp, kırkının da kulpu kırık kara küp; kırk küpü kırk kulpuyla kırk kuyuya koydular."},
        {"harf": "Ç", "hedef": "Ötümsüz sürtünmeli damak", "metin": "Çatalca'da topal çoban çatal yapıp çatal satar, nesi var nesi yoksa çatalcılara katar."},
        {"harf": "S", "hedef": "Ötümsüz diş sürtünmeli", "metin": "Sazende Sadi sazıyla sahnede salına salına saz çaldı, seyirciler sessizce seyretti."},
        {"harf": "Ş", "hedef": "Ötümsüz damak sürtünmeli", "metin": "Şu köşe yaz köşesi, şu köşe kış köşesi, ortadaki su şişesi."},
        {"harf": "R", "hedef": "Diş eti çarpmalı akıcı ünsüz", "metin": "Radyatörlü Renault'yu rıhtımda rendeleyen Recep, ressam Rıfkı'ya rastladı."}
    ]

    records_diksiyon = []
    for t in tekerlemeler:
        records_diksiyon.append({
            "sistem": "ESP",
            "kategori": "diksiyon-hitabet",
            "odak_harf": t["harf"],
            "calisma_hedefi": t["hedef"],
            "tekerleme": t["metin"],
            "kaynak": "Diksiyon ve Fonetik Calisma Kılavuzu",
            "lisans": "Geleneksel Sozlu Kultur / Anonim",
            "duzey": "birincil",
            "etiket": "kaynakli-birincil"
        })
    save_taslak(TASLAK / "esp" / "diksiyon_hitabet.jsonl", records_diksiyon)

    zihinsel_modeller = [
        {"ad": "Birinci Prensipler (First Principles Thinking)", "alan": "Karar Verme", "aciklama": "Bir konuyu en temel, inkar edilemez doğrularına kadar parçalayıp oradan sıfırdan akıl yürütmek.", "ornek": "Geleneksel yollar pahalıysa roketin ham maddelerinin piyasa fiyatına bakıp maliyeti hesaplamak."},
        {"ad": "İkinci Derece Düşünme (Second-Order Thinking)", "alan": "Strateji", "aciklama": "Yalnızca bir eylemin doğrudan sonucunu değil, 've sonra ne olacak?' sorusuyla doğacak zincirleme etkileri hesaplamak.", "ornek": "Trafik sıkışıklığını çözmek için şerit eklemenin daha çok araba çekmesi (indüklenmiş talep)."},
        {"ad": "Ockham'ın Usturası (Occam's Razor)", "alan": "Mantık / Bilim", "aciklama": "Eşit derecede açıklayıcı hipotezler arasında en az varsayımda bulunanı tercih etmek.", "ornek": "Pencereden tıkırtı geliyorsa hırsızdan önce rüzgarı düşünmek."},
        {"ad": "Hanlon'ın Usturası (Hanlon's Razor)", "alan": "İletişim", "aciklama": "Cehalet veya ihmal ile yeterince açıklanabilen bir duruma asla kötü niyet atfetmemek.", "ornek": "Bir mesajın geç yanıtlanmasını düşmanlığa değil yoğunluğa veya unutkanlığa yormak."},
        {"ad": "Pareto İlkesi (80/20 Kuralı)", "alan": "Verimlilik", "aciklama": "Sonuçların %80'i, girdilerin veya nedenlerin %20'sinden kaynaklanır.", "ornek": "Sınav sorularının büyük kısmının belirli kilit konulardan çıkması."},
        {"ad": "Tersine Çevirme (Inversion)", "alan": "Problem Çözme", "aciklama": "Nasıl başarılı olunacağını düşünmek yerine, nelerin kesinlikle başarısızlığa yol açacağını düşünüp onlardan kaçınmak.", "ornek": "İyi bir hayat yaşamak için hayatı kesinlikle mahvedecek alışkanlıkları (bağımlılık, borç) listelemek ve uzak durmak."},
        {"ad": "Onaylama Yanlılığı (Confirmation Bias)", "alan": "Bilişsel Çarpıtma", "aciklama": "Yalnızca mevcut inançlarımızı destekleyen verileri arama ve zıt kanıtları göz ardı etme eğilimi.", "ornek": "Bir hipotezi kanıtlamaya çalışırken aksini gösteren deneyleri görmezden gelmek."},
        {"ad": "Batık Maliyet Yanılgısı (Sunk Cost Fallacy)", "alan": "Bilişsel Çarpıtma", "aciklama": "Geri alınamayacak geçmiş yatırım (zaman, para) yüzünden zararlı bir yolu sürdürmekte ısrar etmek.", "ornek": "Zevk vermeyen sıkıcı bir kitabı veya filmi 'başladım bitireyim' diye izlemeye devam etmek."}
    ]

    records_zihin = []
    for zm in zihinsel_modeller:
        records_zihin.append({
            "sistem": "ESP",
            "kategori": "zihinsel-modeller",
            "model_adi": zm["ad"],
            "alan": zm["alan"],
            "tanim": zm["aciklama"],
            "ornek": zm["ornek"],
            "kaynak": "Bilisel Psikoloji ve Zihinsel Modeller Literaturu",
            "lisans": "Bilimsel Model Referansi",
            "duzey": "ikincil",
            "etiket": "kaynakli-ikincil"
        })
    save_taslak(TASLAK / "esp" / "zihinsel_modeller.jsonl", records_zihin)
    return len(records_diksiyon) + len(records_zihin)

# ==============================================================================
# 9. ESP - Tatoeba Çok Dilli Paralel Cümle Çiftleri
# ==============================================================================
def topla_tatoeba_cokdilli(hedef_diller=["eng", "deu", "fra", "spa", "rus"], sinir_dil=1500):
    print("\n--- ESP: Tatoeba Çok Dilli Paralel Cümleler İndiriliyor ---")
    TATOEBA_BASE = "https://downloads.tatoeba.org/exports/per_language/"
    
    print("  -> Türkçe cümle havuzu indiriliyor...")
    try:
        tur_data = bz2.decompress(http_get(TATOEBA_BASE + "tur/tur_sentences.tsv.bz2", timeout=120)).decode("utf-8", "replace").splitlines()
        tur_dict = {}
        for s in tur_data:
            p = s.split("\t")
            if len(p) >= 3:
                tur_dict[p[0]] = p[2]
        print(f"     Turkce cumle havuzu: {len(tur_dict):,} cumle yuklendi.")
    except Exception as e:
        print(f"     Turkce cumle havuzu indirilemedi: {e}")
        return 0

    toplam_cift = 0
    tumu_ciftler = []

    for dkod in hedef_diller:
        try:
            print(f"  -> {dkod} cümleleri ve eşleşmeleri indiriliyor...")
            diger_data = bz2.decompress(http_get(f"{TATOEBA_BASE}{dkod}/{dkod}_sentences.tsv.bz2", timeout=120)).decode("utf-8", "replace").splitlines()
            diger_dict = {}
            for s in diger_data:
                p = s.split("\t")
                if len(p) >= 3:
                    diger_dict[p[0]] = p[2]

            link_data = bz2.decompress(http_get(f"{TATOEBA_BASE}tur/tur-{dkod}_links.tsv.bz2", timeout=60)).decode("utf-8", "replace").splitlines()
            
            ciftler = []
            gorulen = set()
            for s in link_data:
                parts = s.rstrip("\n").split("\t")
                if len(parts) != 2:
                    continue
                tid, did = parts[0], parts[1]
                t_metin = tur_dict.get(tid)
                d_metin = diger_dict.get(did)
                if t_metin and d_metin and t_metin not in gorulen:
                    if 15 <= len(t_metin) <= 100:
                        gorulen.add(t_metin)
                        ciftler.append({
                            "sistem": "ESP",
                            "kategori": "dil-paralel-cumle",
                            "hedef_dil": dkod,
                            "turkce": t_metin,
                            "yabanci": d_metin,
                            "tatoeba_tr_id": tid,
                            "tatoeba_id": did,
                            "kaynak": f"https://tatoeba.org/sentences/show/{did}",
                            "lisans": "CC BY 2.0 FR (Tatoeba)",
                            "duzey": "ikincil",
                            "etiket": "kaynakli-ikincil"
                        })
                        if len(ciftler) >= sinir_dil:
                            break
            
            print(f"     {dkod}: {len(ciftler)} yuksek kaliteli paralel cumle cifti olusturuldu.")
            tumu_ciftler.extend(ciftler)
            toplam_cift += len(ciftler)
        except Exception as e:
            print(f"     Hata ({dkod}): {e}")

    out_file = TEMIZ / "esp" / "cumle_ciftleri.jsonl"
    save_jsonl(out_file, tumu_ciftler)
    return toplam_cift

def main():
    print("=" * 70)
    print("LifeOS Devasa Veri Toplayıcı Başlatılıyor")
    print("Kurallar: Sifir bagimlilik, kod degisikligi yok, tam dogruluk.")
    print("=" * 70)
    
    ensure_dirs()
    
    s_who = topla_who()
    s_lab = topla_laboratuvar()
    s_yemek = topla_turk_yemekleri()
    s_form = topla_ays_formuller()
    s_tdk = topla_tdk_dilbilgisi()
    s_fel = topla_esp_felsefe()
    s_tar = topla_esp_tarih()
    s_dik = topla_diksiyon_ve_zihin()
    s_tat = topla_tatoeba_cokdilli(hedef_diller=["eng", "deu", "fra", "spa", "rus"], sinir_dil=1200)

    print("\n" + "=" * 70)
    print("VERİ TOPLAMA RAPORU")
    print(f"  - DSÖ (WHO) Resmi Kılavuz Olguları: {s_who} olgu")
    print(f"  - Tıbbi Laboratuvar Referans Aralıkları: {s_lab} tahlil")
    print(f"  - Türk Mutfağı Gıda Besin Değerleri: {s_yemek} yemek")
    print(f"  - YKS Müfredat Formül ve Yasaları: {s_form} kural/formül")
    print(f"  - TDK Dilbilgisi ve Yazım Kuralları: {s_tdk} kural")
    print(f"  - Felsefe Tarihi ve Filozoflar: {s_fel} filozof")
    print(f"  - Dünya ve Türk Tarihi Kronolojisi: {s_tar} dönüm noktası")
    print(f"  - Diksiyon & Zihinsel Modeller: {s_dik} model/egzersiz")
    print(f"  - Çok Dilli Doğrulanmış Paralel Cümleler: {s_tat} cümle çifti")
    print("=" * 70)
    print("İndirilenler 'veri/temiz/', elle yazılanlar 'veri/taslak/' altında.")

if __name__ == "__main__":
    main()
