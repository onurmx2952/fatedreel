import argparse
import html
import json
import re
import time
import unicodedata
from datetime import date
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parent
TRUSTED_CHANNEL_HINTS = [
    "24 frames",
    "a24",
    "amazon",
    "apple tv",
    "bfi",
    "criterion",
    "disney",
    "film movement",
    "focus features",
    "hbo",
    "ifc films",
    "kino lorber",
    "lionsgate",
    "mubi",
    "neon",
    "netflix",
    "paramount",
    "pathe",
    "peacock",
    "prime video",
    "searchlight",
    "sony",
    "studiocanal",
    "universal",
    "vertical",
    "warner",
]
BANNED_TITLE_HINTS = [
    "ending explained",
    "explained",
    "full movie",
    "full film",
    "movie review",
    "recap",
    "reaction",
    "review",
    "soundtrack",
    "trailer reaction",
]


def read_json(path, default):
    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except FileNotFoundError:
        return default


def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def decode(value):
    return html.unescape(str(value or "")).strip()


def normalize(value):
    text = unicodedata.normalize("NFKD", decode(value)).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-z0-9]+", " ", text.lower())
    return re.sub(r"\s+", " ", text).strip()


def words(value):
    return [part for part in normalize(value).split() if len(part) > 2]


def get_video_id(record):
    if isinstance(record, str):
        return record.strip()
    if isinstance(record, dict):
        return str(record.get("videoId", "")).strip()
    return ""


def fetch_oembed(video_id, timeout=10):
    url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={quote(video_id)}&format=json"
    req = Request(url, headers={"User-Agent": "FatedReel trailer audit/1.0"})
    with urlopen(req, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def score_candidate(movie, video_id, meta):
    movie_title = decode(movie.get("title"))
    movie_year = decode(movie.get("year"))
    video_title = decode(meta.get("title"))
    channel = decode(meta.get("author_name"))

    normalized_movie = normalize(movie_title)
    normalized_video = normalize(video_title)
    normalized_channel = normalize(channel)
    movie_words = set(words(movie_title))
    video_words = set(words(video_title))

    score = 0
    reasons = []

    if normalized_movie and normalized_movie in normalized_video:
        score += 35
        reasons.append("title_exact")
    else:
        overlap = len(movie_words & video_words)
        if movie_words and overlap / max(1, len(movie_words)) >= 0.6:
            score += 18
            reasons.append("title_word_overlap")

    if movie_year and movie_year in normalized_video:
        score += 12
        reasons.append("year_match")

    if re.search(r"\b(official|trailer|teaser|fragman|trailer oficial)\b", normalized_video):
        score += 15
        reasons.append("trailer_terms")

    if any(hint in normalized_channel for hint in TRUSTED_CHANNEL_HINTS):
        score += 25
        reasons.append("trusted_channel")

    banned = [hint for hint in BANNED_TITLE_HINTS if hint in normalized_video]
    if banned:
        score -= 50
        reasons.append("banned_title_hint:" + ",".join(banned[:3]))

    if not channel:
        score -= 10
        reasons.append("missing_channel")

    status = "verified" if score >= 75 else "unverified"
    return {
        "movieTitle": movie_title,
        "year": movie_year,
        "videoId": video_id,
        "videoTitle": video_title,
        "channel": channel,
        "confidence": max(0, min(100, score)),
        "status": status,
        "reasons": reasons,
    }


def audit(ids=None, delay=0.1):
    movies = read_json(ROOT / "movies.json", [])
    trailers = read_json(ROOT / "trailers.json", {})
    movie_by_tt = {decode(movie.get("tt")).lower(): movie for movie in movies}
    target_ids = [movie_id.lower() for movie_id in ids] if ids else sorted(trailers)
    results = {}

    for tt in target_ids:
        movie = movie_by_tt.get(tt)
        record = trailers.get(tt)
        video_id = get_video_id(record)
        if not movie or not video_id:
            continue
        try:
            meta = fetch_oembed(video_id)
            result = score_candidate(movie, video_id, meta)
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as error:
            result = {
                "movieTitle": decode(movie.get("title")),
                "year": decode(movie.get("year")),
                "videoId": video_id,
                "confidence": 0,
                "status": "unverified",
                "reasons": [f"fetch_failed:{type(error).__name__}"],
            }
        results[tt] = result
        time.sleep(delay)

    return results


def apply_results(results):
    trailers = read_json(ROOT / "trailers.json", {})
    for tt, result in results.items():
        current = trailers.get(tt)
        video_id = get_video_id(current) or result["videoId"]
        trailers[tt] = {
            "videoId": video_id,
            "status": result["status"],
            "confidence": result["confidence"],
            "source": "youtube-oembed-audit",
            "checkedAt": date.today().isoformat(),
            "title": result.get("videoTitle", ""),
            "channel": result.get("channel", ""),
            "reasons": result.get("reasons", []),
        }
    write_json(ROOT / "trailers.json", trailers)


def main():
    parser = argparse.ArgumentParser(description="Audit FatedReel YouTube trailer matches.")
    parser.add_argument("--ids", nargs="*", help="IMDb ids to audit, for example tt11892272")
    parser.add_argument("--apply", action="store_true", help="Write audited status back to trailers.json")
    parser.add_argument("--out", default="trailer-audit.json", help="Report path relative to repo root")
    parser.add_argument("--delay", type=float, default=0.1, help="Delay between YouTube oEmbed requests")
    args = parser.parse_args()

    results = audit(args.ids, args.delay)
    report = {
        "generatedAt": date.today().isoformat(),
        "rules": {
            "verifiedThreshold": 75,
            "trustedChannelHints": TRUSTED_CHANNEL_HINTS,
            "bannedTitleHints": BANNED_TITLE_HINTS,
        },
        "summary": {
            "checked": len(results),
            "verified": sum(1 for item in results.values() if item["status"] == "verified"),
            "unverified": sum(1 for item in results.values() if item["status"] != "verified"),
        },
        "results": results,
    }
    write_json(ROOT / args.out, report)
    if args.apply:
        apply_results(results)
    print(json.dumps(report["summary"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
