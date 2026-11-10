import GameStore from './stores/GameStore';
import SettingsStore from './stores/SettingsStore';
import Airplane from './lib/airplane';
import { airplanes, routeTypes } from './lib/airplane-library/airplane-library';
import { headingTo } from './lib/map';
import flights from './ltac-flights.json';

export { flights };
export const clock = seconds => [Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, Math.floor(seconds) % 60].map(n => String(n).padStart(2, '0')).join(':');
export const leadTime = flight => flight.leg === 'ARR' ? 1200 : 300;

GameStore.spawnScheduledFlights = function () {
  while (this.scenarioCursor < this.scenarioRecords.length && this.scenarioRecords[this.scenarioCursor].entry <= this.time + 0.0001) {
    const record = this.scenarioRecords[this.scenarioCursor++];
    const arrival = record.leg === 'ARR';
    const preferred = record.model.startsWith('A32') ? 'A320' : record.model.startsWith('A33') ? 'A330' : 'B737';
    const model = airplanes.find(a => a.shortName === preferred) || airplanes[0];
    const angle = record.bearing * Math.PI / 180;
    const remaining = Math.max(60, record.seconds - this.time);
    const radius = Math.min(280, Math.max(70, remaining * 240 / 3600 * 4));
    const x = 640 + Math.sin(angle) * radius;
    const y = 360 + Math.cos(angle) * radius;
    const runway = this.callsignsPos['03R'];
    const heading = arrival ? headingTo(x, y, 640, 360) : 32;
    const airplane = new Airplane(arrival ? 240 : 0, arrival ? 12000 : 0, heading,
      arrival ? x : runway.x, arrival ? y : runway.y,
      null, record.flight.replace(/^[A-Z0-9]{2}/, ''), model.id,
      arrival ? routeTypes.INBOUND : routeTypes.OUTBOUND);
    airplane.realCallsign = record.callsign;
    airplane.regNum = record.callsign;
    airplane.schedule = record;
    if (!arrival) {
      airplane.waiting = true;
      airplane.rwy = '03R';
      airplane.tgtAltitude = 14000;
      airplane.tgtSpeed = 240;
      airplane.dirty = false;
      airplane.outboundWaypoint = this.map.outboundWaypoints.reduce((best, key) => {
        const wp = this.map.waypoints[key];
        const score = (wp.x - (640 + Math.sin(angle) * 280)) ** 2 + (wp.y - (360 + Math.cos(angle) * 280)) ** 2;
        return !best || score < best.score ? { key, score } : best;
      }, null).key;
      airplane.tgtDirection = airplane.outboundWaypoint;
    }
    this.traffic.push(airplane);
    this.addLog(`${record.callsign} · ${record.flight} · ${record.origin} → ${record.destination} · kayıt ${record.time} (${record.source === 'atad' ? 'gerçekleşen' : 'tahmini/planlı'})`, arrival ? 'APP' : 'TWR');
  }
};

export function startSchedule(day, time) {
  const [hour, minute] = time.split(':').map(Number);
  const start = hour * 3600 + minute * 60;
  if (!Number.isFinite(start) || start < 0 || start >= 86400) throw new Error('Geçerli bir saat seçin.');
  GameStore.stop();
  GameStore.log = []; GameStore.selfLog = [];
  GameStore.scenarioEnabled = true;
  GameStore.scenarioDay = day;
  GameStore.scenarioCursor = 0;
  GameStore.scenarioRecords = flights.filter(f => f.day === day && f.seconds >= start)
    .map(f => ({ ...f, entry: Math.max(start, f.seconds - leadTime(f)) }))
    .sort((a, b) => a.entry - b.entry || a.seconds - b.seconds || a.id.localeCompare(b.id));
  GameStore.time = start;
  SettingsStore.selectedMapId = 'LTAC';
  SettingsStore.speed = 1;
  SettingsStore.goArounds = false;
  SettingsStore.sidsStars = true;
  SettingsStore.speechrecognition = false;
  SettingsStore.speechsynthesis = false;
  SettingsStore.startingInboundPlanes = 0;
  SettingsStore.startingOutboundPlanes = 0;
  SettingsStore.takeoffInOrder = true;
  GameStore.startMap('LTAC');
  GameStore.winddir = 32; GameStore.windspd = 7;
  GameStore.spawnScheduledFlights();
  GameStore.pause();
}
