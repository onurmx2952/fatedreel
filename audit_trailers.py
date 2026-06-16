import argparse
import html
import json
import re
import time
import unicodedata
from concurrent.futures import ThreadPoolExecutor
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
    "mgm",
    "mubi",
    "neon",
    "netflix",
    "movieclips",
    "paramount",
    "pathe",
    "peacock",
    "prime video",
    "searchlight",
    "sony",
    "rotten tomatoes",
    "shout factory",
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
TRAILER_MARKERS = {
    "clip",
    "featurette",
    "official",
    "promo",
    "teaser",
    "trailer",
}
TITLE_SUFFIX_NOISE = {
    "4k",
    "hd",
    "hq",
    "movie",
    "film",
    "original",
    "restored",
    "theatrical",
    "uk",
    "us",
}
SEQUEL_PREFIXES = {"chapter", "part", "vol", "volume"}
SEQUEL_VALUES = {"2", "3", "4", "ii", "iii", "iv", "returns", "rises"}


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
    return normalize(value).split()


def find_title_phrase(movie_title, video_title):
    movie_tokens = words(movie_title)
    video_tokens = words(video_title)
    if not movie_tokens:
        return None
    phrase_size = len(movie_tokens)
    for start in range(len(video_tokens) - phrase_size + 1):
        if video_tokens[start : start + phrase_size] == movie_tokens:
            return start, start + phrase_size, video_tokens
    return None


def title_extension_tokens(movie_title, video_title):
    match = find_title_phrase(movie_title, video_title)
    if not match:
        return []
    _, end, video_tokens = match
    extension = []
    for token in video_tokens[end:]:
        if token in TRAILER_MARKERS:
            break
        if re.fullmatch(r"(?:19|20)\d{2}", token) or token in TITLE_SUFFIX_NOISE:
            continue
        extension.append(token)
    return extension


def compound_title_extension(movie_title, video_title):
    movie_tokens = words(movie_title)
    if not movie_tokens:
        return ""
    raw_video = unicodedata.normalize("NFKD", decode(video_title)).encode("ascii", "ignore").decode("ascii").lower()
    title_pattern = r"(?<![a-z0-9])" + r"[^a-z0-9]+".join(re.escape(token) for token in movie_tokens) + r"(?![a-z0-9])"
    match = re.search(title_pattern, raw_video)
    if not match:
        return ""
    tail = raw_video[match.end() :]
    continuation = re.match(r"-([a-z0-9]+)", tail) or re.match(r"\s*&\s*([a-z0-9]+)", tail)
    if not continuation:
        return ""
    token = continuation.group(1)
    if token in TRAILER_MARKERS or token in TITLE_SUFFIX_NOISE or re.fullmatch(r"(?:19|20)\d{2}", token):
        return ""
    return token


def has_sequel_conflict(movie_title, extension):
    if not extension:
        return False
    movie_tokens = words(movie_title)
    first = extension[0]
    if first in SEQUEL_VALUES:
        if first == "2" and any(token == "2" or token.endswith("2") for token in movie_tokens):
            return False
        return True
    return first in SEQUEL_PREFIXES and len(extension) > 1 and extension[1] in SEQUEL_VALUES


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
    phrase_match = find_title_phrase(movie_title, video_title)
    extension = title_extension_tokens(movie_title, video_title)
    compound_extension = compound_title_extension(movie_title, video_title)
    video_years = set(re.findall(r"\b(?:19|20)\d{2}\b", normalized_video))

    score = 0
    reasons = []

    if phrase_match:
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

    hard_conflicts = []
    if extension:
        reasons.append("title_extension_candidate:" + ",".join(extension[:4]))
    if compound_extension:
        hard_conflicts.append("compound_title_extension:" + compound_extension)
    if has_sequel_conflict(movie_title, extension):
        hard_conflicts.append("sequel_marker_conflict:" + ",".join(extension[:4]))
    if movie_year and video_years and movie_year not in video_years:
        year_deltas = [abs(int(movie_year) - int(year)) for year in video_years]
        if min(year_deltas) > 1:
            reasons.append("year_conflict_candidate:" + ",".join(sorted(video_years)))
        else:
            reasons.append("year_near_match:" + ",".join(sorted(video_years)))

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

    if hard_conflicts:
        score -= 80
        reasons.extend(hard_conflicts)
        status = "rejected"
    else:
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


def audit(ids=None, delay=0.1, workers=6):
    movies = read_json(ROOT / "movies.json", [])
    trailers = read_json(ROOT / "trailers.json", {})
    movie_by_tt = {decode(movie.get("tt")).lower(): movie for movie in movies}
    target_ids = [movie_id.lower() for movie_id in ids] if ids else sorted(trailers)
    def check_trailer(tt):
        movie = movie_by_tt.get(tt)
        record = trailers.get(tt)
        video_id = get_video_id(record)
        if not movie or not video_id:
            return tt, None
        try:
            meta = fetch_oembed(video_id)
            result = score_candidate(movie, video_id, meta)
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as error:
            result = {
                "movieTitle": decode(movie.get("title")),
                "year": decode(movie.get("year")),
                "videoId": video_id,
                "confidence": 0,
                "status": "check_failed",
                "reasons": [f"fetch_failed:{type(error).__name__}"],
            }
        time.sleep(delay)
        return tt, result

    results = {}
    with ThreadPoolExecutor(max_workers=max(1, workers)) as executor:
        for tt, result in executor.map(check_trailer, target_ids):
            if result is not None:
                results[tt] = result

    return results


def apply_results(results):
    trailers = read_json(ROOT / "trailers.json", {})
    for tt, result in results.items():
        if result["status"] != "rejected":
            continue
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
    parser.add_argument("--workers", type=int, default=6, help="Maximum concurrent YouTube metadata checks")
    args = parser.parse_args()

    results = audit(args.ids, args.delay, args.workers)
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
            "unverified": sum(1 for item in results.values() if item["status"] == "unverified"),
            "rejected": sum(1 for item in results.values() if item["status"] == "rejected"),
            "checkFailed": sum(1 for item in results.values() if item["status"] == "check_failed"),
        },
        "results": results,
    }
    write_json(ROOT / args.out, report)
    if args.apply:
        apply_results(results)
    print(json.dumps(report["summary"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
