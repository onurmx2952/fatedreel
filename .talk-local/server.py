"""Local voice teacher. All inference is on this PC; no paid API calls."""
import asyncio
import base64
import io
import json
import secrets
import time
import wave
from contextlib import asynccontextmanager
from pathlib import Path
import re

import httpx
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
from piper import PiperVoice, SynthesisConfig

ROOT = Path(__file__).resolve().parent
RUNTIME = ROOT / 'runtime'
RUNTIME.mkdir(exist_ok=True)
KEY_FILE = RUNTIME / 'access.key'
if not KEY_FILE.exists():
    KEY_FILE.write_text(secrets.token_urlsafe(24), encoding='utf-8')
ACCESS = KEY_FILE.read_text(encoding='utf-8').strip()
busy = asyncio.Lock()
stt = voice = None
PROMPT = '''You are a patient English conversation partner for an adult Turkish learner at A1-A2.
Speak English with simple everyday words. Reply in ONE or TWO short sentences, at most 35 words.
Ask only one question at a time. Continue the conversation or roleplay; do not give grammar lectures.
Never finish the learner's sentences. Briefly explain in Turkish only if explicitly asked.
No lists, markdown, stage directions, or descriptions of your own voice. Never invent what the user said.'''

@asynccontextmanager
async def lifespan(app):
    global stt, voice
    stt = await asyncio.to_thread(WhisperModel, 'base', device='cpu', compute_type='int8', cpu_threads=4,
                                  download_root=str(ROOT / 'models/whisper'), local_files_only=True)
    voice = await asyncio.to_thread(PiperVoice.load, str(ROOT / 'models/en_US-lessac-medium.onnx'))
    yield

app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)
app.add_middleware(CORSMiddleware, allow_origins=['https://fatedreel.com', 'https://www.fatedreel.com', 'http://127.0.0.1:4173'],
                   allow_methods=['GET','POST'], allow_headers=['Content-Type','Authorization'])

def authenticate(request):
    if not secrets.compare_digest(request.headers.get('authorization',''), 'Bearer ' + ACCESS):
        raise HTTPException(401, 'Erişim kodu doğru değil.')

@app.post('/api/session')
async def session(request: Request):
    authenticate(request)
    return {'ok': True}

@app.get('/health')
async def health():
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            response = await client.get('http://127.0.0.1:8174/health')
        ready = response.status_code == 200 and stt is not None and voice is not None
    except httpx.HTTPError:
        ready = False
    return {'ready':ready, 'mode':'local', 'paid_api':False}

def transcribe(data):
    with wave.open(io.BytesIO(data)) as wav:
        if wav.getnchannels()!=1 or wav.getsampwidth()!=2 or wav.getframerate()!=16000 or wav.getnframes()>16000*120:
            raise ValueError('En fazla 2 dakika, 16 kHz mono WAV gerekli.')
    segments, _ = stt.transcribe(io.BytesIO(data), beam_size=1, vad_filter=True,
                               condition_on_previous_text=False,
                               initial_prompt='English conversation practice. Turkish finish word: bitti.')
    return ' '.join(segment.text.strip() for segment in segments if segment.no_speech_prob < 0.7).strip()

def synthesize(text):
    buffer=io.BytesIO()
    with wave.open(buffer,'wb') as wav:
        voice.synthesize_wav(text,wav,syn_config=SynthesisConfig(length_scale=1.12))
    return base64.b64encode(buffer.getvalue()).decode('ascii')

@app.post('/api/turn')
async def turn(request: Request):
    authenticate(request)
    if busy.locked():
        raise HTTPException(429,'Öğretmen meşgul. Birazdan yeniden dene.')
    if int(request.headers.get('content-length','0')) > 6_000_000:
        raise HTTPException(413,'Ses kaydı çok uzun.')
    raw=bytearray()
    async for chunk in request.stream():
        raw.extend(chunk)
        if len(raw)>6_000_000:
            raise HTTPException(413,'Ses kaydı çok uzun.')
    try:
        body=json.loads(raw)
        if not isinstance(body,dict): raise ValueError()
        prior=body.get('pending','')
        if not isinstance(prior,str) or len(prior)>6000: raise ValueError()
        history=body.get('history',[])
        if not isinstance(history,list) or len(history)>20: raise ValueError()
        clean=[]
        for item in history:
            if not isinstance(item,dict) or item.get('role') not in ('user','assistant') or not isinstance(item.get('content'),str) or len(item['content'])>6000: raise ValueError()
            clean.append({'role':item['role'],'content':item['content']})
        audio=base64.b64decode(body.get('audio',''),validate=True)
    except (ValueError,TypeError):
        raise HTTPException(400,'Geçersiz konuşma verisi.')
    async with busy:
        started=time.monotonic()
        try:
            heard=await asyncio.to_thread(transcribe,audio) if audio else ''
        except Exception:
            raise HTTPException(400,'Ses okunamadı. Yeniden konuşmayı dene.')
        text=' '.join(s for s in (prior,heard) if s).strip()
        end_word=bool(re.search(r'\bbitti[\s.!?,]*$',heard,re.I))
        if not body.get('finish') and not end_word:
            return {'pending':text,'heard':heard,'waiting':True}
        text=re.sub(r'\bbitti[\s.!?,]*$','',text,flags=re.I).strip()
        if not text:
            return {'pending':'','heard':'','waiting':True,'empty':True}
        # Keep inference inside the small CPU model's context window.
        recent=[]
        remaining=max(0,4500-len(text))
        for item in reversed(clean[-12:]):
            if len(item['content'])>remaining: break
            recent.insert(0,item)
            remaining-=len(item['content'])
        try:
            async with httpx.AsyncClient(timeout=120) as client:
                result=await client.post('http://127.0.0.1:8174/v1/chat/completions',headers={'Authorization':'Bearer '+ACCESS},json={
                    'messages':[{'role':'system','content':PROMPT},*recent,{'role':'user','content':text[-4500:]}],
                    'max_tokens':90,'temperature':0.65,'stream':False})
                result.raise_for_status()
                reply=result.json()['choices'][0]['message']['content'].strip()
            audio_reply=await asyncio.to_thread(synthesize,reply)
        except Exception:
            raise HTTPException(503,'Yerel öğretmen yanıt veremedi. Birazdan yeniden dene.')
        return {'text':text,'reply':reply,'audio':audio_reply,'seconds':round(time.monotonic()-started,1)}
