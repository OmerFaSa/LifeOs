/* Sıfır sürtünmeli giriş — tahlil ve öğün metni ayrıştırıcıları.

   Ayrıştırıcının en tehlikeli hatası yanlış veriyi doğru sanmaktır.
   Bu yüzden testler yalnızca "doğru satırı buluyor mu" diye değil,
   "emin olamadığında susup bildiriyor mu" diye de bakar. */

(function(){
  const { describe, it, expect, resetState } = SP.Test;

  describe('Parse — sayı okuma', () => {
    it('virgüllü ondalık okunur', () => {
      expect(SP.Parse.num('12,5')).toBe(12.5);
    });

    it('noktalı ondalık okunur', () => {
      expect(SP.Parse.num('12.5')).toBe(12.5);
    });

    it('binlik nokta ve ondalık virgül birlikte çözülür', () => {
      expect(SP.Parse.num('1.200,5')).toBe(1200.5);
    });

    it('sayı olmayan metin null döner', () => {
      expect(SP.Parse.num('abc')).toBeNull();
      expect(SP.Parse.num('')).toBeNull();
      expect(SP.Parse.num(null)).toBeNull();
    });
  });

  describe('Parse — tahlil metni', () => {
    it('basit bir satırı eşler', () => {
      const r = SP.Parse.parseLab('Hemoglobin   14,2   g/dL');
      expect(r.rows).toHaveLength(1);
      expect(r.rows[0].markerId).toBe('hgb');
      expect(r.rows[0].value).toBe(14.2);
    });

    it('referans aralığı sonuçla karıştırılmaz', () => {
      const r = SP.Parse.parseLab('Ferritin   28   ng/mL   30 - 400');
      expect(r.rows[0].value).toBe(28);
      expect(r.rows[0].othersInLine).toEqual([30, 400]);
    });

    it('çok satırlı raporu ayıklar', () => {
      const text = [
        'TAM KAN SAYIMI',
        'Hemoglobin      14,2   g/dL    13.5 - 17.5',
        'Hematokrit      42,1   %       40 - 52',
        'BİYOKİMYA',
        'Açlık glukozu   92     mg/dL   70 - 99',
        'Ferritin        28     ng/mL   30 - 400',
      ].join('\n');
      const r = SP.Parse.parseLab(text);
      const ids = r.rows.map(x => x.markerId);
      expect(ids).toContain('hgb');
      expect(ids).toContain('hct');
      expect(ids).toContain('glucose');
      expect(ids).toContain('ferritin');
    });

    it('uzun ad kısa adı gizlemez', () => {
      const r = SP.Parse.parseLab('Serbest T4   1,2   ng/dL');
      expect(r.rows[0].markerId).toBe('ft4');
    });

    it('kelime sınırı korunur — HbA1c içindeki "hb" eşleşmez', () => {
      const r = SP.Parse.parseLab('HbA1c   5,4   %');
      expect(r.rows[0].markerId).toBe('hba1c');
    });

    it('eşleşmeyen ama sayı içeren satır bildirilir', () => {
      const r = SP.Parse.parseLab('Bilinmeyen Parametre   42   birim');
      expect(r.rows).toHaveLength(0);
      expect(r.unmatched.length).toBe(1);
    });

    it('sayısız başlık satırı sessizce geçilir', () => {
      const r = SP.Parse.parseLab('TAM KAN SAYIMI\nHemoglobin 14 g/dL');
      expect(r.unmatched).toHaveLength(0);
      expect(r.rows).toHaveLength(1);
    });

    it('aynı ölçüm iki kez geçerse ilki tutulur', () => {
      const r = SP.Parse.parseLab('Hemoglobin 14,2 g/dL\nHemoglobin 14,2 g/dL');
      expect(r.rows).toHaveLength(1);
      expect(r.duplicates).toBe(1);
    });

    it('boş metin hiçbir şey eşleştirmez ve nedenini söyler', () => {
      const r = SP.Parse.parseLab('');
      expect(r.rows).toHaveLength(0);
      expect(r.note).toContain('eşleşmedi');
    });
  });

  describe('Parse — IFCC birimi ve tanınmayan birim', () => {

    it('HbA1c mmol/mol\'den yüzdeye çevrilir', () => {
      /* EN PAHALI SESSIZ HATA BURADAYDI.

         `mmol/mol` birim listesinde yoktu. Regex eşleşmeyince birim
         NULL kalıyor, `convert()` ilk satırda çıkıyor ve uyuşmazlık
         rozeti de ÇIKMIYORDU — çünkü uyuşmazlık «bilinmeyen birim»
         değil «birim yok» sayılıyordu.

         Sonuç: IFCC birimiyle yapıştırılan «HbA1c 42 mmol/mol» %42
         olarak kaydediliyordu. Kırmızı eşik 6,5 olduğu için diyabet
         bayrağı yanıyor ve türetilmiş eAG
         (28,7 × 42 − 46,7) = 1158,7 mg/dL çıkıyordu.

         Türk laboratuvarlarının çoğu % verir; tek satır sessizce
         geçiyordu. IFCC → DCCT: % = mmol/mol × 0,09148 + 2,152. */
      const r = SP.Parse.parseLab('HbA1c   42   mmol/mol');
      expect(r.rows[0].markerId).toBe('hba1c');
      expect(r.rows[0].converted).toBeTruthy();
      expect(r.rows[0].value).toBeCloseTo(6.0, 1);
      expect(r.rows[0].value < 10).toBeTruthy();   // %42 ASLA olmamalı
    });

    it('yüzde olarak verilen HbA1c çevrilmez', () => {
      const r = SP.Parse.parseLab('HbA1c   5,4   %');
      expect(r.rows[0].converted).toBeFalsy();
      expect(r.rows[0].value).toBeCloseTo(5.4, 1);
    });

    it('TANINMAYAN birim sessizce birimsiz sayılmaz', () => {
      /* Genel tuzak: listede olmayan HER birim aynı yoldan geçerdi.
         Bölü işareti taşıyan bir belirteç bir birimdir; tanımadığımız
         bir birimi «birim yok» saymak, sayıyı kanonik birimdeymiş gibi
         kabul etmek demekti. Türkçe sözcükler bölü işareti taşımaz,
         bu yüzden yanlış alarm üretmez. */
      const r = SP.Parse.parseLab('Ferritin   28   qux/zud');
      expect(r.rows[0].mismatch).toBeTruthy();
      expect(r.rows[0].converted).toBeFalsy();
    });

    it('bilinen birim uyuşmazlığı hâlâ bildirilir', () => {
      const r = SP.Parse.parseLab('Hemoglobin   14,2   mmhg');
      expect(r.rows[0].mismatch).toBeTruthy();
    });
  });

  describe('Parse — birim çevirimi', () => {
    it('D vitamini nmol/L\'den ng/mL\'ye çevrilir', () => {
      const r = SP.Parse.parseLab('25-OH D   75   nmol/L');
      expect(r.rows[0].converted).toBeTruthy();
      expect(r.rows[0].value).toBeCloseTo(30, 0);
    });

    it('glukoz mmol/L\'den mg/dL\'ye çevrilir', () => {
      const r = SP.Parse.parseLab('Glukoz   5   mmol/L');
      expect(r.rows[0].value).toBeCloseTo(90, 0);
    });

    it('doğru birimde çevirim yapılmaz', () => {
      const r = SP.Parse.parseLab('Glukoz   92   mg/dL');
      expect(r.rows[0].converted).toBeFalsy();
    });

    it('bilinmeyen birim çevrilmez ve uyumsuzluk bildirilir', () => {
      const out = SP.Parse.convert('glucose', 92, 'garip/birim');
      expect(out.converted).toBeFalsy();
      expect(out.value).toBe(92);
    });
  });

  describe('Parse — öğün metni', () => {
    it('tek kalemi ev ölçüsüyle çözer', () => {
      const r = SP.Parse.parseMeal('1 tabak etli kuru fasulye');
      expect(r.items).toHaveLength(1);
      expect(r.items[0].foodId).toBe('kuru-fasulye-etli');
      expect(r.items[0].g).toBe(250);
      expect(r.items[0].cert).toBe('estimated');
    });

    it('virgül ve "ve" ile ayrılmış kalemleri böler', () => {
      const r = SP.Parse.parseMeal('1 tabak mercimek çorbası, 2 dilim ekmek ve 1 bardak ayran');
      expect(r.items.length).toBe(3);
      const ids = r.items.map(i => i.foodId);
      expect(ids).toContain('mercimek-corbasi');
      expect(ids).toContain('ayran');
    });

    it('miktar ev ölçüsüyle çarpılır', () => {
      const r = SP.Parse.parseMeal('2 dilim beyaz ekmek');
      expect(r.items[0].g).toBe(60);
    });

    it('gram doğrudan yazılınca "ölçüldü" olur', () => {
      const r = SP.Parse.parseMeal('150 g tavuk göğsü');
      expect(r.items[0].g).toBe(150);
      expect(r.items[0].cert).toBe('measured');
    });

    it('kilogram grama çevrilir', () => {
      const r = SP.Parse.parseMeal('0,2 kg dana eti');
      expect(r.items[0].g).toBe(200);
    });

    it('sayı sözcüğü okunur', () => {
      const r = SP.Parse.parseMeal('iki yumurta');
      expect(r.items[0].g).toBe(110);
    });

    it('yarım da okunur', () => {
      const r = SP.Parse.parseMeal('yarım tabak pilav');
      expect(r.items[0].g).toBe(90);
    });

    it('miktar yoksa bir varsayılır', () => {
      const r = SP.Parse.parseMeal('elma');
      expect(r.items[0].g).toBe(180);
    });

    it('ölçü yoksa ilk ev ölçüsü varsayılır ve işaretlenir', () => {
      const r = SP.Parse.parseMeal('3 muz');
      expect(r.items[0].assumed).toBeTruthy();
      expect(r.items[0].g).toBe(360);
    });

    it('eşleşmeyen parça atılmaz, bildirilir', () => {
      const r = SP.Parse.parseMeal('1 tabak pilav, uzaylı yemeği');
      expect(r.items).toHaveLength(1);
      expect(r.unmatched).toHaveLength(1);
    });

    it('hiçbir şey eşleşmezse nedeni söylenir', () => {
      const r = SP.Parse.parseMeal('zzz qqq');
      expect(r.items).toHaveLength(0);
      expect(r.note).toContain('eşleşmedi');
    });

    it('boş metin boş sonuç verir', () => {
      const r = SP.Parse.parseMeal('   ');
      expect(r.items).toHaveLength(0);
    });

    it('Türkçe karakter farkı eşleşmeyi bozmaz', () => {
      const a = SP.Parse.parseMeal('1 kase mercimek corbasi');
      const b = SP.Parse.parseMeal('1 kase mercimek çorbası');
      expect(a.items[0].foodId).toBe(b.items[0].foodId);
    });
  });

  describe('Parse — tahlil kaydına çevirme', () => {
    it('eşleşen satırlar oturuma yazılır', () => {
      resetState();
      const p = SP.Parse.parseLab('Hemoglobin 14,2 g/dL\nFerritin 28 ng/mL');
      const rec = SP.Parse.toLabRecord(p, '2026-01-10', { lab:'Test Lab' });
      expect(rec.date).toBe('2026-01-10');
      expect(rec.lab).toBe('Test Lab');
      expect(rec.values.hgb.v).toBe(14.2);
      expect(rec.values.hgb.cert).toBe('measured');
      expect(rec.source).toBe('paste');
    });

    it('işaretlenmemiş satır kayda girmez', () => {
      resetState();
      const p = SP.Parse.parseLab('Hemoglobin 14,2 g/dL\nFerritin 28 ng/mL');
      p.rows[1].skip = true;
      const rec = SP.Parse.toLabRecord(p, '2026-01-10');
      expect(rec.values.ferritin).toBeUndefined();
      expect(rec.values.hgb).toBeTruthy();
    });

    it('kayda yazılan değerler türetilmiş ölçümü tetikler', () => {
      resetState();
      const p = SP.Parse.parseLab('Açlık glukozu 90 mg/dL\nİnsülin 9 µIU/mL');
      const rec = SP.Model.applyDerived(SP.Parse.toLabRecord(p, '2026-01-10'));
      expect(rec.values.homa).toBeTruthy();
    });
  });

  /* 2026-10-25 veri girisi turu: yapistirma onizlemesinin dort acigi. */
  describe('Parse — yapıştırmada güvenli kayıt (2026-10-25)', () => {
    it('birimi uyuşmayan satır işaretsiz gelir; açıkça işaretlenmeden kayda girmez', () => {
      /* Hata: uyusmaz satir onizlemede isaretli geliyordu ve tanimadigimiz
         birimdeki sayi kanonik birimin altina sessizce yaziliyordu. */
      resetState();
      const p = SP.Parse.parseLab('Ferritin   28   qux/zud');
      expect(p.rows[0].skip).toBe(true);
      expect(SP.Parse.toLabRecord(p, '2026-01-10').values.ferritin).toBeUndefined();
      /* `skip` alani hic olmayan bir satir da (baska bir cagiran) gecmez. */
      delete p.rows[0].skip;
      expect(SP.Parse.toLabRecord(p, '2026-01-10').values.ferritin).toBeUndefined();
      /* Kullanici isaretlerse yazilir — ama gordugu birimle, kanonik birim diye degil. */
      p.rows[0].skip = false;
      const v = SP.Parse.toLabRecord(p, '2026-01-10').values.ferritin;
      expect(v.v).toBe(28);
      expect(v.unit).toBe('qux/zud');
      /* Cevrilmis deger kanonik birimdedir; kayitta kaynak birim yaziyordu. */
      const c = SP.Parse.toLabRecord(SP.Parse.parseLab('25-OH D 75 nmol/L'), '2026-01-11').values.vitd;
      expect(c.unit).toBe(SP.BIO_BY_ID.vitd.unit);
    });

    it('bilinen birimdeki satır işaretli gelir', () => {
      const p = SP.Parse.parseLab('Ferritin 28 ng/mL');
      expect(!!p.rows[0].skip).toBe(false);
    });

    it('aynı tarihe iki yapıştırma tek oturum olur', async () => {
      /* Hata: elle giris ayni gunun oturumuna ekliyordu, yapistirma her
         seferinde yeni oturum aciyordu: bir gunun testi iki kayda bolunuyordu. */
      resetState();
      await SP.Model.saveLab(SP.Parse.toLabRecord(SP.Parse.parseLab('Ferritin 28 ng/mL'), '2026-02-01'));
      await SP.Model.saveLab(SP.Parse.toLabRecord(SP.Parse.parseLab('Glukoz 91 mg/dL'), '2026-02-01'));
      const ayni = SP.S.labs.filter(l => l.date === '2026-02-01');
      expect(ayni.length).toBe(1);
      expect([ayni[0].values.ferritin.v, ayni[0].values.glucose.v]).toEqual([28, 91]);
    });

    it('tarih satırı yerelde okunur, eşleşmeyenlere düşmez; doğum tarihi alınmaz', () => {
      SP.Test.withToday('2026-10-25', () => {
        const p = SP.Parse.parseLab('Doğum tarihi 01.02.1990\nTarih 12.10.2026\nFerritin 28 ng/mL');
        expect(p.dateGuess).toBe('2026-10-12');
        expect(p.unmatched.length).toBe(0);
        const rec = SP.Parse.toLabRecord(p, p.dateGuess);
        expect(rec.date).toBe('2026-10-12');
        expect(SP.Parse.findDate('Numune alım: 2026-03-05 08:30')).toBe('2026-03-05');
        expect(SP.Parse.findDate('Tarih 31.02.2026')).toBeNull();
        expect(SP.Parse.findDate('Kontrol tarihi 12.01.2027')).toBeNull();
        expect(SP.Parse.findDate('Ferritin 28')).toBeNull();
      });
    });

    it('eşleşmeyen satır kullanıcının seçtiği ölçüme bağlanır; sayı yalnız o satırdan gelir', () => {
      resetState();
      const p = SP.Parse.parseLab('Ferr. 28');
      expect(p.rows.length).toBe(0);
      expect(p.unmatched.length).toBe(1);
      const r = SP.Parse.bindLine(p.unmatched[0].line, 'ferritin');
      expect(r.value).toBe(28);
      expect(r.bound).toBe(true);
      p.rows.push(r);
      const v = SP.Parse.toLabRecord(p, '2026-01-10').values.ferritin;
      expect(v.v).toBe(28);
      expect(v.cert).toBe('measured');
      /* Adin icindeki rakam sonuc sanilmaz; sayisiz satir baglanmaz. */
      expect(SP.Parse.bindLine('25-OH D3 vit 30 ng/mL', 'vitd').value).toBe(30);
      expect(SP.Parse.bindLine('Ferr. yok', 'ferritin')).toBeNull();
      expect(SP.Parse.bindLine('28 Ferr.', 'ferritin')).toBeNull();
      expect(SP.Parse.bindLine('Ferr. 28', 'yok-boyle')).toBeNull();
      /* Bagli satir da birim denetiminden gecer. */
      expect(SP.Parse.bindLine('Ferr. 28 qux/zud', 'ferritin').skip).toBe(true);
    });
  });

  /* 2026-10-25 bulgusu: ayni gune yapistirma var olan oturumu kopyalayip
     values[id]'yi ve fasting'i sessizce eziyordu. Kayitli ferritin 28
     onizlemede gorunmeden 35 oluyordu; «Aç» kaydedilmis bir oturuma «Tok»
     yapistirma onceki glukoz ve trigliseridi tok yapiyordu. */
  describe('Parse — aynı güne yapıştırma kayıtlı olanı ezmez (2026-10-25)', () => {
    function oturum(date, fasting, values){
      const rec = SP.Model.newLab(date);
      rec.fasting = fasting;
      Object.keys(values).forEach(id => {
        rec.values[id] = { v:values[id], cert:'measured', unit:SP.BIO_BY_ID[id].unit };
      });
      return rec;
    }

    it('açlık durumu çelişirse yapıştırma ayrı oturum olur; öncekinin açlığı ve glukozu değişmez', async () => {
      resetState();
      const D = '2026-02-01';
      const ilk = await SP.Model.saveLab(oturum(D, 'yes', { glucose:88, trig:120 }));
      const p = SP.Parse.parseLab('Glukoz 140 mg/dL\nTrigliserit 210 mg/dL');
      const plan = SP.Parse.pastePlan(p, D, 'no');
      expect(plan.hedef).toBe(null);
      expect(plan.ayri).toBe(true);
      await SP.Model.saveLab(SP.Parse.toLabRecord(p, D, { fasting:'no' }));
      const gun = SP.S.labs.filter(l => l.date === D);
      expect(gun.length).toBe(2);
      const once = gun.find(l => l.id === ilk.id);
      expect(once.fasting).toBe('yes');
      expect([once.values.glucose.v, once.values.trig.v]).toEqual([88, 120]);
      const yeni = gun.find(l => l.id !== ilk.id);
      expect(yeni.fasting).toBe('no');
      expect([yeni.values.glucose.v, yeni.values.trig.v]).toEqual([140, 210]);
    });

    it('uyumlu açlıkta aynı oturuma eklenir; «bilmiyorum» bilinen açlığı silmez', async () => {
      resetState();
      const D = '2026-02-02';
      await SP.Model.saveLab(oturum(D, 'yes', { glucose:88 }));
      await SP.Model.saveLab(SP.Parse.toLabRecord(SP.Parse.parseLab('Ferritin 28 ng/mL'), D, { fasting:'unknown' }));
      await SP.Model.saveLab(SP.Parse.toLabRecord(SP.Parse.parseLab('HbA1c 5,2 %'), D, { fasting:'yes' }));
      const gun = SP.S.labs.filter(l => l.date === D);
      expect(gun.length).toBe(1);
      expect(gun[0].fasting).toBe('yes');
      expect([gun[0].values.glucose.v, gun[0].values.ferritin.v, gun[0].values.hba1c.v]).toEqual([88, 28, 5.2]);
      /* Bilinmeyen acligi bilinen doldurur; onizleme bunu soyler. */
      const E = '2026-02-03';
      await SP.Model.saveLab(oturum(E, 'unknown', { ferritin:30 }));
      expect(SP.Parse.pastePlan(SP.Parse.parseLab('Glukoz 91 mg/dL'), E, 'yes').aclikYazilir).toBe(true);
      await SP.Model.saveLab(SP.Parse.toLabRecord(SP.Parse.parseLab('Glukoz 91 mg/dL'), E, { fasting:'yes' }));
      const e = SP.S.labs.filter(l => l.date === E);
      expect(e.length).toBe(1);
      expect(e[0].fasting).toBe('yes');
    });

    it('kayıtlı değeri olan satır işaretsiz gelir; işaretlenmeden kayıtlı değer kalır', async () => {
      resetState();
      const D = '2026-02-04';
      const ilk = await SP.Model.saveLab(oturum(D, 'unknown', { ferritin:28 }));
      const p = SP.Parse.parseLab('Ferritin 35 ng/mL\nGlukoz 91 mg/dL');
      const plan = SP.Parse.pastePlan(p, D, 'unknown');
      expect(plan.hedef.id).toBe(ilk.id);
      expect(plan.satirlar[0].durum).toBe('degisir');
      expect(plan.satirlar[0].once.v).toBe(28);
      expect(plan.satirlar[0].yaz).toBe(false);
      expect(plan.satirlar[1].durum).toBe('yeni');
      expect(plan.yazilacak).toBe(1);
      const rec = SP.Parse.toLabRecord(p, D);
      expect(rec.values.ferritin.v).toBe(28);
      expect(rec.values.glucose.v).toBe(91);
      /* Depodaki oturuma kaydetmeden dokunulmaz. */
      expect(SP.S.labs[0].values.glucose).toBeUndefined();
      /* Isaret yalniz o oturumun degerine baglidir. */
      p.rows[0].ustune = 'baska-oturum';
      expect(SP.Parse.toLabRecord(p, D).values.ferritin.v).toBe(28);
      p.rows[0].ustune = ilk.id;
      p.rows[0].skip = false;
      expect(SP.Parse.pastePlan(p, D, 'unknown').yazilacak).toBe(2);
      expect(SP.Parse.toLabRecord(p, D).values.ferritin.v).toBe(35);
    });

    it('aynı değer bir şey değiştirmez ve sayılmaz', async () => {
      resetState();
      const D = '2026-02-05';
      await SP.Model.saveLab(oturum(D, 'unknown', { ferritin:28 }));
      const plan = SP.Parse.pastePlan(SP.Parse.parseLab('Ferritin 28 ng/mL'), D, 'unknown');
      expect(plan.satirlar[0].durum).toBe('ayni');
      expect(plan.yazilacak).toBe(0);
    });
  });

  /* 2026-10-16 bulgusu: tek satırda birden çok şey yazınca yanlış değer
     ya da sessiz kayıp. «7 saat uyudum, 2 yumurta yedim» → «Uyku 2 saat»
     (sayıyı sonraki parçadan alıyordu); «2 yumurta 1 çay» → çay düşüyordu. */
  describe('Parse — tek satırda birden çok şey', () => {
    it('uyku sayısı virgülden sonraki parçadan alınmaz', () => {
      const p = SP.Quick.parse('uyku, 2 yumurta yedim');
      expect(!!p && p.kind === 'vital').toBe(false);
      const q = SP.Quick.parse('uyku 7 ve kilo 72');
      expect(q.kind).toBe('vital');
      expect(q.data.value).toBe(7);
    });
    it('«7 saat uyudum, 2 yumurta yedim» uykuyu 7 okur, 2 değil', () => {
      const p = SP.Quick.parse('7 saat uyudum, 2 yumurta yedim');
      expect(!(p && p.kind === 'vital' && p.data.value === 2)).toBe(true);
    });
    it('«2 yumurta 1 çay» iki gıda; «yumurta 2 adet» tek gıda, miktar 2', () => {
      const r = SP.Parse.parseMeal('2 yumurta 1 çay');
      expect(r.items.length).toBe(2);
      expect(r.items[0].qty).toBe(2);
      const t = SP.Parse.parseMeal('yumurta 2 adet');
      expect(t.items.length).toBe(1);
      expect(t.items[0].qty).toBe(2);
      expect(SP.Parse.parseMeal('0,2 kg tavuk').items.length).toBe(1);
    });
  });
})();
