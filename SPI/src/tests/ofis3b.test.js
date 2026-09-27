(function(){
  const {describe,it,expect}=SP.Test;
  describe('SPİ 3B kampüs sınırı',()=>{
    it('sahne kadrosu beş gerçek agentı birer kez içerir',()=>{
      const people=SP.Ofis3B.kadro();
      expect(people.map(a=>a.id)).toEqual(['lab','nutri','move','money','patron']);
      expect(people.every(a=>SP.AGENTS.includes(a))).toBe(true);
    });
    it('sağlık metni ve ham belge sahneye aktarılmaz',()=>{
      expect(SP.Ofis3B.devirler([{id:'h1',from:'lab',to:'nutri',value:123,document:'private',text:'private'}]))
        .toEqual([{id:'h1',from:0,to:1}]);
    });
    it('bilinmeyen, aynı masaya veya kimliksiz devir reddedilir',()=>{
      expect(SP.Ofis3B.devirler([null,{id:'x',from:'unknown',to:'lab'},{id:'y',from:'lab',to:'lab'},{from:'lab',to:'nutri'}])).toEqual([]);
      expect(SP.Ofis3B.devirler(null)).toEqual([]);
    });
    it('3B başlangıçta kapalıdır ve ağır motor yüklenmez',()=>{
      expect(SP.Ofis3B.aktif()).toBe(false);
      expect(SP.Ofis3B.durum()).toBeNull();
      expect(document.querySelector('script[src="ofis3d/three-0.160.1.min.js"]')).toBeNull();
    });
  });
})();
