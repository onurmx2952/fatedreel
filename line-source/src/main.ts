import './style.css';
import {el,pen,shape,inkDefs,run,f} from './lib/ink.ts';
import {palette,applyPalette,rgb} from './lib/daynight.ts';
import {pointerWind,seeded,ease} from './lib/motion.ts';
import {person} from './person.ts';
import {street,type React} from './street.ts';
import {cart} from './cart.ts';
const q=new URLSearchParams(location.search),initial=Number(q.get('tau')??q.get('start')??.66);
let tau=Number.isFinite(initial)?((initial%1)+1)%1:.66,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,time=0,dragging=false,pinned=q.has('tau');
const day=Math.max(15,Number(q.get('day'))||180),svg=el('svg',{viewBox:'0 0 1140 560',role:'group','aria-label':'1926 Ankara sokağı. İnsanlar, at arabaları, dükkânlar ve sürüklenebilir güneş.'});document.querySelector('#stage')!.append(svg);
const ink=inkDefs(svg,'ankara'),gradient=el('linearGradient',{id:'sky',x1:0,x2:0,y1:0,y2:1},ink.defs),top=el('stop',{offset:0},gradient),bottom=el('stop',{offset:1},gradient);
const warm=el('radialGradient',{id:'warm'},ink.defs);el('stop',{offset:0,'stop-color':'#ffcc73','stop-opacity':.65},warm);el('stop',{offset:1,'stop-color':'#ffcc73','stop-opacity':0},warm);
el('rect',{width:1140,height:560,fill:'url(#sky)'},svg);const stars=el('g',{},svg),rand=seeded(26);for(let i=0;i<55;i++)el('circle',{cx:rand(0,1140),cy:rand(20,230),r:rand(.45,1.05),fill:'#f5ebce'},stars);
const celestial=el('g',{},svg),sun=el('circle',{r:15,fill:'#dbab68','fill-opacity':.75},celestial),moon=el('path',{d:'M5 -14A15 15 0 1 0 5 14A12 12 0 0 1 5 -14',fill:'#f4e4bf'},celestial);el('circle',{r:28,fill:'transparent'},celestial);
const clouds=Array.from({length:4},(_,i)=>{const p=pen(svg,.55);p.style.opacity='.27';p.setAttribute('d','M0 0q14 -3 22 0q4 -8 15 -8q9 -13 21 -4q14 -2 18 12h32');return {p,x:i*302+20,y:90+i%2*38};});
const scene=el('g',{filter:ink.filter},svg),back=el('g',{},scene),buildings=el('g',{},scene),front=el('g',{},scene),traffic=el('g',{},scene),glow=el('g',{style:'mix-blend-mode:screen;pointer-events:none'},svg);
const ground=shape(front,.65);ground.setAttribute('d','M0 411Q570 407 1140 411V560H0Z');const kerb=pen(front,.65);kerb.setAttribute('d','M0 424Q570 418 1140 424 M0 429Q570 423 1140 429');
for(let i=0;i<85;i++){const x=rand(-5,1140),y=rand(435,548),p=pen(front,.35);p.setAttribute('d',`M${x} ${y}q5 -2 15 0m-10 4q6 1 11 -1`);p.setAttribute('opacity','.4')}
let reactionCount=0;const announce=document.querySelector<HTMLElement>('#announcement')!;
const react:React=(g,label,fn)=>{g.setAttribute('tabindex','0');g.setAttribute('role','button');g.setAttribute('aria-label',label);el('title',{},g).textContent=label;const trigger=()=>{fn();reactionCount++;announce.textContent=label.split(':')[0]+' tepki verdi.';if(paused)render(0)};g.addEventListener('pointerdown',e=>{e.stopPropagation();trigger()});g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();trigger()}})};
const town=street(back,buildings,front,glow,react),wind=pointerWind(svg,.2);
const people=[person(traffic,206,426,1,0,react),person(traffic,697,431,-1,1,react),person(traffic,890,477,-1,2,react),person(traffic,1100,428,1,0,react)];
const carts=[cart(traffic,270,460,1,react),cart(traffic,1030,496,-1,react)];
const actors=[...people,...carts].sort((a,b)=>a.y-b.y);actors.forEach(a=>traffic.append(a.g));
const cat=el('g',{transform:'translate(355 417)'},front),catBody=shape(cat,.8),catTail=pen(cat,.9);let catT=-1;
react(cat,'Ankara kedisi: uyandır',()=>{catT=0});el('rect',{x:-14,y:-27,width:37,height:34,fill:'transparent'},cat);
const birds=el('g',{},scene);let birdT=-1;const flock=Array.from({length:5},(_,i)=>{const g=el('g',{},birds);const body=shape(g,.65);body.setAttribute('d','M-4 0q-2 -7 3 -6q4 -6 6 -1l4 2 -4 1q-2 7 -9 4Z');const wing=pen(g,.6);wing.setAttribute('d','M-2 -3q3 -3 6 0');return {g,wing,x:218+i*11,y:306-i*.26};});
react(birds,'Serçeler: havalandır',()=>{birdT=0});el('rect',{x:208,y:286,width:72,height:30,fill:'transparent'},birds);
const smoke=Array.from({length:6},()=>pen(back,.8));
const clock=document.querySelector<HTMLElement>('#clock')!,slider=document.querySelector<HTMLInputElement>('#time')!,period=document.querySelector<HTMLElement>('#period')!,card=document.querySelector<HTMLElement>('.card')!,pause=document.querySelector<HTMLButtonElement>('#pause')!;
function state(){pause.setAttribute('aria-pressed',String(paused));pause.innerHTML=paused?'▶ <span>Devam et</span>':'Ⅱ <span>Duraklat</span>';}
pause.addEventListener('click',()=>{paused=!paused;state()});state();
slider.addEventListener('input',()=>{tau=Number(slider.value)/1440;pinned=false;render(0)});
document.querySelector('#reset')!.addEventListener('click',()=>{location.href=location.pathname;});
const toSvg=(e:PointerEvent)=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM()!.inverse())};
function scrub(e:PointerEvent){const p=toSvg(e),u=Math.min(1,Math.max(0,(p.x-100)/940)),night=palette(tau).night>.5;tau=night?(u*.5+.75)%1:.25+u*.5;pinned=false;render(0)}
celestial.setAttribute('role','slider');celestial.setAttribute('tabindex','0');celestial.setAttribute('aria-label','Güneş veya ay: saati sürükleyerek değiştir');celestial.setAttribute('aria-valuemin','0');celestial.setAttribute('aria-valuemax','1439');celestial.style.cursor='grab';
celestial.addEventListener('pointerdown',e=>{e.preventDefault();dragging=true;celestial.setPointerCapture(e.pointerId);scrub(e)});celestial.addEventListener('pointermove',e=>{if(dragging)scrub(e)});celestial.addEventListener('pointerup',()=>dragging=false);celestial.addEventListener('pointercancel',()=>dragging=false);celestial.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();tau=(tau+(e.key==='ArrowRight'?1:-1)/48+1)%1;render(0)}});
function render(dt:number){
 time+=dt;if(!pinned&&!dragging)tau=(tau+dt/day)%1;const P=palette(tau);applyPalette(svg,P);top.setAttribute('stop-color',rgb(P.top));bottom.setAttribute('stop-color',rgb(P.bottom));card.style.setProperty('--scene-ink',rgb(P.ink));stars.setAttribute('opacity',String(P.night));
 const night=P.night>.5,u=night?((tau+.25)%1)/.5:(tau-.25)/.5;celestial.setAttribute('transform',`translate(${100+u*940} ${236-Math.sin(u*Math.PI)*180})`);sun.style.display=night?'none':'';moon.style.display=night?'':'none';
 const minutes=Math.floor(tau*1440),h=Math.floor(minutes/60),m=minutes%60,label=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;clock.textContent=label;slider.value=String(minutes);celestial.setAttribute('aria-valuenow',String(minutes));celestial.setAttribute('aria-valuetext',label);period.textContent=h<5?'Gece':h<8?'Şafak':h<12?'Sabah':h<17?'İkindi':h<20?'Akşam':'Gece';
 const w=wind.step(time);clouds.forEach(c=>{c.x+=dt*(1.3+w*.3);if(c.x>1200)c.x=-130;c.p.setAttribute('transform',`translate(${f(c.x)} ${c.y})`)});
 town.update(dt,time,tau,w,P);people.forEach(a=>a.update(dt,w,P));carts.forEach(a=>a.update(dt,P));
 if(catT>=0){catT+=dt;if(catT>5)catT=-1;}const stretch=catT<0?0:catT<1?ease(catT):catT<3?1:1-ease((catT-3)/2);catBody.setAttribute('d',`M-9 0Q${-15-stretch*4} ${-12+stretch*5} -1 ${-14+stretch*7}L0 -23 4 -19 9 -23 11 -15Q15 -7 8 -3L${14+stretch*8} 0Z`);catTail.setAttribute('d',`M-9 -2Q-24 -2 -22 ${-14+stretch*8}Q-21 -22 -18 -17`);
 if(birdT>=0){birdT+=dt;if(birdT>7)birdT=-1;}flock.forEach((b,i)=>{const v=birdT<0?0:Math.sin(Math.min(1,birdT/7)*Math.PI);b.g.setAttribute('transform',`translate(${b.x+v*(150+i*28)} ${b.y-v*(80+i*17)}) rotate(${-v*15})`);b.wing.setAttribute('d',v>.05?`M-2 -3Q0 ${-8-Math.sin(time*14+i)*8} 5 -4`:'M-2 -3q3 -3 6 0')});
 smoke.forEach((s,i)=>{const a=(time*.13+i/6)%1;s.setAttribute('d',`M${645+a*w*24} ${239-a*69}q${7+w*4} -7 1 -14q-5 -5 2 -11`);s.setAttribute('opacity',String((1-a)*.17));});
}
run((_t,dt)=>render(paused?0:dt));
Object.assign(window,{__ankara:{people,carts,town,get tau(){return tau},get reactions(){return reactionCount},setTime(v:number){tau=v;pinned=true;render(0)},setPaused(v:boolean){paused=v;state()},get paused(){return paused}}});
