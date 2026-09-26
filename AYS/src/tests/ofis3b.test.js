/* 3B ofis (js/core/ofis3b.js + ofis3d/sahne.js). Kanitladigi sozler:
   istege baglidir (hafif gorunum, WebGL yok, dosya yok -> CSS odasi);
   otomasyonda kendiliginden acilmaz; olay kuyrugu tekrar etmez, tasmaz,
   kendine teslim etmez; gercek olay (oneri) uzmani Patron'a yurutur;
   sahne yoksa toplanti beklemeden acilir; sahne gercekten yuklenir,
   gorev kabul eder ve mesgulken ikinciyi reddeder. */

(function(){
  const { describe, it, expect, resetState } = R.Test;
  const Z = () => R.Ofis3B;

  function sifirla(){
    resetState();
    R.S.office = null;
    const d = Z()._durum;
    d.kuyruk.length = 0; d.gorulen = {}; d.gun = null; d.istendi = false;
    d.hata = null;
  }

  async function cizmeden(fn){
    const A = R.App, r = A.render, g = A.go;
    A.render = async () => {}; A.go = () => {};
    try{ return await fn(); }finally{ A.render = r; A.go = g; }
  }

  describe('3B ofis — ne zaman açılır', () => {
    /* Test tarayıcısında WebGL yazılımla da olsa VARDIR; yoksa aşağıdaki
       sahne ölçümleri hiçbir şey ölçmez ve bu sessizce geçmemeli. */
    it('test ortamında WebGL var (ölçüm boşa geçmesin)', () => {
      expect(Z().destek()).toBe(true);
    });

    it('otomasyonda kendiliğinden açılmaz; açıkça istenince açılır', () => {
      sifirla();
      expect(navigator.webdriver).toBe(true);
      expect(Z().kullanilir()).toBe(false);
      Z().ac();
      expect(Z().kullanilir()).toBe(true);
    });

    it('hafif görünüm seçiliyse ya da yükleme hata verdiyse CSS odası kalır', async () => {
      sifirla();
      Z().ac();
      await R.Office.saveSettings({ sahne3b:'hafif' });
      expect(Z().kullanilir()).toBe(false);
      await R.Office.saveSettings({ sahne3b:'canli' });
      Z()._durum.hata = 'dosya yok';
      expect(Z().kullanilir()).toBe(false);
    });

    it('ekran: canlıda yuva ve masa düğmeleri, hatada not ve CSS odası', async () => {
      sifirla();
      Z().ac();
      const canli = String(await R.Screens.office.render());
      expect(canli.includes('id="ofis3b-yuva"')).toBe(true);
      expect(canli.includes('ofis3b-masalar')).toBe(true);
      Z()._durum.hata = 'Canlı 3B ofis dosyaları bulunamadı (ofis3d/); hafif görünüm gösteriliyor.';
      const hafif = String(await R.Screens.office.render());
      expect(hafif.includes('id="ofis3b-yuva"')).toBe(false);
      expect(hafif.includes('id="room3d"')).toBe(true);
      expect(hafif.includes('hafif görünüm gösteriliyor')).toBe(true);
    });
  });

  describe('3B ofis — gece ve gündüz', () => {
    it('saate uyar: 20:00–06:59 gece, öteki saatler gündüz', () => {
      const g = Z().geceMi;
      expect([g(new Date(2026, 8, 26, 19, 59)), g(new Date(2026, 8, 26, 20, 0)),
        g(new Date(2026, 8, 27, 6, 59)), g(new Date(2026, 8, 27, 7, 0))]).toEqual([false, true, true, false]);
    });

    it('elle seçim yalnız o gün geçerli; ertesi gün yine saat', () => {
      try{ localStorage.removeItem('rota.ofis3b.gece'); }catch(e){}
      expect(Z().hedefGece(new Date(2026, 8, 26, 21, 0))).toBe(true);
      Z().elleGece(false, new Date(2026, 8, 26, 21, 0));
      expect(Z().hedefGece(new Date(2026, 8, 26, 23, 0))).toBe(false);   // o gün senin seçimin
      expect(Z().hedefGece(new Date(2026, 8, 27, 21, 0))).toBe(true);    // ertesi gün saat
      try{ localStorage.removeItem('rota.ofis3b.gece'); }catch(e){}
    });
  });

  describe('3B ofis — olay kuyruğu', () => {
    it('aynı olay günde bir kez; kuyruk en çok üç; kendine teslim yok', () => {
      sifirla();
      const e = Z()._ekle;
      expect(e({ tur:'deliver', kim:0, kime:4, anahtar:'not:a' })).toBe(true);
      expect(e({ tur:'deliver', kim:0, kime:4, anahtar:'not:a' })).toBe(false);
      expect(e({ tur:'deliver', kim:2, kime:2, anahtar:'x' })).toBe(false);
      expect(e({ tur:'deliver', kim:1, kime:4, anahtar:'not:b' })).toBe(true);
      expect(e({ tur:'break', kim:5, anahtar:'hak:koc' })).toBe(true);
      expect(e({ tur:'deliver', kim:3, kime:4, anahtar:'not:c' })).toBe(false);   // dolu
      expect(Z()._durum.kuyruk.length).toBe(3);
    });

    it('gelen öneri, onu yazan uzmanı Patron’a yürütür; Patron’un kendi önerisi yürümez', () => {
      sifirla();
      const n = Z().oneriler([{ id:'p1', agent:'tyt' }, { id:'p2', agent:'patron' }, { id:'p3', agent:'koc' }]);
      expect(n).toBe(2);
      const k = Z()._durum.kuyruk;
      expect(k.map(o => [o.kim, o.kime])).toEqual([[Z().SIRA.indexOf('tyt'), 4], [Z().SIRA.indexOf('koc'), 4]]);
      expect(Z().SIRA[4]).toBe('patron');
      expect(k[0].metin.includes('Tuna')).toBe(true);
    });

    it('sahne yoksa toplantı beklemeden açılır', () => {
      sifirla();
      let gitti = 0;
      const r = Z().toplantiyaGotur(() => { gitti++; });
      expect([r, gitti]).toEqual([false, 1]);
    });
  });

  describe('3B ofis — canlı ekosistem: hangi hareket neden', () => {
    const P = () => Z().SIRA.indexOf('patron');
    const i = id => Z().SIRA.indexOf(id);
    function bos(ek){
      return Object.assign({ saat:10, haftaGunu:3, notlar:[], oneriler:[], onaylar:[], denemeler:[],
        brifing:false, bulgular:[], hakDolu:[], hkm:null, plan:null, ara:false }, ek || {});
    }
    const ozet = o => o.gorevler.map(g => [g.tur, g.kim, g.tur === 'deliver' ? g.kime : null, g.anahtar]);

    it('veri yoksa ofis sessiz: hareket yok, telefon yok, toplantı yok', () => {
      const o = Z().olaylar(bos());
      expect([o.gorevler.length, o.telefon, o.kapanis]).toEqual([0, false, false]);
    });

    it('not, öneri ve brifing bulgusu uzmanı Patron’a; onay Patron’u uzmana yürütür', () => {
      const o = Z().olaylar(bos({
        notlar:[{ id:'tekrar-borcu', agent:'analist', text:'Tekrar borcu %75' }, { id:'karar', agent:'patron', text:'x' }],
        oneriler:[{ id:'p1', agent:'tyt' }],
        onaylar:[{ id:'p0', agent:'koc' }],
        brifing:true, bulgular:[{ agent:'ayt', text:'AYT düşüşte' }] }));
      expect(ozet(o)).toEqual([
        ['deliver', i('analist'), P(), 'not:tekrar-borcu'],
        ['deliver', i('tyt'), P(), 'oneri:p1'],
        ['deliver', P(), i('koc'), 'onay:p0'],
        ['deliver', i('ayt'), P(), 'brif:ayt'],
      ]);
      expect(o.gorevler[0].metin.includes('Tekrar borcu %75')).toBe(true);
      expect(o.gorevler[2].metin.includes('Kerem')).toBe(true);
      expect(Z().olaylar(bos({ bulgular:[{ agent:'ayt', text:'x' }] })).gorevler.length).toBe(0);  // brifing yoksa yok
    });

    it('bugün kaydedilen deneme analisti arşive götürür', () => {
      const o = Z().olaylar(bos({ denemeler:[{ id:'e1' }] }));
      expect(ozet(o)).toEqual([['archive', i('analist'), null, 'deneme:e1']]);
    });

    it('mola gerçek bir nedene bağlı: hak doldu, plan bitti, ara günü, öğle arası', () => {
      expect(ozet(Z().olaylar(bos({ hakDolu:['koc'] })))).toEqual([['break', i('koc'), null, 'hak:koc']]);
      const plan = Z().olaylar(bos({ plan:{ toplam:4, bitti:4, bekleyen:0 } }));
      expect(plan.gorevler.length).toBe(5);
      expect(plan.gorevler.every(g => g.tur === 'break' && g.ritim && g.kim !== P())).toBe(true);
      expect(plan.gorevler[0].metin.includes('planı tamamlandı')).toBe(true);
      expect(Z().olaylar(bos({ plan:{ toplam:4, bitti:3, bekleyen:1 } })).gorevler.length).toBe(0);
      expect(Z().olaylar(bos({ plan:{ toplam:0, bitti:0, bekleyen:0 } })).gorevler.length).toBe(0);
      expect(Z().olaylar(bos({ ara:true })).gorevler[0].metin.includes('ara günü')).toBe(true);
      expect(Z().olaylar(bos({ saat:12 })).gorevler[0].metin.includes('Öğle arası')).toBe(true);
      expect(Z().olaylar(bos({ saat:14 })).gorevler.length).toBe(0);
    });

    it('gece ritim molası yok; gerçek olaylar gece de işler', () => {
      expect(Z().olaylar(bos({ saat:23, ara:true, plan:{ toplam:2, bitti:2, bekleyen:0 } })).gorevler.length).toBe(0);
      expect(Z().olaylar(bos({ saat:23, oneriler:[{ id:'p', agent:'tyt' }] })).gorevler.length).toBe(1);
    });

    it('telefon: HKM ile son 15 dakikada eşitleme; kapanış: pazar 18–21', () => {
      expect(Z().olaylar(bos({ hkm:{ dk:3 } })).telefon).toBe(true);
      expect(Z().olaylar(bos({ hkm:{ dk:40 } })).telefon).toBe(false);
      expect(Z().olaylar(bos({ haftaGunu:0, saat:19 })).kapanis).toBe(true);
      expect(Z().olaylar(bos({ haftaGunu:0, saat:12 })).kapanis).toBe(false);
      expect(Z().olaylar(bos({ haftaGunu:6, saat:19 })).kapanis).toBe(false);
    });

    it('anlık görüntü AYS durumundan okunur (plan, deneme, öneri)', () => {
      sifirla();
      const bugun = R.U.todayISO();
      R.S.days[bugun] = { id:bugun, blocks:[{ status:'done' }, { status:'pending' }] };
      R.S.exams = [{ id:'e-bugun', createdAt:new Date().toISOString() },
        { id:'e-eski', createdAt:'2020-01-01T10:00:00.000Z' }];
      const s = Z().anlik(new Date());
      expect(s.plan).toEqual({ toplam:2, bitti:1, bekleyen:1 });
      expect(s.denemeler.map(e => e.id)).toEqual(['e-bugun']);
      expect(Array.isArray(s.oneriler) && Array.isArray(s.notlar)).toBe(true);
    });
  });

  describe('3B ofis — toplantı dönüşü', () => {
    function sahteSahne(){
      const c = { kapat:0, telefon:[] };
      return { c, api:{
        durum:() => ({ toplanti:'seated', gece:false, telefonda:false, calisiyor:true }),
        toplanti:v => { if(v === false) c.kapat++; return true; },
        mesgul:() => true, koyu(){}, surdur(){}, gece(){}, hiz(){},
        telefon:v => { c.telefon.push(v); return true; }, gorev:() => false } };
    }

    it('yeniden çizim pazar kapanışını bitirmez; gerçek toplantıdan dönüş ekibi masaya yürütür', async () => {
      sifirla();
      const d = Z()._durum, eski = { api:d.api, kok:d.kok, t:d.toplantidaydi };
      const { c, api } = sahteSahne();
      const kok = document.createElement('div'); kok.innerHTML = '<p data-olay></p>';
      const yuva = document.createElement('div'); document.body.appendChild(yuva);
      const sahteKoydum = !window.RotaOfis3B;
      if(sahteKoydum) window.RotaOfis3B = { kur:() => ({ ok:false }) };
      d.api = api; d.kok = kok; d.toplantidaydi = false;
      try{
        await cizmeden(async () => { Z().yerlestir(yuva); Z().yerlestir(yuva); Z()._isle(); });
        expect(c.kapat).toBe(0);
        d.toplantidaydi = true;
        Z()._isle();
        expect(c.kapat).toBe(1);
        expect(d.toplantidaydi).toBe(false);
      }finally{
        Z()._durdur();
        yuva.remove();
        d.api = eski.api; d.kok = eski.kok; d.toplantidaydi = eski.t;
        if(sahteKoydum) delete window.RotaOfis3B;       // sonraki test gerçeğini yüklesin
      }
    });
  });

  describe('3B ofis — gerçek sahne', () => {
    it('yüklenir, AYS adlarıyla kurulur, görevi kabul eder, meşgulken reddeder', async () => {
      sifirla();
      Z()._kok('../ofis3d/');
      await Z().yukle();
      expect(typeof window.RotaOfis3B.kur).toBe('function');
      const kok = document.createElement('div');
      kok.innerHTML = '<div class="office-view" style="width:320px;height:200px"></div>'
        + '<p data-status></p><button data-meeting></button><button data-night></button>'
        + '<button data-view="angle"></button><button data-view="top"></button><button data-boss></button>'
        + '<button data-area="archive"></button><button data-area="phone"></button><button data-area="meeting"></button>'
        + '<button data-motion></button><input type="checkbox" data-call><input type="checkbox" data-walls>'
        + '<input type="checkbox" data-auto><input type="checkbox" data-follow>'
        + '<select data-actor><option value="0">a</option></select><select data-job><option value="deliver">d</option></select>'
        + '<select data-recipient><option value="1">b</option></select><select data-speed><option value="1">1</option></select>'
        + '<button data-run></button>';
      document.body.appendChild(kok);
      try{
        const api = window.RotaOfis3B.kur(kok, { adlar:['Tuna', 'Yaman', 'Rana', 'Deniz', 'Patron', 'Kerem'] });
        expect(api.ok).toBe(true);
        expect(api.gorev('deliver', 0, 4)).toBe(true);
        expect(api.mesgul()).toBe(true);
        expect(api.gorev('break', 1, 0)).toBe(false);
        expect(api.durum().gorev.temsili).toBe(false);
        expect(api.gorev('deliver', 2, 2)).toBe(false);
        expect(api.toplanti(true)).toBe(false);          // görev sürerken toplantı yok
      }finally{
        kok.remove();                                    // döngü kendiliğinden durur
      }
    });
  });
})();
