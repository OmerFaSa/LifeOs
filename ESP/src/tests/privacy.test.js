/* Mahremiyet — modele NE GİTMEZ.

   ESP.PRIVACY tek cümleyle söylüyordu: ajana yalnızca ÖZET brifing gider;
   ham ses, tam metin ve günlük notu gitmez. Bu dosya o cümleyi bir teste
   çevirir.

   Yöntem: her serbest metin alanına benzersiz bir dize yazılır, sonra
   bütün masaların brifingi ve sistem istemi taranır. Dize görünüyorsa
   sızıntı vardır — hangi alandan geldiği de adıyla bellidir. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync,
    pushNote, pushBook, pushCard, pushAsset, pushReminder, pushEvent,
    pushArgument, pushSource } = ESP.Test;

  /* Her alan için ayrı bir işaret: sızıntı çıkarsa kaynağı tek bakışta
     görünsün. */
  const GIZLI = {
    note:'GIZLI_NOT_METNI',
    draft:'GIZLI_TASLAK_METNI',
    thesis:'GIZLI_TEZ_METNI',
    asset:'GIZLI_EK_METNI',
    reminder:'GIZLI_HATIRLATMA',
    dayNote:'GIZLI_GUN_NOTU',
    sourceAnswer:'GIZLI_KAYNAK_CEVABI',
    eventWhy:'GIZLI_OLAY_GEREKCESI',
    chat:'GIZLI_SOHBET_SORUSU',
    profileName:'GIZLI_KULLANICI_ADI',
  };

  async function doldur(){
    ESP.S.profile.name = GIZLI.profileName;

    pushNote(GIZLI.note, null, ['zaman']);
    pushBook('Kitap', 'Yazar');
    pushCard({ front:'kelime', back:'karşılık', lang:'en' });
    pushArgument(GIZLI.thesis, ['bir itiraz']);
    pushAsset('lang', 'note', { title:'başlık', text:GIZLI.asset });
    pushReminder('lang', GIZLI.reminder, { due:'2026-09-12' });

    const e = pushEvent(1453, 'Fetih', { why:GIZLI.eventWhy });
    const k = pushSource('Kaynak', 'primary');
    k.answers = { kim:GIZLI.sourceAnswer };

    ESP.S.drafts.push(ESP.Model.newDraft({ title:'Taslak', text:GIZLI.draft }));

    const g = ESP.Model.ensureDay('2026-09-12');
    g.note = GIZLI.dayNote;
    g.sessions.push({ id:'s1', disc:'lang', minutes:30, minutesCert:'measured',
      count:null, countCert:'missing', quality:null, qualityCert:'missing',
      ref:null, note:GIZLI.dayNote, at:new Date().toISOString() });

    ESP.S.officeChats.polyglot = [{ role:'user', text:GIZLI.chat,
      at:new Date().toISOString() }];
  }

  function sizinti(metin){
    return Object.keys(GIZLI).filter(k => metin.indexOf(GIZLI[k]) >= 0);
  }

  describe('mahremiyet · brifing', () => {

    it('hicbir masanin brifinginde serbest metin yok', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        await doldur();
        const bulundu = [];
        ESP.AGENTS.forEach(a => {
          ESP.Memo.bitir();
          const b = JSON.stringify(ESP.Office.brief(a.id));
          sizinti(b).forEach(k => bulundu.push(a.id + ':' + k));
        });
        expect(bulundu.join(', ')).toBe('');
      });
    });

    it('sistem isteminde de yok', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        await doldur();
        const bulundu = [];
        ESP.AGENTS.forEach(a => {
          ESP.Memo.bitir();
          const t = ESP.Office.systemPrompt(a.id);
          sizinti(t).forEach(k => bulundu.push(a.id + ':' + k));
        });
        expect(bulundu.join(', ')).toBe('');
      });
    });

    it('kural motorunun cumlesinde de yok', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        await doldur();
        const bulundu = [];
        ESP.AGENTS.forEach(a => {
          ESP.Memo.bitir();
          const t = ESP.Office.ruleText(a.id);
          sizinti(t).forEach(k => bulundu.push(a.id + ':' + k));
        });
        expect(bulundu.join(', ')).toBe('');
      });
    });

    it('gunluk brifing ozetinde de yok', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        await doldur();
        const b = JSON.stringify(ESP.Office.brief('patron'));
        expect(sizinti(b).join(', ')).toBe('');
      });
    });
  });

  describe('mahremiyet · ne GIDER', () => {

    /* Sınır iki taraflıdır: metin gitmezse ajan hiçbir şey söyleyemez.
       Giden şey ÖLÇÜM ve ETİKETTİR — ve gitmesi gerekir. */
    it('olculmus sayilar brifinge girer', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        await doldur();
        const b = ESP.Office.brief('polyglot');
        expect(b.cards.total).toBe(1);
        expect(b.practice.minutes).toBe(30);
      });
    });

    it('ekin BASLIGI gider, METNI gitmez', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        await doldur();
        const b = JSON.stringify(ESP.Office.brief('polyglot'));
        expect(b.indexOf('başlık') > 0).toBeTruthy();
        expect(b.indexOf(GIZLI.asset)).toBe(-1);
      });
    });

    /* Parca adi bir olcum degil bir etikettir ama olmadan "hangi parca
       platoda" cumlesi kurulamaz: gider ve gitmesi kasitlidir. */
    it('parca adi gider — olcumun kendisi anlamsiz kalirdi', () => {
      resetState();
      ESP.S.pieces.push(ESP.Model.newPiece({ name:'Asturias', cleanBpm:90 }));
      const b = JSON.stringify(ESP.Office.brief('maestro'));
      expect(b.indexOf('Asturias') > 0).toBeTruthy();
    });
  });

  describe('mahremiyet · anahtar', () => {

    it('API anahtari uygulama verisinden AYRI anahtarda durur', () => {
      expect(ESP.LLM.KEY_STORE.indexOf('esp.v1.')).toBe(-1);
    });

    it('anahtar yedege girmez', async () => {
      resetState();
      const yedek = JSON.stringify(ESP.Store.exportAll());
      expect(yedek.indexOf(ESP.LLM.KEY_STORE)).toBe(-1);
    });
  });
})();
