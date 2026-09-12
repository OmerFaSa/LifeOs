/* Sablon katmani ve bilesen seti. */

(function(){
  const { describe, it, expect } = R.Test;
  const { html, raw, when, map, cls, attrs } = R.h;
  const C = R.C;

  describe('h.html kaçırma', function(){
    it('araya giren metni kaçırır', function(){
      expect(String(html`<p>${'<b>x</b>'}</p>`)).toBe('<p>&lt;b&gt;x&lt;/b&gt;</p>');
    });
    it('tırnakları kaçırır (attribute injection)', function(){
      expect(String(html`<i title="${'" onload="x'}">`)).toContain('&quot;');
    });
    it('raw işaretli değeri olduğu gibi bırakır', function(){
      expect(String(html`<p>${raw('<b>x</b>')}</p>`)).toBe('<p><b>x</b></p>');
    });
    it('iç içe html çağrısı kaçırılmaz', function(){
      expect(String(html`<ul>${html`<li>${'a&b'}</li>`}</ul>`)).toBe('<ul><li>a&amp;b</li></ul>');
    });
    it('dizileri birleştirir', function(){
      expect(String(html`${[1,2,3].map(n => html`<i>${n}</i>`)}`)).toBe('<i>1</i><i>2</i><i>3</i>');
    });
    it('null, undefined ve false hiçbir şey üretmez', function(){
      expect(String(html`a${null}${undefined}${false}b`)).toBe('ab');
    });
    it('sayıyı olduğu gibi yazar', function(){
      expect(String(html`${42}`)).toBe('42');
    });
    it('XSS denemesini etkisizleştirir', function(){
      const kotu = '<img src=x onerror=alert(1)>';
      expect(String(html`<div>${kotu}</div>`).indexOf('<img')).toBe(-1);
    });
  });

  describe('h yardımcıları', function(){
    it('when yanlışta boş döner', function(){
      expect(String(when(false, () => html`<b>x</b>`))).toBe('');
    });
    it('when doğruda parçayı üretir', function(){
      expect(String(when(true, () => html`<b>x</b>`))).toBe('<b>x</b>');
    });
    it('cls yanlış değerleri eler', function(){
      expect(cls('card', false && 'x', null, 'is-open')).toBe('card is-open');
    });
    it('attrs true/false/null kurallarını uygular', function(){
      const out = String(attrs({ id:'a', disabled:true, hidden:false, title:null }));
      expect(out).toBe('id="a" disabled');
    });
    it('attrs değerleri kaçırır', function(){
      expect(String(attrs({ title:'a"b' }))).toContain('&quot;');
    });
    it('map boş listede boş döner', function(){
      expect(String(map([], x => html`<i>${x}</i>`))).toBe('');
    });
  });

  describe('Bileşenler', function(){
    /* Card artık kutu değil defter satırı çizer. Testler bunu kilitler:
       başlık künye sütununa gider, gövde içerik sütununa. */
    it('Card başlığı künyeye, gövdeyi içerik sütununa koyar', function(){
      const out = String(C.Card({ title:'Başlık', body:html`<p>gövde</p>` }));
      expect(out).toContain('lrow__label');
      expect(out).toContain('lrow__main');
      expect(out).toContain('Başlık');
      expect(out).toContain('<p>gövde</p>');
    });
    it('Card kutu çizmez', function(){
      const out = String(C.Card({ title:'Başlık', body:'x' }));
      expect(out.indexOf('card__head')).toBe(-1);
      expect(out.indexOf('class="card')).toBe(-1);
    });
    /* Başlıksız kart künye sütunu AÇMAZ. Açsaydı 196 piksellik boş bir
       sol sütun kalır, içerik sağa sıkışırdı. */
    it('Card başlıksızken geniş satır olur', function(){
      const out = String(C.Card({ body:'x' }));
      expect(out).toContain('lrow--wide');
      /* Künye sütunu açılmaz: geniş satırda künye içeriğin ÜSTÜNDE ve
         satır içi durur, 196 piksellik boş bir sol sütun bırakmaz. */
      expect(out.indexOf('lrow__label')).toBe(-1);
    });
    it('Card alt bilgiyi içerik sütununda tutar', function(){
      const out = String(C.Card({ title:'B', body:'x', foot:'alt' }));
      expect(out.indexOf('card__foot')).toBeGreaterThan(out.indexOf('lrow__main'));
    });
    /* Kutu yalnız seçilebilir/yüzen şeylerde kalır. */
    it('flat kart kutu olarak kalır', function(){
      const out = String(C.Card({ flat:true, title:'B', body:'x' }));
      expect(out).toContain('card--flat');
      expect(out).toContain('card__head');
    });
    it('Box kutu çizer, düz istenmedikçe gölgeli kalır', function(){
      const out = String(C.Box({ body:'x' }));
      expect(out).toContain('class="card"');
      expect(out.indexOf('card--flat')).toBe(-1);
    });
    it('Box flat ile zeminli kutu olur', function(){
      expect(String(C.Box({ flat:true, body:'x' }))).toContain('card--flat');
    });
    /* Izgara defter olur: on iki sütunluk kart dizisi değil, tek sütun. */
    it('Grid defter kabı çizer', function(){
      expect(String(C.Grid('x'))).toContain('class="ledger"');
    });
    it('Span genişlik sınıfı yazmaz', function(){
      const out = String(C.Span(6, 'x'));
      expect(out).toContain('lband');
      expect(out.indexOf('span-6')).toBe(-1);
    });
    it('Card başlığı kaçırır', function(){
      expect(String(C.Card({ title:'<script>', body:'' })).indexOf('<script>')).toBe(-1);
    });
    /* Serit rengi KENDILIGINDEN gelmez. Bu uc test, %60'in altindaki her
       seridi kirmiziya boyayan eski davranisin geri gelmesini engeller. */
    it('Bar varsayılan olarak renksizdir', function(){
      expect(String(C.Bar({ value:33 })).indexOf('bar__fill--')).toBe(-1);
    });
    it('Bar boş ton geçildiğinde de renksiz kalır', function(){
      expect(String(C.Bar({ value:10, tone:'' })).indexOf('bar__fill--')).toBe(-1);
    });
    it('Bar auto ile eşik rengi alır', function(){
      expect(String(C.Bar({ value:33, auto:true }))).toContain('bar__fill--danger');
      expect(String(C.Bar({ value:70, auto:true }))).toContain('bar__fill--warn');
      expect(String(C.Bar({ value:90, auto:true })).indexOf('bar__fill--')).toBe(-1);
    });
    it('Bar açık ton her zaman kazanır', function(){
      expect(String(C.Bar({ value:95, tone:'danger', auto:true }))).toContain('bar__fill--danger');
    });
    it('Stat tone modifierı uygular', function(){
      expect(String(C.Stat({ label:'x', value:1, tone:'ok' }))).toContain('stat--ok');
    });
    it('Badge varsayılan muted', function(){
      expect(String(C.Badge({ label:'x' }))).toContain('badge--muted');
    });
    it('Button data niteliklerini geçirir', function(){
      const out = String(C.Button({ label:'Kaydet', act:'save', data:{ 'data-id':'7' } }));
      expect(out).toContain('data-act="save"');
      expect(out).toContain('data-id="7"');
    });
    it('Button disabled uygular', function(){
      expect(String(C.Button({ label:'x', disabled:true }))).toContain('disabled');
    });
    it('Bar değeri 0–100 arasına kırpar', function(){
      expect(String(C.Bar({ value:150 }))).toContain('width:100%');
      expect(String(C.Bar({ value:-5 }))).toContain('width:0%');
    });
    it('Segmented aktif değeri işaretler', function(){
      const out = String(C.Segmented({ items:[{value:'a',label:'A'},{value:'b',label:'B'}], value:'b', act:'x' }));
      expect(out).toContain('data-value="b"');
      expect(out).toContain('aria-pressed="true"');
    });
    it('Table başlık ve satırları çizer', function(){
      const out = String(C.Table({ headers:['Ad', { label:'Net', num:true }], rows:[['x', raw('<b>1</b>')]] }));
      expect(out).toContain('<th class="num">Net</th>');
      expect(out).toContain('<b>1</b>');
    });
    it('Notice danger rolü alert', function(){
      expect(String(C.Notice({ body:'x', tone:'danger' }))).toContain('role="alert"');
    });
    it('Skeleton erişilebilir yükleniyor durumu', function(){
      const out = String(C.Skeleton({ rows:2 }));
      expect(out).toContain('aria-busy="true"');
      expect(out.split('skeleton__row').length - 1).toBe(2);
    });
    it('Empty metin ve eylem alır', function(){
      const out = String(C.Empty({ text:'yok', action:C.Button({ label:'Ekle' }) }));
      expect(out).toContain('yok');
      expect(out).toContain('Ekle');
    });
    it('Select seçili değeri işaretler', function(){
      const out = String(C.Select({ options:[{value:'a',label:'A'},{value:'b',label:'B'}], value:'a' }));
      expect(out).toContain('<option value="a" selected>A</option>');
    });
    it('Checkbox işaretliyken is-done sınıfı alır', function(){
      expect(String(C.Checkbox({ label:'x', checked:true }))).toContain('is-done');
    });
    it('NextUp sakin varyantı', function(){
      expect(String(C.NextUp({ icon:'check', label:'l', title:'t', calm:true }))).toContain('nextup--calm');
    });
    it('Collapsible kapalıyken gövdeyi çizmez', function(){
      const out = String(C.Collapsible({ title:'x', act:'t', open:false, body:html`<p>gizli</p>` }));
      expect(out.indexOf('gizli')).toBe(-1);
      expect(out).toContain('aria-expanded="false"');
    });
  });

  /* Eski UI.stat/badge/notice/table köprüsü kaldırıldı: bileşenler tek yerde (R.C).
     UI yalnızca veriye bağlı parçaları ve grafik/katman işlerini tutar. */
  describe('UI yüzeyi', function(){
    it('eski bileşen köprüsü kaldırıldı', function(){
      ['stat','badge','notice','table','field','input','chip','empty','meter','select','checkbox','textarea']
        .forEach(k => expect(R.UI[k]).toBeUndefined());
    });
    it('veriye bağlı parçalar UI’da kalır', function(){
      expect(typeof R.UI.icon).toBe('function');
      expect(typeof R.UI.tagDot).toBe('function');
      expect(typeof R.UI.certainty).toBe('function');
      expect(typeof R.UI.rail).toBe('function');
    });
    it('certainty rozeti etiketi taşır', function(){
      const key = Object.keys(R.CERTAINTY)[0];
      expect(R.UI.certainty(key)).toContain(R.CERTAINTY[key].label);
    });
    it('tagDot bilinmeyen etikette de çizer', function(){
      expect(R.UI.tagDot('YOK')).toContain('tagdot');
    });
    it('Table ham HTML hücresini olduğu gibi bırakır', function(){
      const out = String(R.C.Table({ headers:['A'], rows:[[R.h.raw('<b>1</b>')]] }));
      expect(out).toContain('<b>1</b>');
    });
    it('Notice başlığı taşır', function(){
      expect(String(R.C.Notice({ body:'gövde', tone:'warn', title:'Başlık' }))).toContain('Başlık');
    });
  });
})();
