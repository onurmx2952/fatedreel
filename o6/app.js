import {eligiblePlaces} from './domain.js?v=3';
const $=id=>document.getElementById(id);
const icon=name=>`<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const escape=text=>String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=new Intl.NumberFormat('tr-TR');
const state={center:null,radius:100,group:'all',places:[],data:null,loading:false,request:0,controller:null,accuracy:0,locationIntent:0};
const defaultCenter={lat:39.8952,lng:32.8785};
const markerLayers=[];
let map,pickerMap,centerMarker,rangeCircle,draftMarker,draftCircle,draft={...defaultCenter};
const centerIcon=()=>L.divIcon({className:'',html:'<span class="center-dot"></span>',iconSize:[20,20],iconAnchor:[10,10]});
const tileLayer=()=>L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'});

function feedback(message,type=''){$('feedback').textContent=message;$('feedback').className='feedback '+type;$('feedback').hidden=!message;}
function initMap(){
  if(!window.L){feedback('Harita yüklenemedi. Sayfayı yenileyebilir veya konum düğmesiyle arama yapabilirsin.','error');return;}
  map=L.map('map',{scrollWheelZoom:false,zoomControl:true}).setView([defaultCenter.lat,defaultCenter.lng],17);
  tileLayer().addTo(map);
  map.on('click',event=>openPicker(event.latlng));
  if(window.matchMedia('(max-width:850px)').matches)$('mobileMapAnchor').append($('mapPanel'));
  new ResizeObserver(()=>map.invalidateSize()).observe($('map'));
}
function syncMap(){
  if(!map||!state.center)return;
  const point=[state.center.lat,state.center.lng];
  if(centerMarker)centerMarker.setLatLng(point);else centerMarker=L.marker(point,{icon:centerIcon(),zIndexOffset:1000}).addTo(map).bindTooltip('Seçtiğin başlangıç noktası');
  if(rangeCircle)rangeCircle.setLatLng(point).setRadius(state.radius);else rangeCircle=L.circle(point,{radius:state.radius,color:'#d94723',weight:1.5,fillColor:'#d94723',fillOpacity:.065,dashArray:'5 6'}).addTo(map);
  map.fitBounds(rangeCircle.getBounds(),{padding:[32,32],maxZoom:18,animate:!matchMedia('(prefers-reduced-motion:reduce)').matches});
  $('mapLabel').textContent='Keşif alanın';
  $('radiusTag').textContent=state.radius+' m yarıçap';
  $('mapHint').textContent='İşaretin çevresinde '+state.radius+' metre.';
  $('coordinates').textContent=state.center.lat.toFixed(4)+'° · '+state.center.lng.toFixed(4)+'°';
}
function updateMarkers(places){
  if(!map)return;
  markerLayers.forEach(layer=>map.removeLayer(layer));markerLayers.length=0;
  places.forEach((p,i)=>{
    const m=L.marker([p.lat,p.lng],{icon:L.divIcon({className:'',html:`<div class="place-pin ${p.group}"><span>${i+1}</span></div>`,iconSize:[36,36],iconAnchor:[18,36]})}).addTo(map);
    const tip=document.createElement('span');tip.textContent=p.name+' · '+Math.round(p.distance)+' m';m.bindTooltip(tip,{className:'map-tooltip'});
    m.on('click',()=>showDetail(p.id));markerLayers.push(m);
  });
}
function safeUrl(value){try{const u=new URL(value);return u.protocol==='https:'?u.href:'';}catch{return '';}}
function photoMarkup(p,detail=false){
  const photo=safeUrl(p.photo);
  const placeholder=`<span class="no-photo">${icon(({food:'food',activity:'play',shop:'shop',care:'care',other:'pin'})[p.group]||'pin')}<span>İşletme fotoğrafı bulunamadı</span></span>`;
  return photo?`<img ${detail?'class="detail-image"':''} src="${escape(photo)}" alt="${escape(p.name)} — işletme fotoğrafı" ${detail?'':'loading="lazy"'} referrerpolicy="no-referrer">`:placeholder;
}
function handleImageErrors(container){container.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{img.replaceWith(Object.assign(document.createElement('span'),{className:'no-photo',textContent:'İşletme fotoğrafı yüklenemedi'}));},{once:true}));}
function ratingMarkup(p){return `<span class="rating">${icon('star')}<strong>${p.rating.toFixed(1).replace('.',',')}</strong><span class="review-count">(${fmt.format(p.reviews)})</span></span>`;}
function directionsUrl(p){return 'https://www.google.com/maps/dir/?api=1&origin='+state.center.lat+','+state.center.lng+'&destination='+encodeURIComponent(p.lat+','+p.lng)+'&travelmode=walking&destination_place_id='+encodeURIComponent(p.id);}
function visiblePlaces(){return state.places.filter(p=>state.group==='all'||p.group===state.group);}

function render(){
  if(state.loading)return;
  if(!state.center)return;
  const places=visiblePlaces();
  $('resultTitle').textContent=places.length?`${places.length} küçük keşif, yakında.`:'Burada henüz bir öneri yok.';
  $('results').innerHTML=places.length?places.map((p,i)=>`<article class="place-card" style="--delay:${Math.min(i*35,210)}ms" data-place="${escape(p.id)}"><button class="card-photo" data-detail="${escape(p.id)}" aria-label="${escape(p.name)} ayrıntıları">${photoMarkup(p)}<span class="distance-badge">${icon('walk')}${Math.round(p.distance)} m</span>${p.photo?'<span class="photo-credit">Google Maps</span>':''}</button><div class="card-meta"><span>${escape(p.kind)}</span>${ratingMarkup(p)}</div><h3>${escape(p.action)}</h3><button class="name-button" data-detail="${escape(p.id)}">${escape(p.name)}</button><div class="card-foot"><span class="walk-time">Yaklaşık ${p.walkMinutes} dk yürüyüş</span><a class="directions" href="${escape(directionsUrl(p))}" target="_blank" rel="noopener">Yol tarifi ${icon('arrow')}</a></div></article>`).join(''):`<div class="empty-state"><div class="empty-icon">${icon('location')}</div><h3>${state.group==='all'?'Bu çemberde kriterleri geçen yer bulunamadı.':'Bu kategoride uygun bir yer bulunamadı.'}</h3><p>${state.group==='all'?`Seçtiğin ${state.radius} metre içinde en az 4,5 puan ve<br>100 değerlendirme şartını koruyoruz.`:'Diğer kategorilere bak veya başka bir nokta seç.'}</p>${state.group==='all'?'<button class="button secondary" data-action="pick">Başka bir nokta seç</button>':'<button class="button secondary" data-action="all">Tüm kategorileri göster</button>'}</div>`;
  handleImageErrors($('results'));
  updateMarkers(places);
  if(state.data){
    const date=new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'}).format(new Date(state.data.updatedAt));
    let note=state.data.source==='snapshot'?`Canlı arama yanıt vermedi. ${date} tarihli Ankara tarama kayıtları gösteriliyor; bu alanın kapsamı sınırlı olabilir.`:`Google Maps · ${date} kontrolü · Kuş uçuşu mesafeye göre sıralı.`;
    if(state.data.source!=='snapshot'&&state.data.partial)note+=' Bazı aramalar yanıt vermedi; sonuçlar eksik olabilir.';
    if(!state.places.length)note+=' Bu sonuç, çevrende hiç işletme olmadığı anlamına gelmez.';
    $('dataNote').textContent=note;
  }
}
function loading(){
  $('results').innerHTML=Array.from({length:4},()=>'<div class="skeleton" aria-hidden="true"><div class="image"></div><div class="bar"></div><div class="bar short"></div></div>').join('');
  $('resultTitle').innerHTML='<span class="loading-label"><span class="spinner"></span>Yakınındaki iyi yerler aranıyor…</span>';
  $('results').setAttribute('aria-busy','true');
  $('refreshButton').disabled=true;
  updateMarkers([]);
}
async function discover(center,label='Seçtiğin nokta'){
  state.locationIntent++;
  document.body.classList.add('has-results');$('pageTitle').textContent='Hemen yakınında.';
  state.center={lat:Number(center.lat),lng:Number(center.lng)};
  state.places=[];state.data=null;
  const token=++state.request;
  state.controller?.abort();state.controller=new AbortController();
  state.loading=true;loading();syncMap();
  $('locationLabel').textContent=label.toLocaleUpperCase('tr-TR');
  $('refreshButton').hidden=false;
  $('dataNote').textContent='Mesafe, puan ve değerlendirme sayısı birlikte kontrol ediliyor.';
  const locationUrl=new URL(location.href);locationUrl.searchParams.set('lat',state.center.lat.toFixed(6));locationUrl.searchParams.set('lng',state.center.lng.toFixed(6));locationUrl.searchParams.set('radius',state.radius);history.replaceState(null,'',locationUrl);
  if(state.accuracy>75)feedback(`Konum doğruluğu yaklaşık ${Math.round(state.accuracy)} metre. Küçük bir alanda daha doğru sonuç için haritadaki işareti kontrol et.`);else feedback('');
  try{
    const params=new URLSearchParams({lat:state.center.lat,lng:state.center.lng,radius:state.radius});
    const response=await fetch('/api/o6?'+params,{signal:state.controller.signal});
    if(!response.headers.get('Content-Type')?.includes('application/json'))throw new Error('Yer arama servisine ulaşılamadı.');
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||'Yerler alınamadı.');
    if(token!==state.request)return;
    state.data=data;
    // Defense in depth: never display a result that fails the visible hard criteria.
    state.places=(data.places||[]).filter(p=>p.rating>=4.5&&p.reviews>=100&&p.distance<=state.radius&&p.distance>=0);
  }catch(error){
    if(token!==state.request||error.name==='AbortError')return;
    try{
      const backup=await fetch('./places.json',{signal:state.controller.signal});
      if(!backup.ok)throw new Error('backup');
      const snapshot=await backup.json();
      if(token!==state.request)return;
      state.data={source:'snapshot',updatedAt:snapshot.updatedAt,partial:true};
      state.places=eligiblePlaces(snapshot.places,state.center,state.radius);
    }catch(backupError){
      if(token!==state.request||backupError.name==='AbortError')return;
      feedback(error.message==='Failed to fetch'?'Bağlantı kurulamadı. İnternetini kontrol edip yeniden dene.':error.message,'error');
      state.places=[];
      $('dataNote').textContent='Arama tamamlanamadı. Boş ekran, çevrende uygun işletme olmadığı anlamına gelmez.';
    }
  }finally{
    if(token===state.request){state.loading=false;$('results').setAttribute('aria-busy','false');$('refreshButton').disabled=false;render();}
  }
}
async function locate(){
  if(!navigator.geolocation){feedback('Bu tarayıcı konumu desteklemiyor. Haritadan bir nokta seçebilirsin.','error');return;}
  const button=$('locateButton');button.disabled=true;button.querySelector('span').textContent='Konumun alınıyor…';
  const intent=++state.locationIntent;
  navigator.geolocation.getCurrentPosition(position=>{button.disabled=false;button.querySelector('span').textContent='Konumumu güncelle';if(intent!==state.locationIntent)return;state.accuracy=position.coords.accuracy;discover({lat:position.coords.latitude,lng:position.coords.longitude},'Bulunduğun konum');},error=>{button.disabled=false;button.querySelector('span').textContent='Konum belirle';if(intent!==state.locationIntent)return;feedback(error.code===1?'Konum izni verilmedi. “Haritadan seç” ile istediğin noktayı işaretleyebilirsin.':error.code===3?'Konum alınması uzun sürdü. Yeniden dene veya haritadan seç.':'Konumun belirlenemedi. Haritadan istediğin noktayı seçebilirsin.','error');},{enableHighAccuracy:true,timeout:15000,maximumAge:30000});
}
function setDraft(point){
  draft={lat:Number(point.lat),lng:Number(point.lng)};
  const coords=[draft.lat,draft.lng];
  if(draftMarker)draftMarker.setLatLng(coords);else{draftMarker=L.marker(coords,{draggable:true,icon:centerIcon()}).addTo(pickerMap);draftMarker.on('dragend',()=>setDraft(draftMarker.getLatLng()));}
  if(draftCircle)draftCircle.setLatLng(coords).setRadius(state.radius);else draftCircle=L.circle(coords,{radius:state.radius,color:'#d94723',weight:1.5,fillOpacity:.08}).addTo(pickerMap);
  $('draftCoordinates').textContent=draft.lat.toFixed(5)+', '+draft.lng.toFixed(5);
}
function openPicker(point){
  if(!window.L){feedback('Harita yüklenemedi. Sayfayı yeniden yükle.','error');return;}
  $('picker').showModal();$('pickerRadius').textContent=state.radius+' metre';
  const center=point||state.center||defaultCenter;
  if(!pickerMap){pickerMap=L.map('pickerMap',{scrollWheelZoom:true}).setView([center.lat,center.lng],17);tileLayer().addTo(pickerMap);pickerMap.on('click',event=>setDraft(event.latlng));new ResizeObserver(()=>pickerMap.invalidateSize()).observe($('pickerMap'));}
  setDraft(center);
  requestAnimationFrame(()=>{pickerMap.invalidateSize();pickerMap.setView([center.lat,center.lng],17);});
}
async function addressSearch(event){
  event.preventDefault();
  const q=$('addressInput').value.trim();if(q.length<3)return;
  const button=$('addressSearchButton');button.disabled=true;button.textContent='…';$('addressResults').textContent='Aranıyor…';
  try{
    const r=await fetch('/api/o6?mode=geocode&q='+encodeURIComponent(q));const d=await r.json();if(!r.ok)throw new Error(d.error);
    $('addressResults').textContent='';
    if(!d.items.length){$('addressResults').textContent='Adres bulunamadı. Haritaya dokunarak seçebilirsin.';return;}
    d.items.forEach(item=>{const b=document.createElement('button');b.type='button';b.textContent=item.name;b.onclick=()=>{setDraft(item);pickerMap.setView([item.lat,item.lng],17);$('addressResults').textContent='';$('addressInput').value=item.name;};$('addressResults').append(b);});
  }catch(e){$('addressResults').textContent=e.message||'Adres araması yanıt vermedi. Haritadan seçebilirsin.';}finally{button.disabled=false;button.textContent='Ara';}
}
function showDetail(id){
  const p=state.places.find(p=>p.id===id);if(!p)return;
  const website=safeUrl(p.website);
  $('detailContent').innerHTML=`<div style="position:relative;min-height:150px">${photoMarkup(p,true)}</div><div class="detail-body"><span class="tiny-label">${escape(p.kind)} · ${Math.round(p.distance)} METRE</span><h2>${escape(p.action)}</h2><strong>${escape(p.name)}</strong><p>${escape(p.category)}</p>${ratingMarkup(p)}<p>${escape(p.address)}</p><div class="detail-links"><a class="button primary" href="${escape(directionsUrl(p))}" target="_blank" rel="noopener">Yürüyerek git ${icon('arrow')}</a><a class="button secondary" href="${escape(safeUrl(p.mapsUrl))}" target="_blank" rel="noopener">Google Maps</a>${website?`<a class="button secondary" href="${escape(website)}" target="_blank" rel="noopener">Web sitesi</a>`:''}</div><p class="detail-fineprint">İşletme görseli: Google Maps. Ürün ve stok durumu doğrulanmamıştır. Gitmeden önce çalışma saatini kontrol et.</p></div>`;
  handleImageErrors($('detailContent'));$('placeDetail').showModal();
}
function setGroup(group){state.group=group;document.querySelectorAll('[data-group]').forEach(b=>{const active=b.dataset.group===group;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});render();}

$('locateButton').onclick=locate;
$('pickButton').onclick=()=>openPicker();$('mapPickButton').onclick=()=>openPicker();
$('mapToggle').onclick=()=>{const expanded=$('mapPanel').classList.toggle('map-expanded');$('mapToggle').setAttribute('aria-expanded',String(expanded));$('mapToggle').textContent=expanded?'Haritayı kapat ↙':'Haritayı aç ↗';if(expanded)requestAnimationFrame(()=>{map?.invalidateSize();syncMap();});};
$('applyLocation').onclick=()=>{$('picker').close();state.accuracy=0;discover(draft,'Haritadan seçtiğin nokta');};
$('addressForm').onsubmit=addressSearch;
$('aboutButton').onclick=()=>{$('aboutRadius').textContent=state.radius+' metre';$('about').showModal();};
$('privacyButton').onclick=()=>$('privacy').showModal();
$('refreshButton').onclick=()=>{if(state.center)discover(state.center);};
$('radius').onchange=()=>{state.radius=Number($('radius').value);$('radiusTag').textContent=state.radius+' m yarıçap';if(state.center)discover(state.center);};
$('startAnkara').onclick=()=>discover(defaultCenter,'Büyükesat, Ankara');
document.querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>setGroup(b.dataset.group));
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',event=>{if(event.target===d){const r=d.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)d.close();}}));
$('results').onclick=event=>{const detail=event.target.closest('[data-detail]');if(detail)showDetail(detail.dataset.detail);const action=event.target.closest('[data-action]');if(action?.dataset.action==='pick')openPicker();if(action?.dataset.action==='all')setGroup('all');};
initMap();
const params=new URLSearchParams(location.search),lat=Number(params.get('lat')),lng=Number(params.get('lng'));
if([50,100,250,500].includes(Number(params.get('radius')))){state.radius=Number(params.get('radius'));$('radius').value=state.radius;$('radiusTag').textContent=state.radius+' m yarıçap';}
if(params.has('lat')&&params.has('lng')&&Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180)discover({lat,lng},'Bağlantıdaki konum');
if(params.get('state')==='picker')openPicker();
