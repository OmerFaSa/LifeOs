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
      expect(b).toEqual(adlar.concat(['Tezgâh']));
      const cubuk = Array.from(d.querySelectorAll('.bolumcubugu--sayfa .bolumcubugu__ad'));
      expect(cubuk.length).toBe(adlar.length + 1);
      cubuk.forEach(x => expect(x.getAttribute('data-act')).toBe(act));
      const ids = Array.from(d.querySelectorAll('[id]')).map(e => e.id);
      expect(ids.filter((x, i) => ids.indexOf(x) !== i)).toEqual([]);
      return d;
    }catch(e){ d.remove(); throw e; }
  }

  describe('T3 ESP — disiplin sekmeleri bölüm oldu', () => {
    it('oz-019 Dil: altı bölüm ve tezgâh alt alta', async () => {
      resetState();
      (await bolumlu('lang', 'lang-tab',
        ['Çalış', 'Kartlar', 'Ekle', 'Öğren', 'Dilbilgisi', 'İlerleme'])).remove();
    });
    it('oz-019 Felsefe, Tarih, Okuma, Yazı: sekme yok, bölümler alt alta', async () => {
      resetState();
      (await bolumlu('symposium', 'philo-tab', ['Açık', 'Kapalı', 'Ekle', 'Metinler', 'Deneyler', 'Öğren'])).remove();
      (await bolumlu('history', 'pick-tab', ['Şerit', 'Olaylar', 'Kaynaklar', 'Zincir', 'Öğren', 'Çalışma'])).remove();
      (await bolumlu('library', 'read-tab', ['Notlar', 'Matris', 'Kaynaklar', 'Yöntem', 'Öğren'])).remove();
      (await bolumlu('writing', 'write-tab', ['Taslaklar', 'Ölçüm', 'Araçlar', 'Öğren'])).remove();
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
