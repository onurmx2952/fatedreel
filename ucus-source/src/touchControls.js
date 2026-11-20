export const isTouchDevice = navigator.maxTouchPoints > 0 || matchMedia('(pointer: coarse)').matches || new URLSearchParams(location.search).get('touch') === '1';

export class TouchControls {
  constructor(app) {
    this.app = app;
    if (!isTouchDevice) return;
    document.body.classList.add('touch-device');
    this.root = document.createElement('section');
    this.root.id = 'touchControls';
    this.root.setAttribute('aria-label', 'Dokunmatik uçuş kontrolleri');
    this.root.innerHTML = `
      <div class="touch-left">
        <div class="touch-stick" id="flightStick" role="group" aria-label="Yön çubuğu: sağ sol yatış, aşağı çekerek yüksel">
          <span class="stick-up">ALÇAL</span><span class="stick-down">YÜKSEL</span><span class="stick-knob"></span>
        </div>
        <div class="rudder-row"><button data-hold="left" aria-label="Sola dümen">SOL</button><span>DÜMEN</span><button data-hold="right" aria-label="Sağa dümen">SAĞ</button></div>
      </div>
      <div class="touch-actions">
        <span class="touch-hint">Freni bırak · Gaz ver · Çubuğu aşağı çek</span>
        <div class="touch-action-grid">
          <button id="touchPark">PARK</button><button id="touchGear">TAKIM</button>
          <button id="touchFlapUp">FLAP −</button><button id="touchFlapDown">FLAP +</button>
          <button id="touchCamera">KAMERA</button><button id="touchAP">PİLOT</button>
        </div>
      </div>
      <div class="touch-right">
        <label for="touchThrottle">GAZ <output id="touchThrottleValue">0%</output></label>
        <input id="touchThrottle" type="range" min="0" max="100" step="1" value="0" aria-label="Motor gazı" />
        <div class="throttle-presets"><button id="touchIdle">KES</button><button id="touchFull">TAM</button></div>
        <button data-hold="brake" class="touch-brake">FREN</button>
      </div>`;
    document.body.append(this.root);
    this.stick = this.root.querySelector('#flightStick');
    this.knob = this.root.querySelector('.stick-knob');
    this.throttle = this.root.querySelector('#touchThrottle');
    const a = app.input.actions;
    const click = (id, fn) => this.root.querySelector('#' + id).addEventListener('click', fn);
    click('touchPark', () => a.onParking());
    click('touchGear', () => a.onGear());
    click('touchFlapUp', () => a.onFlaps(-1));
    click('touchFlapDown', () => a.onFlaps(1));
    click('touchCamera', () => a.onCamera());
    click('touchAP', () => a.onAutopilot());
    click('touchIdle', () => a.onThrottleSet(0));
    click('touchFull', () => a.onThrottleSet(1));
    this.throttle.addEventListener('input', () => a.onThrottleSet(Number(this.throttle.value) / 100));
    const move = e => {
      const r = this.stick.getBoundingClientRect(), radius = r.width * .34;
      let x = (e.clientX - r.left - r.width / 2) / radius;
      let y = (e.clientY - r.top - r.height / 2) / radius;
      const length = Math.max(1, Math.hypot(x, y)); x /= length; y /= length;
      app.input.touch.roll = Math.abs(x) < .06 ? 0 : x;
      app.input.touch.pitch = Math.abs(y) < .06 ? 0 : y;
      this.knob.style.transform = `translate(${x * radius}px, ${y * radius}px)`;
    };
    this.stick.addEventListener('pointerdown', e => {
      if (this.stickPointer != null) return;
      e.preventDefault(); this.stickPointer = e.pointerId;
      this.stick.setPointerCapture(e.pointerId); this.stick.classList.add('engaged'); move(e);
    });
    this.stick.addEventListener('pointermove', e => { if (e.pointerId === this.stickPointer) move(e); });
    const releaseStick = e => {
      if (e.pointerId !== this.stickPointer) return;
      this.stickPointer = null; app.input.touch.roll = app.input.touch.pitch = 0;
      this.knob.style.transform = ''; this.stick.classList.remove('engaged');
    };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => this.stick.addEventListener(type, releaseStick));
    this.held = new Map();
    for (const button of this.root.querySelectorAll('[data-hold]')) {
      button.addEventListener('pointerdown', e => {
        e.preventDefault(); button.setPointerCapture(e.pointerId);
        this.held.set(e.pointerId, button.dataset.hold); button.classList.add('held'); this.applyHeld();
      });
      const release = e => { this.held.delete(e.pointerId); button.classList.remove('held'); this.applyHeld(); };
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => button.addEventListener(type, release));
    }
    window.addEventListener('blur', () => this.reset());
    window.addEventListener('pagehide', () => this.reset());
    window.addEventListener('orientationchange', () => this.reset());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { this.reset(); app.ui.openMenu(); }
    });
    const observer = new MutationObserver(() => {
      const blocked = !document.getElementById('menu').classList.contains('hidden') || !document.getElementById('help').classList.contains('hidden');
      this.root.hidden = blocked;
      if (blocked) this.reset();
    });
    for (const id of ['menu', 'help']) observer.observe(document.getElementById(id), { attributes: true, attributeFilter: ['class'] });
    const help = document.getElementById('helpGrid');
    help.insertAdjacentHTML('afterbegin', '<div class="touch-help"><b>iPad ile uçuş</b><p>Sol çubuğu aşağı çekerek yüksel, yukarı iterek alçal. Sağa veya sola kaydırarak yat. Dümen düğmeleriyle yerde yön ver.</p><p>PARK frenini bırak, sağdaki GAZ sürgüsünü artır. FREN düğmesini basılı tutarak yavaşla. KAMERA ile görüşü değiştir. En geniş görüş için iPad’i yatay kullan.</p></div>');
    this.root.hidden = !document.getElementById('help').classList.contains('hidden');
  }
  applyHeld() {
    const values = [...this.held.values()];
    this.app.input.touch.yaw = Number(values.includes('right')) - Number(values.includes('left'));
    this.app.input.actions.onBrake(values.includes('brake'));
  }
  reset() {
    this.stickPointer = null;
    Object.assign(this.app.input.touch, { roll: 0, pitch: 0, yaw: 0 });
    this.held.clear(); this.app.input.actions.onBrake(false);
    this.knob.style.transform = '';
    this.root.querySelectorAll('.held,.engaged').forEach(el => el.classList.remove('held', 'engaged'));
    this.app.input.keys.clear();
  }
  sync() {
    if (!this.root) return;
    const fm = this.app.fm, pct = Math.round(fm.throttle * 100);
    this.throttle.value = pct;
    this.root.querySelector('#touchThrottleValue').textContent = pct + '%';
    const park = this.root.querySelector('#touchPark');
    park.textContent = fm.parkingBrake ? 'PARK AÇIK' : 'PARK KAPALI';
    park.setAttribute('aria-pressed', String(fm.parkingBrake));
    const ap = this.root.querySelector('#touchAP');
    ap.setAttribute('aria-pressed', String(this.app.ap.on));
    ap.textContent = this.app.ap.on ? 'PİLOT AÇIK' : 'PİLOT KAPALI';
  }
}
