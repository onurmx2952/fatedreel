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

  }
 }
 near(x,z,margin=5){return this.segments.some(([a,b])=>{const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)<margin;});}
}
