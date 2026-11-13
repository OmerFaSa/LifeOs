#!/usr/bin/env python3
"""King MCP sunucusu (sadelesme Faz 5, A7 ilk adim): Claude masaustu uygulamasindan King'e SALT OKUR kapi.
Rapor: belgeler/ekip/sadelesme/faz5-mcp.md · Kurulum: king/KURULUM.md · Test: python king/mcp_test.py

    python king/mcp.py             stdio uzerinden MCP (JSON-RPC 2.0, satir basina bir ileti)
    python king/mcp.py --denetle   gercek veriyle her araci bir kez cagirir, YALNIZ sayilari basar

Sozler:
1. Yalniz okur. Yazan arac yok; kayit, not ve onay LifeOS'un kendi ekranlarindadir (AGENTS §0.1: yazma tek
   surecten sonra; model hafizaya yazmaz, onerir).
2. Canli dosya acilmaz. Tek depo (lifeos.db) varsa o, yoksa hesap.db; dosya yanindaki -wal/-journal ile gecici
   klasore KOPYALANIR, kopya acilir, cagri bitince silinir (faz1.md: salt okur acilis bile canli dosyanin yanina
   yazar). -shm alinmaz: turetilmis dizindir, yarista -wal'dan ileri olabilir; SQLite kopyayi -wal'dan yeniden kurar.
3. Sayiyi kod uretir. Kayittaki her etiketli sayi {deger, kesinlik} olarak doner; etiket depodaki gibidir
   (goc.etiketle), etiketsiz eski sayi «eski kayit». Bu sunucunun saydigi adetler «hesaplandi». Olmayan «veri yok».
4. Ozel not King'e gelmez. Notlar yalniz Not motorunun kingOkur suzgecinden gecer (motor/not.js; Bilinc `ozel`,
   Bilinc haritasi izni kapaliysa butun dusunceler, ozel nota giden bagin adi). Kayit araclari notlari, Bilinc'i,
   sir adli yollari ve govdesinde ozel:true olani hic gostermez; sir adli anahtarin degeri «gizli» olur.
5. Motorlar cagrilir, kopyalanmaz: harita, Not ve Tekrar king/kopru.js uzerinden Node ile (AGENTS §0.1 kural 3).
6. stdout yalniz JSON-RPC; gunluk stderr'e.

Ortam degiskenleri: LIFEOS_VERI_DB, LIFEOS_HESAP_DB (varsayilan %LOCALAPPDATA%\\LifeOS\\...), LIFEOS_ICERIK
(alan/, kabuk/harita.js, kalite/ icin depo koku; varsayilan bu depo), LIFEOS_NODE (varsayilan PATH'teki node).
"""
import collections
import datetime
import glob
import importlib.util
import json
import os
import re
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import traceback
import unicodedata

KOD = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(KOD, "sistem"))
sys.dont_write_bytecode = True
import goc  # noqa: E402  etiketle, modul_turu, SIR_RE: gocle ayni kurallar

SURUM = "0.1.0"
ESKI_SURUMLER = ("2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05")   # initialize el sikismasi
YENI_SURUMLER = ("2026-07-28",)                                             # istek basina _meta, el sikismasiz
SURUM_ANAHTARI = "io.modelcontextprotocol/protocolVersion"
ETIKET_TR = {"measured": "ölçüldü", "estimated": "tahmin", "computed": "hesaplandı", "missing": "veri yok",
             "eski": "eski kayıt"}
MODULLER = ("ays", "spi", "esp")
# Not motorunun goc bagdastiricisina giden koleksiyonlar (motor/not.js goc.*): koleksiyon -> (yapi, modul)
NOT_YAPI = {"defter": ("defter", None), "defterterim": ("terim", None), "notum": ("notum", None),
            "videoNotes": ("aysVideo", "ays"), "topics": ("aysKonu", "ays"), "notes": ("espNot", "esp"),
            "args": ("espTez", "esp"), "drafts": ("espTaslak", "esp")}
NOT_KOLEKSIYON = set(NOT_YAPI) - {"topics"} | {"defterklasor"}   # topics konu durumudur; notu Not'tan da okunur
NOT_YOL_RE = re.compile(r"bilinc|^lifeos\.not\.", re.I)
CIKTI_SINIR = 100_000
YANIT_YOK = "veri yok"


class AracHatasi(Exception):
    """Aracin kendi hatasi: isError:true sonuc olur, model duzeltip yeniden dener."""


class RpcHatasi(Exception):
    def __init__(self, kod, mesaj, veri=None):
        super().__init__(mesaj)
        self.kod, self.mesaj, self.veri = kod, mesaj, veri


def gunluk(*x):
    print("[king-mcp]", *x, file=sys.stderr, flush=True)


def yollar():
    yerel = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~")
    return (os.environ.get("LIFEOS_VERI_DB") or os.path.join(yerel, "LifeOS", "veri", "lifeos.db"),
            os.environ.get("LIFEOS_HESAP_DB") or os.path.join(yerel, "LifeOS", "hesap", "hesap.db"),
            os.environ.get("LIFEOS_ICERIK") or KOD)


# ---------------------------------------------------------------- veri (yalniz kopyadan)

def kopya_ac(yol, klasor):
    """Canli SQLite dosyasinin kopyasini acar; canli dosyanin kendisi hic acilmaz."""
    for deneme in range(3):
        hedef = os.path.join(klasor, "%d-%s" % (deneme, os.path.basename(yol)))
        for ek in ("", "-wal", "-journal"):
            if os.path.isfile(yol + ek):
                shutil.copyfile(yol + ek, hedef + ek)
        c = sqlite3.connect(hedef)
        try:
            if c.execute("PRAGMA quick_check").fetchone()[0] == "ok":
                return c
        except sqlite3.DatabaseError:
            pass
        c.close()   # yazim anina denk geldi: yeniden kopyala
    raise AracHatasi("Veri deposunun tutarlı bir kopyası alınamadı (üç deneme); biraz sonra yeniden dene.")


def ms(v):
    return int(v if v > 1e11 else v * 1000) if isinstance(v, (int, float)) and v > 1 else 0


def hesap_oku(c, a):
    r = c.execute("SELECT min(id) FROM kullanici WHERE rol='admin'").fetchone()
    if not r or r[0] is None:
        a["uyari"].append("Hesap deposunda yönetici yok: ilk kurulum yapılmamış ya da depo boş.")
        return
    sahip = r[0]   # tek depo koprusuyle ayni sahip: ilk admin (hesap.py _kopru_ac)
    for alan, yol, deger, zaman in c.execute("SELECT alan, yol, deger, zaman FROM kayit WHERE kullanici=? "
                                             "AND deger IS NOT NULL ORDER BY alan, yol", (sahip,)):
        tur, neden = goc.modul_turu(alan.split("/", 1)[0], yol)
        if neden:   # turetilmis ve cihaza ait: gocte de tasinmaz
            continue
        try:
            govde = json.loads(deger)
        except ValueError:
            continue
        a["kayitlar"].append(dict(alan=alan, yol=yol, tur=tur, govde=govde, etiket=goc.etiketle(govde)[0],
                                  zaman=ms(zaman) or goc.kayit_zamani(govde)))
    sutun = {x[1] for x in c.execute("PRAGMA table_info(yayin)")}
    for ad, icerik, gun, zaman in c.execute("SELECT ad, icerik, %s, zaman FROM yayin WHERE kullanici=?"
                                            % ("gun" if "gun" in sutun else "NULL"), (sahip,)):
        a["yayin"][ad] = dict(icerik=icerik, gun=gun, zaman=ms(zaman))


def tek_oku(c, a):
    for tur, alan, yol, govde, etiket, hlc in c.execute("SELECT tur, alan, yol, govde, etiket, hlc FROM kayit "
                                                        "WHERE silindi=0 AND govde IS NOT NULL ORDER BY alan, yol"):
        try:
            g = json.loads(govde)
            e = json.loads(etiket or "{}")
        except ValueError:
            continue
        if alan == "gun/sunucu":   # sunucunun Gun yayini (goc: gun_kopya); hangi gunun oldugu tasinmadi
            a["yayin"][yol] = dict(icerik=govde, gun=None, zaman=int(hlc[:13]))
        else:
            a["kayitlar"].append(dict(alan=alan, yol=yol, tur=tur, govde=g, etiket=e, zaman=int(hlc[:13])))


def anlik():
    """Bir okuma ani: {kaynak, kayitlar, yayin, uyari}. Kopya cagri bitince silinir."""
    tek, hesap, _ = yollar()
    tur = "tek" if os.path.isfile(tek) else "hesap" if os.path.isfile(hesap) else None
    a = {"kaynak": {"tek": "tek depo (lifeos.db) kopyası", "hesap": "hesap sunucusu deposu (hesap.db) kopyası",
                    None: "yok"}[tur], "kayitlar": [], "yayin": {}, "uyari": []}
    if not tur:
        a["uyari"].append("Veri deposu bulunamadı: LifeOS bu bilgisayarda hiç açılmamış olabilir.")
        return a
    with tempfile.TemporaryDirectory(prefix="lifeos-king-") as gecici:
        c = kopya_ac(tek if tur == "tek" else hesap, gecici)
        try:
            (tek_oku if tur == "tek" else hesap_oku)(c, a)
        finally:
            c.close()
    return a


def kapali_mi(k):
    """King'in kayit araclarina kapali kayit: not (notlar aracindan suzulerek), sir, ozel isaretli. Neden doner."""
    if k["yol"].split("/", 1)[0] in NOT_KOLEKSIYON or k["tur"] == "not" or NOT_YOL_RE.search(k["yol"]):
        return "not"
    if goc.SIR_RE.search(k["yol"]):
        return "sır"
    if isinstance(k["govde"], dict) and k["govde"].get("ozel") is True:
        return "özel"
    return None


def acik(a):
    return [k for k in a["kayitlar"] if not kapali_mi(k)]


# ---------------------------------------------------------------- bicim

def ort(x, yol=""):
    """Sir adli anahtarin degeri hic donmez; ad yoluyla bakilir («llm.keys» de sirdir)."""
    if isinstance(x, dict):
        return {k: "«gizli»" if goc.SIR_RE.search("%s.%s" % (yol, k)) else ort(v, "%s.%s" % (yol, k))
                for k, v in x.items()}
    if isinstance(x, list):
        return [ort(v, yol) for v in x]
    return x


def etiketli(x, etiket, yol=""):
    """Etiketli her sayi {deger, kesinlik} olur; yol bicimi goc.etiketle ile ayni («a.b.0.c»)."""
    if isinstance(x, dict):
        return {k: etiketli(v, etiket, "%s.%s" % (yol, k) if yol else k) for k, v in x.items()}
    if isinstance(x, list):
        return [etiketli(v, etiket, "%s.%d" % (yol, i) if yol else str(i)) for i, v in enumerate(x)]
    if yol in etiket and isinstance(x, (int, float)) and not isinstance(x, bool):
        return {"deger": x, "kesinlik": ETIKET_TR.get(etiket[yol], etiket[yol])}
    return x


def goster(govde, etiket=None):
    g = ort(govde)
    return etiketli(g, goc.etiketle(govde)[0] if etiket is None else etiket)


def hes(n):
    return {"deger": n, "kesinlik": "hesaplandı"}


def zaman_yazi(v):
    return datetime.datetime.fromtimestamp(v / 1000).strftime("%Y-%m-%d %H:%M") if v else YANIT_YOK


def katla(s):
    s = unicodedata.normalize("NFKD", str(s).replace("İ", "i").replace("I", "ı").lower().replace("ı", "i"))
    return "".join(h for h in s if not unicodedata.combining(h))


def json_mu(metin):
    try:
        return json.loads(metin)
    except (TypeError, ValueError):
        return metin


def kopru(girdi):
    """Motoru Node ile cagirir (king/kopru.js); hata ya da Node yoksa AracHatasi (suzgecsiz veri donmez)."""
    node = os.environ.get("LIFEOS_NODE") or shutil.which("node")
    if not node:
        raise AracHatasi("Node.js bulunamadı; motorlar onunla çağrılır. KURULUM.md › LIFEOS_NODE.")
    try:
        p = subprocess.run([node, os.path.join(KOD, "king", "kopru.js")], capture_output=True, timeout=30,
                           input=json.dumps(girdi, ensure_ascii=False).encode("utf-8"),
                           creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        c = json.loads(p.stdout.decode("utf-8"))
    except (OSError, ValueError, subprocess.TimeoutExpired) as e:
        gunluk("kopru:", e, (locals().get("p") and p.stderr[-500:]) or "")
        raise AracHatasi("Motor köprüsü çalışmadı: %s" % e)
    if "hata" in c:
        raise AracHatasi("Motor hatası: %s" % c["hata"])
    return c["tamam"]


# ---------------------------------------------------------------- araclar (motorlarin kapilari)

def t_harita(_):
    h = kopru({"is": "harita", "harita": os.path.join(yollar()[2], "kabuk", "harita.js")})
    a = anlik()
    sayim = collections.Counter(k["alan"] for k in acik(a))
    return {"yerler": h["yerler"], "dallar": h["dallar"],
            "durumlar": "yeni = yeni kabukta, pilot = taşınıyor, eski = henüz eski modülde, plan = motoru yazılmadı",
            "veri": {"kaynak": a["kaynak"], "okunabilir_kayit": {k: hes(n) for k, n in sorted(sayim.items())},
                     "uyari": a["uyari"]}}


def t_kayit_ara(arg):
    a, q = anlik(), katla(arg.get("metin", ""))
    l = [k for k in acik(a) if k["alan"].startswith(arg.get("alan", "")) and k["yol"].startswith(arg.get("yol", ""))
         and (not arg.get("tur") or k["tur"] == arg["tur"])
         and (not q or q in katla(k["alan"] + "|" + k["yol"] + " " + json.dumps(ort(k["govde"]), ensure_ascii=False)))]
    l.sort(key=lambda k: -(k["zaman"] or 0))
    return {"kaynak": a["kaynak"], "eslesen": hes(len(l)),
            "kayitlar": [{"kimlik": k["alan"] + "|" + k["yol"], "tur": k["tur"], "zaman": zaman_yazi(k["zaman"]),
                          "anahtarlar": sorted(k["govde"])[:20] if isinstance(k["govde"], dict) else None}
                         for k in l[:arg.get("sinir", 20)]],
            "turler": sorted({k["tur"] for k in acik(a)}), "uyari": a["uyari"]}


def t_kayit_oku(arg):
    a = anlik()
    k = next((k for k in a["kayitlar"] if k["alan"] + "|" + k["yol"] == arg["kimlik"]), None)
    if k is None:
        raise AracHatasi("Bu kimlikte kayıt yok (veri yok). Kimliği kayit_ara verir, biçimi «alan|yol».")
    neden = kapali_mi(k)
    if neden == "not":
        raise AracHatasi("Bu bir not: notlar aracıyla oku (özel notlar oradan da gelmez).")
    if neden:
        raise AracHatasi("Bu kayıt King'e kapalı (%s)." % neden)
    return {"kimlik": arg["kimlik"], "tur": k["tur"], "zaman": zaman_yazi(k["zaman"]), "kaynak": a["kaynak"],
            "govde": goster(k["govde"], k["etiket"])}


def t_bugun(_):
    a, bugun = anlik(), datetime.date.today().isoformat()
    y, moduller = a["yayin"], []

    def gunun(x):   # tarihi bilinmeyen (gocle gelen) de bugunmus gibi sunulmaz
        return "bugünün" if x["gun"] == bugun else "bugüne ait değil; son %s" % (x["gun"] or "tarihi bilinmiyor")

    for m in MODULLER:
        o, x = {"modul": m}, y.get(m + "/bugun")
        if x:   # modulun kendi kuraliyla yazdigi gun cumlesi (hesap.py soz 21)
            o["ozet"] = x["icerik"] if x["gun"] == bugun else None
            o["ozet_durumu"] = gunun(x)
        x = y.get(m + "/gun")
        if x:   # modulun bugunku bloklari (soz 22)
            o["plan"] = goster(json_mu(x["icerik"])) if x["gun"] == bugun else None
            o["plan_durumu"] = gunun(x)
        x = y.get(m + "/gunluk")
        g = json_mu(x["icerik"]) if x else None
        if isinstance(g, dict) and isinstance(g.get("gunler"), dict) and bugun in g["gunler"]:   # soz 25
            o["sayisal"] = goster(g["gunler"][bugun])
        if len(o) > 1:
            moduller.append(o)
    x, gun = y.get("gun/kayit"), None
    if x:   # Gun kaydi (soz 26): dunku kayit bugunun degildir
        gun = {"durum": gunun(x), "kayit": goster(json_mu(x["icerik"])) if x["gun"] == bugun else None}
    kayitlar = [{"kimlik": k["alan"] + "|" + k["yol"], "tur": k["tur"], "govde": goster(k["govde"], k["etiket"])}
                for k in acik(a) if bugun in k["yol"]]
    sonuc = {"tarih": bugun, "kaynak": a["kaynak"], "moduller": moduller, "gun_kaydi": gun or YANIT_YOK,
             "bugunun_kayitlari": kayitlar, "uyari": a["uyari"]}
    if not moduller and not gun and not kayitlar:
        sonuc["durum"] = "veri yok: bugün için ne kayıt ne özet var."
    return sonuc


def t_notlar(arg):
    a = anlik()
    kaynak = collections.defaultdict(lambda: collections.defaultdict(list))
    for k in a["kayitlar"]:
        kol, modul = k["yol"].split("/", 1)[0], k["alan"].split("/", 1)[0]
        yapi, sadece = NOT_YAPI.get(kol, (None, None))
        if yapi and modul in MODULLER and sadece in (None, modul):
            kaynak[yapi][modul].append(k["govde"])
    paket = {y: dict(m) if y in ("defter", "terim", "notum") else sum(m.values(), []) for y, m in kaynak.items()}
    b = json_mu(a["yayin"].get("gun/bilinc", {}).get("icerik"))
    paket["bilinc"] = [b] if isinstance(b, dict) else []
    sinir = arg.get("sinir", 20)
    r = kopru({"is": "notlar", "zaman": int(datetime.datetime.now().timestamp() * 1000), "kaynak": paket,
               "kapali": [], "ara": arg.get("ara"), "kimlik": arg.get("kimlik"), "sinir": sinir})
    for n in ([r["not"]] if r.get("not") else []) + r.get("bulunan", []):
        n["guncelleme"] = zaman_yazi(n.get("guncelleme"))
    sonuc = {"kaynak": a["kaynak"], "toplam": hes(r["toplam"]), "okunabilir": hes(r["okunur"]),
             "ozel_oldugu_icin_disarida": hes(r["disarida"]),
             "gizlilik": "Not motorunun King süzgeci (kingOkur): Bilinç'te özel işaretli düşünce, Bilinç haritasının "
                         "izni kapalıysa bütün düşünceler ve kapalı klasördeki not okunmaz; okunan nottan özel nota "
                         "giden bağın adı «özel not» olur. Özel notun adı başka bir notta düz metin geçerse görünür."}
    if arg.get("kimlik"):
        if not r.get("not"):
            raise AracHatasi("Bu not King'e kapalı (özel)." if r.get("kapali") else "Bu kimlikte not yok (veri yok).")
        sonuc["not"] = r["not"]
    else:
        sonuc["notlar"] = r["bulunan"]
    return sonuc


def t_yol(arg):
    kok = os.path.join(yollar()[2], "alan")
    alanlar = sorted(d for d in os.listdir(kok) if glob.glob(os.path.join(kok, d, "asama-*.json"))) \
        if os.path.isdir(kok) else []
    alan = arg.get("alan", "felsefe")
    if alan not in alanlar:
        raise AracHatasi("Bu alanın yol haritası yok (veri yok). Var olanlar: %s." % (", ".join(alanlar) or "hiçbiri"))
    asamalar = []
    for yol in sorted(glob.glob(os.path.join(kok, alan, "asama-*.json"))):
        with open(yol, encoding="utf-8") as f:
            asamalar.append(json.load(f))

    def durum(o):
        return "onaylı" if o.get("durum") == "onayli" else "taslak (onaysız içerik; tekrara girmez)"

    def kapi(k):
        return {"soru": hes(len((k or {}).get("sorular", []))),
                "gecme": "soruların en az %%%d'i doğru" % round(100 * (k or {}).get("esik", 0))}

    if arg.get("ders"):
        for s in asamalar:
            for u in s.get("uniteler", []):
                for d in u.get("dersler", []):
                    if d.get("id") == arg["ders"]:
                        return {"asama": s.get("ad"), "unite": u.get("ad"), "ders": dict(d, durum=durum(d))}
        raise AracHatasi("Bu kimlikte ders yok. Kimlikleri yol_haritasi (derssiz) verir.")
    return {"alan": alan, "alanlar": alanlar,
            "ilerleme": "veri yok: ilerleme bugün yalnız yeni kabuğun tarayıcı deposunda (lifeos.yol.<alan>.<aşama>); "
                        "tek depoya göçten sonra okunur.",
            "kapi_sorulari": "Kapı soruları ve cevapları verilmez: ustalık kapısı ölçümdür.",
            "asamalar": [{"id": s.get("id"), "ad": s.get("ad"), "hedef": s.get("hedef"), "kanit_isi": s.get("kanitIsi"),
                          "kapi": kapi(s.get("kapi")),
                          "uniteler": [{"id": u.get("id"), "ad": u.get("ad"), "kazanim": u.get("kazanim"),
                                        "kapi": kapi(u.get("kapi")),
                                        "dersler": [{"id": d.get("id"), "ad": d.get("ad"), "ozet": d.get("ozet"),
                                                     "durum": durum(d)} for d in u.get("dersler", [])]}
                                       for u in s.get("uniteler", [])]} for s in asamalar]}


def t_tekrar(_):
    a, kartlar = anlik(), {"ays": [], "esp": []}
    for k in acik(a):
        modul = k["alan"].split("/", 1)[0]
        if modul in kartlar and k["yol"].startswith("cards/"):
            kartlar[modul].append(k["govde"])
    bos = "Yeni kabuğun kartları (lifeos.tekrar.kartlar) bugün yalnız o tarayıcıda; tek depoya göçten sonra görünür."
    if not kartlar["ays"] and not kartlar["esp"]:
        return {"kaynak": a["kaynak"], "kart": hes(0), "durum": "veri yok: depoda tekrar kartı yok. " + bos}
    simdi = datetime.datetime.now()
    gun_sonu = datetime.datetime.combine(simdi.date(), datetime.time.max)
    r = kopru({"is": "tekrar", "simdi": int(simdi.timestamp() * 1000), "gunSonu": int(gun_sonu.timestamp() * 1000),
               "kartlar": kartlar})
    return {"kaynak": a["kaynak"], "motor": "Tekrar (FSRS-4.5, eski vadeler aynen)", "kart": hes(r["toplam"]),
            "okunamayan": hes(r["okunamayan"]), "bugun_tekrar": hes(r["bugunTekrar"]), "bugun_yeni": hes(r["bugunYeni"]),
            "tavan_ustu_bekleyen": hes(r["bekleyenTekrar"] + r["bekleyenYeni"]), "taslak_ya_da_kapali": hes(r["disarida"]),
            "siradaki_vade": zaman_yazi(r["siradakiVade"]),
            "bugunun_kartlari": [dict(x, vade=zaman_yazi(x["vade"])) for x in r["bugun"]], "not": bos}


def t_olcum(arg):
    kalite = os.path.join(yollar()[2], "kalite")
    kayitlar = sorted(glob.glob(os.path.join(kalite, "kayit", "????-??-??.json")))
    if not kayitlar:
        return {"durum": "veri yok: kalite kaydı yok (python kalite/olcum.py --kaydet yazar)."}

    def oku(yol):
        with open(yol, encoding="utf-8") as f:
            return json.load(f)["olcutler"]

    son, onceki = oku(kayitlar[-1]), oku(kayitlar[-2]) if len(kayitlar) > 1 else {}
    by = os.path.join(kalite, "butce.json")
    butce = oku(by) if os.path.isfile(by) else {}

    def deger(o):
        return {"deger": o["deger"], "kesinlik": o.get("etiket")} if o.get("deger") is not None else YANIT_YOK

    def satir(o):
        b = butce.get(o["id"], {})
        return {"id": o["id"], "ad": o.get("ad"), "katman": o.get("katman"), "deger": deger(o), "durum": o.get("durum"),
                "butce": ("taban %s, hedef %s, yön %s" % (b.get("taban"), b.get("hedef"), b.get("yon"))) if b else None}

    tarih = os.path.basename(kayitlar[-1])[:10]
    if arg.get("olcut"):
        o = son.get(arg["olcut"])
        if not o:
            raise AracHatasi("Bu kimlikte ölçüt yok. Kimlikleri olcum (argümansız) verir.")
        return dict(satir(o), tarih=tarih, yol=o.get("yol"), komut=o.get("komut"))
    if not onceki:
        # Tek kayit varken tabana karsi bakmak, sahibin kabul ettigi asimlari (kayit tazelendi, taban degismedi) yeniden
        # asim sayar. Kapi CI'daki `olcum.py --denetle`dir: simdiki olcum son kayda karsi; burada ayni karar.
        return {"tarih": tarih, "olcut": hes(len(son)), "olcutler": [satir(o) for _, o in sorted(son.items())],
                "butce_asimi": [], "butce_notlari": ["Karşılaştırılacak önceki kayıt yok; bütçe kapısı CI'da "
                                                     "`kalite/olcum.py --denetle` (son kayda karşı) ve temiz."]}
    try:   # kalite motorunun kendi denetimi (kalite/olcum.py denetle): son kayit onceki kayda karsi
        tarif = importlib.util.spec_from_file_location("kalite_olcum", os.path.join(KOD, "kalite", "olcum.py"))
        kalite_olcum = importlib.util.module_from_spec(tarif)
        tarif.loader.exec_module(kalite_olcum)
        asim, notlar = kalite_olcum.denetle(son, butce, onceki, os.path.basename(kayitlar[-2])[:10] if onceki else None)
    except Exception as e:  # noqa: BLE001  ekipten biri kalite/ uzerinde calisiyor olabilir
        asim, notlar = [], ["Bütçe denetimi yapılamadı: %s" % e]
    return {"tarih": tarih, "olcut": hes(len(son)), "olcutler": [satir(o) for _, o in sorted(son.items())],
            "butce_asimi": asim, "butce_notlari": notlar}


def nesne(**ozellik):
    return {"type": "object", "properties": ozellik, "additionalProperties": False}


METIN = lambda aciklama, n=200: {"type": "string", "maxLength": n, "description": aciklama}  # noqa: E731
OKUR = {"readOnlyHint": True, "destructiveHint": False, "idempotentHint": True, "openWorldHint": False}
ARACLAR = [
    ("sistem_haritasi", "Sistem haritası", t_harita, nesne(),
     "LifeOS'taki bütün yerler (kabuk, on alan, motorlar, King) ve durumları, ayrıca King'in okuyabildiği veri "
     "deposu ile alan başına kayıt sayısı. «Nerede ne var, sen neyi görüyorsun» sorusunun kapısı (Kabuk)."),
    ("kayit_ara", "Kayıt ara", t_kayit_ara,
     nesne(alan=METIN("Modül ya da profil öneki: «spi», «ays/main».", 60),
           yol=METIN("Yol öneki: «days/», «vitals/».", 120), metin=METIN("Kimlikte ya da içerikte geçen söz.", 100),
           tur=METIN("Kayıt türü (yanıttaki «turler» listesinden): «olcum», «plan_blogu».", 40),
           sinir={"type": "integer", "minimum": 1, "maximum": 100, "description": "En çok kaç kayıt (20)."}),
     "Kayıtları alana, yol önekine, türe ya da içinde geçen söze göre bulur; en yenisi önce. İçerik vermez, kimlik "
     "verir: içerik için kayit_oku. Notlar burada yoktur (notlar aracı). Kayıt motorunun okuma kapısı."),
    ("kayit_oku", "Kayıt oku", t_kayit_oku,
     dict(nesne(kimlik=METIN("kayit_ara'nın verdiği «alan|yol» kimliği.", 300)), required=["kimlik"]),
     "Tek bir kaydın içeriği. Her sayı depodaki kesinlik etiketiyle gelir: ölçüldü, tahmin, hesaplandı, veri yok "
     "ya da eski kayıt (etiketsiz eski sayı). Sayıyı değiştirme, yorumla. Kayıt motorunun okuma kapısı."),
    ("bugun_ozeti", "Bugün", t_bugun, nesne(),
     "Bugünün özeti: her modülün kendi kuralıyla yazdığı gün cümlesi ve planı, Gün kaydı (niyet, enerji) ve "
     "bugünün kayıtları. Bugüne ait olmayan «bugüne ait değil» diye işaretlenir, bugünmüş gibi sunulmaz."),
    ("notlar", "Notlar", t_notlar,
     nesne(ara=METIN("Aranacak söz; «#etiket» etikete göre arar. Boşsa en yeni notlar."),
           kimlik=METIN("Tek notun kimliği (listedeki «kimlik»): tam metni verir."),
           sinir={"type": "integer", "minimum": 1, "maximum": 50, "description": "En çok kaç not (20)."}),
     "Defter, sözlük, bağlam notları, ESP notları, tezler, taslaklar ve Bilinç düşünceleri, Not motorundan geçerek. "
     "Özel notlar hiç gelmez (King süzgeci). Not motorunun okuma kapısı; not yazmak ya da önermek bu sürümde yok."),
    ("yol_haritasi", "Yol haritası", t_yol,
     nesne(alan=METIN("Alan: «felsefe» (pilot).", 40), ders=METIN("Tek dersin kimliği: dersin tam metni.", 80)),
     "Bir alanın öğrenme yolu: aşama, ünite, ders ve kapılar; ders kimliğiyle dersin metni ve alıştırmaları. "
     "Onaysız içerik taslak diye işaretlidir. Kapı soruları verilmez. Yol motorunun okuma kapısı."),
    ("tekrar_durumu", "Tekrar", t_tekrar, nesne(),
     "Bugün vadesi gelen tekrar kartları ve sıradaki vade, Tekrar motorunun (FSRS) planıyla. Tekrar motorunun "
     "okuma kapısı."),
    ("olcum", "Ölçüm ve bütçe", t_olcum,
     nesne(olcut=METIN("Tek ölçütün kimliği: nasıl ölçüldüğü ve komutu.", 60)),
     "Son kalite kaydındaki ölçütler (eğriler, karmaşıklık) kesinlik etiketleriyle ve karmaşıklık bütçesinin "
     "denetimi (aşım var mı). Kalite katmanının kapısı."),
]
ARAC = {ad: (fn, sema) for ad, _, fn, sema, _ in ARACLAR}
TALIMAT = ("LifeOS King'in salt okur kapıları. Sayıyı uydurma: her sayı kesinlik etiketiyle gelir; «veri yok» "
           "diyorsa öyle söyle. Yazma yok: kayıt, not ve onay için LifeOS'u açmasını söyle. Özel notlar gelmez.")


# ---------------------------------------------------------------- JSON-RPC / MCP

def dogrula(sema, arg):
    p = sema["properties"]
    for ad in arg:
        if ad not in p:
            raise AracHatasi("Bilinmeyen argüman: %s. Geçerli: %s." % (ad, ", ".join(p) or "yok"))
    for ad in sema.get("required", []):
        if ad not in arg:
            raise AracHatasi("Eksik argüman: %s." % ad)
    for ad, v in arg.items():
        s = p[ad]
        if s["type"] == "integer" and (type(v) is not int or not s["minimum"] <= v <= s["maximum"]):
            raise AracHatasi("%s %d ile %d arası tam sayı olmalı." % (ad, s["minimum"], s["maximum"]))
        if s["type"] == "string" and (not isinstance(v, str) or len(v) > s["maxLength"]):
            raise AracHatasi("%s en çok %d harflik metin olmalı." % (ad, s["maxLength"]))


def arac_listesi():
    return [{"name": ad, "title": baslik, "description": aciklama, "inputSchema": sema, "annotations": OKUR}
            for ad, baslik, _, sema, aciklama in ARACLAR]


def cagir(p):
    ad, arg = p.get("name"), p.get("arguments", {})
    if not isinstance(ad, str) or not isinstance(arg, dict):
        raise RpcHatasi(-32602, "tools/call: «name» metin, «arguments» nesne olmalı.")
    if ad not in ARAC:
        raise RpcHatasi(-32602, "Unknown tool: %s" % ad)
    fn, sema = ARAC[ad]
    try:
        dogrula(sema, arg)
        metin, hata = json.dumps(fn(arg), ensure_ascii=False, indent=1), False
    except AracHatasi as e:
        metin, hata = str(e), True
    if len(metin) > CIKTI_SINIR:
        metin = metin[:CIKTI_SINIR] + "\n… (kesildi: daha dar sor)"
    return {"content": [{"type": "text", "text": metin}], "isError": hata}


def sunucu_bilgisi():
    return {"name": "lifeos-king", "title": "LifeOS King (salt okur)", "version": SURUM}


def yanitla(m):
    """Tek JSON-RPC iletisi -> yanit (dict) ya da None (bildirim, istemci yaniti)."""
    gecerli_id = isinstance(m, dict) and type(m.get("id")) in (str, int, float)
    if isinstance(m, dict) and "method" not in m and ("result" in m or "error" in m):
        return None   # istemcinin yaniti; biz istek gondermeyiz
    if not isinstance(m, dict) or m.get("jsonrpc") != "2.0" or not isinstance(m.get("method"), str) \
            or ("id" in m and not gecerli_id):
        return {"jsonrpc": "2.0", "id": m["id"] if gecerli_id else None,
                "error": {"code": -32600, "message": "Invalid Request: jsonrpc «2.0», metin «method» ve "
                                                     "metin ya da sayı «id» gerekir."}}
    bildirim, yontem, p = "id" not in m, m["method"], m.get("params", {})
    try:
        if not isinstance(p, dict):
            raise RpcHatasi(-32602, "«params» nesne olmalı.")
        istenen = (p.get("_meta") or {}).get(SURUM_ANAHTARI) if isinstance(p.get("_meta"), dict) else None
        if istenen is not None and istenen not in YENI_SURUMLER + ESKI_SURUMLER:
            raise RpcHatasi(-32022, "Unsupported protocol version",
                            {"supported": list(YENI_SURUMLER + ESKI_SURUMLER), "requested": istenen})
        if yontem == "initialize":
            v = p.get("protocolVersion")
            sonuc = {"protocolVersion": v if v in ESKI_SURUMLER else ESKI_SURUMLER[0],
                     "capabilities": {"tools": {"listChanged": False}}, "serverInfo": sunucu_bilgisi(),
                     "instructions": TALIMAT}
        elif yontem == "server/discover":
            sonuc = {"supportedVersions": list(YENI_SURUMLER + ESKI_SURUMLER),
                     "capabilities": {"tools": {"listChanged": False}},
                     "_meta": {"io.modelcontextprotocol/serverInfo": sunucu_bilgisi()}, "instructions": TALIMAT}
        elif yontem == "ping":
            sonuc = {}
        elif yontem == "tools/list":
            sonuc = {"tools": arac_listesi()}
        elif yontem == "tools/call":
            sonuc = cagir(p)
        elif yontem.startswith("notifications/"):
            return None
        else:
            raise RpcHatasi(-32601, "Method not found: %s" % yontem)
        if yontem != "initialize" and yontem != "ping":
            sonuc = dict(sonuc, resultType="complete")
        return None if bildirim else {"jsonrpc": "2.0", "id": m["id"], "result": sonuc}
    except RpcHatasi as e:
        hata = {"code": e.kod, "message": e.mesaj}
        if e.veri is not None:
            hata["data"] = e.veri
    except Exception as e:  # noqa: BLE001
        gunluk(traceback.format_exc())
        hata = {"code": -32603, "message": "İç hata: %s" % e}
    return None if bildirim else {"jsonrpc": "2.0", "id": m["id"], "error": hata}


def satir_isle(satir):
    """Bir stdin satiri -> yazilacak yanit (dict, liste) ya da None."""
    try:
        m = json.loads(satir.decode("utf-8") if isinstance(satir, bytes) else satir)
    except (ValueError, UnicodeDecodeError):
        return {"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": "Parse error"}}
    if isinstance(m, list) and m:   # JSON-RPC toplu istek (2025-03-26); bos liste gecersiz istek
        return [y for y in map(yanitla, m) if y is not None] or None
    return yanitla(m)


def main():
    giris, cikis = sys.stdin.buffer, sys.stdout.buffer
    sys.stdout = sys.stderr   # basibos print protokol kanalini bozmasin
    gunluk("başladı; sürüm %s, kod %s" % (SURUM, KOD))
    for satir in giris:
        if not satir.strip():
            continue
        yanit = satir_isle(satir)
        if yanit is not None:
            cikis.write(json.dumps(yanit, ensure_ascii=False).encode("utf-8") + b"\n")
            cikis.flush()


def denetle():
    """Sahibin elle denetimi: her araci gercek veriyle cagirir, YALNIZ sayilari basar; icerik basmaz."""
    a = anlik()
    print("Kaynak:", a["kaynak"], "| kayıt:", len(a["kayitlar"]), "| King'e açık:", len(acik(a)),
          "| yayın:", len(a["yayin"]), "| uyarı:", len(a["uyari"]))
    say = {"sistem_haritasi": lambda r: "yer %d, veri alanı %d" % (len(r["yerler"]), len(r["veri"]["okunabilir_kayit"])),
           "kayit_ara": lambda r: "eşleşen %d, tür %d" % (r["eslesen"]["deger"], len(r["turler"])),
           "kayit_oku": lambda r: "en yeni kayıt, etiketli sayı %d" % json.dumps(r["govde"]).count('"kesinlik"'),
           "bugun_ozeti": lambda r: "modül %d, Gün kaydı %s, bugünün kaydı %d" % (
               len(r["moduller"]), "yok" if r["gun_kaydi"] == YANIT_YOK else "var", len(r["bugunun_kayitlari"])),
           "notlar": lambda r: "toplam %d, okunabilir %d, özel olduğu için dışarıda %d" % (
               r["toplam"]["deger"], r["okunabilir"]["deger"], r["ozel_oldugu_icin_disarida"]["deger"]),
           "yol_haritasi": lambda r: "aşama %d, ders %d" % (len(r["asamalar"]), sum(
               len(u["dersler"]) for s in r["asamalar"] for u in s["uniteler"])),
           "tekrar_durumu": lambda r: "kart %d" % r["kart"]["deger"],
           "olcum": lambda r: "ölçüt %d, aşım %d" % (r["olcut"]["deger"], len(r["butce_asimi"])) if "olcut" in r else "veri yok"}
    ilk = (t_kayit_ara({})["kayitlar"] or [{}])[0].get("kimlik")
    for ad, (fn, _) in ARAC.items():
        try:
            if ad == "kayit_oku" and not ilk:
                print("%-16s veri yok · okunacak kayıt yok" % ad)
                continue
            print("%-16s tamam · %s" % (ad, say[ad](fn({"kimlik": ilk} if ad == "kayit_oku" else {}))))
        except AracHatasi as e:
            print("%-16s araç hatası · %s" % (ad, e))
    return 0


if __name__ == "__main__":
    for akis in (sys.stdout, sys.stderr):
        try:
            akis.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    sys.exit(denetle() if sys.argv[1:] == ["--denetle"] else main())
