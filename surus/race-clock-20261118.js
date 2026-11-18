export class RaceClock{
 constructor(length){this.length=length;this.state='idle';this.goAt=0;this.elapsed=0;this.lastStation=0;this.penalty=false;}
 start(now,station=8){this.goAt=now;this.state='countdown';this.elapsed=0;this.lastStation=station;this.penalty=false;}
 invalidate(){if(this.state==='running')this.penalty=true;}
 update(now,station,offset=0,speed=0){if(this.state==='countdown'&&now>=this.goAt)this.state='running';if(this.state==='running'){this.elapsed=Math.max(0,(now-this.goAt)/1000);if(!this.penalty&&this.lastStation<this.length-12&&station>=this.length-12&&Math.abs(offset)<3.3&&speed>0){this.state='finished';}}this.lastStation=station;return this.state;}
 get remaining(){return Math.max(0,Math.ceil((this.goAt-Date.now())/1000));}
}
export function formatRaceTime(seconds){const total=Math.max(0,Math.floor(seconds*100));return Math.floor(total/6000)+':'+String(Math.floor(total/100)%60).padStart(2,'0')+'.'+String(total%100).padStart(2,'0');}
