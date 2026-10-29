import * as C from './vendor/cannon-es.js';

export function makePhysicsWorld(){
 const world=new C.World({gravity:new C.Vec3(0,-9.81,0)});
 world.broadphase=new C.SAPBroadphase(world);
 world.solver.iterations=8;
 world.defaultContactMaterial.friction=.55;
 world.defaultContactMaterial.restitution=.025;
 world.defaultContactMaterial.contactEquationStiffness=1e7;
 return world;
}

export class PhysicsCar{
 constructor(world){
  this.world=world;this.mass=1150;this.gear=1;this.steer=0;this.controls={gas:0,brake:0,steer:0,handbrake:0};this.surface='Asfalt';this.paused=false;
  this.body=new C.Body({mass:this.mass,linearDamping:0,angularDamping:.25,collisionFilterGroup:8,collisionFilterMask:7});
  this.body.addShape(new C.Box(new C.Vec3(.78,.22,1.8)),new C.Vec3(0,.04,0));
  // Sphere support shapes also collide with the actual triangle-mesh terrain.
  for(const x of [-.62,.62])for(const z of [-1.28,1.28])this.body.addShape(new C.Sphere(.29),new C.Vec3(x,-.04,z));
  this.vehicle=new C.RaycastVehicle({chassisBody:this.body,indexRightAxis:0,indexUpAxis:1,indexForwardAxis:2});
  for(const z of [1.25,-1.25])for(const x of [-.91,.91])this.vehicle.addWheel({radius:.34,directionLocal:new C.Vec3(0,-1,0),axleLocal:new C.Vec3(-1,0,0),chassisConnectionPointLocal:new C.Vec3(x,0,z),suspensionStiffness:32,suspensionRestLength:.4,frictionSlip:1.3,dampingRelaxation:2.5,dampingCompression:4.6,maxSuspensionForce:14000,rollInfluence:.09,maxSuspensionTravel:.25,customSlidingRotationalSpeed:-25,useCustomSlidingRotationalSpeed:true});
  this.beforeStep=()=>this.applyControls(world.dt||1/60);
  world.addEventListener('preStep',this.beforeStep);
  this.vehicle.addToWorld(world);
  this.forward=new C.Vec3();this.drag=new C.Vec3();
 }
 signedSpeed(){this.body.quaternion.vmult(new C.Vec3(0,0,1),this.forward);return this.body.velocity.dot(this.forward);}
 setGear(gear){if(Math.abs(this.signedSpeed())>.55)return false;this.gear=gear<0?-1:1;return true;}
 reset(p,yaw,pitch=0){
  this.gear=1;this.body.position.set(p.x,p.y+.9,p.z);this.body.quaternion.setFromEuler(-pitch,yaw,0,'YXZ');
  this.body.velocity.setZero();this.body.angularVelocity.setZero();this.body.force.setZero();this.body.torque.setZero();this.body.previousPosition.copy(this.body.position);this.body.interpolatedPosition.copy(this.body.position);this.body.previousQuaternion.copy(this.body.quaternion);this.body.interpolatedQuaternion.copy(this.body.quaternion);this.body.aabbNeedsUpdate=true;this.body.wakeUp();this.roadOffset=0;this.steer=0;this.controls={gas:0,brake:1,steer:0,handbrake:0};
  for(const w of this.vehicle.wheelInfos){w.suspensionLength=w.suspensionRestLength;w.rotation=0;w.deltaRotation=0;w.engineForce=0;w.brake=0;w.steering=0;w.isInContact=false;w.raycastResult.reset();}
 }
 applyControls(dt){
  const v=this.signedSpeed(),speed=Math.abs(v),u=this.controls;
  // Road boxes support the chassis; enable triangle terrain contact when leaving the road.
  this.body.collisionFilterMask=Math.abs(this.roadOffset||0)>2.5?7:5;
  const maxSteer=.56/(1+(speed/15)**2),target=Math.max(-1,Math.min(1,u.steer))*maxSteer;
  this.steer+=(target-this.steer)*(1-Math.exp(-7*dt));
  this.vehicle.setSteeringValue(this.steer,0);this.vehicle.setSteeringValue(this.steer,1);
  const limiter=this.gear>0?Math.max(0,Math.min(1,(36-speed)/6)):Math.max(0,Math.min(1,(8-speed)/3));
  const drive=(this.gear>0?2800:1700)/(1+(speed/20)**2)*limiter*u.gas*(u.handbrake?0:1);
  const opposing=this.gear*v<-.4;
  for(let i=0;i<4;i++){
   const w=this.vehicle.wheelInfos[i],surface=w.raycastResult.body?.surface||'asphalt';
   let grip=surface==='snow'?.4:surface==='soil'?.65:surface==='gravel'||Math.abs(this.roadOffset||0)>3.3?.8:1.3;
   if(u.handbrake&&i>=2)grip*=.65;
   w.frictionSlip=grip;
   const normal=w.raycastResult.body?Math.max(0,Math.min(w.suspensionForce,w.maxSuspensionForce)):0;
   const tireLimit=normal*grip,lateral=Math.min(tireLimit,Math.abs(w.sideImpulse||0)/Math.max(dt,1/120));
   const available=Math.sqrt(Math.max(0,tireLimit*tireLimit-lateral*lateral));
   this.vehicle.applyEngineForce(i>=2&&!opposing?-Math.min(drive,available)*this.gear:0,i);
   this.vehicle.setBrake(Math.min(tireLimit*dt,Math.max(u.brake*1440*dt,opposing?u.gas*1440*dt:0,u.handbrake&&i>=2?3600*dt:0)),i);
  }
  // Aerodynamic drag and rolling resistance. Gravity and suspension are solved by cannon-es.
  const velocity=this.body.velocity,magnitude=velocity.length();velocity.scale(-.43*magnitude,this.drag);this.body.applyForce(this.drag);
  if(this.vehicle.numWheelsOnGround>0&&speed>.08){const resistance=Math.min(.015*this.mass*9.81,this.mass*speed/Math.max(dt,1/120));this.forward.scale(-Math.sign(v)*resistance,this.drag);this.body.applyForce(this.drag);}
 }
 get wheelContacts(){return this.vehicle.numWheelsOnGround;}
}
