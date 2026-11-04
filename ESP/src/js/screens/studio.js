/* Stüdyo — gitar metronomu ve diksiyon kaydı.

   Üç sekme: Müzik · Diksiyon · İlerleme.

   İki disiplin aynı ekranda çünkü aynı katmanı paylaşıyorlar
   (core/acoustic.js): ikisi de zamanlamayı ölçer, ikisi de «temiz tekrar»
   sayar, ikisinin de kuralı aynıdır — hız bir sonuçtur, hedef değil.

   Bu ekran ses DİNLEMEZ. Metronom ses ÜRETİR (Web Audio), ama mikrofon hiç
   açılmaz ve hiçbir kayıt dosyası oluşmaz. Diksiyonda saklanan şey süre,
   kelime sayısı ve kendi işaretlediğin hata sayısıdır. */

window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};
window.LIFEOS.PARCA.yazilar({
  'esp.studio.muzik':'Müzik',
  'esp.studio.diksiyon':'Diksiyon',
  'esp.studio.kulak':'Kulak',
  'esp.studio.ogren':'Öğren',
  'esp.studio.i-lerleme':'İlerleme',
  'esp.studio.tezgah':'Tezgâh',
  'esp.studio.kulak-egzersizleri':'Kulak egzersizleri',
  'esp.studio.kademe':'Kademe',
  'esp.studio.araliklar':'Aralıklar',
  'esp.studio.yarim-ses':'Yarım ses',
  'esp.studio.caged':'Caged',
  'esp.studio.desifre':'Deşifre',
  'esp.studio.repertuar-bakimi':'Repertuar bakımı',
  'esp.studio.bakimsiz-parca-yok-ya-da':'Bakımsız parça yok ya da henüz deneme kaydı girilmedi.',
  'esp.studio.tarayici-ses-uretemiyor':'Tarayıcı ses üretemiyor',
  'esp.studio.bam-alistirmasi':'BAM alıştırması',
  'esp.studio.tempolar-referans':'— tempolar referans.',
  'esp.studio.temiz-esik':'Temiz eşik',
  'esp.studio.siradaki-basamak':'Sıradaki basamak',
  'esp.studio.bpm':'BPM (+',
  'esp.studio.bpm-2':'BPM',
  'esp.studio.sil':'Sil',
  'esp.studio.parcalar':'Parçalar',
  'esp.studio.metronom':'Metronom',
  'esp.studio.olcu-turu':'Ölçü türü',
  'esp.studio.tekrar-kaydet':'Tekrar kaydet',
  'esp.studio.tekrarin-yazilacagi-parca':'Tekrarın yazılacağı parça',
  'esp.studio.temiz-tekrar':'Temiz tekrar',
  'esp.studio.hatali-tekrar':'Hatalı tekrar',
  'esp.studio.henuz-parca-ya-da-teknik':'Henüz parça ya da teknik yok. Aşağıdan ekleyebilirsin.',
  'esp.studio.parca-ekle':'Parça ekle',
  'esp.studio.ad':'Ad',
  'esp.studio.donusumlu-mizrap':'Dönüşümlü mızrap',
  'esp.studio.tur':'Tür',
  'esp.studio.teknik':'Teknik',
  'esp.studio.parca':'Parça',
  'esp.studio.hedef-bpm':'Hedef BPM',
  'esp.studio.ekle':'Ekle',
  'esp.studio.hazir-teknikler':'Hazır teknikler:',
  'esp.studio.paket-iste':'Paket iste',
  'esp.studio.duzey':'Düzey',
  'esp.studio.baslangic':'Başlangıç',
  'esp.studio.orta':'Orta',
  'esp.studio.i-leri':'İleri',
  'esp.studio.konu-akor-gecisleri-blues':'Konu: akor geçişleri, blues…',
  'esp.studio.konu':'Konu',
  'esp.studio.king-e-ilet':'King’e ilet',
  'esp.studio.gam-ve-mod-cetveli':'Gam ve mod cetveli',
  'esp.studio.kok-ses-tonalite':'Kök ses (tonalite):',
  'esp.studio.gam-mod-12-oruntu':'Gam / mod (12 örüntü):',
  'esp.studio.yarim-ses-adimlari':'Yarım ses adımları:',
  'esp.studio.144-modulasyon-permutasyonu':'· 144 modülasyon permütasyonu hazırdır.',
  'esp.studio.calisma-metni':'Çalışma metni',
  'esp.studio.kelime':'kelime ·',
  'esp.studio.telaffuz-kurallari':'Telaffuz kuralları',
  'esp.studio.ornek':'(örnek:',
  'esp.studio.konu-turkce-vurgu-r-sesi':'Konu: Türkçe vurgu, r sesi, sesli okuma…',
  'esp.studio.diksiyon-belgesi-konusu':'Diksiyon belgesi konusu',
  'esp.studio.kayit-olcumu':'Kayıt ölçümü',
  'esp.studio.sure-saniye':'Süre (saniye)',
  'esp.studio.kelime-2':'Kelime',
  'esp.studio.hata-sayisi':'Hata sayısı',
  'esp.studio.olcumu-kaydet':'Ölçümü kaydet',
  'esp.studio.konusma-hizi':'Konuşma hızı',
  'esp.studio.son-30-gunde-kayit-yok':'Son 30 günde kayıt yok.',
  'esp.studio.medyan-hiz':'Medyan hız (',
  'esp.studio.kendi-isaretledigin-hata-ora':'Kendi işaretlediğin hata oranı medyanı %',
  'esp.studio.tahmin-etiketlidir-yalnizca':'— tahmin etiketlidir, yalnızca kendi geçmişinle karşılaştırılır.',
  'esp.studio.nefes-ve-vurgu':'Nefes ve vurgu',
  'esp.studio.sure':'Süre',
  'esp.studio.son-kayitlar':'Son kayıtlar',
  'esp.studio.wpm':'WPM',
  'esp.studio.hata':'Hata',
  'esp.studio.henuz-olcum-yok':'Henüz ölçüm yok.',
  'esp.studio.plato':'Plato',
  'esp.studio.gun':'Gün',
  'esp.studio.hedefe-ulasma':'Hedefe ulaşma',
  'esp.studio.hedef-tempoya-ulasan-parca-o':'Hedef tempoya ulaşan parça oranı',
  'esp.studio.hedef-bpm-girilmis-ve-esigi':'Hedef BPM girilmiş ve eşiği ölçülmüş parça yok.',
  'esp.studio.diksiyon-egilimi':'Diksiyon eğilimi',
  'esp.studio.isinma-sirasi':'Isınma sırası',
  'esp.studio.dakika':'Dakika',
  'esp.studio.muzik-konulari':'Müzik konuları',
  'esp.studio.diksiyon-konulari':'Diksiyon konuları',
  'esp.studio.son':'Son ',
  'esp.studio.diksiyon-hiz':'Diksiyon · hız',
  'esp.studio.studyo-bolumleri':'Stüdyo bölümleri',
  'esp.studio.ad-gerekir':'Ad gerekir',
  'esp.studio.bu-teknik-zaten-var':'Bu teknik zaten var',
  'esp.studio.sure-girilmedi':'Süre girilmedi',
  'esp.studio.olcum-kaydedildi':'Ölçüm kaydedildi',
  'esp.studio.once-parca-ekle':'Önce parça ekle',
  'esp.studio.studyo':'Stüdyo',
  'esp.studio.parca-2':'parça',
  'esp.studio.kayit':'kayıt',
});
window.LIFEOS.PARCA.sayfa({ id:'studio', modul:'esp', cekmece:'calisma', ad:'Ses', ikon:'wave', ek:{ disc:['music', 'diction'] }, sira:40 });

ESP.Screens.studio = (function(){
  const U = ESP.U, M = ESP.Model, S = ESP.S;
  const { html, raw, when, map } = ESP.h;
  const K = ESP.C;

  const TABS = [
    { id:'muzik',    label:yz('esp.studio.muzik') },
    { id:'diksiyon', label:yz('esp.studio.diksiyon') },
    { id:'kulak',    label:yz('esp.studio.kulak') },
    { id:'ogren',    label:yz('esp.studio.ogren') },
    { id:'ilerleme', label:yz('esp.studio.i-lerleme') },
    /* iPhone Faz 2c: iki masa (müzik, diksiyon) öbür ekranlardaki gibi kendi
       bölümünde; Müzik ve Diksiyon işle başlar. */
    { id:'tezgah',   label:yz('esp.studio.tezgah') },
  ];

  /* ------------------------------------------------------------------ kulak

     Metronom parmakları eğitir, kulak eğitmez. Hızlı çalan ama duymayan
     biri repertuarını genişletemez: her yeni parçayı sıfırdan ezberler.

     Buradaki hiçbir egzersiz bir yetenek testi değildir — «mutlak kulak»
     diye bir kapı yok ve bilerek yok (ESP.PEDAGOGIC §talent). Ölçülen tek
     şey, deneme başına isabet. */
  function earRows(){
    const eskiyen = (S.pieces || []).filter(p => {
      if(p.kind !== 'piece') return false;
      const son = (p.attempts || []).slice(-1)[0];
      if(!son) return false;
      return U.diffDays(son.date, U.todayISO()) > ESP.REPERTOIRE_STALE_DAYS;
    });

    return [
      K.Entry({
        label:yz('esp.studio.kulak-egzersizleri'), hint:'ear',
        meta:ESP.EAR_DRILLS.length + ' egzersiz',
        wide:true,
        body:K.Table({ tight:true,
          headers:[{ label:yz('esp.studio.kademe'), num:true }, 'Egzersiz', 'Ne yapılır', 'Ne ölçülür'],
          rows:ESP.EAR_DRILLS.map(d => [String(d.level), d.label, d.task, d.measures]) }),
      }),

      K.Entry({
        label:yz('esp.studio.araliklar'), hint:'interval',
        meta:ESP.INTERVALS.length + ' aralık',
        wide:true,
        body:K.Table({ tight:true,
          headers:['Aralık', { label:yz('esp.studio.yarim-ses'), num:true }, 'Kanca'],
          rows:ESP.INTERVALS.map(i => [i.label, String(i.semitones), i.hook]) }),
      }),

      K.Entry({
        label:yz('esp.studio.caged'), hint:'caged',
        meta:'beş şekil',
        body:K.Table({ tight:true, headers:['Şekil', 'Kök', 'Not'],
          rows:ESP.CAGED.map(c => [c.shape, c.root, c.note]) }),
      }),

      K.Entry({
        label:yz('esp.studio.desifre'), hint:'sight-reading',
        meta:ESP.SIGHT_READING.length + ' kademe',
        body:K.Table({ tight:true, headers:[{ label:yz('esp.studio.kademe'), num:true }, 'Ne', 'Nasıl'],
          rows:ESP.SIGHT_READING.map(s => [String(s.level), s.label, s.task]) }),
      }),

      K.Entry({
        label:yz('esp.studio.repertuar-bakimi'), hint:'repertoire',
        meta:eskiyen.length ? eskiyen.length + ' bakımsız' : 'güncel',
        body:eskiyen.length
          ? K.Table({ tight:true, headers:['Parça', 'Son çalınma'],
              rows:eskiyen.map(p => {
                const son = (p.attempts || []).slice(-1)[0];
                return [p.name, son ? son.date : '—'];
              }) })
          : K.Empty({ text:yz('esp.studio.bakimsiz-parca-yok-ya-da') }),
      }),
    ];
  }

  /* --------------------------------------------------------------- metronom

     Ses üretimi burada, zamanlama hesabı core/acoustic.js'te. Ayrım kasıtlı:
     «80 BPM'de vuruş kaç ms» sorusu tarayıcısız test edilebilmeli.

     AudioContext yalnızca kullanıcı düğmeye bastığında açılır: tarayıcılar
     etkileşim olmadan ses bağlamı açmaya izin vermez ve sessizce başarısız
     olur. */
  let ctx = null, timer = null, nextTick = 0, beat = 0;

  function metronomeStart(bpm, beatsPerBar){
    metronomeStop();
    try{
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    }catch(e){ ESP.UI.toast(yz('esp.studio.tarayici-ses-uretemiyor')); return false; }
    const ms = ESP.Acoustic.beatMs(bpm);
    if(ms == null) return false;
    const bar = beatsPerBar || 4;
    beat = 0;
    nextTick = ctx.currentTime + 0.06;
    timer = setInterval(() => {
      /* Ileriye bak: setInterval'in kaymasi duyulur, zamanlanmis osilatorun
         kaymasi duyulmaz. 120 ms'lik bir pencereyi onceden doldururuz. */
      while(nextTick < ctx.currentTime + 0.12){
        tick(nextTick, beat % bar === 0);
        nextTick += ms / 1000;
        beat++;
      }
    }, 25);
    return true;
  }

  function tick(at, accent){
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = accent ? 1320 : 880;
    gain.gain.setValueAtTime(accent ? 0.22 : 0.12, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(at); osc.stop(at + 0.06);
  }

  function metronomeStop(){
    if(timer){ clearInterval(timer); timer = null; }
  }

  /* ------------------------------------------------------------------ müzik */

  /* iPhone Faz 2c (2026-10-02): her parça ayrı bir «TEKNİK» kartıydı (altı
     parçada 3 600 px; hepsi aynı başlıkta olduğu için tek tek gizlenemiyordu).
     Şimdi tek «Parçalar» listesi: satırda ad ve temiz eşik / hedef; dokununca
     eşik çubuğu, sıradaki basamak, son tekrarlar ve Sil açılır. İlk beş +
     «Tümü»; tekrarı yazılan (seçili) parça her zaman görünür ve açıktır.
     Hiçbir bilgi kalkmadı: satırın içinde durur. */
  const PARCA_ILK = 5;
  function parcalarEntry(parcalar){
    const tumu = !!S.ui.parcaTumu;
    const secili = S.ui.pieceOpen ? parcalar.find(p => p.id === S.ui.pieceOpen) : null;
    let gosterilen = tumu ? parcalar : parcalar.slice(0, PARCA_ILK);
    if(secili && gosterilen.indexOf(secili) < 0) gosterilen = gosterilen.concat([secili]);
    const satir = p => {
      const t = ESP.Acoustic.cleanThreshold(p);
      const next = ESP.Acoustic.nextStep(p);
      const sonDeneme = (p.attempts || []).slice(-6).reverse();
      const esik = t.cert === 'missing' ? 'eşik yok'
        : t.value + (p.targetBpm ? ' / ' + p.targetBpm + (p.targetRef ? ' (referans)' : '') : '') + ' BPM';
      return html`<details class="acsatir parca"${raw(secili === p ? ' open' : '')}>
        <summary class="acsatir__ozet">
          <span class="acsatir__ad">${p.name}</span>
          <span class="acsatir__tur">${p.kind === 'technique' ? 'teknik' : 'parça'}</span>
          <span class="acsatir__deger num">${esik}</span>
        </summary>
        <div class="acsatir__govde">
          ${when((p.tags || []).indexOf('bam') >= 0, () => html`<p class="small muted">
            ${yz('esp.studio.bam-alistirmasi')}${p.key ? ' · ' + p.key : ''}${(p.progression || []).length
              ? ' · ' + p.progression.join('–') : ''}${p.startBpm ? ' · başlangıç ' + p.startBpm + ' BPM' : ''}
            ${yz('esp.studio.tempolar-referans')}${p.note ? ' ' + p.note : ''}</p>`)}
          ${t.cert === 'missing'
            ? K.Notice({ tone:'info', body:t.why || 'Bu parçada ölçülmüş temiz eşik yok. '
                + 'Tempo girip «temiz» işaretlediğinde ölçüm başlar.' })
            : html`${K.Meter({ label:yz('esp.studio.temiz-esik'),
                value:p.targetBpm ? Math.min(100, t.value / p.targetBpm * 100) : 50,
                text:t.value + ' BPM' + (p.targetBpm ? ' / ' + p.targetBpm : ''),
                tone:p.targetBpm && t.value >= p.targetBpm ? 'ok' : '' })}
              ${when(next.cert !== 'missing', () => html`<p class="small muted mt-8">
                ${yz('esp.studio.siradaki-basamak')} ${next.value} ${yz('esp.studio.bpm')}${ESP.Acoustic.BPM_STEP}).</p>`)}`}
          ${when(sonDeneme.length, () => K.Table({ tight:true,
            headers:['Tarih', { label:yz('esp.studio.bpm-2'), num:true }, 'Temiz'],
            rows:sonDeneme.map(a => [U.fmtShort(a.date), String(a.bpm),
              a.clean ? 'evet' : 'hayır']) }))}
          <div class="mt-8">${K.Button({ label:yz('esp.studio.sil'), size:'sm', act:'del-piece', data:{ 'data-id':p.id } })}</div>
        </div>
      </details>`;
    };
    return K.Entry({
      label:yz('esp.studio.parcalar'), hint:'clean-bpm', meta:parcalar.length + ' parça', wide:true,
      body:html`<div class="parcalar">${map(gosterilen, satir)}</div>
        ${when(parcalar.length > PARCA_ILK, () => K.Button({ size:'sm', tone:'ghost', act:'parca-tumu', class:'mt-8',
          label:tumu ? 'Yalnız ilk ' + PARCA_ILK : 'Tümü · ' + parcalar.length + ' parça' }))}`,
    });
  }

  function musicRows(){
    const bpm = S.ui.metronomeBpm || 80;
    const parcalar = S.pieces || [];
    const acik = S.ui.pieceOpen ? parcalar.find(p => p.id === S.ui.pieceOpen) : null;

    /* iPhone Faz 2c: iş metronom, tekrar kaydı ve parçalar. Açıklamalar ⓘ'de
       (hints: metronome, clean-bpm); vuruş aralığı künyede. */
    const rows = [
      K.Entry({
        label:yz('esp.studio.metronom'), hint:'metronome',
        meta:bpm + ' BPM · ' + U.fmtNum(Math.round(ESP.Acoustic.beatMs(bpm))) + ' ms',
        body:html`
          <div class="metro">
            <div class="metro__bpm">
              <button class="metro__step" data-act="bpm" data-d="-5" aria-label="5 azalt">−5</button>
              <span class="metro__val num">${bpm}</span>
              <button class="metro__step" data-act="bpm" data-d="5" aria-label="5 artır">+5</button>
            </div>
            <div class="metro__ctrl">
              ${K.Button({ label:S.ui.metronomeOn ? 'Durdur' : 'Başlat',
                act:'metro-toggle' })}
              ${K.Select({ id:'metro-sig', value:S.ui.metroSig || '4/4', change:'metro-sig',
                aria:yz('esp.studio.olcu-turu'),
                options:ESP.TIME_SIGNATURES.map(t => ({ value:t.id, label:t.label })) })}
            </div>
          </div>`,
      }),

      K.Entry({
        label:yz('esp.studio.tekrar-kaydet'), hint:'clean-bpm',
        meta:acik ? acik.name : 'parça seç',
        body:parcalar.length
          ? html`
            <div class="row wrap">
              ${K.Select({ id:'att-piece', value:acik ? acik.id : parcalar[0].id,
                change:'pick-piece', aria:yz('esp.studio.tekrarin-yazilacagi-parca'),
                options:parcalar.map(p => ({ value:p.id, label:p.name })) })}
              ${K.Button({ label:yz('esp.studio.temiz-tekrar'), tone:'primary', act:'log-clean' })}
              ${K.Button({ label:yz('esp.studio.hatali-tekrar'), act:'log-dirty' })}
            </div>`
          : K.Empty({ text:yz('esp.studio.henuz-parca-ya-da-teknik') }),
      }),
    ];

    if(parcalar.length) rows.push(parcalarEntry(parcalar));

    rows.push(K.Entry({
      label:yz('esp.studio.parca-ekle'),
      meta:'teknik ya da repertuar',
      body:html`
        <div class="cols-3">
          ${K.Field({ label:yz('esp.studio.ad'), input:K.Input({ id:'p-name', placeholder:yz('esp.studio.donusumlu-mizrap') }) })}
          ${K.Field({ label:yz('esp.studio.tur'), input:K.Select({ id:'p-kind', value:'technique',
            options:[{ value:'technique', label:yz('esp.studio.teknik') }, { value:'piece', label:yz('esp.studio.parca') }] }) })}
          ${K.Field({ label:yz('esp.studio.hedef-bpm'), hint:'isteğe bağlı',
            input:K.Input({ id:'p-target', type:'number', numeric:true, min:20, max:300,
              placeholder:'120' }) })}
        </div>
        ${K.Button({ label:yz('esp.studio.ekle'), act:'add-piece', class:'mt-10' })}
        <p class="small muted mt-10">${yz('esp.studio.hazir-teknikler')}</p>
        <div class="row wrap mt-4">
          ${map(ESP.TECHNIQUES, t => K.Button({ label:t.label, size:'sm',
            act:'add-technique', data:{ 'data-id':t.id } }))}
        </div>`,
    }));

    /* BAM'dan alıştırma paketi (Part 8d-2): istek King'in onay kapısından
       geçer; paket Bugün'e teklif olarak gelir ve ESP kendi koduyla sınar. */
    rows.push(K.Entry({
      label:yz('esp.studio.paket-iste'), hint:'paket',
      meta:'gitar · HKM',
      body:html`<div class="row gap-8 wrap">
        ${K.Select({ id:'gitar-duzey', value:S.ui.gitarDuzey || 'başlangıç', aria:yz('esp.studio.duzey'), size:'sm',
          options:[{ value:'başlangıç', label:yz('esp.studio.baslangic') }, { value:'orta', label:yz('esp.studio.orta') },
            { value:'ileri', label:yz('esp.studio.i-leri') }] })}
        ${K.Input({ id:'gitar-konu', placeholder:yz('esp.studio.konu-akor-gecisleri-blues'), aria:yz('esp.studio.konu'),
          size:'sm', class:'grow' })}
        ${K.Button({ label:yz('esp.studio.king-e-ilet'), size:'sm', act:'gitar-iste' })}
      </div>`,
    }));

    rows.push(scaleCalculatorEntry());

    return rows;
  }

  function scaleCalculatorEntry(){
    const root = S.ui.scaleRoot || 'C';
    const scaleId = S.ui.scaleId || 'major';
    const notlar = ESP.scaleNotes ? ESP.scaleNotes(root, scaleId) : [];
    const scaleObj = (ESP.SCALE_BY_ID || {})[scaleId] || {};
    const rootTr = (ESP.NOTE_TR || {})[root] || root;

    return K.Entry({
      label:yz('esp.studio.gam-ve-mod-cetveli'), hint:'scale',
      meta:rootTr + ' ' + (scaleObj.label || scaleId),
      wide:true,
      body:html`
        <div class="row wrap gap-8 mb-10">
          <div class="grow" style="min-width:140px">
            <span class="tiny dim block mb-2">${yz('esp.studio.kok-ses-tonalite')}</span>
            ${K.Select({ id:'scale-root-sel', value:root, change:'pick-scale-root',
              options:ESP.NOTES.map(n => ({ value:n, label:n + ' (' + (ESP.NOTE_TR[n] || n) + ')' })) })}
          </div>
          <div class="grow" style="min-width:180px">
            <span class="tiny dim block mb-2">${yz('esp.studio.gam-mod-12-oruntu')}</span>
            ${K.Select({ id:'scale-mode-sel', value:scaleId, change:'pick-scale-mode',
              options:ESP.SCALES.map(s => ({ value:s.id, label:s.label })) })}
          </div>
        </div>
        <div class="ogrenme">
          <div class="row between gap-8 mb-6">
            <div>
              <b class="text-1">${rootTr} (${root}) ${scaleObj.label}</b>
              <span class="tiny dim block mt-2">${scaleObj.mood || ''}</span>
            </div>
            <span class="badge badge--muted tiny">${(scaleObj.steps || []).length} perde</span>
          </div>
          <div class="row wrap gap-6 my-8">
            ${map(notlar, (n, idx) => html`
              <div class="text-center ogrenme__kutu" style="min-width:44px">
                <div class="tiny dim mb-2">${idx === 0 ? 'Kök (I)' : (idx + 1) + '. der'}</div>
                <b class="small" style="color:var(--primary)">${n}</b>
                <div class="tiny dim">${ESP.NOTE_TR[n] || n}</div>
              </div>`)}
          </div>
          <div class="tiny dim pt-6 mt-6" style="border-top:1px dashed var(--border)">
            <b>${yz('esp.studio.yarim-ses-adimlari')}</b> ${(scaleObj.steps || []).join(' – ')} ${yz('esp.studio.144-modulasyon-permutasyonu')}
          </div>
        </div>`,
    });
  }

  /* --------------------------------------------------------------- diksiyon */

  function dictionRows(){
    const d = ESP.Acoustic.dictionStatus(30);
    const kayitlar = (S.recordings || []).slice(0, 10);
    /* Çalışma metinleri: yerleşik tekerlemeler + kaynaklı okuma parçaları
       (core/belge.js diksiyon belgesi). */
    const metinler = ESP.Belge ? ESP.Belge.calismaMetinleri() : ESP.TONGUE_TWISTERS;
    const secili = metinler.find(t => t.id === (S.ui.twister || 'kartal')) || metinler[0];
    const grup = secili.target ? (ESP.PHONEME_GROUPS.find(g => g.id === secili.target) || {}) : {};
    const dk = ESP.Belge ? ESP.Belge.diksiyon() : { kurallar:[], parcalar:[] };

    return [
      K.Entry({
        label:yz('esp.studio.calisma-metni'), hint:'articulation',
        meta:secili.kaynak ? 'kaynaklı okuma parçası' : 'düzey ' + secili.level + ' · ' + grup.label,
        body:html`
          <div class="row wrap">
            ${K.Select({ id:'tw-pick', value:secili.id, change:'pick-twister',
              aria:yz('esp.studio.calisma-metni'),
              options:metinler.map(t => ({ value:t.id,
                label:(t.kaynak ? 'Parça' : 'D' + t.level) + ' · ' + t.text.slice(0, 40) + '…' })) })}
          </div>
          <p class="twister mt-10">${secili.text}</p>
          <p class="small muted mt-8">${secili.words} ${yz('esp.studio.kelime')}
            ${secili.kaynak ? (secili.yazar ? secili.yazar + ' · ' : '') + 'kaynak: ' + secili.kaynak.baslik
              : (grup.note || '')}</p>`,
      }),

      /* Diksiyon belgesi (kullanıcı 2026-09-24: «ikisi birden»): telaffuz
         kuralı ve okuma parçası, BAM'ın web kaynaklarından; kural kaynağıyla. */
      K.Entry({
        label:yz('esp.studio.telaffuz-kurallari'), hint:'belge', meta:dk.kurallar.length ? dk.kurallar.length + ' kural · kaynaklı' : 'henüz yok',
        wide:true,
        body:html`
          ${when(dk.kurallar.length, () => html`<ul class="setup__list">${map(dk.kurallar, k => html`
            <li>${k.kural}${when(k.ornek, () => html` <span class="dim">${yz('esp.studio.ornek')} ${k.ornek})</span>`)}
              <span class="tiny dim"> · ${k.kaynak.baslik}</span></li>`)}</ul>`)}
          <div class="row gap-8 wrap mt-10">
            ${K.Input({ id:'belge-diksiyon', placeholder:yz('esp.studio.konu-turkce-vurgu-r-sesi'),
              aria:yz('esp.studio.diksiyon-belgesi-konusu'), size:'sm', class:'grow' })}
            ${K.Button({ label:yz('esp.studio.king-e-ilet'), size:'sm', act:'belge-iste',
              data:{ 'data-alan':'diksiyon' } })}
          </div>`,
      }),

      K.Entry({
        label:yz('esp.studio.kayit-olcumu'), hint:'kayit-olcumu',
        meta:'ses dosyası tutulmaz',
        body:html`
          <div class="cols-3">
            ${K.Field({ label:yz('esp.studio.sure-saniye'),
              input:K.Input({ id:'r-sec', type:'number', numeric:true, min:1, max:3600,
                placeholder:'12' }) })}
            ${K.Field({ label:yz('esp.studio.kelime-2'),
              input:K.Input({ id:'r-words', type:'number', numeric:true, min:1,
                value:secili.words }) })}
            ${K.Field({ label:yz('esp.studio.hata-sayisi'), hint:'kendi işaretin — tahmin sayılır',
              input:K.Input({ id:'r-err', type:'number', numeric:true, min:0,
                placeholder:'2' }) })}
          </div>
          <div class="row wrap mt-10">
            ${map(ESP.ARTICULATION_ERRORS, e => K.Button({ label:e.label, size:'sm',
              tone:(S.ui.errTags || []).indexOf(e.id) >= 0 ? 'primary' : '',
              act:'toggle-err', data:{ 'data-id':e.id } }))}
          </div>
          ${K.Button({ label:yz('esp.studio.olcumu-kaydet'), act:'add-recording', class:'mt-10' })}`,
      }),

      K.Entry({
        label:yz('esp.studio.konusma-hizi'), hint:'wpm',
        meta:d.cert === 'missing' ? 'veri yok'
          : (d.wpm.cert === 'missing' ? 'hesaplanamadı' : d.wpm.value + ' kelime/dk'),
        body:d.cert === 'missing'
          ? K.Empty({ text:yz('esp.studio.son-30-gunde-kayit-yok') })
          : html`
            ${d.wpm.cert === 'missing'
              ? K.Notice({ tone:'warn', body:'WPM için hem süre hem kelime sayısı ölçülmüş olmalı.' })
              : K.Meter({ label:yz('esp.studio.medyan-hiz') + d.wpm.n + ' kayıttan)',
                  value:Math.min(100, d.wpm.value / 200 * 100),
                  text:d.wpm.value + ' kelime/dk',
                  tone:d.wpm.value >= ESP.Acoustic.WPM_BAND.min
                    && d.wpm.value <= ESP.Acoustic.WPM_BAND.max ? 'ok' : 'warn' })}
            ${when(d.errorRate.cert !== 'missing', () => html`<p class="small muted mt-8">
              ${yz('esp.studio.kendi-isaretledigin-hata-ora')}${Math.round(d.errorRate.value * 100)} ${yz('esp.studio.tahmin-etiketlidir-yalnizca')}</p>`)}`,
      }),

      K.Entry({
        label:yz('esp.studio.nefes-ve-vurgu'), hint:'nefes',
        meta:ESP.BREATH_DRILLS.length + ' çalışma',
        body:html`
          ${K.Table({ tight:true, headers:['Çalışma', { label:yz('esp.studio.sure'), num:true }, 'Not'],
            rows:ESP.BREATH_DRILLS.map(b => [b.label, U.fmtMin(Math.round(b.seconds / 60)) , b.note]) })}
          ${map(ESP.STRESS_DRILLS, s => html`
            <div class="mt-12">
              <p class="thesis">${s.sentence}</p>
              ${K.Table({ tight:true, headers:['Vurgu', 'Anlam'],
                rows:s.readings.map(r => [r.stress, r.means]) })}
            </div>`)}`,
      }),

      K.Entry({
        label:yz('esp.studio.son-kayitlar'),
        meta:kayitlar.length + ' ölçüm',
        wide:true,
        body:kayitlar.length
          ? K.Table({ tight:true,
              headers:['Tarih', { label:yz('esp.studio.sure'), num:true }, { label:yz('esp.studio.kelime-2'), num:true },
                { label:yz('esp.studio.wpm'), num:true }, { label:yz('esp.studio.hata'), num:true }, ''],
              rows:kayitlar.map(r => {
                const w = ESP.Acoustic.wpmOf(r);
                return [U.fmtShort(r.date),
                  r.seconds != null ? r.seconds + ' sn' : '—',
                  r.words != null ? String(r.words) : '—',
                  w.cert === 'missing' ? '—' : String(w.value),
                  r.errors != null ? String(r.errors) : '—',
                  K.Button({ label:yz('esp.studio.sil'), size:'sm', act:'del-rec', data:{ 'data-id':r.id } })];
              }) })
          : K.Empty({ text:yz('esp.studio.henuz-olcum-yok') }),
      }),
    ];
  }

  /* -------------------------------------------------------------- ilerleme */

  function progressRows(){
    const m = ESP.Acoustic.musicStatus();
    const t = ESP.Acoustic.dictionTrend();
    const plato = ESP.Acoustic.plateaus();

    return [
      K.Entry({
        label:yz('esp.studio.plato'), hint:'plateau',
        meta:plato.length ? plato.length + ' teknik' : 'yok',
        body:plato.length
          ? K.Table({ tight:true, headers:['Parça', { label:yz('esp.studio.gun'), num:true }, { label:yz('esp.studio.bpm-2'), num:true }],
              rows:plato.map(p => [p.piece.name, String(p.days), String(p.bpm)]) })
          : K.Notice({ tone:'ok', body:'Hiçbir teknik '
              + ESP.Acoustic.PLATEAU_DAYS + ' gündür takılı değil. '
              + 'Hiç çalışılmamış parça plato sayılmaz — plato çalışan bir şeyin durmasıdır.' }),
      }),

      K.Entry({
        label:yz('esp.studio.hedefe-ulasma'), hint:'hedef-tempo',
        meta:m.progress && m.progress.cert !== 'missing'
          ? m.progress.reached + '/' + m.progress.n : 'veri yok',
        body:m.progress && m.progress.cert !== 'missing'
          ? K.Meter({ label:yz('esp.studio.hedef-tempoya-ulasan-parca-o'),
              value:m.progress.value * 100,
              text:'%' + Math.round(m.progress.value * 100) })
          : K.Empty({ text:yz('esp.studio.hedef-bpm-girilmis-ve-esigi') }),
      }),

      K.Entry({
        label:yz('esp.studio.diksiyon-egilimi'), hint:'diksiyon-egilimi',
        meta:t.cert === 'missing' ? 'veri yok' : t.direction,
        body:t.cert === 'missing'
          ? K.Notice({ tone:'info', body:t.why })
          : K.Notice({ tone:t.direction === 'iyi' ? 'ok' : t.direction === 'kotu' ? 'warn' : 'info',
              body:'Hata oranı %' + Math.round(t.before * 100) + ' → %'
                + Math.round(t.now * 100) + '. Bu bir tahmindir: hataları sen işaretledin.' }),
      }),

      K.Entry({
        label:yz('esp.studio.isinma-sirasi'), hint:'isinma',
        meta:'öneri',
        body:K.Table({ tight:true, headers:['Aşama', { label:yz('esp.studio.dakika'), num:true }, 'Not'],
          rows:ESP.WARMUP.map(w => [w.label, String(w.minutes), w.note]) }),
      }),
    ];
  }

  /* Konu haritasi — studyoda iki disiplin var, ikisinin de haritasi burada.

     Isaretler beyandir ve oyle etiketlenir; hicbir kapiyi acmaz. */
  function topicRows(){
    return [
      { id:'music', label:yz('esp.studio.muzik-konulari') },
      { id:'diction', label:yz('esp.studio.diksiyon-konulari') },
    ].map(d => {
      const ozet = ESP.Lesson.topicSummary(d.id);
      return K.Entry({
        label:d.label, hint:'topic',
        meta:ozet.topics + ' konu · ' + ozet.items + ' madde',
        wide:true,
        body:ESP.Parts.topics(d.id),
      });
    });
  }

  /* ------------------------------------------------------------------ çizim */

  /* Sekme yok (EKIP-PLANI §1.2): bölümler alt alta. Stüdyoda iki disiplin
     var; iki tezgâh (koç her masanın reçetesini ayrı yazar) son bölümde,
     öbür ekranlardaki «Tezgâh» gibi (iPhone Faz 2c). */
  /* PANO KARTLARI (2026-10-20; brand/ortak/pano.js): denemesi olan ilk iki
     parçanın temposu son sekiz denemede sütunlarda; hedef BPM varsa eşik. */
  function PanoTempo(){
    const P = (window.LIFEOS || {}).PANO;
    if(!P) return '';
    const l = (S.pieces || []).filter(p => (p.attempts || []).length).slice(0, 2);
    if(!l.length){ const d = PanoDiksiyon(P); return d ? '<div class="pk-ust">' + P.izgara([d], 'pk-izgara--iki') + '</div>' : ''; }
    const kartlar = l.map(p => {
      const a = p.attempts.slice().sort((x, y) => String(x.date).localeCompare(String(y.date))).slice(-8);
      const son = a[a.length - 1].bpm;
      return P.kart({ tur:'tempo', ad:(p.name || 'Parça') + ' · tempo', simge:'nota', yuva:'ölçüldü',
        govde:P.deger(String(son), 'BPM', p.targetBpm ? 'hedef ' + p.targetBpm + ' BPM' : (p.cleanBpm ? 'temiz eşik ' + p.cleanBpm + ' BPM' : ''))
          + P.sutun({ degerler:a.map(x => x.bpm), yukseklik:48, etiket:yz('esp.studio.son') + a.length + ' denemenin temposu; sonuncusu ' + son + ' BPM' })
          + (p.targetBpm ? P.esik({ deger:son, esik:p.targetBpm, yon:'artis-iyi', etiket:son + ' BPM, hedef ' + p.targetBpm }) : '') });
    });
    return '<div class="pk-ust">' + P.izgara(kartlar.concat([PanoDiksiyon(P)]), 'pk-izgara--iki') + '</div>';
  }
  /* Diksiyon: kayıtların dakikadaki kelimesi (kelime ve süre ölçüldüyse). */
  function PanoDiksiyon(P){
    const l = (S.recordings || []).filter(r => r.words != null && r.seconds > 0 && r.wordsCert !== 'missing' && r.secondsCert !== 'missing')
      .slice().sort((a, b) => String(a.date).localeCompare(String(b.date))).slice(-8);
    if(!l.length) return '';
    const kdk = r => Math.round(r.words / r.seconds * 60);
    const son = l[l.length - 1];
    return P.kart({ tur:'diksiyon', ad:yz('esp.studio.diksiyon-hiz'), simge:'nota', yuva:'ölçüldü',
      govde:P.deger(String(kdk(son)), 'kelime/dk', son.errors != null ? son.errors + ' hata (senin işaretin)' : '')
        + P.sutun({ degerler:l.map(kdk), yukseklik:48, etiket:yz('esp.studio.son') + l.length + ' kaydın konuşma hızı' }) });
  }

  LIFEOS.PARCA.blok({ id:'studio.bolum-1', sayfa:'studio', yer:'y1', sira:10, ad:'Bölüm 1', ciz(){
    return K.Span(12, ESP.Parts.bolumler(null, { act:'studio-tab', aria:yz('esp.studio.studyo-bolumleri'), tabs:TABS, govde:{
        muzik:musicRows, diksiyon:dictionRows,
        kulak:earRows, ogren:topicRows, ilerleme:progressRows,
        tezgah:() => [ESP.Parts.desk('music'), ESP.Parts.desk('diction')] } }));
  } });
  LIFEOS.PARCA.blok({ id:'studio.bolum-2', sayfa:'studio', yer:'y2', sira:10, ad:'Bölüm 2', ciz(){
    return K.Span(12, raw(PanoTempo()));
  } });
  function render(){
    return K.Grid(html`
      ${LIFEOS.PARCA.yer('studio', 'y2', K, undefined, typeof raw === 'undefined' ? null : raw)}
      ${LIFEOS.PARCA.yer('studio', 'y1', K, undefined, typeof raw === 'undefined' ? null : raw)}`);
  }

  function afterRender(){ ESP.Parts.bolumIstegi('studioTab', TABS[0].id); }

  function val(id){ const el = document.getElementById(id); return el ? el.value.trim() : ''; }

  const handle = {
    async 'belge-iste'(el){
      const k = document.getElementById('belge-' + el.dataset.alan);
      const r = await ESP.Belge.iste({ alan:el.dataset.alan, konu:k ? k.value : '' });
      ESP.UI.toast(r.metin);
      if(r.ok) ESP.App.render();
    },
    async 'gitar-iste'(){
      const d = document.getElementById('gitar-duzey'), k = document.getElementById('gitar-konu');
      S.ui.gitarDuzey = d ? d.value : 'başlangıç';
      const r = await ESP.Unite.iste({ alan:'gitar', duzey:S.ui.gitarDuzey, konu:k ? k.value : '' });
      ESP.UI.toast(r.metin);
      if(r.ok) ESP.App.render();
    },
    /* Bölüme kayar; metronom durmaz (bölümler aynı sayfada). */
    async 'studio-tab'(el){ K.bolumeGit(el.dataset.tab); },
    async 'parca-tumu'(){ S.ui.parcaTumu = !S.ui.parcaTumu; ESP.App.render(); },

    async 'bpm'(el){
      const d = Number(el.dataset.d) || 0;
      S.ui.metronomeBpm = Math.max(30, Math.min(260, (S.ui.metronomeBpm || 80) + d));
      if(S.ui.metronomeOn){
        const sig = ESP.TIME_SIGNATURES.find(t => t.id === (S.ui.metroSig || '4/4'));
        metronomeStart(S.ui.metronomeBpm, sig ? sig.beats : 4);
      }
      ESP.App.render();
    },

    async 'metro-toggle'(){
      if(S.ui.metronomeOn){
        metronomeStop();
        S.ui.metronomeOn = false;
      }else{
        const sig = ESP.TIME_SIGNATURES.find(t => t.id === (S.ui.metroSig || '4/4'));
        S.ui.metronomeOn = metronomeStart(S.ui.metronomeBpm || 80, sig ? sig.beats : 4);
      }
      ESP.App.render();
    },

    async 'log-clean'(el){ await logAttempt(true); },
    async 'log-dirty'(el){ await logAttempt(false); },

    async 'add-piece'(){
      const ad = val('p-name');
      if(!ad){ ESP.UI.toast(yz('esp.studio.ad-gerekir')); return; }
      const hedef = val('p-target');
      await M.savePiece(M.newPiece({ name:ad, kind:val('p-kind') || 'technique',
        targetBpm:hedef ? Number(hedef) : null }));
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'add-technique'(el){
      const t = ESP.TECHNIQUE_BY_ID[el.dataset.id];
      if(!t) return;
      if((S.pieces || []).some(p => p.name === t.label)){
        ESP.UI.toast(yz('esp.studio.bu-teknik-zaten-var'));
        return;
      }
      await M.savePiece(M.newPiece({ name:t.label, kind:'technique', targetBpm:t.targetBpm }));
      ESP.S.ui.metronomeBpm = t.startBpm;
      ESP.Memo.bitir();
      ESP.UI.toast(t.label + ' eklendi');
      ESP.App.render();
    },

    async 'del-piece'(el){
      await M.deletePiece(el.dataset.id);
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'toggle-err'(el){
      const id = el.dataset.id;
      const list = S.ui.errTags || [];
      S.ui.errTags = list.indexOf(id) >= 0 ? list.filter(x => x !== id) : list.concat([id]);
      ESP.App.render();
    },

    async 'add-recording'(){
      const sn = val('r-sec'), kelime = val('r-words'), hata = val('r-err');
      if(!sn){ ESP.UI.toast(yz('esp.studio.sure-girilmedi')); return; }
      const s = M.numCert(sn, 'measured');
      const w = M.numCert(kelime, 'measured');
      /* Hata sayisi DAIMA tahmindir: sistem sesi dinlemedi. */
      const e = M.numCert(hata, 'estimated');
      await M.saveRecording({
        date:U.todayISO(),
        seconds:s.value, secondsCert:s.cert,
        words:w.value, wordsCert:w.cert,
        errors:e.value, errorsCert:e.cert,
        textId:S.ui.twister || null,
        note:(S.ui.errTags || []).join(','),
      });
      S.ui.errTags = [];
      ESP.Memo.bitir();
      ESP.UI.toast(yz('esp.studio.olcum-kaydedildi'));
      ESP.App.render();
    },

    async 'del-rec'(el){
      await M.deleteRecording(el.dataset.id);
      ESP.Memo.bitir();
      ESP.App.render();
    },
  };

  async function logAttempt(clean){
    const sel = document.getElementById('att-piece');
    const id = sel ? sel.value : (S.pieces[0] && S.pieces[0].id);
    if(!id){ ESP.UI.toast(yz('esp.studio.once-parca-ekle')); return; }
    const res = await ESP.Acoustic.logAttempt(id, S.ui.metronomeBpm || 80, clean);
    if(!res.ok){ ESP.UI.toast(res.error); return; }
    ESP.Memo.bitir();
    ESP.UI.toast(res.raised
      ? 'Yeni temiz eşik: ' + res.piece.cleanBpm + ' BPM'
      : (clean ? 'Temiz tekrar kaydedildi' : 'Tekrar kaydedildi'));
    ESP.App.render();
  }

  const change = {
    async 'metro-sig'(el){
      S.ui.metroSig = el.value;
      if(S.ui.metronomeOn){
        const sig = ESP.TIME_SIGNATURES.find(t => t.id === el.value);
        metronomeStart(S.ui.metronomeBpm || 80, sig ? sig.beats : 4);
      }
    },
    async 'pick-piece'(el){ S.ui.pieceOpen = el.value; ESP.App.render(); },
    async 'pick-twister'(el){ S.ui.twister = el.value; ESP.App.render(); },
    async 'pick-scale-root'(el){ S.ui.scaleRoot = el.value; ESP.App.render(); },
    async 'pick-scale-mode'(el){ S.ui.scaleId = el.value; ESP.App.render(); },
  };

  return {
    id:'studio',
    /* Sadelik (brand/ortak/gizle.js): uzun aciklama ve basvuru bolumleri
       bastan kucuk gelir; baslik gorunur, ustune gelince onizlenir,
       «Ac» denirse acik kalir. Is yapilan bolumler ve sinir metinleri acik. */
    /* iPhone Faz 2c: parça ekleme ara sıra; Diksiyon'da kural listesi ve
       geçmiş kayıtlar, Kulak'ta üç başvuru tablosu şerit. */
    kucukVarsayilan:['kulak-egzersizleri', 'müzik-konuları', 'diksiyon-konuları', 'parça-ekle',
      'telaffuz-kuralları', 'son-kayıtlar', 'aralıklar', 'caged', 'deşifre', 'gam-ve-mod-cetveli'],
    title:yz('esp.studio.studyo'),
    headline(){
      const plato = ESP.Acoustic.plateaus();
      if(plato.length) return plato[0].piece.name + ' ' + plato[0].days + ' gündür platoda.';
      const m = ESP.Acoustic.musicStatus();
      if(m.cert === 'missing') return 'Henüz parça ya da teknik yok.';
      const d = ESP.Acoustic.dictionStatus(30);
      if(d.cert === 'missing') return 'Diksiyon 30 gündür hiç açılmadı.';
      return m.measured + ' parçanın temiz eşiği ölçülü.';
    },
    lede(){
      return 'Hız bir sonuçtur, hedef değil. Temiz çalınan tempo, hızlı çalınan '
           + 'tempodan önce gelir — diksiyonda da öyle.';
    },
    stats(){
      const m = ESP.Acoustic.musicStatus();
      const d = ESP.Acoustic.dictionStatus(30);
      return [
        { value:String(m.n || 0), label:yz('esp.studio.parca-2') },
        { value:String((m.plateaus || []).length), label:'plato' },
        { value:String(d.n || 0), label:yz('esp.studio.kayit') },
        { value:d.cert === 'missing' || d.wpm.cert === 'missing' ? '—' : String(d.wpm.value),
          label:yz('esp.studio.wpm') },
      ];
    },
    subtitle(){ return (S.pieces || []).length + ' parça · ' + (S.recordings || []).length + ' kayıt'; },
    actions(){ return ''; },
    render, afterRender, handle, change,

    /* Ekrandan cikarken metronom susmali: gorunmeyen bir ekranin sesi
       kullanicinin kapatamayacagi bir sestir. */
    leave(){ metronomeStop(); S.ui.metronomeOn = false; },
  };
})();
