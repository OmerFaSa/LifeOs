"""Celiski cozumu — HKM.PRECEDENCE (MIMARI.md §5).

Ustteki alttakini her zaman yener. Bu sira BIR VERIDIR, bir if zinciri
degil: siralamayi okumak icin kodu okumak gerekmesin.

Uretilen cumle emir degil ONERIDIR. «zorunlu kilindi» bicimi kod duzeyinde
bile yanlistir: HKM'nin isletim sistemi seviyesinde boyle bir yetkisi yoktur.
"""

from core import vp_academic, vp_bio, vp_intellect

# Bu satirlar EKRANA CIKAR: kullanici gunun onerisinin hangi sirayla
# secildigini burada okur. Bu yuzden ASCII degil, duzgun Turkce yazilir —
# kod yorumlari ile kullaniciya gosterilen metin ayri seylerdir.
PRECEDENCE = [
    {"rank": 1, "key": "bio_red",        "vp": "bio",
     "label": "SPİ'nin kırmızı bayrağı",
     "note": "Kritik biyobelirteç ya da toparlanma eşiği."},
    {"rank": 2, "key": "fixed_calendar", "vp": "academic",
     "label": "Dış dünyanın sabit takvimi",
     "note": "Sınav, teslim tarihi — ertelenemez."},
    {"rank": 3, "key": "academic_goal",  "vp": "academic",
     "label": "AYS'nin zamana bağlı hedefi",
     "note": "Takvime bağlı akademik taban."},
    {"rank": 4, "key": "blocked_core",   "vp": "intellect",
     "label": "ESP'nin tıkanmış temeli",
     "note": "SRS vadesi, teknik plato."},
    {"rank": 5, "key": "new_content",    "vp": "intellect",
     "label": "ESP'nin yeni içerik hedefi",
     "note": "İlk feda edilen."},
]

DEADLINE_NEAR_DAYS = 7


def _proposal(rank, text):
    p = next(x for x in PRECEDENCE if x["rank"] == rank)
    # «vp» de tasinir: kullanicinin «bunu kim soyledi» sorusunun cevabi,
    # cumleyi uretenin kim oldugunu bilmeden verilemez.
    return {"rank": rank, "key": p["key"], "label": p["label"],
            "vp": p["vp"], "proposal": text}


def resolve(bio=None, academic=None, intellect=None, payloads=None):
    """Uc VP raporunu tek oneriye indirger. Hicbir sey yoksa None dondurur —
    uydurulmus bir oneri, oneri olmamasindan kotudur."""
    payloads = payloads or {}

    if bio and vp_bio.red_flag(bio):
        return _proposal(1,
            "Fiziksel sermaye çöküş eşiğinde. Bugünkü ağır yükün yarına "
            "ertelenmesini öneririm; onaylarsan yerine hafif konu tekrarı koyarım.")

    days = vp_academic.deadline_days(payloads.get("ays"))
    if days is not None and days <= DEADLINE_NEAR_DAYS:
        return _proposal(2,
            "Sınava %d gün kaldı. Bugünün merkezine AYS'yi almanı öneririm."
            % int(days))

    if academic and any(f["code"] in ("questions_low", "study_low", "net_drop")
                        for f in academic["findings"]):
        return _proposal(3,
            "AYS'nin günlük tabanı karşılanmadı. Önce oradaki açığı kapatmanı "
            "öneririm.")

    if intellect and vp_intellect.blocked_core(intellect):
        return _proposal(4,
            "ESP'nin temeli tıkalı: vadesi geçmiş kartlar yeni içeriğin önünde. "
            "Önce tekrar oturumunu kapatmanı öneririm.")

    if intellect and any(f["code"] in ("practice_low", "synthesis_gap")
                         for f in intellect["findings"]):
        return _proposal(5,
            "Temel açık değil; ESP'de yeni içeriğe geçebilirsin. Sentez açığını "
            "kapatmakla başlamanı öneririm.")

    return None
