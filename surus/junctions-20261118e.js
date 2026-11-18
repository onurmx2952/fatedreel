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
   if(j.sign)this.addVerifiedSign(scene,world,j.sign);

  }
 }
 addVerifiedSign(scene,world,sign){
  const p=world.path.point(sign.s,sign.offset),ground=world.groundHeight(sign.s,sign.offset),canvas=document.createElement('canvas');canvas.width=768;canvas.height=288;const c=canvas.getContext('2d');
  c.fillStyle='#fafbf3';c.beginPath();c.moveTo(8,8);c.lineTo(688,8);c.lineTo(760,144);c.lineTo(688,280);c.lineTo(8,280);c.closePath();c.fill();c.strokeStyle='#263744';c.lineWidth=11;c.stroke();c.fillStyle='#263744';c.font='58px sans-serif';c.textAlign='left';c.fillText('Güvenli',30,98);c.font='bold 70px sans-serif';c.fillText('BAŞÇİFTLİK',30,222);c.font='58px sans-serif';c.textAlign='right';c.fillText('3',650,98);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const board=new T.Mesh(new T.PlaneGeometry(1.65,.62),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));board.position.set(p.x,ground+1.95,p.z);board.rotation.y=sign.yaw;board.name='Verified Güvenli Başçiftlik direction sign';board.userData={kind:'generated',source:sign.sourcePano,provenance:'lettering and right arrow verified from user photograph; placement/dimensions approximate'};scene.add(board);
  for(const side of [-1,1]){const pole=new T.Mesh(new T.CylinderGeometry(.025,.025,1.75,6),new T.MeshLambertMaterial({color:0xc4cbc8}));pole.position.set(p.x+Math.cos(sign.yaw)*side*.58,ground+.875,p.z-Math.sin(sign.yaw)*side*.58);scene.add(pole);}
 }
 near(x,z,margin=5){return this.segments.some(([a,b])=>{const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)<margin;});}
}
