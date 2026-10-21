# -*- coding: utf-8 -*-
"""BAM hizli arastirma — sohbetin icinde, SUNUCU tarafinda (H1, 2026-10-21;
depo sahibi: «YouTube'a gidip arastirma yapabilecek, link getirebilecek,
kaynak getirebilecek»; «belli akilli guzel bir sablonla yapsin»; «dil
icinde de olsun, SPİ icinde de olsun ve kaliteli olsun»).

   King arastirmayi kendisi yapmaz: «X'i arastir», «zincir kurali icin
   video bul» diyen mesaji BAM Arastirma Burosu'nun bu hizli yoluna verir
   (rol `bam.arastirma`, model atamasi oradan; sahada gemma4:e2b). Uzun,
   kalici, depoya giren rapor yine is emriyle yazilir (core/bam.py); bu yol
   sohbet suresinde biten kisa, kaynakli cevaptir.

   Akis:  modul PROFILI secilir (AYS, ESP, SPİ ya da genel; alt kip konudan)
          -> KOD web'de arar, ilk sayfayi okur, YouTube'da arar, videolari
          suzer ve altyazida konunun ANINI bulur -> model kaynaklara bakar;
          yetmiyorsa ARAC cagirir (web_ara, sayfa_oku, video_ara,
          video_ici_ara) -> 2–3 cumlelik kaynakli ozeti yazar -> KOD denetler
          ve SABLONU kurar: Ozet · Izle · Oku · Siradaki adim.

   Alti kural:

   1. SINIRLI DONGU. En cok ADIM model cagrisi ve SURE saniye; sure dolunca
      eldeki kaynaklarla kapanir. Istemci 60 sn bekler.
   2. KAYNAKSIZ CUMLE CEVABA GIRMEZ. Ozetin her cumlesi [n] ile bir kaynaga
      baglanir; baglanmayan cumle kod tarafindan atilir.
   3. SAYI VE ALINTI KODLA DENETLENIR. Cumledeki her sayi ve «...» alintisi
      gosterdigi kaynagin metninde aranir; bulunmazsa cumle atilir.
   4. LINKI VE «NEDEN»I KOD YAZAR. Model adres yazmaz (yazdigi atilir).
      Izle/Oku satirlarinin gerekcesi kaynagin kendi metninden gelir
      (altyazidaki an, arama ozeti); model uydurmaz.
   5. VIDEO SUZULUR. Ayni kanaldan ikinci video, profilin sinirindan uzun
      ya da bir dakikadan kisa video, basliginda da altyazisinda da konu
      gecmeyen video elenir. Sure ve dil yazilir; dil altyazidan OLCULUR,
      altyazi yoksa basliktan «tahmin» diye yazilir.
   6. YAZMA ONAYLIDIR. «Siradaki adim» yalniz bir ONERIDIR (eylem + hedef);
      ekleme modulun kendi koduyla, kullanicinin onayiyla olur (AGENTS §1.4)."""
import re
import time

from core import ai, arac, kaynakli, web, youtube

ROL = "bam.arastirma"
SABLON = "arastirma.v1"
ADIM = 4                # model cagrisi
SURE = 45               # saniye; istemci 60 sn bekler
ARAC_BASINA = 2         # bir turda calistirilan en cok arac
EN_COK_KAYNAK = 14
OKUMA_HARF = 1800       # okunan sayfadan modele giden en cok harf
WEB_N = 5
VIDEO_N = 8             # aramadan gelen; suzgecten sonra az kalir
AN_ARANAN = 3           # altyazisi taranan video
IZLE_N = 3
OKU_N = 3
OZET_CUMLE = 3
EN_KISA_VIDEO = 60      # saniye; daha kisasi (Shorts) elenir

DIL_AD = {"tr": "Türkçe", "en": "İngilizce", "de": "Almanca", "fr": "Fransızca", "es": "İspanyolca",
          "it": "İtalyanca", "ru": "Rusça", "ar": "Arapça", "ja": "Japonca", "zh": "Çince",
          "ko": "Korece", "pt": "Portekizce", "nl": "Felemenkçe"}
# ESP: ogrenilen dil konudan taninir; ikinci video aramasi o dilde yapilir.
OGRENILEN = (("en", r"ingilizce|english|ingilizcede"), ("de", r"almanca|deutsch"),
             ("fr", r"fransızca|français|francais"), ("es", r"ispanyolca|español|espanol"),
             ("it", r"italyanca|italiano"), ("ru", r"rusça"), ("ar", r"arapça"),
             ("ja", r"japonca"), ("ko", r"korece"))
DERS_SOZ = {"en": "lesson explained", "de": "Lektion erklärt", "fr": "leçon expliquée",
            "es": "lección explicada", "it": "lezione spiegata", "ru": "урок", "ar": "درس",
            "ja": "レッスン", "ko": "강의"}

# MODUL PROFILLERI. `kip`: konudan secilen alt kip (ilk eslesen); her kip
# kendi video ve web sorgu ekini, video sinirini ve siradaki adimini tasir.
PROFIL = {
    "ays": {"ad": "AYS", "max_sure": 90 * 60, "oncelik": (".gov.tr", ".edu.tr", "meb.gov.tr", "osym.gov.tr"),
            "kipler": (
                ("cikmis", r"çıkmış|osym|ösym", "çıkmış sorular çözümü", "çıkmış sorular"),
                ("soru", r"soru çöz|soru çözümü|soru bankası|test çöz", "soru çözümü", "soru çözümü"),
                ("konu", r"", "konu anlatımı", "")),
            "sonraki": {"metin": "«%s» videosunu AYS Öğren’e kaynak olarak ekleyeyim mi?",
                        "eylem": "ays.ogren.kaynak_ekle", "hedef": "video"}},
    "esp": {"ad": "ESP", "max_sure": 60 * 60, "oncelik": (".edu", ".ac.uk", "britannica.com", "wikipedia.org"),
            "kipler": (
                ("kitap", r"kitab|kitap|roman|yazar|öykü|hikâye|hikaye|şiir", "kitap özeti", "kitap özeti"),
                ("kelime", r"kelime|sözcük|vocabulary|deyim|idiom", "kelimeler", "kelime listesi"),
                ("telaffuz", r"telaffuz|okunuş|pronunciation|aksan", "telaffuz", "telaffuz"),
                ("dil", r"dilbilgisi|gramer|grammar|zaman|tense|fiil|edat", "konu anlatımı", "dilbilgisi"),
                ("konu", r"", "konu anlatımı", "")),
            "kip_sure": {"kelime": 20 * 60, "telaffuz": 30 * 60},
            "sonraki": {"metin": "«%s» videosunu ESP kaynaklarına ekleyeyim mi?",
                        "eylem": "esp.kaynak_ekle", "hedef": "video"},
            "kip_sonraki": {
                "kitap": {"metin": "«%s» kitabını ESP kitaplığına ekleyeyim mi?", "eylem": "esp.kitaplik_ekle",
                          "hedef": "konu"},
                "kelime": {"metin": "«%s» videosundaki kelimeleri ESP kelime listene alayım mı?",
                           "eylem": "esp.kelime_ekle", "hedef": "video"}}},
    "spi": {"ad": "SPİ", "max_sure": 40 * 60,
            "oncelik": ("saglik.gov.tr", "who.int", "nih.gov", "cdc.gov", "nhs.uk", "mayoclinic.org",
                        "harvard.edu", ".gov.tr", ".edu.tr", ".gov", ".edu"),
            "kipler": (
                ("hareket", r"egzersiz|antrenman|hareket|squat|şınav|plank|deadlift|bench|mekik|esneme|"
                            r"kardiyo|yoga|pilates|koşu|barfiks|form|ısınma",
                 "doğru form nasıl yapılır", "nasıl yapılır doğru form"),
                ("ogun", r"tarif|yemek|öğün|kahvaltı|beslenme|diyet|protein|kalori|salata|smoothie|çorba",
                 "tarifi", "tarifi besin değeri"),
                ("saglik", r"", "nedir", "nedir")),
            "sonraki": {"metin": "«%s» kaynağını SPİ’ye ekleyeyim mi?", "eylem": "spi.kaynak_ekle",
                        "hedef": "video"},
            "kip_sonraki": {
                "hareket": {"metin": "«%s» videosunu SPİ’de hareket listene ekleyeyim mi?",
                            "eylem": "spi.hareket_ekle", "hedef": "video"},
                "ogun": {"metin": "«%s» videosundaki tarifi SPİ’de öğün olarak ekleyeyim mi?", "eylem": "spi.ogun_ekle",
                         "hedef": "video"}}},
    "genel": {"ad": "Genel", "max_sure": 90 * 60, "oncelik": (),
              "kipler": (("konu", r"", "konu anlatımı", ""),), "sonraki": None},
}
PORT_MODUL = {4173: "ays", 4183: "spi", 4193: "esp"}
# Modul bilinmiyorsa (HKM paneli, Telegram) konudan tahmin.
TAHMIN = (("spi", r"egzersiz|antrenman|squat|şınav|plank|tarif|öğün|beslenme|diyet|kalori|protein|uyku|"
                  r"tansiyon|vitamin|kas|yağ yak"),
          ("esp", r"ingilizce|almanca|fransızca|ispanyolca|dilbilgisi|gramer|grammar|telaffuz|kelime|kitab|"
                  r"kitap|roman|yazar|felsefe|okuma"),
          ("ays", r"türev|integral|limit|tyt|ayt|yks|lgs|kpss|konu anlatımı|fizik|kimya|biyoloji|matematik|"
                  r"geometri|tarih|coğrafya|soru çöz"))

VIDEO_TETIK = re.compile(
    r"(video(?:su|lar[ıi]?|sunu)?\s+(?:bul|getir|ara|öner|göster|aç|var\s+m[ıi])"
    r"|youtube'?(?:da|dan|ta|tan)?\b|yutup|konu anlatım[ıi]\s+(?:bul|getir|öner|ara|göster))", re.I)
VIDEO_DOLGU = re.compile(
    r"(?:^|\s)(youtube'?\w*|yutup\w*|video\w*|bul\w*|getir\w*|öner\w*|göster\w*|ara(?:r\s+m[ıi]s[ıi]n|"
    r"yabilir\s+misin)?|aç\w*|var\s+m[ıi]|için|bana|bir|lütfen|king|konu\s+anlatım[ıi]|"
    r"anlatan|anlatıldığı|hakkında|iyi|güzel|türkçe|m[ıiuü]s[ıiuü]n)(?=\s|$|[.,!?:;])", re.I)

ARACLAR = [
    {"ad": "web_ara", "tur": "oku", "aciklama": "İnternette arar; sonuçlar kaynak listesine numarayla eklenir.",
     "parametreler": {"type": "object", "properties": {
         "sorgu": {"type": "string", "description": "3–10 kelimelik arama sorgusu", "maxLength": 160}},
         "required": ["sorgu"]}},
    {"ad": "sayfa_oku", "tur": "oku", "aciklama": "Kaynak listesindeki bir web sayfasını numarasıyla okur.",
     "parametreler": {"type": "object", "properties": {
         "no": {"type": "integer", "description": "kaynak numarası", "minimum": 1, "maximum": 40}},
         "required": ["no"]}},
    {"ad": "video_ara", "tur": "oku",
     "aciklama": "YouTube'da video arar (Türkçe anlatım önce); videolar kaynak listesine eklenir.",
     "parametreler": {"type": "object", "properties": {
         "sorgu": {"type": "string", "description": "arama sorgusu", "maxLength": 160}},
         "required": ["sorgu"]}},
    {"ad": "video_ici_ara", "tur": "oku",
     "aciklama": "Listedeki bir videonun altyazısında kavramı arar; geçtiği dakikayı ve o andaki sözleri verir.",
     "parametreler": {"type": "object", "properties": {
         "no": {"type": "integer", "description": "video kaynağının numarası", "minimum": 1, "maximum": 40},
         "kavram": {"type": "string", "description": "aranacak kavram", "maxLength": 120}},
         "required": ["no", "kavram"]}},
]

SISTEM = """Sen HKM'deki BAM Araştırma Bürosu'nun hızlı araştırmacısısın. Kullanıcının isteği için
aşağıdaki NUMARALI KAYNAKLARA dayanarak kısa bir ÖZET yazarsın.

- Kaynaklar yetmiyorsa araç çağır: web_ara (yeni arama), sayfa_oku (listedeki sayfayı oku),
  video_ara (YouTube), video_ici_ara (videonun hangi dakikada konuyu anlattığını bul).
- Yetiyorsa araç çağırma; ÖZETİ yaz: 2 ya da 3 kısa, düz cümle. Sesli okunacak: liste, başlık,
  madde işareti, emoji yok. Konunun ne olduğunu anlat; videoları ve linkleri SAYMA, onları sistem ekler.
- HER cümlenin sonuna dayandığı kaynağın numarasını köşeli parantezle yaz: [1] ya da [1][3].
- Kaynakta olmayan bilgiyi yazma; sayıyı kaynaktan aynen al.
- Teşhis koyma, ilaç ya da doz önerme, sonuç garantisi verme."""
SON_TUR = "\n\nAraç hakkın bitti; şimdi yalnız eldeki kaynaklarla özeti yaz."
# Modele kullanicinin ham cumlesi gitmez: «video bul» goren model konuyu
# degil videolari anlatiyordu. Gorev tektir: konunun ozeti.
GOREV = "«%s» konusunu kaynaklara dayanarak 2–3 cümleyle özetle: ne olduğunu ve temel noktasını anlat."
SPI_EK = ("\n\nBu bir SAĞLIK konusu: yalnız güvenilir kaynaktaki bilgiyi yaz; teşhis, tedavi, ilaç ve doz "
          "yazma. Emin değilsen daha az yaz.")

URL_RE = re.compile(r"\(?\s*https?://\S+\s*\)?")
ATIF_RE = re.compile(r"\[(\d{1,2}(?:\s*[,;-]\s*\d{1,2})*)\]")
ALINTI_RE = re.compile(r"[«\"“]([^»\"”]{8,300})[»\"”]")
CUMLE_RE = re.compile(r"(?<=[.!?…])\s+|\n+")
# gemma4 araci bazen yapisal cagri yerine KENDI metin bicimiyle yazar
# (sahada, 2026-10-21): «web_ara{sorgu:<|"|>türev<|"|>}». Katalogdaki ada
# uyan boyle bir metin cagri sayilir; yine arac.cagri_dogrula'dan gecer.
METIN_CAGRI = re.compile(r"(?:<\|tool_call>)?\s*(?:call:)?([a-z_]+)\s*(\{.*?\})\s*(?:<tool_call\|>)?", re.S)


# ------------------------------------------------------------------ istek

def video_istegi(metin):
    """Video istegi mi? Tetik yoksa None; varsa dolgusu atilmis konu."""
    m = str(metin or "").strip()
    if not m or m.startswith("/") or not VIDEO_TETIK.search(m):
        return None
    konu = m
    for _ in range(3):
        konu = VIDEO_DOLGU.sub(" ", konu)
    return re.sub(r"\s+", " ", konu).strip(" .,!?:;'\"«»")


KONU_DOLGU = re.compile(r"(?:^|\s)(kitab[ıi]n[ıi]|kitab[ıi]|roman[ıi]n[ıi]|roman[ıi]|videosunu|videosu|"
                        r"konusunu|konusu|hakkında|ile ilgili)(?=\s|$)", re.I)


def yalin(konu):
    """Arama konusu: «Suç ve Ceza kitabını» -> «Suç ve Ceza», «türev zincir
    kuralını» -> «türev zincir kuralı» (son kelimenin belirtme eki duser)."""
    k = re.sub(r"\s+", " ", KONU_DOLGU.sub(" ", str(konu or ""))).strip(" .,!?:;'\"«»")
    k = re.sub(r"(\w{3,}[ıiuü])n[ıiuü]$", r"\1", k)
    return k[:160] or str(konu or "").strip()[:160]


def hazir_mi(cfg):
    if not web.settings(cfg)["acik"]:
        return {"ok": False, "note": "Web kapalı (Ayarlar › Web)."}
    return ai.hazir_mi(cfg, ROL)


def modul_of(deger=None, koken=None):
    """Istegin modulu: acik alan (ays|spi|esp) once, sonra kokenin portu."""
    if deger in ("ays", "spi", "esp"):
        return deger
    m = re.match(r"^https?://[^/]+:(\d+)$", str(koken or ""))
    return PORT_MODUL.get(int(m.group(1))) if m else None


def profil(modul, konu):
    """(profil_adi, profil, kip, ogrenilen_dil). Modul yoksa konudan tahmin."""
    k = youtube._kucuk(konu)
    if modul not in PROFIL:
        modul = next((m for m, r in TAHMIN if re.search(r, k)), "genel")
    p = PROFIL[modul]
    kip = next(x for x in p["kipler"] if not x[1] or re.search(x[1], k))
    dil = next((d for d, r in OGRENILEN if re.search(r, k)), None) if modul == "esp" else None
    return modul, p, kip, dil


# ----------------------------------------------------------------- kaynak

class _Durum:
    def __init__(self, con, cfg, tasiyici, now, bitis, max_sure=None, terimler=()):
        self.con, self.cfg, self.tasiyici, self.now, self.bitis = con, cfg, tasiyici, now, bitis
        self.max_sure, self.terimler, self.oncelik = max_sure, list(terimler), ()
        self.kaynaklar, self.izler, self.elenen = [], [], []

    def kalan(self):
        return self.bitis - time.monotonic()

    def iz(self, yapti):
        self.izler.append(yapti)

    def ekle(self, k):
        for x in self.kaynaklar:
            if x["url"] == k["url"]:
                return x
        if len(self.kaynaklar) >= EN_COK_KAYNAK:
            return None
        k["no"] = len(self.kaynaklar) + 1
        self.kaynaklar.append(k)
        return k

    def bul(self, no):
        return self.kaynaklar[no - 1] if isinstance(no, int) and 1 <= no <= len(self.kaynaklar) else None


def _oncelikli(alan, oncelik):
    return any(alan == o.lstrip(".") or alan.endswith(o if o.startswith(".") else "." + o) or alan == o
               for o in oncelik)


def web_ara(st, sorgu):
    r = web.ara(st.con, st.cfg, ROL, sorgu, n=WEB_N, tasiyici=st.tasiyici, now=st.now)
    st.iz("web’de arandı: «%s» (%d sonuç)" % (sorgu, len(r.get("sonuclar") or [])))
    ozet = {x["url"]: x.get("ozet") or "" for x in r.get("sonuclar") or []}
    # Modulun guvendigi alanlar once (SPİ: saglik.gov.tr, who.int…); sira icinde kaynakli'nin sirasi.
    adaylar = sorted(kaynakli.aday_sec(r.get("sonuclar") or []),
                     key=lambda x: not _oncelikli(x["alan"] or "", st.oncelik))
    # Alaka: basliginda konunun koklerinin en az yarisi gecmeyen sonuc elenir
    # (sahada: «Suç ve Ceza» -> «Uluslararası Ceza Mahkemesi»).
    n = len(st.terimler)
    esik = n if n <= 2 else (n + 1) // 2
    uyan = [x for x in adaylar if sum(t in youtube._kucuk(x["baslik"]) for t in st.terimler) >= esik]
    for x in adaylar:
        if x not in uyan:
            st.elenen.append({"baslik": x["baslik"], "neden": "konuyla ilgisiz (web)"})
    eklenen = [st.ekle({"tur": "web", "baslik": x["baslik"], "url": x["url"], "alan": x["alan"] or "",
                        "ozet": ozet.get(x["url"], ""), "metin": None}) for x in uyan]
    eklenen = [k for k in eklenen if k]
    return eklenen, (None if eklenen else (r.get("note") or "Konuyla ilgili sonuç yok."))


def sayfa_oku(st, k):
    if not k or k["tur"] != "web":
        return "Bu numarada okunacak bir web sayfası yok."
    if k.get("metin"):
        return None
    s = web.getir(st.con, st.cfg, ROL, k["url"], tasiyici=st.tasiyici, now=st.now)
    st.iz("sayfa okundu: %s%s" % (k["alan"], "" if s.get("ok") else " (okunamadı)"))
    if not s.get("ok"):
        k["okunamadi"] = s.get("note")
        return s.get("note")
    k["metin"] = s["metin"]
    k["baslik"] = s.get("baslik") or k["baslik"]
    return None


def _basligi_uyar(v, terimler):
    b = youtube._kucuk("%s %s" % (v.get("baslik"), v.get("kanal")))
    return any(t in b for t in terimler)


def video_ara(st, sorgu):
    """Arar ve SUZER (kural 5): ayni kanal, sinir disi sure. Konuyla ilgisi
    basliktan ya da altyazidan sinanir; ilgisiz olan secimde elenir."""
    r = youtube.ara(st.con, st.cfg, ROL, sorgu, n=VIDEO_N, tasiyici=st.tasiyici, now=st.now)
    kanallar = {x.get("kanal") for x in st.kaynaklar if x["tur"] == "video"}
    eklenen, elenen = [], 0
    for v in r.get("videolar") or []:
        neden = None
        if v.get("kanal") and v["kanal"] in kanallar:
            neden = "aynı kanal"
        elif v.get("sure") and v["sure"] > (st.max_sure or 10 ** 9):
            neden = "çok uzun (%s)" % youtube.sure_yaz(v["sure"])
        elif v.get("sure") and v["sure"] < EN_KISA_VIDEO:
            neden = "çok kısa"
        if neden:
            elenen += 1
            st.elenen.append({"baslik": v["baslik"], "neden": neden})
            continue
        k = st.ekle({"tur": "video", "baslik": v["baslik"], "url": v["url"], "alan": "youtube.com",
                     "kanal": v.get("kanal") or "", "id": v["id"], "sure": v.get("sure"),
                     "ozet": "", "metin": None, "an": None,
                     "baslik_uyar": _basligi_uyar(v, st.terimler)})
        if k:
            kanallar.add(k["kanal"])
            eklenen.append(k)
    st.iz("YouTube’da arandı: «%s» (%d video, %d elendi)" % (sorgu, len(eklenen), elenen))
    return eklenen, (None if eklenen else (r.get("note") or "Uygun video bulunamadı."))


def video_ici_ara(st, k, kavram):
    if not k or k["tur"] != "video":
        return "Bu numarada bir video yok."
    t = youtube.transkript(st.con, st.cfg, ROL, k["id"], tasiyici=st.tasiyici, now=st.now)
    k["altyazi_tarandi"] = True
    if not t.get("ok"):
        k["altyazi_yok"] = t.get("note")
        st.iz("altyazı okunamadı: %s" % k["baslik"][:60])
        return t.get("note")
    k["dil"], k["otomatik"] = t.get("dil"), t.get("otomatik")
    if t.get("sure") and not k.get("sure"):
        k["sure"] = t["sure"]
    a = youtube.an_bul(t["parcalar"], kavram)
    st.iz("altyazıda «%s» arandı: %s" % (kavram, a["an"] if a else "geçmiyor"))
    if not a:
        return "«%s» bu videonun altyazısında geçmiyor." % kavram
    k["an"] = dict(a, kavram=kavram, link=youtube.link(k["id"], a["saniye"]))
    k["metin"] = a["alinti"]
    return None


def _imza(c):
    return c["ad"] + repr(sorted(c["param"].items()))


def metin_cagrilari(metin, katalog):
    adlar = {a["ad"] for a in katalog}
    return [{"ad": ad, "param": govde.replace('<|"|>', '"')}
            for ad, govde in METIN_CAGRI.findall(str(metin or "")) if ad in adlar]


def _calistir(st, c):
    p = c["param"]
    if c["ad"] == "web_ara":
        return web_ara(st, p["sorgu"])[1]
    if c["ad"] == "video_ara":
        return video_ara(st, p["sorgu"])[1]
    if c["ad"] == "sayfa_oku":
        return sayfa_oku(st, st.bul(p["no"]))
    if c["ad"] == "video_ici_ara":
        return video_ici_ara(st, st.bul(p["no"]), p["kavram"])
    return "bilinmeyen araç"


def _kucult(metin, terimler, n=OKUMA_HARF):
    """Okunan sayfanin konuyla ilgili paragraflari (kodla secilir)."""
    paragraflar = [p.strip() for p in re.split(r"\n\s*\n|\n", metin or "") if len(p.strip()) > 40]
    ilgili = [p for p in paragraflar if any(t in youtube._kucuk(p) for t in terimler)]
    out = ""
    for p in (ilgili or paragraflar):
        if len(out) + len(p) > n:
            out += p[:max(0, n - len(out))]
            break
        out += p + "\n"
    return out.strip()


def kaynak_blogu(st, terimler):
    """Modele giden numarali liste. Okunacak web metni varsa videolarin
    altyazisi verilmez: sahada ozet konuyu degil videolari anlatti
    («Ayse Eser'in videosunda…»). Web yoksa altyazi ozetin dayanagidir."""
    web_var = any(k["tur"] == "web" and (k.get("metin") or k.get("ozet")) for k in st.kaynaklar)
    satir = []
    for k in st.kaynaklar:
        if k["tur"] == "video":
            s = "[%d] VİDEO «%s» · %s" % (k["no"], k["baslik"], k["kanal"] or "?")
            if web_var:
                s += " (özette kullanma; videoları sistem listeler)"
            elif k.get("an"):
                s += "\n    %s'de geçiyor: «%s»" % (k["an"]["an"], k["an"]["alinti"][:300])
        else:
            s = "[%d] %s (%s)" % (k["no"], k["baslik"], k["alan"])
            if k.get("metin"):
                s += "\n    OKUNDU: " + _kucult(k["metin"], terimler).replace("\n", " ")
            elif k.get("ozet"):
                s += "\n    özet: " + k["ozet"][:300]
        satir.append(s)
    return "KAYNAKLAR\n" + ("\n".join(satir) if satir else "(henüz kaynak yok)")


# --------------------------------------------------------------- denetim

def _dogrulama_metni(k):
    parca = [k.get("baslik") or "", k.get("ozet") or "", k.get("metin") or "", k.get("kanal") or ""]
    if k.get("an"):
        parca += [k["an"]["an"], k["an"]["alinti"]]
    if k.get("sure"):
        parca.append(youtube.sure_yaz(k["sure"]))
    return "\n".join(parca)


def _sayi_var(sayi, metin):
    for s in {sayi, sayi.replace(",", "."), sayi.replace(".", ",")}:
        if re.search(r"(?<![\d])" + re.escape(s) + r"(?![\d])", metin):
            return True
    return False


def denetle(cevap, kaynaklar):
    """Modelin cevabini cumle cumle denetler. Doner: (tutulan, atilan).
    Tutulan her cumle {metin, kaynaklar}; atilan {metin, neden}."""
    harita = {k["no"]: k for k in kaynaklar}
    tutulan, atilan = [], []
    # Link ve bicim isareti (LaTeX $…$, **kalin**) atilir: ozet sesli okunur.
    metin = re.sub(r"\$|\*\*|__|`", "", URL_RE.sub(" ", str(cevap or "")))
    for ham in CUMLE_RE.split(metin):
        c = re.sub(r"^\s*(?:[-*•#]+|\d+[.)])\s+", "", ham).strip()
        if len(c) < 3:
            continue
        nlar = []
        for grup in ATIF_RE.findall(c):
            for n in re.findall(r"\d+", grup):
                if int(n) in harita and int(n) not in nlar:
                    nlar.append(int(n))
        govde = re.sub(r"\s+([.,!?])", r"\1", ATIF_RE.sub("", c)).strip()
        govde = re.sub(r"[\s,;:]+([.!?…]*)$", r"\1", govde)          # «edilebilir,,.» -> «edilebilir.»
        if not nlar:
            atilan.append({"metin": govde, "neden": "kaynak gösterilmemiş"})
            continue
        # Liste satiri ya da baslik kopyasi ozet degildir (sahada gemma4:e2b
        # «VİDEO «…» [4].» diye kaynak listesini geri yazdi).
        if (re.search(r"VİDEO|KAYNAKLAR|OKUNDU:", govde) or len(re.findall(r"\w+", govde)) < 4 or len(nlar) > 3
                or any(kaynakli._norm(govde).strip(" .«»") == kaynakli._norm(harita[n]["baslik"]) for n in nlar)):
            atilan.append({"metin": govde, "neden": "liste satırı, özet değil"})
            continue
        # Video BASLIGI dayanak degildir (sahada SPİ: «yedikçe zayıfla» başlığından
        # saglik iddiasi); video ancak altyazidaki aniyla kaynak olur.
        if all(harita[n]["tur"] == "video" and not harita[n].get("an") for n in nlar):
            atilan.append({"metin": govde, "neden": "yalnız video başlığına dayanıyor"})
            continue
        dayanak = "\n".join(_dogrulama_metni(harita[n]) for n in nlar)
        eksik = [s for s in ai.SAYI.findall(govde) if not _sayi_var(s.lstrip("-"), dayanak)]
        if eksik:
            atilan.append({"metin": govde, "neden": "sayı kaynakta yok: %s" % ", ".join(eksik[:3])})
            continue
        uyumsuz = [a for a in ALINTI_RE.findall(govde) if kaynakli._norm(a) not in kaynakli._norm(dayanak)]
        if uyumsuz:
            atilan.append({"metin": govde, "neden": "alıntı kaynakta yok"})
            continue
        tutulan.append({"metin": govde, "kaynaklar": nlar})
    return tutulan, atilan


# ----------------------------------------------------------------- sablon

def _kisa(s, n=160):
    s = re.sub(r"\s+", " ", str(s or "")).strip()
    return s if len(s) <= n else s[:n].rsplit(" ", 1)[0] + "…"


def _cumle(c):
    """Duz cumle, noktali: sesli okunur."""
    s = c["metin"].rstrip()
    return s if re.search(r"[.!?…]$", s) else s + "."


def _atifli(c):
    """«...işlemdir [1].» — atif cumlenin noktasindan once."""
    m = re.match(r"^(.*?)([.!?…]*)$", c["metin"].rstrip(), re.S)
    return "%s [%s]%s" % (m.group(1).rstrip(), "][".join(str(n) for n in c["kaynaklar"]), m.group(2) or ".")


def _dil(k):
    """(etiket, kaynak): altyazidan OLCULDU; yoksa basliktan TAHMIN; yoksa None."""
    if k.get("dil"):
        kod = str(k["dil"]).split("-")[0]
        return DIL_AD.get(kod, kod), "olculdu"
    if youtube.turkce_mi(k):
        return "Türkçe", "tahmin"
    return None, None


def izle_sec(kaynaklar):
    """Ani bulunan once; sonra basligi konuya uyan (altyazisi taranmamis ya
    da yok). Basliginda da altyazisinda da konu gecmeyen video gosterilmez."""
    vids = [k for k in kaynaklar if k["tur"] == "video"]
    anili = [k for k in vids if k.get("an")]
    diger = [k for k in vids if not k.get("an") and k.get("baslik_uyar")
             and not (k.get("altyazi_tarandi") and not k.get("altyazi_yok"))]
    out = []
    for k in anili + diger:
        dil, dil_kaynak = _dil(k)
        if k.get("an"):
            # Ek yok: «2:46’ten» gibi saat okunusuna uymayan ek yanlis olurdu.
            neden = "Konunun geçtiği an %s: «%s»" % (k["an"]["an"], _kisa(k["an"]["alinti"], 120))
        elif k.get("altyazi_yok"):
            neden = "Başlığı konuyla örtüşüyor; altyazısı olmadığı için dakika bulunamadı."
        else:
            neden = "Başlığı konuyla örtüşüyor; altyazısı taranmadı."
        out.append({"no": k["no"], "baslik": k["baslik"], "kanal": k["kanal"],
                    "sure_sn": k.get("sure"), "sure": youtube.sure_yaz(k["sure"]) if k.get("sure") else None,
                    "dil": dil, "dil_etiket": dil_kaynak, "otomatik_altyazi": k.get("otomatik"),
                    "an": (k.get("an") or {}).get("an"), "saniye": (k.get("an") or {}).get("saniye"),
                    "link": (k.get("an") or {}).get("link") or k["url"], "video_id": k["id"], "neden": neden})
        if len(out) >= IZLE_N:
            break
    return out


def _ilk_cumle(metin, terimler):
    """Kaynagin kendi cumlesi: konuyu tasiyan ilk duz cumle. Dipnot («^ a b»),
    soru ve yarim parca gerekce olmaz; uygun cumle yoksa None."""
    for c in re.split(r"(?<=[.!?])\s+", re.sub(r"\s+", " ", str(metin or "")).strip()):
        if (len(c) > 30 and c[0].isalpha() and c[0].isupper() and not c.endswith("?") and "^" not in c
                and (not terimler or any(t in youtube._kucuk(c) for t in terimler))):
            return _kisa(c, 170)
    return None


TUR_AD = {"resmi": "Resmî kaynak", "akademik": "Akademik", "ansiklopedi": "Ansiklopedi",
          "kurum": "Kurum", "diger": "Web"}


def oku_sec(kaynaklar, tutulan, terimler):
    """Ozette atif alan once, sonra okunan, sonra kalan; en cok OKU_N."""
    atif = [n for c in tutulan for n in c["kaynaklar"]]
    web_ = [k for k in kaynaklar if k["tur"] == "web"]
    sira = sorted(web_, key=lambda k: (k["no"] not in atif, not k.get("metin"), k["no"]))
    out = []
    for k in sira[:OKU_N]:
        tur = kaynakli.kaynak_turu(k["alan"])
        cumle = _ilk_cumle(k.get("metin"), terimler) or _ilk_cumle(k.get("ozet"), terimler)
        out.append({"no": k["no"], "baslik": k["baslik"], "site": k["alan"], "url": k["url"],
                    "tur": tur, "okundu": bool(k.get("metin")),
                    "neden": "%s: %s" % (TUR_AD.get(tur, "Web"), cumle) if cumle else TUR_AD.get(tur, "Web")})
    return out


def sonraki_sec(modul, p, kip, konu, izle, oku):
    """Onayli ekleme ONERISI; yazmayi modul yapar (kural 6)."""
    s = (p.get("kip_sonraki") or {}).get(kip[0]) or p.get("sonraki")
    if not s:
        return None
    if s["hedef"] == "konu":
        ad, hedef = konu, {"tur": "konu", "konu": konu}
    elif izle:
        v = izle[0]
        ad = v["baslik"]
        hedef = {"tur": "video", "no": v["no"], "baslik": v["baslik"], "kanal": v["kanal"], "link": v["link"],
                 "video_id": v["video_id"], "saniye": v["saniye"], "sure_sn": v["sure_sn"]}
    elif oku:
        ad = oku[0]["baslik"]
        hedef = {"tur": "kaynak", "no": oku[0]["no"], "baslik": ad, "url": oku[0]["url"]}
    else:
        return None
    if s["hedef"] == "video" and hedef["tur"] == "kaynak":
        metin = "«%s» kaynağını %s’ye eklememi ister misin?" % (_kisa(ad, 70), p["ad"])
    else:
        metin = s["metin"] % _kisa(ad, 70)
    return {"metin": metin, "eylem": s["eylem"], "modul": modul, "onay": True, "kip": kip[0], "hedef": hedef}


def sablon_kur(konu, modul, p, kip, tutulan, kaynaklar, terimler):
    """Kart verisi + ayni bilginin duz metni. Metni ve linkleri KOD kurar."""
    ozet_c = tutulan[:OZET_CUMLE]
    izle = izle_sec(kaynaklar)
    oku = oku_sec(kaynaklar, ozet_c, terimler)
    if not (ozet_c or izle or oku):
        return None, None
    sonraki = sonraki_sec(modul, p, kip, konu, izle, oku)
    veri = {"sablon": SABLON, "modul": modul, "kip": kip[0], "konu": konu,
            "ozet": {"metin": " ".join(_cumle(c) for c in ozet_c),
                     "cumleler": [{"metin": _cumle(c), "kaynaklar": c["kaynaklar"]} for c in ozet_c]}
            if ozet_c else None,
            "izle": izle, "oku": oku, "sonraki": sonraki}
    satir = ["Özet", " ".join(_atifli(c) for c in ozet_c) if ozet_c else
             "Kaynaklardan doğrulanmış kısa bir özet çıkaramadım; aşağıdaki kaynaklara bakabilirsin."]
    if izle:
        satir += ["", "İzle"]
        for v in izle:
            bilgi = " · ".join(x for x in (
                v["kanal"], v["sure"], ("%s (tahmin)" % v["dil"]) if v["dil_etiket"] == "tahmin" else v["dil"],
                ("başlangıç %s" % v["an"]) if v["an"] else None) if x)
            satir += ["[%d] %s" % (v["no"], v["baslik"]), "    " + bilgi, "    " + v["neden"], "    " + v["link"]]
    if oku:
        satir += ["", "Oku"]
        for k in oku:
            satir += ["[%d] %s (%s)" % (k["no"], k["baslik"], k["site"]), "    " + k["neden"], "    " + k["url"]]
    if sonraki:
        satir += ["", "Sıradaki adım", sonraki["metin"] + " Onay vermeden hiçbir şey eklenmez."]
    return "\n".join(satir), veri


# ------------------------------------------------------------------ yap

def yap(con, cfg, metin, konu=None, video=False, modul=None, transport=None, tasiyici=None, now=None,
        adim=ADIM, sure=SURE):
    """Hizli arastirma. Doner: {ok, text, sablon, kaynaklar, izler, atilan, elenen, adim, saniye, note}.
    ok=False ve kaynak yoksa cagiran eski yola (is emri) doner."""
    t0 = time.monotonic()
    konu = yalin(konu or metin)
    modul, p, kip, ogrenilen = profil(modul, "%s %s" % (metin or "", konu))   # kip ilk cumleden
    terimler = youtube.kokler(konu)
    st = _Durum(con, cfg, tasiyici, now, t0 + sure,
                max_sure=(p.get("kip_sure") or {}).get(kip[0]) or p["max_sure"], terimler=terimler)
    st.oncelik = p["oncelik"]
    # 1 — ILK ARAMALARI KOD YAPAR: kucuk model bos elle baslamaz.
    bulunan, _ = web_ara(st, ("%s %s" % (konu, kip[3])).strip())
    if not bulunan and kip[3]:
        # Anahtarsiz Vikipedi uzun ekli sorguda bos doner (sahada: «squat
        # doğru formu nasıl yapılır doğru form» -> 0): yalin konuyla bir kez daha.
        bulunan, _ = web_ara(st, konu)
    if bulunan:
        sayfa_oku(st, bulunan[0])
    sorgular = ["%s %s" % (konu, kip[2])]
    if ogrenilen and ogrenilen in DERS_SOZ:
        # ogrenilen dilde anlatim: dilin Turkce adi sorgudan duser
        yabanci = re.sub(dict(OGRENILEN)[ogrenilen], " ", konu, flags=re.I)
        sorgular.append("%s %s" % (re.sub(r"\s+", " ", yabanci).strip(), DERS_SOZ[ogrenilen]))
    elif kip[0] == "kitap":
        sorgular.append("%s yazar söyleşi" % konu)
    gruplar = []
    for q in sorgular:
        if st.kalan() > 10:
            # Basligi konuya uyan once; ilgisizin ilgisi altyazidan sinanir.
            gruplar.append(sorted(video_ara(st, q.strip())[0], key=lambda k: not k.get("baslik_uyar")))
    # Her aramadan aday: ESP'de ogrenilen dildeki anlatim da taranir.
    adaylar = (gruplar[0][:2] + gruplar[1][:1]) if len(gruplar) > 1 else (gruplar[0] if gruplar else [])
    adaylar += [k for g in gruplar for k in g if k not in adaylar]
    for k in adaylar[:AN_ARANAN]:
        if st.kalan() < 12:
            break
        video_ici_ara(st, k, konu)
    if not st.kaynaklar:
        return {"ok": False, "text": None, "sablon": None, "kaynaklar": [], "izler": st.izler,
                "note": "Web’de kaynak bulunamadı ya da web’e çıkılamadı."}
    # 2 — DONGU: model gerekirse arar ve okur, sonra ozeti yazar; sinir adim ve sure.
    katalog = arac.katalog_temizle(ARACLAR)[0]
    cevap, n_adim, model_notu, yapilan = None, 0, None, set()
    while n_adim < adim and st.kalan() > 6:
        n_adim += 1
        son = n_adim == adim or st.kalan() < 15
        sistem = (SISTEM + (SPI_EK if modul == "spi" else "")
                  + "\n\n" + kaynak_blogu(st, terimler) + (SON_TUR if son else ""))
        r = ai.ask(con, cfg, ROL, "arastirma_hizli", [{"role": "user", "content": GOREV % konu}],
                   sistem=sistem, transport=transport, now=now, denetim="belge", duzeltme=False,
                   jeton=500, araclar=None if son else katalog)
        if not r.get("ok"):
            model_notu = r.get("note")
            break
        cagrilar = r.get("cagrilar") or metin_cagrilari(r.get("text"), katalog)
        gecerli = arac.cagri_dogrula(cagrilar, katalog)[0] if cagrilar else []
        yeni = [c for c in gecerli if _imza(c) not in yapilan]
        if yeni and not son:
            for c in yeni[:ARAC_BASINA]:
                if st.kalan() < 4:
                    break
                yapilan.add(_imza(c))
                _calistir(st, c)
            continue
        if cagrilar and not son:
            # Gecersiz ya da ayni cagri: bir tur daha, ama arac hakki biter.
            adim = min(adim, n_adim + 1)
            continue
        if (r.get("text") or "").strip() and not metin_cagrilari(r.get("text"), katalog):
            cevap = r["text"]
            break
    tutulan, atilan = denetle(cevap, st.kaynaklar) if cevap else ([], [])
    govde, veri = sablon_kur(konu, modul, p, kip, tutulan, st.kaynaklar, terimler)
    return {"ok": bool(govde), "text": govde, "sablon": veri, "kaynaklar": [
        {k_: v for k_, v in k.items() if k_ not in ("metin",)} for k in st.kaynaklar],
        "izler": st.izler, "atilan": atilan, "elenen": st.elenen, "adim": n_adim,
        "model_notu": model_notu, "saniye": round(time.monotonic() - t0, 1),
        "note": None if govde else "Kaynak bulundu ama cevap kurulamadı."}
