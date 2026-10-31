import array,hashlib,json,math,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'content.json').read_text(encoding='utf-8'))
items={s['audio']:(s['text'],True) for s in data['stories']}
items.update({v['audio']:(v.get('en',w),False) for w,v in data['dictionary'].items() if v.get('kind')!='name'})
total=0
for key,(text,story) in items.items():
 assert key==hashlib.sha256(text.encode()).hexdigest()[:16]
 path=ROOT/'audio'/f'{key}.mp3';assert path.exists() and path.stat().st_size>500,str(path)
 r=subprocess.run(['ffmpeg','-v','error','-i',str(path),'-f','s16le','-ac','1','-ar','16000','pipe:1'],capture_output=True,check=True)
 assert not r.stderr,r.stderr.decode();samples=array.array('h',r.stdout);duration=len(samples)/16000
 assert (.15<duration<10 if not story else 12<duration<150),(text[:60],duration)
 rms=math.sqrt(sum(x*x for x in samples)/len(samples));assert rms>20,('silent',text)
 total+=duration
print(f'PASS: {len(items)} Caro Davy MP3s, exact transcript hashes, full decode, durations and non-silence; {total:.0f}s audio.')
