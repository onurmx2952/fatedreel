import { render, Component } from 'preact';
import './style.css';
import AtcView from './containers/AtcView/AtcView';
import { GameMessages } from './components/GameMessages/GameMessages';
import GameStore from './stores/GameStore';
import SettingsStore from './stores/SettingsStore';
import { loadState, saveState } from './lib/persistance';
import { flights, clock, startSchedule } from './ltac-schedule';
import './atc5.css';

const saved = loadState(); saved.introTutorial = true; saveState(saved);
startSchedule('2026-11-10', '18:30');

class App extends Component {
  state = { day: '2026-11-10', start: '18:30', version: 0, table: false, filter: '', message: '', generation: 0 };
  componentDidMount() { GameStore.on('change', this.refresh); this.resize = new ResizeObserver(() => { document.documentElement.style.setProperty('--bar-height', ((document.querySelector('.flight-header')?.offsetHeight || 72) + (document.querySelector('.flight-hint')?.offsetHeight || 36)) + 'px'); this.refresh(); }); this.resize.observe(document.querySelector('.flight-header')); this.resize.observe(document.querySelector('.flight-hint')); }
  componentWillUnmount() { GameStore.removeListener('change', this.refresh); this.resize?.disconnect(); }
  refresh = () => this.setState({ version: this.state.version + 1 });
  restart = () => { startSchedule(this.state.day, this.state.start); this.setState({ generation: this.state.generation + 1, message: '' }); };
  save = () => { localStorage.setItem('atc5-session-v1', JSON.stringify(GameStore.toJson())); this.setState({ message: 'Oyun bu tarayıcıya kaydedildi.' }); };
  restore = () => {
    const json = localStorage.getItem('atc5-session-v1');
    if (!json) return this.setState({ message: 'Bu tarayıcıda kayıt yok.' });
    try { const data = JSON.parse(json); GameStore.stop(); GameStore.startSaved(data); GameStore.pause(); SettingsStore.speed = 1;
      this.setState({ day: data.scenarioDay, start: clock(data.time).slice(0,5), generation: this.state.generation + 1, message: 'Kayıt açıldı.' });
    } catch { this.setState({ message: 'Kayıt açılamadı.' }); }
  };
  render() {
    const dayFlights = flights.filter(f => f.day === GameStore.scenarioDay);
    const visible = dayFlights.filter(f => `${f.callsign} ${f.flight} ${f.origin} ${f.destination}`.toLowerCase().includes(this.state.filter.toLowerCase()));
    return <main>
      <header className="flight-header"><div className="brand"><b>ATC MANAGER 2</b><span>LTAC · ANKARA ESENBOĞA</span></div>
        <div className="scenario-inputs"><label>Tarih<select aria-label="Tarih" value={this.state.day} onChange={e => this.setState({day:e.target.value})}>{['2026-11-10','2026-11-11','2026-11-12'].map(day => <option value={day}>{day.split('-').reverse().join('.')}</option>)}</select></label>
        <label>Başlangıç<input aria-label="Başlangıç saati" type="time" value={this.state.start} onInput={e => this.setState({start:e.target.value})}/></label><button onClick={this.restart}>Senaryoyu yükle</button></div>
        <div className="live-clock"><strong>{clock(GameStore.time)}</strong><small>{GameStore.scenarioDay} · TÜRKİYE / UTC+3</small></div>
        <button className="primary" onClick={() => GameStore.paused ? GameStore.resume() : GameStore.pause()}>{GameStore.paused ? '▶ Başlat / devam' : 'Ⅱ Duraklat'}</button>
        <label>Hız<select aria-label="Oyun hızı" value={SettingsStore.speed} onChange={e => {SettingsStore.speed=+e.target.value;this.refresh();}}>{[1,2,5,10,20].map(s => <option value={s}>{s}×</option>)}</select></label>
        <button onClick={this.save}>Kaydet</button><button onClick={this.restore}>Kaydı aç</button><button onClick={() => this.setState({table:!this.state.table})}>Uçuş listesi ({dayFlights.length})</button>
      </header>
      <div className="flight-hint">Uçağa tıkla → sağ panelden yön / irtifa / hız seç → Give Command. Gelenler 20 dk, gidenler 5 dk önce oluşur. <b>Şeritlerdeki saat kayıtlı iniş/kalkış saatidir.</b> {this.state.message}</div>
      <AtcView key={this.state.generation}/><GameMessages/>
      {this.state.table && <section className="schedule-panel"><div className="schedule-heading"><h2>Uçuş kayıtları · {GameStore.scenarioDay}</h2><button onClick={() => this.setState({table:false})}>Kapat ×</button></div>
        <p>10–12 Kasım 2026’dan 497 uçuş. ATAD varsa gerçekleşen saat, yoksa tahmini/planlı saat. ICAO + uçuş numarası kullanılır; harfli operasyonel callsign doğrulanmamıştır. Sabit kayıt oynatımıdır. Uçak tipi ve yaklaşma rotası temsilidir. 12 Kasım listesi kısmi gündür.</p>
        <input aria-label="Uçuş ara" placeholder="Callsign, uçuş veya havalimanı ara" value={this.state.filter} onInput={e => this.setState({filter:e.target.value})}/>
        <table><thead><tr><th>Saat</th><th>Yön</th><th>Callsign / uçuş</th><th>Rota</th><th>Saat türü</th></tr></thead><tbody>{visible.map(f => <tr><td>{f.time}</td><td>{f.leg==='ARR'?'Gelen':'Giden'}</td><td><b>{f.callsign}</b><small>{f.flight}</small></td><td>{f.origin} → {f.destination}</td><td>{f.source==='atad'?'Gerçekleşen':'Tahmini / planlı'}</td></tr>)}</tbody></table>
        <footer><a href="https://esenbogaairport.com/tr/arrival-flights" target="_blank" rel="noreferrer">Uçuş kaynağı: Esenboğa Havalimanı</a> · <a href="https://github.com/sempostma/atc-manager-2" target="_blank" rel="noreferrer">Özgün oyun / kaynak</a></footer>
      </section>}
    </main>;
  }
}
render(<App/>, document.getElementById('app'));
