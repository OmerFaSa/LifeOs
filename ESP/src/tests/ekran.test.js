/* Ekran sözleşmesi (borç 17; SPİ'deki «Ekranlar — sözleşme» paketinin ESP'si,
   NOTLAR §2.2). Önceden test sayfası 15 ekranın hiçbirini yüklemiyordu.
   Kanıtladığı sözler: bütün ekranlar kayıtlı ve sözleşmeyi taşır; gezinmedeki
   her yol bir ekrana gider ve her ekran tam bir bölümdedir; boş durumda hiçbir
   ekran çizerken çökmez. */

(function(){
  const { describe, it, expect, resetState } = ESP.Test;
  const ids = ['today', 'lang', 'symposium', 'history', 'ladder', 'studio', 'library', 'writing',
    'office', 'team', 'meeting', 'analytics', 'profile', 'rutbe', 'guide'];

  describe('Ekranlar — sözleşme', () => {
    it('bütün ekranlar kayıtlı; id, başlık ve render var', () => {
      ids.forEach(id => {
        const sc = ESP.Screens[id];
        expect(!!sc).toBe(true);
        expect(sc.id).toBe(id);
        expect(typeof sc.title).toBe('string');
        expect(typeof sc.render).toBe('function');
      });
    });

    it('gezinmedeki her yol bir ekrana gider; her ekran tam bir bölümde', () => {
      const gorulen = {};
      ESP.Nav.all().forEach(sec => sec.views.forEach(v => {
        expect(!!ESP.Screens[v.route]).toBe(true);
        expect(gorulen[v.route]).toBe(undefined);
        gorulen[v.route] = sec.id;
      }));
      ids.forEach(id => expect(!!gorulen[id]).toBe(true));
    });

    it('boş durumda hiçbir ekran çökmez; her iç sekme de çizilir', async () => {
      resetState();
      for(const id of ids){
        const out = String(await ESP.Screens[id].render());
        expect(out.length > 20).toBe(true);
      }
      /* Disiplin ekranlarının iç sekmeleri (en çok iç içeliğin olduğu yer). */
      const sekme = { lang:['langTab', ['calis', 'kartlar', 'ekle', 'ogren', 'gramer', 'ilerleme']],
        library:['readTab', ['notlar', 'matris', 'kaynaklar', 'yontem', 'ogren']] };
      for(const id of Object.keys(sekme)){
        const [alan, liste] = sekme[id];
        for(const t of liste){
          ESP.S.ui[alan] = t;
          expect(String(await ESP.Screens[id].render()).length > 20).toBe(true);
        }
      }
    });
  });

  /* Kullanıcı kararı (2026-09-24): yıllık tatil sınırı değiştirilebilir.
     «Tatil modu» açılınca sınır ve bu yıl kalan gün görünür. */
  describe('Tatil sınırı alanı', () => {
    it('tatil seçiminde yıllık sınır ve kalan gün görünür', async () => {
      resetState();
      /* Uygulamada state.js kurar; test ortamında kurulmamış olabilir. */
      const kurduk = !ESP.Seri;
      if(kurduk) ESP.Seri = LIFEOS.Seri.kur({ store:() => ESP.Store, bugun:() => ESP.U.todayISO() });
      await ESP.Seri.yukle();
      ESP.S.ui.tatilSec = true;
      const out = String(await ESP.Screens.today.render());
      ESP.S.ui.tatilSec = false;
      if(kurduk) delete ESP.Seri;
      expect(out.indexOf('id="seri-tatil-sinir"') >= 0).toBe(true);
      expect(out.indexOf('data-act="seri-tatil-sinir"') >= 0).toBe(true);
      expect(out.indexOf('Yıllık tatil sınırı') >= 0).toBe(true);
    });
  });
})();
