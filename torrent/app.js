const $ = id => document.getElementById(id);
const form=$('controls'), dialog=$('detail');
const number = value => new Intl.NumberFormat('tr-TR').format(value);
const date = value => new Intl.DateTimeFormat('tr-TR',{timeZone:'Europe/Istanbul',day:'numeric',month:'short',year:'numeric'}).format(new Date(value*1000));
const labels={1:'Müzik / ses',2:'Video',3:'Yazılım',4:'Oyun',6:'Diğer'};
const periodLabels={day:'Bugün',week:'Son 7 gün',month:'Son 30 gün'};
const categoryName=item=>labels[Math.floor(item.category/100)]||'Diğer';
const size = bytes => {if(!bytes)return '0 B';const i=Math.min(4,Math.floor(Math.log(bytes)/Math.log(1024)));return `${(bytes/1024**i).toLocaleString('tr-TR',{maximumFractionDigits:1})} ${['B','KB','MB','GB','TB'][i]}`;};
const magnet=item=>`magnet:?xt=urn:btih:${item.hash}&dn=${encodeURIComponent(item.name)}&tr=${encodeURIComponent('udp://tracker.opentrackr.org:1337/announce')}&tr=${encodeURIComponent('udp://open.stealth.si:80/announce')}`;
const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
let items=[],busy=false,detailVersion=0,currentMagnet='';
const metadataCache=new Map();
function metadata(item){
  const key=item.imdb||item.name;
  if(!metadataCache.has(key))metadataCache.set(key,api({action:'detail',imdb:item.imdb,title:item.name,type:'movie'}).then(data=>data.meta).catch(()=>{metadataCache.delete(key);return null;}));
  return metadataCache.get(key);
}
async function api(data){const response=await fetch('/api/torrent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(25000)});const body=await response.json();if(!response.ok)throw Error(body.error||'Veri alınamadı.');return body;}
function status(title,description,error=false){const el=$('status');el.hidden=false;el.classList.toggle('error',error);el.replaceChildren(node('div','empty-mark',error?'!':'◎'),node('h3','',title),node('p','',description));}
form.addEventListener('input',()=>{if(!busy)$('filter-hint').textContent='Filtreler hazır. Uygulamak için Listeyi getir’e bas.';});
form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;busy=true;
  const period=form.elements.period.value,query=$('query').value.trim(),category=$('category').value;
  const selectedCategory=$('category').selectedOptions[0].textContent;
  $('fetch').disabled=true;$('fetch').classList.add('busy');$('fetch-label').textContent='Taranıyor…';$('list').replaceChildren();$('source-note').hidden=true;
  $('result-count').textContent='Kaynak taranıyor';status('Radar tarıyor…','Kaynak listeleri getiriliyor ve paylaşan sayısına göre sıralanıyor.');
  try{
    const data=await api({action:'list',period,query,category});items=data.items;
    $('results-title').textContent=`${periodLabels[period]} · İlk 20`;
    $('result-count').textContent=`${items.length} torrent bulundu`;
    if(!items.length)status('Bu filtrelerle sonuç bulunamadı.','Dönemi genişletmeyi veya farklı bir arama yapmayı dene. Kaynak tüm torrentleri kapsamaz.');
    else{$('status').hidden=true;render();}
    const time=new Intl.DateTimeFormat('tr-TR',{timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(data.fetchedAt));
    $('source-note').textContent=`${query?`“${query}” · `:''}${periodLabels[period]} · ${selectedCategory} · APIBay · ${number(data.scanned)} benzersiz torrent tarandı · ${time} (Türkiye). ${data.scope} ${data.partial?`Bazı kaynak listeleri alınamadı (${data.sources}/${data.totalSources}); sonuçlar eksik olabilir. `:''}${items.length<20?'Bu kapsamda 20’den az eşleşme var. ':''}İndirme sayısı değildir. Kaynak önbelleği nedeniyle sayılar gecikmeli olabilir.`;
    $('source-note').hidden=false;
    $('filter-hint').textContent='Tarama tamamlandı. Yeniden taramak için Listeyi getir’e bas.';
  }catch(error){items=[];$('result-count').textContent='Tarama tamamlanamadı';status('Kaynağa ulaşılamadı.',error.name==='TimeoutError'?'Kaynak zamanında yanıt vermedi. Yeniden dene.':error.message,true);$('filter-hint').textContent='Ayarların korundu. Listeyi getir ile yeniden deneyebilirsin.';}
  finally{busy=false;$('fetch').disabled=false;$('fetch').classList.remove('busy');$('fetch-label').textContent='Listeyi getir';}
});
function render(){const fragment=document.createDocumentFragment();items.forEach((item,index)=>{
  const row=node('article','torrent-row');row.append(node('span','rank',String(index+1).padStart(2,'0')));
  const thumbnail=node('button','thumbnail',Math.floor(item.category/100)===2?'▻':'◇');thumbnail.type='button';thumbnail.setAttribute('aria-label',`${item.name} detayları`);thumbnail.addEventListener('click',()=>openDetail(item));
  const title=node('div','row-title'),button=node('button','torrent-name',item.name);button.type='button';button.addEventListener('click',()=>openDetail(item));title.append(button,node('div','row-meta',`${categoryName(item)} · ${date(item.added)} · ${size(item.size)}`));
  const rating=node('div','imdb-rating',Math.floor(item.category/100)===2?'IMDb · yükleniyor…':'IMDb · uygulanmaz');title.append(rating);
  row._metadata={thumbnail,rating,item};
  const peers=node('div','peers');peers.append(node('b','',number(item.seeders)),node('small','','paylaşan'),node('small','',`${number(item.leechers)} indiren`));
  const bytes=node('div','size',size(item.size));bytes.append(node('small','',item.files?`${number(item.files)} dosya`:'Dosya sayısı yok'));
  const link=node('a','magnet','İndir');link.href=magnet(item);link.setAttribute('aria-label',`${item.name} magnet ile indir`);link.title='Torrent uygulamasında aç';
  row.append(thumbnail,title,peers,bytes,link);fragment.append(row);
});$('list').replaceChildren(fragment);enrichRows([...$('list').children]);}
async function enrichRows(rows){
  const queue=rows.filter(row=>Math.floor(row._metadata.item.category/100)===2);
  await Promise.all(Array.from({length:Math.min(4,queue.length)},async()=>{
    while(queue.length){const row=queue.shift();if(!row.isConnected)continue;
      const {item,thumbnail,rating}=row._metadata,meta=await metadata(item);if(!row.isConnected)continue;
      rating.textContent=meta?.rating?`IMDb ${meta.rating} / 10`:'IMDb · puan bulunamadı';rating.classList.toggle('rated',Boolean(meta?.rating));
      if(meta?.poster){const img=node('img');img.alt=`${meta.name||item.name} afişi`;img.referrerPolicy='no-referrer';img.addEventListener('error',()=>{thumbnail.replaceChildren(node('span','','▻'));thumbnail.title='Görsel bulunamadı';},{once:true});img.src=meta.poster;thumbnail.replaceChildren(img);}else thumbnail.title='Görsel bulunamadı';
    }
  }));
}
function fallbackArt(item){$('art').replaceChildren();const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('aria-hidden','true');svg.innerHTML='<rect x="16" y="12" width="68" height="76" rx="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M30 12v76M70 12v76M16 30h14m-14 20h14m-14 20h14m40-40h14M70 50h14M70 70h14M44 38l17 12-17 12z" fill="none" stroke="currentColor" stroke-width="2"/>';$('art').append(svg,node('span','',categoryName(item)),node('span','','Görsel bulunamadı'));}
async function openDetail(item){
  const version=++detailVersion,hasVideo=Math.floor(item.category/100)===2;currentMagnet=magnet(item);$('detail-title').textContent=item.name;$('detail-category').textContent=categoryName(item);$('release-name').textContent='';$('description').textContent='';$('copy-status').textContent='';$('metadata-state').textContent=hasVideo?'Film bilgileri alınıyor…':'Bu torrent için film görseli bulunmuyor.';
  $('detail-magnet').href=currentMagnet;$('source-link').href=`https://thepiratebay.org/description.php?id=${item.id}`;$('info-hash').textContent=`Info hash: ${item.hash}`;fallbackArt(item);
  const facts=[['Paylaşan (seeder)',number(item.seeders)],['İndiren (leecher)',number(item.leechers)],['Boyut',size(item.size)],['Dosya sayısı',item.files?number(item.files):'Kaynak belirtmiyor'],['Eklenme tarihi',date(item.added)],['Yükleyen',item.uploader]];
  $('facts').replaceChildren(...facts.map(([key,value])=>{const fact=node('div','fact');fact.append(node('small','',key),node('span','',value));return fact;}));
  dialog.showModal();
  if(!hasVideo)return;
  try{const meta=await metadata(item);if(version!==detailVersion||!dialog.open)return;if(!meta){$('metadata-state').textContent='Ek bilgi bulunamadı.';return;}
    $('detail-title').textContent=meta.name||item.name;$('release-name').textContent=item.name;$('description').textContent=meta.description||'Açıklama bulunamadı.';$('metadata-state').textContent=[meta.year,meta.rating?`IMDb ${meta.rating}`:'',meta.genres.join(' / ')].filter(Boolean).join(' · ');
    if(meta.poster){const img=node('img');img.alt=`${meta.name||item.name} afişi`;img.referrerPolicy='no-referrer';img.addEventListener('error',()=>{if(version===detailVersion)fallbackArt(item);},{once:true});img.src=meta.poster;$('art').replaceChildren(img);}
  }catch{if(version===detailVersion)$('metadata-state').textContent='Ek bilgi alınamadı. Torrent bilgileri ve magnet bağlantısı kullanılabilir.';}
}
$('close-detail').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>detailVersion++);
dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
$('copy-magnet').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(currentMagnet);$('copy-status').textContent='Magnet bağlantısı kopyalandı.';}catch{$('copy-status').textContent='Kopyalanamadı. Magnet ile indir bağlantısını kullanabilirsin.';}});
