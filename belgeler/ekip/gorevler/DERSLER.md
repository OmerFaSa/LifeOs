# Ofis dersleri

Claude Code'un son incelemesinde bulunan hatalardan çıkan kısa kurallar.
Son 10 madde Uygulayıcı'nın ve Denetçi'nin istemine girer; aynı hata ikinci
kez yapılmasın diye. Ekleme: `python tools/ajan.py ders NNN "…"` (elle de
eklenebilir; her madde `- ` ile başlayan tek satır).

- 001 (31.10.2026): Bir kaydın kopyalarını üreten kodda (tekrar kuralı, açılım) aynı kimlikle gelen istisna kaydı (RECURRENCE-ID gibi) açılımdan çıkarılmalı; yoksa aynı an iki kez görünür. Testte istisnalı bir örnek bulunsun.
- 003 (31.10.2026): «Sonuç»ta test çıktısı satırı ve «Açık kalan» boş bırakılmaz; komut -> çıktı satırı aynen yazılır.
- 006 (31.10.2026): veri/ham/ git'e girmez (gitignore), ajan klasöründe yoktur: 'kaynak dogrulanamaz' ihlalleri orada sahte çıkar; böyle sayıları «Açık kalan»a «ana klasörde doğrulanmalı» diye yaz, «eski ihlal» deme.
