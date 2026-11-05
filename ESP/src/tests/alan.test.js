/* Alan sınaması (core/alan.js): felsefe, tarih, okuma, yazı, ses ve dil konuları. */

(function(){
  const { describe, it, expect, resetState, withToday, withTodayAsync } = ESP.Test;
  const A = () => ESP.Alan;
  const ilk = disc => A().konular(disc)[0];

  describe('Alan sınaması', () => {
    const temiz = () => { resetState(); ESP.S.alanKanit = {}; ESP.S.ui.alanSinav = null; };

    it('dil dışındaki her disiplinde sınanabilir konu var', () => {
      temiz();
      ['philo', 'history', 'reading', 'writing', 'music', 'diction', 'lang'].forEach(d => {
        expect(ESP.Lesson.topics(d).filter(t => A().soru(t.id)).length > 0).toBeTruthy();
      });
    });
    it('kartların andığı her kaynak adlandırılmış', () => {
      const eksik = [];
      (ESP.OGRENME_KARTLARI || []).forEach(c => (c.source_ids || []).forEach(i => { if(!A().KAYNAK[i]) eksik.push(i); }));
      expect(eksik.join()).toBe('');
    });
    it('kaydedilmemiş konu veri yok; kanıt aşamayı ilerletir ve kalıcıda soru aktarıma döner', async () => {
      temiz();
      const t = ilk('philo');
      expect(A().asama(t.id).id).toBe('yok');
      expect(A().soru(t.id).aktarim).toBe(false);
      await withTodayAsync('2026-09-01', () => A().kaydet(t.id, true, {}));
      expect(A().asama(t.id).id).toBe('tutuyor');
      const r = await withTodayAsync('2026-09-10', () => A().kaydet(t.id, true, { guven:'emin' }));
      expect(r.asama.id).toBe('kalici');
      const q = A().soru(t.id);
      expect(q.aktarim).toBe(true);
      expect(q.yanit).toBe(null);
      expect(q.olcut.length > 0).toBeTruthy();
    });
    it('güven işaretsizse boş; sonuç depoya yazılır', async () => {
      temiz();
      const t = ilk('history');
      await A().kaydet(t.id, false, { guven:null, karisik:false });
      const x = ESP.S.alanKanit[t.id][0];
      expect(x.guven).toBe(undefined);
      expect(x.karisik).toBe(undefined);
      expect((await ESP.Store.get('meta/alanKanit'))[t.id].length).toBe(1);
    });
    it('bilinmeyen konu kayda girmez', async () => {
      temiz();
      expect((await A().kaydet('yok-boyle-konu', true)).ok).toBe(false);
      expect(Object.keys(ESP.S.alanKanit).length).toBe(0);
    });
    it('sıra disiplinleri karıştırır; emin yanılan konu başa geçer', () => {
      temiz();
      withToday('2026-09-02', () => {
        const t = ilk('writing');
        ESP.S.alanKanit[t.id] = [{ g:'2026-09-01', isabet:false, guven:'emin' }];
        const l = A().sira(4);
        expect(l[0].id).toBe(t.id);
        expect(l[0].kritik).toBe(true);
        expect(l.every((x, i) => !i || x.grup !== l[i - 1].grup)).toBeTruthy();
      });
    });
    it('cevap yazılmadan beklenen yanıt ekranda yok; gösterince kaynak ve karar düğmeleri gelir', () => {
      temiz();
      const t = ilk('philo'), q = A().soru(t.id);
      const ciz = () => { const d = document.createElement('div'); d.innerHTML = String(ESP.Parts.konuSinama(t, false)); return d; };
      expect(ciz().querySelector('[data-act="alan-basla"]')).toBeTruthy();
      ESP.S.ui.alanSinav = { id:t.id, karisik:false, guven:null, yazi:'', goster:false };
      expect(ciz().textContent.indexOf(q.yanit) < 0).toBeTruthy();
      ESP.S.ui.alanSinav.goster = true;
      const d = ciz();
      expect(d.textContent.indexOf(q.yanit) >= 0).toBeTruthy();
      expect(d.querySelectorAll('[data-act="alan-sonuc"]').length).toBe(2);
      expect(d.querySelector('a[rel="noopener"]')).toBeTruthy();
      ESP.S.ui.alanSinav = null;
    });
    it('sınama açıkken anlatım gizlenir, örnek görünür; hiçbir örnek beklenen yanıtı açık etmez', () => {
      temiz();
      const t = ilk('philo'), c = ESP.OGRENME_KARTI_BY_TOPIC[t.id];
      ESP.S.ui.topicOpen = t.id;
      const d = document.createElement('div');
      d.innerHTML = String(ESP.Parts.topics('philo'));
      expect(d.textContent.indexOf(c.explanation) >= 0).toBeTruthy();
      ESP.S.ui.alanSinav = { id:t.id, karisik:false, guven:null, yazi:'', goster:false };
      d.innerHTML = String(ESP.Parts.topics('philo'));
      expect(d.textContent.indexOf(c.explanation) < 0).toBeTruthy();
      expect(d.textContent.indexOf(c.worked_example.text) >= 0).toBeTruthy();
      ESP.S.ui.alanSinav = ESP.S.ui.topicOpen = null;
      const sizan = (ESP.OGRENME_KARTLARI || []).filter(k => k.practice.expected_answer
        && (k.worked_example.text || '').indexOf(k.practice.expected_answer) >= 0);
      expect(sizan.length).toBe(0);
    });
    it('konu listesi hiç sınanmadıysa dağılım çizmez; sınanınca aşama rozeti ve dağılım çıkar', () => {
      temiz();
      const d = document.createElement('div');
      d.innerHTML = String(ESP.Parts.topics('philo'));
      expect(d.querySelector('.pk-yigin')).toBeNull();
      ESP.S.alanKanit[ilk('philo').id] = [{ g:ESP.U.todayISO(), isabet:true }];
      d.innerHTML = String(ESP.Parts.topics('philo'));
      expect(d.querySelector('.pk-yigin')).toBeTruthy();
      expect(d.querySelector('.topic__head').textContent.indexOf('Tutuyor') >= 0).toBeTruthy();
    });
  });
})();
