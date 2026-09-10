/* Arayüz katmanı — kaçırma, bileşen sözleşmeleri ve ekran sözleşmesi.

   En kritik test kaçırmadır: kullanıcı verisi HTML'e olduğu gibi basılırsa
   bir tahlil notuna yazılan etiket koda dönüşür. */

(function(){
  const { describe, it, expect, resetState, withToday, pushLab, pushVitals, pushMeal } = SP.Test;
  const U = SP.U, K = SP.C, P = SP.Parts;
  const { html, raw } = SP.h;

  describe('h — şablon kaçırma', () => {
    it('araya giren değer kaçırılır', () => {
      const out = String(html`<p>${'<script>kotu()</script>'}</p>`);
      expect(out.indexOf('<script>') < 0).toBeTruthy();
      expect(out).toContain('&lt;script&gt;');
    });

    it('raw işaretli içerik olduğu gibi geçer', () => {
      expect(String(html`<div>${raw('<b>kalın</b>')}</div>`)).toContain('<b>kalın</b>');
    });

    it('iç içe html çağrısı zaten raw döner', () => {
      expect(String(html`<ul>${html`<li>öğe</li>`}</ul>`)).toContain('<li>öğe</li>');
    });

    it('dizi birleşir', () => {
      expect(String(html`${[1, 2, 3].map(n => html`<i>${n}</i>`)}`)).toBe('<i>1</i><i>2</i><i>3</i>');
    });

    it('null ve false hiçbir şey basmaz', () => {
      expect(String(html`a${null}${false}${undefined}b`)).toBe('ab');
    });

    it('nitelik sözlüğü tehlikeli değeri kaçırır', () => {
      const out = String(SP.h.attrs({ title:'a" onclick="kotu()' }));
      expect(out.indexOf('onclick="kotu') < 0).toBeTruthy();
    });

    it('when yanlış koşulda boş üretir', () => {
      expect(String(SP.h.when(false, () => html`<b>x</b>`))).toBe('');
    });
  });

  describe('Bileşenler', () => {
    it('kart başlık ve gövdeyi basar', () => {
      const out = String(K.Card({ title:'Başlık', body:html`<p>gövde</p>` }));
      expect(out).toContain('Başlık');
      expect(out).toContain('<p>gövde</p>');
    });

    it('kart başlığındaki kullanıcı metni kaçırılır', () => {
      const out = String(K.Card({ title:'<img src=x onerror=1>', body:'' }));
      expect(out.indexOf('<img') < 0).toBeTruthy();
    });

    it('rozet tona göre ikon ekler', () => {
      expect(String(K.Badge({ label:'iyi', tone:'ok' }))).toContain('svg');
      expect(String(K.Badge({ label:'nötr', tone:'muted' })).indexOf('svg') < 0).toBeTruthy();
    });

    it('çubuk değeri 0–100 arasına sıkışır', () => {
      expect(String(K.Bar({ value:250 }))).toContain('width:100%');
      expect(String(K.Bar({ value:-50 }))).toContain('width:0%');
    });

    it('tablo sayı sütununu işaretler', () => {
      const out = String(K.Table({ headers:['Ad', { label:'Değer', num:true }], rows:[['a', '1']] }));
      expect(out).toContain('class="num"');
    });

    it('sayfalama sınırları aşmaz', () => {
      const p = K.paginate([1, 2, 3, 4, 5], 99, 2);
      expect(p.page).toBe(3);
      expect(p.items).toEqual([5]);
    });

    it('tek sayfada gezinme çubuğu çizilmez', () => {
      expect(String(K.Pager({ page:1, pages:1, total:3, act:'x' }))).toBe('');
    });

    it('boş durum tek eylem sunar', () => {
      const out = String(K.Empty({ text:'yok', action:K.Button({ label:'Ekle', act:'x' }) }));
      expect(out).toContain('Ekle');
    });

    it('seçmeli grup aktif değeri işaretler', () => {
      const out = String(K.Segmented({ value:'b', act:'x',
        items:[{ value:'a', label:'A' }, { value:'b', label:'B' }] }));
      expect(out).toContain('aria-pressed="true"');
    });
  });

  describe('Parçalar', () => {
    it('kesinlik rozeti dört durumu bilir', () => {
      ['measured', 'estimated', 'derived', 'missing'].forEach(k => {
        expect(String(P.cert(k)).length > 10).toBeTruthy();
      });
    });

    it('bilinmeyen kesinlik "veri yok"a düşer', () => {
      expect(String(P.cert('saçma'))).toContain('veri yok');
    });

    it('ölçüm satırı değer yokken tire basar', () => {
      resetState();
      const row = { marker:SP.BIO_BY_ID.ferritin, value:null, cert:'missing',
        status:SP.Bio.statusOf('ferritin', null), ref:null, optimal:null, at:null };
      expect(String(P.markerRow(row, {}))).toContain('—');
    });

    it('ölçüm satırı değer varken referans çubuğu çizer', () => {
      resetState();
      const r = SP.Bio.refFor('ferritin');
      const row = { marker:SP.BIO_BY_ID.ferritin, value:80, cert:'measured',
        status:SP.Bio.statusOf('ferritin', 80), ref:r.ref, optimal:r.optimal, at:'2026-01-01' };
      expect(String(P.markerRow(row, {}))).toContain('rangebar');
    });

    it('ajan avatarı kimlik sınıfını taşır', () => {
      expect(String(P.avatar('lab'))).toContain('agentav--lab');
    });

    it('kaynak rozeti model ile kural motorunu ayırır', () => {
      expect(String(P.sourceBadge('model'))).toContain('model');
      expect(String(P.sourceBadge('rules'))).toContain('kural motoru');
    });

    it('bayrak kartı yönlendirme metnini içerir', () => {
      const out = String(P.flagCard({ id:'x', label:'Test', detail:'ayrıntı', ack:false }));
      expect(out).toContain('hekim');
    });
  });

  describe('UI — görseller', () => {
    it('referans çubuğu değer aralığın içindeyken taşma işareti koymaz', () => {
      const out = SP.UI.rangeBar(80, [30, 400], [80, 250], 'ng/mL');
      expect(out).toContain('rangebar__mark');
      expect(out.indexOf('is-out') < 0).toBeTruthy();
    });

    it('aralık dışı değer taşma işaretiyle çizilir', () => {
      expect(SP.UI.rangeBar(10, [30, 400], null, 'ng/mL')).toContain('is-out');
    });

    it('geçersiz aralıkta çubuk çizilmez', () => {
      expect(SP.UI.rangeBar(10, null)).toBe('');
      expect(SP.UI.rangeBar(10, [5, 5])).toBe('');
    });

    it('değer yoksa yalnızca aralık çizilir', () => {
      const out = SP.UI.rangeBar(null, [30, 400]);
      expect(out).toContain('rangebar__ref');
      expect(out.indexOf('rangebar__mark') < 0).toBeTruthy();
    });

    it('makro şeridi üç dilim çizer', () => {
      const out = SP.UI.macroSplit({ protein:400, fat:600, carb:1000 });
      expect(out).toContain('Protein');
      expect(out).toContain('Karbonhidrat');
    });

    it('eğilim oku yön sınıfı taşır', () => {
      expect(SP.UI.trend('up')).toContain('trendmark--up');
      expect(SP.UI.trend()).toContain('trendmark--flat');
    });

    it('veri yokken çizgi grafik açıklama basar', () => {
      expect(SP.UI.lineChart([{ data:[] }])).toContain('veri yok');
    });

    it('ipucu bilinmeyen anahtarda boş döner', () => {
      expect(SP.UI.hint('olmayan-anahtar')).toBe('');
      expect(SP.UI.hint('readiness')).toContain('data-hint');
    });

    it('grafik etiketleri kaçırılır', () => {
      const out = SP.UI.barChart([{ label:'<b>x</b>', value:50 }], { max:100 });
      expect(out.indexOf('<b>x</b>') < 0).toBeTruthy();
    });
  });

  describe('Ekranlar — sözleşme', () => {
    const ids = ['today', 'vitals', 'labs', 'meals', 'kitchen', 'move', 'basket',
      'analytics', 'office', 'team', 'meeting', 'family', 'guide'];

    it('bütün ekranlar kayıtlı', () => {
      ids.forEach(id => expect(SP.Screens[id]).toBeTruthy());
    });

    it('her ekranın id, başlık, alt başlık ve render\'ı var', () => {
      ids.forEach(id => {
        const sc = SP.Screens[id];
        expect(sc.id).toBe(id);
        expect(typeof sc.title).toBe('string');
        expect(typeof sc.subtitle).toBe('function');
        expect(typeof sc.render).toBe('function');
      });
    });

    it('gezinmedeki her yol gerçek bir ekrana bağlanır', () => {
      SP.App.SECTIONS.forEach(sec => sec.views.forEach(v => {
        expect(SP.Screens[v.route]).toBeTruthy();
      }));
    });

    it('yedi bölüm vardır ve her ekran tam bir bölüme aittir', () => {
      expect(SP.App.SECTIONS.length).toBe(7);
      const seen = {};
      SP.App.SECTIONS.forEach(sec => {
        expect(sec.views.length > 0).toBeTruthy();
        sec.views.forEach(v => {
          /* Bir ekran iki bolumde birden gorunemez: gezinme tek bir yer
             gostermeli, yoksa etkin bolum belirsizlesir. */
          expect(seen[v.route]).toBeFalsy();
          seen[v.route] = sec.id;
        });
      });
      ids.forEach(id => { expect(seen[id]).toBeTruthy(); });
    });

    it('hero başlığı ve ledesi metin döndürür', async () => {
      for(const id of ids){
        const sc = SP.Screens[id];
        if(sc.headline) expect(typeof sc.headline()).toBe('string');
        if(sc.lede) expect(typeof sc.lede()).toBe('string');
        if(sc.stats){
          const st = sc.stats();
          expect(Array.isArray(st)).toBeTruthy();
          /* Hero'da dortten fazla sayi okunmaz; dordu de gozle taranabilmeli. */
          expect(st.length <= 4).toBeTruthy();
          st.forEach(x => { expect(x.value != null).toBeTruthy();
            expect(typeof x.label).toBe('string'); });
        }
      }
    });

    it('hareket alanlarının hepsi bir sekmeye karşılık gelir', () => {
      expect(SP.AREAS.length).toBe(4);
      SP.AREAS.forEach(a => {
        expect(typeof a.label).toBe('string');
        expect(typeof a.note).toBe('string');
        if(a.kind) expect(SP.EXERCISES.some(e => e.kind === a.kind)).toBeTruthy();
      });
      /* Dinlenme bir egzersiz turu degildir; kendi sayfasi vardir. */
      expect(SP.AREA_BY_ID.dinlenme.kind).toBe(null);
    });

    it('boş durumda hiçbir ekran çökmez', async () => {
      resetState();
      await SP.Test.withTodayAsync('2026-03-01', async () => {
        for(const id of ids){
          const out = String(await SP.Screens[id].render());
          expect(out.length > 20).toBeTruthy();
        }
      });
    });

    it('dolu durumda da hiçbir ekran çökmez', async () => {
      resetState();
      await SP.Test.withTodayAsync('2026-03-10', async () => {
        pushLab('2026-01-01', { ferritin:20, hgb:13.2, ldl:145, glucose:96 });
        pushLab('2026-03-01', { ferritin:35, hgb:13.8, ldl:130, glucose:94 });
        pushVitals('2026-03-10', { sleep:7, rhr:58, hrv:52, soreness:4, water:2100, weight:78 });
        pushMeal('2026-03-10', 'kahvalti', [['yumurta', 110], ['beyaz-peynir', 40], ['cay', 240]]);
        pushMeal('2026-03-10', 'ogle', [['kuru-fasulye-etli', 250], ['pilav', 180]]);
        SP.S.basket.items = [{ foodId:'somon', kg:1 }, { foodId:'kirmizi-mercimek', kg:2 }];
        SP.S.basket.weeklyLimit = 1500;
        SP.Test.pushWorkout('2026-03-10', { minutes:45, rpe:7, items:['sinav', 'squat'] });
        for(const id of ids){
          const out = String(await SP.Screens[id].render());
          expect(out.length > 20).toBeTruthy();
        }
      });
    });

    it('alt başlıklar hata vermeden metin döner', () => {
      resetState();
      withToday('2026-03-01', () => {
        ids.forEach(id => expect(typeof SP.Screens[id].subtitle()).toBe('string'));
      });
    });

    it('eylem düğmeleri metin döner', () => {
      resetState();
      withToday('2026-03-01', () => {
        ids.forEach(id => {
          const sc = SP.Screens[id];
          if(sc.actions) expect(typeof sc.actions()).toBe('string');
        });
      });
    });
  });

  describe('Komut paleti', () => {
    it('bütün ekranlar palette bulunur', () => {
      const cmds = SP.Palette.commands();
      SP.App.SECTIONS.forEach(sec => sec.views.forEach(v => {
        expect(cmds.some(c => c.id === 'go:' + v.route)).toBeTruthy();
      }));
    });

    it('ölçümler ve ajanlar da listelenir', () => {
      const cmds = SP.Palette.commands();
      expect(cmds.some(c => c.id === 'bio:ferritin')).toBeTruthy();
      expect(cmds.some(c => c.id === 'agent:patron')).toBeTruthy();
    });

    it('her komutun çalıştırılabilir bir işlevi var', () => {
      SP.Palette.commands().forEach(c => expect(typeof c.run).toBe('function'));
    });
  });

  describe('Kurulum', () => {
    it('boş profilde kurulum gerekir', () => {
      resetState();
      SP.S.profile = SP.Model.defaultProfile();
      expect(SP.Setup.needed()).toBeTruthy();
    });

    it('dolu profilde kurulum gerekmez', () => {
      resetState();
      expect(SP.Setup.needed()).toBeFalsy();
    });
  });

  describe('Yardımcılar', () => {
    it('Türkçe karakterler aramada normalleşir', () => {
      expect(U.norm('Öğrenme')).toBe(U.norm('ogrenme'));
      expect(U.norm('İSPANAK')).toBe('ispanak');
    });

    it('yüzde sıfır bölene karşı korumalı', () => {
      expect(U.pct(5, 0)).toBe(0);
    });

    it('sıkıştırma sınırları uygular', () => {
      expect(U.clamp(15, 0, 10)).toBe(10);
      expect(U.clamp(-5, 0, 10)).toBe(0);
    });

    it('gün farkı doğru hesaplanır', () => {
      expect(U.diffDays('2026-01-01', '2026-01-31')).toBe(30);
    });

    it('ortanca çift ve tek uzunlukta çalışır', () => {
      expect(U.median([1, 3, 5])).toBe(3);
      expect(U.median([1, 3, 5, 7])).toBe(4);
      expect(U.median([])).toBeNull();
    });

    it('slug Türkçe harfleri sadeleştirir', () => {
      expect(U.slug('Ayşe Çınar')).toBe('ayse-cinar');
    });
  });
})();
