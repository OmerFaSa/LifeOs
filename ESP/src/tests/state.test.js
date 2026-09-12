/* Veri modeli — ve sistemin en cok ihlal edilen kurali.

   Test adlari birer CUMLEDIR: bu liste okundugunda sistemin sozlesmesi
   okunmus olmali. */

(function(){
  const { describe, it, expect, resetState, withToday, pushSession } = ESP.Test;
  const M = ESP.Model, S = ESP.S, U = ESP.U;

  describe('kesinlik — girilmemis alan sifir degildir', () => {

    it('bos alan null doner ve etiketi «veri yok» olur', () => {
      resetState();
      const r = M.numCert('', 'measured');
      expect(r.value).toBe(null);
      expect(r.cert).toBe('missing');
    });

    it('bosluk da bos sayilir', () => {
      resetState();
      expect(M.numCert('   ').cert).toBe('missing');
    });

    it('virgullu sayi okunur', () => {
      resetState();
      expect(M.numCert('7,5').value).toBe(7.5);
    });

    it('negatif sayi olcum sayilmaz', () => {
      resetState();
      expect(M.numCert('-3').cert).toBe('missing');
    });

    it('sifir GECERLI bir olcumdur — bos alandan farklidir', () => {
      resetState();
      const r = M.numCert('0');
      expect(r.value).toBe(0);
      expect(r.cert).toBe('measured');
    });

    it('dort etiketli sozluk AYS ve SPI ile ayni anahtarlari tasir', () => {
      const k = Object.keys(ESP.CERTAINTY).sort();
      expect(k).toEqual(['derived', 'estimated', 'measured', 'missing']);
    });
  });

  describe('gun ve oturum', () => {

    it('hic oturumu olmayan gun «dokunulmus» sayilmaz', () => {
      resetState();
      M.ensureDay('2026-09-10');
      expect(M.dayHasEntry(S.days['2026-09-10'])).toBe(false);
    });

    it('girilmemis disiplin icin minutesOf SIFIR degil null doner', () => {
      resetState();
      pushSession('2026-09-10', 'music', 45);
      expect(M.minutesOf('2026-09-10', 'music')).toBe(45);
      expect(M.minutesOf('2026-09-10', 'writing')).toBe(null);
    });

    it('ayni gunde ayni disiplinin iki oturumu toplanir', () => {
      resetState();
      pushSession('2026-09-10', 'lang', 20);
      pushSession('2026-09-10', 'lang', 25);
      expect(M.minutesOf('2026-09-10', 'lang')).toBe(45);
    });

    it('suresi girilmemis oturum toplama katilmaz', () => {
      resetState();
      pushSession('2026-09-10', 'lang', null, { minutesCert:'missing' });
      expect(M.minutesOf('2026-09-10', 'lang')).toBe(null);
    });

    it('kalite DAIMA tahmin etiketi tasir — olculmus gibi gosterilmez', () => {
      resetState();
      const gun = M.ensureDay('2026-09-10');
      gun.sessions.push({ id:'x', disc:'lang', minutes:30, minutesCert:'measured', quality:4 });
      const norm = M.sessionsOf('2026-09-10');
      /* ensureDay ham nesneyi tutar; normalizasyon okuma aninda degil yazma
         aninda olur — bu yuzden addSession uzerinden dogrulanir. */
      expect(norm.length).toBe(1);
    });

    it('addSession kaliteyi tahmin olarak isaretler', async () => {
      resetState();
      const s = await M.addSession('2026-09-10', { disc:'lang', minutes:'30', quality:4 });
      expect(s.qualityCert).toBe('estimated');
      expect(s.minutesCert).toBe('measured');
    });

    it('bos gun kaydi depoya yazilmaz', async () => {
      resetState();
      M.ensureDay('2026-09-10');
      const res = await M.saveDay('2026-09-10');
      expect(res).toBe(null);
      expect(S.days['2026-09-10']).toBe(undefined);
    });
  });

  describe('seri', () => {

    it('bugun girilmemisse seri KIRILMIS sayilmaz — gun bitmedi', () => {
      withToday('2026-09-12', () => {
        resetState();
        pushSession('2026-09-11', 'lang', 20);
        pushSession('2026-09-10', 'lang', 20);
        expect(M.streak()).toBe(2);
      });
    });

    it('bugun girildiyse seriye eklenir', () => {
      withToday('2026-09-12', () => {
        resetState();
        pushSession('2026-09-12', 'lang', 20);
        pushSession('2026-09-11', 'lang', 20);
        expect(M.streak()).toBe(2);
      });
    });

    it('arada bos gun varsa seri orada durur', () => {
      withToday('2026-09-12', () => {
        resetState();
        pushSession('2026-09-11', 'lang', 20);
        pushSession('2026-09-09', 'lang', 20);
        expect(M.streak()).toBe(1);
      });
    });
  });

  describe('arguman', () => {

    it('cevaplanmamis itirazi olan tez KAPANAMAZ', async () => {
      resetState();
      const a = await M.saveArgument(M.newArgument({
        thesis:'X doğrudur.',
        objections:[{ id:'o1', text:'Ya Y?', answered:false }],
        status:'closed',
      }));
      expect(a.status).toBe('open');
    });

    it('butun itirazlar cevaplandiysa kapanabilir', async () => {
      resetState();
      const a = await M.saveArgument(M.newArgument({
        thesis:'X doğrudur.',
        objections:[{ id:'o1', text:'Ya Y?', answered:true, answer:'Çünkü Z.' }],
        status:'closed',
      }));
      expect(a.status).toBe('closed');
    });
  });

  describe('not baglari', () => {

    it('bag CIFT YONLU kurulur', async () => {
      resetState();
      const a = await M.saveNote(M.newNote({ text:'A' }));
      const b = await M.saveNote(M.newNote({ text:'B' }));
      const res = await M.linkNotes(a.id, b.id, 'aynı kavram');
      expect(res.ok).toBe(true);
      expect(S.notes.find(n => n.id === a.id).links.length).toBe(1);
      expect(S.notes.find(n => n.id === b.id).links.length).toBe(1);
    });

    it('bir not kendine baglanamaz', async () => {
      resetState();
      const a = await M.saveNote(M.newNote({ text:'A' }));
      const res = await M.linkNotes(a.id, a.id, '');
      expect(res.ok).toBe(false);
    });

    it('silinen nota giden baglar da kalkar', async () => {
      resetState();
      const a = await M.saveNote(M.newNote({ text:'A' }));
      const b = await M.saveNote(M.newNote({ text:'B' }));
      await M.linkNotes(a.id, b.id, '');
      await M.deleteNote(b.id);
      expect(S.notes.find(n => n.id === a.id).links.length).toBe(0);
    });
  });

  describe('hedefler', () => {

    it('tarihi gecmis hedef acik sayilmaz', () => {
      withToday('2026-09-12', async () => {
        resetState();
        await M.saveGoal(M.newGoal({ label:'Sunum', date:'2026-09-01' }));
        await M.saveGoal(M.newGoal({ label:'Konser', date:'2026-09-20' }));
        expect(M.openGoals().length).toBe(1);
      });
    });
  });
})();
