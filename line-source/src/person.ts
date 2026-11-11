import {el,pen,shape,blot,paint,limb,shoe,place,f,pt, type Vec} from './lib/ink.ts';
import {gait} from './lib/gait.ts';
import {spring,pendulum,ease} from './lib/motion.ts';
import {nightTint,type Palette} from './lib/daynight.ts';

export function person(parent:Element, x:number,y:number,dir:1|-1,kind:number,react:(g:SVGElement,label:string,fn:()=>void)=>void){
 const g=el('g',{'data-person':kind},parent),far=limb(g,3.6),legs=[limb(g,4.2),limb(g,4.2)],feet=[blot(g),blot(g)],coat=paint(g,kind===1?'#a17e67':'#7c8778'),seam=pen(g,.65),head=shape(g),hat=paint(g,'#76503d'),near=limb(g,3.6),bag=el('g',{},g),basket=paint(bag,'#ba9661',.8),handle=pen(bag,.7);
 const hit=el('rect',{x:17,y:13,width:47,height:110,fill:'transparent'},g);
 const walk=gait({kind:kind===2?'run':'walk'}),arms=[spring(60,9),spring(60,9)],swing=pendulum(14,2);let phase=kind*.3,reaction=-1,go=1;
 react(g,kind===1?'Sepetli kadın: selam ver':kind===2?'Çocuk: el salla':'Kasketli yolcu: selam ver',()=>{reaction=0;});
 const scale=kind===2?.42:.58;
 return {g,y,get x(){return x;},get phase(){return phase;},get reaction(){return reaction;},update(dt:number,wind:number,P:Palette){
  let tip=0;if(reaction>=0){reaction+=dt;tip=reaction<.4?ease(reaction/.4):reaction<1.6?1:1-ease((reaction-1.6)/.5);if(reaction>2.1)reaction=-1;}
  go+=(1-tip-go)*Math.min(1,dt*9);phase+=dt/walk.period*go;x+=dir*walk.speed*scale*dt*go;if(x>1190)x=-50;if(x< -50)x=1190;
  place(g,x,y,dir,scale);g.setAttribute('opacity',String(kind===2?1-P.night:kind===1?1-P.night*.65:1));const p=walk.pose(phase,go),b=p.bob;
  p.feet.forEach((foot,i)=>{legs[i].draw([p.hip,foot.knee,foot.ankle]);shoe(feet[i],foot.ankle,foot.pitch)});g.insertBefore(legs[p.front].g,coat);g.insertBefore(feet[p.front],coat);
  const knee=p.feet[p.front].knee,ank=p.feet[p.front].ankle,fx=Math.max(knee[0]+2,46),hem=kind===1?105:88;
  coat.setAttribute('d',`M34 ${42+b} Q40 ${38+b} 47 ${43+b} L${fx} ${75+b} Q${fx+2} 91 ${Math.max(fx,ank[0]-3)} ${hem} Q41 ${hem+2} 30 ${hem} L33 ${68+b}Z`);coat.setAttribute('fill',nightTint(kind===1?'#aa8d78':kind===2?'#ac7153':'#7c8778',P));
  seam.setAttribute('d',`M43 ${46+b} Q42 65 44 ${hem-4} M35 ${56+b} l9 3`);
  head.setAttribute('d',`M39 ${36+b} Q34 ${32+b} 38 ${26+b} Q43 ${22+b} 47 ${28+b} L49 ${32+b} 46 ${34+b} 45 ${40+b} 40 ${40+b}Z`);
  hat.setAttribute('d',kind===1?`M35 ${32+b} Q31 ${21+b} 41 ${21+b} Q49 ${22+b} 47 ${29+b} L50 ${43+b} 41 ${39+b}Z`:`M35 ${27+b-tip*3} Q37 ${19+b-tip*3} 46 ${23+b-tip*3} L51 ${27+b-tip*3} 45 ${29+b-tip*3}Z`);hat.setAttribute('fill',nightTint('#76503d',P));
  const s=(p.feet[0].ankle[0]-40)/(walk.stride/2),a=arms[0].step(-s*15*go,dt)*Math.PI/180,c=arms[1].step(s*16*go,dt)*Math.PI/180;
  far.draw([[38,45+b],[38+17*Math.sin(a),62+b],[38+32*Math.sin(a+.1),77+b]]);
  const hand:Vec=[43+31*Math.sin(c)*(1-tip)+10*tip,76+b-44*tip];near.draw([[44,45+b],[47+15*Math.sin(c)+10*tip,61+b-17*tip],hand]);
  bag.setAttribute('transform',`translate(${pt([hand[0],hand[1]])}) rotate(${f(swing.step(-s*.7+wind*.08,dt)*57.3)})`);bag.style.display=tip>.2?'none':'';handle.setAttribute('d','M-4 5 Q-4 -3 0 -3 Q4 -3 4 5');basket.setAttribute('d',kind===1?'M-10 4 Q0 1 10 4 L7 16 Q0 19 -7 16Z':'M-8 3 L8 3 8 16 -8 16Z');basket.setAttribute('fill',nightTint('#ba9661',P));
 }};
}
