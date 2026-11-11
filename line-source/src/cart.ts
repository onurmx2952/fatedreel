import {el,pen,shape,paint,limb,f,joint,type Vec} from './lib/ink.ts';
import {curve} from './lib/ink.ts';
import {spring,ease} from './lib/motion.ts';
import {nightTint,type Palette} from './lib/daynight.ts';
import type {React} from './street.ts';
export function cart(parent:Element,start:number,y:number,dir:1|-1,react:React){
 const g=el('g',{'data-cart':dir},parent),horse=el('g',{},g),legs=[limb(horse,3.5,.95),limb(horse,3.5,.95),limb(horse,3.5,.95),limb(horse,3.5,.95)],body=shape(horse,.95),neck=shape(horse,.95),tail=pen(horse,1.3),mane=pen(horse,1.5),reins=pen(g,.65),bed=paint(g,'#ac8863',.9),rim=pen(g,.6),driver=el('g',{},g);
 body.setAttribute('d','M63 -52Q88 -60 110 -47Q119 -33 102 -30L73 -32Q61 -36 63 -52');neck.setAttribute('d','M102 -45Q108 -64 116 -76L119 -86 124 -78 131 -76 136 -62Q134 -58 128 -61L122 -67Q123 -49 113 -33');mane.setAttribute('d','M107 -45Q108 -67 117 -77M111 -47Q112 -65 119 -75');
 const wheels=[20,53].map(x=>{const w=el('g',{},g);el('circle',{cx:0,cy:0,r:12,fill:'var(--paper)',stroke:'currentColor','stroke-width':1.2},w);el('circle',{cx:0,cy:0,r:9.7,fill:'none',stroke:'currentColor','stroke-width':.55},w);const p=pen(w,.7);p.setAttribute('d','M-12 0H12 M0 -12V12 M-8.5 -8.5L8.5 8.5 M-8.5 8.5L8.5 -8.5');el('circle',{r:2,fill:'currentColor'},w);return {w,x};});
 bed.setAttribute('d','M3 -45Q30 -44 67 -45L63 -19 9 -20Z');rim.setAttribute('d','M5 -38H65 M6 -31H64 M16 -44L17 -22 M29 -44V-21 M43 -44V-21 M55 -44L54 -22 M61 -22L103 -30');
 const driverBody=shape(driver,1);driverBody.setAttribute('d','M48 -70Q56 -73 61 -65L65 -47 53 -44 48 -58Z');const head=shape(driver,1);head.setAttribute('d','M52 -75Q46 -83 53 -86Q60 -85 59 -78L56 -75Z');pen(driver,2).setAttribute('d','M47 -85L62 -85 M50 -88L59 -88');pen(driver,1.1).setAttribute('d','M58 -64L70 -56 83 -57 M58 -47L71 -39 70 -25');
 const nod=spring(45,7),trot=curve([[0,0],[.22,8],[.5,0],[.75,-8]],1);let x=start,distance=0,phase=0,reaction=-1,speed=23;
 react(g,'At arabası: arabacı selam versin',()=>{reaction=0;nod.kick(-8)});el('rect',{x:0,y:-92,width:143,height:95,fill:'transparent'},g);
 return {g,y,get x(){return x;},get reaction(){return reaction;},update(dt:number,P:Palette){
  let greet=0;if(reaction>=0){reaction+=dt;greet=reaction<.4?ease(reaction/.4):reaction<1.4?1:1-ease((reaction-1.4)/.5);if(reaction>1.9)reaction=-1;}
  speed+=(23*(1-greet*.7)-speed)*dt*4;const d=speed*dt;x+=d*dir;distance+=d;phase+=d/(28/.63*.78);if(x>1260)x=-180;if(x< -180)x=1260;g.setAttribute('transform',`translate(${f(x)} ${y}) scale(${dir*.78} .78)`);
  const offsets=[0,.5,.5,0];legs.forEach((leg,i)=>{const u=(phase+offsets[i])%1,anchor:Vec=[i<2?72:106,-35];const xx=u<.63?14-28*u/.63:-14+28*ease((u-.63)/.37),lift=u<.63?0:Math.sin((u-.63)/.37*Math.PI)*13,ankle:Vec=[anchor[0]+xx,-lift];leg.draw([anchor,joint(anchor,ankle,19,19,i<2?-1:1),ankle]);});
  horse.insertBefore(legs[0].g,body);horse.insertBefore(legs[2].g,body);tail.setAttribute('d',`M65 -48Q${52+nod.step(-speed*.07,dt)} -39 ${53+trot(phase)*.3} -20`);reins.setAttribute('d',`M79 -57Q107 ${-45-greet*7} 131 -68 M14 -24L99 -29`);bed.setAttribute('fill',nightTint('#ac8863',P));wheels.forEach(({w,x:wx})=>w.setAttribute('transform',`translate(${wx} -12) rotate(${f(distance/.78/12*180/Math.PI)})`));driver.setAttribute('transform',`rotate(${-greet*9} 54 -47)`);
 }};
}
