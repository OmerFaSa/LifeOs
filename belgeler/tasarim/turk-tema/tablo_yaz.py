# Tarih tablolarini yazar: piksel-doga-turk.js sahnelerini dogal cozunurlukte cizer (Chromium, Playwright yalniz bu arac icin),
# kabuk/tablo.js'e data URL olarak koyar. Kullanim (depo kokunden): python belgeler/tasarim/turk-tema/tablo_yaz.py
# Yeni tablo: SAHNE'ye bir satir (tablo adi -> [sahne adi, vakit]); adi, alt satiri ve metni kabuk/ata.js TABLO'ya.
import os
from playwright.sync_api import sync_playwright

KOK = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
KAY = os.path.join(KOK, 'belgeler', 'tasarim', 'turk-tema', 'piksel-doga-turk.js')
HEDEF = os.path.join(KOK, 'kabuk', 'tablo.js')
SAHNE = {'otuken': ['bozkir', 'batim'], 'kocatepe': ['kocatepe', 'dogum'], 'semerkant': ['semerkant', 'batim']}
OLCU = {'buyuk': (420, 236), 'kucuk': (336, 189)}

HTML = '<html><body><script>' + open(KAY, encoding='utf-8').read() + '''</script><script>
window.ciz = (tur, vakit, W, H) => { const D = window.LIFEOS.PIKSEL_DOGA, a = document.createElement('canvas'); a.width = W; a.height = H;
  const o = D.yerlesim(W, H, vakit, tur); D.binaCiz(a.getContext('2d'), o);
  const c = document.createElement('canvas'); c.width = W; c.height = H; o.imza = null; D.kare(c.getContext('2d'), a, o, 0.6);
  return c.toDataURL('image/png'); };
</script></body></html>'''

def main():
    out = {}
    with sync_playwright() as p:
        b = p.chromium.launch(); g = b.new_page(); g.set_content(HTML)
        for ad, (tur, vakit) in SAHNE.items():
            out[ad] = {k: g.evaluate('([t, v, w, h]) => ciz(t, v, w, h)', [tur, vakit, w, h]) for k, (w, h) in OLCU.items()}
        b.close()
    L = ['/* kabuk/tablo.js — Tarih tabloları: elle ayarlanmış piksel sahneler (belgeler/tasarim/turk-tema: yama.py, piksel-doga-turk.js),',
         ' * doğal çözünürlükte PNG; belgeler/tasarim/turk-tema/tablo_yaz.py üretir, elle yazılmaz. Büyük 420×236 (masaüstünde 2×), küçük 336×189 (telefonda 1×).',
         ' * Ayrı dosya: açılış yüküne girmez; yalnız tablo gösteren sayfa açılınca kabuk.js yükler. Adlar ve metinler kabuk/ata.js TABLO. */',
         '(function (kok) {', "  'use strict';", '  var L = kok.LIFEOS = kok.LIFEOS || {}, Kabuk = L.Kabuk = L.Kabuk || {};', '  Kabuk.Tablo = {']
    for ad, v in out.items():
        L.append(f"    {ad}: {{ buyuk: '{v['buyuk']}',")
        L.append(f"      kucuk: '{v['kucuk']}' }},")
    L += ['  };', "  if (typeof module !== 'undefined' && module.exports) module.exports = Kabuk.Tablo;", "})(typeof window !== 'undefined' ? window : globalThis);", '']
    open(HEDEF, 'w', encoding='utf-8', newline='\n').write('\n'.join(L))
    print('yazıldı:', HEDEF, ', '.join(out))

if __name__ == '__main__':
    main()
