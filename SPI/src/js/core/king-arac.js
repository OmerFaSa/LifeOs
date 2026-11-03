/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/king-arac.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* KING · araçlar: öncelik, not, ritüel, yük, günlük, deney, araç kutusu, yetki, araç kataloğu, ayarlar.
   Parça 6/8; yükleme sırası: king.js, king-ses.js, king-kayit.js, king-gorunum.js, king-kart.js, king-arac.js, king-devrim.js, king-yol.js.
   Dosyalar arası ortak adlar ve ortak durum window.LIFEOS.KING_IC'tedir (KI.ad). */

(function(){
  'use strict';

  const KI = window.LIFEOS.KING_IC;


  /* ---------- söz 34: öncelik, notlar, ritüel, yük, günlük, deney ---------- */
  const D = () => (KI.L.DEFTER && KI.L.DEFTER.kuruluMu && KI.L.DEFTER.kuruluMu()) ? KI.L.DEFTER : null;
  const ONCELIK_RE = /(neye çalışayım|ne çalışayım|neye çalışmalıyım|öncelikli konu|hangi konuya çalış|hangi konuya öncelik|öncelik vermeliyim|puan getir|en çok puan)/;
  async function oncelikIsle(metin){
    KI.akis.push({ kim:'sen', metin:String(metin).trim() }); KI.cipler = null;
    const K = KI.ayar && KI.ayar.kartlar;
    if(!K || typeof K.oncelik !== 'function'){ KI.soyle('Öncelik listesi AYS’de; AYS’de «neye çalışayım» diyebilirsin.'); return { tur:'oncelik-yok' }; }
    let l = [];
    try{ l = (await K.oncelik()) || []; }catch(e){ l = []; }
    l = l.filter(x => x && x.ad).slice(0, 5);
    if(!l.length){ KI.soyle('Henüz öncelik çıkaracak veri yok: deneme yanlışı ya da çözülmüş soru kaydı gerekiyor.'); return { tur:'oncelik-bos' }; }
    KI.soyle('Şu konular en çok puan kurtarır (sınavda çıkma sıklığı × senin hatan; AYS’nin hesabı):', null, null, null,
      { sirali:l.map(x => ({ ad:String(x.ad), ust:String(x.ders || ''), alt:String(x.neden || ''), puan:x.puan, ham:x })) });
    return { tur:'oncelik', n:l.length };
  }
  function siraliHtml(m, n){
    if(!m.sirali || !m.sirali.length) return '';
    const acilir = !!(KI.ayar && KI.ayar.kartlar && typeof KI.ayar.kartlar.oncelikAc === 'function');
    return '<ol class="king__sirali">' + m.sirali.map((x, i) => '<li class="king__sira">'
      + '<span class="king__sira-no">' + (i + 1) + '</span>'
      + '<div class="king__sira-govde"><b>' + KI.kac(x.ad) + '</b>' + (x.ust ? '<small>' + KI.kac(x.ust) + '</small>' : '')
      + (x.alt ? '<span>' + KI.kac(x.alt) + '</span>' : '') + '</div>'
      + (acilir ? '<button type="button" class="king__cip" data-king="sira-ac:' + n + ':' + i + '">Öğren’de aç</button>' : '')
      + '</li>').join('') + '</ol>';
  }
  /* Not arama: Defter'in kendi deposu; puan = sorgu sözcüklerinin geçişi. */
  const NOT_RE = /(notlarım(?:da|ı|dan)? (?:ara|bul|bak|göre)|notlarımda|notlarımdan|not almıştım|not aldığım|notlarıma göre|notumda|notlarımı (?:ara|özetle))/;
  const NOT_DOLGU = /(^|\s)(notlarım(?:da|ı|dan|a)?|notumda|not|almıştım|aldığım|göre|ara|bul|bak|özetle|ne|neler|nedir|hakkında|ile|ilgili|bana|benim|bir|şey|geçen|hafta|söyle|mısın|misin|var|mı|mi|daha|önce|yazmıştım)(?=\s|$)/g;
  function notPuanla(liste, kelimeler){
    const k = s => String(s || '').toLocaleLowerCase('tr');
    return (liste || []).map(n => {
      const b = k(n.baslik), g = k(n.govde);
      const puan = kelimeler.reduce((p, w) => p + (b.indexOf(w) >= 0 ? 3 : 0) + (g.indexOf(w) >= 0 ? 1 : 0), 0);
      return { n, puan };
    }).filter(x => x.puan > 0).sort((a, b) => b.puan - a.puan).slice(0, 3).map(x => x.n);
  }
  function parcaOf(govde, kelimeler, en){
    const g = String(govde || '').replace(/\s+/g, ' ');
    const kg = g.toLocaleLowerCase('tr');
    let i = kelimeler.reduce((m, w) => { const j = kg.indexOf(w); return j >= 0 && (m < 0 || j < m) ? j : m; }, -1);
    if(i < 0) i = 0;
    const bas = Math.max(0, i - 80);
    return (bas ? '…' : '') + g.slice(bas, bas + (en || 600)) + (g.length > bas + (en || 600) ? '…' : '');
  }
  async function notAra(metin, t0){
    KI.akis.push({ kim:'sen', metin:String(metin).trim() }); KI.cipler = null;
    const Df = D();
    if(!Df){ KI.soyle('Defter bu modülde kurulu değil; notlarına buradan bakamam.'); return { tur:'not-yok' }; }
    const kelimeler = t0.replace(/[.,!?;:«»"']/g, ' ').replace(NOT_DOLGU, ' ').replace(NOT_DOLGU, ' ').split(/\s+/).filter(w => w.length >= 3);
    let liste = [];
    try{ liste = (await Df.yukle()) || []; }catch(e){ liste = []; }
    const bulunan = kelimeler.length ? notPuanla(liste, kelimeler) : [];
    if(!bulunan.length){ KI.soyle(kelimeler.length ? '«' + kelimeler.join(' ') + '» geçen bir not bulamadım.' : 'Notlarında neyi arayayım? Örneğin «notlarımda türev».'); return { tur:'not-bos' }; }
    const kaynak = bulunan.map(n => 'Kaynak: ' + (n.baslik || 'Başlıksız not'));
    KI.cipler = [{ ad:'Defteri aç', is:'defter-ac' }];
    if(!KI.baglanti()){
      KI.soyle('Notlarında bunları buldum:', bulunan.map(n => (n.baslik || 'Başlıksız not') + ' — ' + parcaOf(n.govde, kelimeler, 140)));
      return { tur:'not-liste', n:bulunan.length };
    }
    const bek = { kim:'king', bekliyor:true, metin:'' };
    KI.akis.push(bek); KI.ciz(false);
    const istem = 'Kullanıcının kendi notlarından parçalar aşağıda. YALNIZ bu notlara dayanarak cevap ver; notlarda olmayanı «notlarında yok» de, uydurma.\n\n'
      + bulunan.map((n, i) => '[' + (i + 1) + '] ' + (n.baslik || 'Başlıksız not') + ': ' + parcaOf(n.govde, kelimeler, 600)).join('\n\n')
      + '\n\nSoru: ' + String(metin).trim();
    const r = await KI.merkezeSor(istem, bek);
    KI.akis = KI.akis.filter(m => m !== bek);
    if(r.ok) KI.soyle(r.text, kaynak, null, null, r.akti ? { yeni:false, okunan:r.okunan } : null);
    else KI.soyle('Merkez cevap vermedi; bulduğum notlar:', bulunan.map(n => (n.baslik || 'Başlıksız not') + ' — ' + parcaOf(n.govde, kelimeler, 140)));
    KI.cipler = [{ ad:'Defteri aç', is:'defter-ac' }];
    KI.ciz(false);
    return { tur:'not-cevap', n:bulunan.length };
  }
  /* Haftalık ritüel: rapor + üç soru; cevaplar Defter'e, hedef açılışa. */
  const RITIM_RE = /(haftalık gözden geçirme|haftayı gözden geçir|haftalık ritüel|hafta sonu değerlendirmesi)/;
  const RITIM_SORU = ['Bu hafta ne iyi gitti?', 'Ne zorladı?', 'Gelecek haftanın tek hedefi ne olsun?'];
  const HEDEF = 'lifeos.king.hafta-hedef';
  KI.ritim = null;
  function haftaBasi(){
    const d = new Date(KI.ortam.simdi().getTime());
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function haftaHedefi(){ const v = KI.ortam.depo.oku(HEDEF); return v && v.metin && v.hafta >= haftaBasi() ? String(v.metin) : ''; }
  async function ritimBaslat(metin){
    KI.ritim = { cevaplar:[] };
    await KI.merkezKomut(metin, 'hafta', 'Haftalık rapor');
    KI.soyle(RITIM_SORU[0] + ' (Üç kısa soru; «vazgeç» dersen bırakırım.)');
    return { tur:'ritim' };
  }
  async function ritimIsle(metin){
    KI.akis.push({ kim:'sen', metin:String(metin).trim() }); KI.cipler = null;
    if(/^(vazgeç|bırak|iptal|sonra)/.test(KI.kucuk(metin))){ KI.ritim = null; KI.soyle('Tamam, gözden geçirmeyi bıraktım.'); return { tur:'ritim-dur' }; }
    KI.ritim.cevaplar.push(String(metin).trim());
    if(KI.ritim.cevaplar.length < RITIM_SORU.length){ KI.soyle(RITIM_SORU[KI.ritim.cevaplar.length]); return { tur:'ritim' }; }
    const c = KI.ritim.cevaplar;
    KI.ritim = null;
    const hedef = c[2].slice(0, 200);
    KI.ortam.depo.yaz(HEDEF, { hafta:nextHafta(), metin:hedef });      // pazar: gelecek hafta; öteki günler: bu hafta
    let notOldu = false;
    const Df = D();
    if(Df){
      try{ await Df.yeni('Haftalık gözden geçirme · ' + KI.bugunISO(), RITIM_SORU.map((q, i) => '## ' + q + '\n' + c[i]).join('\n\n'), 'not'); notOldu = true; }catch(e){ notOldu = false; }
    }
    KI.soyle('Kaydettim' + (notOldu ? ' (Defter’e not oldu)' : '') + '. Haftanın hedefi: «' + hedef + '». Her sabah açılışta hatırlatacağım.');
    return { tur:'ritim-bitti' };
  }
  function nextHafta(){
    const d = new Date(KI.ortam.simdi().getTime());
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + (d.getDay() === 0 ? 7 : 0));
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  /* Yük: modülün son 7 gün / önceki 7 gün kartları ve sinyali. */
  const YUK_RE = /(yük durumu|yüküm|yük göstergesi|çok mu yükleniyorum|tükeniyor muyum|yoruldum mu)/;
  function yukIsle(metin){
    KI.akis.push({ kim:'sen', metin:String(metin).trim() }); KI.cipler = null;
    const K = KI.ayar && KI.ayar.kartlar;
    let y = null;
    try{ y = K && typeof K.yuk === 'function' ? K.yuk() : null; }catch(e){ y = null; }
    if(!y || !Array.isArray(y.kartlar) || !y.kartlar.length){ KI.soyle('Bu modülde yük göstergesi yok; AYS ve SPİ’de var.'); return { tur:'yuk-yok' }; }
    const l = y.kartlar.filter(x => x && x.ad).map(KI.kartTemiz);
    KI.soyle(y.sinyal || 'Son 7 gün, önceki 7 güne göre belirgin bir yük artışı görünmüyor.', null, null, null, { kartlar:l, bulgu:!!y.sinyal });
    return { tur:'yuk', sinyal:!!y.sinyal };
  }
  /* Günlük: anlattığın Defter'e; his (1–5) senin beyanın. */
  const GUNLUK_RE = /(günlük yazalım|günlüğe yaz|akşam günlüğü|günlük tutalım|bugünü anlatayım)/;
  KI.gunlukBekle = false; KI.gunlukMetin = '';
  async function gunlukIsle(metin){
    KI.akis.push({ kim:'sen', metin:String(metin).trim() });
    const t = KI.kucuk(metin);
    if(/^(vazgeç|bırak|iptal)/.test(t)){ KI.gunlukBekle = false; KI.gunlukMetin = ''; KI.cipler = null; KI.soyle('Tamam, günlüğü bıraktım.'); return { tur:'gunluk-dur' }; }
    if(!KI.gunlukMetin){
      KI.gunlukMetin = String(metin).trim();
      KI.cipler = [1, 2, 3, 4, 5].map(n => ({ ad:String(n), is:'gunluk-his:' + n })).concat([{ ad:'Geç', is:'gunluk-his:0' }]);
      KI.soyle('Not aldım. Bugünkü hissin 1 ile 5 arasında kaç? (5 çok iyi; istersen geç.)');
      return { tur:'gunluk-his' };
    }
    return gunlukBitir(/^[1-5]$/.test(t) ? Number(t) : 0);
  }
  async function gunlukBitir(his){
    const metin = KI.gunlukMetin;
    KI.gunlukBekle = false; KI.gunlukMetin = ''; KI.cipler = null;
    let ok = false;
    const Df = D();
    if(Df && metin){
      try{ await Df.yeni('Günlük · ' + KI.bugunISO(), metin + (his ? '\n\nHis: ' + his + '/5 (benim beyanım)' : ''), 'not'); ok = true; }catch(e){ ok = false; }
    }
    KI.soyle(ok ? 'Günlüğe yazdım (Defter).' + (his ? ' Hissin: ' + his + '/5.' : '') : 'Günlüğü kaydedemedim.');
    return { tur:'gunluk-bitti', his };
  }
  /* Kişisel deney: önceki dönem ile deney dönemi, modülün günlük ölçüsüyle. */
  const DENEY = () => 'lifeos.king.deney.' + ((KI.ayar && KI.ayar.modul) || 'x');
  const DENEY_RE = /deney başlat(?:alım)?\s*:?\s*(.*)$/;
  const DENEY_DURUM_RE = /(deney(?:im)? (?:durumu|nasıl gidiyor|sonucu|bitti mi)|deneyi bitir)/;
  const DENEY_GUN = 14, DENEY_EN_AZ = 5;
  KI.deneyTaslak = null;
  function deneyOku(){ const v = KI.ortam.depo.oku(DENEY()); return v && v.baslangic && v.olcu ? v : null; }
  function gunISO(d){ return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function gunKaydir(iso, n){ const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return gunISO(d); }
  function deneyBaslat(metin, kural){
    KI.akis.push({ kim:'sen', metin:String(metin).trim() }); KI.cipler = null;
    const O = KI.ayar && KI.ayar.kartlar && KI.ayar.kartlar.olcu;
    if(!O || !Array.isArray(O.liste) || !O.liste.length){ KI.soyle('Bu modülde deney için ölçü yok.'); return { tur:'deney-yok' }; }
    if(deneyOku()){ KI.soyle('Süren bir deney var; önce «deneyi bitir» de.'); return { tur:'deney-var' }; }
    KI.deneyTaslak = { kural:String(kural || '').trim().slice(0, 160) || 'kendi kuralın' };
    KI.cipler = O.liste.map(o => ({ ad:o.ad, is:'deney-olcu:' + o.id }));
    KI.soyle('Deney: «' + KI.deneyTaslak.kural + '». ' + DENEY_GUN + ' gün süreceğim. Neyle ölçelim?');
    return { tur:'deney-olcu' };
  }
  function deneyOlcuSec(id){
    const O = KI.ayar && KI.ayar.kartlar && KI.ayar.kartlar.olcu;
    const o = O && O.liste.find(x => x.id === id);
    if(!o || !KI.deneyTaslak) return false;
    const v = { kural:KI.deneyTaslak.kural, olcu:o.id, olcuAd:o.ad, birim:o.birim || '', baslangic:KI.bugunISO(), gun:DENEY_GUN };
    KI.deneyTaslak = null; KI.cipler = null;
    KI.ortam.depo.yaz(DENEY(), v);
    KI.soyle('Başladı: ' + v.gun + ' gün «' + v.kural + '», ölçü ' + v.olcuAd + '. Sonunda önceki ' + v.gun + ' günle karşılaştıracağım.');
    return true;
  }
  function deneyHesap(v){
    const O = KI.ayar && KI.ayar.kartlar && KI.ayar.kartlar.olcu;
    const ortala = (bas, n) => { const l = [];
      for(let i = 0; i < n; i++){ let x = null; try{ x = O.deger(v.olcu, gunKaydir(bas, i)); }catch(e){ x = null; }
        if(typeof x === 'number' && isFinite(x)) l.push(x); }
      return { n:l.length, ort:l.length ? Math.round(l.reduce((a, b) => a + b, 0) / l.length * 10) / 10 : null }; };
    const gecen = Math.max(0, Math.round((new Date(KI.bugunISO() + 'T12:00:00') - new Date(v.baslangic + 'T12:00:00')) / 864e5));
    return { once:ortala(gunKaydir(v.baslangic, -v.gun), v.gun), sira:ortala(v.baslangic, Math.min(v.gun, gecen + 1)), gecen };
  }
  function deneyDurum(metin){
    KI.akis.push({ kim:'sen', metin:String(metin).trim() }); KI.cipler = null;
    const v = deneyOku();
    if(!v){ KI.soyle('Süren bir deney yok. «deney başlat 23:00’te yatacağım» gibi başlatabilirsin.'); return { tur:'deney-yok' }; }
    const h = deneyHesap(v), bitir = /bitir/.test(KI.kucuk(metin)) || h.gecen >= v.gun;
    const fark = h.once.ort != null && h.sira.ort != null ? Math.round((h.sira.ort - h.once.ort) * 10) / 10 : null;
    const yeter = h.once.n >= DENEY_EN_AZ && h.sira.n >= DENEY_EN_AZ;
    const kart = [
      { ad:'Önce · ' + v.olcuAd, deger:h.once.ort, birim:v.birim, etiket:'hesaplandı', alt:h.once.n + ' gün veri' },
      { ad:'Deney · ' + v.olcuAd, deger:h.sira.ort, birim:v.birim, etiket:'hesaplandı', alt:h.sira.n + ' gün veri' },
      { ad:'Fark', deger:fark != null ? (fark > 0 ? '+' : '') + fark : null, birim:v.birim, etiket:'hesaplandı' },
    ].map(KI.kartTemiz);
    if(bitir) KI.ortam.depo.sil(DENEY());
    KI.soyle((bitir ? 'Deney bitti' : 'Deney sürüyor (' + Math.min(h.gecen + 1, v.gun) + '/' + v.gun + ' gün)') + ': «' + v.kural + '». '
      + (yeter ? 'Bu bir gözlem; tek kişilik deney neden-sonuç kanıtı değildir.' : 'Karşılaştırma için veri yetersiz (her dönemde en az ' + DENEY_EN_AZ + ' gün gerekir).'),
      null, null, null, { kartlar:kart, bulgu:true });
    return { tur:bitir ? 'deney-bitti' : 'deney-durum', yeter };
  }

  /* ======================================================================
     ARAÇ KUTUSU (kullanıcı, 2026-10-23: «araçları bir sürü arttır, güzel işe
     yarayan şeyler»). Hepsi cihazda, modelsiz; sonucu KOD hesaplar:
       hesapla        «hesapla: 15*4+2», yüzde «200*%15» — eval yok, küçük ayrıştırıcı
       birim çevir    «5 km kaç mil», «70 kg kaç lb», «30 c kaç f», «90 dk kaç saat»
       tarih          «45 gün sonra hangi gün», «19 haziran kaç gün kaldı»
       yapılacaklar   «yapılacak: fatura öde», «yapılacaklarım» (TASINAN'da)
       hatırlatıcı    «20 dakika sonra hatırlat: çamaşır», «saat 18:30 hatırlat: ilaç»
                      sayfa açıkken zamanında bildirim; kapalıyken açılınca söyler
       karar ver      «karar ver: pizza, makarna, çorba»
       nefes          «nefes egzersizi» — kutu nefesi (4 al, 4 tut, 4 ver, 4 tut)
     ====================================================================== */
  const sayiTr = v => (Math.round(v * 1e8) / 1e8).toLocaleString('tr-TR', { maximumFractionDigits:8 });
  const HESAP_RE = /^(?:hesapla|hesap et|hesap)\s*:?\s*(.+?)\s*(?:=|\?|kaç eder|kaç)?\s*$/;
  /* Saf: «15*4+2» → 62; geçersizse null. Toplama, çıkarma, çarpma, bölme, üs (^), parantez, sondaki % (yüzde). */
  function hesapla(s){
    const t = String(s || '').replace(/(\d)\s*[x×]\s*(?=[\d(])/g, '$1*').replace(/÷|:/g, '/').replace(/,/g, '.').replace(/\s+/g, '');
    if(!t || t.length > 120 || !/^[\d.+\-*/^%()]+$/.test(t)) return null;
    let i = 0;
    const sayi = () => { const m = t.slice(i).match(/^\d+(?:\.\d+)?/); if(!m) throw new Error('sayı'); i += m[0].length; return Number(m[0]); };
    const birim = () => {
      if(t[i] === '-'){ i++; return -birim(); }
      if(t[i] === '+'){ i++; return birim(); }
      if(t[i] === '%'){ i++; return birim() / 100; }        // Türkçe yazım: %18
      let v;
      if(t[i] === '('){ i++; v = toplam(); if(t[i] !== ')') throw new Error(')'); i++; }
      else v = sayi();
      while(t[i] === '%'){ i++; v /= 100; }
      return v;
    };
    const us = () => { const v = birim(); if(t[i] === '^'){ i++; return Math.pow(v, us()); } return v; };
    const carpim = () => { let v = us(); while(t[i] === '*' || t[i] === '/'){ const o = t[i++], w = us(); v = o === '*' ? v * w : v / w; } return v; };
    const toplam = () => { let v = carpim(); while(t[i] === '+' || t[i] === '-'){ const o = t[i++], w = carpim(); v = o === '+' ? v + w : v - w; } return v; };
    try{ const v = toplam(); return i === t.length && isFinite(v) ? v : null; }catch(e){ return null; }
  }
  const BIRIM = (() => {
    const b = {};
    const ekle = (tur, carpan, ...adlar) => adlar.forEach(a => { b[a] = { tur, carpan, ad:adlar[0] }; });
    ekle('uzunluk', 1000, 'km', 'kilometre'); ekle('uzunluk', 1, 'm', 'metre'); ekle('uzunluk', 0.01, 'cm', 'santim', 'santimetre');
    ekle('uzunluk', 0.001, 'mm', 'milimetre'); ekle('uzunluk', 1609.344, 'mil'); ekle('uzunluk', 0.3048, 'ft', 'fit', 'feet', 'ayak');
    ekle('uzunluk', 0.0254, 'inç', 'inc', 'inch'); ekle('uzunluk', 0.9144, 'yarda', 'yard');
    ekle('kütle', 1, 'g', 'gram'); ekle('kütle', 1000, 'kg', 'kilo', 'kilogram'); ekle('kütle', 0.001, 'mg', 'miligram');
    ekle('kütle', 453.59237, 'lb', 'libre', 'pound'); ekle('kütle', 28.349523125, 'ons', 'oz'); ekle('kütle', 1e6, 'ton');
    ekle('hacim', 1, 'l', 'lt', 'litre'); ekle('hacim', 0.001, 'ml', 'mililitre'); ekle('hacim', 3.785411784, 'galon', 'gal');
    ekle('süre', 1, 'sn', 'saniye'); ekle('süre', 60, 'dk', 'dakika'); ekle('süre', 3600, 'sa', 'saat');
    ekle('süre', 86400, 'gün'); ekle('süre', 604800, 'hafta');
    ekle('sıcaklık', 'c', 'c', '°c', 'santigrat', 'derece'); ekle('sıcaklık', 'f', 'f', '°f', 'fahrenhayt', 'fahrenheit'); ekle('sıcaklık', 'k', 'k', 'kelvin');
    return b;
  })();
  const BIRIM_RE = /^(-?\d+(?:[.,]\d+)?)\s*([a-zçğıöşü°]+)\s+(?:kaç|ne kadar|=|->|eşittir)\s*([a-zçğıöşü°]+)\s*(?:eder|yapar)?\s*\??$/;
  /* Saf: (5, 'km', 'mil') → { deger, a, b } ya da null (bilinmeyen ya da farklı tür). */
  function birimCevir(v, a, b){
    const x = BIRIM[a], y = BIRIM[b];
    if(!x || !y || x.tur !== y.tur) return null;
    if(x.tur === 'sıcaklık'){
      const c = x.carpan === 'c' ? v : x.carpan === 'f' ? (v - 32) * 5 / 9 : v - 273.15;
      return { deger:y.carpan === 'c' ? c : y.carpan === 'f' ? c * 9 / 5 + 32 : c + 273.15, a:x.ad.toUpperCase(), b:y.ad.toUpperCase() };
    }
    return { deger:v * x.carpan / y.carpan, a:x.ad, b:y.ad };
  }
  const AYLAR = ['ocak', 'şubat', 'mart', 'nisan', 'mayıs', 'haziran', 'temmuz', 'ağustos', 'eylül', 'ekim', 'kasım', 'aralık'];
  const GUNLER = ['pazar', 'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi'];
  const TARIH_ILERI_RE = /^(\d{1,4})\s*(gün|hafta|ay)\s*(sonra|önce)(?:\s*(?:hangi gün|hangi tarih|ne zaman|günlerden ne))?\s*\??$/;
  const TARIH_KALAN_RE = new RegExp('^(\\d{1,2})\\s+(' + AYLAR.join('|') + ')(?:\\s+(\\d{4}))?\\S*\\s+(?:kaç gün|ne kadar)');
  const tarihYazTr = d => d.getDate() + ' ' + AYLAR[d.getMonth()] + ' ' + d.getFullYear() + ', ' + GUNLER[d.getDay()];
  function gunFarki(a, b){ return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 864e5); }

  const YAP = 'lifeos.king.yapilacak';
  const YAP_EKLE_RE = /^(?:yapılacak|yapılacaklara ekle|listeye ekle|todo)\s*:\s*(.+)$/;
  const YAP_LISTE_RE = /^(yapılacaklar(?:ım)?|yapılacak listem|listem)\s*[?.!]*$/;
  const YAP_TEMIZ_RE = /^(yapılanları|bitenleri|yapılacakları) temizle\s*[.!]*$/;
  function yapilacaklar(){ const l = KI.ortam.depo.oku(YAP); return Array.isArray(l) ? l.filter(x => x && x.id && x.metin) : []; }
  function yapYaz(l){ if(l.length) KI.ortam.depo.yaz(YAP, l.slice(-60)); else KI.ortam.depo.sil(YAP); }
  function yapHtml(m){
    if(!m.yap) return '';
    const l = yapilacaklar();
    if(!l.length) return '<p class="king__gunum-not">Liste boş. «yapılacak: …» diye ekle.</p>';
    return '<ul class="king__yap">' + l.map(x => '<li><button type="button" class="king__yap-is' + (x.bitti ? ' is-bitti' : '') + '" data-king="yap:' + KI.kac(x.id)
      + '" aria-pressed="' + (x.bitti ? 'true' : 'false') + '"><i aria-hidden="true"></i><span>' + KI.kac(x.metin) + '</span></button></li>').join('') + '</ul>';
  }

  const HATIR = 'lifeos.king.hatirlat';
  const HATIR_SURE_RE = /^(\d{1,3})\s*(dk|dakika|sa|saat)\s*sonra\s*(?:bana\s*)?(?:hatırlat|haber ver|söyle)\s*:?\s*(.*)$/;
  const HATIR_SAAT_RE = /^saat\s*(\d{1,2})[:.](\d{2})\S*\s*(?:bana\s*)?(?:hatırlat|haber ver)\s*:?\s*(.*)$/;
  const HATIR_LISTE_RE = /^hatırlatma(?:larım|lar)\s*[?.!]*$/;
  KI.hatirSaat = null;
  function hatirlatmalar(){ const l = KI.ortam.depo.oku(HATIR); return Array.isArray(l) ? l.filter(x => x && x.id && x.zaman) : []; }
  function hatirYaz(l){ if(l.length) KI.ortam.depo.yaz(HATIR, l.slice(-30)); else KI.ortam.depo.sil(HATIR); }
  /* Vadesi gelenleri söyler; en yakını için tek zamanlayıcı kurar (gerçek setTimeout: sınama sahte zamanlamayı kullanmaz). */
  function hatirlatKur(){
    if(KI.hatirSaat){ try{ clearTimeout(KI.hatirSaat); }catch(e){ /* yok */ } KI.hatirSaat = null; }
    const simdi = KI.ortam.simdi().getTime(), l = hatirlatmalar();
    const gelen = l.filter(x => Date.parse(x.zaman) <= simdi);
    if(gelen.length){
      hatirYaz(l.filter(x => gelen.indexOf(x) < 0));
      gelen.forEach(x => {
        KI.ortam.bildir('LifeOS · hatırlatma', x.metin);
        if(KI.acik) KI.soyle('Hatırlatma: ' + x.metin);
        else{ KI.akis.push({ kim:'king', metin:'Hatırlatma: ' + x.metin }); KI.sakla(); }
      });
    }
    const sonraki = hatirlatmalar().map(x => Date.parse(x.zaman)).sort((a, b) => a - b)[0];
    if(sonraki && typeof setTimeout === 'function' && sonraki - simdi < 864e5) KI.hatirSaat = setTimeout(hatirlatKur, Math.max(1000, sonraki - simdi));
  }
  const KARAR_RE = /^(?:rastgele seç|karar ver|birini seç|seç)\s*:\s*(.+)$/;
  function rastgele(n){
    try{ const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }catch(e){ return Math.floor(Math.random() * n); }
  }
  const NEFES_RE = /^(nefes egzersizi|kutu nefesi|nefes alalım|nefes çalışması|sakinleşmem lazım)\s*[?.!]*$/;
  function nefesHtml(m){
    if(!m.nefes) return '';
    return '<div class="king__nefes" role="img" aria-label="Kutu nefesi: 4 saniye al, 4 tut, 4 ver, 4 tut; dört tur">'
      + '<span class="king__nefes-daire" aria-hidden="true"></span>'
      + '<span class="king__nefes-yazi" aria-hidden="true"><b>Al</b><b>Tut</b><b>Ver</b><b>Tut</b></span>'
      + '<small>4 al · 4 tut · 4 ver · 4 tut · dört tur, yaklaşık bir dakika</small></div>';
  }
  const ZAR_RE = /^(?:([1-6])\s*)?zar at\s*[?.!]*$/;
  const YT_RE = /^(?:yazı tura(?: at)?|yazı mı tura mı|para at)\s*[?.!]*$/;
  const SAYI_RE = /^(-?\d+)\s*(?:ile|ila|-)\s*(-?\d+)\s*arası(?:nda)?\s*(?:rastgele\s*)?(?:bir\s*)?sayı(?:\s*(?:seç|tut|ver|söyle))?\s*[?.!]*$/;
  const BOL_RE = /^(?:hesabı böl|hesap böl)\s*:?\s*(\d+(?:[.,]\d+)?)\s*(?:tl|₺)?\s*(?:\/|kişiye|,)\s*(\d+)\s*(?:kişi(?:ye)?)?\s*$/;
  const KELIME_RE = /^(?:kelime say|kelimeleri say|karakter say)\s*:\s*([\s\S]+)$/i;
  const YAS_RE = /^yaş hesapla\s*:?\s*(\d{1,2})[./](\d{1,2})[./](\d{4})\s*$|^(\d{1,2})[./](\d{1,2})[./](\d{4})\s*(?:doğumluyum|doğumlu)?\s*(?:kaç yaşındayım|yaşım kaç)\s*[?.!]*$/;
  const VKI_RE = /^(?:vki|bmi|beden kitle(?: indeksi)?)\s*:?\s*(\d+(?:[.,]\d+)?)\s*kg\s*(\d+(?:[.,]\d+)?)\s*(cm|m)\s*$/;
  /* «boyum 1.80 kilom 78, vücut kitle indeksim kaç»: aynı hesap, günlük cümleyle. */
  const VKI_CUMLE = /(?=.*(?:vki|bmi|(?:vücut|beden) kitle))(?=.*boyum\s*(\d+(?:[.,]\d+)?)\s*(cm|m)?(?![a-zçğıöşü]))(?=.*kilom\s*(\d+(?:[.,]\d+)?))/;
  const vkiCumle = t => { const m = t.match(VKI_CUMLE); return m ? [m[0], m[3], m[1], m[2] || (Number(String(m[1]).replace(',', '.')) > 3 ? 'cm' : 'm')] : null; };
  const SIFRE_RE = /^(?:şifre üret|parola üret|güçlü şifre(?: üret)?)\s*(\d{1,2})?\s*[?.!]*$/;
  const KART_YAP_RE = /^(?:kart yap|karta ekle|kart olarak (?:ekle|kaydet))\s*:\s*([\s\S]+)$/i;
  const sayiNo = x => Number(String(x).replace(',', '.'));
  /* Tek giriş: anlaşılırsa sonucu döner, değilse null (mesaj olağan yoluna gider). */
  function aracKutusu(metin, t0){
    const sen = () => { KI.akis.push({ kim:'sen', metin:String(metin).trim() }); KI.bekleyen = null; KI.bekleyenGit = null; KI.bekleyenIlet = null; KI.cipler = null; };
    let m = t0.match(HESAP_RE);
    if(m){
      const v = hesapla(m[1]);
      if(v != null){ sen(); KI.soyle(m[1].trim() + ' = ' + sayiTr(v), null, null, 'hesaplandı · cihazda, modelsiz'); return { tur:'hesap', deger:v }; }
    }
    m = t0.match(BIRIM_RE);
    if(m){
      const r = birimCevir(Number(m[1].replace(',', '.')), m[2], m[3]);
      if(r){ sen(); KI.soyle(sayiTr(Number(m[1].replace(',', '.'))) + ' ' + r.a + ' = ' + sayiTr(r.deger) + ' ' + r.b, null, null, 'hesaplandı'); return { tur:'birim', deger:r.deger }; }
    }
    m = t0.match(TARIH_ILERI_RE);
    if(m){
      const n = Number(m[1]) * (m[3] === 'önce' ? -1 : 1), d = KI.ortam.simdi();
      const h = m[2] === 'ay' ? new Date(d.getFullYear(), d.getMonth() + n, d.getDate()) : new Date(d.getFullYear(), d.getMonth(), d.getDate() + n * (m[2] === 'hafta' ? 7 : 1));
      sen(); KI.soyle(m[1] + ' ' + m[2] + ' ' + m[3] + ': ' + tarihYazTr(h)); return { tur:'tarih', iso:h.toISOString().slice(0, 10) };
    }
    m = t0.match(TARIH_KALAN_RE);
    if(m){
      const bugun = KI.ortam.simdi(), ay = AYLAR.indexOf(m[2]);
      let h = new Date(m[3] ? Number(m[3]) : bugun.getFullYear(), ay, Number(m[1]));
      if(!m[3] && gunFarki(bugun, h) < 0) h = new Date(bugun.getFullYear() + 1, ay, Number(m[1]));
      const g = gunFarki(bugun, h);
      sen(); KI.soyle(tarihYazTr(h) + ': ' + (g > 0 ? g + ' gün kaldı (' + Math.floor(g / 7) + ' hafta ' + (g % 7) + ' gün).' : g === 0 ? 'bugün.' : (-g) + ' gün geçti.'));
      return { tur:'tarih', gun:g };
    }
    m = String(metin || '').trim().match(YAP_EKLE_RE);
    if(m){
      const l = yapilacaklar();
      const yeni = m[1].split(/\s*;\s*/).map(x => x.trim()).filter(Boolean).slice(0, 10)
        .map((x, i) => ({ id:'y' + KI.ortam.simdi().getTime().toString(36) + i, metin:x.slice(0, 160), bitti:false }));
      yapYaz(l.concat(yeni)); sen();
      KI.soyle(yeni.length === 1 ? 'Listeye ekledim.' : yeni.length + ' madde ekledim.', null, null, null, { yap:true });
      return { tur:'yap', n:yeni.length };
    }
    if(YAP_LISTE_RE.test(t0)){ sen(); KI.soyle('Yapılacaklar · ' + yapilacaklar().filter(x => !x.bitti).length + ' açık', null, null, null, { yap:true }); return { tur:'yap', n:yapilacaklar().length }; }
    if(YAP_TEMIZ_RE.test(t0)){ const l = yapilacaklar(); yapYaz(l.filter(x => !x.bitti)); sen(); KI.soyle((l.length - yapilacaklar().length) + ' biten maddeyi sildim.', null, null, null, { yap:true }); return { tur:'yap' }; }
    m = t0.match(HATIR_SURE_RE) || t0.match(HATIR_SAAT_RE);
    if(m){
      const d = KI.ortam.simdi();
      let z;
      if(m.length === 4 && /^(dk|dakika|sa|saat)$/.test(m[2])) z = new Date(d.getTime() + Number(m[1]) * (/^(sa|saat)$/.test(m[2]) ? 3600000 : 60000));
      else{ z = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Number(m[1]), Number(m[2])); if(z <= d) z = new Date(z.getTime() + 864e5); }
      const ne = (m[3] || '').trim() || 'Hatırlatma';
      if(!(Number(m[1]) > 0 || m.length === 4 && !/^(dk|dakika|sa|saat)$/.test(m[2])) || isNaN(z)){ return null; }
      hatirYaz(hatirlatmalar().concat([{ id:'h' + d.getTime().toString(36), zaman:z.toISOString(), metin:ne.slice(0, 160) }]));
      sen(); KI.soyle('Tamam, ' + String(z.getHours()).padStart(2, '0') + ':' + String(z.getMinutes()).padStart(2, '0') + (z.getDate() !== d.getDate() ? ' (yarın)' : '')
        + '’de hatırlatacağım: ' + ne + '. Sayfa açıksa bildirim gelir; kapalıysa açtığında söylerim.');
      hatirlatKur();
      return { tur:'hatirlat' };
    }
    if(HATIR_LISTE_RE.test(t0)){
      const l = hatirlatmalar().sort((a, b) => String(a.zaman).localeCompare(String(b.zaman)));
      sen(); KI.cipler = l.slice(0, 4).map(x => ({ ad:'İptal: ' + x.metin.slice(0, 18), is:'hat-sil:' + x.id }));
      KI.soyle(l.length ? l.length + ' hatırlatma bekliyor:' : 'Bekleyen hatırlatma yok.', l.map(x => KI.tarihYaz(x.zaman) + ' · ' + x.metin));
      return { tur:'hatirlat', n:l.length };
    }
    m = String(metin || '').trim().match(KARAR_RE);
    if(m){
      const l = m[1].split(/\s*(?:,|;|\bya da\b|\bveya\b|\byoksa\b)\s*/).map(x => x.trim()).filter(Boolean);
      if(l.length >= 2){
        sen(); KI.cipler = [{ ad:'Yeniden seç', is:'oner-metin:' + String(metin).trim() }];
        KI.soyle('Seçtim: ' + l[rastgele(l.length)] + '.', null, null, 'rastgele, ' + l.length + ' seçenek arasından');
        return { tur:'karar' };
      }
    }
    if(NEFES_RE.test(t0)){ sen(); KI.soyle('Kutu nefesi: daireyle birlikte nefes al, tut, ver, tut.', null, null, null, { nefes:true }); return { tur:'nefes' }; }
    m = t0.match(ZAR_RE);
    if(m){
      const n = Number(m[1] || 1), l = Array.from({ length:n }, () => rastgele(6) + 1);
      sen(); KI.cipler = [{ ad:'Yeniden at', is:'oner-metin:' + n + ' zar at' }];
      KI.soyle(n === 1 ? 'Zar: ' + l[0] + '.' : n + ' zar: ' + l.join(' + ') + ' = ' + l.reduce((a, b) => a + b, 0) + '.', null, null, 'rastgele');
      return { tur:'zar', l };
    }
    if(YT_RE.test(t0)){ sen(); KI.cipler = [{ ad:'Yeniden at', is:'oner-metin:yazı tura' }]; KI.soyle(rastgele(2) ? 'Yazı.' : 'Tura.', null, null, 'rastgele'); return { tur:'yazitura' }; }
    m = t0.match(SAYI_RE);
    if(m){
      const a = Math.min(Number(m[1]), Number(m[2])), b = Math.max(Number(m[1]), Number(m[2]));
      if(b - a <= 1e9){ sen(); KI.cipler = [{ ad:'Yeniden seç', is:'oner-metin:' + a + ' ile ' + b + ' arası sayı' }]; KI.soyle(a + ' ile ' + b + ' arasında: ' + (a + rastgele(b - a + 1)) + '.', null, null, 'rastgele'); return { tur:'sayi' }; }
    }
    m = t0.match(BOL_RE);
    if(m && Number(m[2]) > 0){
      const v = sayiNo(m[1]) / Number(m[2]);
      sen(); KI.soyle(sayiTr(sayiNo(m[1])) + ' ÷ ' + m[2] + ' kişi = kişi başı ' + sayiTr(Math.round(v * 100) / 100) + '.', null, null, 'hesaplandı');
      return { tur:'bol', deger:v };
    }
    m = String(metin || '').trim().match(KELIME_RE);
    if(m){
      const y = m[1].trim(), kel = (y.match(/\S+/g) || []).length, kar = [...y].length, bos = [...y.replace(/\s/g, '')].length;
      const dk = kel / 200;
      sen(); KI.soyle(kel + ' kelime, ' + kar + ' karakter (boşluksuz ' + bos + '). Okuma süresi yaklaşık ' + (dk < 1 ? Math.max(1, Math.round(dk * 60)) + ' saniye' : Math.round(dk) + ' dakika') + '.',
        null, null, 'hesaplandı · okuma dakikada 200 kelimeyle tahmin');
      return { tur:'kelime', kelime:kel };
    }
    m = t0.match(YAS_RE);
    if(m){
      const g = Number(m[1] || m[4]), a = Number(m[2] || m[5]) - 1, y = Number(m[3] || m[6]), d = new Date(y, a, g), b = KI.ortam.simdi();
      if(d.getMonth() === a && d <= b){
        let yas = b.getFullYear() - y;
        if(b.getMonth() < a || (b.getMonth() === a && b.getDate() < g)) yas--;
        let son = new Date(b.getFullYear(), a, g);
        if(gunFarki(b, son) < 0) son = new Date(b.getFullYear() + 1, a, g);
        const kalan = gunFarki(b, son);
        sen(); KI.soyle(yas + ' yaşındasın. ' + (kalan === 0 ? 'Doğum günün bugün, kutlu olsun!' : 'Doğum gününe ' + kalan + ' gün var.') + ' Bugüne kadar ' + sayiTr(gunFarki(d, b)) + ' gün.', null, null, 'hesaplandı');
        return { tur:'yas', yas };
      }
    }
    m = t0.match(VKI_RE) || vkiCumle(t0);
    if(m){
      const kg = sayiNo(m[1]), boy = sayiNo(m[2]) / (m[3] === 'cm' ? 100 : 1);
      if(kg > 0 && boy > 0.5 && boy < 2.6){
        const v = Math.round(kg / (boy * boy) * 10) / 10;
        const ar = v < 18.5 ? 'zayıf (18,5 altı)' : v < 25 ? 'normal (18,5–24,9)' : v < 30 ? 'fazla kilolu (25–29,9)' : 'obez (30 ve üstü)';
        sen(); KI.soyle('VKİ ' + sayiTr(v) + ': DSÖ aralığında ' + ar + '. VKİ kas ve yağı ayırmaz; tek başına sağlık ölçüsü değildir.', null, null, 'hesaplandı · kg / boy²');
        return { tur:'vki', deger:v };
      }
    }
    m = t0.match(SIFRE_RE);
    if(m){
      const n = Math.min(64, Math.max(8, Number(m[1] || 16))), H = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?-_';
      const sf = Array.from({ length:n }, () => H[rastgele(H.length)]).join('');
      sen(); KI.cipler = [{ ad:'Yenisini üret', is:'oner-metin:şifre üret ' + n }];
      KI.soyle(sf, ['Cihazda üretildi, hiçbir yere gönderilmedi. Sohbette kalır; kullandıktan sonra sohbeti silebilirsin.'], null, 'rastgele · ' + n + ' karakter');
      return { tur:'sifre', n };
    }
    m = String(metin || '').trim().match(KART_YAP_RE);
    if(m){
      const mt = m[1].trim(), ad = mt.split(/\s+/).slice(0, 4).join(' ').replace(/[,.;:!?]+$/, '');
      KI.kartEkle(ad.length > 28 ? ad.slice(0, 27) + '…' : ad, mt, true);
      sen(); KI.cipler = [{ ad:'Kartlarımı aç', is:'bolum:araclar' }];
      KI.soyle('Kartlarım’a ekledim: «' + ad + '». Dokununca bu cümleyi sorar; rengini ve simgesini Araçlar › Düzenle’den seçersin.');
      return { tur:'kart' };
    }
    return null;
  }

  /* ---------- söz 20: yetki ---------- */
  function yetkiKatalog(){
    const Y = KI.L.YETKI;
    return Y && typeof Y.kuruluMu === 'function' && Y.kuruluMu() ? Y : null;
  }
  /* ---------- KING-4 §E: bilgisayar ve telefon (dış dünya kademesi) ---------- */
  const DIS_IZIN = { dosya:'dosya ve klasör açma', uygulama:'uygulama başlatma', ekran:'ekrandaki metni okuma', telefon:'telefona mesaj ve sesli özet' };
  async function disIstek(is, govde){
    const r = await KI.hkmIstek('/api/dis/' + is, govde);
    if(!r) return { ok:false, metin:'Merkez’e ulaşamadım; bilgisayar ve telefon işleri Merkez’den yapılır.' };
    return r.ok ? { metin:r.metin, hkmEylem:r.eylem, satirlar:is === 'ekran' ? String(r.metin).split('\n').slice(0, 12) : null }
      : { ok:false, metin:r.note || r.error || 'Olmadı.' };
  }
  function disAraclar(){
    const k = () => !!KI.baglanti();
    /* Açık kalıp (modelsiz yol); sözcük tahmini dış dünyaya gitmez (arac.js niyet). */
    const KURAL = {
      pc_dosya_ac:(t, m) => { const x = /^(?:bilgisayarda )?([a-z]:\\[^«»]*?)\s+(?:dosyasını |klasörünü )?aç[.!]?$/i.exec(m); return x ? { yol:x[1] } : null; },
      pc_uygulama_baslat:(t, m) => { const x = /^(?:bilgisayarda )?(.{2,60}?) (?:uygulamasını|programını) (?:aç|başlat)[.!]?$/i.exec(m); return x ? { ad:x[1] } : null; },
      pc_ekran_oku:t => /^(ekranda ne yazıyor|ekranı oku|ekrandaki (?:metni|yazıyı) oku)\??$/.test(t) || null,
      telefona_gonder:t => /^(günün|bugünün) özetini telefonuma (sesli )?gönder$/.test(t) ? { ozet:true, sesli:/sesli/.test(t) } : null,
    };
    const dis = (ad, ornek, aciklama, parametreler, onizle, uygula) => ({ ad, tur:'yaz', dis:true, seviye:'buyuk', ornek, aciklama, parametreler, kullanilir:k, onizle, uygula, kural:KURAL[ad] });
    return [
      dis('pc_dosya_ac', 'masaüstündeki rapor.pdf dosyasını aç', 'Bilgisayarda bir dosyayı ya da klasörü varsayılan programıyla açar. yol: tam yol (C:\…). Çalıştırılabilir dosya açılmaz. Geri al pencereyi kapatır.',
        { type:'object', properties:{ yol:{ type:'string', maxLength:400 } }, required:['yol'] },
        p => ({ metin:'Bilgisayarda açacağım: ' + p.yol }), p => disIstek('ac', { yol:p.yol })),
      dis('pc_uygulama_baslat', 'hesap makinesini başlat', 'Bilgisayarda Başlat menüsündeki bir uygulamayı adıyla başlatır. Geri al zorlamadan kapatır.',
        { type:'object', properties:{ ad:{ type:'string', maxLength:80 } }, required:['ad'] },
        p => ({ metin:'Bilgisayarda başlatacağım: ' + p.ad }), p => disIstek('baslat', { ad:p.ad })),
      dis('pc_ekran_oku', 'ekranda ne yazıyor', 'Bilgisayarın ekranındaki metni okur (Windows OCR). Hiçbir şeyi değiştirmez ama ekran içeriği King’e girer.',
        undefined, () => ({ metin:'Bilgisayarın ekranını okuyacağım.' }), () => disIstek('ekran', {})),
      dis('telefona_gonder', 'günün özetini telefonuma sesli gönder', 'Telefona (Telegram) mesaj ya da sesli özet gönderir; 60 sn içinde geri alınırsa gitmez. ozet: true ise metin bugünün özetidir (sesli özet). sesli: ses dosyası olarak.',
        { type:'object', properties:{ metin:{ type:'string', maxLength:1500 }, sesli:{ type:'boolean' }, ozet:{ type:'boolean' } } },
        p => { const m = p.ozet ? KI.ozetSatirlari().join(' ') : String(p.metin || '').trim();
          return m ? { metin:'Telefona ' + (p.sesli ? 'sesli ' : '') + (p.ozet ? 'özet' : 'mesaj') + ' göndereceğim.', satirlar:[m.slice(0, 160)] } : { hata:p.ozet ? 'bugün için özet yok' : 'gönderilecek metin yok' }; },
        p => disIstek('telefon', { metin:p.ozet ? KI.ozetSatirlari().join(' ') : p.metin, sesli:p.sesli === true })),
      dis('dis_izin', 'dosya açma iznini ver', 'Dış dünya izinlerinden birini açar ya da kapatır: dosya (dosya ve klasör açma), uygulama, ekran (ekran okuma), telefon. Her izin ayrıdır.',
        { type:'object', properties:{ izin:{ type:'string', enum:Object.keys(DIS_IZIN) }, acik:{ type:'boolean' } }, required:['izin', 'acik'] },
        p => ({ metin:'«' + DIS_IZIN[p.izin] + '» izni ' + (p.acik ? 'verilecek: King bunu her seferinde yine onayınla yapar.' : 'kapatılacak.') }),
        async p => { const r = await KI.hkmIstek('/api/dis/izin', { ad:p.izin, acik:p.acik });
          return r && r.ok ? { metin:'«' + DIS_IZIN[p.izin] + '» izni ' + (p.acik ? 'açık.' : 'kapalı.'), hkmEylem:true } : { ok:false, metin:'İzin değişmedi: Merkez’e ulaşamadım.' }; }),
    ];
  }
  async function yetkiUygula(n){
    n = n || KI.bekleyenYetki;
    KI.bekleyenYetki = null; KI.cipler = null;
    const Y = yetkiKatalog();
    /* Söz 36: modelin seçtiği yazan araç da bu kapıdan uygulanır (arac.js). */
    if(!n || (!n.arac && !Y) || (n.arac && !ARAC())) return null;
    const bek = { kim:'king', bekliyor:true, metin:'' };
    KI.akis.push(bek);
    KI.ciz(false);
    const r = n.arac ? await ARAC().uygula(n) : await Y.uygula(n);
    KI.akis = KI.akis.filter(m => m !== bek);
    if(r.ok && typeof r.geriAl === 'function'){ KI.sonGeriAl = r.geriAl; KI.cipler = [{ is:'geri-al', ad:'Geri al' }]; }
    /* «King ne yaptı» zaman çizgisi (KING-4 §F). */
    /* Dış dünya eylemini (§E) HKM deftere kendisi yazar; çizgi yalnız tazelenir. */
    if(r.ok && r.hkmEylem != null) KI.eylemTazele();
    else if(r.ok) KI.eylemYaz({ arac:n.arac ? n.ad : 'yetki.' + (n.id || n.tur), ozet:String(r.metin || (n.onizle && n.onizle.metin) || '').replace(/[.!]+$/, ''),
      param:n.arac ? n.param : undefined, geriAl:r.geriAl });
    KI.soyle(r.metin, r.satirlar && r.satirlar.length ? r.satirlar : null);
    if(r.ok && r.yenile){
      /* Sayfa yeniden yüklenince King aynı sayfada küçük kutu olarak açılır. */
      KI.ortam.depo.yaz(KI.TASIMA, Object.assign({}, KI.ortam.depo.oku(KI.TASIMA) || {}, { acik:true, mini:true, kaynak:KI.ayar.modul, yenile:true, zaman:Date.now() }));
      KI.ortam.zamanla(() => KI.ortam.yenile(), 1400);
    }
    return r;
  }
  /* ---------- söz 36: araç kataloğu (arac.js) ---------- */
  const ARAC = () => (KI.L.ARAC && typeof KI.L.ARAC.liste === 'function') ? KI.L.ARAC : null;
  const HARITA_RE = /(bu sistemde (?:ne|neler) var|sistemde (?:ne|neler) var|lifeos'?ta (?:ne|neler) var|neler yapabilirsin|ne(?:ler)?i? yapabiliyorsun|neleri yapabilirsin|sistem haritası|(?:^|\s)nasıl yapılır|(?:^|\s)nerede(?:dir)?\s*\??$|nereden (?:girerim|eklerim|yaparım|bakarım|açarım)|nasıl (?:girerim|eklerim|kaydederim|açarım|değiştiririm))/;
  const HARITA_DOLGU = /(bu sistemde|sistemde|lifeos'?ta|ne var|neler var|neler yapabilirsin|nasıl yapılır|nerede(?:dir)?|nereden|nasıl|girerim|eklerim|yaparım|bakarım|açarım|kaydederim|değiştiririm|king|\?)/g;
  const YETKI_AYAR = {
    tema:{ id:'tema', degerler:{ koyu:'dark', acik:'light', sistem:'system' } },
    animasyon:{ id:'animasyon', degerler:{ tam:'tam', az:'az', sistem:'sistem' } },
    zemin:{ id:'zemin', degerler:{ sade:'sade', canli:'yumusak' } },
    muzik:{ id:'muzik', degerler:{ cal:'cal', dur:'dur' } },
  };
  const KING_AYAR = {
    cevap:{ ad:'Cevap biçimi', degerler:['oto', 'ses', 'yazi'], oku:() => KI.cevapBicimi(), yaz:v => KI.cevapSec(v), adlar:{ oto:'Otomatik', ses:'Sesli', yazi:'Yazılı' } },
    derinlik:{ ad:'Düşünme', degerler:KI.DERIN_TERCIH, oku:() => KI.derinlik(), yaz:v => KI.derinlikSec(v), adlar:KI.DERIN_AD },
    tarz:{ ad:'Tarz', degerler:KI.TARZLAR, oku:() => KI.tarz(), yaz:v => KI.tarzSec(v), adlar:KI.TARZ_AD },
    gorunus:{ ad:'Görünüş', degerler:KI.GORUNUSLER, oku:() => KI.gorunus(), yaz:v => KI.gorunusAyarla(v), adlar:KI.GORUNUS_AD },
    ses:{ ad:'Ses', degerler:KI.SES_TERCIH, oku:() => KI.sesTercihi(), yaz:v => KI.sesTercihSec(v), adlar:KI.SES_AD },
  };
  /* AYARLAR › KING (kullanıcı, 2026-10-30: «King kısmında güzel şeyler yap; tasarım
     ve özellik bakımından»). Üstte canlı önizleme: King'in yüzü, adı ve seçilen
     tarzda bir selam; «Sesini dene» seçilen sesle okur. Altında King'in kendi
     tercihleri (KING_AYAR) ve okuma hızı: King penceresindekilerle aynı kayıt. */
  const AYAR_SELAM = Object.freeze({ samimi:'Selam! Bugün neye bakalım?', resmi:'Merhaba. Size nasıl yardımcı olabilirim?', kisa:'Hazırım.' });
  const AYAR_SIRA = ['tarz', 'derinlik', 'cevap', 'ses', 'gorunus'];
  const AYAR_NOT = { tarz:'Nasıl konuşsun', derinlik:'Ne kadar düşünsün', cevap:'Yazıyla mı, sesle mi', ses:'Hangi ses okusun', gorunus:'Rengi' };
  function ayarHtml(){
    const seg = (ad, liste, simdi, veri, adlar) => '<div class="seg" role="group" aria-label="' + KI.kac(ad) + '">' + liste.map(d => {
      const on = String(d) === String(simdi);
      return '<button type="button" class="' + (on ? 'is-on' : '') + '" aria-pressed="' + on + '" data-king-tercih="' + veri + ':' + d + '">' + KI.kac(adlar ? adlar[d] : d) + '</button>'; }).join('') + '</div>';
    return '<div class="kingayar" data-king-tercih-kok>'
      + '<div class="kingayar__onizle">' + KI.yuzHtml(true)
      + '<div class="kingayar__metin"><b>' + KI.kac(KI.ad()) + '</b><p>«' + KI.kac(AYAR_SELAM[KI.tarz()]) + '»</p><small>' + KI.kac(KI.DERIN_IP[KI.derinlik()]) + '</small></div>'
      + '<button type="button" class="btn btn--sm btn--ghost" data-king-tercih="dene:1">Sesini dene</button></div>'
      + AYAR_SIRA.map(k => { const x = KING_AYAR[k];
        return '<div class="kingayar__satir"><span class="kingayar__ad">' + KI.kac(x.ad) + '<small>' + KI.kac(AYAR_NOT[k]) + '</small></span>' + seg(x.ad, x.degerler, x.oku(), k, x.adlar) + '</div>'; }).join('')
      + '<div class="kingayar__satir"><span class="kingayar__ad">Okuma hızı<small>Sesli okurken</small></span>'
      + seg('Okuma hızı', KI.HIZLAR, KI.hiz(), 'hiz', KI.HIZLAR.reduce((o, v) => { o[v] = String(v).replace('.', ',') + '×'; return o; }, {})) + '</div>'
      + '</div>';
  }
  function ayarYenile(){ if(typeof document !== 'undefined') document.querySelectorAll('[data-king-tercih-kok]').forEach(el => { el.outerHTML = ayarHtml(); }); }
  if(typeof document !== 'undefined') document.addEventListener('click', e => {
    const b = e.target && e.target.closest ? e.target.closest('[data-king-tercih]') : null;
    if(!b) return;
    e.preventDefault();
    const [k, v] = b.getAttribute('data-king-tercih').split(':');
    if(k === 'dene'){ try{ KI.seslendir(KI.ad() + '. ' + AYAR_SELAM[KI.tarz()]); }catch(x){ /* ses yok */ } return; }
    if(k === 'hiz'){ const n = Number(v); if(KI.HIZLAR.indexOf(n) >= 0){ if(n === 1) KI.ortam.depo.sil(KI.HIZ); else KI.ortam.depo.yaz(KI.HIZ, n); } }
    else if(KING_AYAR[k] && KING_AYAR[k].degerler.indexOf(v) >= 0) KING_AYAR[k].yaz(v);
    ayarYenile();
  });
  /* Kendi akışını çizen araç (kart, öncelik, not arama…): kullanıcının mesajı
     zaten sohbette; akış onu yeniden ekler, iki kez görünmesin. */
  async function akisla(fn){
    const i = KI.akis.map(m => m.kim).lastIndexOf('sen');
    const m = i >= 0 ? KI.akis.splice(i, 1)[0] : null;
    await fn(m ? m.metin : '');
    return { yerine:true };
  }
  function haritaVeri(konu){
    const A = ARAC();
    const h = A ? A.harita(KI.SAYFALAR) : { moduller:[], okuma:[], yazma:[] };
    const k = KI.kucuk(konu || '');
    if(!k) return h;
    const s = KI.sayfaBul(k);
    return Object.assign({}, h, { konu:k, araclar:A ? A.ara(k).map(a => ({ ne:String(a.aciklama).split(/(?<=\.)\s/)[0], ornek:a.ornek || '', tur:a.tur })) : [],
      isler:A && A.isAra ? A.isAra(k) : [], sayfa:s ? { ad:s.ad, modul:KI.MODUL_AD[s.modul] } : null });
  }
  /* Söz 37: işin nasıl yapıldığı tek satırda. */
  const isSatiri = x => x.ad + (x.modul !== 'king' && x.modul !== (KI.ayar && KI.ayar.modul) ? ' (' + KI.MODUL_AD[x.modul] + ')' : '')
    + (x.tur === 'foto' ? ' — kamera ya da fotoğraf: + › Tüm işler' : ' — King’e «' + String(x.ornek || '').trim() + '» yaz');
  function haritaCevap(konu){
    const v = haritaVeri(konu);
    const ad = KI.MODUL_AD[KI.ayar && KI.ayar.modul] || 'Bu modül';
    if(v.konu){
      const l = (v.isler || []).slice(0, 3).map(isSatiri)
        .concat((v.araclar || []).map(a => a.ne.replace(/[.]$/, '') + (a.ornek ? ' — King’e «' + a.ornek + '» yaz' : '')));
      if(v.sayfa) l.push('Sayfası: ' + v.sayfa.ad + ' (' + v.sayfa.modul + ')');
      if(!l.length){
        const m = v.moduller.find(x => x.alanlar.some(a => KI.kucuk(a).indexOf(v.konu.split(' ')[0].slice(0, 5)) >= 0));
        return { sonuc:v, cevap:m ? '«' + konu + '» ' + m.ad + '’nin işi; orada King’e sorabilir ya da sayfasından yapabilirsin.'
          : '«' + konu + '» için bu modülde bir araç ya da sayfa bulamadım.', satirlar:v.moduller.map(x => x.ad + ' — ' + x.is) };
      }
      return { sonuc:v, cevap:'«' + konu + '» için:', satirlar:l.slice(0, 6) };
    }
    /* Söz 37: her modülün King'le yapılan işleri, modüle göre (bulunulan önce). */
    const isler = v.isler || [];
    const grup = m => (isler.find(g => g.modul === m) || { isler:[] }).isler.map(x => x.ad + (x.tur === 'foto' ? ' (kamera)' : '')).join(', ');
    const ortak = grup('king');
    return { sonuc:v, cevap:'LifeOS’ta dört bölüm var; ' + ad + ' içinde King’le ' + v.okuma.length + ' okuma ve ' + v.yazma.length
      + ' değişiklik işi yapabilirsin. Hepsi + › Tüm işler’de, modüle göre:',
      satirlar:v.moduller.map(x => { const m = Object.keys(KI.MODUL_AD).find(k => KI.MODUL_AD[k] === x.ad), g = m ? grup(m) : '';
        return x.ad + ' — ' + x.is + ': ' + (g ? 'King’le ' + g : x.alanlar.slice(0, 4).join(', ')) + (x.sayfalar.length ? ' · sayfalar: ' + x.sayfalar.join(', ') : ''); })
        .concat(ortak ? ['King — her modülde: ' + ortak] : []) };
  }
  function haritaIsle(metin){
    KI.akis.push({ kim:'sen', metin:String(metin).trim() });
    KI.bekleyen = null; KI.bekleyenGit = null; KI.bekleyenIlet = null; KI.cipler = null;
    const konu = KI.kucuk(metin).replace(HARITA_DOLGU, ' ').replace(/\s+/g, ' ').trim();
    const r = haritaCevap(konu.length >= 3 ? konu : '');
    KI.soyle(r.cevap, r.satirlar);
    return { tur:'harita', konu:r.sonuc.konu || '' };
  }
  /* GÜN KAYDI (Gün planı F3a, §2b «her özellik King'e de araç olarak gelir»): niyet,
     enerji (1–5) ve iç hava hesap sunucusunda (sunucu sözü 26); Gün sayfasıyla aynı
     kayıt. Kullanıcının girdiği değerdir; King yorum katmaz. Yazmak önizlenir ve
     onaylanır, geri alınır. Kuralla da çağrılır (Merkez kapalıyken). */
  const HAVA_AD = Object.freeze({ gunes:'güneşli', parcali:'parçalı bulutlu', bulut:'bulutlu', yagmur:'yağmurlu', firtina:'fırtınalı' });
  const HAVA_ES = [[/fırtına/, 'firtina'], [/yağmur/, 'yagmur'], [/parçalı/, 'parcali'], [/bulut/, 'bulut'], [/güneş/, 'gunes']];
  const PIL_AD = ['', 'bitkin', 'düşük', 'orta', 'iyi', 'dolu'];
  const GUN_OKU_RE = /^(?:bugünkü |bugünün |günün )?(?:niyetim|niyet) (?:ne|neydi|nedir)\s*\??$|^enerjim (?:kaç|ne|nasıl)\s*\??$|^iç havam (?:ne|nasıl)\s*\??$|^gün kaydım\s*\??$/;
  function gunKaydiCoz(t, ham){
    let m = t.match(/^(?:bugünün |günün )?niyet(?:im|i)?\s*:\s*(.+)$/);
    if(m){ const n = String(ham).replace(/^[^:]*:\s*/, '').trim().slice(0, 120); return n ? { niyet:n } : null; }
    m = t.match(/^enerji(?:m)?\s*:?\s*([1-5])(?:\s*\/\s*5)?\s*[.!]?$/);
    if(m) return { enerji:Number(m[1]) };
    m = t.match(/^iç hava(?:m)?\s*:?\s*(.+?)\s*[.!]?$/);
    if(m){ const h = HAVA_ES.find(x => x[0].test(m[1])); return h ? { hava:h[1] } : null; }
    return null;
  }
  const gunKaydiMetin = v => [v.niyet ? 'niyet «' + v.niyet + '»' : '', v.enerji ? 'enerji ' + v.enerji + '/5 (' + PIL_AD[v.enerji] + ')' : '',
    v.hava ? 'iç hava ' + HAVA_AD[v.hava] : ''].filter(Boolean).join(', ');
  const gunOturum = () => !!(KI.L.HESAP && KI.L.HESAP.durum && KI.L.HESAP.durum().oturum && KI.L.HESAP.gunKayit);
  function gunAraclari(){
    return [
      { ad:'gun_kaydi', tur:'oku', ornek:'bugünkü niyetim ne', aciklama:'Gün’ün bugünkü kaydı: kullanıcının yazdığı niyet, enerji (1–5) ve iç hava (Gün sayfasıyla aynı kayıt).',
        kural:t => GUN_OKU_RE.test(t),
        calistir:async () => {
          if(!gunOturum()) return { cevap:'Gün kaydı hesap sunucusunda; bu cihazda hesapla giriş yapılmamış.' };
          const v = await KI.L.HESAP.gunKayit();
          if(!v || v.bayat || !(v.niyet || v.enerji || v.hava || (v.bloklar || []).length)) return { sonuc:v, cevap:'Bugün için niyet, enerji ya da iç hava girilmemiş. «bugünün niyeti: …» ya da «enerjim 4» yazabilirsin.' };
          const b = Array.isArray(v.bloklar) ? v.bloklar : [];
          return { sonuc:v, cevap:'Bugün senin girdiğin: ' + gunKaydiMetin(v) + '.'
            + (b.length ? ' Gün planında ' + b.length + ' iş, ' + b.filter(x => x.bitti).length + ' tanesi bitti.' : '') };
        } },
      { ad:'gun_kaydi_yaz', tur:'yaz', ornek:'bugünün niyeti: türevi bitirmek', aciklama:'Gün’ün bugünkü kaydını yazar: niyet (en çok 120 karakter), enerji (1–5), iç hava (gunes, parcali, bulut, yagmur, firtina). Verilmeyen alan değişmez.',
        parametreler:{ type:'object', properties:{ niyet:{ type:'string', maxLength:120 }, enerji:{ type:'integer', minimum:1, maximum:5 },
          hava:{ type:'string', enum:Object.keys(HAVA_AD) } } },
        kural:(t, ham) => gunKaydiCoz(t, ham),
        onizle:p => {
          if(!gunOturum()) return { hata:'Gün kaydı hesap sunucusunda; bu cihazda hesapla giriş yapılmamış' };
          const m = gunKaydiMetin(p || {});
          return m ? { metin:'Gün’e yazılacak: ' + m + '.' } : { hata:'yazılacak bir şey yok' };
        },
        uygula:async p => {
          const H = KI.L.HESAP, eski = await H.gunKayit();
          const once = eski && !eski.bayat ? { niyet:eski.niyet || '', enerji:eski.enerji || null, hava:eski.hava || null, bloklar:eski.bloklar || [] }
            : { niyet:'', enerji:null, hava:null, bloklar:[] };           // Gün'ün planı (bloklar) aynen korunur
          const yeni = Object.assign({}, once, ...['niyet', 'enerji', 'hava'].filter(k => p[k] != null && p[k] !== '').map(k => ({ [k]:p[k] })));
          await H.gunKayitYaz(yeni);
          return { metin:'Gün’e yazdım: ' + gunKaydiMetin(yeni) + '.', geriAl:async () => { await H.gunKayitYaz(once); } };
        } },
      ...senAraclari(),
    ];
  }
  /* Gun › Gecmis ve Sen (§2b): sozun, veren / calan, deste (sunucu sozu 27), karne. Sayilari GunVeri hesaplar. */
  const SEN_OKU_RE = /^(?:kendi |kendime )?sözüm (?:ne|neydi|nedir)\s*\??$|^(?:beni )?ne(?:ler)? (?:besliyor|enerji veriyor)\s*\??$|^enerjimi ne(?:ler)? (?:çalıyor|alıyor)\s*\??$|^destemde ne(?:ler)? var\s*\??$/;
  const KART_RE = /^(?:bir |desteden (?:bir )?)?kart çek\s*[.!?]?$/;
  const KARNE_RE = /^(?:bu )?(hafta|ay)(?:ki|lık)? (?:hayat )?karnem(?: nasıl)?\s*\??$|^hayat karnem(?: nasıl)?\s*\??$|^(?:bu )?(hafta|ay) nasıl (?:geçti|gidiyor)\s*\??$/;
  const senOturum = () => gunOturum() && !!KI.L.HESAP.gunSen;
  const GV = () => KI.L.GunVeri;
  const bugunIso = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  function senCoz(t, ham){
    const sonra = () => String(ham).replace(/^[^:]*:\s*/, '').replace(/\s+/g, ' ').trim();
    if(/^(?:kendi |kendime )?söz(?:üm)?\s*:/.test(t)){ const s = sonra().slice(0, 160); return s ? { soz:s } : null; }
    if(/^(?:enerji veren|beni besleyen|enerji verir)\s*:/.test(t)){ const s = sonra().slice(0, 40); return s ? { veren:s } : null; }
    if(/^(?:enerji çalan|enerjimi çalan|beni yoran)\s*:/.test(t)){ const s = sonra().slice(0, 40); return s ? { calan:s } : null; }
    if(/^desteye(?: kart)? ekle\s*:/.test(t)){ const s = sonra().slice(0, 60); return s ? { kart:s } : null; }
    return null;
  }
  const senMetin = p => [p.soz ? 'kendi sözün «' + p.soz + '»' : '', p.veren ? 'enerji veren: ' + p.veren : '', p.calan ? 'enerji çalan: ' + p.calan : '',
    p.kart ? 'desteye kart: ' + p.kart + (p.kart_enerji ? ' (' + (p.kart_enerji === 'az' ? 'az' : 'çok') + ' enerji)' : '') : ''].filter(Boolean).join(', ');
  const dk = m => m >= 60 ? Math.floor(m / 60) + ' sa' + (m % 60 ? ' ' + (m % 60) + ' dk' : '') : m + ' dk';
  function senAraclari(){
    return [
      { ad:'gun_sen', tur:'oku', ornek:'beni ne besliyor', aciklama:'Gün › Sen kaydını okur: kullanıcının kendine koyduğu ilke, onu besleyen ve yoran şeyler, destedeki kartlar (Gün sayfasıyla aynı kayıt).',
        kural:t => SEN_OKU_RE.test(t),
        calistir:async () => {
          if(!senOturum()) return { cevap:'Sen kaydı hesap sunucusunda; bu cihazda hesapla giriş yapılmamış.' };
          const v = await KI.L.HESAP.gunSen() || {};
          const l = [v.soz ? 'Kendi sözün: «' + v.soz + '».' : '', (v.veren || []).length ? 'Enerji veren: ' + v.veren.join(', ') + '.' : '',
            (v.calan || []).length ? 'Enerji çalan: ' + v.calan.join(', ') + '.' : '', (v.deste || []).length ? 'Destende ' + v.deste.length + ' kart var.' : ''].filter(Boolean);
          return { sonuc:v, cevap:l.length ? l.join(' ') : 'Sen bölümü boş: «sözüm: …», «enerji veren: …» ya da «desteye ekle: …» yazabilirsin.' };
        } },
      { ad:'gun_sen_yaz', tur:'yaz', ornek:'enerji veren: akşam yürüyüşü', aciklama:'Gün › Sen kaydına yazar: kendi söz (en çok 160 karakter), enerji veren ya da çalan bir şey (en çok 40, listede en çok 12), desteye kart (en çok 60, destede en çok 30; enerjisi az ya da cok). Var olanlar silinmez.',
        parametreler:{ type:'object', properties:{ soz:{ type:'string', maxLength:160 }, veren:{ type:'string', maxLength:40 }, calan:{ type:'string', maxLength:40 },
          kart:{ type:'string', maxLength:60 }, kart_enerji:{ type:'string', enum:['az', 'cok'] } } },
        kural:(t, ham) => senCoz(t, ham),
        onizle:p => {
          if(!senOturum()) return { hata:'Sen kaydı hesap sunucusunda; bu cihazda hesapla giriş yapılmamış' };
          const m = senMetin(p || {});
          return m ? { metin:'Gün › Sen’e yazılacak: ' + m + '.' } : { hata:'yazılacak bir şey yok' };
        },
        uygula:async p => {
          const H = KI.L.HESAP, e = await H.gunSen() || {};
          const once = { soz:e.soz || '', veren:e.veren || [], calan:e.calan || [], deste:e.deste || [], iz:e.iz || {} };
          const yeni = Object.assign({}, once, { veren:once.veren.slice(), calan:once.calan.slice(),
            deste:(once.deste.length ? once.deste : ((GV() && GV().BASLANGIC) || [])).map(k => Object.assign({}, k)) });
          if(p.soz) yeni.soz = String(p.soz).slice(0, 160);
          ['veren', 'calan'].forEach(k => { if(p[k] && yeni[k].indexOf(p[k]) < 0){ if(yeni[k].length >= 12) throw new Error('listede en çok 12 satır olur'); yeni[k].push(String(p[k]).slice(0, 40)); } });
          if(p.kart && !yeni.deste.some(k => k.ad === p.kart)){
            if(yeni.deste.length >= 30) throw new Error('destede en çok 30 kart olur');
            yeni.deste.push({ ad:String(p.kart).slice(0, 60), enerji:p.kart_enerji === 'az' || p.kart_enerji === 'cok' ? p.kart_enerji : null, evet:0, gec:0 });
          }
          await H.gunSenYaz(yeni);
          return { metin:'Gün › Sen’e yazdım: ' + senMetin(p) + '.', geriAl:async () => { await H.gunSenYaz(once); } };
        } },
      { ad:'gun_kart_cek', tur:'oku', ornek:'bir kart çek', aciklama:'«Ne yapsam?» destesinden kuralla bir kart çeker: sık yapılan ve bugünkü enerjiye uyan öne çıkar. Kayıt yazmaz.',
        kural:t => KART_RE.test(t),
        calistir:async () => {
          if(!senOturum() || !GV()) return { cevap:'Deste hesap sunucusunda; bu cihazda hesapla giriş yapılmamış.' };
          const H = KI.L.HESAP, v = await H.gunSen() || {}, g = await H.gunKayit();
          const enerji = g && !g.bayat ? g.enerji || null : null, d = (v.deste || []).length ? v.deste : GV().BASLANGIC;
          const c = GV().kartCek(d, enerji, []);
          if(!c) return { cevap:'Deste boş.' };
          return { sonuc:c, cevap:'Kartın: «' + c.kart.ad + '». ' + c.neden + (enerji ? ' (enerjin ' + enerji + '/5)' : '') + '. Yaptıysan Gün › Sen’de «Yaptım» de; deste öğrenir.' };
        } },
      { ad:'gun_karne', tur:'oku', ornek:'bu hafta karnem nasıl', aciklama:'Hayat karnesi: son 7 ya da 30 günde çalışma (AYS) ve gelişim (ESP) dakikaları ve etkin gün sayısı (ölçüldü); SPİ alanları veri yok.',
        parametreler:{ type:'object', properties:{ gun:{ type:'integer', enum:[7, 30] } } },
        kural:t => { const m = t.match(KARNE_RE); return m ? { gun:(m[1] || m[2]) === 'ay' ? 30 : 7 } : null; },
        calistir:async p => {
          if(!gunOturum() || !GV() || !KI.L.HESAP.gunluk) return { cevap:'Karne hesap sunucusundaki günlük özetten gelir; bu cihazda hesapla giriş yapılmamış.' };
          const n = p && p.gun === 30 ? 30 : 7, H = KI.L.HESAP, d = GV().donem(await H.gunluk(), bugunIso(), n);
          const s = H.gunSen ? await H.gunSen() : null, z = GV().izDizi(s && s.iz, bugunIso(), n);
          const a = {}; d.satirlar.forEach(x => { a[x.alan] = x; });
          const satir = (x, ad, kaynak) => x.toplam == null ? ad + ': veri yok' : ad + ' ' + x.etkin + '/' + n + ' gün, ' + dk(x.toplam) + ' (ölçüldü, ' + kaynak + ')';
          const l = [satir(a.calisma, 'Çalışma', 'AYS'), satir(a.gelisim, 'Gelişim', 'ESP'),
            z.ortalama == null ? 'enerji: veri yok' : 'enerji ortalaması ' + String(z.ortalama).replace('.', ',') + '/5 (senin girdiğin, ' + z.girilen + ' gün)', 'uyku, beslenme, hareket: veri yok'];
          return { sonuc:{ gun:n, satirlar:d.satirlar.map(x => ({ alan:x.alan, toplam:x.toplam, etkin:x.etkin, bilinen:x.bilinen })), enerji:z.ortalama },
            cevap:'Son ' + n + ' gün: ' + l.join('; ') + '.' };
        } },
    ];
  }
  function ortakAraclar(){
    const rotalar = KI.SAYFALAR.map(s => s.route).filter((v, i, a) => a.indexOf(v) === i);
    const Y = () => yetkiKatalog();
    const K = () => (KI.ayar && KI.ayar.kartlar) || {};
    const sira = { type:'object', properties:{ sira:{ type:'integer', minimum:1, maximum:30, description:'bekleyen listesindeki sıra (1 = ilk)' } }, required:['sira'] };
    const yetkiNiyet = (id, p) => { const y = Y(); const n = y && y.niyet ? y.niyet(id, p) : null; return n ? { yetki:n } : { hata:'bu değişiklik şu an yapılamıyor' }; };
    const oneri = p => { const y = Y(); const l = y && y.bekleyenler ? y.bekleyenler() : []; return l[p.sira - 1] || null; };
    const l = [
      { ad:'sistem_haritasi', tur:'oku', ornek:'bu sistemde neler var?',
        aciklama:'LifeOS’ta ne var: hangi iş hangi modülde, hangi sayfada ve King’den nasıl yapılır. «Ne var», «nerede», «nasıl yapılır» sorularında çağır.',
        parametreler:{ type:'object', properties:{ konu:{ type:'string', maxLength:80, description:'aranan iş (ör. «uyku girmek»); boşsa genel harita' } } },
        calistir:p => haritaCevap(p.konu || '') },
      { ad:'sayfa_ac', tur:'oku', ornek:'deneme sayfasını aç',
        aciklama:'Bir modülün sayfasını açar; veri değiştirmez. Sayfalar: ' + KI.SAYFALAR.map(s => s.modul + '/' + s.route + ' ' + s.ad).join(', ') + '.',
        parametreler:{ type:'object', properties:{ modul:{ type:'string', enum:['ays', 'spi', 'esp'] }, sayfa:{ type:'string', enum:rotalar } }, required:['modul', 'sayfa'] },
        calistir:p => {
          if(!KI.SAYFALAR.some(s => s.modul === p.modul && s.route === p.sayfa)) return { hata:'bu modülde böyle bir sayfa yok' };
          const h = { modul:p.modul, route:p.sayfa };
          KI.ortam.zamanla(() => KI.git(h), KI.sesli ? 1100 : 650);
          return { cevap:eylemCumlesi(h, 'Tamam.') };
        } },
      { ad:'kayit_gir', tur:'yaz', ornek:({ ays:'matematikten 40 soru çözdüm', spi:'7 saat uyudum', esp:'45 dk gitar' })[KI.ayar && KI.ayar.modul] || '7 saat uyudum',
        aciklama:'Kullanıcının YAPTIĞI bir işi (soru, süre, uyku, su, öğün, antrenman, çalışma oturumu, not) bu modülün kendi ayrıştırıcısıyla kayda çevirir; önizleme gösterilir, onayla yazılır. metin: kullanıcının cümlesi, sayıları aynen.',
        parametreler:{ type:'object', properties:{ metin:{ type:'string', maxLength:300 } }, required:['metin'] },
        kullanilir:() => !!KI.veriKapisi(),
        onizle:(p, b) => {
          const v = KI.veriKapisi();
          if(!v) return { hata:'bu modülde kayıt kapısı yok' };
          const asil = String((b && b.metin) || '');
          /* Gelecek, olumsuz ya da soru cümlesi kayıt değildir; modelin yeniden
             yazması bunu aşamaz (olumsuz.js, KR-1). */
          if(asil && KI.kayitDegil(asil)) return { hata:'bu cümle yapılmış bir işi anlatmıyor (gelecek, olumsuz ya da soru)' };
          /* Önce kullanıcının KENDİ cümlesi; olmazsa modelinki, sayısı korunmuşsa. */
          for(const m of [asil, p.metin]){
            if(!m || KI.kayitDegil(m)) continue;
            if(m !== asil && asil && !ARAC().sayiKorunur(asil, m)) return { hata:'senin cümlende geçmeyen bir sayı çıktı' };
            let o = null;
            try{ o = v.onizle(String(m).trim()); }catch(e){ o = null; }
            if(o && typeof o.kaydet === 'function') return { veri:o };
          }
          return { hata:'modül bu cümleyi kayıt olarak anlamadı' };
        },
        uygula:() => ({ ok:false, metin:'Kayıt önizlemeden yazılır.' }) },
      { ad:'bugun_ozeti', tur:'oku', ornek:'bugünün özeti', aciklama:'Bu modülde bugünün özeti (modülün kendi cümleleri).',
        kullanilir:() => !!(KI.ayar && typeof KI.ayar.ozet === 'function'),
        calistir:() => { const s = KI.ozetSatirlari(); return { sonuc:{ satirlar:s }, cevap:s.length ? (KI.MODUL_AD[KI.ayar.modul] || '') + '’de bugün:' : 'Bugün için henüz bir şey yok.', satirlar:s }; } },
      { ad:'istatistikler', tur:'oku', ornek:'istatistiklerim', aciklama:'Bu modülün istatistik kartları (sayıları modül hesaplar).',
        kullanilir:() => typeof K().istatistik === 'function', calistir:() => akisla(m => KI.kartIsle({ tur:'istatistik' }, m)) },
      { ad:'soru_sor', tur:'oku', ornek:'türev hakkında soru sor', aciklama:'Modülün bankasından bir soru kartı getirir.',
        parametreler:{ type:'object', properties:{ konu:{ type:'string', maxLength:60 } } },
        kullanilir:() => typeof K().soru === 'function', calistir:p => akisla(m => KI.kartIsle({ tur:'soru', konu:p.konu || '' }, m)) },
      { ad:'oncelik_listesi', tur:'oku', ornek:'neye çalışayım', aciklama:'Puan getirecek öncelikli konular (modülün hesabı: çıkma sıklığı × hata).',
        kullanilir:() => typeof K().oncelik === 'function', calistir:() => akisla(m => oncelikIsle(m)) },
      { ad:'yuk_durumu', tur:'oku', ornek:'yük durumum', aciklama:'Son 7 gün ile önceki 7 günün karşılaştırması ve yük sinyali.',
        kullanilir:() => typeof K().yuk === 'function', calistir:() => akisla(m => yukIsle(m)) },
      { ad:'not_ara', tur:'oku', ornek:'notlarımda türev', aciklama:'Defter notlarında arar; bulunan notlara dayanarak cevaplar.',
        parametreler:{ type:'object', properties:{ sorgu:{ type:'string', maxLength:80 } }, required:['sorgu'] },
        kullanilir:() => !!D(), calistir:p => akisla(m => notAra(m || p.sorgu, KI.kucuk(p.sorgu))) },
      { ad:'not_ekle', tur:'yaz', ornek:'deftere not: üslülerde tabanlar aynıysa üsler toplanır', aciklama:'Defter’e yeni bir not yazar.',
        kural:(t, m) => { const x = /^(?:\S+ )?defter(?:e|ine) not\s*[:,]\s*(\S[\s\S]{1,1999})$/i.exec(m); return x ? { metin:x[1].trim() } : null; },
        parametreler:{ type:'object', properties:{ baslik:{ type:'string', maxLength:120 }, metin:{ type:'string', maxLength:2000 } }, required:['metin'] },
        kullanilir:() => !!D(),
        onizle:p => ({ metin:'Defter’e not eklenecek' + (p.baslik ? ': «' + p.baslik + '»' : '') + '.', satirlar:[String(p.metin).slice(0, 160)] }),
        uygula:async p => {
          const n = await D().yeni(p.baslik || String(p.metin).split(/[.\n]/)[0].slice(0, 60), p.metin, 'not');
          return { metin:'Defter’e yazdım.', geriAl:n && n.id && D().sil ? async () => { await D().sil(n.id); } : null };
        } },
      { ad:'onaylari_listele', tur:'oku', ornek:'bekleyen öneriler', aciklama:'Onaylar’da bekleyen öneriler (sıra numarasıyla).',
        kullanilir:() => !!(Y() && Y().bekleyenler),
        calistir:() => { const b = Y().bekleyenler(); return { sonuc:{ bekleyen:b.map((x, i) => ({ sira:i + 1, metin:x.metin })) },
          cevap:b.length ? b.length + ' öneri onay bekliyor:' : 'Onay bekleyen öneri yok.', satirlar:b.slice(0, 8).map((x, i) => (i + 1) + '. ' + x.metin) }; } },
      { ad:'oneri_onayla', tur:'yaz', ornek:'ikinci öneriyi onayla', aciklama:'Onaylar’daki bir öneriyi onaylar; modülün kendi kodu uygular.', parametreler:sira,
        kullanilir:() => !!(Y() && Y().bekleyenler), onizle:p => { const x = oneri(p); return x ? yetkiNiyet('onay-tek', { id:x.id, metin:x.metin }) : { hata:'o sırada öneri yok' }; }, uygula:() => ({ ok:false }) },
      { ad:'oneri_gec', tur:'yaz', ornek:'ilk öneriyi geç', aciklama:'Onaylar’daki bir öneriyi geçer; uygulanmaz.', parametreler:sira,
        kullanilir:() => !!(Y() && Y().bekleyenler), onizle:p => { const x = oneri(p); return x ? yetkiNiyet('red-tek', { id:x.id, metin:x.metin }) : { hata:'o sırada öneri yok' }; }, uygula:() => ({ ok:false }) },
      { ad:'onerilerin_hepsi', tur:'yaz', ornek:'hepsini onayla', aciklama:'Bekleyen bütün önerileri onaylar ya da geçer.',
        parametreler:{ type:'object', properties:{ karar:{ type:'string', enum:['onayla', 'gec'] } }, required:['karar'] },
        kullanilir:() => !!(Y() && Y().bekleyenler), onizle:p => yetkiNiyet(p.karar === 'onayla' ? 'onay-hepsi' : 'red-hepsi', {}), uygula:() => ({ ok:false }) },
      { ad:'ayar_degistir', tur:'yaz', ornek:'koyu temaya geç',
        aciklama:'LifeOS görünüm ayarı: tema (koyu, acik, sistem), animasyon (tam, az, sistem), zemin (sade, canli), muzik (cal, dur).',
        parametreler:{ type:'object', properties:{ ayar:{ type:'string', enum:Object.keys(YETKI_AYAR) }, deger:{ type:'string', maxLength:12 } }, required:['ayar', 'deger'] },
        kullanilir:() => !!Y(),
        onizle:p => { const a = YETKI_AYAR[p.ayar], v = a && a.degerler[KI.kucuk(p.deger).replace(/ı/g, 'i').replace('açık', 'acik').replace('canlı', 'canli')];
          return v ? yetkiNiyet(a.id, { v }) : { hata:p.ayar + ' için bu değer yok' }; }, uygula:() => ({ ok:false }) },
      { ad:'king_ayari', tur:'yaz', ornek:'cevapları sesli oku',
        aciklama:'King’in kendi tercihi: cevap (oto, ses, yazi), derinlik (oto, hizli, dengeli, derin), tarz (samimi, resmi, kisa), ses (oto, gemini, piper, cihaz).',
        parametreler:{ type:'object', properties:{ ayar:{ type:'string', enum:Object.keys(KING_AYAR) }, deger:{ type:'string', maxLength:12 } }, required:['ayar', 'deger'] },
        onizle:p => { const a = KING_AYAR[p.ayar];
          return a && a.degerler.indexOf(p.deger) >= 0 ? { metin:a.ad + ' «' + (a.adlar[p.deger] || p.deger) + '» olacak (şu an «' + (a.adlar[a.oku()] || a.oku()) + '»).' } : { hata:'bu değer yok' }; },
        uygula:p => { const a = KING_AYAR[p.ayar], eski = a.oku(); a.yaz(p.deger);
          return { metin:a.ad + ' artık «' + (a.adlar[p.deger] || p.deger) + '».', geriAl:async () => { a.yaz(eski); } }; } },
      { ad:'odak_baslat', tur:'oku', ornek:'25 dakika matematik çalışalım', aciklama:'King’in odak sayacını başlatır (kayıt yazmaz; bitince kaydetmeyi sorar).',
        parametreler:{ type:'object', properties:{ dakika:{ type:'integer', minimum:1, maximum:180 }, konu:{ type:'string', maxLength:60 } }, required:['dakika'] },
        calistir:p => { KI.odakBaslat(p.dakika, p.konu || ''); return { cevap:p.dakika + ' dakikalık odak başladı' + (p.konu ? ' (' + p.konu + ')' : '') + '. Süre dolunca haber vereceğim.' }; } },
      { ad:'odak_durdur', tur:'oku', ornek:'sayacı durdur', aciklama:'Çalışan odak sayacını durdurur.',
        calistir:() => { const v = KI.odak(); KI.odakTemizle(); KI.ortam.depo.sil(KI.ODAK); return { cevap:v ? 'Odak sayacını durdurdum.' : 'Çalışan bir odak sayacı yok.' }; } },
      { ad:'king_harcama', tur:'oku', ornek:'bugün ne harcadın', es:/((?:bugün )?ne (?:kadar )?harcad[ıi]n|harcaman(?:ı| ne)|kaç (?:jeton|token)|model çağrı)/,
        aciklama:'King’in bugünkü model kullanımı: çağrı, jeton, maliyet ve süre (Merkez’in defterinden; sayıyı HKM ölçer).',
        kullanilir:() => !!KI.baglanti(),
        calistir:async () => { await KI.eylemTazele(); const o = KI.harcamaOzet(KI.harcama);
          return o ? { sonuc:KI.harcama, cevap:o.cumle } : { hata:'Merkez’den harcama okunamadı' }; } },
      /* KING-4 §E dış dünya: her yetenek ayrı izinli (HKM `dis_dunya`, varsayılan kapalı), her eylem onaylı
         («Onaylıyorum»), HKM deftere yazar ve geri alır (core/disdunya.py). Ekran okuma bir şey değiştirmese de
         ekran içeriği dışarı çıktığı için bu kapıdan geçer (§G kademesi «dış»). */
      ...disAraclar(),
      ...gunAraclari(),
      { ad:'merkez_raporu', tur:'oku', ornek:'haftalık değerlendirme', aciklama:'Merkez’in raporu: hafta (haftalık değerlendirme) ya da capraz (modüller arası bulgular); sayıları kural motoru yazar.',
        parametreler:{ type:'object', properties:{ tur:{ type:'string', enum:['hafta', 'capraz'] } }, required:['tur'] },
        calistir:p => akisla(m => KI.merkezKomut(m, p.tur, p.tur === 'hafta' ? 'Haftalık değerlendirme' : 'Modüller arası bulgular')) },
    ];
    /* Modülün yetki eylemleri (toplantı, inceleme, kitap ekle; yetki.js söz 8–9). */
    const y = Y();
    (y && y.ekKatalog ? y.ekKatalog() : []).forEach(e => {
      l.push({ ad:'eylem_' + e.id.replace(/[^a-z0-9]+/g, '_'), tur:'yaz', aciklama:e.aciklama || e.ad + '.', ornek:e.ad.toLocaleLowerCase('tr'), anahtar:e.anahtar,
        parametreler:e.parametreler || undefined, onizle:p => yetkiNiyet(e.id, p), uygula:() => ({ ok:false }) });
    });
    return l;
  }

  /* Adım satırı için aracın insan adı: açıklamanın ilk parçası. */
  function aracAdi(ad){
    const a = ARAC() && ARAC().bul(ad);
    return a ? String(a.ozetAd || a.aciklama).split(/[.:;(]/)[0].trim().slice(0, 60) : ad;
  }
  /* Yazan aracın önizlemesi onay kartı olur (model seçimi ve söz 37'nin fotoğraf işi aynı kart). */
  /* Onay kartı tek dokunuş (KING-4 §F); dış dünya (§G) dönüş noktası değil, dışarıya dokunur. */
  const onayAdi = n => n.dis ? 'Onaylıyorum' : n.seviye === 'buyuk' ? 'Dönüş noktası al ve uygula' : 'Onayla';
  const onaySorusu = n => n.dis ? 'Bilgisayarına ya da telefonuna dokunur: düğmeye dokun ya da «Onaylıyorum» yaz.'
    : n.seviye === 'buyuk' ? 'Büyük değişiklik: «Onaylıyorum» yaz ya da düğmeye dokun.' : 'Onaylıyor musun?';
  function aracKart(o, onMetin, ekSatir){
    if(o.onizle.veri){
      /* Kayıt: yerel veri önizlemesiyle aynı kart (söz 3, 8). */
      const p = o.onizle.veri;
      KI.bekleyen = p;
      KI.cipler = [{ ad:'Evet, ekle', is:'kaydet' }, { ad:'Hayır', is:'vazgec' }];
      const s = KI.sohbet(p, '', false);
      KI.soyle(s.selam, null, { metin:p.metin, liste:(p.parcalar || []).length > 1 ? p.parcalar.map(x => x.metin) : null, ipucu:p.ipucu || '' }, s.soru);
      return { tur:'arac-veri', ad:o.ad };
    }
    const n = o.onizle.yetki ? o.onizle.yetki : { tur:'eylem', arac:true, ad:o.ad, param:o.param, seviye:o.seviye, dis:o.dis, onizle:o.onizle };
    KI.bekleyenYetki = n;
    KI.cipler = [{ is:'yetki-onay', ad:onayAdi(n) }, { is:'vazgec', ad:'Vazgeç' }];
    const satir = (n.onizle.satirlar || []).concat(Array.isArray(ekSatir) ? ekSatir : []);
    KI.soyle((onMetin ? onMetin + ' ' : '') + n.onizle.metin, satir.length ? satir : null, null, onaySorusu(n), { onay:true });
    return { tur:'arac-yaz', ad:o.ad, seviye:n.seviye };
  }

  /* Modelin seçimi (HKM'de doğrulanmış) burada YENİDEN doğrulanır ve çalışır. */
  async function aracIsle(r, metin){
    const A = ARAC();
    if(!A) return null;
    const red = (Array.isArray(r.reddedilen) ? r.reddedilen : []).slice();
    const sonuclar = [], dogrudan = [];
    let yazma = null, yerine = false;
    for(const c of (r.arac || []).slice(0, 3)){
      const d = A.dogrula(c && c.ad, c && c.param);
      if(!d.ok){ red.push({ ad:String(c && c.ad || ''), neden:d.hata }); continue; }
      if(d.arac.tur === 'yaz'){ if(!yazma) yazma = d; continue; }
      const x = await A.calistir(d.arac.ad, d.param, { metin });
      if(!x.ok){ red.push({ ad:d.arac.ad, neden:x.hata }); continue; }
      if(x.yerine) yerine = true;
      else if(x.cevap) dogrudan.push(x);
      else sonuclar.push(x);
    }
    if(yazma){
      const o = await A.onizle(yazma.arac.ad, yazma.param, { metin });
      if(!o.ok){
        KI.soyle('Bunu yapmak istedim ama olmadı: ' + o.hata + '. Kendi cümlenle yazarsan ya da sayfasından yaparsan olur.');
        return { tur:'arac-red' };
      }
      return aracKart(o);
    }
    dogrudan.forEach(x => KI.soyle(x.cevap, x.satirlar));
    if(sonuclar.length){
      /* İkinci tur: sonucu kod üretti; model yalnız cümleye çevirir (HKM sayıyı denetler).
         A4: model yine araç isterse (HKM döngüsü, en çok 4 adım) okumalar yapılır,
         adımlar bekleme balonunda canlı görünür, bütün sonuçlar yeniden yollanır. */
      const adimlar = sonuclar.map(x => ({ ad:aracAdi(x.ad), durum:'bitti' }));
      const bek = { kim:'king', bekliyor:true, metin:'', adimlar };
      KI.akis.push(bek); KI.ciz(false);
      const t0 = KI.ortam.simdi().getTime();
      let r2 = await KI.merkezeSor(metin, bek, { arac_sonuclari:sonuclar.map(x => ({ ad:x.ad, param:x.param, sonuc:x.sonuc })), dongu:{ adim:1, gecen_ms:0 } });
      for(let tur = 0; r2.ok && r2.arac && r2.dongu && tur < 4; tur++){
        let yeni = 0;
        for(const c of r2.arac.slice(0, 3)){
          const d = A.dogrula(c && c.ad, c && c.param);
          if(!d.ok || d.arac.tur !== 'oku' || sonuclar.some(x => x.ad === d.arac.ad && JSON.stringify(x.param) === JSON.stringify(d.param))) continue;
          const adim = { ad:aracAdi(d.arac.ad), durum:'calisiyor' };
          adimlar.push(adim); KI.ciz(false);
          const x = await A.calistir(d.arac.ad, d.param, { metin });
          adim.durum = x.ok ? 'bitti' : 'red';
          if(x.ok){ sonuclar.push(x); yeni++; }
          KI.ciz(false);
        }
        if(!yeni) break;
        r2 = await KI.merkezeSor(metin, bek, { arac_sonuclari:sonuclar.map(x => ({ ad:x.ad, param:x.param, sonuc:x.sonuc })),
          dongu:{ adim:Number(r2.dongu.adim) || tur + 2, gecen_ms:KI.ortam.simdi().getTime() - t0 } });
      }
      KI.akis = KI.akis.filter(m => m !== bek);
      const satir = [].concat.apply([], sonuclar.map(x => x.satirlar || []));
      const adimEk = adimlar.length > 1 ? { adimlar } : {};
      if(r2.ok && !r2.arac) KI.soyle(r2.text, satir.length ? satir : null, null, null, Object.assign(adimEk, r2.akti ? { yeni:false, okunan:r2.okunan } : {}));
      else KI.soyle(satir.length ? 'Sistemden okudum:' : 'Sistemden okudum ama Merkez cümleye çeviremedi; ilgili sayfadan bakabilirsin.', satir.length ? satir : null, null, null, adimEk);
      KI.cipler = KI.oneriListesi(true);
      KI.ciz(false);
      return { tur:'arac-oku', n:sonuclar.length };
    }
    if(yerine || dogrudan.length) return { tur:'arac-oku', n:dogrudan.length };
    return null;
  }

  /* A3: niyetle seçilen yazma aracının tek zorunlu metin parametresi cümlede
     yoksa tahmin edilmez, sorulur (AGENTS §1.7): «kitap ekle» → «Hangi kitap?».
     Sonraki cümle o parametre olur ve araç her zamanki gibi önizlenir. */
  function niyetSor(N){
    const a = ARAC() && ARAC().bul(N.ad);
    const s = a && a.tur === 'yaz' && a.parametreler;
    const eksik = s ? (s.required || []).filter(k => N.param[k] == null) : [];
    const p = eksik.length === 1 && s.properties[eksik[0]];
    if(!p || p.type !== 'string') return null;
    KI.bekleyenNiyet = { ad:a.ad, param:N.param, k:eksik[0] };
    KI.cipler = [{ is:'vazgec', ad:'Vazgeç' }];
    KI.soyle((a.ozetAd || String(a.aciklama).split(/[.:;(]/)[0]).trim() + ' için ' + (p.description || eksik[0]) + ' ne olsun?');
    return { tur:'arac-sor', ad:a.ad };
  }
  async function niyetCevap(metin){
    const b = KI.bekleyenNiyet;
    KI.bekleyenNiyet = null;
    KI.akis.push({ kim:'sen', metin:String(metin).trim() });
    KI.cipler = null;
    const r = await aracIsle({ arac:[{ ad:b.ad, param:Object.assign({}, b.param, { [b.k]:String(metin).trim().slice(0, 120) }) }] }, metin);
    if(r) return r;
    KI.soyle('Bunu yapamadım; sayfasından ya da tam cümleyle dener misin?');
    return { tur:'arac-red' };
  }

  function gitOnayla(){
    const h = KI.bekleyenGit;
    KI.bekleyenGit = null; KI.bekleyenIlet = null; KI.cipler = null;
    if(!h) return;
    KI.soyle(eylemCumlesi(h, 'Tamam.'));
    KI.ortam.zamanla(() => KI.git(h), KI.sesli ? 1100 : 650);
  }

  function hazirSec(i){
    const h = KI.HAZIR[i];
    if(!h) return;
    KI.akis.push({ kim:'sen', metin:h.ad });
    if(h.ozet){ KI.cipler = null; const s = KI.ozetSatirlari(); KI.soyle(s.length ? (KI.MODUL_AD[KI.ayar.modul] || '') + '’de bugün:' : 'Bugün için henüz bir şey yok.', s); return; }
    KI.soyle(eylemCumlesi(h, h.cevap));
    KI.ortam.zamanla(() => KI.git(h), KI.sesli ? 1100 : 650);
  }

  /* «Kolay gelsin. Hareket’i açıyorum.» — ne yapılacağını söyler (eylemsel). */
  function eylemCumlesi(h, cevap){
    const s = h && KI.SAYFALAR.find(x => x.modul === h.modul && x.route === h.route);
    const yer = s ? s.ad + (h.modul !== (KI.ayar && KI.ayar.modul) ? ' (' + KI.MODUL_AD[h.modul] + ')' : '') : '';
    return (cevap || 'Kolay gelsin.') + (yer ? ' ' + yer + ' açılıyor.' : '');
  }

  Object.assign(KI, { onayAdi, onaySorusu, D, ONCELIK_RE, oncelikIsle, siraliHtml, NOT_RE, notPuanla, notAra, RITIM_RE, HEDEF, haftaHedefi, ritimBaslat, ritimIsle, YUK_RE, yukIsle, GUNLUK_RE, gunlukIsle, gunlukBitir, DENEY, DENEY_RE, DENEY_DURUM_RE, deneyOku, deneyBaslat, deneyOlcuSec, deneyHesap, deneyDurum, hesapla, birimCevir, YAP, yapilacaklar, yapYaz, yapHtml, HATIR, hatirlatmalar, hatirYaz, hatirlatKur, rastgele, nefesHtml, aracKutusu, yetkiKatalog, yetkiUygula, ARAC, HARITA_RE, ayarHtml, haritaCevap, haritaIsle, ortakAraclar, aracKart, aracIsle, niyetSor, niyetCevap, gitOnayla, hazirSec, eylemCumlesi });
})();
