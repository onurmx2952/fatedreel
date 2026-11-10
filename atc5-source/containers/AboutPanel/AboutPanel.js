import { Component } from 'preact';
import './AboutPanel.css';
export default class AboutPanel extends Component {render(){return <div className={this.props.expanded ? 'about-panel' : 'hidden'}><button onClick={this.props.onToggle}>Kapat</button><h3>ATC Manager 2 · LTAC</h3><p>Özgün oyun: Echo Sierra Studio / sempostma.</p><a href="https://github.com/sempostma/atc-manager-2" target="_blank" rel="noreferrer">Kaynak kodu</a><p>Fatedreel uyarlaması: kayıtlı uçuşlar, tarih seçimi ve saatli trafik.</p></div>}}
