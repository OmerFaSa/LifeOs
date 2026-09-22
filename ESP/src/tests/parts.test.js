/* ALANA BAĞLI PARÇALAR — `core/parts.js`.

   ------------------------------------------------------------------
   NEDEN BU DOSYA VAR

   `node tools/kapsam.js ESP --ayrinti`:

       parts.js  %10  2/20
         koşmayan: avatar, discChip, radar, empty, rxList, deskRx,
                   deskChat, deskMap, deskAssets, deskReminders, units,
                   topics …

   Bu dosyanın en üstünde yazan kural sistemin en önemli kuralıdır ve
   hiçbir test onu tutmuyordu:

       «Ölçülmemiş eksen SIFIRA ÇEKİLMEZ.»

   Radar altı disiplinin dengesini gösterir. Ölçülmemiş bir ekseni
   sıfıra çekmek, «hiç çalışılmadı» demektir — oysa doğrusu «girilmedi».
   Şekil içeri çöker, kullanıcı olmayan bir dengesizliği görür ve buna
   göre plan yapar. Kural kodda yazılıydı; artık sınanıyor.

   Çizim işlevlerinin tamamı sınanmıyor: `desk*` ailesi ekran durumuna
   (`S.ui.deskTab`) ve katalog kademesine bağlı büyük birleştiricilerdir;
   onları duman testi geziyor. Burada SÖZÜ olan parçalar var. */

(function(){
  const { describe, it, expect, resetState } = ESP.Test;
  const P = ESP.Parts, U = ESP.U;

  /* `html` bir şablon nesnesi döndürür; `String()` işaretlemeyi verir. */
  const yazi = x => String(x);

describe('Kesinlik rozeti — dört etiket, dördü de görünür', () => {

  it('her etiket kendi adını ve sınıfını taşır', () => {
    [['measured', 'ölçüldü'], ['estimated', 'tahmin'],
     ['derived', 'hesaplandı'], ['missing', 'veri yok']].forEach(([k, ad]) => {
      const h = yazi(P.cert(k));
      expect(h.indexOf(ad) >= 0).toBe(true);
      expect(h.indexOf('cert--' + k) >= 0).toBe(true);
    });
  });

  it('TANINMAYAN etiket «veri yok»a düşer — uydurma bir ad yazmaz', () => {
    /* Bir gün beşinci bir etiket eklenip katalog güncellenmezse,
       ekranda boş bir rozet değil dürüst bir «veri yok» görünür. */
    const h = yazi(P.cert('bilinmeyen'));
    expect(h.indexOf('veri yok') >= 0).toBe(true);
  });

  it('açıklama VARSAYILAN olarak durur, istenirse düşer', () => {
    expect(yazi(P.cert('measured')).indexOf('title=') >= 0).toBe(true);
    expect(yazi(P.cert('measured', { title:false })).indexOf('title=') >= 0).toBe(false);
  });
});

describe('Ölçü yazımı — sıfır bir ölçümdür, boş değil', () => {

  it('null değer SAYI yazdırmaz, etiket yazdırır', () => {
    const h = yazi(P.measure(null, 'dk', 'measured'));
    expect(h.indexOf('veri yok') >= 0).toBe(true);
    expect(h.indexOf('measure--none') >= 0).toBe(true);
  });

  it('SIFIR yazılır — «veri yok» ile karıştırılmaz', () => {
    /* AGENTS.md §1.2'nin ekrandaki yüzü. 0 dakika çalışmak bir
       ölçümdür; hiç girmemek başka bir şeydir. */
    const h = yazi(P.measure(0, 'dk', 'measured'));
    expect(h.indexOf('>0<') >= 0).toBe(true);
    expect(h.indexOf('measure--none') >= 0).toBe(false);
  });

  it('etiket «missing» ise DEĞER olsa da yazılmaz', () => {
    const h = yazi(P.measure(42, 'dk', 'missing'));
    expect(h.indexOf('42') >= 0).toBe(false);
    expect(h.indexOf('veri yok') >= 0).toBe(true);
  });

  it('birim verilmezse uydurulmaz', () => {
    const h = yazi(P.measure(12, null, 'measured'));
    expect(h.indexOf('12') >= 0).toBe(true);
    expect(h.indexOf('<small>') >= 0).toBe(false);
  });
});

describe('Avatar ve disiplin şeridi', () => {

  it('BİLİNMEYEN ajan için hiçbir şey çizilmez', () => {
    /* Boş bir renk kutusu, eksik veriyi var gibi gösterirdi. */
    expect(yazi(P.avatar('yok-boyle-ajan'))).toBe('');
  });

  it('bilinen ajan adını ve baş harfini taşır, okuyucuya görünmez', () => {
    const a = ESP.AGENTS[0];
    const h = yazi(P.avatar(a.id));
    expect(h.indexOf(a.initial) >= 0).toBe(true);
    expect(h.indexOf('aria-hidden="true"') >= 0).toBe(true);
    /* Yanındaki yazı zaten adı söylüyor; iki kez okutmak listeyi
       iki katı uzatır. */
    expect(h.indexOf('title=') >= 0).toBe(true);
  });

  it('BİLİNMEYEN disiplin için şerit çizilmez', () => {
    expect(yazi(P.discChip('yok'))).toBe('');
  });

  it('şerit kısa adı yazar, istenirse uzununu', () => {
    const d = ESP.DISCIPLINES[0];
    expect(yazi(P.discChip(d.id)).indexOf(d.short) >= 0).toBe(true);
    expect(yazi(P.discChip(d.id, { long:true })).indexOf(d.label) >= 0).toBe(true);
  });
});

describe('Radar — ölçülmemiş eksen SIFIRA çekilmez', () => {

  function eksen(label, value, cert){ return { label, value, cert }; }
  const ALTI = [
    eksen('Dil', 0.8, 'measured'), eksen('Felsefe', 0.6, 'measured'),
    eksen('Müzik', 0.4, 'measured'), eksen('Diksiyon', 0.5, 'measured'),
    eksen('Okuma', 0.7, 'measured'), eksen('Yazı', 0.3, 'measured'),
  ];

  /* Boş durum kutusunun kendi simgesi de bir SVG'dir; bu yüzden
     «radar çizilmedi» sorusu `<svg>` ile değil RADARIN KENDİ
     işaretlemesiyle sorulur. */
  const radarVar = h => h.indexOf('radar__ring') >= 0;

  it('üçten az eksenle radar çizilmez — şekil yanıltırdı', () => {
    const h = yazi(P.radar([eksen('a', 0.5, 'measured'), eksen('b', 0.5, 'measured')]));
    expect(radarVar(h)).toBe(false);
    expect(h.indexOf('en az üç eksen') >= 0).toBe(true);
  });

  it('boş dizi de çökmez', () => {
    expect(radarVar(yazi(P.radar([])))).toBe(false);
    expect(radarVar(yazi(P.radar(null)))).toBe(false);
  });

  it('ölçülmemiş eksen POLİGONA girmez', () => {
    /* Girseydi sıfır gibi girer ve şekli içeri çekerdi: kullanıcı
       olmayan bir dengesizlik görürdü. */
    const hepsiOlculdu = yazi(P.radar(ALTI));
    const biriYok = yazi(P.radar(ALTI.map((r, i) =>
      i === 2 ? eksen('Müzik', null, 'missing') : r)));
    const say = h => (h.match(/radar__shape/g) || []).length;
    expect(say(hepsiOlculdu)).toBe(1);
    expect(say(biriYok)).toBe(1);
    /* Poligonun köşe sayısı ölçülen eksen sayısı kadardır. */
    const koseler = h => {
      const m = h.match(/class="radar__shape" points="([^"]*)"/);
      return m ? m[1].trim().split(/\s+/).length : 0;
    };
    expect(koseler(hepsiOlculdu)).toBe(6);
    expect(koseler(biriYok)).toBe(5);
  });

  it('ölçülmemiş eksen KESİKLİ nokta olarak yine de görünür', () => {
    /* Kaybolsaydı kullanıcı o disiplinin var olduğunu unuturdu. */
    const h = yazi(P.radar(ALTI.map((r, i) =>
      i === 0 ? eksen('Dil', null, 'missing') : r)));
    expect(h.indexOf('radar__dot--none') >= 0).toBe(true);
    expect(h.indexOf('veri yok') >= 0).toBe(true);
  });

  it('kesikli nokta AÇIKLAMASI yalnız gerekince çıkar', () => {
    expect(yazi(P.radar(ALTI)).indexOf('sıfır değil') >= 0).toBe(false);
    expect(yazi(P.radar(ALTI.map((r, i) => i === 1 ? eksen('F', null, 'missing') : r)))
      .indexOf('sıfır değil') >= 0).toBe(true);
  });

  it('üçten az eksen ÖLÇÜLDÜYSE poligon hiç çizilmez', () => {
    /* İki noktadan geçen bir «alan» yoktur; çizilseydi bir çizgiyi
       şekil sanırdık. */
    const h = yazi(P.radar(ALTI.map((r, i) =>
      i < 4 ? eksen(r.label, null, 'missing') : r)));
    expect(h.indexOf('radar__shape') >= 0).toBe(false);
    expect(radarVar(h)).toBe(true);
  });

  it('ÖLÇEK daima yazılır — oran neye göre olduğu görünmezse şekil yanıltır', () => {
    expect(yazi(P.radar(ALTI)).indexOf('Dış halka') >= 0).toBe(true);
    expect(yazi(P.radar(ALTI, { scale:'Dış halka = 120 dakika.' }))
      .indexOf('120 dakika') >= 0).toBe(true);
  });

  it('eksen adı KAÇIRILIR — SVG içinde de', () => {
    /* Etiket kullanıcı verisinden gelebilir (profil adı, disiplin
       takma adı). SVG metni de HTML'dir. */
    const h = yazi(P.radar(ALTI.map((r, i) =>
      i === 0 ? eksen('<script>x</script>', 0.5, 'measured') : r)));
    expect(h.indexOf('<script>') >= 0).toBe(false);
    expect(h.indexOf('&lt;script&gt;') >= 0).toBe(true);
  });

  it('değer aralığın dışındaysa kırpılır, şekil taşmaz', () => {
    const h = yazi(P.radar(ALTI.map((r, i) =>
      i === 0 ? eksen('Dil', 9, 'measured') : r)));
    const m = h.match(/class="radar__shape" points="([^"]*)"/);
    const yaricap = m[1].trim().split(/\s+/).map(p => {
      const [x, y] = p.split(',').map(Number);
      return Math.sqrt(Math.pow(x - 100, 2) + Math.pow(y - 92, 2));
    });
    expect(Math.max.apply(null, yaricap) <= 76.5).toBe(true);
  });

  it('radar ekran okuyucuya bir ad söyler', () => {
    expect(yazi(P.radar(ALTI)).indexOf('role="img"') >= 0).toBe(true);
    expect(yazi(P.radar(ALTI, { aria:'Haftalık denge' })).indexOf('Haftalık denge') >= 0)
      .toBe(true);
  });
});

describe('Boş durum', () => {

  it('boş durum metni aynen geçer', () => {
    resetState();
    expect(yazi(P.empty('Henüz kayıt yok.')).indexOf('Henüz kayıt yok.') >= 0).toBe(true);
  });

  it('boş durum metni de KAÇIRILIR', () => {
    resetState();
    const h = yazi(P.empty('<img src=x onerror=1>'));
    expect(h.indexOf('<img src=x') >= 0).toBe(false);
  });
});

})();
