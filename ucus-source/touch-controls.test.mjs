import assert from 'node:assert/strict';
import { test } from 'node:test';
class Element {
 constructor(){this.events={};this.style={};this.dataset={};this.classes=new Set();this.classList={add:(...v)=>v.forEach(x=>this.classes.add(x)),remove:(...v)=>v.forEach(x=>this.classes.delete(x)),contains:v=>this.classes.has(v)};}
 addEventListener(k,fn){(this.events[k]??=[]).push(fn)}
 fire(k,v={}){for(const fn of this.events[k]||[])fn({pointerId:1,preventDefault(){},...v})}
 setPointerCapture(){} setAttribute(k,v){this[k]=v} insertAdjacentHTML(){}
 getBoundingClientRect(){return {left:0,top:0,width:164,height:164}}
 querySelector(k){return nodes[k]??=new Element()}
 querySelectorAll(k){return k==='[data-hold]'?holds:[]}
}
const nodes={}, holds=['left','right','brake'].map(k=>{const e=new Element();e.dataset.hold=k;return e});
globalThis.window=new Element();
globalThis.document=new Element();document.body=new Element();document.body.append=()=>{};document.createElement=()=>new Element();document.getElementById=id=>nodes['#'+id]??=new Element();
Object.defineProperty(globalThis,'navigator',{value:{maxTouchPoints:5},configurable:true});
globalThis.matchMedia=()=>({matches:true});globalThis.location={search:''};globalThis.MutationObserver=class{observe(){}};
for(const id of ['menu','help'])document.getElementById(id).classList.add('hidden');
const {TouchControls}=await import('./src/touchControls.js');
const {Input}=await import('./src/input.js');
function setup(){let brake=false,throttle=0;const input=new Input({onBrake:v=>brake=v,onThrottleSet:v=>throttle=v});const app={input,fm:{throttle:0,parkingBrake:true},ap:{on:false},ui:{openMenu(){}}};return {t:new TouchControls(app),input,brake:()=>brake,throttle:()=>throttle};}
test('stick limits diagonal input, ignores a second finger, returns on cancellation',()=>{
 const {t,input}=setup();const e=nodes['#flightStick'];e.fire('pointerdown',{clientX:300,clientY:300});assert.ok(input.touch.roll>0&&input.touch.pitch>0);assert.ok(Math.hypot(input.touch.roll,input.touch.pitch)<=1.00001);
 const before={...input.touch};e.fire('pointerdown',{pointerId:2,clientX:0,clientY:0});assert.deepEqual(input.touch,before);
 input.update(.1);assert.ok(input.cur.roll>0&&input.cur.pitch>0);
 e.fire('pointercancel');assert.equal(input.touch.roll,0);assert.equal(input.touch.pitch,0);
});
test('rudder and brake remain independent with simultaneous pointers',()=>{
 const {t,input,brake}=setup();holds[0].fire('pointerdown',{pointerId:10});holds[2].fire('pointerdown',{pointerId:11});assert.equal(input.touch.yaw,-1);assert.equal(brake(),true);
 holds[0].fire('pointerup',{pointerId:10});assert.equal(input.touch.yaw,0);assert.equal(brake(),true);
 holds[2].fire('lostpointercapture',{pointerId:11});assert.equal(brake(),false);
});
test('interruption clears held axes, keyboard keys and brake',()=>{
 const {t,input,brake}=setup();holds[2].fire('pointerdown',{pointerId:15});input.touch.roll=1;input.keys.add('w');t.reset();assert.deepEqual(input.touch,{roll:0,pitch:0,yaw:0});assert.equal(input.keys.size,0);assert.equal(brake(),false);
});
test('throttle presets call the real input action',()=>{
 const {throttle}=setup();nodes['#touchFull'].fire('click');assert.equal(throttle(),1);nodes['#touchIdle'].fire('click');assert.equal(throttle(),0);
});
