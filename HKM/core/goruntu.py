"""Modul anlik goruntusunun SIRASI — hafiza (memory.esitle) ve hedef agi
(hedefag.goruntu_yaz) ayni kurali paylasir.

Modul goruntuyu BEKLEMEDEN yollar (brand/ortak/hafiza.js, hedefag.js);
varis sirasi gonderim sirasi degildir. Daemon is parcaciklidir ve
SQLite'in kilit beklemesi sira gozetmez: once yollanan goruntu sonra
uygulanabilir. Modulun 4 sn'lik iptali de sunucudaki uygulamayi
durdurmaz (busy_timeout 5 sn). Bu yuzden sira SUNUCUDA tutulur.

Modul sayfa basina bir `oturum` ve her gonderimde artan bir `sira`
yollar. Ayni kanal + modul + oturumda uygulanandan eski ya da ona esit
sira yok sayilir. Saat damgasi KULLANILMAZ: saat geri giderse butun
esitlemeler yok sayilirdi. Yeni oturum (sayfa yeniden acildi) ve
sirasiz goruntu (eski modul surumu) uygulanir.

Sinir: sayfa yeniden acilirken ESKI sayfanin yolda kalan goruntusu yeni
oturumunkinden sonra varirsa uygulanir (oturum farkli); bir sonraki
degisiklik ya da acilis onu duzeltir. Oturumlar arasi sirayi saatsiz
bilmenin yolu yok."""

MAX_OTURUM = 60
MAX_SIRA = 2 ** 53 - 1    # JS'nin tam sayi siniri; SQLite INTEGER'a da sigar
KANALLAR = ("hafiza", "hedef")
NOT = "Görüntünün oturumu ve sırası birlikte ve geçerli gelmeli."


def gecerli(oturum, sira):
    """Ya ikisi birden ya hicbiri. bool bir int'tir; True «1» diye gecmesin."""
    if oturum is None and sira is None:
        return True
    return (isinstance(oturum, str) and 1 <= len(oturum) <= MAX_OTURUM
            and isinstance(sira, int) and not isinstance(sira, bool)
            and 1 <= sira <= MAX_SIRA)


def eski_mi(con, kanal, modul, oturum, sira, at):
    """Goruntu eskiyse True ve hicbir sey yazmaz; degilse sirayi kaydeder
    ve False. Sirasiz goruntu hic eski degildir, tabloya dokunmaz.

    Yazma kilidinin ICINDE cagrilir (BEGIN IMMEDIATE): iki goruntu ayni
    anda «bundan yeniyim» diyemesin. Kilitsiz cagri bir yazilim hatasidir."""
    if kanal not in KANALLAR:
        raise ValueError("bilinmeyen goruntu kanali: %r" % (kanal,))
    if sira is None:
        return False
    if not con.in_transaction:
        raise RuntimeError("goruntu.eski_mi yazma kilidinin icinde cagrilir")
    son = con.execute("SELECT oturum, sira FROM goruntu_sira WHERE kanal=? AND modul=?",
                      (kanal, modul)).fetchone()
    if son is not None and son["oturum"] == oturum and sira <= son["sira"]:
        return True
    con.execute("INSERT INTO goruntu_sira(kanal, modul, oturum, sira, guncelleme) "
                "VALUES (?,?,?,?,?) ON CONFLICT(kanal, modul) DO UPDATE SET "
                "oturum=excluded.oturum, sira=excluded.sira, "
                "guncelleme=excluded.guncelleme", (kanal, modul, oturum, sira, at))
    return False
