# Tur 2026-11-17 · İçerik: konu haritası (harita.json)

Sahip: «Tarih'e bastığımda Türk tarihi, Roma tarihi gibi listeler, konu alt başlıklarını görmek istiyorum.»
Durum: **bitti**, commit yok (dal sadelesme, taban 8137f67b).

## Kabuk ajanına tek satır
Yükleme yolu: `fetch('../alan/' + id + '/harita.json')` (aşama dosyalarıyla aynı yol; sunucu `KABUK_KOKLER["alan"]` zaten `.json` verir, 404 = haritasız alan). Biçim: `alan/SEMA.md` «Konu haritası».

## Yapılanlar
- [x] **Biçim**: `alan/SEMA.md` «Konu haritası» bölümü (sözleşmedeki biçim aynen: sema, alan, dallar → id/ad/ozet/bolumler → ad/konular → ad, isteğe bağlı ders/unite).
- [x] **Denetim** (`alan/denetle.py`): `harita.json` aşama listesinden çıkar, ayrı denetlenir: zorunlu alanlar, sema 1, alan aşamalarla aynı, tekil dal id, boş dal listesi / bölümsüz dal / boş bölüm / adsız konu hata, `ders`/`unite` yalnız o alanda gerçekten var olan kimliğe (ünite kimliği `ders` diye bağlanamaz). Özet satırı `· harita: N dal, M konu` ekler.
- [x] **Testler** (`alan/denetle_test.py`): 12 yeni harita durumu + gerçek felsefe ve tarih klasörünün haritasıyla temiz çıkması (27/27).
- [x] **alan/tarih/harita.json**: 11 dal, 414 konu; mevcut 18 dersin hepsi bağlı (bazıları iki konuya).
- [x] **alan/felsefe/harita.json**: 4 dal, 95 konu; 18 dersin hepsi bağlı.
- [x] **Sunma**: kod değişikliği gerekmedi. `tools/tekkapi_test.py`'ye `/alan/tarih/harita.json 200 (application/json)` satırı eklendi. iPhone paketi (`uygulama/ios/hazirla.py`) kabuk/alan taşımaz (kabuk Tailscale'den gelir) → `web_paket.py` değişmedi. `tools/kabuk_baslangic_test.py` alan dosyası taşımıyor, değişmedi. CI satırı değişmedi: `denetle.py alan/tarih` ve `alan/felsefe` haritayı da denetliyor.

## Tarih dalları (sıra = gösterim sırası)
1. Tarihe giriş: yöntem ve zaman (4 bölüm; 12 ders bağlı)
2. Türk tarihi: İlk Türk devletleri, Öteki Türk toplulukları, İslamiyet öncesi Türk kültürü, İslamiyet'e geçiş, İlk Türk-İslam devletleri, Büyük Selçuklu, Türkiye Selçuklu, Anadolu beylikleri
3. Osmanlı tarihi: Kuruluş, Yükselme, Devlet ve toplum düzeni, Duraklama, Gerileme, Dağılma (1792–1908), Son dönem (1908–1922)
4. Türkiye Cumhuriyeti tarihi: Millî Mücadele'ye hazırlık, TBMM ve cepheler, Lozan ve kuruluş, İnkılaplar, Atatürk ilkeleri, İç ve dış politika (1923–1939), 1938'den günümüze
5. İslam tarihi (7 bölüm) · 6. Eski Çağ uygarlıkları (6 bölüm; Göbeklitepe, Çatalhöyük, Mezopotamya, Hitit, Frig/Lidya, Urartu dersleri bağlı) · 7. Antik Yunan (5) · 8. Roma tarihi: Krallık, Cumhuriyet kurumları, Akdeniz'e yayılma, Cumhuriyet'in krizi, İmparatorluk, Geç Roma, Doğu Roma (Bizans) · 9. Orta Çağ Avrupası (5) · 10. Yeni ve Yakın Çağ: Rönesans, Reform, Coğrafi Keşifler, Bilimsel Devrim ve Aydınlanma, Fransız İhtilali, Sanayi Devrimi, 19. yüzyıl · 11. 20. yüzyıl dünyası: I. Dünya Savaşı, İki savaş arası, II. Dünya Savaşı, Soğuk Savaş, Sömürgelerin bağımsızlığı, Soğuk Savaş sonrası

Doğruluk: yalnız yaygın kabul gören tarihler yazıldı (ör. Malazgirt 1071, Karlofça 1699, Lozan 1923); tartışmalı ya da emin olunmayan tarih (Sırpsındığı, Çimpe) yazılmadı. «Duraklama/gerileme» adlarının tartışmalı olduğu konu olarak eklendi ve «Dönem sınırları birer karardır» dersine bağlandı.

## Felsefe dalları
Felsefeye giriş (3 bölüm) · Mantık (4: önermeler, akıl yürütme, safsatalar, sembolik mantık) · Felsefenin alanları (7: bilgi, varlık, ahlak, siyaset, sanat, bilim, din) · Felsefe tarihi (7: İlk Çağ, Orta Çağ İslam, Orta Çağ Hristiyan, 15.–17. yy, Aydınlanma, 19. yy, 20. yy).

## Öbür alanlar (dosya üretilmedi, öneri)
- **akademik**: harita gerekmez (kabuk 30+ üniteyi « — » öncesine göre gruplar).
- **dil**: öneri dallar «Diksiyon», «İngilizce (A1→B2)», ileride başka diller; dil başına seviye bölümleri (A1, A2 …) ve dilbilgisi/konu konuları. Sahip hangi dilleri istediğini söyleyince yazılır.
- **muzik**: öneri dallar «Kuram», «Çalgı (klavye/gitar)», «Kulak eğitimi», «Türk müziği (makam, usul)»; çalgı seçimi sahibin kararı.
- **okuma**: öneri dallar «Okuma yöntemi», «Not ve özet», «Yazı» ya da kitap listeleri (türlere göre). Kitap listesi sahibin seçimine bağlı, şimdilik yazılmadı.
- Sağlık alanları (beslenme, hareket, uyku, tahlil) konu haritasına uygun değil (kayıt alanları).

## Kalite kapısı (hepsi yeşil)
`alan/denetle_test.py` 27/27 · on alanın `denetle.py`'si temiz · `tools/kabuk_baslangic_test.py` temiz · `uygulama/ios/web_paket_test.py` temiz · `tools/tekkapi_test.py` 169/169 · `kalite/olcum.py --denetle` 28 bütçe, aşım yok · `kalite/katman.py` tamam · `tools/belge_dizin_kabul_test.py` temiz (DIZIN.md'ye satır eklendi).

## Açık kalan
- Kabuk tarafı (dalları göstermek, bağsız konuda «henüz ders yok · King'le çalış») kabuk ajanının işi.
- `king/arama.py` `alan/**/*.json` tarar: haritadaki 30 karakterden uzun dizgeler (dal özetleri, uzun konu adları) King'e «alan» kaynağı olarak gelebilir. Zararsız ama ders metni değil; King ajanı isterse `harita.json`'u atlayabilir (benim dosyam değil, dokunmadım).
- `sistem/tekkapi.py`'deki değişiklik benim değil (başka ajan); test onunla da yeşil.
