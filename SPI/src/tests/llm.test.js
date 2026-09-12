/* MODEL KATMANI — saf kısımlar.

   `llm.js` yedi yüz otuz yedi satır ve yirmi altı işlevinden yalnızca
   biri bir testten geçiyordu. Ağ çağrısının kendisi burada denenmez
   (gerçek bir uç nokta ister), ama etrafındaki KARARLAR denenir ve asıl
   hata oraya saklanır:

     · anahtar deposu — kaç anahtar, hangi sırayla, tekrar var mı
     · maskeleme — tam anahtar hiçbir yerde görünmemeli
     · kesik yanıtın birleştirilmesi — kelime bölmeden, tekrar etmeden
     · hata sınıflandırma — hangi hata yeniden denenir, hangisi beklenir

   Bunların hepsi sessiz hatalardır: yanlış olduklarında ekranda bir
   şey patlamaz, sadece yanlış davranır. */

(function(){
  const { describe, it, expect } = SP.Test;
  const L = SP.LLM;

  function temizAnahtarlar(){ L.clearKeys(); }

  describe('Model — anahtar deposu', function(){
    it('yazılan anahtar okunur', function(){
      temizAnahtarlar();
      L.setKey('openai', 'sk-abcdef123456');
      expect(L.getKey('openai')).toBe('sk-abcdef123456');
      temizAnahtarlar();
    });

    it('bir sağlayıcıya birden çok anahtar verilebilir', function(){
      /* Kota anahtar başına sayıldığı için ikinci anahtar günlük hakkı
         ikiye katlar; ücretsiz katmanda en ucuz büyüme yolu budur. */
      temizAnahtarlar();
      L.setKey('openai', ['sk-bir', 'sk-iki']);
      expect(L.getKeys('openai')).toHaveLength(2);
      expect(L.getKey('openai')).toBe('sk-bir');
      temizAnahtarlar();
    });

    it('aynı anahtar iki kez sayılmaz', function(){
      /* Kota anahtar kimliğine bağlı: aynı anahtarı iki kez eklemek
         sahte bir ikinci hak üretirdi. */
      temizAnahtarlar();
      L.setKey('openai', ['sk-ayni', 'sk-ayni', 'sk-baska']);
      expect(L.getKeys('openai')).toEqual(['sk-ayni', 'sk-baska']);
      temizAnahtarlar();
    });

    it('boş ve boşluklu değerler atılır', function(){
      temizAnahtarlar();
      L.setKey('openai', ['  sk-temiz  ', '', '   ', null]);
      expect(L.getKeys('openai')).toEqual(['sk-temiz']);
      temizAnahtarlar();
    });

    it('boş değer sağlayıcının anahtarlarını siler', function(){
      temizAnahtarlar();
      L.setKey('openai', 'sk-var');
      L.setKey('openai', '');
      expect(L.getKeys('openai')).toHaveLength(0);
      temizAnahtarlar();
    });

    it('eski tek dize biçimi okunmaya devam eder', function(){
      temizAnahtarlar();
      localStorage.setItem(L.KEY_STORE, JSON.stringify({ openai:'sk-eski' }));
      expect(L.getKeys('openai')).toEqual(['sk-eski']);
      temizAnahtarlar();
    });

    it('bozuk depo çökmez, boş sayılır', function(){
      localStorage.setItem(L.KEY_STORE, '{bozuk');
      expect(L.getKeys('openai')).toHaveLength(0);
      temizAnahtarlar();
    });

    it('ekleme ve sıradan silme listeyi korur', function(){
      temizAnahtarlar();
      L.addKey('openai', 'sk-1');
      L.addKey('openai', 'sk-2');
      L.addKey('openai', 'sk-2');          // tekrar eklenmez
      expect(L.getKeys('openai')).toEqual(['sk-1', 'sk-2']);
      L.removeKeyAt('openai', 0);
      expect(L.getKeys('openai')).toEqual(['sk-2']);
      temizAnahtarlar();
    });

    it('sağlayıcılar birbirinin anahtarını görmez', function(){
      temizAnahtarlar();
      L.setKey('openai', 'sk-o');
      L.setKey('anthropic', 'sk-a');
      expect(L.getKey('openai')).toBe('sk-o');
      expect(L.getKey('anthropic')).toBe('sk-a');
      expect(L.getKeys('bilinmeyen')).toHaveLength(0);
      temizAnahtarlar();
    });
  });

  describe('Model — maskeleme', function(){
    /* TAM ANAHTAR HİÇBİR YERDE ÇİZİLMEZ. Ayar ekranında, hata
       mesajında, kayıtta — hiçbirinde. */
    it('uzun anahtarın yalnızca uçları görünür', function(){
      temizAnahtarlar();
      L.setKey('openai', 'sk-proj-1234567890abcdef');
      const m = L.maskKey('openai');
      expect(m).toContain('…');
      expect(m.indexOf('1234567890')).toBe(-1);
      expect(m.length).toBeLessThan('sk-proj-1234567890abcdef'.length);
      temizAnahtarlar();
    });

    it('kısa anahtar tamamen gizlenir', function(){
      temizAnahtarlar();
      L.setKey('openai', 'kisa');
      expect(L.maskKey('openai')).toBe('••••');
      temizAnahtarlar();
    });

    it('anahtar yoksa boş dize döner', function(){
      temizAnahtarlar();
      expect(L.maskKey('yok')).toBe('');
      expect(L.maskKeys('yok')).toHaveLength(0);
    });
  });

  describe('Model — kesik yanıtın onarımı', function(){
    it('uzunluk sınırı kesilme sayılır', function(){
      expect(L.truncated('length')).toBeTruthy();
      expect(L.truncated('max_tokens')).toBeTruthy();
      expect(L.truncated('stop')).toBeFalsy();
      expect(L.truncated(null)).toBeFalsy();
    });

    it('sarkan yarım cümle atılır', function(){
      const t = L.trimToSentence('Birinci cümle tamam. İkinci cümle yarım kal');
      expect(t).toBe('Birinci cümle tamam.');
    });

    it('sayı içindeki nokta cümle sonu sayılmaz', function(){
      /* "1.500 lira" cümleyi bitirmez; bitirseydi metin oradan kesilirdi. */
      const t = L.trimToSentence('Aylık gideri 1.500 lira civarında olacak');
      expect(t).toContain('1.500');
    });

    it('kesilen kısım gövdeyse atılmaz — boş ekran daha kötüdür', function(){
      /* Geriye yarısından azı kalıyorsa yarım cümle gösterilir. */
      const uzun = 'Kısa. ' + 'a'.repeat(200);
      expect(L.trimToSentence(uzun)).toBe(uzun.trim());
    });

    it('hiç tam cümle yoksa metne dokunulmaz', function(){
      expect(L.trimToSentence('hiç noktalama yok')).toBe('hiç noktalama yok');
    });

    it('yarım kalan son kelime atılır', function(){
      expect(L.dropLastWord('gelir kaybı hesabı yarı')).toBe('gelir kaybı hesabı');
      expect(L.dropLastWord('tekkelime')).toBe('tekkelime');
      expect(L.dropLastWord('')).toBe('');
    });

    it('devam parçası örtüşmeden birleşir', function(){
      /* Model devamı yazarken son cümleyi tekrar edebilir; örtüşme
         bulunup atılır, yoksa kelimeler birbirine yapışır. */
      const a = 'Sabah ölçümü yüksek çıktı ve bu';
      const b = 'yüksek çıktı ve bu durum üç gündür sürüyor.';
      expect(L.joinContinuation(a, b)).toBe('Sabah ölçümü yüksek çıktı ve bu durum üç gündür sürüyor.');
    });

    it('örtüşme yoksa araya boşluk konur', function(){
      expect(L.joinContinuation('Birinci', 'ikinci')).toBe('Birinci ikinci');
      expect(L.joinContinuation('Birinci ', 'ikinci')).toBe('Birinci ikinci');
    });

    it('taraflardan biri boşsa diğeri aynen döner', function(){
      expect(L.joinContinuation('', 'x')).toBe('x');
      expect(L.joinContinuation('x', '')).toBe('x');
    });
  });

  describe('Model — hata sınıflandırma', function(){
    it('her hata kodunun okunur bir karşılığı var', function(){
      ['no_provider', 'no_key', 'rate_limited', 'server', 'timeout',
       'offline', 'unauthorized'].forEach(k => {
        expect(L.errorText(k).length).toBeGreaterThan(10);
      });
    });

    it('bilinmeyen kod da bir cümle döner — boş ekran bırakmaz', function(){
      expect(L.errorText('hicboyleyok').length).toBeGreaterThan(10);
    });

    it('yeniden denenebilirle beklenebilir ayrılır', function(){
      /* Yeniden denenebilir: yedek modele geçmek anlamlı.
         Beklenebilir: bağlantı gelince kaldığı yerden devam eder.
         Karıştırılırsa ya boşuna deneme ya da kayıp oturum olur. */
      expect(L.retryable('rate_limited')).toBeTruthy();
      expect(L.retryable('unauthorized')).toBeFalsy();
      expect(L.resumable('offline')).toBeTruthy();
      expect(L.resumable('unauthorized')).toBeFalsy();
      /* Sunucu hatası ikisi birden olabilir. */
      expect(L.retryable('server')).toBeTruthy();
      expect(L.resumable('server')).toBeTruthy();
    });

    it('anahtar hatası yeniden denenmez', function(){
      /* Anahtar yanlışsa tekrar denemek yalnızca kota yakar. */
      expect(L.retryable('no_key')).toBeFalsy();
      expect(L.retryable('unauthorized')).toBeFalsy();
      expect(L.retryable('no_credit')).toBeFalsy();
    });
  });

  describe('Kota — sayaç ve sınır', function(){
    const Q = SP.Quota;
    /* Gerçek bir sağlayıcı kullanılır: `limitsFor` bilinmeyen sağlayıcıda
       null döner ve kota "sınırsız" sayılır. */
    const cfg = { provider:'openrouter', model:'deepseek/deepseek-chat-v3-0324:free', keyId:0 };

    function temiz(){ Q.reset(); Q.clearOverrides(); }

    it('sıfırlandığında ilk istek geçer', function(){
      temiz();
      expect(Q.check(cfg).ok).toBeTruthy();
      temiz();
    });

    it('sınırlar sağlayıcının belgelenmiş katmanından gelir', function(){
      temiz();
      const lim = Q.limitsFor(cfg);
      expect(lim).toBeTruthy();
      expect(lim.rpm).toBeGreaterThan(0);
      expect(lim.rpd).toBeGreaterThan(0);
      temiz();
    });

    it('sınırsız sağlayıcıda kota uygulanmaz', function(){
      /* Yerleşik yetenek ve özel uç için sayım anlamsızdır. */
      expect(Q.limitsFor({ provider:'builtin', model:'default' })).toBeFalsy();
      expect(Q.check({ provider:'builtin', model:'default' }).ok).toBeTruthy();
    });

    it('bilinmeyen sağlayıcı sınırsız sayılır, çökmez', function(){
      expect(Q.limitsFor({ provider:'hicboyleyok' })).toBeFalsy();
      expect(Q.check({ provider:'hicboyleyok' }).ok).toBeTruthy();
    });

    /* PAY YALNIZ DAKİKALIK SINIRA UYGULANIR. Günlük sayaçta pay
       olmamalıdır: o bir zamanlama sorunu değil düz bir sayımdır ve pay
       düşmek kullanıcının ücretsiz hakkının bir kısmını harcamadan
       çürütür. */
    it('güvenlik payı dakikalık hakka uygulanır, günlüğe değil', function(){
      temiz();
      const lim = Q.limitsFor(cfg);
      const eff = Q.effective(cfg);
      expect(eff.rpm).toBeLessThan(lim.rpm + 1);
      expect(eff.rpm).toBeGreaterThan(0);
      expect(eff.rpd).toBe(lim.rpd);
      temiz();
    });

    it('elle sınır ayarı kaydedilir, okunur ve silinir', function(){
      temiz();
      Q.setOverride('openrouter', { rpm:3 });
      expect(Q.getOverride('openrouter').rpm).toBe(3);
      expect(Q.limitsFor(cfg).rpm).toBe(3);
      Q.clearOverrides();
      expect(Q.getOverride('openrouter').rpm).toBeFalsy();
      temiz();
    });

    it('geçersiz sınır ayarı yok sayılır', function(){
      /* Sıfır ya da negatif bir sınır "sonsuz hak" demek olurdu. */
      temiz();
      Q.setOverride('openrouter', { rpm:0 });
      expect(Q.getOverride('openrouter').rpm).toBeFalsy();
      Q.setOverride('openrouter', { rpm:-5 });
      expect(Q.getOverride('openrouter').rpm).toBeFalsy();
      temiz();
    });

    it('dakikalık hak dolunca bekleme süresi verilir', async function(){
      temiz();
      Q.setOverride('openrouter', { rpm:2, rpd:1000 });
      const eff = Q.effective(cfg);
      for(let i = 0; i < eff.rpm; i++){ await Q.acquire(cfg); Q.release(cfg); }
      const st = Q.check(cfg);
      expect(st.ok).toBeFalsy();
      expect(st.waitMs).toBeGreaterThan(0);
      temiz();
    });

    it('günlük hak dolunca bekleme değil RET döner', async function(){
      /* Ayrım önemli: dakikalık hak beklenir, günlük hak beklenmez —
         gün dolduysa "üç saniye sonra dene" demek yanlış olur. */
      temiz();
      Q.setOverride('openrouter', { rpm:100, rpd:1 });
      expect(Q.check(cfg).ok).toBeTruthy();
      /* `acquire` günü tüketir; `release` yalnızca istek HİÇ
         gönderilmediyse geri alır, o yüzden burada çağrılmaz. */
      await Q.acquire(cfg);
      const st = Q.check(cfg);
      expect(st.ok).toBeFalsy();
      expect(st.reason).toBe('daily');
      expect(st.waitMs).toBe(0);
      temiz();
    });

    it('durum raporu sayıları söyler', function(){
      temiz();
      const st = Q.status(cfg);
      expect(st).toBeTruthy();
      temiz();
    });
  });

})();
