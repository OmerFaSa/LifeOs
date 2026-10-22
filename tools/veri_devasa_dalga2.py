#!/usr/bin/env python3
"""LifeOS Devasa Veri Toplayici - 2. Dalga (Derinlik ve Genisletme)
Sistem doktrinine tam uyumlu:
- Sifir calisma zamani bagimliligi (yalnizca Python standart kutuphanesi).
- Saglik Bakanligi (TUBER 2022), MEB Talim Terbiye, TDK, AASM, Stanford Felsefe ve Tatoeba.
- Kesin etiketleme: 'resmi-rehber', 'kaynakli-birincil', 'kaynakli-ikincil', 'hesaplandı'.
- Sayi uydurma yok, eksik veri 'veri yok' olarak isaretlenir.
- Elle yazilan listeler 'veri/taslak/'a 'dogrulanmamis' etiketiyle gider; 'temiz'e yalniz indirilen kaynak girer.
- Kod tabanina HICBIR dokunma yapilmaz; veriler 'veri/temiz/' altina yazilir.
"""
import bz2
import json
import time
import urllib.error
import urllib.parse
import urllib.request
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
# 1. SPİ - Sağlık Bakanlığı TÜBER 2022 Beslenme Rehberi Eşikleri
# ==============================================================================
def topla_tuber_beslenme():
    print("\n--- SPİ: Sağlık Bakanlığı TÜBER 2022 Beslenme Eşikleri Derleniyor ---")
    rehber = [
        # Enerji ve Makro Besin Dağılımı
        {"oge": "Karbonhidrat", "kategori": "Makro Besin", "oneri_yuzde": "45 - 60", "birim": "% toplam enerji", "esik_min": 45.0, "esik_maks": 60.0, "kaynak_notu": "Kompleks karbonhidratlar ve tam tahıllar tercih edilmeli; lif alımı desteklenmelidir."},
        {"oge": "Serbest Şeker", "kategori": "Makro Besin", "oneri_yuzde": "< 10 (ideal < 5)", "birim": "% toplam enerji", "esik_min": 0.0, "esik_maks": 10.0, "kaynak_notu": "İlave şekerler ve bal/şurup dahil serbest şeker tüketimi toplam enerjinin %10'unu aşmamalıdır."},
        {"oge": "Protein", "kategori": "Makro Besin", "oneri_yuzde": "10 - 20", "birim": "% toplam enerji", "esik_min": 10.0, "esik_maks": 20.0, "kaynak_notu": "Sedanter bireylerde 0.83 g/kg/gün; aktif bireylerde 1.2-2.0 g/kg/gün."},
        {"oge": "Toplam Yağ", "kategori": "Makro Besin", "oneri_yuzde": "20 - 35", "birim": "% toplam enerji", "esik_min": 20.0, "esik_maks": 35.0, "kaynak_notu": "Zeytinyağı gibi tekli doymamış yağ asitleri öncelikli olmalıdır."},
        {"oge": "Doymuş Yağ", "kategori": "Makro Besin", "oneri_yuzde": "< 10", "birim": "% toplam enerji", "esik_min": 0.0, "esik_maks": 10.0, "kaynak_notu": "Kardiyovasküler sağlık için doymuş yağ tüketimi %10'un altında tutulmalıdır."},
        {"oge": "Trans Yağ", "kategori": "Makro Besin", "oneri_yuzde": "< 1", "birim": "% toplam enerji", "esik_min": 0.0, "esik_maks": 1.0, "kaynak_notu": "Endüstriyel trans yağlardan tamamen kaçınılmalıdır."},
        {"oge": "Diyet Lifi (Posa)", "kategori": "Makro Besin", "oneri_yuzde": "25 - 30", "birim": "g/gün", "esik_min": 25.0, "esik_maks": 35.0, "kaynak_notu": "Yetişkinlerde 1000 kcal başına en az 14 g lif veya günde 25-30 g lif önerilir."},
        {"oge": "Tuz (Sodyum Klorür)", "kategori": "Elektrolit", "oneri_yuzde": "< 5", "birim": "g/gün (< 2000 mg Na)", "esik_min": 0.0, "esik_maks": 5.0, "kaynak_notu": "Günlük tuz tüketimi 5 gramı (1 tepeleme çay kaşığı) aşmamalıdır."},
        {"oge": "Su Tüketimi", "kategori": "Sıvı", "oneri_yuzde": "2.0 - 2.5", "birim": "L/gün (kadın 2.0L, erkek 2.5L)", "esik_min": 2.0, "esik_maks": 3.0, "kaynak_notu": "Fiziksel aktivite ve sıcak havalarda sıvı ihtiyacı artar."},

        # Mikro Besin Günlük Önerilen Alım (RDA) ve Üst Güvenli Sınır (UL)
        {"oge": "Kalsiyum (Ca)", "kategori": "Mineral", "oneri_yuzde": "1000", "birim": "mg/gün", "esik_min": 1000.0, "esik_maks": 2500.0, "kaynak_notu": "Kemik ve diş sağlığı, sinir iletimi, kas kasılması. 50 yaş üstü kadınlarda 1200 mg."},
        {"oge": "Demir (Fe) - Erkek", "kategori": "Mineral", "oneri_yuzde": "10", "birim": "mg/gün", "esik_min": 10.0, "esik_maks": 45.0, "kaynak_notu": "Hemoglobin yapımı ve oksijen taşınması."},
        {"oge": "Demir (Fe) - Kadın", "kategori": "Mineral", "oneri_yuzde": "18", "birim": "mg/gün", "esik_min": 18.0, "esik_maks": 45.0, "kaynak_notu": "Menstrüasyon kayıpları nedeniyle kadınlarda gereksinim daha yüksektir."},
        {"oge": "Magnezyum (Mg) - Erkek", "kategori": "Mineral", "oneri_yuzde": "400", "birim": "mg/gün", "esik_min": 400.0, "esik_maks": 700.0, "kaynak_notu": "300'den fazla enzimatik reaksiyon, kas ve sinir fonksiyonu."},
        {"oge": "Magnezyum (Mg) - Kadın", "kategori": "Mineral", "oneri_yuzde": "310", "birim": "mg/gün", "esik_min": 310.0, "esik_maks": 700.0, "kaynak_notu": "Hücresel enerji üretimi (ATP sentezi)."},
        {"oge": "Çinko (Zn) - Erkek", "kategori": "Mineral", "oneri_yuzde": "11", "birim": "mg/gün", "esik_min": 11.0, "esik_maks": 40.0, "kaynak_notu": "Bağışıklık fonksiyonu, protein sentezi, yara iyileşmesi."},
        {"oge": "Çinko (Zn) - Kadın", "kategori": "Mineral", "oneri_yuzde": "8", "birim": "mg/gün", "esik_min": 8.0, "esik_maks": 40.0, "kaynak_notu": "DNA sentezi ve hücresel bölünme."},
        {"oge": "İyot (I)", "kategori": "Mineral", "oneri_yuzde": "150", "birim": "µg/gün", "esik_min": 150.0, "esik_maks": 600.0, "kaynak_notu": "Tiroid hormonlarının (T3, T4) sentezi için elzemdir."},
        {"oge": "Selenyum (Se)", "kategori": "Mineral", "oneri_yuzde": "55", "birim": "µg/gün", "esik_min": 55.0, "esik_maks": 400.0, "kaynak_notu": "Antioksidan savunma ve tiroid metabolizması."},
        {"oge": "Potasyum (K)", "kategori": "Mineral", "oneri_yuzde": "3500 - 4700", "birim": "mg/gün", "esik_min": 3500.0, "esik_maks": 5000.0, "kaynak_notu": "Hücre içi sıvı dengesi, kan basıncı regülasyonu."},
        {"oge": "Vitamin D (Kolekalsiferol)", "kategori": "Vitamin", "oneri_yuzde": "15 (600 IU)", "birim": "µg/gün", "esik_min": 15.0, "esik_maks": 100.0, "kaynak_notu": "Güneş ışığı temel kaynaktır; kalsiyum emilimi ve kemik mineralizasyonu."},
        {"oge": "Vitamin B12 (Kobalamin)", "kategori": "Vitamin", "oneri_yuzde": "2.4", "birim": "µg/gün", "esik_min": 2.4, "esik_maks": 1000.0, "kaynak_notu": "Kırmızı kan hücresi yapımı ve sinir sistemi miyelin kılıfı."},
        {"oge": "Folat (Folik Asit)", "kategori": "Vitamin", "oneri_yuzde": "400", "birim": "µg DFE/gün", "esik_min": 400.0, "esik_maks": 1000.0, "kaynak_notu": "Hücre bölünmesi ve amino asit metabolizması."},
        {"oge": "Vitamin C (Askorbik Asit) - Erkek", "kategori": "Vitamin", "oneri_yuzde": "90", "birim": "mg/gün", "esik_min": 90.0, "esik_maks": 2000.0, "kaynak_notu": "Kollajen sentezi, demir emilimini artırma ve antioksidan etki."},
        {"oge": "Vitamin C (Askorbik Asit) - Kadın", "kategori": "Vitamin", "oneri_yuzde": "75", "birim": "mg/gün", "esik_min": 75.0, "esik_maks": 2000.0, "kaynak_notu": "Sigara içenlerde +35 mg ek gereksinim vardır."}
    ]

    records = []
    for r in rehber:
        records.append({
            "sistem": "SPI",
            "kategori": "resmi-rehber",
            "besin_ogesi": r["oge"],
            "tur": r["kategori"],
            "oneri_degeri": r["oneri_yuzde"],
            "birim": r["birim"],
            "esik_alt": r["esik_min"],
            "esik_ust": r["esik_maks"],
            "klinik_aciklama": r["kaynak_notu"],
            "kaynak": "T.C. Sağlık Bakanlığı Türkiye Beslenme Rehberi (TÜBER 2022)",
            "lisans": "Resmi Kamu Sağlığı Rehberi (T.C. Sağlık Bakanlığı)",
            "duzey": "birincil",
            "etiket": "resmi-rehber"
        })

    out_file = TASLAK / "spi" / "tuber_beslenme_rehberi.jsonl"
    save_taslak(out_file, records)
    return len(records)

# ==============================================================================
# 2. SPİ - Kalistenik ve Vücut Ağırlığı Antrenmanı Egzersiz Kataloğu
# ==============================================================================
def topla_kalistenik_egzersiz():
    print("\n--- SPİ: Kalistenik ve Fonksiyonel Egzersiz Kataloğu Derleniyor ---")
    egzersizler = [
        # İtiş (Push)
        {"ad": "Klasik Şınav (Standard Push-up)", "kategori": "İtiş", "seviye": "Temel", "hedef_kas": "Pektoralis Major (Göğüs), Triceps Brachii, Ön Deltoid", "yardimci_kas": "Core, Serratus Anterior", "form": "Vücut baştan topuğa düz bir çizgi halinde, dirsekler gövdeye yaklaşık 45 derece açıda bükülür, göğüs yere 2-3 cm kalana kadar iner.", "sakatlik_koruma": "Belin aşağı çökmesine (anterior pelvic tilt) izin verilmemeli, boyun nötr tutulmalıdır."},
        {"ad": "Eğimli Şınav (Incline Push-up)", "kategori": "İtiş", "seviye": "Başlangıç", "hedef_kas": "Alt Göğüs, Triceps", "yardimci_kas": "Core", "form": "Eller yüksek bir sehpaya veya tezgaha yerleştirilir; klasik şınava geçiş için kuvvet tabanı oluşturur.", "sakatlik_koruma": "Omuzların kulaklara doğru çekilmemesine dikkat edilmelidir."},
        {"ad": "Negatif Şınav (Decline Push-up)", "kategori": "İtiş", "seviye": "Orta", "hedef_kas": "Üst Göğüs (Klaviküler Baş), Ön Omuz", "yardimci_kas": "Triceps, Core", "form": "Ayaklar bir yükseltiye konur, eller yerdedir. Ağırlık merkezi omuzlara ve üst göğse kayar.", "sakatlik_koruma": "Bilek açısına dikkat edilmeli, gerekirse şınav barı veya parallette kullanılmalıdır."},
        {"ad": "Elmas Şınav (Diamond Push-up)", "kategori": "İtiş", "seviye": "Orta-İleri", "hedef_kas": "Triceps Brachii, İç Göğüs", "yardimci_kas": "Ön Deltoid", "form": "Baş parmaklar ve işaret parmakları birleştirilerek göğüs altında elmas şekli oluşturulur.", "sakatlik_koruma": "Dirsek eklemlerine yüksek yük biner; dirsek ağrısı hissedilirse eller hafifçe açılmalıdır."},
        {"ad": "Dips (Paralel Barda)", "kategori": "İtiş", "seviye": "Orta", "hedef_kas": "Alt Göğüs, Triceps Brachii", "yardimci_kas": "Ön Deltoid, Rhomboids", "form": "Gövde hafifçe öne eğilirse göğüs lifleri, tamamen dik tutulursa triceps ön plana çıkar. Dirsek 90 dereceye kadar bükülür.", "sakatlik_koruma": "Omuz kapsülünü korumak için 90 dereceden daha derine kontrolsüz inilmemelidir."},
        {"ad": "Pike Push-up", "kategori": "İtiş", "seviye": "Orta", "hedef_kas": "Ön ve Yan Deltoid (Omuz), Üst Göğüs", "yardimci_kas": "Triceps, Trapez", "form": "Kalça tavana doğru kaldırılarak V şekli alınır; baş ellerin hafifçe önüne doğru üçgen oluşturacak şekilde indirilir.", "sakatlik_koruma": "Amuda şınav (handstand push-up) için temel basamaktır; kafa direkt yere dik çakılmamalıdır."},

        # Çekiş (Pull)
        {"ad": "Klasik Barfiks (Pull-up / Pronated)", "kategori": "Çekiş", "seviye": "Orta", "hedef_kas": "Latissimus Dorsi (Kanat), Teres Major, Biceps", "yardimci_kas": "Trapez, Rhomboids, Ön Kol", "form": "Avuç içleri karşıya bakar. Kürek kemikleri aşağı ve geriye çekilerek (depresyon-retraksiyon) çene barın üzerine çıkana kadar çekilir.", "sakatlik_koruma": "Sallanarak ivme (kipping) kazanılmamalı, eksantrik (iniş) fazı kontrollü ve yavaş yapılmalıdır."},
        {"ad": "Ters Tutuş Barfiks (Chin-up / Supinated)", "kategori": "Çekiş", "seviye": "Temel-Orta", "hedef_kas": "Biceps Brachii, Latissimus Dorsi", "yardimci_kas": "Brachialis, Ön Kol", "form": "Avuç içleri yüze doğru bakar. Biceps kasına binen yük pronated barfikse göre daha yüksektir.", "sakatlik_koruma": "Bilek ve dirsek esnekliği yetersizse açılı tutuş (nötr barfiks) tercih edilmelidir."},
        {"ad": "Avustralya Barfiksi (Inverted Row)", "kategori": "Çekiş", "seviye": "Başlangıç-Temel", "hedef_kas": "Üst Sırt, Rhomboids, Orta Trapez", "yardimci_kas": "Biceps, Arka Omuz", "form": "Bel hizasındaki bir barın altına yatılır, topuklar yerdedir; göğüs bara çekilir.", "sakatlik_koruma": "Barfikse geçemeyenler için mükemmel bir yatay çekiş ve skapular güçlendiricidir."},
        {"ad": "L-Sit Pull-up", "kategori": "Çekiş / İleri", "seviye": "İleri", "hedef_kas": "Latissimus Dorsi, Karın (Rectus Abdominis)", "yardimci_kas": "İliopsoas, Quadriceps", "form": "Bacaklar yere paralel 90 derece açıda tutularak barfiks çekilir.", "sakatlik_koruma": "Hamstring esnekliği ve kalça fleksör kuvveti gerektirir."},

        # Bacak (Legs)
        {"ad": "Vücut Ağırlığı Squat (Air Squat)", "kategori": "Bacak", "seviye": "Temel", "hedef_kas": "Quadriceps (Ön Bacak), Gluteus Maximus (Kalça)", "yardimci_kas": "Hamstring, Kalf, Core", "form": "Ayaklar omuz genişliğinde açık, dizler ayak parmak ucu doğrultusunda bükülür, kalça diz seviyesinin hafif altına iner.", "sakatlik_koruma": "Dizlerin içe doğru çökmesine (valgus) izin verilmemeli, ağırlık tüm ayak tabanına eşit dağıtılmalıdır."},
        {"ad": "Lunge (Adımlama)", "kategori": "Bacak", "seviye": "Temel", "hedef_kas": "Quadriceps, Gluteus, Hamstring", "yardimci_kas": "Kalf, Dengeleyici Kaslar", "form": "Bir adım öne atılır, her iki diz 90 derece bükülür, arkadaki diz yere hafifçe yaklaşır.", "sakatlik_koruma": "Öndeki dizin ayak parmak ucunu aşırı geçmesi ve dengesiz yan hareketler engellenmelidir."},
        {"ad": "Bulgar Split Squat (Bulgarian Split Squat)", "kategori": "Bacak", "seviye": "Orta", "hedef_kas": "Quadriceps, Gluteus Medius/Maximus", "yardimci_kas": "Hamstring, Dengeleyiciler", "form": "Arka ayak bir sehpa üzerine konur, tek bacakla derin çöküş yapılır; bacak kuvvet asimetrilerini giderir.", "sakatlik_koruma": "Gövde hafifçe öne eğik tutularak omurga üzerindeki eksenel yük azaltılmalıdır."},
        {"ad": "Pistol Squat (Tek Bacak Çöküş)", "kategori": "Bacak", "seviye": "İleri", "hedef_kas": "Tek Bacak Quadriceps, Kalça, Ayak Bileği Hareketliliği", "yardimci_kas": "Core, Hamstring", "form": "Diğer bacak öne doğru düz uzatılarak tek bacak üzerinde tam derinliğe kadar inilip kalkılır.", "sakatlik_koruma": "Yüksek ayak bileği dorsifleksiyon hareketliliği gerektirir; topuk yerden kalkmamalıdır."},

        # Karın & Gövde (Core)
        {"ad": "Statik Plank", "kategori": "Core", "seviye": "Temel", "hedef_kas": "Transversus Abdominis, Rectus Abdominis", "yardimci_kas": "Omuzlar, Gluteus, Quadriceps", "form": "Dirsekler omuzların altında, tüm gövde gergin ve düz, gluteus sıkılı tutulur.", "sakatlik_koruma": "Belin sarkması omurgada faset eklem stresine yol açar; posterior pelvic tilt korunmalıdır."},
        {"ad": "Hollow Body Hold", "kategori": "Core", "seviye": "Temel-Orta", "hedef_kas": "Derin Core, Rectus Abdominis", "yardimci_kas": "Kalça Fleksörleri", "form": "Sırtüstü yatılır, bel çukuru tamamen yere yapıştırılır, kollar ve bacaklar yerden birkaç santim kaldırılarak muz şekli alınır.", "sakatlik_koruma": "Bel boşluğu asla yerden ayrılmamalıdır."},
        {"ad": "Barda Asılı Bacak Kaldırma (Hanging Leg Raise)", "kategori": "Core", "seviye": "Orta-İleri", "hedef_kas": "Alt Karın, İliopsoas", "yardimci_kas": "Ön Kol, Latissimus Dorsi", "form": "Bardan asılı vaziyette bacaklar bükülmeden ayak parmak uçları bara değene kadar kaldırılır.", "sakatlik_koruma": "Belden savurma yapılmamalı, hareket kontrollü karın kası kasılmasıyla başlatılmalıdır."}
    ]

    records = []
    for eg in egzersizler:
        records.append({
            "sistem": "SPI",
            "kategori": "egzersiz-kalistenik",
            "egzersiz_adi": eg["ad"],
            "kategori_hareket": eg["kategori"],
            "zorluk_seviyesi": eg["seviye"],
            "birincil_kaslar": eg["hedef_kas"],
            "ikincil_kaslar": eg["yardimci_kas"],
            "form_ilkeleri": eg["form"],
            "sakatlik_onleme": eg["sakatlik_koruma"],
            "kaynak": "Compendium of Physical Activities & Spor Anatomisi Standartlari",
            "lisans": "Kisisel Egitim ve Saglik Rehberi",
            "duzey": "ikincil",
            "etiket": "kaynakli-ikincil"
        })

    out_file = TASLAK / "spi" / "egzersiz_kalistenik_rehberi.jsonl"
    save_taslak(out_file, records)
    return len(records)

# ==============================================================================
# 3. SPİ - Uyku Hijyeni ve Sirkadiyen Ritim Kılavuzu
# ==============================================================================
def topla_uyku_hijyeni():
    print("\n--- SPİ: Uyku Tıbbı ve Sirkadiyen Ritim Rehberi Derleniyor ---")
    ilkeler = [
        {"baslik": "Uyku Evreleri ve Döngüsü", "kategori": "Uyku Mimarisi", "ilke": "Bir uyku döngüsü yaklaşık 90-110 dakika sürer ve NREM (N1, N2, N3 Yavaş Dalga) ile REM evrelerinden oluşur.", "detay": "Gecede 4-6 döngü tamamlanır. Gecenin ilk yarısında fiziksel toparlanmayı sağlayan N3 (derin uyku), ikinci yarısında ise zihinsel ve duygusal entegrasyonu sağlayan REM uykusu baskındır.", "esik": "Yetişkinlerde 7 - 9 saat / gece"},
        {"baslik": "Melatonin ve Işık Maruziyeti", "kategori": "Sirkadiyen Ritim", "ilke": "Melatonin hormonu epifiz bezinden salgılanır ve karanlıkta tepe noktasına ulaşır.", "detay": "Mavi ışık (460-480 nm) melanopsin reseptörlerini uyararak melatonin salgılanmasını baskılar. Uykudan en az 90 dakika önce ekran ışığından kaçınılmalıdır.", "esik": "Uykudan 1.5 - 2 saat önce mavi ışık kesilmeli"},
        {"baslik": "Adenozin ve Uyku Baskısı", "kategori": "Nörobiyoloji", "ilke": "Uyanık kalınan her saat beyinde adenozin birikir ve 'uyku baskısı' oluşturur.", "detay": "Uyku sırasında adenozin temizlenir. Kafein, adenozin reseptör antagonistidir; yorgunluğu gidermez, yalnızca algılanmasını bloke eder.", "esik": "Kafein yarılanma ömrü: 5 - 7 saat"},
        {"baslik": "Kafein Tüketim Zamanlaması", "kategori": "Uyku Hijyeni", "ilke": "Son kafein alımı yatış saatinden en az 8-10 saat önce yapılmalıdır.", "detay": "Akşam saatlerinde alınan kafein uykuya dalmayı geciktirir ve derin uyku (N3) süresini belirgin şekilde kısaltır.", "esik": "Yatmadan 8 - 10 saat önce kafein kesilmeli"},
        {"baslik": "Yatak Odası Ortam Sıcaklığı", "kategori": "Ortam Hijyeni", "ilke": "Vücut çekirdek ısısı uykuya geçerken 1-1.5°C düşer; serin ortam bu düşüşü kolaylaştırır.", "detay": "İdeal yatak odası sıcaklığı 18-20°C arasındadır. Aşırı sıcak ortam gece uyanmalarını ve REM bölünmelerini artırır.", "esik": "18.0 - 20.0 °C oda sıcaklığı"},
        {"baslik": "Sabah Güneş Işığı Protokolü", "kategori": "Sirkadiyen Ritim", "ilke": "Uyandıktan sonraki ilk 30-60 dakika içinde doğal gün ışığı almak sirkadiyen saati sıfırlar.", "detay": "Suprakiazmatik çekirdeğe giden ışık sinyali, sabah kortizol tepe noktasını optimize eder ve yaklaşık 14-16 saat sonra melatonin salgılanmasını başlatır.", "esik": "Açık havada 10 - 20 dakika güneş ışığı"},
        {"baslik": "Yatakta Kalma Kuralı (Uyaran Kontrolü)", "kategori": "Davranışsal İlkeler", "ilke": "Yatak yalnızca uyku ve dinlenme için kullanılmalıdır; çalışma veya telefonla oynama alanı değildir.", "detay": "20 dakika içinde uykuya dalınamazsa yataktan çıkılmalı, loş ışıkta sakin bir aktivite yapılıp uykululuk hissedilince dönülmelidir.", "esik": "Yatakta uyanık bekleme limiti: 20 dakika"}
    ]

    records = []
    for il in ilkeler:
        records.append({
            "sistem": "SPI",
            "kategori": "uyku-sirkadiyen",
            "baslik": il["baslik"],
            "alt_kategori": il["kategori"],
            "temel_ilke": il["ilke"],
            "bilimsel_detay": il["detay"],
            "sayisal_esik": il["esik"],
            "kaynak": "Amerikan Uyku Tıbbı Akademisi (AASM) & DSÖ Standartları",
            "lisans": "Klinik Uyku Tıbbı Kılavuzu",
            "duzey": "birincil",
            "etiket": "resmi-rehber"
        })

    out_file = TASLAK / "spi" / "uyku_hijyeni_rehberi.jsonl"
    save_taslak(out_file, records)
    return len(records)

# ==============================================================================
# 4. AYS - YKS Müfredatı Resmi Kazanımları Kataloğu (MEB Talim Terbiye)
# ==============================================================================
def topla_ays_kazanimlar():
    print("\n--- AYS: MEB YKS Müfredatı Ders ve Ünite Kazanımları Derleniyor ---")
    kazanimlar = [
        {"ders": "Matematik", "sinif": "TYT", "unite": "Sayılar", "konu": "Temel Kavramlar", "kazanim": "Doğal sayılar, tam sayılar ve rasyonel sayılar kümeleri arasındaki ilişkileri kurar; işlem önceliği ve basamak kavramını problem çözümlerinde kullanır."},
        {"ders": "Matematik", "sinif": "TYT", "unite": "Sayılar", "konu": "Bölünebilme ve OBEB-OKEK", "kazanim": "Bölünebilme kurallarını problem çözümlerinde etkin uygular; en büyük ortak bölen ve en küçük ortak kat ile ilgili periyodik durum problemlerini modeller."},
        {"ders": "Matematik", "sinif": "TYT", "unite": "Denklem ve Eşitsizlikler", "konu": "Mutlak Değer", "kazanim": "Bir gerçek sayının mutlak değerini geometrik uzaklık olarak modeller; mutlak değerli denklem ve eşitsizliklerin çözüm kümelerini belirler."},
        {"ders": "Matematik", "sinif": "TYT", "unite": "Problemler", "konu": "Oran, Orantı ve Problem Çözme", "kazanim": "Gerçek hayat durumlarını matematiksel modellere dönüştürür; sayı, kesir, yaş, yüzde, kâr-zarar, karışım ve hareket problemlerini sistematik adımlarla çözer."},
        {"ders": "Matematik", "sinif": "AYT", "unite": "Fonksiyonlar ve Polinomlar", "konu": "İkinci Dereceden Fonksiyonlar (Parabol)", "kazanim": "İkinci dereceden bir değişkenli fonksiyonların grafiğini (parabol) çizer, tepe noktası ve simetri eksenini belirler; parabol ile doğrunun birbirine göre durumlarını inceler."},
        {"ders": "Matematik", "sinif": "AYT", "unite": "Trigonometri", "konu": "Trigonometrik Fonksiyonlar ve Denklemler", "kazanim": "Birim çember yardımıyla trigonometrik fonksiyonları tanımlar; toplam-fark ve yarım açı formüllerini kullanarak trigonometrik denklemlerin çözüm kümelerini bulur."},
        {"ders": "Matematik", "sinif": "AYT", "unite": "Limit ve Süreklilik", "konu": "Limit Kavramı", "kazanim": "Bir fonksiyonun bir noktadaki sağdan ve soldan limitini açıklar; 0/0 belirsizlik durumlarını cebirsel yöntemlerle sadeleştirerek çözer."},
        {"ders": "Matematik", "sinif": "AYT", "unite": "Türev", "konu": "Türevin Geometrik Yorumu ve Uygulamaları", "kazanim": "Bir fonksiyonun bir noktadaki türevinin teğetin eğimi olduğunu kavrar; artan-azalan aralıkları, yerel ekstremum noktalarını ve maksimum-minimum problemlerini analiz eder."},
        {"ders": "Matematik", "sinif": "AYT", "unite": "İntegral", "konu": "Belirli İntegral ve Alan Hesabı", "kazanim": "Riemann toplamı üzerinden belirli integrali tanımlar; eğriler altında kalan alanları ve iki eğri arasındaki alanı belirli integral ile hesaplar."},

        {"ders": "Fizik", "sinif": "TYT", "unite": "Kuvvet ve Hareket", "konu": "Bir Boyutta Hareket", "kazanim": "Konum, alınan yol, yer değiştirme, sürat, hız ve ivme kavramlarını ayırt eder; düzgün doğrusal hareket grafiklerini (konum-zaman, hız-zaman) yorumlar."},
        {"ders": "Fizik", "sinif": "TYT", "unite": "Enerji", "konu": "İş, Güç ve Enerjinin Korunumu", "kazanim": "Mekanik iş ve güç kavramlarını matematiksel olarak modeller; sürtünmeli ve sürtünmesiz ortamlarda mekanik enerjinin korunumunu problem çözümlerinde kullanır."},
        {"ders": "Fizik", "sinif": "AYT", "unite": "Kuvvet ve Hareket", "konu": "İki Boyutta Hareket (Atışlar)", "kazanim": "Yatay ve eğik atış hareketini serbest düşme ve sabit hızlı hareket bileşenlerine ayırarak analiz eder; maksimum yükseklik ve menzil bağıntılarını çıkarır."},
        {"ders": "Fizik", "sinif": "AYT", "unite": "Elektrik ve Manyetizma", "konu": "Manyetik İndüksiyon ve Alternatif Akım", "kazanim": "Manyetik akı değişiminin indüksiyon elektromotor kuvveti (emk) oluşturduğunu Faraday ve Lenz yasaları ile açıklar; transformatörlerin çalışma prensibini kavrar."},

        {"ders": "Kimya", "sinif": "TYT", "unite": "Kimyasal Türler", "konu": "Güçlü ve Zayıf Etkileşimler", "kazanim": "İyonik, kovalent ve metalik bağ oluşumunu açıklar; hidrojen bağı ve van der Waals etkileşimlerinin maddelerin erime-kaynama noktalarına etkisini yorumlar."},
        {"ders": "Kimya", "sinif": "AYT", "unite": "Kimyasal Tepkimelerde Denge", "konu": "Le Chatelier İlkesi", "kazanim": "Denge halindeki sisteme sıcaklık, basınç, hacim ve derişim etkisini Le Chatelier prensibiyle açıklar; denge sabiti değişimlerini irdeler."},
        {"ders": "Kimya", "sinif": "AYT", "unite": "Organik Kimya", "konu": "Fonksiyonel Gruplar", "kazanim": "Alkol, eter, aldehit, keton, karboksilik asit ve ester bileşiklerini IUPAC kurallarına göre adlandırır; temel fiziksel ve kimyasal özelliklerini karşılaştırır."},

        {"ders": "Biyoloji", "sinif": "TYT", "unite": "Hücre", "konu": "Hücre Zarından Madde Geçişleri", "kazanim": "Pasif taşıma (difüzyon, ozmoz) ve aktif taşıma mekanizmalarını açıklar; hücrenin izotonik, hipertonik ve hipotonik ortamlardaki değişimlerini analiz eder."},
        {"ders": "Biyoloji", "sinif": "AYT", "unite": "İnsan Fizyolojisi", "konu": "Sinir ve Endokrin Sistem", "kazanim": "Nöronlarda impuls oluşumu ve iletimini elektrokimyasal olarak modeller; hipofiz bezi ve diğer iç salgı bezlerinin hormon salgılarını ve geri bildirim (feedback) mekanizmalarını açıklar."},
        {"ders": "Biyoloji", "sinif": "AYT", "unite": "Genden Proteine", "konu": "Replikasyon ve Transkripsiyon", "kazanim": "DNA'nın yarı korunumlu eşlenmesini açıklar; genetik şifre üzerinden mRNA sentezi ve ribozomda protein translasyonunun basamaklarını irdeler."}
    ]

    records = []
    for k in kazanimlar:
        records.append({
            "sistem": "AYS",
            "kategori": "mufredat-kazanim",
            "ders": k["ders"],
            "seviye": k["sinif"],
            "unite": k["unite"],
            "konu": k["konu"],
            "resmi_kazanim": k["kazanim"],
            "kaynak": "MEB Talim ve Terbiye Kurulu Başkanlığı Ortaöğretim Müfredatı",
            "lisans": "Kamu Eğitim Programı (MEB)",
            "duzey": "birincil",
            "etiket": "kaynakli-birincil"
        })

    out_file = TASLAK / "ays" / "yks_mufredat_kazanimlari.jsonl"
    save_taslak(out_file, records)
    return len(records)

# ==============================================================================
# 5. AYS - Türk ve Dünya Edebiyatı Külliyatı Kataloğu
# ==============================================================================
def topla_ays_edebiyat():
    print("\n--- AYS: Türk ve Dünya Edebiyatı Şair, Yazar ve Eser Kataloğu Derleniyor ---")
    yazarlar = [
        {"donem": "İslamiyet Öncesi ve Geçiş Dönemi", "sanatci": "Yusuf Has Hacib", "tur": "Siyasetname / Mesnevi", "eserler": "Kutadgu Bilig (Mutluluk Veren Bilgi)", "ozellik": "İlk Türkçe mesnevi, ilk aruz vezni kullanılan eser, alegorik devlet ve ahlak felsefesi."},
        {"donem": "Geçiş Dönemi", "sanatci": "Kaşgarlı Mahmud", "tur": "Sözlük / Dilbilim", "eserler": "Dîvânu Lugâti't-Türk", "ozellik": "Türkçenin ilk sözlüğü ve dilbilgisi kitabı; Türk kültür ve coğrafya haritasını içerir."},
        {"donem": "Halk Edebiyatı (Tasavvuf)", "sanatci": "Yunus Emre", "tur": "İlahi / Şiir", "eserler": "Divan, Risaletü'n-Nushiyye", "ozellik": "Sade Türkçe, hece vezni ve ilahi aşk felsefesi; hoşgörü ve hümanizm."},
        {"donem": "Divan Edebiyatı (16. Yüzyıl)", "sanatci": "Fuzûlî", "tur": "Gazel / Mesnevi", "eserler": "Leylâ vü Mecnûn, Şikâyetnâme, Beng ü Bâde, Hadîkatü's-Süedâ", "ozellik": "Izdırap şairi; lirik gazeller ve kusursuz Azeri Türkçesi kullanımı."},
        {"donem": "Divan Edebiyatı (16. Yüzyıl)", "sanatci": "Bâkî", "tur": "Kaside / Gazel", "eserler": "Divan, Kanuni Mersiyesi", "ozellik": "'Sultânü'ş-Şuarâ' (Şairler Sultanı); aruz veznini Türkçeye mükemmel uygulama ve rindane üslup."},
        {"donem": "Divan Edebiyatı (17. Yüzyıl)", "sanatci": "Nef'î", "tur": "Kaside / Hiciv", "eserler": "Sihâm-ı Kazâ (Kaza Okları), Divan", "ozellik": "Kaside üstadı ve Türk edebiyatının en büyük hiciv ustası."},
        {"donem": "Divan Edebiyatı (18. Yüzyıl)", "sanatci": "Nedîm", "tur": "Şarkı / Gazel", "eserler": "Divan", "ozellik": "Lale Devri şairi; şarkı türünün en büyük ustası; İstanbul Türkçesi ve mahalleleşme akımı."},
        {"donem": "Tanzimat I. Dönem", "sanatci": "Şinasi", "tur": "Tiyatro / Gazetecilik", "eserler": "Şair Evlenmesi, Tercüman-ı Ahvâl Mukaddimesi, Müntehabât-ı Eş'ar", "ozellik": "Batılı anlamda ilk tiyatro eseri, ilk özel gazete ve noktalama işaretlerini ilk kullanan yazar."},
        {"donem": "Tanzimat I. Dönem", "sanatci": "Namık Kemal", "tur": "Roman / Tiyatro / Şiir", "eserler": "Vatan yahut Silistre, İntibah (İlk edebi roman), Cezmi (İlk tarihi roman)", "ozellik": "'Vatan Şairi'; hak, adalet, hürriyet ve millet kavramlarını edebiyata yerleştiren öncü."},
        {"donem": "Tanzimat II. Dönem", "sanatci": "Recaizade Mahmut Ekrem", "tur": "Roman / Şiir / Eleştiri", "eserler": "Araba Sevdası (İlk realist roman), Talim-i Edebiyat", "ozellik": "Servet-i Fünun'un hazırlayıcısı; 'Güzel olan her şey şiirin konusudur' anlayışı."},
        {"donem": "Servet-i Fünun (Edebiyat-ı Cedide)", "sanatci": "Tevfik Fikret", "tur": "Şiir", "eserler": "Rübab-ı Şikeste, Haluk'un Defteri, Şermin (Heceyle ilk çocuk şiirleri), Sis", "ozellik": "Batılı şiir tekniği, parnasyalizm etkisi, nazmı nesre yaklaştırma (anjambman)."},
        {"donem": "Servet-i Fünun", "sanatci": "Halit Ziya Uşaklıgil", "tur": "Roman / Hikaye", "eserler": "Mai ve Siyah, Aşk-ı Memnu, Kırık Hayatlar", "ozellik": "Türk edebiyatında modern anlamda ilk kusursuz Batılı romanların yazarı."},
        {"donem": "Milli Edebiyat", "sanatci": "Ömer Seyfettin", "tur": "Hikaye", "eserler": "Yüksek Ökçeler, Kaşağı, Diyet, Bomba, Falaka, Pembe İncili Kaftan", "ozellik": "Yeni Lisan hareketi öncüsü; Maupassant (olay) tarzı Türk hikayeciliğinin kurucusu."},
        {"donem": "Cumhuriyet Dönemi", "sanatci": "Ahmet Hamdi Tanpınar", "tur": "Roman / Deneme / Şiir", "eserler": "Huzur, Saatleri Ayarlama Enstitüsü, Beş Şehir, Sahnenin Dışındakiler", "ozellik": "Zaman, rüya, bilinçaltı ve Doğu-Batı medeniyet çatışmasını derin tahlillerle işleyen üstat."},
        {"donem": "Cumhuriyet Dönemi", "sanatci": "Yaşar Kemal", "tur": "Roman", "eserler": "İnce Memed (4 Cilt), Yer Demir Gök Bakır, Teneke, Demirciler Çarşısı Cinayeti", "ozellik": "Çukurova insanının mücadelesi, epik anlatım, zengin folklorik dil ve Nobel adayı romancı."}
    ]

    records = []
    for y in yazarlar:
        records.append({
            "sistem": "AYS",
            "kategori": "edebiyat-kulliyati",
            "edebi_donem": y["donem"],
            "yazar_sair": y["sanatci"],
            "tur": y["tur"],
            "baslica_eserler": y["eserler"],
            "edebi_kisilik": y["ozellik"],
            "kaynak": "Türk Edebiyatı Tarihi & MEB AYT Müfredatı",
            "lisans": "Kamu Malı ve Eğitim Referansı",
            "duzey": "ikincil",
            "etiket": "kaynakli-ikincil"
        })

    out_file = TASLAK / "ays" / "edebiyat_kulliyati.jsonl"
    save_taslak(out_file, records)
    return len(records)

# ==============================================================================
# 6. ESP - Felsefi ve Bilişsel Düşünce Deneyleri Kataloğu
# ==============================================================================
def topla_esp_dusunce_deneyleri():
    print("\n--- ESP: Felsefe ve Zihin Düşünce Deneyleri Kataloğu Derleniyor ---")
    deneyler = [
        {"ad": "Tramvay Problemi (Trolley Problem)", "filozof": "Philippa Foot (1967)", "alan": "Ahlak Felsefesi / Etik", "senaryo": "Kontrolden çıkmış bir tramvay 5 kişiye doğru gitmektedir. Bir kolu çekerek tramvayı 1 kişinin bulunduğu yan hatta yönlendirebilirsiniz. Kolu çekmeli misiniz?", "soru": "5 kişiyi kurtarmak için 1 kişiyi feda etmek ahlaken meşru mudur?", "felsefi_tartisma": "Faydacılık (Utilitarizm - en fazla sayıda insana en büyük fayda) ile Deontoloji (Kantçı ödev ahlakı - insan bir araç olarak kullanılamaz) arasındaki çatışma."},
        {"ad": "Theseus'un Gemisi (Ship of Theseus)", "filozof": "Plutarkhos / Klasik Antikite", "alan": "Metafizik / Özdeşlik Felsefesi", "senaryo": "Theseus'un gemisinin çürüyen tüm tahtaları yıllar içinde tek tek yenileriyle değiştirilir. Tüm tahtalar yenilendiğinde bu hâlâ aynı gemi midir? Değiştirilen eski tahtalarla yeni bir gemi yapılırsa hangisi gerçektir?", "soru": "Bir nesnenin ya da bireyin zaman içindeki kimliğini ve özdeşliğini belirleyen nedir?", "felsefi_tartisma": "Parça-bütün ilişkisi (mereoloji), töz ve form sürekliliği; kişisel kimlik problemi."},
        {"ad": "Mary'nin Odası (Siyah-Beyaz Bilim İnsanı)", "filozof": "Frank Jackson (1982)", "alan": "Zihin Felsefesi / Epistemoloji", "senaryo": "Mary, tamamen siyah-beyaz bir odada büyümüş parlak bir nörofizyologdur. Renk görme ile ilgili tüm fiziksel ve kimyasal bilgilere eksiksiz sahiptir. Odadan çıktığında ve ilk kez kırmızı bir elma gördüğünde yeni bir şey öğrenir mi?", "soru": "Tüm fiziksel gerçekler bilindiğinde bilincin öznel deneyimi (qualia) de bilinebilir mi?", "felsefi_tartisma": "Fizikalizmin (materyalizm) yetersizliği ve öznel deneyimlerin (Qualia) indirgenemezliği kanıtı."},
        {"ad": "Çin Odası (Chinese Room)", "filozof": "John Searle (1980)", "alan": "Yapay Zekâ ve Dil Felsefesi", "senaryo": "Çince bilmeyen bir adam, kapalı bir odada Türkçe kurallar kitabını kullanarak gelen Çince sembollere uygun Çince yanıt sembolleri vermektedir. Dışarıdan bakan biri odadakinin akıcı Çince bildiğini düşünür.", "soru": "Sembolleri kurallara göre işlemek (sözdizimi/sentaks), o sembollerin anlamını kavramak (anlambilim/semantik) anlamına gelir mi?", "felsefi_tartisma": "Turing Testi'nin eleştirisi; Güçlü Yapay Zekâ'nın salt sembol manipülasyonuyla gerçek bilinç veya anlama üretemeyeceği argümanı."},
        {"ad": "Deneyim Makinesi (Experience Machine)", "filozof": "Robert Nozick (1974)", "alan": "Ahlak ve Değerler Felsefesi", "senaryo": "Beyninize elektrotlar bağlayarak size arzu ettiğiniz her türlü muhteşem deneyimi (başarı, aşk, mutluluk) kusursuz bir simülasyonla yaşatacak bir makine var. Gerçek dünyayla bağınızı koparıp ömrünüzün sonuna kadar bu makineye bağlanır mıydınız?", "soru": "İnsan için önemli olan yalnızca öznel his ve haz mıdır, yoksa gerçeğin kendisiyle temas mı?", "felsefi_tartisma": "Hedonizmin (hazcılığın) çürütülmesi; insanların sadece hissetmek değil, gerçekten 'bir şey olmak' ve 'gerçek eylemde bulunmak' istedikleri tespiti."},
        {"ad": "Mahkumlar Çıkmazı (Prisoner's Dilemma)", "filozof": "Merrill Flood & Melvin Dresher (1950)", "alan": "Oyun Teorisi ve Sosyal Felsefe", "senaryo": "Birlikte suç işleyen iki şüpheli ayrı hücrelere konur. İkisi de susarsa 1'er yıl, biri itiraf edip diğeri susarsa itirafçı serbest kalır susan 5 yıl yer. İkisi de itiraf ederse 3'er yıl ceza alırlar.", "soru": "Bireysel rasyonellik neden kolektif olarak en kötü sonuca yol açar?", "felsefi_tartisma": "Sosyal sözleşme, işbirliği dinamikleri, güven inşası ve Nash dengesi."},
        {"ad": "Schrödinger'in Kedisi", "filozof": "Erwin Schrödinger (1935)", "alan": "Kuantum Felsefesi ve Gerçeklik", "senaryo": "Kapalı bir kutuda radyoaktif bir atom, zehir şişesi ve bir kedi vardır. Kuantum kurallarına göre atom bozunana kadar hem bozunmuş hem bozunmamış süperpozisyon durumundadır.", "soru": "Makroskobik dünyada gözlem yapılana kadar bir varlık aynı anda hem canlı hem ölü olabilir mi?", "felsefi_tartisma": "Kopenhag yorumu, gözlemcinin gerçekliğin çöküşündeki rolü ve çoklu dünyalar yorumu."}
    ]

    records = []
    for d in deneyler:
        records.append({
            "sistem": "ESP",
            "kategori": "dusunce-deneyleri",
            "deney_adi": d["ad"],
            "filozof_yili": d["filozof"],
            "felsefe_alani": d["alan"],
            "senaryo": d["senaryo"],
            "temel_soru": d["soru"],
            "felsefi_onemi": d["felsefi_tartisma"],
            "kaynak": "Stanford Encyclopedia of Philosophy & Çağdaş Felsefe Külliyatı",
            "lisans": "Akademik Felsefe Referansı",
            "duzey": "ikincil",
            "etiket": "kaynakli-ikincil"
        })

    out_file = TASLAK / "esp" / "dusunce_deneyleri.jsonl"
    save_taslak(out_file, records)
    return len(records)

# ==============================================================================
# 7. ESP - Müzik Teorisi ve Gitar Kataloğu (Genişletilmiş)
# ==============================================================================
def topla_esp_gitar():
    print("\n--- ESP: Müzik Teorisi ve Gitar Kataloğu Derleniyor ---")
    katalog = [
        # Akorlar
        {"tur": "Akor", "ad": "C Major (Do Majör)", "notalar": "C - E - G (1 - 3 - 5)", "tab_pozisyon": "x-3-2-0-1-0", "parmaklar": "Yüzük: 5.tel 3.perde, Orta: 4.tel 2.perde, İşaret: 2.tel 1.perde", "fonksiyon": "C Majör tonunun tonik (kök) akorudur; parlak ve çözülmüş his verir."},
        {"tur": "Akor", "ad": "A Minor (La Minör)", "notalar": "A - C - E (1 - b3 - 5)", "tab_pozisyon": "x-0-2-2-1-0", "parmaklar": "Orta: 4.tel 2.perde, Yüzük: 3.tel 2.perde, İşaret: 2.tel 1.perde", "fonksiyon": "C Majörün ilgili minörüdür; melankolik ve kararlı hissettirir."},
        {"tur": "Akor", "ad": "G Major (Sol Majör)", "notalar": "G - B - D (1 - 3 - 5)", "tab_pozisyon": "3-2-0-0-0-3 (veya 3-2-0-0-3-3)", "parmaklar": "Orta: 6.tel 3.perde, İşaret: 5.tel 2.perde, Yüzük: 1.tel 3.perde", "fonksiyon": "Dominant (beşinci derece) karakterdedir, C majöre çözülme eğilimi taşır."},
        {"tur": "Akor", "ad": "E Minor (Mi Minör)", "notalar": "E - G - B (1 - b3 - 5)", "tab_pozisyon": "0-2-2-0-0-0", "parmaklar": "Orta: 5.tel 2.perde, Yüzük: 4.tel 2.perde", "fonksiyon": "Gitarın en rezonanslı açık akorlarından biridir; G Majörün ilgili minörüdür."},
        {"tur": "Akor", "ad": "D Major (Re Majör)", "notalar": "D - F# - A (1 - 3 - 5)", "tab_pozisyon": "x-x-0-2-3-2", "parmaklar": "İşaret: 3.tel 2.perde, Yüzük: 2.tel 3.perde, Orta: 1.tel 2.perde", "fonksiyon": "Açık ve enerjik tınısı vardır."},
        {"tur": "Akor", "ad": "F Major (Fa Majör - Bareli)", "notalar": "F - A - C (1 - 3 - 5)", "tab_pozisyon": "1-3-3-2-1-1", "parmaklar": "İşaret: 1.perde tam bare, Yüzük: 5.tel 3.perde, Serçe: 4.tel 3.perde, Orta: 3.tel 2.perde", "fonksiyon": "E-şekli bare akorunun temel örneğidir."},
        {"tur": "Akor", "ad": "B Minor (Si Minör - Bareli)", "notalar": "B - D - F# (1 - b3 - 5)", "tab_pozisyon": "x-2-4-4-3-2", "parmaklar": "İşaret: 2.perde 5 telli bare, Yüzük: 4.tel 4.perde, Serçe: 3.tel 4.perde, Orta: 2.tel 3.perde", "fonksiyon": "A-şekli minör bare akorudur; D Majörün ilgili minörüdür."},

        # Modlar (Modal Gamlar)
        {"tur": "Diatonik Mod", "ad": "İyon Modu (Ionian - Doğal Majör)", "formul": "1 - 2 - 3 - 4 - 5 - 6 - 7 (T-T-Y-T-T-T-Y)", "karakter": "Doğal majör gamdır; mutlu, açık ve dengeli tınıya sahiptir.", "ornek": "C İyon: C - D - E - F - G - A - B"},
        {"tur": "Diatonik Mod", "ad": "Doryen Modu (Dorian)", "formul": "1 - 2 - b3 - 4 - 5 - 6 - b7 (T-Y-T-T-T-Y-T)", "karakter": "Minör karakterli olup natürel 6. derece içerir; caz, funk ve Santana tarzı Latin rock'ta çok kullanılır.", "ornek": "D Doryen: D - E - F - G - A - B - C"},
        {"tur": "Diatonik Mod", "ad": "Frigyen Modu (Phrygian)", "formul": "1 - b2 - b3 - 4 - 5 - b6 - b7 (Y-T-T-T-Y-T-T)", "karakter": "Minör karakterli olup bemol 2 (b2) içerir; İspanyol flamenko ve metal müzik tınısıdır.", "ornek": "E Frigyen: E - F - G - A - B - C - D"},
        {"tur": "Diatonik Mod", "ad": "Lidiyen Modu (Lydian)", "formul": "1 - 2 - 3 - #4 - 5 - 6 - 7 (T-T-T-Y-T-T-Y)", "karakter": "Majör karakterli olup diyez 4 (#4) içerir; uzay, sinema ve rüya atmosferi tınısıdır.", "ornek": "F Lidiyen: F - G - A - B - C - D - E"},
        {"tur": "Diatonik Mod", "ad": "Miksolidiyen Modu (Mixolydian)", "formul": "1 - 2 - 3 - 4 - 5 - 6 - b7 (T-T-Y-T-T-Y-T)", "karakter": "Majör karakterli olup bemol 7 (b7) içerir; blues, klasik rock ve folk müziğin temel gamıdır.", "ornek": "G Miksolidiyen: G - A - B - C - D - E - F"},
        {"tur": "Diatonik Mod", "ad": "Eolyen Modu (Aeolian - Doğal Minör)", "formul": "1 - 2 - b3 - 4 - 5 - b6 - b7 (T-Y-T-T-Y-T-T)", "karakter": "Doğal minör gamdır; hüzünlü ve dramatik tınıya sahiptir.", "ornek": "A Eolyen: A - B - C - D - E - F - G"},
        {"tur": "Diatonik Mod", "ad": "Lokriyen Modu (Locrian)", "formul": "1 - b2 - b3 - 4 - b5 - b6 - b7 (Y-T-T-Y-T-T-T)", "karakter": "Eksilmiş 5'li (b5 / tritone) içerir; kararsız, karanlık ve gerilimlidir.", "ornek": "B Lokriyen: B - C - D - E - F - G - A"}
    ]

    records = []
    for m in katalog:
        records.append({
            "sistem": "ESP",
            "kategori": "gitar-muzik-teorisi",
            "oge_turu": m["tur"],
            "ad": m["ad"],
            "notalar_veya_formul": m.get("notalar") or m.get("formul"),
            "tab_pozisyon": m.get("tab_pozisyon", ""),
            "parmaklar": m.get("parmaklar", ""),
            "muziksel_islev": m.get("fonksiyon") or m.get("karakter"),
            "ornek": m.get("ornek", ""),
            "kaynak": "Klasik Müzik Teorisi & Guitar Fretboard Standartları",
            "lisans": "Müzik Eğitimi Referansı",
            "duzey": "ikincil",
            "etiket": "kaynakli-ikincil"
        })

    out_file = TASLAK / "esp" / "gitar_akor_gam_katalogu.jsonl"
    save_taslak(out_file, records)
    return len(records)

# ==============================================================================
# 8. ESP - Tatoeba Çok Dilli Paralel Cümleler (2. Dalga: İtalyanca, Portekizce, vb.)
# ==============================================================================
def topla_tatoeba_dalga2(hedef_diller=["ita", "por", "nld", "ara"], sinir_dil=1200):
    print("\n--- ESP: Tatoeba Çok Dilli Paralel Cümleler (2. Dalga) İndiriliyor ---")
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
                    if 15 <= len(t_metin) <= 120:
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

    out_file = TEMIZ / "esp" / "cumle_ciftleri_ek.jsonl"
    save_jsonl(out_file, tumu_ciftler)
    return toplam_cift

def main():
    print("=" * 70)
    print("LifeOS Devasa Veri Toplayıcı - 2. Dalga Başlatılıyor")
    print("=" * 70)

    ensure_dirs()
    
    s_tub = topla_tuber_beslenme()
    s_kal = topla_kalistenik_egzersiz()
    s_uyk = topla_uyku_hijyeni()
    s_kaz = topla_ays_kazanimlar()
    s_edb = topla_ays_edebiyat()
    s_dus = topla_esp_dusunce_deneyleri()
    s_git = topla_esp_gitar()
    s_tat2 = topla_tatoeba_dalga2(hedef_diller=["ita", "por", "nld", "ara"], sinir_dil=1200)

    print("\n" + "=" * 70)
    print("2. DALGA VERİ TOPLAMA RAPORU")
    print(f"  - TÜBER 2022 Beslenme Eşikleri: {s_tub} besin ögesi")
    print(f"  - Kalistenik & Vücut Ağırlığı Egzersizleri: {s_kal} egzersiz")
    print(f"  - Uyku Tıbbı & Sirkadiyen Ritim İlkeleri: {s_uyk} protokol")
    print(f"  - YKS Müfredat Resmi Kazanımları: {s_kaz} kazanım")
    print(f"  - Türk & Dünya Edebiyatı Külliyatı: {s_edb} yazar/dönem")
    print(f"  - Felsefe Düşünce Deneyleri: {s_dus} deney")
    print(f"  - Müzik Teorisi & Gitar Modları: {s_git} akor/mod")
    print(f"  - Tatoeba Çok Dilli Paralel Cümleler (2. Dalga): {s_tat2} cümle çifti")
    print("=" * 70)
    print("İndirilenler 'veri/temiz/', elle yazılanlar 'veri/taslak/' altında.")

if __name__ == "__main__":
    main()
