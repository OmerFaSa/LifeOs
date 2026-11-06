/* Sepet — Modül 4'ün ekranı.

   Üç sekme:
     Sepet   haftalık alışveriş, maliyet ve besin kapsaması
     İkame   eşdeğer ucuz muadiller — neyi koruyup neyi kaybettiğiyle
     Fiyat   kendi fişinden fiyat girme (tahmini ezer)

   Ekranın etik kuralı görünürdür: tahmin fiyatı her yerde «tahmin» rozetiyle
   durur ve hesabın yüzde kaçının tahmine dayandığı yazılır. */
window.LIFEOS.PARCA.yazilar({
  'spi.basket.bu-hesabin':'Bu hesabın %',
  'spi.basket.uygulama-market-taramaz-gerc':'Uygulama market taramaz; gerçeğe yaklaşmak için kendi fişindeki fiyatı gir.',
  'spi.basket.sepet-bos':'Sepet boş.',
  'spi.basket.karsilanmayan-oge':'Karşılanmayan öğe',
  'spi.basket.sepetteki-gidalar-hanenin-ha':'Sepetteki gıdalar hanenin haftalık besin hedeflerini karşılıyor.',
  'spi.basket.sepetteki-kalemler-icin-tani':'Sepetteki kalemler için tanımlı bir ikame yok. ',
  'spi.basket.somon-badem-ceviz-dana-eti':'Somon, badem, ceviz, dana eti ve süzme yoğurt gibi kalemlerde öneri çıkar.',
  'spi.basket.bu-tablo-butce-ile-saglik':'Bu tablo bütçe ile sağlık hedefini aynı yerde buluşturur: ',
  'spi.basket.cizgi-aylik-sinir':'Çizgi = aylık sınır · aşım yalnız çizgide',
  'spi.basket.talep-sinirin':'Talep sınırın ',
  'spi.basket.siralama-geregi-once-guvenli':'Sıralama gereği önce güvenlik ve tahlil korunur; kısıntı ',
  'spi.basket.talep-aylik-sinirin-icinde':'Talep aylık sınırın içinde.',
  'spi.basket.bu-uc-sayi-yalniz-bu':'Bu üç sayı yalnız bu cihazda tutulur ve ',
  'spi.basket.fis-okumak-icin-hkm':'Fiş okumak için HKM › Modeller’de «SPİ · Görsel» (ya da King) için görüntü okuyan bir model ',
  'spi.basket.fisi-buraya-birak-ya-da':'Fişi buraya bırak ya da seçmek için tıkla',
  'spi.basket.okunan-fiyat-kilogram-basina':'Okunan fiyat kilogram başınadır. Fişte toplam ',
  'spi.basket.son-gunlerde-yedigin-her-sey':'Son günlerde yediğin her şey sepette yeterli miktarda var.',
  'spi.basket.secilenlerin-tutari':'Seçilenlerin tutarı ',
  'spi.basket.bu-bolum-su-an-cizilemedi':'Bu bölüm şu an çizilemedi; verin yerinde duruyor.',
  'spi.basket.fis-okunuyor':'Fiş okunuyor',
  'spi.basket.sepete-eklendi':'Sepete eklendi',
  'spi.basket.sepetten-cikarildi':'Sepetten çıkarıldı',
  'spi.basket.sinir-asildiginda-sistem-sag':'Sınır aşıldığında sistem sağlık hedefini indirmez; ',
  'spi.basket.fiyat-kaldirildi':'Fiyat kaldırıldı',
  'spi.basket.fiyat-kaydedildi-olculdu':'Fiyat kaydedildi · ölçüldü',
  'spi.basket.butce-icin-henuz-veri-yok':'Bütçe için henüz veri yok.',
  'spi.basket.talep-aylik-sinirin-ustunde':'Talep aylık sınırın üstünde.',
  'spi.basket.aylik-talep':'Aylık talep ',
  'spi.basket.butce-tek-basina-uretilmez-n':'Bütçe tek başına üretilmez: Nesrin gıdayı, Kerem testi, ',
  'spi.basket.baris-ekipmani-ister-sedef-t':'Barış ekipmanı ister; Sedef toplar.',
});


window.SP = window.SP || {};
SP.Screens = SP.Screens || {};
window.LIFEOS.PARCA.yazilar({
  'spi.basket.butce':'Aylık',
  'spi.basket.sepet':'Sepet',
  'spi.basket.i-kame':'Daha ucuzu',
  'spi.basket.fiyat':'Fiyatlar',
  'spi.basket.haftalik-sepet':'Haftalık sepet',
  'spi.basket.toplam':'Toplam',
  'spi.basket.kisi-basi':'Kişi başı',
  'spi.basket.tahmin-payi':'Tahmin payı',
  'spi.basket.haftalik-sinir':'Haftalık sınır',
  'spi.basket.kalem-ekle':'Kalem ekle',
  'spi.basket.ogunlerimden-liste':'Öğünlerimden liste',
  'spi.basket.kalemler':'Kalemler',
  'spi.basket.maliyete-gore-sirali':'Maliyete göre sıralı',
  'spi.basket.cikar':'Çıkar',
  'spi.basket.besin-kapsamasi':'Besin kapsaması',
  'spi.basket.kalori':'Kalori',
  'spi.basket.protein':'Protein',
  'spi.basket.lif':'Lif',
  'spi.basket.sepet-2':'Sepet ',
  'spi.basket.kapsiyor':'kapsıyor',
  'spi.basket.kapsama':'Kapsama',
  'spi.basket.en-ucuz-kaynak':'En ucuz kaynak',
  'spi.basket.i-kame-firsatlari':'Daha ucuz seçenekler',
  'spi.basket.sepetindeki-kalemler-icin':'Sepetindeki kalemler için',
  'spi.basket.dusen':'Düşen:',
  'spi.basket.degistir':'Değiştir',
  'spi.basket.oneri-neyi-korudugunu-ve-ney':'Öneri neyi koruduğunu ve neyi kaybettiğini birlikte söyler. «Ucuz olan iyidir» diye bir kural yoktur.',
  'spi.basket.toplu-alim':'Toplu alım',
  'spi.basket.bozulmadan-saklanan-kalemler':'Bozulmadan saklanan kalemler',
  'spi.basket.en-az':'En az',
  'spi.basket.tasarruf':'Tasarruf',
  'spi.basket.yavas-tuketim':'yavaş tüketim',
  'spi.basket.sepette-yok':'sepette yok',
  'spi.basket.yalnizca-kuru-bakliyat-yag-v':'Yalnızca kuru bakliyat, yağ ve konserve gibi kalemler listede. Taze üründe toplu alım tasarruf değil israf üretir.',
  'spi.basket.fiyat-listesi':'Fiyat listesi',
  'spi.basket.kendi-fisindeki-fiyat-tahmin':'Kendi fişindeki fiyat tahmini ezer',
  'spi.basket.fiyat-listesinde-ara':'Fiyat listesinde ara',
  'spi.basket.sepete-kalem-ekle':'Sepete kalem ekle',
  'spi.basket.ara-mercimek-tavuk-zeytinyag':'Ara: mercimek, tavuk, zeytinyağı…',
  'spi.basket.kapat':'Kapat',
  'spi.basket.haftalik-miktar':'Haftalık miktar',
  'spi.basket.kilogram':'Kilogram',
  'spi.basket.vazgec':'Vazgeç',
  'spi.basket.kaydet':'Kaydet',
  'spi.basket.en-ucuz':'En ucuz ',
  'spi.basket.bir-birim-oge-basina-maliyet':'Bir birim öğe başına maliyet',
  'spi.basket.birim-basi':'Birim başı',
  'spi.basket.100-g-da':'100 g\'da',
  'spi.basket.harcama-seritleri':'Harcama şeritleri',
  'spi.basket.talep-tablosu':'Aylık ihtiyaç',
  'spi.basket.sepet-ilk-adim':'Haftalık alışverişini yaz; maliyet ve besin kapsaması buradan hesaplanır.',
  'spi.basket.veri-yok':'veri yok',
  'spi.basket.aylik-ilk-adim':'Haftalık sepetini yazınca gıdanın aylık karşılığı burada toplanır.',
  'spi.basket.sepete-git':'Sepete git',
  'spi.basket.tl':'TL',
  'spi.basket.kalem-fiyati-bilinmedigi-ici':'kalem fiyatı bilinmediği için toplamın dışında.',
  'spi.basket.butun-kalemlerin-karsiligi-h':'Bütün kalemlerin karşılığı hesaplandı.',
  'spi.basket.aylik-sinir':'Aylık sınır',
  'spi.basket.sinir':'Sınır',
  'spi.basket.tl-kalemlerin-karsiligi-bili':'TL. Kalemlerin karşılığı bilinmiyor; sınıra göre durum hesaplanmadı.',
  'spi.basket.kullanilan':'Kullanılan',
  'spi.basket.sedef-in-notu':'Sedef\'in notu',
  'spi.basket.hazir-kurallar':'hazır kurallar',
  'spi.basket.sedef-e-sor':'Sedef\'e sor',
  'spi.basket.butcenin-yeri':'Bütçenin yeri',
  'spi.basket.fiyatlar-nereden-geliyor':'Fiyatlar nereden geliyor?',
  'spi.basket.baslangicta-tohum-fiyati-tah':'Başlangıçta tohum fiyatı «tahmin»; fişten girdiğin fiyat «ölçüldü» olur.',
  'spi.basket.fiyatlar-internetten-cekilme':'Fiyatlar internetten çekilmez — bu uygulama çevrimdışı çalışır ve sağlık verisi dışarı çıkmaz. Fişten girdiğin her fiyat tohumun üstüne yazılır.',
  'spi.basket.fiyat-gir':'Fiyat gir',
  'spi.basket.sinir-ve-ucretler':'Sınır ve ücretler',
  'spi.basket.girilmeyen-alan-sinir-yok-de':'Girilmeyen alan «sınır yok» demektir, sıfır değil',
  'spi.basket.haftalik-sepet-siniri-tl':'Haftalık sepet sınırı (TL)',
  'spi.basket.aylik-toplam-saglik-butcesi':'Aylık toplam sağlık bütçesi (TL)',
  'spi.basket.tek-panel-test-ucreti-tl':'Tek panel test ücreti (TL)',
  'spi.basket.fis-oku':'Fiş oku',
  'spi.basket.fiyatlar-tahminden-olcume-ge':'Fiyatlar tahminden ölçüme geçer',
  'spi.basket.model-bagli-degil':'Model bağlı değil.',
  'spi.basket.fis-fotografi-ya-da-metni':'Fiş fotoğrafı ya da metni',
  'spi.basket.oku':'Oku',
  'spi.basket.fisten-okunanlar':'Fişten okunanlar',
  'spi.basket.tahmini-eziyor':'tahmini eziyor',
  'spi.basket.fisten':'fişten',
  'spi.basket.eslesmeyenler':'Eşleşmeyenler:',
  'spi.basket.fiyatlari-kaydet':'Fiyatları kaydet',
  'spi.basket.ogunlerimden-alisveris-liste':'Öğünlerimden alışveriş listesi',
  'spi.basket.son-yedi-gunun':'Son yedi günün ',
  'spi.basket.haftada':'· haftada',
  'spi.basket.kalem-sepette-zaten-yeterli':'kalem sepette zaten yeterli.',
  'spi.basket.ogun-kalemi-gida-listesinde':'öğün kalemi gıda listesinde yok (silinmiş gıda); listeye girmedi.',
  'spi.basket.liste-yalniz-senin-ogunlerin':'Liste yalnız senin öğünlerinden; hanenin diğer',
  'spi.basket.kisisinin-payi-eklenmedi':'kişisinin payı eklenmedi.',
  'spi.basket.sepete-ekle':'Sepete ekle',
  'spi.basket.kural-sirasi':'Kural sırası',
  'spi.basket.sepet-bolumleri':'Sepet bölümleri',
  'spi.basket.kaydedildi':'Kaydedildi',
  'spi.basket.hanedeki-kisi-sayisi':'Hanedeki kişi sayısı',
  'spi.basket.sepette-degistirildi':'Sepette değiştirildi',
  'spi.basket.finans':'Finans',
  'spi.basket.aylik-talep-tl':'aylık talep (TL)',
  'spi.basket.aylik-sinir-tl':'aylık sınır (TL)',
  'spi.basket.haftalik-sepet-tl':'haftalık sepet (TL)',
  'spi.basket.fiyati-yok':'fiyatı yok',
});
window.LIFEOS.PARCA.sayfa({ id:'basket', modul:'spi', king:{ sira:60, ad:'Bütçe', es:['bütçe', 'market', 'sepet'] }, cekmece:'calisma', ad:'Bütçe', sira:50 });

SP.Screens.basket = (function(){
  const U = SP.U, M = SP.Model, S = SP.S, UI = SP.UI;
  const { html, raw, when, map } = SP.h;
  const K = SP.C, P = SP.Parts;

  const TABS = [
    { id:'sepet', label:yz('spi.basket.sepet'), icon:'wallet' },
    { id:'butce', label:yz('spi.basket.butce'), icon:'target' },
    { id:'ikame', label:yz('spi.basket.i-kame'), icon:'refresh' },
    { id:'fiyat', label:yz('spi.basket.fiyat'), icon:'list' },
  ];

  /* ---------------------------------------------------------------- sepet */

  function totalCard(){
    const b = SP.Money.basketTotal();
    return K.Card({
      title:yz('spi.basket.haftalik-sepet'), hint:'price-estimate',
      sub:b.rows.length + ' kalem' + (b.householdSize > 1 ? ' · ' + b.householdSize + ' kişilik hane' : ''),
      badge:b.limit != null
        ? K.Badge({ label:b.over ? 'sınır aşıldı' : 'sınırın altında', tone:b.over ? 'danger' : 'ok' })
        : null,
      body:html`
        <div class="cols-3">
          ${K.Stat({ label:yz('spi.basket.toplam'), value:U.fmtNum(Math.round(b.total)), unit:'TL' })}
          ${K.Stat({ label:yz('spi.basket.kisi-basi'), value:U.fmtNum(Math.round(b.perPerson)), unit:'TL' })}
          ${K.Stat({ label:yz('spi.basket.tahmin-payi'), value:'%' + b.estimate.pct,
            note:b.estimate.pct >= 50 ? 'kendi fişini gir' : 'çoğu ölçülü' })}
        </div>
        ${when(b.limit != null, () => html`<div class="mt-12">
          ${K.Meter({ label:yz('spi.basket.haftalik-sinir'), value:Math.min(100, b.pct || 0),
            text:U.fmtNum(Math.round(b.total)) + ' / ' + U.fmtNum(b.limit) + ' TL',
            tone:b.over ? 'danger' : '' })}</div>`)}
        ${when(b.estimate.pct >= 50 && b.rows.length, () => K.Notice({ tone:'warn', class:'mt-12',
          body:yz('spi.basket.bu-hesabin') + b.estimate.pct + '\'i başlangıç tahminiyle yapıldı. '
            + yz('spi.basket.uygulama-market-taramaz-gerc') }))}`,
      foot:html`${K.Button({ label:yz('spi.basket.ogunlerimden-liste'), size:'sm', act:'open-ogun-liste' })}
        ${K.Button({ label:yz('spi.basket.haftalik-sinir'), size:'sm', act:'open-limit' })}`,
    });
  }

  function itemsCard(){
    const b = SP.Money.basketTotal();
    if(!b.rows.length){
      return K.Card({ title:yz('spi.basket.kalemler'),
        body:P.empty(yz('spi.basket.sepet-bos'), yz('spi.basket.kalem-ekle'), 'open-add', null, true) });
    }
    return K.Card({
      title:yz('spi.basket.kalemler'), sub:yz('spi.basket.maliyete-gore-sirali'),
      body:html`${map(b.rows, r => html`
        <div class="pricerow">
          <span><b class="small">${r.food.name}</b>
            <span class="tiny dim"> · ${U.fmtNet(r.item.kg)} kg</span>
            ${P.cert(r.price.cert)}</span>
          <span class="pricerow__tl num">${r.cost == null ? '—' : U.fmtNum(Math.round(r.cost)) + ' TL'}</span>
          ${K.IconButton({ icon:'trash', size:'sm', plain:true, aria:yz('spi.basket.cikar'),
            act:'del-item', data:{ 'data-id':r.item.foodId } })}
        </div>`)}`,
    });
  }

  function coverageCard(){
    const c = SP.Money.basketCoverage();
    if(!c.ok) return K.Card({ title:yz('spi.basket.besin-kapsamasi'),
      body:K.Notice({ tone:'info', body:c.note }) });

    const macro = [
      { label:yz('spi.basket.kalori'), o:c.kcal, unit:'kcal' },
      { label:yz('spi.basket.protein'), o:c.protein, unit:'g' },
      { label:yz('spi.basket.lif'), o:c.fiber, unit:'g' },
    ];
    return K.Card({
      title:yz('spi.basket.besin-kapsamasi'),
      sub:yz('spi.basket.sepet-2') + c.householdSize + ' kişinin 7 günlük ihtiyacına göre',
      badge:c.gaps.length ? K.Badge({ label:c.gaps.length + ' öğe eksik', tone:'warn' })
        : K.Badge({ label:yz('spi.basket.kapsiyor'), tone:'ok' }),
      body:html`
        <div class="nutgrid">
          ${map(macro, m => P.nutCell({ label:m.label, got:m.o.got, target:m.o.need, unit:m.unit }))}
        </div>
        ${when(c.gaps.length, () => html`<div class="mt-12">
          ${K.Table({ tight:true, headers:[yz('spi.basket.karsilanmayan-oge'), { label:yz('spi.basket.kapsama'), num:true }, ''],
            rows:c.gaps.map(id => [
              SP.NUTRI_BY_ID[id] ? SP.NUTRI_BY_ID[id].name : id,
              '%' + c.micro[id].pct,
              K.Button({ label:yz('spi.basket.en-ucuz-kaynak'), size:'sm', act:'open-cheap', data:{ 'data-id':id } }),
            ]) })}</div>`)}
        ${when(!c.gaps.length, () => K.Notice({ tone:'ok', class:'mt-10',
          body:yz('spi.basket.sepetteki-gidalar-hanenin-ha') }))}`,
    });
  }

  /* ---------------------------------------------------------------- ikame */

  function swapCard(){
    const rows = SP.Money.swapOpportunities();
    if(!rows.length){
      return K.Card({ title:yz('spi.basket.i-kame-firsatlari'), hint:'substitute',
        body:K.Notice({ tone:'info', body:yz('spi.basket.sepetteki-kalemler-icin-tani')
          + yz('spi.basket.somon-badem-ceviz-dana-eti') }) });
    }
    return K.Card({
      title:yz('spi.basket.i-kame-firsatlari'), hint:'substitute',
      sub:yz('spi.basket.sepetindeki-kalemler-icin'),
      body:html`${map(rows, s => html`
        <div class="listitem">
          <div class="grow">
            <b class="small">${s.from.name} → ${s.to.name}</b>
            ${K.Badge({ label:U.fmtNum(Math.round(s.saveTotal)) + ' TL', tone:'ok' })}
            <div class="tiny dim mt-2">${s.sub.note}</div>
            <div class="tiny mt-2">
              <b>Korunan:</b> ${s.keeps.map(k => k.name).join(', ') || '—'}
              ${when(s.loses.length, () => html` · <b>${yz('spi.basket.dusen')}</b> ${s.loses.map(k => k.name).join(', ')}`)}
            </div>
          </div>
          ${K.Button({ label:yz('spi.basket.degistir'), size:'sm', act:'do-swap',
            data:{ 'data-from':s.from.id, 'data-to':s.to.id, 'data-kg':s.kg } })}
        </div>`)}`,
      foot:html`<span class="small dim">${yz('spi.basket.oneri-neyi-korudugunu-ve-ney')}</span>`,
    });
  }

  function bulkCard(){
    const rows = SP.Money.bulkOpportunities();
    return K.Card({
      title:yz('spi.basket.toplu-alim'), hint:'bulk',
      sub:yz('spi.basket.bozulmadan-saklanan-kalemler'),
      body:K.Table({ tight:true,
        headers:['Kalem', { label:yz('spi.basket.en-az'), num:true }, { label:yz('spi.basket.tasarruf'), num:true }, 'Durum'],
        rows:rows.map(b => [
          html`<b>${b.food.name}</b> <span class="tiny dim">${b.item.note}</span>`,
          U.fmtNet(b.item.minKg) + ' kg',
          U.fmtNum(Math.round(b.saveTl)) + ' TL',
          b.worth ? K.Badge({ label:U.fmtNet(b.weeksToUse) + ' haftada biter', tone:'ok' })
            : b.weeklyKg ? K.Badge({ label:yz('spi.basket.yavas-tuketim'), tone:'warn' })
            : K.Badge({ label:yz('spi.basket.sepette-yok'), tone:'muted' }),
        ]) }),
      foot:html`<span class="small dim">${yz('spi.basket.yalnizca-kuru-bakliyat-yag-v')}</span>`,
    });
  }

  /* ---------------------------------------------------------------- fiyat */

  function priceCard(){
    const q = S.ui.foodQuery;
    let list = SP.FOODS.filter(f => SP.PRICE_SEED.perKg[f.id] != null || S.prices[f.id]);
    if(q) list = list.filter(f => U.norm(f.name).indexOf(U.norm(q)) >= 0);
    const page = K.paginate(list, S.ui.foodPage, 20);

    return K.Card({
      title:yz('spi.basket.fiyat-listesi'), hint:'price-estimate',
      sub:yz('spi.basket.kendi-fisindeki-fiyat-tahmin'),
      actions:K.Input({ id:'price-q', value:q, size:'sm', placeholder:'Ara…', aria:yz('spi.basket.fiyat-listesinde-ara'),
        change:'price-query', data:{ 'data-debounce':'200' } }),
      body:html`
        ${K.Notice({ tone:'info',
          body:SP.PRICE_SEED.note + ' Başlangıç tahminleri ' + SP.PRICE_SEED.seededAt
            + ' ayına ait; üzerinden ' + (SP.Money.monthsSince(SP.PRICE_SEED.seededAt) || 0) + ' ay geçti.' })}
        <div class="mt-12">${map(page.items, f => {
          const p = SP.Money.priceOf(f.id);
          return html`<div class="pricerow">
            <span><b class="small">${f.name}</b> ${P.cert(p.cert)}
              ${when(p.source === 'seed', () => html`<span class="tiny dim"> · ${p.age.label}</span>`)}</span>
            <span class="pricerow__tl num">${p.tl == null ? '—' : U.fmtNum(p.tl) + ' TL/kg'}</span>
            ${K.Input({ type:'number', numeric:true, size:'sm', step:'1', min:0,
              placeholder:'TL/kg', aria:f.name + ' fiyatı, TL/kg', change:'set-price', data:{ 'data-id':f.id } })}
          </div>`;
        })}</div>
        ${K.Pager({ page:page.page, pages:page.pages, total:page.total, act:'price-page' })}`,
    });
  }

  /* -------------------------------------------------------------- sheet'ler */

  function addSheet(){
    const q = S.ui.foodQuery;
    let list = SP.FOODS;
    if(q) list = list.filter(f => U.norm(f.name + ' ' + (f.aliases || []).join(' ')).indexOf(U.norm(q)) >= 0);
    const page = K.paginate(list, S.ui.foodPage, 12);

    UI.sheet({
      title:yz('spi.basket.sepete-kalem-ekle'), wide:true,
      body:String(K.Stack([
        K.Input({ id:'add-q', value:q, placeholder:yz('spi.basket.ara-mercimek-tavuk-zeytinyag'),
          change:'add-query', data:{ 'data-debounce':'200' } }),
        html`<div class="stack-xs">${map(page.items, f => {
          const p = SP.Money.priceOf(f.id);
          return html`<button class="foodrow" data-act="pick-basket" data-id="${f.id}">
            <span class="foodrow__name">${f.name}</span>
            <span class="foodrow__meta num">${p.tl == null ? 'fiyat yok' : U.fmtNum(p.tl) + ' TL/kg'}</span>
          </button>`;
        })}</div>`,
        K.Pager({ page:page.page, pages:page.pages, total:page.total, act:'add-page' }),
      ])),
      footer:String(K.Button({ label:yz('spi.basket.kapat'), act:'sheet-close' })),
      noFocus:true,
    });
  }

  function kgSheet(foodId){
    const f = SP.FOOD_BY_ID[foodId];
    const cur = ((S.basket.items || []).find(x => x.foodId === foodId) || {}).kg;
    UI.sheet({
      title:f.name, subtitle:yz('spi.basket.haftalik-miktar'),
      body:String(K.Field({ label:yz('spi.basket.kilogram'),
        input:K.Input({ id:'basket-kg', type:'number', numeric:true, step:'0.1', min:0,
          value:cur == null ? '' : cur, placeholder:'1,5' }) })),
      footer:String(html`${K.Button({ label:yz('spi.basket.vazgec'), act:'sheet-close' })}
        ${K.Button({ label:yz('spi.basket.kaydet'), tone:'primary', act:'save-kg', data:{ 'data-id':foodId } })}`),
    });
  }

  function cheapSheet(nutrientId){
    const n = SP.NUTRI_BY_ID[nutrientId];
    const rows = SP.Money.costPerNutrient(nutrientId, 10);
    UI.sheet({
      title:yz('spi.basket.en-ucuz') + n.name.toLocaleLowerCase('tr-TR') + ' kaynağı', wide:true,
      subtitle:yz('spi.basket.bir-birim-oge-basina-maliyet'),
      body:String(K.Stack([
        K.Table({ tight:true,
          headers:['Gıda', { label:yz('spi.basket.birim-basi'), num:true }, { label:yz('spi.basket.100-g-da'), num:true }, 'Fiyat'],
          rows:rows.map(r => [r.food.name, U.fmtNet(r.tlPerUnit) + ' TL',
            U.fmtNum(U.round(r.per100, 2)) + ' ' + n.unit,
            html`${U.fmtNum(r.price.tl)} TL/kg ${P.cert(r.cert)}`]) }),
        K.Notice({ tone:'info', body:yz('spi.basket.bu-tablo-butce-ile-saglik')
          + 'hedefi indirmeden, aynı öğeyi daha ucuz taşıyan gıdayı gösterir.' }),
      ])),
      footer:String(K.Button({ label:yz('spi.basket.kapat'), act:'sheet-close' })),
      noFocus:true,
    });
  }

  /* -------------------------------------------------------------- bütçe

     Sedef'in sayfası. Bütçe tek başına üretilmez: diğer üç koçun talebi
     toplanır (SP.Money.budget). Fiyatı bilinmeyen kalem sıfır sayılmaz —
     "veri yok" olarak durur ve toplamın dışında kalır. */

  /* 079 HARCAMA ŞERİTLERİ (vitrin): talep tablosunun kalemleri aylık
     sınıra karşı; çizgi = sınır, aşım yalnız çizginin rengiyle. Tutarı
     bilinmeyen kalem «—» (toplama da girmez). Sınır yoksa kart yok. */
  function seritKarti(b){
    const V = (window.LIFEOS || {}).VITRIN;
    if(!V || b.limit == null) return '';
    const ic = V.harcamaSeritleri({ limit:b.limit, satirlar:b.rows.map(r => ({ ad:r.label, tutar:r.monthly })),
      not:yz('spi.basket.cizgi-aylik-sinir') });
    return ic ? K.Kutu({ ad:yz('spi.basket.harcama-seritleri'), yuva:'aylık', class:'vkutu', govde:raw(ic) }) : '';
  }

  function budgetView(){
    const b = SP.Money.budget();
    const st = SP.Money.status();
    /* Hiçbir kalemin karşılığı bilinmiyorsa toplam «0 TL» değil bilinmiyor;
       sınıra göre durum da hesaplanamaz (AGENTS §1.2). */
    const bilinen = b.rows.some(r => r.monthly != null);

    return html`
      <section class="sect">
        <!-- Ikinci baslik yok: bolumun adi («Bütçe») ve sayfa basinin cumlesi
             ayni seyi zaten soyluyor; ayni aciklama iki kez ust uste
             yazilmaz (kullanici, 2026-09-25: «ne oldugu anlasilmiyor»). -->
        <div class="grid">
          <div class="span-7"><div class="stack">
            ${seritKarti(b)}
            ${K.Card({
              title:yz('spi.basket.talep-tablosu'), hint:'budget-rank',
              badge:K.Badge({ label:bilinen ? U.fmtNum(b.total) + ' TL / ay' : 'veri yok',
                tone:!bilinen ? 'muted' : b.over ? 'warn' : 'info' }),
              /* Hiçbir kalem bilinmiyorsa satırlardan önce ilk adım: toplam Sepet'ten başlar (yeni kart değil, açık kart sınırı). */
              body:html`${when(!bilinen, () => html`<div class="mb-16">
                <p class="small">${yz('spi.basket.aylik-ilk-adim')}</p>
                <div class="row wrap gap-8 mt-8">${K.Button({ label:yz('spi.basket.sepete-git'), tone:'primary',
                  act:'basket-tab', data:{ 'data-tab':'sepet' } })}</div></div>`)}${map(b.rows, r => html`
                <div class="demand">
                  <div class="demand__who">
                    ${P.avatar(r.agent, 'sm')}
                    <div class="minw0">
                      <b class="small">${r.label}</b>
                      <div class="tiny dim">${r.detail}</div>
                    </div>
                  </div>
                  <div class="demand__cost num">
                    ${r.monthly == null ? html`<span class="dim">${yz('spi.basket.veri-yok')}</span>`
                      : html`${U.fmtNum(r.monthly)}<small>${yz('spi.basket.tl')}</small>`}
                  </div>
                  <div class="demand__cert">${when(r.monthly != null, () => P.cert(r.cert))}</div>
                  ${when(r.note, () => html`<p class="demand__note">${r.note}</p>`)}
                </div>`)}`,
              foot:html`
                ${when(b.unknown, () => html`<span class="small">
                  <b>${b.unknown}</b> ${yz('spi.basket.kalem-fiyati-bilinmedigi-ici')}</span>`)}
                ${when(!b.unknown, () => html`<span class="small dim">
                  ${yz('spi.basket.butun-kalemlerin-karsiligi-h')}</span>`)}`,
            })}

            ${when(b.limit != null && !bilinen, () => K.Card({
              title:yz('spi.basket.aylik-sinir'),
              body:html`<p class="small">${yz('spi.basket.sinir')} ${U.fmtNum(b.limit)} ${yz('spi.basket.tl-kalemlerin-karsiligi-bili')}</p>` }))}
            ${when(b.limit != null && bilinen, () => K.Card({
              title:yz('spi.basket.aylik-sinir'),
              body:html`${K.Meter({ label:yz('spi.basket.kullanilan'),
                value:Math.min(100, b.pct || 0),
                text:U.fmtNum(b.total) + ' / ' + U.fmtNum(b.limit) + ' TL',
                tone:b.over ? 'danger' : '' })}
                ${K.Notice({ tone:b.over ? 'warn' : 'ok', class:'mt-12',
                  body:b.over
                    ? yz('spi.basket.talep-sinirin') + U.fmtNum(b.total - b.limit) + ' TL üstünde. '
                      + yz('spi.basket.siralama-geregi-once-guvenli')
                      + 'gıda kaleminde ikame ile yapılır.'
                    : yz('spi.basket.talep-aylik-sinirin-icinde') })}` }))}
          </div></div>

          <div class="span-5"><div class="stack">
            ${K.Card({ title:yz('spi.basket.sedef-in-notu'), hint:'budget-rank',
              badge:K.Badge({ label:yz('spi.basket.hazir-kurallar'), tone:'muted', icon:false }),
              body:html`<p class="small">${st.text}</p>`,
              foot:K.Button({ label:yz('spi.basket.sedef-e-sor'), size:'sm',
                act:'ask-agent', data:{ 'data-agent':'money' } }) })}

            ${K.Card({ title:yz('spi.basket.butcenin-yeri'), hint:'budget-rank',
              body:html`<p class="small">${SP.PRECEDENCE[5].note}</p>
                <div class="mt-10">${K.Table({ tight:true, headers:['Sıra', 'Kural'],
                  rows:SP.PRECEDENCE.map(p => [String(p.rank), p.label]) })}</div>` })}

            ${K.Card({ title:yz('spi.basket.fiyatlar-nereden-geliyor'), hint:'price-estimate',
              body:K.Ayrinti({ ozet:yz('spi.basket.baslangicta-tohum-fiyati-tah'),
                govde:html`<p>${yz('spi.basket.fiyatlar-internetten-cekilme')}</p>` }),
              foot:K.Button({ label:yz('spi.basket.fiyat-gir'), size:'sm',
                act:'basket-tab', data:{ 'data-tab':'fiyat' } }) })}
          </div></div>
        </div>
      </section>`;
  }

  function limitsSheet(){
    const bk = S.basket || {};
    UI.sheet({
      title:yz('spi.basket.sinir-ve-ucretler'),
      subtitle:yz('spi.basket.girilmeyen-alan-sinir-yok-de'),
      body:String(K.Stack([
        K.Field({ label:yz('spi.basket.haftalik-sepet-siniri-tl'),
          input:K.Input({ id:'lim-week', type:'number', numeric:true, step:'any',
            value:bk.weeklyLimit == null ? '' : bk.weeklyLimit }) }),
        K.Field({ label:yz('spi.basket.aylik-toplam-saglik-butcesi'),
          input:K.Input({ id:'lim-month', type:'number', numeric:true, step:'any',
            value:bk.monthlyLimit == null ? '' : bk.monthlyLimit }) }),
        K.Field({ label:yz('spi.basket.tek-panel-test-ucreti-tl'),
          hint:'ölçüm borcu olan panellerin maliyeti bundan hesaplanır',
          input:K.Input({ id:'lim-test', type:'number', numeric:true, step:'any',
            value:bk.testFee == null ? '' : bk.testFee }) }),
        K.Notice({ tone:'info', body:yz('spi.basket.bu-uc-sayi-yalniz-bu')
          + 'hiçbir modele gönderilmez.' }),
      ])),
      footer:String(html`${K.Button({ label:yz('spi.basket.vazgec'), act:'sheet-close' })}
        ${K.Button({ label:yz('spi.basket.kaydet'), tone:'primary', act:'save-limits' })}`),
    });
  }

  /* ---------------------------------------------------------------- fiş

     Fiş okuma, fiyat tablosunun çürümesini çözer: tohum tahminler
     kullanıcının gerçek fiyatıyla değişir ve «ölçüldü» olur. Sistem
     market taramaz; fiyat hep kullanıcının elindeki belgeden gelir. */

  let receiptFile = null;
  let receiptRes = null;

  function receiptSheet(){
    UI.sheet({
      title:yz('spi.basket.fis-oku'), subtitle:yz('spi.basket.fiyatlar-tahminden-olcume-ge'),
      wide:true,
      body:String(K.Stack([
        when(!SP.Extract.modelReady(), () => K.Notice({ tone:'warn',
          title:yz('spi.basket.model-bagli-degil'),
          body:yz('spi.basket.fis-okumak-icin-hkm')
            + 'ata. Fiyatları Fiyat sayfasından elle de girebilirsin.' })),
        K.Drop({ act:'receipt-file', label:yz('spi.basket.fis-fotografi-ya-da-metni'), kamera:{},
          icon:'file', accept:'image/*,.txt,.csv',
          hint:yz('spi.basket.fisi-buraya-birak-ya-da') }),
        html`<div id="receipt-name" class="small dim">${receiptFile ? receiptFile.name : ''}</div>`,
        K.Notice({ tone:'info', body:yz('spi.basket.okunan-fiyat-kilogram-basina')
          + 'fiyat ve ağırlık varsa kilogram fiyatı hesaplanır.' }),
      ])),
      footer:String(html`${K.Button({ label:yz('spi.basket.vazgec'), act:'sheet-close' })}
        ${K.Button({ label:yz('spi.basket.oku'), tone:'primary', act:'run-receipt',
          disabled:!receiptFile || !SP.Extract.modelReady() })}`),
      noFocus:true,
    });
  }

  function receiptPreviewSheet(res){
    UI.sheet({
      title:yz('spi.basket.fisten-okunanlar'), subtitle:res.note, wide:true,
      body:String(K.Stack([
        when(res.rows.length, () => html`<div>${map(res.rows, (r, i) => html`
          <div class="${r.skip ? 'pasterow pasterow--off' : 'pasterow'}">
            ${K.Checkbox({ label:'', checked:!r.skip, act:'toggle-receipt-row',
              data:{ 'data-i':i } })}
            <span><b class="small">${r.food.name}</b>
              ${when(SP.Money.priceOf(r.food.id).cert === 'estimated',
                () => html` <span class="tiny dim">${yz('spi.basket.tahmini-eziyor')}</span>`)}</span>
            <span class="pasterow__val num">${U.fmtNum(r.tl)} TL/kg</span>
            <span class="pasterow__src">${yz('spi.basket.fisten')}</span>
          </div>`)}</div>`),
        when(!res.rows.length, () => K.Notice({ tone:'warn', body:res.note })),
        when(res.unmatched.length, () => K.Notice({ tone:'info', title:yz('spi.basket.eslesmeyenler'),
          body:res.unmatched.map(x => x.line).join(' · ')
            + ' — bu ürünler gıda listemizde yok.' })),
      ])),
      footer:String(html`${K.Button({ label:yz('spi.basket.vazgec'), act:'sheet-close' })}
        ${K.Button({ label:yz('spi.basket.fiyatlari-kaydet'), tone:'primary', act:'save-receipt',
          disabled:!res.rows.filter(r => !r.skip).length })}`),
      noFocus:true,
    });
  }

  /* Fikir 30: son yedi günün öğünlerinden eksik kalemler. Sepete yazmak
     orta aksiyondur: önce bu önizleme, tek onay, sonra «Geri al». */
  let listeRes = null;

  function ogunListeSheet(){
    const l = listeRes;
    if(!l.ok){
      UI.sheet({ title:yz('spi.basket.ogunlerimden-alisveris-liste'),
        body:String(K.Notice({ tone:'info', body:l.note })),
        footer:String(K.Button({ label:yz('spi.basket.kapat'), act:'sheet-close' })) });
      return;
    }
    const secili = l.satirlar.filter(r => !r.skip);
    const tl = U.sum(secili.map(r => r.cost || 0));
    const size = (S.prefs && S.prefs.householdSize) || 1;
    UI.sheet({
      title:yz('spi.basket.ogunlerimden-alisveris-liste'), wide:true,
      subtitle:yz('spi.basket.son-yedi-gunun') + l.kayitliGun + ' günü kayıtlı; haftalık miktar '
        + (l.cert === 'derived' ? 'hesaplandı' : 'kayıtlı günlerden tahmin'),
      body:String(K.Stack([
        when(l.satirlar.length, () => html`<div>${map(l.satirlar, (r, i) => html`
          <div class="${r.skip ? 'pasterow pasterow--off' : 'pasterow'}">
            ${K.Checkbox({ label:'', checked:!r.skip, act:'toggle-liste-row', data:{ 'data-i':i } })}
            <span><b class="small">${r.food.name}</b>
              <span class="tiny dim"> ${yz('spi.basket.haftada')} ${U.fmtNet(r.kg)} kg${r.sepette
                ? ', sepette ' + U.fmtNet(r.sepette) + ' kg' : ''}</span></span>
            <span class="pasterow__val num">+${U.fmtNet(r.eksik)} kg</span>
            <span class="pasterow__src">${r.cost == null ? 'fiyat yok'
              : U.fmtNum(Math.round(r.cost)) + ' TL · ' + SP.CERTAINTY[r.price.cert].label}</span>
          </div>`)}</div>`),
        when(!l.satirlar.length, () => K.Notice({ tone:'ok',
          body:yz('spi.basket.son-gunlerde-yedigin-her-sey') })),
        when(l.satirlar.length, () => K.Notice({ tone:'info',
          body:yz('spi.basket.secilenlerin-tutari') + U.fmtNum(Math.round(tl)) + ' TL'
            + (l.fiyatsiz ? ' (' + l.fiyatsiz + ' kalemin fiyatı yok, tutara girmedi)' : '') + '.' })),
        when(l.yeterli, () => html`<p class="tiny dim">${l.yeterli} ${yz('spi.basket.kalem-sepette-zaten-yeterli')}</p>`),
        when(l.bilinmeyen, () => html`<p class="tiny dim">${l.bilinmeyen} ${yz('spi.basket.ogun-kalemi-gida-listesinde')}</p>`),
        when(size > 1, () => html`<p class="tiny dim">${yz('spi.basket.liste-yalniz-senin-ogunlerin')} ${size - 1} ${yz('spi.basket.kisisinin-payi-eklenmedi')}</p>`),
      ])),
      footer:String(html`${K.Button({ label:yz('spi.basket.vazgec'), act:'sheet-close' })}
        ${K.Button({ label:yz('spi.basket.sepete-ekle'), tone:'primary', act:'save-ogun-liste',
          disabled:!secili.length })}`),
      noFocus:true,
    });
  }

  /* --------------------------------------------------------------- ekran */

  /* Sekme yok (EKIP-PLANI §1.2): dört bölüm alt alta; bölüm çubuğu kaydırır,
     Sepet'in kalem sayısı çubukta rozet. Bir bölüm çizilemezse yalnız o
     bölüm sakin bir notla düşer. */
  /* Düğme sayfa başında değil, işinin bölümünde: üçü birden her bölümde duruyordu. */
  const ustDugme = d => html`<div class="row wrap gap-8 mb-16">${d}</div>`;
  const BODIES = {
    butce:() => html`${ustDugme(K.Button({ label:yz('spi.basket.sinir-ve-ucretler'), size:'sm', act:'open-limits' }))}${budgetView()}
      <div class="mt-24">${raw(UI.rail(['budget-rank', 'price-estimate', 'certainty']))}</div>`,
    /* Sepet boşken 0 TL ve kapsama kartı değil, tek ilk adım (eksik veri sıfır değildir). */
    sepet:() => html`${((S.basket && S.basket.items) || []).length
        ? html`${ustDugme(K.Button({ label:yz('spi.basket.kalem-ekle'), icon:'plus', size:'sm', tone:'primary', act:'open-add' }))}${K.Ledger(() => [totalCard(), itemsCard(), coverageCard()])}`
        : K.Ledger(() => [K.Card({ title:yz('spi.basket.haftalik-sepet'), hint:'price-estimate',
            body:html`<p class="small">${yz('spi.basket.sepet-ilk-adim')}</p>
              <div class="row wrap gap-8 mt-8">
                ${K.Button({ label:yz('spi.basket.kalem-ekle'), icon:'plus', tone:'primary', act:'open-add' })}
                ${K.Button({ label:yz('spi.basket.ogunlerimden-liste'), act:'open-ogun-liste' })}
                ${K.Button({ label:yz('spi.basket.haftalik-sinir'), tone:'ghost', act:'open-limit' })}
              </div>` })])}
      <div class="mt-24">${raw(UI.rail(['price-estimate', 'substitute', 'bulk', 'budget-rank']))}</div>`,
    ikame:() => html`${K.Ledger(() => [swapCard(), bulkCard(),
        /* Bütçe bölümündeki «Bütçenin yeri» ile aynı tablo: aynı başlık aynı
           gizleme anahtarı olurdu ve bu kopya yönetilemezdi. Gizli. */
        K.Entry({ label:yz('spi.basket.kural-sirasi'), hint:'budget-rank', meta:'öncelik sırası',
          body:K.Table({ tight:true, headers:['Sıra', 'Kural'],
            rows:SP.PRECEDENCE.map(p => [String(p.rank), p.label]) }) }),
      ])}
      <div class="mt-24">${raw(UI.rail(['substitute', 'bulk', 'budget-rank']))}</div>`,
    fiyat:() => html`${ustDugme(K.Button({ label:yz('spi.basket.fis-oku'), size:'sm', icon:'camera', act:'open-receipt' }))}${K.Ledger(() => [priceCard()])}
      <div class="mt-24">${raw(UI.rail(['price-estimate', 'certainty']))}</div>`,
  };

  function govde(t){
    try{ return BODIES[t.id](); }
    catch(e){
      console.error('Sepet bölümü çizilemedi (' + t.id + '):', e);
      return K.Notice({ tone:'warn', body:yz('spi.basket.bu-bolum-su-an-cizilemedi') });
    }
  }

  TABS.forEach(t => LIFEOS.PARCA.blok({ id:'basket.' + t.id, sayfa:'basket', yer:t.id, ad:t.label, ciz:() => govde(t) }));
  async function render(){
    const n = ((S.basket && S.basket.items) || []).length;
    return String(K.SayfaBolumleri({ act:'basket-tab', aria:yz('spi.basket.sepet-bolumleri'),
      bolumler:TABS.map(t => ({ id:t.id, ad:t.label, govde:LIFEOS.PARCA.yer('basket', t.id, K),
        sayi:t.id === 'sepet' && n ? n : null })) }));
  }

  /* Başka yerden istenen bölüm (ofis kartının «İkame tablosu» gibi) çizimden
     sonra görünür yapılır; istek bir kez kullanılır. */
  function afterRender(){
    const t = S.ui.basketTab;
    S.ui.basketTab = null;
    if(t && t !== TABS[0].id && TABS.some(x => x.id === t)) K.bolumeGit(t);
  }

  const handle = {
    async 'open-receipt'(){ receiptFile = null; receiptRes = null; receiptSheet(); },
    async 'run-receipt'(){
      if(!receiptFile) return;
      receiptRes = await UI.withBusy(yz('spi.basket.fis-okunuyor'),
        'fiyatlar «ölçüldü» olarak kaydedilecek',
        () => SP.Extract.fromReceipt(receiptFile));
      receiptPreviewSheet(receiptRes);
    },
    async 'toggle-receipt-row'(el){
      const i = Number(el.dataset.i);
      if(!receiptRes || !receiptRes.rows[i]) return;
      receiptRes.rows[i].skip = !el.checked;
      receiptPreviewSheet(receiptRes);
    },
    async 'save-receipt'(){
      if(!receiptRes) return;
      const rows = receiptRes.rows.filter(r => !r.skip);
      if(!rows.length) return;
      for(const r of rows) await M.setPrice(r.food.id, r.tl);
      receiptRes = null; receiptFile = null;
      UI.closeSheet();
      UI.toast(rows.length + ' fiyat kaydedildi · ölçüldü');
      SP.App.render();
    },
    async 'open-ogun-liste'(){ listeRes = SP.Money.ogundenListe(); ogunListeSheet(); },
    async 'toggle-liste-row'(el){
      const r = listeRes && listeRes.satirlar[Number(el.dataset.i)];
      if(!r) return;
      r.skip = !el.checked;
      ogunListeSheet();
    },
    async 'save-ogun-liste'(){
      if(!listeRes || !listeRes.ok) return;
      const rows = listeRes.satirlar.filter(r => !r.skip);
      if(!rows.length) return;
      const onceki = ((S.basket && S.basket.items) || []).map(x => Object.assign({}, x));
      for(const r of rows) await M.setBasketItem(r.food.id, U.round(r.sepette + r.eksik, 2));
      listeRes = null;
      UI.closeSheet();
      UI.toast(rows.length + ' kalem sepete eklendi', { undo:async () => {
        await M.saveBasket({ items:onceki });
        SP.App.render();
      } });
      SP.App.render();
    },
    async 'open-limits'(){ limitsSheet(); },
    async 'save-limits'(){
      const num = id => {
        const el = document.getElementById(id);
        if(!el || String(el.value).trim() === '') return null;
        const n = Number(String(el.value).replace(',', '.'));
        return isFinite(n) ? n : null;
      };
      await M.saveBasket({ weeklyLimit:num('lim-week'), monthlyLimit:num('lim-month'),
        testFee:num('lim-test') });
      UI.closeSheet();
      UI.toast(yz('spi.basket.kaydedildi'));
      SP.App.render();
    },
    async 'basket-tab'(el){ K.bolumeGit(el.dataset.tab); },
    async 'open-add'(){ S.ui.foodPage = 1; addSheet(); },
    async 'add-page'(el){ S.ui.foodPage = Number(el.dataset.page); addSheet(); },
    async 'pick-basket'(el){ kgSheet(el.dataset.id); },
    async 'save-kg'(el){
      const input = document.getElementById('basket-kg');
      const kg = input ? Number(String(input.value).replace(',', '.')) : 0;
      await M.setBasketItem(el.dataset.id, kg);
      UI.closeSheet();
      UI.toast(kg > 0 ? yz('spi.basket.sepete-eklendi') : yz('spi.basket.sepetten-cikarildi'));
      SP.App.render();
    },
    async 'del-item'(el){
      await M.setBasketItem(el.dataset.id, 0);
      SP.App.render();
    },
    async 'open-limit'(){
      UI.sheet({
        title:yz('spi.basket.haftalik-sinir'),
        body:String(K.Stack([
          K.Field({ label:yz('spi.basket.haftalik-sepet-siniri-tl'),
            input:K.Input({ id:'limit-tl', type:'number', numeric:true, step:'50', min:0,
              value:S.basket.weeklyLimit == null ? '' : S.basket.weeklyLimit }) }),
          K.Field({ label:yz('spi.basket.hanedeki-kisi-sayisi'),
            input:K.Input({ id:'limit-size', type:'number', numeric:true, step:'1', min:1,
              value:(S.prefs && S.prefs.householdSize) || 1 }) }),
          K.Notice({ tone:'info', body:yz('spi.basket.sinir-asildiginda-sistem-sag')
            + 'ikame önerisi çıkarır. Bütçe öncelik sırasında en sonda gelir.' }),
        ])),
        footer:String(html`${K.Button({ label:yz('spi.basket.vazgec'), act:'sheet-close' })}
          ${K.Button({ label:yz('spi.basket.kaydet'), tone:'primary', act:'save-limit' })}`),
      });
    },
    async 'save-limit'(){
      const tl = document.getElementById('limit-tl');
      const size = document.getElementById('limit-size');
      await M.saveBasket({ weeklyLimit:tl && tl.value.trim() !== '' ? Number(tl.value) : null });
      await M.savePrefs({ householdSize:size ? Math.max(1, Number(size.value) || 1) : 1 });
      UI.closeSheet();
      UI.toast(yz('spi.basket.kaydedildi'));
      SP.App.render();
    },
    async 'do-swap'(el){
      const kg = Number(el.dataset.kg);
      await M.setBasketItem(el.dataset.from, 0);
      await M.setBasketItem(el.dataset.to, kg);
      UI.toast(yz('spi.basket.sepette-degistirildi'));
      SP.App.render();
    },
    async 'open-cheap'(el){ cheapSheet(el.dataset.id); },
    async 'price-page'(el){ S.ui.foodPage = Number(el.dataset.page); SP.App.render(); },
  };

  const change = {
    async 'receipt-file'(el){
      receiptFile = (el.files && el.files[0]) || null;
      const n = document.getElementById('receipt-name');
      if(n) n.textContent = receiptFile ? receiptFile.name : '';
      const run = document.querySelector('[data-act="run-receipt"]');
      if(run) run.disabled = !receiptFile || !SP.Extract.modelReady();
    },
    async 'set-price'(el){
      const v = String(el.value).trim();
      await M.setPrice(el.dataset.id, v === '' ? null : Number(v.replace(',', '.')));
      UI.toast(v === '' ? yz('spi.basket.fiyat-kaldirildi') : yz('spi.basket.fiyat-kaydedildi-olculdu'));
      SP.App.render();
    },
    async 'price-query'(el){ S.ui.foodQuery = el.value; S.ui.foodPage = 1; SP.App.render(); },
    async 'add-query'(el){ S.ui.foodQuery = el.value; S.ui.foodPage = 1; addSheet(); },
  };

  return {
    id:'basket',
    /* iPhone Faz 2b: iş talep tablosu ve Sedef'in notu (sınır varsa sınır
       kartı); harcama şeritleri aynı kalemleri çizgiyle yeniden çizer, şerit.
       Bütçenin yeri ve fiyat kaynağı gizli (app.js SADE_GIZLI). */
    kucukVarsayilan:['harcama-şeritleri'],
    title:yz('spi.basket.finans'),
    headline(){
      const b = SP.Money.budget();
      if(!b.rows.filter(r => r.monthly).length) return yz('spi.basket.butce-icin-henuz-veri-yok');
      if(b.over) return yz('spi.basket.talep-aylik-sinirin-ustunde');
      if(b.limit != null) return yz('spi.basket.talep-aylik-sinirin-icinde');
      return yz('spi.basket.aylik-talep') + U.fmtNum(b.total) + ' TL.';
    },
    lede(){
      const b = SP.Money.budget();
      const est = SP.Money.estimateShare();
      const base = yz('spi.basket.butce-tek-basina-uretilmez-n')
        + yz('spi.basket.baris-ekipmani-ister-sedef-t');
      if(b.unknown) return base + ' Şu an ' + b.unknown + ' kalemin fiyatı bilinmiyor '
        + 've toplamın dışında duruyor — sıfır sayılmadı.';
      return base + (est.pct ? ' Hesabın %' + est.pct + '\u2019i tahmin fiyatıyla.' : '');
    },
    stats(){
      const b = SP.Money.budget();
      const w = SP.Money.basketTotal();
      const out = [{ value:U.fmtNum(b.total), label:yz('spi.basket.aylik-talep-tl') }];
      if(b.limit != null) out.push({ value:U.fmtNum(b.limit), label:yz('spi.basket.aylik-sinir-tl') });
      if(w.rows.length) out.push({ value:U.fmtNum(Math.round(w.total)), label:yz('spi.basket.haftalik-sepet-tl') });
      if(b.unknown) out.push({ value:b.unknown, label:yz('spi.basket.fiyati-yok') });
      return out;
    },
    subtitle(){
      const st = SP.Money.status();
      return st.text;
    },
    actions(){ return ''; },
    render, afterRender, handle, change,
  };
})();
