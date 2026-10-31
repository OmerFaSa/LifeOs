/* TÜRKÇE SAYI VE SÜRE — kullanıcının konuştuğu gibi yazdığı miktarı ve süreyi okur.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/turkcesayi.js`; `python3 tools/ortak.py --yay`
   ile üç arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   Kopyayı elle düzenleme: bir sonraki yayında kaybolur.

   ------------------------------------------------------------------
   NEDEN BU DOSYA VAR

   2026-11-01 taramasında aynı eksik dört yerde ayrı ayrı çıktı: SPİ
   hızlı giriş, AYS konuşarak giriş, ESP serbest oturum ve SPİ öğün
   girişi «1 saat 20 dk»yı 60, «yarım saat»i hiç okumuyordu. Ölçülen
   dakika XP'ye ve rozetlere gider; dört ayrı ayrıştırıcı dört ayrı
   yanlış demektir. Sayı ve süre burada BİR KEZ okunur.

   Sözler:
     1. Rakam («45», «1,5», «2.5») ve yazıyla sayı («bir», «yedi»,
        «yirmi beş») aynı sayıdır.
     2. «buçuk» yarım ekler («1 buçuk» = 1,5); «yarım» 0,5; «çeyrek» 0,25.
     3. «X saat Y dk» bileşiktir: 1 saat 20 dk = 80 dakika.
     4. Okunamayan şey null'dır; sıfır uydurulmaz. */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.TurkceSayi = (function(){
  const BIRLER = { bir:1, iki:2, 'üç':3, 'dört':4, 'beş':5, 'altı':6, yedi:7, sekiz:8, dokuz:9 };
  const ONLAR = { on:10, yirmi:20, otuz:30, 'kırk':40, elli:50, 'altmış':60, yetmiş:70, seksen:80, doksan:90 };
  const KESIR = { 'yarım':0.5, 'çeyrek':0.25 };
  const HARF = 'a-zçğıöşüâîû';

  /* Kelime sınırı: «on» «onay»ın, «bir» «birlikte»nin parçası değildir. */
  const kel = s => '(?<![' + HARF + '])(?:' + s + ')(?![' + HARF + '])';
  const YAZI = kel([...Object.keys(ONLAR), ...Object.keys(BIRLER)].join('|'));
  /* Bir sayı: rakam ya da yazı (onlar + birler), ardından isteğe bağlı «buçuk»; ya da yalnız «yarım/çeyrek». */
  const SAYI_KAYNAK = '(?:(\\d+(?:[.,]\\d+)?)|((?:' + YAZI + ')(?:\\s+' + YAZI + ')?))(\\s+buçuk)?|(' + kel('yarım|çeyrek') + ')';

  const kucuk = s => String(s == null ? '' : s).toLocaleLowerCase('tr');

  /* Yakalanan grupları sayıya çevirir. */
  function deger(rakam, yazi, bucuk, kesir){
    let n = null;
    if(rakam != null) n = parseFloat(rakam.replace(',', '.'));
    else if(yazi != null){
      n = 0;
      for(const k of yazi.trim().split(/\s+/)){
        if(k in ONLAR) n += ONLAR[k];
        else if(k in BIRLER) n += BIRLER[k];
        else return null;
      }
    } else if(kesir != null) return KESIR[kesir.trim()];
    if(n == null || !isFinite(n)) return null;
    return bucuk ? n + 0.5 : n;
  }

  /* Metindeki İLK miktar: { sayi, bas, son } ya da null. «1 buçuk porsiyon» → 1,5. */
  function miktar(metin){
    const t = kucuk(metin);
    const m = new RegExp(SAYI_KAYNAK).exec(t);
    if(!m) return null;
    const n = deger(m[1], m[2], m[3], m[4]);
    return n == null ? null : { sayi:n, bas:m.index, son:m.index + m[0].length };
  }

  const SAAT = '(saat|sa|s)(?![' + HARF + '])';
  const DAKIKA = '(dakika|dakka|dk)(?![' + HARF + '])';
  const SURE_RE = new RegExp('(?:' + SAYI_KAYNAK + ')\\s*(?:' + SAAT + '|' + DAKIKA + ')'
    + '(?:\\s*(?:ve\\s+)?(?:(\\d+)|(' + YAZI + '(?:\\s+' + YAZI + ')?))\\s*' + DAKIKA + ')?');

  /* Metindeki İLK süre, DAKİKA olarak: { dakika, bas, son } ya da null.
     «1 saat 20 dk» → 80 · «yarım saat» → 30 · «bir buçuk saat» → 90 · «45 dk» → 45. */
  function sure(metin){
    const t = kucuk(metin);
    const m = SURE_RE.exec(t);
    if(!m) return null;
    const n = deger(m[1], m[2], m[3], m[4]);
    if(n == null) return null;
    let dk = m[5] ? n * 60 : n;
    if(m[5] && (m[7] != null || m[8] != null)){
      const ek = m[7] != null ? parseInt(m[7], 10) : deger(null, m[8], null, null);
      if(ek == null) return null;
      dk += ek;
    }
    return { dakika:Math.round(dk * 100) / 100, bas:m.index, son:m.index + m[0].length };
  }

  /* Kısayol: yalnız dakika (ya da null). */
  const dakika = metin => { const s = sure(metin); return s ? s.dakika : null; };

  return { miktar, sure, dakika };
})();
