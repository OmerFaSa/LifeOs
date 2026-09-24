# -*- coding: utf-8 -*-
"""HKM'nin YUZU — uc arayuzle ayni sozu soyluyor mu.

HKM'nin yuzu TEK DOSYADIR (`HKM/web/index.html`): kendi CSS'i, kendi
JS'i, kendi isaretlemesi. Uc arayuzun yayin makinesine (`tools/ortak.py`)
bagli DEGIL ve olmamali — HKM onlarin yaninda durur, icinde degil
(AGENTS.md §1.4).

Ama bazi SOZLER ortaktir ve ayni kalmak zorundadir. Ortak olan dosya
degil, cumledir. Bu paket o cumleleri karsilastirir: biri degisip
oteki degismezse once bu testler kirilir.

Ayni desen `test_profil.py` icindeki `rutbe_kart_adi` testinde de var:
iki dil, iki dosya, AYNI ornekler.
"""

import re
from pathlib import Path

from tests.harness import eq, ok, suite, test

KOK = Path(__file__).resolve().parent.parent.parent
YUZ = KOK / "HKM" / "web" / "index.html"
TANITIM = KOK / "brand" / "ortak" / "tanitim.js"


def _yuz():
    return YUZ.read_text(encoding="utf-8")


def _js_dizi(metin, ad):
    """`var AD = [ '...', '...' ];` icindeki tek tirnakli dizeleri cikarir.

    Tam bir JS ayristiricisi degil ve olmasi da gerekmiyor: aranan sey
    elle yazilmis, tek tirnakli, duz bir dize listesi. Bicim degisirse
    bu yardimci bos doner ve test kirilir — sessizce gecmez."""
    m = re.search(r"var\s+%s\s*=\s*\[(.*?)\];" % ad, metin, re.S)
    if not m:
        return []
    govde = m.group(1)
    # Satir sonu ile birlestirilmis dizeleri ('a' + 'b') tek parca yap.
    govde = re.sub(r"'\s*\+\s*\n?\s*'", "", govde)
    return re.findall(r"'((?:[^'\\]|\\.)*)'", govde)


def _tanitim_hkm():
    metin = TANITIM.read_text(encoding="utf-8")
    m = re.search(r"hkm:\s*\[(.*?)\],\s*\n\s*\};", metin, re.S)
    if not m:
        return []
    return re.findall(r"'((?:[^'\\]|\\.)*)'", m.group(1))


def t_giris_seridi_uc_adim():
    """Giris ekraninda UC adim var ve ucu de bos degil."""
    g = _js_dizi(_yuz(), "GSERIT")
    eq(len(g), 3)
    for c in g:
        ok(len(c) > 10)


def t_giris_seridi_ortak_sozle_ayni():
    """HKM'nin uc cumlesi, uc arayuzun kaynagindakiyle AYNI.

    `brand/ortak/tanitim.js` uc arayuze yayilir; HKM oraya bagli
    degildir ve kendi kopyasini tasir. Ikisi ayrisirsa ayni sistem iki
    ekranda iki ayri sey soyler."""
    eq(_js_dizi(_yuz(), "GSERIT"), _tanitim_hkm())


def t_ikinci_adim_siniri_soyler():
    """IKINCI adim bu seridin var olma sebebi.

    HKM teshis koymaz, sertifika vermez, senin yerine karar almaz
    (AGENTS.md §1.5). Bu soz bir belgede degil, BAGLANMADAN ONCE
    gorulmeli. Adim dusarse once bu test kirilir."""
    g = _js_dizi(_yuz(), "GSERIT")
    eq(len(g), 3)
    ok(re.search(r"me[yz]|maz|mez", g[1]))


def t_paneller_okuyucuya_gorunmez():
    """Panellerin uzerinde yazi var ve o yazi okunamaz; cumle ALTTA
    gercek metin olarak durur. Panel `alt=""` ve `aria-hidden` olmali,
    yoksa ekran okuyucu bir afisle oyalanir."""
    metin = _yuz()
    m = re.search(r'<div class="gserit"(.*?)</div>\s*</div>', metin, re.S)
    ok(m is not None)
    serit = m.group(1)
    eq(serit.count('class="gserit__afis'), 3)
    eq(serit.count('aria-hidden="true"'), 3)
    eq(serit.count('alt=""'), 3)
    # Dosya yoksa YALNIZ o panel kalkar.
    eq(serit.count('onerror="this.remove()"'), 3)


def t_her_nokta_kendi_adini_soyler():
    """Nokta bir daire; ustunde yazi yok. Adini `aria-label` soyler,
    yoksa klavyeyle gezen biri ucunu de «dugme» diye duyar."""
    metin = _yuz()
    for no, soru in ((1, "Ne ölçüyoruz?"),
                     (2, "Neye karar vermiyoruz?"),
                     (3, "Nasıl başlıyoruz?")):
        ok('aria-label="%d/3 — %s"' % (no, soru) in metin)


def t_eski_tek_afis_kalkti():
    """Tek panelli eski afis artik cagrilmiyor.

    Dosya duruyor ama istek yapilmiyor; iki panel birden gosterilseydi
    giris ekrani iki kez ayni seyi soylerdi."""
    ok("/img/marka/tanitim-hkm.webp" not in _yuz())


def t_mikrofon_yazar_gondermez():
    """Fikir 1: sesle tek cumle. Mikrofon dugmesi VARSAYILAN GIZLIDIR
    (tarayici desteklemiyorsa hic gorunmez) ve taninan metni kutuya
    YAZAR; gonderen kullanicidir. Tanima dili Turkce."""
    metin = _yuz()
    for d in ("mikrofon", "bugun-mikrofon"):
        ok(re.search(r'<button id="%s" hidden aria-label="Sesle yaz"' % d, metin), d)
    govde = metin[metin.index("function mikrofonKur"):]
    govde = govde[:govde.index("mikrofonKur('mesaj'")]
    ok("tr-TR" in govde)
    ok("mesajGonder" not in govde)
    ok("/api/" not in govde)


def t_bugun_yerel_gun():
    """HKM yuzunun «bugun»u YEREL gundur: toISOString UTC'dir ve Turkiye'de
    gece 00:00–03:00 arasi dunu verir."""
    metin = _yuz()
    govde = metin[metin.index("function bugun()"):]
    govde = govde[:govde.index("}")]
    ok("toISOString" not in govde, govde)
    ok("getDate()" in govde)


def t_fis_yukleme():
    """Kullanici karari 2026-09-24: fis okuma. Yuz fotografi KUCULTUR
    (maliyet ve boyut), okunan tutari DUZENLENEBILIR onizlemede gosterir
    ve yalniz «Kaydet» ile yazar; «henuz yok» cumlesi kalkar."""
    metin = _yuz()
    ok('id="para-fis-dosya"' in metin and 'accept="image/*"' in metin)
    ok("'/api/para/fis'" in metin)
    ok("/kaydet'" in metin and "/iptal'" in metin)
    ok("toDataURL('image/jpeg'" in metin, "fotograf kucultulmuyor")
    ok("Fişin fotoğrafından okuma henüz yok" not in metin)
    ok("sen onaylamadan" in metin)


def t_para_sayfasi():
    """Para kolu (Y1): gezinmede, sayfasi ve formu var; ekran sayi hesaplamaz,
    HKM'nin cumlesini yazar."""
    metin = _yuz()
    ok('href="#/para" data-yol="para"' in metin)
    ok('data-bolme="para"' in metin and "yuklePara" in metin)
    ok("'para'" in metin[metin.index("var GORUNUMLER"):metin.index("var GORUNUMLER") + 200])



JETON = KOK / "brand" / "ortak" / "jeton.css"


def _kok_degerleri(metin, bas):
    """`bas` ile baslayan ilk blogun `--ad:deger;` ciftleri."""
    i = metin.index(bas)
    j = metin.index("}", i)
    return dict(re.findall(r"--([a-z0-9-]+)\s*:\s*([^;]+);", metin[i:j]))


def t_cekmeceler():
    """K7 (ekip/EKIP-PLANI §8-9): yedi cekmece bu ad ve sirayla; Profil ve
    Motto Ayarlar'in, Para Sistemler'in BOLUMU; her gorunume bir yoldan
    ulasilir; Ayarlar'in yedi paneli dort bolumde ve eski adreslerin hepsi
    bir bolume duser."""
    m = _yuz()
    gez = m[m.index('<nav class="gez" id="gez"'):]
    gez = gez[:gez.index("</nav>")]
    eq(re.findall(r'data-yol="([a-z]+)"', gez),
       ["bugun", "teklifler", "hedefler", "sistemler", "ofis", "sohbet", "ayarlar"])
    eq(re.findall(r'data-yol="[a-z]+"[^>]*>([^<]+)</a>', gez),
       ["Bugün", "Onaylar", "Hedefler", "Sistemler", "Ofis", "Sohbet", "Ayarlar"])
    ok('id="ayar-bag"' in gez)
    bc = m[m.index('<nav class="bolumcubugu"'):]
    bc = bc[:bc.index("</nav>")]
    gruplar = dict(re.findall(r'data-cekmece="([a-z]+)"[^>]*>(.*?)</div>', bc, re.S))
    eq(re.findall(r'data-yol="([a-z]+)"', gruplar["ayarlar"]), ["ayarlar", "profil", "motto"])
    eq(re.findall(r'data-yol="([a-z]+)"', gruplar["sistemler"]), ["sistemler", "para"])
    gor = re.findall(r"'([a-z]+)'", m[m.index("var GORUNUMLER"):m.index("];", m.index("var GORUNUMLER"))])
    erisilen = set(re.findall(r'data-yol="([a-z]+)"', gez + bc))
    eq(sorted(set(gor) - erisilen), [])
    sek = m[m.index('<div class="tabs" id="ayar-sekmeler">'):]
    sek = sek[:sek.index("</div>")]
    eq(re.findall(r'data-ayar="([a-z]+)"', sek), ["yapayzeka", "kanallar", "esikler", "sunucu"])
    eski = re.findall(r"'([a-z]+)'", m[m.index("var AYAR_SEKMELERI"):m.index("];", m.index("var AYAR_SEKMELERI"))])
    grup = m[m.index("var AYAR_GRUP"):m.index("};", m.index("var AYAR_GRUP"))]
    for s in eski:
        ok(s + ":" in grup)


def t_jetonlar_ortak():
    """K7a: yuz tek dosya kalir ve ortak dosyayi YUKLEMEZ; ama degerleri uc
    arayuzun v4 jetonlaridir. jeton.css'te biri degisirse burada kirilir.
    HKM Merkez'dir: tek vurgusu Merkez moru."""
    y = _kok_degerleri(_yuz(), ":root{")
    j = _kok_degerleri(JETON.read_text(encoding="utf-8"), ":root{")
    for hkm, ortak in [("bg", "bg"), ("yuzey", "surface"), ("fg", "text"), ("dim", "text-2"),
                       ("line", "border"), ("line-strong", "border-strong"),
                       ("ok", "ok-ink"), ("warn", "accent"), ("danger", "bad-ink"),
                       ("accent", "mer-ink"), ("mer-t", "mer-t"), ("yuzey-2", "surface-2")]:
        eq((hkm, y[hkm].strip().lower()), (hkm, j[ortak].strip().lower()))


def run():
    suite("HKM yüzü — giriş şeridi")
    test("üç adım vardır", t_giris_seridi_uc_adim)
    test("cümleler ortak sözle AYNI", t_giris_seridi_ortak_sozle_ayni)
    test("ikinci adım sınırı söyler", t_ikinci_adim_siniri_soyler)
    test("paneller okuyucuya görünmez", t_paneller_okuyucuya_gorunmez)
    test("her nokta kendi adını söyler", t_her_nokta_kendi_adini_soyler)
    test("eski tek afiş kalktı", t_eski_tek_afis_kalkti)
    test("mikrofon yazar, göndermez", t_mikrofon_yazar_gondermez)
    test("bugün yerel gündür", t_bugun_yerel_gun)
    test("para sayfası", t_para_sayfasi)
    test("yedi çekmece; bölümler; ayarlar dört bölüm (K7)", t_cekmeceler)
    test("jetonlar ortak değerlerde; vurgu Merkez moru (K7a)", t_jetonlar_ortak)
    test("fiş yükleme: önizleme, onay, küçültme", t_fis_yukleme)
