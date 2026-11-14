#!/usr/bin/env python3
"""King MCP sunucusu testi: python king/mcp_test.py   (cikis 0 temiz, 1 kirmizi)

Gecici klasorde, gercek hesap.db semasiyla (sistem/hesap.py Depo) ve depo benzeri icerik dosyalariyla.
Korunan sozler king/mcp.py basligindaki 1-6. Kullanicinin hicbir dosyasina dokunmaz."""
import datetime
import hashlib
import json
import os
import shutil
import sqlite3
import subprocess
import sys
import tempfile
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(KOK / "sistem"))
sys.path.insert(0, str(KOK / "king"))
sys.dont_write_bytecode = True

import goc  # noqa: E402
import hesap  # noqa: E402
import mcp  # noqa: E402

kirmizi = 0


def dogru(ad, kosul, ek=""):
    global kirmizi
    print(("  ✓ " if kosul else "  ✕ ") + ad + ("" if kosul else "  %r" % (ek,)))
    kirmizi += 0 if kosul else 1


try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

t = tempfile.mkdtemp(prefix="lifeos-king-test-")
CANLI = os.path.join(t, "canli")
HESAP = os.path.join(CANLI, "hesap", "hesap.db")
TEK = os.path.join(CANLI, "veri", "lifeos.db")
ICERIK = os.path.join(t, "depo")
os.environ.update(LIFEOS_HESAP_DB=HESAP, LIFEOS_VERI_DB=TEK, LIFEOS_ICERIK=ICERIK)
os.environ.pop("LIFEOS_NODE", None)

simdi = datetime.datetime.now()
BUGUN, DUN, YARIN = (str(simdi.date() + datetime.timedelta(days=d)) for d in (0, -1, 1))
MS = int(simdi.timestamp() * 1000)
GIZLI = ("GIZLI-", "OZEL-KAYIT-XYZ", "BASKA-KULLANICI-XYZ", "sk-ANAHTAR-XYZ", "KAPI-SORUSU-XYZ", "TURETILMIS-XYZ")

# --- canli hesap deposu (gercek sema) ---
d = hesap.Depo(HESAP)
with d._islem() as c:
    for i, ad, rol in ((1, "sahip", "admin"), (2, "misafir", "uye")):
        c.execute("INSERT INTO kullanici(id, ad, rol, tuz, ozet, tur, olusturma) VALUES (?,?,?,?,?,?,?)",
                  (i, ad, rol, b"t", b"o", 1, "2026-11-01"))
    kayitlar = [
        (1, "ays/main", "days/" + BUGUN, {"date": BUGUN, "minutes": 50, "minutesCert": "measured", "su": 3}),
        (1, "spi/ben", "vitals/v1", {"id": "v1", "weight": 72.5, "cert": "measured", "at": MS}),
        (1, "spi/ben", "meta/ayar", {"apiKey": "sk-ANAHTAR-XYZ", "llm": {"keys": {"a": "sk-ANAHTAR-XYZ"}}, "tema": "Piksel"}),
        (1, "ays/main", "defter/n1", {"id": "n1", "baslik": "Açık not", "govde": "Platon üzerine", "at": "2026-11-10T10:00:00Z",
                                      "guncel": "2026-11-11T10:00:00Z", "sabit": False, "tur": "not", "klasor": ""}),
        (1, "esp/ben", "notes/e1", {"id": "e1", "text": "Kant ve ödev", "createdAt": MS}),
        (1, "ays/main", "cards/c1", {"id": "c1", "front": "Soru bir", "back": "Cevap", "dueAt": BUGUN,
                                     "lastReviewedAt": DUN, "history": [{"rating": "good"}]}),
        (1, "esp/ben", "cards/k1", {"id": "k1", "front": "word", "back": "kelime", "due": YARIN, "interval": 2,
                                    "reps": 1, "lapses": 0, "lang": "en"}),
        (1, "ays/main", "briefings/b1", {"metin": "TURETILMIS-XYZ"}),
        (1, "ays/main", "usage/u1", {"metin": "TURETILMIS-XYZ"}),
        (1, "ays/main", "cards/silinen", None),
        (1, "ays/main", "ozel/o1", {"ozel": True, "metin": "OZEL-KAYIT-XYZ"}),
        (2, "ays/main", "days/" + BUGUN, {"minutes": 999, "not": "BASKA-KULLANICI-XYZ"}),
    ]
    for kul, alan, yol, deger in kayitlar:
        c.execute("INSERT INTO kayit(kullanici, alan, yol, deger, zaman, cihaz, sira) VALUES (?,?,?,?,?,?,1)",
                  (kul, alan, yol, None if deger is None else json.dumps(deger, ensure_ascii=False), MS, "cPC"))
    bilinc = {"izin": True, "dusunceler": [
        {"id": "d1", "baslik": "Açık düşünce", "metin": "Bkz. [[GIZLI-BASLIK]]", "tur": "fikir", "kesinlik": 3, "zaman": MS},
        {"id": "d2", "baslik": "GIZLI-BASLIK", "metin": "GIZLI-METIN", "tur": "his", "ozel": True, "zaman": MS}]}
    yayin = [("ays/bugun", "3 blok planlı", BUGUN), ("spi/bugun", "eski özet", DUN),
             ("ays/gun", json.dumps({"bloklar": [{"ad": "Felsefe", "dk": 30}]}), BUGUN),
             ("ays/gunluk", json.dumps({"gunler": {BUGUN: {"soru": 40}}}), None),
             ("gun/kayit", json.dumps({"niyet": "oku", "enerji": 4, "hava": 3, "bloklar": []}), BUGUN),
             ("gun/bilinc", json.dumps(bilinc, ensure_ascii=False), None)]
    for ad, icerik, gun in yayin:
        c.execute("INSERT INTO yayin(kullanici, ad, icerik, adet, zaman, gun) VALUES (1,?,?,1,?,?)",
                  (ad, icerik, MS / 1000, gun))
    c.execute("INSERT INTO yayin(kullanici, ad, icerik, adet, zaman, gun) VALUES (2,'ays/bugun','BASKA-KULLANICI-XYZ',1,1,?)",
              (BUGUN,))
del d

# --- depo benzeri icerik ---
os.makedirs(os.path.join(ICERIK, "alan", "felsefe"))
os.makedirs(os.path.join(ICERIK, "kabuk"))
os.makedirs(os.path.join(ICERIK, "kalite", "kayit"))
shutil.copyfile(KOK / "kabuk" / "harita.js", os.path.join(ICERIK, "kabuk", "harita.js"))
# kapı sorusu konuyla eşleşir: araştır onu kaynak yapmamalı (ustalık kapısı ölçümdür)
kapi = {"esik": 0.7, "sorular": [{"id": "q1", "tur": "secmeli", "soru": "KAPI-SORUSU-XYZ: Platon mağara benzetmesinde "
                                  "gölgeler neyi temsil eder?", "sec": ["a", "b"], "dogru": "a"}]}
asama = {"id": "f1", "ad": "Aşama 1", "hedef": "Düşünmeyi tanımak", "kapi": kapi, "uniteler": [
    {"id": "u1", "ad": "Ünite 1", "kazanim": ["k"], "kapi": kapi, "dersler": [
        {"id": "ders1", "ad": "Ders 1", "durum": "onayli", "metin": "DERS-METNI",
         "ozet": "Platon mağara benzetmesinde gölgeleri gerçek sanan insanları anlatır."},
        {"id": "ders2", "ad": "Ders 2", "durum": "taslak", "ozet": "özet 2", "metin": "..."}]}]}
Path(ICERIK, "alan", "felsefe", "asama-1.json").write_text(json.dumps(asama, ensure_ascii=False), encoding="utf-8")
olc = lambda deger: {"sayfa": {"id": "sayfa", "ad": "Sayfa", "deger": deger, "etiket": "ölçüldü", "durum": "ölçüldü",
                               "katman": "sistem"},
                     "egri_x": {"id": "egri_x", "ad": "Eğri", "deger": None, "etiket": "veri yok", "durum": "ölçülmedi",
                                "katman": "king", "komut": "python x.py"}}  # noqa: E731
for gun, v in (("2026-11-12", 79), ("2026-11-13", 80)):
    Path(ICERIK, "kalite", "kayit", gun + ".json").write_text(json.dumps({"tarih": gun, "surum": 1, "olcutler": olc(v)}),
                                                             encoding="utf-8")
Path(ICERIK, "kalite", "butce.json").write_text(json.dumps({"olcutler": {"sayfa": {"taban": 79, "hedef": 40, "yon": "azalmali"}}}),
                                                encoding="utf-8")


# --- yardimcilar ---
def rpc(yontem, params=None, id_=1):
    m = {"jsonrpc": "2.0", "id": id_, "method": yontem}
    if params is not None:
        m["params"] = params
    return mcp.satir_isle(json.dumps(m))


ciktilar = []


def arac(ad, **arg):
    r = rpc("tools/call", {"name": ad, "arguments": arg})
    metin = r["result"]["content"][0]["text"]
    ciktilar.append(metin)
    return r["result"]["isError"], (json.loads(metin) if not r["result"]["isError"] else metin)


def iz(kok):
    out = {}
    for dz, _, adlar in os.walk(kok):
        for a in adlar:
            p = os.path.join(dz, a)
            out[p] = (hashlib.sha256(open(p, "rb").read()).hexdigest(), os.stat(p).st_mtime_ns)
    return out


acilan = []
_connect = sqlite3.connect


def izli_connect(yol, *a, **k):
    if str(yol) != ":memory:":   # arastir'in süreç içi web önbelleği dosya değildir
        acilan.append(os.path.abspath(str(yol)))
    return _connect(yol, *a, **k)


once = iz(CANLI)
sqlite3.connect = izli_connect

print("El sıkışma")
r = rpc("initialize", {"protocolVersion": "2025-06-18", "capabilities": {}, "clientInfo": {"name": "t", "version": "1"}})
dogru("initialize desteklenen sürümü aynen döner", r["result"]["protocolVersion"] == "2025-06-18", r)
dogru("initialize araç yeteneği ve sunucu kimliği", r["result"]["capabilities"] == {"tools": {"listChanged": False}}
      and r["result"]["serverInfo"]["name"] == "lifeos-king" and r["result"]["instructions"], r)
r = rpc("initialize", {"protocolVersion": "1999-01-01", "capabilities": {}, "clientInfo": {"name": "t", "version": "1"}})
dogru("bilinmeyen sürümde en yeni eski sürüm önerilir", r["result"]["protocolVersion"] == "2025-11-25", r)
dogru("notifications/initialized yanıtsız", mcp.satir_isle('{"jsonrpc":"2.0","method":"notifications/initialized"}') is None)
dogru("ping boş sonuç", rpc("ping")["result"] == {})
r = rpc("server/discover", {"_meta": {mcp.SURUM_ANAHTARI: "2026-07-28"}})
dogru("server/discover güncel sürümü ve kimliği verir", "2026-07-28" in r["result"]["supportedVersions"]
      and r["result"]["resultType"] == "complete" and r["result"]["_meta"]["io.modelcontextprotocol/serverInfo"]["name"] == "lifeos-king", r)
r = rpc("tools/list", {"_meta": {mcp.SURUM_ANAHTARI: "1900-01-01"}})
dogru("desteklenmeyen _meta sürümü -32022 ve desteklenen liste", r["error"]["code"] == -32022
      and "2026-07-28" in r["error"]["data"]["supported"] and r["error"]["data"]["requested"] == "1900-01-01", r)

print("Araç listesi")
araclar = rpc("tools/list", {"_meta": {mcp.SURUM_ANAHTARI: "2026-07-28"}})["result"]["tools"]
adlar = [a["name"] for a in araclar]
dogru("en çok 12 araç", 1 <= len(araclar) <= 12, adlar)
dogru("her araçta ad, Türkçe açıklama, nesne şeması", all(a["description"] and a["title"] and a["inputSchema"]["type"] == "object"
                                                       and a["inputSchema"].get("additionalProperties") is False for a in araclar))
dogru("her araç salt okur işaretli", all(a["annotations"]["readOnlyHint"] and not a["annotations"]["destructiveHint"]
                                         for a in araclar))
dogru("yazan araç yok (ad)", not any(v in a for a in adlar for v in ("kaydet", "yaz", "sil", "ekle", "degistir",
                                                                        "guncelle", "onayla", "oner")), adlar)
dogru("King yolu: çekirdek ve Arama kapıları, toplam on bir", {"niyet", "kayit_cozumle", "arastir"} <= set(adlar)
      and len(adlar) == 11, adlar)
dogru("yalnız arastir web'e çıkar (openWorldHint)", [a["name"] for a in araclar if a["annotations"]["openWorldHint"]]
      == ["arastir"], adlar)

print("Hatalar")
dogru("bozuk JSON -32700, id null", mcp.satir_isle("bozuk") == {"jsonrpc": "2.0", "id": None,
                                                                 "error": {"code": -32700, "message": "Parse error"}})
dogru("boş toplu istek -32600", mcp.satir_isle("[]")["error"]["code"] == -32600)
r = mcp.satir_isle('{"jsonrpc":"1.0","id":7,"method":"ping"}')
dogru("jsonrpc 2.0 değil -32600, id korunur", r["error"]["code"] == -32600 and r["id"] == 7, r)
dogru("method yok -32600", mcp.satir_isle('{"jsonrpc":"2.0","id":1}')["error"]["code"] == -32600)
r = mcp.satir_isle('{"jsonrpc":"2.0","id":{"a":1},"method":"ping"}')
dogru("geçersiz id -32600, id null", r["error"]["code"] == -32600 and r["id"] is None, r)
dogru("bilinmeyen yöntem -32601", rpc("resources/write")["error"]["code"] == -32601)
dogru("params nesne değil -32602", rpc("tools/list", [1])["error"]["code"] == -32602)
dogru("bilinmeyen araç -32602", rpc("tools/call", {"name": "kayit_yaz", "arguments": {}})["error"]["code"] == -32602)
dogru("arguments nesne değil -32602", rpc("tools/call", {"name": "notlar", "arguments": "x"})["error"]["code"] == -32602)
dogru("sınır dışı sayı araç hatası", arac("kayit_ara", sinir=0)[0])
dogru("bilinmeyen argüman araç hatası", arac("kayit_ara", yaz=True)[0])
dogru("eksik zorunlu argüman araç hatası", arac("kayit_oku")[0])
r = mcp.satir_isle('[{"jsonrpc":"2.0","id":1,"method":"ping"},{"jsonrpc":"2.0","method":"notifications/x"}]')
dogru("toplu istek: bildirime yanıt yok", isinstance(r, list) and len(r) == 1 and r[0]["id"] == 1, r)

print("Araçlar (hesap.db kopyası)")
h, r = arac("sistem_haritasi")
dogru("sistem haritası: yerler ve veri kaynağı", not h and len(r["yerler"]) > 10 and "hesap.db" in r["veri"]["kaynak"]
      and r["veri"]["okunabilir_kayit"]["ays/main"] == {"deger": 2, "kesinlik": "hesaplandı"}, r if h else r["veri"])
h, r = arac("kayit_ara")
kim = {k["kimlik"] for k in r["kayitlar"]}
dogru("kayıt ara: sahibin açık kayıtları", kim == {"ays/main|days/" + BUGUN, "spi/ben|vitals/v1", "spi/ben|meta/ayar",
                                                   "ays/main|cards/c1", "esp/ben|cards/k1"}, kim)
dogru("kayıt ara: sayım etiketli", r["eslesen"] == {"deger": 5, "kesinlik": "hesaplandı"}, r["eslesen"])
dogru("kayıt ara: Türkçe katlamayla metin", [k["kimlik"] for k in arac("kayit_ara", metin="PİKSEL")[1]["kayitlar"]]
      == ["spi/ben|meta/ayar"])
dogru("kayıt ara: sır aranamaz", arac("kayit_ara", metin="sk-ANAHTAR")[1]["kayitlar"] == [])
dogru("kayıt ara: alan ve yol öneki", [k["kimlik"] for k in arac("kayit_ara", alan="spi", yol="vitals/")[1]["kayitlar"]]
      == ["spi/ben|vitals/v1"])
h, r = arac("kayit_oku", kimlik="ays/main|days/" + BUGUN)
dogru("kayıt oku: etiketli sayı depodaki etiketle", r["govde"]["minutes"] == {"deger": 50, "kesinlik": "ölçüldü"}, r)
dogru("kayıt oku: etiketsiz eski sayı «eski kayıt»", r["govde"]["su"] == {"deger": 3, "kesinlik": "eski kayıt"}, r)
h, r = arac("kayit_oku", kimlik="spi/ben|vitals/v1")
dogru("kayıt oku: ortak cert etiketi", r["govde"]["weight"] == {"deger": 72.5, "kesinlik": "ölçüldü"}, r)
h, r = arac("kayit_oku", kimlik="spi/ben|meta/ayar")
dogru("kayıt oku: sır anahtarın değeri gizli", r["govde"]["apiKey"] == "«gizli»" and r["govde"]["llm"]["keys"] == "«gizli»", r)
dogru("kayıt oku: not kayıt aracından okunmaz", arac("kayit_oku", kimlik="ays/main|defter/n1")[0])
dogru("kayıt oku: özel işaretli kayıt kapalı", arac("kayit_oku", kimlik="ays/main|ozel/o1")[0])
dogru("kayıt oku: türetilmiş kayıt yok", arac("kayit_oku", kimlik="ays/main|briefings/b1")[0])
h, r = arac("bugun_ozeti")
m = {x["modul"]: x for x in r["moduller"]}
dogru("bugün: modülün gün cümlesi", m["ays"]["ozet"] == "3 blok planlı" and m["ays"]["ozet_durumu"] == "bugünün", m.get("ays"))
dogru("bugün: dünkü özet bugünmüş gibi sunulmaz", m["spi"]["ozet"] is None and DUN in m["spi"]["ozet_durumu"], m.get("spi"))
dogru("bugün: plan ve sayısal özet etiketli", m["ays"]["plan"]["bloklar"][0]["dk"] == {"deger": 30, "kesinlik": "eski kayıt"}
      and m["ays"]["sayisal"]["soru"] == {"deger": 40, "kesinlik": "eski kayıt"}, m.get("ays"))
dogru("bugün: Gün kaydı", r["gun_kaydi"]["kayit"]["enerji"] == {"deger": 4, "kesinlik": "eski kayıt"}, r["gun_kaydi"])
dogru("bugün: bugünün kayıtları", [k["kimlik"] for k in r["bugunun_kayitlari"]] == ["ays/main|days/" + BUGUN], r["bugunun_kayitlari"])
h, r = arac("notlar")
dogru("notlar: dört not, biri özel olduğu için dışarıda", (r["toplam"]["deger"], r["okunabilir"]["deger"],
                                                         r["ozel_oldugu_icin_disarida"]["deger"]) == (4, 3, 1), r if h else r["toplam"])
dogru("notlar: süzgeç açıklaması", "Bilinç" in r["gizlilik"])
h, r = arac("notlar", kimlik="bilinc/d1")
dogru("notlar: özel nota giden bağın adı silinir", "«özel not»" in r["not"]["govde"], r)
dogru("notlar: özel not kimlikle de gelmez", arac("notlar", kimlik="bilinc/d2") == (True, "Bu not King'e kapalı (özel)."))
h, r = arac("notlar", ara="kant")
dogru("notlar: arama Not motoruyla", not h and any("e1" in n["kimlik"] for n in r["notlar"]), r)
h, r = arac("yol_haritasi")
dersler = r["asamalar"][0]["uniteler"][0]["dersler"]
dogru("yol: aşama, ünite, ders; taslak işaretli", [x["durum"][:6] for x in dersler] == ["onaylı", "taslak"], dersler)
dogru("yol: ilerleme veri yok", r["ilerleme"].startswith("veri yok"))
dogru("yol: kapı sayısı etiketli, cevap yok", r["asamalar"][0]["kapi"]["soru"] == {"deger": 1, "kesinlik": "hesaplandı"}
      and "%70" in r["asamalar"][0]["kapi"]["gecme"], r["asamalar"][0]["kapi"])
dogru("yol: ders metni kimlikle", arac("yol_haritasi", ders="ders1")[1]["ders"]["metin"] == "DERS-METNI")
dogru("yol: olmayan alan araç hatası", arac("yol_haritasi", alan="tarih")[0])
h, r = arac("tekrar_durumu")
dogru("tekrar: iki kart, biri bugün", not h and r["kart"]["deger"] == 2 and r["bugun_tekrar"]["deger"] == 1
      and r["siradaki_vade"] != "veri yok", r)
h, r = arac("olcum")
dogru("ölçüm: değer etiketli, ölçülmeyen veri yok", {o["id"]: o["deger"] for o in r["olcutler"]}
      == {"sayfa": {"deger": 80, "kesinlik": "ölçüldü"}, "egri_x": "veri yok"}, r)
dogru("ölçüm: bütçe aşımı kalite motorunca bulunur", len(r["butce_asimi"]) == 1 and "AŞIM" in r["butce_asimi"][0], r["butce_asimi"])
dogru("ölçüm: tek ölçüt komutuyla", arac("olcum", olcut="egri_x")[1]["komut"] == "python x.py")

os.environ["LIFEOS_NODE"] = os.path.join(t, "node-yok.exe")
h, r = arac("notlar")
dogru("Node yoksa notlar süzgeçsiz dönmez (araç hatası)", h and "köprü" in r, r)
os.environ["LIFEOS_KING_CEVRIMDISI"] = "1"
h, r = arac("arastir", soru="notlarımda kant ödev")
dogru("Node yoksa araştır notsuz sürer ve söyler", not h and r["uyari"] and "köprü" in r["uyari"][0]
      and not [k for k in r["kaynaklar"] if k["tur"] == "not"], r)
os.environ.pop("LIFEOS_NODE")

print("King çekirdeği ve Arama (King yolu)")
h, r = arac("kayit_cozumle", metin="Bugün 20 dakika yürüdüm")
dogru("kayıt önerisi: tipli, sayı depodaki etiket biçiminde", not h and r["oneri"]["tur"] == "antrenman"
      and r["oneri"]["gun"] == BUGUN and r["oneri"]["alanlar"]["sure_dk"] == {"deger": 20, "kesinlik": "ölçüldü"}, r)
dogru("kayıt önerisi: yazılmadı, yazmanın tek süreçten sonra geldiğini söyler", r["yazildi"] is False
      and "tek süreç" in r["yazma"] and r["oneri"]["durum"] == "oneri", r)
h, r = arac("kayit_cozumle", metin="Bugün ne yapayım?")
dogru("kayıt değil: öneri yok, niyetiyle söyler", not h and "oneri" not in r and r["durum"].startswith("Kayıt değil"), r)
h, r = arac("niyet", metin="Bugün 20 dakika yürüdüm")
dogru("niyet: kayıt modele gitmez, kaydet kapısı (Kayıt motoru)", not h and r["niyet"] == "kayit"
      and r["kapilar"][0]["kapi"] == "kaydet" and r["kapilar"][0]["motor"] == "Kayıt" and r["baglam"]["dilimler"] == []
      and r["kayit_onerisi"]["yazildi"] is False, r)
h, r = arac("niyet", metin="bana felsefe öğret")
dogru("niyet: öğren; kapılar, notlu bağlam bütçe içinde", not h and r["niyet"] == "ogren"
      and "ogren" in [k["kapi"] for k in r["kapilar"]] and "notlar" in [d["ad"] for d in r["baglam"]["dilimler"]]
      and r["baglam"]["jeton"]["deger"] <= r["baglam"]["butce"] and r["baglam"]["jeton"]["kesinlik"] == "tahmin", r)
from core import web  # noqa: E402  (mcp_test'te arastir HKM'yi yükledi)
ag, eski_ag = [], web._ag


def ag_yok(*a, **k):
    ag.append(a[0] if a else None)
    raise OSError("ağ yok")


web._ag = ag_yok   # gerçek ağa hiç çıkılmaz
h, r = arac("arastir", soru="Platon mağara benzetmesi")
dogru("araştır çevrimdışı: ağa çıkmaz ve söyler", not h and not ag and "çevrimdışı" in r["ag"]
      and r["butce"]["ag_cagrisi"] == 0 and [a["kaynak"] for a in r["plan"]] == ["not", "alan"], r)
dogru("araştır: her iddia kaynaklı", r["iddialar"] and all(i["kaynaklar"] and i["kaynaklar"][0].get("url")
                                                           for i in r["iddialar"]), r["iddialar"])
dogru("araştır: alan içeriğinden birebir; kapı sorusu kaynak olmaz", any(
    "gerçek sanan" in i["metin"] and i["kesinlik"] == "kaynakta birebir" for i in r["iddialar"]), r["iddialar"])
dogru("araştır: hafızaya yazmaz (yalnız öneri)", r["hafiza_onerisi"]["yazildi"] is False, r["hafiza_onerisi"])
h, r = arac("arastir", soru="notlarımda açık düşünce")
dogru("araştır: notlar süzgeçten, özel nota giden bağın adı silinmiş", not h and any(
    k["tur"] == "not" for k in r["kaynaklar"]) and "web" not in [a["kaynak"] for a in r["plan"]], r)
os.environ.pop("LIFEOS_KING_CEVRIMDISI")
web.VARSAYILAN_TASIYICI = ag_yok
h, r = arac("arastir", soru="Platon mağara benzetmesi")
dogru("araştır ağ yoksa: yerel kaynakla cevaplar ve söyler", not h and ag and "gelmedi" in r["ag"]
      and r["iddialar"] and r["butce"]["ag_cagrisi"] <= r["butce"]["ag_siniri"], r)
web.VARSAYILAN_TASIYICI, web._ag = None, eski_ag

print("Gizlilik ve canlı dosya")
hepsi = "\n".join(ciktilar)
dogru("özel, sır, türetilmiş, kapı sorusu ve öbür kullanıcı hiçbir çıktıda yok",
      not [g for g in GIZLI if g in hepsi], [g for g in GIZLI if g in hepsi])
canli_acilan = [p for p in acilan if p.startswith(os.path.abspath(CANLI))]
dogru("canlı dosya hiç açılmadı (yalnız kopya)", acilan and not canli_acilan, canli_acilan or "hiç açılış yok")
dogru("canlı klasör bayt bayt aynı, yanında -wal/-shm doğmadı", iz(CANLI) == once,
      sorted(set(iz(CANLI)) ^ set(once)))
dogru("geçici kopyalar silindi", not any(os.path.exists(os.path.dirname(p)) for p in acilan))

print("Tek depo (lifeos.db) önce gelir")
sqlite3.connect = _connect
os.makedirs(os.path.dirname(TEK))
c = sqlite3.connect(TEK)
c.executescript(goc.SEMA)
for alan, yol, tur, govde, etiket in (("spi/ben", "vitals/t1", "olcum", {"weight": 70}, {"weight": "measured"}),
                                      ("gun/sunucu", "gun/bilinc", "gun_kopya", bilinc, {})):
    c.execute("INSERT INTO kayit VALUES (?,?,1,?,?,?,?,?,'pc',0,'goc','g1')",
              (alan + "|" + yol, tur, alan, yol, json.dumps(govde, ensure_ascii=False), json.dumps(etiket),
               "%013d:0000:pc" % MS))
c.commit()
c.close()
once = iz(CANLI)
sqlite3.connect = izli_connect
acilan.clear()
h, r = arac("kayit_oku", kimlik="spi/ben|vitals/t1")
dogru("tek depo: kaynak ve etiket", "lifeos.db" in r["kaynak"] and r["govde"]["weight"] == {"deger": 70, "kesinlik": "ölçüldü"}, r)
h, r = arac("notlar")
dogru("tek depo: Bilinç süzgeçten geçer", (r["okunabilir"]["deger"], r["ozel_oldugu_icin_disarida"]["deger"]) == (1, 1), r)
dogru("tek depo: canlı dosya açılmadı, değişmedi", acilan and not [p for p in acilan if p.startswith(os.path.abspath(CANLI))]
      and iz(CANLI) == once)
sqlite3.connect = _connect

print("Yeni kabuğun kayıtları tek depodan (kabuk/depo.js eşitler)")
GIZLI_NOT = "COK-OZEL-ICERIK-41"
kabuk_notlar = [
    {"id": "kn1", "baslik": "Erdem üzerine", "govde": "Kabukta yazıldı.", "alan": "", "etiketler": [], "kaynak": {"yapi": "not"},
     "olusturma": MS, "guncelleme": MS, "ozel": False, "tur": "not", "klasor": "", "sabit": False, "baglam": None, "ozellik": {}},
    {"id": "kn2", "baslik": "Özel defter", "govde": GIZLI_NOT, "alan": "", "etiketler": [], "kaynak": {"yapi": "not"},
     "olusturma": MS, "guncelleme": MS, "ozel": True, "tur": "not", "klasor": "", "sabit": False, "baglam": None, "ozellik": {}},
    {"id": "bozuk", "baslik": "", "govde": ""}]
kabuk_kartlar = [{"id": "kk1", "zorluk": None, "kararlilik": None, "son": None, "sonraki": None, "tekrar": 0, "unutma": 0,
                  "durum": "yeni", "on": "Arkhe nedir?", "arka": "İlk madde."}]
bugun_ = datetime.date.today().isoformat()
kabuk_kayit = [{"id": "su:%s:1" % bugun_, "tur": "su", "gun": bugun_, "zaman": MS, "kaynak": "kullanici",
                "deger": {"ml": {"v": 500, "k": "measured"}}, "ek": {}}]
kabuk_yol = {"dersler": {"felsefe.1.1.1": {"okundu": MS}}, "cevaplar": {}, "kapilar": {"felsefe.1.1": [{"gecti": True}]}, "asamalar": {}}
c = _connect(TEK)
for yol, deger in (("lifeos.not.kayit", kabuk_notlar), ("lifeos.tekrar.kartlar", kabuk_kartlar), ("lifeos.kayit.kayitlar", kabuk_kayit),
                   ("lifeos.yol.f1", kabuk_yol), ("lifeos.tanisma.kayit", {"olgular": [GIZLI_NOT]})):
    # sistem/veri.py kabuk_yaz ile ayni bicim: govde, tarayicidaki dizginin (JSON metni) JSON'u
    c.execute("INSERT INTO kayit VALUES (?,?,1,?,?,?,?,?,'pc',0,'kabuk',NULL)",
              ("kabuk|" + yol, "kabuk", "kabuk", yol, json.dumps(json.dumps(deger, ensure_ascii=False), ensure_ascii=False), "{}",
               "%013d:0000:pc" % MS))
c.execute("INSERT INTO kayit VALUES (?,?,1,?,?,?,?,?,'pc',0,'kabuk',NULL)",
          ("kabuk-cakisma|lifeos.kayit.kayitlar|7", "kabuk-cakisma", "kabuk-cakisma", "lifeos.kayit.kayitlar|7",
           json.dumps(json.dumps([{"eski": GIZLI_NOT}])), "{}", "%013d:0000:pc" % MS))
c.commit()
c.close()
h, r = arac("notlar")
adlar = [n["baslik"] for n in r["notlar"]]
dogru("kabuk notu King'e gelir; özel kabuk notu gelmez; geçersiz not alınmaz", not h and "Erdem üzerine" in adlar and "Özel defter" not in adlar
      and GIZLI_NOT not in json.dumps(r, ensure_ascii=False), r)
dogru("özel kabuk notu kimlikle de kapalı", arac("notlar", kimlik="kn2") == (True, "Bu not King'e kapalı (özel)."))
h, r = arac("tekrar_durumu")
dogru("kabuk kartı tekrar durumunda", not h and r["kart"]["deger"] == 1 and r["bugun_yeni"]["deger"] == 1
      and r["bugunun_kartlari"][0]["on"] == "Arkhe nedir?", r)
h, r = arac("kayit_ara", metin="su")
dogru("kabuk kaydı tek tek kayıt olarak bulunur", not h and any(x.get("kimlik", "").startswith("kabuk/kayit|su/" + bugun_) for x in r.get("kayitlar", r.get("bulunan", []))), r)
h, r = arac("bugun_ozeti")
dogru("bugün özeti kabuk kaydını gösterir", not h and any(x["kimlik"].startswith("kabuk/kayit|") for x in r["bugunun_kayitlari"]), r)
h, r = arac("yol_haritasi", alan="felsefe")
dogru("yol haritası öğrenme kaydını sayar", not h and isinstance(r["ilerleme"], list) and r["ilerleme"][0]["okunan_ders"]["deger"] == 1
      and r["ilerleme"][0]["gecilen_kapi"]["deger"] == 1, r.get("ilerleme"))
tum_ = json.dumps([arac("kayit_ara", metin=x)[1] for x in ("lifeos", "kabuk", "OZEL", "tanisma", "eski")], ensure_ascii=False)
dogru("ham kabuk anahtarları ve çakışma kopyaları kayıt araçlarına çıkmaz", GIZLI_NOT not in tum_ and "lifeos.not.kayit" not in tum_
      and "kabuk-cakisma" not in tum_, tum_[:300])

print("stdio uçtan uca")
girdi = "\n".join(json.dumps(x) for x in (
    {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2025-11-25", "capabilities": {},
                                                                  "clientInfo": {"name": "t", "version": "1"}}},
    {"jsonrpc": "2.0", "method": "notifications/initialized"},
    {"jsonrpc": "2.0", "id": 2, "method": "tools/list"},
    {"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "notlar", "arguments": {}}},
    {"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "niyet", "arguments": {"metin": "bana felsefe öğret"}}},
)) + "\n"
p = subprocess.run([sys.executable, str(KOK / "king" / "mcp.py")], input=girdi.encode("utf-8"), capture_output=True,
                   timeout=60, env=dict(os.environ))
satirlar = p.stdout.decode("utf-8").splitlines()
try:
    yanit = [json.loads(s) for s in satirlar]
except ValueError:
    yanit = []
dogru("stdout yalnız JSON-RPC, dört yanıt", [y.get("id") for y in yanit] == [1, 2, 3, 4], satirlar[:4])
dogru("stdio: araç çağrıları sonuç verir (notlar, niyet)", len(yanit) == 4 and all(y["result"]["isError"] is False for y in yanit[2:]),
      yanit[2:] if yanit else p.stderr[-300:])
dogru("stdio: günlük stderr'de", b"king-mcp" in p.stderr)

shutil.rmtree(t, ignore_errors=True)
print("\n%s · %d kırmızı" % ("TEMİZ" if not kirmizi else "KIRMIZI", kirmizi))
sys.exit(1 if kirmizi else 0)
