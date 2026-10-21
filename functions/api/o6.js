const JSON_HEADERS = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json = (data,status=200) => new Response(JSON.stringify(data),{status,headers:JSON_HEADERS});
const QUERIES = ['restoran mantı','kafe kahve tatlı','bilardo bowling eğlence','telefon aksesuar mağaza','japon pazarı alışveriş','müze sanat kitapçı'];
const RADII = [50,100,250,500];

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

export function parseMapResponse(text) {
  const data=JSON.parse(text.replace(/^\)\]\}'\s*/,''));
  const found=new Map();
  function walk(value) {
    if(!Array.isArray(value))return;
    if(typeof value[11]==='string'&&Array.isArray(value[9])&&typeof value[9][2]==='number'&&typeof value[10]==='string'&&value[10].startsWith('0x')) {
      const id=value[78]||value[10];
      let photo=value[37]?.[0]?.[0]?.[6]?.[0]||value[72]?.[0]?.[0]?.[6]?.[0]||'';
      if(typeof photo!=='string'||!/^https:\/\/lh\d\.(googleusercontent|ggpht)\.com\//.test(photo))photo='';
      if(photo)photo=photo.replace(/=w\d+-h\d+.*$/,'=w800-h600-k-no');
      const category=Array.isArray(value[13])?value[13].filter(x=>typeof x==='string').join(' · '):'';
      const name=value[11];
      found.set(id,{id,name,category,lat:value[9][2],lng:value[9][3],rating:Number(value[4]?.[7]||0),reviews:Number(value[4]?.[8]||0),address:value[39]||value[18]||'',photo,phone:value[178]?.[0]?.[0]||'',mapsUrl:'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(name)+'&query_place_id='+encodeURIComponent(id)});
      return;
    }
    for(const item of value)walk(item);
  }
  walk(data);
  return [...found.values()];
}

// Public Maps search request observed in the current web client. No browser keys or paid APIs.
// The upstream format can change; responses are validated and the dated local index is a fallback.
import {MAP_TEMPLATE} from '../../o6/map-request.js';
async function searchMap(query,lat,lng) {
  const pb=MAP_TEMPLATE.replace('!1srestoran','!1s'+query).replace('!1d1530.5319856960798','!1d1100').replace('!2d32.8785','!2d'+lng).replace('!3d39.8952','!3d'+lat);
  const url=new URL('https://www.google.com/search');
  url.search=new URLSearchParams({tbm:'map',authuser:'0',hl:'tr',gl:'tr',q:query,pb}).toString();
  const response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0','Accept-Language':'tr-TR,tr;q=0.9'},signal:AbortSignal.timeout(14000)});
  if(!response.ok)throw new Error('upstream');
  const text=await response.text();
  if(text.length>5000000||!text.startsWith(")]}'"))throw new Error('format');
  return parseMapResponse(text);
}

export async function onRequest({request,env,waitUntil}) {
  if(request.method!=='GET')return json({error:'GET gerekli.'},405);
  const url=new URL(request.url);
  if(url.searchParams.get('mode')==='geocode') {
    const q=(url.searchParams.get('q')||'').trim();
    if(q.length<3||q.length>160)return json({error:'En az 3, en fazla 160 karakter gir.'},400);
    try {
      const endpoint=new URL(env.O6_GEOCODER_URL||'https://photon.komoot.io/api/');
      endpoint.search=new URLSearchParams({q,limit:'5',lang:'en'}).toString();
      const response=await fetch(endpoint,{headers:{'User-Agent':'FatedReelO6/1.0 (https://fatedreel.com/o6/)'},cf:{cacheTtl:86400,cacheEverything:true},signal:AbortSignal.timeout(9000)});
      if(!response.ok)throw new Error();
      const items=await response.json();
      return json({items:items.features.map(x=>({name:[x.properties.name,x.properties.street,x.properties.city,x.properties.state,x.properties.country].filter(Boolean).join(', '),lat:x.geometry.coordinates[1],lng:x.geometry.coordinates[0]}))});
    }catch{return json({error:'Adres araması şu an yanıt vermiyor. Haritaya dokunarak konum seçebilirsin.'},502)}
  }
  const latText=url.searchParams.get('lat'),lngText=url.searchParams.get('lng');
  const lat=Number(latText),lng=Number(lngText),radius=Number(url.searchParams.get('radius')||100);
  if(latText===null||lngText===null||latText.trim()===''||lngText.trim()===''||!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180||!RADII.includes(radius))return json({error:'Geçerli bir konum ve 50, 100, 250 veya 500 metre seç.'},400);
  const center={lat,lng};
  const cacheUrl=new URL(url.origin+'/api/o6-cache');
  cacheUrl.search=new URLSearchParams({lat:lat.toFixed(4),lng:lng.toFixed(4)}).toString();
  const cache=globalThis.caches?.default;
  let candidates=[],source='live',updatedAt=new Date().toISOString(),queriesOk=0;
  const cached=cache?await cache.match(cacheUrl.toString()):null;
  if(cached){const value=await cached.json();candidates=value.places;updatedAt=value.updatedAt;queriesOk=value.queriesOk;}
  else {
    const results=await Promise.allSettled(QUERIES.map(q=>searchMap(q,lat,lng)));
    for(const result of results)if(result.status==='fulfilled'){queriesOk++;candidates.push(...result.value)}
    if(candidates.length&&cache){const value=new Response(JSON.stringify({places:candidates,updatedAt,queriesOk}),{headers:{'Content-Type':'application/json','Cache-Control':'public,max-age=600'}});waitUntil?.(cache.put(cacheUrl.toString(),value));}
  }
  if(!candidates.length) {
    try {
      const asset=await env.ASSETS.fetch(new Request(url.origin+'/o6/places.json'));
      if(!asset.ok)throw new Error();
      const snapshot=await asset.json();
      candidates=snapshot.places;updatedAt=snapshot.updatedAt;source='snapshot';
    }catch{return json({error:'Yer verisi şu an alınamıyor. Biraz sonra tekrar dene.'},503)}
  }
  const places=eligiblePlaces(candidates,center,radius);
  return json({center,radius,minRating:4.5,minReviews:100,places,source,updatedAt,queriesOk,queriesTotal:QUERIES.length,examined:new Set(candidates.map(p=>p.id)).size,partial:source==='snapshot'||queriesOk<QUERIES.length});
}
