#!/usr/bin/env python3
"""king/niyet.py sınaması: niyet ayrımı ve kayıt ayrıştırıcısı. Çıkış 0 yeşil, 1 kırmızı. python king/niyet_test.py"""
import datetime
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.dont_write_bytecode = True
import katalog  # noqa: E402
import niyet  # noqa: E402

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass
kirmizi = 0
SIMDI = datetime.datetime(2026, 11, 13, 21, 0)


def dogru(ad, kosul, ek=""):
    global kirmizi
    print(("  ✓ " if kosul else "  ✕ ") + ad + ("" if kosul else "  %r" % (ek,)))
    kirmizi += 0 if kosul else 1


def s(metin):
    return niyet.siniflandir(metin, SIMDI)


def alan(metin):
    r = s(metin)
    return r.get("kayit", {}).get("tur"), r.get("kayit", {}).get("alanlar", {})


print("Planın örneği")
r = s("Bugün 20 dakika yürüdüm")
dogru("«Bugün 20 dakika yürüdüm» kayıt", r["niyet"] == "kayit", r)
dogru("tür antrenman, 20 dk ölçüldü", r["kayit"]["tur"] == "antrenman"
      and r["kayit"]["alanlar"]["sure_dk"] == {"v": 20, "k": "measured"}, r["kayit"])
dogru("gün bugün, kaynak kural, durum öneri", r["kayit"]["gun"] == "2026-11-13" and r["kayit"]["kaynak"] == "king-kural"
      and r["kayit"]["durum"] == "oneri", r["kayit"])
dogru("sonuçta niyet, guven, neden var", set(r) >= {"niyet", "guven", "neden"} and 0 < r["guven"] <= 1, r)

print("Beş niyet")
for metin, beklenen in (
        ("merhaba King nasılsın", "sohbet"), ("kendimi başarısız hissediyorum", "sohbet"),
        ("Kant'ın kategorik imperatifi ne demek", "sohbet"), ("netlerim neden artmıyor", "sohbet"),
        ("akşam yemeğinde ne yesem", "sohbet"), ("bana bir integral sorusu sor", "ogren"),
        ("türev hakkında soru sor", "ogren"), ("bugün tekrar etmem gereken kartlar", "ogren"),
        ("Stoacılık hakkında kaynakları araştır", "arastir"), ("yulafın besin değeri", "arastir"),
        ("koyu moda geç", "yonet"), ("Plan sayfasını aç", "yonet"), ("bekleyen önerileri onayla", "yonet"),
        ("bugünün planı ne?", "yonet"), ("dün ne yedim", "yonet"), ("son 14 gündeki uyku ortalamam", "yonet"),
        ("25 dakika matematik çalışalım", "yonet"), ("bugünün planına 45 dakika geometri ekle", "yonet"),
        ("akşam 9'da su içmeyi hatırlat", "yonet"), ("hesapla: 15*4+2", "yonet"),
        ("Bugün 20 dakika yürüdüm", "kayit"), ("dün 7 saat uyudum", "kayit")):
    r = s(metin)
    dogru("«%s» → %s" % (metin, beklenen), r["niyet"] == beklenen, r)

print("Türkçe katlama: büyük harf, aksan, I/İ")
a, b, c = s("BUGÜN 20 DAKİKA YÜRÜDÜM"), s("bugun 20 dakika yurudum"), s("Bugün 20 dakika yürüdüm")
dogru("büyük harf ve aksansız yazım aynı kayıt", a["kayit"]["alanlar"] == b["kayit"]["alanlar"] == c["kayit"]["alanlar"],
      (a, b))
dogru("«IŞIK» → «isik»", niyet.katlanmis("IŞIK") == "isik", niyet.katlanmis("IŞIK"))
dogru("belirlenimci: aynı metin aynı sonuç", s("kahvaltıda yulaf yedim") == s("kahvaltıda yulaf yedim"))

print("Kayıt ayrıştırıcı: türler")
t, al = alan("5 km koştum 30 dakika")
dogru("koşu: 5 km, 30 dk", t == "antrenman" and al["mesafe_km"]["v"] == 5 and al["sure_dk"]["v"] == 30, al)
dogru("etkinlik adı fiilden: koşu / yürüyüş", al["etkinlik"] == "koşu"
      and s("Bugün 20 dakika yürüdüm")["kayit"]["alanlar"]["etkinlik"] == "yürüyüş", al)
t, al = alan("1 saat 20 dakika bisiklet sürdüm")
dogru("süre parçaları toplanır: 80 dk", t == "antrenman" and al.get("sure_dk", {}).get("v") == 80, (t, al))
t, al = alan("1,5 saat yüzdüm")
dogru("ondalık virgül: 90 dk", al.get("sure_dk", {}).get("v") == 90, al)
t, al = alan("yarım saat yoga yaptım")
dogru("«yarım saat»: 30 dk", t == "antrenman" and al["sure_dk"]["v"] == 30, (t, al))
t, al = alan("dün 7 saat uyudum")
dogru("uyku: 7 saat ölçüldü, dünün kaydı", t == "olcum" and al["olcum"] == "uyku" and al["deger"] == {"v": 7, "k": "measured"}
      and s("dün 7 saat uyudum")["kayit"]["gun"] == "2026-11-12", al)
t, al = alan("kilom 72,5")
dogru("kilo: 72.5 kg", t == "olcum" and al["olcum"] == "kilo" and al["deger"]["v"] == 72.5 and al["birim"] == "kg", al)
t, al = alan("2 litre su içtim")
dogru("su: 2 litre", t == "olcum" and al["olcum"] == "su" and al["deger"]["v"] == 2, (t, al))
t, al = alan("enerjim 4")
dogru("enerji puanı", t == "olcum" and al["olcum"] == "enerji" and al["deger"]["v"] == 4, (t, al))
t, al = alan("kahvaltıda yulaf ve muz yedim")
dogru("öğün: zaman ve içerik, kalori yok", t == "ogun" and al["ogun"] == "kahvalti" and "yulaf" in al["icerik"]
      and "kalori" not in al, al)
t, al = alan("öğlen 600 kalori tavuk pilav yedim")
dogru("öğün: söylenen kalori ölçülü", t == "ogun" and al["kalori"] == {"v": 600, "k": "measured"}, al)
t, al = alan("40 dakika matematik çalıştım")
dogru("çalışma oturumu: ders ve 40 dk", t == "oturum" and al["sure_dk"]["v"] == 40 and "matematik" in al["disiplin"], al)
t, al = alan("geometriden 30 soru çözdüm 4 yanlış")
dogru("soru oturumu: 30 soru, 4 yanlış, ders eksiz", t == "oturum" and al["soru"]["v"] == 30 and al["yanlis"]["v"] == 4
      and al["disiplin"] == "geometri", al)
t, al = alan("otuz soru çözdüm hepsi doğru")
dogru("sözle sayı: otuz → 30, hepsi doğru → 0 yanlış", al.get("soru", {}).get("v") == 30
      and al.get("yanlis", {}).get("v") == 0, al)
t, al = alan("20 sayfa okudum")
dogru("okuma: 20 sayfa", t == "oturum" and al["sayfa"]["v"] == 20, (t, al))
t, al = alan("deftere not: yarın erken kalk")
dogru("not beyanı: gövde olduğu gibi", t == "not" and al["govde"] == "yarın erken kalk", (t, al))

print("Kayıt değil (modele de kural motoruna da kayıt diye gitmez)")
for metin in ("Bugün 20 dakika yürüyecek miyim?", "yarın 5 km koşacağım", "kaç dakika yürüdüm", "dün ne yedim",
              "25 dakika matematik çalışalım", "planına 45 dakika ekle", "yürüyüş iyi gelir mi", ""):
    dogru("«%s» kayıt değil" % metin, niyet.kayit_ayristir(metin, SIMDI) is None and s(metin)["niyet"] != "kayit",
          s(metin))

print("Sayı uydurulmaz: yalnız söylenen ölçülür")
for metin in ("bugün yürüdüm", "kahvaltıda yulaf yedim", "koştum"):
    k = niyet.kayit_ayristir(metin, SIMDI)
    olculu = [a for a, v in (k or {}).get("alanlar", {}).items() if isinstance(v, dict)]
    dogru("«%s»: sayılı alan yok" % metin, k is None or not olculu, k)
for metin in ("Bugün 20 dakika yürüdüm", "5 km koştum 30 dakika", "geometriden 30 soru çözdüm 4 yanlış", "kilom 72,5"):
    k = niyet.kayit_ayristir(metin, SIMDI)
    sayilar = [v for v in k["alanlar"].values() if isinstance(v, dict)]
    dogru("«%s»: her sayı measured ve metinde var" % metin, sayilar and all(
        v["k"] == "measured" for v in sayilar), sayilar)

print("Niyet → masa: sohbet araçsız, kayıt modelsiz")
dogru("sohbet masasında kapı yok", katalog.model_araclari("sohbet") == [])
dogru("kayıt masasında kapı yok (model yolu yok)", katalog.model_araclari("kayit") == [])
for metin in ("merhaba King nasılsın", "kendimi başarısız hissediyorum", "netlerim neden artmıyor",
              "Platon'un mağara alegorisi ne anlatır"):
    dogru("«%s» → sohbet, araç yok" % metin, s(metin)["niyet"] == "sohbet"
          and katalog.model_araclari(s(metin)["niyet"]) == [], s(metin))
for n in niyet.NIYETLER:
    dogru("%s masası ≤ 12 kapı ve hepsi tanımlı" % n, len(katalog.NIYET_KAPILARI[n]) <= 12
          and all(k in katalog.KAPILAR for k in katalog.NIYET_KAPILARI[n]))

print("Anlama eğrisinin ikinci vekili")
v = niyet.vekil(katalog.KOD)
if v is None:
    print("  · sınav dosyası yok, atlandı")
else:
    dogru("vekil tahmin etiketli, oran 0..1", v["etiket"] == "tahmin" and 0 <= v["deger"] <= 1, v)
    dogru("vekil isabeti ≥ 0,85 (gerilemesin)", v["deger"] >= 0.85, v["deger"])

print("\n%s · kırmızı %d" % ("YEŞİL" if not kirmizi else "KIRMIZI", kirmizi))
sys.exit(1 if kirmizi else 0)
