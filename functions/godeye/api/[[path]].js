import {normalizeRadioBrowserStation,publicRadioStation} from '../../_lib/godeye/radioBrowser.js';
// Fixed upstreams only: this is deliberately not an arbitrary URL proxy.
const groups = new Set('stations visual gps-ops glo-ops galileo geo starlink resource weather planet sar science active'.split(' '));
const json = (body, status = 200, headers = {}) => Response.json(body, {status, headers: {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const unavailable = (name) => json({configured:false,unavailable:true,retryable:false,code: `${name.toUpperCase()}_NOT_CONFIGURED`,error:'This provider is not configured on this hosted instance.'});

async function upstream(context, target, ttl=60, extra={}) {
  const key = new Request(target, {method:'GET'});
  const cache = caches.default;
  const hit = await cache.match(key);
  if (hit) return hit;
  const headers={Accept:target.includes('celestrak.org')?'*/*':'application/json','User-Agent':'FatedreelGodEye/1.0 (https://fatedreel.com/godeye/)'};
  if(target.includes('digitraffic.fi')){headers['Digitraffic-User']='fatedreel-godeye';headers.Accept=target.endsWith('.jpg')?'image/jpeg':'application/json';}
  const res = await fetch(target, {headers, signal:AbortSignal.timeout(18000), redirect:'manual'});
  if (!res.ok) return json({error:'Upstream temporarily unavailable',status:res.status},res.status===429?429:502,{'Retry-After':'60'});
  const out = new Response(res.body,{headers:{'Content-Type':res.headers.get('content-type')||'application/json','Cache-Control':`public, max-age=${ttl}`,'X-Content-Type-Options':'nosniff',...extra}});
  context.waitUntil(cache.put(key,out.clone()));
  return out;
}

export async function onRequest(context) {
  const {request} = context;
  const url = new URL(request.url);
  const path = url.pathname.slice('/godeye/api/'.length);
  if (request.headers.get('Origin') && request.headers.get('Origin')!==url.origin) return json({error:'Same-origin requests only'},403);
  if (request.method!=='GET') return json({error:'Method not supported on this hosted instance'},405);
  try {
    if(path==='health') return json({ok:true,mode:'keyless-cloudflare',source:'bilawalsidhu/gods-eye-view',features:['globe','terrain','flights','military','satellites','earthquakes','launches','search'],optionalProviders:'API keys and local receiver features are not configured.'});
    if(path.startsWith('setup/')) return json({error:'Provider settings are available only in local installations'},404);
    if(path==='military') return await upstream(context,'https://api.adsb.lol/v2/mil',15,{'X-Feed-Source':'adsb.lol'});
    if(path==='flights') {
      try {
        const globalFeed=await upstream(context,'https://opensky-network.org/api/states/all',60,{'X-Flight-Source':'OpenSky Network','X-Flight-Coverage':'worldwide upstream snapshot','X-OpenSky-Auth':'anon'});
        if(globalFeed.ok)return globalFeed;
      }catch{}
      let lat=Number(url.searchParams.get('lat')??41.01),lon=Number(url.searchParams.get('lon')??28.97);
      if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180) return json({error:'Invalid coordinates'},400);
      lat=Math.round(lat*2)/2;lon=Math.round(lon*2)/2;
      const res=await upstream(context,`https://api.adsb.lol/v2/lat/${lat}/lon/${lon}/dist/250`,15);
      if(!res.ok)return res;
      const feed=await res.json();
      const now=Number(feed.now)||Date.now()/1000;
      const states=(feed.ac||[]).filter(a=>Number.isFinite(a.lat)&&Number.isFinite(a.lon)).map(a=>[
        a.hex,a.flight||'',null,now-(a.seen_pos||0),now-(a.seen||0),a.lon,a.lat,
        Number.isFinite(a.alt_baro)?a.alt_baro*0.3048:null,a.alt_baro==='ground',
        Number.isFinite(a.gs)?a.gs*0.514444:null,a.track??a.true_heading??null,
        Number.isFinite(a.baro_rate)?a.baro_rate*0.00508:null,null,
        Number.isFinite(a.alt_geom)?a.alt_geom*0.3048:null,a.squawk||null,false,0,null
      ]);
      return json({time:now,states},200,{'X-Flight-Source':'adsb.lol','X-Flight-Coverage':'250 nautical miles around current view','Cache-Control':'public,max-age=15'});
    }
    if(path.startsWith('celestrak/')||path.startsWith('celestrak-satcat/')) {
      const [kind,group]=path.split('/');
      if(!groups.has(group))return json({error:'Unknown satellite group'},400);
      const target=kind==='celestrak'?`https://celestrak.org/NORAD/elements/gp.php?GROUP=${group}&FORMAT=tle`:`https://celestrak.org/satcat/records.php?GROUP=${group}&FORMAT=CSV`;
      return await upstream(context,target,21600);
    }
    if(path==='launches') return await upstream(context,'https://ll.thespacedevs.com/2.3.0/launches/upcoming/?limit=100&mode=detailed',1800);
    if(path==='radio/stations') {
      const res=await upstream(context,'https://de1.api.radio-browser.info/json/stations/search?has_geo_info=true&hidebroken=true&order=clickcount&reverse=true&limit=2000',3600);
      if(!res.ok)return res;
      const stations=(await res.json()).map(row=>normalizeRadioBrowserStation(row)).filter(Boolean).slice(0,750).map(publicRadioStation);
      return json({stations,updatedAt:new Date().toISOString(),stale:false,degraded:false,degradedReason:null,coverage:'Community directory',acceptedGeneration:1,catalogInstance:'fatedreel-keyless-v1',rejectedStationCount:0});
    }
    if(path==='cctv/health')return json({cameras:[]});
    if(path==='cctv/sources') {
      const res=await upstream(context,'https://tie.digitraffic.fi/api/weathercam/v1/stations',3600);
      if(!res.ok)return res;
      const data=await res.json();const sources=[];
      for(const f of data.features||[]) {
        const p=f.properties||{},[lon,lat]=f.geometry?.coordinates||[];
        if(!Number.isFinite(lat)||!Number.isFinite(lon))continue;
        for(const preset of p.presets||[]) {
          if(preset.inCollection!==true||!/^C\d{7}$/.test(preset.id))continue;
          sources.push({id:`fi-${preset.id.toLowerCase()}`,pack:'fintraffic',name:p.name||preset.id,city:'Finland',cityId:'finland',provider:'Fintraffic',lat,lon,headingDeg:0,headingConfidence:'low',pitchDeg:-18,fovDeg:44,rangeM:145,mountHeightM:8,groundElevationM:0,feedType:'image',sourceKind:'fintraffic-open-data',frameRefreshMs:60000,accuracyM:100,poseSource:'estimated',license:'Fintraffic / digitraffic.fi (CC BY 4.0)'});
          if(sources.length>=500)break;
        }
        if(sources.length>=500)break;
      }
      return json({sources,trimmedPacks:[]});
    }
    if(/^cctv\/frame\/fi-c\d{7}$/.test(path)) {
      const id=path.split('/').at(-1).slice(3).toUpperCase();
      return await upstream(context,`https://weathercam.digitraffic.fi/${id}.jpg`,60,{'X-CCTV-Source':'upstream-image'});
    }
    if(path==='geocode/status') return json({configured:false});
    if(path==='overpass/status') return json({configured:false});
    if(path==='google-places/status'||path==='google-geocode/status')return json({configured:false});
    if(path==='vessels'||path.startsWith('vessels/'))return unavailable('ais');
    if(path.startsWith('flights/')||path.startsWith('military/'))return json({error:'Historical track unavailable'},503);
    return unavailable(path.split('/')[0].replace(/[^a-z0-9_-]/gi,''));
  } catch(error) {return json({error:'Data provider temporarily unavailable'},502,{'Retry-After':'60'});}
}

