# -*- coding: utf-8 -*-
"""BAM — Bilgi ve Aksiyon Modulu. HKM'nin alt moduludur; besinci bir
sistem degildir (AGENTS.md §1.4).

   BAM bilgiyi uretir ve uygulanabilir aksiyona donusturur. Dort ofisi
   vardir; her iste hepsi calismaz, BAM Patronu gerekenleri secer:

     Depolama    (id: kayit) her is ONCE buradan gecer. Var olan bilgiyi
                 denetler ve duzenler; arastirilacak konu depoda varsa
                 kaynaklarini canli acip GUNCEL MI diye olcer: guncelse
                 kaydi gonderir (arastirma yapilmaz), degistiyse yeni surum
                 ister (core/depo.py). Model gerektirmez.
     Arastirma   alt sorular, web aramasi, sayfa okuma ve numarali kaynakli
                 bulgular (core/kaynakli.py); her alinti KODLA kaynaginda aranir.
                 Web kapaliysa ya da sonuc yoksa kayit «dogrulanmadi» kalir.
     Planlama    v1 (core/planlama.py): modulun gonderdigi YAPILANDIRILMIS
                 hedefi (simdilik SPI kilo plani) haftalik programa,
                 simulasyona ve plan denetimine cevirir. Model kullanmaz.
                 Serbest cumleden plan kurmaz: o is «ertelendi» diye kapanir.
     Uretim      soru seti, alistirma, kart. Her madde uretildikten sonra
                 IKINCI bir cagriyla denetlenir: coktan secmeli soru cevap
                 anahtari gosterilmeden bastan cozulur, tutmayan duser;
                 alistirma ve kart yargiyla denetlenir. Hedef AYS ise
                 gecen maddeler niyet kuyruguna teklif olarak birakilir.

   Degismezler:
   1. BAM HICBIR MODULE YAZMAZ. Sonuc teklif olarak niyet kuyruguna
      gider (core/intents.py); modul kendi koduyla uygular.
   2. HAZIR OLMAYAN OFIS «YAPTIM» DEMEZ. Adim «ertelendi» diye kapanir
      ve is «kismen» biter; sessizce «tamam» sayilmaz.
   3. MODEL YOKSA IS BEKLER. Uydurulmaz, bos kayit yazilmaz; kullanici
      modeli baglayip «devam» dediginde kaldigi yerden surer.
   4. HER KAYDIN KOKU BELLIDIR (bam_iz): «bu neden var» sorusu is ->
      kayit -> teklif zinciriyle cevaplanir.
   5. YONLENDIRME KURALLADIR. Anlasilmayan talep tahmin edilmez, sorulur
      (AGENTS.md §1.7)."""
import datetime
import json
import re

from core import ai, depo, intents, kaynakli, kitap, mufredat, planlama, urunler, web

OFISLER = {
    "kayit": {
        "ad": "Depolama Bürosu", "patron": "Depolama Patronu", "durum": "hazir",
        "gorev": "Var olan bilgiyi denetler ve düzenler; her iş önce buradan geçer. "
                 "Araştırılacak konu depoda varsa kaynakları yeniden açılır ve güncel mi "
                 "diye ölçülür: güncelse kayıt araştırma yapılmadan gönderilir, değiştiyse "
                 "Araştırma Bürosu yeni sürüm yazar. Kopya ve eskiyen kaydı raporlar; silmez.",
        "ajanlar": ["Kayıt Kabul Uzmanı", "Sınıflandırma Uzmanı", "Arşiv Uzmanı",
                    "İndeksleme Uzmanı", "İlişkilendirme Uzmanı", "Arama Uzmanı",
                    "Sürüm Uzmanı", "Kayıt Doğrulama Uzmanı"]},
    "arastirma": {
        "ad": "Araştırma Bürosu", "patron": "Araştırma Patronu", "durum": "hazir",
        "gorev": "Detaylı araştırma burada yapılır. Mimar talebi alt sorulara böler, "
                 "tarayıcı web'de arar (resmî ve akademik kaynak öne alınır), sayfalar "
                 "okunur, yazar bulguları numaralı kaynaklarla yazar; her alıntı kodla "
                 "kaynağında aranır ve kanıt gücü ölçülür. Açık kalan varsa Derin "
                 "Araştırmacı bir tur daha arar. Güncellemede önceki sürümle farkı yazar. "
                 "Web kapalıysa ya da sonuç yoksa kayıt «doğrulanmadı» kalır.",
        "ajanlar": ["Araştırma Mimarı", "Kaynak Tarayıcı", "Derin Araştırmacı",
                    "Birincil Kaynak Uzmanı", "Akademik Kaynak Uzmanı",
                    "Kaynak Doğrulayıcı", "Çelişki Analisti", "Kanıt Analisti",
                    "Araştırma Yazarı"]},
    "planlama": {
        "ad": "Planlama Bürosu", "patron": "Planlama Patronu", "durum": "hazir",
        "gorev": "Hedefi haftalık bir yol haritasına çevirir: program, simülasyon ve plan "
                 "denetimi. v1 kuralla çalışır ve yalnız modülün gönderdiği yapılandırılmış "
                 "hedefi alır (şimdilik SPİ kilo planı); serbest cümleden plan kurmaz.",
        "ajanlar": ["Hedef Analisti", "Durum Analisti", "Kısıt Analisti",
                    "Bağımlılık Analisti", "Kapasite Analisti", "Program Mimarı",
                    "Simülasyon Uzmanı", "Optimizasyon Uzmanı", "Plan Denetçisi"]},
    "uretim": {
        "ad": "Üretim Bürosu", "patron": "Üretim Patronu", "durum": "hazir",
        "gorev": "Soru seti, alıştırma ve tekrar kartı üretir. Her madde ikinci bir "
                 "çözümle denetlenir; tutmayan madde düşer, geçenler teklif olur.",
        "ajanlar": ["Üretim Mimarı", "Metin Uzmanı", "Eğitim Materyali Uzmanı",
                    "Görsel Üretim Uzmanı", "Belge ve Rapor Uzmanı",
                    "Veri ve Tablo Uzmanı", "Teknik Üretim Uzmanı", "Editör",
                    "Kalite Kontrol Uzmanı"]},
}
SIRA = ("kayit", "arastirma", "planlama", "uretim")
MODULLER = ("ays", "spi", "esp")
KAYNAKLAR = ("kullanici", "ays", "spi", "esp", "motto")
TURLER = ("arastirma", "plan", "materyal")
DOGRULUK = ("dogrulanmadi", "kaynakli", "celiskili")
MAX_TALEP = 2000

# BAM Patronu'nun kurallari. Bir kelime birden cok ofisi cagirabilir;
# hicbiri eslesmezse talep SORULUR.
ANAHTAR = {
    "arastirma": ("araştır", "nedir", "neden", "nasıl", "kanıt", "kaynak",
                  "doğru mu", "karşılaştır", "incele"),
    "planlama": ("plan", "program", "takvim", "günde", "haftada", "yol haritası"),
    "uretim": ("soru", "test", "flashcard", "kart", "alıştırma", "materyal",
               "hazırla", "üret", "çalışma kitabı"),
}
BELIRSIZ = ("Bunu araştırmamı mı, bir plana dönüştürmemi mi, yoksa bir materyal "
            "(soru seti, alıştırma, kart) üretmemi mi istiyorsun?")

ARASTIRMA_SISTEM = """Sen HKM'deki BAM'ın Araştırma Bürosusun. Araştırma Patronu adına
çalışırsın; onun üstünde BAM Patronu, onun da üstünde King var.

KONUMUN VE SINIRIN
- İnternete ve kaynaklara erişimin YOK; yalnız kendi bilgin var. Bu yüzden hiçbir
  iddiayı doğrulanmış gibi sunamazsın. Ürettiğin belge «doğrulanmadı» etiketiyle
  saklanır ve öyle gösterilir.
- Kullanıcı hakkında hiçbir şey varsayma; kişisel ölçüm yazma.
- Teşhis koyma, ilaç ya da doz önerme, sonuç garantisi verme.

NASIL ÇALIŞIRSIN
1. Talebi araştırılabilir 2–5 alt soruya böl.
2. Her alt soru için bildiğini kısa ve kesin bulgular halinde yaz.
3. Her bulgunun güven düzeyini dürüstçe belirt: düşük, orta ya da yüksek.
   Tartışmalı ya da emin olmadığın şeyi yüksek güvenle yazma.
4. Bilmediğini, tartışmalı olanı ve kaynak gerektireni «acik_kalanlar»a yaz.
5. Türkçe yaz; teknik terimi ilk geçtiği yerde kısaca açıkla.

ÇIKTI: Yalnız şu biçimde tek bir JSON nesnesi döndür, başka hiçbir şey yazma:
{"baslik": "...", "ozet": "...", "alt_sorular": ["..."],
 "bulgular": [{"iddia": "...", "guven": "düşük|orta|yüksek"}],
 "acik_kalanlar": ["..."]}"""


def _simdi(now=None):
    return now or datetime.datetime.now().isoformat(timespec="seconds")


def _kucuk(s):
    return str(s or "").replace("I", "ı").replace("İ", "i").lower()


# ---------------------------------------------------------------- yonlendirme

def yonlendir(talep):
    k = _kucuk(talep)
    ofisler = [o for o in ("arastirma", "planlama", "uretim")
               if any(w in k for w in ANAHTAR[o])]
    if not ofisler:
        return {"ok": False, "soru": BELIRSIZ}
    return {"ok": True, "ofisler": ["kayit"] + ofisler}


# ------------------------------------------------------------------- isler

def _is_satiri(r):
    d = dict(r)
    d["ofisler"] = json.loads(d["ofisler"] or "[]")
    d["adimlar"] = json.loads(d["adimlar"] or "[]")
    try:
        d["govde"] = json.loads(d.get("govde") or "null")
    except ValueError:
        d["govde"] = None
    return d


def is_getir(con, id_):
    r = con.execute("SELECT * FROM bam_isler WHERE id=?", (int(id_),)).fetchone()
    return _is_satiri(r) if r else None


def is_listesi(con, limit=30):
    return [_is_satiri(r) for r in con.execute(
        "SELECT * FROM bam_isler ORDER BY id DESC LIMIT ?",
        (max(1, min(int(limit), 200)),)).fetchall()]


def is_ac(con, talep, kaynak="kullanici", hedef_modul=None, now=None,
          ofisler=None, govde=None, emir_id=None):
    """Is acar. `ofisler` verilirse yonlendirme KURALLA degil, King'in
    is turu katalogundan gelir (core/king.py); `govde` o isin
    yapilandirilmis girdisidir (durum profili dahil, en az veriyle)."""
    metin = str(talep or "").strip()
    if not metin:
        return {"ok": False, "note": "Talep boş."}
    if len(metin) > MAX_TALEP:
        return {"ok": False, "note": "Talep %d karakteri geçemez." % MAX_TALEP}
    if kaynak not in KAYNAKLAR:
        return {"ok": False, "note": "Bilinmeyen kaynak."}
    if hedef_modul not in (None, "") and hedef_modul not in MODULLER:
        return {"ok": False, "note": "Hedef modül AYS, SPİ ya da ESP olmalı."}
    if ofisler is not None:
        if (not ofisler or ofisler[0] != "kayit"
                or any(o not in OFISLER for o in ofisler)):
            return {"ok": False, "note": "Ofis dizisi Kayıt ile başlamalı ve tanımlı olmalı."}
        y = {"ok": True, "ofisler": list(ofisler)}
    else:
        y = yonlendir(metin)
        if not y["ok"]:
            return {"ok": False, "soru": y["soru"], "note": y["soru"]}
    # Yapilandirilmis is (govde) talep metniyle degil emriyle tekillesir:
    # ayni cumleyle iki farkli hedefin plani istenebilir.
    if emir_id is None:
        acik = con.execute("SELECT id FROM bam_isler WHERE talep=? AND durum IN "
                           "('bekliyor','beklemede') AND emir_id IS NULL "
                           "ORDER BY id DESC LIMIT 1", (metin,)).fetchone()
        if acik:
            return {"ok": True, "id": acik["id"], "yeni": False, "ofisler": y["ofisler"]}
    at = _simdi(now)
    adimlar = [{"ofis": o, "durum": "bekliyor"} for o in y["ofisler"]]
    cur = con.execute("INSERT INTO bam_isler(talep,kaynak,hedef_modul,ofisler,adimlar,"
                      "durum,created_at,updated_at,govde,emir_id) "
                      "VALUES (?,?,?,?,?, 'bekliyor',?,?,?,?)",
                      (metin, kaynak, hedef_modul or None, json.dumps(y["ofisler"]),
                       json.dumps(adimlar, ensure_ascii=False), at, at,
                       json.dumps(govde, ensure_ascii=False) if govde else None,
                       int(emir_id) if emir_id else None))
    return {"ok": True, "id": cur.lastrowid, "yeni": True, "ofisler": y["ofisler"]}


def iptal(con, id_, now=None):
    cur = con.execute("UPDATE bam_isler SET durum='iptal', updated_at=? WHERE id=? "
                      "AND durum IN ('bekliyor','beklemede')", (_simdi(now), int(id_)))
    return {"ok": cur.rowcount == 1,
            "note": "İş iptal edildi." if cur.rowcount else "İptal edilecek açık iş yok."}


def devam(con, id_, now=None):
    """Bekleyen isi (model yoktu, butce dolmustu) yeniden kuyruga koyar."""
    j = is_getir(con, id_)
    if not j or j["durum"] != "beklemede":
        return {"ok": False, "note": "Bekleyen bir iş değil."}
    for a in j["adimlar"]:
        if a["durum"] == "beklemede":
            a["durum"] = "bekliyor"
    _kaydet(con, j, now)
    return {"ok": True}


def _is_durumu(adimlar):
    d = [a["durum"] for a in adimlar]
    if "beklemede" in d:
        return "beklemede"
    if "hata" in d:
        return "hata"
    if all(x in ("tamam", "ertelendi") for x in d):
        return "tamam" if all(x == "tamam" for x in d) else "kismen"
    return "bekliyor"


def _kaydet(con, j, now=None):
    j["durum"] = _is_durumu(j["adimlar"])
    con.execute("UPDATE bam_isler SET adimlar=?, durum=?, updated_at=? WHERE id=?",
                (json.dumps(j["adimlar"], ensure_ascii=False), j["durum"],
                 _simdi(now), j["id"]))


def ilerlet(con, cfg, transport=None, now=None):
    """Kuyruktaki en eski isin siradaki adimini kosar. Is yoksa None.
    Ritim her tikte bir adim ilerletir: uzun is sunucuyu kilitlemez."""
    r = con.execute("SELECT * FROM bam_isler WHERE durum='bekliyor' "
                    "ORDER BY id LIMIT 1").fetchone()
    if not r:
        return None
    j = _is_satiri(r)
    adim = next((a for a in j["adimlar"] if a["durum"] == "bekliyor"), None)
    if adim is None:
        _kaydet(con, j, now)
        return None
    try:
        sonuc = ADIM[adim["ofis"]](con, cfg, j, transport, now)
    except Exception as e:                      # noqa: BLE001
        sonuc = {"durum": "hata", "not": "%s: %s" % (type(e).__name__, e)}
    adim.update(sonuc)
    adim["at"] = _simdi(now)
    _kaydet(con, j, now)
    return {"ok": adim["durum"] in ("tamam", "ertelendi"), "is_id": j["id"],
            "ofis": adim["ofis"], "durum": adim["durum"], "not": adim.get("not")}


# -------------------------------------------------------------- ofis adimlari

def arastirma_konusu(j):
    """Isin arastirma konusu — Depolama Burosu'nun anahtari buradan cikar.
    Ayni konu ayni anahtardir: ozet ve sunum ayni arastirmayi paylasir."""
    g = j.get("govde") or {}
    if g.get("mufredat"):
        m = g["mufredat"]
        return "müfredat %s %s" % (m["sinav"], m.get("bolum") or "")
    if g.get("arastirma"):
        a = g["arastirma"]
        return "%s %s" % (a["konu"], a.get("ayrinti") or "")
    if g.get("urun"):
        return g["urun"]["konu"]
    return j["talep"]


def _depo_karari(j):
    a = next((x for x in j["adimlar"] if x["ofis"] == "kayit"), None)
    return (a or {}).get("depo") or {}


def _depo_yaz(j):
    """Arastirma kaydinin depo alanlari: anahtar ve (guncellemede) onceki surum."""
    d = _depo_karari(j)
    return {"anahtar": depo.konu_anahtari(arastirma_konusu(j)),
            "onceki_id": d.get("kayit_id") if d.get("karar") == "guncelle" else None}


def _kayit_adimi(con, cfg, j, transport, now):
    """Depolama Burosu. Arastirma gerektiren iste karar verir (core/depo.py);
    digerlerinde yalniz benzer kayitlari bulur."""
    bulunan = [r["id"] for r in kayit_ara(con, j["talep"])]
    izler = [depo.iz("arama", "%d benzer kayıt bulundu." % len(bulunan) if bulunan
                     else "Benzer kayıt yok.")]
    if "arastirma" not in j["ofisler"]:
        return {"durum": "tamam", "bulunan": bulunan, "iz": izler,
                "not": ("%d önceki kayıt bulundu; işe bunlarla başlanır." % len(bulunan))
                if bulunan else "Bu konuda önceki kayıt yok."}
    d = depo.karar(con, cfg, depo.konu_anahtari(arastirma_konusu(j)), now=now,
                   tasiyici=web_tasiyici)
    sonuc = {"durum": "tamam", "bulunan": bulunan, "iz": izler + d["iz"], "not": d["not"],
             "depo": {k: d.get(k) for k in ("karar", "kayit_id", "denetlenemedi") if d.get(k)}}
    aday = (j.get("govde") or {}).get("depo_aday")
    if d["karar"] == "guncel" and aday:
        # King eski urunu «guncelligi olculmedi» diye gondermediyse ve urun
        # hala EN SON arastirmaya dayaniyorsa butun is depodan kapanir.
        ak = kayit_getir(con, aday) or {}
        dayanak = ak.get("id") if ak.get("tur") == "arastirma" else \
            (ak.get("govde") or {}).get("dayanak")
        if dayanak and dayanak == d["kayit_id"]:
            for a in j["adimlar"]:
                if a["ofis"] != "kayit" and a["durum"] == "bekliyor":
                    a.update({"durum": "tamam", "depodan": True, "at": _simdi(now),
                              "not": "Depodaki kayıt #%d güncel araştırmaya dayanıyor; "
                                     "yeniden yapılmadı." % aday})
            j["adimlar"][-1]["kayit_id"] = aday
            sonuc["iz"].append(depo.iz("surum", "Ürün #%d güncel araştırmaya dayanıyor; iş "
                                                "depodan kapandı." % aday))
    return sonuc


def _json_ayikla(metin):
    m = re.search(r"\{.*\}", metin or "", re.S)
    if not m:
        return None
    try:
        d = json.loads(m.group(0))
    except ValueError:
        return None
    return d if isinstance(d, dict) else None


# Web tasiyicisi: None ise gercek ag (core/web.py). Testler sahte tasiyici koyar.
web_tasiyici = None


def _model_hatasi(r):
    if r.get("reason") == "budget":
        return {"durum": "beklemede", "not": r.get("note")}
    return {"durum": "hata", "not": r.get("note") or "Model cevap vermedi."}


def _iz(adim, *yeni):
    """Adimin ajan izi birikir: her asama kendi satirini ekler."""
    return list(adim.get("iz") or []) + list(yeni)


def _kaynak_topla(con, cfg, j, ofis, sorgu_kur, transport, now):
    """Kaynakli isin ilk uc asamasi, HER TIKTE BIR ASAMA (core/kaynakli.py):
    plan -> tarama -> okuma. Ara durum ve ajan izi adimda durur.

    `sorgu_kur()` -> (sorgular, alt_sorular[, iz_metni]) ya da model
    hatasinda (hata_sonucu, []).

    Doner: ("devam", adim_sonucu) | ("hazir", kaynaklar, metinler)
         | ("yok", neden). «yok»ta cagiran is kaynaksiz yola duser ve bunu
    SOYLER; web'in kapali olmasi isi durdurmaz."""
    adim = next(a for a in j["adimlar"] if a["ofis"] == ofis)
    st = adim.get("kaynakli") if isinstance(adim.get("kaynakli"), dict) else None
    if not web.settings(cfg)["acik"]:
        return ("yok", "Web kapalı")
    rol = "bam." + ofis
    if st is None:
        kur = sorgu_kur()
        sorgular, alt = kur[0], kur[1]
        if isinstance(sorgular, dict):          # model hatasi
            return ("devam", sorgular)
        if not sorgular:
            return ("yok", "Aranacak sorgu çıkmadı")
        yapti = kur[2] if len(kur) > 2 and kur[2] else \
            "%d alt soru, %d arama sorgusu yazdı." % (len(alt), len(sorgular))
        return ("devam", {"durum": "bekliyor", "kaynakli": {"asama": "tarama", "sorgular": sorgular,
                                                              "alt_sorular": alt},
                          "iz": _iz(adim, kaynakli.iz("mimar", yapti)),
                          "not": "Arama sorguları hazır: %s." % "; ".join(sorgular)})
    if st["asama"] == "tarama":
        sonuclar, notlar = [], []
        for s in st["sorgular"]:
            r = web.ara(con, cfg, rol, s, n=5, tasiyici=web_tasiyici, now=now)
            sonuclar += r.get("sonuclar") or []
            if not r.get("ok") and r.get("note"):
                notlar.append(r["note"])
        adaylar = kaynakli.aday_sec(sonuclar)
        if not adaylar:
            return ("yok", "Web'de sonuç bulunamadı" + (" (%s)" % "; ".join(notlar[:2])
                                                         if notlar else ""))
        nitelikli = sum(1 for a in adaylar if kaynakli.kaynak_turu(a["alan"]) in
                        ("resmi", "akademik"))
        return ("devam", {"durum": "bekliyor", "kaynakli": dict(st, asama="okuma", adaylar=adaylar),
                          "iz": _iz(adim, kaynakli.iz("tarayici", "%d sorgu arandı, %d sonuç geldi."
                                                      % (len(st["sorgular"]), len(sonuclar))),
                                    kaynakli.iz("akademik", "%d aday seçildi; %d'i resmi ya da "
                                                "akademik, öne alındı." % (len(adaylar),
                                                                          nitelikli))),
                          "not": "%d aday kaynak bulundu." % len(adaylar)})
    if st["asama"] == "okuma":
        kaynaklar = _oku(con, cfg, rol, st["adaylar"], kaynakli.MAX_KAYNAK, 1, now)
        if not kaynaklar:
            return ("yok", "Bulunan sayfaların hiçbiri okunamadı")
        return ("devam", {"durum": "bekliyor",
                          "kaynakli": dict(st, asama="yazim", kaynaklar=kaynaklar, adaylar=None),
                          "iz": _iz(adim, kaynakli.iz("birincil", "%d sayfa okundu (%d aday)."
                                                      % (len(kaynaklar), len(st["adaylar"])))),
                          "not": "%d kaynak okundu." % len(kaynaklar)})
    # yazim: metinler web onbelleginden gelir — yeniden aga cikilmaz.
    kaynaklar, metinler = _onbellekten(con, cfg, rol, st["kaynaklar"], now)
    if not kaynaklar:
        return ("yok", "Okunan kaynaklar önbellekte bulunamadı")
    return ("hazir", kaynaklar, metinler)


def _oku(con, cfg, rol, adaylar, en_cok, ilk_n, now):
    kaynaklar = []
    for a in adaylar:
        if len(kaynaklar) >= en_cok:
            break
        s = web.getir(con, cfg, rol, a["url"], tasiyici=web_tasiyici, now=now)
        if s.get("ok"):
            kaynaklar.append({"n": ilk_n + len(kaynaklar), "url": a["url"],
                              "baslik": s["baslik"], "alan": s["alan"],
                              "erisim": s["erisim"], "yayin": s.get("yayin") or a.get("yayin")})
    return kaynaklar


def _onbellekten(con, cfg, rol, kaynaklar, now):
    metinler = {}
    for k in kaynaklar:
        s = web.getir(con, cfg, rol, k["url"], tasiyici=web_tasiyici, now=now)
        if s.get("ok"):
            metinler[k["n"]] = s["metin"]
    return [k for k in kaynaklar if k["n"] in metinler], metinler


def _izli_kaynakca(kaynaklar, metinler):
    """Kaynakca + her kaynagin cumle izi: Depolama Burosu guncelligi bununla olcer."""
    out = kaynakli.kaynakca(kaynaklar)
    for x in out:
        x["parmak"] = depo.parmak(metinler.get(x["n"]) or "")
    return out


def _mufredat_modelden(con, cfg, j, g, transport, now, neden=None):
    r = ai.ask(con, cfg, "bam.arastirma", "arastirma",
               [{"role": "user", "content": mufredat.istem(g)}],
               sistem=mufredat.SISTEM, transport=transport, duzeltme=False, denetim="belge")
    if not r.get("ok"):
        return _model_hatasi(r)
    govde, hata = mufredat.ayikla(_json_ayikla(r["text"]), g)
    if hata:
        return {"durum": "hata", "not": "Müfredat raporu yazılmadı: " + hata}
    if neden:
        govde["web"] = neden
    govde["konu"] = arastirma_konusu(j).strip()
    k = kayit_ekle(con, "arastirma", "%s müfredatı" % g["sinav"], govde,
                   dogruluk="dogrulanmadi", etiketler=j["talep"][:300], is_id=j["id"], now=now,
                   **_depo_yaz(j))
    return {"durum": "tamam", "kayit_id": k["id"], "kaynakli": {"asama": "bitti", "kaynak": 0},
            "not": "Müfredat raporu kaydedildi: %d ders, %d konu — kaynaksız, doğrulanmadı.%s"
                   % (govde["ders_sayisi"], govde["konu_sayisi"],
                      (" (%s.)" % neden) if neden else "")}


def _mufredat_adimi(con, cfg, j, g, transport, now):
    """Mufredat raporu (core/mufredat.py). Web aciksa sinavin resmi
    sayfalari aranir ve her ders bir alintiyla kaynagina baglanir; kod
    alintiyi kaynakta arar. Dogrulanan ders yarinin altindaysa kayit
    «dogrulanmadi» kalir. Web yoksa model bilgisiyle yazilir ve bu soylenir."""
    def sorgu_kur():
        ad = g["sinav"] + (" " + g["bolum"] if g.get("bolum") else "")
        return (kaynakli.sorgular({"sorgular": ["%s konuları" % ad,
                                                "%s müfredatı ÖSYM kılavuz" % ad]}, ad), [],
                "Sorgular kuralla kuruldu: sınav adı + konular / resmi kılavuz.")
    t = _kaynak_topla(con, cfg, j, "arastirma", sorgu_kur, transport, now)
    if t[0] == "devam":
        return t[1]
    if t[0] == "yok":
        return _mufredat_modelden(con, cfg, j, g, transport, now, neden=t[1])
    kaynaklar, metinler = t[1], t[2]
    r = ai.ask(con, cfg, "bam.arastirma", "arastirma",
               [{"role": "user", "content": mufredat.istem(g) + "\n\nKAYNAKLAR\n"
                 + kaynakli.blok(kaynaklar, metinler)}],
               sistem=mufredat.SISTEM_KAYNAKLI, transport=transport, duzeltme=False,
               denetim="belge")
    if not r.get("ok"):
        return _model_hatasi(r)
    govde, hata = mufredat.ayikla(_json_ayikla(r["text"]), g)
    if hata:
        return {"durum": "hata", "not": "Müfredat raporu yazılmadı: " + hata}
    dogru = 0
    for d in govde["dersler"]:
        n = d.get("kaynak")
        d["dogrulandi"] = bool(n in metinler and kaynakli.alinti_dogru_mu(d.get("alinti"),
                                                                          metinler[n]))
        dogru += d["dogrulandi"]
    govde["kaynaklar"] = _izli_kaynakca(kaynaklar, metinler)
    govde["dogrulama"] = {"ders": len(govde["dersler"]), "dogrulanan": dogru}
    govde["konu"] = arastirma_konusu(j).strip()
    etiket = "kaynakli" if dogru * 2 >= len(govde["dersler"]) else "dogrulanmadi"
    govde["uyari"] = ("Kaynaklı: %d dersin %d'i alıntıyla kaynağına bağlandı. Yine de resmi "
                      "kılavuzla karşılaştır." % (len(govde["dersler"]), dogru)
                      if etiket == "kaynakli" else
                      "Derslerin yarısından azı kaynakla doğrulandı; resmi kılavuzla karşılaştır.")
    k = kayit_ekle(con, "arastirma", "%s müfredatı" % g["sinav"], govde, dogruluk=etiket,
                   etiketler=j["talep"][:300], is_id=j["id"], now=now, **_depo_yaz(j))
    adim = next(a for a in j["adimlar"] if a["ofis"] == "arastirma")
    return {"durum": "tamam", "kayit_id": k["id"],
            "iz": _iz(adim, kaynakli.iz("yazar", "%d ders, %d konu yazdı." % (
                govde["ders_sayisi"], govde["konu_sayisi"])),
                kaynakli.iz("dogrulayici", "%d dersin %d'i alıntıyla kaynağına bağlandı."
                            % (len(govde["dersler"]), dogru))),
            "kaynakli": {"asama": "bitti", "kaynak": len(kaynaklar)},
            "not": "Müfredat raporu: %d ders, %d konu, %d kaynak; %d ders alıntıyla doğrulandı (%s)."
                   % (govde["ders_sayisi"], govde["konu_sayisi"], len(kaynaklar), dogru,
                      "kaynaklı" if etiket == "kaynakli" else "doğrulanmadı")}


def _onceki_surum(con, j):
    """Depolama «guncelle» dediyse yeni surumun oncesi."""
    d = _depo_karari(j)
    if d.get("karar") == "guncelle" and d.get("kayit_id"):
        return kayit_getir(con, d["kayit_id"])
    return None


def _yazar(con, cfg, j, kaynaklar, metinler, transport, ek=""):
    r = ai.ask(con, cfg, "bam.arastirma", "arastirma",
               [{"role": "user", "content": "Araştırma talebi: " + j["talep"]
                 + ("\n\n" + ek if ek else "")
                 + "\n\nKAYNAKLAR\n" + kaynakli.blok(kaynaklar, metinler)}],
               sistem=kaynakli.YAZIM_SISTEM, transport=transport, duzeltme=False,
               denetim="belge")
    if not r.get("ok"):
        return None, _model_hatasi(r)
    return _json_ayikla(r["text"]) or {}, None


def _arastirma_kaynakli(con, cfg, j, transport, now):
    """Kaynakli arastirma (core/kaynakli.py). ("yok", neden) donerse web
    yok: cagiran model bilgisiyle yazar ve nedenini kayda koyar."""
    adim = next(a for a in j["adimlar"] if a["ofis"] == "arastirma")
    onceki = _onceki_surum(con, j)
    st = adim.get("kaynakli") if isinstance(adim.get("kaynakli"), dict) else {}
    if st.get("asama") in ("derin_okuma", "derin_yazim"):
        return ("devam", _derin_adimi(con, cfg, j, adim, st, onceki, transport, now))

    def sorgu_kur():
        og = (onceki or {}).get("govde") or {}
        if og.get("sorgular"):
            return (og["sorgular"][:kaynakli.MAX_SORGU], og.get("alt_sorular") or [],
                    "Güncelleme: önceki sürümün sorguları yeniden kullanıldı (model çağrılmadı).")
        r = ai.ask(con, cfg, "bam.arastirma", "arastirma",
                   [{"role": "user", "content": "Araştırma talebi: " + j["talep"]}],
                   sistem=kaynakli.PLAN_SISTEM, transport=transport, duzeltme=False,
                   denetim="belge")
        if not r.get("ok"):
            return _model_hatasi(r), []
        d = _json_ayikla(r["text"]) or {}
        return kaynakli.sorgular(d, j["talep"]), kaynakli.alt_sorular(d)

    t = _kaynak_topla(con, cfg, j, "arastirma", sorgu_kur, transport, now)
    if t[0] != "hazir":
        return t
    kaynaklar, metinler = t[1], t[2]
    d, hata = _yazar(con, cfg, j, kaynaklar, metinler, transport,
                     ek=kaynakli.onceki_blogu(onceki) if onceki else "")
    if hata:
        return ("devam", hata)
    izler = _iz(adim, kaynakli.iz("yazar", "Taslak: %d bulgu, %d açık kalan." % (
        len(d.get("bulgular") or []), len(d.get("acik_kalanlar") or []))))
    # Derin Arastirmaci: acik kalan varsa AYNI tikte ek arama; yeni kaynak
    # cikarsa iki tik daha (okuma, yeniden yazim). Tek tur.
    ds = kaynakli.derin_sorgular(d, st.get("sorgular"))
    if ds:
        sonuclar = []
        for s_ in ds:
            sonuclar += web.ara(con, cfg, "bam.arastirma", s_, n=5, tasiyici=web_tasiyici,
                                now=now).get("sonuclar") or []
        bilinen = {k["url"] for k in st.get("kaynaklar") or []}
        yeni = [a for a in kaynakli.aday_sec(sonuclar) if a["url"] not in bilinen]
        yeni = yeni[:kaynakli.MAX_DERIN_KAYNAK * 2]
        if yeni:
            izler.append(kaynakli.iz("derin", "Açık kalanlar için %d sorgu arandı; %d yeni aday."
                                     % (len(ds), len(yeni))))
            return ("devam", {"durum": "bekliyor", "iz": izler,
                              "kaynakli": dict(st, asama="derin_okuma", taslak=d,
                                               derin_sorgular=ds, derin_adaylar=yeni),
                              "not": "Derin Araştırmacı açık kalanlar için %d yeni aday buldu."
                                     % len(yeni)})
        izler.append(kaynakli.iz("derin", "Açık kalanlar arandı; yeni kaynak çıkmadı."))
    return ("devam", _arastirma_yaz(con, j, st, d, kaynaklar, metinler, onceki, izler, now))


def _derin_adimi(con, cfg, j, adim, st, onceki, transport, now):
    """Derinlestirme turunun iki tiki: yeni kaynaklari oku, sonra taslagi
    butun kaynaklarla yeniden yazdir. Yeni kaynak okunamazsa ilk taslak yazilir."""
    if st["asama"] == "derin_okuma":
        ilk = len(st["kaynaklar"]) + 1
        yeni = _oku(con, cfg, "bam.arastirma", st["derin_adaylar"], kaynakli.MAX_DERIN_KAYNAK,
                    ilk, now)
        if yeni:
            return {"durum": "bekliyor",
                    "kaynakli": dict(st, asama="derin_yazim", derin_adaylar=None,
                                     ilk_kaynak=len(st["kaynaklar"]),
                                     kaynaklar=st["kaynaklar"] + yeni),
                    "iz": _iz(adim, kaynakli.iz("birincil", "Derinleştirme: %d yeni sayfa okundu."
                                                % len(yeni))),
                    "not": "Derinleştirme: %d yeni kaynak okundu." % len(yeni)}
        izler = _iz(adim, kaynakli.iz("birincil", "Derinleştirme adayları okunamadı; ilk taslak "
                                                  "yazılıyor."))
    else:
        izler = None
    kaynaklar, metinler = _onbellekten(con, cfg, "bam.arastirma", st["kaynaklar"], now)
    if not kaynaklar:
        return {"durum": "hata", "not": "Kaynaklar önbellekte bulunamadı; araştırma yazılamadı."}
    if izler is not None:
        return _arastirma_yaz(con, j, st, st["taslak"], kaynaklar, metinler, onceki, izler, now)
    ek = kaynakli.taslak_blogu(st["taslak"])
    if onceki:
        ek = kaynakli.onceki_blogu(onceki) + "\n\n" + ek
    d, hata = _yazar(con, cfg, j, kaynaklar, metinler, transport, ek=ek)
    if hata:
        return hata
    izler = _iz(adim, kaynakli.iz("yazar", "Yeni kaynaklarla yeniden yazdı: %d bulgu, %d açık "
                                           "kalan." % (len(d.get("bulgular") or []),
                                                       len(d.get("acik_kalanlar") or []))))
    return _arastirma_yaz(con, j, st, d, kaynaklar, metinler, onceki, izler, now)


def _arastirma_yaz(con, j, st, d, kaynaklar, metinler, onceki, izler, now):
    """Kaynak Dogrulayici, Kanit ve Celiski Analisti (hepsi KOD) ve kayit."""
    bulgular, say = kaynakli.bulgular(d, metinler)
    kanit = kaynakli.kanit(bulgular, kaynaklar)
    celiskiler = kaynakli.liste(d, "celiskiler", 8)
    etiket = kaynakli.dogruluk(bulgular, celiskiler)
    izler = list(izler) + [
        kaynakli.iz("dogrulayici", "%d bulgunun %d'inin alıntısı kaynağında bulundu."
                    % (say["toplam"], say["dogrulanan"])),
        kaynakli.iz("kanit", "Kanıt gücü: %d güçlü, %d orta, %d zayıf." % (
            kanit["guclu"], kanit["orta"], kanit["zayif"])),
        kaynakli.iz("celiski", "%d çelişki kaydedildi." % len(celiskiler) if celiskiler
                    else "Kaynaklar arasında çelişki bildirilmedi.")]
    govde = {"ozet": str(d.get("ozet") or "").strip()[:1500],
             "alt_sorular": st.get("alt_sorular") or [], "sorgular": st.get("sorgular") or [],
             "bulgular": bulgular, "celiskiler": celiskiler,
             "acik_kalanlar": kaynakli.liste(d, "acik_kalanlar"),
             "kaynaklar": _izli_kaynakca(kaynaklar, metinler), "dogrulama": say,
             "kanit": kanit, "konu": arastirma_konusu(j).strip()}
    if st.get("derin_sorgular"):
        ilk = st.get("ilk_kaynak") or len(st.get("kaynaklar") or [])
        govde["derinlestirme"] = {"sorgular": st["derin_sorgular"],
                                  "yeni_kaynak": sum(1 for k in kaynaklar if k["n"] > ilk)}
    if onceki:
        govde["degisiklikler"] = kaynakli.liste(d, "degisiklikler", 12)
        govde["onceki_surum"] = {"id": onceki["id"], "tarih": str(onceki["created_at"])[:10]}
    baslik = str(d.get("baslik") or j["talep"]).strip()[:200]
    k = kayit_ekle(con, "arastirma", baslik, govde, dogruluk=etiket,
                   etiketler=j["talep"][:300], is_id=j["id"], now=now, **_depo_yaz(j))
    return {"durum": "tamam", "kayit_id": k["id"], "iz": izler,
            "kaynakli": {"asama": "bitti", "kaynak": len(kaynaklar)},
            "not": "Kaynaklı araştırma%s: %d kaynak, %d bulgunun %d'i alıntıyla doğrulandı (%s)."
                   % (" (sürüm %d)" % k["surum"] if onceki else "", len(kaynaklar),
                      say["toplam"], say["dogrulanan"],
                      {"kaynakli": "kaynaklı", "celiskili": "çelişkili",
                       "dogrulanmadi": "doğrulanmadı"}[etiket])}


def _arastirma_adimi(con, cfg, j, transport, now):
    d = _depo_karari(j)
    if d.get("karar") == "guncel" and d.get("kayit_id"):
        return {"durum": "tamam", "kayit_id": d["kayit_id"], "depodan": True,
                "not": "Depodaki araştırma #%d kullanıldı%s; yeniden araştırılmadı." % (
                    d["kayit_id"], " (güncelliği denetlenemedi)" if d.get("denetlenemedi")
                    else "")}
    hazir = ai.hazir_mi(cfg, "bam.arastirma")
    if not hazir["ok"]:
        return {"durum": "beklemede", "not": hazir["note"]}
    g = (j.get("govde") or {}).get("mufredat")
    if g:
        return _mufredat_adimi(con, cfg, j, g, transport, now)
    t = _arastirma_kaynakli(con, cfg, j, transport, now)
    if t[0] == "devam":
        return t[1]
    web_neden = t[1]
    r = ai.ask(con, cfg, "bam.arastirma", "arastirma",
               [{"role": "user", "content": "Araştırma talebi: " + j["talep"]}],
               sistem=ARASTIRMA_SISTEM, transport=transport,
               duzeltme=False, denetim="belge")
    if not r.get("ok"):
        if r.get("reason") == "budget":
            return {"durum": "beklemede", "not": r.get("note")}
        return {"durum": "hata", "not": r.get("note") or "Model cevap vermedi."}
    d = _json_ayikla(r["text"]) or {}
    guvenler = ("düşük", "orta", "yüksek")
    bulgular = []
    for b in d.get("bulgular") or []:
        if isinstance(b, dict) and str(b.get("iddia") or "").strip():
            bulgular.append({"iddia": str(b["iddia"]).strip()[:600],
                             "guven": b.get("guven") if b.get("guven") in guvenler
                             else "belirsiz",
                             "dayanak": "model bilgisi — kaynak yok"})
    govde = {"ozet": str(d.get("ozet") or "").strip()[:1500],
             "alt_sorular": [str(x)[:300] for x in (d.get("alt_sorular") or [])][:8],
             "bulgular": bulgular[:20],
             "acik_kalanlar": [str(x)[:300] for x in (d.get("acik_kalanlar") or [])][:10]}
    if not bulgular and not govde["ozet"]:
        govde["metin"] = str(r["text"])[:6000]        # bicim tutmadi: ham metin
    govde["web"] = web_neden
    govde["konu"] = arastirma_konusu(j).strip()
    baslik = str(d.get("baslik") or j["talep"]).strip()[:200]
    k = kayit_ekle(con, "arastirma", baslik, govde, dogruluk="dogrulanmadi",
                   etiketler=j["talep"][:300], is_id=j["id"], now=now, **_depo_yaz(j))
    return {"durum": "tamam", "kayit_id": k["id"], "kaynakli": {"asama": "bitti", "kaynak": 0},
            "not": "Araştırma kaydedildi — kaynaksız, doğrulanmadı (%s)." % web_neden}


def _planlama_adimi(con, cfg, j, transport, now):
    """Planlama Burosu v1 (core/planlama.py). Yapilandirilmis hedef yoksa
    plan UYDURULMAZ: serbest bir cumleden program kurmak, kullanicinin
    kapasitesini, kilosunu ve tarihini tahmin etmek olurdu."""
    girdi = (j.get("govde") or {}).get("plan")
    if not girdi:
        return {"durum": "ertelendi",
                "not": "Planlama Bürosu v1 yalnız modülün gönderdiği yapılandırılmış hedefle "
                       "(şimdilik SPİ kilo planı) çalışır; serbest cümleden plan kurmaz."}
    p = planlama.kur(girdi)
    if not p["ok"]:
        return {"durum": "hata", "not": "Plan girdisi geçersiz: " + "; ".join(p["hatalar"])}
    g = p["girdi"]
    # PLAN SURUMLERI: ayni hedefin onceki programi varsa bu onun yeni surumudur.
    etiket = "plan %s %s hedef:%s" % (j.get("hedef_modul") or "", g["paket"], g["hedef_id"])
    onceki = con.execute("SELECT id FROM bam_kayitlar WHERE tur='plan' AND etiketler=? "
                         "ORDER BY id DESC LIMIT 1", (etiket,)).fetchone()
    kalan = [d["not"] for d in p["denetim"] if not d["ok"]]
    govde = {"girdi": g, "program": p["program"], "simulasyon": p["simulasyon"],
             "denetim": p["denetim"], "gecti": p["gecti"], "etiket": p["etiket"],
             "anahtar": p["anahtar"]}
    baslik = "%d haftalık program — %s %s kg → %s kg" % (
        g["hafta"], "kilo ver" if g["yon"] == "azalt" else "kilo al",
        planlama._yaz(g["simdi"]["deger"]), planlama._yaz(g["hedef_deger"]))
    k = kayit_ekle(con, "plan", baslik, govde, dogruluk="dogrulanmadi", etiketler=etiket,
                   is_id=j["id"], onceki_id=onceki["id"] if onceki else None, now=now)
    if not p["gecti"]:
        return {"durum": "tamam", "kayit_id": k["id"],
                "not": "Plan denetçisi programı geçirmedi: %s" % "; ".join(kalan)}
    return {"durum": "tamam", "kayit_id": k["id"],
            "not": "%d haftalık program kuruldu%s." % (
                g["hafta"], (" (uyarı: %s)" % "; ".join(kalan)) if kalan else "")}


# ------------------------------------------------------------ uretim

URETIM_BAS = """Sen HKM'deki BAM'ın Üretim Bürosusun. Üretim Patronu adına çalışırsın;
onun üstünde BAM Patronu, onun da üstünde King var. Ürettiğin her madde, senden
BAĞIMSIZ bir kalite kontrolünden geçecek; tutmayan madde atılır.

NASIL ÜRETİRSİN
1. Talepteki konuyu, düzeyi ve adedi al; düzey yazılmamışsa orta düzey üret.
2. Her maddenin TEK ve KESİN bir doğru cevabı olsun; tartışmalı madde yazma.
3. Özgün yaz: yayınlanmış bir kitaptan ya da sınavdan soru kopyalama.
4. Kullanıcı hakkında varsayım yapma; kişisel bilgi yazma.
5. Yönergeler Türkçe olsun; dil alıştırmasında madde hedef dilde olabilir.

ÇIKTI: Yalnız tek bir JSON nesnesi döndür, başka hiçbir şey yazma."""

URETIM_BICIM = {
    "soru": """
{"baslik": "...", "konu": "...", "sorular": [{"soru": "...",
 "secenekler": ["...", "...", "...", "...", "..."], "dogru": "A|B|C|D|E",
 "cozum": "adım adım çözüm"}]}
Kurallar: tam beş şık, şıklar birbirinden farklı; «hepsi» ya da «hiçbiri» şıkkı
yok; çeldiriciler makul ve tipik hatalardan gelsin; şıklara harf yazma.""",
    "alistirma": """
{"baslik": "...", "konu": "...", "maddeler": [{"yonerge": "...", "madde": "...",
 "cevap": "kısa ve tek cevap"}]}""",
    "kart": """
{"baslik": "...", "konu": "...", "kartlar": [{"on": "soru ya da kavram",
 "arka": "kısa ve kesin cevap"}]}""",
}

KALITE_SORU = """Sen BAM Üretim Bürosu'nun Kalite Kontrol Uzmanısın. Sana CEVAP ANAHTARI
OLMADAN çoktan seçmeli sorular verilecek. Her soruyu kendin baştan çöz; başkasının
cevabını tahmin etmeye çalışma. Şıklar sırasıyla A, B, C, D, E'dir.
ÇIKTI: Yalnız şu JSON: {"cevaplar": [{"no": 1, "secim": "A", "emin": true}]}"""

KALITE_YARGI = """Sen BAM Üretim Bürosu'nun Kalite Kontrol Uzmanısın. Sana maddeler ve
önerilen cevapları verilecek. Her maddede önerilen cevabın doğru, tek ve kesin olup
olmadığını denetle. Şüpheliyse «dogru_mu»yu false yaz ve nedenini kısaca söyle.
ÇIKTI: Yalnız şu JSON: {"yargilar": [{"no": 1, "dogru_mu": true, "neden": "..."}]}"""

HARFLER = "ABCDE"
ADET = {"varsayilan": 10, "en_az": 3, "en_cok": 30}


def uretim_istegi(talep):
    """(tur, adet) — kuralla. Model karar vermez."""
    k = _kucuk(talep)
    if "kart" in k or "flashcard" in k:
        tur = "kart"
    elif "alıştırma" in k or "çalışma kitabı" in k:
        tur = "alistirma"
    else:
        tur = "soru"
    m = re.search(r"(\d{1,4})\s*(?:soru|tane|adet|alıştırma|kart|madde)", k)
    adet = int(m.group(1)) if m else ADET["varsayilan"]
    return tur, max(ADET["en_az"], min(ADET["en_cok"], adet))


def _metin(x, en_cok):
    t = str(x or "").strip()
    return t if 0 < len(t) <= en_cok else None


def _bicim(tur, m):
    """Maddeyi dogrular ve temiz halini dondurur; bozuksa None."""
    if not isinstance(m, dict):
        return None
    if tur == "soru":
        soru, cozum = _metin(m.get("soru"), 1500), _metin(m.get("cozum"), 2000)
        sec = m.get("secenekler")
        if not (soru and cozum and isinstance(sec, list) and len(sec) == 5):
            return None
        sec = [_metin(x, 300) for x in sec]
        if None in sec or len({x.lower() for x in sec}) != 5:
            return None
        if m.get("dogru") not in tuple(HARFLER):
            return None
        return {"soru": soru, "secenekler": sec, "dogru": m["dogru"], "cozum": cozum}
    if tur == "alistirma":
        y, md, c = (_metin(m.get("yonerge"), 300), _metin(m.get("madde"), 500),
                    _metin(m.get("cevap"), 200))
        return {"yonerge": y, "madde": md, "cevap": c} if (y and md and c) else None
    on, arka = _metin(m.get("on"), 500), _metin(m.get("arka"), 500)
    return {"on": on, "arka": arka} if (on and arka) else None


def _cagri(con, cfg, gorev, sistem, icerik, transport):
    return ai.ask(con, cfg, "bam.uretim", gorev, [{"role": "user", "content": icerik}],
                  sistem=sistem, transport=transport, duzeltme=False, denetim="belge")


def _denetle(con, cfg, tur, maddeler, transport):
    """(gecen_indeksler, dusen) ya da hata metni. Soru anahtarsiz cozulur."""
    if tur == "soru":
        gorunen = [{"no": i + 1, "soru": m["soru"], "secenekler": m["secenekler"]}
                   for i, m in enumerate(maddeler)]
        r = _cagri(con, cfg, "kalite", KALITE_SORU,
                   json.dumps({"sorular": gorunen}, ensure_ascii=False), transport)
    else:
        r = _cagri(con, cfg, "kalite", KALITE_YARGI,
                   json.dumps({"maddeler": [dict(m, no=i + 1) for i, m in enumerate(maddeler)]},
                              ensure_ascii=False), transport)
    if not r.get("ok"):
        return None, r.get("note") or "Kalite kontrolü cevap vermedi."
    d = _json_ayikla(r["text"]) or {}
    gecen, dusen = [], []
    if tur == "soru":
        secim = {c.get("no"): c.get("secim") for c in (d.get("cevaplar") or [])
                 if isinstance(c, dict)}
        for i, m in enumerate(maddeler):
            s_ = secim.get(i + 1)
            if s_ == m["dogru"]:
                gecen.append(i)
            else:
                dusen.append({"no": i + 1, "neden": "Bağımsız çözüm «%s» buldu, anahtar «%s»."
                              % (s_ or "cevapsız", m["dogru"])})
    else:
        yargi = {y.get("no"): y for y in (d.get("yargilar") or []) if isinstance(y, dict)}
        for i in range(len(maddeler)):
            y = yargi.get(i + 1) or {}
            if y.get("dogru_mu") is True:
                gecen.append(i)
            else:
                dusen.append({"no": i + 1, "neden": str(y.get("neden") or "Yargı yok.")[:300]})
    return (gecen, dusen), None


def _kitap_bolumu(con, cfg, g, b, transport):
    """Bir bolum: uret, bicimi sina, bagimsiz cozumle denetle.
    Doner: (bolum, None) ya da (None, {durum, not})."""
    d = kitap.dagilim(b["adet"], g["zorluk"])
    r = _cagri(con, cfg, "uretim", URETIM_BAS + kitap.BICIM, kitap.istem(g, b, d), transport)
    if not r.get("ok"):
        return None, {"durum": "beklemede" if r.get("reason") == "budget" else "hata",
                      "not": r.get("note") or "Model cevap vermedi."}
    ham = (_json_ayikla(r["text"]) or {}).get("sorular") or []
    temiz = []
    for m in ham[:b["adet"] * 2]:
        x = _bicim("soru", m)
        if x and len(temiz) < b["adet"]:
            # Zorluk modelin BEYANIDIR; gercegi cozumle olculur (AYS).
            x["zorluk"] = m.get("zorluk") if m.get("zorluk") in kitap.ZORLUKLAR else "belirsiz"
            temiz.append(x)
    sorular, dusen = [], []
    if temiz:
        sonuc, hata = _denetle(con, cfg, "soru", temiz, transport)
        if hata:
            return None, {"durum": "beklemede",
                          "not": "Kalite kontrolü yapılamadı; bölüm yazılmadı. " + hata}
        gecen, dusen = sonuc
        sorular = [temiz[i] for i in gecen]
    return {"ad": b["ad"], "konular": b["konular"], "istenen": b["adet"], "hedef_dagilim": d,
            "sorular": sorular,
            "kalite": {"uretilen": len(temiz), "gecen": len(sorular), "dusen": dusen,
                       "bicim_dusen": max(0, min(len(ham), b["adet"]) - len(temiz))}}, None


def _kitap_adimi(con, cfg, j, g, transport, now):
    """Bolumlu test kitabi (core/kitap.py). Her tikte BIR bolum: adim
    «bekliyor» kalir ve ara sonuc adimda durur; uzun is sunucuyu kilitlemez.
    Model ya da butce yarida biterse uretilen bolumler kaybolmaz."""
    adim = next(a for a in j["adimlar"] if a["ofis"] == "uretim")
    ilerleme = adim.get("kitap") if isinstance(adim.get("kitap"), dict) else {"bolumler": []}
    sira = len(ilerleme["bolumler"])
    if sira < len(g["bolumler"]):
        bolum, dur = _kitap_bolumu(con, cfg, g, g["bolumler"][sira], transport)
        if dur:
            return dict(dur, kitap=ilerleme)
        ilerleme = {"bolumler": ilerleme["bolumler"] + [bolum]}
        if len(ilerleme["bolumler"]) < len(g["bolumler"]):
            return {"durum": "bekliyor", "kitap": ilerleme,
                    "not": "%d / %d bölüm üretildi." % (len(ilerleme["bolumler"]),
                                                     len(g["bolumler"]))}
    dolu = [b for b in ilerleme["bolumler"] if b["sorular"]]
    bos = [b["ad"] for b in ilerleme["bolumler"] if not b["sorular"]]
    if not dolu:
        return {"durum": "hata", "kitap": {"bolum": 0},
                "not": "Hiçbir bölümün sorusu kalite kontrolünü geçmedi; kitap yazılmadı."}
    zorluk = {z: 0 for z in kitap.ZORLUKLAR + ("belirsiz",)}
    for b in dolu:
        for s_ in b["sorular"]:
            zorluk[s_["zorluk"]] += 1
    uretilen = sum(b["kalite"]["uretilen"] for b in ilerleme["bolumler"])
    gecen = sum(len(b["sorular"]) for b in dolu)
    govde = {"tur": "kitap", "baslik": g["baslik"], "bolumler": dolu,
             "zorluk_hedef": g["zorluk"], "zorluk_beyan": zorluk, "zorluk_etiketi": "tahmin",
             "kalite": {"kontrol": "bağımsız çözüm", "uretilen": uretilen, "gecen": gecen},
             "bos_bolumler": bos}
    k = kayit_ekle(con, "materyal", g["baslik"], govde, dogruluk="dogrulanmadi",
                   etiketler=j["talep"][:300], is_id=j["id"], now=now)
    return {"durum": "tamam", "kayit_id": k["id"], "kitap": {"bolum": len(dolu), "soru": gecen},
            "not": "%d bölümlük kitap: %d soru üretildi, %d kalite kontrolünü geçti.%s" % (
                len(dolu), uretilen, gecen,
                (" Sorusu kalmayan bölüm: %s." % ", ".join(bos)) if bos else "")}


def _arastirma_bulgulari(con, j):
    """Ayni isin Arastirma adimi kaydindan YALNIZ dogrulanmis bulgular ve
    onlarin kaynaklari. Doner: (blok, kaynaklar, arastirma_etiketi)."""
    a = next((x for x in j["adimlar"] if x["ofis"] == "arastirma" and x.get("kayit_id")), None)
    if not a:
        return "", [], None
    k = kayit_getir(con, a["kayit_id"]) or {}
    g = k.get("govde") or {}
    satir = ["- %s %s" % (b["iddia"], "".join("[%d]" % n for n in b["dogrulayan"]))
             for b in g.get("bulgular") or [] if b.get("dogrulandi") and b.get("dogrulayan")]
    if not satir:
        return "", [], k.get("dogruluk")
    kullanilan = sorted({n for b in g["bulgular"] if b.get("dogrulandi") for n in b["dogrulayan"]})
    kaynaklar = [x for x in g.get("kaynaklar") or [] if x["n"] in kullanilan]
    blok = "\n".join(satir) + "\n\nKaynak listesi:\n" + "\n".join(
        "[%d] %s — %s" % (x["n"], x["baslik"], x["alan"]) for x in kaynaklar)
    return blok, kaynaklar, k.get("dogruluk")


def _urun_adimi(con, cfg, j, g, transport, now):
    """Katalogdaki urun (core/urunler.py). Model metni yazar; kod suzer.
    Arastirmadan dogrulanmis bulgu geldiyse urun onlara dayanir ve
    kaynak listesini tasir; gelmediyse «dogrulanmadi»dir."""
    blok, kaynaklar, ar_etiket = _arastirma_bulgulari(con, j)
    r = _cagri(con, cfg, "uretim", urunler.sistem(g), urunler.istem(g, blok), transport)
    if not r.get("ok"):
        return _model_hatasi(r)
    govde, neden = urunler.ayikla(g["tur"], _json_ayikla(r["text"]), kaynaklar)
    if neden:
        return {"durum": "hata", "not": "Ürün yazılmadı: " + neden}
    etiket = "dogrulanmadi"
    if kaynaklar and ar_etiket in ("kaynakli", "celiskili"):
        etiket = ar_etiket
    govde["istek"] = {"konu": g["konu"], "uzunluk": g["uzunluk"], "kaynakli": g["kaynakli"]}
    ar = next((x.get("kayit_id") for x in j["adimlar"] if x["ofis"] == "arastirma"), None)
    if ar:
        govde["dayanak"] = ar                 # Depolama Burosu guncelligi bununla izler
    k = kayit_ekle(con, "materyal", govde["baslik"], govde, dogruluk=etiket,
                   etiketler=j["talep"][:300], is_id=j["id"], now=now)
    return {"durum": "tamam", "kayit_id": k["id"],
            "not": "%s hazır — %s%s." % (urunler.URUNLER[g["tur"]]["ad"],
                                        {"kaynakli": "kaynaklı", "celiskili": "çelişkili",
                                         "dogrulanmadi": "doğrulanmadı"}[etiket],
                                        (", %d kaynak" % len(kaynaklar)) if kaynaklar else "")}


def _uretim_adimi(con, cfg, j, transport, now):
    hazir = ai.hazir_mi(cfg, "bam.uretim")
    if not hazir["ok"]:
        return {"durum": "beklemede", "not": hazir["note"]}
    u = (j.get("govde") or {}).get("urun")
    if u:
        return _urun_adimi(con, cfg, j, u, transport, now)
    g = (j.get("govde") or {}).get("kitap")
    if g:
        return _kitap_adimi(con, cfg, j, g, transport, now)
    tur, adet = uretim_istegi(j["talep"])
    r = _cagri(con, cfg, "uretim", URETIM_BAS + URETIM_BICIM[tur],
               "Üretim talebi: %s\nAdet: %d" % (j["talep"], adet), transport)
    if not r.get("ok"):
        if r.get("reason") == "budget":
            return {"durum": "beklemede", "not": r.get("note")}
        return {"durum": "hata", "not": r.get("note") or "Model cevap vermedi."}
    d = _json_ayikla(r["text"]) or {}
    ham = d.get({"soru": "sorular", "alistirma": "maddeler", "kart": "kartlar"}[tur]) or []
    temiz = [x for x in (_bicim(tur, m) for m in ham[:ADET["en_cok"]]) if x]
    bicim_dusen = min(len(ham), ADET["en_cok"]) - len(temiz)
    if not temiz:
        return {"durum": "hata", "not": "Üretilen maddelerin hiçbiri biçim denetimini geçmedi."}
    sonuc, hata = _denetle(con, cfg, tur, temiz, transport)
    if hata:
        return {"durum": "beklemede", "not": "Kalite kontrolü yapılamadı; set teklif "
                "edilmedi. " + hata}
    gecen, dusen = sonuc
    maddeler = [temiz[i] for i in gecen]
    baslik = str(d.get("baslik") or j["talep"]).strip()[:120]
    govde = {"tur": tur, "konu": str(d.get("konu") or "").strip()[:200],
             "maddeler": maddeler,
             "kalite": {"kontrol": "bağımsız çözüm" if tur == "soru" else "yargı",
                        "uretilen": len(temiz), "gecen": len(maddeler),
                        "dusen": dusen, "bicim_dusen": bicim_dusen}}
    k = kayit_ekle(con, "materyal", baslik, govde, dogruluk="dogrulanmadi",
                   etiketler=j["talep"][:300], is_id=j["id"], now=now)
    not_ = "%d madde üretildi, %d kalite kontrolünü geçti." % (len(temiz), len(maddeler))
    # Kart olarak alabilen iki modul: AYS ve ESP (ESP seti dil ya da tarih
    # destesine alir; hangisi oldugunu KENDI kuralıyla okur).
    if maddeler and j.get("hedef_modul") in ("ays", "esp"):
        n = intents.create(con, j["hedef_modul"], "material.add",
                           {"kayit_id": k["id"], "adet": len(maddeler), "baslik": baslik},
                           None, source="bam")
        if n.get("ok"):
            iz_ekle(con, "kayit", k["id"], "niyet", n["intent"]["id"], now=now)
            not_ += " %s'ye teklif bırakıldı." % {"ays": "AYS", "esp": "ESP"}[j["hedef_modul"]]
    return {"durum": "tamam", "kayit_id": k["id"], "not": not_}


ADIM = {"kayit": _kayit_adimi, "arastirma": _arastirma_adimi,
        "planlama": _planlama_adimi, "uretim": _uretim_adimi}


# ----------------------------------------------------------------- kayitlar

def kayit_ekle(con, tur, baslik, govde, dogruluk="dogrulanmadi", etiketler="",
               is_id=None, onceki_id=None, now=None, anahtar=None):
    if tur not in TURLER:
        return {"ok": False, "note": "Bilinmeyen kayıt türü."}
    if dogruluk not in DOGRULUK:
        return {"ok": False, "note": "Bilinmeyen doğruluk etiketi."}
    b = str(baslik or "").strip()
    if not b:
        return {"ok": False, "note": "Başlık boş."}
    surum = 1
    if onceki_id:
        o = con.execute("SELECT surum FROM bam_kayitlar WHERE id=?",
                        (int(onceki_id),)).fetchone()
        if not o:
            return {"ok": False, "note": "Önceki sürüm bulunamadı."}
        surum = o["surum"] + 1
    at = _simdi(now)
    cur = con.execute("INSERT INTO bam_kayitlar(tur,baslik,govde,dogruluk,etiketler,surum,"
                      "onceki_id,is_id,created_at,anahtar) VALUES (?,?,?,?,?,?,?,?,?,?)",
                      (tur, b[:200], json.dumps(govde or {}, ensure_ascii=False),
                       dogruluk, str(etiketler or "")[:300], surum,
                       int(onceki_id) if onceki_id else None,
                       int(is_id) if is_id else None, at, anahtar or None))
    kid = cur.lastrowid
    if is_id:
        iz_ekle(con, "is", is_id, "kayit", kid, now=at)
    if onceki_id:
        iz_ekle(con, "kayit", onceki_id, "kayit", kid, now=at)
    return {"ok": True, "id": kid, "surum": surum}


def kayit_getir(con, id_):
    r = con.execute("SELECT * FROM bam_kayitlar WHERE id=?", (int(id_),)).fetchone()
    if not r:
        return None
    d = dict(r)
    d["govde"] = json.loads(d["govde"] or "{}")
    try:
        d["denetim"] = json.loads(d.get("denetim") or "null")
    except ValueError:
        d["denetim"] = None
    return d


def kayit_listesi(con, limit=30):
    return [dict(r) for r in con.execute(
        "SELECT id,tur,baslik,dogruluk,surum,onceki_id,is_id,created_at FROM bam_kayitlar "
        "ORDER BY id DESC LIMIT ?", (max(1, min(int(limit), 200)),)).fetchall()]


def kayit_ara(con, sorgu, limit=5):
    """Kelime ortusmesiyle arama. Model gerektirmez."""
    kelimeler = [w for w in re.split(r"[^\wçğıöşü]+", _kucuk(sorgu)) if len(w) >= 3]
    if not kelimeler:
        return []
    puanli = []
    for r in con.execute("SELECT id,tur,baslik,etiketler,govde,dogruluk,surum "
                         "FROM bam_kayitlar ORDER BY id DESC LIMIT 500").fetchall():
        metin = _kucuk(" ".join((r["baslik"], r["etiketler"], r["govde"])))
        puan = sum(1 for w in kelimeler if w in metin)
        if puan:
            puanli.append((puan, r["id"], r))
    puanli.sort(key=lambda x: (-x[0], -x[1]))
    return [{"id": r["id"], "tur": r["tur"], "baslik": r["baslik"],
             "dogruluk": r["dogruluk"], "surum": r["surum"]}
            for _, _, r in puanli[:max(1, int(limit))]]


# ---------------------------------------------------------------------- iz

def iz_ekle(con, kaynak_tur, kaynak_id, hedef_tur, hedef_id, now=None):
    con.execute("INSERT OR IGNORE INTO bam_iz(kaynak_tur,kaynak_id,hedef_tur,hedef_id,"
                "created_at) VALUES (?,?,?,?,?)",
                (kaynak_tur, str(kaynak_id), hedef_tur, str(hedef_id), _simdi(now)))


def iz_zinciri(con, tur, id_, derinlik=10):
    """«Bu neden var?» — geriye dogru kokler, yakindan uzaga."""
    out, bak, gorulen = [], [(tur, str(id_))], set()
    for _ in range(derinlik):
        yeni = []
        for t, i in bak:
            for r in con.execute("SELECT kaynak_tur,kaynak_id FROM bam_iz WHERE "
                                 "hedef_tur=? AND hedef_id=? ORDER BY id", (t, i)):
                k = (r["kaynak_tur"], r["kaynak_id"])
                if k not in gorulen:
                    gorulen.add(k)
                    out.append({"tur": k[0], "id": k[1]})
                    yeni.append(k)
        if not yeni:
            break
        bak = yeni
    return out


# ------------------------------------------------------ Hayat Mottosu'ndan

# Kullanici bir dusunceden BAM'a is verebilir. BAM dusunceyi OKUR, ona
# YAZMAZ: sonuc BAM'in kendi kaydidir ve dusuncenin yaninda «uretilen»
# diye, ayri gosterilir (core/motto.py «kullanicinin sozu ile uretilen
# ayri durur»). Simdilik yalniz arastirma; plan ve belge ilgili ofisler
# acilinca eklenecek.
MOTTO_ISTEK = {"arastir": "«%s» düşüncesini araştır. Düşüncenin metni: %s"}


def mottodan_is(con, node_id, istek, user="ben", now=None):
    from core import motto
    if istek not in MOTTO_ISTEK:
        return {"ok": False, "note": "Bu düşünceyle şimdilik yalnız araştırma istenebilir."}
    try:
        n = motto.dugum(con, int(node_id), user=user)
    except (TypeError, ValueError):
        n = None
    if not n:
        return {"ok": False, "note": "Düşünce bulunamadı."}
    talep = MOTTO_ISTEK[istek] % (n["title"], (n["body"] or "").strip()[:800] or "(metin yok)")
    r = is_ac(con, talep, kaynak="motto", now=now)
    if r.get("ok"):
        iz_ekle(con, "motto", n["id"], "is", r["id"], now=now)
    return r


def mottonun_isleri(con, node_id):
    """Bir dusunceden dogan isler ve urettikleri kayitlar."""
    out = []
    for z in con.execute("SELECT hedef_id FROM bam_iz WHERE kaynak_tur='motto' AND "
                         "kaynak_id=? AND hedef_tur='is' ORDER BY id DESC",
                         (str(int(node_id)),)).fetchall():
        j = is_getir(con, int(z["hedef_id"]))
        if not j:
            continue
        kayitlar = [dict(r) for r in con.execute(
            "SELECT id,baslik,dogruluk,tur FROM bam_kayitlar WHERE is_id=? ORDER BY id",
            (j["id"],)).fetchall()]
        out.append({"is_id": j["id"], "talep": j["talep"], "durum": j["durum"],
                    "kayitlar": kayitlar})
    return out


# -------------------------------------------------------------------- ozet

def ozet(con):
    """Ofis ekrani icin: ofisler, isler, son kayitlar."""
    sayac = {r["durum"]: r["n"] for r in con.execute(
        "SELECT durum, COUNT(*) AS n FROM bam_isler GROUP BY durum")}
    return {"ofisler": [dict(OFISLER[o], id=o) for o in SIRA],
            "isler": is_listesi(con, 20), "kayitlar": kayit_listesi(con, 20),
            "sayac": sayac}
