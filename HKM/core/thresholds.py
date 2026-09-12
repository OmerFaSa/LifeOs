"""Esikler KOD degil VERIDIR.

Bir VP'nin «uyku az» demesi bir olcum degil bir yargidir; yargiyi uretecek
sayi kullanicinindir. Bu yuzden esikler burada tek bir sozlukte durur ve
config.json ile ustune yazilabilir. Hicbir VP kendi icinde sabit sayi
tutmaz — tuttugu an kullanici kendi hedefini degistiremez hale gelir.
"""

import copy
import json
import os

DEFAULTS = {
    "bio": {
        "sleep_hours_min": 7.0,          # altinda: eksik uyku
        "sleep_hours_critical": 5.0,     # altinda: kirmizi bayrak
        "hrv_drop_pct": 20.0,            # dunku ortalamaya gore dusus
        "recovery_floor": 40.0,          # 0-100 bandi
    },
    "academic": {
        "questions_min": 80,             # gunluk soru tabani
        "study_minutes_min": 120,
        "net_drop_pct": 15.0,            # deneme netinde ani dusus
    },
    "intellect": {
        "retention_floor": 0.50,         # SRS retansiyon tabani
        "retention_min_cards": 5,        # altinda retansiyon hukum vermez
        "practice_minutes_min": 30,
        "synthesis_gap_days": 14,        # baglanmamis not yasi
    },
}

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_PATH = os.path.join(_ROOT, "config.json")


def _merge(base, over):
    out = copy.deepcopy(base)
    for k, v in (over or {}).items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _merge(out[k], v)
        else:
            out[k] = v
    return out


def load(path=None):
    """Esikleri dondurur. config.json yoksa varsayilanlar; varsa uzerine yazar.

    Bozuk bir config sessizce yutulmaz: JSON okunamiyorsa istisna yukselir,
    cunku yanlis esikle calisan bir VP, calismayan bir VP'den daha pahalidir.
    """
    p = path or CONFIG_PATH
    if not os.path.exists(p):
        return copy.deepcopy(DEFAULTS)
    with open(p, "r", encoding="utf-8") as f:
        cfg = json.load(f)
    return _merge(DEFAULTS, cfg.get("thresholds", {}))
