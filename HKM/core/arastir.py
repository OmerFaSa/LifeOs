# -*- coding: utf-8 -*-
"""BAM hizli arastirma — sohbetin icinde, SUNUCU tarafinda (H1, 2026-10-21;
depo sahibi: «YouTube'a gidip arastirma yapabilecek, link getirebilecek,
kaynak getirebilecek»).

   King arastirmayi kendisi yapmaz: «X'i arastir», «zincir kurali icin
   video bul» diyen mesaji BAM Arastirma Burosu'nun bu hizli yoluna verir
   (rol `bam.arastirma`, model atamasi oradan; sahada gemma4:e2b). Uzun,
   kalici, depoya giren rapor yine is emriyle yazilir (core/bam.py); bu yol
   sohbet suresinde biten kisa, kaynakli cevaptir.

   Akis:  KOD ilk aramayi yapar (video istendiyse YouTube + altyazida an)
          -> model kaynaklara bakar; yetmiyorsa ARAC cagirir (web_ara,
          sayfa_oku, video_ara, video_ici_ara) -> kod calistirir, kaynak
          listesine ekler -> model kaynakli kisa cevabi yazar -> KOD denetler.

   Bes kural:

   1. SINIRLI DONGU. En cok ADIM model cagrisi ve SURE saniye; sure dolunca
      eldeki kaynaklarla kapanir. Istemci 60 sn bekler.
   2. KAYNAKSIZ CUMLE CEVABA GIRMEZ. Her cumle [n] ile bir kaynaga baglanir;
      baglanmayan cumle kod tarafindan atilir.
   3. SAYI VE ALINTI KODLA DENETLENIR. Cumledeki her sayi ve «...» alintisi
      gosterdigi kaynagin metninde aranir; bulunmazsa cumle atilir.
   4. LINKI KOD YAZAR. Model adres yazmaz (yazdigi atilir); kaynak listesi
      ve video anlari (watch?v=ID&t=SANIYEs) koddan gelir.
   5. MODEL YOKSA DA LISTE VAR. Model cevap yazamazsa ya da her cumlesi
      duserse kullanici bulunan kaynaklari ve video anlarini yine alir."""
import re
import time

from core import ai, arac, kaynakli, web, youtube

ROL = "bam.arastirma"
ADIM = 4                # model cagrisi
SURE = 45               # saniye; istemci 60 sn bekler
ARAC_BASINA = 2         # bir turda calistirilan en cok arac
EN_COK_KAYNAK = 12
OKUMA_HARF = 1800       # okunan sayfadan modele giden en cok harf
WEB_N = 5
VIDEO_N = 4
AN_ARANAN = 3           # video isteginde altyazisi taranan ilk video

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
     "aciklama": "YouTube'da video arar (Türkçe konu anlatımı önce); videolar kaynak listesine eklenir.",
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

SISTEM = """Sen HKM'deki BAM Araştırma Bürosu'nun hızlı araştırmacısısın. Kullanıcının isteğini
aşağıdaki NUMARALI KAYNAKLARA dayanarak cevaplarsın.

- Kaynaklar yetmiyorsa araç çağır: web_ara (yeni arama), sayfa_oku (listedeki sayfayı oku),
  video_ara (YouTube), video_ici_ara (videonun hangi dakikada konuyu anlattığını bul).
- Yetiyorsa araç çağırma; cevabı yaz: en çok 5 kısa cümle, düzgün Türkçe.
- HER cümlenin sonuna dayandığı kaynağın numarasını köşeli parantezle yaz: [1] ya da [1][3].
- Kaynakta olmayan bilgiyi yazma; sayıyı kaynaktan aynen al. Link yazma, linkleri sistem ekler.
- Video istendiyse hangi videonun hangi dakikada konuyu anlattığını söyle (dakika listede yazar).
- Teşhis koyma, ilaç ya da doz önerme, sonuç garantisi verme."""
SON_TUR = "\n\nAraç hakkın bitti; şimdi yalnız eldeki kaynaklarla cevabı yaz."
VIDEO_ISTEK = "\n\nİSTEK VİDEO: YouTube videosu ve konunun anlatıldığı dakika bekleniyor."

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


def hazir_mi(cfg):
    if not web.settings(cfg)["acik"]:
        return {"ok": False, "note": "Web kapalı (Ayarlar › Web)."}
    return ai.hazir_mi(cfg, ROL)


# ----------------------------------------------------------------- kaynak

class _Durum:
    def __init__(self, con, cfg, tasiyici, now, bitis):
        self.con, self.cfg, self.tasiyici, self.now, self.bitis = con, cfg, tasiyici, now, bitis
        self.kaynaklar, self.izler = [], []

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


def web_ara(st, sorgu):
    r = web.ara(st.con, st.cfg, ROL, sorgu, n=WEB_N, tasiyici=st.tasiyici, now=st.now)
    st.iz("web’de arandı: «%s» (%d sonuç)" % (sorgu, len(r.get("sonuclar") or [])))
    ozet = {x["url"]: x.get("ozet") or "" for x in r.get("sonuclar") or []}
    eklenen = [st.ekle({"tur": "web", "baslik": x["baslik"], "url": x["url"], "alan": x["alan"] or "",
                        "ozet": ozet.get(x["url"], ""), "metin": None})
               for x in kaynakli.aday_sec(r.get("sonuclar") or [])]
    eklenen = [k for k in eklenen if k]
    return eklenen, (None if eklenen else (r.get("note") or "Sonuç yok."))


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


def video_ara(st, sorgu):
    r = youtube.ara(st.con, st.cfg, ROL, sorgu, n=VIDEO_N, tasiyici=st.tasiyici, now=st.now)
    st.iz("YouTube’da arandı: «%s» (%d video)" % (sorgu, len(r.get("videolar") or [])))
    eklenen = [st.ekle({"tur": "video", "baslik": v["baslik"], "url": v["url"], "alan": "youtube.com",
                        "kanal": v.get("kanal") or "", "id": v["id"], "sure": v.get("sure"),
                        "ozet": "", "metin": None, "an": None})
               for v in r.get("videolar") or []]
    eklenen = [k for k in eklenen if k]
    return eklenen, (None if eklenen else (r.get("note") or "Video bulunamadı."))


def video_ici_ara(st, k, kavram):
    if not k or k["tur"] != "video":
        return "Bu numarada bir video yok."
    t = youtube.transkript(st.con, st.cfg, ROL, k["id"], tasiyici=st.tasiyici, now=st.now)
    if not t.get("ok"):
        k["altyazi_yok"] = t.get("note")
        st.iz("altyazı okunamadı: %s" % k["baslik"][:60])
        return t.get("note")
    a = youtube.an_bul(t["parcalar"], kavram)
    st.iz("altyazıda «%s» arandı: %s" % (kavram, a["an"] if a else "geçmiyor"))
    if not a:
        return "«%s» bu videonun altyazısında geçmiyor." % kavram
    k["an"] = dict(a, kavram=kavram, link=youtube.link(k["id"], a["saniye"]), otomatik=t.get("otomatik"))
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
    satir = []
    for k in st.kaynaklar:
        if k["tur"] == "video":
            s = "[%d] VİDEO «%s» · %s%s" % (k["no"], k["baslik"], k["kanal"] or "?",
                                           " · süre %s" % youtube.sure_yaz(k["sure"]) if k.get("sure") else "")
            if k.get("an"):
                s += "\n    %s'de geçiyor: «%s»" % (k["an"]["an"], k["an"]["alinti"][:300])
            elif k.get("altyazi_yok"):
                s += "\n    (altyazı yok; dakika bilinmiyor)"
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
    metin = URL_RE.sub(" ", str(cevap or ""))
    for ham in CUMLE_RE.split(metin):
        c = re.sub(r"^\s*(?:[-*•]|\d+[.)])\s+", "", ham).strip()
        if len(c) < 3:
            continue
        nlar = []
        for grup in ATIF_RE.findall(c):
            for n in re.findall(r"\d+", grup):
                if int(n) in harita and int(n) not in nlar:
                    nlar.append(int(n))
        govde = re.sub(r"\s+([.,!?])", r"\1", ATIF_RE.sub("", c)).strip()
        if not nlar:
            atilan.append({"metin": govde, "neden": "kaynak gösterilmemiş"})
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


# ------------------------------------------------------------------ cevap

def _kaynak_satiri(k):
    if k["tur"] == "video":
        s = "[%d] ▶ %s · %s" % (k["no"], k["baslik"], k["kanal"] or "YouTube")
        if k.get("an"):
            return s + " · dk. %s — %s\n    «%s»%s" % (
                k["an"]["an"], k["an"]["link"], _kisa(k["an"]["alinti"]),
                " (otomatik altyazı)" if k["an"].get("otomatik") else "")
        return s + " — " + k["url"]
    return "[%d] %s (%s) — %s" % (k["no"], k["baslik"], k["alan"], k["url"])


def _kisa(s, n=160):
    s = re.sub(r"\s+", " ", str(s or "")).strip()
    return s if len(s) <= n else s[:n].rsplit(" ", 1)[0] + "…"


def _atifli(c):
    """«...işlemdir [1].» — atif cumlenin noktasindan once."""
    m = re.match(r"^(.*?)([.!?…]*)$", c["metin"].rstrip(), re.S)
    return "%s [%s]%s" % (m.group(1).rstrip(), "][".join(str(n) for n in c["kaynaklar"]), m.group(2) or ".")


def metin_kur(tutulan, kaynaklar, video):
    """Kullaniciya giden metni KOD kurar: denetlenmis cumleler + kaynaklar."""
    anili = [k for k in kaynaklar if k["tur"] == "video" and k.get("an")]
    gosterilen = {n for c in tutulan for n in c["kaynaklar"]}
    if video:
        # Video isteginin teslimati videodur: ani bulunanlar her durumda listede.
        gosterilen |= {k["no"] for k in anili[:3]}
        if not gosterilen:
            gosterilen = {k["no"] for k in kaynaklar if k["tur"] == "video"}
    if not gosterilen:
        # Model cevap yazamadi: okunan sayfalar (yoksa ilk uc kaynak) listelenir.
        gosterilen = {k["no"] for k in kaynaklar if k.get("metin")} or {k["no"] for k in kaynaklar[:3]}
    liste = [k for k in kaynaklar if k["no"] in gosterilen]
    if tutulan:
        bas = " ".join(_atifli(c) for c in tutulan)
    elif video and anili:
        bas = "Türkçe anlatımlar; konunun geçtiği dakikayı altyazıdan buldum, link o andan açılır."
    elif liste:
        bas = "Kaynaklardan doğrulanmış bir özet çıkaramadım; bulduğum kaynaklar şunlar:"
    else:
        return None
    return bas + "\n\nKaynaklar\n" + "\n".join(_kaynak_satiri(k) for k in liste)


def yap(con, cfg, metin, konu=None, video=False, transport=None, tasiyici=None, now=None,
        adim=ADIM, sure=SURE):
    """Hizli arastirma. Doner: {ok, text, kaynaklar, izler, atilan, adim, saniye, note}.
    ok=False ve kaynak yoksa cagiran eski yola (is emri) doner."""
    t0 = time.monotonic()
    st = _Durum(con, cfg, tasiyici, now, t0 + sure)
    konu = (konu or metin or "").strip()[:160]
    terimler = youtube.kokler(konu)
    # 1 — ILK ARAMAYI KOD YAPAR: kucuk model bos elle baslamaz.
    if video:
        vids, _ = video_ara(st, konu + " konu anlatımı")
        for k in vids[:AN_ARANAN]:
            if st.kalan() < 8:
                break
            video_ici_ara(st, k, konu)
    else:
        bulunan, _ = web_ara(st, konu)
        if bulunan:
            sayfa_oku(st, bulunan[0])
    if not st.kaynaklar:
        return {"ok": False, "text": None, "kaynaklar": [], "izler": st.izler,
                "note": "Web’de kaynak bulunamadı ya da web’e çıkılamadı."}
    # 2 — DONGU: model arar, okur, yazar; sinir adim ve sure.
    katalog = arac.katalog_temizle(ARACLAR)[0]
    cevap, n_adim, model_notu, yapilan = None, 0, None, set()
    # Video isteginde an bulunduysa teslimat hazirdir ve cevabi KOD kurar:
    # sahada gemma4:e2b hazir videoyu birakip web'de ayni sorguyu uc kez
    # aradi, bir baska denemede listeyi bozarak kopyaladi. Model yalniz an
    # bulunamadiysa arar.
    if video and any(k.get("an") for k in st.kaynaklar):
        adim = 0
    while n_adim < adim and st.kalan() > 6:
        n_adim += 1
        son = n_adim == adim or st.kalan() < 15
        sistem = (SISTEM + (VIDEO_ISTEK if video else "")
                  + "\n\n" + kaynak_blogu(st, terimler) + (SON_TUR if son else ""))
        r = ai.ask(con, cfg, ROL, "arastirma_hizli", [{"role": "user", "content": str(metin)[:600]}],
                   sistem=sistem, transport=transport, now=now, denetim="belge", duzeltme=False,
                   jeton=700, araclar=None if son else katalog)
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
    govde = metin_kur(tutulan, st.kaynaklar, video)
    return {"ok": bool(govde), "text": govde, "kaynaklar": [
        {k_: v for k_, v in k.items() if k_ not in ("metin",)} for k in st.kaynaklar],
        "izler": st.izler, "atilan": atilan, "adim": n_adim, "model_notu": model_notu,
        "saniye": round(time.monotonic() - t0, 1),
        "note": None if govde else "Kaynak bulundu ama cevap kurulamadı."}
