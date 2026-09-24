/* Şablon katmanı, bileşen seti ve parçalar — ESP'nin ARAYÜZ katmanı.

   ------------------------------------------------------------------
   NEDEN BU DOSYA SONRADAN YAZILDI

   `node tools/kapsam.js ESP` ölçtü ve söyledi: 865 test vardı ama
   `core/components.js`, `core/ui.js` ve `core/parts.js` dosyalarının
   TEK BİR İŞLEVİ BİLE koşmuyordu — üçü de %0. AYS'de
   `components.test.js` ve `ux.test.js`, SPİ'de `ui.test.js` vardı;
   ESP'de ikisi de yoktu.

   Kapsam bir hedef değil; ama %0 bir ölçüm değil bir BOŞLUKTUR. En
   çok da şu yüzden: kaçırma (escaping) bu katmanda yaşıyor ve hiç
   sınanmıyordu. Kullanıcının yazdığı bir not, bir kitap adı ya da bir
   tez başlığı ekrana buradan çıkıyor.

   Sınanan şey KAPSAM DEĞİL SÖZLEŞME: her testin adı bir cümle kurar
   ve o cümleler birlikte okunduğunda arayüz katmanının ne söz verdiği
   okunmuş olur. */

(function(){
  const { describe, it, expect } = ESP.Test;
  const { html, raw, when, map, cls, attrs } = ESP.h;
  const K = ESP.C, P = ESP.Parts, UI = ESP.UI;

  describe('Şablon — kaçırma', () => {

    it('araya giren metni KAÇIRIR', () => {
      expect(String(html`<p>${'<b>x</b>'}</p>`)).toBe('<p>&lt;b&gt;x&lt;/b&gt;</p>');
    });

    it('tırnağı kaçırır — nitelik enjeksiyonu kapalı', () => {
      /* `title="${...}"` içine tırnak sızarsa oradan `onload=` yazılır. */
      expect(String(html`<i title="${'" onload="x'}">`)).toContain('&quot;');
    });

    it('XSS denemesi etkisizdir', () => {
      const kotu = '<img src=x onerror=alert(1)>';
      expect(String(html`<div>${kotu}</div>`).indexOf('<img')).toBe(-1);
    });

    it('raw İŞARETLİ değer olduğu gibi kalır', () => {
      /* Kaçırmayı atlamanın TEK yolu budur ve açıkça yazılır:
         `raw` görülmeden hiçbir şey ham geçmez. */
      expect(String(html`<p>${raw('<b>x</b>')}</p>`)).toBe('<p><b>x</b></p>');
    });

    it('iç içe şablon İKİNCİ KEZ kaçırılmaz', () => {
      expect(String(html`<ul>${html`<li>${'a&b'}</li>`}</ul>`))
        .toBe('<ul><li>a&amp;b</li></ul>');
    });

    it('null, undefined ve false HİÇBİR ŞEY üretmez', () => {
      /* `when` olmadan da koşullu parça yazılabilsin diye. «undefined»
         yazan bir ekran, bu depoda bir duman testi hatasıdır. */
      expect(String(html`a${null}${undefined}${false}b`)).toBe('ab');
    });

    it('sıfır YAZILIR — çünkü sıfır bir değerdir', () => {
      /* `false` ile `0` aynı şey değil: biri yokluk, öteki ölçüm. */
      expect(String(html`${0}`)).toBe('0');
    });

    it('diziyi birleştirir', () => {
      expect(String(html`${[1, 2, 3].map(n => html`<i>${n}</i>`)}`))
        .toBe('<i>1</i><i>2</i><i>3</i>');
    });
  });

  describe('Şablon — yardımcılar', () => {

    it('when yanlışta boş, doğruda parça verir', () => {
      expect(String(when(false, () => html`<b>x</b>`))).toBe('');
      expect(String(when(true, () => html`<b>x</b>`))).toBe('<b>x</b>');
    });

    it('cls yanlış değerleri ELER', () => {
      expect(cls('card', false && 'x', null, undefined, 'is-open'))
        .toBe('card is-open');
    });

    it('attrs true/false/null kurallarını uygular', () => {
      /* `disabled:true` → `disabled`; `hidden:false` ve `title:null`
         hiç yazılmaz. `hidden="false"` yazmak, öğeyi GİZLERDİ. */
      expect(String(attrs({ id:'a', disabled:true, hidden:false, title:null })))
        .toBe('id="a" disabled');
    });

    it('attrs değerleri de kaçırır', () => {
      expect(String(attrs({ title:'a"b' }))).toContain('&quot;');
    });

    it('map boş listede boş döner', () => {
      expect(String(map([], x => html`<i>${x}</i>`))).toBe('');
    });
  });

  describe('Bileşenler — sözleşme', () => {

    it('Card başlığı ve gövdeyi yazar, başlıksız da çizilir', () => {
      const a = String(K.Card({ title:'Başlık', body:'gövde' }));
      expect(a).toContain('Başlık');
      expect(a).toContain('gövde');
      expect(String(K.Card({ body:'yalnız gövde' }))).toContain('yalnız gövde');
    });

    it('Card başlığı da KAÇIRILIR', () => {
      expect(String(K.Card({ title:'<b>x</b>', body:'g' })).indexOf('<b>x')).toBe(-1);
    });

    it('Empty bir CÜMLE ister ve eylemi yanına alır', () => {
      /* Boş hâl bir çıkmaz değildir: nereye gidileceğini söyler. */
      const out = String(K.Empty({ text:'Henüz kayıt yok.',
        action:K.Button({ label:'Oturum ekle', act:'x' }) }));
      expect(out).toContain('Henüz kayıt yok.');
      expect(out).toContain('Oturum ekle');
    });

    it('Field etiketi girdiye BAĞLAR', () => {
      /* Etiketsiz alan ekran okuyucuda «metin alanı» diye okunur;
         `a11ycheck` bunu arıyor ve bileşen onu doğru üretmeli. */
      const out = String(K.Field({ label:'Süre', input:K.Input({ id:'x' }) }));
      expect(out).toContain('<label');
      expect(out).toContain('Süre');
    });

    it('Input null değeri NİTELİK OLARAK YAZMAZ', () => {
      /* `value="null"` yazan bir alan, kullanıcıya «null» gösterir. */
      const out = String(K.Input({ id:'a', value:null }));
      expect(out.indexOf('value=')).toBe(-1);
      expect(String(K.Input({ id:'a', value:0 }))).toContain('value="0"');
    });

    it('Checkbox eylemi GİRDİNİN üzerinde taşır', () => {
      /* Olay dağıtımı `closest("[data-act]")` ile çalışıyor; eylem
         etiketin üstünde olsaydı tıklamanın `checked` bilgisi
         okunamazdı. */
      const out = String(K.Checkbox({ label:'Seç', act:'tik', checked:true }));
      expect(out).toContain('type="checkbox"');
      expect(out.indexOf('data-act="tik"') > out.indexOf('<input')).toBeTruthy();
    });

    it('Table başlık ve satırları yazar, boş satırda patlamaz', () => {
      const out = String(K.Table({ headers:['A', 'B'], rows:[['1', '2']] }));
      expect(out).toContain('<th');
      expect(out).toContain('<td');
      expect(String(K.Table({ headers:['A'], rows:[] }))).toContain('<table');
    });

    it('Table hücresi de KAÇIRILIR', () => {
      expect(String(K.Table({ headers:['A'], rows:[['<b>x</b>']] }))
        .indexOf('<b>x')).toBe(-1);
    });

    it('Meter yüzdeyi yazar ve metni taşır', () => {
      const out = String(K.Meter({ label:'İlerleme', value:42, text:'42/100' }));
      expect(out).toContain('İlerleme');
      expect(out).toContain('42/100');
    });

    it('Badge ve Chip etiketsiz çağrılsa da çizilir', () => {
      expect(String(K.Badge({ label:'açık' }))).toContain('açık');
      expect(String(K.Chip({ label:'dil' }))).toContain('dil');
    });
  });

  describe('Bileşenler — erişilebilirlik sözleşmesi', () => {

    it('Segmented seçili düğmeyi aria-pressed ile SÖYLER', () => {
      /* Görsel «is-on» sınıfı yetmez: ekran okuyucu hangi seçeneğin
         açık olduğunu ancak nitelikten bilir. */
      const out = String(K.Segmented({ act:'x', value:'b', aria:'Kip',
        items:[{ value:'a', label:'A' }, { value:'b', label:'B' }] }));
      expect((out.match(/aria-pressed="true"/g) || []).length).toBe(1);
      expect(out).toContain('aria-label="Kip"');
    });

    it('Segmented SAYIYLA verilen değeri de eşleştirir', () => {
      /* `value:2` ile `it.value:'2'` aynı seçenektir; tür farkı
         yüzünden hiçbirinin seçili görünmemesi sessiz bir hatadır. */
      const out = String(K.Segmented({ act:'x', value:2,
        items:[{ value:1, label:'bir' }, { value:2, label:'iki' }] }));
      expect((out.match(/aria-pressed="true"/g) || []).length).toBe(1);
    });

    it('Subtabs sekme listesidir ve seçiliyi söyler', () => {
      const out = String(K.Subtabs({ act:'t', value:'b', aria:'Görünüm',
        items:[{ id:'a', label:'A' }, { id:'b', label:'B', count:3 }] }));
      expect(out).toContain('role="tablist"');
      expect((out.match(/aria-selected="true"/g) || []).length).toBe(1);
      /* Sayaç gizlenmez: hangi bölümde iş beklediği görünür. */
      expect(out).toContain('3');
    });

    it('Notice yalnız TEHLİKEDE role="alert" taşır', () => {
      /* Her bilgi kutusunu duyuru yapmak, gerçek uyarıyı sağırlaştırır. */
      expect(String(K.Notice({ tone:'danger', body:'x' }))).toContain('role="alert"');
      expect(String(K.Notice({ tone:'info', body:'x' })).indexOf('role="alert"')).toBe(-1);
      expect(String(K.Notice({ body:'x' })).indexOf('role="alert"')).toBe(-1);
    });

    it('Skeleton ve Busy BEKLEMEYİ duyurur', () => {
      /* «Bir şey oluyor» demek yetmez; ekran okuyucu için bunun bir
         niteliği olmalı, yoksa sayfa sessizce donmuş görünür. */
      const isk = String(K.Skeleton({ rows:2, label:'Model düşünüyor' }));
      expect(isk).toContain('aria-busy="true"');
      expect(isk).toContain('aria-live="polite"');
      expect(isk).toContain('Model düşünüyor');
      const bus = String(K.Busy('Kaydediliyor'));
      expect(bus).toContain('role="status"');
      expect(bus).toContain('Kaydediliyor');
    });

    it('Busy etiketsiz çağrılsa da bir CÜMLE yazar', () => {
      expect(String(K.Busy()).length > 20).toBeTruthy();
    });

    it('Collapsible varsayılan KAPALIDIR ve durumunu söyler', () => {
      /* Uzun referans metinleri varsayılan olarak kapalı tutulur;
         açık gelseydi ekran bir duvar olurdu. */
      expect(String(K.Collapsible({ title:'Kaynaklar', act:'x', body:'g' })))
        .toContain('aria-expanded="false"');
      expect(String(K.Collapsible({ title:'Kaynaklar', act:'x', open:true, body:'g' })))
        .toContain('aria-expanded="true"');
    });

    it('kapalı Collapsible GÖVDEYİ ÇİZMEZ', () => {
      /* Gizlemek yetmez: çizilen ama görünmeyen bir gövde hem DOM'u
         şişirir hem de arama sonucunda görünür. */
      expect(String(K.Collapsible({ title:'T', act:'x', body:'gizli-govde' }))
        .indexOf('gizli-govde')).toBe(-1);
    });

    it('PickCard basılı durumunu söyler', () => {
      expect(String(K.PickCard({ label:'Dil', on:true, act:'x' })))
        .toContain('aria-pressed="true"');
      expect(String(K.PickCard({ label:'Dil', act:'x' })))
        .toContain('aria-pressed="false"');
    });
  });

  describe('Bileşenler — defter kipi ve sayfalama', () => {

    it('Ledger içinde Card KUTU DEĞİL SATIR çizer', () => {
      /* Ekranlar tek satırlık bir değişiklikle defter düzenine geçsin
         diye: iki ayrı bileşen sözlüğü taşımak gerekmiyor. */
      const kutu = String(K.Card({ title:'Başlık', body:'g' }));
      const satir = String(K.Ledger(() => [K.Card({ title:'Başlık', body:'g' })]));
      expect(kutu).toContain('class="card');
      expect(satir).toContain('lrow');
      expect(satir).toContain('Başlık');
    });

    it('defter kipi SATIR BİTİNCE kapanır', () => {
      /* Bayrak senkron çağrı boyunca açık; sızarsa ondan sonraki her
         kart satır çizerdi ve sebebi hiçbir yerde görünmezdi. */
      String(K.Ledger(() => [K.Card({ title:'A', body:'g' })]));
      expect(String(K.Card({ title:'B', body:'g' }))).toContain('class="card');
    });

    it('tek sayfada Pager HİÇ çizilmez', () => {
      expect(String(K.Pager({ pages:1, page:1, total:4, act:'x' }))).toBe('');
      expect(String(K.Pager({ pages:3, page:2, total:70, act:'x' })))
        .toContain('2 / 3');
    });

    it('paginate sınırları AŞMAZ', () => {
      const l = Array.from({ length:7 }, (_, i) => i);
      expect(K.paginate(l, 99, 3).page).toBe(3);
      expect(K.paginate(l, -5, 3).page).toBe(1);
      expect(K.paginate(l, 1, 3).items.length).toBe(3);
      expect(K.paginate(l, 3, 3).items.length).toBe(1);
      /* Boş liste bir sayfadır, sıfır değil: «0 / 0» diye bir şey yok. */
      expect(K.paginate([], 1, 3).pages).toBe(1);
    });

    it('NextUp SAKİN DEĞİLKEN kutlama görseli çizmez', () => {
      /* Bekleyen iş varken kutlama yapmak, yapılmamış bir şeyi
         yapılmış göstermekti. */
      expect(String(K.NextUp({ icon:'check', sanat:'gorev', label:'L', title:'T' }))
        .indexOf('nextup__sanat')).toBe(-1);
      expect(String(K.NextUp({ icon:'check', calm:true, sanat:'gorev',
        label:'L', title:'T' }))).toContain('durum-tamamlandi-gorev');
    });

    it('NextUp görseli yüklenmezse DÜĞÜM KALKAR', () => {
      expect(String(K.NextUp({ icon:'check', calm:true, sanat:'gorev',
        label:'L', title:'T' }))).toContain('onerror="this.remove()"');
    });
  });

  describe('Parçalar — kesinlik ekrana böyle çıkar', () => {

    it('dört etiketin dördü de bir CÜMLE taşır', () => {
      ['measured', 'estimated', 'derived', 'missing'].forEach(k => {
        const c = ESP.CERTAINTY[k];
        expect(c).toBeTruthy();
        expect(c.label.length > 0).toBeTruthy();
        expect(c.note.length > 0).toBeTruthy();
        expect(String(P.cert(k))).toContain(c.label);
      });
    });

    it('BİLİNMEYEN etiket «veri yok»a düşer, uydurmaz', () => {
      expect(String(P.cert('yok-boyle-bir-sey')))
        .toContain(ESP.CERTAINTY.missing.label);
    });

    it('ESP «derived» der, sözleşme «computed» — ve karşılıkları AYNI', () => {
      /* ESP kendi içinde `derived` kimliğini kullanıyor; HKM sözleşmesi
         (`sync_engine.py`, `certainty.py`) `computed` bekliyor ve
         `core/beacon.js` eşlemeyi yapıyor. İki kimlik, TEK anlam:
         ekranda okunan kelime ayrışırsa kullanıcı aynı şeyi iki ayrı
         ad altında görür. */
      const ortak = window.LIFEOS.KESINLIK_ILE('computed');
      expect(ESP.CERTAINTY.derived.label).toBe(ortak.ad);
      ['measured', 'estimated', 'missing'].forEach(k => {
        expect(ESP.CERTAINTY[k].label).toBe(window.LIFEOS.KESINLIK_ILE(k).ad);
      });
    });

    it('ölçülmemiş değer SIFIR DEĞİL «veri yok» çizer', () => {
      /* Bu deponun en çok tekrarlanan kuralı ve arayüz katmanındaki
         karşılığı tam burası: `measure(null)` bir sayı yazmaz. */
      const bos = String(P.measure(null, 'dk', 'measured'));
      expect(bos).toContain(ESP.CERTAINTY.missing.label);
      expect(bos.indexOf('measure--none') >= 0).toBeTruthy();

      /* «missing» etiketi gelirse değer VARSA BİLE yazılmaz. */
      expect(String(P.measure(42, 'dk', 'missing')))
        .toContain(ESP.CERTAINTY.missing.label);
    });

    it('SIFIR bir ölçümdür ve yazılır', () => {
      /* «Bugün 0 dakika çalıştım» ölçülmüş bir gerçektir; «veri yok»
         değildir. İkisini aynı çizen bir ekran kuralı bozar. */
      const s = String(P.measure(0, 'dk', 'measured'));
      expect(s.indexOf('measure--none')).toBe(-1);
      expect(s).toContain(ESP.CERTAINTY.measured.label);
    });
  });

  describe('Arayüz — ikon ve grafikler', () => {

    it('BİLİNMEYEN ikon adı sessizce bir SVG verir, patlamaz', () => {
      /* Ekranlar ikon adını elle yazıyor; bir yazım hatası bütün
         satırı düşürmemeli. */
      const out = UI.icon('yok-boyle-bir-ikon');
      expect(out.indexOf('<svg')).toBe(0);
      expect(out).toContain('</svg>');
    });

    it('ikon sınıfı verilince niteliğe yazılır', () => {
      expect(UI.icon('info', 'ico--sm')).toContain('class="ico--sm"');
    });

    it('VERİSİZ grafik SIFIR ÇİZMEZ, sebebini söyler', () => {
      /* En sinsi doktrin ihlali burada olurdu: boş bir seriyi düz bir
         sıfır çizgisi olarak çizmek, «hiç çalışmadın» demektir — oysa
         doğru cümle «henüz veri yok». */
      const bos = UI.lineChart([{ data:[] }]);
      expect(bos.indexOf('<svg')).toBe(-1);
      expect(bos).toContain('veri yok');

      /* Yalnız null taşıyan seri de boştur. */
      expect(UI.lineChart([{ data:[null, null] }])).toContain('veri yok');
    });

    it('veri VARSA grafik çizilir ve erişilebilir ad taşır', () => {
      const out = UI.lineChart([{ data:[1, 2, 3] }], { title:'Süre' });
      expect(out.indexOf('<svg')).toBe(0);
      expect(out).toContain('role="img"');
      expect(out).toContain('Süre');
    });

    it('grafik başlığı da KAÇIRILIR', () => {
      expect(UI.lineChart([{ data:[1, 2] }], { title:'<b>x</b>' })
        .indexOf('<b>x')).toBe(-1);
    });

    it('sparkline tek noktayla da patlamaz', () => {
      expect(typeof UI.sparkline([5])).toBe('string');
      expect(typeof UI.sparkline([])).toBe('string');
    });
  });

  /* ---------------------------------------------------------------- */

  describe('Bileşen seti — ikinci tur: girdi, araç çubuğu ve düzen', () => {

    /* İlk turda bu on iki işlev dışarıda kalmıştı ve ölçüm söyledi:
       `Stat, IconButton, Toolbar, Mic, Drop, Textarea, Select, Grid,
       Span, Stack, Cols, Row`. Hepsi ekranda her gün görünüyor. */

    const t = x => String(x);

    it('Stat ilerleme çubuğunu 0–100 arasına KIRPAR', () => {
      /* Kırpılmasaydı %140 bir değer çubuğu kutusunun dışına taşardı. */
      expect(t(K.Stat({ label:'a', value:1, progress:140 }))).toContain('width:100%');
      expect(t(K.Stat({ label:'a', value:1, progress:-20 }))).toContain('width:0%');
    });

    it('Stat ilerleme VERİLMEZSE çubuk çizilmez', () => {
      /* Sıfır uzunlukta bir çubuk «hiç ilerlemedin» der; oysa doğru
         cümle «bu ölçünün bir hedefi yok». */
      expect(t(K.Stat({ label:'a', value:1 }))).toContain('stat__value');
      expect(t(K.Stat({ label:'a', value:1 })).indexOf('stat__bar')).toBe(-1);
    });

    it('Stat çubuğu okuyucuya görünmez — sayı zaten yanında', () => {
      expect(t(K.Stat({ label:'a', value:1, progress:50 }))).toContain('aria-hidden="true"');
    });

    it('Stat etiketi ve değeri KAÇIRILIR', () => {
      expect(t(K.Stat({ label:'<b>x</b>', value:'<i>y</i>' })).indexOf('<b>x')).toBe(-1);
    });

    it('IconButton bir AD taşır — yoksa okuyucu «düğme» der', () => {
      /* Simge düğmesinde yazı yoktur; adı yalnızca `aria-label` söyler. */
      expect(t(K.IconButton({ icon:'gear', label:'Ayarlar', act:'x' })))
        .toContain('aria-label="Ayarlar"');
      /* `aria` verilirse o kazanır: görünen ad ile okunan ad ayrılabilir. */
      expect(t(K.IconButton({ icon:'gear', label:'Ayarlar', aria:'Ayarları aç', act:'x' })))
        .toContain('aria-label="Ayarları aç"');
    });

    it('Toolbar eylem YOKSA boş bir kutu çizmez', () => {
      expect(t(K.Toolbar({ tabs:'T' })).indexOf('toolbar__actions')).toBe(-1);
      expect(t(K.Toolbar({ tabs:'T', actions:'A' }))).toContain('toolbar__actions');
    });

    it('Textarea satır sayısı verilmezse ÜÇ olur', () => {
      expect(t(K.Textarea({ id:'a' }))).toContain('rows="3"');
      expect(t(K.Textarea({ id:'a', rows:8 }))).toContain('rows="8"');
    });

    it('Textarea içeriği KAÇIRILIR — etiketin içi de HTML sayılır', () => {
      expect(t(K.Textarea({ value:'</textarea><script>x</script>' }))
        .indexOf('<script>')).toBe(-1);
    });

    it('Select etiketsiz bırakılmaz', () => {
      /* `aria` alanı Input'ta vardı, Select'te yoktu: etiketsiz bir
         seçici ekran okuyucuda yalnızca «açılır liste» diye anılır. */
      expect(t(K.Select({ options:['a'], aria:'Disiplin' })))
        .toContain('aria-label="Disiplin"');
    });

    it('Select seçili olanı işaretler — yalnız onu', () => {
      const h = t(K.Select({ options:['a', 'b', 'c'], value:'b' }));
      expect((h.match(/selected/g) || []).length).toBe(1);
      expect(h).toContain('<option value="b" selected>b</option>');
    });

    it('Select düz dizi de nesne dizisi de kabul eder', () => {
      expect(t(K.Select({ options:[{ value:1, label:'Bir' }], value:1 })))
        .toContain('<option value="1" selected>Bir</option>');
    });

    it('Select karşılaştırmayı METİN üzerinden yapar', () => {
      /* Sayı 1 ile metin "1" aynı seçenektir: `data-*` değerleri her
         zaman metin olarak geri döner. */
      expect(t(K.Select({ options:[{ value:1, label:'Bir' }], value:'1' })))
        .toContain('selected');
    });

    it('Drop ipucu verilmezse kendi cümlesini kurar', () => {
      expect(t(K.Drop({ act:'x', label:'Ses dosyası' })))
        .toContain('Dosyayı buraya bırak');
      expect(t(K.Drop({ act:'x', label:'a', hint:'Yalnız PDF' }))).toContain('Yalnız PDF');
    });

    it('Drop simgesi okuyucuya görünmez', () => {
      expect(t(K.Drop({ act:'x', label:'a' }))).toContain('aria-hidden="true"');
    });

    it('Mic DESTEKLENMİYORSA hiç çizilmez', () => {
      /* Basıldığında hiçbir şey yapmayan bir düğme, çalışmayan bir
         özelliği var gibi gösterir. */
      const gercek = ESP.Voice;
      try{
        ESP.Voice = { supported:() => false, isActive:() => false, activeTarget:() => null };
        expect(t(K.Mic({ target:'not' }))).toBe('');
        ESP.Voice = { supported:() => true, isActive:() => false, activeTarget:() => null };
        const h = t(K.Mic({ target:'not' }));
        expect(h).toContain('aria-pressed="false"');
        expect(h).toContain('Sesle yaz');
      }finally{ ESP.Voice = gercek; }
    });

    it('Mic DİNLERKEN basılı görünür ve başka cümle kurar', () => {
      const gercek = ESP.Voice;
      try{
        ESP.Voice = { supported:() => true, isActive:() => true,
          activeTarget:() => 'not' };
        expect(t(K.Mic({ target:'not' }))).toContain('aria-pressed="true"');
        expect(t(K.Mic({ target:'not' }))).toContain('Dinlemeyi durdur');
        /* Başka bir alan dinleniyorsa BU düğme basılı görünmez. */
        expect(t(K.Mic({ target:'baska' }))).toContain('aria-pressed="false"');
      }finally{ ESP.Voice = gercek; }
    });

    it('düzen yardımcıları gövdeyi yutmaz', () => {
      expect(t(K.Grid('x'))).toContain('x');
      expect(t(K.Span(6, 'x'))).toContain('span-6');
      expect(t(K.Cols(2, 'x'))).toContain('cols-2');
      expect(t(K.Stack('x'))).toContain('stack');
      expect(t(K.Stack('x', 'sm'))).toContain('stack-sm');
      expect(t(K.Row('x', { between:true }))).toContain('between');
      expect(t(K.Row('x')).indexOf('between')).toBe(-1);
    });
  });


  /* HATALAR D-9: nesne sabitinde iki kez yazılan anahtarın ilki ölüdür ve
     sessizce ezilir (tarayıcı hata vermez). Kaynak okunur, çift aranır. */
  describe('Kaynak — çift anahtar yok (D-9)', () => {
    async function ciftler(yol, bas){
      const src = await (await fetch(yol)).text();
      const i = src.indexOf(bas);
      const j = src.indexOf('\n  };', i);
      const blok = src.slice(i, j);
      const re = /^\s{4}(?:'([^']+)'|([A-Za-z_$][\w$]*))\s*:/gm;
      const adlar = [];
      let m;
      while((m = re.exec(blok))) adlar.push(m[1] || m[2]);
      return adlar.filter((k, n) => adlar.indexOf(k) !== n);
    }
    it('ikon tablosu içinde çift anahtar yok', async () => {
      const c = await ciftler('../js/core/ui.js', 'const PATHS = {');
      expect(c.join(', ')).toBe('');
    });
  });

  /* HATALAR D-9: nesne sabitinde iki kez yazılan anahtarın ilki ölüdür ve
     sessizce ezilir (tarayıcı hata vermez). Kaynak okunur, çift aranır. */
  describe('Kaynak — ipuçlarında çift anahtar yok (D-9)', () => {
    async function ciftler(yol, bas){
      const src = await (await fetch(yol)).text();
      const i = src.indexOf(bas);
      const j = src.indexOf('\n};', i);
      const blok = src.slice(i, j);
      const re = /^\s{2}(?:'([^']+)'|([A-Za-z_$][\w$]*))\s*:/gm;
      const adlar = [];
      let m;
      while((m = re.exec(blok))) adlar.push(m[1] || m[2]);
      return adlar.filter((k, n) => adlar.indexOf(k) !== n);
    }
    it('ipucu metinleri içinde çift anahtar yok', async () => {
      const c = await ciftler('../js/data/hints.js', 'ESP.HINTS = {');
      expect(c.join(', ')).toBe('');
    });
  });
})();
