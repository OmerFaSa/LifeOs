"""VP-Intellect — ESP'nin verisine bakar.

ESP'nin iki doktrin kurali burada aynen gecerlidir:
  - Az kartla retansiyon hukum vermez (retention_min_cards).
  - Baglanmamis not bir «basarisizlik» degil bir sentez acigidir.
"""

from core import thresholds
from core.vp_base import finding, read, verdict_of

VP = "intellect"
MODULE = "esp"


def audit(payload, th=None):
    t = (th or thresholds.load())["intellect"]
    findings, missing = [], []

    r, rc = read(payload, "retention")
    n, nc = read(payload, "retention_cards")
    if r is None or n is None:
        missing.append("retention")
    elif n < t["retention_min_cards"]:
        # Az kart varsa sayiyi hukum saymayiz; bu bir eksiklik, anomali degil.
        missing.append("retention")
    elif r < t["retention_floor"]:
        findings.append(finding("retention_low",
            "Retansiyon %.2f (%d kart) — taban %.2f."
            % (r, int(n), t["retention_floor"]), "danger", "retention", rc))

    p, pc = read(payload, "practice_minutes")
    if p is None:
        missing.append("practice_minutes")
    elif p < t["practice_minutes_min"]:
        findings.append(finding("practice_low",
            "Pratik %g dakika — taban %g." % (p, t["practice_minutes_min"]),
            "warn", "practice_minutes", pc))

    g, gc = read(payload, "synthesis_gap_days")
    if g is None:
        missing.append("synthesis_gap_days")
    elif g >= t["synthesis_gap_days"]:
        findings.append(finding("synthesis_gap",
            "En eski baglanmamis not %g gunluk — esik %g."
            % (g, t["synthesis_gap_days"]), "warn", "synthesis_gap_days", gc))

    return {"vp": VP, "module": MODULE,
            "verdict": verdict_of(findings, missing),
            "findings": findings, "missing": missing}


def blocked_core(result):
    """ESP'nin tikanmis temeli — PRECEDENCE dorduncu sira."""
    return any(f["code"] == "retention_low" for f in result["findings"])
