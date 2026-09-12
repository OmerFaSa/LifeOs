"""Kucuk test kosucusu — cerceve yok, stdlib bile az."""

RESULTS = []
_SUITE = ["genel"]


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
