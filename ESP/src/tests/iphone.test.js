/* iPhone planı (belgeler/ekip/IPHONE-PLANI.md) · Faz 1 · Merdiven.

   Sözleşme §2.2 ve §2.4: açık yalnız bulunduğun yer; açıklama ⓘ'dedir,
   ekranda ikinci kez yazılmaz. Gizlemek uygulama düzeyindedir (ekranın
   kucukVarsayilan'ı); anahtar yanlış yazılırsa bölüm sessizce açık
   kalırdı — her anahtar gerçek bir bölüme denk gelmeli. */

(function(){
  const { describe, it, expect, resetState } = ESP.Test;

  function yerlestir(h){
    const d = document.createElement('div');
    d.innerHTML = String(h);
    document.body.appendChild(d);
    return d;
  }

  describe('iPhone · Faz 1 · Merdiven', () => {

    it('Merdiven: ölçülemeyen kapılar ve kör noktalar şerit; Yol’da yalnız şimdiki kademe açık', async () => {
      resetState();
      ESP.S.ui.curDisc = 'lang';
      const d = yerlestir(await ESP.Screens.ladder.render());
      try{
        const G = window.LIFEOS.Gizle;
        const var_ = G.bolumler(d).map(b => b.anahtar);
        const kucuk = ESP.Screens.ladder.kucukVarsayilan;
        expect(kucuk.indexOf('ölçülemeyen-kapılar') >= 0).toBe(true);
        expect(kucuk.indexOf('bu-merdivenin-göremediği') >= 0).toBe(true);
        kucuk.forEach(a => expect(var_.indexOf(a) >= 0).toBe(true));
        const yol = ESP.Curriculum.roadmap('lang');
        const ad = st => G.anahtar('Kademe ' + ESP.LEVEL_BY_RANK[st.rank].short);
        const simdiki = yol.steps.filter(st => st.state === 'current');
        expect(simdiki.length).toBe(1);
        expect(kucuk.indexOf(ad(simdiki[0]))).toBe(-1);
        yol.steps.filter(st => st.state !== 'current').forEach(st => expect(kucuk.indexOf(ad(st)) >= 0).toBe(true));
      }finally{ d.remove(); }
    });

    it('Merdiven: açıklama paragrafları ekranda değil ⓘ’de', async () => {
      resetState();
      const d = yerlestir(await ESP.Screens.ladder.render());
      try{
        const metin = d.textContent;
        ['disiplinlerin ortalaması değildir', 'Kademe ardışıktır', 'en pahalı hatasıdır', 'ölçülemediği için önemsiz değildir']
          .forEach(t => expect(metin.indexOf(t)).toBe(-1));
        /* bilgi kaybolmadı: aynı öğreti ⓘ kartında */
        expect(ESP.HINTS.level.more).toContain('ortalaması değildir');
        expect(ESP.HINTS.ladder.more).toContain('ardışıktır');
        expect(!!d.querySelector('[data-hint="ladder"]')).toBe(true);
      }finally{ d.remove(); }
    });
  });
})();

/* iPhone planı · Faz 2c · ESP Çalışma: Tarih, Ses, Okuma.

   Kullanıcı (2026-10-02): «çok daha sade, çok daha minimalist». Ekranda
   yalnız işin kendisi ve en çok bir dönen kart; ara sıra açılan araç
   şerit, başvuru ve tekrar gizli; sabit açıklama notu hiçbir bölümde
   kalmaz (öğreti ⓘ'de, data/hints.js). Veriden gelen not (zincirin
   sorusu, tezgâhın sıradaki kapısı) açıklama değildir, kalır. */
(function(){
  const { describe, it, expect, resetState, pushEvent, pushPiece, pushNote } = ESP.Test;

  async function bolumle(id, bolum){
    const sc = ESP.Screens[id];
    const kok = document.createElement('div');
    kok.innerHTML = String(await sc.render());
    document.body.appendChild(kok);
    const G = window.LIFEOS.Gizle;
    const gizliler = (sc.gizliVarsayilan || []).concat(ESP.App.SADE_GIZLI[id] || []);
    const kucukler = sc.kucukVarsayilan || [];
    const alan = bolum ? kok.querySelector('#bl-' + bolum) : kok;
    const var_ = G.bolumler(alan).map(b => b.anahtar);
    return {
      kok, alan, var:var_,
      gizli:var_.filter(a => gizliler.indexOf(a) >= 0),
      kucuk:var_.filter(a => gizliler.indexOf(a) < 0 && kucukler.indexOf(a) >= 0),
      acik:var_.filter(a => gizliler.indexOf(a) < 0 && kucukler.indexOf(a) < 0),
      bitir(){ kok.remove(); },
    };
  }
  const ustler = d => Array.from(d.querySelectorAll('.donen__ust')).map(x => x.textContent.trim());
  /* Tezgâhın notu (sıradaki kapı) veridir; geri kalan not sabit açıklamadır. */
  const sabitNotlar = kok => Array.from(kok.querySelectorAll('.lrow__note'))
    .filter(n => !n.closest('#bl-tezgah'));

  describe('iPhone · Faz 2c · ESP Çalışma', () => {

    it('Tarih: açık yalnız şerit; kapsam dönen kartta; dönemler şerit; boşluk ve dağılım gizli', async () => {
      resetState();
      pushEvent(1071, 'Malazgirt', { kind:'siyasi', region:'anadolu' });
      pushEvent(1453, 'İstanbul’un fethi', { kind:'siyasi', region:'anadolu' });
      pushEvent(1789, 'Fransız Devrimi', { kind:'toplumsal', region:'avrupa' });
      ESP.Memo.bitir();
      const b = await bolumle('history', 'serit');
      try{
        const d = b.alan.querySelector('.donen[aria-label="Kapsam"]');
        expect(!!d).toBe(true);
        expect(ustler(d).slice(0, 2).join(',')).toBe('Dönem,Alan');
        expect(b.acik.join(',')).toBe('şerit');
        expect(b.kucuk.indexOf('dönemler') >= 0).toBe(true);
        ['yüzyıl-boşlukları', 'dağılım'].forEach(a => expect(b.gizli.indexOf(a) >= 0).toBe(true));
        /* «Tohumu yükle» ayrı bir satır değil: olay ekleme kartının yanında */
        expect(b.kok.querySelectorAll('[data-act="seed"]').length).toBe(1);
        expect(!!b.kok.querySelector('#bl-olaylar [data-act="seed"]')).toBe(true);
      }finally{ b.bitir(); ESP.Memo.bitir(); }
    });

    it('Tarih: hiçbir bölümde sabit açıklama notu yok; öğreti ⓘ’de', async () => {
      resetState();
      pushEvent(1071, 'Malazgirt', { kind:'siyasi', region:'anadolu' });
      ESP.Memo.bitir();
      const b = await bolumle('history');
      try{
        expect(sabitNotlar(b.kok).map(n => n.textContent.trim()).join(' | ')).toBe('');
        expect(ESP.HINTS.belge.more).toContain('Web kapalıysa');
        expect(ESP.HINTS.srs.more).toContain('çöküşünü gizlememeli');
        expect(ESP.HINTS['tarih-pratik'].b).toContain('sırala');
      }finally{ b.bitir(); ESP.Memo.bitir(); }
    });

    it('Ses: açık metronom, tekrar kaydet ve tek «Parçalar» listesi; tezgâh kendi bölümünde', async () => {
      resetState();
      for(let i = 0; i < 7; i++) pushPiece('parça' + i, { kind:'technique', targetBpm:140 });
      ESP.Memo.bitir();
      const b = await bolumle('studio', 'muzik');
      try{
        expect(b.acik.join(',')).toBe('metronom,tekrar-kaydet,parçalar');
        expect(b.var.indexOf('teknik')).toBe(-1);
        expect(b.var.indexOf('tezgâh')).toBe(-1);
        expect(b.kucuk.indexOf('parça-ekle') >= 0).toBe(true);
        expect(b.gizli.indexOf('paket-iste') >= 0).toBe(true);
        /* iki masa da kendi bölümünde */
        ['music', 'diction'].forEach(x =>
          expect(!!b.kok.querySelector('#bl-tezgah [data-act="desk-toggle"][data-disc="' + x + '"]')).toBe(true));
        /* ilk beş parça + «Tümü» */
        expect(b.alan.querySelectorAll('.parca').length).toBe(5);
        expect(!!b.alan.querySelector('[data-act="parca-tumu"]')).toBe(true);
        expect(sabitNotlar(b.kok).map(n => n.textContent.trim()).join(' | ')).toBe('');
        expect(ESP.HINTS['clean-bpm'].more).toContain('sistem duymaz');
        expect(ESP.HINTS.metronome.more).toContain('ölçünün nerede başladığını');
      }finally{ b.bitir(); ESP.Memo.bitir(); }
    });

    it('Ses: «Tümü» bütün parçaları açar; seçili parçanın geçmişi kendi satırında', async () => {
      resetState();
      for(let i = 0; i < 7; i++) pushPiece('parça' + i, { kind:'technique', targetBpm:140 });
      const p = ESP.S.pieces[6];
      p.attempts = [{ date:'2026-10-01', bpm:80, clean:true }];
      ESP.Memo.bitir();
      const cizim = ESP.App.render;
      ESP.App.render = () => {};
      try{
        await ESP.Screens.studio.handle['parca-tumu']();
        expect(ESP.S.ui.parcaTumu).toBe(true);
        ESP.S.ui.pieceOpen = p.id;
        const b = await bolumle('studio', 'muzik');
        try{
          expect(b.alan.querySelectorAll('.parca').length).toBe(7);
          const acik = b.alan.querySelector('.parca[open]');
          expect(!!acik && acik.textContent.indexOf('parça6') >= 0).toBe(true);
          expect(!!acik.querySelector('table')).toBe(true);
        }finally{ b.bitir(); }
      }finally{ ESP.App.render = cizim; ESP.S.ui.parcaTumu = false; ESP.S.ui.pieceOpen = null; ESP.Memo.bitir(); }
    });

    it('Okuma: not ekle ve kısa not listesi (ilk 5 + Tümü); açıklama ⓘ’de', async () => {
      resetState();
      for(let i = 0; i < 7; i++) pushNote('not ' + i);
      ESP.Memo.bitir();
      const b = await bolumle('library', 'notlar');
      try{
        expect(b.acik.join(',')).toBe('not-ekle,notlar');
        expect(b.alan.querySelectorAll('.noterow').length).toBe(5);
        expect(!!b.alan.querySelector('[data-act="not-tumu"]')).toBe(true);
        expect(sabitNotlar(b.kok).map(n => n.textContent.trim()).join(' | ')).toBe('');
        expect(b.alan.textContent.indexOf('Kavram etiketleri metinden')).toBe(-1);
        expect(ESP.HINTS['atomic-note'].more).toContain('Kavram etiketleri');
      }finally{ b.bitir(); ESP.Memo.bitir(); }
    });

    /* Ölçü aracı yalnız varsayılan bölümü görür; öbür bölümler burada
       sayılır: her bölümde açık ≤ 3, başvuru tabloları şerit. */
    it('Tarih, Ses, Okuma: her bölümde açık en çok üç; başvuru tabloları şerit', async () => {
      resetState();
      pushEvent(1071, 'Malazgirt', { kind:'siyasi', region:'anadolu' });
      for(let i = 0; i < 3; i++) pushPiece('parça' + i, { kind:'technique', targetBpm:140 });
      for(let i = 0; i < 3; i++) pushNote('not ' + i);
      ESP.Test.pushBook('Devlet', 'Platon');
      ESP.Memo.bitir();
      const bek = {
        history:{ kaynaklar:['belge-iste'], calisma:['anakronizm-tuzakları', 'tarih-yazımı-okulları'] },
        studio:{ diksiyon:['telaffuz-kuralları', 'son-kayıtlar'], kulak:['aralıklar', 'caged', 'deşifre'] },
        library:{ kaynaklar:['raf', 'okuma-listesi-iste'],
          yontem:['dört-düzey', 'analitik-okumanın-dört-sorusu', 'okuma-protokolü', 'not-şablonları', 'bırakma-izni'] },
      };
      for(const ekran of Object.keys(bek)){
        const sc = ESP.Screens[ekran];
        const kok = document.createElement('div');
        kok.innerHTML = String(await sc.render());
        document.body.appendChild(kok);
        try{
          const G = window.LIFEOS.Gizle;
          const gizli = (sc.gizliVarsayilan || []).concat(ESP.App.SADE_GIZLI[ekran] || []);
          const kucuk = sc.kucukVarsayilan || [];
          /* gizle.js bir anahtarı ekranın ilk bölümünde yönetir: anahtar
             kümesi bütün ekran üzerinden kurulur, sonra bölüme ayrılır */
          const hepsi = G.bolumler(kok);
          kok.querySelectorAll('section.sayfabolum').forEach(pn => {
            if(pn.id === 'bl-tezgah') return;
            const burada = hepsi.filter(b => pn.contains(b.el)).map(b => b.anahtar);
            const acik = burada.filter(a => gizli.indexOf(a) < 0 && kucuk.indexOf(a) < 0);
            if(acik.length > 3) throw new Error(ekran + '/' + pn.id + ' açık ' + acik.join(','));
          });
          Object.keys(bek[ekran]).forEach(bl => bek[ekran][bl].forEach(a => {
            const b = hepsi.find(x => x.anahtar === a);
            if(!b) throw new Error(ekran + ': «' + a + '» bölümü yok');
            expect(!!kok.querySelector('#bl-' + bl).contains(b.el)).toBe(true);
            expect(kucuk.indexOf(a) >= 0).toBe(true);
          }));
        }finally{ kok.remove(); }
      }
      ESP.Memo.bitir();
    });

    it('Okuma: arama süzgeci açıkken liste kesilmez', async () => {
      resetState();
      for(let i = 0; i < 7; i++) pushNote('not ' + i);
      ESP.S.ui.noteQuery = 'not';
      ESP.Memo.bitir();
      const b = await bolumle('library', 'notlar');
      try{
        expect(b.alan.querySelectorAll('.noterow').length).toBe(7);
        expect(b.alan.querySelectorAll('[data-act="not-tumu"]').length).toBe(0);
      }finally{ b.bitir(); ESP.S.ui.noteQuery = ''; ESP.Memo.bitir(); }
    });
  });
})();

/* iPhone planı · Faz 2d · bölüm turu: ESP Dil, Felsefe, Yazı.

   Ölçü aracı yalnız varsayılan bölümü görür; bu ekranların öbür
   bölümlerinde sekiz karta, sekiz nota varan kalabalık vardı (Dil ›
   Dilbilgisi). Sıkı ölçü: her bölümde açık en çok üç, başvuru şerit,
   sabit açıklama notu yok (öğreti ⓘ'de). */
(function(){
  const { describe, it, expect, resetState } = ESP.Test;

  async function bolumTuru(bek, gizliBek){
    for(const ekran of Object.keys(bek)){
      const sc = ESP.Screens[ekran];
      const kok = document.createElement('div');
      kok.innerHTML = String(await sc.render());
      document.body.appendChild(kok);
      try{
        const G = window.LIFEOS.Gizle;
        const gizli = (sc.gizliVarsayilan || []).concat(ESP.App.SADE_GIZLI[ekran] || []);
        const kucuk = sc.kucukVarsayilan || [];
        const hepsi = G.bolumler(kok);
        kok.querySelectorAll('section.sayfabolum').forEach(pn => {
          if(pn.id === 'bl-tezgah') return;
          const acik = hepsi.filter(b => pn.contains(b.el)).map(b => b.anahtar)
            .filter(a => gizli.indexOf(a) < 0 && kucuk.indexOf(a) < 0);
          if(acik.length > 3) throw new Error(ekran + '/' + pn.id + ' açık ' + acik.join(','));
        });
        Object.keys(bek[ekran]).forEach(bl => bek[ekran][bl].forEach(a => {
          const b = hepsi.find(x => x.anahtar === a);
          if(!b) throw new Error(ekran + ': «' + a + '» bölümü yok');
          expect(!!kok.querySelector('#bl-' + bl).contains(b.el)).toBe(true);
          expect(kucuk.indexOf(a) >= 0).toBe(true);
        }));
        ((gizliBek || {})[ekran] || []).forEach(a => {
          if(!hepsi.find(x => x.anahtar === a)) throw new Error(ekran + ': gizli «' + a + '» yok');
          expect(gizli.indexOf(a) >= 0).toBe(true);
        });
      }finally{ kok.remove(); }
    }
  }

  describe('iPhone · Faz 2d · ESP bölüm turu', () => {

    it('Dil, Felsefe, Yazı: her bölümde açık en çok üç; başvuru şerit, Yazı’nın sınır kartı gizli', async () => {
      resetState();
      ESP.Memo.bitir();
      await bolumTuru({
        lang:{ ilerleme:['kutu-dağılımı'], ekle:['tohum-deste'], ogren:['konular', 'ünite-iste'] },
        symposium:{ metinler:['belge-iste'], ekle:['sokratik-sorular'], deneyler:['düşünce-deneyleri', 'argüman-alıştırmaları'] },
        writing:{ olcum:['pratik-süresi'], araclar:['yazı-örnekleri-iste', 'revizyon-geçişleri', 'yapı-kalıpları', 'retorik-figürler'] },
      }, { writing:['sınır'] });
    });

    it('Dil › Dilbilgisi: altı düzey tek «Düzeyler» kartında; «A1/A2» anahtarı artık çakışmaz', async () => {
      resetState();
      ESP.Memo.bitir();
      const kok = document.createElement('div');
      kok.innerHTML = String(await ESP.Screens.lang.render());
      document.body.appendChild(kok);
      try{
        const anahtarlar = window.LIFEOS.Gizle.bolumler(kok).map(b => b.anahtar);
        ['a', 'b', 'c'].forEach(a => expect(anahtarlar.indexOf(a)).toBe(-1));
        expect(anahtarlar.indexOf('düzeyler') >= 0).toBe(true);
        const bantlar = ESP.CEFR.filter(x => (ESP.GRAMMAR_BY_BAND[x.label] || []).length);
        expect(kok.querySelectorAll('#bl-gramer details.duzey').length).toBe(bantlar.length);
        /* sınırdaki düzey (beyanı eksik ilk düzey) açık gelir */
        expect(kok.querySelectorAll('#bl-gramer details.duzey[open]').length).toBe(1);
      }finally{ kok.remove(); }
    });

    it('Dil, Felsefe, Yazı: sabit açıklama cümleleri ekranda değil ⓘ’de', async () => {
      resetState();
      ESP.Memo.bitir();
      const yok = ['Aralıklı tekrarın amacı', 'Üç ayraç tanınır', 'Bu kartlar senin ölçümün değildir',
        'Kutu kaba sınıftır', 'Bant KİŞİYE', 'Süre ölçülür, kalite ölçülmez', 'Soldaki eksen kelime',
        'Bilmediğin yapıdan kaçınmak', 'Bir hatayı adlandırmak', 'Mikrofonun yalnız', 'Kelimeye sırayla dokun',
        'Bağlam cümlelerin sırayla', 'Cevabın doğrudan aralıklı', 'CEFR düzeylerine bağlı', 'İlerleme SRS',
        'Başlık, ölçülebilir hedef', 'Deney bir tezi sınar', 'Safsata denetimi metinde', 'Uzun deneme gerekmez',
        'Model kapalıyken Socrates', 'Primer metin filozofun', 'Konunun düşünürleri', 'Yazar adının iki farklı',
        'Konu listesi bir müfredattır', 'Üslubu örnek gösterilen', 'Sıra önemlidir', 'Kalıp seçmek',
        'Sürekli yeni taslak', 'Ateşman formülü', 'Bu ekran üslup yargılamaz'];
      for(const ekran of ['lang', 'symposium', 'writing']){
        const metin = String(await ESP.Screens[ekran].render());
        yok.forEach(t => { if(metin.indexOf(t) >= 0) throw new Error(ekran + ': «' + t + '» ekranda'); });
      }
      expect(ESP.HINTS.readability.more).toContain('Ateşman');
      expect(ESP.HINTS.bant.more).toContain('ÜRETİME');
      expect(ESP.HINTS['konusma-pratigi'].more).toContain('kaydedilmez');
      expect(ESP.HINTS.kanon.more).toContain('ikiye katlıyordu');
      expect(ESP.HINTS.belge.more).toContain('Okuma › Kaynaklar');
    });
  });
})();

/* iPhone planı · Faz 3 · Analiz (ESP). Sıkı ölçü. */
(function(){
  const { describe, it, expect, resetState } = ESP.Test;

  /* Bölümlü ekranın her bölümü ayrı sayılır (sıkı ölçü): açık en çok üç. */
  function bolumBolum(NS, id, kok){
    const sc = NS.Screens[id], G = window.LIFEOS.Gizle;
    const gizli = (sc.gizliVarsayilan || []).concat(NS.App.SADE_GIZLI[id] || []);
    const kucuk = sc.kucukVarsayilan || [];
    const bl = Array.from(kok.querySelectorAll('section.sayfabolum'));
    return (bl.length ? bl : [kok]).map(b => ({ id:b.id,
      acik:G.bolumler(b).map(x => x.anahtar).filter(a => gizli.indexOf(a) < 0 && kucuk.indexOf(a) < 0) }));
  }

  describe('iPhone · Faz 3 · Analiz (ESP)', () => {

    it('Analiz: her bölümde açık en çok üç; sınır kartı gizli; notlar ⓘ\u2019de', async () => {
      resetState();
      const kok = document.createElement('div');
      kok.innerHTML = String(await ESP.Screens.analytics.render());
      document.body.appendChild(kok);
      try{
        bolumBolum(ESP, 'analytics', kok).forEach(b => expect(b.id + ':' + (b.acik.length <= 3)).toBe(b.id + ':true'));
        expect(ESP.App.SADE_GIZLI.analytics.indexOf('sınır') >= 0).toBe(true);
        ['Yoğunlaşma kasıtlı olabilir', 'Nöbetçi ve sürtünme ölçer', 'Hiç cevaplanmamış kart bu ortalamaya girmez']
          .forEach(t => expect(kok.textContent.indexOf(t)).toBe(-1));
        expect(ESP.HINTS['not-denge'].b).toContain('Yoğunlaşma kasıtlı');
        expect(kok.textContent.indexOf('Infinity')).toBe(-1);
      }finally{ kok.remove(); }
    });

    it('Gösterge ayrışması: önceki pencere sıfırken «%Infinity» değil «sıfırdan»', () => {
      const n = ESP.Goodhart.ayrismaNotu({ effortLabel:'okuma dakikası', outcomeLabel:'çıkan not' }, Infinity, 0);
      expect(n).toBe('okuma dakikası sıfırdan başladı, çıkan not değişmedi.');
      expect(ESP.Goodhart.ayrismaNotu({ effortLabel:'a', outcomeLabel:'b' }, 0.4, 0.2)).toBe('a %40 arttı, b %20 değişti.');
    });
  });
})();

/* iPhone planı · Faz 4 · Ofis ve Danışma (ESP): «brifing + tek eylem».
   Masa cümleleri toplantıda, Patron'da ve uzman kartında üç kez yazılıyordu;
   açık yalnız iş, gerisi şerit. Sabit notlar ⓘ'de. */
(function(){
  const { describe, it, expect, resetState } = ESP.Test;
  async function ciz(id){
    const kok = document.createElement('div');
    kok.innerHTML = String(await ESP.Screens[id].render());
    document.body.appendChild(kok);
    return kok;
  }
  function acik(id, kok){
    const sc = ESP.Screens[id], G = window.LIFEOS.Gizle;
    const gizli = (sc.gizliVarsayilan || []).concat(ESP.App.SADE_GIZLI[id] || []);
    const kucuk = sc.kucukVarsayilan || [];
    return G.bolumler(kok).map(x => x.anahtar).filter(a => gizli.indexOf(a) < 0 && kucuk.indexOf(a) < 0);
  }

  describe('iPhone · Faz 4 · Ofis ve Danışma (ESP)', () => {
    ['office', 'team'].forEach(id => {
      it(id + ': açık en çok üç; sabit not ekranda yok', async () => {
        resetState();
        const kok = await ciz(id);
        try{
          const a = acik(id, kok);
          expect(id + ':' + a.join(',') + ':' + (a.length <= 3)).toBe(id + ':' + a.join(',') + ':true');
          if(id === 'office') expect(kok.textContent.indexOf('Her ajan yalnızca kendi alanına bakar')).toBe(-1);
        }finally{ kok.remove(); }
      });
    });
  });
})();

/* iPhone planı · Faz 5 · Ayarlar (ESP): iOS Ayarlar listesi. İlk görünür
   bölüm açık, gerisi tek satırlık şerit; Rütbe olduğu gibi kalır. */
(function(){
  const { describe, it, expect, resetState } = ESP.Test;
  describe('iPhone · Faz 5 · Ayarlar (ESP)', () => {
    ['profile', 'guide'].forEach(id => {
      it(id + ': ilk bölüm açık, gerisi şerit; gizliler gizli kalır', async () => {
        resetState();
        const sc = ESP.Screens[id];
        const kok = document.createElement('div');
        kok.innerHTML = String(await sc.render());
        document.body.appendChild(kok);
        try{
          const G = window.LIFEOS.Gizle;
          const gizli = (sc.gizliVarsayilan || []).concat(ESP.App.SADE_GIZLI[id] || []);
          const gorunen = G.bolumler(kok).map(b => b.anahtar).filter(a => gizli.indexOf(a) < 0);
          const serit = ESP.App.ayarListesi(sc, kok);
          expect(serit.join(',')).toBe(gorunen.slice(1).join(','));
          expect(gorunen.filter(a => serit.indexOf(a) < 0).length <= 1).toBe(true);
        }finally{ kok.remove(); }
      });
    });
    it('Rütbe ayar listesine girmez (olduğu gibi kalır)', () => {
      expect(ESP.App.ayarListesi({ id:'rutbe' }, document.body).length).toBe(0);
    });
  });
})();
