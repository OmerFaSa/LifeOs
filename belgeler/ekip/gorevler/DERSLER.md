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
- 017 (01.11.2026): Sonradan eklenen dosyalar dizini kırmızı yapar; dizin kabul testi CI'da durur
- 018 (01.11.2026): Sonradan eklenen dosyalar dizini kırmızı yapar; dizin kabul testi CI'da durur
- 020 (01.11.2026): Cumle beklentisi sayfa adindan degil isten yazilir: «gelecek haftanin plani» gelecek (puan) sayfasi degil hafta
- 021 (01.11.2026): Adsız sil/guncelle tek kaydı sessizce secmesin; varsayilan deger (1 kg, 'lang', kuru fasulye) uydurma sayilir
- 022 (01.11.2026): Adsız sil/guncelle tek kaydı sessizce secmesin; varsayilan deger (1 kg, 'lang', kuru fasulye) uydurma sayilir
- 023 (01.11.2026): Adsız sil/guncelle tek kaydı sessizce secmesin; varsayilan deger (1 kg, 'lang', kuru fasulye) uydurma sayilir
- 040 (01.11.2026): Kullanıcıdan gelen tarihle döngü kurma: sabit sayıda adım say; while(true) bozuk girdide asılır. Depo yazması hata verirse bellekteki değeri geri al.
- 041 (01.11.2026): Eksik dakika 0 değildir: toplamı yalnız değeri olan kayıtlardan kur, hiç yoksa null/veri yok; geri alma null'ı null olarak geri yazar.
- 033 (02.11.2026): Testçi oturum kesilince yarıda kaldı; denetimler main'de elle koşuldu. Kayıt ayrıştırıcısına eklenen kısa takma ad («tarih») başka anlamla çakışabilir; takma ad bağlamla sınansın
- 032 (02.11.2026): Bölüm kimliğini elle listeleme; modülün kataloğunu (SP.Bolum.liste) kullan: gizlenemeyen bölüm önizlemede patlar
- 031 (02.11.2026): Ajan takıldı; bulgular Claude'da düzeltildi. Çıkarılamayan değer (tarih, karar kimliği, süre) uydurulmaz, null döner; geçmiş zamanlı kayıt cümlesi plan komutu değildir
