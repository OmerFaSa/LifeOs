/* Öğrenme yolu (core/ogrenyolu.js). Kanıtladığı sözler:
     1. Her adım var olan kayıttan okunur; konusuz kart ya da konusuz not
        bu konuya sayılmaz.
     2. «Okudum» beyan olarak etiketlenir; başlanmamış konu öğreniliyora geçer.
     3. Sıradaki adım ilk eksik adımdır; kilit yoktur.
     4. İkinci testin zamanı gelmediyse «bekle» denir; gelince sıradadır.
     5. Yeniden açılan konuda testler yapılmış sayılmaz.
     6. Konu ekranı yolu, sıradaki adımı ve eşikleri gösterir. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = R.Test;
  const Y = () => R.OgrenYolu;
  const BUGUN = '2026-10-09';
  const konu = () => { const s = R.SUBJECTS[0]; return { s, t:s.topics[0] }; };
  const durum = (l, id) => l.find(a => a.id === id);

  describe('Öğrenme yolu', () => {
    it('yeni konu: sıradaki «Öğren»; yanlış kaydı yoksa düzeltme adımı öyle yazılır', async () => {
      await withTodayAsync(BUGUN, async () => {
        resetState();
        const { s, t } = konu();
        const l = Y().adimlar(s.id, t.id);
        expect(l.map(a => a.id)).toEqual(['ogren', 'kartla', 'coz', 'duzelt', 'olc', 'pekistir']);
        expect(l.filter(a => a.tamam).map(a => a.id)).toEqual(['duzelt']);
        expect(durum(l, 'duzelt').ayrinti).toBe('Bu konudan yanlış kaydı yok.');
        expect(durum(l, 'ogren').etiket).toBeNull();
        expect(Y().siradaki(s.id, t.id).id).toBe('ogren');
        expect(Y().ozet(s.id, t.id).tamam).toBe(1);
      });
    });

    it('«Okudum» beyandır; konusuz kart ve not sayılmaz, bu konunun üç kartı sayılır', async () => {
      await withTodayAsync(BUGUN, async () => {
        resetState();
        const { s, t } = konu();
        R.S.videoNotes = [{ id:'n1', subjectId:s.id, topicId:null, segments:[{ ts:10, text:'genel' }] }];
        expect(durum(Y().adimlar(s.id, t.id), 'ogren').tamam).toBe(false);          // konusuz not
        await Y().okundu(s.id, t.id, true);
        let l = Y().adimlar(s.id, t.id);
        expect([durum(l, 'ogren').tamam, durum(l, 'ogren').etiket]).toEqual([true, 'beyan']);
        expect(R.Model.topicState(s.id, t.id).state).toBe('learning');
        R.S.cards = [{ id:'k0', subjectId:s.id, topic:'', front:'konusuz', dueAt:BUGUN }]
          .concat([1, 2].map(i => ({ id:'k' + i, subjectId:s.id, topic:t.name, front:'ön ' + i, dueAt:BUGUN })));
        expect(durum(Y().adimlar(s.id, t.id), 'kartla').ayrinti).toBe('2 / 3 kart');
        R.S.cards.push({ id:'k3', subjectId:s.id, topic:t.name, front:'ön 3', dueAt:BUGUN });
        l = Y().adimlar(s.id, t.id);
        expect(durum(l, 'kartla').tamam).toBe(true);
        expect(Y().siradaki(s.id, t.id).id).toBe('coz');
        /* Ders notu varsa adım ölçülmüştür, beyan değil. */
        R.S.videoNotes.push({ id:'n2', subjectId:s.id, topicId:t.id, segments:[{ ts:5, text:'tanım' }] });
        expect(durum(Y().adimlar(s.id, t.id), 'ogren').etiket).toBe('ölçüldü');
        await Y().okundu(s.id, t.id, false);
        expect(R.Model.topicState(s.id, t.id).okunduAt).toBeNull();
      });
    });

    it('pratik eşiği ve açık yanlış; sıra kilitlenmez', async () => {
      await withTodayAsync(BUGUN, async () => {
        resetState();
        const { s, t } = konu();
        R.S.days[BUGUN] = { date:BUGUN, blocks:[{ subjectId:s.id, topicId:t.id, actualQ:12, correctQ:11 }] };
        let c = durum(Y().adimlar(s.id, t.id), 'coz');
        expect([c.tamam, c.etiket]).toEqual([false, 'hesaplandı']);               // 12 < 20 soru
        R.S.days[BUGUN].blocks.push({ subjectId:s.id, topicId:t.id, actualQ:10, correctQ:4 });
        c = durum(Y().adimlar(s.id, t.id), 'coz');
        expect(c.tamam).toBe(false);                                               // 22 soru ama %68
        R.S.days[BUGUN].blocks[1].correctQ = 6;
        expect(durum(Y().adimlar(s.id, t.id), 'coz').tamam).toBe(true);           // %77
        R.S.errors = [{ id:'e1', subjectId:s.id, topicId:t.id, tag:'K', closedAt:null }];
        expect(durum(Y().adimlar(s.id, t.id), 'duzelt').ayrinti).toBe('1 açık yanlış');
        expect(Y().siradaki(s.id, t.id).id).toBe('ogren');                         // ilk eksik adım
        R.S.errors[0].closedAt = BUGUN + 'T10:00:00Z';
        expect(durum(Y().adimlar(s.id, t.id), 'duzelt').ayrinti).toBe('Açık yanlış kalmadı.');
      });
    });

    it('ilk test geçince ikinci test bekler; zamanı gelince sırada; ikisi geçince yol biter; yeniden açılınca testler yenilenir', async () => {
      await withTodayAsync(BUGUN, async () => {
        resetState();
        const { s, t } = konu();
        R.S.videoNotes = [{ id:'n', subjectId:s.id, topicId:t.id, segments:[{ ts:1, text:'x' }] }];
        R.S.cards = [1, 2, 3].map(i => ({ id:'k' + i, subjectId:s.id, topic:t.name, front:'' + i, dueAt:BUGUN }));
        R.S.days[BUGUN] = { date:BUGUN, blocks:[{ subjectId:s.id, topicId:t.id, actualQ:20, correctQ:16 }] };
        await R.Model.setTopicState(s.id, t.id, { first:80, firstAt:BUGUN });
        let sr = Y().siradaki(s.id, t.id);
        expect([sr.id, sr.bekle]).toEqual(['pekistir', true]);
        expect(sr.ayrinti).toContain('ilk testten 7 gün sonra');
        sr = Y().siradaki(s.id, t.id, '2026-10-16');
        expect([sr.id, sr.bekle]).toEqual(['pekistir', false]);
        await R.Model.setTopicState(s.id, t.id, { second:72, secondAt:'2026-10-16' });
        expect(Y().siradaki(s.id, t.id, '2026-10-16')).toBeNull();
        expect(R.Model.topicState(s.id, t.id).state).toBe('closed');
        await R.Model.setTopicState(s.id, t.id, { state:'reopened' });
        const l = Y().adimlar(s.id, t.id, '2026-10-20');
        expect([durum(l, 'olc').tamam, durum(l, 'pekistir').tamam]).toEqual([false, false]);
        expect(durum(l, 'olc').ayrinti).toContain('yeniden açıldı');
      });
    });

    it('konu ekranı: yol kartı, sıradaki adımın eylemi ve eşikler; «Okudum» işler', async () => {
      await withTodayAsync(BUGUN, async () => {
        resetState();
        const { s, t } = konu();
        R.S.ui.topicSubject = s.id;
        R.S.ui.topicOpen = t.id;
        const html = String(await R.Screens.topic.render());
        expect(html).toContain('Öğrenme yolu');
        expect(html).toContain('Sıradaki adım');
        expect(html).toContain('data-act="yol-okundu"');
        expect(html).toContain('Eşikler planın kuralıdır');
        expect(html).toContain('class="yol__adim is-tamam"');                    // düzeltme adımı
        const eskiRender = R.App.render;
        R.App.render = () => {};
        try{ await R.Screens.topic.handle['yol-okundu'](); }finally{ R.App.render = eskiRender; }
        expect(Y().siradaki(s.id, t.id).id).toBe('kartla');
        expect(String(await R.Screens.topic.render())).toContain('data-act="yol-okundu-geri"');
      });
    });
  });
})();
