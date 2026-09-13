/* Tezgâh — ekler, hatırlatıcılar ve koçun ne görüp ne görmediği. */

(function(){
  const { describe, it, expect, resetState, withToday, withTodayAsync,
    pushAsset, pushReminder, pushCard } = ESP.Test;
  const M = () => ESP.Model;

  describe('tezgah · ekler', () => {

    it('bos baslik ve bos metin birlikte reddedilir', async () => {
      resetState();
      const res = await M().saveAsset(M().newAsset({ disc:'lang' }));
      expect(res.ok).toBeFalsy();
    });

    it('baslik yoksa metinden turetilir', async () => {
      resetState();
      const res = await M().saveAsset(M().newAsset({ disc:'lang',
        text:'Koşul cümlesinde zaman kayması' }));
      expect(res.ok).toBeTruthy();
      expect(res.asset.title.length > 0).toBeTruthy();
    });

    it('adressiz baglanti kaydedilmez', async () => {
      resetState();
      const res = await M().saveAsset(M().newAsset({ disc:'lang', kind:'link',
        title:'kaynak' }));
      expect(res.ok).toBeFalsy();
    });

    it('bilinmeyen tur nota duser', async () => {
      resetState();
      const res = await M().saveAsset(M().newAsset({ disc:'lang', kind:'video',
        title:'x' }));
      expect(res.asset.kind).toBe('note');
    });

    /* Ham ses TUTULMAZ: olculen sure kalir, dosya kalmaz. */
    it('ses eki yalnizca sure tasir', async () => {
      resetState();
      const res = await M().saveAsset(M().newAsset({ disc:'diction', kind:'audio',
        title:'tekerleme denemesi', seconds:42 }));
      expect(res.asset.seconds).toBe(42);
      expect(res.asset.dataUrl).toBeUndefined();
    });

    it('gecersiz sure sifir degil yoktur', async () => {
      resetState();
      const res = await M().saveAsset(M().newAsset({ disc:'diction', kind:'audio',
        title:'x', seconds:-3 }));
      expect(res.asset.seconds).toBeNull();
    });

    it('ekler bolume gore suzulur', () => {
      resetState();
      pushAsset('lang', 'note', { title:'a' });
      pushAsset('music', 'note', { title:'b' });
      expect(ESP.Desk.assets('lang').length).toBe(1);
      expect(ESP.Desk.assets().length).toBe(2);
    });
  });

  describe('tezgah · kocun gordugu', () => {

    it('ek yokken ozet «veri yok»tur, sifir degil', () => {
      resetState();
      expect(ESP.Desk.assetSummary('lang').cert).toBe('missing');
    });

    /* En onemli test: ICERIK BRIFINGE GIRMEZ. */
    it('ekin metni brifinge girmez, basligi girer', () => {
      resetState();
      pushAsset('lang', 'note', { title:'Hata günlüğü',
        text:'GİZLİ METİN — bu cümle modele gitmemeli' });
      const b = ESP.Office.brief('polyglot');
      const json = JSON.stringify(b);
      expect(json.indexOf('GİZLİ METİN')).toBe(-1);
      expect(json.indexOf('Hata günlüğü') > 0).toBeTruthy();
    });

    it('ses ekinin suresi brifinge olculmus sayi olarak girer', () => {
      resetState();
      pushAsset('diction', 'audio', { title:'kayıt', seconds:30 });
      pushAsset('diction', 'audio', { title:'kayıt 2', seconds:45 });
      const b = ESP.Office.brief('demosthenes');
      expect(b.desk.assets.audioSeconds).toBe(75);
    });

    it('her disiplin masasinin brifinginde tezgah eki vardir', () => {
      resetState();
      ESP.DISCIPLINES.forEach(d => {
        const b = ESP.Office.brief(d.agent);
        expect(b.desk != null).toBeTruthy();
      });
    });

    it('Patron ve koc masasi disiplin eki tasimaz', () => {
      resetState();
      expect(ESP.Office.brief('patron').desk).toBeUndefined();
      expect(ESP.Office.brief('mnemosyne').desk).toBeUndefined();
    });

    it('kural motorunun cumlesi ekleri sayiyla anar', () => {
      resetState();
      pushCard({ front:'a', back:'b' });
      pushAsset('lang', 'note', { title:'not' });
      const t = ESP.Office.ruleText('polyglot');
      expect(t.indexOf('1 ek') > 0).toBeTruthy();
    });
  });

  describe('tezgah · hatirlatma', () => {

    it('bos metin reddedilir', async () => {
      resetState();
      expect((await M().saveReminder(M().newReminder({ disc:'lang' }))).ok).toBeFalsy();
    });

    it('vadesi gelen hatirlatici bugun listesine duser', () => {
      resetState();
      withToday('2026-09-12', () => {
        pushReminder('lang', 'kartları kapat', { due:'2026-09-10' });
        pushReminder('lang', 'ileride', { due:'2026-09-20' });
        expect(M().dueReminders('lang').length).toBe(1);
      });
    });

    it('tekrarsiz hatirlatici kapanir', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        const r = pushReminder('lang', 'tek seferlik', { due:'2026-09-12' });
        await M().completeReminder(r.id);
        expect(ESP.S.reminders[0].done).toBeTruthy();
      });
    });

    /* Silmek zinciri silmek olurdu: tekrarli olan tasinir. */
    it('tekrarli hatirlatici silinmez, tasinir', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        const r = pushReminder('lang', 'her gün', { due:'2026-09-12', repeat:'daily' });
        await M().completeReminder(r.id);
        expect(ESP.S.reminders[0].done).toBeFalsy();
        expect(ESP.S.reminders[0].due).toBe('2026-09-13');
      });
    });

    /* Iki hafta geciken gunluk bir hatirlatici on dort kez ust uste dusmemeli. */
    it('bir sonraki tarih BUGUNDEN sayilir, eski vadeden degil', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        const r = pushReminder('lang', 'her gün', { due:'2026-08-29', repeat:'daily' });
        await M().completeReminder(r.id);
        expect(ESP.S.reminders[0].due).toBe('2026-09-13');
      });
    });

    it('haftalik tekrar yedi gun sonraya duser', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        const r = pushReminder('music', 'repertuar bakımı', { due:'2026-09-12',
          repeat:'weekly' });
        await M().completeReminder(r.id);
        expect(ESP.S.reminders[0].due).toBe('2026-09-19');
      });
    });

    it('hatirlaticilar brifingde sayiyla gorunur, metniyle degil', () => {
      resetState();
      withToday('2026-09-12', () => {
        pushReminder('writing', 'ikinci taslağı oku', { due:'2026-09-12' });
        const b = ESP.Office.brief('montaigne');
        expect(b.desk.reminders.due).toBe(1);
      });
    });
  });

  describe('tezgah · sohbet', () => {

    it('bolum sohbeti ile Danisma ekrani AYNI kaydi kullanir', async () => {
      resetState();
      await ESP.Desk.ask('lang', 'retansiyon ne durumda?');
      expect(ESP.S.officeChats.polyglot.length).toBe(2);
      expect(ESP.Desk.messages('lang').length).toBe(2);
    });

    it('son cevap ajanin cumlesidir, kullanicinin degil', async () => {
      resetState();
      await ESP.Desk.ask('lang', 'soru');
      expect(ESP.Desk.lastAnswer('lang').role).toBe('agent');
    });

    it('her disiplinin masasi kendi ajanidir', () => {
      resetState();
      expect(ESP.Desk.agentOf('music').id).toBe('maestro');
      expect(ESP.Desk.agentOf('diction').id).toBe('demosthenes');
      expect(ESP.Desk.agentOf('history').id).toBe('herodot');
    });
  });

  describe('tezgah · durum', () => {

    it('tezgah varsayilan olarak aciktir', () => {
      resetState();
      expect(ESP.Desk.isOpen('lang')).toBeTruthy();
    });

    it('kapatma hatirlanir ve bolume ozeldir', () => {
      resetState();
      ESP.Desk.toggle('lang');
      expect(ESP.Desk.isOpen('lang')).toBeFalsy();
      expect(ESP.Desk.isOpen('music')).toBeTruthy();
    });

    it('sekme secimi bolume ozeldir', () => {
      resetState();
      ESP.Desk.setTab('lang', 'ekler');
      expect(ESP.Desk.tab('lang')).toBe('ekler');
      expect(ESP.Desk.tab('music')).toBe('kocla');
    });
  });
})();
