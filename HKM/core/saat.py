"""HKM'nin saati — «bugun» tek yerden okunur.

Gun siniri kurali modullerde duzeltilmisti, HKM'de 50'den fazla yerde
`date.today()` daginiktı (HATALAR KO-1). Yeni kod gunu buradan okur.
"""

import datetime


def simdi():
    return datetime.datetime.now()


def bugun(now=None):
    """ISO gun. `now` bir datetime ya da ISO metin olabilir (testler icin)."""
    if now is None:
        return simdi().date().isoformat()
    if isinstance(now, (datetime.datetime, datetime.date)):
        return now.isoformat()[:10]
    return str(now)[:10]
