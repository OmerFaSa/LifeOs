/* Giriş — üç arayüzde tek satırda veri girme kapısı. Tek kaynak
   `brand/ortak/giris.test.js`. Kanıtlanan sözler (brand/ortak/giris.js):
     1. Hiçbir şey doğrudan kaydedilmez: önizleme, sonra «Kaydet».
     2. Anlaşılmayan uydurulmaz: «anlayamadım» ve örnekler; kayıt yok.
     3. King, modül kendi veri kapısını vermediyse bu kapıyı kullanır.
     4. Modül kurulduysa Bugün ekranında kutu var; örnek çipi girdiyi doldurur. */

(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const G = () => window.LIFEOS.GIRIS;

  function sahteKur(){
    const yazilan = [];
    const eski = G().kuruluMu() ? null : 'yok';
    G()._sifirla();
    G().kur({ modul:'deneme', ornekler:['uyku 7', '40 soru'],
      onizle:t => /^uyku \d/.test(t) ? { metin:'Uyku: ' + t.split(' ')[1] + ' sa', ipucu:'bugüne',
        kaydet:async () => { yazilan.push(t); return 'Kaydedildi.'; } } : null });
    return { yazilan, eski };
  }

  describe('Giriş — ortak cümle bölücü', () => {
    it('cümle, bağlaç ve virgülde böler; sayı içindeki nokta/virgül ve doğru/yanlış devamı tek parça', () => {
      const G = window.LIFEOS.GIRIS;
      expect(G.bol("7,5 saat uyudum ve 40 soru çözdüm, 32'si doğru. Akşam 7.5 km koştum; 20 dk gitar"))
        .toEqual(['7,5 saat uyudum', "40 soru çözdüm, 32'si doğru", 'Akşam 7.5 km koştum', '20 dk gitar']);
      expect(G.bol('türevden 20 soru çözdüm, 4 yanlışım var')).toEqual(['türevden 20 soru çözdüm, 4 yanlışım var']);
    });
  });
  describe('Giriş — tek satır kapısı', () => {
    it('önizler, «Kaydet» denmeden yazmaz; Kaydet ile yazar ve sonucu söyler', async () => {
      const { yazilan } = sahteKur();
      try{
        const k = document.createElement('div');
        k.innerHTML = G().kutuHtml();
        document.body.appendChild(k);
        try{
          const p = G().gonder('uyku 7');
          expect(!!p).toBe(true);
          expect(yazilan.length).toBe(0);
          expect(k.querySelector('[data-giris-sonuc]').textContent).toContain('Uyku: 7 sa');
          expect(k.querySelector('[data-giris="kaydet"]') !== null).toBe(true);
          expect(await G().kaydet()).toBe('Kaydedildi.');
          expect(yazilan).toEqual(['uyku 7']);
          expect(k.querySelector('[data-giris-sonuc]').textContent).toContain('Kaydedildi');
        }finally{ k.remove(); }
      }finally{ G()._sifirla(); }
    });

    it('anlaşılmayanı uydurmaz: «anlayamadım» ve örnekler, Kaydet düğmesi yok', () => {
      sahteKur();
      try{
        expect(G().gonder('bugün hava güzel')).toBe(null);
        expect(G().durum().mesaj).toContain('anlayamadım');
        expect(G().durum().mesaj).toContain('uyku 7');
        expect(G().durum().bekleyen).toBe(null);
      }finally{ G()._sifirla(); }
    });

    it('kurulmadıysa kutu çizilmez; örnek çipi girdiyi doldurur', () => {
      G()._sifirla();
      expect(G().kutuHtml()).toBe('');
      sahteKur();
      const k = document.createElement('div');
      k.innerHTML = G().kutuHtml();
      document.body.appendChild(k);
      try{
        k.querySelector('[data-giris-ornek="40 soru"]').dispatchEvent(new MouseEvent('click', { bubbles:true }));
        expect(document.getElementById('giris-girdi').value).toBe('40 soru');
      }finally{ k.remove(); G()._sifirla(); }
    });

    it('önizlenen metinde yeniden Enter kaydeder; metin değiştiyse yeniden önizler', async () => {
      const { yazilan } = sahteKur();
      try{
        G().gonder('uyku 7');
        expect(yazilan.length).toBe(0);
        G().gonder('uyku 8');            /* değişti: yeni önizleme, kayıt yok */
        expect(yazilan.length).toBe(0);
        expect(G().durum().bekleyen).toBe('Uyku: 8 sa');
        G().gonder('uyku 8');            /* aynı metin: açık onay */
        await new Promise(r => setTimeout(r, 0));
        expect(yazilan).toEqual(['uyku 8']);
        expect(G().durum().bekleyen).toBe(null);
      }finally{ G()._sifirla(); }
    });

    it('anlaşılmayınca örnek çipleri mesajın altında; yer tutucu ilk örnek', () => {
      sahteKur();
      const k = document.createElement('div');
      try{
        k.innerHTML = G().kutuHtml();
        document.body.appendChild(k);
        expect(k.querySelector('#giris-girdi').getAttribute('placeholder')).toBe('Örneğin: uyku 7');
        G().gonder('falan filan');
        expect(!!k.querySelector('[data-giris-sonuc] [data-giris-ornek]')).toBe(true);
      }finally{ k.remove(); G()._sifirla(); }
    });

    it('bir cümle birçok kayıt: parçalar ayrı önizlenir, tek Kaydet hepsini yazar; anlaşılmayan söylenir', async () => {
      const yazilan = [];
      G()._sifirla();
      G().kur({ modul:'deneme', ornekler:[], onizle:t => {
        if(/^uyku \d+$/.test(t)) return { tur:'uyku', metin:'Uyku ' + t.split(' ')[1], kaydet:async () => { yazilan.push(t); } };
        if(/^(\d+ (yumurta|çay)(, )?)+$/.test(t)) return { tur:'ogun', metin:'Öğün: ' + t, kaydet:async () => { yazilan.push(t); } };
        return null;
      } });
      try{
        const p = G().onizle('uyku 7, 2 yumurta ve 1 çay; falan filan');
        expect(p.parcalar.length).toBe(2);
        expect(p.parcalar[1].metin).toBe('Öğün: 2 yumurta, 1 çay');   /* aynı tür tek kayıt */
        expect(p.ipucu).toContain('«falan filan»');
        const kr = await p.kaydet();
        expect(kr.metin).toBe('2 kayıt eklendi.');
        expect(typeof kr.geriAl).toBe('object');           /* parçaların geri alması yoksa null */
        expect(yazilan).toEqual(['uyku 7', '2 yumurta, 1 çay']);
        /* ondalık virgül bölünmez; tek türden cümle bütün olarak */
        expect(G().onizle('uyku 7,5')).toBe(null);
        expect(G().onizle('2 yumurta, 1 çay').metin).toBe('Öğün: 2 yumurta, 1 çay');
      }finally{ G()._sifirla(); }
    });

    /* 2026-10-25 hata: «nabız 56, hrv 55, kilo 72» yalnız nabzı yazıyordu.
       Aynı türdeki parçalar bütün cümle olarak yeniden ayrıştırılıyordu;
       SPİ'nin ölçüm ayrıştırıcısı ilk eşleşmeyi döndürür, kalanlar ne
       önizlemede ne kalanda görünüyordu (söz 7). «su 500, su 250» da öyle. */
    it('aynı türden parçalar birleşince biri düşerse her parça ayrı kayıt olur (söz 7)', async () => {
      const yazilan = [];
      G()._sifirla();
      G().kur({ modul:'deneme', ornekler:[], onizle:t => {
        /* SPİ parseVital gibi: cümlede İLK eşleşen alanı döndürür. */
        const m = t.match(/(nabız|hrv|kilo|su) (\d+)/);
        if(m) return { tur:m[1] === 'su' ? 'su' : 'olcum', metin:m[1] + ' ' + m[2],
          kaydet:async () => { yazilan.push(m[1] + ' ' + m[2]); return { metin:'Kaydedildi.', geriAl:async () => {} }; } };
        if(/^(\d+ (yumurta|çay)(, )?)+$/.test(t)) return { tur:'ogun', metin:'Öğün: ' + t, kaydet:async () => { yazilan.push(t); } };
        return null;
      } });
      try{
        const p = G().onizle('nabız 56, hrv 55, kilo 72');
        expect(p.parcalar.length).toBe(3);
        expect(p.metin).toBe('nabız 56 · hrv 55 · kilo 72');
        const kr = await p.kaydet();
        expect(kr.metin).toBe('3 kayıt eklendi.');
        expect(typeof kr.geriAl).toBe('function');
        expect(yazilan).toEqual(['nabız 56', 'hrv 55', 'kilo 72']);
        yazilan.length = 0;
        const su = G().onizle('su 500, su 250');
        expect(su.parcalar.length).toBe(2);
        await su.kaydet();
        expect(yazilan).toEqual(['su 500', 'su 250']);
        /* karışık cümlede de: ölçümler ayrı, öğün yine tek kayıt */
        const k = G().onizle('nabız 56, 2 yumurta, hrv 55, 1 çay');
        expect(k.parcalar.map(x => x.metin)).toEqual(['nabız 56', 'hrv 55', 'Öğün: 2 yumurta, 1 çay']);
      }finally{ G()._sifirla(); }
    });

    /* 2026-10-25 inceleme: çok parçalı kayıtta ikinci parça hata verirse
       birincisi yazılı kalıyordu. Hepsi ya da hiçbiri. */
    it('çok parçalı kayıtta yarıda hata olursa yazılan parçalar geri alınır, hata iletilir', async () => {
      const gunluk = [];
      G()._sifirla();
      G().kur({ modul:'deneme', ornekler:[], onizle:t => {
        const m = t.match(/^(nabız|kilo) (\d+)$/);
        if(!m) return null;
        return { tur:'olcum', metin:t, kaydet:async () => {
          if(m[1] === 'kilo') throw new Error('depo kapalı');
          gunluk.push('yaz:' + t); return { metin:'ok', geriAl:async () => { gunluk.push('geri:' + t); } }; } };
      } });
      try{
        const p = G().onizle('nabız 56, kilo 72');
        let hata = null;
        try{ await p.kaydet(); }catch(e){ hata = e; }
        expect(hata && hata.message).toBe('depo kapalı');
        expect(gunluk).toEqual(['yaz:nabız 56', 'geri:nabız 56']);
      }finally{ G()._sifirla(); }
    });

    /* 2026-10-25 hata: «kahvaltıda 2 yumurta 1 çay, öğlen mercimek» tek öğüne
       birleşiyor, «çay» sessizce düşüyor ve hepsi kahvaltıya yazılıyordu.
       Birleşik önizleme her parçanın her öğesini içermelidir; modülün grup
       dediği (SPİ'de öğün) farklı parçalar hiç birleşmez. */
    it('birleşme bir öğeyi düşürmez; farklı gruptaki parçalar ayrı kalır (söz 7)', async () => {
      G()._sifirla();
      G().kur({ modul:'deneme', ornekler:[], onizle:t => {
        const grup = /^kahvaltıda /.test(t) ? 'kahvalti' : /^öğlen /.test(t) ? 'ogle' : undefined;
        const yemek = t.replace(/^(kahvaltıda|öğlen) /, '');
        if(!/^[\d a-zçğıöşü,]+$/.test(yemek)) return null;
        /* bütün cümlede en çok iki öğe okuyan, öğün sözünden sonrasını unutan ayrıştırıcı */
        const ogeler = yemek.split(/, /).filter(x => !/^(kahvaltıda|öğlen)/.test(x)).slice(0, 2);
        return { tur:'ogun', grup, metin:ogeler.join(', '), kaydet:async () => ({ metin:'Kaydedildi.', geriAl:async () => {} }) };
      } });
      try{
        const dus = G().onizle('2 yumurta, 1 çay, 1 peynir');
        expect(dus.parcalar.map(x => x.metin)).toEqual(['2 yumurta', '1 çay', '1 peynir']);
        const ayri = G().onizle('kahvaltıda 2 yumurta, öğlen 1 çorba');
        expect(ayri.parcalar.map(x => [x.grup, x.metin])).toEqual([['kahvalti', '2 yumurta'], ['ogle', '1 çorba']]);
        const tek = G().onizle('2 yumurta, 1 çay');
        expect(tek.metin).toBe('2 yumurta, 1 çay');
      }finally{ G()._sifirla(); }
    });

    /* 2026-10-25 hata: «kilo 72, falan filan» bütün cümle olarak okunuyor,
       «falan filan» hiç söylenmiyordu (söz 7). Modül parçayı gerçekten
       kullandıysa («40 soru çözdüm, 32'si doğru») kalan sayılmaz. */
    it('tek türden cümlede anlaşılmayan parça da «yazılmayacak» diye söylenir (söz 7)', async () => {
      const yazilan = [];
      G()._sifirla();
      G().kur({ modul:'deneme', ornekler:[], onizle:t => {
        const m = t.match(/kilo (\d+)/);
        if(m) return { tur:'olcum', metin:'kilo ' + m[1], ipucu:'Günlük ölçüm', kaydet:async () => { yazilan.push('kilo ' + m[1]); } };
        const s = t.match(/^(\d+) soru çözdüm(?:, (\d+)'si doğru)?$/);
        if(s) return { tur:'calisma', metin:s[1] + ' soru' + (s[2] ? ', ' + s[2] + ' doğru' : ''), ipucu:'modülün', kaydet:async () => {} };
        /* gevşek öğün: yalnız tanıdığı gıdaları okur, gerisini sessizce atlar */
        const g = t.match(/\d+ (yumurta|çay)/g);
        if(g) return { tur:'ogun', metin:'Öğün: ' + g.join(', '), kaydet:async () => { yazilan.push(g.join(', ')); } };
        return null;
      } });
      try{
        const p = G().onizle('kilo 72, falan filan');
        expect(p.metin).toBe('kilo 72');
        expect(p.ipucu).toBe('Anlaşılmadı, yazılmayacak: «falan filan»');
        await p.kaydet();
        expect(yazilan).toEqual(['kilo 72']);
        const o = G().onizle('2 yumurta, 1 çay, falan filan');
        expect(o.metin).toBe('Öğün: 2 yumurta, 1 çay');
        expect(o.ipucu).toContain('«falan filan»');
        /* modülün kullandığı parça kalan değildir; modülün kendi önizlemesi döner */
        const s = G().onizle("40 soru çözdüm, 32'si doğru");
        expect(s.metin).toBe('40 soru, 32 doğru');
        expect(s.ipucu).toBe('modülün');
      }finally{ G()._sifirla(); }
    });

    it('kaydet {metin, geriAl} dönerse «Geri al» durur ve geri alır (söz 8)', async () => {
      let n = 0;
      G()._sifirla();
      G().kur({ modul:'deneme', ornekler:[], onizle:t => /^uyku/.test(t) ? { metin:'Uyku', kaydet:async () => { n++; return { metin:'Kaydedildi.', geriAl:async () => { n--; } }; } } : null });
      const k = document.createElement('div');
      try{
        k.innerHTML = G().kutuHtml();
        document.body.appendChild(k);
        G().gonder('uyku 7');
        await G().kaydet();
        expect(n).toBe(1);
        expect(!!k.querySelector('[data-giris="geri-al"]')).toBe(true);
        expect(await G().geriAl()).toBe(true);
        expect(n).toBe(0);
        expect(k.querySelector('[data-giris-sonuc]').textContent).toContain('Geri alındı');
      }finally{ k.remove(); G()._sifirla(); }
    });

    it('King kendi veri kapısı yoksa bu kapıyı kullanır', () => {
      const K = window.LIFEOS.KING;
      sahteKur();
      try{
        K._sifirla();
        K.kur({ modul:'spi', git:() => {}, ozet:() => [] });
        const y = K.yorumla('uyku 7');
        expect(y.tur).toBe('veri');
        expect(y.onizleme.metin).toBe('Uyku: 7 sa');
      }finally{ K._sifirla(); G()._sifirla(); }
    });
  });
})();
