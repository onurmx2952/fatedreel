import * as T from './vendor/three.module.js';

export class CarView{
 constructor(scene){
  this.root=new T.Group();scene.add(this.root);this.wheels=[];
  const paint=new T.MeshLambertMaterial({color:0xd36538}),glass=new T.MeshLambertMaterial({color:0x344f5b}),trim=new T.MeshLambertMaterial({color:0x343a3b}),headlight=new T.MeshBasicMaterial({color:0xffefbc});this.brakeMaterial=new T.MeshBasicMaterial({color:0x7f2620});
  const box=(size,pos,mat)=>{const mesh=new T.Mesh(new T.BoxGeometry(...size),mat);mesh.position.set(...pos);this.root.add(mesh);return mesh;};
  box([1.78,.46,4.05],[0,0,0],paint);box([1.52,.65,1.98],[0,.53,-.25],glass);box([1.58,.09,2.05],[0,.89,-.25],paint);box([1.78,.1,1.12],[0,.29,1.22],paint);
  for(const x of [-.79,.79])box([.075,.7,2.03],[x,.5,-.25],paint);
  box([1.82,.16,.18],[0,-.15,2.03],trim);box([1.82,.16,.18],[0,-.15,-2.03],trim);
  for(const x of [-.58,.58]){box([.4,.14,.04],[x,.1,2.039],headlight);box([.36,.16,.04],[x,.1,-2.039],this.brakeMaterial);}
  const tireGeo=new T.CylinderGeometry(.34,.34,.22,12);tireGeo.rotateZ(Math.PI/2);const tireMat=new T.MeshLambertMaterial({color:0x292b29}),hubMat=new T.MeshLambertMaterial({color:0xabb1ad});const hubGeo=new T.CylinderGeometry(.17,.17,.23,8);hubGeo.rotateZ(Math.PI/2);
  for(let i=0;i<4;i++){const wheel=new T.Group();wheel.add(new T.Mesh(tireGeo,tireMat));wheel.add(new T.Mesh(hubGeo,hubMat));scene.add(wheel);this.wheels.push(wheel);}
  this.runningGear=new T.InstancedMesh(new T.CylinderGeometry(1,1,1,6),new T.MeshLambertMaterial({color:0xffffff}),6);this.runningGear.name='Axles and suspension struts';for(let i=0;i<6;i++)this.runningGear.setColorAt(i,new T.Color(i<2?0x596263:0x995d3e));this.runningGear.frustumCulled=false;scene.add(this.runningGear);this.linkDummy=new T.Object3D();this.linkAxis=new T.Vector3();this.linkA=new T.Vector3();this.linkB=new T.Vector3();
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const c=canvas.getContext('2d'),g=c.createRadialGradient(32,32,3,32,32,32);g.addColorStop(0,'rgba(15,24,21,.35)');g.addColorStop(1,'rgba(15,24,21,0)');c.fillStyle=g;c.fillRect(0,0,64,64);this.shadow=new T.Mesh(new T.PlaneGeometry(2.8,5),new T.MeshBasicMaterial({map:new T.CanvasTexture(canvas),transparent:true,depthWrite:false}));this.shadow.rotation.x=-Math.PI/2;scene.add(this.shadow);
 }
 update(car,groundY){this.root.position.copy(car.body.position);this.root.quaternion.copy(car.body.quaternion);for(let i=0;i<4;i++){car.vehicle.updateWheelTransform(i);const t=car.vehicle.getWheelTransformWorld(i);this.wheels[i].position.copy(t.position);this.wheels[i].quaternion.copy(t.quaternion);}for(let i=0;i<6;i++){if(i<2){this.linkA.copy(this.wheels[i*2].position);this.linkB.copy(this.wheels[i*2+1].position);}else{const w=car.vehicle.wheelInfos[i-2];this.linkA.copy(w.chassisConnectionPointWorld);this.linkB.copy(this.wheels[i-2].position);}this.linkAxis.subVectors(this.linkB,this.linkA);const length=this.linkAxis.length();this.linkDummy.position.copy(this.linkA).add(this.linkB).multiplyScalar(.5);this.linkDummy.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),this.linkAxis.normalize());this.linkDummy.scale.set(i<2?.035:.028,length,i<2?.035:.028);this.linkDummy.updateMatrix();this.runningGear.setMatrixAt(i,this.linkDummy.matrix);}this.runningGear.instanceMatrix.needsUpdate=true;this.brakeMaterial.color.set(car.controls.brake||car.controls.handbrake?0xff3826:0x7f2620);this.shadow.position.set(car.body.position.x,groundY+.055,car.body.position.z);}
}
