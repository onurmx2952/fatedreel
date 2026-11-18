import assert from 'node:assert/strict';
import * as C from '../vendor/cannon-es.js';
import {PhysicsCar,makePhysicsWorld} from '../vehicle-physics.js';
function setup(grade=0){const w=makePhysicsWorld(),plane=new C.Body({mass:0,shape:new C.Plane()});plane.quaternion.setFromEuler(-Math.PI/2-grade,0,0);plane.aabbNeedsUpdate=true;plane.surface='asphalt';w.addBody(plane);const c=new PhysicsCar(w);c.reset({x:0,y:0,z:0},0,grade);for(let i=0;i<90;i++)w.step(1/60);return {w,c};}
function seconds(w,n){for(let i=0;i<Math.round(n*60);i++)w.step(1/60);}
let {w,c}=setup();console.log('settled',c.body.position,c.body.quaternion,c.vehicle.wheelInfos.map(w=>[w.isInContact,w.suspensionLength,w.suspensionForce]));assert.equal(c.wheelContacts,4);assert(c.body.position.y>.3&&c.body.position.y<1.2);c.controls={gas:1,brake:0,steer:0,handbrake:0};seconds(w,3);console.log('forward',c.body.position.z,c.signedSpeed());assert(c.body.position.z>5&&c.signedSpeed()>2);const before=c.signedSpeed();c.controls.gas=0;c.controls.brake=1;seconds(w,3);console.log('brake',before,c.signedSpeed());assert(Math.abs(c.signedSpeed())<.5);c.setGear(-1);c.controls={gas:1,brake:0,steer:0,handbrake:0};seconds(w,2);assert(c.signedSpeed()<-1);assert.equal(c.setGear(1),false);
({w,c}=setup());c.controls={gas:.8,brake:0,steer:.6,handbrake:0};seconds(w,3);console.log('steer',c.body.position.x,c.body.position.z);assert(c.body.position.x>1);
({w,c}=setup(.10));c.controls={gas:0,brake:0,steer:0,handbrake:0};seconds(w,3);console.log('hill',c.signedSpeed());assert(c.signedSpeed()<-.8);
function fixed(rate){const {w,c}=setup();c.controls={gas:.7,brake:0,steer:.15,handbrake:0};for(let i=0;i<rate*4;i++)w.step(1/60,1/rate,8);return c.body.position;}
const a=fixed(30),b=fixed(60),d=fixed(120);assert(a.distanceTo(b)<.6&&a.distanceTo(d)<.6);
({w,c}=setup());const barrier=new C.Body({mass:0,shape:new C.Box(new C.Vec3(3,2,.5)),position:new C.Vec3(0,2,10)});w.addBody(barrier);c.controls={gas:1,brake:0,steer:0,handbrake:0};seconds(w,5);assert(c.body.position.z<9,'car must not drive through a solid wall');
function grip(surface){const {w,c}=setup();w.bodies[0].surface=surface;c.controls={gas:1,brake:0,steer:0,handbrake:0};seconds(w,2);return c.signedSpeed();}
assert(grip('snow')<grip('asphalt')*.85,'snow must provide less acceleration grip');
console.log('PASS suspension/4 wheel contact, forward/reverse, braking, low-speed gear interlock, steering, gravity on a slope, fixed-step frame-rate consistency.');



