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

ESP.Screens.studio = (function(){
  const U = ESP.U, M = ESP.Model, S = ESP.S;
  const { html, raw, when, map } = ESP.h;
  const K = ESP.C;

  const TABS = [
    { id:'muzik',    label:'Müzik' },
    { id:'diksiyon', label:'Diksiyon' },
    { id:'kulak',    label:'Kulak' },
    { id:'ogren',    label:'Öğren' },
    { id:'ilerleme', label:'İlerleme' },
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
        label:'KULAK EGZERSİZLERİ', hint:'ear',
        meta:ESP.EAR_DRILLS.length + ' egzersiz',
        note:'Ölçülen şey yetenek değil isabet: yirmi denemede kaç doğru. '
           + 'Sistem sesini dinlemez; sayıyı sen girersin.',
        wide:true,
        body:K.Table({ tight:true,
          headers:[{ label:'Kademe', num:true }, 'Egzersiz', 'Ne yapılır', 'Ne ölçülür'],
          rows:ESP.EAR_DRILLS.map(d => [String(d.level), d.label, d.task, d.measures]) }),
      }),

      K.Entry({
        label:'ARALIKLAR', hint:'interval',
        meta:ESP.INTERVALS.length + ' aralık',
        note:'Kanca (hook) bir ezber kolaylığıdır, kural değil: kendi kancanı '
           + 'bulursan daha iyi tutar.',
        wide:true,
        body:K.Table({ tight:true,
          headers:['Aralık', { label:'Yarım ses', num:true }, 'Kanca'],
          rows:ESP.INTERVALS.map(i => [i.label, String(i.semitones), i.hook]) }),
      }),

      K.Entry({
        label:'CAGED', hint:'caged',
        meta:'beş şekil',
        note:'Bir sır değil bir harita: aynı akorun klavyede beş yerde nasıl '
           + 'kurulduğunu gösterir.',
        body:K.Table({ tight:true, headers:['Şekil', 'Kök', 'Not'],
          rows:ESP.CAGED.map(c => [c.shape, c.root, c.note]) }),
      }),

      K.Entry({
        label:'DEŞİFRE', hint:'sight-reading',
        meta:ESP.SIGHT_READING.length + ' kademe',
        note:'Okumak çalmaktan ayrı bir beceridir ve ayrı çalışılır.',
        body:K.Table({ tight:true, headers:[{ label:'Kademe', num:true }, 'Ne', 'Nasıl'],
          rows:ESP.SIGHT_READING.map(s => [String(s.level), s.label, s.task]) }),
      }),

      K.Entry({
        label:'REPERTUAR BAKIMI', hint:'repertoire',
        meta:eskiyen.length ? eskiyen.length + ' bakımsız' : 'güncel',
        note:'«Bitti» diye bir hâl yoktur: ' + ESP.REPERTOIRE_STALE_DAYS
           + ' günden uzun süredir çalınmayan parça çalınabilir ama garanti değil.',
        body:eskiyen.length
          ? K.Table({ tight:true, headers:['Parça', 'Son çalınma'],
              rows:eskiyen.map(p => {
                const son = (p.attempts || []).slice(-1)[0];
                return [p.name, son ? son.date : '—'];
              }) })
          : K.Empty({ text:'Bakımsız parça yok ya da henüz deneme kaydı girilmedi.' }),
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
    }catch(e){ ESP.UI.toast('Tarayıcı ses üretemiyor'); return false; }
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

  function musicRows(){
    const bpm = S.ui.metronomeBpm || 80;
    const parcalar = S.pieces || [];
    const acik = S.ui.pieceOpen ? parcalar.find(p => p.id === S.ui.pieceOpen) : null;

    const rows = [
      K.Entry({
        label:'METRONOM',
        meta:bpm + ' BPM',
        note:'Temiz çalınan tempo, hızlı çalınan tempodan önce gelir. '
           + 'Eşik yalnızca «temiz» işaretlenen tekrarlardan açılır.',
        body:html`
          <div class="metro">
            <div class="metro__bpm">
              <button class="metro__step" data-act="bpm" data-d="-5" aria-label="5 azalt">−5</button>
              <span class="metro__val num">${bpm}</span>
              <button class="metro__step" data-act="bpm" data-d="5" aria-label="5 artır">+5</button>
            </div>
            <div class="metro__ctrl">
              ${K.Button({ label:S.ui.metronomeOn ? 'Durdur' : 'Başlat',
                tone:S.ui.metronomeOn ? '' : 'primary', act:'metro-toggle' })}
              ${K.Select({ id:'metro-sig', value:S.ui.metroSig || '4/4', change:'metro-sig',
                aria:'Ölçü türü',
                options:ESP.TIME_SIGNATURES.map(t => ({ value:t.id, label:t.label })) })}
            </div>
          </div>
          <p class="small muted mt-8">Vuruş aralığı
            ${U.fmtNum(Math.round(ESP.Acoustic.beatMs(bpm)))} ms.
            İlk vuruş vurgulu: metronomun işi vuruşu değil ölçünün nerede
            başladığını duyurmaktır.</p>`,
      }),

      K.Entry({
        label:'TEKRAR KAYDET',
        meta:acik ? acik.name : 'parça seç',
        note:'«Temiz» senin işaretindir: sistem duymaz. Bu yüzden tempo ve tarih '
           + '«ölçüldü», temizlik yargısı senindir.',
        body:parcalar.length
          ? html`
            <div class="row wrap">
              ${K.Select({ id:'att-piece', value:acik ? acik.id : parcalar[0].id,
                change:'pick-piece', aria:'Tekrarın yazılacağı parça',
                options:parcalar.map(p => ({ value:p.id, label:p.name })) })}
              ${K.Button({ label:'Temiz tekrar', tone:'primary', act:'log-clean' })}
              ${K.Button({ label:'Hatalı tekrar', act:'log-dirty' })}
            </div>
            <p class="small muted mt-8">
              ${ESP.Acoustic.CLEAN_STREAK} temiz tekrar aynı tempoda ve son
              ${ESP.Acoustic.CLEAN_WINDOW_DAYS} gün içinde geldiğinde eşik açılır.
              Eşik kendiliğinden artar, kendiliğinden düşmez.</p>`
          : K.Empty({ text:'Henüz parça ya da teknik yok. Aşağıdan ekleyebilirsin.' }),
      }),
    ];

    parcalar.forEach(p => {
      const t = ESP.Acoustic.cleanThreshold(p);
      const next = ESP.Acoustic.nextStep(p);
      const sonDeneme = (p.attempts || []).slice(-6).reverse();
      rows.push(K.Entry({
        label:p.kind === 'technique' ? 'TEKNİK' : 'PARÇA',
        meta:p.name,
        note:t.cert === 'missing'
          ? (t.why || 'Henüz temiz eşik ölçülmedi.')
          : 'Temiz eşik ' + t.value + ' BPM' + (p.targetBpm ? ' · hedef ' + p.targetBpm : ''),
        action:K.Button({ label:'Sil', size:'sm', act:'del-piece', data:{ 'data-id':p.id } }),
        body:html`
          ${t.cert === 'missing'
            ? K.Notice({ tone:'info', body:t.why || 'Bu parçada ölçülmüş temiz eşik yok. '
                + 'Tempo girip «temiz» işaretlediğinde ölçüm başlar.' })
            : html`${K.Meter({ label:'Temiz eşik',
                value:p.targetBpm ? Math.min(100, t.value / p.targetBpm * 100) : 50,
                text:t.value + ' BPM' + (p.targetBpm ? ' / ' + p.targetBpm : ''),
                tone:p.targetBpm && t.value >= p.targetBpm ? 'ok' : '' })}
              ${when(next.cert !== 'missing', () => html`<p class="small muted mt-8">
                Sıradaki basamak ${next.value} BPM (+${ESP.Acoustic.BPM_STEP}).</p>`)}`}
          ${when(sonDeneme.length, () => K.Table({ tight:true,
            headers:['Tarih', { label:'BPM', num:true }, 'Temiz'],
            rows:sonDeneme.map(a => [U.fmtShort(a.date), String(a.bpm),
              a.clean ? 'evet' : 'hayır']) }))}`,
      }));
    });

    rows.push(K.Entry({
      label:'PARÇA EKLE',
      meta:'teknik ya da repertuar',
      body:html`
        <div class="cols-3">
          ${K.Field({ label:'Ad', input:K.Input({ id:'p-name', placeholder:'Dönüşümlü mızrap' }) })}
          ${K.Field({ label:'Tür', input:K.Select({ id:'p-kind', value:'technique',
            options:[{ value:'technique', label:'Teknik' }, { value:'piece', label:'Parça' }] }) })}
          ${K.Field({ label:'Hedef BPM', hint:'isteğe bağlı',
            input:K.Input({ id:'p-target', type:'number', numeric:true, min:20, max:300,
              placeholder:'120' }) })}
        </div>
        ${K.Button({ label:'Ekle', tone:'primary', act:'add-piece', class:'mt-10' })}
        <p class="small muted mt-10">Hazır teknikler:</p>
        <div class="row wrap mt-4">
          ${map(ESP.TECHNIQUES, t => K.Button({ label:t.label, size:'sm',
            act:'add-technique', data:{ 'data-id':t.id } }))}
        </div>`,
    }));

    return rows;
  }

  /* --------------------------------------------------------------- diksiyon */

  function dictionRows(){
    const d = ESP.Acoustic.dictionStatus(30);
    const kayitlar = (S.recordings || []).slice(0, 10);
    const secili = ESP.TWISTER_BY_ID[S.ui.twister || 'kartal'] || ESP.TONGUE_TWISTERS[0];

    return [
      K.Entry({
        label:'ÇALIŞMA METNİ', hint:'articulation',
        meta:'düzey ' + secili.level + ' · ' + (ESP.PHONEME_GROUPS.find(g => g.id === secili.target) || {}).label,
        note:'Hedef hızlı söylemek değil, hangi sesin düzeldiği. Hızlı ama bozuk '
           + 'bir tekerleme çalışmanın başarısı değil başarısızlığıdır.',
        body:html`
          <div class="row wrap">
            ${K.Select({ id:'tw-pick', value:secili.id, change:'pick-twister',
              aria:'Çalışma metni',
              options:ESP.TONGUE_TWISTERS.map(t => ({ value:t.id,
                label:'D' + t.level + ' · ' + t.text.slice(0, 40) + '…' })) })}
          </div>
          <p class="twister mt-10">${secili.text}</p>
          <p class="small muted mt-8">${secili.words} kelime ·
            ${(ESP.PHONEME_GROUPS.find(g => g.id === secili.target) || {}).note || ''}</p>`,
      }),

      K.Entry({
        label:'KAYIT ÖLÇÜMÜ',
        meta:'ses dosyası tutulmaz',
        note:'Saklanan şey süre, kelime ve senin işaretlediğin hata sayısıdır. '
           + 'Olmayan ses dosyası sızamaz.',
        body:html`
          <div class="cols-3">
            ${K.Field({ label:'Süre (saniye)',
              input:K.Input({ id:'r-sec', type:'number', numeric:true, min:1, max:3600,
                placeholder:'12' }) })}
            ${K.Field({ label:'Kelime',
              input:K.Input({ id:'r-words', type:'number', numeric:true, min:1,
                value:secili.words }) })}
            ${K.Field({ label:'Hata sayısı', hint:'kendi işaretin — tahmin sayılır',
              input:K.Input({ id:'r-err', type:'number', numeric:true, min:0,
                placeholder:'2' }) })}
          </div>
          <div class="row wrap mt-10">
            ${map(ESP.ARTICULATION_ERRORS, e => K.Button({ label:e.label, size:'sm',
              tone:(S.ui.errTags || []).indexOf(e.id) >= 0 ? 'primary' : '',
              act:'toggle-err', data:{ 'data-id':e.id } }))}
          </div>
          ${K.Button({ label:'Ölçümü kaydet', tone:'primary', act:'add-recording', class:'mt-10' })}`,
      }),

      K.Entry({
        label:'KONUŞMA HIZI', hint:'wpm',
        meta:d.cert === 'missing' ? 'veri yok'
          : (d.wpm.cert === 'missing' ? 'hesaplanamadı' : d.wpm.value + ' kelime/dk'),
        note:ESP.WPM_NOTE,
        body:d.cert === 'missing'
          ? K.Empty({ text:'Son 30 günde kayıt yok.' })
          : html`
            ${d.wpm.cert === 'missing'
              ? K.Notice({ tone:'warn', body:'WPM için hem süre hem kelime sayısı ölçülmüş olmalı.' })
              : K.Meter({ label:'Medyan hız (' + d.wpm.n + ' kayıttan)',
                  value:Math.min(100, d.wpm.value / 200 * 100),
                  text:d.wpm.value + ' kelime/dk',
                  tone:d.wpm.value >= ESP.Acoustic.WPM_BAND.min
                    && d.wpm.value <= ESP.Acoustic.WPM_BAND.max ? 'ok' : 'warn' })}
            ${when(d.errorRate.cert !== 'missing', () => html`<p class="small muted mt-8">
              Kendi işaretlediğin hata oranı medyanı
              %${Math.round(d.errorRate.value * 100)} — tahmin etiketlidir,
              yalnızca kendi geçmişinle karşılaştırılır.</p>`)}`,
      }),

      K.Entry({
        label:'NEFES VE VURGU',
        meta:ESP.BREATH_DRILLS.length + ' çalışma',
        note:'Ölçülen şey süredir, «iyi yaptım» değil.',
        body:html`
          ${K.Table({ tight:true, headers:['Çalışma', { label:'Süre', num:true }, 'Not'],
            rows:ESP.BREATH_DRILLS.map(b => [b.label, U.fmtMin(Math.round(b.seconds / 60)) , b.note]) })}
          ${map(ESP.STRESS_DRILLS, s => html`
            <div class="mt-12">
              <p class="thesis">${s.sentence}</p>
              ${K.Table({ tight:true, headers:['Vurgu', 'Anlam'],
                rows:s.readings.map(r => [r.stress, r.means]) })}
            </div>`)}`,
      }),

      K.Entry({
        label:'SON KAYITLAR',
        meta:kayitlar.length + ' ölçüm',
        wide:true,
        body:kayitlar.length
          ? K.Table({ tight:true,
              headers:['Tarih', { label:'Süre', num:true }, { label:'Kelime', num:true },
                { label:'WPM', num:true }, { label:'Hata', num:true }, ''],
              rows:kayitlar.map(r => {
                const w = ESP.Acoustic.wpmOf(r);
                return [U.fmtShort(r.date),
                  r.seconds != null ? r.seconds + ' sn' : '—',
                  r.words != null ? String(r.words) : '—',
                  w.cert === 'missing' ? '—' : String(w.value),
                  r.errors != null ? String(r.errors) : '—',
                  K.Button({ label:'Sil', size:'sm', act:'del-rec', data:{ 'data-id':r.id } })];
              }) })
          : K.Empty({ text:'Henüz ölçüm yok.' }),
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
        label:'PLATO', hint:'plateau',
        meta:plato.length ? plato.length + ' teknik' : 'yok',
        note:'Plato bir başarısızlık değil bir sinyaldir: aynı çalışma aynı '
           + 'sonucu veriyorsa değişmesi gereken çalışmanın kendisidir.',
        body:plato.length
          ? K.Table({ tight:true, headers:['Parça', { label:'Gün', num:true }, { label:'BPM', num:true }],
              rows:plato.map(p => [p.piece.name, String(p.days), String(p.bpm)]) })
          : K.Notice({ tone:'ok', body:'Hiçbir teknik '
              + ESP.Acoustic.PLATEAU_DAYS + ' gündür takılı değil. '
              + 'Hiç çalışılmamış parça plato sayılmaz — plato çalışan bir şeyin durmasıdır.' }),
      }),

      K.Entry({
        label:'HEDEFE ULAŞMA',
        meta:m.progress && m.progress.cert !== 'missing'
          ? m.progress.reached + '/' + m.progress.n : 'veri yok',
        note:'Hedefi girilmemiş parça paydaya girmez: hedefsiz parça başarısız değildir.',
        body:m.progress && m.progress.cert !== 'missing'
          ? K.Meter({ label:'Hedef tempoya ulaşan parça oranı',
              value:m.progress.value * 100,
              text:'%' + Math.round(m.progress.value * 100) })
          : K.Empty({ text:'Hedef BPM girilmiş ve eşiği ölçülmüş parça yok.' }),
      }),

      K.Entry({
        label:'DİKSİYON EĞİLİMİ',
        meta:t.cert === 'missing' ? 'veri yok' : t.direction,
        note:'İki pencere karşılaştırılır: son 14 gün ve ondan önceki 14 gün. '
           + 'İkisinde de ölçüm yoksa bulgu üretilmez.',
        body:t.cert === 'missing'
          ? K.Notice({ tone:'info', body:t.why })
          : K.Notice({ tone:t.direction === 'iyi' ? 'ok' : t.direction === 'kotu' ? 'warn' : 'info',
              body:'Hata oranı %' + Math.round(t.before * 100) + ' → %'
                + Math.round(t.now * 100) + '. Bu bir tahmindir: hataları sen işaretledin.' }),
      }),

      K.Entry({
        label:'ISINMA SIRASI',
        meta:'öneri',
        note:'Zorunlu değildir; sistem senin yerine karar vermez.',
        body:K.Table({ tight:true, headers:['Aşama', { label:'Dakika', num:true }, 'Not'],
          rows:ESP.WARMUP.map(w => [w.label, String(w.minutes), w.note]) }),
      }),
    ];
  }

  /* Konu haritasi — studyoda iki disiplin var, ikisinin de haritasi burada.

     Isaretler beyandir ve oyle etiketlenir; hicbir kapiyi acmaz. */
  function topicRows(){
    return [
      { id:'music', label:'MÜZİK KONULARI' },
      { id:'diction', label:'DİKSİYON KONULARI' },
    ].map(d => {
      const ozet = ESP.Lesson.topicSummary(d.id);
      return K.Entry({
        label:d.label, hint:'topic',
        meta:ozet.topics + ' konu · ' + ozet.items + ' madde',
        note:'Konu listesi bir müfredattır, bir ölçüm değil. İşaretlediklerin '
           + '«beyan» olarak durur: hiçbir kapıyı açmaz, kademeyi değiştirmez.',
        wide:true,
        body:ESP.Parts.topics(d.id),
      });
    });
  }

  /* ------------------------------------------------------------------ çizim */

  function render(){
    const tab = S.ui.studioTab || 'muzik';
    const rows = tab === 'diksiyon' ? dictionRows()
      : tab === 'kulak' ? earRows()
      : tab === 'ogren' ? topicRows()
      : tab === 'ilerleme' ? progressRows()
      : musicRows();

    return K.Grid(html`
      ${K.Span(12, K.Toolbar({
        tabs:K.Subtabs({ value:tab, act:'studio-tab', aria:'Stüdyo sekmeleri', items:TABS }),
      }))}
      ${K.Span(12, K.Ledger(() => {
        /* Studyoda iki disiplin var: sekme hangisindeyse koç o masanin
           recetesini yazar. Ikisini birden gostermek, otuz dakikalik bir
           gunu altmis dakikalik bir recete ile karsilamak olurdu. */
        const disc = S.ui.studioTab === 'diksiyon' ? 'diction' : 'music';
        const sessiz = S.ui.studioTab === 'ilerleme' || S.ui.studioTab === 'kulak';
        return (sessiz ? [] : [ESP.Parts.desk(disc)]).concat(rows);
      }))}`);
  }

  function val(id){ const el = document.getElementById(id); return el ? el.value.trim() : ''; }

  const handle = {
    async 'studio-tab'(el){
      if(S.ui.metronomeOn){ metronomeStop(); S.ui.metronomeOn = false; }
      S.ui.studioTab = el.dataset.tab;
      ESP.App.render();
    },

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
      if(!ad){ ESP.UI.toast('Ad gerekir'); return; }
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
        ESP.UI.toast('Bu teknik zaten var');
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
      if(!sn){ ESP.UI.toast('Süre girilmedi'); return; }
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
      ESP.UI.toast('Ölçüm kaydedildi');
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
    if(!id){ ESP.UI.toast('Önce parça ekle'); return; }
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
  };

  return {
    id:'studio',
    title:'Stüdyo',
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
        { value:String(m.n || 0), label:'parça' },
        { value:String((m.plateaus || []).length), label:'plato' },
        { value:String(d.n || 0), label:'kayıt' },
        { value:d.cert === 'missing' || d.wpm.cert === 'missing' ? '—' : String(d.wpm.value),
          label:'WPM' },
      ];
    },
    subtitle(){ return (S.pieces || []).length + ' parça · ' + (S.recordings || []).length + ' kayıt'; },
    actions(){ return ''; },
    render, handle, change,

    /* Ekrandan cikarken metronom susmali: gorunmeyen bir ekranin sesi
       kullanicinin kapatamayacagi bir sestir. */
    leave(){ metronomeStop(); S.ui.metronomeOn = false; },
  };
})();
