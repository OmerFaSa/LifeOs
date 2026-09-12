"""VP-Academic — AYS'nin verisine bakar.

Bu masa bir hedef koymaz; kullanicinin kendi koydugu tabanin altina dusup
dusmedigini soyler. Girilmemis bir gun «sifir soru» degildir.
"""

from core import thresholds
from core.vp_base import finding, read, verdict_of

VP = "academic"
MODULE = "ays"


def audit(payload, th=None):
    t = (th or thresholds.load())["academic"]
    findings, missing = [], []

    q, qc = read(payload, "questions")
    if q is None:
        missing.append("questions")
    elif q < t["questions_min"]:
        findings.append(finding("questions_low",
            "Soru sayisi %g — taban %g." % (q, t["questions_min"]),
            "warn", "questions", qc))

    mins, mc = read(payload, "study_minutes")
    if mins is None:
        missing.append("study_minutes")
    elif mins < t["study_minutes_min"]:
        findings.append(finding("study_low",
            "Calisma %g dakika — taban %g." % (mins, t["study_minutes_min"]),
            "warn", "study_minutes", mc))

    net, nc = read(payload, "mock_net")
    base, bc = read(payload, "mock_net_baseline")
    if net is None or base is None or base <= 0:
        missing.append("mock_net")
    else:
        drop = (base - net) / base * 100.0
        if drop >= t["net_drop_pct"]:
            findings.append(finding("net_drop",
                "Deneme neti tabana gore %%%.0f dusuk." % drop,
                "warn", "mock_net", nc))

    return {"vp": VP, "module": MODULE,
            "verdict": verdict_of(findings, missing),
            "findings": findings, "missing": missing}


def deadline_days(payload):
    """Dis dunyanin sabit takvimi — PRECEDENCE ikinci sira."""
    d = (payload or {}).get("exam_days_left")
    if isinstance(d, dict):
        from core import certainty as C
        return C.value_of(d)
    return None
