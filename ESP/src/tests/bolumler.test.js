/* T3 ESP — ekran içi sekme yok (EKIP-PLANI §1.2, katalog 019; T-DEVIR §6).

   Kanıtladığı sözler: disiplin ekranları bölümlerini ALT ALTA çizer ve
   hiçbiri `.subtabs`/`role=tab` taşımaz; bölüm çubuğu eski sekme eylemini
   taşır (envanter: eylem kaybolmaz); tezgâh en sonda kendi bölümüdür ve iç
   sekmeleri açılır satıra döndü — yalnız biri açık, kapalıların gövdesi
   gizli ama yerinde (alan kaybolmaz); aynı sayfada iki alan aynı kimliği
   taşımaz. */

(function(){
  const { describe, it, expect, resetState } = ESP.Test;

  function yerlestir(h){
    const d = document.createElement('div');
    d.innerHTML = String(h);
    document.body.appendChild(d);
    return d;
  }

  async function bolumlu(ekran, act, adlar){
    const d = yerlestir(await ESP.Screens[ekran].render());
    try{
      expect(d.querySelectorAll('[role="tab"], .subtabs').length).toBe(0);
      const b = Array.from(d.querySelectorAll('.sayfabolum > .sayfabolum__ad')).map(h => h.textContent.trim());
      expect(b).toEqual(adlar);
      const cubuk = Array.from(d.querySelectorAll('.bolumcubugu--sayfa .bolumcubugu__ad'));
      expect(cubuk.map(x => x.textContent.replace(/\d+/g, '').trim())).toEqual(adlar);
      cubuk.forEach(x => expect(x.getAttribute('data-act')).toBe(act));
      const ids = Array.from(d.querySelectorAll('[id]')).map(e => e.id);
      expect(ids.filter((x, i) => ids.indexOf(x) !== i)).toEqual([]);
      return d;
    }catch(e){ d.remove(); throw e; }
  }

  /* KULLANICI (2026-11-06): «en akıllıca, en anlaşılır seviye». Sözler: her alan aynı dört
     iş; «şimdi ne yapacağım» ilk sekmede ve duruma göre; yaptığının sonucu künyede; kapalı
     çekmece yok; karar ve uyarı gömülmez. */
  describe('Sadelik — ilk bakışta anlaşılan ekran (belgeler/ekip/sadelik/esp.md)', () => {
    const ALAN = { lang:['Çalış', 'Kartlarım', 'Öğren', 'İlerleme'], symposium:['Çalış', 'Tezlerim', 'Öğren', 'İlerleme'],
      history:['Çalış', 'Olaylar', 'Öğren', 'İlerleme'], studio:['Müzik', 'Diksiyon', 'Öğren', 'İlerleme'],
      library:['Çalış', 'Not ve kitap', 'Öğren', 'İlerleme'], writing:['Çalış', 'Taslaklarım', 'Öğren', 'İlerleme'] };

    it('her alan aynı dört iş; «Diğer» çekmecesi yok', async () => {
      resetState();
      for(const e of Object.keys(ALAN)){
        const d = yerlestir(await ESP.Screens[e].render());
        try{
          expect(Array.from(d.querySelectorAll('.bolumcubugu--sayfa .bolumcubugu__ad')).map(x => x.textContent.replace(/\d+/g, '').trim())).toEqual(ALAN[e]);
          expect(d.textContent.indexOf('Diğer')).toBe(-1);
          expect(d.querySelector('.sayfabolum.is-on').id).toBe(d.querySelector('.sayfabolum').id);
        }finally{ d.remove(); }
      }
    });

    it('özellikler yerinde: dilbilgisi Öğren, kart listesi Kartlarım, yol İlerleme, uzman masası ilk sekme', async () => {
      resetState();
      const d = yerlestir(await ESP.Screens.lang.render());
      try{
        expect(d.querySelector('#bl-ogren').textContent).toContain('İki eksen');
        expect(d.querySelector('#bl-ilerleme').textContent).toContain('Yol haritası');
        expect(!!d.querySelector('#bl-calis .desk__katlar')).toBe(true);
      }finally{ d.remove(); }
      await ESP.Model.saveArgument(ESP.Model.newArgument({ thesis:'Tez', supports:[], objections:[], concepts:[] }));
      const f = yerlestir(await ESP.Screens.symposium.render());
      try{
        expect(f.querySelector('#bl-acik').textContent).toContain('Tez');
        expect(f.querySelector('#bl-ogren').textContent).toContain('Kanondan ekle');
      }finally{ f.remove(); }
    });

    it('veri yokken ilk adım, veri varken sıradaki iş: kod seçer', async () => {
      resetState();
      const y = async () => yerlestir(await ESP.Screens.writing.render());
      let d = await y();
      try{
        expect(d.querySelector('#bl-calis').textContent).toContain('İlk taslağını aç');
        expect(d.querySelector('#bl-calis').textContent.indexOf('Bugünkü çalışma')).toBe(-1);
      }finally{ d.remove(); }
      await ESP.Model.saveDraft(ESP.Model.newDraft({ title:'Denemem', text:'Bir cümle.' }));
      d = await y();
      try{
        expect(d.querySelector('#bl-calis').textContent).toContain('Denemem');
        expect(d.querySelector('#bl-calis').textContent).toContain('Bugünkü çalışma');
        expect(!!d.querySelector('#bl-calis [data-act="son-taslak"]')).toBe(true);
      }finally{ d.remove(); }
      resetState();
      const m = yerlestir(await ESP.Screens.studio.render());
      try{
        const ad = Array.from(m.querySelectorAll('#bl-muzik .lrow__label')).map(x => x.textContent.trim());
        expect(/Parça ekle/.test(ad[0] || m.querySelector('#bl-muzik').textContent)).toBe(true);
        expect(m.querySelector('#bl-muzik').textContent.indexOf('Tekrar kaydet')).toBe(-1);
      }finally{ m.remove(); }
    });

    it('Şimdi künyesi sonucu söyler; girilmemiş gün sıfır yazılmaz', async () => {
      resetState();
      let e = yerlestir(String(ESP.Parts.simdi('writing', { baslik:'x' })));
      try{ expect(e.textContent).toContain('bugün kayıt yok'); expect(e.textContent.indexOf('0 dk')).toBe(-1); }finally{ e.remove(); }
      await ESP.Model.addSession(ESP.U.todayISO(), { disc:'writing', minutes:25, minutesCert:'measured', note:'' });
      e = yerlestir(String(ESP.Parts.simdi('writing', { baslik:'x' })));
      try{ expect(e.textContent).toContain('bugün 25 dk'); }finally{ e.remove(); }
    });

    it('Konu anlatımı kartı yalnız «Öğren»in içinde; adım adım öğrenmeye bağlantı var', async () => {
      resetState();
      const eski = ESP.S.route;
      ESP.S.route = 'lang';
      try{
        const d = yerlestir(await ESP.Screens.lang.render());
        try{
          const k = Array.from(d.querySelectorAll('.rehber-alan'));
          expect(k.length).toBe(1);
          expect(k[0].closest('.sayfabolum').id).toBe('bl-ogren');
          expect(!!d.querySelector('#bl-ogren [data-route="ogrenme"]')).toBe(true);
        }finally{ d.remove(); }
      }finally{ ESP.S.route = eski; }
    });

    it('Analiz: dört iş; radar Alanlar, seriler Zaman, dürüstlük Rapor; yol Plan\'da', async () => {
      resetState();
      const d = yerlestir(await ESP.Screens.analytics.render());
      try{
        expect(Array.from(d.querySelectorAll('.bolumcubugu--sayfa .bolumcubugu__ad')).map(x => x.getAttribute('data-tab'))).toEqual(['ozet', 'alanlar', 'zaman', 'rapor']);
        expect(d.querySelector('.sayfabolum.is-on').id).toBe('bl-ozet');
        expect(!!d.querySelector('#bl-alanlar .radarcift')).toBe(true);
        expect(!!d.querySelector('#bl-rapor [data-act="calib-open"]')).toBe(true);
        expect(d.querySelector('#bl-alanlar [data-route="ladder"]') != null).toBe(true);
        expect(d.querySelector('[data-act="analiz-ayrinti"]')).toBeNull();
      }finally{ d.remove(); }
    });

    it('Analiz: süre ve sonuç ayrıştıysa uyarı Özet\'te, sayısı Rapor sekmesinde', async () => {
      resetState();
      await ESP.Model.addSession(ESP.U.todayISO(), { disc:'lang', minutes:20, minutesCert:'measured', note:'' });
      const G = ESP.Goodhart, b = G.brief, f = G.flags;
      G.brief = () => ({ count:1, title:'Bir gösterge ayrışmış', body:'not', flags:[{}] });
      G.flags = () => [{ effortLabel:'x' }];
      try{
        const d = yerlestir(await ESP.Screens.analytics.render());
        try{
          expect(d.querySelector('#bl-ozet').textContent).toContain('Bir gösterge ayrışmış');
          expect(d.querySelector('.bolumcubugu__ad[data-tab="rapor"]').textContent).toContain('1');
        }finally{ d.remove(); }
      }finally{ G.brief = b; G.flags = f; }
    });

    it('Analiz boşken tek ilk adım; kayıt gelince özet kartları', async () => {
      resetState();
      let d = yerlestir(await ESP.Screens.analytics.render());
      try{
        expect(d.querySelector('#bl-ozet').textContent).toContain('Henüz kayıt yok');
        expect(!!d.querySelector('#bl-ozet [data-route="today"]')).toBe(true);
        expect(d.querySelector('#bl-ozet .pk-ust')).toBeNull();
      }finally{ d.remove(); }
      await ESP.Model.addSession(ESP.U.todayISO(), { disc:'lang', minutes:20, minutesCert:'measured', note:'' });
      d = yerlestir(await ESP.Screens.analytics.render());
      try{
        expect(!!d.querySelector('#bl-ozet .pk-ust')).toBe(true);
        expect(!!d.querySelector('#bl-zaman .analizbasi')).toBe(true);
      }finally{ d.remove(); }
    });

    it('Plan: ölçüm yokken ilk adım «Kendini sına»; sınama kendi sekmesinde; yol haritası Durum\'da', async () => {
      resetState();
      const d = yerlestir(await ESP.Screens.ladder.render());
      try{
        expect(d.querySelector('#bl-ozet [data-tab="tespit"]').textContent.trim()).toBe('Kendini sına');
        expect(d.querySelector('.lrow.step')).toBeNull();
        expect(!!d.querySelector('.step__cols')).toBe(true);
        expect(d.querySelector('#bl-ozet').textContent.indexOf('Yol haritası')).toBe(-1);
      }finally{ d.remove(); }
    });

    it('Bugün: düğme durumu söyler; deste boşken «Kartları çalış» demez', () => {
      const T = ESP.Screens.today;
      expect(T.eylemAdi({ route:'lang', id:'srs-due' })).toBe('Kartları çalış');
      expect(T.eylemAdi({ route:'lang', id:'goal:x' })).toBe('Dil çalışmasına geç');
      expect(T.eylemAdi({ route:'bilinmez', id:'x' })).toBe('Başla');
    });

    it('Bugün: ekranda tek birincil, boş sütun yok', async () => {
      resetState();
      await ESP.Model.addSession(ESP.U.todayISO(), { disc:'lang', minutes:20, minutesCert:'measured', note:'' });
      const n = ESP.Planner.nextAction();
      const d = yerlestir(String(ESP.Screens.today.kapak()) + String(await ESP.Screens.today.render()));
      try{
        if(n.rank && n.route !== 'today') expect(d.querySelectorAll('.btn--primary').length).toBe(1);
        const b = Array.from(d.querySelectorAll('[aria-label="Gün"] th')).map(x => x.textContent.trim());
        expect(b.indexOf('Sayım')).toBe(-1);
        expect(b.indexOf('Not')).toBe(-1);
      }finally{ d.remove(); }
    });

    it('Onaylar: öneri, soru ve geçmiş ayrı; soru sıra sıra', async () => {
      resetState();
      const Kg = window.LIFEOS.KING;
      const eski = Kg.cikarimKarti;
      const istenen = [];
      Kg.cikarimKarti = n => { istenen.push(n); return '<div class="ck">soru</div>'; };
      try{
        const d = yerlestir(await ESP.Screens.onaylar.render());
        try{
          expect(istenen).toEqual([1]);
          expect(!!d.querySelector('#bl-sorular [data-oz="cikarim"]')).toBe(true);
        }finally{ d.remove(); }
      }finally{ Kg.cikarimKarti = eski; }
    });

    it('İnceleme: önce karar; hiç ölçüm yokken boş sayı kutuları çizilmez', async () => {
      resetState();
      const d = yerlestir(await ESP.Screens.meeting.render());
      try{
        expect(d.textContent).toContain('Tek karar');
        expect(d.querySelector('.inc-sayilar')).toBeNull();
      }finally{ d.remove(); }
    });

    it('Ofis önce «Bu hafta»yla açılır; sıradaki iş Masalar\'da ikinci kez çizilmez', async () => {
      resetState();
      const ofis = ESP.Nav.sections().find(s => s.id === 'ofis');
      expect(ofis.views.map(v => v.label || v.ad)).toEqual(['Bu hafta', 'Uzmana sor', 'Masalar']);
      const d = yerlestir(await ESP.Screens.office.render());
      try{
        expect(d.querySelector('.nextup')).toBeNull();
        expect(!!d.querySelector('[data-route="meeting"]')).toBe(true);
      }finally{ d.remove(); }
    });

    it('Anlatımlar menüde ayrı satır değil; Öğrenme\'nin altından açılır', async () => {
      resetState();
      const kitap = ESP.Nav.sections().find(s => s.id === 'kutuphane');
      expect(kitap.views.some(v => v.route === 'rehber')).toBe(false);
      expect(!!ESP.Screens.rehber).toBe(true);
      const d = yerlestir(String(ESP.Screens.ogrenme.render()));
      try{ expect(!!d.querySelector('[data-route="rehber"]')).toBe(true); }finally{ d.remove(); }
    });
  });

  describe('T3 ESP — disiplin sekmeleri bölüm oldu', () => {
    it('oz-019 Dil: dört iş', async () => {
      resetState();
      (await bolumlu('lang', 'lang-tab', ['Çalış', 'Kartlarım', 'Öğren', 'İlerleme'])).remove();
    });
    it('oz-019 Felsefe, Tarih, Okuma, Yazı: sekme yok, bölümler alt alta', async () => {
      resetState();
      (await bolumlu('symposium', 'philo-tab', ['Çalış', 'Tezlerim', 'Öğren', 'İlerleme'])).remove();
      (await bolumlu('history', 'pick-tab', ['Çalış', 'Olaylar', 'Öğren', 'İlerleme'])).remove();
      (await bolumlu('library', 'read-tab', ['Çalış', 'Not ve kitap', 'Öğren', 'İlerleme'])).remove();
      (await bolumlu('writing', 'write-tab', ['Çalış', 'Taslaklarım', 'Öğren', 'İlerleme'])).remove();
    });

    it('uzman masası: açılır satırlar, yalnız seçilen açık; kapalıların gövdesi de yerinde', async () => {
      resetState();
      if(!ESP.Desk.isOpen('lang')) ESP.Desk.toggle('lang');
      ESP.Desk.setTab('lang', 'hatirlatma');
      const d = yerlestir(await ESP.Screens.lang.render());
      try{
        const k = Array.from(d.querySelectorAll('#bl-calis .desk__kat'));
        expect(k.length).toBe(ESP.Desk.TABS.length);
        const acik = k.filter(x => x.querySelector('.desk__kat-bas').getAttribute('aria-expanded') === 'true');
        expect(acik.length).toBe(1);
        expect(acik[0].querySelector('.desk__kat-bas').getAttribute('data-tab')).toBe('hatirlatma');
        expect(acik[0].querySelector('.desk__body').hidden).toBe(false);
        /* Kapalı satırın gövdesi gizli ama yerinde: alanları kaybolmaz (envanter). */
        expect(k.filter(x => x.querySelector('.desk__body').hidden).length).toBe(ESP.Desk.TABS.length - 1);
        expect(!!d.querySelector('#bl-calis [id^="rm-text-"]')).toBe(true);
        k.forEach(x => {
          const b = x.querySelector('.desk__kat-bas');
          expect(b.tagName).toBe('BUTTON');
          expect(b.getAttribute('data-act')).toBe('desk-tab');
          expect(!!document.getElementById(b.getAttribute('aria-controls'))).toBe(true);
        });
      }finally{ d.remove(); }
    });
  });
})();
