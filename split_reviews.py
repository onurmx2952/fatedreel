import json
from pathlib import Path

SOURCE = Path("reviews.json")
OUTPUT_DIR = Path("reviews")

with SOURCE.open(encoding="utf-8") as source_file:
    reviews_by_title = json.load(source_file)

OUTPUT_DIR.mkdir(exist_ok=True)
for title_id, reviews in reviews_by_title.items():
    output_path = OUTPUT_DIR / f"{title_id}.json"
    with output_path.open("w", encoding="utf-8", newline="\n") as output_file:
        json.dump(reviews, output_file, ensure_ascii=False, separators=(",", ":"))

print("Wrote review files:", len(reviews_by_title))
