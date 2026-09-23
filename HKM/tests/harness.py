"""Kucuk test kosucusu — cerceve yok, stdlib bile az."""

import urllib.error

RESULTS = []
_SUITE = ["genel"]


def _ag_kapali(url, *a, **k):
    raise urllib.error.URLError("test: ag kapali (%s)" % url)


# HICBIR TEST AGA CIKMAZ. Web kullanan bir test kendi sahte tasiyicisini
# verir; vermeyen her yol burada «ag kapali» ile karsilanir.
try:
    from core import web as _web
    _web.VARSAYILAN_TASIYICI = _ag_kapali
except ImportError:                                  # pragma: no cover
    pass


def suite(name):
    _SUITE[0] = name


def test(name, fn):
    try:
        fn()
        RESULTS.append((_SUITE[0], name, None))
    except AssertionError as e:
        RESULTS.append((_SUITE[0], name, str(e) or "assertion"))
    except Exception as e:
        RESULTS.append((_SUITE[0], name, "%s: %s" % (type(e).__name__, e)))


def eq(a, b, msg=""):
    assert a == b, "%s beklenen %r, gelen %r" % (msg, b, a)


def ok(x, msg=""):
    assert x, msg or "dogru bekleniyordu"


def no(x, msg=""):
    assert not x, msg or "yanlis bekleniyordu"


def metric(v, cert="measured"):
    return {"value": v, "cert": cert}


def missing():
    return {"value": None, "cert": "missing"}
