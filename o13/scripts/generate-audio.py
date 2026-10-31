"""Record O13 with the existing local Pocket TTS / Caro Davy voice."""
import hashlib,json,os,shutil,subprocess,time,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'content.json').read_text(encoding='utf-8'))
items={s['audio']:s['text'] for s in data['stories']}
items.update({v['audio']:v.get('en',w) for w,v in data['dictionary'].items() if v.get('kind')!='name'})
created=reused=0;start=time.time()
for i,(key,text) in enumerate(items.items()):
 assert key==hashlib.sha256(text.encode()).hexdigest()[:16]
 dest=ROOT/'audio'/f'{key}.mp3'
 if dest.exists() and dest.stat().st_size>500:continue
 old=ROOT.parent/'o11'/'audio'/f'{key}.mp3'
 if old.exists() and old.stat().st_size>500:shutil.copyfile(old,dest);reused+=1;continue
 body=(f'--CaroO13\r\nContent-Disposition: form-data; name="text"\r\n\r\n{text}\r\n--CaroO13\r\nContent-Disposition: form-data; name="voice_url"\r\n\r\ncaro_davy\r\n--CaroO13--\r\n').encode()
 for attempt in range(3):
  try:
   req=urllib.request.Request('http://127.0.0.1:8814/tts',data=body,headers={'Content-Type':'multipart/form-data; boundary=CaroO13'})
   raw=urllib.request.urlopen(req,timeout=180).read()
   if raw[:4]!=b'RIFF' or len(raw)<1000:raise ValueError('Invalid WAV')
   temp=dest.with_suffix('.part.mp3')
   subprocess.run(['ffmpeg','-v','error','-y','-i','pipe:0','-codec:a','libmp3lame','-b:a','64k',str(temp)],input=raw,check=True,capture_output=True)
   temp.replace(dest);created+=1;break
  except Exception as error:
   print(f'Retry {i+1}: {error}',flush=True)
   if attempt==2:raise
 if i<12 or i%30==0:print(f'{i+1}/{len(items)}; {time.time()-start:.0f}s; {text[:55]}',flush=True)
print(f'COMPLETE {len(items)} recordings; {created} generated; {reused} reused; {time.time()-start:.0f}s',flush=True)
