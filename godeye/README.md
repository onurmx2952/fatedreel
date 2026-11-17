# God's Eye View at /godeye

Upstream: https://github.com/bilawalsidhu/gods-eye-view
Revision: 624c229bc2a86fc1e47ed34c95fc7cefa2ac1676
License: MIT (see LICENSE). Bundled data retains its upstream attribution and terms.

This is the keyless Cloudflare Pages edition. The original Cesium/Vue application
is built with Vite base `/godeye/`. App-owned absolute data and API URLs are
namespaced to that path. Cesium's build plugin copies into dist/godeye/cesium;
the publish step moves that directory to godeye/cesium.

The edge adapter lives at functions/godeye/api/[[path]].js. It uses fixed
upstreams, shared edge caches, request deadlines, and same-origin admission.
Supported hosted providers: regional ADS-B flights (250 nautical mile radius),
military aircraft, CelesTrak TLE/SATCAT, upcoming launches, Fintraffic camera
stills, and the Radio Browser directory. Globe imagery, terrain, earthquakes,
bundled data packs, and compatible direct browser sources run client-side.

This is not the complete local Node server. Server-side weather processing,
regional briefs, historical tracks, local radio/SDR receivers, transit proxies,
and other unmapped Node endpoints return an explicit unavailable response.
Google/Cesium premium 3D, AI voice and AIS vessel services have no configured
credentials. Provider settings cannot be edited by public visitors. For every
upstream feature, run the original Node application on a persistent Node host
and replace this edge adapter with a reverse proxy; never expose local key setup.

No API credentials are embedded in this build. Provider outages, quotas and
regional availability can affect live data. The UI must not be interpreted as
guaranteeing worldwide flight coverage or genuinely thermal satellite imagery.
