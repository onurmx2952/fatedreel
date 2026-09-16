# FatedReel Talk

Frontend: `https://fatedreel.com/talk/`. Existing Cloudflare Pages site; no domain or DNS migration is needed. `functions/api/talk/[[route]].js` creates five-minute, microphone-only room tokens and dispatches the `fatedreel-talk` agent. Each session has a unique room. The existing catch-all Pages function remains unchanged.

## Required configuration

In the existing **FatedReel Cloudflare Pages** project's production secrets, set:

- `LIVEKIT_URL`: the project's `wss://…livekit.cloud` URL
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `TALK_ACCESS_CODE`: a long, random private access code (at least 24 random characters recommended)

The code is checked on the server and is never written to browser storage. Configure a Cloudflare rate-limit rule for `POST /api/talk/session` before wider use. This is a personal application, not public signup. Keep the access code private. Pages returns 503 until all four values exist.

On the Windows machine running the voice agent, copy `.env.example` to `.env.local` and set the three LiveKit values plus `OPENAI_API_KEY`. OpenAI credentials belong only on the agent, never in the frontend. Do not commit `.env.local` or upload it as a Pages asset. `.talk-agent` is a hidden source directory and should remain excluded from the public asset upload.

From this directory:

```powershell
uv sync
uv run python agent.py download-files
uv run python agent.py dev
```

The voice process must stay running for the teacher to join. For continuous operation deploy the same named agent to LiveKit Cloud or run it as a managed service. Cloudflare Pages cannot run a persistent Python voice agent. No tunnel is needed: the iPhone connects directly to LiveKit over HTTPS/WebRTC.

## Behavior and verification

Audio turn detection runs in LiveKit with dynamic endpointing, minimum 0.8 s and maximum 6 s. OpenAI's built-in turn detection is disabled so the two detectors do not compete. These values improve patience but cannot guarantee that every thinking pause is recognized. A spoken “bitti” is an instruction to the model, not a separate hard real-time detector. The **Bitirdim** button explicitly commits the buffered turn through authenticated room RPC.

On iPhone Safari: start, grant microphone permission, allow audio if prompted, say an incomplete sentence with pauses, finish it, interrupt a reply, mute/unmute, reveal the transcript, and end the call. Verify the microphone indicator disappears. Test agent offline and connection loss. Do not claim voice behavior is validated until this live test passes.

The page keeps transcripts in memory for the current session only. Audio and text are processed by LiveKit/OpenAI; this implementation does not record audio or save transcripts in an application database.

Sources: https://docs.livekit.io/agents/logic/turns/turn-detector/ , https://docs.livekit.io/agents/start/voice-ai/ , https://docs.livekit.io/frontends/reference/tokens-grants/
