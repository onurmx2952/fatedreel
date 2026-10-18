// One time-based model drives visible water, rotors and assembly separation.
(() => {
  const svgNS = 'http://www.w3.org/2000/svg';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches, frame = 0, last = 0, phase = 0, apart = 0;
  const button = document.getElementById('motion');
  const status = document.getElementById('animation-state');
  const range = document.getElementById('separation');
  const toggle = document.getElementById('explode-toggle');
  const explode = document.getElementById('exploded');
  const groups = [...explode.querySelectorAll('[data-assembly]')];
  const rotors = [...document.querySelectorAll('.rotor')];
  const paths = [...document.querySelectorAll('.flow')].map(path => {
    const length = path.getTotalLength();
    const dots = Array.from({length: Math.max(3, Math.min(9, Math.floor(length / 45)))}, () => {
      const dot = document.createElementNS(svgNS, 'circle');
      dot.setAttribute('r', path.closest('#panel-0,#panel-3') ? '3.7' : '4');
      dot.setAttribute('class', 'water-particle');
      path.parentNode.appendChild(dot);
      return dot;
    });
    return {path,length,dots};
  });
  // Horizontal travel of the blade faces is the front projection of rotation
  // around the vertical shaft, clipped to the existing machine silhouettes.
  const section = document.querySelector('#panel-2 svg');
  section.insertAdjacentHTML('beforeend', `<defs><clipPath id="moving-runner"><path d="M465 359Q500 340 535 359L550 400Q500 427 450 400Z"/></clipPath><clipPath id="moving-generator"><path d="M455 139H545V226H455Z"/></clipPath></defs><g clip-path="url(#moving-runner)" class="blade-faces" fill="#edf4e7" stroke="#668b76"></g><g clip-path="url(#moving-generator)" class="rotor-faces" fill="#638e7b" stroke="#f1f6ec"></g>`);
  const runner = section.querySelector('.blade-faces');
  const generator = section.querySelector('.rotor-faces');
  const slats = Array.from({length:8}, () => {
    const blade = document.createElementNS(svgNS,'path'); runner.appendChild(blade);
    const bar = document.createElementNS(svgNS,'path'); generator.appendChild(bar);
    return {blade,bar};
  });
  const info = {
    foundation:['Kaya temel','Gövde ve santral yüklerini zemine aktarır.'],
    reservoir:['Rezervuar','Yüksekte depolanan su, santralin enerji kaynağıdır.'],
    dam:['Beton gövde ve kret','Ağırlık barajı su basıncına kendi ağırlığıyla karşı koyar. Kret, üstteki geçiş bölümüdür.'],
    spillway:['Dolusavak','Fazla suyu üretim su yolundan ayrı olarak mansaba aktarır.'],
    building:['Santral yapısı','Makine döşemelerini, bakım köprüsünü ve taşıyıcı kolonları barındırır.'],
    generator:['Jeneratör grubu','Türbinin mekanik dönüşünü elektrik enerjisine çevirir.'],
    transformer:['Transformatör','Üretilen elektriğin gerilimini iletime uygun seviyeye yükseltir.'],
    intake:['Su alma kapağı','Izgara büyük parçaları tutar; kapak su yolunu açar veya kapatır.'],
    waterway:['Cebri boru ve türbin','Basınçlı su çarkı döndürür; çıkış akışı mansaba ulaşır.']
  };
  const list = document.querySelector('.assembly-list');
  let selected = null;
  groups.forEach(g => {
    const name = g.dataset.assembly;
    const b = document.createElement('button');
    b.textContent = info[name][0]; b.setAttribute('aria-pressed','false');
    b.addEventListener('click', () => {
      selected = selected === name ? null : name;
      explode.classList.toggle('has-selection',!!selected);
      groups.forEach(el => el.classList.toggle('selected',el.dataset.assembly === selected));
      [...list.children].forEach(el => el.setAttribute('aria-pressed',el === b && !!selected ? 'true':'false'));
      document.getElementById('assembly-note').textContent = selected ? info[name][0]+' — '+info[name][1] : 'Bir montaj grubunu seçerek görevini incele.';
    });
    list.appendChild(b);
  });
  function controls() {
    button.setAttribute('aria-pressed',String(paused));
    button.textContent = paused ? 'Hareketi başlat' : 'Hareketi duraklat';
    status.textContent = paused ? (reduced.matches ? 'Azaltılmış hareket açık · istersen hareketi başlat' : 'Hareket duraklatıldı') : +flow.value ? 'Su akıyor · türbin ve jeneratör dönüyor' : 'Debi sıfır · çarklar durdu';
  }
  function separate(value) {
    range.value = value;
    const open = +value > 0;
    toggle.setAttribute('aria-pressed',String(open));
    toggle.textContent = open ? 'Birleştir' : 'Parçalara ayır';
    if (reduced.matches) apart = +value / 100;
    kick();
  }
  toggle.addEventListener('click',()=>separate(+range.value > 0 ? 0 : 100));
  document.getElementById('assemble').addEventListener('click',()=>separate(0));
  range.addEventListener('input',()=>separate(+range.value));
  button.addEventListener('click',()=>{paused=!paused;controls();kick()});
  reduced.addEventListener('change',()=>{paused=reduced.matches;controls();kick()});
  flow.addEventListener('input',()=>{controls();kick()});
  document.addEventListener('visibilitychange',kick);
  const visible = new Set();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e=>e.isIntersecting ? visible.add(e.target) : visible.delete(e.target));
    kick();
  });
  document.querySelectorAll('[role=tabpanel]').forEach(el=>observer.observe(el));
  function draw() {
    for(const {path,length,dots} of paths) {
      if(path.closest('[role=tabpanel]').hidden) continue;
      path.style.strokeDashoffset = String(-phase * 40);
      dots.forEach((dot,i) => {
        const p = path.getPointAtLength(((phase*55 + i*length/dots.length)%length+length)%length);
        dot.setAttribute('cx',p.x.toFixed(2)); dot.setAttribute('cy',p.y.toFixed(2));
        dot.style.opacity = +flow.value ? '1' : '.3';
      });
    }
    rotors.forEach(el=>el.setAttribute('transform',`rotate(${phase*70})`));
    slats.forEach(({blade,bar},i)=>{
      const a = phase*1.2+i*Math.PI/4, x=500+42*Math.sin(a), w=3+7*Math.abs(Math.cos(a));
      blade.setAttribute('d',`M${x-6} 357l${w} 0 14 53 -${w} 0Z`);
      bar.setAttribute('d',`M${x} 139h${w}v87h-${w}Z`);
    });
    groups.forEach((g,i)=>{
      const t = Math.max(0,Math.min(1,apart*1.2-i*.025));
      g.setAttribute('transform',`translate(${(+g.dataset.dx*t).toFixed(2)} ${(g.dataset.dy*t).toFixed(2)})`);
    });
    document.getElementById('separation-value').textContent = '%'+Math.round(apart*100);
    document.getElementById('assembly-state').textContent = apart < .001 ? 'Birleşik · 9 grup' : apart > .999 ? 'Ayrılmış · 9 grup' : (apart === +range.value/100 ? 'Kısmen ayrılmış · %' : 'Hareket ediyor · %')+Math.round(apart*100);
  }
  function tick(now) {
    frame=0;
    const dt=last?Math.min((now-last)/1000,.04):1/60;last=now;
    const active=[...visible].some(el=>!el.hidden);
    if(!document.hidden && active && !paused)phase+=dt*(+flow.value/45);
    const target=+range.value/100;
    apart=reduced.matches?target:apart+(target-apart)*(1-Math.exp(-dt/.25));
    if(Math.abs(target-apart)<.0005)apart=target;
    draw();
    if(!document.hidden && ((active&&!paused&&+flow.value>0)||apart!==target))frame=requestAnimationFrame(tick);
  }
  function kick(){if(!frame){last=0;frame=requestAnimationFrame(tick)}}
  controls();draw();kick();
})();
