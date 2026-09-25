/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/vitrinkart.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Vitrin kartları — kataloğun kartları gerçek veriyle (brand/ortak/vitrin.js).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/vitrinkart.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kural (ekip/EKIP-PLANI.md §4.1): test adında özelliğin numarası geçer
   (`oz-046 …`). Her kart için iki yön sınanır: veri varken vitrinin
   işaretlemesi çıkar; veri yokken kart ya hiç çizilmez ya «—» yazar,
   hiçbir zaman 0 uydurmaz. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const V = () => window.LIFEOS.VITRIN;

  function sahne(markup){
    const k = document.createElement('div');
    k.style.cssText = 'position:absolute;left:-9999px;top:0;width:420px';
    k.innerHTML = markup;
    document.body.appendChild(k);
    return k;
  }
  function icinde(markup, fn){
    const k = sahne(markup);
    try{ fn(k); } finally { k.remove(); }
  }

describe('Vitrin kartı · çekirdek', () => {
  it('her kart vitrin kökünü ve katalog numarasını taşır', () => {
    icinde(V().kok('046', 'x25', '<p>x</p>'), k => {
      const kok = k.firstElementChild;
      expect(kok.classList.contains('vk')).toBeTruthy();
      expect(kok.getAttribute('data-oz')).toBe('046');
      expect(kok.firstElementChild.className).toBe('d x25');
    });
  });
  it('kesinlik etiketi dört etiketten biridir; bilinmeyen «veri yok» olur', () => {
    expect(V().et('estimated')).toContain('TAHMİN');
    expect(V().et('computed')).toContain('class="et h"');
    expect(V().et('uydurma')).toContain('data-kesinlik="missing"');
  });
  it('sayı tr-TR ile yazılır; eksik sayı «—», eksi işareti tipografik', () => {
    expect(V().sayi(14.25, 2)).toBe('14,25');
    expect(V().sayi(null)).toBe('—');
    expect(V().isaretli(-1.75, 2)).toBe('−1,75');
    expect(V().dkMetni(380)).toBe('6 sa 20 dk');
  });
  it('fark rozeti yönden renk alır; eşiğin altı nötrdür', () => {
    expect(V().fk(2, { esik:1 })).toContain('fk i');
    expect(V().fk(-1.75, { esik:1, ondalik:2 })).toContain('fk k');
    expect(V().fk(0.25, { esik:1, ondalik:2 })).toContain('fk n');
    expect(V().fk(null)).toContain('—');
  });
});

describe('C · AYS kartları', () => {
  it('oz-043 geri sayım uzakta sakin, son 15 dakikada canlıdır', () => {
    expect(V().geriSayim({ dakika:380 })).toContain('UZAKTA · SAKİN');
    expect(V().geriSayim({ dakika:380 })).toContain('6 sa 20 dk');
    const c = V().geriSayim({ dakika:14 });
    expect(c).toContain('SON 15 DK · CANLI');
    expect(c).toContain('is-canli');
    expect(V().geriSayim({ dakika:null })).toBe('');
  });

  it('oz-044 çözerken doğru/yanlış rengi yoktur; set bitince açılır', () => {
    icinde(V().notrSerit({ cevaplar:[true, true, false, null] }), k => {
      expect(k.textContent).toContain('ÇÖZERKEN · 2 / 4');
      expect(k.querySelectorAll('.t-i, .t-k')).toHaveLength(0);
      expect(k.querySelectorAll('.t-g')).toHaveLength(2);
    });
    icinde(V().notrSerit({ sonuclar:['d', 'y', null, 'd'] }), k => {
      expect(k.textContent).toContain('2 D · 1 Y · 1 B');
      expect(k.querySelectorAll('.t-i')).toHaveLength(2);
      expect(k.querySelectorAll('.t-k')).toHaveLength(1);
    });
  });

  it('oz-045 yanlış kartı önde soru, arkada neden; çevrilmiş hâl işaretli', () => {
    icinde(V().yanlisKarti({ on:'Ana fikir?', arka:'Ayrıntıyı ana fikir sandım.', arkaAd:'yanlış notu', cevrik:true, act:'flip' }), k => {
      const kok = k.firstElementChild;
      expect(kok.getAttribute('role')).toBe('button');
      expect(kok.getAttribute('aria-pressed')).toBe('true');
      expect(k.querySelector('.kk.is-cevrik')).toBeTruthy();
      expect(k.textContent).toContain('YANLIŞ NOTU');
    });
    expect(V().yanlisKarti({ on:'' })).toBe('');
  });

  it('oz-046 deneme karnesinde satır uzunluğu soru sayısıyla orantılı; net koddan gelir', () => {
    const satirlar = [{ ad:'Türkçe', d:34, y:4, b:2, net:33 }, { ad:'Sosyal', d:15, y:3, b:2, net:14.25 }];
    icinde(V().denemeKarnesi({ aile:'TYT', satirlar, toplam:47.25 }), k => {
      const br = k.querySelectorAll('.br');
      expect(br[0].style.width).toBe('100%');       // 40 soru en uzun
      expect(br[1].style.width).toBe('50%');        // 20 soru → yarısı
      expect(k.querySelector('.r em').textContent).toBe('33');
      expect(k.querySelector('.top b').textContent).toBe('47,25');
    });
    /* Girilmemiş ders çubuğa 0 olarak çizilmez: «—». */
    icinde(V().denemeKarnesi({ satirlar:[{ ad:'Fen', d:null, y:null, b:null, net:null }], toplam:null }), k => {
      expect(k.querySelector('.r em').textContent).toBe('—');
      expect(k.querySelectorAll('.br i')).toHaveLength(0);
    });
  });

  it('oz-047 hız şeridinde ortalamanın 1,5 katını geçen soru öne çıkar', () => {
    icinde(V().hizSeridi({ sureler:[60, 60, 60, 60, 200] }), k => {
      expect(k.querySelectorAll('circle[r="3.6"]')).toHaveLength(1);
      expect(k.querySelector('svg').getAttribute('aria-label')).toContain('1 soru');
    });
    expect(V().hizSeridi({ sureler:[60] })).toBe('');
  });

  it('oz-048 deneme karşılaştırması ders ders fark rozeti taşır', () => {
    icinde(V().denemeKarsilastirma({ onceAd:'D12', sonraAd:'D13',
      satirlar:[{ ad:'Türkçe', once:31, sonra:33 }, { ad:'Fen', once:13, sonra:11.25 }], toplam:{ once:44, sonra:44.25 } }), k => {
      expect(k.querySelectorAll('.fk.i')).toHaveLength(1);
      expect(k.querySelectorAll('.fk.k')).toHaveLength(1);
      expect(k.querySelector('.r.top .fk').className).toContain('n');
    });
  });

  it('oz-049 kapsam halkası: plan yoksa oran yoktur', () => {
    icinde(V().kapsamHalkasi({ satirlar:[{ ad:'Türev', cozulen:48, plan:60 }, { ad:'Limit', cozulen:6, plan:null }] }), k => {
      expect(k.querySelector('.hl').style.getPropertyValue('--p')).toBe('80');
      expect(k.querySelectorAll('.hl--yok')).toHaveLength(1);
      expect(k.textContent).toContain('— / —');
    });
  });

  it('oz-050 konu zincirinde eksik önkoşul kesik çerçevelidir', () => {
    icinde(V().konuZinciri({ halkalar:[{ ad:'Limit', p:10, eksik:true }, { ad:'Türev', p:80 }] }), k => {
      expect(k.querySelector('.dg.ek').textContent).toContain('önce bu');
      expect(k.textContent).toContain('%80');
    });
  });

  it('oz-051 40 hafta çizgisi: geçen, bu hafta, ara haftası ayrı işaret', () => {
    icinde(V().haftaCizgisi({ hafta:3, toplam:10, ara:[6] }), k => {
      expect(k.querySelectorAll('.t-g')).toHaveLength(2);
      expect(k.querySelectorAll('.t-n')).toHaveLength(1);
      expect(k.querySelectorAll('.t-h')).toHaveLength(1);
      expect(k.textContent).toContain('3 / 10 HAFTA');
    });
  });

  it('oz-052 plan ızgarası yuvaları saat uydurmadan dizer; bugün çerçeveli', () => {
    icinde(V().planIzgarasi({ gunler:['Pt', 'Sa'], bugun:1, yuvalar:['Ana ders', 'Rutin'],
      bloklar:[{ gun:0, yuva:0, gecti:true }, { gun:1, yuva:1 }] }), k => {
      expect(k.querySelectorAll('.bk')).toHaveLength(2);
      expect(k.querySelectorAll('.bk.s')).toHaveLength(1);
      expect(k.querySelector('.bgn').style.gridColumn).toContain('3');
      expect(k.textContent).toContain('Ana ders');
      expect(/\d\d:\d\d/.test(k.textContent)).toBeFalsy();
    });
  });

  it('oz-053 ara haftası önizlemesi etkilenen haftayı ve seviyeyi gösterir', () => {
    const h = V().araHaftasi({ haftalar:[{ ad:'H9' }, { ad:'H10', durum:'a' }], seviye:'orta', ozet:'7 gün boşalır', act:'x' });
    expect(h).toContain('class="a"');
    expect(h).toContain('ORTA');
    expect(h).toContain('data-act="x"');
  });

  it('oz-054 taşıma gölgesi eski yeri hayalet, taşınanı havada çizer; Geri al kalır', () => {
    const h = V().tasimaGolgesi({ bloklar:[{ ad:'Paragraf', hayalet:true }, { ad:'Paragraf', not:'Salı', tasinan:true }], act:'geri' });
    expect(h).toContain('bl hy');
    expect(h).toContain('bl ts');
    expect(h).toContain('Geri al');
  });

  it('oz-055 tek satır soru: üç seçim ve Enter, açılır pencere yok', () => {
    icinde(V().tekSatirSoru({ id:'qh', act:'q-hizli', dersler:[{ value:'mat', label:'Matematik' }],
      konular:[{ value:'turev', label:'Türev' }], sonuclar:[{ value:'dogru', label:'Doğru', iyi:true }], sonuc:'dogru' }), k => {
      expect(k.querySelectorAll('select')).toHaveLength(3);
      expect(k.querySelector('[data-act="q-hizli"]')).toBeTruthy();
      expect(k.querySelector('.ci.i')).toBeTruthy();
    });
  });

  it('oz-056 yanlış nedenleri beyandır; toplam ve dağılım kayıttan', () => {
    icinde(V().yanlisNedenleri({ nedenler:[{ ad:'Bilgi', n:9 }, { ad:'Dikkat', n:6 }, { ad:'Süre', n:0 }] }), k => {
      expect(k.querySelector('.u b').textContent).toBe('15 yanlış');
      expect(k.querySelectorAll('.br i')).toHaveLength(2);    // sıfır olan dağılıma girmez
      expect(k.textContent).toContain('BEYAN');
    });
    expect(V().yanlisNedenleri({ nedenler:[] })).toBe('');
  });

  it('oz-057 deneme takviminde geçmiş netiyle, sıradaki parlayarak', () => {
    const h = V().denemeTakvimi({ bugun:30, ogeler:[{ ad:'D13', yer:8, not:'82 net', durum:'g' }, { ad:'D14', yer:40, not:'3 gün sonra', durum:'y' }] });
    expect(h).toContain('nk g');
    expect(h).toContain('nk y');
    expect(h).toContain('--bugun:30%');
  });

  it('oz-058 soru ekranı çözerken doğru/yanlış göstermez; yalnız seçili şık', () => {
    icinde(V().soruEkrani({ no:3, toplam:10, soru:'Hangisi?', secenekler:['a', 'b', 'c'], secili:1, act:'kitap-sec' }), k => {
      expect(k.textContent).toContain('SORU 3 / 10');
      expect(k.querySelectorAll('.sik')).toHaveLength(3);
      expect(k.querySelectorAll('.sik.on')).toHaveLength(1);
      expect(k.innerHTML.indexOf('is-correct') < 0 && k.innerHTML.indexOf('is-wrong') < 0).toBeTruthy();
    });
  });

  it('oz-059 tekrar paketi: toplam süre TAHMİN etiketiyle', () => {
    const h = V().tekrarPaketi({ konular:[{ ad:'Paragraf', n:18, dk:6 }, { ad:'Türev', n:12, dk:4 }], dakika:10, act:'p' });
    expect(h).toContain('30 kart');
    expect(h).toContain('data-kesinlik="estimated"');
  });

  it('oz-060 blok bitiş özeti üç sayı ve sıradaki işi gösterir; sayılar kayıttan', () => {
    icinde(V().blokBitis({ ad:'Paragraf', soru:30, dogru:23, digerleri:7, dk:64, planDk:70,
      sonraki:{ ad:'Analiz', dk:10, act:'timer-start', data:{ 'data-block':'b2' } } }), k => {
      expect(k.querySelector('.bs').textContent).toBe('Paragraf tamam.');
      expect(k.querySelectorAll('.uc > div')).toHaveLength(3);
      expect(k.textContent).toContain('plan 70');
      expect(k.querySelector('[data-act="timer-start"]').getAttribute('data-block')).toBe('b2');
    });
    /* Doğru sayısı girilmemişse «—»: 0 doğru yazılmaz. */
    expect(V().blokBitis({ ad:'X', soru:10, dogru:null, dk:30 })).toContain('<b>—</b>');
  });

  it('oz-061 ders dengesi plan ve gerçeği alt alta, farkı tek rozetle', () => {
    const h = V().dersDengesi({ plan:[{ harf:'M', ad:'Mat', pay:35 }], gercek:[{ harf:'M', ad:'Mat', pay:44 }], not:'Matematik planın üstünde', fark:9 });
    expect(h).toContain('PLAN');
    expect(h).toContain('GERÇEK');
    expect(h).toContain('+9 puan');
  });

  it('oz-062 deneme girişinde hücreler giriş kutusudur; neti kod hesaplar', () => {
    icinde(V().denemeGirisi({ change:'test-num', satirlar:[{ i:0, ad:'Türkçe', correct:34, wrong:4, blank:2, net:33, dogruluk:89 }], toplam:33 }), k => {
      expect(k.querySelectorAll('input')).toHaveLength(3);
      expect(k.querySelector('input').getAttribute('data-change')).toBe('test-num');
      expect(k.querySelector('.r:not(.bs) b').textContent).toBe('33');
      expect(k.textContent).toContain('NETİ KOD HESAPLAR');
    });
  });

  it('oz-063 konu tablosu: süzgeç, kapsam halkası, son çalışma, önkoşul', () => {
    icinde(V().konuTablosu({ act:'topic-open', suzgecAct:'f', suzgec:[{ value:'TYT', label:'TYT', on:true }],
      konular:[{ ad:'Limit', p:null, son:'9 gün önce', onkosul:true }] }), k => {
      expect(k.querySelector('.sz .on').textContent).toBe('TYT');
      expect(k.querySelector('.uy2').textContent).toBe('ÖNKOŞUL');
      expect(k.querySelectorAll('.hl--yok')).toHaveLength(1);
    });
  });

  it('oz-064 hedef ayarı küçük ve geri alınır; toplam hesaplanmıştır', () => {
    const h = V().hedefAyari({ hedef:18, haftaToplam:126, act:'hedef-ayar', data:{ 'data-kind':'paragraph' } });
    expect(h).toContain('KÜÇÜK · GERİ ALINIR');
    expect(h).toContain('data-delta="-1"');
    expect(h).toContain('126');
  });

  it('oz-065 tekrar takvimi aralıkları koddan; sıradaki halka parlıyor', () => {
    icinde(V().tekrarTakvimi({ adimlar:[1, 3, 7, 30], asama:2, baslik:'Kart' }), k => {
      expect(k.querySelectorAll('.nk.b')).toHaveLength(2);
      expect(k.querySelectorAll('.nk.y')).toHaveLength(1);
      expect(k.textContent).toContain('+30 gün');
    });
  });

  it('oz-066 hedefe kalan: hedef tahminse etiket de tahmin', () => {
    const h = V().hedefeKalan({ simdi:82, hedef:90, kalanHafta:38, haftalik:0.21, birim:'net', kesinlik:'estimated' });
    expect(h).toContain('38 HAFTA KALDI');
    expect(h).toContain('+0,21');
    expect(h).toContain('data-kesinlik="estimated"');
    expect(V().hedefeKalan({ simdi:null, hedef:90 })).toBe('');
  });

  it('oz-067 ders işaretleri renksizdir: harf ve desen', () => {
    icinde(V().dersIsaretleri({ dersler:[{ harf:'T', ad:'Türkçe' }, { harf:'M', ad:'Matematik' }] }), k => {
      expect(k.querySelector('.d1').textContent).toBe('T');
      expect(k.querySelector('.d2')).toBeTruthy();
    });
  });
});


describe('D · SPİ kartları', () => {
  it('oz-068 toparlanma halkası: tek sayı ortada, her kaynak kendi etiketiyle; girilmeyen kaynak veri yok', () => {
    icinde(V().toparlanmaHalkasi({ deger:72, dilimler:[{ ad:'Uyku', agirlik:0.4, kesinlik:'measured' },
      { ad:'HRV', agirlik:0.3, kesinlik:'missing' }, { ad:'Nabız', agirlik:0.3, kesinlik:'measured' }] }), k => {
      expect(k.querySelector('text').textContent).toBe('72');
      expect(k.querySelectorAll('circle').length).toBe(3);    // iz + iki ölçülen dilim
      expect(k.querySelector('[data-kesinlik="missing"]')).toBeTruthy();
    });
    expect(V().toparlanmaHalkasi({ deger:null, dilimler:[] })).toBe('');
  });
  it('oz-069 uyku bandı saat uydurmaz; veri olmayan gece kesik', () => {
    icinde(V().uykuBandi({ geceler:[{ ad:'Pzt', saat:null }, { ad:'Sal', saat:7 }] }), k => {
      expect(k.querySelector('.bn i').style.width).toBe(Math.round(7 / 12 * 1000) / 10 + '%');
      expect(k.querySelectorAll('.gc i.yok')).toHaveLength(1);
      expect(/\d\d:\d\d/.test(k.textContent)).toBeFalsy();
    });
  });
  it('oz-070 ham noktalar ve yedi günlük ortalama; eksik gün ne nokta ne ortalama', () => {
    icinde(V().hamOrtalama({ birim:'kg', noktalar:[{ deger:71 }, { deger:null }, { deger:72 }, { deger:71.5 }] }), k => {
      expect(k.querySelectorAll('circle')).toHaveLength(3);
      expect(k.textContent).toContain('7 GÜN ORT. 71,5');
    });
    expect(V().hamOrtalama({ noktalar:[{ deger:71 }] })).toBe('');
  });
  it('oz-071 referans bandı: aralık dışı yalnız işaretlenir, yorum yok', () => {
    icinde(V().referansBandi({ satirlar:[{ ad:'D vitamini', deger:18, ref:[30, 100] }, { ad:'B12', deger:450, ref:[200, 900] }] }), k => {
      expect(k.querySelectorAll('.nk.dis')).toHaveLength(1);
      expect(k.textContent).toContain('hekiminle konuş');
    });
  });
  it('oz-072 tabak: kalan protein ortada; girilmemişse «—»', () => {
    expect(V().tabak({ bolmeler:[{ ad:'Protein', pay:400, kalan:38 }, { ad:'Yağ', pay:500, kalan:20 }] })).toContain('<b>38</b>');
    expect(V().tabak({ bolmeler:[{ ad:'Protein', pay:400, kalan:null }] })).toContain('<b>—</b>');
  });
  it('oz-073 tek dokunuş sayaç: bardaklar dolar; girilmemiş gün sıfır yazmaz', () => {
    icinde(V().tekDokunus({ hedef:8, adet:5, act:'su-ekle' }), k => {
      expect(k.querySelectorAll('path[fill="var(--spi)"]')).toHaveLength(5);
      expect(k.querySelector('[data-act="su-ekle"]')).toBeTruthy();
    });
    expect(V().tekDokunus({ hedef:8, adet:null, act:'x' })).toContain('Girilmedi');
  });
  it('oz-074 enerji ölçeği beş nokta; seçilen işaretli ve beyan', () => {
    icinde(V().enerjiOlcegi({ deger:4, act:'set-soreness' }), k => {
      expect(k.querySelectorAll('.ol button')).toHaveLength(5);
      expect(k.querySelector('.ol .on').textContent).toBe('4');
      expect(k.textContent).toContain('BEYAN');
    });
  });
  it('oz-075 set kutucukları: biten set dolu', () => {
    icinde(V().setKutucuklari({ act:'set-bitti', hareketler:[{ i:0, ad:'Şınav', set:3, biten:2 }] }), k => {
      expect(k.querySelectorAll('.st button')).toHaveLength(3);
      expect(k.querySelectorAll('.st button.d')).toHaveLength(2);
    });
  });
  it('oz-076 haftalık halkalar: verisi olmayan gün kesik boş halka', () => {
    const g = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((ad, i) => ({ ad, p:50, yok:i === 2, gelecek:i > 3, bugun:i === 3 }));
    icinde(V().haftaHalkalari({ gunler:g }), k => {
      expect(k.querySelectorAll('.hl.yok')).toHaveLength(1);
      expect(k.textContent).toContain('ÇAR · VERİ YOK');
    });
  });
  it('oz-077 tuş takımı: büyük rakam, dünkü değer ve fark', () => {
    icinde(V().tusTakimi({ metin:'71,4', deger:71.4, dun:71.2, birim:'kg', act:'tus', kaydet:'tus-kaydet' }), k => {
      expect(k.querySelector('b').textContent).toContain('71,4');
      expect(k.textContent).toContain('dün 71,2 · fark +0,2');
      expect(k.querySelector('[data-act="tus-kaydet"]')).toBeTruthy();
    });
  });
  it('oz-078 sonraki kontrol hatırlatır, yorumlamaz', () => {
    const h = V().sonrakiKontrol({ tarih:'2026-10-15', ad:'Kan tahlili', ne:'3 hafta sonra' });
    expect(h).toContain('EKİ');
    expect(h).toContain('SPİ yorumlamaz');
  });
  it('oz-079 harcama şeritleri: aşım yalnız çizgide; bilinmeyen tutar «—»', () => {
    icinde(V().harcamaSeritleri({ limit:1000, satirlar:[{ ad:'Gıda', tutar:1300 }, { ad:'Ekipman', tutar:null }] }), k => {
      expect(k.querySelectorAll('.r.as')).toHaveLength(1);
      expect(k.querySelectorAll('.r')[1].textContent).toContain('—');
    });
  });
  it('oz-080 öğün çizelgesi: öğün noktası ve yeme aralığı', () => {
    icinde(V().ogunCizelgesi({ ogunler:[{ saat:8, ad:'Kahvaltı' }, { saat:20, ad:'Akşam' }] }), k => {
      expect(k.querySelectorAll('.og')).toHaveLength(2);
      expect(k.textContent).toContain('yeme aralığı 12 sa');
    });
  });
  it('oz-081 oz-082 oz-083 oz-087 veri yoksa kart yok (bölge, harcama günü, yatış saati, düzenli gider)', () => {
    expect(V().yogunlukBolgeleri({ bolgeler:[] })).toBe('');
    expect(V().harcamaTakvimi({ gunler:[] })).toBe('');
    expect(V().uykuDuzeni({ geceler:[{ yatis:23 }] })).toBe('');
    expect(V().duzenliGiderler({ giderler:[] })).toBe('');
    expect(V().yogunlukBolgeleri({ bolgeler:[{ ad:'Z1', dk:8 }, { ad:'Z2', dk:18 }] })).toContain('26 dk');
    expect(V().duzenliGiderler({ bugun:24, giderler:[{ gun:1, ad:'Kira', tutar:100 }, { gun:28, ad:'Salon', tutar:50 }] })).toContain('4 GÜN SONRA');
  });
  it('oz-084 tahlil karşılaştırması: aralık dışı yalnız çerçeve; ölçülmeyen «—»', () => {
    icinde(V().tahlilKarsilastirma({ onceAd:'Mar', sonraAd:'Eyl', satirlar:[{ ad:'D vitamini', once:18, sonra:null, ref:[30, 100] }] }), k => {
      expect(k.querySelectorAll('.ds2')).toHaveLength(1);
      expect(k.querySelector('em[title="ölçülmedi"]')).toBeTruthy();
    });
  });
  it('oz-085 öğün şablonları tek dokunuş; bugün eklenen işaretli', () => {
    icinde(V().ogunSablonlari({ act:'sablon-ekle', sablonlar:[{ ad:'Öğle', icerik:'tavuk · pilav', on:true }, { ad:'Ara', icerik:'yoğurt' }] }), k => {
      expect(k.querySelectorAll('[data-act="sablon-ekle"]')).toHaveLength(2);
      expect(k.querySelector('.on em').textContent).toBe('✓');
    });
  });
  it('oz-086 antrenman haftası: kaydı olmayan geçmiş gün dinlenme sayılmaz', () => {
    const g = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((ad, i) => ({ ad, gecti:i < 3, yapilan:i === 0 ? 'Üst gövde' : null, bugun:i === 3 }));
    icinde(V().antrenmanHaftasi({ gunler:g }), k => {
      expect(k.querySelectorAll('i.d')).toHaveLength(1);
      expect(k.querySelectorAll('i.bos')).toHaveLength(2);
      expect(k.textContent.indexOf('Dinlen') < 0).toBeTruthy();
    });
  });
  it('oz-088 ölçüm hatırlatıcısı: ölçülmezse boş kalır', () => {
    expect(V().olcumHatirlatici({ saatler:['07:30'], acik:true, act:'ht-ac', olculdu:'Bugün 07:34’te ölçüldü' })).toContain('07:34');
    expect(V().olcumHatirlatici({ saatler:[], acik:false, act:'ht-ac' })).toContain('Bugün henüz ölçülmedi');
  });
});

})();
