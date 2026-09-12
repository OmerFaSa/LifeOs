"""Oncelik sirasi — ustteki alttakini her zaman yener, ve cumle emir degildir."""

import re

from core import precedence, thresholds, vp_academic, vp_bio, vp_intellect
from tests.harness import eq, metric, no, ok, suite, test

TH = thresholds.DEFAULTS

# Emir kipi TAM KELIME aranir. Alt dize aramak yanlis alarm uretir:
# «kapatmani oneririm» bir oneridir, «kapat» degil — ve yanlis oten bir
# denetci, denetledigi hatadan pahaliya mal olur.
BUYURGAN = ("zorunlu", "kapat", "yasak", "mecbur", "zorundasin", "kilindi")
TR_W = "A-Za-zCGIOSUcgiosuçğıiöşüÇĞİÖŞÜ0-9_"
BUYURGAN_RE = re.compile(
    "(?<![%s])(?:%s)(?![%s])" % (TR_W, "|".join(BUYURGAN), TR_W))


def run():
    suite("oncelik")

    bio_red = vp_bio.audit({"sleep_hours": metric(4.0)}, TH)
    bio_ok = vp_bio.audit({"sleep_hours": metric(8.0), "recovery": metric(70)}, TH)
    ac_low = vp_academic.audit({"questions": metric(10)}, TH)
    ac_ok = vp_academic.audit({"questions": metric(200),
                               "study_minutes": metric(200)}, TH)
    int_blocked = vp_intellect.audit({"retention": metric(0.2),
                                      "retention_cards": metric(20)}, TH)
    int_new = vp_intellect.audit({"synthesis_gap_days": metric(40)}, TH)

    def t_bio_wins():
        p = precedence.resolve(bio=bio_red, academic=ac_low, intellect=int_blocked)
        eq(p["rank"], 1)
    test("SPI kirmizi bayragi her seyi yener", t_bio_wins)

    def t_calendar_over_academic():
        p = precedence.resolve(bio=bio_ok, academic=ac_low, intellect=int_blocked,
                               payloads={"ays": {"exam_days_left": metric(3)}})
        eq(p["rank"], 2)
    test("sabit takvim akademik hedefi yener", t_calendar_over_academic)

    def t_academic_over_core():
        p = precedence.resolve(bio=bio_ok, academic=ac_low, intellect=int_blocked)
        eq(p["rank"], 3)
    test("akademik hedef tikanmis temeli yener", t_academic_over_core)

    def t_core_over_new():
        p = precedence.resolve(bio=bio_ok, academic=ac_ok, intellect=int_blocked)
        eq(p["rank"], 4)
    test("tikanmis temel yeni icerigi yener", t_core_over_new)

    def t_new_content_last():
        p = precedence.resolve(bio=bio_ok, academic=ac_ok, intellect=int_new)
        eq(p["rank"], 5)
    test("yeni icerik en sonda", t_new_content_last)

    def t_nothing_is_none():
        int_ok = vp_intellect.audit({"retention": metric(0.9),
                                     "retention_cards": metric(20),
                                     "practice_minutes": metric(60),
                                     "synthesis_gap_days": metric(1)}, TH)
        eq(precedence.resolve(bio=bio_ok, academic=ac_ok, intellect=int_ok), None)
    test("bulgu yoksa oneri uydurulmaz", t_nothing_is_none)

    def t_proposal_not_command():
        for args in ({"bio": bio_red}, {"bio": bio_ok, "academic": ac_low},
                     {"bio": bio_ok, "academic": ac_ok, "intellect": int_blocked},
                     {"bio": bio_ok, "academic": ac_ok, "intellect": int_new}):
            p = precedence.resolve(**args)
            t = p["proposal"].lower()
            ok("oneririm" in t, "cumle oneri kipinde degil: " + p["proposal"])
            m = BUYURGAN_RE.search(t)
            assert not m, "emir kipi sizdi (%s): %s" % (m.group(0), p["proposal"])
    test("her oneri emir degil oneri kipinde", t_proposal_not_command)

    def t_ranks_unique():
        r = [x["rank"] for x in precedence.PRECEDENCE]
        eq(r, sorted(set(r)))
        eq(len(r), 5)
    test("bes kural, siralari tekil", t_ranks_unique)

    def t_boundary_not_substring():
        # Denetcinin kendisi denetlenir: tam kelime mi ariyor, alt dize mi?
        no(BUYURGAN_RE.search("acigi kapatmani oneririm"),
           "alt dize yanlis alarm verdi")
        ok(BUYURGAN_RE.search("bu is zorunlu"), "tam kelime yakalanmadi")
        ok(BUYURGAN_RE.search("ekrani kapat"), "tam kelime yakalanmadi")
    test("emir denetcisi tam kelime arar", t_boundary_not_substring)
