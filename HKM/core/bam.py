# -*- coding: utf-8 -*-
"""BAM — Bilgi ve Aksiyon Modulu. HKM'nin alt moduludur; besinci bir
sistem degildir (AGENTS.md §1.4).

   BAM bilgiyi uretir ve uygulanabilir aksiyona donusturur. Dort ofisi
   vardir; her iste hepsi calismaz, BAM Patronu gerekenleri secer:

     Kayit       «bu daha once yapildi mi?» — her is ONCE buradan gecer.
                 Model gerektirmez; tekrar isi ve bosa harcamayi keser.
     Arastirma   alt sorular, bulgular, guven duzeyi. Internete erisim
                 henuz yok: bulgular modelin bilgisidir ve kayit HER
                 ZAMAN «dogrulanmadi» etiketini tasir.
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

from core import ai, intents, mufredat, planlama

OFISLER = {
    "kayit": {
        "ad": "Kayıt Ofisi", "patron": "Kayıt Patronu", "durum": "hazir",
        "gorev": "Üretilen bilgiyi düzenli, aranabilir ve sürümlü tutar; yeni işe "
                 "başlamadan önce «bu daha önce yapıldı mı?» sorusunu cevaplar.",
        "ajanlar": ["Kayıt Kabul Uzmanı", "Sınıflandırma Uzmanı", "Arşiv Uzmanı",
                    "İndeksleme Uzmanı", "İlişkilendirme Uzmanı", "Arama Uzmanı",
                    "Sürüm Uzmanı", "Kayıt Doğrulama Uzmanı"]},
    "arastirma": {
        "ad": "Araştırma Ofisi", "patron": "Araştırma Patronu", "durum": "hazir",
        "gorev": "Talebi alt sorulara böler, bulguları güven düzeyiyle yazar. "
                 "Kaynağa erişim henüz yok: her kayıt «doğrulanmadı» etiketini taşır.",
        "ajanlar": ["Araştırma Mimarı", "Kaynak Tarayıcı", "Derin Araştırmacı",
                    "Birincil Kaynak Uzmanı", "Akademik Kaynak Uzmanı",
                    "Kaynak Doğrulayıcı", "Çelişki Analisti", "Kanıt Analisti",
                    "Araştırma Yazarı"]},
    "planlama": {
        "ad": "Planlama Ofisi", "patron": "Planlama Patronu", "durum": "hazir",
        "gorev": "Hedefi haftalık bir yol haritasına çevirir: program, simülasyon ve plan "
                 "denetimi. v1 kuralla çalışır ve yalnız modülün gönderdiği yapılandırılmış "
                 "hedefi alır (şimdilik SPİ kilo planı); serbest cümleden plan kurmaz.",
        "ajanlar": ["Hedef Analisti", "Durum Analisti", "Kısıt Analisti",
                    "Bağımlılık Analisti", "Kapasite Analisti", "Program Mimarı",
                    "Simülasyon Uzmanı", "Optimizasyon Uzmanı", "Plan Denetçisi"]},
    "uretim": {
        "ad": "Üretim Ofisi", "patron": "Üretim Patronu", "durum": "hazir",
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

ARASTIRMA_SISTEM = """Sen HKM'deki BAM'ın Araştırma Ofisisin. Araştırma Patronu adına
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

def _kayit_adimi(con, cfg, j, transport, now):
    bulunan = [r["id"] for r in kayit_ara(con, j["talep"])]
    return {"durum": "tamam", "bulunan": bulunan,
            "not": ("%d önceki kayıt bulundu; işe bunlarla başlanır." % len(bulunan))
            if bulunan else "Bu konuda önceki kayıt yok."}


def _json_ayikla(metin):
    m = re.search(r"\{.*\}", metin or "", re.S)
    if not m:
        return None
    try:
        d = json.loads(m.group(0))
    except ValueError:
        return None
    return d if isinstance(d, dict) else None


def _mufredat_adimi(con, cfg, j, g, transport, now):
    """Mufredat raporu (core/mufredat.py): model DERS -> KONU agacini yazar,
    kod suzer. Hic ders gecmezse kayit yazilmaz; uydurulmus mufredat yasak."""
    r = ai.ask(con, cfg, "bam.arastirma", "arastirma",
               [{"role": "user", "content": mufredat.istem(g)}],
               sistem=mufredat.SISTEM, transport=transport, duzeltme=False, denetim="belge")
    if not r.get("ok"):
        if r.get("reason") == "budget":
            return {"durum": "beklemede", "not": r.get("note")}
        return {"durum": "hata", "not": r.get("note") or "Model cevap vermedi."}
    govde, neden = mufredat.ayikla(_json_ayikla(r["text"]), g)
    if neden:
        return {"durum": "hata", "not": "Müfredat raporu yazılmadı: " + neden}
    k = kayit_ekle(con, "arastirma", "%s müfredatı" % g["sinav"], govde,
                   dogruluk="dogrulanmadi", etiketler=j["talep"][:300], is_id=j["id"], now=now)
    return {"durum": "tamam", "kayit_id": k["id"],
            "not": "Müfredat raporu kaydedildi: %d ders, %d konu — kaynaksız, doğrulanmadı."
                   % (govde["ders_sayisi"], govde["konu_sayisi"])}


def _arastirma_adimi(con, cfg, j, transport, now):
    hazir = ai.hazir_mi(cfg, "bam.arastirma")
    if not hazir["ok"]:
        return {"durum": "beklemede", "not": hazir["note"]}
    g = (j.get("govde") or {}).get("mufredat")
    if g:
        return _mufredat_adimi(con, cfg, j, g, transport, now)
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
    baslik = str(d.get("baslik") or j["talep"]).strip()[:200]
    k = kayit_ekle(con, "arastirma", baslik, govde, dogruluk="dogrulanmadi",
                   etiketler=j["talep"][:300], is_id=j["id"], now=now)
    return {"durum": "tamam", "kayit_id": k["id"],
            "not": "Araştırma kaydedildi — kaynaksız, doğrulanmadı."}


def _planlama_adimi(con, cfg, j, transport, now):
    """Planlama Ofisi v1 (core/planlama.py). Yapilandirilmis hedef yoksa
    plan UYDURULMAZ: serbest bir cumleden program kurmak, kullanicinin
    kapasitesini, kilosunu ve tarihini tahmin etmek olurdu."""
    girdi = (j.get("govde") or {}).get("plan")
    if not girdi:
        return {"durum": "ertelendi",
                "not": "Planlama Ofisi v1 yalnız modülün gönderdiği yapılandırılmış hedefle "
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

URETIM_BAS = """Sen HKM'deki BAM'ın Üretim Ofisisin. Üretim Patronu adına çalışırsın;
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

KALITE_SORU = """Sen BAM Üretim Ofisi'nin Kalite Kontrol Uzmanısın. Sana CEVAP ANAHTARI
OLMADAN çoktan seçmeli sorular verilecek. Her soruyu kendin baştan çöz; başkasının
cevabını tahmin etmeye çalışma. Şıklar sırasıyla A, B, C, D, E'dir.
ÇIKTI: Yalnız şu JSON: {"cevaplar": [{"no": 1, "secim": "A", "emin": true}]}"""

KALITE_YARGI = """Sen BAM Üretim Ofisi'nin Kalite Kontrol Uzmanısın. Sana maddeler ve
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


def _uretim_adimi(con, cfg, j, transport, now):
    hazir = ai.hazir_mi(cfg, "bam.uretim")
    if not hazir["ok"]:
        return {"durum": "beklemede", "not": hazir["note"]}
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
               is_id=None, onceki_id=None, now=None):
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
                      "onceki_id,is_id,created_at) VALUES (?,?,?,?,?,?,?,?,?)",
                      (tur, b[:200], json.dumps(govde or {}, ensure_ascii=False),
                       dogruluk, str(etiketler or "")[:300], surum,
                       int(onceki_id) if onceki_id else None,
                       int(is_id) if is_id else None, at))
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
    return d


def kayit_listesi(con, limit=30):
    return [dict(r) for r in con.execute(
        "SELECT id,tur,baslik,dogruluk,surum,is_id,created_at FROM bam_kayitlar "
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
