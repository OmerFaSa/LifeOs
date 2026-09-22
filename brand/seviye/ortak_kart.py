def rutbe_kart_adi(kademe, adim):
    """Bir basamagin RUTBE KARTI dosya adi — uzantisiz.

    JS tarafindaki kuralin AYNISI (`kademeler.js`, `LIFEOS.MEDYA_ADI`):
    ad ekranda yazan ETIKETTEN turer, kucuk harf, nokta yerine tire.

        kademe 3, adim 2   ->  rutbe-3-2      (etiket «3.2»)
        kademe 6, adim 3   ->  rutbe-k300     (etiket «K300»)

    NEDEN BURADA BIR KOPYA VAR. Merkez profili uc sistemin rutbe
    kartlarini gosteriyor ve kart adini bilmek zorunda. Kurali elle
    ikinci kez yazmak, iki kopyanin bir gun ayrismasi demekti; bu
    dosya tek kaynaktir ve `tools/seviye.py --yay` ile merkeze
    yerlestirilir, `--denetle` ayrismayi yakalar ve CI'da kosar.

    Iki tarafta da AYNI ornekleri sinayan birer test var (JS:
    xp.test.js, Python: tests/test_profil.py). Kural bir gun degisirse
    once onlar kirilir.

    KUTSAL'DA NOKTA YOKTUR. Altinci kademenin basamaklari K100, K200 …
    diye adlanir; adim numarasi yuze carpilir. Kademe ya da adim
    beklenmedikse None doner — uydurma bir ad uretmek, olmayan bir
    dosyayi istemektir.
    """
    try:
        k, a = int(kademe), int(adim)
    except (TypeError, ValueError):
        return None
    if k < 1 or a < 1:
        return None
    if k == 6:
        return "rutbe-k%d" % (a * 100)
    return "rutbe-%d-%d" % (k, a)
