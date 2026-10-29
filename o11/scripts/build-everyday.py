"""Editorial source -> book examples and deterministic Caro Davy audio manifest."""
import hashlib,json
from pathlib import Path
site=Path(__file__).resolve().parents[1]
groups={};unit=None
for line in (site/'scripts/everyday-sentences.txt').read_text(encoding='utf-8').splitlines():
 line=line.strip()
 if not line or line.startswith('#'):continue
 if line.startswith('@'):
  unit=int(line[1:]);groups[unit]=[];continue
 en,tr=map(str.strip,line.split('|',1))
 groups[unit].append({'en':en,'tr':tr,'audio':hashlib.sha256(en.encode()).hexdigest()[:16]})
assert set(groups)==set(range(1,33))
assert all(len(rows)==15 for rows in groups.values())
texts=[r['en'] for rows in groups.values() for r in rows]
assert len(set(texts))==480,'Do not repeat recordings across units'
book=json.loads((site/'book.json').read_text(encoding='utf-8'))
for u in book['units']:
 u['examples']=groups[u['id']]
 # Retired dialogue tasks must not add old textbook sentences to the new pool.
 u['dialogue']=[]
 u['exercises']=[{**s,'why':u['rules'][0][1]} for s in u['examples'][:4]]
book['practiceEdition']='everyday-v11'
(site/'book.json').write_text(json.dumps(book,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Rebuilt every unit: 480 new everyday practice sentences')
