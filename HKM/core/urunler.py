# -*- coding: utf-8 -*-
"""Urun katalogu — Uretim Burosu'nun yapabildigi her sey (ekip/PLAN.md §3.E).

   Test kitabi yalniz bir ornekti. Ofis «ne istenirse» uretecek sekilde
   KATALOGLA calisir: her urun turu bir kayittir, motor ayni kalir.

     aile «belge»   ozet, rapor, ders notu, kavram sozlugu, karsilastirma,
                    calisma kagidi, SSS … — tek belge semasi (bolum ->
                    paragraf / liste / numarali liste / tablo / not);
                    HTML ve PDF olarak basilir (core/cikti.py).
     aile «sunum»   slaytlar (baslik + maddeler + konusmaci notu).
     aile «gorsel»  pankart, zihin haritasi, zaman cizelgesi — model YALNIZ
                    METNI yazar; yerlesim ve cizim KODUNDUR (core/cikti.py).

   Dort kural:

   1. MODEL YAPIYI DOLDURUR, KOD SINAR. Her turun siniri burada yazilidir
      (uzunluk, oge sayisi); tutmayan oge duser, hic icerik kalmazsa
      kayit yazilmaz.
   2. KAYNAK UYDURULMAZ. Urun bir kaynakli arastirmanin ustune kurulursa
      metindeki [n] atiflari kaynak listesinde olmak ZORUNDADIR; olmayan
      atif metinden silinir. Arastirmasiz urun «dogrulanmadi»dir.
   3. KISISEL VERI YOK: istemde yalniz konu ve kullanicinin yazdigi ayrinti.
   4. YENI TUR = YENI KAYIT. Tanima kelimeleri, istem, sinir ve aile burada;
      baska hicbir dosya degismeden yeni bir urun turu eklenebilir."""
import re

AILELER = ("belge", "sunum", "gorsel")
UZUNLUK = {"kisa": "yaklaşık 250–400 kelime", "orta": "yaklaşık 600–900 kelime",
           "uzun": "yaklaşık 1200–1800 kelime"}

URUNLER = {
    "ozet": {"ad": "Konu özeti", "aile": "belge", "kaynak": True,
             "kelime": ("özet", "ozet", "özetle", "özetini"),
             "istem": "Konunun özünü öğrenciye anlatan bir özet yaz: kısa bir giriş, 3–6 bölüm, "
                      "her bölümde ana fikir ve madde madde önemli noktalar, sonda «unutma» notu."},
    "rapor": {"ad": "Araştırma raporu", "aile": "belge", "kaynak": True,
              "kelime": ("rapor",),
              "istem": "Resmî bir rapor yaz: yönetici özeti, arka plan, bulgular (alt başlıklarla), "
                       "değerlendirme, sonuç ve öneriler. Her iddiayı kaynağına bağla."},
    "ders_notu": {"ad": "Ders notu", "aile": "belge", "kaynak": True,
                  "kelime": ("ders notu", "not çıkar", "notlarını", "konu anlatımı", "konu anlatımını"),
                  "istem": "Öğrenciye konu anlatımı yap: tanımlar, açıklamalar, örnekler, sık yapılan "
                           "hatalar ve kısa bir tekrar listesi. Gerekiyorsa tablo kullan."},
    "sozluk": {"ad": "Kavram sözlüğü", "aile": "belge", "kaynak": True,
               "kelime": ("sözlük", "kavram listesi", "terimler", "kavramlar"),
               "istem": "Konunun temel kavramlarını alfabetik sırayla tanımla; her kavram için kısa "
                        "tanım ve bir örnek. Tablo biçiminde (Kavram | Tanım | Örnek) ver."},
    "karsilastirma": {"ad": "Karşılaştırma tablosu", "aile": "belge", "kaynak": True,
                      "kelime": ("karşılaştır", "kıyasla", "farkları", "karşılaştırma"),
                      "istem": "Karşılaştırılan şeyleri ölçütlere göre bir tabloda karşılaştır; tablodan "
                               "önce kısa bir giriş, sonra «öne çıkan farklar» listesi yaz."},
    "calisma_kagidi": {"ad": "Çalışma kâğıdı", "aile": "belge", "kaynak": False,
                       "kelime": ("çalışma kağıdı", "çalışma kâğıdı", "etkinlik"),
                       "istem": "Öğrencinin doldurabileceği bir çalışma kâğıdı yaz: kısa hatırlatma, "
                                "numaralı sorular (boşluk doldurma, kısa cevap, eşleştirme) ve en sonda "
                                "«Cevap anahtarı» bölümü."},
    "sss": {"ad": "Sık sorulan sorular", "aile": "belge", "kaynak": True,
            "kelime": ("sık sorulan", "sss", "soru cevap"),
            "istem": "Konuyla ilgili 8–15 sık sorulan soruyu ve kısa, net cevaplarını yaz; her soru "
                     "bir bölüm başlığı olsun."},
    "sunum": {"ad": "Sunum", "aile": "sunum", "kaynak": True,
              "kelime": ("sunum", "slayt", "sunu"),
              "istem": "6–14 slaytlık bir sunum hazırla: kapak, gündem, içerik slaytları, özet. "
                       "Her slaytta en çok 6 kısa madde; konuşmacı notunda o slaytta ne anlatılacağını yaz."},
    "pankart": {"ad": "Pankart / afiş", "aile": "gorsel", "kaynak": False,
                "kelime": ("pankart", "afiş", "afis", "poster", "bilgi kartı", "infografik"),
                "istem": "Tek bakışta okunacak bir afiş metni yaz: çarpıcı kısa başlık, bir alt başlık, "
                         "3–6 kısa madde (her biri en çok 12 kelime), isteğe bağlı büyük bir vurgu "
                         "(sayı ya da kısa söz) ve küçük bir alt not."},
    "zihin_haritasi": {"ad": "Zihin haritası", "aile": "gorsel", "kaynak": False,
                       "kelime": ("zihin haritası", "zihin haritasi", "mind map", "kavram haritası"),
                       "istem": "Konuyu bir zihin haritasına çevir: ortada konu, çevresinde 3–7 ana dal, "
                                "her dalda 0–4 kısa alt düğüm (en çok 4 kelime)."},
    "zaman_cizelgesi": {"ad": "Zaman çizelgesi", "aile": "gorsel", "kaynak": True,
                        "kelime": ("zaman çizelgesi", "zaman cizelgesi", "kronoloji", "tarih şeridi"),
                        "istem": "Konunun önemli olaylarını tarih sırasıyla 4–14 olay olarak yaz; her olay "
                                 "için tarih, kısa başlık ve bir cümlelik açıklama."},
}

BICIM = {
    "belge": """
{"baslik": "...", "alt_baslik": "...", "bolumler": [{"baslik": "...", "bloklar": [
  {"t": "p", "metin": "..."}, {"t": "liste", "maddeler": ["..."]},
  {"t": "numarali", "maddeler": ["..."]},
  {"t": "tablo", "basliklar": ["...", "..."], "satirlar": [["...", "..."]]},
  {"t": "not", "metin": "..."}]}],
 "anahtar_kavramlar": [{"terim": "...", "tanim": "..."}]}""",
    "sunum": """
{"baslik": "...", "alt_baslik": "...", "slaytlar": [{"baslik": "...", "maddeler": ["..."],
 "not": "konuşmacı notu"}]}""",
    "pankart": """
{"baslik": "...", "alt_baslik": "...", "vurgu": "...", "maddeler": ["..."], "alt_not": "..."}""",
    "zihin_haritasi": """
{"baslik": "...", "merkez": "...", "dallar": [{"ad": "...", "alt": ["..."]}]}""",
    "zaman_cizelgesi": """
{"baslik": "...", "olaylar": [{"tarih": "...", "baslik": "...", "aciklama": "..."}]}""",
}

URUN_BAS = """Sen HKM'deki BAM'ın Üretim Bürosusun. Üretim Patronu adına çalışırsın; onun
üstünde BAM Patronu, onun da üstünde King var. İstenen ürünün METNİNİ yazarsın; biçimi ve
çizimi sistem yapar.

KURALLAR
- Türkçe, açık ve doğru yaz. Kullanıcı hakkında varsayım yapma; kişisel bilgi yazma.
- Teşhis koyma, ilaç ya da doz önerme, sonuç garantisi verme.
- Sana numaralı araştırma bulguları verildiyse bilgiyi YALNIZ onlardan al ve cümlenin sonuna
  kaynak numarasını [n] yaz. Verilmediyse kaynak numarası ya da adres UYDURMA.
- Emin olmadığın bilgiyi yazma.

ÇIKTI: Yalnız tek bir JSON nesnesi döndür, başka hiçbir şey yazma."""


# ------------------------------------------------------------ tanima

def _kucuk(s):
    return str(s or "").replace("I", "ı").replace("İ", "i").lower()


def _bosluk(s):
    return re.sub(r"\s+", " ", str(s or "")).strip()


DOLGU = re.compile(r"(?:^|\s)(hazırla\w*|oluştur\w*|çıkar\w*|yap(?:ar mısın|abilir misin|sana|)|"
                   r"yaz\w*|çiz\w*|tasarla\w*|üret\w*|m[ıi]s[ıi]n|konu(?:su)?:?|"
                   r"istiyorum|ister misin|lütfen|bana|bir|pdf(?:'?(?:i|ini|le|olarak))?|olarak|"
                   r"hakkında|ile ilgili|için|konusunda|kaynaklı|internetten|araştırarak|"
                   r"kısa|uzun|detaylı|ayrıntılı)(?=\s|$|[.,!?:;])", re.I)


def tani(metin):
    """Serbest cumleden (tur, konu, secenek). Taninmazsa None. Model
    karar vermez; kural tanir. Uzun kelime once denenir («ders notu»
    «not»tan once)."""
    k = _kucuk(metin)
    adaylar = sorted(((w, t) for t, u in URUNLER.items() for w in u["kelime"]),
                     key=lambda x: -len(x[0]))
    tur = kelime = None
    for w, t in adaylar:
        if w in k:
            tur, kelime = t, w
            break
    if not tur:
        return None
    i = k.find(kelime)
    son = i + len(kelime)
    while son < len(k) and (k[son].isalpha() or k[son] == "'"):
        son += 1                    # «raporu», «özetini»: ek de kelimeyle gider
    ham = (metin[:i] + " " + metin[son:])
    ham = re.sub(r"[«»\"“”]", " ", ham)
    ham = re.sub(r"^\s*[\w ]{0,20}?:\s*", "", ham) if ":" in ham[:25] else ham
    konu = _bosluk(DOLGU.sub(" ", ham)).strip(" .,!?:;-")
    konu = re.sub(r"(?i)^(?:(?:ın|in|un|ün|nın|nin|nun|nün|ı|i|u|ü|sı|si|su|sü)\s+)", "", konu)
    konu = re.sub(r"['’](?:n?[ıiuü]n)$", "", konu)      # «Savaşı'nın özeti» -> Savaşı
    uzunluk = "kisa" if re.search(r"\bkısa\b", k) else "uzun" if re.search(
        r"\b(uzun|detaylı|ayrıntılı)\b", k) else "orta"
    return {"tur": tur, "konu": konu, "uzunluk": uzunluk,
            "kaynakli": bool(re.search(r"(kaynaklı|internetten|araştırarak|web'?den)", k)) or None,
            "pdf": "pdf" in k}


# ---------------------------------------------------------- girdi

def temizle(govde):
    """Is emri govdesi: {tur, konu, ayrinti?, uzunluk?, kaynakli?}."""
    if not isinstance(govde, dict):
        return None, ["ürün isteği bir nesne olmalı"]
    hata = []
    for k in govde:
        if k not in ("tur", "konu", "ayrinti", "uzunluk", "kaynakli"):
            hata.append("ürün: bilinmeyen alan %s" % k)
    tur = govde.get("tur")
    if tur not in URUNLER:
        hata.append("ürün türü şunlardan biri olmalı: %s" % ", ".join(URUNLER))
    konu = _bosluk(govde.get("konu"))
    if not (3 <= len(konu) <= 300):
        hata.append("ürün konusu 3–300 karakter olmalı")
    ayrinti = _bosluk(govde.get("ayrinti")) if govde.get("ayrinti") is not None else ""
    if len(ayrinti) > 1000:
        hata.append("ürün ayrıntısı en çok 1000 karakter olmalı")
    uz = govde.get("uzunluk", "orta")
    if uz not in UZUNLUK:
        hata.append("ürün uzunluğu kısa, orta ya da uzun olmalı")
    kay = govde.get("kaynakli")
    if kay is not None and not isinstance(kay, bool):
        hata.append("«kaynaklı» evet ya da hayır olmalı")
    if hata:
        return None, hata
    g = {"tur": tur, "konu": konu, "uzunluk": uz}
    if ayrinti:
        g["ayrinti"] = ayrinti
    # Kaynak istenmediyse turun varsayilani gecer (olgu agirlikli turler
    # arastirmayla kurulur); web kapaliysa arastirma zaten kaynaksiz duser.
    g["kaynakli"] = URUNLER[tur]["kaynak"] if kay is None else kay
    return g, []


def talep(g):
    return "%s: %s" % (URUNLER[g["tur"]]["ad"], g["konu"])


def istem(g, bulgular_blogu=""):
    u = URUNLER[g["tur"]]
    parca = ["Ürün: %s" % u["ad"], "Konu: %s" % g["konu"]]
    if g.get("ayrinti"):
        parca.append("Kullanıcının notu: %s" % g["ayrinti"])
    if u["aile"] == "belge":
        parca.append("Uzunluk: %s" % UZUNLUK[g["uzunluk"]])
    parca.append("Görev: " + u["istem"])
    if bulgular_blogu:
        parca.append("ARAŞTIRMA BULGULARI (yalnız bunlara dayan, [n] ile göster):\n"
                     + bulgular_blogu)
    return "\n".join(parca)


def sistem(g):
    u = URUNLER[g["tur"]]
    return URUN_BAS + (BICIM.get(g["tur"]) or BICIM[u["aile"]])


# ---------------------------------------------------------- suzme

ATIF = re.compile(r"\[(\d{1,2})\]")


def _m(x, en_az, en_cok, n_ler=None):
    """Metni sinar; [n] atiflarindan kaynak listesinde olmayani siler."""
    t = _bosluk(x)
    if n_ler is not None:
        t = ATIF.sub(lambda m: m.group(0) if int(m.group(1)) in n_ler else "", t)
        t = _bosluk(t)
    return t if en_az <= len(t) <= en_cok else None


def _liste(xs, en_cok_oge, en_az, en_cok, n_ler):
    if not isinstance(xs, list):
        return []
    return [y for y in (_m(x, en_az, en_cok, n_ler) for x in xs[:en_cok_oge * 2]) if y][:en_cok_oge]


def _belge(d, n_ler):
    bolumler, dusen = [], 0
    for b in (d.get("bolumler") or [])[:24] if isinstance(d.get("bolumler"), list) else []:
        if not isinstance(b, dict):
            dusen += 1
            continue
        bloklar = []
        for x in (b.get("bloklar") or [])[:40] if isinstance(b.get("bloklar"), list) else []:
            t = x.get("t") if isinstance(x, dict) else None
            if t in ("p", "not"):
                m = _m(x.get("metin"), 1, 3000, n_ler)
                if m:
                    bloklar.append({"t": t, "metin": m})
                    continue
            elif t in ("liste", "numarali"):
                ms = _liste(x.get("maddeler"), 30, 1, 600, n_ler)
                if ms:
                    bloklar.append({"t": t, "maddeler": ms})
                    continue
            elif t == "tablo":
                bas = _liste(x.get("basliklar"), 6, 1, 80, None)
                sat = []
                for s in (x.get("satirlar") or [])[:40] if isinstance(x.get("satirlar"), list) else []:
                    if isinstance(s, list) and len(s) == len(bas):
                        hucre = [_m(h, 0, 400, n_ler) for h in s]
                        if None not in hucre:
                            sat.append(hucre)
                if len(bas) >= 2 and sat:
                    bloklar.append({"t": "tablo", "basliklar": bas, "satirlar": sat})
                    continue
            dusen += 1
        if bloklar:
            bolumler.append({"baslik": _m(b.get("baslik"), 1, 160, n_ler) or "", "bloklar": bloklar})
        else:
            dusen += 1
    kavram = []
    for x in (d.get("anahtar_kavramlar") or [])[:20] if isinstance(d.get("anahtar_kavramlar"), list) else []:
        if isinstance(x, dict) and _m(x.get("terim"), 1, 80) and _m(x.get("tanim"), 1, 400, n_ler):
            kavram.append({"terim": _m(x["terim"], 1, 80), "tanim": _m(x["tanim"], 1, 400, n_ler)})
    if not bolumler:
        return None, "Belgenin hiçbir bölümü biçim denetimini geçmedi."
    return {"bolumler": bolumler, "anahtar_kavramlar": kavram, "dusen": dusen}, None


def _sunum(d, n_ler):
    sl = []
    for x in (d.get("slaytlar") or [])[:30] if isinstance(d.get("slaytlar"), list) else []:
        if not isinstance(x, dict) or not _m(x.get("baslik"), 1, 90, n_ler):
            continue
        sl.append({"baslik": _m(x["baslik"], 1, 90, n_ler),
                   "maddeler": _liste(x.get("maddeler"), 8, 1, 220, n_ler),
                   "not": _m(x.get("not"), 1, 800, n_ler)})
    if len(sl) < 2:
        return None, "Sunumda en az iki geçerli slayt yok."
    return {"slaytlar": sl}, None


def _pankart(d, n_ler):
    ms = _liste(d.get("maddeler"), 6, 2, 110, n_ler)
    if not _m(d.get("baslik"), 2, 70) or len(ms) < 2:
        return None, "Afişin başlığı ya da en az iki maddesi yok."
    return {"maddeler": ms, "vurgu": _m(d.get("vurgu"), 1, 40, n_ler),
            "alt_not": _m(d.get("alt_not"), 1, 160, n_ler)}, None


def _zihin(d, n_ler):
    dallar = []
    for x in (d.get("dallar") or [])[:8] if isinstance(d.get("dallar"), list) else []:
        if isinstance(x, dict) and _m(x.get("ad"), 1, 34):
            dallar.append({"ad": _m(x["ad"], 1, 34), "alt": _liste(x.get("alt"), 4, 1, 40, None)})
    merkez = _m(d.get("merkez") or d.get("baslik"), 1, 40)
    if not merkez or len(dallar) < 2:
        return None, "Zihin haritasının merkezi ya da en az iki dalı yok."
    return {"merkez": merkez, "dallar": dallar}, None


def _zaman(d, n_ler):
    ol = []
    for x in (d.get("olaylar") or [])[:14] if isinstance(d.get("olaylar"), list) else []:
        if isinstance(x, dict) and _m(x.get("tarih"), 1, 24) and _m(x.get("baslik"), 1, 70, n_ler):
            ol.append({"tarih": _m(x["tarih"], 1, 24), "baslik": _m(x["baslik"], 1, 70, n_ler),
                       "aciklama": _m(x.get("aciklama"), 1, 180, n_ler)})
    if len(ol) < 2:
        return None, "Zaman çizelgesinde en az iki geçerli olay yok."
    return {"olaylar": ol}, None


SUZGEC = {"belge": _belge, "sunum": _sunum, "pankart": _pankart,
          "zihin_haritasi": _zihin, "zaman_cizelgesi": _zaman}


def ayikla(tur, d, kaynaklar=None):
    """Modelin JSON'u -> temiz urun govdesi ya da (None, neden)."""
    if tur not in URUNLER:
        return None, "Bilinmeyen ürün türü."
    if not isinstance(d, dict):
        return None, "Model geçerli bir JSON vermedi."
    n_ler = {k["n"] for k in (kaynaklar or [])}
    u = URUNLER[tur]
    fn = SUZGEC.get(tur) or SUZGEC[u["aile"]]
    icerik, neden = fn(d, n_ler)
    if neden:
        return None, neden
    baslik = _m(d.get("baslik"), 2, 160, None) or u["ad"]
    return dict({"tur": "urun", "urun": tur, "aile": u["aile"], "urun_ad": u["ad"],
                 "baslik": baslik, "alt_baslik": _m(d.get("alt_baslik"), 1, 200, n_ler),
                 "kaynaklar": list(kaynaklar or [])}, **icerik), None
