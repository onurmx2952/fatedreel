import {el,pen,shape,paint,f} from './lib/ink.ts';
import {pendulum,spring,seeded,ease} from './lib/motion.ts';
import {rgb,mix,toRGB,nightTint,type Palette} from './lib/daynight.ts';
export type React=(g:SVGElement,label:string,fn:()=>void)=>void;
const path=(g:Element,d:string,w=.8)=>{const p=pen(g,w);p.setAttribute('d',d);return p};
const fill=(g:Element,d:string,c?:string)=>{const p=c?paint(g,c,.85):shape(g,.85);p.setAttribute('d',d);return p};
const rect=(g:Element,x:number,y:number,w:number,h:number)=>fill(g,`M${x} ${y}Q${x+w/2} ${y-.6} ${x+w} ${y}L${x+w} ${y+h}Q${x+w/2} ${y+h+.4} ${x} ${y+h}Z`);
const txt=(g:Element,x:number,y:number,s:string,size=10)=>{const t=el('text',{x,y,'text-anchor':'middle',fill:'currentColor','font-family':'Georgia,serif','font-size':size,'letter-spacing':1.1},g);t.textContent=s;return t};

export function street(back:Element,buildings:Element,front:Element,glow:Element,react:React){
 const rand=seeded(1926),windows:{pane:SVGPathElement,x:number,y:number,thr:number,glow:SVGEllipseElement}[]=[],shops:{g:SVGGElement,shutters:SVGGElement[],op:ReturnType<typeof spring>,override:number,sign:SVGGElement,swing:ReturnType<typeof pendulum>,x:number}[]=[],accents:SVGPathElement[]=[];
 // Ankara's rocky hill and the layered citadel silhouette, kept quieter than the street.
 const hills=el('g',{opacity:.27},back);fill(hills,'M0 270 Q88 211 164 225 Q236 194 304 220 Q403 134 488 165 Q573 97 670 150 Q766 155 851 235 Q969 208 1140 255L1140 381H0Z');
 path(hills,'M255 235 Q379 192 440 200 M675 179 Q762 199 813 233 M336 251L436 216 491 222 M545 178 Q585 151 635 171',.6);
 const castle=el('g',{opacity:.52},back);fill(castle,'M448 171L448 146 454 146 454 140 460 140 460 146 468 146 468 140 475 140 475 146 482 146 482 137 489 137 489 143 513 136 513 117 520 117 520 111 527 111 527 117 534 117 534 111 541 111 541 117 548 117 548 142 577 153 577 138 583 138 583 132 590 132 590 138 596 138 596 132 603 132 603 138 610 138 610 182Z');
 path(castle,'M455 157L475 155 M487 157L512 149 M519 133L535 133 M559 159L574 166 M586 157L600 159 M471 164L496 160 M526 146L542 148',.45);
 // A slender neighborhood minaret; no imported Japanese streetscape.
 const minaret=el('g',{opacity:.45},back);fill(minaret,'M868 273L871 170 875 170 879 273Z');fill(minaret,'M865 171L881 171 879 166 868 166Z');fill(minaret,'M870 166L871 132 873 117 876 132 877 166Z');path(minaret,'M873 117V110 M871 108Q878 112 876 103',.7);
 function window(g:Element,x:number,y:number,w=24,h=32){const pane=rect(g,x,y,w,h);const gl=el('ellipse',{cx:x+w/2,cy:y+h/2,rx:38,ry:40,fill:'url(#warm)',opacity:0},glow);windows.push({pane,x,y,thr:rand(.15,.7),glow:gl});path(g,`M${x+w/2} ${y}L${x+w/2} ${y+h} M${x} ${y+h*.53}Q${x+w/2} ${y+h*.53-.5} ${x+w} ${y+h*.53}`, .8);for(let i=3;i<w;i+=5)path(g,`M${x+i} ${y+h*.56}v${h*.44}`,.35);}
 function house(x:number,w:number,top:number,roof:number,name:string,accent=false){
  const g=el('g',{},buildings);rect(g,x,top,w,410-top);const roofP=fill(g,`M${x-9} ${top+3}Q${x+w/2} ${roof+3} ${x+w*.55} ${roof}L${x+w+10} ${top+3}Q${x+w/2} ${top+9} ${x-9} ${top+3}Z`, '#b4856c');accents.push(roofP);
  for(let tx=x-3;tx<x+w+6;tx+=7){const u=(tx-x)/w,yy=top-(top-roof)*Math.max(0,1-Math.abs(u-.55)/.55);path(g,`M${tx} ${top+3}Q${tx-2} ${yy+12} ${x+w*.55+(tx-x-w*.55)*.17} ${roof+3}`,.35);path(g,`M${tx-2} ${top+4}q2 3 4 0`,.6);}
  path(g,`M${x-5} ${top+10}Q${x+w/2} ${top+14} ${x+w+5} ${top+10} M${x+4} ${top+17}V403 M${x+w-4} ${top+17}V403 M${x} 338Q${x+w/2} 340 ${x+w} 338`,1.1);
  const wy=top+27;if(w<=150)for(let xx=x+17;xx<x+w-26;xx+=39)window(g,xx,wy,23,31);
  // Exposed timber frame and a projecting upper room.
  if(w>150){rect(g,x+30,top+16,w-60,68);path(g,`M${x+24} ${top+87}H${x+w-24} M${x+32} ${top+86}l8 15 M${x+w-32} ${top+86}l-8 15`,1);for(let xx=x+43;xx<x+w-40;xx+=35)window(g,xx,top+28,22,34);path(g,`M${x+30} ${top+69}H${x+w-30} M${x+36} ${top+71}l11 10 M${x+w-36} ${top+71}l-11 10`,.55);}
  // Irregular stone footing, plaster repairs, drainpipe.
  path(g,`M${x+2} 403H${x+w-2} M${x+9} ${top+16}Q${x+7} 326 ${x+10} 403`,.55);
  for(let sx=x+4;sx<x+w-9;sx+=14)path(g,`M${sx} 405l1 5 M${sx+7} 400l-1 4`,.45);
  const sign=el('g',{},g),sgn=rect(sign,x+w*.17,342,w*.66,20);sgn.classList.remove('pp');sgn.setAttribute('fill',accent?'#aa7152':'var(--paper)');if(accent)accents.push(sgn);txt(sign,x+w/2,355,name,9);
  const shop=el('g',{},g),sw=w*.58,sx=x+(w-sw)/2;rect(shop,sx,367,sw,42);path(shop,`M${sx} 395H${sx+sw}`, .65);
  if(name==='KAHVEHANE'){for(let j=0;j<4;j++){path(shop,`M${sx+9+j*14} 386h8l-2 5h-5Z M${sx+11+j*14} 380q-3 -3 0 -6`,.65);}}
  else if(name==='FIRIN'){for(let j=0;j<5;j++)fill(shop,`M${sx+7+j*11} 394q-3 -11 3 -13q7 1 5 13Z`,'#bc9865');}
  else{for(let j=0;j<4;j++){const p=rect(shop,sx+7+j*14,378,10,17);p.classList.remove('pp');p.setAttribute('fill',j%2?'#a18f67':'#8d9a84');}}
  const shutters=[el('g',{},g),el('g',{},g)];shutters.forEach((sh,i)=>{rect(sh,sx+i*sw/2,365,sw/2,45);for(let z=3;z<sw/2;z+=4)path(sh,`M${sx+i*sw/2+z} 367v40`,.42);});
  const s={g:shop,shutters,op:spring(20,8,1),override:-1,sign,swing:pendulum(12,1.5),x:x+w/2};shops.push(s);
  const hit=el('rect',{x:x+10,y:340,width:w-20,height:73,fill:'transparent'},g);react(hit,`${name}: kepenkleri aç veya kapat`,()=>{s.override=s.op.x>.5?0:1;s.swing.kick(1.2);});
  return g;
 }
 house(-32,177,268,225,'MANAV');house(151,175,251,211,'TERZİ');house(334,222,238,190,'KAHVEHANE',true);house(565,167,270,227,'FIRIN');house(741,204,248,202,'BAKKAL');house(953,217,265,215,'HANCININ YERİ');
 // Wires bow under their own weight, masonry fountain, wood bench, crates and jars.
 path(front,'M0 294Q278 323 570 294Q850 323 1140 287',.65);
 for(const x of [27,576,1108]){fill(front,`M${x-2} 418L${x-1} 281 ${x+1} 281 ${x+3} 418Z`);path(front,`M${x-7} 289q7 -5 15 -2`,.8);}
 fill(front,'M319 414L320 372Q319 360 330 358Q342 360 342 372L343 414Z');fill(front,'M323 383Q330 369 339 383L339 398H323Z');path(front,'M330 384v7h4 M320 404q10 5 22 0 M325 409h13',.7);
 for(const x of [97,539,716,1004]){fill(front,`M${x} 406q-6 -9 -3 -17h15q3 9 -3 17Z`);path(front,`M${x+4} 388q-9 -17 -12 -11 M${x+4} 388q3 -22 10 -19 M${x+4} 388q-2 -17 -7 -20`,.8);}
 path(front,'M386 412H435 M391 406H432 M392 408v13 M430 408v13',1.8);
 for(let i=0;i<13;i++){let x=rand(0,1140),y=rand(419,474);path(front,`M${x} ${y}q6 -2 12 0 m-5 3l5 .2`,.4);}
 const lanterns=[132,556,737,948].map(x=>{const g=el('g',{},front);path(g,`M${x} 341v-14q10 -5 13 3`,.85);const lantern=el('g',{},g);fill(lantern,`M${x+7} 331h13l-2 20h-9Z`);path(lantern,`M${x+6} 332h15 M${x+10} 352h8 M${x+13} 334v15`,.6);const light=el('ellipse',{cx:x+13,cy:342,rx:45,ry:53,fill:'url(#warm)'},glow),s=pendulum(10,1.4);react(g,'Fener: hafifçe salla',()=>s.kick(2));return {lantern,light,s,x};});
 return {shops,windows,update(dt:number,t:number,tau:number,wind:number,P:Palette){
  accents.forEach(a=>a.setAttribute('fill',nightTint('#b18469',P)));
  windows.forEach((w,i)=>{const on=Math.max(0,Math.min(1,(P.lamp-w.thr)*4))*(tau<.18&&i%3===0?.15:1);w.pane.classList.remove('pp');w.pane.setAttribute('fill',rgb(mix(P.paper,toRGB('#eac586'),on*.85)));w.glow.setAttribute('opacity',String(on*.38));});
  shops.forEach((s,i)=>{const opening=tau>(.27+i*.006)&&tau<(.76-i*.009),target=s.override>=0?s.override:opening?1:0;if(dt===0){s.op.x=target;s.op.v=0;}const op=s.op.step(target,dt);s.shutters.forEach((sh,j)=>{const pivot=s.x;sh.setAttribute('transform',`translate(${pivot} 0) scale(${f(Math.max(.02,1-op))} 1) translate(${-pivot} 0)`)});s.sign.setAttribute('transform',`rotate(${f(s.swing.step(wind*.03,dt)*57.3)} ${s.x} 342)`);});
  lanterns.forEach(l=>{l.lantern.setAttribute('transform',`rotate(${f(l.s.step(wind*.3,dt)*57.3)} ${l.x+13} 330)`);l.light.setAttribute('opacity',String(P.lamp*.65));});
 }};
}
