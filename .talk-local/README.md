# Free local Talk on PN43

Local inference: Qwen2.5 1.5B Instruct Q4_K_M / llama.cpp CPU, faster-whisper base INT8, Piper lessac-medium. No OpenAI or LiveKit credentials or paid API requests are used. Internet and an awake PC are still required for the phone connection.

`start.ps1` launches the three background processes and publishes the temporary tunnel address in `talk/local-config.json`. Only that public address is committed, never the private access code. On a fresh tunnel start, Cloudflare Pages needs time to publish the new address. This uses Cloudflare Quick Tunnel, a testing service without an uptime guarantee. A stable named tunnel is a future alternative; no paid plan is needed for this implementation.

`stop.ps1` stops only the recorded processes after checking their executable paths. These scripts do not change Windows sleep settings or register system startup tasks.

The access code is in ignored `runtime/access.key`. Never commit it. The personal launch page stores it in a URL fragment, which is removed by the Talk page and is not sent in the initial HTTP request. The browser sends the code in Authorization headers to the private local service through the Cloudflare tunnel. Cloudflare transports the audio; model inference happens on PN43. The app does not write audio or conversation transcripts to disk.

The microphone records while the session is active. After 1.8 seconds of quiet, Whisper transcribes the utterance and local Qwen classifies it as WAIT or DONE. Complete turns automatically receive a spoken answer; unfinished thoughts and requests for thinking time keep listening. Audio is retained across these pauses. Resuming speech cancels the pending browser request and invalidates its response, so an outdated answer cannot overwrite the continuation. This is transcript-based turn detection, not acoustic prosody detection; transcription and classification can make mistakes. **Bitirdim** remains an optional override. While the teacher speaks, tap **Araya gir** to stop playback and resume recording. Microphone capture is suspended during teacher playback to avoid feedback.

Models: https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF , https://github.com/SYSTRAN/faster-whisper , https://github.com/OHF-Voice/piper1-gpl . Engine: https://github.com/ggml-org/llama.cpp . Observe the upstream model and software licenses when redistributing; binary/model files remain local and ignored.
