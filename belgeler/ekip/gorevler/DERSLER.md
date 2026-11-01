# Ofis dersleri

Claude Code'un son incelemesinde bulunan hatalardan çıkan kısa kurallar.
Son 10 madde Uygulayıcı'nın ve Denetçi'nin istemine girer; aynı hata ikinci
kez yapılmasın diye. Ekleme: `python tools/ajan.py ders NNN "…"` (elle de
eklenebilir; her madde `- ` ile başlayan tek satır).

- 001 (31.10.2026): Bir kaydın kopyalarını üreten kodda (tekrar kuralı, açılım) aynı kimlikle gelen istisna kaydı (RECURRENCE-ID gibi) açılımdan çıkarılmalı; yoksa aynı an iki kez görünür. Testte istisnalı bir örnek bulunsun.
- 003 (31.10.2026): «Sonuç»ta test çıktısı satırı ve «Açık kalan» boş bırakılmaz; komut -> çıktı satırı aynen yazılır.
- 006 (31.10.2026): veri/ham/ git'e girmez (gitignore), ajan klasöründe yoktur: 'kaynak dogrulanamaz' ihlalleri orada sahte çıkar; böyle sayıları «Açık kalan»a «ana klasörde doğrulanmalı» diye yaz, «eski ihlal» deme.
- 008 (01.11.2026): Test yazarken kodun bugünkü çıktısını beklenen değer yapma: beklenen değer ölçütten ve docstring'den gelir; kod uymuyorsa testi kırmızı bırakıp hatayı düzelt ya da «Açık kalan»a yaz. Görev dosyasında yalnız Durum ve Sonuç değişir.
- 013 (01.11.2026): Görevin Dokunma listesindeki koda (yorum dahil) dokunma; aynı denetle-say-ekle bloğunu dallara kopyalama, tek iç işlev yaz.
- 014 (01.11.2026): Ortak çekirdeğe bağlanan dosyayı tek başına yükleyen kabul testleri ve araçlar (kabul_js, denetle_banka) da güncellenmeli
- 015 (01.11.2026): Değiştirdiğin dosya üretilmiş kopyaysa (başlıkta «ÜRETİLMİŞ KOPYA») kaynağı brand/'dadır; Açık kalan'a yaz, Claude taşır
