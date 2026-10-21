const JSON_HEADERS = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json = (data,status=200) => new Response(JSON.stringify(data),{status,headers:JSON_HEADERS});
// General discovery is first. Extra searches improve recall across different place types;
// they never define which categories may be recommended.
export const QUERIES = ['işletmeler','yakındaki yerler','kuaför berber güzellik salonu','masaj spa hamam','restoran kafe','mağaza alışveriş','spor eğlence kültür','hizmet tamir atölye','eczane sağlık kliniği','otel konaklama'];
const RADII = [50,100,250,500];

import {distanceMeters,describePlace,eligiblePlaces} from '../../o6/domain.js';
export {distanceMeters,describePlace,eligiblePlaces};

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
  const cacheUrl=new URL(url.origin+'/api/o6-cache-all-places-v3');
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
  return json({scope:'all_places',center,radius,minRating:4.5,minReviews:100,places,source,updatedAt,queriesOk,queriesTotal:QUERIES.length,examined:new Set(candidates.map(p=>p.id)).size,partial:source==='snapshot'||queriesOk<QUERIES.length});
}
