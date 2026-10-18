import * as k from './vendor/iso-kit.mjs';
import {writeFileSync,readFileSync} from 'node:fs';
const P=k.fitProjection([[-220,-135,-22],[230,135,-22],[-25,-135,170],[230,135,110]],1000,600,{pad:35,azimuth:54,elevation:28});
const out=[];
const S=(paths,tone='mid')=>k.solidSvg(paths,{tone,crease:'faint'});
function box(x,y,w,d,z,h,tone='mid',cls=''){out.push(`<g class="${cls}">${S(k.slabOf({x,y,w,d,r:0.5},z,h,P,2,.4),tone)}</g>`)}
const polygon=(pts,cls)=>`<path class="${cls}" d="${pts.map((p,i)=>(i?'L':'M')+k.iso(p,P).join(',')).join('')}Z"/>`;
box(-220,-135,450,270,-22,22,'lo');
for(let j=0;j<4;j++)box(-218,-133+j*67,446,65,-23-j*.15,1,'faint');
box(-218,-133,168,265,0,3,'lo');
out.push(polygon([[-218,-133,3],[-51,-133,3],[-51,-133,126],[-218,-133,126]],'water-side'));
out.push(polygon([[-218,132,3],[-51,132,3],[-51,132,126],[-218,132,126]],'water-side'));
out.push(polygon([[-218,-133,126],[-51,-133,126],[-51,132,126],[-218,132,126]],'water-top'));
for(let j=0;j<12;j++){
 const y=-132+j*22;
 // Real gravity-dam profile: vertical upstream face, sloping downstream face.
 const a=[[-50,y,0],[64,y,0],[-29,y,155],[-50,y,155]],b=a.map(p=>[p[0],y+21.5,p[2]]);
 out.push(polygon(a,'concrete-cut'),polygon([a[1],b[1],b[2],a[2]],'concrete-slope'),polygon([a[2],b[2],b[3],a[3]],'concrete-top'));
 box(-52,y,28,21,155,3,'mid');box(-52,y,2,2,158,9,'mid');
}
box(-52,-132,2,264,167,2);box(-27,-132,2,264,158,2);
// Spillway is separate from the generating waterway.
box(39,-127,151,37,0,5);box(39,-127,151,3,5,13);box(39,-93,151,3,5,13);
out.push(polygon([[-26,-124,153],[44,-124,9],[190,-124,9],[190,-96,9],[44,-96,9],[-26,-96,153]],'spill-water'));
for(let i=0;i<5;i++)box(175,-123+i*6,5,3,5,8);
box(96,-78,125,130,0,5);
box(98,-76,122,4,5,90);
for(let i=0;i<6;i++){box(104+i*18,-71,14,2,58,25,'lo');box(105+i*18,-68,12,1,60,21,'faint')}
for(const x of [98,213])for(const y of [-70,45])box(x,y,5,5,5,92);
box(98,-72,120,5,97,5);box(98,45,120,5,97,5);
box(105,-65,99,12,39,3);
box(135,-35,48,48,5,9,'lo');box(141,-29,36,36,14,36,'mid');
for(let i=0;i<7;i++)box(140+i*5,-30,2,38,50,2,'lo');
box(149,-21,20,20,52,4,'lo');
box(173,59,45,47,0,4);box(178,64,35,36,4,29);
for(let i=0;i<7;i++)box(177+i*5,63,2,38,5,27,'lo');
for(let i=0;i<3;i++)box(183+i*10,74,3,4,33,12,'lo');
// Intake gate and trash rack seated against the upstream wall.
box(-59,67,6,39,71,4);box(-58,67,4,3,75,45);box(-58,103,4,3,75,45);
for(let i=0;i<8;i++)box(-60,70+i*4.4,2,1,75,40,'lo');
box(-56,72,2,29,78,32,'lo');box(-65,65,18,44,120,4);box(-61,68,3,3,124,28);box(-61,102,3,3,124,28);box(-63,68,7,37,152,4);
// A near-side cut face reveals the section through the pressure waterway.
const route=[[-54,120,90],[-32,120,90],[53,120,20],[144,120,20],[158,120,8],[221,120,8]];
const d=route.map((p,i)=>(i?'L':'M')+k.iso(p,P).join(',')).join('');
out.push(`<path d="${d}" class="conduit-case"/><path d="${d}" class="conduit-water"/><path d="${d}" class="flow"/>`);
box(145,108,29,25,22,12,'lo');box(151,113,16,16,34,24);box(148,110,22,22,58,3);
const iso=k.figureSvg({width:1000,height:600,label:'Rezervuar, ağırlık barajı, ayrı dolusavak ve ön kesitte açığa çıkarılan cebri boru ile santral maketi',body:out.join('')});
const template=readFileSync(new URL('template.html',import.meta.url),'utf8');
writeFileSync(new URL('index.html',import.meta.url),template.replace('/* KIT_CSS */',k.ISO_CSS).replace('<!-- ISOMETRIC -->',iso));
console.log('Built o2/index.html; structural solids:',out.length);

