import { Component } from 'preact';
import './SvgRadar.css';
import GameStore from '../../stores/GameStore';
import SettingsStore from '../../stores/SettingsStore';
import WayPoints from '../../components/WayPoints/WayPoints';
import Airport from '../../components/Airport/Airport';
import BackgroundSvg from '../../components/BackgroundSvg/BackgroundSvg';
import RadarTraffic from '../RadarTraffic/RadarTraffic';
import config from '../../lib/config';
import { getStyle } from '../../lib/svg';
import MSALayer from '../MSALayer/MSALayer';
import RouteVisualizer from '../RouteVisualizer/RouteVisualizer';
import SidSvg from '../SidSvg/SidSvg';
import StarSvg from '../StarSvg/StarSvg';

class SvgRadar extends Component {
  constructor(props) {
    super();
    this.state = {};
  }

  componentWillMount() {
    GameStore.on('change', this.reRender);
    SettingsStore.on('change', this.reRender);
  }

  componentWillUnmount() {
    GameStore.removeListener('change', this.reRender);
    SettingsStore.removeListener('change', this.reRender);
  }

  reRender = () => {
    this.setState({});
  };

  setRef = el => GameStore.setSvgEl(el);

  render() {
    const innerWidth = window.innerWidth;
    const innerHeight = window.innerHeight;
    const barHeight = (document.querySelector('.flight-header')?.offsetHeight || 72) + (document.querySelector('.flight-hint')?.offsetHeight || 36);
    const height = Math.max(300, innerHeight - barHeight);
    const width = this.props.timelapse || innerWidth <= 900 ? innerWidth : innerWidth - 250;
    const renderedHeight = innerWidth <= 900 ? Math.max(300, innerHeight * 0.55) : height;
    const screenScale = Math.max(0.2, Math.min((width - 30) / config.width, (renderedHeight - 20) / config.height));
    const fontSize = Math.max(21, SettingsStore.radarFontsize * 1.5) / screenScale;
    const airplanes = GameStore.traffic.map((airplane, i) => (
      <RadarTraffic
        stateEmitter={GameStore}
        key={i}
        index={i}
        airplane={airplane}
        fontSize={fontSize}
        cmd={this.props.cmd}
      />
    ));
    const transformScale =
      `translate(${config.width / 2} ${config.height / 2}) ` +
      `scale(${GameStore.zoom}) ` +
      `translate(-${config.width / 2} -${config.height / 2})`;
    const styles = getStyle(SettingsStore);

    return (
      <svg
        ref={this.setRef}
        onWheel={this.props.onZoom}
        xmlns="http://www.w3.org/2000/svg"
        className="atc-view-svg"
        width={width}
        height={height}
        onClick={this.props.onClick}
        viewBox="0 0 1280 720"
        style={`background: ${
          SettingsStore.radarColor
        }; overflow: visible; font-size: ${fontSize}px;`}
      >
        <style>{styles}</style>
        <g transform={transformScale}>
          <BackgroundSvg name={GameStore.id} />
        </g>
        <MSALayer />
        <SidSvg emitter={this.props.emitter} />
        <StarSvg emitter={this.props.emitter} />
        <WayPoints onContextMenu={this.props.onWayPointContextMenu} />
        <Airport />
        <RouteVisualizer cmd={this.props.cmd} emitter={this.props.emitter} />
        {airplanes}
        <rect
          width="100%"
          height="100%"
          fill="none"
          stroke="#fff"
          stroke-dasharray="20, 20"
          transform={transformScale}
        />
      </svg>
    );
  }
}

export default SvgRadar;
