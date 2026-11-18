import * as C from './vendor/cannon-es.js';

export function makePhysicsWorld(){
 const world=new C.World({gravity:new C.Vec3(0,-9.81,0)});
 world.broadphase=new C.SAPBroadphase(world);
 world.solver.iterations=12;
 world.defaultContactMaterial.friction=.55;
 world.defaultContactMaterial.restitution=.025;
 world.defaultContactMaterial.contactEquationStiffness=1e7;
 return world;
}

export class AutomaticPedals{
 constructor(){this.reverseWait=0;}
 reset(){this.reverseWait=0;}
 update(car,forward,reverse,dt){
  const speed=car.signedSpeed();
  if(forward&&reverse){this.reverseWait=0;return {gas:0,brake:1};}
  if(reverse){
   if(speed>.3){this.reverseWait=0;return {gas:0,brake:1};}
   if(car.gear!==-1){this.reverseWait+=dt;if(this.reverseWait<.16||!car.setGear(-1))return {gas:0,brake:1};}
   return {gas:1,brake:0};
  }
  this.reverseWait=0;
  if(forward){if(speed<-.3)return {gas:0,brake:1};if(car.gear!==1&&!car.setGear(1))return {gas:0,brake:1};return {gas:1,brake:0};}
  return {gas:0,brake:0};
 }
}

export class PhysicsCar{
 constructor(world){
  this.world=world;this.mass=1150;this.gear=1;this.steer=0;this.controls={gas:0,brake:0,steer:0,handbrake:0};this.surface='Asfalt';this.paused=false;this.pedals=null;this.automatic=new AutomaticPedals();
  this.body=new C.Body({mass:this.mass,linearDamping:0,angularDamping:.22,collisionFilterGroup:8,collisionFilterMask:7});
  this.body.addShape(new C.Box(new C.Vec3(.69,.20,1.58)),new C.Vec3(0,.10,0));
  // Sphere support shapes also collide with the actual triangle-mesh terrain.
  for(const x of [-.55,.55])for(const z of [-1.12,1.12])this.body.addShape(new C.Sphere(.25),new C.Vec3(x,.02,z));
  this.vehicle=new C.RaycastVehicle({chassisBody:this.body,indexRightAxis:0,indexUpAxis:1,indexForwardAxis:2});
  for(const z of [1.10,-1.10])for(const x of [-.80,.80])this.vehicle.addWheel({radius:.38,directionLocal:new C.Vec3(0,-1,0),axleLocal:new C.Vec3(-1,0,0),chassisConnectionPointLocal:new C.Vec3(x,.08,z),suspensionStiffness:z>0?38:40,suspensionRestLength:.30,frictionSlip:z>0?2.2:2.45,dampingRelaxation:4.8,dampingCompression:5.2,maxSuspensionForce:15000,rollInfluence:.08,maxSuspensionTravel:.18,customSlidingRotationalSpeed:-25,useCustomSlidingRotationalSpeed:true});
  this.beforeStep=()=>this.applyControls(world.dt||1/60);
  world.addEventListener('preStep',this.beforeStep);
  this.vehicle.addToWorld(world);
  this.forward=new C.Vec3();this.drag=new C.Vec3();
 }
 signedSpeed(){this.body.quaternion.vmult(new C.Vec3(0,0,1),this.forward);return this.body.velocity.dot(this.forward);}
 setGear(gear){if(Math.abs(this.signedSpeed())>.55)return false;this.gear=gear<0?-1:1;return true;}
 reset(p,yaw,pitch=0){
  this.gear=1;this.pedals=null;this.automatic.reset();this.body.position.set(p.x,p.y+.9,p.z);this.body.quaternion.setFromEuler(-pitch,yaw,0,'YXZ');
  this.body.velocity.setZero();this.body.angularVelocity.setZero();this.body.force.setZero();this.body.torque.setZero();this.body.previousPosition.copy(this.body.position);this.body.interpolatedPosition.copy(this.body.position);this.body.previousQuaternion.copy(this.body.quaternion);this.body.interpolatedQuaternion.copy(this.body.quaternion);this.body.aabbNeedsUpdate=true;this.body.wakeUp();this.roadOffset=0;this.steer=0;this.controls={gas:0,brake:1,steer:0,handbrake:0};
  for(const w of this.vehicle.wheelInfos){w.suspensionLength=w.suspensionRestLength;w.rotation=0;w.deltaRotation=0;w.engineForce=0;w.brake=0;w.steering=0;w.isInContact=false;w.raycastResult.reset();}
 }
 applyControls(dt){
  if(this.pedals)Object.assign(this.controls,this.automatic.update(this,this.pedals.forward,this.pedals.reverse,dt));
  const v=this.signedSpeed(),speed=Math.abs(v),u=this.controls;
  // Enable the terrain contact layer when leaving the road ribbon.
  this.body.collisionFilterMask=Math.abs(this.roadOffset||0)>2.5?7:5;
  const contacts=this.vehicle.wheelInfos.filter(w=>w.raycastResult.body);
  const lowGrip=contacts.some(w=>w.raycastResult.body.surface==='snow')?2.6:contacts.some(w=>['soil','gravel'].includes(w.raycastResult.body.surface))?4.5:8.4;
  // Progressive steering retains useful lock at speed; tires still determine actual grip.
  const safeAngle=Math.atan(2.2*lowGrip/Math.max(22,speed*speed));
  const directAngle=.58/(1+(speed/15)**2);
  const maxSteer=Math.min(.58,Math.max(safeAngle,Math.min(directAngle,safeAngle*1.8))),target=Math.max(-1,Math.min(1,u.steer))*maxSteer;
  this.steer+=(target-this.steer)*(1-Math.exp(-16*dt));
  // Ackermann: the inner front wheel turns more than the outer front wheel.
  const radius=2.2/Math.max(.00001,Math.tan(Math.abs(this.steer))),inner=Math.atan(2.2/(radius-.80)),outer=Math.atan(2.2/(radius+.80));
  this.vehicle.setSteeringValue(this.steer>=0?outer:-inner,0);this.vehicle.setSteeringValue(this.steer>=0?inner:-outer,1);
  const limiter=this.gear>0?Math.max(0,Math.min(1,(36-speed)/6)):Math.max(0,Math.min(1,(8-speed)/3));
  const drive=(this.gear>0?2800:1700)/(1+(speed/20)**2)*limiter*u.gas*(u.handbrake?0:1);
  const opposing=this.gear*v<-.4;
  for(let i=0;i<4;i++){
   const w=this.vehicle.wheelInfos[i],surface=w.raycastResult.body?.surface||'asphalt';
   let grip=surface==='snow'?.45:surface==='soil'?.75:surface==='gravel'||Math.abs(this.roadOffset||0)>3.3?.95:i<2?2.2:2.45;
   if(u.handbrake&&i>=2)grip*=.65;
   w.frictionSlip=grip;
   const normal=w.raycastResult.body?Math.max(0,Math.min(w.suspensionForce,w.maxSuspensionForce)):0;
   const tireLimit=normal*grip,lateral=Math.min(tireLimit,Math.abs(w.sideImpulse||0)/Math.max(dt,1/120));
   const available=Math.sqrt(Math.max(0,tireLimit*tireLimit-lateral*lateral));
   this.vehicle.applyEngineForce(i>=2&&!opposing?-Math.min(drive,available)*this.gear:0,i);
   const brakeForce=i<2?2250:1450;
   this.vehicle.setBrake(Math.min(tireLimit*dt,Math.max(u.brake*brakeForce*dt,opposing?u.gas*brakeForce*dt:0,u.handbrake&&i>=2?3600*dt:0)),i);
  }
  // Mechanical anti-roll bars link the left/right suspension on each axle.
  for(const [left,right,stiffness] of [[0,1,6500],[2,3,4500]]){const a=this.vehicle.wheelInfos[left],b=this.vehicle.wheelInfos[right];if(!a.raycastResult.body||!b.raycastResult.body)continue;const difference=(a.suspensionRestLength-a.suspensionLength)-(b.suspensionRestLength-b.suspensionLength),force=Math.max(-1800,Math.min(1800,difference*stiffness));const axis=this.body.quaternion.vmult(new C.Vec3(0,1,0));for(const [wheel,sign] of [[a,1],[b,-1]]){const offset=this.body.vectorToWorldFrame(wheel.chassisConnectionPointLocal),f=axis.scale(force*sign);this.body.applyForce(f,offset);}}
  // Aerodynamic drag and rolling resistance. Gravity and suspension are solved by cannon-es.
  const velocity=this.body.velocity,magnitude=velocity.length();velocity.scale(-.43*magnitude,this.drag);this.body.applyForce(this.drag);
  if(this.vehicle.numWheelsOnGround>0&&speed>.08){const resistance=Math.min(.015*this.mass*9.81,this.mass*speed/Math.max(dt,1/120));this.forward.scale(-Math.sign(v)*resistance,this.drag);this.body.applyForce(this.drag);}
 }
 get wheelContacts(){return this.vehicle.numWheelsOnGround;}
}
