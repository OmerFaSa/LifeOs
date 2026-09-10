/* Model — kayıt, okuma, kırmızı bayrak yaşam döngüsü ve yedek. */

(function(){
  const { describe, it, expect, resetState, withToday, pushLab, pushVitals, realStore } = SP.Test;
  const U = SP.U;

  describe('Model — profil', () => {
    it('varsayılan profil boş ama geçerli', () => {
      resetState();
      const p = SP.Model.defaultProfile();
      expect(p.sex).toBe('male');
      expect(p.goal).toBe('health');
      expect(p.weightKg).toBeNull();
    });

    it('yaş doğum yılından hesaplanır', () => {
      resetState();
      SP.S.profile.birthYear = new Date().getFullYear() - 25;
      expect(SP.Model.ageOf()).toBe(25);
    });

    it('doğum yılı yoksa yaş bilinmez', () => {
      resetState();
      SP.S.profile.birthYear = null;
      expect(SP.Model.ageOf()).toBeNull();
    });

    it('profil kaydı depoya yazılır', async () => {
      resetState();
      await SP.Model.saveProfile({ name:'Deneme' });
      expect(SP.S.profile.name).toBe('Deneme');
      expect((await SP.Store.get('profile')).name).toBe('Deneme');
    });
  });

  describe('Model — tahlil', () => {
    it('yeni tahlil boş değer tablosuyla gelir', () => {
      resetState();
      const rec = SP.Model.newLab('2026-01-01');
      expect(rec.date).toBe('2026-01-01');
      expect(Object.keys(rec.values)).toHaveLength(0);
    });

    it('kayıt tarihe göre sıralı tutulur', async () => {
      resetState();
      await SP.Model.saveLab(SP.Test.makeLab('2026-05-01', { hgb:14 }));
      await SP.Model.saveLab(SP.Test.makeLab('2026-01-01', { hgb:13 }));
      expect(SP.S.labs[0].date).toBe('2026-01-01');
    });

    it('aynı id ile kaydetmek üstüne yazar', async () => {
      resetState();
      const rec = SP.Test.makeLab('2026-01-01', { hgb:14 });
      await SP.Model.saveLab(rec);
      rec.values.hgb = { v:15, cert:'measured' };
      await SP.Model.saveLab(rec);
      expect(SP.S.labs).toHaveLength(1);
      expect(SP.S.labs[0].values.hgb.v).toBe(15);
    });

    it('silme hem durumdan hem depodan kaldırır', async () => {
      resetState();
      const rec = SP.Test.makeLab('2026-01-01', { hgb:14 });
      await SP.Model.saveLab(rec);
      await SP.Model.deleteLab(rec.id);
      expect(SP.S.labs).toHaveLength(0);
      expect(await SP.Store.get('labs/' + rec.id)).toBeNull();
    });

    it('bütün belirteçlerin son değeri tek nesnede toplanır', () => {
      resetState();
      pushLab('2026-01-01', { hgb:13 });
      pushLab('2026-05-01', { hgb:15, ferritin:80 });
      const all = SP.Model.latestAll();
      expect(all.hgb).toBe(15);
      expect(all.ferritin).toBe(80);
    });
  });

  describe('Model — günlük ölçüm', () => {
    it('kayıt yoksa null döner, boş nesne değil', () => {
      resetState();
      expect(SP.Model.vitalsOf('2026-01-01')).toBeNull();
    });

    it('ensureVitals varsayılan kabuk üretir', () => {
      resetState();
      const v = SP.Model.ensureVitals('2026-01-01');
      expect(v.date).toBe('2026-01-01');
      expect(v.sleep).toBeNull();
    });

    it('kaydetmek yalnızca verilen alanları değiştirir', async () => {
      resetState();
      await SP.Model.saveVitals('2026-01-01', { sleep:8 });
      await SP.Model.saveVitals('2026-01-01', { rhr:55 });
      const v = SP.Model.vitalsOf('2026-01-01');
      expect(v.sleep).toBe(8);
      expect(v.rhr).toBe(55);
    });
  });

  describe('Model — öğün', () => {
    it('yeni öğün boş kalem listesiyle gelir', () => {
      resetState();
      const m = SP.Model.newMeal('ogle');
      expect(m.slot).toBe('ogle');
      expect(m.items).toHaveLength(0);
    });

    it('öğün eklemek günü büyütür', async () => {
      resetState();
      const m = SP.Model.newMeal('ogle');
      m.items = [{ foodId:'pilav', g:180, cert:'estimated' }];
      await SP.Model.addMeal('2026-01-01', m);
      expect(SP.Model.mealsOf('2026-01-01')).toHaveLength(1);
    });

    it('öğün silmek yalnızca o kaydı kaldırır', async () => {
      resetState();
      const a = SP.Model.newMeal('kahvalti');
      const b = SP.Model.newMeal('ogle');
      await SP.Model.addMeal('2026-01-01', a);
      await SP.Model.addMeal('2026-01-01', b);
      await SP.Model.deleteMeal('2026-01-01', a.id);
      const rows = SP.Model.mealsOf('2026-01-01');
      expect(rows).toHaveLength(1);
      expect(rows[0].slot).toBe('ogle');
    });

    it('kesinlik alanı eksikse tahmin sayılır', async () => {
      resetState();
      const m = SP.Model.newMeal('ogle');
      m.items = [{ foodId:'pilav', g:180 }];
      await SP.Model.addMeal('2026-01-01', m);
      expect(SP.Model.mealsOf('2026-01-01')[0].items[0].cert).toBe('estimated');
    });
  });

  describe('Model — antrenman ve ilerleme', () => {
    it('şablondan seans üretmek hareketleri doldurur', () => {
      resetState();
      const w = SP.Model.newWorkout('2026-01-01', 'tam-vucut-a');
      expect(w.items.length).toBe(4);
      expect(w.name).toBe('Tam vücut A');
    });

    it('şablonsuz seans serbesttir', () => {
      resetState();
      const w = SP.Model.newWorkout('2026-01-01', null);
      expect(w.items).toHaveLength(0);
      expect(w.name).toBe('Serbest antrenman');
    });

    it('basamak ilerletmek bir sonrakine geçer', async () => {
      resetState();
      const res = await SP.Model.advanceLevel('sinav');
      expect(res.ok).toBeTruthy();
      expect(SP.Model.currentLevel('sinav')).toBe('egik');
    });

    it('son basamakta ilerleme reddedilir', async () => {
      resetState();
      const ex = SP.EX_BY_ID.sinav;
      await SP.Model.setLevel('sinav', ex.levels[ex.levels.length - 1].id);
      const res = await SP.Model.advanceLevel('sinav');
      expect(res.ok).toBeFalsy();
    });

    it('bilinmeyen hareket ilerletilemez', async () => {
      resetState();
      expect((await SP.Model.advanceLevel('olmayan')).ok).toBeFalsy();
    });
  });

  describe('Model — sepet ve fiyat', () => {
    it('kalem eklenir ve güncellenir', async () => {
      resetState();
      await SP.Model.setBasketItem('pilav', 2);
      expect(SP.S.basket.items).toHaveLength(1);
      await SP.Model.setBasketItem('pilav', 3);
      expect(SP.S.basket.items[0].kg).toBe(3);
    });

    it('sıfır kilogram kalemi çıkarır', async () => {
      resetState();
      await SP.Model.setBasketItem('pilav', 2);
      await SP.Model.setBasketItem('pilav', 0);
      expect(SP.S.basket.items).toHaveLength(0);
    });

    it('fiyat kaydı kullanıcı kaynağıyla işaretlenir', async () => {
      resetState();
      await SP.Model.setPrice('pilav', 75);
      expect(SP.S.prices.pilav.source).toBe('user');
      expect(SP.S.prices.pilav.tl).toBe(75);
    });

    it('geçersiz fiyat kaydı kaldırır', async () => {
      resetState();
      await SP.Model.setPrice('pilav', 75);
      await SP.Model.setPrice('pilav', null);
      expect(SP.S.prices.pilav).toBeUndefined();
    });
  });

  describe('Model — kırmızı bayrak', () => {
    it('kritik değer bayrak açar', async () => {
      resetState();
      pushLab('2026-01-01', { ferritin:5 });
      await SP.Model.refreshFlags();
      const open = SP.Model.openFlags();
      expect(open.length > 0).toBeTruthy();
      expect(open[0].marker).toBe('ferritin');
    });

    it('örüntü bayrağı iki ölçümü birlikte okur', async () => {
      resetState();
      pushLab('2026-01-01', { hgb:10.5, ferritin:12 });
      await SP.Model.refreshFlags();
      expect(SP.Model.openFlags().some(f => f.id === 'anemi-tablosu')).toBeTruthy();
    });

    it('tek ölçüm örüntüyü tetiklemez', async () => {
      resetState();
      pushLab('2026-01-01', { hgb:10.5 });
      await SP.Model.refreshFlags();
      expect(SP.Model.openFlags().some(f => f.id === 'anemi-tablosu')).toBeFalsy();
    });

    it('değer düzelince bayrak kapanır ama silinmez', async () => {
      resetState();
      pushLab('2026-01-01', { ferritin:5 });
      await SP.Model.refreshFlags();
      expect(SP.Model.openFlags().length > 0).toBeTruthy();

      pushLab('2026-02-01', { ferritin:120 });
      await SP.Model.refreshFlags();
      expect(SP.Model.openFlags()).toHaveLength(0);
      expect(SP.S.flags.length > 0).toBeTruthy();
      expect(SP.S.flags[0].status).toBe('closed');
    });

    it('görüldü işaretlemek bayrağı kapatmaz', async () => {
      resetState();
      pushLab('2026-01-01', { ferritin:5 });
      await SP.Model.refreshFlags();
      const id = SP.Model.openFlags()[0].id;
      await SP.Model.ackFlag(id);
      expect(SP.Model.openFlags()[0].ack).toBeTruthy();
      expect(SP.Model.openFlags()).toHaveLength(1);
    });

    it('tansiyon örüntüsü vital ölçümden de tetiklenir', async () => {
      resetState();
      pushVitals('2026-01-01', { sbp:185, dbp:115 });
      await SP.Model.refreshFlags();
      expect(SP.Model.openFlags().some(f => f.id === 'tansiyon-krizi')).toBeTruthy();
    });
  });

  describe('Model — kararlar', () => {
    it('karar açık başlar', async () => {
      resetState();
      const d = await SP.Model.saveDecision({ title:'Test' });
      expect(d.status).toBe('open');
      expect(SP.Model.openDecisions()).toHaveLength(1);
    });

    it('kapatmak sonucu kaydeder', async () => {
      resetState();
      const d = await SP.Model.saveDecision({ title:'Test' });
      await SP.Model.closeDecision(d.id, 'Ferritin 80\'e çıktı');
      expect(SP.Model.openDecisions()).toHaveLength(0);
      expect(SP.S.decisions[0].outcome).toContain('80');
    });

    it('olmayan kararı kapatmak sessizce null döner', async () => {
      resetState();
      expect(await SP.Model.closeDecision('yok')).toBeNull();
    });
  });

  describe('Model — yedek ve ayak izi', () => {
    it('hiç yedek alınmadıysa yedek gerekir', () => {
      resetState();
      SP.S.meta = { schemaVersion:SP.SCHEMA_VERSION };
      expect(SP.Model.backupAgeDays()).toBeNull();
      expect(SP.Model.backupDue()).toBeTruthy();
    });

    it('yeni yedek gerekliliği kaldırır', async () => {
      resetState();
      await SP.Model.markBackup();
      expect(SP.Model.backupAgeDays()).toBe(0);
      expect(SP.Model.backupDue()).toBeFalsy();
    });

    it('ayak izi kayıt sayılarını verir', () => {
      resetState();
      pushLab('2026-01-01', { hgb:14 });
      pushVitals('2026-01-01', { sleep:8 });
      const f = SP.Model.dataFootprint();
      expect(f.labs).toBe(1);
      expect(f.vitalDays).toBe(1);
    });

    it('yedek biçimi tanınır', () => {
      const ok = realStore.readBackup({ __meta:{ schemaVersion:1 }, data:{ 'profile':{} } });
      expect(ok.ok).toBeTruthy();
    });

    it('daha yeni şemalı yedek reddedilir', () => {
      const res = realStore.readBackup({ __meta:{ schemaVersion:99 }, data:{} });
      expect(res.ok).toBeFalsy();
      expect(res.error).toContain('şema');
    });

    it('alakasız dosya reddedilir', () => {
      const res = realStore.readBackup({ rastgele:'içerik' });
      expect(res.ok).toBeFalsy();
    });
  });

  describe('Model — hane listesi', () => {
    it('profil eklenir', () => {
      resetState();
      localStorage.removeItem('spi.household');
      const res = SP.Model.addHouseholdMember('Ayşe', { sex:'female', birthYear:1994 });
      expect(res.ok).toBeTruthy();
      expect(SP.Model.householdList().some(x => x.name === 'Ayşe')).toBeTruthy();
    });

    it('aynı ad iki kez eklenmez', () => {
      resetState();
      localStorage.removeItem('spi.household');
      SP.Model.addHouseholdMember('Ayşe', {});
      expect(SP.Model.addHouseholdMember('Ayşe', {}).ok).toBeFalsy();
    });

    it('listeden çıkarmak veriyi silmez', () => {
      resetState();
      localStorage.removeItem('spi.household');
      const res = SP.Model.addHouseholdMember('Veli', {});
      SP.Model.removeHouseholdMember(res.id);
      expect(SP.Model.householdList().some(x => x.id === res.id)).toBeFalsy();
    });

    it('açık profil listeden çıkarılamaz', () => {
      resetState();
      const aktif = SP.Model.activeProfileId();
      expect(SP.Model.removeHouseholdMember(aktif).ok).toBeFalsy();
    });
  });
})();
