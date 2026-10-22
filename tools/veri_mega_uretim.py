#!/usr/bin/env python3
"""LifeOS Mega Veri Uretici ve Derleyici (Sabah Kontrol Paketi)
Tamamen kullanici talebi dogrultusunda:
- Mevcut sistem dosyalarina DOKUNMAZ.
- Tum verileri 'veri/yeni_veri/' altina AYS, SPI, ESP, HKM klasorlerine yazar.
- Sifir runtime bagimliligi (saf Python standart kutuphanesi).
- Listeler elle yazilmistir: kaynakla birebir dogrulanmadi, 'dogrulanmamis' etiketlenir.
- Kisi modeli alanlari brand/ortak/kisi.js'tedir; burada uretilmez.
"""
import json
import time
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
BASE = KOK / "veri" / "taslak"
AYS_DIR = BASE / "ays"
SPI_DIR = BASE / "spi"
ESP_DIR = BASE / "esp"

for d in [AYS_DIR, SPI_DIR, ESP_DIR]:
    d.mkdir(parents=True, exist_ok=True)

def write_jsonl(filepath, records):
    with open(filepath, "w", encoding="utf-8") as f:
        for r in records:
            r = dict(r)
            if "kaynak" in r:
                r["iddia_edilen_kaynak"] = r.pop("kaynak")
            r["duzey"] = "yok"
            r["etiket"] = "dogrulanmamis"
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(f"  [KAYIT] {filepath.name}: {len(records)} kayit ({filepath.stat().st_size / 1024:.1f} KB)")

# ==============================================================================
# 1. AYS - Soru Kalıpları ve Çözüm Stratejileri
# ==============================================================================
def uret_ays_soru_kaliplari():
    print("\n--- AYS: Soru Kalıpları ve Çözüm Algoritmaları Derleniyor ---")
    kaliplar = [
        # Matematik Problemleri
        {"ders": "Matematik", "alan": "TYT", "konu": "Problemler", "kalip_adi": "Sayı-Kesir: Kuyruk ve Sıra Problemleri",
         "aranan": "Kişinin baştan n. sırada, sondan m. sırada olduğu durumlar veya aradaki kişi sayısı.",
         "tuzaklar": "Kişinin kendisini iki kez saymak veya aradaki kişi sayısını hesaplarken sınırları dahil/hariç tutma hatası.",
         "algoritma": "Kuyruktaki toplam kişi = (Baştan sıra) + (Sondan sıra) - 1. Eğer arada x kişi varsa ve iki kişi yer değiştiriyorsa toplam = n + m + x veya n + m - x - 2 (öncelik sırasına göre).",
         "ornek_sablon": "Ahmet bir bilet kuyruğunda baştan 14., Mehmet ise sondan 19. sıradadır. Aralarında 4 kişi olduğuna göre kuyrukta en az / en çok kaç kişi vardır?"},
        
        {"ders": "Matematik", "alan": "TYT", "konu": "Problemler", "kalip_adi": "Yaş Problemleri: Zaman Ötelemesi",
         "aranan": "Kişilerin bugünkü yaşları ile t yıl önceki/sonraki yaşları arasındaki oranlar veya 'senin yaşına geldiğimde' kalıbı.",
         "tuzaklar": "Geçen sürenin tüm bireylere eşit eklenmemesi veya yaş farkının zamanla değiştiğinin varsayılması.",
         "algoritma": "1) İki kişi arasındaki yaş farkı (A - B) sabittir ve zamanla asla değişmez. 2) t yıl sonra her birey t yaş büyür: (A + t), (B + t). 3) 'Ben senin yaşındayken' ifadesinde geçen süre = (Mevcut yaş - Geçmiş yaş).",
         "ornek_sablon": "Bir babanın yaşı iki çocuğunun yaşları farkının 6 katıdır. 10 yıl sonra babanın yaşı çocuklarının yaşları farkının 8 katı olacağına göre babanın bugünkü yaşı kaçtır?"},

        {"ders": "Matematik", "alan": "TYT", "konu": "Problemler", "kalip_adi": "Hız-Hareket: Karşılaşma ve Yetişme",
         "aranan": "Zıt yönde birbirine doğru hareket eden (karşılaşma) veya aynı yönde arkadan gelenin öndekini yakalaması (yetişme).",
         "tuzaklar": "Birim uyuşmazlığı (km/saat ile dakika verilmesi) veya hızların toplanması/çıkarılması yönünün karıştırılması.",
         "algoritma": "1) Zıt yönlü hareket (karşılaşma): Yol = (V₁ + V₂) · t. 2) Aynı yönlü hareket (yetişme): Aradaki Mesafe = (V_hızlı - V_yavaş) · t. 3) Birim dönüşümü: 1 km/sa = 1000m / 3600s = 5/18 m/s.",
         "ornek_sablon": "A ve B kentleri arasındaki mesafe 480 km'dir. Hızları 70 km/sa ve 90 km/sa olan iki araç aynı anda birbirlerine doğru hareket ederlerse kaç saat sonra karşılaşırlar?"},

        {"ders": "Matematik", "alan": "TYT", "konu": "Problemler", "kalip_adi": "Yüzde / Kâr-Zarar: Maliyet ve Etiket Fiyatı",
         "aranan": "Maliyet, kâr, indirim ve son satış fiyatı ilişkisi.",
         "tuzaklar": "İndirimin maliyet üzerinden değil etiket fiyatı üzerinden yapıldığının unutulması; zam üstüne indirimde net kârın değişimi.",
         "algoritma": "1) Maliyeti daima 100x seç. 2) %30 karlı etiket fiyatı = 130x. 3) Etiket fiyatı üzerinden %20 indirim yapıldığında: 130x · 0.80 = 104x. 4) Net kâr = 104x - 100x = 4x (%4 kâr).",
         "ornek_sablon": "Bir satıcı bir ürünü %40 kârla etiketlendirdikten sonra etiket fiyatı üzerinden %25 indirimle satmaktadır. Satıcının bu satıştaki kâr oranı yüzde kaçtır?"},

        {"ders": "Matematik", "alan": "AYT", "konu": "Fonksiyonlar", "kalip_adi": "Simetri ve Öteleme Hareketleri",
         "aranan": "f(x) fonksiyon grafiğinin f(x±a), f(x)±b, f(-x), -f(x) dönüşümleri altındaki grafiği.",
         "tuzaklar": "f(x - a)'da grafiğin sola değil SAĞA kaydığı; f(-x)'te y eksenine göre, -f(x)'te x eksenine göre yansıma alındığı.",
         "algoritma": "1) f(x - a) -> a birim sağa. 2) f(x + a) -> a birim sola. 3) f(x) + b -> b birim yukarı. 4) f(x) - b -> b birim aşağı. 5) -f(x) -> x eksenine göre simetri. 6) f(-x) -> y eksenine göre simetri.",
         "ornek_sablon": "f(x) = x² - 4x + 1 fonksiyonunun grafiği 2 birim sola ve 3 birim yukarı ötelenirse oluşan yeni fonksiyonun denklemi nedir?"},

        {"ders": "Matematik", "alan": "AYT", "konu": "Türev", "kalip_adi": "Maksimum - Minimum Problemleri",
         "aranan": "Bir alanın, hacmin, maliyetin veya kârın alabileceği en büyük / en küçük değer.",
         "tuzaklar": "Hedef değişkeni tek bir bilinmeyene indirgeyememek veya bulunan kritik noktanın tanım kümesi sınırlarında olup olmadığını kontrol etmemek.",
         "algoritma": "1) İstenen büyüklüğü (alan, kâr vb.) tek bir değişken cinsinden ifade et: f(x). 2) Fonksiyonun türevini al: f'(x). 3) Türevi sıfıra eşitle: f'(x) = 0. 4) Kökleri bul ve işaret tablosu yaparak yerel ekstremumu belirle. 5) Kökü fonksiyonda yerine yaz.",
         "ornek_sablon": "Çevresi 36 cm olan bir dikdörtgenin alanının en büyük olması için kenar uzunlukları kaç cm olmalıdır?"},

        {"ders": "Geometri", "alan": "TYT-AYT", "konu": "Üçgenler", "kalip_adi": "Özel Dik Üçgenlerde Kenar-Açı İlişkisi",
         "aranan": "30-60-90, 45-45-90 ve 15-75-90 üçgenlerinde kenar oranları.",
         "tuzaklar": "15-75-90 üçgeninde hipotenüse inen dikmenin h = hipotenüs/4 kuralını unutmak.",
         "algoritma": "1) 30-60-90: 30'un karşısı x, 60'ın karşısı x√3, 90'ın karşısı 2x. 2) 45-45-90: dik kenarlar x, hipotenüs x√2. 3) 15-75-90: Hipotenüs = 4h (h = hipotenüse ait yükseklik).",
         "ornek_sablon": "Bir ABC dik üçgeninde m(A) = 90°, m(C) = 15° ve hipotenüs uzunluğu BC = 24 cm ise hipotenüse ait yükseklik kaç cm'dir?"},

        {"ders": "Fizik", "alan": "TYT", "konu": "Kaldırma Kuvveti", "kalip_adi": "Kaba Cisim Atıldığında Ağırlaşma Miktarı",
         "aranan": "Taşırma kabına veya normal kaba cisim atıldığında kap tabanındaki tartı ölçümünün değişimi.",
         "tuzaklar": "Yüzen ve askıda kalan cisimlerde taşırma kabında ağırlaşma olmazken, batan cisimlerde ağırlaşmanın hacimce taşan sıvı farkından kaynaklanması.",
         "algoritma": "1) Taşırma kabı doluysa: Yüzen veya askıda kalan cisim kendi ağırlığı kadar sıvı taşırır -> Kapta AĞIRLAŞMA OLMAZ. 2) Batan cisim kendi hacmi kadar sıvı taşırır (V_cisim · d_sıvı), cismin ağırlığı (V_cisim · d_cisim) daha büyük olduğundan Kap Ağırlaşması = G_cisim - F_kaldırma. 3) Taşırma kabı değilse her zaman cismin ağırlığı kadar ağırlaşır.",
         "ornek_sablon": "Özkütlesi 3 g/cm³, kütlesi 150 g olan bir cisim, taşma seviyesine kadar 1 g/cm³ özkütleli su ile dolu taşırma kabına bırakılıyor. Kapta kaç gram ağırlaşma olur?"},

        {"ders": "Kimya", "alan": "AYT", "konu": "Elektrokimya", "kalip_adi": "Aktiflik ve Metallerin Asitte Çözünmesi",
         "aranan": "Hangi metalin hangi asitle H₂ gazı çıkaracağı veya tepkime verip vermeyeceği.",
         "tuzaklar": "Soy metaller (Cu, Ag, Hg, Pt, Au) ile aktif metalleri karıştırmak; yarı soy metallerin sadece oksijenli kuvvetli asitlerle (HNO₃, H₂SO₄) tepkime verip NO₂/SO₂ gazı çıkarması.",
         "algoritma": "1) Aktif metaller (Na, K, Ca, Mg, Zn, Fe vb.): Tüm asitlerle H₂ gazı çıkarır. 2) Yarı soy metaller (Cu, Ag, Hg): HCl, HBr ile tepkime vermez! Yalnızca HNO₃ (NO veya NO₂ gazı) ve derişik H₂SO₄ (SO₂ gazı) ile tepkime verir; asla H₂ gazı ÇIKARMAZ. 3) Tam soy metaller (Au, Pt): Yalnızca Kral Suyu ile tepkime verir.",
         "ornek_sablon": "Cu metali üzerine derişik HNO₃ çözeltisi eklendiğinde açığa çıkan gaz hangisidir?"},

        {"ders": "Biyoloji", "alan": "TYT", "konu": "Kalıtım", "kalip_adi": "X'e Bağlı Çekinik Kalıtım (Renk Körlüğü / Hemofili)",
         "aranan": "Ailenin çocuklarında renk körlüğü veya hemofili görülme olasılığı.",
         "tuzaklar": "Erkek çocukların X kromozomunu kesinlikle ANNE'den, Y kromozomunu BABA'dan aldığını unutmak; hasta kız çocuğunun babasının KESİNLİKLE hasta olması gerekliliği.",
         "algoritma": "1) Anne taşıyıcı (X^R X^r), baba sağlam (X^R Y) ise: Erkek çocukların %50'si hasta, kız çocukların %50'si taşıyıcıdır; hasta kız çocuk doğamaz. 2) Bir kız çocuğunun hasta (X^r X^r) olabilmesi için babanın mutlaka hasta (X^r Y) ve annenin en az taşıyıcı olması şarttır.",
         "ornek_sablon": "Renk körü bir baba ile heterozigot taşıyıcı bir annenin doğacak ilk çocuklarının renk körü bir erkek olma olasılığı kaçtır?"}
    ]

    records = []
    for k in kaliplar:
        records.append({
            "sistem": "AYS",
            "kategori": "soru-kaliplari",
            "ders": k["ders"],
            "alan": k["alan"],
            "konu": k["konu"],
            "kalip_adi": k["kalip_adi"],
            "soruda_aranan": k["aranan"],
            "tuzaklar_ve_celdiriciler": k["tuzaklar"],
            "cozum_algoritmasi": k["algoritma"],
            "ornek_sablon": k["ornek_sablon"],
            "kaynak": "ÖSYM YKS Soru Çözüm Analizleri & MEB Kazanım Testleri",
            "etiket": "kaynakli-ikincil"
        })
    write_jsonl(AYS_DIR / "yks_soru_kaliplari_stratejiler.jsonl", records)
    return len(records)

# ==============================================================================
# 2. AYS - Edebiyat Eser - Kahraman - Çatışma Haritası
# ==============================================================================
def uret_ays_edebiyat_haritasi():
    print("\n--- AYS: Edebiyat Eser-Kahraman ve Olay Örgüsü Haritası Derleniyor ---")
    romanlar = [
        {"eser": "İntibah", "yazar": "Namık Kemal", "donem": "Tanzimat I", "kahramanlar": "Ali Bey, Mahpeyker, Dilaşub", "tema": "Yanlış kadın tercihi ve tecrübesiz bir gencin felakete sürüklenişi; ilk edebi roman."},
        {"eser": "Araba Sevdası", "yazar": "Recaizade Mahmut Ekrem", "donem": "Tanzimat II", "kahramanlar": "Bihruz Bey, Periveş, Keşfi Bey", "tema": "Yanlış Batılılaşma, züppe tipi, gösteriş budalalığı; ilk realist roman."},
        {"eser": "Felâtun Bey ile Râkım Efendi", "yazar": "Ahmet Mithat Efendi", "donem": "Tanzimat I", "kahramanlar": "Felâtun Bey, Râkım Efendi, Canan, Jozefino", "tema": "Doğu ve Batı sentezi: Felâtun Bey alafranga züppeliği, Râkım Efendi ise çalışkan, ölçülü Doğu-Batı dengesini simgeler."},
        {"eser": "Mai ve Siyah", "yazar": "Halit Ziya Uşaklıgil", "donem": "Servet-i Fünun", "kahramanlar": "Ahmet Cemil, Lamia, Hüseyin Nazmi, Raci", "tema": "Hayal (mai) ile gerçek (siyah) çatışması; Servet-i Fünun neslinin hayal kırıklıkları ve iç dünyası."},
        {"eser": "Aşk-ı Memnu", "yazar": "Halit Ziya Uşaklıgil", "donem": "Servet-i Fünun", "kahramanlar": "Bihter, Behlül, Adnan Bey, Firdevs Hanım, Nihal, Matmazel de Courton", "tema": "Yasak aşk, kuşak çatışması, yalı hayatının yozlaşması ve trajik intihar."},
        {"eser": "Eylül", "yazar": "Mehmet Rauf", "donem": "Servet-i Fünun", "kahramanlar": "Suat, Süreyya, Necip", "tema": "İlk psikolojik roman; yasak ve platonik bir aşkın ruhsal tahlilleri, konak yangınında ölüm."},
        {"eser": "Çalıkuşu", "yazar": "Reşat Nuri Güntekin", "donem": "Milli Edebiyat", "kahramanlar": "Feride, Kamran, Hayrullah Bey, Munise", "tema": "İstanbullu genç bir öğretmenin Anadolu köylerinde idealleri uğruna verdiği mücadele ve aşkı."},
        {"eser": "Yaprak Dökümü", "yazar": "Reşat Nuri Güntekin", "donem": "Cumhuriyet Dönemi", "kahramanlar": "Ali Rıza Bey, Hayriye Hanım, Fikret, Leyla, Necla, Şevket, Ferhunde", "tema": "Geleneksel ahlak değerlerine bağlı bir ailenin modernleşme ve tüketim çılgınlığıyla çözülüşü."},
        {"eser": "Yaban", "yazar": "Yakup Kadri Karaosmanoğlu", "donem": "Milli Edebiyat / Cumhuriyet", "kahramanlar": "Ahmet Celal, Emine, Salih Ağa, İsmail", "tema": "Kurtuluş Savaşı yıllarında aydın ile köylü arasındaki derin uçurum ve yabancılaşma."},
        {"eser": "Kiralık Konak", "yazar": "Yakup Kadri Karaosmanoğlu", "donem": "Milli Edebiyat", "kahramanlar": "Naim Efendi, Seniha, Hakkı Celis, Faik Bey", "tema": "Tanzimat'tan I. Dünya Savaşı'na üç kuşak arasındaki ahlaki ve zihniyet çatışması."},
        {"eser": "Sinekli Bakkal", "yazar": "Halide Edip Adıvar", "donem": "Milli Edebiyat", "kahramanlar": "Rabia, Peregrini, Kız Tevfik, Vehbi Dede, Emine", "tema": "II. Abdülhamid dönemi İstanbul mahalle yaşamı, Doğu mistisizmi ve Batı sanatının sentezi."},
        {"eser": "Huzur", "yazar": "Ahmet Hamdi Tanpınar", "donem": "Cumhuriyet Dönemi", "kahramanlar": "Mümtaz, Nuran, Suat, İhsan", "tema": "Doğu-Batı ikilemi, musiki, estetik, huzursuzluk ve II. Dünya Savaşı öncesi İstanbul atmosferi."},
        {"eser": "Saatleri Ayarlama Enstitüsü", "yazar": "Ahmet Hamdi Tanpınar", "donem": "Cumhuriyet Dönemi", "kahramanlar": "Hayri İrdal, Halit Ayarcı, Nuri Efendi, Pakize", "tema": "Doğu ile Batı arasında bocalayan modern Türk toplumunun bürokrasi ve kurumlar üzerinden hicvi."},
        {"eser": "Kuyucaklı Yusuf", "yazar": "Sabahattin Ali", "donem": "Cumhuriyet Dönemi", "kahramanlar": "Yusuf, Muazzez, Hilmi Bey, Şakir, Kaymakam Selahattin Bey", "tema": "Taşra bürokrasisinin ve zengin eşrafın köylüye uyguladığı baskı ve başkaldırı."},
        {"eser": "İnce Memed", "yazar": "Yaşar Kemal", "donem": "Cumhuriyet Dönemi", "kahramanlar": "Memed, Abdi Ağa, Hatçe, Iraz Ana, Deli Durdu", "tema": "Toros köylüsünün ağalık düzenine, sömürüye ve zulme karşı dağa çıkan eşkıya üzerinden efsanevi direnişi."}
    ]

    records = []
    for r in romanlar:
        records.append({
            "sistem": "AYS",
            "kategori": "edebiyat-haritasi",
            "roman_adi": r["eser"],
            "yazar": r["yazar"],
            "edebi_donem": r["donem"],
            "kilit_kahramanlar": r["kahramanlar"],
            "ana_tema_ve_catisma": r["tema"],
            "kaynak": "Türk Edebiyatı İncelemeleri & MEB AYT Kataloğu",
            "etiket": "kaynakli-ikincil"
        })
    write_jsonl(AYS_DIR / "yks_edebiyat_eser_kahraman_haritasi.jsonl", records)
    return len(records)

# ==============================================================================
# 3. SPİ - Besin Biyoyararlanımı ve Sinerji Rehberi
# ==============================================================================
def uret_spi_biyoyararlanim():
    print("\n--- SPİ: Besin Biyoyararlanımı, Emilim ve Sinerji Rehberi Derleniyor ---")
    etkilesimler = [
        {"bilesik": "Demir (Non-heme / Bitkisel)", "sinerji_artiran": "C Vitamini (Askorbik Asit), Fermente Gıdalar", "inhibe_eden": "Fitatlar (Kepek, Bakliyat), Kalsiyum, Çay ve Kahvedeki Tanenler",
         "mekanizma": "C vitamini, ferrik demiri (Fe3+) daha kolay emilen ferröz demire (Fe2+) indirger. Tanenler ve fitatlar ise demirle çözünmeyen kompleksler oluşturarak emilimi %50-70 azaltır.",
         "pratik_oneri": "Ispanak, mercimek veya kurubaklagil yerken yanına limon sıkın veya bol yeşillikli salata ekleyin. Çay ve kahveyi yemekten en az 1 saat sonra için."},
        
        {"bilesik": "Yağda Eriyen Vitaminler (A, D, E, K)", "sinerji_artiran": "Sağlıklı Diyet Yağları (Zeytinyağı, Avokado, Yumurta Sarısı)", "inhibe_eden": "Aşırı yağsız diyet, mineral yağlar (likit parafin)",
         "mekanizma": "Yağda eriyen vitaminlerin bağırsakta emilebilmesi için misel (micelle) oluşumu ve safra asitleri gereklidir; yağsız ortamda emilimleri neredeyse sıfıra iner.",
         "pratik_oneri": "Havuç, domates (likopen) veya yeşil yapraklı sebzeleri mutlaka 1 tatlı kaşığı zeytinyağı ile tüketin."},

        {"bilesik": "Kurkumin (Zerdeçal)", "sinerji_artiran": "Piperin (Karabiber) ve Yağ", "inhibe_eden": "Suda çözünürlük düşüklüğü, hızlı karaciğer metabolizması",
         "mekanizma": "Karabiberdeki piperin, kurkuminin karaciğer ve bağırsakta glukuronidasyonla yıkılmasını engelleyerek biyoyararlanımını %2000 (%20 kat) artırır.",
         "pratik_oneri": "Zerdeçal tüketirken mutlaka taze çekilmiş karabiber ve zeytinyağı/yoğurt ile birlikte kullanın."},

        {"bilesik": "Kalsiyum & Kemik Metabolizması", "sinerji_artiran": "D3 Vitamini, K2 Vitamini (MK-7), Magnezyum", "inhibe_eden": "Oksalatlar (Ispanak, Pancar), Aşırı Sodyum, Aşırı Fosfor (Gazlı İçecekler)",
         "mekanizma": "D3 vitamini bağırsaktan kalsiyum emilimini artırır; K2 vitamini osteokalsini aktive ederek kalsiyumun damarlara değil kemiklere yönlendirilmesini sağlar.",
         "pratik_oneri": "Kalsiyum takviyesi alırken D3 ve K2 birlikteliğine dikkat edin; aşırı tuz tüketimi idrarla kalsiyum atılımını artırır."},

        {"bilesik": "Çinko & Bakır Dengesi", "sinerji_artiran": "Hayvansal Proteinler", "inhibe_eden": "Yüksek Doz Çinko Takviyesi (>50 mg/gün), Yüksek Fitat",
         "mekanizma": "Aşırı çinko alımı, bağırsak hücrelerinde metalotionein proteinini uyararak bakırın tutulmasına ve vücuda geçemeden atılmasına (bakır eksikliği anemisi) yol açar.",
         "pratik_oneri": "Uzun süreli çinko takviyelerinde çinko:bakır oranının 10:1 ile 15:1 arasında dengelenmesi önerilir."}
    ]

    records = []
    for e in etkilesimler:
        records.append({
            "sistem": "SPI",
            "kategori": "biyoyararlanim-sinerji",
            "besin_bilesigi": e["bilesik"],
            "emilimi_artiranlar": e["sinerji_artiran"],
            "emilimi_azaltanlar": e["inhibe_eden"],
            "biyokimyasal_mekanizma": e["mekanizma"],
            "pratik_beslenme_kurali": e["pratik_oneri"],
            "kaynak": "Klinik Beslenme ve Biyokimya Standartları",
            "etiket": "resmi-rehber"
        })
    write_jsonl(SPI_DIR / "besin_biyoyararlanim_sinerji_rehberi.jsonl", records)
    return len(records)

# ==============================================================================
# 4. SPİ - Nabız Bölgeleri ve Egzersiz Fizyolojisi
# ==============================================================================
def uret_spi_nabiz_fizyolojisi():
    print("\n--- SPİ: Nabız Bölgeleri ve Egzersiz Fizyolojisi Kataloğu Derleniyor ---")
    bolgeler = [
        {"zone": "Zone 1", "ad": "Aktif Toparlanma (Active Recovery)", "yuzde": "%50 - %60 HRmax", "enerji_sistemi": "Aerobik / Yavaş Oksidatif", "yakit": "Ağırlıklı Serbest Yağ Asitleri",
         "fizyolojik_etki": "Kan dolaşımını hızlandırarak laktat ve metabolik artıkların temizlenmesini sağlar; doku onarımını destekler.", "konusma_testi": "Çok rahat kesintisiz cümlelerle konuşulabilir, şarkı söylenebilir."},
        
        {"zone": "Zone 2", "ad": "Temel Dayanıklılık (Aerobic Base / FatMax)", "yuzde": "%60 - %70 HRmax", "enerji_sistemi": "Oksidatif Fosforilasyon", "yakit": "Maksimum Yağ Oksidasyonu (%70-85 yağ, %15-30 glikoz)",
         "fizyolojik_etki": "Mitokondriyal yoğunluğu ve hacmini artırır; kılcal damarlanmayı (kapilarizasyon) geliştirir; tip 1 kas liflerini güçlendirir.", "konusma_testi": "Rahatça tam cümlelerle konuşulabilir ancak şarkı söylemek zorlaşır."},

        {"zone": "Zone 3", "ad": "Tempo / Aerobik Güç", "yuzde": "%70 - %80 HRmax", "enerji_sistemi": "Karışık Aerobik-Glikolitik", "yakit": "Dengeli Karbonhidrat ve Yağ (%50-%50)",
         "fizyolojik_etki": "Kardiyovasküler kalp debisini (stroke volume) ve glikojen depolama kapasitesini geliştirir.", "konusma_testi": "Yalnızca kısa cümlelerle konuşulabilir, nefes alıp verme sıklığı belirgin artar."},

        {"zone": "Zone 4", "ad": "Laktat Eşiği (Threshold)", "yuzde": "%80 - %90 HRmax", "enerji_sistemi": "Hızlı Glikoliz / Anaerobik Eşik", "yakit": "Ağırlıklı Karbonhidrat (Glikoz ve Glikojen)",
         "fizyolojik_etki": "Laktat üretim hızı temizleme hızına eşitlenir; laktat toleransını ve yüksek hızda sürdürülebilirliği artırır.", "konusma_testi": "Konuşmak çok zordur; yalnızca tek tük kelimeler söylenebilir."},

        {"zone": "Zone 5", "ad": "VO2 Max / Maksimal Efor", "yuzde": "%90 - %100 HRmax", "enerji_sistemi": "Anaerobik Alaktasit & Glikolitik", "yakit": "Saf Karbonhidrat ve Kreatin Fosfat",
         "fizyolojik_etki": "Maksimum oksijen tüketim kapasitesini (VO2 max), nöromüsküler patlayıcı gücü ve anaerobik tamponlama kapasitesini zirveye çıkarır.", "konusma_testi": "Konuşmak imkansızdır; efor 30 saniye ile 2-3 dakika arasında sürdürülebilir."}
    ]

    records = []
    for b in bolgeler:
        records.append({
            "sistem": "SPI",
            "kategori": "nabiz-fizyolojisi",
            "bolge": b["zone"],
            "ad": b["ad"],
            "maksimum_nabiz_orani": b["yuzde"],
            "baskin_enerji_sistemi": b["enerji_sistemi"],
            "kullanilan_yakit_turu": b["yakit"],
            "fizyolojik_adaptasyon": b["fizyolojik_etki"],
            "konusma_testi_kriteri": b["konusma_testi"],
            "hesaplama_formulu": "Karvonen Formülü: Hedef Nabız = ((HR_max - HR_dinlenik) × Yoğunluk%) + HR_dinlenik (HR_max ≈ 220 - Yaş)",
            "kaynak": "Amerikan Spor Hekimliği Koleji (ACSM) & Egzersiz Fizyolojisi Standartları",
            "etiket": "resmi-rehber"
        })
    write_jsonl(SPI_DIR / "nabiz_bolgeleri_metabolik_fizyoloji.jsonl", records)
    return len(records)

# ==============================================================================
# 5. ESP - Mantık ve Safsatalar (Fallacies) Ansiklopedisi
# ==============================================================================
def uret_esp_safsatalar():
    print("\n--- ESP: Mantık ve Safsatalar (Fallacies) Ansiklopedisi Derleniyor ---")
    safsatalar = [
        {"ad": "Adam Karalama (Argumentum Ad Hominem)", "tur": "Biçimsel Olmayan Safsata",
         "tanim": "Bir iddiayı ya da argümanı çürütmek yerine, o iddiayı öne süren kişinin karakterine, kişisel özelliklerine veya geçmişine saldırmak.",
         "ornek": "'Ahmet çevre kirliliğinin önlenmesi gerektiğini söylüyor ama kendisi eski bir araba kullanıyor, o yüzden söylediklerinin hiçbir değeri yok.'",
         "curutme": "Kişinin karakteri veya tutarsızlığı, öne sürdüğü argümanın mantıksal doğruluğunu ya da yanlışlığını belirlemez."},

        {"ad": "Korkuluk / Saman Adam (Straw Man)", "tur": "Biçimsel Olmayan Safsata",
         "tanim": "Karşı tarafın gerçek argümanını çarpıtarak, basitleştirerek veya aşırılaştırarak savunulması imkansız yapay bir 'korkuluk' argüman yaratmak ve asıl iddia yerine bu korkuluğa saldırmak.",
         "ornek": "'A: Okul bütçesinden kütüphaneye daha fazla pay ayrılmalı.' -> 'B: Yani sen spor takımlarını ve çocukların sağlığını tamamen hiçe sayalım istiyorsun!'",
         "curutme": "Karşı tarafın argümanını en güçlü haliyle (Steel man) özetleyip doğrudan o iddiaya yanıt vermek."},

        {"ad": "Yanlış İkilem (False Dilemma / Black-and-White Fallacy)", "tur": "Biçimsel Olmayan Safsata",
         "tanim": "Aslında çok sayıda seçenek ve gri ton varken, durumu yalnızca iki uç ve birbirini dışlayan zıt alternatiften ibaretmiş gibi sunmak.",
         "ornek": "'Ya bizim politikamızı koşulsuz desteklersiniz ya da vatan hainisiniz.'",
         "curutme": "Ortadaki üçüncü, dördüncü olasılıkları ve alternatif ara çözümleri açıkça ortaya koymak."},

        {"ad": "Kaygan Zemin (Slippery Slope)", "tur": "Biçimsel Olmayan Safsata",
         "tanim": "Küçük bir ilk adım atılırsa, aradaki nedensellik bağları kanıtlanmaksızın kaçınılmaz olarak felaketle sonuçlanacak aşırı bir zincirleme olayın gerçekleşeceğini iddia etmek.",
         "ornek": "'Eğer öğrencilerin derste su içmesine izin verirsek yarın yemek getirecekler, haftaya sınıf piknik alanına dönecek ve okulda eğitim tamamen çökecek.'",
         "curutme": "Her adım arasındaki nedensel bağı sorgulamak ve ilk adımın sonraki adımları zorunlu kılmadığını göstermek."},

        {"ad": "Döngüsel Akıl Yürütme (Petitio Principii / Begging the Question)", "tur": "Mantıksal Yapı Hatası",
         "tanim": "Kanıtlanması gereken önermeyi, argümanın öncüllerinden biri olarak kullanarak kendi kendini kanıtladığını varsaymak.",
         "ornek": "'Bu kitapta yazan her şey kesinlikle doğrudur çünkü bu kitap kutsaldır ve kutsal olduğunu kitabın kendisi söylemektedir.'",
         "curutme": "Argümanın başlangıç varsayımının henüz bağımsız bir delille ispatlanmadığını göstermek."},

        {"ad": "Otoriteye Başvurma (Argumentum Ad Verecundiam)", "tur": "Biçimsel Olmayan Safsata",
         "tanim": "Bir konuyu kanıtlara dayanarak açıklamak yerine, o konuda uzmanlığı olmayan alakasız bir otorite veya popüler figürün görüşünü kesin kanıt saymak.",
         "ornek": "'Ünlü Nobel ödüllü fizikçi X ekonomi politikalarının yanlış olduğunu söylüyor, demek ki ekonomi kesinlikle batacak.'",
         "curutme": "Otoritenin söz konusu alandaki uzmanlığını ve iddiaların hakemli/nesnel kanıtlarını sorgulamak."},

        {"ad": "Çoğunluğa Başvurma (Argumentum Ad Populum)", "tur": "Biçimsel Olmayan Safsata",
         "tanim": "Bir inancın ya da düşüncenin doğru olduğunu, insanların büyük çoğunluğu tarafından kabul edildiği gerekçesiyle savunmak.",
         "ornek": "'Milyonlarca insan bu astroloji burç yorumlarını takip ediyor, bu kadar insan yanılıyor olamaz.'",
         "curutme": "Doğruluğun oylamayla veya popülerlikle belirlenemeyeceğini, tarihte çoğunlukların da defalarca yanıldığını hatırlatmak."}
    ]

    records = []
    for s in safsatalar:
        records.append({
            "sistem": "ESP",
            "kategori": "mantik-safsatalar",
            "safsata_adi": s["ad"],
            "safsata_turu": s["tur"],
            "tanim": s["tanim"],
            "tipik_ornek": s["ornek"],
            "curutme_stratejisi": s["curutme"],
            "kaynak": "Klasik ve Çağdaş Mantık Literatürü (Copi, Cohen, Hurley)",
            "etiket": "kaynakli-ikincil"
        })
    write_jsonl(ESP_DIR / "mantik_ve_safsatalar_ansiklopedisi.jsonl", records)
    return len(records)

# ==============================================================================
# 6. ESP - Müzik Teorisi ve Armoni Çemberi
# ==============================================================================
def uret_esp_armoni_cemberi():
    print("\n--- ESP: Müzik Teorisi, Armoni ve Beşliler Çemberi Derleniyor ---")
    armoni = [
        {"konu": "Beşliler Çemberi (Circle of Fifths)", "detay": "12 kromatik perdenin saat yönünde tam beşli (Perfect 5th / 7 yarım ses), saat yönünün tersinde tam dörtlü (Perfect 4th) aralıklarla dizildiği geometrik armoni haritasıdır.",
         "kullanim": "1) Tonların aldığı arıza (# ve b) sayısını belirleme (C: 0 arıza, G: 1#, D: 2#, A: 3#; F: 1b, Bb: 2b, Eb: 3b). 2) İlgili minörleri bulma (Her majörün 3 yarım ses altı ilgili doğal minörüdür: C majör -> A minör). 3) Modülasyon ve akor geçişlerini planlama."},
        
        {"konu": "Akor Kurulum Formülleri (Triadlar ve Yedili Akorlar)", "detay": "Tüm akorlar kök ses üzerine üçlü aralıkların (Majör 3'lü = 4 yarım ses, Minör 3'lü = 3 yarım ses) eklenmesiyle türetilir.",
         "kullanim": "1) Majör Triad: 1 - 3 - 5 (Ör: C = C-E-G). 2) Minör Triad: 1 - b3 - 5 (Ör: Cm = C-Eb-G). 3) Eksilmiş (Diminished): 1 - b3 - b5 (Ör: Cdim = C-Eb-Gb). 4) Artmış (Augmented): 1 - 3 - #5 (Ör: Caug = C-E-G#). 5) Dominant 7: 1 - 3 - 5 - b7 (Ör: C7 = C-E-G-Bb). 6) Majör 7: 1 - 3 - 5 - 7 (Ör: Cmaj7 = C-E-G-B). 7) Minör 7: 1 - b3 - 5 - b7 (Ör: Cm7 = C-Eb-G-Bb)."},

        {"konu": "Standart Akor Dizilimleri (Cadences & Progressions)", "detay": "Batı müziğinde gerilim (tension) ve çözülme (resolution) dinamiklerini oluşturan basamak dizilimleri.",
         "kullanim": "1) ii - V - I (Caz Temeli): Dm7 -> G7 -> Cmaj7. 2) I - IV - V (Blues ve Rock Temeli): C -> F -> G. 3) I - V - vi - IV (Popüler Müzik Ekseni): C -> G -> Am -> F. 4) vi - IV - I - V (Melankolik Pop): Am -> F -> C -> G."}
    ]

    records = []
    for a in armoni:
        records.append({
            "sistem": "ESP",
            "kategori": "muzik-armoni-teorisi",
            "konu_basligi": a["konu"],
            "teorik_aciklama": a["detay"],
            "pratik_uygulama": a["kullanim"],
            "kaynak": "Klasik ve Modern Müzik Teorisi Standartları (Berklee College of Music)",
            "etiket": "kaynakli-ikincil"
        })
    write_jsonl(ESP_DIR / "muzik_teorisi_armoni_cemberi.jsonl", records)
    return len(records)

def main():
    print("=" * 70)
    print("LifeOS Mega Veri Üretim Motoru Başlatılıyor...")
    print("=" * 70)

    stats = {}
    stats['ays_kaliplar'] = uret_ays_soru_kaliplari()
    stats['ays_edebiyat'] = uret_ays_edebiyat_haritasi()
    stats['spi_biyo'] = uret_spi_biyoyararlanim()
    stats['spi_nabiz'] = uret_spi_nabiz_fizyolojisi()
    stats['esp_safsata'] = uret_esp_safsatalar()
    stats['esp_armoni'] = uret_esp_armoni_cemberi()


    print("\n" + "=" * 70)
    print("MEGA VERİ ÜRETİMİ EKSİKSİZ TAMAMLANDI")
    print("Tüm veriler 'veri/taslak/' altında (dogrulanmamis).")
    print("=" * 70)

if __name__ == "__main__":
    main()
