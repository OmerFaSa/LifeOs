/* KOMUT PALETİ — yapı ve hızlı giriş.

   Palet Ctrl+K ile her yerden açılır ve uygulamanın en hızlı yoludur.
   Bozulduğunda görünür bir hata vermez: komut listede görünmez, ya da
   yanlış ekrana gider. On işlevinden yalnızca biri deneniyordu.

   Burada çizim değil KARAR denenir: listenin yapısı, kimliklerin
   tekilliği ve serbest metnin öneriye dönüşmesi. */

(function(){
  const { describe, it, expect, resetState } = SP.Test;
  const P = SP.Palette;

  describe('Palet — komut listesi', function(){
    it('liste boş değil', function(){
      expect(P.commands().length).toBeGreaterThan(5);
    });

    it('her komutun etiketi ve çalıştırıcısı var', function(){
      /* Etiketsiz bir komut listede görünür ama okunmaz; çalıştırıcısı
         olmayan bir komut tıklanır ve hiçbir şey olmaz. */
      P.commands().forEach(c => {
        expect(typeof c.label).toBe('string');
        expect(c.label.length).toBeGreaterThan(0);
        expect(typeof c.run).toBe('function');
      });
    });

    it('komut kimlikleri tekil', function(){
      /* Aynı kimlikten iki komut, seçileni belirsiz yapar. */
      const ids = P.commands().map(c => c.id).filter(Boolean);
      expect(ids.length).toBe(new Set(ids).size);
    });

    it('her ekrana giden bir komut var', function(){
      const rotalar = SP.App.SECTIONS.reduce((a, s) => a.concat(s.views.map(v => v.route)), []);
      const gidenler = P.commands().filter(c => String(c.id).indexOf('go:') === 0)
        .map(c => String(c.id).slice(3));
      rotalar.forEach(r => {
        if(gidenler.indexOf(r) < 0) throw new Error('palette bu ekrana gitmiyor: ' + r);
      });
    });
  });

  describe('Palet — serbest metinden hızlı giriş', function(){
    it('kısa metin öneri üretmez', function(){
      /* İki harf yazarken her tuşta öneri çıkarmak paleti kullanılmaz
         yapar; eşik bilinçli. */
      expect(P.quickCommand('a')).toBeFalsy();
      expect(P.quickCommand('')).toBeFalsy();
    });

    it('anlamsız metin öneri üretmez', function(){
      expect(P.quickCommand('qwertyuiop asdfgh')).toBeFalsy();
    });

    it('tanınan cümle öneriye dönüşür', function(){
      resetState();
      const c = P.quickCommand('8 saat uyudum');
      expect(c).toBeTruthy();
      expect(c.label.length).toBeGreaterThan(0);
      expect(typeof c.run).toBe('function');
    });

    it('birden çok kayıt tek komutta sayılır', function(){
      resetState();
      const c = P.quickCommand('8 saat uyudum ve 70 kilo geldim');
      expect(c).toBeTruthy();
      expect(c.hint).toContain('kayıt');
    });

    it('öneri komutu KENDİLİĞİNDEN KAYDETMEZ', function(){
      /* Komut yalnızca önizlemeyi açar; onaysız hiçbir şey yazılmaz.
         `run` çağrılmadığı sürece durum değişmemeli. */
      resetState();
      const once = JSON.stringify(SP.S.vitals || {});
      P.quickCommand('8 saat uyudum');
      expect(JSON.stringify(SP.S.vitals || {})).toBe(once);
    });

    /* KR-1: ölçüm yazan kayıt hemen yazılmaz, önizlemeyle gelir; olumsuz
       cümle kayıt önermez ama sessizce de düşmez — neden yazılmadığı
       söylenir. */
    it('ölçüm önizlemeyle gelir; olumsuz cümle sorulur', function(){
      resetState();
      expect(P.quickCommand('8 saat uyudum').hint).toContain('önizleme');
      const c = P.quickCommand('8 saat uyumadım');
      expect(c).toBeTruthy();
      expect(c.label).toBe('Bir şey sormam gerek');
      expect(c.id).toBe('quick:sor');
      const once = JSON.stringify(SP.S.vitals || {});
      c.run();
      const sayfa = document.body.innerHTML;
      expect(sayfa).toContain('Ölçüm diye yazmadığım kısım');
      expect(sayfa).toContain('uyumadım');
      expect(sayfa.indexOf('data-act="quick-save"') < 0).toBe(true);
      SP.UI.closeSheet();
      expect(JSON.stringify(SP.S.vitals || {})).toBe(once);
      /* karşılaştırma: ölçüm olan cümlenin önizlemesinde «Kaydet» vardır */
      P.quickCommand('8 saat uyudum').run();
      expect(document.body.innerHTML).toContain('data-act="quick-save"');
      SP.UI.closeSheet();
    });

    /* HATA (2026-10-25): «dün 2 bardak su içtim» paletten bugüne yazılıyordu:
       tarih alanı hep bugünle açılıyor ve kaydederken her öneriye o tarih
       yazılıyordu. Alan cümlenin günüyle açılır; dokunulmazsa her öneri
       kendi gününe, değiştirilirse seçilen güne yazılır. */
    it('cümledeki gün sözü paletten de korunur', async function(){
      resetState();
      const dun = SP.U.iso(SP.U.addDays(SP.U.parse(SP.U.todayISO()), -1));
      P.quickCommand('dün 2 bardak su içtim').run();
      const alan = document.getElementById('qe-date');
      expect(alan.value).toBe(dun);
      await P.saveQuick();
      expect(Number((SP.S.vitals[dun] || {}).water)).toBe(500);
      expect((SP.S.vitals[SP.U.todayISO()] || {}).water == null).toBe(true);
    });

    /* HATA (2026-10-25): bir cümlede iki su eklemesi önizlemede iki kez
       «toplam 1.250 ml» diyordu, kayıt 1500 yazıyordu. Her satırın önceki
       ve sonraki değeri kendinden önceki satırı sayar. */
    it('iki su eklemesinin önizlemesi sırayla toplar; yazılan son toplamdır', async function(){
      resetState();
      const bugun = SP.U.todayISO(), f = n => SP.U.fmtNum(n) + ' ml';
      SP.Test.pushVitals(bugun, { water:1000 });
      const c = P.quickCommand('su 250 ve su 250');
      expect(c.hint).toContain('2 kayıt');
      c.run();
      const satirlar = Array.from(document.querySelectorAll('.qeblok__satir'))
        .map(x => x.textContent.replace(/\s+/g, ' ').trim());
      expect(satirlar).toEqual([
        'Su ' + f(1000) + ' → +250 ml · toplam ' + f(1250),
        'Su ' + f(1250) + ' → +250 ml · toplam ' + f(1500),
      ]);
      await P.saveQuick();
      expect(Number(SP.S.vitals[bugun].water)).toBe(1500);
    });
  });
})();
