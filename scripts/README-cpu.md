# Movie data and Pages CPU

Cloudflare Pages production build command: `node scripts/build-movie-data.mjs`.
The command regenerates the 64 small `movie-data/*.json` files from the current
catalogue, trailer and quality sources on every deployment. Checked-in copies
also support deployments without a build step. Do not edit the generated files.

Run `node scripts/verify-cpu-change.mjs` to compare the full catalogue and sample
HTML responses against the pre-optimization revision and check invocation routes.

`_routes.json` intentionally invokes Functions only for `/api/*`, `/voca`,
`/voca/*` and movie detail paths. New browser-only apps need no Worker route.
New server endpoints outside these prefixes must explicitly update the routes.
This reduces unnecessary CPU work; it does not establish the URL of historical
CPU-limit failures, for which a failed invocation log is required.
