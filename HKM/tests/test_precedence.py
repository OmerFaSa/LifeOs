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
            ok("öneririm" in t, "cumle oneri kipinde degil: " + p["proposal"])
            m = BUYURGAN_RE.search(t)
            assert not m, "emir kipi sizdi (%s): %s" % (m.group(0), p["proposal"])
    test("her oneri emir degil oneri kipinde", t_proposal_not_command)

    def t_sinav_gecince_susar():
        """HATALAR Y-2: sinav gectikten sonra «Sinava -30 gun kaldi» her gun
        kazaniyor ve 3-5. siralari kalici olarak susturuyordu."""
        p = precedence.resolve(bio=bio_ok, academic=ac_low, intellect=int_blocked,
                               payloads={"ays": {"exam_days_left": metric(-30)}})
        eq(p["rank"], 3)
        no("-30" in p["proposal"] or "−30" in p["proposal"], p["proposal"])
        p = precedence.resolve(payloads={"ays": {"exam_days_left": metric(-1)}})
        eq(p, None)
    test("gecmis sinav tarihi sabit takvim sayilmaz (Y-2)", t_sinav_gecince_susar)

    def t_sinav_gunu():
        p = precedence.resolve(payloads={"ays": {"exam_days_left": metric(0)}})
        eq(p["rank"], 2)
        no("0 gün" in p["proposal"], p["proposal"])
        ok("bugün" in p["proposal"], p["proposal"])
    test("sinav gunu «0 gun kaldi» denmez (Y-2)", t_sinav_gunu)

    def t_suren_gun_yargilanmaz():
        """HATALAR O-9: saat 10:00'daki 20 soru olculmustur ama gunun degeri
        degildir. Suren gunun birikimli dusuk degeri anomali degil, oneri de
        uretmez."""
        from core import vp_base
        a = vp_academic.audit({"questions": metric(20),
                               "study_minutes": metric(60)}, TH)
        eq(a["verdict"], "ANOMALY")
        s = vp_base.gun_suruyor(a)
        eq(s["verdict"], "INCOMPLETE")
        ok(s["suruyor"])
        ok(all(f["tone"] == "info" and f["suruyor"] for f in s["findings"]), s)
        ok(s["findings"][0]["text"].startswith("Şimdilik soru"), s["findings"][0])
        eq(precedence.resolve(academic=s), None)
        # Esigi gecmis birikimli deger gun icinde de kesindir: geri dusmez.
        tamam = vp_base.gun_suruyor(ac_ok)
        eq(tamam["verdict"], ac_ok["verdict"])
        # Birikimli olmayan olcu (deneme neti) gun surerken de yargilanir.
        d = vp_academic.audit({"questions": metric(20),
                               "mock_net": metric(40),
                               "mock_net_baseline": metric(80)}, TH)
        d = vp_base.gun_suruyor(d)
        eq(d["verdict"], "ANOMALY")
        eq(precedence.resolve(academic=d)["rank"], 3)
        # ESP'nin pratik dakikasi da birikimlidir.
        e = vp_base.gun_suruyor(vp_intellect.audit(
            {"practice_minutes": metric(5)}, TH))
        eq(precedence.resolve(intellect=e), None)
        # Ozgun denetim degismez (ambardaki kayit ayni kalir).
        eq(a["verdict"], "ANOMALY")
    test("suren gunun kismi degeri gunluk tabanla yargilanmaz (O-9)",
         t_suren_gun_yargilanmaz)

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
