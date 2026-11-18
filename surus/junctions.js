import * as T from './vendor/three.module.js';
// Branch positions/directions come from the archived panorama link graph.
export function branchPoints(j){const points=j.points.map(p=>p.slice());if(points.length===2){const a=points[0],b=points[1],length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(length<55)points.push([a[0]+(b[0]-a[0])*55/length,a[1]+(b[1]-a[1])*55/length]);}return points;}
export class Junctions{
 constructor(scene,world,inventory){this.inventory=inventory;this.meshes=[];this.world=world;this.segments=[];
  for(const j of inventory){const pts=branchPoints(j),positions=[],uv=[],indices=[];let distance=0;
   for(let k=0;k<pts.length-1;k++){const a=pts[k],b=pts[k+1],len=Math.hypot(b[0]-a[0],b[1]-a[1]),nx=-(b[1]-a[1])/len,nz=(b[0]-a[0])/len;this.segments.push([a,b]);const count=Math.ceil(len/2),base=positions.length/3;
    for(let i=0;i<=count;i++){const t=i/count,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;for(const side of [-1,1]){const xx=x+nx*side*2.8,zz=z+nz*side*2.8,n=world.path.nearest(xx,zz,j.s),y=Math.abs(n.offset)<3.95?world.path.sample(n.s).y+.055:world.groundHeight(n.s,n.offset)+.10;positions.push(xx,y,zz);uv.push(side<0?0:1,(distance+len*t)/8);}}
    for(let i=0;i<count;i++){const a=base+i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}distance+=len;
   }
   const mat=new T.MeshLambertMaterial({color:0x858580,map:world.mats.shoulder.map,side:T.DoubleSide}),mesh=new T.Mesh(world.geometry(positions,indices,uv),mat);mesh.name='Junction road '+j.id;mesh.userData={kind:'generated',junction:j.id,provenance:'panorama GPS branch; estimated width, elevation and extension'};scene.add(mesh);this.meshes.push(mesh);
   // A direction board before every recorded junction, visible from either approach.
   for(const direction of [1,-1]){const s=Math.max(0,Math.min(world.path.length,j.s-direction*28)),p=world.path.point(s,direction*5.1),ground=world.groundHeight(s,direction*5.1),canvas=document.createElement('canvas');canvas.width=768;canvas.height=320;const c=canvas.getContext('2d'),right=(j.side==='right')===(direction===1);c.fillStyle='#215182';c.fillRect(0,0,768,320);c.strokeStyle='#fff';c.lineWidth=10;c.strokeRect(10,10,748,300);c.fillStyle='white';c.font='bold 58px sans-serif';c.fillText(direction===1?'↑ Çamiçi':'↑ Niksar',32,90);c.font='bold 52px sans-serif';c.fillText((right?'→':'←')+' Yan yol',32,175);c.font='36px sans-serif';c.fillText('YOL AYRIMI · 30 m',32,260);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const board=new T.Mesh(new T.PlaneGeometry(3.2,1.34),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));board.position.set(p.x,ground+3,p.z);board.rotation.y=Math.atan2(-p.tx*direction,-p.tz*direction);board.name='Junction direction sign '+j.id;board.userData={kind:'generated',provenance:'simulator direction sign; not a replica of an original sign'};scene.add(board);
    for(const o of [-1.1,1.1]){const pole=new T.Mesh(new T.CylinderGeometry(.045,.045,2.6,6),world.signRenderer?.poleMaterial||new T.MeshLambertMaterial({color:0xaaaaaa}));pole.position.set(p.x+p.nx*o,ground+1.3,p.z+p.nz*o);scene.add(pole);}
   }
  }
 }
 near(x,z,margin=5){return this.segments.some(([a,b])=>{const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)<margin;});}
}
