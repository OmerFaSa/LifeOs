# -*- coding: utf-8 -*-
"""Capraz bulgu — HKM'nin VAR OLMA GEREKCESI.

   MIMARI.md §10'daki durust soru duruyordu: «ucunu tek sesle ozetlemek»
   icin bir daemon, bir SQLite ve bir VP konseyi gerekiyor mu? Uc sistemin
   her biri kendi alaninda zaten daha iyisini yapiyor.

   Cevap tek bir yerde: HICBIRININ TEK BASINA GOREMEYECEGI SEY. AYS uykuyu
   olcmez, SPI soru sayisini bilmez, ESP ikisini de gormez. Bir gecenin
   ertesi gune ne yaptigi, ancak uc ambarin yan yana konduguna gorunur.

   Bu dosyanin tamamini dort kural yonetir:

   1. NEDEN-SONUC KURULMAZ. Burada uretilen her cumle bir ESLESMEDIR:
      «su gunlerde su boyle olcuIdu». Ayni haftada baska her sey de
      degisti ve bu dosya bunu bilmez. «Cunku» kelimesi buradan cikmaz.

   2. ESIGIN ALTINDA HUKUM YOK. Az sayida eslesmis gun bir egilim degil
      bir tesaduftur. Taban ASGARI_GUN'dur ve altinda «veri yok» denir —
      «iliski yok» DEGIL.

   3. BOLUNME MEDYANDAN. Kullanicinin kendi medyani esik olur; disaridan
      getirilmis bir «7 saat uyku» esigi bu kisi icin dogru olmayabilir.
      Ayrica medyan, tek bir kotu gunden etkilenmez.

   4. KUCUK FARK BULGU DEGILDIR. Iki yarinin ortancasi arasindaki fark,
      olcunun kendi genisliginin altindaysa «fark gorunmuyor» denir.
      Gurultuyu bulgu diye sunmak, olcmemekten kotudur.
"""

import datetime

from core import certainty as C
from core import db

ASGARI_GUN = 8           # her iki yarida en az bu kadar eslesmis gun toplam
ASGARI_YARI = 3          # her yarida en az bu kadar gun
FARK_ESIGI = 0.15        # iki yarinin ortancasi arasindaki asgari oransal fark
PENCERE = 60             # gun

PAIRS = [
    {"id": "sleep-vs-questions",
     "a": {"module": "spi", "metric": "sleep_hours", "label": "uyku saati"},
     "b": {"module": "ays", "metric": "questions", "label": "ertesi gün soru sayısı"},
     "lag": 1,
     "question": "İyi uyunan gecelerin ertesi günü gerçekten daha mı verimli "
                 "geçiyor — yoksa öyle olduğunu mu varsayıyorsun?"},
    {"id": "sleep-vs-practice",
     "a": {"module": "spi", "metric": "sleep_hours", "label": "uyku saati"},
     "b": {"module": "esp", "metric": "practice_minutes", "label": "ertesi gün pratik dakikası"},
     "lag": 1,
     "question": "Uykunun pratiğe etkisi, çalışmaya etkisiyle aynı mı?"},
    {"id": "recovery-vs-study",
     "a": {"module": "spi", "metric": "recovery", "label": "toparlanma skoru"},
     "b": {"module": "ays", "metric": "study_minutes", "label": "aynı gün çalışma dakikası"},
     "lag": 0,
     "question": "Toparlanmanın düşük olduğu günlerde planı küçültmek mi "
                 "gerekiyor, yoksa plan zaten kendiliğinden mi küçülüyor?"},
    {"id": "study-vs-practice",
     "a": {"module": "ays", "metric": "study_minutes", "label": "çalışma dakikası"},
     "b": {"module": "esp", "metric": "practice_minutes", "label": "aynı gün pratik dakikası"},
     "lag": 0,
     "question": "İkisi aynı günün aynı saatlerinden besleniyor. Biri "
                 "büyürken diğeri küçülüyorsa, bu bir tercih mi bir kayıp mı?"},
    # --- gelismis kapsam ciftleri ---
    # Bu ikisi yalniz «gelismis» kapsamda veri bulur; ozet kapsamda
    # eslesmis gun sayisi esigi gecmez ve dogru sekilde «veri yok» der.
    {"id": "training-vs-next-day-study",
     "a": {"module": "spi", "metric": "train_minutes", "label": "antrenman dakikası"},
     "b": {"module": "ays", "metric": "study_minutes", "label": "ertesi gün çalışma dakikası"},
     "lag": 1,
     "question": "Ağır antrenman günlerinin ertesi günü masada ne oluyor? "
                 "İkisi aynı günün enerjisinden besleniyor."},
    {"id": "protein-vs-next-day-recovery",
     "a": {"module": "spi", "metric": "protein_g", "label": "günlük protein"},
     "b": {"module": "spi", "metric": "recovery", "label": "ertesi gün toparlanma"},
     "lag": 1,
     "question": "Protein alımı ile ertesi günün toparlanması birlikte mi "
                 "hareket ediyor?"},
    {"id": "sleep-vs-retention",
     "a": {"module": "spi", "metric": "sleep_hours", "label": "uyku saati"},
     "b": {"module": "esp", "metric": "retention", "label": "ertesi gün kalıcılık"},
     "lag": 1,
     "question": "Hatırlama, uykuyla birlikte mi değişiyor?"},
]


def _iso(d):
    return d.isoformat()


def _add(date_str, days):
    return _iso(datetime.date.fromisoformat(date_str) + datetime.timedelta(days=days))


def _median(xs):
    s = sorted(xs)
    n = len(s)
    if not n:
        return None
    return s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2.0


def series(con, date, days=PENCERE):
    """Modul/metrik -> {gun: (deger, kesinlik)} — yalniz etiketli olanlar."""
    start = _add(date, -(days - 1))
    out = {}
    for e in db.events_between(con, start, date):
        for key, m in (e["payload"].get("metrics") or {}).items():
            if not isinstance(m, dict) or not C.is_valid(m.get("cert")):
                continue
            v = C.value_of(m)
            if v is None:
                continue
            out.setdefault((e["module"], key), {})[e["date"]] = (v, m["cert"])
    return out


def pair(defn, seri):
    """Tek bir cift. Hicbir kosulda «cunku» demez."""
    a = seri.get((defn["a"]["module"], defn["a"]["metric"]), {})
    b = seri.get((defn["b"]["module"], defn["b"]["metric"]), {})
    base = {"id": defn["id"], "question": defn["question"],
            "aLabel": defn["a"]["label"], "bLabel": defn["b"]["label"],
            "lag": defn["lag"]}

    eslesme = []
    for gun, (av, ac) in sorted(a.items()):
        hedef = _add(gun, defn["lag"])
        if hedef not in b:
            continue
        bv, bc = b[hedef]
        eslesme.append((gun, av, bv, ac, bc))

    if len(eslesme) < ASGARI_GUN:
        return dict(base, status="missing", cert="missing", n=len(eslesme),
                    note="Eşleşmiş gün sayısı %d; hüküm için %d gerekir. Az veri "
                         "«ilişki yok» demek DEĞİLDİR." % (len(eslesme), ASGARI_GUN))

    esik = _median([x[1] for x in eslesme])
    ust = [x for x in eslesme if x[1] > esik]
    alt = [x for x in eslesme if x[1] <= esik]

    # Iki degerli bir dagilimda medyan ustteki degere esit dusebilir ve
    # «> medyan» yarisi bos kalir. Boyle bir gunde veri VARDIR, bolunme
    # yanlistir: esitleri ust yariya alarak bir kez daha denenir.
    if len(ust) < ASGARI_YARI:
        ust2 = [x for x in eslesme if x[1] >= esik]
        alt2 = [x for x in eslesme if x[1] < esik]
        if len(ust2) >= ASGARI_YARI and len(alt2) >= ASGARI_YARI:
            ust, alt = ust2, alt2

    if len(ust) < ASGARI_YARI or len(alt) < ASGARI_YARI:
        return dict(base, status="missing", cert="missing", n=len(eslesme),
                    threshold=esik,
                    note="Ölçümlerin neredeyse hepsi aynı bantta (%d/%d). İki yarı "
                         "oluşmadan karşılaştırma yapılamaz." % (len(ust), len(alt)))

    ustOrt = _median([x[2] for x in ust])
    altOrt = _median([x[2] for x in alt])
    if altOrt in (0, None):
        fark = None
    else:
        fark = (ustOrt - altOrt) / abs(altOrt)

    # Kesinlik: iki taraf da olculmusse «olculdu», degilse «hesaplandi».
    olculdu = all(x[3] == "measured" for x in eslesme) and \
        all(x[4] == "measured" for x in eslesme)
    cert = "measured" if olculdu else "computed"

    ortak = dict(base, n=len(eslesme), threshold=esik, cert=cert,
                 high={"n": len(ust), "median": ustOrt},
                 low={"n": len(alt), "median": altOrt},
                 difference=fark)

    if fark is None or abs(fark) < FARK_ESIGI:
        return dict(ortak, status="flat",
                    note="%s medyanı %s; üstünde kalan %d günde %s ortancası %s, "
                         "altında kalan %d günde %s. Fark, bu ölçünün genişliğinin "
                         "altında: görünür bir ayrışma yok."
                         % (defn["a"]["label"], _fmt(esik), len(ust), defn["b"]["label"],
                            _fmt(ustOrt), len(alt), _fmt(altOrt)))

    return dict(ortak, status="higher" if fark > 0 else "lower",
                note="%s medyanı %s. Üstünde kalan %d günde %s ortancası %s, "
                     "altında kalan %d günde %s — %%%d %s. Bu bir EŞLEŞMEDİR, "
                     "neden-sonuç değil: aynı günlerde başka her şey de değişti."
                     % (defn["a"]["label"], _fmt(esik), len(ust), defn["b"]["label"],
                        _fmt(ustOrt), len(alt), _fmt(altOrt),
                        round(abs(fark) * 100), "yukarıda" if fark > 0 else "aşağıda"))


def _fmt(v):
    if v is None:
        return "—"
    if abs(v - round(v)) < 0.05:
        return str(int(round(v)))
    return ("%.1f" % v).replace(".", ",")


def scan(con, date, days=PENCERE):
    seri = series(con, date, days)
    return [pair(d, seri) for d in PAIRS]


def findings(con, date, days=PENCERE):
    """Yalniz gorunur ayrisma gosterenler — «flat» ve «missing» bulgu degildir."""
    return [p for p in scan(con, date, days)
            if p["status"] in ("higher", "lower")]
