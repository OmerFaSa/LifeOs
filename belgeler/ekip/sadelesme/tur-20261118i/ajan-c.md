# Ajan C · tarih.5 «Osmanlı'dan Cumhuriyet'e: cihan devletinden millî devlete»

Dosya: `alan/tarih/asama-5.json` (yalnız bu dosya ve bu rapor yazıldı; commit yok).
Kurucu betikler: scratchpad `t5/` (ortak.py, u1-u6.py, kapi.py, kur.py → asama-5.json). Doğru harfler kur.py'de deterministik olarak A-D'ye dağıtıldı (25/25/25/24), anahtar metinleri değişmeden kaldı (denetlendi).

## Durum: BİTTİ
`python alan/denetle.py alan/tarih` → `Temiz · 6 dosya, 5 aşama, 22 ünite, 96 ders, 431 alıştırma, 158 kaynak · harita: 11 dal, 414 konu` (çıkış 0)

## Sayılar
- 6 ünite, 30 ders (her ders 8-10 paragraf), 95 ders alıştırması (69 seçmeli + 26 açık)
- 24 ünite kapı sorusu (6×4), 6 aşama kapı sorusu; 45 kaynak, hepsi kullanıldı; hiçbir yerde `onayli` yok

## Üniteler
1. Kuruluş (1302-1451): Osman/Bafeus · Orhan/Bursa-İznik-Gelibolu · I. Murad/Kosova · Yıldırım/Niğbolu-Ankara-Fetret · Çelebi Mehmed-II. Murad/Varna-II. Kosova
2. İstanbul'un fethi ve cihan devleti (1451-1566): 1453 kuşatma · fethin sonuçları, Otlukbeli, kanunname · Yavuz/Çaldıran-Mercidabık-Ridaniye, Piri Reis haritası · Kanuni/Belgrad-Mohaç-Viyana-1533-Preveze, Kitâb-ı Bahriye · divan, tımar, devşirme, Mehmet Genç, Mimar Sinan
3. Duraklamadan dağılmaya (1566-1878): Zitvatorok, Kanije, Celaliler, Kandiye · II. Viyana, Karlofça, Prut, Pasarofça, Belgrad · Lale Devri, Müteferrika, Küçük Kaynarca · III. Selim, II. Mahmud · Tanzimat, Islahat, I. Meşrutiyet, 93 Harbi, Berlin
4. İttihat ve Terakki ve son dönem (1889-1922): Jön Türkler, İTC 1889, 1908 · 31 Mart, Trablusgarp, Balkan, Bab-ı Âli, Edirne 1913, üç paşa · Gaspıralı, Akçura, Gökalp · Sarıkamış, Çanakkale, Kûtülamâre (1915 yalnız tarih + kanun adı) · Kafkas İslâm Ordusu/Bakü, Mondros, Karakol, Enver'in Türkistan'da şehadeti 1922
5. Millî Mücadele (1918-1923): işgaller ve cemiyetler · Samsun-Havza-Amasya-Erzurum-Sivas · Misak-ı Millî, TBMM, Sevr · cepheler ve İnönüler · Sakarya, Büyük Taarruz, Mudanya, Lozan
6. Cumhuriyet ve Türk dünyası: inkılaplar (1926 yargılamaları dahil) · Harf İnkılabı, TTK, TDK · Atatürk ilkeleri, Montrö, Hatay · 1991 Türk cumhuriyetleri, TDT · Kıbrıs ve KKTC

## Kaynaklar
- gemini: tarih_100 atlası (TAR-021..070), kırılmalar (21-49), ayt inkılap atlası, Osmanlı iktisadi atlası, coğrafya-inkılap atlası, kavram ikilisi (pençik/devşirme, 31 Mart/Bab-ı Âli), polimat (Gökalp, Kâtip Çelebi), TDT (jeopolitik atlası), sanat atlası (Süleymaniye/Selimiye), diplomasi atlası (Sevr/Lozan)
- kitap (kaynakli): İnalcık (Klasik Çağ; Devlet-i Aliyye I), İhsanoğlu (ed.), Runciman, Necipoğlu, Piri Reis, Karal, B. Lewis, Hanioğlu, F. Ahmad, Zürcher (Millî Mücadelede İttihatçılık), Tunaya, Akçura, Gökalp, Kırımlı, Aydemir (Enver Paşa), Erickson, Nutuk, MEB Tarih 10-11 ve İnkılap 12, Armaoğlu, Ersanlı
- gemini verisi ünite 4 ile ünite 6'nın Kıbrıs/1991 kısmını neredeyse kapsamıyor; buralarda kitaplara ve «(modelin bağlantı notu)» etiketli bilgilere dayanıldı.

## Kaynakta görülen sorunlar (ders `not` alanlarına yazıldı)
- 1.3: TAR-023 «Kosova'da ilk kez top» tartışmalı; Sırpsındığı 1364 tarihi tartışmalı.
- 2.3: TAR-031 / kırılma 26 halifeliğin 1517'de resmen devri ve «teokratik imparatorluk» yorumu; Piri Reis haritasının Selim'e sunulması rivayet.
- 2.4: TAR-032 «2 saatte, dünyanın en kısa meydan savaşı» kalıbı; «28 Eylül Donanma Günü» eşleştirmesi alınmadı.
- 3.3: «Lale Devri» adı ve matbaa ayrıntıları kaynakta yok.
- 3.5: ayt atlas «Genç Osmanlılar (Jön Türkler)» iki kuşağı karıştırıyor.
- 4.4: 1915 tarafsız; Sarıkamış/Çanakkale kayıplarında sayı yok. 4.5: Enver'in şehit düştüğü köyün yazılışı değişiyor.
- 5.5: «238 yıllık geri çekilme» yorumu; mübadele sayısı «yaklaşık».
- 6.2: Türk Tarih Tezi Ersanlı'ya dayanarak ölçülü değerlendirildi. 6.5: Kıbrıs dersi büyük ölçüde Armaoğlu + model bilgisi.

## Emin olunmayan noktalar (sahip/denetçi bakmalı)
- Orhan dönemi ayrıntıları (1324 Mekece vakfiyesi, 1331 İznik medresesi, yaya-müsellem) ve II. Murad sikkelerindeki Kayı damgası: model bilgisi.
- Kûtülamâre'de teslim olan asker sayısı («on üç bin dolayında») ve Selimiye kubbesi (~31 m) yaklaşık.
- Bakü'nün alınış tarihi (15 Eylül 1918), Enver'in şehadeti (4 Ağustos 1922) ve 1996'da naaşının getirilmesi: Aydemir + model bilgisi.
- TTK kuruluş tarihleri (1930 heyet, 15 Nisan 1931 cemiyet, 1935 ad) ve 1927 okuryazarlık oranı (~%10).
- Atatürk alıntıları yalnız Nutuk'ta geçen dört söz ve «Yurtta sulh, cihanda sulh»; başka söz yok.
