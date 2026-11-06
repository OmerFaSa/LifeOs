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

  async function bolumlu(ekran, act, ana, ikincil){
    const d = yerlestir(await ESP.Screens[ekran].render());
    try{
      expect(d.querySelectorAll('[role="tab"], .subtabs').length).toBe(0);
      const b = Array.from(d.querySelectorAll('.sayfabolum > .sayfabolum__ad')).map(h => h.textContent.trim());
      expect(b).toEqual(ana.concat(['Diğer'], ikincil, ['Uzman masası']));
      const cubuk = Array.from(d.querySelectorAll('.bolumcubugu--sayfa .bolumcubugu__ad'));
      expect(cubuk.map(x => x.textContent.replace(/\d+/g, '').trim())).toEqual(ana.concat(['Diğer']));
      cubuk.forEach(x => expect(x.getAttribute('data-act')).toBe(act));
      const ids = Array.from(d.querySelectorAll('[id]')).map(e => e.id);
      expect(ids.filter((x, i) => ids.indexOf(x) !== i)).toEqual([]);
      return d;
    }catch(e){ d.remove(); throw e; }
  }

  /* KULLANICI (2026-11-06): «bir bölümde birden fazla özellik var, anlaşılmıyor».
     Sözler: çubukta en çok dört ad; iş ilk ekranda, grafik önünde durmaz; hiçbir
     bölüm kaybolmaz, «Diğer» satırı ne işe yaradığını söyler. */
  describe('Sadelik — bir bölüm bir iş (belgeler/ekip/sadelik/esp.md)', () => {
    const EKRAN = ['lang', 'symposium', 'history', 'studio', 'library', 'writing', 'analytics'];

    it('her ekranda çubukta en çok dört ad, «Diğer» her bölüme ulaşır ve her satır açıklar', async () => {
      resetState();
      for(const e of EKRAN){
        const d = yerlestir(await ESP.Screens[e].render());
        try{
          const cubuk = Array.from(d.querySelectorAll('.bolumcubugu--sayfa .bolumcubugu__ad'));
          expect(e + ':' + (cubuk.length <= 4)).toBe(e + ':true');
          const satir = Array.from(d.querySelectorAll('#bl-diger .diger-satir'));
          const alt = Array.from(d.querySelectorAll('.sayfabolum[data-ust="diger"]')).map(s => s.id.replace('bl-', ''));
          expect(satir.map(x => x.getAttribute('data-tab'))).toEqual(alt);
          /* Çubuktaki ve «Diğer»deki ad toplamı bütün bölümlerdir: yeri değişti, silinmedi. */
          const hepsi = Array.from(d.querySelectorAll('.sayfabolum')).map(s => s.id.replace('bl-', ''));
          const ulasilan = cubuk.map(x => x.getAttribute('data-tab')).concat(alt);
          expect(ulasilan.slice().sort()).toEqual(hepsi.slice().sort());
          satir.forEach(x => expect(e + ':' + x.getAttribute('data-tab') + ':' + !!x.querySelector('.tiny')).toBe(e + ':' + x.getAttribute('data-tab') + ':true'));
        }finally{ d.remove(); }
      }
    });

    it('alt bölüm açılınca çubukta «Diğer» seçili kalır, geri düğmesi listeye döner', async () => {
      resetState();
      const d = yerlestir(await ESP.Screens.lang.render());
      try{
        expect(ESP.C.bolumeGit('kartlar')).toBe(true);
        expect(d.querySelector('#bl-kartlar').classList.contains('is-on')).toBe(true);
        const on = d.querySelectorAll('.bolumcubugu--sayfa .bolumcubugu__ad.is-on');
        expect(on.length).toBe(1);
        expect(on[0].getAttribute('data-tab')).toBe('diger');
        const geri = d.querySelector('#bl-kartlar .sayfabolum__geri');
        expect(geri.getAttribute('data-tab')).toBe('diger');
        expect(geri.getAttribute('data-act')).toBe('lang-tab');
        /* Seçim yeniden çizimde korunur. */
        const y = yerlestir(await ESP.Screens.lang.render());
        try{
          expect(y.querySelector('#bl-kartlar').classList.contains('is-on')).toBe(true);
          expect(y.querySelector('.bolumcubugu__ad.is-on').getAttribute('data-tab')).toBe('diger');
        }finally{ y.remove(); }
        ESP.C.bolumeGit('calis');
      }finally{ d.remove(); }
    });

    it('grafikler «İlerleme»de: sekmelerin önünde kart yok, ilk bölümde işin düğmesi var', async () => {
      resetState();
      for(const [e, ilk] of [['lang', 'calis'], ['symposium', 'acik'], ['studio', 'muzik'], ['library', 'notlar']]){
        const d = yerlestir(await ESP.Screens[e].render());
        try{
          const nav = d.querySelector('.bolumcubugu--sayfa');
          const once = Array.from(d.querySelectorAll('.pk')).filter(x => nav.compareDocumentPosition(x) & Node.DOCUMENT_POSITION_PRECEDING);
          expect(e + ':' + once.length).toBe(e + ':0');
          /* Veri yoksa grafik de «İlerleme» de yok: boş bölüm listelenmez. */
          if(e === 'lang' || e === 'studio') expect(e + ':' + !!d.querySelector('#bl-ilerleme')).toBe(e + ':true');
          expect(d.querySelector('.sayfabolum.is-on').id).toBe('bl-' + ilk);
        }finally{ d.remove(); }
      }
    });

    it('Konu anlatımı kartı yalnız «Öğren»in içinde', async () => {
      resetState();
      const eski = ESP.S.route;
      ESP.S.route = 'lang';
      try{
        const d = yerlestir(await ESP.Screens.lang.render());
        try{
          const k = Array.from(d.querySelectorAll('.rehber-alan'));
          expect(k.length).toBe(1);
          expect(k[0].closest('.sayfabolum').id).toBe('bl-ogren');
        }finally{ d.remove(); }
      }finally{ ESP.S.route = eski; }
    });

    it('Analiz: Özet, Alanlar, Zaman ve Diğer; eski «Ayrıntılı okumalar» düğmesi yok', async () => {
      resetState();
      const d = yerlestir(await ESP.Screens.analytics.render());
      try{
        expect(Array.from(d.querySelectorAll('.bolumcubugu--sayfa .bolumcubugu__ad')).map(x => x.getAttribute('data-tab'))).toEqual(['ozet', 'alanlar', 'zaman', 'diger']);
        expect(d.querySelector('[data-act="analiz-ayrinti"]')).toBeNull();
        expect(d.querySelector('.sayfabolum.is-on').id).toBe('bl-ozet');
        ['ozet', 'alanlar', 'zaman', 'yol', 'radar', 'seriler', 'rapor', 'durust', 'rubrikler'].forEach(b =>
          expect(b + ':' + !!d.querySelector('#bl-' + b)).toBe(b + ':true'));
        expect(!!d.querySelector('#bl-ozet .pk-ust')).toBe(true);
        expect(!!d.querySelector('#bl-alanlar .alan-kare')).toBe(true);
        expect(!!d.querySelector('#bl-zaman .analizbasi')).toBe(true);
      }finally{ d.remove(); }
    });

    it('Plan: karışık sınama «Sınama» bölümünde; kademe satırı başka bileşenin ızgarasını almaz', async () => {
      resetState();
      const d = yerlestir(await ESP.Screens.ladder.render());
      try{
        const k = d.querySelector('.pk--alan-sinama') || d.querySelector('[data-tur="alan-sinama"]');
        if(k) expect(k.closest('.sayfabolum').id).toBe('bl-tespit');
        expect(d.querySelector('.lrow.step')).toBeNull();
        expect(!!d.querySelector('.step__cols')).toBe(true);
      }finally{ d.remove(); }
    });

    it('Bugün: düğme ne yapacağını söyler; ekranda tek birincil; boş sütun yok', async () => {
      resetState();
      const gun = ESP.U.todayISO();
      await ESP.Model.addSession(gun, { disc:'lang', minutes:20, minutesCert:'measured', note:'' });
      const n = ESP.Planner.nextAction();
      const d = yerlestir(String(ESP.Screens.today.kapak()) + String(await ESP.Screens.today.render()));
      try{
        const b = d.querySelectorAll('.btn--primary');
        if(n.rank && n.route !== 'today') expect(b.length).toBe(1);
        const basliklar = Array.from(d.querySelectorAll('[aria-label="Gün"] th')).map(x => x.textContent.trim());
        expect(basliklar.indexOf('Sayım')).toBe(-1);
        expect(basliklar.indexOf('Not')).toBe(-1);
        expect(basliklar.indexOf('Süre') >= 0).toBe(true);
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
  });

  describe('T3 ESP — disiplin sekmeleri bölüm oldu', () => {
    it('oz-019 Dil: çubukta iş, gerisi «Diğer»de', async () => {
      resetState();
      (await bolumlu('lang', 'lang-tab', ['Çalış', 'Ekle', 'Öğren'], ['Kartlar', 'Dilbilgisi', 'İlerleme'])).remove();
    });
    it('oz-019 Felsefe, Tarih, Okuma, Yazı: sekme yok, bölümler alt alta', async () => {
      resetState();
      (await bolumlu('symposium', 'philo-tab', ['Tezler', 'Yeni tez', 'Öğren'], ['Kapanan tezler', 'Metinler', 'Deneyler'])).remove();
      (await bolumlu('history', 'pick-tab', ['Zaman şeridi', 'Olaylar', 'Öğren'], ['Alıştırma', 'Kaynaklar', 'Neden zinciri'])).remove();
      (await bolumlu('library', 'read-tab', ['Notlar', 'Kaynaklar', 'Öğren'], ['Not bağları', 'Yöntem'])).remove();
      (await bolumlu('writing', 'write-tab', ['Taslaklar', 'Ölçüm', 'Öğren'], ['Araçlar'])).remove();
    });

    it('tezgâh: yedi açılır satır, yalnız seçilen açık; kapalıların gövdesi de yerinde', async () => {
      resetState();
      if(!ESP.Desk.isOpen('lang')) ESP.Desk.toggle('lang');
      ESP.Desk.setTab('lang', 'harita');
      const d = yerlestir(await ESP.Screens.lang.render());
      try{
        const k = Array.from(d.querySelectorAll('#bl-tezgah .desk__kat'));
        expect(k.length).toBe(ESP.Desk.TABS.length);
        const acik = k.filter(x => x.querySelector('.desk__kat-bas').getAttribute('aria-expanded') === 'true');
        expect(acik.length).toBe(1);
        expect(acik[0].querySelector('.desk__kat-bas').getAttribute('data-tab')).toBe('harita');
        expect(acik[0].querySelector('.desk__body').hidden).toBe(false);
        /* Kapalı satırın gövdesi gizli ama yerinde: alanları kaybolmaz (envanter). */
        expect(k.filter(x => x.querySelector('.desk__body').hidden).length).toBe(ESP.Desk.TABS.length - 1);
        expect(!!d.querySelector('#bl-tezgah [id^="rm-text-"]')).toBe(true);
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
