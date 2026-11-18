"""Build the public directory. Run before publishing a new page."""
from pathlib import Path
import html, json, re
ROOT = Path(__file__).resolve().parent.parent
folder = ROOT / "icindekiler"
overrides = json.loads((folder / "titles.json").read_text(encoding="utf-8"))
entries = []
for directory in sorted(ROOT.iterdir(), key=lambda p: p.name.lower()):
    index = directory / "index.html"
    if not directory.is_dir() or not index.exists() or directory.name.startswith(".") or directory.name.endswith("-source") or directory.name == "icindekiler":
        continue
    source = index.read_text(encoding="utf-8", errors="replace")
    match = re.search(r"<title[^>]*>(.*?)</title>", source, re.I | re.S)
    if not match:
        continue
    title = html.unescape(re.sub(r"<[^>]+>", "", match.group(1))).strip()
    name = directory.name
    group = name[0].lower() if re.fullmatch(r"[dDoO]\d+", name) else "other"
    entries.append(dict(path=name, title=overrides.get(name, title), originalTitle=title, group=group))
def key(entry):
    return ({"d":0,"o":1,"other":2}[entry["group"]], int(entry["path"][1:]) if entry["group"] != "other" else 0, entry["path"])
entries.sort(key=key)
missing = [f"{prefix}{i}" for prefix in ("d","o") for i in range(1,21) if f"{prefix}{i}" not in {e["path"].lower() for e in entries}]
rows = []
for entry in entries:
    path, title = html.escape(entry["path"], quote=True), html.escape(entry["title"])
    rows.append(f'<li data-group="{entry["group"]}"><a href="/{path}/"><span class="url">https://fatedreel.com/{path}/</span><span class="arrow" aria-hidden="true">→</span><span class="name">{title}</span><span class="open" aria-hidden="true">↗</span></a></li>')
template = (folder / "template.html").read_text(encoding="utf-8")
output = template.replace("{{ROWS}}", "\n".join(rows)).replace("{{COUNT}}",str(len(entries))).replace("{{MISSING}}", " · ".join(missing))
(folder / "index.html").write_text(output, encoding="utf-8")
(folder / "sites.json").write_text(json.dumps(entries,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(f"Directory built: {len(entries)} pages, {len(missing)} unused numbered addresses")
