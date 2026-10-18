/* OFİS SOHBETİ testleri — kaynak `brand/ortak/ofissohbet.test.js`; ortak.py
   üç arayüze kopyalar. */
(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const O = () => window.LIFEOS.OFISSOHBET;
  const tus = (key, o) => Object.assign({ key, shiftKey:false, ctrlKey:false, metaKey:false, altKey:false, isComposing:false }, o || {});

  function kutu(anahtar, n, son){
    const d = document.createElement('div');
    d.className = 'chat osohbet';
    d.setAttribute('data-osohbet', anahtar);
    d.style.cssText = 'height:80px;overflow-y:auto;position:fixed;left:-9999px;top:0;width:200px';
    let h = '';
    for(let i = 0; i < n; i++){
      const ben = i % 2 === 0 && !(i === n - 1 && son === 'agent');
      h += '<div class="msg ' + (ben ? 'msg--me' : 'msg--agent') + '"><div class="msg__body" data-osohbet-metin style="height:40px">m' + i + '</div></div>';
    }
    d.innerHTML = h;
    return d;
  }

  describe('Ofis sohbeti (King gibi akış, sade görünüş)', () => {
    it('Enter gönderir; Shift, Ctrl ve harf birleştirme göndermez', () => {
      expect(O().gonderMi(tus('Enter'))).toBe(true);
      expect(O().gonderMi(tus('Enter', { shiftKey:true }))).toBe(false);
      expect(O().gonderMi(tus('Enter', { ctrlKey:true }))).toBe(false);      // modülün kendi kısayolu
      expect(O().gonderMi(tus('Enter', { isComposing:true }))).toBe(false);
      expect(O().gonderMi(tus('a'))).toBe(false);
    });

    it('kaydırma kararı: ilk açılış alta, yeni mesaj alta ve belirir, yukarıda okurken yerinde kalır', () => {
      expect(O().karar(null, 5)).toEqual({ alta:true, yeni:false });
      expect(O().karar({ n:4, altta:false, top:10 }, 5)).toEqual({ alta:true, yeni:true });
      expect(O().karar({ n:5, altta:true, top:0 }, 5)).toEqual({ alta:true, yeni:false });
      expect(O().karar({ n:5, altta:false, top:30 }, 5)).toEqual({ alta:false, yeni:false, top:30 });
    });

    it('yeniden çizilen kutu yukarıdaki okuma yerini korur; yeni ajan cevabı bir kez belirir', () => {
      O()._sifirla();
      const a = kutu('deneme:x', 4);
      document.body.appendChild(a);
      O().isle(a);
      expect(a.scrollTop > 0).toBe(true);                                   // ilk açılış: en alt
      a.scrollTop = 0;
      a.dispatchEvent(new Event('scroll'));
      const b = kutu('deneme:x', 4);
      a.replaceWith(b);
      O().isle(b);
      expect(b.scrollTop).toBe(0);                                          // yukarıda okuyordun
      expect(b.querySelector('.is-yeni')).toBe(null);
      const c = kutu('deneme:x', 5, 'agent');
      b.replaceWith(c);
      O().isle(c);
      expect(c.scrollTop > 0).toBe(true);                                   // yeni mesaj: alta
      expect(c.querySelectorAll('.is-yeni').length).toBe(1);
      expect(c.lastElementChild.classList.contains('is-yeni')).toBe(true);
      const d = kutu('deneme:x', 5, 'agent');
      c.replaceWith(d);
      O().isle(d);
      expect(d.querySelector('.is-yeni')).toBe(null);                       // bir kez
      d.remove();
      O()._sifirla();
    });

    it('bekleyen satır mesaj sayılmaz', () => {
      O()._sifirla();
      const a = kutu('deneme:y', 2);
      a.insertAdjacentHTML('beforeend', '<div data-osohbet-bekle><div class="msg msg--agent"><div class="msg__body">yazıyor</div></div></div>');
      document.body.appendChild(a);
      O().isle(a);
      expect(O()._durum('deneme:y').n).toBe(2);
      a.remove();
      O()._sifirla();
    });

    it('Enter düğmeye tıklar (boşsa tıklamaz); boş kutuda ↑ son soruyu getirir', () => {
      const yer = document.createElement('div');
      yer.innerHTML = '<div class="chat osohbet" data-osohbet="deneme:z"><div class="msg msg--me"><div class="msg__body" data-osohbet-metin>son sorum</div></div></div>'
        + '<div class="osohbet-yaz" data-osohbet-yaz><textarea data-osohbet-girdi></textarea>' + O().gonderHtml({ act:'deneme-gonder' }) + '</div>';
      document.body.appendChild(yer);
      let tik = 0;
      const d = yer.querySelector('[data-osohbet-gonder]');
      d.addEventListener('click', e => { e.stopPropagation(); tik++; });
      const g = yer.querySelector('[data-osohbet-girdi]');
      g.dispatchEvent(new KeyboardEvent('keydown', { key:'Enter', bubbles:true, cancelable:true }));
      expect(tik).toBe(0);
      g.dispatchEvent(new KeyboardEvent('keydown', { key:'ArrowUp', bubbles:true, cancelable:true }));
      expect(g.value).toBe('son sorum');
      g.dispatchEvent(new KeyboardEvent('keydown', { key:'Enter', bubbles:true, cancelable:true }));
      expect(tik).toBe(1);
      g.dispatchEvent(new KeyboardEvent('keydown', { key:'Enter', shiftKey:true, bubbles:true, cancelable:true }));
      expect(tik).toBe(1);
      yer.remove();
    });

    it('gönder ve kopyala düğmeleri: eylem, Türkçe ad; King süsü yok', () => {
      const h = O().gonderHtml({ act:'team-send' }) + O().kopyaHtml();
      expect(h.indexOf('data-act="team-send"') >= 0).toBe(true);
      expect(h.indexOf('aria-label="Gönder"') >= 0).toBe(true);
      expect(h.indexOf('aria-label="Cevabı kopyala"') >= 0).toBe(true);
      expect(/king/i.test(h)).toBe(false);
      expect(O().gonderHtml({ act:'x', kapali:true }).indexOf(' disabled') >= 0).toBe(true);
    });

    it('kopyalanan metin cevabın kendisi (ad satırı ve rozet değil)', () => {
      const m = document.createElement('div');
      m.className = 'msg msg--agent';
      m.innerHTML = '<div class="msg__who"><b>Patron</b></div><div class="msg__body" data-osohbet-metin>Bugün matematik.</div>'
        + '<div class="osohbet__alt"><span>hazır kural</span>' + O().kopyaHtml() + '</div>';
      document.body.appendChild(m);
      expect(O().kopyaMetni(m.querySelector('[data-osohbet-kopyala]'))).toBe('Bugün matematik.');
      m.remove();
    });

    it('pencere King düzeninde: yan çubukta Yeni sohbet ve geçmiş, başlık, akış, yazma kutusu; King süsü yok', () => {
      const h = O().pencereHtml({ anahtar:'deneme:p', ad:'Patron', rol:'Baş danışman', durum:'hazır kurallar',
        gecmisHtml:'<ul class="gecmis"></ul>', mesajlarHtml:'', bos:{ alt:'Raporu okudum.', cipler:[{ ad:'Bu hafta ne?', act:'x-sor', data:{ 'data-q':'Bu hafta ne?' } }] },
        girdiHtml:'<textarea data-osohbet-girdi></textarea>', gonderAct:'x-gonder' });
      const d = document.createElement('div');
      d.innerHTML = h;
      const p = d.querySelector('[data-osohbet-pencere]');
      expect(!!p.querySelector('.opencere__yan [data-act="sohbet-yeni"]')).toBe(true);
      expect(!!p.querySelector('.opencere__yan .gecmis')).toBe(true);
      expect(p.querySelector('.opencere__bas .opencere__ad').textContent).toBe('Patron');
      expect(p.querySelector('.opencere__durum').textContent).toBe('hazır kurallar');
      expect(p.querySelector('[data-osohbet]').getAttribute('data-osohbet')).toBe('deneme:p');
      expect(p.querySelector('.opencere__bos-ad').textContent).toBe('Patron');               // boşken ortada ad
      expect(p.querySelector('.opencere__hazir').getAttribute('data-q')).toBe('Bu hafta ne?');
      expect(!!p.querySelector('[data-osohbet-yaz] [data-osohbet-gonder][data-act="x-gonder"]')).toBe(true);
      expect(/king/i.test(h)).toBe(false);
      const dolu = O().pencereHtml({ anahtar:'deneme:p', ad:'Patron', mesajlarHtml:'<div class="msg msg--me"></div>', bos:{ alt:'x' } });
      expect(dolu.indexOf('opencere__bos') < 0).toBe(true);                                 // mesaj varsa boş ekran yok
      expect(O().pencereHtml({ ad:'<b>' }).indexOf('<b>') < 0).toBe(true);                   // ad kaçırılır
    });

    it('dar ekranda yan çubuk düğmesi açar; sohbete dokununca kapanır', () => {
      const d = document.createElement('div');
      d.innerHTML = O().pencereHtml({ anahtar:'deneme:q', ad:'Patron' });
      document.body.appendChild(d);
      const b = d.querySelector('[data-osohbet-yan]');
      b.click();
      expect(b.getAttribute('aria-expanded')).toBe('true');
      d.querySelector('.opencere__akis').click();
      expect(b.getAttribute('aria-expanded')).toBe('false');
      d.remove();
    });

    it('sade görünüş: ofis sohbeti biçiminde King süsü (bulanık cam, gradyan, sonsuz animasyon) yok', () => {
      const kurallar = [];
      Array.from(document.styleSheets).forEach(ss => {
        let l; try{ l = ss.cssRules; }catch(e){ return; }
        const gez = rr => Array.from(rr || []).forEach(r => { if(r.cssRules) gez(r.cssRules); else if(r.selectorText && /osohbet/.test(r.selectorText)) kurallar.push(r.cssText); });
        gez(l);
      });
      if(!kurallar.length) return;                                          // test sayfası biçimi yüklemiyorsa
      const metin = kurallar.join('\n');
      expect(/backdrop-filter|gradient|infinite|box-shadow:\s*0 0 [1-9]/.test(metin)).toBe(false);
    });
  });
})();
