/* Grafik parçaları — 027 eksik gün, 035 aralık, 037 eğilim, 041 doluluk.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/grafik.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kural (ekip/EKIP-PLANI.md §4.1): P1 kartının kabul ölçütü testin İLK
   satırıdır ve test adında özelliğin numarası geçer (`oz-027 …`). */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const G = () => window.LIFEOS.GRAFIK;

  function sahne(markup){
    const k = document.createElement('div');
    k.style.cssText = 'position:absolute;left:-9999px;top:0;width:400px';
    k.innerHTML = markup;
    document.body.appendChild(k);
    return k;
  }

  /* 20–26 Eylül; 22 ve 23 boş. */
  const NOKTALAR = [
    { tarih:'2026-09-20', deger:7.1 },
    { tarih:'2026-09-21', deger:6.8 },
    { tarih:'2026-09-24', deger:7.4 },
    { tarih:'2026-09-25', deger:7.0 },
    { tarih:'2026-09-26', deger:7.2 },
  ];

describe('027 · Eksik gün boşluğu', () => {

  it('oz-027 Verisi olmayan gün çizgide boşluk olarak kalır; hiçbir grafik eksik günü 0’a çizmez (birim testiyle).', () => {
    const s = G().seri(NOKTALAR);
    expect(s).toHaveLength(7);
    expect(s[2].deger).toBeNull();
    expect(s[3].deger).toBeNull();
    /* Çizimde eksik günlerin x'inde nokta yoktur ve hiçbir nokta 0'ın
       y'sine inmez: min 0 verilse bile. */
    const svg = G().cizgiSvg(s, { gen:600, yuk:100, pay:0, min:0, max:10 });
    const k = sahne(svg);
    try{
      const tum = [];
      k.querySelectorAll('.grafik__cizgi').forEach(pl =>
        pl.getAttribute('points').split(' ').forEach(p => tum.push(p.split(',').map(Number))));
      expect(tum).toHaveLength(5);
      const xler = tum.map(p => p[0]);
      expect(xler.indexOf(200) < 0).toBeTruthy();   // 22 Eylül'ün x'i
      expect(xler.indexOf(300) < 0).toBeTruthy();   // 23 Eylül'ün x'i
      tum.forEach(p => expect(p[1] < 100).toBeTruthy());  // y=100 → değer 0
      const kopru = k.querySelector('.grafik__kopru');
      expect(kopru.getAttribute('data-bos')).toBe('2');
      expect(kopru.getAttribute('x1')).toBe('100');
      expect(kopru.getAttribute('x2')).toBe('400');
    }finally{ k.remove(); }
  });

  it('oz-027 seri null değerini sayıya çevirmez; aralık dışı günleri de boş kurar', () => {
    const s = G().seri([{ tarih:'2026-09-21', deger:null }, { tarih:'2026-09-22', deger:3 }],
      { baslangic:'2026-09-20', bitis:'2026-09-23' });
    expect(s.map(p => p.deger)).toEqual([null, null, 3, null]);
  });

  it('oz-027 aynı güne ikinci kayıt geleni geçerlidir (düzeltme)', () => {
    const s = G().seri([{ tarih:'2026-09-20', deger:1 }, { tarih:'2026-09-20', deger:2 }]);
    expect(s).toHaveLength(1);
    expect(s[0].deger).toBe(2);
  });

  it('oz-027 tek günlük parça çizgi değil noktadır; hepsi boşsa grafik «veri yok» der', () => {
    const s = G().seri([{ tarih:'2026-09-20', deger:1 }, { tarih:'2026-09-22', deger:2 },
      { tarih:'2026-09-23', deger:3 }]);
    const svg = G().cizgiSvg(s, { etiket:'Uyku' });
    expect(svg).toContain('grafik__tek');
    expect(svg).toContain('aria-label="Uyku: 4 gün, 3 gün veri, 1 gün veri yok"');
    const bos = G().cizgiSvg(G().seri([], { baslangic:'2026-09-20', bitis:'2026-09-22' }), { etiket:'Uyku' });
    expect(bos).toContain('grafik--bos');
    expect(bos).toContain('Uyku: veri yok');
    expect(bos.indexOf('polyline') < 0).toBeTruthy();
  });

  it('oz-027 seri zaman damgasını YEREL güne koyar (T2-03)', () => {
    const damga = new Date(2026, 8, 25, 1, 30).toISOString();
    const s = G().seri([{ tarih:'2026-09-24', deger:4 }, { tarih:damga, deger:5 }]);
    expect(s.map(p => p.tarih + '=' + p.deger).join(',')).toBe('2026-09-24=4,2026-09-25=5');
  });

  it('oz-027 bozuk tarih (31 Şubat) sessizce kaymaz: yok sayılır', () => {
    expect(G().gunISO('2026-02-31')).toBeNull();
    expect(G().seri([{ tarih:'2026-02-31', deger:1 }])).toEqual([]);
    expect(G().doluluk({ gunler:['2026-02-31'] }, { bitis:'2026-03-03', gun:7 }).dolu).toBe(0);
    expect(G().gunISO('2026-02-28')).toBe('2026-02-28');
  });

  it('oz-027 gün ekleme yaz saati geçişinde kaymaz', () => {
    expect(G().gunEkle('2026-03-28', 1)).toBe('2026-03-29');
    expect(G().gunEkle('2026-10-24', 2)).toBe('2026-10-26');
    expect(G().gunFarki('2026-03-28', '2026-03-30')).toBe(2);
  });
});

describe('035 · Aralık çubuğu', () => {

  it('oz-035 Tahmin olan sayı tek değer değil aralık olarak gösterilir ve dayanağı (kaç veri) yazılır.', () => {
    const h = G().aralikHtml({ alt:18000, ust:26000, olasi:21500, min:10000, max:40000,
      dayanak:6, dayanakBirim:'deneme', etiket:'Sıralama tahmini' });
    expect(h).toContain('data-oz="035"');
    expect(h).toContain('18.000–26.000');
    expect(h).toContain('en olası 21.500');
    expect(h).toContain('6 deneme üzerinden');
    expect(h).toContain('aralik__bant');
  });

  it('oz-035 aralığı olmayan tahmin çubuk ÇİZMEZ, «—» yazar; dayanak uydurulmaz', () => {
    const r = G().aralik({ olasi:21500 });
    expect(r.var).toBeFalsy();
    expect(r.metin).toBe('—');
    expect(r.dayanak).toBe('dayanak kayıtlı değil');
    const h = G().aralikHtml({ olasi:21500 });
    expect(h).toContain('aralik--yok');
    expect(h.indexOf('aralik__bant') < 0).toBeTruthy();
    expect(G().aralik({ alt:5, ust:3 }).var).toBeFalsy();  // ters aralık
  });

  it('oz-035 bant ve en olası çizgi ölçeğe göre yerleşir; ters eksende (sıralama) çevrilir', () => {
    const r = G().aralik({ alt:20, ust:40, olasi:30, min:0, max:100, dayanak:3 });
    expect(r.sol).toBe(20);
    expect(r.gen).toBe(20);
    expect(r.olasi).toBe(30);
    const t = G().aralik({ alt:20, ust:40, olasi:25, min:0, max:100, ters:true, dayanak:3 });
    expect(t.sol).toBe(60);
    expect(t.olasi).toBe(75);
  });

  it('oz-035 ekran okuyucu aralığı, en olasıyı ve dayanağı duyar', () => {
    const k = sahne(G().aralikHtml({ alt:1, ust:3, olasi:2, dayanak:4, etiket:'Net' }));
    try{
      const el = k.querySelector('.aralik');
      expect(el.getAttribute('role')).toBe('img');
      expect(el.getAttribute('aria-label')).toBe('Net: tahmin 1–3, en olası 2, 4 veri üzerinden');
    }finally{ k.remove(); }
  });
});

describe('037 · Güvenli eğilim', () => {

  it('oz-037 Eğilim oku yalnız en az 5 veri varsa çizilir; altında kaç ölçüm daha gerektiği yazar.', () => {
    expect(G().EGILIM_EN_AZ).toBe(5);
    const az = G().egilim([1, 2, 3]);
    expect(az.yeterli).toBeFalsy();
    expect(az.eksik).toBe(2);
    expect(az.metin).toBe('Eğilim için 2 ölçüm daha gerekli');
    const h = G().egilimHtml([1, 2, 3]);
    expect(h).toContain('egilim--yetersiz');
    expect(h.indexOf('<svg') < 0).toBeTruthy();
    const ok = G().egilimHtml([1, 2, 3, 4, 5]);
    expect(ok).toContain('<svg');
    expect(ok).toContain('data-yon="artis"');
  });

  it('oz-037 eksik değer SIFIR sayılmaz, atlanır', () => {
    /* null'lar 0 sayılsaydı bu seri «azalıyor» derdi. */
    const e = G().egilim([10, null, 10.2, null, 10.1, 10.3, null, 10.2]);
    expect(e.yeterli).toBeTruthy();
    expect(e.n).toBe(5);
    expect(e.yonu).toBe('duz');
    const az = G().egilim([10, null, null, null, 11]);
    expect(az.yeterli).toBeFalsy();
    expect(az.eksik).toBe(3);
  });

  it('oz-037 yön anlamı metriğin tanımından gelir (028 ile aynı kural)', () => {
    const artan = [1, 2, 3, 4, 5, 6];
    expect(G().egilim(artan, { yon:'artis-iyi' }).anlam).toBe('iyi');
    expect(G().egilim(artan, { yon:'azalis-iyi' }).anlam).toBe('kotu');
    expect(G().egilim(artan).anlam).toBe('notr');
    expect(G().egilim([6, 5, 4, 3, 2, 1]).metin).toBe('azalıyor');
  });

  it('oz-037 küçük kayma yatay sayılır: gürültüye ok çizilmez', () => {
    expect(G().egilim([100, 101, 100, 102, 101, 101]).yonu).toBe('duz');
    expect(G().egilim([100, 104, 108, 112, 116]).yonu).toBe('artis');
  });

  it('oz-037 seri() çıktısını da okur; x ekseni gündür, sıra değil', () => {
    const s = G().seri([{ tarih:'2026-09-01', deger:1 }, { tarih:'2026-09-02', deger:2 },
      { tarih:'2026-09-03', deger:3 }, { tarih:'2026-09-10', deger:4 }, { tarih:'2026-09-11', deger:5 }]);
    const e = G().egilim(s);
    expect(e.yeterli).toBeTruthy();
    expect(e.egim < 1).toBeTruthy();   // sıraya göre olsaydı eğim tam 1 olurdu
  });
});

describe('041 · Veri doluluğu', () => {

  it('oz-041 Her modül için son 7 günün veri doluluğu gösterilir; boş gün içi boş kare, 0 değil.', () => {
    const h = G().dolulukHtml([
      { modul:'ays', ad:'AYS', gunler:['2026-09-18', '2026-09-20', '2026-09-24'] },
      { modul:'spi', ad:'SPİ', gunler:[] },
      { modul:'esp', ad:'ESP', gunler:['2026-09-18', '2026-09-19', '2026-09-20', '2026-09-21',
        '2026-09-22', '2026-09-23', '2026-09-24'] },
    ], { bitis:'2026-09-24' });
    const k = sahne(h);
    try{
      expect(k.querySelector('.doluluk').getAttribute('data-oz')).toBe('041');
      const satir = k.querySelectorAll('.doluluk__s');
      expect(satir).toHaveLength(3);
      satir.forEach(s => expect(s.querySelectorAll('.doluluk__k')).toHaveLength(7));
      expect(satir[0].querySelectorAll('.doluluk__k--dolu')).toHaveLength(3);
      expect(satir[1].querySelectorAll('.doluluk__k--dolu')).toHaveLength(0);
      expect(satir[1].querySelector('.doluluk__n').textContent).toBe('0/7');
      expect(satir[1].getAttribute('aria-label')).toBe('SPİ: son 7 günde 0 gün veri var, 7 gün veri yok');
      /* Boş kare görünür bir çerçevedir, dolu kare boyalıdır: ikisi
         aynı çizilseydi boş gün «0» gibi okunurdu. */
      const bos = getComputedStyle(satir[1].querySelector('.doluluk__k'));
      const dolu = getComputedStyle(satir[0].querySelector('.doluluk__k--dolu'));
      expect(bos.backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(bos.borderTopStyle).toBe('solid');
      expect(dolu.backgroundColor === 'rgba(0, 0, 0, 0)').toBeFalsy();
    }finally{ k.remove(); }
  });

  it('oz-041 kutular eskiden yeniye sıralı; son kutu bugündür', () => {
    const d = G().doluluk({ modul:'ays', gunler:['2026-09-24'] }, { bitis:'2026-09-24' });
    expect(d.kutular[0].tarih).toBe('2026-09-18');
    expect(d.kutular[6].tarih).toBe('2026-09-24');
    expect(d.kutular[6].dolu).toBeTruthy();
    expect(d.dolu).toBe(1);
  });

  it('oz-041 pencere dışındaki gün sayılmaz; bozuk tarih yok sayılır', () => {
    const d = G().doluluk({ modul:'spi', gunler:['2026-09-10', 'dün', null, '2026-09-24T08:00:00'] },
      { bitis:'2026-09-24' });
    expect(d.dolu).toBe(1);
  });

  it('oz-041 zaman damgası YEREL güne yazılır: gece 01:30 kaydı o günündür (T2-03)', () => {
    /* Yerel 25 Eylül 01:30 — İstanbul'da UTC damgası 24 Eylül 22:30. */
    const damga = new Date(2026, 8, 25, 1, 30).toISOString();
    const d = G().doluluk({ modul:'ays', gunler:[damga] }, { bitis:'2026-09-25', gun:2 });
    expect(d.kutular.map(k => k.tarih + ':' + k.dolu).join(',')).toBe('2026-09-24:false,2026-09-25:true');
    /* Bitiş de damga olarak gelebilir. */
    const e = G().doluluk({ modul:'ays', gunler:['2026-09-25'] }, { bitis:damga, gun:1 });
    expect(e.kutular[0].tarih).toBe('2026-09-25');
    expect(e.dolu).toBe(1);
  });

  it('oz-041 bugün verilmezse yerel bugün kullanılır; ekran kırılmaz', () => {
    const h = G().dolulukHtml([{ modul:'esp', ad:'ESP', gunler:[] }]);
    expect(h).toContain('0/7');
  });
});

describe('P2 · Grafik ekleri (029 030 031 033 034 038 039)', () => {

  it('oz-029 Değer ve eşik aynı çubukta; eşiğin ne kadar aşıldığı hesaplanmadan görülür.', () => {
    const k = sahne(G().esikCubukHtml({ etiket:'Tekrar borcu', deger:34, esik:10, olcek:50, birim:'%', yon:'azalis-iyi' }));
    try{
      const el = k.querySelector('[data-oz="029"]');
      expect(el.classList.contains('esikcubuk--kotu')).toBeTruthy();
      expect(el.querySelector('.esikcubuk__dolu').style.width).toBe('20%');
      expect(el.querySelector('.esikcubuk__esik').style.left).toBe('20%');
      expect(el.querySelector('.esikcubuk__asim').style.width).toBe('48%');
      expect(el.getAttribute('aria-label')).toBe('Tekrar borcu: %34 · eşik %10, eşiğin 24 puan üstünde');
    }finally{ k.remove(); }
  });

  it('oz-029 aşım anlamı yönden; eşiğin altı aşım çizmez; değer yoksa «—»', () => {
    expect(G().esikCubuk({ deger:20, esik:18, yon:'artis-iyi' }).anlam).toBe('iyi');
    expect(G().esikCubuk({ deger:20, esik:18 }).anlam).toBe('notr');
    const alt = G().esikCubuk({ deger:5, esik:10, birim:'%' });
    expect(alt.asim).toBe(0);
    expect(alt.farkMetni).toBe('eşiğin 5 puan altında');
    expect(G().esikCubuk({ deger:12, esik:10, birim:'dk' }).farkMetni).toBe('eşiğin 2 dk üstünde');
    const yok = G().esikCubukHtml({ deger:null, esik:10 });
    expect(yok).toContain('esikcubuk--yok');
    expect(yok.indexOf('esikcubuk__ray') < 0).toBeTruthy();
  });

  it('oz-030 Küçük hedefte yüzde yerine adet kutucukları.', () => {
    const k = sahne(G().tikHtml({ etiket:'Paragraf', yapilan:15, hedef:18 }));
    try{
      const el = k.querySelector('[data-oz="030"]');
      expect(el.querySelectorAll('.tik__k')).toHaveLength(18);
      expect(el.querySelectorAll('.tik__k--dolu')).toHaveLength(15);
      expect(el.querySelector('.tik__sayi').textContent).toBe('15 / 18');
      expect(el.getAttribute('aria-label')).toBe('Paragraf: 15 / 18, 3 kaldı');
      expect(/%/.test(el.textContent)).toBeFalsy();
    }finally{ k.remove(); }
  });

  it('oz-030 yapılan bilinmiyorsa kutular KESİK ve «—»: boş kutu «0 yapıldı» değildir', () => {
    const k = sahne(G().tikHtml({ hedef:5 }) + G().tikHtml({ yapilan:0, hedef:5 }));
    try{
      const [a, b] = k.querySelectorAll('.tik');
      expect(a.classList.contains('tik--yok')).toBeTruthy();
      expect(a.querySelector('.tik__sayi').textContent).toBe('— / 5');
      expect(getComputedStyle(a.querySelector('.tik__k')).borderTopStyle).toBe('dashed');
      expect(getComputedStyle(b.querySelector('.tik__k')).borderTopStyle).toBe('solid');
    }finally{ k.remove(); }
    expect(G().tik({ yapilan:5, hedef:G().TIK_EN_COK + 1 }).kutu).toBeFalsy();   // büyük hedef kutuyla okunmaz
    expect(G().tik({ yapilan:20, hedef:18 }).fazla).toBe(2);
  });

  it('oz-031 Grafikte hedef aralığı yatay bant; bant dışındaki noktalar içi boş.', () => {
    const s = G().seri(NOKTALAR);   // 7,1 6,8 — — 7,4 7,0 7,2
    const k = sahne(G().cizgiSvg(s, { bant:[7, 7.3], etiket:'Uyku' }));
    try{
      expect(k.querySelector('.grafik__bant').getAttribute('data-oz')).toBe('031');
      const dis = k.querySelectorAll('.grafik__nokta--dis');
      expect(k.querySelectorAll('.grafik__nokta')).toHaveLength(5);
      expect(dis).toHaveLength(2);   // 6,8 ve 7,4
      expect(Array.prototype.map.call(dis, c => c.getAttribute('data-tarih')).join(',')).toBe('2026-09-21,2026-09-24');
      /* İçi boş: dolgu zemin rengi, dolu nokta çizgi rengi. */
      const ic = getComputedStyle(k.querySelector('.grafik__nokta:not(.grafik__nokta--dis)')).fill;
      expect(getComputedStyle(dis[0]).fill === ic).toBeFalsy();
      expect(k.querySelector('svg').getAttribute('aria-label')).toContain('2 gün hedef bandının dışında');
    }finally{ k.remove(); }
  });

  it('oz-033 Önümüzdeki yedi günün tekrar yükü; bugün dolu, gelecek kesikli.', () => {
    const gunler = [];
    for(let i = 0; i < 7; i++) gunler.push({ tarih:G().gunEkle('2026-09-24', i), deger:[12, 8, 0, null, 20, 5, 9][i] });
    const k = sahne(G().yukHtml({ gunler:gunler, bugun:'2026-09-24', etiket:'Tekrar yükü', birim:'kart' }));
    try{
      const el = k.querySelector('[data-oz="033"]');
      const g = el.querySelectorAll('.yuk__g');
      expect(g).toHaveLength(7);
      expect(g[0].classList.contains('yuk__g--bugun')).toBeTruthy();
      expect(g[0].querySelector('.yuk__gun').textContent).toBe('Bugün');
      expect(g[1].querySelector('.yuk__gun').textContent).toBe('Cum');
      expect(getComputedStyle(g[0].querySelector('.yuk__sutun')).borderTopStyle).toBe('none');
      expect(getComputedStyle(g[1].querySelector('.yuk__sutun')).borderTopStyle).toBe('dashed');
      /* 0 gerçek sıfır, null bilinmiyor. */
      expect(g[2].querySelector('.yuk__deger').textContent).toBe('0');
      expect(g[3].querySelector('.yuk__deger').textContent).toBe('—');
      expect(g[3].classList.contains('yuk__g--yok')).toBeTruthy();
      expect(getComputedStyle(g[3].querySelector('.yuk__sutun')).display).toBe('none');   // 0 ile karışmaz
      expect(getComputedStyle(g[2].querySelector('.yuk__sutun')).display === 'none').toBeFalsy();
      expect(el.getAttribute('aria-label')).toBe('Tekrar yükü: 7 gün, toplam 54 kart, 1 gün bilinmiyor');
    }finally{ k.remove(); }
  });

  it('oz-034 Her grafiğin altında kodun ürettiği tek okuma cümlesi.', () => {
    const s = G().seri(NOKTALAR);
    expect(G().cumle(s, { etiket:'Uyku', birim:'saat' }))
      .toBe('Uyku: son 7 günde 5 gün veri; ortalama 7,1 saat; eğilim yatay.');
    expect(G().cumleHtml(s, { etiket:'Uyku' })).toContain('data-oz="034"');
    /* Veri yoksa «ortalama 0» değil «veri yok». */
    expect(G().cumle(G().seri([], { baslangic:'2026-09-20', bitis:'2026-09-26' }), { etiket:'Uyku' }))
      .toBe('Uyku: son 7 günde veri yok.');
    expect(G().cumle(G().seri([{ tarih:'2026-09-20', deger:7 }, { tarih:'2026-09-22', deger:8 }]), { etiket:'Uyku' }))
      .toBe('Uyku: son 3 günde 2 gün veri; ortalama 7,5; eğilim için 3 ölçüm daha gerekli.');
    /* Ekran okuyucu da aynı cümleyi duyar. */
    expect(G().cizgiSvg(s, { etiket:'Uyku', birim:'saat', cumle:true }))
      .toContain('Uyku: son 7 günde 5 gün veri; ortalama 7,1 saat; eğilim yatay.');
  });

  it('oz-038 Tablodaki yüzde hücresinin arkasında ince çubuk; sayı ile boyut aynı yerde okunur.', () => {
    const k = sahne(G().hucreHtml({ deger:34, birim:'%' }) + G().hucreHtml({ deger:null, birim:'%' }));
    try{
      const [a, b] = k.querySelectorAll('[data-oz="038"]');
      expect(a.style.getPropertyValue('--hucre-oran')).toBe('34%');
      expect(a.querySelector('.sayi__d').textContent).toBe('%34');
      expect(getComputedStyle(a, '::after').width === '0px').toBeFalsy();
      expect(b.classList.contains('hucre--yok')).toBeTruthy();
      expect(b.querySelector('.sayi__d').textContent).toBe('—');
      expect(getComputedStyle(b, '::after').display).toBe('none');
    }finally{ k.remove(); }
    expect(G().hucreHtml({ deger:150, olcek:100 })).toContain('--hucre-oran:100%');
  });

  it('oz-039 Bu hızla hedefe ne zaman varılacağı aralık olarak; gelecek, açılan bir koni.', () => {
    const d = [];
    for(let i = 0; i < 8; i++) d.push({ tarih:G().gunEkle('2026-08-01', i * 7), deger:60 + i * 2 + (i % 2) });
    const r = G().hizTahmini(d, 90);
    expect(r.yeterli).toBeTruthy();
    expect(r.erken < r.olasi && r.olasi < r.gec).toBeTruthy();   // tek tarih değil, aralık
    expect(r.metin).toContain('en olası');
    expect(r.metin).toContain('(tahmin, 8 ölçüm)');
    const k = sahne(G().hizKoniSvg(d, 90));
    try{
      const f = k.querySelector('[data-oz="039"]');
      expect(f.querySelector('.hiz__koni').getAttribute('points').split(' ')).toHaveLength(3);
      expect(f.querySelector('figcaption').textContent).toBe(r.metin);
    }finally{ k.remove(); }
  });

  it('oz-039 yeterli veri yoksa ya da hedefe yaklaşılmıyorsa tarih UYDURULMAZ', () => {
    const az = G().hizTahmini([{ tarih:'2026-09-01', deger:1 }, { tarih:'2026-09-08', deger:2 }], 10);
    expect(az.yeterli).toBeFalsy();
    expect(az.metin).toBe('Tahmin için 3 ölçüm daha gerekli');
    const d = [];
    for(let i = 0; i < 6; i++) d.push({ tarih:G().gunEkle('2026-08-01', i * 7), deger:70 - i });
    const geri = G().hizTahmini(d, 90);
    expect(geri.yaklasmiyor).toBeTruthy();
    expect(geri.olasi).toBeNull();
    expect(geri.metin).toBe('Bu hızla hedefe yaklaşılmıyor');
    expect(G().hizKoniSvg(d, 90)).toContain('hiz--yok');
    /* Yön ilk ölçümden: 70'ten inen seri 66'yı geçti → ulaşıldı. */
    expect(G().hizTahmini(d, 66).metin).toBe('Hedefe ulaşıldı');
    /* Hata payı sıfırsa aralık tek tarihe iner, «10–10 Ekim» yazılmaz. */
    const tek = G().hizTahmini(d, 60);
    expect(tek.erken).toBe(tek.gec);
    expect(tek.metin.indexOf('–') < 0).toBeTruthy();
  });
});

describe('P3 · Grafik ekleri (032 036 040)', () => {

  it('oz-032 Geçen dönem soluk kesik çizgi olarak arkada durur.', () => {
    const s = G().seri(NOKTALAR);   // 20–26 Eylül, 22-23 boş
    const once = G().seri([{ tarih:'2026-09-13', deger:6.5 }, { tarih:'2026-09-14', deger:6.6 },
      { tarih:'2026-09-15', deger:6.4 }, { tarih:'2026-09-18', deger:6.9 }, { tarih:'2026-09-19', deger:7.0 }]);
    const k = sahne(G().cizgiSvg(s, { onceki:once, etiket:'Uyku' }));
    try{
      const g = k.querySelector('.grafik__onceki');
      expect(g.getAttribute('data-oz')).toBe('032');
      /* Arkada: SVG'de ön çizgiden ÖNCE gelir. */
      const svg = k.querySelector('svg');
      expect(Array.prototype.indexOf.call(svg.children, g) < Array.prototype.indexOf.call(svg.children, svg.querySelector('.grafik__cizgi'))).toBeTruthy();
      /* Geçen dönemin boş günleri gölgede de boştur: iki parça. */
      expect(g.querySelectorAll('polyline')).toHaveLength(2);
      const st = getComputedStyle(g.querySelector('polyline'));
      expect(st.strokeDasharray === 'none').toBeFalsy();
      expect(Number(st.opacity) < 1).toBeTruthy();
      expect(svg.getAttribute('aria-label')).toContain('geçen dönem ortalaması 6,7 (gölgede)');
    }finally{ k.remove(); }
    /* Anahtar: grafik başında, aria-pressed ile. */
    expect(G().gecenDonemDugmesi(false)).toContain('aria-pressed="false"');
    expect(G().gecenDonemDugmesi(true)).toContain('chip--on');
    expect(G().cizgiSvg(s, {}).indexOf('grafik__onceki') < 0).toBeTruthy();
  });

  it('oz-036 Otuz gecenin her biri bir nokta; ortadaki çizgi medyan.', () => {
    const v = [];
    for(let i = 0; i < 30; i++) v.push(i === 4 || i === 17 ? null : 6 + (i % 7) * 0.3);
    const k = sahne(G().dagilimSvg({ degerler:v, birim:'saat', etiket:'Uyku' }));
    try{
      const f = k.querySelector('[data-oz="036"]');
      /* Kayıt olmayan gece nokta değildir (0'a konmaz). */
      expect(f.querySelectorAll('.dagilim__n')).toHaveLength(28);
      const m = f.querySelector('.dagilim__medyan');
      expect(m).toBeTruthy();
      const r = G().dagilim({ degerler:v, birim:'saat' });
      expect(r.medyan).toBe(G().medyan(v.filter(x => x != null)));
      expect(f.querySelector('figcaption').textContent).toBe(r.metin);
      expect(r.metin.indexOf('28/30 gece kayıtlı') === 0).toBeTruthy();
      /* Medyan çizgisi noktaların arasında, uçlarda değil. */
      const xs = Array.prototype.map.call(f.querySelectorAll('.dagilim__n'), c => Number(c.getAttribute('cx')));
      const mx = Number(m.getAttribute('x1'));
      expect(mx > Math.min.apply(null, xs) && mx < Math.max.apply(null, xs)).toBeTruthy();
    }finally{ k.remove(); }
  });

  it('oz-036 beş kayıttan azıyla dağılım çizilmez; medyan tek ve çift sayıda doğru', () => {
    expect(G().dagilim({ degerler:[7, null, 8, 6] }).metin).toBe('Dağılım için 2 gece daha gerekli');
    expect(G().dagilimSvg({ degerler:[7, 8] })).toContain('dagilim--yok');
    expect(G().medyan([3, 1, 2])).toBe(2);
    expect(G().medyan([4, 1, 3, 2])).toBe(2.5);
  });

  it('oz-040 Çözülen sorunun birikimli çizgisi ve plan çizgisi; bugünkü fark kırmızı çizgiyle.', () => {
    const gun = [], plan = [];
    for(let i = 0; i < 10; i++){
      plan.push({ tarih:G().gunEkle('2026-09-15', i), deger:40 });
      if(i !== 3) gun.push({ tarih:G().gunEkle('2026-09-15', i), deger:35 });
    }
    const r = G().birikim(gun, plan, { bugun:'2026-09-24', birim:'soru' });
    expect(r.gercek).toBe(315);
    expect(r.plan).toBe(400);
    expect(r.anlam).toBe('kotu');
    expect(r.metin).toBe('Kayıtlı toplam 315 soru; plan 400 soru; 85 soru geride (1 gün kayıtsız)');
    const k = sahne(G().birikimSvg(gun, plan, { bugun:'2026-09-24', birim:'soru' }));
    try{
      const f = k.querySelector('[data-oz="040"]');
      const fark = f.querySelector('.birikim__fark');
      expect(fark.classList.contains('birikim__fark--kotu')).toBeTruthy();
      expect(getComputedStyle(fark).stroke).toBe((() => {
        const s = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        s.style.stroke = 'var(--bad)'; f.querySelector('svg').appendChild(s);
        const c = getComputedStyle(s).stroke; s.remove(); return c; })());
      /* Kayıtsız güne giden parça kesik: orada 0 eklenmedi, bilinmiyor. */
      expect(f.querySelectorAll('.birikim__kayitsiz line')).toHaveLength(1);
      expect(getComputedStyle(f.querySelector('.birikim__kayitsiz line')).strokeDasharray === 'none').toBeFalsy();
    }finally{ k.remove(); }
  });

  it('oz-040 önde olan fark iyi yönün rengini alır; gelecek plan çizilir, gerçek bugünde durur', () => {
    const gun = [{ tarih:'2026-09-20', deger:60 }, { tarih:'2026-09-21', deger:60 }];
    const plan = [{ tarih:'2026-09-20', deger:40 }, { tarih:'2026-09-21', deger:40 }, { tarih:'2026-09-22', deger:40 }];
    const r = G().birikim(gun, plan, { bugun:'2026-09-21', birim:'soru' });
    expect(r.anlam).toBe('iyi');
    expect(r.metin).toBe('Kayıtlı toplam 120 soru; plan 80 soru; 40 soru önde');
    expect(r.gunler[2].gercek).toBeNull();
    expect(r.gunler[2].plan).toBe(120);
    expect(G().birikimSvg([], [])).toContain('birikim--yok');
  });
});

})();
