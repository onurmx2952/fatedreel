"""Check every published practice transcript/hash and fully decode its MP3."""
import hashlib,json,subprocess,array,math
from pathlib import Path
site=Path(__file__).resolve().parents[1]
book=json.loads((site/'book.json').read_text(encoding='utf-8'))
sentences=[s for u in book['units'] for s in u['examples']]
assert len(sentences)==480
seconds=0
for s in sentences:
 assert s['audio']==hashlib.sha256(s['en'].encode()).hexdigest()[:16]
 file=site/'audio'/f"{s['audio']}.mp3"
 assert file.exists() and file.stat().st_size>1000,str(file)
 result=subprocess.run(['ffmpeg','-v','error','-i',str(file),'-f','s16le','-ac','1','-ar','16000','pipe:1'],capture_output=True,check=True)
 assert not result.stderr,result.stderr.decode()
 samples=array.array('h',result.stdout);duration=len(samples)/16000
 assert .5<duration<35,(s['en'],duration)
 rms=math.sqrt(sum(v*v for v in samples)/len(samples))
 assert rms>20,('Silent recording',s['en'],rms)
 seconds+=duration
print(f'All {len(sentences)} Caro Davy MP3s passed hash/coverage, full decode, duration and non-silence checks ({seconds:.0f}s of speech).')
