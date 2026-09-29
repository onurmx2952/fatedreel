# Easy English

Published at https://fatedreel.com/easyenglish/

A static mobile listening exercise with 121 selected short subtitle cues from the three supplied SRT files. Each record retains its original filename and cue number. English audio is generated speech (en-GB-SoniaNeural), not extracted episode audio. Turkish translations are bundled; playback and written answers require no API key or local computer service.

Flow: listen/replay, answer in English by voice or typing, reveal English and Turkish, then draw the next sentence. The shuffled deck avoids repetition until exhausted. Comparison ignores punctuation/case and common contractions; it is a transcription comparison, not pronunciation scoring.

Voice input uses browser SpeechRecognition/webkitSpeechRecognition in en-GB. The browser processes microphone input (its speech service may require internet); the application submits the recognized text automatically when recognition finishes. This application does not retain or upload a separate recording to Fatedreel. Unsupported browsers, permission denial, no-speech, and a 20-second watchdog offer the written path. Real iOS microphone behavior still needs device testing.

No build required. Serve this directory over HTTPS. Audio files are immutable; use new filenames if regenerating them. All content is public static content.
