/* SİLME, PROFİL VE OTURUM — modelin hiç sınanmamış yarısı.

   ------------------------------------------------------------------
   NEDEN BU DOSYA VAR

   `node tools/kapsam.js ESP --ayrinti` şunu yazdı:

       state.js  %66  66/100
         koşmayan: addProfile, removeProfile, switchProfile, normDay,
                   updateSession, deleteSession, recentDays, deleteCard,
                   deleteArgument, unlinkNotes, saveBook, deleteBook …

   On üç **silme** işlevinin neredeyse hiçbiri koşmuyordu. Silme bu
   sistemde geri alınamayan tek işlemdir: yanlış yazılan bir kayıt
   düzeltilir, silinen kayıt gitmiştir.

   Kopyala-yapıştırla çoğalmış on üç kardeş işlev var ve hepsi aynı iki
   adımı atmak zorunda:

       1. bellekteki diziden çıkar          (ekran hemen doğru görünsün)
       2. DEPODAN da sil                    (sayfa yenilenince dönmesin)

   İkinci adımın unutulması sessiz bir hatadır: ekran doğru görünür,
   kayıt ertesi gün geri gelir. Bu paket on üçünü de **aynı tabloyla**
   sınar; on dördüncü aile eklendiğinde tabloya bir satır eklenir.

   ------------------------------------------------------------------
   ZİNCİRLEME SİLME

   Üç silme başkasına dokunur ve dokunması gerekir:

     not      → ona giden bağlar kalkar (olmayan düğüme ok çizilmesin)
     kaynak   → olayların `sourceIds`'inden ve zincirin halkasından düşer
     olay     → o olaya bağlı zincirler de silinir

   Bunlar bir ek özellik değil, veri bütünlüğüdür: yarısı silinen bir
   ilişki, silinmemiş sayılır. */

(function(){
  const { describe, it, expect, resetState } = ESP.Test;
  const M = ESP.Model, S = ESP.S, U = ESP.U;

  /* Depoda gerçekten kaldı mı? Sahte depo `_data`'yı açıyor; gerçek
     deponun yüzeyinde böyle bir şey yok ve olmamalı — bu yüzden sorgu
     testin içinde, modelin içinde değil. */
  function depoda(yol){ return Object.keys(ESP.Store._data || {}).indexOf(yol) >= 0; }

  /* Profil listesi UYGULAMA VERISINDEN AYRI durur: `esp.profiles`
     dogrudan localStorage'dadir, sahte depoya girmez. Bu dogrudur —
     hangi profillerin oldugu bir profilin ICINDE tutulamaz. Ama testin
     gercek listeyi kirletmemesi gerekir. Geri koyan islevi doner. */
  const PLISTE = 'esp.profiles';
  function profilListesiniKoru(){
    let onceki = null;
    try{ onceki = localStorage.getItem(PLISTE); }catch(e){}
    try{ localStorage.removeItem(PLISTE); }catch(e){}
    return function geri(){
      try{
        if(onceki == null) localStorage.removeItem(PLISTE);
        else localStorage.setItem(PLISTE, onceki);
      }catch(e){}
    };
  }

  /* ---------------------------------------------------------------- */

  /* On üç aile, tek tablo. `kur` bir kayıt yaratıp KİMLİĞİNİ döner. */
  const AILELER = [
    { ad:'kart', alan:'cards', kok:'cards',
      kur:async () => (await M.saveCard(M.newCard({ front:'apple', back:'elma', lang:'en' }))).id,
      sil:id => M.deleteCard(id) },

    { ad:'tez', alan:'args', kok:'args',
      kur:async () => (await M.saveArgument(M.newArgument({ thesis:'Bir tez' }))).id,
      sil:id => M.deleteArgument(id) },

    { ad:'not', alan:'notes', kok:'notes',
      kur:async () => (await M.saveNote(M.newNote({ text:'Tek fikir.' }))).id,
      sil:id => M.deleteNote(id) },

    { ad:'kitap', alan:'books', kok:'books',
      kur:async () => (await M.saveBook(M.newBook({ title:'Kitap' }))).id,
      sil:id => M.deleteBook(id) },

    { ad:'parça', alan:'pieces', kok:'pieces',
      kur:async () => (await M.savePiece(M.newPiece({ title:'Etüt' }))).id,
      sil:id => M.deletePiece(id) },

    { ad:'kayıt', alan:'recordings', kok:'recordings',
      kur:async () => (await M.saveRecording(M.newRecording({ title:'Okuma' }))).id,
      sil:id => M.deleteRecording(id) },

    { ad:'taslak', alan:'drafts', kok:'drafts',
      kur:async () => (await M.saveDraft(M.newDraft({ title:'Deneme' }))).id,
      sil:id => M.deleteDraft(id) },

    { ad:'hedef', alan:'goals', kok:'goals',
      kur:async () => (await M.saveGoal(M.newGoal({ title:'Hedef' }))).id,
      sil:id => M.deleteGoal(id) },

    { ad:'ek', alan:'assets', kok:'assets',
      kur:async () => (await M.saveAsset(M.newAsset({ kind:'note', title:'Ek', text:'Metin' }))).asset.id,
      sil:id => M.deleteAsset(id) },

    { ad:'hatırlatma', alan:'reminders', kok:'reminders',
      kur:async () => (await M.saveReminder(M.newReminder({ text:'Hatırlat' }))).reminder.id,
      sil:id => M.deleteReminder(id) },

    { ad:'olay', alan:'events', kok:'events',
      kur:async () => (await M.saveEvent(M.newEvent({ title:'Olay', year:1789 }))).event.id,
      sil:id => M.deleteEvent(id) },

    { ad:'kaynak', alan:'sources', kok:'sources',
      kur:async () => (await M.saveSource(M.newSource({ title:'Kaynak' }))).source.id,
      sil:id => M.deleteSource(id) },

    { ad:'zincir', alan:'chains', kok:'chains',
      kur:async () => {
        const o = await M.saveEvent(M.newEvent({ title:'Bağlam', year:1800 }));
        return (await M.saveChain(M.newChain({ eventId:o.event.id, question:'Neden?' }))).chain.id;
      },
      sil:id => M.deleteChain(id) },
  ];

describe('Silme — iki adımın ikisi de atılır', () => {

  AILELER.forEach(a => {
    it(a.ad + ': silinen kayıt HEM bellekten HEM depodan kalkar', async () => {
      resetState();
      const id = await a.kur();
      expect(id).toBeTruthy();
      expect(S[a.alan].some(x => x.id === id)).toBe(true);
      expect(depoda(a.kok + '/' + id)).toBe(true);

      await a.sil(id);

      expect(S[a.alan].some(x => x.id === id)).toBe(false);
      /* Bu satır bu paketin var olma sebebi: unutulursa ekran doğru
         görünür, kayıt sayfa yenilenince geri gelir. */
      expect(depoda(a.kok + '/' + id)).toBe(false);
    });
  });

  it('silme KOMŞUSUNU götürmez', async () => {
    resetState();
    const bir = await AILELER[0].kur();
    const iki = await AILELER[0].kur();
    await AILELER[0].sil(bir);
    expect(S.cards.some(x => x.id === iki)).toBe(true);
    expect(depoda('cards/' + iki)).toBe(true);
  });

  it('olmayan kimliği silmek çökmez', async () => {
    resetState();
    for(const a of AILELER){ await a.sil('yok-boyle-bir-kimlik'); }
    expect(S.cards).toHaveLength(0);
  });

  it('on üç aile sayılır — on dördüncüsü tabloya eklenmeli', () => {
    /* Bu test bir hatırlatıcıdır: yeni bir aile eklenip tabloya
       yazılmazsa onun silmesi yine sınanmamış olur. */
    expect(AILELER.length).toBe(13);
  });
});

describe('Silme — zincirleme', () => {

  it('silinen nota giden BAĞLAR da kalkar', async () => {
    resetState();
    const a = await M.saveNote(M.newNote({ text:'A' }));
    const b = await M.saveNote(M.newNote({ text:'B' }));
    await M.linkNotes(a.id, b.id, 'aynı kavram');
    expect(S.notes.find(n => n.id === b.id).links.some(l => l.to === a.id)).toBe(true);

    await M.deleteNote(a.id);
    const kalan = S.notes.find(n => n.id === b.id);
    expect(kalan.links.some(l => l.to === a.id)).toBe(false);
    /* Bellekteki düzeltme depoya da yazılmalı; yoksa bağ yenilemede döner. */
    expect(ESP.Store._data['notes/' + b.id].links).toHaveLength(0);
  });

  it('bağ ÇİFT YÖNLÜ kurulur, çift yönlü kalkar', async () => {
    resetState();
    const a = await M.saveNote(M.newNote({ text:'A' }));
    const b = await M.saveNote(M.newNote({ text:'B' }));
    await M.linkNotes(a.id, b.id, 'kavram');
    expect(S.notes.find(n => n.id === a.id).links.some(l => l.to === b.id)).toBe(true);
    expect(S.notes.find(n => n.id === b.id).links.some(l => l.to === a.id)).toBe(true);

    await M.unlinkNotes(a.id, b.id);
    expect(S.notes.find(n => n.id === a.id).links).toHaveLength(0);
    expect(S.notes.find(n => n.id === b.id).links).toHaveLength(0);
  });

  it('silinen kaynak olayın kaynak listesinden ve zincirden düşer', async () => {
    resetState();
    const k = (await M.saveSource(M.newSource({ title:'Kaynak' }))).source;
    const o = (await M.saveEvent(M.newEvent({ title:'Olay', year:1453,
      sourceIds:[k.id] }))).event;
    const z = (await M.saveChain(M.newChain({ eventId:o.id, question:'Neden?',
      links:[{ id:'l1', kind:'cause', text:'sebep', sourceId:k.id }] }))).chain;

    await M.deleteSource(k.id);

    expect(S.events.find(e => e.id === o.id).sourceIds).toHaveLength(0);
    expect(S.chains.find(c => c.id === z.id).links[0].sourceId).toBeNull();
    /* Halkanın kendisi DURMALI: kaynağı gitti diye sebep yok olmaz. */
    expect(S.chains.find(c => c.id === z.id).links).toHaveLength(1);
  });

  it('silinen olayın zincirleri de silinir', async () => {
    resetState();
    const o = (await M.saveEvent(M.newEvent({ title:'Olay', year:1789 }))).event;
    const z = (await M.saveChain(M.newChain({ eventId:o.id, question:'Neden?' }))).chain;

    await M.deleteEvent(o.id);

    expect(S.chains.some(c => c.id === z.id)).toBe(false);
    expect(depoda('chains/' + z.id)).toBe(false);
  });
});

describe('Profil — adın kendisi kimliktir', () => {

  /* Gerçek profil listesi kirletilmez: her test öncesi saklanır,
     sonrasında aynen geri konur (yardımcı dosyanın başında). */
  function koru(fn){
    const geri = profilListesiniKoru();
    try{ return fn(); }finally{ geri(); }
  }

  it('boş ad profil olmaz', () => {
    resetState();
    koru(() => {
      expect(M.addProfile('').ok).toBe(false);
      expect(M.addProfile('   ').ok).toBe(false);
      expect(M.profileList()).toHaveLength(0);
    });
  });

  it('ad kimliğe çevrilir — Türkçe harfler sadeleşir', () => {
    resetState();
    koru(() => {
      const r = M.addProfile('Ömer Faruk');
      expect(r.ok).toBe(true);
      expect(r.id).toBe('omer-faruk');
      /* Ekranda görünen ad KORUNUR; kimlik yalnızca depo anahtarıdır. */
      expect(M.profileList().find(p => p.id === r.id).name).toBe('Ömer Faruk');
    });
  });

  it('hiçbir harfi kalmayan ad da kimliksiz kalmaz', () => {
    /* «...» ya da bir emoji kimliğe çevrilemez; boş bir anahtar
       üretmek iki profili aynı yere yazardı. */
    resetState();
    koru(() => {
      const r = M.addProfile('•••');
      expect(r.ok).toBe(true);
      expect(r.id.length > 0).toBe(true);
    });
  });

  it('aynı adla ikinci profil açılmaz', () => {
    resetState();
    koru(() => {
      expect(M.addProfile('Deneme').ok).toBe(true);
      const iki = M.addProfile('deneme');
      expect(iki.ok).toBe(false);
      expect(iki.error.length > 0).toBe(true);
      expect(M.profileList().filter(p => p.id === 'deneme')).toHaveLength(1);
    });
  });

  it('AÇIK OLAN profil silinemez', () => {
    /* Silinseydi uygulama kendi verisini okuyamayan bir durumda açılırdı. */
    resetState();
    koru(() => {
      expect(M.removeProfile(M.activeProfileId()).ok).toBe(false);
    });
  });

  it('başka bir profil silinince listeden düşer', () => {
    resetState();
    koru(() => {
      const r = M.addProfile('Silinecek');
      expect(M.removeProfile(r.id).ok).toBe(true);
      expect(M.profileList().some(p => p.id === r.id)).toBe(false);
    });
  });
});

describe('Oturum — güncelleme ve silme', () => {

  it('olmayan oturumu güncellemek NULL döner, yeni kayıt uydurmaz', async () => {
    resetState();
    M.ensureDay('2026-03-04');
    expect(await M.updateSession('2026-03-04', 'yok', { minutes:10 })).toBeNull();
    expect(S.days['2026-03-04'].sessions).toHaveLength(0);
  });

  it('güncellenen dakika ÖLÇÜM etiketiyle gelir', async () => {
    resetState();
    const o = await M.addSession('2026-03-04', { disc:'lang', minutes:30 });
    const y = await M.updateSession('2026-03-04', o.id, { minutes:45 });
    expect(y.minutes).toBe(45);
    expect(y.minutesCert).toBe('measured');
  });

  it('boşaltılan dakika SIFIR değil «veri yok» olur', async () => {
    /* AGENTS.md §1.2. Kullanıcı alanı sildiğinde sistem 0 dakika
       çalışıldığını sanmamalı. */
    resetState();
    const o = await M.addSession('2026-03-04', { disc:'lang', minutes:30 });
    const y = await M.updateSession('2026-03-04', o.id, { minutes:'' });
    expect(y.minutes).toBeNull();
    expect(y.minutesCert).toBe('missing');
  });

  it('silinen oturum günden kalkar, gün kalır', async () => {
    resetState();
    const a = await M.addSession('2026-03-04', { disc:'lang', minutes:30 });
    const b = await M.addSession('2026-03-04', { disc:'music', minutes:20 });
    await M.deleteSession('2026-03-04', a.id);
    expect(S.days['2026-03-04'].sessions).toHaveLength(1);
    expect(S.days['2026-03-04'].sessions[0].id).toBe(b.id);
  });

  it('son oturum da silinince gün DOKUNULMAMIŞ sayılır', async () => {
    /* `dayHasEntry` "bu güne hiç dokunuldu mu" sorusudur; boş bir gün
       kaydı «çalışılmadı» demek değildir — «girilmedi» demektir. */
    resetState();
    const a = await M.addSession('2026-03-04', { disc:'lang', minutes:30 });
    await M.deleteSession('2026-03-04', a.id);
    expect(M.dayHasEntry(S.days['2026-03-04'])).toBe(false);
  });
});

describe('Gün listesi — girilmemiş gün dizide YOKTUR', () => {

  it('recentDays yalnızca oturumu olan günleri döner', async () => {
    resetState();
    const bugun = U.todayISO();
    const dun = U.iso(U.addDays(U.parse(bugun), -1));
    await M.addSession(dun, { disc:'lang', minutes:20 });
    M.ensureDay(bugun);                       // açıldı ama girilmedi
    const g = M.recentDays(7);
    expect(g.some(d => d.date === dun)).toBe(true);
    expect(g.some(d => d.date === bugun)).toBe(false);
  });

  it('hiç gün yoksa boş dizi döner — null değil', () => {
    resetState();
    expect(M.recentDays(30)).toEqual([]);
  });
});

describe('Bozuk belge — depodan gelen gün sessizce hayatta kalmaz', () => {

  /* `normDay` disari acilmaz ve acilmamali: bir testin API'yi
     genisletmesi, testi kodun sahibi yapardi. Bozuk belge zaten
     GERCEK KAPIDAN girer — `loadAll()` depoyu okurken. Test de oradan
     giriyor. */
  async function yukle(anahtar, ham){
    resetState();
    const geri = profilListesiniKoru();
    try{
      await ESP.Store.set('days/' + anahtar, ham);
      await M.loadAll();
    }finally{ geri(); }
  }

  it('dizi olmayan `sessions` boş diziye düşer', async () => {
    await yukle('2026-03-04', { date:'2026-03-04', sessions:'bozuk' });
    const d = S.days['2026-03-04'];
    expect(d).toBeTruthy();
    expect(d.sessions).toEqual([]);
    expect(d.note).toBe('');
  });

  it('eksik alanlar uydurulmaz, null kalır', async () => {
    await yukle('2026-03-04', { date:'2026-03-04' });
    expect(S.days['2026-03-04'].updatedAt).toBeNull();
  });

  it('TARİHİ olmayan gün kayda hiç girmez', async () => {
    /* Anahtarsız bir gün takvimin neresine düşeceğini bilmez;
       girseydi «bugün» ile karışırdı. */
    await yukle('bozuk', { sessions:[] });
    expect(Object.keys(S.days)).toHaveLength(0);
  });

  it('yüklenen gün DOKUNULMUŞ sayılmaz — boş kayıt girdi değildir', async () => {
    await yukle('2026-03-04', { date:'2026-03-04', sessions:[] });
    expect(M.dayHasEntry(S.days['2026-03-04'])).toBe(false);
  });
});

})();
