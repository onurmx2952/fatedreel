import * as esbuild from 'esbuild';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('.test', {recursive:true});
await esbuild.build({stdin:{contents:'export {default as game} from "./stores/GameStore"; export {default as settings} from "./stores/SettingsStore"; export {startSchedule,flights,clock} from "./ltac-schedule";',resolveDir:process.cwd()},bundle:true,platform:'node',format:'cjs',outfile:'.test/schedule.cjs',loader:{'.js':'jsx','.css':'empty'},jsxFactory:'h',inject:['./jsx-inject.js'],alias:{react:'preact/compat','react-dom':'preact/compat'}});
globalThis.window={speechSynthesis:{addEventListener(){},getVoices(){return [];}},addEventListener(){}};
const memory = new Map();
globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
const {game,settings,startSchedule,flights,clock}=createRequire(import.meta.url)('./.test/schedule.cjs');
assert.equal(flights.length,497);
const results=[];
for(const day of ['2026-11-10','2026-11-11','2026-11-12']) {
 startSchedule(day,'00:00');
 const rows=flights.filter(f=>f.day===day);
 for(const entry of [...new Set(game.scenarioRecords.map(r=>r.entry))].filter(t=>t>0)) {
   const group=game.scenarioRecords.filter(r=>r.entry===entry);
   game.time=entry-0.001;game.spawnScheduledFlights();
   assert(group.every(r=>!game.traffic.some(p=>p.schedule.id===r.id)),'flight must not appear early');
   game.time=entry;game.spawnScheduledFlights();
   assert(group.every(r=>game.traffic.some(p=>p.schedule.id===r.id)),'flight must appear at entry time');
 }
 game.time=86399;game.spawnScheduledFlights();
 assert.equal(game.traffic.length,rows.length);
 assert.equal(new Set(game.traffic.map(p=>p.schedule.id)).size,rows.length);
 assert(game.traffic.every(p=>p.realCallsign===p.schedule.callsign));
 assert(game.traffic.filter(p=>p.schedule.leg==='DEP').every(p=>p.waiting&&p.rwy==='03R'));
 results.push({day,records:rows.length});
}
startSchedule('2026-11-10','18:30');
assert.equal(clock(game.time),'18:30:00');
assert.equal(game.traffic.length,3);
assert(game.paused);
game.resume();const before=game.time;settings.speed=1;for(let n=0;n<10;n++)game.update();
assert(Math.abs(game.time-before-3)<0.0001,'1x must advance 3 seconds in ten 300ms ticks');
game.pause();const state=JSON.parse(JSON.stringify(game.toJson()));
game.stop();game.startSaved(state);game.pause();
assert.equal(game.scenarioCursor,state.scenarioCursor);
assert.equal(game.scenarioRecords.length,state.scenarioRecords.length);
assert.equal(game.traffic.length,state.traffic.length);
game.stop();
await writeFile('.test/result.json',JSON.stringify({passed:true,flights:497,days:results,checks:['entry boundaries','no duplicates','departure waiting state','real flight identity','1x clock','save/restore scheduler']},null,2));
console.log('PASS: 497 records, all entry boundaries, no duplicates, departures, 1x clock, saved schedule restore.');
