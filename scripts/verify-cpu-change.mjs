import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const root=process.cwd();
const oldSource=execFileSync('git',['show','a4ec9c103b9b4652a01b5f36ee1e6e1ab63fa83b:functions/[[path]].js'],{encoding:'utf8'}).replace("'./_lib/learning-apps.js'",JSON.stringify(pathToFileURL(root+'/functions/_lib/learning-apps.js').href));
const before=await import('data:text/javascript;base64,'+Buffer.from(oldSource).toString('base64'));
const after=await import(pathToFileURL(root+'/functions/[[path]].js'));
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const movies=load('movies.json'),trailers=load('trailers.json'),quality=load('movie-quality.json');
for(const m of movies){const e=load(`movie-data/${Number(m.tt.slice(2))%64}.json`)[m.tt];assert.deepEqual(e.movie,m);assert.deepEqual(e.trailer,trailers[m.tt]);assert.deepEqual(e.quality,quality.movies[m.tt]);}
const ctx=path=>({request:new Request('https://fatedreel.com'+path),env:{ASSETS:{fetch:async r=>{const p=new URL(r.url).pathname;try{return new Response(fs.readFileSync(root+p));}catch{return new Response('not found',{status:404});}}}}});
const samples=movies.filter((_,i)=>i%211===0).map(m=>'/'+m.tt).concat(['/tt0000000','/TT0118852/','/api/program/config','/cicek/index.html']);
const timing={before:[],after:[]};
for(const path of samples){let t=performance.now();const a=await before.onRequest(ctx(path));const x=await a.text();timing.before.push(performance.now()-t);t=performance.now();const b=await after.onRequest(ctx(path));const y=await b.text();timing.after.push(performance.now()-t);assert.equal(a.status,b.status,path);assert.equal(x,y,path);}
const median=a=>a.sort((a,b)=>a-b)[Math.floor(a.length/2)];
console.log(JSON.stringify({catalogueParity:movies.length,responseParity:samples.length,localMedianMs:{before:median(timing.before),after:median(timing.after)}}));

const routes=load('_routes.json');
const invoked=path=>routes.include.some(pattern=>pattern.endsWith('*') ? path.startsWith(pattern.slice(0,-1)) : path===pattern);
for(const path of ['/api/program/me','/api/learning/o11','/api/o11/check','/api/o14/check','/api/o6','/api/talk/token','/voca','/voca/app/ip.js','/tt0118852','/TT0118852','/tT0118852','/Tt0118852']) assert.ok(invoked(path),path);
for(const path of ['/','/cicek/','/o11/','/o14/','/atc5/','/anim2/','/program/','/o6/','/movies.json','/voca-media/test.m4a','/o4/worker.js']) assert.ok(!invoked(path),path);
console.log('Dynamic routes preserved; static pages and assets bypass Functions.');
