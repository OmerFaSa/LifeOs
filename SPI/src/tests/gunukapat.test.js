/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/gunukapat.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Günü kapat — KOLAY-PLANI Faz 1 (brand/ortak/gunukapat.js). Tek kaynak
   `brand/ortak/gunukapat.test.js`. Kanıtlanan sözler:
     1. Ölçüm satırı toplu yazılmaz; ölçüm tek satırdan, modülün ayrıştırıcısıyla.
     2. Dokunulmayan (önerisiz, zaten yazılmış, işareti kaldırılmış) yazılmaz.
     3. Hepsi ya da hiçbiri: anlaşılmayan parça varsa hiçbir şey yazılmaz;
        yarıda hata olursa yazılan geri alınır.
     4. Tek «Geri al» sondan başa.
     6. Kalıp: son 7 günün en az 4'ü; bugün sayılmaz. */

(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const K = () => window.LIFEOS.GUNUKAPAT;
  const G = () => window.LIFEOS.GIRIS;
  const GUN = '2026-03-10';

  /* Sahte modül: satırlar ve yazma günlüğü. */
  function kurulum(o){
    const gunluk = [];
    const satir = (id, ek) => Object.assign({ id, ad:id, tur:'beyan', oneri:{ metin:id + ' önerisi', kaynak:'dun' },
      yaz:async () => { gunluk.push('yaz:' + id); return { metin:id, geriAl:async () => { gunluk.push('geri:' + id); } }; } }, ek || {});
    const l = (o && o.satirlar) || [
      satir('su'),
      satir('kahvalti', { oneri:{ metin:'yumurta, çay', kaynak:'kalip' } }),
      satir('ilac', { yazildi:true }),
      satir('ogle', { oneri:null }),
      { id:'kilo', ad:'Kilo', tur:'olcum', ipucu:'son: 72 kg', yaz:async () => { gunluk.push('yaz:kilo'); } },
    ];
    const bildirilen = [];
    K()._sifirla();
    K().kur({ modul:'deneme', satirlar:() => l, bildir:(m, g) => bildirilen.push([m, typeof g]), yenile:() => {}, olcumOrnek:'kilo 72' });
    return { gunluk, bildirilen, satir };
  }
  function girisSahte(gunluk){
    G()._sifirla();
    G().kur({ modul:'deneme', ornekler:[], onizle:t => {
      const m = t.match(/^kilo (\d+)$/);
      return m ? { tur:'olcum', metin:'Kilo ' + m[1], kaydet:async () => { gunluk.push('olcum:' + m[1]);
        return { metin:'Kaydedildi.', geriAl:async () => { gunluk.push('olcum-geri:' + m[1]); } }; } } : null;
    } });
  }
  /* Testlerde boot koşmaz: kutu kurulmamış başlar, öyle bırakılır (kurulu
     kalırsa sonraki Bugün testleri fazladan düğme sayar). */
  function bitir(){
    K()._sifirla();
    G()._sifirla();
  }

  describe('Günü kapat — ortak çekirdek', () => {
    it('kalıp: son 7 günün en az 4\'ü; bugün sayılmaz; aynı gün bir kez', () => {
      const k = d => ({ gun:d, anahtar:'yulaf' });
      const gunler = ['2026-03-09', '2026-03-08', '2026-03-07', '2026-03-05'];
      expect(K().kalip(gunler.map(k), GUN)).toEqual(['yulaf']);
      expect(K().kalip(gunler.slice(0, 3).map(k).concat([k('2026-03-09'), k(GUN)]), GUN)).toEqual([]);
      expect(K().kalip(gunler.slice(0, 3).map(k).concat([k('2026-03-02')]), GUN)).toEqual([]);
    });

    it('çizim: beyan işaretli ve kaynaklı; ölçüm satırı toplu yazılmaz diye görünür; düğme sayıyı söyler', () => {
      kurulum();
      try{
        const h = K().cizim(GUN);
        expect(h).toContain('data-gk-sec="su"');
        expect(h).toContain('dünkü');
        expect(h).toContain('her zamanki');
        expect(h).toContain('toplu yazılmaz');
        expect(h.indexOf('data-gk-sec="kilo"') < 0).toBe(true);
        expect(h.indexOf('data-gk-sec="ilac"') < 0).toBe(true);
        expect(h).toContain('Hepsi doğru · kaydet (2)');
      }finally{ bitir(); }
    });

    it('yalnız önerili, yazılmamış, işaretli beyanları yazar; ölçüm satırını asla; tek geri al sondan başa', async () => {
      const { gunluk, bildirilen } = kurulum();
      const kap = document.createElement('div');
      try{
        kap.innerHTML = K().cizim(GUN);
        document.body.appendChild(kap);
        const c = kap.querySelector('[data-gk-sec="kahvalti"]');
        c.checked = false;
        c.dispatchEvent(new Event('change', { bubbles:true }));
        expect(K().yazilacaklar(GUN).map(s => s.id)).toEqual(['su']);
        const r = await K().kapat(GUN, {});
        expect(r.ok).toBe(true);
        expect(gunluk).toEqual(['yaz:su']);
        expect(bildirilen[0][1]).toBe('function');
        await r.geriAl();
        expect(gunluk).toEqual(['yaz:su', 'geri:su']);
      }finally{ kap.remove(); bitir(); }
    });

    it('ölçüm tek satırdan modülün ayrıştırıcısıyla yazılır; geri al hepsini sondan başa alır', async () => {
      const { gunluk } = kurulum();
      girisSahte(gunluk);
      try{
        const r = await K().kapat(GUN, { olcumMetni:'kilo 72' });
        expect(r.ok).toBe(true);
        expect(gunluk).toEqual(['olcum:72', 'yaz:su', 'yaz:kahvalti']);
        await r.geriAl();
        expect(gunluk.slice(3)).toEqual(['geri:kahvalti', 'geri:su', 'olcum-geri:72']);
      }finally{ bitir(); }
    });

    it('anlaşılmayan ölçüm satırı varken hiçbir şey yazılmaz', async () => {
      const { gunluk } = kurulum();
      girisSahte(gunluk);
      try{
        const r1 = await K().kapat(GUN, { olcumMetni:'boyum uzun' });
        expect(r1.ok).toBe(false);
        expect(gunluk).toEqual([]);
        const r2 = await K().kapat(GUN, { olcumMetni:'kilo 72, falan filan' });
        expect(r2.ok).toBe(false);
        expect(r2.neden).toContain('falan filan');
        expect(gunluk).toEqual([]);
      }finally{ bitir(); }
    });

    it('yazmamayı seçen satır («atlandi») sayılmaz', async () => {
      const gunluk = [];
      const yazan = { id:'su', ad:'Su', tur:'beyan', oneri:{ metin:'2 L', kaynak:'plan' },
        yaz:async () => { gunluk.push('yaz:su'); return { metin:'su', geriAl:async () => {} }; } };
      const atlayan = { id:'plan', ad:'Plan', tur:'beyan', oneri:{ metin:'30 dk', kaynak:'plan' },
        yaz:async () => ({ atlandi:true }) };
      kurulum({ satirlar:[yazan, atlayan] });
      try{
        const r = await K().kapat(GUN, {});
        expect(r.ok).toBe(true);
        expect(r.yazilan).toEqual(['Su']);
        expect(r.metin).toContain('1 kayıt');
      }finally{ bitir(); }
    });

    /* 2026-10-25 inceleme bulguları: modül ölçümü yazamadığını { ok:false }
       ile söylerse beyanlar yazılmaz; çift gönderim iki kez yazmaz; geri
       almalardan biri bozulsa da ötekiler koşar ve mesaj dürüsttür. */
    it('ölçüm { ok:false } dönerse beyanlar yazılmaz', async () => {
      const { gunluk } = kurulum();
      G()._sifirla();
      G().kur({ modul:'deneme', ornekler:[], onizle:t => /^kilo/.test(t)
        ? { tur:'olcum', metin:t, kaydet:async () => ({ ok:false, neden:'sınır aşıldı' }) } : null });
      try{
        const r = await K().kapat(GUN, { olcumMetni:'kilo 900' });
        expect(r.ok).toBe(false);
        expect(r.neden).toContain('sınır aşıldı');
        expect(r.neden).toContain('Hiçbir şey yazılmadı');
        expect(gunluk).toEqual([]);
      }finally{ bitir(); }
    });

    it('aynı gün için ikinci kapat birincisi bitmeden yazmaz', async () => {
      const { gunluk } = kurulum();
      try{
        const [a, b] = await Promise.all([K().kapat(GUN, {}), K().kapat(GUN, {})]);
        expect(a.ok).toBe(true);
        expect(b.ok).toBe(false);
        expect(gunluk).toEqual(['yaz:su', 'yaz:kahvalti']);
      }finally{ bitir(); }
    });

    it('geri almalardan biri bozulsa da ötekiler koşar; mesaj söyler', async () => {
      const gunluk = [];
      const satir = (id, bozuk) => ({ id, ad:id, tur:'beyan', oneri:{ metin:id, kaynak:'plan' },
        yaz:async () => ({ metin:id, geriAl:async () => { if(bozuk) throw new Error('x'); gunluk.push('geri:' + id); } }) });
      kurulum({ satirlar:[satir('a'), satir('b', true)] });
      try{
        const r = await K().kapat(GUN, {});
        await r.geriAl();
        expect(gunluk).toEqual(['geri:a']);
        expect(K().cizim(GUN)).toContain('Bir kısmı geri alınamadı');
      }finally{ bitir(); }
    });

    /* 2026-10-26 (Adım 0 denetimi, B): ölçüm satırı kendi boş sayı kutusuyla
       gelir; değer önceden doldurulmaz (son değer yalnız ipucu), boş kutu
       yazılmaz, değerler modülün metnine çevrilip aynı ayrıştırıcıdan geçer. */
    function olcumSatiri(){
      return [{ id:'kilo', ad:'Kilo', tur:'olcum', ipucu:'son 72', alanlar:[{ ad:'Kilo', birim:'kg' }],
        metin:v => 'kilo ' + v[0] }];
    }
    function girisOndalik(gunluk){
      G()._sifirla();
      G().kur({ modul:'deneme', ornekler:[], onizle:t => {
        const m = t.match(/^kilo (\d+(?:\.\d+)?)$/);
        return m ? { tur:'olcum', metin:'Kilo ' + m[1], kaydet:async () => { gunluk.push('olcum:' + m[1]);
          return { metin:'ok', geriAl:async () => {} }; } } : null;
      } });
    }

    it('ölçüm satırı boş sayı kutusuyla çizilir; değer yok, son değer ipucu', () => {
      kurulum({ satirlar:olcumSatiri() });
      try{
        const h = K().cizim(GUN);
        expect(h).toContain('data-gk-alan="kilo:0"');
        expect(h).toContain('inputmode="decimal"');
        expect(h).toContain('placeholder="son 72"');
        expect(h.indexOf(' value=') < 0).toBe(true);
      }finally{ bitir(); }
    });

    it('kutudaki değer modülün metnine çevrilir (virgüllü ondalık); boş kutu yazılmaz; sayı değilse hiçbir şey yazılmaz', async () => {
      const gunluk = [];
      kurulum({ satirlar:olcumSatiri() });
      girisOndalik(gunluk);
      try{
        const r = await K().kapat(GUN, { alanlar:{ 'kilo:0':'72,5' } });
        expect(r.ok).toBe(true);
        expect(gunluk).toEqual(['olcum:72.5']);
        const bos = await K().kapat(GUN, { alanlar:{ 'kilo:0':'  ' } });
        expect(bos.ok).toBe(false);
        expect(gunluk.length).toBe(1);
        const kotu = await K().kapat(GUN, { alanlar:{ 'kilo:0':'yetmiş' } });
        expect(kotu.ok).toBe(false);
        expect(kotu.neden).toContain('Kilo');
        expect(gunluk.length).toBe(1);
      }finally{ bitir(); }
    });

    it('önerisi olmayan satırlar tek satırda toplanır', () => {
      const bos = id => ({ id, ad:id, tur:'beyan', oneri:null });
      kurulum({ satirlar:[bos('Ara öğün'), bos('İkindi')] });
      try{
        const h = K().cizim(GUN);
        expect((h.match(/is-bos/g) || []).length).toBe(1);
        expect(h).toContain('Ara öğün, İkindi');
      }finally{ bitir(); }
    });

    it('yarıda hata olursa yazılan geri alınır; yazılacak bir şey yoksa yazmaz', async () => {
      const gunluk = [];
      const iyi = { id:'su', ad:'Su', tur:'beyan', oneri:{ metin:'2 L', kaynak:'plan' },
        yaz:async () => { gunluk.push('yaz:su'); return { metin:'su', geriAl:async () => { gunluk.push('geri:su'); } }; } };
      const kotu = { id:'ogle', ad:'Öğle', tur:'beyan', oneri:{ metin:'çorba', kaynak:'kalip' },
        yaz:async () => { throw new Error('depo kapalı'); } };
      kurulum({ satirlar:[iyi, kotu] });
      try{
        const r = await K().kapat(GUN, {});
        expect(r.ok).toBe(false);
        expect(r.neden).toContain('geri alındı');
        expect(gunluk).toEqual(['yaz:su', 'geri:su']);
        kurulum({ satirlar:[{ id:'kilo', ad:'Kilo', tur:'olcum' }] });
        const bos = await K().kapat(GUN, {});
        expect(bos.ok).toBe(false);
      }finally{ bitir(); }
    });
  });
})();
