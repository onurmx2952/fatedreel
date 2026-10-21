export function distanceMeters(a,b) {
  const rad = Math.PI/180, dLat=(b.lat-a.lat)*rad, dLng=(b.lng-a.lng)*rad;
  const h=Math.sin(dLat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLng/2)**2;
  return 6371008.8*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));
}

export function describePlace(p) {
  const t=(p.name+' '+p.category).toLocaleLowerCase('tr-TR');
  if(/ofisi|genel merkez|toptancı|tedarikçi/.test(t)) return null;
  if(/mantı|mantici/.test(t)) return {group:'food',action:'Burada mantı ye.',kind:'Mantı molası'};
  if(/bilardo/.test(t)) return {group:'activity',action:'Bir el bilardo oyna.',kind:'Oyun zamanı'};
  if(/bowling/.test(t)) return {group:'activity',action:'Bir tur bowling oyna.',kind:'Oyun zamanı'};
  if(/japon pazar/.test(t)) return {group:'shop',action:'Japon pazarına uğra.',kind:'Küçük keşifler'};
  if(/telefon|aksesuar|elektronik|cep telefonu/.test(t)) return {group:'shop',action:'Aksesuarlara göz at.',kind:'Alışveriş molası'};
  if(/kitap|sahaf/.test(t)) return {group:'shop',action:'Raflarda biraz kaybol.',kind:'Yeni bir kitap'};
  if(/müze|sanat galeri|sergi/.test(t)) return {group:'activity',action:'İçeri gir, keşfet.',kind:'Biraz kültür'};
  if(/sinema|tiyatro|eğlence|oyun salon|escape|kaçış|atölye/.test(t)) return {group:'activity',action:'Burada bir şeyler yap.',kind:'Planı değiştir'};
  if(/kahve|coffee|kafe|cafe|café|caffe|starbucks|tchibo/.test(t)) return {group:'food',action:'Bir kahve molası ver.',kind:'Kahve zamanı'};
  if(/tatlı|pastane|pastanesi|dondurma|çikolata|baklava|pasta|waffle|künefe/.test(t)) return {group:'food',action:'Kendine bir tatlı ısmarla.',kind:'Tatlı bir mola'};
  if(/restoran|lokanta|burger|pizza|kebap|döner|büfe|tost|yemek|mado|fırın|kahvaltı|meyhane|pub|bar\b/.test(t)) return {group:'food',action:'Burada bir şeyler ye.',kind:'Sofraya otur'};
  if(/mağaza|market|pazar|hediye|butik|alışveriş|giyim|çiçek|oyuncak|plak/.test(t)) return {group:'shop',action:'Şuraya bir göz at.',kind:'Yol üstü keşif'};
  return null;
}

export function eligiblePlaces(places,center,radius) {
  const unique=new Map();
  for(const p of places) {
    if(!p || !Number.isFinite(p.lat)||!Number.isFinite(p.lng)||!Number.isFinite(p.rating)||!Number.isInteger(p.reviews))continue;
    if(p.rating<4.5||p.rating>5||p.reviews<100)continue;
    const distance=distanceMeters(center,p);
    if(distance>radius)continue;
    const suggestion=describePlace(p);
    if(!suggestion)continue;
    const value={...p,...suggestion,distance,walkMinutes:Math.max(1,Math.ceil(distance/75))};
    unique.set(p.id||p.name+'|'+p.lat+'|'+p.lng,value);
  }
  return [...unique.values()].sort((a,b)=>a.distance-b.distance||b.rating-a.rating||b.reviews-a.reviews);
}

