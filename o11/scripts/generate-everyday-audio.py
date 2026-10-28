"""Generate missing recordings using the existing local Pocket TTS / Caro voice."""
import argparse,hashlib,json,os,subprocess,time,urllib.request
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=8814);parser.add_argument('--reverse',action='store_true');args=parser.parse_args()
site=Path(__file__).resolve().parents[1]
book=json.loads((site/'book.json').read_text(encoding='utf-8'))
items={s['audio']:s['en'] for u in book['units'] for s in u['examples']}
start=time.time();created=0
for i,(key,text) in enumerate(reversed(list(items.items())) if args.reverse else items.items()):
 assert key==hashlib.sha256(text.encode()).hexdigest()[:16]
 dest=site/'audio'/f'{key}.mp3'
 if dest.exists() and dest.stat().st_size>1000:continue
 boundary='----CaroEveryday'
 body=(f'--{boundary}\r\nContent-Disposition: form-data; name="text"\r\n\r\n{text}\r\n--{boundary}\r\nContent-Disposition: form-data; name="voice_url"\r\n\r\ncaro_davy\r\n--{boundary}--\r\n').encode()
 for attempt in range(3):
  try:
   req=urllib.request.Request(f'http://127.0.0.1:{args.port}/tts',data=body,headers={'Content-Type':f'multipart/form-data; boundary={boundary}'})
   raw=urllib.request.urlopen(req,timeout=180).read()
   if raw[:4]!=b'RIFF' or len(raw)<2000:raise ValueError('Invalid WAV')
   temp=dest.with_name(f'{key}.{os.getpid()}.part.mp3')
   subprocess.run(['ffmpeg','-v','error','-y','-i','pipe:0','-codec:a','libmp3lame','-b:a','64k',str(temp)],input=raw,check=True,capture_output=True)
   if temp.stat().st_size<1000:raise ValueError('Empty recording')
   temp.replace(dest);created+=1;break
  except Exception as error:
   print(f'Retry {i+1}, attempt {attempt+1}: {error}',flush=True)
   if attempt==2:raise
 if (i+1)%15==0:print(f'{i+1}/{len(items)} recordings; {time.time()-start:.0f}s; {text}',flush=True)
print(f'COMPLETE: {len(items)} Caro Davy recordings; {created} generated; {time.time()-start:.0f}s',flush=True)
