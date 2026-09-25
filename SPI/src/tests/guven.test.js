/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/guven.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Güven — 173 yedek durumu, 177 kalıcı silme kapısı, 179 kayıt geçmişi.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/guven.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kural (ekip/EKIP-PLANI.md §4.1): P1 kartının kabul ölçütü testin İLK
   satırıdır ve test adında özelliğin numarası geçer (`oz-173 …`). */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const V = () => window.LIFEOS.GUVEN;

  function sahne(markup){
    const k = document.createElement('div');
    k.style.cssText = 'position:absolute;left:-9999px;top:0;width:400px';
    k.innerHTML = markup;
    document.body.appendChild(k);
    return k;
  }
  const SIMDI = new Date(2026, 8, 24, 14, 10);

describe('173 · Yedek durumu', () => {

  it('oz-173 Son yedeğin tarihi ve boyutu gösterilir; yedek yoksa «henüz yedek yok» yazar, tarih uydurmaz.', () => {
    const damga = new Date(2026, 8, 21, 9, 30).toISOString();
    const k = sahne(V().yedekHtml({ damga:damga, boyut:1258291, bugun:'2026-09-24', kayit:40, simdi:SIMDI })
      + V().yedekHtml({ damga:null, bugun:'2026-09-24', kayit:40 }));
    try{
      const [a, b] = k.querySelectorAll('[data-oz="173"]');
      expect(a.querySelector('.yedek__bas').textContent).toBe('Son yedek 3 gün önce');
      expect(a.querySelector('.yedek__alt').textContent).toBe('21 Eylül 09:30 · 1,2 MB');
      expect(b.querySelector('.yedek__bas').textContent).toBe('Henüz yedek yok');
      expect(b.querySelector('.yedek__alt')).toBeNull();
      expect(/\d{1,2} (Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)/.test(b.textContent)).toBeFalsy();
      /* Tek düğmeyle yedek. */
      expect(b.querySelector('[data-act="yedek-al"]').textContent).toBe('Şimdi yedek al');
    }finally{ k.remove(); }
  });

  it('oz-173 hatırlatma kuralı yedek.js’tendir: eşik ve asgari kayıt orada', () => {
    const eski = new Date(2026, 8, 10, 9, 0).toISOString();
    expect(V().yedekDurumu({ damga:eski, bugun:'2026-09-24', kayit:40 }).gerekli).toBeTruthy();
    expect(V().yedekDurumu({ damga:eski, bugun:'2026-09-24', kayit:2 }).gerekli).toBeFalsy();
    expect(V().yedekDurumu({ damga:null, bugun:'2026-09-24', kayit:40 }).gerekli).toBeTruthy();
    /* Bozuk damga «0 gün önce» sayılmaz: yedek yok. */
    expect(V().yedekDurumu({ damga:'2026-02-31', bugun:'2026-09-24' }).var).toBeFalsy();
  });

  it('oz-173 boyut bilinmiyorsa «0 KB» değil «boyut kayıtlı değil»', () => {
    expect(V().boyutMetni(null)).toBeNull();
    expect(V().boyutMetni(512)).toBe('512 B');
    expect(V().boyutMetni(2048)).toBe('2 KB');
    const h = V().yedekHtml({ damga:'2026-09-24', bugun:'2026-09-24', simdi:SIMDI });
    expect(h).toContain('boyut kayıtlı değil');
    expect(h).toContain('Son yedek bugün');
  });

  it('oz-173 iki haftalık iz yalnız verilirse çizilir; tutulmayan geçmiş boş gün gibi gösterilmez', () => {
    const iz = ['2026-09-12', '2026-09-19', '2026-09-24'];
    const k = sahne(V().yedekHtml({ damga:'2026-09-24', iz:iz, bugun:'2026-09-24', simdi:SIMDI }));
    try{
      const kutu = k.querySelectorAll('.yedek__iz .doluluk__k');
      expect(kutu).toHaveLength(14);
      expect(k.querySelectorAll('.yedek__iz .doluluk__k--dolu')).toHaveLength(3);
      expect(k.querySelector('.yedek__iz').getAttribute('aria-label')).toBe('Son 14 günde 3 yedek günü');
    }finally{ k.remove(); }
    expect(V().yedekHtml({ damga:'2026-09-24', bugun:'2026-09-24' }).indexOf('yedek__iz') < 0).toBeTruthy();
  });
});

describe('177 · Kalıcı silme kapısı', () => {

  it('oz-177 Kalıcı silme büyük aksiyondur: önce dönüş noktası alınır, sonra yazılı onay istenir, düğme silinecek sayıyı yazar.', () => {
    expect(V().SILME_SEVIYE).toBe('buyuk');
    /* 1: dönüş noktası yok → giriş ve düğme kapalı. */
    let r = V().silmeDurumu({ sayi:1243, donusNoktasi:null, yazilan:'1243' });
    expect(r.adim).toBe('donus');
    expect(r.dugmeAcik).toBeFalsy();
    /* 2: dönüş noktası var, yazılı onay yok → düğme kapalı. */
    r = V().silmeDurumu({ sayi:1243, donusNoktasi:{ zaman:'2026-09-24T11:00:00Z' }, yazilan:'' });
    expect(r.adim).toBe('onay');
    expect(r.dugmeAcik).toBeFalsy();
    /* 3: ikisi de → düğme açık ve sayıyı yazar. */
    r = V().silmeDurumu({ sayi:1243, donusNoktasi:{ zaman:'2026-09-24T11:00:00Z' }, yazilan:'1.243' });
    expect(r.adim).toBe('hazir');
    expect(r.dugmeAcik).toBeTruthy();
    const k = sahne(V().silmeHtml({ nesne:'kaydı', sayi:1243, donusNoktasi:{ zaman:'2026-09-24T11:00:00Z' }, yazilan:'1243' })
      + V().silmeHtml({ nesne:'kaydı', sayi:1243, donusNoktasi:null }));
    try{
      const [acik, kapali] = k.querySelectorAll('[data-oz="177"]');
      const b = acik.querySelector('[data-act="silme-onay"]');
      expect(b.textContent).toBe('1.243 kaydı kalıcı sil');
      expect(b.disabled).toBeFalsy();
      expect(b.classList.contains('btn--danger')).toBeTruthy();
      expect(kapali.querySelector('[data-act="silme-onay"]').disabled).toBeTruthy();
      expect(kapali.querySelector('[data-act="silme-donus"]')).toBeTruthy();
      expect(kapali.querySelector('.silme__giris').disabled).toBeTruthy();
      expect(acik.getAttribute('data-seviye')).toBe('buyuk');
    }finally{ k.remove(); }
  });

  it('oz-177 yazılı onay silinecek SAYIDIR; yanlış sayı ya da «evet» geçmez', () => {
    expect(V().yazilanGecerliMi('1243', 1243)).toBeTruthy();
    expect(V().yazilanGecerliMi(' 1.243 ', 1243)).toBeTruthy();
    expect(V().yazilanGecerliMi('1242', 1243)).toBeFalsy();
    expect(V().yazilanGecerliMi('evet', 1243)).toBeFalsy();
    expect(V().yazilanGecerliMi('', 1243)).toBeFalsy();
    expect(V().yazilanGecerliMi('0', null)).toBeFalsy();
  });

  it('oz-177 silinecek sayı bilinmiyorsa kapı açılmaz', () => {
    const r = V().silmeDurumu({ sayi:null, donusNoktasi:{}, yazilan:'' });
    expect(r.adim).toBe('yok');
    expect(r.dugmeAcik).toBeFalsy();
    expect(V().silmeDurumu({ sayi:0, donusNoktasi:{}, yazilan:'0' }).dugmeAcik).toBeFalsy();
  });

  it('oz-177 onay girişinin görünür etiketi var', () => {
    const k = sahne(V().silmeHtml({ id:'x', nesne:'kaydı', sayi:5, donusNoktasi:{} }));
    try{
      const g = k.querySelector('input');
      expect(k.querySelector('label[for="' + g.id + '"]').textContent).toBe('Onaylamak için silinecek sayıyı yaz: 5');
    }finally{ k.remove(); }
  });
});

describe('179 · Kayıt geçmişi', () => {

  const OLAYLAR = [
    { zaman:'2026-09-20T08:00:00Z', kaynak:'kullanici', alan:'Süre', eski:60, yeni:70 },
    { zaman:'2026-09-22T19:00:00Z', kaynak:'merkez', alan:'Süre', eski:70, yeni:45, onay:{ tur:'onay' } },
    { zaman:'2026-09-23T06:00:00Z', kaynak:'plan', alan:'Konu', eski:'Paragraf', yeni:'Problem' },
    { zaman:'2026-09-23T07:00:00Z', kaynak:'ice-aktarma', alan:'Not', eski:null, yeni:'Eski defterden' },
    { zaman:'2026-09-24T09:00:00Z', kaynak:'ofis', alan:'Saat', eski:'20:30', yeni:'21:00', onay:{ tur:'ayar' } },
  ];

  it('oz-179 Her kaydın geçmişi kaynağı ayırır: sen, Merkez önerisi (senin onayınla), plan motoru, içe aktarma.', () => {
    const k = sahne(V().gecmisHtml(OLAYLAR, { simdi:SIMDI }));
    try{
      const s = k.querySelectorAll('[data-oz="179"] .gecmis__s');
      expect(s).toHaveLength(5);
      const kaynak = Array.prototype.map.call(s, el => el.querySelector('.gecmis__kaynak').textContent);
      /* En yeni önce. */
      expect(kaynak).toEqual(['Ofis önerisi (senin ayarınla, sormadan)', 'İçe aktarma', 'Plan motoru',
        'Merkez önerisi (senin onayınla)', 'Sen']);
      expect(s[4].querySelector('.gecmis__degisim').textContent).toBe('Süre 60 → 70');
      expect(s[1].querySelector('.gecmis__degisim').textContent).toBe('Not — → Eski defterden');
    }finally{ k.remove(); }
  });

  it('oz-179 onay kaydı olmayan öneri değişikliği GİZLENMEZ, uyarıyla yazılır', () => {
    const r = V().kaynakMetni({ kaynak:'merkez' });
    expect(r.metin).toBe('Merkez önerisi · onay kaydı yok');
    expect(r.uyari).toBe('onaysiz');
    const h = V().gecmisHtml([{ zaman:'2026-09-24T09:00:00Z', kaynak:'merkez', alan:'Süre', eski:1, yeni:2 }]);
    expect(h).toContain('data-uyari="onaysiz"');
  });

  it('oz-179 bilinmeyen kaynak uydurulmaz; geçmiş yoksa bunu söyler', () => {
    expect(V().kaynakMetni({ kaynak:'hkm-dogrudan' }).metin).toBe('kaynağı bilinmiyor');
    expect(V().gecmisHtml([])).toContain('Bu kaydın değişiklik geçmişi yok.');
    expect(Object.isFrozen(V().KAYNAKLAR)).toBeTruthy();
  });
});

})();

/* Kapı ekranda (177) ve yedek izi (173): modülün penceresinde kurulur. */
(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const V = () => window.LIFEOS.GUVEN;
  describe('Kalıcı silme kapısı ekranda (177) · yedek izi (173)', () => {
    it('oz-177 dönüş noktası alınmadan ve sayı yazılmadan silinmez; sayı doğruysa bir kez silinir', async () => {
      const kap = document.createElement('div');
      document.body.appendChild(kap);
      const iz = { yedek:0, sil:0 };
      try{
        V().kapiAc({ baslik:'Sil', nesne:'kaydı', sayi:12, sheet:o => { kap.innerHTML = o.body; },
          yedekAl:async () => { iz.yedek++; }, sil:async () => { iz.sil++; } });
        const onay = () => kap.querySelector('[data-act="silme-onay"]');
        expect(onay().disabled).toBe(true);
        onay().removeAttribute('disabled');
        onay().click();
        await new Promise(r => setTimeout(r, 0));
        expect(iz.sil).toBe(0);
        kap.querySelector('[data-act="silme-donus"]').click();
        await new Promise(r => setTimeout(r, 0));
        expect(iz.yedek).toBe(1);
        const g = kap.querySelector('[data-act="silme-yaz"]');
        g.value = '11'; g.dispatchEvent(new Event('input', { bubbles:true }));
        expect(onay().disabled).toBe(true);
        g.value = '12'; g.dispatchEvent(new Event('input', { bubbles:true }));
        expect(onay().disabled).toBe(false);
        onay().click();
        await new Promise(r => setTimeout(r, 0));
        expect(iz.sil).toBe(1);
      }finally{ kap.remove(); }
    });

    it('oz-173 yedek izi günü bir kez tutar, sıralı ve en çok 60 gün', () => {
      expect(V().izEkle(['2026-09-20'], '2026-09-20').length).toBe(1);
      expect(V().izEkle(['2026-09-22', '2026-09-20'], '2026-09-21').join(',')).toBe('2026-09-20,2026-09-21,2026-09-22');
      const uzun = Array.from({ length:70 }, (_, i) => '2026-07-' + String(i % 31 + 1).padStart(2, '0') + '-' + i);
      expect(V().izEkle(uzun, null).length).toBe(60);
      expect(V().izEkle(null, '2026-09-24').join(',')).toBe('2026-09-24');
    });
  });
})();
