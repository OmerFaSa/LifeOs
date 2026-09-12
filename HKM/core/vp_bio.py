"""VP-Bio — SPI'nin verisine bakar. Klinik degil FIZYOLOJIK sinirlar.

Alan siniri: bu masa bir teshis koymaz, bir ilac onermez. Yaptigi tek sey
olculmus bir sayinin kullanicinin kendi belirledigi esigin altina dusup
dusmedigini soylemektir.
"""

from core import thresholds
from core.vp_base import ANOMALY, APPROVED, INCOMPLETE, finding, read, verdict_of

VP = "bio"
MODULE = "spi"


def audit(payload, th=None):
    t = (th or thresholds.load())["bio"]
    findings, missing = [], []

    sleep, sc = read(payload, "sleep_hours")
    if sleep is None:
        missing.append("sleep_hours")
    elif sleep < t["sleep_hours_critical"]:
        findings.append(finding("sleep_critical",
            "Uyku %.1f saat — kritik esigin (%.1f) altinda." % (sleep, t["sleep_hours_critical"]),
            "danger", "sleep_hours", sc))
    elif sleep < t["sleep_hours_min"]:
        findings.append(finding("sleep_low",
            "Uyku %.1f saat — taban %.1f saat." % (sleep, t["sleep_hours_min"]),
            "warn", "sleep_hours", sc))

    rec, rc = read(payload, "recovery")
    if rec is None:
        missing.append("recovery")
    elif rec < t["recovery_floor"]:
        findings.append(finding("recovery_low",
            "Toparlanma %g — taban %g." % (rec, t["recovery_floor"]),
            "danger", "recovery", rc))

    hrv, hc = read(payload, "hrv")
    base, bc = read(payload, "hrv_baseline")
    if hrv is None or base is None or base <= 0:
        missing.append("hrv")
    else:
        drop = (base - hrv) / base * 100.0
        if drop >= t["hrv_drop_pct"]:
            findings.append(finding("hrv_drop",
                "HRV tabana gore %%%.0f dusuk." % drop, "warn", "hrv", hc))

    return {"vp": VP, "module": MODULE,
            "verdict": verdict_of(findings, missing),
            "findings": findings, "missing": missing}


def red_flag(result):
    """SPI kirmizi bayragi — HKM.PRECEDENCE'in birinci sirasi."""
    return any(f["tone"] == "danger" for f in result["findings"])
