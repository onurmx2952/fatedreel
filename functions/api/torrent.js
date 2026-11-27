const CATEGORIES = [100,101,102,104,199,200,201,202,207,209,211,299,300,301,302,400,401,600,601];
export function isSeries(item) {
  if (Math.floor(Number(item.category)/100)!==2) return false;
  return [205,208,212].includes(Number(item.category)) || /\b(?:s\d{1,3}(?:[ ._-]*e\d{1,3})?|\d{1,2}x\d{2,3}|season[ ._-]*\d+|episode[ ._-]*\d+|complete[ ._-]*(?:series|seasons?)|mini[ ._-]*series)\b|\b\d+[ ._-]*(?:sezon|bölüm)\b/i.test(String(item.name||''));
}
const HEADERS = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json = (body,status=200) => new Response(JSON.stringify(body),{status,headers:HEADERS});
async function upstream(url) {
  const response = await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(14000)});
  if (!response.ok) throw new Error(`Source HTTP ${response.status}`);
  return response.json();
}
export function normalize(item) {
  const hash = String(item.info_hash || '');
  if (!/^[a-f0-9]{40}$/i.test(hash) || !/^\d+$/.test(String(item.id))) return null;
  const category = Number(item.category);
  if ((category >= 500 && category < 600) || isSeries(item)) return null;
  const number = value => Math.max(0,Number(value)||0);
  return {id:String(item.id),hash:hash.toUpperCase(),name:String(item.name||'İsimsiz torrent').slice(0,600),
    seeders:number(item.seeders),leechers:number(item.leechers),size:number(item.size),files:number(item.num_files),
    added:number(item.added),category,uploader:String(item.username||'Bilinmiyor').slice(0,100),
    status:String(item.status||'member'),imdb:/^tt\d{6,12}$/.test(String(item.imdb))?item.imdb:null};
}
export function rank(items, period, now = Date.now(), category = 'all') {
  const day = 86400000;
  // Today means midnight in Turkey; week/month are rolling windows.
  const start = period === 'day' ? Math.floor((now+10800000)/day)*day-10800000 : now-(period==='week'?7:30)*day;
  const unique = new Map();
  for (const raw of items) {
    const item = normalize(raw);
    if (!item || item.added*1000<start || item.added*1000>now || (category!=='all' && Math.floor(item.category/100)!==Number(category))) continue;
    const previous = unique.get(item.hash);
    if (!previous || previous.seeders<item.seeders) unique.set(item.hash,item);
  }
  return [...unique.values()].sort((a,b)=>b.seeders-a.seeders || b.leechers-a.leechers || b.added-a.added).slice(0,20);
}
export async function onRequestPost({request}) {
  try {
    if (Number(request.headers.get('content-length'))>4096) return json({error:'İstek çok büyük.'},413);
    const input = await request.json();
    if (input.action === 'detail') {
      if (input.type==='series' || isSeries({category:200,name:input.title})) return json({meta:null});
      const type = 'movie';
      let imdb = input.imdb;
      if (!/^tt\d{6,12}$/.test(imdb||'')) {
        const title=String(input.title||'').slice(0,180).replace(/[._]/g,' ').split(/\b(?:s\d{1,2}(?:e\d{1,3})?|(?:19|20)\d{2}|2160p|1080p|720p|480p|WEB|BluRay|HDTV)\b/i)[0].replace(/\[[^\]]*\]/g,'').trim();
        if (title.length<2) return json({meta:null});
        const search=await upstream(`https://v3-cinemeta.strem.io/catalog/${type}/top/search=${encodeURIComponent(title)}.json`);
        const simplify=value=>String(value||'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
        const matched=(search.metas||[]).find(x=>simplify(x.name)===simplify(title));
        if (!matched || !/^tt\d{6,12}$/.test(matched.id)) return json({meta:null});
        imdb=matched.id;
      }
      const data = await upstream(`https://v3-cinemeta.strem.io/meta/${type}/${imdb}.json`);
      const meta = data.meta;
      if (!meta) return json({meta:null});
      const safeImage = url => {try {const parsed=new URL(url); return parsed.protocol==='https:'?parsed.href:null;} catch {return null;}};
      return json({meta:{name:String(meta.name||''),description:String(meta.description||'').slice(0,6000),poster:safeImage(meta.poster),year:String(meta.releaseInfo||''),rating:String(meta.imdbRating||''),genres:Array.isArray(meta.genres)?meta.genres.slice(0,8):[]}});
    }
    const period = input.period || 'week';
    const category = String(input.category||'all');
    if (!['day','week','month'].includes(period) || !['all','1','2','3','4','6'].includes(category)) return json({error:'Geçersiz filtre.'},400);
    const query = String(input.query||'').trim();
    if (query.length>100) return json({error:'Arama en fazla 100 karakter olabilir.'},400);
    const urls = query ? [`https://apibay.org/q.php?q=${encodeURIComponent(query)}&cat=${category==='all'?'0':Number(category)*100}`] :
      ['all','recent',...CATEGORIES.filter(c=>category==='all'||Math.floor(c/100)===Number(category))].map(c=>`https://apibay.org/precompiled/data_top100_${c}.json`);
    const results = await Promise.allSettled(urls.map(upstream));
    const batches = results.filter(r=>r.status==='fulfilled'&&Array.isArray(r.value));
    if (!batches.length) return json({error:'Torrent kaynağına şu anda ulaşılamıyor. Biraz sonra yeniden deneyin.'},502);
    const raw = batches.flatMap(r=>r.value);
    const valid = new Set(raw.map(normalize).filter(Boolean).map(x=>x.hash)).size;
    return json({items:rank(raw,period,Date.now(),category),fetchedAt:new Date().toISOString(),scanned:valid,
      sources:batches.length,totalSources:urls.length,partial:batches.length!==urls.length,
      scope:query?'Kaynağın döndürdüğü en fazla 100 arama sonucu içinden.':'Kaynağın kategori ilk 100 listeleri ve son eklenenler içinden.',source:'APIBay'});
  } catch (error) {
    return json({error:error instanceof SyntaxError?'Geçersiz istek.':'Kaynak yanıt vermedi. Yeniden deneyin.'},error instanceof SyntaxError?400:502);
  }
}
export const onRequestGet = () => json({error:'Veri çekmek için sayfadaki Listeyi getir düğmesini kullanın.'},405);
