/* Deneme — kayit, net hesabi, analiz protokolu ve hata olaylari.

   Yazim bicimi: STIL.md. Ekran string birlestirme kullanmaz; metin h`` icinde
   otomatik kacirilir, yapisal parcalar C.* bilesenlerinden gelir. */

window.R = window.R || {};
R.Screens = R.Screens || {};
window.LIFEOS.PARCA.komut({ modul:'ays', sira:90, group:'Git', label:'Deneme', icon:'exam', route:'exams', run(){ R.App.go('exams'); } });
window.LIFEOS.PARCA.komut({ modul:'ays', sira:210, group:'Kayıt', label:'Deneme ekle', icon:'plus', hint:'Cmt', run(){ R.App.go('exams'); setTimeout(()=>R.Screens.exams.handle['new-exam']({dataset:{}}), 60); } });
window.LIFEOS.PARCA.komut({ modul:'ays', sira:240, group:'Kayıt', label:'Süreli deneme oturumu', icon:'clock', run(){ R.App.go('exams'); setTimeout(()=>R.Screens.exams.handle['run-open']({dataset:{}}), 60); } });
window.LIFEOS.PARCA.yazilar({
  'ays.exams.tumu':'Tümü',
  'ays.exams.tyt':'TYT',
  'ays.exams.ayt':'AYT',
  'ays.exams.analiz-tamam':'Analiz tamam',
  'ays.exams.analiz-borcu':'Analiz borcu',
  'ays.exams.analiz-bekliyor':'Analiz bekliyor',
  'ays.exams.simdi':'şimdi',
  'ays.exams.siralama':'Sıralama',
  'ays.exams.hedef-net':'Hedef net',
  'ays.exams.henuz-deneme-eklenmedi-cumar':'Henüz deneme eklenmedi. Cumartesi denemesi yalnız skor üretmez; bir sonraki haftanın ders dağılımını belirler.',
  'ays.exams.i-lk-denemeyi-ekle':'İlk denemeyi ekle',
  'ays.exams.deneme-ailesi':'Deneme ailesi',
  'ays.exams.deneme-hacmi':'Deneme hacmi',
  'ays.exams.plan-gerceklesen':'Plan / gerçekleşen',
  'ays.exams.yayin-merdiveni':'Yayın merdiveni',
  'ays.exams.zorluk-kademesi':'Zorluk kademesi',
  'ays.exams.net':'Net',
  'ays.exams.dogruluk':'Doğruluk',
  'ays.exams.etiket-yok':'etiket yok',
  'ays.exams.i-lke':'İlke:',
  'ays.exams.hatayi-duzenle':'hatayı düzenle',
  'ays.exams.anahtarla-tutuyor':'anahtarla tutuyor',
  'ays.exams.anahtarla-tutmuyor-guvenme':'anahtarla tutmuyor — güvenme',
  'ays.exams.karsilastirilamadi':'karşılaştırılamadı',
  'ays.exams.dogru':'doğru:',
  'ays.exams.hata-kaydinda':'hata kaydında',
  'ays.exams.hata-kaydina-ekle':'Hata kaydına ekle',
  'ays.exams.konuyu-ac':'Konuyu aç',
  'ays.exams.cozum':'Çözüm',
  'ays.exams.modelin-cevabi':'Modelin cevabı (',
  'ays.exams.anahtardaki':') anahtardaki',
  'ays.exams.sikkina-varmadi-ya-model-yan':'şıkkına varmadı. Ya model yanılıyor ya anahtar; bu çözümü doğru sanma.',
  'ays.exams.bu-soru-baska-bir-cihazda':'Bu soru başka bir cihazda çözüldü; çözüm orada duruyor.',
  'ays.exams.soru-analizi':'Soru analizi',
  'ays.exams.cevap-anahtariyla-soru-soru':'cevap anahtarıyla soru soru',
  'ays.exams.d':'D ·',
  'ays.exams.y':'Y ·',
  'ays.exams.kayitta':'· kayıtta',
  'ays.exams.cevap-anahtarindan-hesapland':'cevap anahtarından hesaplandı',
  'ays.exams.cevaplari-girilmeyen-testler':'Cevapları girilmeyen testler:',
  'ays.exams.kaydi-anahtara-gore-guncelle':'Kaydı anahtara göre güncelle',
  'ays.exams.guncellemeyi-geri-al':'Güncellemeyi geri al',
  'ays.exams.onceki-sayilar-sakli':'önceki sayılar saklı',
  'ays.exams.fotograftaki-soruyu-cozdurme':'Fotoğraftaki soruyu çözdürmek için görüntü okuyabilen bir model gerekir (Ayarlar › Model); fotoğraf ekleyip konuyu elle seçebilirsin.',
  'ays.exams.hepsini-hata-kaydina-ekle':'Hepsini hata kaydına ekle (',
  'ays.exams.yanlis-ya-da-bos-soru':'Yanlış ya da boş soru yok.',
  'ays.exams.cevap-anahtari':'Cevap anahtarı',
  'ays.exams.abcde-ya-da-1-a-2-c':'ABCDE… ya da 1-A 2-C 3-E …',
  'ays.exams.senin-cevaplarin':'Senin cevapların',
  'ays.exams.bos-biraktigin-soru-icin-nok':'boş bıraktığın soru için nokta (.)',
  'ays.exams.cevap-anahtari-ve-cevaplarin':'Cevap anahtarı ve cevapların',
  'ays.exams.vazgec':'Vazgeç',
  'ays.exams.kaydet':'Kaydet',
  'ays.exams.yayin-karnesi':'Yayın karnesi',
  'ays.exams.deneme':'deneme ·',
  'ays.exams.hata-kaydi':'hata kaydı (',
  'ays.exams.tanesinin-konusu-belli':'tanesinin konusu belli)',
  'ays.exams.en-cok-kacirdigin-konular':'En çok kaçırdığın konular',
  'ays.exams.hata-bu-yayindaki-hatalarini':'hata · bu yayındaki hatalarının %',
  'ays.exams.yalniz-yanlis-ve-bos-sorular':'Yalnız yanlış ve boş sorular kayda girdiği için «o konudan kaç soru soruldu» bilinmez; pay, hatalarının dağılımıdır.',
  'ays.exams.konu-karnesi-icin-bu-yayinda':'Konu karnesi için bu yayında konusu belli en az',
  'ays.exams.hata-gerekir':'hata gerekir.',
  'ays.exams.deneme-bulunamadi':'Deneme bulunamadı.',
  'ays.exams.denemelere-don':'Denemelere dön',
  'ays.exams.denemeler':'Denemeler',
  'ays.exams.denemeyi-sil':'denemeyi sil',
  'ays.exams.toplam-net':'toplam net',
  'ays.exams.hata-analizi':'Hata analizi',
  'ays.exams.hata-ekle':'Hata ekle',
  'ays.exams.henuz-hata-kaydedilmedi-her':'Henüz hata kaydedilmedi. Her yanlış ve boş için konu ve etiket girilir; yavaş sorular ayrıca işaretlenir.',
  'ays.exams.analiz-protokolu':'Analiz protokolü',
  'ays.exams.24-saat-icinde':'24 saat içinde',
  'ays.exams.analizi-tamamla':'Analizi tamamla',
  'ays.exams.sure-kaydi':'Süre kaydı',
  'ays.exams.test-basina-harcanan-dakika':'Test başına harcanan dakika',
  'ays.exams.kalan-toplam-sure':'kalan toplam süre',
  'ays.exams.soru-isaretlendi':'soru işaretlendi',
  'ays.exams.geri-al':'Geri al',
  'ays.exams.sonraki-test':'Sonraki test',
  'ays.exams.bitir':'Bitir',
  'ays.exams.testler':'Testler',
  'ays.exams.tiklayarak-gec-sure-o':'Tıklayarak geç — süre o teste yazılır',
  'ays.exams.nasil-kullanilir':'Nasıl kullanılır?',
  'ays.exams.son-isaretler':'Son işaretler',
  'ays.exams.soru':'. soru',
  'ays.exams.sn':'sn ·',
  'ays.exams.henuz-isaret-yok':'Henüz işaret yok.',
  'ays.exams.sureli-oturum':'Süreli oturum',
  'ays.exams.sinav-kosullarinda-prova-sur':'Sınav koşullarında prova — süre otomatik ölçülür',
  'ays.exams.sablon':'Şablon',
  'ays.exams.yayin':'Yayın',
  'ays.exams.or-345':'ör. 345',
  'ays.exams.baslat':'Başlat',
  'ays.exams.oturumu-bitir':'Oturumu bitir',
  'ays.exams.netleri-gir-sureler-zaten':'Netleri gir — süreler zaten ölçüldü',
  'ays.exams.toplam-sure':'Toplam süre',
  'ays.exams.sure-sapmasi':'Süre sapması',
  'ays.exams.i-saret':'İşaret',
  'ays.exams.plan':'· plan',
  'ays.exams.i-ptal-et':'İptal et',
  'ays.exams.tarih':'Tarih',
  'ays.exams.yayin-aile':'Yayın / aile',
  'ays.exams.or-345-bilgi-sarmal-endemik':'ör. 345, Bilgi Sarmal, Endemik',
  'ays.exams.toplam-sure-dk':'Toplam süre (dk)',
  'ays.exams.netini-kac-tahmin-ediyorsun':'Netini kaç tahmin ediyorsun? (isteğe bağlı)',
  'ays.exams.or-62':'ör. 62',
  'ays.exams.sonuc-kagidinin-fotografinda':'Sonuç kâğıdının fotoğrafından doldur',
  'ays.exams.deneme-ekle':'Deneme ekle',
  'ays.exams.hizli-kayit-hedef-60':'Hızlı kayıt — hedef 60 saniyenin altı',
  'ays.exams.test-sonuclari':'Test sonuçları',
  'ays.exams.test-adi':'test adı',
  'ays.exams.konu':'— konu —',
  'ays.exams.kimlik':'Kimlik',
  'ays.exams.test':'Test',
  'ays.exams.soru-no':'Soru no',
  'ays.exams.durum':'Durum',
  'ays.exams.ders-konu':'Ders – konu',
  'ays.exams.etiket-ve-kok-neden':'Etiket ve kök neden',
  'ays.exams.etiket':'Etiket',
  'ays.exams.harcanan-sure-sn':'Harcanan süre (sn)',
  'ays.exams.kok-neden-tek-somut':'Kök neden — tek somut cümle',
  'ays.exams.or-birimi-cevirmeden-isleme':'ör. birimi çevirmeden işleme girdim',
  'ays.exams.dogru-ilke-2-3-satir':'Doğru ilke (2–3 satır)',
  'ays.exams.tam-cozum-kopyalanmaz-genell':'Tam çözüm kopyalanmaz; genellenebilir ilke yazılır.',
  'ays.exams.benzer-soru-kaynak':'Benzer soru — kaynak / test no',
  'ays.exams.or-345-tyt-mat-test':'ör. 345 TYT Mat test 12 / 7',
  'ays.exams.tamir-recetesi':'Tamir reçetesi',
  'ays.exams.sil':'Sil',
  'ays.exams.en-olasi':'en olası.',
  'ays.exams.tahmin-icin-3-tam-deneme':'Tahmin için 3 tam deneme gerekir.',
  'ays.exams.hedefe-kalan':'Hedefe kalan',
  'ays.exams.kaldi':'kaldı.',
  'ays.exams.sonraki-deneme':'Sonraki deneme',
  'ays.exams.sureli-basla':'Süreli başla',
  'ays.exams.gidisat':'Gidişat',
  'ays.exams.tyt-neti':'TYT neti',
  'ays.exams.henuz-tam-tyt-denemesi-yok':'Henüz tam TYT denemesi yok; net ilk denemeyle çıkar.',
  'ays.exams.deneme-gir':'Deneme gir',
  'ays.exams.son':'Son ',
  'ays.exams.son-deneme-ders-ders':'Son deneme · ders ders',
  'ays.exams.en-iyi-tyt':'En iyi TYT',
  'ays.exams.analiz-bekleyen':'Analiz bekleyen',
  'ays.exams.oturum-basladi-kronometre-is':'Oturum başladı — kronometre işliyor',
  'ays.exams.oturum-kaydedildi-net':'Oturum kaydedildi · net ',
  'ays.exams.en-az-bir-test-doldurulmali':'En az bir test doldurulmalı',
  'ays.exams.deneme-kaydedildi-net':'Deneme kaydedildi · net ',
  'ays.exams.deneme-silindi':'Deneme silindi',
  'ays.exams.analiz-tamamlandi':'Analiz tamamlandı',
  'ays.exams.hata-silindi':'Hata silindi',
  'ays.exams.deneme-2':'Deneme',
});
window.LIFEOS.PARCA.sayfa({ id:'exams', modul:'ays', king:{ sira:140, ad:'Deneme', es:['deneme', 'sınav'] }, cekmece:'calisma', ad:'Deneme', ikon:'exam', sira:20 });

R.Screens.exams = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const K = R.C;

  const FILTERS = [{ value:'all', label:yz('ays.exams.tumu') }, { value:'TYT', label:yz('ays.exams.tyt') }, { value:'AYT', label:yz('ays.exams.ayt') }];

  function analysisState(exam){
    if(exam.analysisCompletedAt) return { label:yz('ays.exams.analiz-tamam'), tone:'ok' };
    const hours = (Date.now() - new Date(exam.date+'T12:00:00').getTime())/3600000;
    if(hours > 24) return { label:yz('ays.exams.analiz-borcu'), tone:'danger' };
    return { label:yz('ays.exams.analiz-bekliyor'), tone:'warn' };
  }

  /* ---------- liste ---------- */

  function ExamRow(exam){
    const st = analysisState(exam);
    const errs = S.errors.filter(e => e.examId === exam.id).length;
    const meta = [U.fmtDate(exam.date), exam.publisher, errs ? errs+' hata kaydı' : null].filter(Boolean).join(' · ');
    return html`
      <div class="listitem listitem--tap" data-act="open-exam" data-id="${exam.id}">
        <div class="exam-row__net">
          <div class="num exam-net">${U.fmtNet(M.examNet(exam))}</div>
          <div class="tiny dim">net</div>
        </div>
        <div class="grow">
          <div class="row-sm"><b>${exam.type}</b>${K.Badge({ label:exam.family, tone:'muted' })}</div>
          <div class="tiny dim">${meta}</div>
        </div>
        ${K.Badge({ label:st.label, tone:st.tone })}
      </div>`;
  }

  /* Dönem başına plan/gerçekleşen. Dört sütunlu tablo bu dar kolonda
     taşıp kesiliyordu ("Branş" başlığı yarım, değerler görünmüyordu);
     dönem başlığı üstte, üç ölçüm altında etiket olarak dizilir. */
  function volumeTable(){
    const curWeek = M.currentWeek();
    const pill = (label, actual, target, note) => {
      if(!target){
        return html`<span class="volpill volpill--off"><b>${label}</b> ${note || '—'}</span>`;
      }
      const span = target[1] !== target[0] ? target[0]+'–'+target[1] : String(target[0]);
      return html`<span class="${'volpill' + (actual >= target[0] ? ' is-ok' : '')}">
        <b>${label}</b> <span class="num">${actual}</span><span class="dim">/${span}</span></span>`;
    };
    return html`<div class="vollist">${map(C.examVolumeProgress(), v => {
      const active = curWeek >= v.weeks[0] && curWeek <= v.weeks[1];
      return html`<div class="${'volrow' + (active ? ' is-now' : '')}">
        <div class="volrow__head">
          <span class="volrow__period">${v.period}</span>
          ${when(active, () => K.Badge({ label:yz('ays.exams.simdi'), tone:'ok' }))}
        </div>
        <div class="volrow__cells">
          ${pill('TYT', v.actual.tyt, v.tyt)}
          ${pill('AYT', v.actual.ayt, v.ayt, v.aytNote)}
          ${pill('Branş', v.actual.branch, v.branch, v.branchNote)}
        </div>
      </div>`;
    })}</div>`;
  }

  /* 035 ARALIK ÇUBUĞU (vitrin): sıralama tahmini tek sayı değil banttır;
     dayanak (kaç tam deneme) yanında yazar. Yeterli deneme yoksa «—». */
  function siralamaKutusu(){
    const G = (window.LIFEOS || {}).GRAFIK;
    if(!G) return '';
    const est = C.estimateScore();
    return K.Kutu({ ad:yz('ays.exams.siralama'), yuva:est.ok ? 'tahmin' : 'veri yok',
      govde:raw(G.aralikHtml(est.ok ? { alt:est.rankBest, ust:est.rankWorst, olasi:est.rank, min:1,
          max:Math.round(Math.max(est.rankWorst, est.targetRank) * 1.15), ters:true,
          dayanak:est.samples, dayanakBirim:'tam deneme' }
        : { dayanak:C.fullExams('TYT').length, dayanakBirim:'tam deneme (en az 3 gerekir)' })) });
  }

  /* ---------- C · vitrin kartları (brand/ortak/vitrin.js) ---------- */
  const VT = () => (window.LIFEOS || {}).VITRIN;
  const kutu = (ad, yuva, ic, o) => ic ? K.Kutu(Object.assign({ ad, yuva, class:'vkutu', govde:raw(ic) }, o || {})) : '';
  const r2 = n => Math.round(n * 100) / 100;

  /* 066 HEDEFE KALAN: bugünkü net son tam TYT'nin neti; hedef tahmini
     sıra modelinden (`C.netGapToTarget`), bu yüzden etiket TAHMİN. */
  function hedefeKalanKutusu(){
    if(!VT()) return '';
    const gap = C.netGapToTarget();
    const tyt = C.fullExams('TYT');
    if(!gap || !tyt.length) return '';
    const simdi = r2(M.examNet(tyt[tyt.length - 1]));
    const hafta = Math.max(1, Math.ceil(U.diffDays(U.todayISO(), R.PLAN.examTytISO) / 7));
    const kalan = Math.max(0, gap.netDiff);
    return kutu('Hedefe kalan', 'tahmin', VT().hedefeKalan({ ad:yz('ays.exams.hedef-net'), simdi, hedef:r2(simdi + kalan),
      kalanHafta:hafta, haftalik:gap.reached ? null : r2(kalan / hafta), birim:'net', kesinlik:'estimated',
      not:gap.reached ? 'Hedef bandın üstündesin; bandı koru' : '' }));
  }

  /* 057 DENEME TAKVİMİ: son deneme netiyle, sonraki üç deneme günü PLANDAN
     (haftanın deneme ritüeli; ara günü atlanır). */
  /* Plandaki sonraki üç deneme günü (haftanın deneme ritüeli; ara günü atlanır). */
  function sonrakiDenemeler(){
    const gun = R.WEEKDAYS.findIndex(w => w.ritual === 'exam');
    const plan = [];
    for(let i = 1; i <= 35 && plan.length < 3; i++){
      const d = U.iso(U.addDays(U.today(), i));
      if(U.weekdayIndex(d) !== gun) continue;
      const ist = R.Istisna ? R.Istisna.gunIcin(d) : null;
      if(ist && ist.tur === 'ara') continue;
      plan.push(d);
    }
    return plan;
  }

  function denemeTakvimi(){
    if(!VT()) return '';
    const bugun = U.todayISO();
    const gecmis = S.exams.filter(e => e.date <= bugun).sort((a, b) => a.date.localeCompare(b.date)).slice(-1);
    const plan = sonrakiDenemeler();
    if(!plan.length) return '';
    const ilk = gecmis.length ? gecmis[0].date : bugun, son = plan[plan.length - 1];
    const aralik = Math.max(1, U.diffDays(ilk, son));
    const yer = d => 6 + 88 * U.diffDays(ilk, d) / aralik;
    const ne = d => { const g = U.diffDays(bugun, d); return g < 7 ? g + ' gün sonra' : Math.round(g / 7) + ' hafta'; };
    const ogeler = gecmis.map(e => ({ ad:e.type || 'Deneme', yer:yer(e.date), not:U.fmtNet(M.examNet(e)) + ' net', durum:'g' }))
      .concat(plan.map((d, i) => ({ ad:U.fmtShort(d), yer:yer(d), not:ne(d), durum:i === 0 ? 'y' : '' })));
    if(ogeler.length < 2) return '';
    return kutu('Deneme takvimi', 'planlı', VT().denemeTakvimi({ ogeler, bugun:yer(bugun), kesinlik:'computed', etiketAd:'planlı' }));
  }

  function listView(){
    const filter = S.ui.examFilter || 'all';
    let list = S.exams.slice().sort((a, b) => b.date.localeCompare(a.date));
    if(filter !== 'all') list = list.filter(e => e.family === filter);
    const pg = K.paginate(list, S.ui.examPage || 1, 25);

    const body = list.length
      ? html`<div class="list">${map(pg.items, ExamRow)}</div>
             ${K.Pager({ page:pg.page, pages:pg.pages, total:pg.total, act:'exam-page' })}`
      : K.Empty({ icon:'exam',
          text:yz('ays.exams.henuz-deneme-eklenmedi-cumar'),
          action:K.Button({ label:yz('ays.exams.i-lk-denemeyi-ekle'), icon:'plus', tone:'primary', act:'new-exam' }) });

    return K.Grid([
      K.Span(8, K.Stack([
        K.Row([
          K.Segmented({ items:FILTERS, value:filter, act:'exam-filter', aria:yz('ays.exams.deneme-ailesi') }),
          html`<span class="small dim">${U.plural(list.length, 'kayıt', 'kayıt')}</span>`,
        ], { between:true, wrap:true }),
        when(filter !== 'all' && VT(), () => raw(VT().suzgecCipleri({ cipler:[{ ad:filter, modul:'ays', act:'exam-filter', data:{ 'data-value':'all' } }],
          sonuc:list.length, birim:'deneme', temizle:{ act:'exam-filter', data:{ 'data-value':'all' } } }))),
        K.Card({ body, pad:'sm' }),
      ])),
      K.Span(3, K.Stack([
        DonenGidisat(),
        siralamaKutusu(),
        hedefeKalanKutusu(),
        denemeTakvimi(),
        K.Card({ title:yz('ays.exams.deneme-hacmi'), hint:'exam-volume', sub:yz('ays.exams.plan-gerceklesen'), body:volumeTable() }),
        K.Card({ title:yz('ays.exams.yayin-merdiveni'), hint:'publisher', sub:yz('ays.exams.zorluk-kademesi'),
          body:html`<div class="ladder">${map(R.PUBLISHER_LADDER, l => html`
            <div class="ladder__row"><span class="ladder__level">${l.level}</span>
              <span class="muted">${l.detail}</span></div>`)}</div>` }),
      ])),
      K.Span(12, raw(UI.rail(['net', 'analysis-debt', 'error-tags', 'exam-volume', 'publisher']))),
    ]);
  }

  /* ---------- detay ---------- */

  function NumCell(o){
    return K.Input({ type:'number', size:'sm', numeric:true, class:'input--cell',
      value:o.value, aria:o.aria, change:o.change, data:o.data });
  }

  /* 062 DENEME GİRİŞİ: ders ders D/Y/B hücreleri; neti kod hesaplar
     (M.testNet). Hedef bandı ve doğruluk korunur. */
  function testTable(exam){
    if(VT()){
      const satirlar = exam.tests.map((t, i) => {
        const answered = t.correct + t.wrong;
        const band = R.TEST_BANDS.find(b => b.exam === exam.family && b.testKey && t.name.indexOf(b.testKey) >= 0);
        const acc = answered ? U.pct(t.correct, answered) : null;
        return { i, ad:t.name, correct:t.correct, wrong:t.wrong, blank:t.blank, net:r2(M.testNet(t)),
          not:band ? 'hedef ' + band.low + '–' + band.high : '', dogruluk:acc, dogrulukDusuk:acc != null && acc < 70 };
      });
      return raw(VT().denemeGirisi({ satirlar, toplam:r2(M.examNet(exam)), change:'test-num' }));
    }
    const rows = exam.tests.map((t, i) => {
      const net = M.testNet(t);
      const answered = t.correct + t.wrong;
      // HATALAR D-8: cevaplanmamis test olculmemistir; «%0» degil «—».
      const acc = answered ? U.pct(t.correct, answered) : null;
      const band = R.TEST_BANDS.find(b => b.exam === exam.family && b.testKey && t.name.indexOf(b.testKey) >= 0);
      const num = (field, label) => NumCell({ value:t[field], aria:t.name+' '+label,
        change:'test-num', data:{ 'data-i':i, 'data-field':field } });
      return [
        t.name,
        num('correct', 'doğru'), num('wrong', 'yanlış'), num('blank', 'boş'),
        html`<b class="num">${U.fmtNet(net)}</b>${when(band, () => html`<div class="tiny dim">hedef ${band.low}–${band.high}</div>`)}`,
        acc == null ? html`<span class="num dim" title="veri yok">—</span>`
          : html`<span class="${acc >= 70 ? 'num' : 'num dim'}">%${acc}</span>`,
      ];
    });
    return K.Table({ rows, headers:['Test', { label:'D', num:true }, { label:'Y', num:true },
      { label:'B', num:true }, { label:yz('ays.exams.net'), num:true }, { label:yz('ays.exams.dogruluk'), num:true }] });
  }

  function protocolList(steps){
    return html`<div class="checklist stack-xs">${map(R.ANALYSIS_PROTOCOL, (p, i) => html`
      <label class="${p.key && steps[p.key] ? 'check is-done' : 'check'}" title="${p.detail}">
        <input type="checkbox" ${steps[p.key] ? raw('checked') : ''} data-act="protocol-step" data-key="${p.key}"/>
        <span><b>${(i+1)+'. '+p.title}</b>${when(p.time !== '—', () => html` <span class="tiny dim">${p.time}</span>`)}</span>
      </label>`)}</div>`;
  }

  function ErrorRow(e){
    const label = (e.testName || '—') + (e.questionNo ? ' · soru '+e.questionNo : '');
    return html`
      <div class="listitem">
        ${raw(UI.tagDot(e.tag))}
        <div class="grow">
          <div class="row-sm"><b class="small">${label}</b>
            ${R.ERROR_TAGS[e.tag] ? K.Badge({ label:e.tag+' · '+R.ERROR_TAGS[e.tag].name, tone:'muted' })
              : K.Badge({ label:yz('ays.exams.etiket-yok'), tone:'warn' })}
            ${when(e.status, () => K.Badge({ label:e.status, tone:'muted' }))}</div>
          <div class="tiny dim">${e.rootCause || 'kök neden yazılmadı'}</div>
          ${when(e.principle, () => html`<div class="tiny">${yz('ays.exams.i-lke')} ${e.principle}</div>`)}
        </div>
        ${K.IconButton({ icon:'edit', size:'sm', plain:true, aria:yz('ays.exams.hatayi-duzenle'), act:'edit-error', data:{ 'data-id':e.id } })}
      </div>`;
  }

  /* 046 DENEME KARNESİ: satır uzunluğu dersin soru sayısıyla orantılı. */
  function karne(exam){
    if(!VT()) return '';
    return kutu('Karne', 'hesaplandı', VT().denemeKarnesi({ aile:exam.family,
      satirlar:exam.tests.map(t => ({ ad:t.name, d:Number(t.correct) || 0, y:Number(t.wrong) || 0, b:Number(t.blank) || 0,
        net:r2(M.testNet(t)) })).filter(x => x.d + x.y + x.b > 0), toplam:r2(M.examNet(exam)) }));
  }

  /* 048 DENEME KARŞILAŞTIRMASI: aynı aile ve türün bir önceki denemesiyle,
     test adına göre eşlenir; eşi olmayan ders «—». */
  function karsilastirma(exam){
    if(!VT()) return '';
    const onceki = S.exams.filter(e => e.id !== exam.id && e.family === exam.family && e.kind === exam.kind && e.date <= exam.date)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if(!onceki) return '';
    const satirlar = exam.tests.map(t => {
      const o = onceki.tests.find(x => x.name === t.name);
      return { ad:t.name, once:o ? r2(M.testNet(o)) : null, sonra:r2(M.testNet(t)) };
    });
    return kutu('Önceki denemeyle', 'hesaplandı', VT().denemeKarsilastirma({ onceAd:U.fmtShort(onceki.date), sonraAd:U.fmtShort(exam.date),
      satirlar, toplam:{ once:r2(M.examNet(onceki)), sonra:r2(M.examNet(exam)) } }));
  }

  /* 047 HIZ ŞERİDİ: süreli oturumun soru başına süresi (ölçüldü). */
  function hizSeridi(exam){
    if(!VT() || !M.sessionForExam) return '';
    const ses = M.sessionForExam(exam.id);
    const sureler = ses && (ses.marks || []).map(m => Number(m.spent)).filter(x => x > 0);
    return sureler && sureler.length >= 3 ? kutu('Hız şeridi', 'ölçüldü', VT().hizSeridi({ sureler })) : '';
  }

  /* 056 YANLIŞ NEDENLERİ: hata etiketlerinin dağılımı; etiketi kullanıcı
     seçer (beyan), kod sayar. Etiketsiz hata dağılıma girmez. */
  function nedenler(errs){
    if(!VT()) return '';
    return VT().yanlisNedenleri({ birim:'hata', nedenler:Object.keys(R.ERROR_TAGS).map(k => ({ ad:R.ERROR_TAGS[k].name,
      n:errs.filter(e => e.tag === k).length })).sort((a, b) => b.n - a.n) });
  }

  /* SORU ANALİZİ (core/denemeanaliz.js): anahtar + cevaplar → soru soru
     sonuç; yanlış/boş soruların fotoğrafı, konusu, çözümü, hata kaydı. */
  let fotoIstendi = false, sahipsizBakildi = false;
  /* Başka cihazda silinen denemenin fotoğrafları (core/sorufoto.js söz 7);
     oturumda bir kez, defter yüklüyken ve boş değilken. */
  function sahipsizTemizle(){
    if(sahipsizBakildi || !R.SoruFoto || !R.SoruFoto.sahipsizTemizle || !(S.exams || []).length) return;
    sahipsizBakildi = true;
    R.SoruFoto.sahipsizTemizle(S.exams.map(e => e.id)).catch(() => {});
  }
  function fotoUrl(exam, key){
    if(!R.SoruFoto) return null;
    if(!R.SoruFoto.var() && !fotoIstendi){
      fotoIstendi = true;
      R.SoruFoto.hazirla().then(ok => { if(ok) R.App.render(); });
    }
    return R.SoruFoto.url(R.DenemeAnaliz.sahip(exam, key));
  }

  function cozumRozeti(tutar){
    if(tutar === true) return K.Badge({ label:yz('ays.exams.anahtarla-tutuyor'), tone:'ok' });
    if(tutar === false) return K.Badge({ label:yz('ays.exams.anahtarla-tutmuyor-guvenme'), tone:'danger' });
    return K.Badge({ label:yz('ays.exams.karsilastirilamadi'), tone:'warn' });
  }

  function SoruSatiri(exam, x, hazir){
    const a = x.analiz || {};
    const foto = fotoUrl(exam, x.key);
    const konu = a.topicRef ? R.DenemeAnaliz.konuBul(a.topicRef) : null;
    /* «Tutuyor» o anki anahtarla hesaplanır (denemeanaliz söz 5). */
    const cozum = R.DenemeAnaliz.cozumOf(exam, x.key);
    const tutar = R.DenemeAnaliz.tutarOf(exam, x.key);
    return html`
      <div class="dsoru">
        <div class="row between wrap gap-8">
          <div class="row-sm wrap">
            <b class="num">${x.no}.</b>
            ${K.Badge({ label:x.durum === 'bos' ? 'boş' : 'yanlış', tone:x.durum === 'bos' ? 'muted' : 'danger' })}
            <span class="small">${when(x.durum !== 'bos', () => 'senin: ' + x.cevap + ' · ')}${yz('ays.exams.dogru')} <b>${x.anahtar}</b></span>
          </div>
          <div class="row-sm wrap">
            ${when(foto, () => html`<a class="dsoru__foto" href="${foto}" target="_blank" rel="noopener"
              aria-label="${x.test + ' ' + x.no + '. sorunun fotoğrafını büyüt'}"><img src="${foto}" alt=""/></a>`)}
            <label class="btn btn--sm dsoru__dosya">
              <span class="btn__label">${foto ? 'Fotoğrafı değiştir' : 'Fotoğraf ekle'}</span>
              <input type="file" accept="image/*" capture="environment" data-change="da-foto" data-key="${x.key}"
                aria-label="${x.test + ' ' + x.no + '. sorunun fotoğrafı'}"/>
            </label>
            ${when(foto, () => K.Button({ label:a.cozuldu || cozum ? 'Yeniden çöz' : 'Çöz', size:'sm', act:'da-coz',
              disabled:!hazir, title:hazir ? '' : 'Görüntü okuyabilen bir model gerekir (Ayarlar › Model)', data:{ 'data-key':x.key } }))}
            ${x.hata ? K.Badge({ label:yz('ays.exams.hata-kaydinda'), tone:'ok' })
              : K.Button({ label:yz('ays.exams.hata-kaydina-ekle'), size:'sm', act:'da-hata', data:{ 'data-key':x.key } })}
          </div>
        </div>
        <div class="row-sm wrap mt-8">
          ${K.Select({ size:'sm', options:R.DenemeAnaliz.konuSecenekleri(exam, x.test), value:a.topicRef || '',
            change:'da-konu', aria:x.test + ' ' + x.no + '. sorunun konusu', data:{ 'data-key':x.key } })}
          ${when(konu, () => K.Badge({ label:a.konuKaynak === 'elle' ? 'elle' : 'tahmin', tone:'muted' }))}
          ${when(konu, () => K.Button({ label:yz('ays.exams.konuyu-ac'), size:'sm', tone:'ghost', act:'ogren-git',
            data:{ 'data-route':'anlatim', 'data-subject':konu.subject.id, 'data-topic':konu.topic.id } }))}
        </div>
        ${when(cozum, () => html`
          <details class="dsoru__cozum mt-8">
            <summary class="small">${yz('ays.exams.cozum')} ${cozumRozeti(tutar)}${when(a.modelCevap, () => html` <span class="tiny dim">model: ${a.modelCevap}</span>`)}</summary>
            ${when(tutar === false, () => html`<p class="small mt-8">${yz('ays.exams.modelin-cevabi')}${a.modelCevap}${yz('ays.exams.anahtardaki')} ${x.anahtar} ${yz('ays.exams.sikkina-varmadi-ya-model-yan')}</p>`)}
            <div class="small dsoru__metin mt-8">${cozum}</div>
          </details>`)}
        ${when(!cozum && a.cozuldu, () => html`<p class="tiny dim mt-8">${yz('ays.exams.bu-soru-baska-bir-cihazda')}</p>`)}
      </div>`;
  }

  function soruAnalizi(exam){
    const A = R.DenemeAnaliz;
    if(!A) return '';
    const oz = A.ozet(exam);
    const giris = K.Button({ label:oz.analizli ? 'Anahtarı düzenle' : 'Cevap anahtarını gir', icon:oz.analizli ? 'edit' : 'plus',
      size:'sm', tone:oz.analizli ? 'ghost' : 'primary', act:'da-giris', data:{ 'data-id':exam.id } });
    if(!oz.analizli){
      const yalnizAnahtar = oz.testler.some(t => t.anahtarVar);
      return K.Card({ title:yz('ays.exams.soru-analizi'), sub:yz('ays.exams.cevap-anahtariyla-soru-soru'), actions:giris,
        body:K.Empty({ icon:'list', text:yalnizAnahtar
          ? 'Anahtar girildi; kendi cevaplarını da yazınca yanlış ve boş sorular tek tek listelenir.'
          : 'Cevap anahtarını ve kendi cevaplarını girersen yanlış ve boş sorular tek tek listelenir: fotoğrafını ekleyip çözdürebilir, konusunu bulup hata kaydına atabilirsin.' }) });
    }
    const liste = A.yanlislar(exam);
    const hazir = A.hazir();
    const eksikHata = liste.filter(x => !x.hata).length;
    const gruplar = oz.testler.filter(t => t.sonuc).map(t => ({ t, sorular:liste.filter(x => x.test === t.ad) }));
    const ozetSatiri = t => {
      const s = t.sonuc;
      return html`<div class="row between wrap gap-8 small">
        <span><b>${t.ad}</b> · ${s.d} ${yz('ays.exams.d')} ${s.y} ${yz('ays.exams.y')} ${s.b} B${s.iptal ? ' · ' + s.iptal + ' iptal' : ''}</span>
        <span class="num">net ${U.fmtNet(s.net)}${when(t.fark, () => html` <span class="tiny dim">${yz('ays.exams.kayitta')} ${t.kayit.d}/${t.kayit.y}/${t.kayit.b == null ? '—' : t.kayit.b}</span>`)}</span>
      </div>`;
    };
    return K.Card({
      title:yz('ays.exams.soru-analizi'), sub:yz('ays.exams.cevap-anahtarindan-hesapland'), actions:giris,
      body:html`
        <div class="stack-xs">${map(oz.testler.filter(t => t.sonuc), ozetSatiri)}</div>
        ${when(oz.testler.some(t => t.anahtarVar && !t.cevapVar), () => html`<p class="tiny dim mt-8">${yz('ays.exams.cevaplari-girilmeyen-testler')} ${oz.testler.filter(t => t.anahtarVar && !t.cevapVar).map(t => t.ad).join(', ')}.</p>`)}
        ${when(oz.fark, () => html`<div class="mt-12">${K.Notice({ tone:'warn',
          body:'Anahtardan hesaplanan sonuç kayıttaki sayılardan farklı. Kayıt kendiliğinden değişmez; istersen anahtara göre güncelle.' })}
          <div class="row-sm mt-8">${K.Button({ label:yz('ays.exams.kaydi-anahtara-gore-guncelle'), size:'sm', act:'da-guncelle', data:{ 'data-id':exam.id } })}</div></div>`)}
        ${when(exam.anahtarOncesi, () => html`<div class="row-sm mt-8">${K.Button({ label:yz('ays.exams.guncellemeyi-geri-al'), size:'sm', tone:'ghost',
          act:'da-geri', data:{ 'data-id':exam.id } })}<span class="tiny dim">${yz('ays.exams.onceki-sayilar-sakli')}</span></div>`)}
        ${when(!hazir, () => html`<p class="tiny dim mt-12">${yz('ays.exams.fotograftaki-soruyu-cozdurme')}</p>`)}
        ${liste.length ? html`
          <div class="row between wrap gap-8 mt-12">
            <span class="small">${U.plural(liste.length, 'yanlış ya da boş soru', 'yanlış ya da boş soru')}</span>
            ${when(eksikHata, () => K.Button({ label:yz('ays.exams.hepsini-hata-kaydina-ekle') + eksikHata + ')', size:'sm', act:'da-hepsi', data:{ 'data-id':exam.id } }))}
          </div>
          <div data-raf-tam>${map(gruplar.filter(g => g.sorular.length), g => html`
            <details class="dsoru__grup mt-8" ${raw('open')}>
              <summary class="small strong">${g.t.ad} · ${g.sorular.length}</summary>
              <div class="stack-sm mt-8">${map(g.sorular, x => SoruSatiri(exam, x, hazir))}</div>
            </details>`)}</div>`
          : html`<p class="small mt-12">${yz('ays.exams.yanlis-ya-da-bos-soru')}</p>`}`,
    });
  }

  function anahtarSheet(exam){
    const A = R.DenemeAnaliz;
    const alanlar = exam.tests.map((t, i) => {
      const q = A.soruSayisi(exam, t.name);
      return html`
        <div class="card card--flat card--pad-sm stack-sm">
          <b class="small">${t.name}${q ? ' · ' + q + ' soru' : ''}</b>
          ${K.Field({ label:yz('ays.exams.cevap-anahtari'), input:K.Textarea({ id:'da-a-' + i, rows:2, value:(exam.anahtar || {})[t.name] || '',
            placeholder:yz('ays.exams.abcde-ya-da-1-a-2-c'), aria:t.name + ' cevap anahtarı' }) })}
          ${K.Field({ label:yz('ays.exams.senin-cevaplarin'), input:K.Textarea({ id:'da-c-' + i, rows:2, value:(exam.cevaplar || {})[t.name] || '',
            placeholder:yz('ays.exams.bos-biraktigin-soru-icin-nok'), aria:t.name + ' cevapların' }) })}
        </div>`;
    });
    UI.sheet({
      title:yz('ays.exams.cevap-anahtari-ve-cevaplarin'), subtitle:exam.type + (exam.publisher ? ' · ' + exam.publisher : ''), wide:true,
      body:String(K.Stack([
        K.Notice({ tone:'info', body:'Harfleri yan yana yaz ya da yayının sayfasından «1-A 2-C …» biçiminde yapıştır; boşluklar yok sayılır. '
          + 'Boş bıraktığın soru için nokta (.), iptal edilen soru için anahtara yıldız (*) yaz. Bir testte hata varsa hiçbir test kaydedilmez ve nedeni yazılır.' }),
        html`<div class="stack-sm">${map(alanlar, x => x)}</div>`,
        raw('<div id="da-not" class="small" role="status"></div>'),
      ])),
      footer:String(html`${K.Button({ label:yz('ays.exams.vazgec'), act:'sheet-close' })}
        ${K.Button({ label:yz('ays.exams.kaydet'), tone:'primary', act:'da-kaydet', data:{ 'data-id':exam.id } })}`),
    });
  }

  function yayinKarnesi(exam){
    const A = R.DenemeAnaliz;
    if(!A || !String(exam.publisher || '').trim()) return '';
    const k = A.yayinKarnesi(exam.publisher);
    if(!k) return '';
    const testSatiri = t => html`<div class="row between small"><span>${t.ad}</span>
      <span class="num">${t.d + t.y ? 'doğruluk %' + U.pct(t.d, t.d + t.y) : '—'} <span class="tiny dim">· ${t.deneme} deneme</span></span></div>`;
    return K.Card({
      title:yz('ays.exams.yayin-karnesi'), sub:k.yayin + ' · hesaplandı',
      body:html`
        <p class="tiny dim">${k.deneme} ${yz('ays.exams.deneme')} ${k.hata} ${yz('ays.exams.hata-kaydi')}${k.konulu} ${yz('ays.exams.tanesinin-konusu-belli')}</p>
        ${when(k.testler.length, () => html`<div class="stack-xs mt-8">${map(k.testler, testSatiri)}</div>`)}
        ${k.yeterli ? html`
          <div class="mono-label mt-12">${yz('ays.exams.en-cok-kacirdigin-konular')}</div>
          <div class="stack-xs mt-8">${map(k.konular, x => html`<div class="small">
            <b>${x.ad}</b> — ${x.n} ${yz('ays.exams.hata-bu-yayindaki-hatalarini')}${x.pay}${x.otekiPay != null ? ' (öteki yayınlarda %' + x.otekiPay + ')' : ''}</div>`)}</div>
          <p class="tiny dim mt-8">${yz('ays.exams.yalniz-yanlis-ve-bos-sorular')}</p>`
          : html`<p class="small mt-8">${yz('ays.exams.konu-karnesi-icin-bu-yayinda')} ${A.ESIK} ${yz('ays.exams.hata-gerekir')}</p>`}`,
    });
  }

  function detailView(id){
    const exam = S.exams.find(e => e.id === id);
    if(!exam) return K.Empty({ text:yz('ays.exams.deneme-bulunamadi'),
      action:K.Button({ label:yz('ays.exams.denemelere-don'), act:'exam-back' }) });

    const errs = S.errors.filter(e => e.examId === id);
    const st = analysisState(exam);
    const steps = exam.protocol || {};
    const dist = {};
    errs.forEach(e => { dist[e.tag] = (dist[e.tag] || 0) + 1; });
    const segs = Object.keys(R.ERROR_TAGS).map(k => ({ label:k, value:dist[k] || 0, color:R.ERROR_TAGS[k].color }));
    const meta = [U.fmtDate(exam.date), exam.publisher, exam.duration ? exam.duration+' dk' : null].filter(Boolean).join(' · ');

    return K.Grid([
      K.Span(12, K.Row([
        K.Button({ label:yz('ays.exams.denemeler'), icon:'left', size:'sm', tone:'ghost', act:'exam-back' }),
        html`<div class="row-sm">${K.Badge({ label:st.label, tone:st.tone })}
          ${K.IconButton({ icon:'trash', size:'sm', aria:yz('ays.exams.denemeyi-sil'), act:'delete-exam', data:{ 'data-id':exam.id } })}</div>`,
      ], { between:true, wrap:true })),

      K.Span(8, K.Stack([
        K.Card({
          title:exam.type, sub:meta,
          actions:html`<div class="right">
            <div class="num exam-net exam-net--lg">${U.fmtNet(M.examNet(exam))}</div>
            <div class="tiny dim">${yz('ays.exams.toplam-net')}</div></div>`,
          body:testTable(exam),
        }),
        soruAnalizi(exam),
        karsilastirma(exam),
        K.Card({
          title:yz('ays.exams.hata-analizi'), sub:U.plural(errs.length, 'kayıt', 'kayıt'),
          actions:K.Button({ label:yz('ays.exams.hata-ekle'), icon:'plus', size:'sm', tone:'primary', act:'new-error', data:{ 'data-exam':exam.id } }),
          body:html`
            ${when(errs.length, () => html`<div class="mb-12">${nedenler(errs) ? raw(nedenler(errs)) : raw(UI.stackBar(segs))}</div>`)}
            ${errs.length
              ? html`<div class="list">${map(errs, ErrorRow)}</div>`
              : K.Empty({ icon:'list',
                  text:yz('ays.exams.henuz-hata-kaydedilmedi-her') })}`,
        }),
      ])),

      K.Span(4, K.Stack([
        karne(exam),
        yayinKarnesi(exam),
        hizSeridi(exam),
        K.Card({
          title:yz('ays.exams.analiz-protokolu'), hint:'analysis-protocol', sub:yz('ays.exams.24-saat-icinde'),
          body:html`
            ${protocolList(steps)}
            ${exam.analysisCompletedAt
              ? html`<div class="mt-12">${K.Notice({ tone:'ok',
                  body:'Analiz '+U.fmtDate(exam.analysisCompletedAt.slice(0, 10))+' tarihinde tamamlandı.' })}</div>`
              : K.Button({ label:yz('ays.exams.analizi-tamamla'), icon:'check', tone:'primary', block:true,
                  class:'mt-12', act:'complete-analysis', data:{ 'data-id':exam.id } })}`,
        }),
        K.Card({
          title:yz('ays.exams.sure-kaydi'), hint:'time-drift', sub:yz('ays.exams.test-basina-harcanan-dakika'),
          body:K.Stack(map(exam.tests, (t, i) => html`
            <div class="row between"><span class="small">${t.name}</span>
              <div class="row-sm">${K.Input({ type:'number', size:'sm', numeric:true, class:'input--mins',
                placeholder:'dk', value:t.minutes == null ? '' : t.minutes, aria:t.name+' süresi',
                change:'test-minutes', data:{ 'data-i':i } })}<span class="tiny dim">dk</span></div>
            </div>`), 'sm'),
        }),
      ])),
    ]);
  }


  /* ---------- süreli oturum (sınav günü provası) ---------- */

  let tick = null;
  function startTick(){
    stopTick();
    tick = setInterval(() => {
      const total = document.getElementById('run-total');
      if(!R.ExamRun.active() || !total){ stopTick(); return; }
      total.textContent = U.fmtClock(R.ExamRun.remaining());
      const test = document.getElementById('run-test');
      if(test) test.textContent = U.fmtClock(R.ExamRun.elapsedTest());
    }, 1000);
  }
  function stopTick(){ if(tick){ clearInterval(tick); tick = null; } }

  function runView(){
    const run = R.ExamRun.active();
    const t = R.ExamRun.currentTest();
    const left = R.ExamRun.remaining();
    const marks = run.marks.filter(m => m.test === t.name);
    const paused = R.ExamRun.isPaused();

    return K.Grid([
      K.Span(8, K.Stack([
        K.Card({ pad:'sm', body:html`
          <div class="row between wrap gap-8">
            <div>
              <div class="mono-label">${run.name}${run.publisher ? ' · ' + run.publisher : ''}</div>
              <div class="${left <= 300 ? 'runclock is-low' : 'runclock'}" id="run-total">${U.fmtClock(left)}</div>
              <div class="tiny dim">${yz('ays.exams.kalan-toplam-sure')}</div>
            </div>
            <div class="right">
              <div class="mono-label">${t.name}</div>
              <div class="runclock runclock--sm" id="run-test">${U.fmtClock(R.ExamRun.elapsedTest())}</div>
              <div class="tiny dim">${marks.length} / ${t.q} ${yz('ays.exams.soru-isaretlendi')}</div>
            </div>
          </div>
          ${VT() && t.q <= 80 ? raw(VT().notrSerit({ cevaplar:Array.from({ length:t.q }, (_, i) => i < marks.length) }))
            : K.Bar({ value:U.pct(marks.length, t.q), tone:'' })}` }),

        html`<div class="row gap-8">${map(Object.keys(R.ExamRun.MARKS), k => {
          const m = R.ExamRun.MARKS[k];
          const cls = m.tone === 'ok' ? 'btn grow btn--primary'
            : m.tone === 'warn' ? 'btn grow' : 'btn grow btn--ghost';
          return html`<button class="${cls}" data-act="run-mark" data-kind="${k}"
            ${paused ? raw('disabled') : ''}>
            <span>${m.label}</span><span class="tiny dim">${m.key}</span></button>`;
        })}</div>`,

        K.Row([
          K.Button({ label:yz('ays.exams.geri-al'), size:'sm', tone:'ghost', act:'run-undo', disabled:!run.marks.length }),
          K.Row([
            K.Button({ label:paused ? 'Devam et' : 'Duraklat', size:'sm',
              icon:paused ? 'play' : 'pause', act:'run-pause' }),
            K.Button({ label:yz('ays.exams.sonraki-test'), size:'sm', act:'run-next',
              disabled:run.index >= run.tests.length - 1 }),
            K.Button({ label:yz('ays.exams.bitir'), size:'sm', tone:'primary', act:'run-finish' }),
          ], { wrap:true }),
        ], { between:true, wrap:true }),

        K.Card({ title:yz('ays.exams.testler'), sub:yz('ays.exams.tiklayarak-gec-sure-o'),
          body:html`<div class="stack-xs">${map(run.tests, (x, i) => html`
            <button class="${'runtest' + (i === run.index ? ' is-on' : '') + (x.finished ? ' is-done' : '')}"
              data-act="run-goto" data-i="${i}">
              <span class="small strong">${x.name}</span>
              <span class="tiny dim num">${U.fmtClock(i === run.index ? R.ExamRun.elapsedTest() : x.seconds)} · ${x.q} soru</span>
            </button>`)}</div>` }),
      ])),

      K.Span(4, K.Stack([
        K.Notice({ tone:'info', title:yz('ays.exams.nasil-kullanilir'),
          body:'Her soruyu bitirdiğinde bir tuşa bas: 1 yaptım, 2 zorlandım, 3 atladım. '
             + 'Sistem soru başına süreyi kendisi hesaplar; sonunda dakikaları elle girmene gerek kalmaz.' }),
        K.Card({ title:yz('ays.exams.son-isaretler'), sub:U.plural(run.marks.length, 'işaret', 'işaret'),
          body:run.marks.length
            ? html`<div class="stack-xs">${map(run.marks.slice(-8).reverse(), m => html`
                <div class="row between">
                  <span class="small">${m.test} · ${m.no}${yz('ays.exams.soru')}</span>
                  <span class="tiny dim num">${m.spent} ${yz('ays.exams.sn')} ${R.ExamRun.MARKS[m.kind].label}</span>
                </div>`)}</div>`
            : K.Empty({ icon:'clock', text:yz('ays.exams.henuz-isaret-yok') }) }),
        raw(UI.rail(['time-drift', 'analysis-protocol'])),
      ])),
    ]);
  }

  function startRunSheet(){
    const opts = R.EXAM_TEMPLATES.map(t => ({ value:t.id, label:t.name + ' · ' + t.duration + ' dk' }));
    UI.sheet({
      title:yz('ays.exams.sureli-oturum'), subtitle:yz('ays.exams.sinav-kosullarinda-prova-sur'),
      body:String(K.Stack([
        K.Notice({ tone:'info', body:'Oturum başlayınca kronometre işler. Her soruyu bitirdiğinde '
          + 'bir tuşa basarsın; sistem soru başına süreyi hesaplar.' }),
        K.Cols(2, [
          K.Field({ label:yz('ays.exams.sablon'), input:K.Select({ id:'rn-tmpl', options:opts, value:'tyt-full' }) }),
          K.Field({ label:yz('ays.exams.yayin'), input:K.Input({ id:'rn-pub', placeholder:yz('ays.exams.or-345') }) }),
        ]),
      ])),
      footer:String(html`${K.Button({ label:yz('ays.exams.vazgec'), act:'sheet-close' })}
        ${K.Button({ label:yz('ays.exams.baslat'), tone:'primary', icon:'play', act:'run-start' })}`),
    });
  }

  function finishSheet(){
    const run = R.ExamRun.active();
    if(!run) return;
    const sum = R.ExamRun.summary();
    const cell = (key, ph, i, aria) => K.Input({ type:'number', size:'sm', numeric:true,
      class:'input--cell', placeholder:ph, aria:aria, data:{ 'data-run':key, 'data-i':i } });

    UI.sheet({
      title:yz('ays.exams.oturumu-bitir'), subtitle:yz('ays.exams.netleri-gir-sureler-zaten'), wide:true,
      body:String(K.Stack([
        K.Cols(3, [
          K.Stat({ label:yz('ays.exams.toplam-sure'), value:U.fmtClock(sum.totalSeconds) }),
          K.Stat({ label:yz('ays.exams.sure-sapmasi'), value:(sum.overtime > 0 ? '+' : '') + Math.round(sum.overtime/60),
            unit:' dk', tone:sum.overtime > 300 ? 'danger' : sum.overtime > 0 ? 'warn' : 'ok' }),
          K.Stat({ label:yz('ays.exams.i-saret'), value:sum.marks, note:sum.slow + ' zorlandım' }),
        ]),
        html`<div class="stack-sm">${map(run.tests, (t, i) => html`
          <div class="card card--flat card--pad-sm">
            <div class="row between"><b class="small">${t.name}</b>
              <span class="tiny dim num">${U.fmtClock(sum.perTest[i].seconds)} ${yz('ays.exams.plan')} ${U.fmtClock(sum.perTest[i].planned)}</span></div>
            <div class="row-sm mt-8">
              ${cell('c', 'D', i, t.name + ' doğru')}
              ${cell('w', 'Y', i, t.name + ' yanlış')}
              ${cell('b', 'B', i, t.name + ' boş')}
              <span class="tiny dim">/ ${t.q}</span>
            </div>
          </div>`)}</div>`,
        when(sum.warmup, () => K.Notice({ tone:'warn', body:sum.warmup })),
      ])),
      footer:String(html`${K.Button({ label:yz('ays.exams.i-ptal-et'), tone:'danger', act:'run-cancel' })}
        ${K.Button({ label:yz('ays.exams.kaydet'), tone:'primary', act:'run-save' })}`),
    });
  }

  /* ---------- formlar ---------- */

  function newExamSheet(){
    const tmplOptions = R.EXAM_TEMPLATES.map(t => ({ value:t.id, label:t.name }));
    const body = K.Stack([
      K.Cols(2, [
        K.Field({ label:yz('ays.exams.tarih'), input:K.Input({ id:'ex-date', type:'date', value:U.todayISO() }) }),
        K.Field({ label:yz('ays.exams.sablon'), input:K.Select({ id:'ex-tmpl', options:tmplOptions, value:'tyt-full' }) }),
      ]),
      K.Cols(2, [
        K.Field({ label:yz('ays.exams.yayin-aile'), hint:'trend için en az 3 deneme aynı aileden',
          input:K.Input({ id:'ex-pub', placeholder:yz('ays.exams.or-345-bilgi-sarmal-endemik') }) }),
        K.Field({ label:yz('ays.exams.toplam-sure-dk'), input:K.Input({ id:'ex-dur', type:'number', numeric:true, value:165 }) }),
      ]),
      /* KÖR NET TAHMİNİ — sonuçları yazmadan ÖNCE.

         Kendi netini kestirebilmek bir süs değil sınav becerisidir: hangi
         testte zaman harcayacağını, hangi soruyu bırakacağını ve bir
         denemenin kötü mü yoksa zor mu olduğunu o kestirim söyler.

         Alan bilerek test satırlarının ÜSTÜNDE durur. Kayıt sırasında
         satırların o an boş olup olmadığına bakılır: sonuçlar girildikten
         sonra yazılan bir tahmin «kör değil» işaretlenir ve kalibrasyon
         puanına katılmaz. Tahmin değil kopya olurdu. */
      K.Field({ label:yz('ays.exams.netini-kac-tahmin-ediyorsun'),
        hint:'sonuçları yazmadan önce doldur — sonra yazılan tahmin puana girmez',
        input:K.Input({ id:'ex-guess', type:'number', step:'any',
          placeholder:yz('ays.exams.or-62') }) }),
      /* Fikir 7: sonuç kâğıdının fotoğrafı formu DOLDURUR, kaydetmez
         (core/denemefoto.js). Tahmin alanının altında: önce kör tahmin. */
      R.DenemeFoto && R.DenemeFoto.hazir()
        ? K.Drop({ act:'ex-foto', label:yz('ays.exams.sonuc-kagidinin-fotografinda'), icon:'file',
            accept:'image/*', hint:'Doğru/yanlış/boş okunur; kaydetmeden önce kontrol edersin' })
        : '',
      raw('<div id="ex-foto-not" class="small" role="status"></div>'),
      raw('<div id="ex-tests" class="stack-sm"></div>'),
      K.Notice({ tone:'info', body:'Net otomatik hesaplanır: doğru − yanlış/4. Boş bırakılan testler kaydedilmez.' }),
    ]);

    UI.sheet({
      title:yz('ays.exams.deneme-ekle'), subtitle:yz('ays.exams.hizli-kayit-hedef-60'),
      body:String(body),
      footer:String(html`${K.Button({ label:yz('ays.exams.vazgec'), act:'sheet-close' })}${K.Button({ label:yz('ays.exams.kaydet'), tone:'primary', act:'save-exam' })}`),
    });

    renderTemplateRows('tyt-full');
    const sel = document.getElementById('ex-tmpl');
    sel.addEventListener('change', () => {
      renderTemplateRows(sel.value);
      const t = R.EXAM_TEMPLATES.find(x => x.id === sel.value);
      document.getElementById('ex-dur').value = t.duration;
    });

    /* Tahminin KÖRLÜĞÜ yazıldığı anda ölçülür, kayıt anında değil: o an
       satırlar boşsa tahmin gerçekten bir tahmindir. Sonradan bakıp
       "boş mıydı" diye sormanın yolu yok — bu yüzden burada damgalanır. */
    const tahmin = document.getElementById('ex-guess');
    if(tahmin){
      /* Yalnızca SONUÇ hücrelerine bakılır. Test adı alanı da `data-t`
         taşır ve şablondan dolu gelir; ona bakmak her tahmini «kör değil»
         yapardı. */
      const bosMu = () => ['c', 'w', 'b'].every(k => Array.prototype.slice
        .call(document.querySelectorAll('#ex-tests [data-t="' + k + '"]'))
        .every(i => String(i.value).trim() === ''));
      tahmin.dataset.rowsEmpty = 'true';
      tahmin.addEventListener('input', () => {
        /* Bir kez "kör değil" olan tahmin geri KÖR olamaz: satırları
           silip tahmini düzeltmek, sonucu görmüş olmayı geri almaz. */
        if(tahmin.dataset.rowsEmpty === 'false') return;
        tahmin.dataset.rowsEmpty = bosMu() ? 'true' : 'false';
      });
    }
  }

  function renderTemplateRows(tmplId){
    const t = R.EXAM_TEMPLATES.find(x => x.id === tmplId);
    const wrap = document.getElementById('ex-tests');
    if(!wrap || !t) return;
    const cell = (key, ph) => K.Input({ size:'sm', numeric:true, class:'input--cell', type:'number',
      placeholder:ph, aria:ph, data:{ 'data-t':key } });
    wrap.innerHTML = String(html`
      <span class="mono-label">${yz('ays.exams.test-sonuclari')}</span>
      ${map(t.tests, test => html`
        <div class="row-sm" data-test-row>
          ${K.Input({ size:'sm', class:'grow', value:test.name, aria:yz('ays.exams.test-adi'), data:{ 'data-t':'name' } })}
          ${cell('c', 'D')}${cell('w', 'Y')}${cell('b', 'B')}
          <span class="tiny dim w-34 right">/${test.q}</span>
        </div>`)}`);
  }

  function errorSheet(examId, errorId){
    const exam = S.exams.find(e => e.id === examId);
    const err = errorId ? S.errors.find(e => e.id === errorId) : null;
    const testOptions = exam.tests.map(t => ({ value:t.name, label:t.name }));
    const tagOptions = Object.keys(R.ERROR_TAGS).map(k => ({ value:k, label:k+' — '+R.ERROR_TAGS[k].name }));
    const topicOptions = [{ value:'', label:yz('ays.exams.konu') }].concat(
      R.SUBJECTS.reduce((acc, s) => acc.concat(s.topics.map(t => ({ value:s.id+'::'+t.id, label:s.name+' · '+t.name }))), [])
    );
    const v = (field, fallback) => err ? (err[field] == null ? '' : err[field]) : (fallback == null ? '' : fallback);

    const body = K.Stack([
      html`<span class="mono-label">${yz('ays.exams.kimlik')}</span>`,
      K.Cols(3, [
        K.Field({ label:yz('ays.exams.test'), input:K.Select({ id:'er-test', options:testOptions, value:v('testName') }) }),
        K.Field({ label:yz('ays.exams.soru-no'), input:K.Input({ id:'er-no', type:'number', numeric:true, value:v('questionNo') }) }),
        K.Field({ label:yz('ays.exams.durum'), input:K.Select({ id:'er-status', options:['Yanlış', 'Boş', 'Yavaş'], value:v('status', 'Yanlış') }) }),
      ]),
      K.Field({ label:yz('ays.exams.ders-konu'), input:K.Select({ id:'er-topic', options:topicOptions, value:v('topicRef') }) }),
      html`<span class="mono-label">${yz('ays.exams.etiket-ve-kok-neden')}</span>`,
      K.Cols(2, [
        K.Field({ label:yz('ays.exams.etiket'), input:K.Select({ id:'er-tag', options:tagOptions, value:v('tag', 'K') }) }),
        K.Field({ label:yz('ays.exams.harcanan-sure-sn'), input:K.Input({ id:'er-secs', type:'number', numeric:true, value:v('seconds') }) }),
      ]),
      K.Field({ label:yz('ays.exams.kok-neden-tek-somut'), hint:'“dikkatsizlik” son açıklama değildir',
        input:K.Input({ id:'er-root', value:v('rootCause'), placeholder:yz('ays.exams.or-birimi-cevirmeden-isleme') }) }),
      K.Field({ label:yz('ays.exams.dogru-ilke-2-3-satir'),
        input:K.Textarea({ id:'er-principle', rows:2, value:v('principle'),
          placeholder:yz('ays.exams.tam-cozum-kopyalanmaz-genell') }) }),
      K.Cols(2, [
        K.Field({ label:yz('ays.exams.benzer-soru-kaynak'),
          input:K.Input({ id:'er-similar', value:v('similar'), placeholder:yz('ays.exams.or-345-tyt-mat-test') }) }),
        K.Field({ label:yz('ays.exams.tamir-recetesi'), input:K.Input({ id:'er-recipe', value:v('recipe', R.ERROR_TAGS.K.recipe) }) }),
      ]),
      K.Notice({ tone:'info', body:'Kaydedince tekrar kartı otomatik oluşur ve +1 gün / +3 gün / +1 hafta / +1 ay takvimine girer.' }),
    ]);

    UI.sheet({
      title:err ? 'Hatayı düzenle' : 'Hata ekle',
      subtitle:exam.type+' · '+U.fmtDate(exam.date),
      body:String(body), wide:true,
      footer:String(html`
        ${when(err, () => K.Button({ label:yz('ays.exams.sil'), tone:'danger', act:'delete-error', data:{ 'data-id':err.id } }))}
        ${K.Button({ label:yz('ays.exams.vazgec'), act:'sheet-close' })}
        ${K.Button({ label:yz('ays.exams.kaydet'), tone:'primary', act:'save-error',
          data:Object.assign({ 'data-exam':examId }, err ? { 'data-id':err.id } : {}) })}`),
    });

    const tagSel = document.getElementById('er-tag');
    tagSel.addEventListener('change', () => {
      document.getElementById('er-recipe').value = R.ERROR_TAGS[tagSel.value].recipe;
    });
  }

  /* DÖNEN GİDİŞAT (kullanıcı, 2026-10-02: «Genel bakış'taki özeti her yere
     yap»). Sağ sütunun beş kartı (sıralama, hedefe kalan, takvim, hacim,
     yayın merdiveni) tek küçük dönen kart; büyük kartlar baştan gizli
     (app.js SADE_GIZLI), «Göster» ile açılır. Sayı kural motorundan,
     tahmin TAHMİN etiketiyle; yeterli deneme yoksa cümle. */
  function DonenGidisat(){
    const V = VT();
    if(!V || !V.donen) return '';
    const L = window.LIFEOS || {};
    const sayi = s => L.SAYI ? L.SAYI.html(s) : U.esc(String(s.deger) + (s.birim ? ' ' + s.birim : ''));
    const m = [];
    const est = C.estimateScore();
    m.push(est.ok
      ? { ust:yz('ays.exams.siralama'), sayi:sayi({ deger:est.rank, kesinlik:'estimated', formul:'son tam denemelerin medyanı → sıra modeli' }),
          cumle:yz('ays.exams.en-olasi'), vurgu:U.fmtNum(est.rankBest) + '–' + U.fmtNum(est.rankWorst) + ' · ' + est.samples + ' tam deneme.', sistem:'ays' }
      : { ust:yz('ays.exams.siralama'), cumle:yz('ays.exams.tahmin-icin-3-tam-deneme'), vurgu:C.fullExams('TYT').length + ' tam deneme var.', sistem:'ays' });
    const gap = C.netGapToTarget();
    const tyt = C.fullExams('TYT');
    if(gap && tyt.length){
      const hafta = Math.max(1, Math.ceil(U.diffDays(U.todayISO(), R.PLAN.examTytISO) / 7));
      const kalan = Math.max(0, gap.netDiff);
      m.push({ ust:yz('ays.exams.hedefe-kalan'), sayi:sayi({ deger:r2(kalan), birim:'net', ondalik:2, kesinlik:'estimated' }), cumle:yz('ays.exams.kaldi'),
        vurgu:gap.reached ? 'Hedef bandın üstündesin.' : 'Haftada +' + U.fmtNet(r2(kalan / hafta)) + ' net yeter.', sistem:'ays' });
    }
    const plan = sonrakiDenemeler();
    if(plan.length){
      const g = U.diffDays(U.todayISO(), plan[0]);
      m.push({ ust:yz('ays.exams.sonraki-deneme'), cumle:U.fmtShort(plan[0]) + '.', vurgu:(g < 7 ? g + ' gün sonra' : Math.round(g / 7) + ' hafta sonra') + ' · plandan.',
        sistem:'ays', dugme:{ label:yz('ays.exams.sureli-basla'), act:'run-open' } });
    }
    return raw(V.donen({ id:'ays-deneme', ad:yz('ays.exams.gidisat'), maddeler:m }));
  }

  /* PANO KARTLARI (2026-10-20; brand/ortak/pano.js): TYT neti son
     denemelerde sütun (son deneme vurgulu) ve son tam denemenin ders ders
     doğru oranı (sağda net). Deneme yoksa boş hâl. */
  function PanoDeneme(){
    const P = (window.LIFEOS || {}).PANO;
    if(!P) return '';
    const tr = C.medianTrend('TYT');
    const tam = (S.exams || []).filter(e => e.family === 'TYT' && e.kind === 'full').sort((a, b) => a.date.localeCompare(b.date));
    if(!tam.length) return '<div class="pk-ust">' + P.izgara([P.kart({ tur:'net', ad:yz('ays.exams.tyt-neti'), simge:'egri',
      bos:{ cumle:yz('ays.exams.henuz-tam-tyt-denemesi-yok'), dugme:{ label:yz('ays.exams.deneme-gir'), act:'new-exam' } } })], 'pk-izgara--iki') + '</div>';
    const son = tr.series.slice(-8);
    const v = x => U.fmtNum ? U.fmtNum(x) : String(x);
    const netKart = P.kart({ tur:'net', ad:yz('ays.exams.tyt-neti'), simge:'egri', yuva:'son ' + son.length + ' deneme',
      govde:P.deger(v(son[son.length - 1]), 'net', tr.delta != null ? 'son 3 medyanı ' + v(tr.last3) + ' · önceki 3 ile fark ' + (tr.delta >= 0 ? '+' : '−') + v(Math.abs(tr.delta)) : 'fark için en az 6 deneme gerekir')
        + P.sutun({ degerler:son, yukseklik:56, etiket:yz('ays.exams.son') + son.length + ' TYT denemesinin neti; sonuncusu ' + v(son[son.length - 1]) }) });
    const e = tam[tam.length - 1];
    const satir = (e.tests || []).map(t => {
      const q = (Number(t.correct) || 0) + (Number(t.wrong) || 0) + (t.blank != null ? Number(t.blank) : 0);
      return { ad:t.name, oran:q ? (Number(t.correct) || 0) / q : null, metin:v(U.round(M.testNet(t), 2)) };
    });
    const dersKart = satir.length ? P.kart({ tur:'ders-net', ad:yz('ays.exams.son-deneme-ders-ders'), simge:'satir', yuva:U.fmtShort ? U.fmtShort(e.date) : e.date,
      govde:P.cubuklar({ satirlar:satir }) + P.not('çubuk: doğru oranı · sağda net') }) : '';
    /* Rekor (yıldız): en yüksek TYT neti; analiz borcu: analizi bekleyen deneme. */
    const enIyi = tam.reduce((m, x) => M.examNet(x) > M.examNet(m) ? x : m, tam[0]);
    const rekor = P.kart({ tur:'net-rekoru', ad:yz('ays.exams.en-iyi-tyt'), yildiz:'rekor',
      govde:P.deger(v(U.round(M.examNet(enIyi), 2)), 'net', (U.fmtShort ? U.fmtShort(enIyi.date) : enIyi.date) + (enIyi.publisher ? ' · ' + enIyi.publisher : ''))
        + P.not(enIyi === e ? 'Son deneme rekor.' : 'Son denemeyle fark ' + v(U.round(M.examNet(enIyi) - M.examNet(e), 2)) + ' net.') });
    const borc = C.analysisDebt();
    const borcKart = borc.length ? P.kart({ tur:'analiz-borcu', ad:yz('ays.exams.analiz-bekleyen'), simge:'satir', yuva:borc.length + ' deneme',
      govde:P.liste({ satirlar:borc.slice(0, 4).map(x => ({ sol:U.fmtShort ? U.fmtShort(x.date) : x.date, ad:(x.family || '') + ' ' + (x.kind === 'full' ? 'tam' : 'branş'),
        not:U.diffDays(x.date, U.todayISO()) + ' gün önce', nokta:U.diffDays(x.date, U.todayISO()) >= 3 ? 2 : 0 })) })
        + P.not('Analiz yanlışları kart ve konuya çevirir; bekleyen deneme ders vermez.') }) : '';
    return '<div class="pk-ust">' + P.izgara([netKart, rekor, dersKart, borcKart], 'pk-izgara--iki') + '</div>';
  }

  LIFEOS.PARCA.blok({ id:'exams.kosu', sayfa:'exams', yer:'ana', ad:'Deneme akışı', kosul:() => R.ExamRun.active(), ciz:() => runView() });
  LIFEOS.PARCA.blok({ id:'exams.detay', sayfa:'exams', yer:'ana', ad:'Deneme ayrıntısı', kosul:() => !R.ExamRun.active() && S.ui.examOpen, ciz:() => detailView(S.ui.examOpen) });
  LIFEOS.PARCA.blok({ id:'exams.pano', sayfa:'exams', yer:'ana', sira:10, ad:'Deneme özeti', kosul:() => !R.ExamRun.active() && !S.ui.examOpen, ciz:() => PanoDeneme() });
  LIFEOS.PARCA.blok({ id:'exams.liste', sayfa:'exams', yer:'ana', sira:20, ad:'Deneme listesi', kosul:() => !R.ExamRun.active() && !S.ui.examOpen, ciz:() => listView() });
  async function render(){ return String(LIFEOS.PARCA.yer('exams', 'ana', R.C)); }

  function afterRender(){
    if(R.ExamRun.active()) startTick(); else stopTick();
    sahipsizTemizle();
  }

  const handle = {
    async 'new-exam'(){ newExamSheet(); },
    async 'run-open'(){ startRunSheet(); },
    async 'run-start'(){
      const tmpl = document.getElementById('rn-tmpl').value;
      const pub = document.getElementById('rn-pub').value.trim();
      const res = R.ExamRun.start(tmpl, { publisher:pub });
      if(!res.ok){ UI.toast(res.reason); return; }
      UI.closeSheet();
      UI.toast(yz('ays.exams.oturum-basladi-kronometre-is'));
      R.App.render();
    },
    async 'run-mark'(el){
      if(R.ExamRun.mark(el.dataset.kind)) R.App.render();
    },
    async 'run-undo'(){ R.ExamRun.undoMark(); R.App.render(); },
    async 'run-pause'(){
      if(R.ExamRun.isPaused()) R.ExamRun.resume(); else R.ExamRun.pause();
      R.App.render();
    },
    async 'run-next'(){
      const next = R.ExamRun.nextTest();
      if(next) UI.toast(next.name + ' başladı');
      R.App.render();
    },
    async 'run-goto'(el){ R.ExamRun.gotoTest(Number(el.dataset.i)); R.App.render(); },
    async 'run-finish'(){ R.ExamRun.pause(); finishSheet(); },
    async 'run-cancel'(){
      UI.confirmSheet('Oturumu iptal et', 'Ölçülen süreler kaydedilmeyecek.', async () => {
        R.ExamRun.cancel();
        UI.closeSheet();
        R.App.render();
      }, true, 'Süreleri kaydetmeden kapat');
    },
    async 'run-save'(){
      const scores = [];
      document.querySelectorAll('[data-run]').forEach(el => {
        const i = Number(el.dataset.i);
        scores[i] = scores[i] || {};
        const key = el.dataset.run === 'c' ? 'correct' : el.dataset.run === 'w' ? 'wrong' : 'blank';
        scores[i][key] = Number(el.value) || 0;
      });
      const res = await R.ExamRun.finish(scores);
      UI.closeSheet();
      if(res){
        S.ui.examOpen = res.exam.id;
        UI.toast(yz('ays.exams.oturum-kaydedildi-net') + U.fmtNet(M.examNet(res.exam)));
      }
      R.App.render();
    },
    async 'exam-filter'(el){ S.ui.examFilter = el.dataset.value; S.ui.examPage = 1; R.App.render(); },
    async 'exam-page'(el){ S.ui.examPage = Number(el.dataset.page); R.App.render(); },
    async 'open-exam'(el){ S.ui.examOpen = el.dataset.id; R.App.render(); },
    async 'exam-back'(){ S.ui.examOpen = null; R.App.render(); },
    async 'save-exam'(){
      const date = document.getElementById('ex-date').value || U.todayISO();
      const tmpl = R.EXAM_TEMPLATES.find(t => t.id === document.getElementById('ex-tmpl').value);
      const publisher = document.getElementById('ex-pub').value.trim();
      const duration = Number(document.getElementById('ex-dur').value) || tmpl.duration;
      const rows = Array.prototype.slice.call(document.querySelectorAll('#ex-tests [data-test-row]'));
      const tests = rows.map((r, i) => {
        const g = sel => r.querySelector('[data-t="'+sel+'"]').value;
        const ham = { c:g('c'), w:g('w'), b:g('b') };
        /* HIC DOKUNULMAMIS SATIR ATILIR. Once bu bakilir: bos bir satirin
           "boş" sayisini soru sayisindan turetmek, girilmemis bir testi
           "kirk soru bos birakildi" diye kaydederdi. */
        const dolu = ['c','w','b'].some(k => String(ham[k]).trim() !== '');
        if(!dolu) return null;
        const c = Number(ham.c)||0, w = Number(ham.w)||0;
        /* "boş" alani BOS BIRAKILDIYSA sifir yazilmaz: sablonun soru
           sayisindan turetilir, o da yoksa bilinmiyor kalir. */
        const q = (tmpl && tmpl.tests[i]) ? tmpl.tests[i].q : null;
        const bos = M.blankCertainty(c, w, ham.b, q);
        return { name:g('name')||'Test', correct:c, wrong:w,
          blank:bos.blank, blankCert:bos.blankCert, minutes:null };
      }).filter(Boolean);

      if(!tests.length){ UI.toast(yz('ays.exams.en-az-bir-test-doldurulmali')); return; }

      const exam = {
        id:U.uid('e'), date, type:tmpl.name, templateId:tmpl.id,
        family:tmpl.family, kind:tmpl.kind,
        publisher, duration, tests, protocol:{},
        createdAt:new Date().toISOString(), analysisCompletedAt:null,
      };
      /* Tahmin, sonuclar YAZILMADAN once girilmis mi? Girilmediyse kayit
         yine tutulur ama «kor degil» isaretlenir ve puana katilmaz. */
      const tahminEl = document.getElementById('ex-guess');
      const tahmin = tahminEl ? Number(tahminEl.value) : NaN;

      await M.saveExam(exam);

      let kalibrasyonNotu = '';
      if(isFinite(tahmin) && tahminEl && tahminEl.value !== ''){
        const kor = tahminEl.dataset.rowsEmpty !== 'false';
        const acik = await R.Calib.open('exam-net', tahmin,
          { ref:exam.id, blind:kor });
        if(acik.ok){
          const kapali = await R.Calib.settle(acik.forecast.id, M.examNet(exam));
          if(kapali.ok){
            /* Sapma TEK YERDE biçimlenir (`Calib.errorText`): burası
               `exam-net`in `abs` hatasını oran sanıp 100 ile çarpıyordu
               ve 62/58 tahmini «%400» diye yazıyordu. */
            const yazi = R.Calib.errorText(kapali.forecast);
            kalibrasyonNotu = yazi ? (' · tahmin sapması ' + yazi
              + (kor ? '' : ' (kör değil, puana girmez)')) : '';
          }
        }
      }

      UI.closeSheet();
      S.ui.examOpen = exam.id;
      UI.toast(yz('ays.exams.deneme-kaydedildi-net') + U.fmtNet(M.examNet(exam)) + kalibrasyonNotu);
      R.App.render();
    },
    async 'delete-exam'(el){
      const id = el.dataset.id;
      const bagli = S.errors.filter(e => e.examId === id).length;
      UI.confirmSheet('Denemeyi sil', 'Bu deneme ve bağlı hata kayıtları silinecek. Bu işlem geri alınamaz.', async () => {
        await M.deleteExam(id);
        /* Soru fotoğrafları da cihazdan gider (core/sorufoto.js). */
        if(R.SoruFoto) await R.SoruFoto.onekSil('deneme:' + id + ':');
        S.ui.examOpen = null;
        UI.closeSheet();
        UI.toast(yz('ays.exams.deneme-silindi'));
        R.App.render();
      }, true, bagli ? 'Denemeyi ve ' + bagli + ' hata kaydını sil' : 'Denemeyi sil');
    },
    async 'protocol-step'(el){
      const exam = S.exams.find(e => e.id === S.ui.examOpen);
      exam.protocol = exam.protocol || {};
      exam.protocol[el.dataset.key] = el.checked;
      await M.saveExam(exam);
      R.App.render();
    },
    async 'complete-analysis'(el){
      const exam = S.exams.find(e => e.id === el.dataset.id);
      const errs = S.errors.filter(e => e.examId === exam.id);
      if(!errs.length){
        UI.confirmSheet('Hata kaydı yok', 'Hiç hata etiketlenmedi. Yine de analizi tamamlandı olarak işaretlemek istiyor musun?', async () => {
          exam.analysisCompletedAt = new Date().toISOString();
          await M.saveExam(exam);
          UI.closeSheet(); R.App.render();
        }, false, 'Analizi tamamlandı say');
        return;
      }
      exam.analysisCompletedAt = new Date().toISOString();
      await M.saveExam(exam);
      UI.toast(yz('ays.exams.analiz-tamamlandi'));
      R.App.render();
    },
    async 'new-error'(el){ errorSheet(el.dataset.exam); },
    async 'edit-error'(el){
      const err = S.errors.find(e => e.id === el.dataset.id);
      errorSheet(err.examId, err.id);
    },
    async 'save-error'(el){
      const examId = el.dataset.exam;
      const exam = S.exams.find(e => e.id === examId);
      const existing = el.dataset.id ? S.errors.find(e => e.id === el.dataset.id) : null;
      const topicRef = document.getElementById('er-topic').value;
      const [subjectId, topicId] = topicRef ? topicRef.split('::') : [null, null];
      const subject = subjectId ? R.SUBJECTS.find(s => s.id === subjectId) : null;
      const topic = subject ? subject.topics.find(t => t.id === topicId) : null;

      const err = Object.assign(existing || { id:U.uid('r'), createdAt:new Date().toISOString(), closedAt:null, repairDoneAt:null }, {
        examId,
        examDate:exam.date,
        publisher:exam.publisher,
        testName:document.getElementById('er-test').value,
        questionNo:document.getElementById('er-no').value,
        status:document.getElementById('er-status').value,
        tag:document.getElementById('er-tag').value,
        seconds:Number(document.getElementById('er-secs').value) || null,
        rootCause:document.getElementById('er-root').value.trim(),
        principle:document.getElementById('er-principle').value.trim(),
        similar:document.getElementById('er-similar').value.trim(),
        recipe:document.getElementById('er-recipe').value.trim(),
        topicRef, subjectId, topicId,
        topic: topic ? topic.name : '',
      });
      await M.saveError(err);

      if(!existing){
        const card = M.newCard({
          front:(err.topic || err.testName || 'Yanlış') + ' — ' + (err.rootCause || 'kök neden'),
          back:err.principle || err.recipe,
          topic:err.topic || err.testName,
          subjectId:err.subjectId,
          source:'error', sourceRef:err.id,
        });
        await M.saveCard(card);
      }
      UI.closeSheet();
      UI.toast(existing ? 'Hata güncellendi' : 'Hata ve tekrar kartı kaydedildi');
      R.App.render();
    },
    async 'delete-error'(el){
      await M.deleteError(el.dataset.id);
      UI.closeSheet();
      UI.toast(yz('ays.exams.hata-silindi'));
      R.App.render();
    },

    /* ---------- soru analizi (core/denemeanaliz.js) ---------- */
    async 'da-giris'(el){
      const exam = S.exams.find(e => e.id === el.dataset.id);
      if(exam) anahtarSheet(exam);
    },
    async 'da-kaydet'(el){
      const A = R.DenemeAnaliz, exam = S.exams.find(e => e.id === el.dataset.id);
      if(!exam) return;
      const deger = id => { const x = document.getElementById(id); return x ? x.value : ''; };
      const r = await A.girdileriYaz(exam, exam.tests.map((t, i) => ({ test:t.name, anahtar:deger('da-a-' + i), cevap:deger('da-c-' + i) })));
      if(!r.ok){
        const not = document.getElementById('da-not');
        if(not) not.textContent = 'Kaydedilmedi — ' + r.hatalar.join(' · ');
        return;
      }
      UI.closeSheet();
      UI.toast(A.ozet(exam).analizli ? U.plural(A.yanlislar(exam).length, 'yanlış ya da boş soru', 'yanlış ya da boş soru') + ' listelendi'
        : 'Anahtar kaydedildi; cevaplarını da yazınca sorular listelenir');
      R.App.render();
    },
    async 'da-guncelle'(el){
      const exam = S.exams.find(e => e.id === el.dataset.id);
      if(!exam) return;
      const n = await R.DenemeAnaliz.kaydiGuncelle(exam);
      UI.toast(n ? n + ' testin sayıları anahtara göre güncellendi · geri alabilirsin' : 'Güncellenecek fark yok');
      R.App.render();
    },
    async 'da-geri'(el){
      const exam = S.exams.find(e => e.id === el.dataset.id);
      if(!exam) return;
      const r = await R.DenemeAnaliz.geriAl(exam);
      UI.toast(!r.ok ? 'Geri alınacak güncelleme yok'
        : r.atlanan.length ? 'Önceki sayılar geri geldi; elle düzelttiğin ' + r.atlanan.join(', ') + ' olduğu gibi kaldı'
        : 'Önceki sayılar geri geldi');
      R.App.render();
    },
    async 'da-coz'(el){
      const A = R.DenemeAnaliz, exam = S.exams.find(e => e.id === S.ui.examOpen);
      if(!exam) return;
      const r = await UI.withBusy('Soru çözülüyor', 'model anahtarı görmeden çözer; tutup tutmadığına kod bakar',
        () => A.coz(exam, el.dataset.key));
      if(!r.ok){ UI.toast(r.note); R.App.render(); return; }
      const konu = r.topicRef ? A.konuBul(r.topicRef) : null;
      const parca = [r.tutar === true ? 'Çözüm anahtarla tutuyor'
        : r.tutar === false ? 'Modelin cevabı (' + r.harf + ') anahtarla (' + r.dogru + ') tutmuyor'
        : 'Model şık bildirmedi; karşılaştırılamadı'];
      if(konu) parca.push('konu: ' + konu.topic.name);
      if(r.konuNotu) parca.push(r.konuNotu);
      UI.toast(parca.join(' · '));
      R.App.render();
    },
    async 'da-hata'(el){
      const exam = S.exams.find(e => e.id === S.ui.examOpen);
      if(!exam) return;
      const r = await R.DenemeAnaliz.hatayaEkle(exam, el.dataset.key);
      UI.toast(!r.ok ? r.note : r.vardi ? 'Bu soru zaten hata kaydında'
        : 'Hata ve tekrar kartı kaydedildi · etiketini ve kök nedenini Hata analizinden yaz');
      R.App.render();
    },
    async 'da-hepsi'(el){
      const exam = S.exams.find(e => e.id === el.dataset.id);
      if(!exam) return;
      const n = await R.DenemeAnaliz.hepsiniEkle(exam);
      UI.toast(n ? n + ' hata ve tekrar kartı kaydedildi' : 'Eklenecek soru yok');
      R.App.render();
    },
  };

  const change = {
    async 'ex-foto'(el){
      const f = el.files && el.files[0];
      const sel = document.getElementById('ex-tmpl');
      const tmpl = R.EXAM_TEMPLATES.find(t => t.id === (sel && sel.value));
      const not = document.getElementById('ex-foto-not');
      if(!f || !tmpl) return;
      const r = await UI.withBusy('Sonuç kâğıdı okunuyor', 'sayıları kod doğrular, kaydetmek sende',
        () => R.DenemeFoto.oku(f, tmpl));
      const satirlar = Array.prototype.slice.call(document.querySelectorAll('#ex-tests [data-test-row]'));
      (r.satirlar || []).forEach(x => {
        const row = satirlar[x.i];
        if(!row) return;
        const yaz = (k, v) => { const i = row.querySelector('[data-t="' + k + '"]'); if(i) i.value = v == null ? '' : String(v); };
        yaz('c', x.c); yaz('w', x.w); yaz('b', x.b);
      });
      if(not){
        const parca = [];
        if(r.satirlar && r.satirlar.length) parca.push(r.satirlar.length + ' test fotoğraftan dolduruldu — kaydetmeden önce kontrol et.');
        (r.atlanan || []).forEach(a => parca.push(a.ad + ': ' + a.neden + '.'));
        if(r.eksik && r.eksik.length && r.satirlar && r.satirlar.length) parca.push('Elle yazılacak: ' + r.eksik.join(', ') + '.');
        if(!r.ok && r.note) parca.push(r.note);
        not.textContent = parca.join(' ');
      }
    },
    async 'test-num'(el){
      const exam = S.exams.find(e => e.id === S.ui.examOpen);
      exam.tests[Number(el.dataset.i)][el.dataset.field] = Number(el.value)||0;
      await M.saveExam(exam);
      R.App.render();
    },
    async 'test-minutes'(el){
      const exam = S.exams.find(e => e.id === S.ui.examOpen);
      exam.tests[Number(el.dataset.i)].minutes = el.value === '' ? null : Number(el.value);
      await M.saveExam(exam);
    },
    async 'da-foto'(el){
      const exam = S.exams.find(e => e.id === S.ui.examOpen);
      const f = el.files && el.files[0];
      if(!exam || !f || !R.SoruFoto) return;
      const r = await R.SoruFoto.kaydet(R.DenemeAnaliz.sahip(exam, el.dataset.key), f);
      UI.toast(r.ok ? 'Fotoğraf bu cihaza kaydedildi' : r.why);
      R.App.render();
    },
    async 'da-konu'(el){
      const exam = S.exams.find(e => e.id === S.ui.examOpen);
      if(!exam) return;
      const r = await R.DenemeAnaliz.konuYaz(exam, el.dataset.key, el.value, 'elle');
      if(!r.ok) UI.toast(r.note);
      R.App.render();
    },
  };

  return {
    id:'exams',
    title:yz('ays.exams.deneme-2'),
    subtitle(){
      const debt = C.analysisDebt().length;
      return S.exams.length + ' deneme' + (debt ? ' · ' + debt + ' analiz borcu' : ' · analiz borcu yok');
    },
    actions(){
      if(R.ExamRun.active()) return '';
      return String(html`
        ${K.Button({ label:yz('ays.exams.sureli-oturum'), icon:'clock', size:'sm', act:'run-open' })}
        ${K.Button({ label:yz('ays.exams.deneme-ekle'), icon:'plus', size:'sm', tone:'primary', act:'new-exam' })}`);
    },
    onKey(e){
      if(!R.ExamRun.active() || UI.isSheetOpen()) return;
      if(e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      const keys = { '1':'ok', '2':'slow', '3':'skip' };
      if(keys[e.key]){ e.preventDefault(); handle['run-mark']({ dataset:{ kind:keys[e.key] } }); }
    },
    render, afterRender, handle, change,
  };
})();
