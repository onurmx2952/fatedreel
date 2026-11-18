import * as C from './vendor/cannon-es.js';
import * as T from './vendor/three.module.js';

export class RoadColliders{
 constructor(physics,world){this.physics=physics;this.world=world;this.groups=new Map();this.items=new Map();this.matrix=new T.Matrix4();this.p=new T.Vector3();this.q=new T.Quaternion();this.scale=new T.Vector3();
  for(const mesh of world.junctionRenderer?.meshes||[])this.addMesh(mesh,'asphalt').collisionFilterGroup=1;
  for(const mesh of world.boundaries.filter(x=>x.geometry?.getAttribute('snowMix')))this.addMesh(mesh,'soil');
 }
 addMesh(mesh,surface){const source=mesh.geometry.getAttribute('position').array,indices=mesh.geometry.index.array,center=mesh.geometry.boundingSphere.center;const positions=Array.from(source);for(let i=0;i<positions.length;i+=3){positions[i]-=center.x;positions[i+1]-=center.y;positions[i+2]-=center.z;}const shape=new C.Trimesh(positions,Array.from(indices)),body=new C.Body({mass:0,shape,position:new C.Vec3(center.x,center.y,center.z),collisionFilterGroup:2});body.surface=surface;this.physics.addBody(body);return body;}
 roadTiles(start,end){
  // One watertight ribbon per chunk: no overlapping box edges under the tires.
  const vertices=[],indices=[],origin=this.world.path.sample(start);
  const stations=[start];for(let s=Math.ceil((start+.00001)/2)*2;s<end;s+=2)stations.push(s);stations.push(end);
  for(const s of stations)for(const side of [-1,1]){const p=this.world.path.point(s,side*3.95);vertices.push(p.x-origin.x,p.y+.045-origin.y,p.z-origin.z);}
  for(let i=0;i<stations.length-1;i++){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  const body=new C.Body({mass:0,shape:new C.Trimesh(vertices,indices),position:new C.Vec3(origin.x,origin.y,origin.z),collisionFilterGroup:1});body.surface='asphalt';this.physics.addBody(body);return [body];
 }
 sync(position,station){
  const wanted=new Set();for(const [i,g] of this.world.cache){const mid=this.world.path.sample(Math.min(this.world.path.length,i*160+80));if(Math.hypot(mid.x-position.x,mid.z-position.z)>150&&Math.abs(mid.s-station)>130)continue;wanted.add(i);if(!this.groups.has(i)){const start=i*160,end=Math.min(this.world.path.length,start+160),bodies=this.roadTiles(start,end);for(const mesh of g.children)if(mesh.userData.kind==='photo'&&!mesh.isInstancedMesh)bodies.push(this.addMesh(mesh,mid.snow>.5?'snow':'soil'));this.groups.set(i,bodies);}}
  for(const [i,bodies] of this.groups)if(!wanted.has(i)){for(const body of bodies)this.physics.removeBody(body);this.groups.delete(i);}
  const nearby=new Set();for(const [i,g] of this.world.cache)for(const mesh of g.children){if(!mesh.isInstancedMesh||!['Trunks','Rocks','Estimated buildings','Sign posts'].includes(mesh.name))continue;for(let j=0;j<mesh.count;j++){mesh.getMatrixAt(j,this.matrix);this.matrix.decompose(this.p,this.q,this.scale);if(Math.hypot(this.p.x-position.x,this.p.z-position.z)>75)continue;const key=i+':'+mesh.name+':'+j;nearby.add(key);if(this.items.has(key))continue;let shape;if(mesh.name==='Rocks')shape=new C.Sphere(Math.max(.1,Math.max(this.scale.x,this.scale.y,this.scale.z)*.7));else if((mesh.name==='Trunks'||mesh.name==='Sign posts'))shape=new C.Box(new C.Vec3(Math.max(.07,this.scale.x*.7),this.scale.y/2,Math.max(.07,this.scale.z*.7)));else shape=new C.Box(new C.Vec3(this.scale.x/2,this.scale.y/2,this.scale.z/2));const b=new C.Body({mass:0,shape,position:new C.Vec3(this.p.x,this.p.y,this.p.z)});b.quaternion.set(this.q.x,this.q.y,this.q.z,this.q.w);b.collisionFilterGroup=4;b.aabbNeedsUpdate=true;b.surface='object';this.physics.addBody(b);this.items.set(key,b);}}
  for(const [key,body] of this.items)if(!nearby.has(key)){this.physics.removeBody(body);this.items.delete(key);}
 }
}
