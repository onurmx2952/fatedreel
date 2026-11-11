(() => {
 const a=window.__ankara,check=(ok,msg)=>{if(!ok)throw Error(msg)},report={};
 a.setPaused(false);a.setTime(.5);
 const p=a.people[0],x=p.x,phase=p.phase;__step(.5);check(p.x>x&&p.phase>phase,'Walker does not advance');
 const before=a.reactions,targets=[...document.querySelectorAll('svg [role="button"]')];
 check(targets.length===18,'Expected 18 interactive objects, got '+targets.length);
 for(const target of targets){target.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));__step(.15)}
 check(a.reactions-before===targets.length,'Some reactions did not trigger');
 __step(8);check(a.people.every(p=>p.reaction===-1)&&a.carts.every(c=>c.reaction===-1),'Gesture did not return to idle');
 for(const tau of [.3,.5,.72,.75,.8,.95,.24]){a.setTime(tau);__step(2);check(![...document.querySelectorAll('svg path')].some(p=>/NaN|Infinity/.test(p.getAttribute('d')||'')),'Invalid geometry at '+tau)}
 a.setTime(.5);a.town.shops.forEach(s=>s.override=-1);__step(3);check(a.town.shops.every(s=>s.op.x>.99),'Shops do not open in daylight');
 a.setTime(.9);__step(3);check(a.town.shops.every(s=>s.op.x<.01),'Shops do not close at night');
 const colours=getComputedStyle(document.querySelector('svg')).color;check(colours!=='rgb(28, 28, 28)','Night ink did not invert');
 const input=document.querySelector('#time');input.value='720';input.dispatchEvent(new Event('input',{bubbles:true}));check(document.querySelector('#clock').textContent==='12:00','Time slider failed');
 document.querySelector('#pause').click();check(a.paused,'Pause failed');const stopX=p.x;__step(2);check(p.x===stopX,'Paused walker moved');document.querySelector('#pause').click();__step(.5);check(p.x!==stopX,'Resume failed');
 const one=targets.find(n=>n.getAttribute('aria-label').startsWith('Ankara kedisi'));const r=a.reactions;one.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));check(a.reactions===r+1,'Keyboard interaction failed');
 const sun=document.querySelector('svg [role="slider"]'),old=a.tau;sun.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));check(a.tau!==old,'Sun keyboard control failed');
 check(document.documentElement.scrollWidth<=innerWidth,'Horizontal page overflow');
 report.interactions=targets.length;report.dayStates=7;report.motion='walk/cart/gestures/pause passed';report.errors=0;
 a.setTime(.66);a.town.shops.forEach(s=>s.override=-1);__step(1);return report;
})()
