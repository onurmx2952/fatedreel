# ATC5 — ATC Manager 2 / LTAC

Original game: https://github.com/sempostma/atc-manager-2
Upstream commit: 59e7ef99d8a873a4c176474d0a87a734e0440116
The upstream package declares MIT. Original game simulation, radar, flight controls and modules are retained.

Install with `npm ci`, run `npm run build`, then copy the referenced dist outputs to ../atc5/.
Run `node test-schedule.mjs` to verify all 497 entry boundaries, duplicate prevention, departures, 1x time and save/restore.
The fatedreel deployment is static; no Firebase login, external analytics or server runtime is required.

## Flight records
Fixed 10–12 November 2026 Esenboga flight-service snapshot. Both supplied HTMLs contained departures; arrivals were obtained from the same official airport service. 571 marketing rows become 497 operating records after 74 codeshares are excluded. Identical departure/arrival time and route alone never removes a different operator.
122 rows use ATAD (actual). The remainder use ETAD/STAD (estimated/scheduled). Times are Turkey local time, UTC+3. Nov 12 is partial, ending at 16:15.
ICAO + published flight number is displayed (VF -> TKJ). Letter-suffixed operational callsigns were not supplied and are not claimed to be verified.
Airport layouts, aircraft types and SID/STAR paths are schematic game data, not current navigation charts.
Arrivals enter up to 20 minutes before their target arrival, departures are available 5 minutes before departure. Choosing a later start preloads upcoming arrivals/departures already within that window. ATC commands determine the actual simulated landing/takeoff time.
Saved games and scheduler cursor use isolated localStorage keys. Random initial/spawn traffic is disabled for LTAC replay. 1x is calibrated to 300ms per original simulation tick.

## Browser verification
Departure selection, Takeoff, 1x clock progression, save/load, date and time changes, timetable filtering, and narrow/desktop layouts verified. No console errors in the tested flows.
