/* Everest / CesiumJS. All ground heights come from the bundled Mapzen DEM. */
'use strict';
const $=id=>document.getElementById(id), rad=Math.PI/180, DEG=180/Math.PI;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const metres=(a,b)=>Math.hypot((a[0]-b[0])*111320*Math.cos((a[1]+b[1])/2*rad),(a[1]-b[1])*111320);
let viewer, dem, grid, route, stops, cumulative, total, auto=false, resting=false, overhead=false, started=false, ready=false;
let pos={lon:86.7292392,lat:27.6877511,heading:0,pitch:.12,energy:100,travel:0,routeDistance:0};
let keys={}, joy={x:0,y:0}, last=0, lastUI=0, savedAt=0, terrainReady=false, saveWarning=false, minimarker;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let toastTimer;
function toast(t){$('toast').textContent=t;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),4200)}
function status(t){$('status').textContent=t;$('status').classList.toggle('hidden',!t)}
function height(lon,lat){
 const n=2**dem.z, px=((lon+180)/360*n-dem.x)*256-.5, py=((1-Math.asinh(Math.tan(lat*rad))/Math.PI)/2*n-dem.y)*256-.5;
 if(px<0||py<0||px>=dem.width-1||py>=dem.height-1)return 0;
 const x=Math.floor(px),y=Math.floor(py), fx=px-x,fy=py-y, i=y*dem.width+x;
 return (grid[i]*(1-fx)+grid[i+1]*fx)*(1-fy)+(grid[i+dem.width]*(1-fx)+grid[i+dem.width+1]*fx)*fy;
}
function atDistance(d){
 d=clamp(d,0,total);let lo=0,hi=route.length-1;
 while(lo+1<hi){let m=(lo+hi)>>1;if(cumulative[m]<=d)lo=m;else hi=m}
 const f=(d-cumulative[lo])/(cumulative[hi]-cumulative[lo]||1);
 return [route[lo][0]+(route[hi][0]-route[lo][0])*f,route[lo][1]+(route[hi][1]-route[lo][1])*f];
}
function nearest(lon,lat){
 const cos=Math.cos(lat*rad), sx=111320*cos,sy=111320; let best={distance:Infinity,d:0,point:route[0]};
 for(let i=1;i<route.length;i++){
  const a=route[i-1],b=route[i],vx=(b[0]-a[0])*sx,vy=(b[1]-a[1])*sy, wx=(lon-a[0])*sx,wy=(lat-a[1])*sy;
  const t=clamp((vx*wx+vy*wy)/(vx*vx+vy*vy||1),0,1),p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],ds=metres(p,[lon,lat]);
  if(ds<best.distance)best={distance:ds,d:cumulative[i-1]+(cumulative[i]-cumulative[i-1])*t,point:p};
 }return best;
}
function save(){
 if(!ready)return;
 try{localStorage.setItem('everest-v1',JSON.stringify({...pos,speed:$('speed').value,weather:$('weather').value}));saveWarning=false}
 catch(e){if(!saveWarning){toast('Tarayıcı kayda izin vermiyor; ilerleme bu oturumda korunacak.');saveWarning=true}}
}
function restore(){
 try{
  const s=JSON.parse(localStorage.getItem('everest-v1'));
  if(s&&['lon','lat','heading','pitch','energy','travel','routeDistance'].every(k=>Number.isFinite(s[k]))&&s.lon>86.5&&s.lon<87.05&&s.lat>27.5&&s.lat<28.12){
   Object.assign(pos,s,{energy:clamp(s.energy,0,100),routeDistance:clamp(s.routeDistance,0,total),pitch:clamp(s.pitch,-1.2,1.2)});
   if(['1','5','20','80'].includes(s.speed))$('speed').value=s.speed;
   if(['clear','cloud','snow'].includes(s.weather))$('weather').value=s.weather;
   $('start').textContent='Yürüyüşe devam et';
  }
 }catch(e){/* A denied or invalid save does not block the expedition. */}
}
function camera(){
 if(!viewer||overhead)return;
 // Camera eye and terrain mesh use the same DEM; a small clearance covers mesh interpolation.
 const rendered=viewer.scene.globe.getHeight(Cesium.Cartographic.fromDegrees(pos.lon,pos.lat));
 const ground=Math.max(height(pos.lon,pos.lat),Number.isFinite(rendered)?rendered:-10000);
 viewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(pos.lon,pos.lat,ground+3.2),orientation:{heading:pos.heading,pitch:pos.pitch,roll:0}});
}
function setWalking(value){auto=value;resting=false;$('rest').textContent='Mola ver';$('walk').textContent=auto?'Yürüyüşü durdur':'Yürüyüşe başla';$('walk').classList.toggle('primary',!auto)}
function setView(value){
 overhead=value;setWalking(false);const c=viewer.scene.screenSpaceCameraController;
 c.enableRotate=c.enableTranslate=c.enableZoom=c.enableTilt=c.enableLook=value;
 $('view').textContent=value?'Yere dön':'Kuşbakışı';$('compass').classList.toggle('hidden',value);document.querySelector('.crosshair').classList.toggle('hidden',value);document.querySelector('.touch-controls').style.visibility=value?'hidden':'';
 if(value){viewer.camera.flyTo({destination:Cesium.Cartesian3.fromDegrees(pos.lon,pos.lat-.028,height(pos.lon,pos.lat)+6500),orientation:{heading:0,pitch:-.9,roll:0},duration:reduced?0:1.1})}else{viewer.camera.cancelFlight();camera()}
}
function teleport(d){
 setWalking(false);resting=false;const p=atDistance(d);pos.lon=p[0];pos.lat=p[1];pos.routeDistance=d;
 const ahead=d>=total-1?[86.925,27.9881]:atDistance(Math.min(total,d+30));pos.heading=Math.atan2((ahead[0]-p[0])*Math.cos(p[1]*rad),ahead[1]-p[1]);pos.pitch=.12;
 if(overhead)setView(false);camera();updateUI();save();toast('Seçilen rota noktasına ışınlandın.');toggleMap(false);
}
function toggleMap(v){$('mapPanel').classList.toggle('hidden',!v);$('mapToggle').setAttribute('aria-expanded',String(v));if(v)setWalking(false)}
function updateUI(){
 const h=height(pos.lon,pos.lat), near=nearest(pos.lon,pos.lat),d=pos.routeDistance;
 let current=stops[0],next=stops[1];for(let i=0;i<stops.length;i++){if(cumulative[stops[i].index]<=d+50)current=stops[i];else{next=stops[i];break}}
 if(d>total-80)next=stops.at(-1);
 $('place').textContent=near.distance>150?'Patika dışı · Khumbu':current.name;
 $('alt').textContent=Math.round(h).toLocaleString('tr-TR');$('gps').textContent=`${pos.lat.toFixed(5)}° K · ${pos.lon.toFixed(5)}° D`;
 $('next').textContent=d>total-30?'Ana kampa ulaştın':next.name;
 $('remaining').textContent=near.distance>100?`Patikaya ${Math.round(near.distance)} m`:`${(Math.max(0,cumulative[next.index]-d)/1000).toFixed(2)} km kaldı`;
 $('progress').style.width=`${d/total*100}%`;$('distance').textContent=`${(d/1000).toFixed(1)} / ${(total/1000).toFixed(1)} km · rota`;
 $('energy').textContent=`${Math.round(pos.energy)}%`;$('energyBar').style.width=`${pos.energy}%`;
 $('air').textContent=`%${Math.round(Math.pow(1-2.25577e-5*h,5.25588)*100)}`;
 const hd=(pos.heading*DEG%360+360)%360, dirs=['K','KD','D','GD','G','GB','B','KB'];$('compass').textContent=`${dirs[Math.round(hd/45)%8]} · ${String(Math.round(hd)%360).padStart(3,'0')}°`;
 if(minimarker){const p=mapXY([pos.lon,pos.lat]);minimarker.setAttribute('cx',p[0]);minimarker.setAttribute('cy',p[1])}
 document.querySelectorAll('#stops button').forEach((b,i)=>b.classList.toggle('active',stops[i]===current));
 const finished=d>=total-1;$('walk').disabled=finished;
 if(finished)$('walk').textContent='Ana kamptasın';else if(!auto)$('walk').textContent='Yürüyüşe başla';
}
function mapXY(p){return [24+(p[0]-86.695)/.17*252,314-(p[1]-27.68)/.33*290]}
function svgEl(tag,attrs){const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);return el}
function setupMap(){
 const svg=$('routeMap');svg.append(svgEl('path',{d:route.map((p,i)=>`${i?'L':'M'}${mapXY(p).join(',')}`).join(' '),fill:'none',stroke:'#ffbd72','stroke-width':2}));
 stops.forEach((s,i)=>{
  const [x,y]=mapXY([s.lon,s.lat]);svg.append(svgEl('circle',{cx:x,cy:y,r:4,fill:'#ffbd72'}));
  if([0,3,5,8].includes(i)){let t=svgEl('text',{x:x+(i===8?-6:9),y:y+(i===8?16:0),fill:'#f4f4ec','font-size':11,'text-anchor':i===8?'end':'start'});t.textContent=s.name;svg.append(t)}
  const b=document.createElement('button');const name=document.createElement('span');name.textContent=s.name;const h=document.createElement('small');h.textContent=`${Math.round(height(s.lon,s.lat))} m`;b.append(name,h);b.onclick=()=>teleport(cumulative[s.index]);$('stops').append(b);
 });
 minimarker=svgEl('circle',{cx:0,cy:0,r:6,fill:'#fff',stroke:'#102832','stroke-width':2});svg.append(minimarker);
 svg.addEventListener('click',e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const v=p.matrixTransform(svg.getScreenCTM().inverse());let nearestIndex=0,min=Infinity;route.forEach((p,i)=>{const [x,y]=mapXY(p),d=Math.hypot(x-v.x,y-v.y);if(d<min){min=d;nearestIndex=i}});teleport(cumulative[nearestIndex])});
}
function weather(){
 const w=$('weather').value;viewer.scene.fog.density=w==='snow'?.0012:w==='cloud'?.0005:.00012;
 viewer.scene.skyAtmosphere.brightnessShift=w==='snow'?-.35:w==='cloud'?-.2:0;
 viewer.scene.globe.baseColor=Cesium.Color.fromCssColorString(w==='snow'?'#dde6e7':'#77877d');
 const layer=viewer.imageryLayers.get(0);layer.brightness=w==='snow'?1.35:w==='cloud'?.75:1;layer.saturation=w==='snow'?.12:w==='cloud'?.6:1;
 save();
}
function frame(t){
 const dt=Math.min((t-last)/1000||0,.1);last=t;
 if(started&&!overhead&&!$('helpDialog').open&&$('mapPanel').classList.contains('hidden')&&!document.hidden){
  const manual=keys.KeyW||keys.KeyS||keys.KeyA||keys.KeyD||keys.ArrowUp||keys.ArrowDown||Math.abs(joy.x)>.05||Math.abs(joy.y)>.05;
  if(manual&&auto)setWalking(false);
  if(keys.ArrowLeft)pos.heading-=dt;if(keys.ArrowRight)pos.heading+=dt;
  let moved=0;
  const speed=Number($('speed').value)*1.4*($('weather').value==='snow'?.65:1)*(pos.energy<20?.6:1);
  if(auto&&pos.energy>0){
   const before=[pos.lon,pos.lat];pos.routeDistance=Math.min(total,pos.routeDistance+speed*dt);
   const p=atDistance(pos.routeDistance),ahead=atDistance(Math.min(total,pos.routeDistance+15));
   pos.lon=p[0];pos.lat=p[1];moved=metres(before,p);
   if(pos.routeDistance<total-.1){let target=Math.atan2((ahead[0]-p[0])*Math.cos(p[1]*rad),ahead[1]-p[1]);let delta=Math.atan2(Math.sin(target-pos.heading),Math.cos(target-pos.heading));pos.heading+=delta*Math.min(1,dt*3)}
   else{setWalking(false);toast('Everest Ana Kampı’na ulaştın. Khumbu yürüyüşü tamamlandı!');save()}
  }else if(manual&&pos.energy>0&&!resting){
   let forward=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-joy.y,side=(keys.KeyD?1:0)-(keys.KeyA?1:0)+joy.x;
   const len=Math.max(1,Math.hypot(forward,side));forward/=len;side/=len;
   const north=(Math.cos(pos.heading)*forward-Math.sin(pos.heading)*side)*speed*dt,east=(Math.sin(pos.heading)*forward+Math.cos(pos.heading)*side)*speed*dt;
   const lon=pos.lon+east/(111320*Math.cos(pos.lat*rad)),lat=pos.lat+north/111320;
   if(lon>86.52&&lon<87.04&&lat>27.52&&lat<28.13){pos.lon=lon;pos.lat=lat;moved=Math.hypot(north,east)}
   pos.routeDistance=nearest(pos.lon,pos.lat).d;
  }
  if(resting){pos.energy=Math.min(100,pos.energy+dt*3);if(pos.energy>=100){resting=false;$('rest').textContent='Mola ver';toast('Enerjin doldu. Yola devam edebilirsin.')}}
  if(moved){pos.travel+=moved;pos.energy=Math.max(0,pos.energy-moved*.006*($('weather').value==='snow'?1.4:1));if(pos.energy===0){setWalking(false);toast('Enerjin tükendi. Devam etmek için mola ver.')}}
  camera();
 }
 if(ready&&t-lastUI>250){updateUI();lastUI=t}if(started&&t-savedAt>4000){save();savedAt=t}
 requestAnimationFrame(frame);
}
function inputs(){
 $('start').onclick=()=>{started=true;$('welcome').classList.add('hidden');status('');camera();toast(pos.routeDistance>=total-1?'Ana kamptasın. Rota panelinden başka bir durak seçerek keşfe devam edebilirsin.':'Turuncu patikayı izle veya “Yürüyüşe başla”yı seç.')};
 $('walk').onclick=()=>{
  if(overhead)setView(false);if(pos.energy<=0){toast('Önce mola vererek enerjini yenile.');return}
  if(!auto){const n=nearest(pos.lon,pos.lat);if(n.distance>100){toast('Patikadan uzaktasın. Rota panelinden bir noktaya dön.');return}const savedPoint=atDistance(pos.routeDistance);if(metres(savedPoint,[pos.lon,pos.lat])>3){pos.lon=n.point[0];pos.lat=n.point[1];pos.routeDistance=n.d}if(pos.routeDistance>=total-1){toast('Ana kamptasın. Rota panelinden başka bir durak seç.');return}}
  setWalking(!auto);
 };
 $('rest').onclick=()=>{if(overhead)setView(false);if(pos.energy>=100){toast('Enerjin zaten dolu.');return}const wasResting=resting;setWalking(false);resting=!wasResting;$('rest').textContent=resting?'Molayı bitir':'Mola ver';toast(resting?'Dinleniyorsun. Enerjin yenileniyor.':'Mola sona erdi.')};
 $('view').onclick=()=>setView(!overhead);$('mapToggle').onclick=()=>toggleMap($('mapPanel').classList.contains('hidden'));$('mapClose').onclick=()=>toggleMap(false);
 const openHelp=()=>{setWalking(false);$('helpDialog').showModal()};$('help').onclick=$('info').onclick=openHelp;$('helpClose').onclick=()=>$('helpDialog').close();
 $('reset').onclick=()=>{pos.energy=100;pos.travel=0;teleport(0);$('helpDialog').close();toast('Lukla’ya döndün. Yeni yürüyüş hazır.')};
 $('weather').onchange=weather;$('speed').onchange=()=>{save();toast(`Yürüyüş temposu ${$('speed').value}× olarak ayarlandı.`)};
 document.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)||!started||$('helpDialog').open)return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){keys[e.code]=true;e.preventDefault()}});
 document.addEventListener('keyup',e=>{keys[e.code]=false});
 function clearInput(){keys={};joy={x:0,y:0};$('stick').style.transform='';save()}
 window.addEventListener('blur',clearInput);document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();setWalking(false)}});window.addEventListener('pagehide',save);
 const joyEl=$('joystick');let joyId=null;
 function stick(e){const r=joyEl.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/(r.width*.35),y=(e.clientY-r.top-r.height/2)/(r.height*.35),l=Math.max(1,Math.hypot(x,y));joy={x:x/l,y:y/l};$('stick').style.transform=`translate(${joy.x*30}px,${joy.y*30}px)`}
 joyEl.addEventListener('pointerdown',e=>{joyId=e.pointerId;joyEl.setPointerCapture(e.pointerId);stick(e);e.preventDefault()});joyEl.addEventListener('pointermove',e=>{if(e.pointerId===joyId)stick(e)});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])joyEl.addEventListener(type,()=>{joyId=null;joy={x:0,y:0};$('stick').style.transform=''});
 let look=null;const canvas=viewer.canvas;
 canvas.addEventListener('pointerdown',e=>{if(overhead||!started||e.button!==0)return;look={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!look||look.id!==e.pointerId||overhead)return;pos.heading+=(e.clientX-look.x)*.004;pos.pitch=clamp(pos.pitch-(e.clientY-look.y)*.003,-1.2,1.2);look.x=e.clientX;look.y=e.clientY;camera()});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>look=null);
}
async function init(){
 try{
  if(!window.Cesium)throw new Error('3D motor yüklenemedi. Sayfayı yenilemeyi dene.');
  const fetchOK=async url=>{const r=await fetch(url);if(!r.ok)throw new Error(`${url}: HTTP ${r.status}`);return r};
  const responses=await Promise.all([fetchOK('terrain.json'),fetchOK('terrain.bin'),fetchOK('route.json')]);
  dem=await responses[0].json();grid=new Int16Array(await responses[1].arrayBuffer());const data=await responses[2].json();route=data.route;stops=data.checkpoints;
  if(grid.length!==dem.width*dem.height||route.length<2)throw new Error('Arazi veya rota dosyası eksik.');
  cumulative=[0];for(let i=1;i<route.length;i++)cumulative.push(cumulative.at(-1)+metres(route[i-1],route[i]));total=cumulative.at(-1);
  const scheme=new Cesium.GeographicTilingScheme();
  const terrainTile=(x,y,level)=>{
   const rect=scheme.tileXYToRectangle(x,y,level),a=new Float32Array(65*65);
   for(let j=0;j<65;j++)for(let i=0;i<65;i++)a[j*65+i]=height((rect.west+(rect.east-rect.west)*i/64)*DEG,(rect.north+(rect.south-rect.north)*j/64)*DEG);
   return a;
  };
  const terrain=new Cesium.CustomHeightmapTerrainProvider({width:65,height:65,tilingScheme:scheme,credit:'Mapzen Terrain Tiles · SRTM / AWS Open Data',callback:terrainTile});
  // The source is ~30 m. Stop subdividing at its useful resolution, especially at eye level.
  const requestGeometry=terrain.requestTileGeometry.bind(terrain);
  terrain.requestTileGeometry=(x,y,level,request)=>level>=13?Promise.resolve(new Cesium.HeightmapTerrainData({buffer:terrainTile(x,y,level),width:65,height:65,childTileMask:0})):requestGeometry(x,y,level,request);
  terrain.getTileDataAvailable=(x,y,level)=>level<=13;
  const geometricError=terrain.getLevelMaximumGeometricError.bind(terrain);
  // A positive epsilon also keeps Cesium's logarithmic imagery LOD finite.
  terrain.getLevelMaximumGeometricError=level=>level>=13?.0001:geometricError(level);
  const imagery=new Cesium.UrlTemplateImageryProvider({url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',maximumLevel:17,credit:'Imagery © Esri, Maxar, Earthstar Geographics and contributors'});
  viewer=new Cesium.Viewer('world',{terrainProvider:terrain,baseLayer:new Cesium.ImageryLayer(imagery),animation:false,timeline:false,baseLayerPicker:false,geocoder:false,homeButton:false,sceneModePicker:false,navigationHelpButton:false,fullscreenButton:false,selectionIndicator:false,infoBox:false,scene3DOnly:true,skyBox:false,contextOptions:{webgl:{alpha:false}},shadows:false});
  viewer.targetFrameRate=30;viewer.resolutionScale=Math.min(window.devicePixelRatio||1,1.25)/(window.devicePixelRatio||1);viewer.scene.globe.maximumScreenSpaceError=4;viewer.scene.globe.tileCacheSize=100;viewer.scene.globe.depthTestAgainstTerrain=true;viewer.scene.globe.enableLighting=false;
  viewer.scene.backgroundColor=Cesium.Color.fromCssColorString('#819ba7');viewer.scene.globe.showGroundAtmosphere=true;
  viewer.clock.currentTime=Cesium.JulianDate.fromIso8601('2026-05-01T04:00:00Z');
  viewer.scene.screenSpaceCameraController.enableCollisionDetection=true;
  imagery.errorEvent.addEventListener(()=>{status('Uydu görüntüsü yüklenemiyor. Bağlantını kontrol et; gerçek arazi verisi hazır.')});
  let renderFailed=false;viewer.scene.renderError.addEventListener(()=>{if(!renderFailed){renderFailed=true;status('3D çizim kesildi. Diğer sekmeleri kapatıp sayfayı yenile.')}});
  pos.heading=Math.atan2((route[1][0]-route[0][0])*Math.cos(route[0][1]*rad),route[1][1]-route[0][1]);
  restore();setupMap();inputs();ready=true;weather();setView(false);updateUI();
  if(pos.routeDistance>0)$('introTitle').textContent=pos.routeDistance>=total-1?'Everest Ana Kampı’ndasın.':'Yola kaldığın yerden devam et.';
  viewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(pos.lon,pos.lat-.012,height(pos.lon,pos.lat)+1800),orientation:{heading:0,pitch:-.6,roll:0}});
  const positions=route.map(p=>Cesium.Cartesian3.fromDegrees(p[0],p[1],height(...p)+1));
  viewer.entities.add({polyline:{positions,width:3,material:Cesium.Color.fromCssColorString('#ffb66b'),clampToGround:true}});
  stops.forEach(s=>viewer.entities.add({position:Cesium.Cartesian3.fromDegrees(s.lon,s.lat,height(s.lon,s.lat)+12),label:{text:s.name,font:'15px sans-serif',fillColor:Cesium.Color.WHITE,outlineColor:Cesium.Color.BLACK,outlineWidth:3,style:Cesium.LabelStyle.FILL_AND_OUTLINE,pixelOffset:new Cesium.Cartesian2(0,-20),distanceDisplayCondition:new Cesium.DistanceDisplayCondition(0,18000)},point:{pixelSize:8,color:Cesium.Color.fromCssColorString('#ffbd72'),outlineColor:Cesium.Color.BLACK,outlineWidth:2,distanceDisplayCondition:new Cesium.DistanceDisplayCondition(0,18000)}}));
  viewer.scene.globe.tileLoadProgressEvent.addEventListener(n=>{if(n===0&&!terrainReady){terrainReady=true;status('');$('start').disabled=false;$('start').textContent=pos.routeDistance>0?'Keşfe devam et':'Lukla’da keşfe başla';$('walk').disabled=pos.routeDistance>=total-1}});
  // Local DEM is already ready; do not leave the expedition blocked by a slow imagery server.
  setTimeout(()=>{if(!terrainReady){$('start').disabled=false;$('start').textContent='Araziyi keşfet';$('walk').disabled=pos.routeDistance>=total-1;status('Arazi hazır; görüntü ayrıntıları yükleniyor…')}},12000);
  requestAnimationFrame(frame);
  window.everest={get state(){return {...pos,auto,resting,overhead,ready,terrainReady,total,height:height(pos.lon,pos.lat)}},height,nearest,teleport,viewer};
 }catch(e){console.error(e);status(`Başlatılamadı: ${e.message}`);$('start').textContent='Yeniden dene';$('start').disabled=false;$('start').onclick=()=>location.reload()}
}
init();
