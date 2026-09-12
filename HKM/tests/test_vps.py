"""VP testleri — ve katmanin butun anlamini koruyan tek satir:
VP modullerinin hicbiri bir model katmani import etmez."""

import ast
import os

from core import thresholds, vp_academic, vp_bio, vp_intellect
from core.vp_base import ANOMALY, APPROVED, INCOMPLETE
from tests.harness import eq, metric, missing, no, ok, suite, test

TH = thresholds.DEFAULTS
CORE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "core")

MODEL_HINTS = ("openai", "anthropic", "requests", "urllib.request",
               "httpx", "llm", "transformers", "manager")


def _imports(path):
    tree = ast.parse(open(path, encoding="utf-8").read())
    names = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            names += [a.name for a in node.names]
        elif isinstance(node, ast.ImportFrom):
            names.append(node.module or "")
    return names


def run():
    suite("vp-siniri")

    def t_no_model_layer():
        for fname in ("vp_bio.py", "vp_academic.py", "vp_intellect.py", "vp_base.py"):
            for name in _imports(os.path.join(CORE, fname)):
                for bad in MODEL_HINTS:
                    assert bad not in name.lower(), \
                        "%s bir model katmani import ediyor: %s" % (fname, name)
    test("VP modulleri model katmani import etmez", t_no_model_layer)

    def t_thresholds_are_data():
        # Esikler koddan degil sozlukten okunur: sozlugu degistir, hukum degissin.
        th = {"bio": dict(TH["bio"], sleep_hours_min=4.0, sleep_hours_critical=3.0)}
        r = vp_bio.audit({"sleep_hours": metric(5.0)}, th)
        eq([f["code"] for f in r["findings"]], [])
    test("esik degisince hukum degisir", t_thresholds_are_data)

    suite("vp-bio")

    def t_bio_missing():
        r = vp_bio.audit({}, TH)
        eq(r["verdict"], INCOMPLETE)
        eq(r["findings"], [])
    test("veri yoksa hukum INCOMPLETE, anomali degil", t_bio_missing)

    def t_missing_is_not_zero():
        r = vp_bio.audit({"sleep_hours": missing()}, TH)
        no(any(f["code"] == "sleep_critical" for f in r["findings"]),
           "girilmemis uyku 0 saat sayildi")
    test("girilmemis uyku sifir degildir", t_missing_is_not_zero)

    def t_bio_critical():
        r = vp_bio.audit({"sleep_hours": metric(4.0), "recovery": metric(80),
                          "hrv": metric(60), "hrv_baseline": metric(62)}, TH)
        eq(r["verdict"], ANOMALY)
        ok(vp_bio.red_flag(r), "kritik uyku kirmizi bayrak uretmedi")
    test("kritik uyku kirmizi bayrak", t_bio_critical)

    def t_bio_ok():
        r = vp_bio.audit({"sleep_hours": metric(8.0), "recovery": metric(70),
                          "hrv": metric(60), "hrv_baseline": metric(62)}, TH)
        eq(r["verdict"], APPROVED)
        no(vp_bio.red_flag(r))
    test("esikler gecilince APPROVED", t_bio_ok)

    def t_hrv_needs_both():
        r = vp_bio.audit({"hrv": metric(40)}, TH)
        ok("hrv" in r["missing"], "tek basina HRV hukum verdi")
    test("HRV tek basina hukum vermez", t_hrv_needs_both)

    suite("vp-academic")

    def t_ac_low():
        r = vp_academic.audit({"questions": metric(20),
                               "study_minutes": metric(200)}, TH)
        ok(any(f["code"] == "questions_low" for f in r["findings"]))
    test("soru tabani altinda bulgu", t_ac_low)

    def t_ac_net_drop():
        r = vp_academic.audit({"mock_net": metric(60),
                               "mock_net_baseline": metric(100)}, TH)
        ok(any(f["code"] == "net_drop" for f in r["findings"]))
    test("net dususu bulgu uretir", t_ac_net_drop)

    def t_ac_missing():
        eq(vp_academic.audit({}, TH)["verdict"], INCOMPLETE)
    test("bos gun INCOMPLETE", t_ac_missing)

    suite("vp-intellect")

    def t_few_cards():
        # Bir-iki kartla %0 retansiyon bir hukum degildir.
        r = vp_intellect.audit({"retention": metric(0.1),
                                "retention_cards": metric(2)}, TH)
        no(vp_intellect.blocked_core(r), "iki kart tikanma ilan etti")
        ok("retention" in r["missing"])
    test("az kart retansiyon hukmu vermez", t_few_cards)

    def t_enough_cards():
        r = vp_intellect.audit({"retention": metric(0.3),
                                "retention_cards": metric(12)}, TH)
        ok(vp_intellect.blocked_core(r), "yeterli kartta tikanma gormedi")
        eq(r["verdict"], ANOMALY)
    test("yeterli kartta tikanma gorunur", t_enough_cards)

    def t_synthesis():
        r = vp_intellect.audit({"synthesis_gap_days": metric(30)}, TH)
        ok(any(f["code"] == "synthesis_gap" for f in r["findings"]))
    test("sentez acigi bulgu uretir", t_synthesis)

    def t_intellect_ok():
        r = vp_intellect.audit({"retention": metric(0.8), "retention_cards": metric(20),
                                "practice_minutes": metric(45),
                                "synthesis_gap_days": metric(2)}, TH)
        eq(r["verdict"], APPROVED)
    test("her sey yerindeyse APPROVED", t_intellect_ok)
