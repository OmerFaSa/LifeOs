#!/usr/bin/env python3
"""King'in niyet ayrımı ve kayıt ayrıştırıcısı (sadelesme Faz 5, A7). Kural tabanlı, belirlenimci, modelsiz.
Rapor: belgeler/ekip/sadelesme/faz5-king-cekirdek.md · Test: python king/niyet_test.py

    python king/niyet.py "Bugün 20 dakika yürüdüm"   niyet + kayıt önerisi (JSON)
    python king/niyet.py --vekil                     sınav cümlelerinde isabet (Anlama eğrisinin ikinci vekili)

Beş niyet (plan §6): sohbet · kayit · ogren · arastir · yonet. Kayıt modele gitmez: cümle burada ayrıştırılır,
kural motoru yazar. Sayı yalnız kullanıcı söylediyse «measured» olur; söylenmeyen alan hiç yazılmaz (eksik veri
sıfır değildir, AGENTS §1.2). Birim çevirisi (1,5 saat -> 90 dk) söylenen sayının aritmetiğidir, ölçülü kalır.
"""
import datetime
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mcp import katla  # noqa: E402  Türkçe büyük/küçük harf ve aksan katlama (İ/I/ı, ç, ğ, ö, ş, ü)

NIYETLER = ("sohbet", "kayit", "ogren", "arastir", "yonet")
OLCULDU = "measured"


def katlanmis(metin):
    """Karşılaştırma biçimi: katlanmış, kesme işaretsiz, tek boşluklu."""
    return re.sub(r"\s+", " ", re.sub(r"['’`]", "", katla(metin))).strip()


# ---------------------------------------------------------------- sayılar

_BIR = {"bir": 1, "iki": 2, "uc": 3, "dort": 4, "bes": 5, "alti": 6, "yedi": 7, "sekiz": 8, "dokuz": 9}
_ON = {"on": 10, "yirmi": 20, "otuz": 30, "kirk": 40, "elli": 50, "altmis": 60, "yetmis": 70, "seksen": 80,
       "doksan": 90, "yuz": 100}
_SOZ = "|".join(list(_ON) + list(_BIR))
SAYI = r"(?:\d+(?:[.,]\d+)?|(?:(?:%s) )?(?:%s)|%s)(?: bucuk)?" % ("|".join(_ON), "|".join(_BIR), "|".join(_ON))


def sayi(s):
    s = s.strip()
    ek = 0.5 if s.endswith(" bucuk") else 0
    s = s[:-6] if ek else s
    if re.fullmatch(r"\d+(?:[.,]\d+)?", s):
        return float(s.replace(",", ".")) + ek
    return sum(_ON.get(p, _BIR.get(p, 0)) for p in s.split()) + ek


def _tam(x):
    return int(x) if float(x).is_integer() else round(x, 2)


def _olcu(x):
    return {"v": _tam(x), "k": OLCULDU}


def sure_dk(f):
    """Söylenen süre dakika olarak (birden çok parça toplanır: «1 saat 20 dakika»); yoksa None."""
    dk, var = 0.0, False
    for m in re.finditer(r"\b(%s|yarim|ceyrek) ?(saat|sa|dakika|dk|dak)\b" % SAYI, f):
        n = {"yarim": 0.5, "ceyrek": 0.25}.get(m.group(1)) or sayi(m.group(1))
        dk += n * 60 if m.group(2) in ("saat", "sa") else n
        var = True
    return dk if var else None


def _bul(desen, f):
    m = re.search(desen, f)
    return sayi(m.group(1)) if m else None


# ---------------------------------------------------------------- kayıt ayrıştırıcı

SORU_EKI = r"\b(mi|mu|misin|musun|miyim|muyum|misiniz|musunuz|miydi|muydu|mis)\b"
SORU_SOZ = r"\b(ne|neden|niye|nicin|nasil|kac|hangi|hangisi|nerede|nereye|kim|nedir|ne zaman|ne kadar)\b"
GELECEK = r"\b\w+(ecegim|acagim|ecegiz|acagiz)\b"
# İstek ve buyruk kayıt değildir: «25 dakika matematik çalışalım» odak başlatır, «planına 45 dakika ekle» plana yazar
ISTEK = r"\b\w+(alim|elim)\b|\b(ekle|koy|baslat|kur|ayarla|aktar|dusur|cikar)\b"
SPOR = (r"\b(yurudum|yuruyus\w*|kostum|kosu\w*|bisiklet\w*|yuzdum|yuzme\w*|pilates|yoga|kuvvet|antrenman\w*|"
        r"spor|esneme|mobilite|kardiyo|fitness|futbol|basketbol|tenis|voleybol|dag yuruyusu)\b")
OGUN_ZAMANI = (("kahvalti", r"\b(kahvalti\w*|sabah)\b"), ("ogle", r"\b(ogle\w*)\b"),
               ("aksam", r"\b(aksam\w*)\b"), ("ara", r"\bara ogun\w*\b"))
KAYIT_FIIL = (r"\b(calistim|cozdum|okudum|caldim|yazdim|ogrendim|yaptim|izledim|dinledim|tekrarladim|"
              r"tamamladim|bitirdim)\b")
# Ayrıştırmada etkinlik/ders adından atılan sözler (katlanmış)
_ATILAN = set(("bugun dun gece sabah aksam oglen ogleden sonra bu ve ile toplam tempolu deliksiz yeni hepsi dogru "
               "yanlis yanlisim yanlisla var soru paragraf sayfa kelime adim net surdu sure yarim ceyrek bucuk "
               "dakika dk dak saat sa km kilometre metre m").split())


def _gun(f, simdi):
    return (simdi.date() - datetime.timedelta(days=1 if re.search(r"\bdun\b", f) else 0)).isoformat()


def _kalan(metin, at=()):
    """Sayı, birim, zaman sözü ve fiil atılınca kalan özgün sözcükler (etkinlik ya da ders adı)."""
    l = []
    for t in re.findall(r"[^\s,.;:!?]+", metin):
        k = katlanmis(t)
        if (k in _ATILAN or k in _BIR or k in _ON or re.fullmatch(r"[\d.,]+\w{0,4}", k) or re.fullmatch(KAYIT_FIIL[2:-2], k)
                or k in at or re.fullmatch(r"\w+(dim|dum|tim|tum)", k)):
            continue
        l.append(t)
    return " ".join(l) or None


def _ablatifsiz(s):
    return re.sub(r"(['’]?(dan|den|tan|ten))$", "", s) if s else s


def _oneri(tur, metin, simdi, f, **alan):
    return {"tur": tur, "gun": _gun(f, simdi), "alanlar": {k: v for k, v in alan.items() if v is not None},
            "metin": metin, "kaynak": "king-kural", "durum": "oneri"}


def _beyan(metin, f, simdi):
    """Kalıplı beyanlar («deftere not: …», «X kelimesini kart yap: …»): metin olduğu gibi, sayısız."""
    m = re.match(r"^(?:\w+ )?(?:defter\w*|saglik defter\w*) not\s?:\s*(.+)$|^not\s?:\s*(.+)$", f)
    if m:
        return _oneri("not", metin, simdi, f, govde=metin.split(":", 1)[1].strip(),
                      yer="saglik" if f.startswith("saglik") else "defter")
    m = re.match(r"^(.+?) kelimesini kart yap\s?:\s*(.+)$", f)
    if m:
        on, arka = metin.split(":", 1)
        return _oneri("kart", metin, simdi, f, on=on.rsplit(" ", 3)[0].strip(), arka=arka.strip())
    if re.match(r"^(kitaptan )?alinti( ekle)?\s?:", f):
        return _oneri("alinti", metin, simdi, f, govde=metin.split(":", 1)[1].strip())
    for desen, alan in ((r"^bugunun niyeti\s?:", "niyet"), (r"^sozum\s?:", "soz"), (r"^enerji veren\s?:", "veren"),
                        (r"^enerji calan\s?:", "calan")):
        if re.match(desen, f):
            return _oneri("gun", metin, simdi, f, alan=alan, govde=metin.split(":", 1)[1].strip())
    m = re.match(r"^ic havam (\w+)$", f)
    if m:
        return _oneri("gun", metin, simdi, f, alan="hava", govde=metin.split()[-1])
    if re.search(r"\bdenemesi\s?:", f) and re.search(r"\d+ dogru", f):
        testler = [{"ders": d, "dogru": _olcu(int(a)), "yanlis": _olcu(int(b))}
                   for d, a, b in re.findall(r"([a-z]+) (\d+) dogru,? (\d+) yanlis", f)]
        return _oneri("deneme", metin, simdi, f, ad=metin.split(":", 1)[0].strip(), testler=testler)
    return None


def kayit_ayristir(metin, simdi=None):
    """Kayıt cümlesinden tipli kayıt önerisi ya da None. Soru, gelecek ve olumsuz cümle kayıt değildir."""
    simdi = simdi or datetime.datetime.now()
    f = katlanmis(metin)
    if not f:
        return None
    b = _beyan(metin, f, simdi)
    if b:
        return b
    if f.endswith("?") or re.search(SORU_EKI, f) or re.search(SORU_SOZ, f) or re.search(GELECEK, f) \
            or re.search(ISTEK, f):
        return None
    f = f.rstrip(".!")
    dk = sure_dk(f)

    # tek sayılı ölçümler (olcum: tür, değer, birim)
    k = _bul(r"\bkilom\D{0,20}?(\d+(?:[.,]\d+)?)", f) or _bul(r"(\d+(?:[.,]\d+)?) ?(?:kilo|kg)(?:yum| geldim| ciktim)\b", f)
    if k is not None:
        return _oneri("olcum", metin, simdi, f, olcum="kilo", deger=_olcu(k), birim="kg")
    m = re.search(r"\b(%s) ?(litre|lt|bardak|sise) su\b.*\bictim\b" % SAYI, f)
    if m:
        return _oneri("olcum", metin, simdi, f, olcum="su", deger=_olcu(sayi(m.group(1))),
                      birim="litre" if m.group(2) in ("litre", "lt") else m.group(2))
    if re.search(r"\b(uyudum|uyku\w*|sekerleme)\b", f) and dk is not None:
        return _oneri("olcum", metin, simdi, f, olcum="sekerleme" if "sekerleme" in f else "uyku",
                      deger=_olcu(dk / 60), birim="saat")
    for desen, ad in ((r"\benerjim (\d+)\b", "enerji"), (r"\bkas agrisi(?: seviyem)?(?: bugun)? (\d+)\b", "kas_agrisi"),
                      (r"\bnabzim (\d+)\b", "nabiz")):
        n = _bul(desen, f)
        if n is not None:
            return _oneri("olcum", metin, simdi, f, olcum=ad, deger=_olcu(n), birim="puan" if ad != "nabiz" else "atım/dk")
    n = _bul(r"\b(%s) adim\b.*\b(attim|yurudum)\b" % SAYI, f)
    if n is not None:
        return _oneri("olcum", metin, simdi, f, olcum="adim", deger=_olcu(n), birim="adım")

    # öğün: metin olduğu gibi; kalori yalnız söylendiyse
    if re.search(r"\b(yedim|ictim)\b", f):
        zaman = next((ad for ad, d in OGUN_ZAMANI if re.search(d, f)), None)
        at = {"yedim", "ictim", "kahvaltida", "kahvalti", "sabah", "oglen", "ogle", "oglende", "aksam", "yemeginde",
              "yemegi", "ara", "ogunde", "bugun", "dun"}
        icerik = " ".join(t for t in metin.split() if katlanmis(t) not in at) or None
        return _oneri("ogun", metin, simdi, f, ogun=zaman, icerik=icerik,
                      kalori=_olcu(_bul(r"(\d+) ?(?:kalori|kcal)\b", f)) if re.search(r"\d+ ?(kalori|kcal)", f) else None)

    mesafe = _bul(r"\b(%s) ?(?:km|kilometre)\b" % SAYI, f)
    spor = re.search(SPOR, f)
    if spor and (re.search(r"\b\w+(dim|dum|tim|tum)\b", f) or dk is not None or mesafe is not None):
        return _oneri("antrenman", metin, simdi, f, etkinlik=_kalan(metin) or {
                          "yurudum": "yürüyüş", "kostum": "koşu", "yuzdum": "yüzme"}.get(spor.group(0), spor.group(0)),
                      sure_dk=_olcu(dk) if dk is not None else None,
                      mesafe_km=_olcu(mesafe) if mesafe is not None else None)

    m = re.search(r"\b(.+?)(?: kitabini| okumayi)? (bitirdim|tamamladim)$", f)
    if m and ("'" in metin or "’" in metin or re.search(r"kitabini|okumayi", f)):
        return _oneri("kitap", metin, simdi, f, ad=re.split(r"['’]| kitab| okuma", metin, 1)[0].strip(), bitti=True)

    soru = _bul(r"\b(%s) (?:soru|paragraf)\b" % SAYI, f)
    fiil = re.search(KAYIT_FIIL, f)
    sayili = dk is not None or soru is not None or re.search(r"\d+ (sayfa|kelime|yeni kelime)\b", f)
    nominal = dk is not None and len(f.split()) <= 6 and not re.search(r"\b(sonra|once|icinde|kala)\b", f)
    if (fiil and sayili) or (nominal and not fiil):
        yanlis = 0 if re.search(r"\bhepsi dogru\b", f) else _bul(r"\b(\d+) yanlis", f)
        ders = _kalan(metin)
        return _oneri("oturum", metin, simdi, f, disiplin=_ablatifsiz(ders) if soru is not None else ders,
                      sure_dk=_olcu(dk) if dk is not None else None,
                      soru=_olcu(soru) if soru is not None else None,
                      yanlis=_olcu(yanlis) if yanlis is not None else None,
                      net=_olcu(_bul(r"\b(\d+) net\b", f)) if re.search(r"\d+ net\b", f) else None,
                      sayfa=_olcu(_bul(r"\b(\d+) sayfa\b", f)) if re.search(r"\d+ sayfa\b", f) else None,
                      kelime=_olcu(_bul(r"\b(\d+) (?:yeni )?kelime\b", f)) if re.search(r"\d+ (yeni )?kelime\b", f) else None)
    return None


# ---------------------------------------------------------------- niyet

# (niyet, güven, kural adı, desen) — sırayla; ilk eşleşen kazanır. Desenler katlanmış metinde.
SOHBET_ONCE = r"\b(konusalim|sohbet edelim|tartisalim|dusunelim|soracagim|anlatacagim|diyecegim|soyleyecegim|danisacagim)\b"
DUYGU = (r"\b(merhaba|selam|gunaydin|iyi geceler|tesekkur\w*|sagol\w*|nasilsin|hissediyorum|yorgunum|uzgunum|"
         r"mutluyum|stresliyim|bunaldim|sikildim|canim sikkin|baski yapiyor|yetisemiyorum)\b")
TAVSIYE = (r"\b\w+(ayim|eyim)\b|\b(?!aksam\b)\w+(sam|sem)\b|\b\w+(malimiyim|melimiyim|mali miyim|meli miyim|maliyim|meliyim)\b|"
           r"\bne onerirsin\b|\btavsiye\b|\boneri\w* var mi\b|\bne yapmaliyim\b")
ARASTIR = (r"\b(arastir\w*|kaynak(lar)?(i|la|lariyla)?|kaynakli|makale\w*|literatur\w*|internet\w*|webde|guncel|"
           r"son gelisme\w*|haber\w*|besin deger\w*|kalori deger\w*|barkodu ne|bilgi topla)\b")
OGREN = (r"\b(ogret\w*|ders(i|e|imi|ime)? (ver|anlat|yap|basla)\w*|soru sor(ar misin|abilir misin)?$|soru sor |"
         r"\w+ sorusu sor|sorusu sor|test et\w*|sina\b|sinav yap|quiz|alistirma\w*|tekrarlarim\w*|tekrar et\w*|"
         r"kartlarim\w*|kart(lari)? (calis|tekrar)\w*|calistir beni|konu anlatimi|yanlis\w* (teshis|acikla)\w*)")
YONET = (
    ("gezinme", 0.85, r"\b(sayfa\w*|ekran\w*|bolum\w*|modul\w*)\b.*\b(ac|aciver|kapat|git|gidelim|gec)\b|"
                      r"\b(ac|kapat|git|gidelim|gec)$"),
    ("ayar", 0.85, r"\b(tema\w*|koyu mod|acik mod|karanlik mod|ayar\w*|bildirim\w*)\b"),
    ("onay", 0.85, r"\b(onayla\w*|reddet\w*|oneri\w* gec|geri al|bekleyen oneri\w*)\b"),
    ("plan", 0.8, r"\b(hatirlat\w*|planla\w*|program\w*|takvim\w*|hedef\w*|ara ver\w*|mola\w*|odak\w*|sayac\w*|"
                  r"baslat|durdur|calisalim|baslayalim|bakalim|yapalim|gidelim|karar ver|kart cek|listesine|"
                  r"gun sonra|gun kaldi|gune ekle)\b"),
    ("hesap", 0.8, r"^(hesapla|yapilacak)\s?:|\bkac (mil|km|kilometre|metre|gram|kilo|litre)\b|\b(don|gizle|goster)$"),
    ("gelecek", 0.7, GELECEK),
    ("degistir", 0.75, r"\b(sil|duzelt\w*|degistir\w*|guncelle\w*|ekle|ekler misin|kaldir)\b"),
    ("kendi verisi", 0.75,
     r"\b(net|deneme|kart|not|uyku|kilo|enerji|plan|program|hedef|ogun|antrenman|tahlil|butce|kitap|taslak|yanlis|"
     r"puan|tahmin|siralama|ders|konu|calisma|adim|seri|degeri|vitamin|ferritin)(ler|lar)?(im|um|m)"
     r"(i|u|da|de|a|e|dan|den|daki|deki|in|un)?\b|\b(ozet\w*|istatistik\w*|rapor\w*|degerlendirme\w*|"
     r"gun kaydi\w*|nasil gidiyorum|ne yapti|ne yapabilirsin|neler var)\b"),
)
# Kendi verisinin alanını anan söz: sohbet ve tavsiye kuralından sonra gelir, «uykum az, ne yapayım» sohbet kalır
ALAN = (r"\b(konu\w*|oncelik\w*|akis\w*|yuk\w*|kart\w*|deneme\w*|net\w*|uyku\w*|enerji\w*|kitap\w*|"
        r"defter\w*|hata\w*|karne\w*|ilac\w*|kosu\w*|antrenman\w*|beslenme\w*|ogun\w*|gunlug\w*|kalori|protein|"
        r"barkod\w*|kiler\w*|mutfak\w*|ekran\w*|sure\w*|saat\w*|ortalama\w*|seviye\w*|oran\w*|yuzde\w*|"
        r"kaydettim|tamamlandi|karar\w*|isaretle|durum\w*|plan\w*|notlar\w*|ders\w*|verim\w*|yanlis\w*)\b")
# Genel nasıl/mı soruları ve «çözerken» deneyimi alan sözü geçse de kendi verisini sormaz: sohbet
GENEL = r"\w+(erken|arken)\b|\bnasil\b.*\w+(abilirim|ebilirim)\b|\b(mi|mu)$"
GECMIS_SORU = r"\b\w+(dim|dum|tim|tum)\b"   # «dün ne yedim», «kaç soru çözdüm»: kendi kaydını soruyor


def siniflandir(metin, simdi=None):
    """{niyet, guven, neden} (+ kayıt niyetinde «kayit»: tipli öneri). Belirlenimci: aynı metin, aynı sonuç."""
    f = katlanmis(metin or "")
    if not f:
        return {"niyet": "sohbet", "guven": 0.0, "neden": "boş mesaj"}

    def sonuc(niyet, guven, kural, m=None):
        return {"niyet": niyet, "guven": guven,
                "neden": "kural:%s" % kural + (" «%s»" % m.group(0).strip() if m is not None else "")}

    k = kayit_ayristir(metin, simdi)
    if k:
        sayili = any(isinstance(v, dict) and v.get("k") == OLCULDU for v in k["alanlar"].values()) or k["tur"] in (
            "not", "kart", "alinti", "gun", "deneme", "kitap")
        r = sonuc("kayit", 0.9 if sayili else 0.7, "kayıt:" + k["tur"])
        r["kayit"] = k
        return r
    soru = f.endswith("?") or re.search(SORU_EKI, f) or re.search(SORU_SOZ, f)
    for niyet, guven, kural, desen in (("sohbet", 0.8, "sohbet sözü", SOHBET_ONCE), ("sohbet", 0.75, "duygu", DUYGU),
                                       ("arastir", 0.8, "araştırma", ARASTIR), ("ogren", 0.8, "öğrenme", OGREN)):
        m = re.search(desen, f)
        if m:
            return sonuc(niyet, guven, kural, m)
    m = re.search(TAVSIYE, f)
    if m:
        return sonuc("sohbet", 0.7, "tavsiye", m)
    if re.search(r"\b(neden|niye|nicin)\b", f):   # «netlerim neden artmıyor»: yorum ister, sayıyı değil
        return sonuc("sohbet", 0.65, "neden sorusu", re.search(r"\b(neden|niye|nicin)\b", f))
    for kural, guven, desen in YONET:
        m = re.search(desen, f)
        if m:
            return sonuc("yonet", guven, kural, m)
    m = re.search(GECMIS_SORU, f)
    if soru and m:
        return sonuc("yonet", 0.7, "geçmiş sorusu", m)
    m = re.search(ALAN, f)
    if m and not re.search(GENEL, f.rstrip("?")):
        return sonuc("yonet", 0.6, "veri alanı", m)
    return sonuc("sohbet", 0.5, "varsayılan")


# ---------------------------------------------------------------- Anlama eğrisinin ikinci vekili

def vekil(kok):
    """Sınav cümlelerinde (tools/king_sinav.json) bu sınıflayıcının isabeti; beklenen niyet kalite/egri/_sinav.py
    ESLEME'den. Tahmin etiketlidir: sahibinin etiketi değil. anlama.vekil ile aynı biçim; dosya yoksa None."""
    sys.path.insert(0, os.path.join(kok, "kalite", "egri"))
    try:
        import _sinav
        with open(os.path.join(kok, "tools", "king_sinav.json"), encoding="utf-8") as fp:
            cumle = json.load(fp)["cumleler"]
    except (ImportError, OSError, ValueError, KeyError):
        return None
    sayac, disari, karisik = {}, 0, {}
    for s in cumle:
        beklenen = {_sinav.niyet(b) for b in s["b"]}
        if len(beklenen) != 1 or None in beklenen:
            disari += 1
            continue
        n, bulunan = beklenen.pop(), siniflandir(s["c"])["niyet"]
        t = sayac.setdefault(n, [0, 0])
        t[0] += bulunan == n
        t[1] += 1
        if bulunan != n:
            karisik["%s→%s" % (n, bulunan)] = karisik.get("%s→%s" % (n, bulunan), 0) + 1
    isabet, toplam = sum(v[0] for v in sayac.values()), sum(v[1] for v in sayac.values())
    return {"ad": "vekil: kural sınıflayıcı (king/niyet.py)", "deger": round(isabet / toplam, 3) if toplam else None,
            "birim": "oran", "etiket": "tahmin", "isabet": isabet, "cumle": toplam, "disarida": disari,
            "niyet_basina": {k: "%d/%d" % tuple(v) for k, v in sorted(sayac.items())},
            "karisiklik": dict(sorted(karisik.items(), key=lambda x: -x[1])), "komut": "python king/niyet.py --vekil",
            "neden_tahmin": "sınav cümleleri ve ESLEME eşlemesi sahibinin etiketi değil; eski King'in araç "
                            "kararlarından türetildi (ör. kart vadesi «yonet», burada «ogren»)"}


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    if sys.argv[1:] == ["--vekil"]:
        print(json.dumps(vekil(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ensure_ascii=False, indent=1))
    else:
        print(json.dumps(siniflandir(" ".join(sys.argv[1:])), ensure_ascii=False, indent=1))
