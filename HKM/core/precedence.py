"""Celiski cozumu — HKM.PRECEDENCE (MIMARI.md §5).

Ustteki alttakini her zaman yener. Bu sira BIR VERIDIR, bir if zinciri
degil: siralamayi okumak icin kodu okumak gerekmesin.

Uretilen cumle emir degil ONERIDIR. «zorunlu kilindi» bicimi kod duzeyinde
bile yanlistir: HKM'nin isletim sistemi seviyesinde boyle bir yetkisi yoktur.
"""

from core import vp_academic, vp_bio, vp_intellect

PRECEDENCE = [
    {"rank": 1, "key": "bio_red",        "label": "SPI kirmizi bayragi",
     "note": "Kritik biyobelirtec ya da toparlanma esigi."},
    {"rank": 2, "key": "fixed_calendar", "label": "Dis dunyanin sabit takvimi",
     "note": "Sinav, teslim tarihi — ertelenemez."},
    {"rank": 3, "key": "academic_goal",  "label": "AYS'nin zamana bagli hedefi",
     "note": "Takvime bagli akademik taban."},
    {"rank": 4, "key": "blocked_core",   "label": "ESP'nin tikanmis temeli",
     "note": "SRS vadesi, teknik plato."},
    {"rank": 5, "key": "new_content",    "label": "ESP'nin yeni icerik hedefi",
     "note": "Ilk feda edilen."},
]

DEADLINE_NEAR_DAYS = 7


def _proposal(rank, text):
    p = next(x for x in PRECEDENCE if x["rank"] == rank)
    return {"rank": rank, "key": p["key"], "label": p["label"], "proposal": text}


def resolve(bio=None, academic=None, intellect=None, payloads=None):
    """Uc VP raporunu tek oneriye indirger. Hicbir sey yoksa None dondurur —
    uydurulmus bir oneri, oneri olmamasindan kotudur."""
    payloads = payloads or {}

    if bio and vp_bio.red_flag(bio):
        return _proposal(1,
            "Fiziksel sermaye cokus esiginde. Bugunku agir yuku yarina "
            "ertelenmesini oneririm; onaylarsan yerine hafif konu tekrari koyarim.")

    days = vp_academic.deadline_days(payloads.get("ays"))
    if days is not None and days <= DEADLINE_NEAR_DAYS:
        return _proposal(2,
            "Sinava %d gun kaldi. Bugunun merkezine AYS'yi almani oneririm."
            % int(days))

    if academic and any(f["code"] in ("questions_low", "study_low", "net_drop")
                        for f in academic["findings"]):
        return _proposal(3,
            "AYS'nin gunluk tabani karsilanmadi. Once oradaki acigi kapatmani "
            "oneririm.")

    if intellect and vp_intellect.blocked_core(intellect):
        return _proposal(4,
            "ESP'nin temeli tikali: vadesi gecmis kartlar yeni icerigin onunde. "
            "Once tekrar oturumunu kapatmani oneririm.")

    if intellect and any(f["code"] in ("practice_low", "synthesis_gap")
                         for f in intellect["findings"]):
        return _proposal(5,
            "Temel acik degil; ESP'de yeni icerige gecebilirsin. Sentez acigini "
            "kapatmakla baslamani oneririm.")

    return None
