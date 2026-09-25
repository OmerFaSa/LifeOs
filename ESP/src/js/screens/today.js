/* Bugün — günün pratiği girilir, karşılığı aynı sayfada görünür.

   Bu sayfaya girmenin sebebi çoğu zaman okumak değil YAZMAKTIR; bu yüzden
   varsayılan sekme Giriş'tir ve Özet ikinci sıradadır. Sonuç girdiden önce
   gelmez.

   Üç sekme: Giriş · Özet · Geçmiş. Önceden iki ayrı ekran (bugünün özeti ve
   oturum girişi) düşünülmüştü; ikisi de aynı günü anlatıyordu ve kullanıcı
   her seferinde hangisine gireceğini düşünmek zorunda kalıyordu. */

window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};

ESP.Screens.today = (function(){
  const U = ESP.U, M = ESP.Model, S = ESP.S;
  const { html, raw, when, map, cls } = ESP.h;
  const K = ESP.C;

  function gun(){ return S.ui.dayDate || U.todayISO(); }

  const TABS = [
    { id:'giris',  label:'Giriş' },
    { id:'ozet',   label:'Özet' },
    { id:'gecmis', label:'Geçmiş' },
  ];

  /* ------------------------------------------------------------ siradaki is */

  function nextCard(){
    const n = ESP.Planner.nextAction();
    return K.Entry({
      class:'kahraman',
      label:'Sıradaki iş', hint:'next-action',
      meta:n.rank ? 'Öncelik ' + n.rank : 'Bekleyen yok',
      note:n.why,
      body:K.NextUp({
        icon:n.rank ? 'zap' : 'check',
        calm:!n.rank,
        /* Bekleyen iş kalmadığında görünür. ESP'nin işi bilgidir;
           kartın üstündeki kitap onu söyler. */
        sanat:'bilgi',
        label:n.rank ? 'Kural motorunun seçtiği tek iş' : 'Bekleyen iş yok',
        title:n.title,
        why:n.detail,
        action:n.route && n.route !== 'today'
          ? K.Button({ label:'Aç', tone:'primary', size:'sm', act:'go',
              data:{ 'data-route':n.route } })
          : '',
      }),
    });
  }

  /* Denetim sorusu — AYRI EKRAN DEĞİL, mevcut akışın içinde tek satır.

     Nöbetçi ve sürtünme ölçer arka planda çalışır (core/signals.js);
     buraya yalnızca sıradaki TEK soru düşer. Grafik yok, pencere
     karşılaştırması yok, "nöbetler" listesi yok — onlar isteyen için
     Analiz → Dürüstlük'te durur.

     Soru yoksa bu satır HİÇ ÇİZİLMEZ. Sistemin sormadığı gün, iyi gündür. */
  function signalRow(){
    if(!ESP.Signals) return null;
    const sig = ESP.Signals.current();
    if(!sig) return null;

    /* Gösterim anında «görüldü» damgalanır: sonradan sormanın yolu yok.
       Yeniden çizim döngüsü açmasın diye sessizce yazılır. */
    if(!sig.seenAt) ESP.Signals.markSeen(sig.id);

    return K.Entry({
      label:'Bir soru', hint:'signal',
      meta:sig.kind === 'friction' ? 'sürtünme' : 'gösterge',
      note:sig.title,
      body:html`
        ${K.Notice({ tone:'info', body:sig.question })}
        ${when(sig.answeredAt, () => html`
          <p class="small muted mt-8">Cevabın: ${sig.answer}</p>
          <p class="tiny dim">Soru açık kalır: ayrışmanın gerçekten kapanıp
            kapanmadığı bir sonraki pencerede ölçülecek.</p>`)}
        ${when(!sig.answeredAt, () => html`
          <div class="mt-8">
            ${K.Field({ label:'Kısa cevabın (isteğe bağlı)',
              input:K.Input({ id:'sig-answer', placeholder:'tek cümle yeter' }) })}
            <div class="row wrap mt-8">
              ${K.Button({ label:'Kaydet', tone:'primary', size:'sm', act:'signal-answer',
                data:{ 'data-id':sig.id } })}
              ${K.Button({ label:'Bu soru bana uymuyor', size:'sm', act:'signal-dismiss',
                data:{ 'data-id':sig.id } })}
            </div>
          </div>`)}`,
    });
  }

  /* ------------------------------------------------------------ oturum girisi */

  function entryForm(){
    const d = S.ui.sessionDisc || 'lang';
    const disc = ESP.DISCIPLINE_BY_ID[d];

    return K.Entry({
      label:'Oturum ekle', hint:'practice-log',
      meta:U.fmtDate(gun()),
      note:'Süre ölçümdür: saatine bakıp yazdığın dakika da «ölçüldü» sayılır. '
         + 'Boş bıraktığın alan sıfır değil, «veri yok» olur.',
      body:html`
        <div class="picks picks--disc">
          ${map(ESP.Mod.active(), x => K.PickCard({
            on:x.id === d, act:'pick-disc', data:{ 'data-disc':x.id },
            label:x.short, meta:x.unit,
          }))}
        </div>

        ${timerRow(d)}

        <div class="cols-3 mt-10">
          ${K.Field({ label:'Süre (dakika)',
            input:K.Input({ id:'s-min', type:'number', numeric:true, min:1, max:600,
              placeholder:'45', aria:'Oturum süresi dakika' }) })}
          ${K.Field({ label:countLabel(d), hint:'isteğe bağlı',
            input:K.Input({ id:'s-count', type:'number', numeric:true, min:0,
              placeholder:countPlaceholder(d), aria:countLabel(d) }) })}
          ${K.Field({ label:'Not', hint:'isteğe bağlı',
            input:K.Input({ id:'s-note', placeholder:'ne çalıştın?' }) })}
        </div>
        ${when(d === 'reading' && okunanlar().length, () => html`<div class="mt-10">
          ${K.Field({ label:'Kitap', hint:'isteğe bağlı — kitaba verdiğin süre Kütüphane’de görünür',
            input:K.Select({ id:'s-book', value:'', aria:'Okunan kitap',
              options:[{ value:'', label:'Kitaba bağlama' }].concat(okunanlar()
                .map(b => ({ value:b.id, label:(b.author ? b.author + ' — ' : '') + b.title }))) }) })}</div>`)}

        <div class="row mt-10">
          ${K.Button({ label:'Oturumu kaydet', tone:'primary', act:'add-session' })}
          ${when(disc, () => K.Button({ label:disc.label + ' ekranını aç', act:'go',
            data:{ 'data-route':disc.route } }))}
        </div>

        <p class="small muted mt-10">${disc ? disc.note : ''}</p>`,
    });
  }

  /* Okunmakta olan kitaplar (başlanmış, bitmemiş) — oturum bağı için. */
  function okunanlar(){
    return (S.books || []).filter(b => M.bookStatus(b).id === 'okunuyor');
  }

  function countLabel(discId){
    if(discId === 'lang') return 'Çözülen kart';
    if(discId === 'writing') return 'Kelime';
    if(discId === 'reading') return 'Sayfa';
    if(discId === 'music' || discId === 'diction') return 'Temiz tekrar';
    return 'Sayım';
  }

  function countPlaceholder(discId){
    if(discId === 'writing') return '600';
    if(discId === 'reading') return '24';
    return '12';
  }

  /* Serbest metin girisi — palet disinda da kullanilabilsin diye burada da var. */
  function quickForm(){
    return K.Entry({
      label:'Konuşarak gir',
      meta:'tek satır',
      note:'«45 dakika gitar çalıştım ve 20 dakika kelime tekrarı yaptım» gibi '
         + 'yazabilirsin. Anlaşılmayan satır atılmaz, sana geri gösterilir.',
      body:html`
        <div class="row">
          ${K.Input({ id:'quick-text', placeholder:'45 dk gitar, 20 dakika kelime',
            aria:'Serbest metin oturum girişi', class:'grow' })}
          ${K.Mic({ target:'quick-text' })}
          ${K.Button({ label:'Çöz', act:'parse-quick' })}
        </div>
        ${when(S.ui.quickParsed, () => quickPreview(S.ui.quickParsed))}`,
    });
  }

  function quickPreview(res){
    return html`
      <div class="mt-10">
        ${when(res.rows.length, () => html`
          ${K.Table({ tight:true, headers:['Disiplin', 'Süre', 'Sayım'],
            rows:res.rows.map(r => {
              const d = ESP.DISCIPLINE_BY_ID[r.disc];
              return [d ? d.label : r.disc, U.fmtMin(r.minutes),
                r.count != null ? U.fmtNum(r.count) + ' ' + (r.countWhat || '') : '—'];
            }) })}
          <div class="row mt-8">
            ${K.Button({ label:'Hepsini kaydet', tone:'primary', size:'sm', act:'save-quick' })}
            ${K.Button({ label:'Vazgeç', size:'sm', act:'clear-quick' })}
          </div>`)}
        ${when(res.unmatched.length, () => K.Notice({ tone:'warn', title:'Eşleşmedi',
          body:res.unmatched.map(u => '«' + U.esc(u.text) + '» — ' + u.why).join('<br/>')
             + '<br/><br/>Bu satırlar kaydedilmeyecek; yukarıdaki formdan elle girebilirsin.' }))}
      </div>`;
  }

  /* ------------------------------------------------------------- gunun listesi */

  function sessionList(){
    const rows = M.sessionsOf(gun());
    if(!rows.length){
      return K.Entry({
        label:'Bugün', meta:'kayıt yok',
        body:K.Empty({ text:'Bu güne henüz oturum girilmedi. '
          + 'Girilmemiş gün sıfır sayılmaz — hiçbir ortalamaya katılmaz.' }),
      });
    }
    const toplam = rows.reduce((a, s) => a + (s.minutes || 0), 0);
    return K.Entry({
      label:'Bugünün oturumları',
      meta:rows.length + ' oturum · ' + U.fmtMin(toplam),
      /* GÜNÜN ODAK ROZETİ — eylemlerin yanında, günün raporunda.
         Başarımlar sekmesindeki odak rozeti ömürlük rekordur; bu ise
         BU GÜNÜN kendisi (bkz. core/basarim.js, gununOdagi). Eşiğin
         altındaki gün rozet almaz ve boş döner. */
      action:raw(ESP.Basarim ? ESP.Basarim.odakHtml(toplam) : ''),
      body:K.Table({ tight:true,
        headers:['Disiplin', 'Süre', 'Sayım', 'Not', ''],
        rows:rows.map(s => {
          const d = ESP.DISCIPLINE_BY_ID[s.disc];
          return [
            d ? d.label : s.disc,
            s.minutes != null ? U.fmtMin(s.minutes) : raw(String(P_cert('missing'))),
            s.count != null ? U.fmtNum(s.count) : raw(String(P_cert('missing'))),
            s.note || '—',
            K.Button({ label:'Sil', size:'sm', act:'del-session', data:{ 'data-id':s.id } }),
          ];
        }) }),
    });
  }

  /* Kesinlik rozeti — ekrana ozel kucuk parca. */
  function P_cert(cert){
    const c = ESP.CERTAINTY[cert] || ESP.CERTAINTY.missing;
    return K.Badge({ label:c.label, tone:c.tone, icon:false });
  }

  /* ------------------------------------------------------------------ ozet */

  /* HEDEFLERİM (core/hedefler.js + core/hedefplan.js). Hedef Danışma'da
     konuşarak kurulur: «Bir yılda gitarda Kalfa'ya», «Bir ayda İngilizcede
     A2'ye», «bu yıl 24 kitap». Burada görünür, planı kurulur, askıya
     alınır, bırakılır. PLAN BÜYÜK AKSİYONDUR (AGENTS.md §1.9): önce
     ayrıntılı önizleme, sonra «Planı uygula» — önizleme onayın kendisidir —
     ve her zaman «Planı geri al». */
  const BANT = { gercekci:'gerçekçi', zorlayici:'zorlayıcı',
    gercekci_degil:'bu sürede olmaz', guvensiz:'güvenli değil' };

  function hedefDugmeleri(h){
    return html`
      ${h.durum === 'aktif'
        ? K.Button({ label:'Askıya al', size:'sm', act:'hedef-durum', data:{ 'data-id':h.id, 'data-durum':'askida' } })
        : K.Button({ label:'Sürdür', size:'sm', act:'hedef-durum', data:{ 'data-id':h.id, 'data-durum':'aktif' } })}
      ${K.Button({ label:'Tamamlandı', size:'sm', act:'hedef-durum', data:{ 'data-id':h.id, 'data-durum':'tamam' } })}
      ${K.Button({ label:'Bırak', size:'sm', tone:'ghost', act:'hedef-durum', data:{ 'data-id':h.id, 'data-durum':'birakildi' } })}`;
  }

  function hedefOnizleme(h){
    const r = ESP.HedefPlan.kur(h, U.todayISO());
    if(!r.ok){
      return html`<div class="mt-8">${K.Notice({ tone:'warn', title:'Plan kurulamadı.', body:r.why })}
        <div class="row gap-8 mt-8">${K.Button({ label:'Kapat', size:'sm', act:'hedef-plan-kapat' })}</div></div>`;
    }
    const p = r.plan;
    return html`<div class="mt-8">
      <p class="tiny dim"><b>Plan önizlemesi</b> — onaylanana kadar hiçbir şey değişmez.</p>
      ${K.Table({ tight:true, headers:['', 'Şimdi', 'Plandan sonra'],
        rows:ESP.HedefPlan.onizleme(p).map(x => [x.alan, x.once, x.sonra]) })}
      ${when(p.calisma, () => html`<p class="tiny mt-8"><b>Çalışılacaklar</b> (merdiven:
        ${p.calisma.basamak}): ${p.calisma.liste.join(' · ')}</p>`)}
      ${when(p.uyarilar.length, () => html`<div class="stack-sm mt-8">${map(p.uyarilar, u =>
        K.Notice({ tone:'info', body:u }))}</div>`)}
      <p class="tiny dim mt-8">Kontrol noktaları dört haftada birdir; beklenen değer
        ${p.etiket === 'hesaplandi' ? 'kendi ölçümünden hesaplandı' : 'tahmindir'}. Plan geri
        alınabilir; geri alınca odak ve taban bugünkü haline döner.</p>
      <div class="row gap-8 mt-8" style="flex-wrap:wrap">
        ${K.Button({ label:'Planı uygula', size:'sm', tone:'primary', act:'hedef-plan-uygula',
          data:{ 'data-id':h.id } })}
        ${K.Button({ label:'Şimdilik değil', size:'sm', act:'hedef-plan-kapat' })}
      </div></div>`;
  }

  /* UYARLAMA DÖNGÜSÜ (brand/ortak/hedef.js `uyarla`). Plan kontrolde geride
     kalınca hedef BUGÜNÜN verisiyle yeniden değerlendirilir; yetişmiyorsa
     seçenekler sunulur. Seçim yapana kadar hiçbir şey değişmez; seçince eski
     plan geri alınır, hedef güncellenir ve yeni plan yine önizleme ve
     onaydan geçer (büyük aksiyon). */
  function uyarlamaKutusu(h){
    const H = window.LIFEOS.Hedef;
    const u = H.uyarla(h, ESP.Hedefler.PAKET_BY_ID[h.paket], {}, U.todayISO());
    return html`<div class="mt-8">
      <p class="tiny dim"><b>Bugünün verisiyle yeniden hesap</b> — seçim yapana kadar hiçbir şey değişmez.</p>
      <p class="small">${u.metin}</p>
      ${u.senaryolar.length ? html`<div class="row gap-8 mt-8" style="flex-wrap:wrap">${map(u.senaryolar, (x, i) =>
        K.Button({ label:x.ad + ' · ' + H.tarihYaz(x.son_tarih), size:'sm', act:'hedef-uyarla-sec',
          data:{ 'data-id':h.id, 'data-i':String(i) } }))}</div>
        <p class="tiny dim mt-8">Seçince eski plan geri alınır, hedef yeni tarih ve vakitle güncellenir;
          yeni planı önizleyip onaylarsın. Eski tarih hedefin geçmişinde kalır.</p>`
        : K.Notice({ tone:'info', body:'Bu tarihe hâlâ yetişilebilir; plan olduğu gibi kalabilir.' })}
      <div class="row gap-8 mt-8">${K.Button({ label:'Kapat', size:'sm', act:'hedef-uyarla-kapat' })}</div>
    </div>`;
  }

  function hedefPlanOzeti(h, p){
    const il = ESP.HedefPlan.ilerleme(p, U.todayISO());
    return html`<div class="stack-sm mt-8">
      <p class="small">Plan uygulandı · günde ${p.gunlukDk} dk${p.haftalikGun < 7
        ? ', haftada ' + p.haftalikGun + ' gün' : ''} · odak ${(ESP.DISCIPLINE_BY_ID[p.disc] || {}).label || p.disc}</p>
      ${when(il.sonraki, () => html`<p class="tiny">Sonraki kontrol: <b>${U.fmtDate(il.sonraki.tarih)}</b>
        — beklenen ${String(il.sonraki.beklenen).replace('.', ',')} ${p.birim}</p>`)}
      ${K.Notice({ tone:il.durum === 'geride' ? 'warn' : 'info', body:il.metin })}
      ${S.ui.uyarla === h.id ? uyarlamaKutusu(h) : when(il.durum === 'geride', () => K.Button({
        label:'Yeniden hesapla', size:'sm', tone:'primary', act:'hedef-uyarla-ac', data:{ 'data-id':h.id } }))}
      ${when(p.calisma, () => html`<p class="tiny dim">Çalışılacaklar (${p.calisma.basamak}):
        ${p.calisma.liste.join(' · ')}</p>`)}
      <div class="row gap-8" style="flex-wrap:wrap">
        ${K.Button({ label:'Planı geri al', size:'sm', act:'hedef-plan-geri', data:{ 'data-id':h.id } })}
        ${hedefDugmeleri(h)}
      </div></div>`;
  }

  /* ALIŞKANLIK (brand/ortak/aliskanlik.js): planı yoktur; ilerleme doğrudan
     KAYITTAN sayılır. «Kayıt yok» «yapılmadı» demek değildir. */
  function aliskanlikOzeti(h){
    const il = ESP.Hedefler.ALISKANLIK.ilerleme(h, U.todayISO());
    return html`<div class="stack-sm mt-8">
      ${K.Notice({ tone:il.durum === 'geride' ? 'warn' : 'info', body:il.metin })}
      <div class="row gap-8" style="flex-wrap:wrap">${hedefDugmeleri(h)}</div></div>`;
  }

  function hedefSatir(h){
    const g = h.gerceklik || {};
    const p = ESP.HedefPlan ? ESP.HedefPlan.aktif(h.id) : null;
    const onizle = !p && S.ui.planOnizle === h.id && h.durum === 'aktif';
    return html`<div>
      <div><b class="small">${ESP.Hedefler.ozet(h)}</b>
        <div class="tiny dim">${h.durum === 'askida' ? 'askıda · ' : ''}${h.son_tarih
          ? 'son tarih ' + U.fmtDate(h.son_tarih) : 'tarihsiz'}${h.kapasite && h.kapasite.gunluk_dk
          ? ' · günde ' + h.kapasite.gunluk_dk + ' dk' : ''}${g.bant ? ' · ' + BANT[g.bant]
          + ' (' + (g.etiket === 'hesaplandi' ? 'hesaplandı' : 'tahmin') + ')' : ''}</div></div>
      ${h.paket === 'aliskanlik' && ESP.Hedefler.ALISKANLIK ? aliskanlikOzeti(h)
        : p ? hedefPlanOzeti(h, p) : onizle ? hedefOnizleme(h) : html`
        <div class="row gap-8 mt-6" style="flex-wrap:wrap">
          ${when(ESP.HedefPlan && h.durum === 'aktif', () => K.Button({ label:'Planı gör', size:'sm',
            tone:'primary', act:'hedef-plan-onizle', data:{ 'data-id':h.id } }))}
          ${hedefDugmeleri(h)}
        </div>`}
    </div>`;
  }

  /* Zaman bütçesi (HKM core/hedefag.py): cümleyi HKM'nin kodu kurar;
     burası yalnız gösterir. HKM kapalıysa satır hiç çizilmez. */
  function butceSatiri(){
    const b = ESP.Hedefler.ag ? ESP.Hedefler.ag.butce() : null;
    if(!b || !b.metin) return '';
    return K.Notice({ tone:{ sigar:'info', sikisik:'warn', sigmaz:'warn' }[b.bant] || 'info', title:'Zaman bütçesi (King):', body:b.metin });
  }

  function hedefRow(){
    if(!ESP.Hedefler) return null;
    const l = ESP.Hedefler.aktifler();
    return K.Entry({
      label:'Hedeflerim', meta:l.length ? l.length + ' etkin' : 'yok',
      action:K.Button({ label:'Danışma’da hedef koy', size:'sm', act:'go', data:{ 'data-route':'team' } }),
      body:l.length ? html`<div class="stack-sm">${butceSatiri()}${map(l, hedefSatir)}</div>`
        : K.Ayrinti({ etiket:'Örnekler', ozet:'Henüz hedefin yok. Danışma’da tek cümleyle yazabilirsin.',
          govde:html`<p>«Bir yılda gitarda Kalfa’ya gelmek istiyorum», «Bir ayda İngilizcede A2’ye
            gelmek istiyorum» ya da «bu yıl 24 kitap okumak istiyorum» gibi yazabilirsin; vaktine
            göre olup olmadığını ve olacağı tarihi söylerim. Alışkanlık da kurabilirsin: «her gün
            20 dakika kitap okuma alışkanlığı kazanmak istiyorum».</p>` }),
    });
  }

  function summaryRows(){
    const bugun = gun();
    const rows = M.sessionsOf(bugun);
    const toplam = rows.reduce((a, s) => a + (s.minutes || 0), 0);
    const taban = (S.profile && S.profile.dailyMinutes) || 60;
    const ehs = ESP.Intellect.ehs(14);
    const denge = ESP.Planner.balance(7);

    return [
      hedefRow(),
      K.Entry({
        label:'Günün toplamı',
        meta:rows.length ? U.fmtMin(toplam) : 'veri yok',
        note:'Taban ' + U.fmtMin(taban) + '. Taban bir hedef değil bir ölçüttür: '
           + 'altında kalmak başarısızlık değil, rotayı daraltan bir olgudur.',
        body:rows.length
          ? K.Meter({ label:'Taban doluluğu', value:Math.min(100, toplam / taban * 100),
              text:U.fmtMin(toplam) + ' / ' + U.fmtMin(taban) })
          : K.Notice({ tone:'info',
              body:'Bugüne hiç oturum girilmedi. Bu gün ortalamaya katılmaz.' }),
      }),

      K.Entry({
        label:'Asgari gün', hint:'minimum-day',
        meta:'kötü günün alt sınırı',
        note:ESP.MINIMUM_DAY.note,
        body:html`<ul class="setup__list">
          <li>${ESP.MINIMUM_DAY.srs}</li>
          <li>${ESP.MINIMUM_DAY.read}</li>
          <li>${ESP.MINIMUM_DAY.practice}</li>
        </ul>`,
      }),

      K.Entry({
        label:'Entelektüel hacim', hint:'ehs',
        meta:ehs.cert === 'missing' ? 'veri yok'
          : U.fmtNum(Math.round(ehs.value * 10) / 10),
        note:ehs.cert === 'missing'
          ? 'Son ' + ehs.windowDays + ' günde ölçülmüş pratik yok; hacim hesaplanmadı.'
          : ehs.windowDays + ' günün ' + ehs.enteredDays + '\'inden hesaplandı.',
        body:ehs.cert === 'missing'
          ? K.Empty({ text:'İlk oturumu girdiğinde hacim ölçülmeye başlar.' })
          : K.Table({ tight:true,
              headers:['Disiplin', { label:'Süre', num:true }, { label:'Katsayı', num:true }, 'Kaynak'],
              rows:ehs.rows.map(r => [
                r.disc.label,
                r.cert === 'missing' ? P_cert('missing') : U.fmtMin(Math.round(r.hours * 60)),
                r.cert === 'missing' ? '—' : U.fmtNum(Math.round(r.k * 100) / 100),
                r.kWhy,
              ]) }),
      }),

      K.Entry({
        label:'Haftanın dağılımı',
        meta:denge.cert === 'missing' ? 'veri yok' : U.fmtMin(denge.totalMinutes),
        note:denge.skewed
          ? 'Pratik ' + denge.top.label + ' tarafına yığılmış ve '
            + denge.untouched.map(d => d.label).join(', ') + ' hiç açılmamış.'
          : 'Son ' + denge.windowDays + ' gün.',
        body:denge.cert === 'missing'
          ? K.Empty({ text:'Son yedi günde kayıt yok.' })
          : html`${map(denge.rows, r => html`
              <div class="mt-8">
                ${K.Meter({ label:r.disc.label,
                  value:r.share == null ? 0 : r.share * 100,
                  text:r.cert === 'missing' ? 'veri yok' : U.fmtMin(r.minutes) })}
              </div>`)}`,
      }),
    ];
  }

  /* Dünkünün aynısı (core/dunku.js): dünün oturumu tek dokunuşla bugüne.
     Yalnız bugün dokunulmamış disiplin önerilir; seçili gün bugün değilse yok. */
  function dunkuRow(){
    if(!ESP.Dunku || gun() !== U.todayISO()) return null;
    const a = ESP.Dunku.adaylar(U.todayISO());
    if(!a.oturumlar.length) return null;
    return K.Entry({ label:'Dünkünün aynısı', meta:U.fmtShort(a.dun), wide:true,
      note:'Aynısını yaptıysan tek dokunuşla bugüne ekle; kalite puanı kopyalanmaz.',
      body:html`${map(a.oturumlar, o => html`<div class="row between wrap gap-6 mt-4">
        <span class="small"><b>${o.ad}</b> <span class="tiny dim">${o.dk} dk${o.sayim ? ' · ' + o.sayim : ''}</span></span>
        ${K.Button({ label:'Bugüne ekle', size:'sm', act:'dunku-oturum', data:{ 'data-id':o.id } })}</div>`)}` });
  }

  /* Seri satiri Giris sekmesinde: «Bugün hastayım» ve «Tatil modu» aranmaz. */
  function seriRow(){
    if(!ESP.Seri) return null;
    return K.Entry({ label:'Seri', hint:'streak', meta:M.streak() + ' gün', wide:true,
      body:seriKontrol() });
  }

  /* Seri dondurma ve tatil modu (brand/ortak/seri.js): hasta gün ve tatil
     seriyi bozmaz; tatildeyken HKM soru sormaz. */
  /* Yıllık tatil sınırı kullanıcının ayarıdır (kullanıcı kararı 2026-09-24;
     brand/ortak/seri.js). Düşürmek var olan tatili silmez. */
  function TatilSiniri(){
    const sinir = ESP.Seri.yillikTatil(), kalan = ESP.Seri.kalanTatil();
    return html`<div class="row wrap gap-6 mt-6">
      <span class="tiny dim">Yıllık tatil sınırı: bu yıl kalan ${kalan} / ${sinir} gün</span>
      ${K.Input({ id:'seri-tatil-sinir', type:'number', size:'sm', numeric:true, value:sinir,
        aria:'yıllık tatil sınırı, gün' })}
      ${K.Button({ label:'Sınırı kaydet', size:'sm', act:'seri-tatil-sinir' })}</div>`;
  }

  function seriKontrol(){
    if(!ESP.Seri) return '';
    const bugun = U.todayISO();
    const t = ESP.Seri.aktifTatil(bugun);
    const k = ESP.Seri.kayitOf(bugun);
    if(t) return html`<div class="row between wrap gap-6 mt-6">
      <span class="tiny">Tatil modu: ${U.fmtShort(t.bas)} – ${U.fmtShort(t.bit)} · seri korunuyor, HKM soru sormuyor</span>
      ${K.Button({ label:'Tatili bitir', size:'sm', act:'seri-tatil-bitir' })}</div>`;
    if(k) return html`<div class="row between wrap gap-6 mt-6">
      <span class="tiny">Bugün dondurulmuş (${LIFEOS.Seri.NEDEN[k.neden].toLocaleLowerCase('tr')}) · seri bozulmaz</span>
      ${K.Button({ label:'Geri al', size:'sm', act:'seri-coz', data:{ 'data-id':k.id } })}</div>`;
    if(S.ui.tatilSec) return html`<div class="row wrap gap-6 mt-6">
      <span class="tiny">Kaç gün?</span>
      ${map([3, 7, 14], n => K.Button({ label:n + ' gün', size:'sm', act:'seri-tatil-gun', data:{ 'data-gun':String(n) } }))}
      ${K.Button({ label:'Vazgeç', size:'sm', act:'seri-tatil-vazgec' })}</div>
      ${TatilSiniri()}`;
    const kotu = ESP.KotuGun && ESP.KotuGun.aktif(bugun);
    return html`${when(kotu, () => html`<div class="row between wrap gap-6 mt-6">
      <span class="tiny">Kötü gün modu: vadesi gelen tekrar yerinde, genişleme yok; bugün asgari gün yeter</span>
      ${K.Button({ label:'Normal güne dön', size:'sm', act:'kotu-gun-kapat' })}</div>`)}
      <div class="row wrap gap-6 mt-6">
      ${when(ESP.KotuGun && !kotu, () => K.Button({ label:'Kötü gün', size:'sm', act:'kotu-gun' }))}
      ${K.Button({ label:'Bugün hastayım · seri donsun', size:'sm', act:'seri-hasta' })}
      ${K.Button({ label:'Tatil modu', size:'sm', act:'seri-tatil' })}</div>`;
  }

  /* ---------------------------------------------------------------- gecmis */

  function historyRows(){
    const gunler = U.lastDays(14).slice().reverse();
    const dolu = gunler.filter(d => M.dayHasEntry(S.days[d]));
    return [
      K.Entry({
        label:'Son 14 gün', hint:'streak',
        meta:dolu.length + ' günde kayıt · seri ' + M.streak() + ' gün',
        note:'Boş gün «0 dakika» değil «veri yok» sayılır. İkisi ayrı renkte durur.',
        wide:true,
        body:html`<div class="daystrip">
          ${map(gunler, d => {
            const gecti = M.dayHasEntry(S.days[d]);
            const dk = gecti ? M.minutesOf(d) : null;
            return html`<button class="${ESP.h.cls('daycell', gecti && 'is-on',
                d === gun() && 'is-sel')}"
              data-act="pick-day" data-date="${d}"
              title="${U.fmtDate(d) + (gecti ? ' · ' + U.fmtMin(dk || 0) : ' · veri yok')}">
              <span class="daycell__d">${d.slice(8)}</span>
              <span class="daycell__v">${gecti ? U.fmtNum(dk || 0) : '—'}</span>
            </button>`;
          })}
        </div>`,
      }),
      K.Entry({
        label:'Seçili gün',
        meta:U.fmtDate(gun()),
        action:gun() !== U.todayISO()
          ? K.Button({ label:'Bugüne dön', size:'sm', act:'today-back' }) : '',
        body:M.dayHasEntry(S.days[gun()])
          ? K.Table({ tight:true, headers:['Disiplin', 'Süre', 'Not'],
              rows:M.sessionsOf(gun()).map(s => {
                const d = ESP.DISCIPLINE_BY_ID[s.disc];
                return [d ? d.label : s.disc,
                  s.minutes != null ? U.fmtMin(s.minutes) : P_cert('missing'),
                  s.note || '—'];
              }) })
          : K.Empty({ text:'Bu güne kayıt girilmemiş.' }),
      }),
    ];
  }

  /* --------------------------------------------------------- zamanlayıcı

     Sistem baştan beri «süre ölçümdür» diyordu ama ölçecek bir şey
     vermiyordu: kullanıcı saatine bakıp dakikayı elle yazıyordu. Elle
     yazılan dakika da bir ölçümdür — ama başlarken saate bakmayı
     hatırlamak ve bitirirken çıkarma yapmak gerekiyordu; ikisi de
     unutulur, unutulan oturum hiç girilmez.

     Sayaç DUVAR SAATİNDEN okur (bkz. core/timer.js): arka plan sekmesinde
     de doğru ölçer, sayfa kapanıp açılsa da yerinde durur. */
  function timerRow(secili){
    const T = ESP.Timer;
    const acik = T.active();
    const calisiyor = T.running();
    const td = T.disc();
    const d = ESP.DISCIPLINE_BY_ID[td] || {};

    if(!acik){
      return html`<div class="timer">
        ${K.Button({ label:'Sayacı başlat', act:'timer-start',
          data:{ 'data-disc':secili } })}
        <span class="tiny dim">${(ESP.DISCIPLINE_BY_ID[secili] || {}).label
          || ''} için ölçmeye başla — süreyi sistem tutar.</span>
      </div>`;
    }

    return html`<div class="${cls('timer', 'is-on', calisiyor && 'is-running')}">
      <span class="timer__clock num" data-timer="1"
        aria-label="Geçen süre">${T.clock()}</span>
      <span class="timer__disc">${d.label || td}</span>
      ${calisiyor
        ? K.Button({ label:'Duraklat', size:'sm', act:'timer-pause' })
        : K.Button({ label:'Sürdür', size:'sm', act:'timer-resume' })}
      ${K.Button({ label:'Bitir ve kaydet', tone:'primary', size:'sm',
        act:'timer-stop' })}
      ${K.Button({ label:'Vazgeç', size:'sm', act:'timer-reset' })}
      ${when(T.suspicious(), () => K.Badge({ label:T.SUPHE_SAAT
        + ' saati geçti — unutulmuş olabilir', tone:'warn' }))}
    </div>`;
  }

  /* ---------------------------------------------------------- günün planı

     Sıradaki tek iş SIRAYI söyler, plan İÇERİĞİ. İkisi ayrı satırdır ve
     ayrı kalmalıdır: «bugün dil çalış» ile «on kartı bağlam cümlesiyle
     karta çevir» aynı cümle değildir.

     Plan en fazla İKİ disiplin taşır. Üçüncüyü eklemek, günde üç alan
     açmanın kibar hâlidir — üçü de kapanmaz. */
  function planRow(){
    const p = ESP.Coach.plan(gun());
    const asgari = ESP.Coach.minimumDay(gun());

    return K.Entry({
      label:'Günün reçetesi', hint:'coach',
      meta:U.fmtMin(p.minutes),
      note:'Reçeteyi koç yazar, sırayı planlayıcı verir.',
      action:K.Button({ label:'Merdiven', size:'sm', act:'go',
        data:{ 'data-route':'ladder' } }),
      wide:true,
      body:html`
        ${p.prescriptions.length
          ? map(p.prescriptions, r => html`
              <div class="rxblock">
                <div class="rxblock__head">
                  <b>${r.label}</b>
                  <span class="tiny dim">${r.level.label}</span>
                  <span class="tiny dim">${U.fmtMin(r.minutes)}</span>
                  ${K.Button({ label:'Aç', size:'sm', act:'go',
                    data:{ 'data-route':r.route } })}
                </div>
                ${ESP.Parts.rx(r)}
              </div>`)
          : K.Empty({ text:'Reçete yazılamadı: disiplin listesi boş.' })}

        <p class="minline${asgari.metToday ? '' : ' is-open'}">
          ${raw(ESP.UI.hint('minimum-day'))}
          <b>Asgari gün</b>
          <span>${asgari.cards ? asgari.cards + ' vadeli kart' : 'vadeli kart yok'}
            · 10 dk okuma · 15 dk pratik</span>
          ${when(asgari.metToday, () => K.Badge({ label:'bugün açıldı', tone:'ok' }))}
        </p>`,
    });
  }

  /* Planın bugünkü satırı. Plan kurulmamışsa hiç çizilmez: kurulmamış bir
     planın yerine boş bir kutu koymak, kullanıcıya eksik bir şey varmış gibi
     gösterirdi. */
  function planRowToday(){
    const g = ESP.Plans.today(gun());
    if(!g) return '';
    return K.Entry({
      label:'Planda bugün', hint:'weekplan',
      meta:g.label,
      note:'Haftalık plandan geliyor. Plan bir takvim değil bir sıradır; '
         + 'saatini sen seçersin.',
      body:html`
        <div class="row wrap">
          ${K.Badge({ label:U.fmtMin(g.minutes), tone:'muted', icon:false })}
          <span class="small">${(g.items || []).map(x => x.label).join(' · ') || '—'}</span>
          ${K.Button({ label:'Bölüme git', size:'sm', act:'go',
            data:{ 'data-route':g.route } })}
        </div>`,
    });
  }

  /* Bugüne düşen hatırlatmalar — bütün bölümlerden tek listede.

     Hatırlatıcı bir görev değildir ve kaçırılmış olması ceza üretmez.
     Burada durmasının tek sebebi, bölüm bölüm dolaşmadan görülebilmesi. */
  function reminderRow(){
    const bugun = M.dueReminders(null, gun())
      .filter(r => ESP.Mod.isOn(r.disc));
    if(!bugun.length) return '';
    return K.Entry({
      label:'Hatırlatma', hint:'reminder',
      meta:bugun.length + ' satır',
      note:'Kendine söylediğin şeyler. Sistem hiçbirini zorunlu kılmaz; '
         + 'kaçırılan bir hatırlatıcı borç yazmaz.',
      wide:true,
      body:html`<ul class="remlist">${map(bugun, r => {
        const d = ESP.DISCIPLINE_BY_ID[r.disc] || {};
        /* Tam tarih yerine YAS: "2026-09-13" satirda iki satira boluyordu
           ve zaten bugunku listede tarihin kendisi bilgi tasimiyor —
           "bugun" ya da "3 gun gecikti" tasiyor. */
        const yas = U.diffDays(r.due, gun());
        return html`<li class="${cls('remrow', r.due < gun() && 'is-due')}">
          <span class="remrow__date">${yas ? yas + ' gün gecikti' : 'bugün'}</span>
          <span class="remrow__text">${r.text}</span>
          <span class="tiny dim">${d.label || r.disc}</span>
          ${K.Button({ label:'Yapıldı', size:'sm', act:'desk-done-rem',
            data:{ 'data-id':r.id } })}
          ${K.Button({ label:'Bölüme git', size:'sm', act:'go',
            data:{ 'data-route':d.route || 'today' } })}
        </li>`;
      })}</ul>`,
    });
  }

  /* ------------------------------------------------------------------ cizim */

  /* ---------- HKM teklifleri ----------

     HKM bu sisteme YAZMAZ: kuyruktan gelen her satir bir TEKLIFTIR ve
     kullanici gormeden hicbir sey uygulanmaz. Uygulayan da HKM degil,
     ESP'in kendi kodudur. Kuyruk bossa hic cizilmez. */
  /* ---------- HKM seridi: KUCUK ve HER GUN ORADA

     HKM ayarlari bir ayar ekraninin icinde duruyordu: gunde bir bakilan
     bir yerde, gun boyu acik duran bir baglantinin durumu. Bagli mi
     degil mi, en son ne zaman gitti — bunlar gunluk ekranda TEK SATIR
     olmali.

     Serit bir AYAR EKRANI DEGILDIR: durumu soyler ve tek bir is
     yaptirir. Ayarin yeri yine kendi ekranidir; iki yerde iki ayar
     olsaydi biri otekini sessizce yenerdi. */
  function saat(iso){
    if(!iso) return null;
    const d = new Date(iso);
    if(isNaN(d.getTime())) return null;
    return U.pad2(d.getHours()) + ':' + U.pad2(d.getMinutes());
  }

  function hkmSeritRow(){
    if(!ESP.Beacon) return '';
    const a = ESP.Beacon.settings();

    if(!a.enabled){
      return K.Entry({ label:'HKM', hint:'hkm', meta:'bağlı değil',
        wide:true, body:html`<p class="tiny dim">Hayat Kontrol
          Merkezi'ne günün özetini göndermek istersen ayarlardan
          açabilirsin. ESP bundan bağımsız çalışır: HKM kapalıyken
          hiçbir şey eksilmez.</p>` });
    }

    const gitti = saat(a.lastOkAt);
    const denendi = saat(a.lastAt);
    /* Basarisiz son deneme YUTULMAZ: «gonderildi» ile «gonderilmeye
       calisildi» ayri seylerdir. */
    const bozuk = a.lastStatus !== null && a.lastStatus !== undefined
      && a.lastStatus !== 202;

    return K.Entry({ label:'HKM', hint:'hkm', wide:true,
      meta:bozuk ? ('son deneme ' + (denendi || '—') + ' · başarısız')
        : (gitti ? ('son gönderim ' + gitti) : 'henüz gönderilmedi'),
      body:html`
        ${when(bozuk, () => K.Notice({ tone:'warn',
          body:(a.lastNote || 'Gönderilemedi.') + ' ESP bundan etkilenmez; '
             + 'veri burada duruyor ve bir sonraki denemede gider.' }))}
        <div class="row gap-8 mt-8">
          ${K.Button({ label:'Şimdi gönder', size:'sm', act:'hkm-gonder' })}
        </div>
        <p class="tiny dim mt-8">Giden şey günün ÖZETİDİR: etiketli
          ölçümler. Ham kayıt ESP'de kalır.</p>` });
  }

  /* YEDEK UYARISI — GÜNLÜK EKRANDA ve HER SEKMEDE.

     Uyarı daha önce yalnız Profil sayfasında duruyordu: yedek almayı
     unutan birinin gitmediği yerde. Eşik de otuz gündü ve yaş UTC
     damgasından hesaplanıyordu. Üçü birleşince hatırlatma, kaybı
     önleyecek olan şey değil kaybın yanında duran bir not oluyordu.

     Kural ortak (`brand/ortak/yedek.js`): yedi gün, yerel tarihten, ve
     korunacak veri yokken hiç çıkmaz. */
  function yedekRow(){
    if(!M.backupDue()) return '';
    const yas = M.backupAgeDays();
    return K.Entry({ label:'Yedek', hint:'backup', wide:true,
      meta:yas === null ? 'hiç alınmadı' : yas + ' gün önce',
      body:html`
        ${K.Notice({ tone:'info', body:(yas === null
          ? 'Henüz hiç yedek almadın.'
          : 'Son yedeğin ' + yas + ' gün önce alındı.')
          + ' Tarayıcı verisi silinirse oturum geçmişin, kartların ve '
          + 'notların kaybolur.' })}
        <div class="row gap-8 mt-8">
          ${K.Button({ label:'Yedek al', size:'sm',
            act:'go', data:{ 'data-route':'profile' } })}
        </div>` });
  }

  /* BUGÜN — üç alan (katalog 03, EKIP-PLANI §3):
       ŞİMDİ   sıradaki tek iş, tek cümlelik hızlı kayıt, (varsa) günün sorusu
       DURUM   özet · bugünün oturumları · planda bugün
       ÖNERİ   en çok bir kart; fazlası «+N öneri Onaylar'da»
     Geri kalan her satır «Bugün › Ayrıntı»dadır (renderAyrinti). Sadelik
     bütçesi: sayfa boyu 1800 px, görünen düğme 14. */
  function OzetKutusu(){
    const rows = M.sessionsOf(gun());
    const toplam = rows.reduce((a, s) => a + (s.minutes || 0), 0);
    const d = ESP.SRS.deckStatus();
    const hucre = (ad, deger, birim, not) => html`<div class="ozet__hucre">
      <span class="ozet__ad">${ad}</span>
      <b class="ozet__deger">${deger}${when(birim, () => html`<small> ${birim}</small>`)}</b>
      <span class="ozet__not">${not}</span></div>`;
    /* Girilmemiş gün sıfır değildir: oturum yoksa dakika «—». */
    return K.Kutu({ ad:'Özet', yuva:'bugün', bitisik:true, govde:html`<div class="ozet">
      ${hucre('Bugün', rows.length ? U.fmtNum(toplam) : '—', rows.length ? 'dk' : '', rows.length + ' oturum')}
      ${hucre('Vadeli kart', d.due, '', 'tekrar bekliyor')}
      ${hucre('Seri', M.streak(), 'gün', 'asgari gün tutuldu')}
      ${hucre('Açık disiplin', ESP.Mod.active().length, '', 'Çalışma’da')}
    </div>` });
  }

  /* 091 DAKİKA HALKASI (vitrin): günün ölçütü profildeki dakika; halka
     rengi değişmez, yalnız dolar. Dokunulmamış disiplin «—», 0 dk değil. */
  function DakikaKutusu(){
    const V = (window.LIFEOS || {}).VITRIN;
    if(!V) return '';
    const rows = M.sessionsOf(gun());
    const hedef = (S.profile && S.profile.dailyMinutes) || null;
    const ic = V.dakikaHalkasi({ hedef, toplam:rows.reduce((a, s) => a + (s.minutes || 0), 0),
      satirlar:ESP.Mod.active().slice(0, 4).map(d => ({ ad:(ESP.DISCIPLINE_BY_ID[d.id || d] || {}).short || (d.id || d),
        dk:M.minutesOf(gun(), d.id || d) })) });
    return ic ? K.Kutu({ ad:'Günün dakikası', yuva:'ölçüt ' + hedef + ' dk', class:'vkutu', govde:raw(ic) }) : '';
  }

  function render(){
    const O = ESP.Screens.onaylar;
    const oneri = O && O.bekleyen() ? O.oneriAlani() : '';
    return html`<div class="bugun" data-oz="003">
      <div class="bugun__sol">
        <section class="bugun__alan" aria-label="Şimdi"><h2 class="bugun__etiket" aria-hidden="true">Şimdi</h2>
          ${K.Ledger(() => [nextCard(), quickForm(), signalRow()].filter(Boolean))}
        </section>
        <section class="bugun__alan" aria-label="Durum"><h2 class="bugun__etiket" aria-hidden="true">Durum</h2>
          ${K.Ledger(() => [sessionList(), planRowToday()].filter(Boolean))}
          <p class="small">${K.Button({ label:'Oturum gir ve bütün satırlar', size:'sm', tone:'ghost',
            act:'go', data:{ 'data-route':'gun' } })}</p>
        </section>
      </div>
      <div class="bugun__sag">
        <section class="bugun__alan" aria-label="Özet"><h2 class="bugun__etiket" aria-hidden="true">Özet</h2>${OzetKutusu()}${DakikaKutusu()}</section>
        ${when(oneri, () => html`<section class="bugun__alan" aria-label="Öneri"><h2 class="bugun__etiket" aria-hidden="true">Öneri</h2>${oneri}</section>`)}
      </div>
    </div>`;
  }

  /* GÜNÜN AYRINTISI (Bugün › Ayrıntı). Önce Günlük'ün üç sekmesiydi
     (Giriş · Özet · Geçmiş); şimdi üçü alt alta bölümdür ve eski sekme
     eylemi (`day-tab`) bölüm çubuğunda kalır. Bugün'de duran şey (sıradaki
     iş, günün sorusu, oturumlar, planda bugün, öneri) burada tekrar
     çizilmez. */
  function renderAyrinti(){
    const guvenli = f => { try{ return K.Ledger(() => [].concat(f()).filter(Boolean)); }
      catch(e){ console.error(e); return K.Notice({ tone:'warn', body:'Bu bölüm şu an çizilemedi; kayıtların yerinde duruyor.' }); } };
    return K.Grid(html`${K.Span(12, K.SayfaBolumleri({ act:'day-tab', aria:'Günün bölümleri', bolumler:[
      { id:'giris', ad:'Giriş', sayi:M.sessionsOf(gun()).length || null, govde:guvenli(() => [yedekRow(), hkmSeritRow(),
        seriRow(), dunkuRow(), planRow(), reminderRow(), entryForm()]) },
      { id:'ozet', ad:'Özet', govde:guvenli(summaryRows) },
      { id:'gecmis', ad:'Geçmiş', govde:guvenli(historyRows) },
    ] }))}`);
  }

  /* Başka yerden istenen bölüm çizimden sonra görünür; istek bir kez. */
  function afterRenderAyrinti(){ ESP.Parts.bolumIstegi('dayTab', TABS[0].id); }

  /* HKM teklifine verilen cevabin TEK yolu: uygulama, yerel kayit ve
     merkeze bildirim tek sirada olur. «Uygulandı ama merkeze
     bildirilemedi» hali yutulmaz, SOYLENIR. */
  /* Öneri alanı: en öndeki tek kart; gerisi Onaylar'da (CEKMECE-HARITASI).
     King ve HKM teklif kartları screens/onaylar.js'e taşındı. */
  function oneriRow(){
    const O = ESP.Screens.onaylar;
    if(!O || !O.bekleyen()) return '';
    return K.Entry({ label:'Öneri', wide:true, body:O.oneriAlani() });
  }

  /* Öneri kartının düğmeleri Onaylar'ın işleyicilerine gider: onay TEK
     yoldan geçer, iki ekranda iki ayrı kod durmaz. */
  const ONAY_EYLEMLERI = ['king-onayla', 'king-parca', 'king-iptal', 'hkm-toplu',
    'hkm-intent-yes', 'hkm-intent-seen', 'hkm-intent-no', 'hkm-doubt-ok',
    'oneri-uygula', 'oneri-gec', 'oneri-gec-neden', 'oneri-onizle'];

  const handle = {
    async 'dunku-oturum'(el){
      const bugun = U.todayISO();
      const r = await ESP.Dunku.kopyala(bugun, el.dataset.id);
      if(!r.ok){ ESP.UI.toast(r.why); return; }
      ESP.UI.toast(r.ad + ' bugüne eklendi', { undo:async () => { await ESP.Dunku.geriAl(bugun, r.id); ESP.App.render(); } });
      ESP.App.render();
    },
    async 'kotu-gun'(){
      const r = await ESP.KotuGun.ac();
      if(!r.ok){ ESP.UI.toast(r.why); return; }
      ESP.UI.toast('Kötü gün modu açık: asgari gün yeter.', { undo:async () => {
        await ESP.KotuGun.kapat(r.gun); ESP.App.render(); } });
      ESP.App.render();
    },
    async 'kotu-gun-kapat'(){
      const r = await ESP.KotuGun.kapat();
      if(r.ok) ESP.UI.toast('Normal güne dönüldü');
      ESP.App.render();
    },
    async 'seri-hasta'(){
      const r = await ESP.Seri.dondur(U.todayISO(), null, 'hasta');
      if(!r.ok){ ESP.UI.toast(r.why); return; }
      ESP.UI.toast('Bugün donduruldu; seri bozulmaz. Geçmiş olsun.', { undo:async () => {
        await ESP.Seri.coz(r.kayit.id); ESP.App.render(); } });
      ESP.App.render();
    },
    async 'seri-coz'(el){ await ESP.Seri.coz(el.dataset.id); ESP.UI.toast('Dondurma geri alındı'); ESP.App.render(); },
    async 'seri-tatil'(){ S.ui.tatilSec = true; ESP.App.render(); },
    async 'seri-tatil-vazgec'(){ S.ui.tatilSec = false; ESP.App.render(); },
    async 'seri-tatil-sinir'(){
      const e = document.getElementById('seri-tatil-sinir');
      const ham = e ? String(e.value).trim() : '';
      if(!ham){ ESP.UI.toast('Yıllık tatil sınırı için bir gün sayısı yaz.'); return; }
      const r = await ESP.Seri.yillikTatilAyarla(Number(ham));
      if(!r.ok){ ESP.UI.toast(r.why, { life:5000 }); return; }
      ESP.App.render();
      ESP.UI.toast('Yıllık tatil sınırı ' + r.sinir + ' gün', { undo:async () => {
        await ESP.Seri.yillikTatilAyarla(r.onceki); ESP.App.render(); } });
    },
    async 'seri-tatil-gun'(el){
      S.ui.tatilSec = false;
      const bugun = U.todayISO();
      const bit = ESP.Seri.gunEkle(bugun, Number(el.dataset.gun) - 1);
      const r = await ESP.Seri.dondur(bugun, bit, 'tatil');
      ESP.UI.toast(r.ok ? 'Tatil modu ' + U.fmtShort(bugun) + ' – ' + U.fmtShort(bit) + ': seri korunuyor, HKM soru sormuyor'
        : r.why, { life:5000 });
      if(r.ok && ESP.Hedefler && ESP.Hedefler.ag) ESP.Hedefler.ag.planla();
      ESP.App.render();
    },
    async 'seri-tatil-bitir'(){
      const r = await ESP.Seri.tatiliBitir();
      ESP.UI.toast(r.ok ? 'Tatil bitti; hoş geldin' : r.why);
      if(r.ok && ESP.Hedefler && ESP.Hedefler.ag) ESP.Hedefler.ag.planla();
      ESP.App.render();
    },
    /* Elle gonderim: kullanicinin ACIKCA istedigi an. Kapaliyken
       zorlanmaz — kapali bir seyi «bir kerelik» calistirmak, kapali
       olmasini anlamsiz kilardi. */
    async 'hkm-gonder'(){
      ESP.UI.toast('HKM\u2019ye gönderiliyor…');
      const r = await ESP.Beacon.send({ reason:'manual' });
      ESP.UI.toast(r.ok ? 'HKM\u2019ye gönderildi.'
        : ('Gönderilemedi — ' + (r.note || r.reason || 'sebep bilinmiyor')));
      ESP.App.render();
    },

    async 'day-tab'(el){ K.bolumeGit(el.dataset.tab); },

    async 'hedef-durum'(el){
      const r = await ESP.Hedefler.durumDegistir(el.dataset.id, el.dataset.durum);
      ESP.UI.toast(r.ok ? 'Hedef güncellendi' + (r.not ? '. ' + r.not : '') : r.why);
      ESP.App.render();
    },
    async 'hedef-plan-onizle'(el){ S.ui.planOnizle = el.dataset.id; ESP.App.render(); },
    async 'hedef-plan-kapat'(){ S.ui.planOnizle = null; ESP.App.render(); },
    async 'hedef-plan-uygula'(el){
      const r = await ESP.HedefPlan.uygulaHedef(el.dataset.id);
      S.ui.planOnizle = null;
      if(r.ok) ESP.UI.onayMuhru();
      ESP.UI.toast(r.ok ? 'Plan uygulandı. Geri almak istersen «Planı geri al».' : r.why);
      ESP.App.render();
    },
    async 'hedef-uyarla-ac'(el){ S.ui.uyarla = el.dataset.id; ESP.App.render(); },
    async 'hedef-uyarla-kapat'(){ S.ui.uyarla = null; ESP.App.render(); },
    async 'hedef-uyarla-sec'(el){
      const H = window.LIFEOS.Hedef;
      const h = ESP.Hedefler.liste().find(x => x.id === el.dataset.id);
      if(!h) return;
      const paket = ESP.Hedefler.PAKET_BY_ID[h.paket];
      const bugun = U.todayISO();
      const u = H.uyarla(h, paket, {}, bugun);
      const x = u.senaryolar[Number(el.dataset.i)];
      if(!x){ ESP.UI.toast('Bu seçenek artık geçerli değil; yeniden hesapla.'); return; }
      const g = await ESP.HedefPlan.geriAlHedef(h.id);
      if(!g.ok && ESP.HedefPlan.aktif(h.id)){ ESP.UI.toast(g.why || 'Eski plan geri alınamadı; hedef değişmedi.'); return; }
      await ESP.Hedefler.kaydet(H.uyarlamaUygula(u.hedef, x, paket, {}, bugun));
      S.ui.uyarla = null;
      S.ui.planOnizle = h.id;
      ESP.UI.toast('Hedef yeni tarihle güncellendi; yeni planı önizleyip onayla.');
      ESP.App.render();
    },
    async 'hedef-plan-geri'(el){
      const r = await ESP.HedefPlan.geriAlHedef(el.dataset.id);
      ESP.UI.toast(r.ok ? 'Plan geri alındı; odak ve taban plandan önceki haline döndü.'
        : (r.why || 'Geri alınamadı'));
      ESP.App.render();
    },

    async 'signal-answer'(el){
      const inp = document.getElementById('sig-answer');
      const r = await ESP.Signals.answer(el.dataset.id, inp ? inp.value : '');
      if(!r.ok){ ESP.UI.toast(r.error); return; }
      ESP.UI.toast('Kaydedildi. Sonucu bir sonraki pencere gösterecek.');
      ESP.App.render();
    },

    async 'signal-dismiss'(el){
      await ESP.Signals.dismiss(el.dataset.id);
      ESP.UI.toast('Soru kapatıldı.');
      ESP.App.render();
    },

    async 'pick-disc'(el){ S.ui.sessionDisc = el.dataset.disc; ESP.App.render(); },

    async 'timer-start'(el){
      const res = await ESP.Timer.start(el.dataset.disc || S.ui.sessionDisc || 'lang');
      if(!res.ok){ ESP.UI.toast(res.error); return; }
      if(res.handedOver){
        /* Devreden sayaç KAYBOLMAZ: ne kadar olduğu söylenir, kullanıcı
           isterse elle girer. Sessizce silmek, ölçülmüş bir süreyi yok
           saymak olurdu. */
        const o = ESP.DISCIPLINE_BY_ID[res.handedOver.disc] || {};
        ESP.UI.toast((o.label || res.handedOver.disc) + ' sayacı kapandı — '
          + res.handedOver.minutes + ' dk ölçülmüştü');
      }
      ESP.App.render();
    },

    async 'timer-pause'(){ await ESP.Timer.pause(); ESP.App.render(); },
    async 'timer-resume'(){ await ESP.Timer.resume(); ESP.App.render(); },

    async 'timer-stop'(){
      const res = await ESP.Timer.stop();
      if(res.suspicious){
        ESP.UI.confirmSheet(res.minutes + ' dakika kaydedilsin mi?',
          res.error, async () => {
            const zorla = await ESP.Timer.stop({ force:true });
            if(zorla.ok) ESP.UI.toast(zorla.minutes + ' dk kaydedildi');
            ESP.App.render();
          }, false, res.minutes + ' dakikayı kaydet');
        return;
      }
      if(!res.ok){ ESP.UI.toast(res.error); ESP.App.render(); return; }
      ESP.UI.toast(res.minutes + ' dk kaydedildi');
      ESP.App.render();
    },

    async 'timer-reset'(){
      const dk = ESP.Timer.minutes();
      ESP.UI.confirmSheet('Sayaç silinsin mi?',
        dk + ' dakika ölçülmüştü ve kaydedilmeden silinecek.',
        async () => { await ESP.Timer.reset(); ESP.App.render(); }, true, dk + ' dakikayı sil');
    },

    async 'add-session'(){
      const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
      const dakika = val('s-min');
      if(!dakika){ ESP.UI.toast('Süre girilmedi'); return; }
      await M.addSession(gun(), {
        disc:S.ui.sessionDisc || 'lang',
        minutes:dakika,
        count:val('s-count'),
        note:val('s-note'),
        ref:(S.ui.sessionDisc === 'reading' && val('s-book')) || null,
      });
      ESP.Memo.bitir();
      ESP.UI.toast('Oturum kaydedildi');
      ESP.App.render();
    },

    async 'del-session'(el){
      await M.deleteSession(gun(), el.dataset.id);
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'parse-quick'(){
      const el = document.getElementById('quick-text');
      const res = ESP.Parse.parseSession(el ? el.value : '');
      if(!res.rows.length && !res.unmatched.length){
        ESP.UI.toast('Bir şey anlaşılmadı');
        return;
      }
      S.ui.quickParsed = res;
      ESP.App.render();
    },

    async 'save-quick'(){
      const res = S.ui.quickParsed;
      if(!res) return;
      for(const r of res.rows){
        await M.addSession(gun(), { disc:r.disc, minutes:r.minutes, count:r.count, note:'' });
      }
      S.ui.quickParsed = null;
      ESP.Memo.bitir();
      ESP.UI.toast(res.rows.length + ' oturum kaydedildi');
      ESP.App.render();
    },

    async 'clear-quick'(){ S.ui.quickParsed = null; ESP.App.render(); },

    async 'pick-day'(el){ S.ui.dayDate = el.dataset.date; ESP.App.render(); },
    async 'today-back'(){ S.ui.dayDate = null; ESP.App.render(); },
  };
  ONAY_EYLEMLERI.forEach(a => { handle[a] = el => ESP.Screens.onaylar.handle[a](el); });

  const change = {};

  return {
    id:'today',
    title:'Bugün',
    /* v5: üst satır tarih ve seri; büyük başlık günün cümlesi. Sıradaki
       işin adı kahraman kartında durur, başlıkta tekrar edilmez. */
    ust(){
      const s = M.streak();
      return U.esc(U.fmtDate(gun()) + (s ? ' · ' + s + ' günlük seri' : ''));
    },
    headlineOz:'004',
    headline(){
      const rows = M.sessionsOf(gun());
      const n = ESP.Planner.nextAction();
      if(!rows.length) return n.rank ? 'Bugün henüz oturum yok; sıradaki iş hazır.' : 'Bugün için bekleyen bir iş yok.';
      const toplam = rows.reduce((a, s) => a + (s.minutes || 0), 0);
      return rows.length + ' oturum, toplam ' + U.fmtMin(toplam) + '.'
        + (n.rank ? ' Sıradaki iş hazır.' : ' Bekleyen iş kalmadı.');
    },
    lede(){
      return M.sessionsOf(gun()).length ? ''
        : 'Girilmemiş gün sıfır sayılmaz; hiçbir ortalamaya katılmaz.';
    },
    stats(){
      const rows = M.sessionsOf(gun());
      const toplam = rows.reduce((a, s) => a + (s.minutes || 0), 0);
      const d = ESP.SRS.deckStatus();
      const ehs = ESP.Intellect.ehs(14);
      return [
        { value:rows.length ? U.fmtNum(toplam) : '—', unit:'dk', label:'bugün' },
        { value:String(d.due), label:'vadeli kart' },
        { value:String(M.streak()), unit:'gün', label:'seri' },
        { value:ehs.cert === 'missing' ? '—' : U.fmtNum(Math.round(ehs.value)), label:'hacim' },
      ];
    },
    subtitle(){ return ''; },
    actions(){ return ''; },
    render, handle, change,
    /* Bugün › Ayrıntı: aynı işleyiciler, ayrı bir çizim. */
    ayrinti:{
      id:'gun',
      title:'Günün ayrıntısı',
      subtitle(){ return 'Oturum girişi, hatırlatmalar, özet ve geçmiş'; },
      actions(){ return ''; },
      render:renderAyrinti, afterRender:afterRenderAyrinti, handle, change,
    },
  };
})();

ESP.Screens.gun = ESP.Screens.today.ayrinti;
