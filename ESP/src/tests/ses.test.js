/* SES KATMANI — telaffuz, ajan kimliği, sıra alma ve konuşma belleği.

   ------------------------------------------------------------------
   NEDEN BU DOSYA VAR

   `node tools/kapsam.js ESP --ayrinti` şunu yazdı:

       speak.js  %6   1/18      talk.js  %0  0/14      voice.js  %0  0/7

   SPİ'de `ses.test.js` vardı, ESP'de yoktu — ve iki `speak.js` aynı
   motordur: 311'e 319 satır, fark yalnızca ajan ses tablosu ve iki
   yorum. Yani ESP'nin ses motoru sınanmamış değildi; **SPİ'ninki
   sınanıyordu** ve ikisinin aynı kaldığını hiçbir şey denetlemiyordu.

   Bu paket SPİ'ninkinden uyarlandı. Uyarlarken ESP'nin KENDİ farkı
   ortaya çıktı ve testi de öyle yazıldı: SPİ'de en yavaş konuşan
   Patron'dur, ESP'de **Aristoteles** — «derin okuma acele kaldırmaz»
   dosyanın kendi cümlesidir.

   ------------------------------------------------------------------
   EN KRİTİK SÖZ

   Ses, ekrandaki metinden BAŞKA bir şey söylemez. Söyleseydi duyduğun
   cümle ile gördüğün cümle ayrışırdı ve hangisinin doğru olduğu
   belirsizleşirdi. Telaffuz hazırlığı anlamı değiştirmez, yalnızca
   duyulur kılar. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = ESP.Test;

describe('Ses — telaffuz hazırlığı', () => {

  it('anlamı değiştirmez, yalnızca duyulur kılar', () => {
    expect(ESP.Speak.konusulacak('Retansiyon %40 düştü')).toBe('Retansiyon yüzde 40 düştü');
    expect(ESP.Speak.konusulacak('A · B')).toBe('A, B');
    expect(ESP.Speak.konusulacak('Tez → İtiraz')).toBe('Tez, İtiraz');
  });

  it('işaretleme okunmaz', () => {
    /* «yıldız yıldız Retansiyon yıldız yıldız» diye okunmamalı. */
    expect(ESP.Speak.konusulacak('**Retansiyon** düşük')).toBe('Retansiyon düşük');
    expect(ESP.Speak.konusulacak('`kod` ve _eğik_')).toBe('kod ve eğik');
  });

  it('SAYIYA dokunmaz', () => {
    /* Bir ölçümün değeri seste de aynen geçer; yuvarlama yapılmaz. */
    expect(ESP.Speak.konusulacak('Tempo 92,5 vuruş')).toBe('Tempo 92,5 vuruş');
  });

  it('boş girdi boş döner', () => {
    expect(ESP.Speak.konusulacak('')).toBe('');
    expect(ESP.Speak.konusulacak(null)).toBe('');
  });
});

describe('Ses — uzun metin bölünmesi', () => {

  it('cümle sonundan böler', () => {
    expect(ESP.Speak.cumleler('Bir cümle. İkinci cümle! Üçüncü?'))
      .toEqual(['Bir cümle.', 'İkinci cümle!', 'Üçüncü?']);
  });

  it('sayının içindeki nokta cümle sonu SAYILMAZ', () => {
    /* «13.5 vuruş» ortadan bölünürse ölçüm iki parçaya ayrılıp yanlış
       okunur. Noktalamadan sonra boşluk aranır. */
    expect(ESP.Speak.cumleler('Tempo 13.5 vuruş ve devamı var.')).toHaveLength(1);
  });

  it('uzun metin parçalara iner ve hiçbir parça sınırı aşmaz', () => {
    const uzun = new Array(40).fill('Bu oldukça uzun bir cümle parçasıdır.').join(' ');
    const p = ESP.Speak.parcala(uzun);
    expect(p.length > 1).toBeTruthy();
    p.forEach(x => expect(x.length <= ESP.Speak.PARCA).toBeTruthy());
  });

  it('bölünen parçalar metnin TAMAMINI taşır', () => {
    /* Kelime kaybı olmamalı: ses eksik cümle okumaz. */
    const metin = 'Birinci cümle burada. İkinci cümle şurada. Üçüncü cümle orada.';
    expect(ESP.Speak.parcala(metin).join(' ').replace(/\s+/g, ' ')).toBe(metin);
  });

  it('boşluksuz tek uzun kelime bile bölünür', () => {
    expect(ESP.Speak.parcala('a'.repeat(500)).length > 1).toBeTruthy();
  });

  it('boş metin parça üretmez', () => {
    expect(ESP.Speak.parcala('')).toHaveLength(0);
    expect(ESP.Speak.parcala('   ')).toHaveLength(0);
  });

  it('emniyet süresi uzunlukla artar ve TAVANLANIR', () => {
    /* `onend` hiç gelmezse sıra alma döngüsü bu süreyle kurtulur.
       Tavansız olsaydı mikrofon dakikalarca kapalı kalırdı. */
    const kisa = ESP.Speak.emniyetMs('kısa', 1);
    const uzun = ESP.Speak.emniyetMs('x'.repeat(2000), 1);
    expect(uzun > kisa).toBeTruthy();
    expect(ESP.Speak.emniyetMs('x'.repeat(999999), 1) <= 45000).toBeTruthy();
    /* Hızlı okuma daha kısa süre ister. Ölçü GERÇEK parça boyuyla
       yapılır: tavana çarpan iki değer karşılaştırılamaz. */
    const boy = 'x'.repeat(ESP.Speak.PARCA);
    expect(ESP.Speak.emniyetMs(boy, 2) < ESP.Speak.emniyetMs(boy, 1)).toBeTruthy();
    /* Bir parçanın en kötü süresi yarım dakikayı geçmemeli. */
    expect(ESP.Speak.emniyetMs(boy, 1) < 30000).toBeTruthy();
  });
});

describe('Ses — ajan kimliği', () => {

  it('dokuz ajanın hepsinin bir konuşma biçimi var', () => {
    ESP.AGENTS.forEach(a => {
      const st = ESP.Speak.styleFor(a.id);
      expect(typeof st.rate).toBe('number');
      expect(typeof st.pitch).toBe('number');
    });
  });

  it('hiçbir iki ajan AYNI biçimde konuşmaz', () => {
    /* Toplantıyı dinlerken kimin konuştuğu duyulmalı. Tarayıcıda
       genelde bir ya da iki Türkçe ses bulunur; ayrım hız ve perdeyle
       yapılır. İki ajan aynı imzayı taşısaydı ayrım kaybolurdu. */
    const imza = ESP.AGENTS.map(a => {
      const s = ESP.Speak.styleFor(a.id);
      return s.rate + '/' + s.pitch;
    });
    expect(new Set(imza).size).toBe(ESP.AGENTS.length);
  });

  it('en yavaş konuşan ARİSTOTELES\'tir — derin okuma acele kaldırmaz', () => {
    /* SPİ'de bu satır Patron'u gösterir; ESP'de göstermez ve bu bir
       hata değil, alanın farkıdır. Kopyalanırken fark edilmeseydi
       test yanlış bir şeyi koruyor olurdu. */
    const a = ESP.Speak.styleFor('aristoteles').rate;
    ESP.AGENTS.filter(x => x.id !== 'aristoteles').forEach(x => {
      expect(ESP.Speak.styleFor(x.id).rate > a).toBeTruthy();
    });
  });

  it('en hızlı konuşan MAESTRO\'dur — müzik konuşuyor', () => {
    const m = ESP.Speak.styleFor('maestro').rate;
    ESP.AGENTS.filter(x => x.id !== 'maestro').forEach(x => {
      expect(ESP.Speak.styleFor(x.id).rate < m).toBeTruthy();
    });
  });

  it('BİLİNMEYEN ajan nötr biçim alır', () => {
    const s = ESP.Speak.styleFor('yok-boyle-biri');
    expect(s.rate).toBe(1);
    expect(s.pitch).toBe(1);
  });

  it('ses ataması KARARLIDIR — aynı ajan her seferinde aynı sesle konuşur', () => {
    /* Liste sırası tarayıcıya göre değişebildiği için ajanın kendi
       sırası kullanılır, ses listesinin sırası değil. Ses yoksa null
       döner ve çağıran tarayıcının varsayılanına düşer. */
    const bir = ESP.Speak.voiceFor('patron');
    const iki = ESP.Speak.voiceFor('patron');
    expect(bir === iki).toBe(true);
  });
});

describe('Sesli sohbet — döngü sözleşmesi', () => {

  it('ses tanıma YOKSA döngü hiç başlamaz', () => {
    /* Başlasaydı kullanıcı konuşur, hiçbir şey olmazdı. */
    const gercek = ESP.Voice.supported;
    try{
      ESP.Voice.supported = () => false;
      const r = ESP.Talk.start('patron', {});
      expect(r.ok).toBeFalsy();
      expect(r.reason).toBe('unsupported');
      expect(ESP.Talk.isActive()).toBeFalsy();
    }finally{ ESP.Voice.supported = gercek; }
  });

  it('kapalıyken durum KAPALIDIR ve ajan yoktur', () => {
    ESP.Talk.stop();
    const d = ESP.Talk.durum();
    expect(d.acik).toBeFalsy();
    expect(d.durum).toBe('kapalı');
    expect(d.agentId).toBeNull();
  });

  it('konuşmuyorken söz kesilemez', () => {
    ESP.Talk.stop();
    expect(ESP.Talk.kes()).toBeFalsy();
  });

  it('sessizlik eşiği bir saniyeden UZUNDUR', () => {
    /* Cümle ortasında düşünmek için bir saniye yetmez; kısa olsaydı
       sistem sözü sürekli keserdi. */
    expect(ESP.Talk.SESSIZLIK_MS > 1000).toBeTruthy();
  });

  it('sıra geçişi ölçülü bir bekleme ister', () => {
    expect(ESP.Talk.SIRA_GECIS_MS > 0).toBeTruthy();
    expect(ESP.Talk.SIRA_GECIS_MS < 5000).toBeTruthy();
  });

  it('durdurmak ÇİFT ÇAĞRIDA da çökmez', () => {
    ESP.Talk.stop();
    ESP.Talk.stop();
    expect(ESP.Talk.isActive()).toBeFalsy();
  });
});

describe('Dikte — mikrofon', () => {

  it('destek sorusu HER ZAMAN cevap verir', () => {
    /* Çağıran taraf bu cevaba göre düğme çizer; `undefined` dönseydi
       düğme ne çizilir ne çizilmezdi. */
    expect(typeof ESP.Voice.supported()).toBe('boolean');
  });

  it('başlamamış dikte etkin değildir ve hedefi yoktur', () => {
    ESP.Voice.stop();
    expect(ESP.Voice.isActive()).toBe(false);
    expect(ESP.Voice.activeTarget()).toBeNull();
  });

  it('durdurmak ÇİFT ÇAĞRIDA da çökmez', () => {
    ESP.Voice.stop();
    ESP.Voice.stop();
    expect(ESP.Voice.isActive()).toBe(false);
  });

  it('alan verilmezse dikte kurulmaz', () => {
    expect(ESP.Voice.dictateInto(null)).toBeNull();
  });

  it('her hata kodunun TÜRKÇE bir karşılığı var', () => {
    /* Kullanıcıya «not-allowed» diye bir şey gösterilmez. */
    ['unsupported', 'not-allowed', 'service-not-allowed', 'audio-capture',
     'network', 'start'].forEach(kod => {
      const m = ESP.Voice.message(kod);
      expect(m.length > 0).toBe(true);
      expect(m.indexOf(kod) >= 0).toBe(false);
    });
  });

  it('BİLİNMEYEN hata kodu da bir cümle üretir', () => {
    /* Tarayıcı bir gün yeni bir kod döndürürse ekran boş kalmaz. */
    const m = ESP.Voice.message('bilinmeyen-kod-2026');
    expect(m.length > 0).toBe(true);
    expect(m.indexOf('bilinmeyen-kod-2026') >= 0).toBe(false);
  });

  it('izin hatası ile servis hatası AYNI cümleyi söyler', () => {
    /* Kullanıcı için ikisi de «mikrofon izni verilmedi»dir; ayrım
       tarayıcının iç meselesidir. */
    expect(ESP.Voice.message('not-allowed'))
      .toBe(ESP.Voice.message('service-not-allowed'));
  });
});

describe('Sohbet belleği', () => {

  it('geçmiş modelin anlayacağı rollere çevrilir', () => {
    resetState();
    ESP.S.officeChats.socrates = [
      { role:'user', text:'tezim tutarlı mı?' },
      { role:'agent', text:'İtirazını yazmadın.' },
    ];
    const h = ESP.Office.historyFor('socrates');
    expect(h).toHaveLength(2);
    expect(h[0].role).toBe('user');
    expect(h[1].role).toBe('assistant');
  });

  it('pencere SINIRLIDIR — eski turlar düşer', () => {
    /* Sınırsız geçmiş her soruda kotayı katlayarak yakardı. */
    resetState();
    ESP.S.officeChats.socrates = [];
    for(let i = 0; i < 30; i++){
      ESP.S.officeChats.socrates.push({ role:i % 2 ? 'agent' : 'user', text:'m' + i });
    }
    const h = ESP.Office.historyFor('socrates');
    expect(h.length).toBe(ESP.Office.HAFIZA_TUR);
    /* Düşen BAŞTAN düşer: en yeni turlar kalır. */
    expect(h[h.length - 1].text).toBe('m29');
  });

  it('boş metinli tur geçmişe girmez', () => {
    resetState();
    ESP.S.officeChats.socrates = [
      { role:'user', text:'' },
      { role:'agent', text:'Bir şey var.' },
    ];
    expect(ESP.Office.historyFor('socrates')).toHaveLength(1);
  });

  it('sohbeti olmayan ajanın geçmişi boştur', () => {
    resetState();
    expect(ESP.Office.historyFor('maestro')).toHaveLength(0);
  });

  it('bir ajanın geçmişi DİĞERİNE karışmaz', () => {
    resetState();
    ESP.S.officeChats.socrates = [{ role:'user', text:'felsefe sorusu' }];
    ESP.S.officeChats.maestro = [{ role:'user', text:'müzik sorusu' }];
    expect(ESP.Office.historyFor('socrates')[0].text).toBe('felsefe sorusu');
    expect(ESP.Office.historyFor('maestro')[0].text).toBe('müzik sorusu');
  });

  it('soru geçmişe İKİ KEZ girmez', async () => {
    resetState();
    await ESP.Office.saveSettings({ provider:'openrouter', model:'' });  // model kapalı
    await withTodayAsync('2026-03-01', async () => {
      await ESP.Office.send('socrates', 'ilk soru');
      await ESP.Office.send('socrates', 'ikinci soru');
      const list = ESP.S.officeChats.socrates.filter(m => m.role === 'user');
      expect(list.map(m => m.text)).toEqual(['ilk soru', 'ikinci soru']);
    });
  });

  it('model KAPALIYKEN de cevap gelir — kural motoru konuşur', async () => {
    /* AGENTS.md §1.7: uygulama modelsiz çalışır. Sessiz kalsaydı
       kullanıcı modeli açmak zorunda kalırdı. */
    resetState();
    await ESP.Office.saveSettings({ provider:'openrouter', model:'' });
    const res = await withTodayAsync('2026-03-01',
      () => ESP.Office.send('socrates', 'bir soru'));
    expect(res.source).toBe('rules');
    expect(res.text.length > 0).toBe(true);
    /* Cevap geçmişe de girer: ekran onu yeniden çizebilmeli. */
    const son = ESP.S.officeChats.socrates;
    expect(son[son.length - 1].role).toBe('agent');
  });
});

})();
