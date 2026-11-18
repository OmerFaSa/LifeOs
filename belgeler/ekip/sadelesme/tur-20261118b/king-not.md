# Tur 2026-11-18b · King, Not, ders sonu

Sahip: «görsel kaliteyi arttır, daha güzel olsun». Dal sadelesme, başlangıç a7e09e54. Ajan hesap sınırında kesildi (kod, testler ve bayt kırpması bitmişti, rapor yarımdı); 2026-11-18 oturum 2209a43f tamamladı.

## Ne değişti
- **King boş hâli** (`kabuk/king-sohbet.js`, `kabuk.css`): kipe göre sabit karşılama (`SELAM`), konuşanın adı taç simgesiyle (`.king-kim`, Divan'da hükümdarın adı), örnek sorular okunur kâğıt kartçıklar (telefonda alt alta), boşken yazma alanı belirgin (büyük gölge, daha yüksek). Akış yazma alanının altında kalmasın diye üstten maskeli.
- **Divan:** hükümdar adının altında çağ satırı (`CAG`: unvan · yıllar); test her hükümdar için arar.
- **Not boş hâli** (`kabuk/araclar.js`, `araclar.css`): kısa cümle + masaya bırakılmış, hafif eğik örnek not kâğıdı (#etiket, [[bağ]] nasıl yazılır gösterir); araç yokken «Araçlar» bölümü yerine tek sakin «+ Yeni araç» satırı. `kabuk.css`'teki ölü `.nothizli` kopyası silindi (asıl kural `araclar.css`'te).
- **Ders sonu** (`kabuk.js dersSonu`): düğmelerin üstünde özet («Okundu», «Alıştırma k / m doğru») ve sıradaki dersin adı serif; bitmemiş derste sıradaki, `Yol.dersOku`'nun saf kopyasıyla bulunur (kayıt değişmez).

## Önce/sonra
`king-not-gorsel/pano-once-*.png` ve `pano-sonra-*.png`: King boş/dolu/Divan, Not boş/dolu, ders sonu/okundu; 1440 ve 390, açık ve koyu.

## Testler
`kabuk/king-sohbet.test.js` (çağ satırı), `tools/kabuk_gez.js` (King karşılaması ve konuşan adı, Not boş defter örneği ve «Yeni araç» satırı, ders 1 sonunda özet + sıradaki dersin adı).
