/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/sinematik.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Tanıtım filmi: çizelge tutarlı mı, bir kez mi açılır, her an kapanır mı, hareketsiz kip slayt mı? */
(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;

describe('Tanıtım filmi', () => {
  const L = window.LIFEOS, S = L.SINEMATIK, P = L.PARCA;
  const cerezSil = ad => { document.cookie = ad + '=; Path=/; Max-Age=0; SameSite=Strict'; };

  it('anlatım satırları sırayla, üst üste binmeden ve film süresi içinde', () => {
    S.SATIR.forEach(([t, s], i) => {
      expect(t + s <= S.SURE).toBe(true);
      if(i) expect(t >= S.SATIR[i - 1][0] + S.SATIR[i - 1][1]).toBe(true);
      expect(P.yazi('ortak.sinematik.s' + i).length > 5).toBe(true);
    });
  });

  it('her an en az bir sahne görünür; geçişte iki sahne karışır, hareketsizken keser', () => {
    for(let t = 0; t < S.SURE; t += 0.1){
      const l = S._sahneler(t, false), z = S._sahneler(t, true);
      expect(l.length >= 1 && l.length <= 2).toBe(true);
      if(l.length === 2) expect(l[1].f >= 0 && l[1].f <= 1).toBe(true);
      z.forEach(x => expect(x.f === 0 || x.f === 1).toBe(true));
    }
    expect(S._sahneler(10.3, false).length).toBe(2);   // şafak › başlık geçişi
    expect(S.SAHNE.filter(s => s.etiket).map(s => s.etiket).join()).toBe('ays,ays,spi,spi,spi,esp,esp');
  });

  it('girişsiz modülde kendiliğinden açılmaz; hesap başına bir kez gerekir', () => {
    cerezSil('lifeos_sinematik'); cerezSil('lifeos_beta');
    const oturum = L.HESAP && document.cookie.indexOf(L.HESAP.CEREZ + '=') >= 0;
    if(!oturum) expect(S.gerekli()).toBe(false);
    document.cookie = 'lifeos_beta=1; Path=/; SameSite=Strict';
    if(!oturum) expect(S.gerekli()).toBe(true);
    document.cookie = 'lifeos_sinematik=' + encodeURIComponent(JSON.stringify(['beta'])) + '; Path=/; SameSite=Strict';
    if(!oturum) expect(S.gerekli()).toBe(false);
    cerezSil('lifeos_beta'); cerezSil('lifeos_sinematik');
  });

  it('açılır, ekran okuyucuya metin verir, Esc ile kapanır ve odağı geri verir', () => {
    const once = document.createElement('button');
    document.body.appendChild(once); once.focus();
    expect(S.ac()).toBe(true);
    const kok = document.querySelector('.sinematik');
    expect(kok.getAttribute('role')).toBe('dialog');
    expect(kok.getAttribute('aria-modal')).toBe('true');
    expect(kok.querySelector('canvas').getAttribute('aria-hidden')).toBe('true');
    expect(kok.querySelector('[aria-live]') != null).toBe(true);
    expect(document.activeElement.getAttribute('data-sinematik')).toBe('izle');
    for(let t = 0; t < S.SURE; t += 0.7) S._kare(t);    // her sahne hatasız çizilir
    document.dispatchEvent(new KeyboardEvent('keydown', { key:'Escape', bubbles:true }));
    expect(S.acikMi()).toBe(false);
    expect(document.querySelector('.sinematik')).toBe(null);
    expect(document.activeElement).toBe(once);
    once.remove();
  });

  it('Geç düğmesi her an kapatır; Animasyonlar Az ise slayt olur', () => {
    const k = document.documentElement, eski = k.getAttribute('data-hareket');
    k.setAttribute('data-hareket', 'az');
    S.ac();
    expect(S._durum().az).toBe(true);
    document.querySelector('.sinematik [data-sinematik="gec"]').click();
    expect(S.acikMi()).toBe(false);
    if(eski == null) k.removeAttribute('data-hareket'); else k.setAttribute('data-hareket', eski);
  });

  it('Menü sayfasında «Tanıtım filmi» satırı var ve filmi açar', () => {
    const d = document.createElement('div');
    d.innerHTML = L.KABUK.menuSayfasi({ modul:'ays' });
    const b = d.querySelector('[data-sinematik-ac]');
    expect(b != null && b.textContent.indexOf('Tanıtım filmi') >= 0).toBe(true);
    document.body.appendChild(d);
    b.click();
    expect(S.acikMi()).toBe(true);
    S.kapat();
    d.remove();
  });
});
})();
