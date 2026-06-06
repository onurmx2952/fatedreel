import html
import json
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parent
SITE_URL = "https://fatedreel.com"


def read_json(path, default):
    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except FileNotFoundError:
        return default


def get_movie_id(movie):
    return html.unescape(str(movie.get("tt", ""))).lower()


def get_review_count(tt):
    reviews = read_json(ROOT / "reviews" / f"{tt}.json", [])
    return len(reviews) if isinstance(reviews, list) else 0


def build_quality():
    movies = read_json(ROOT / "movies.json", [])
    trailers = read_json(ROOT / "trailers.json", {})
    curation = read_json(ROOT / "curation.json", {})

    min_public_scenes = int(curation.get("minPublicScenes", 4))
    min_public_reviews = int(curation.get("minPublicReviews", 2))
    allow_missing_trailer = bool(curation.get("allowMissingTrailer", True))
    blocked = {
        key.lower(): value
        for key, value in dict(curation.get("blockedMovieIds", {})).items()
    }

    quality = {}
    summary = {
        "totalMovies": 0,
        "publicMovies": 0,
        "hiddenMovies": 0,
        "manualBlocked": 0,
        "fewScenes": 0,
        "fewReviews": 0,
        "missingTrailer": 0
    }

    for movie in movies:
        tt = get_movie_id(movie)
        if not tt:
            continue

        scenes = [scene for scene in movie.get("scenes", []) if scene]
        reviews = get_review_count(tt)
        has_trailer = bool(trailers.get(tt))
        issues = []

        if tt in blocked:
            issues.append("manual_blocked")
            summary["manualBlocked"] += 1
        if len(scenes) < min_public_scenes:
            issues.append("few_scenes")
            summary["fewScenes"] += 1
        if reviews < min_public_reviews:
            issues.append("few_reviews")
            summary["fewReviews"] += 1
        if not has_trailer:
            issues.append("missing_trailer")
            summary["missingTrailer"] += 1

        blocking_issues = [
            issue for issue in issues
            if issue != "missing_trailer" or not allow_missing_trailer
        ]
        is_public = not blocking_issues

        quality[tt] = {
            "public": is_public,
            "issues": issues,
            "scenes": len(scenes),
            "reviews": reviews,
            "trailer": has_trailer
        }

        summary["totalMovies"] += 1
        if is_public:
            summary["publicMovies"] += 1
        else:
            summary["hiddenMovies"] += 1

    doc = {
        "generatedAt": date.today().isoformat(),
        "rules": {
            "minPublicScenes": min_public_scenes,
            "minPublicReviews": min_public_reviews,
            "allowMissingTrailer": allow_missing_trailer
        },
        "summary": summary,
        "movies": quality
    }

    (ROOT / "movie-quality.json").write_text(
        json.dumps(doc, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8"
    )
    write_sitemap(movies, quality)
    return summary


def write_sitemap(movies, quality):
    today = date.today().isoformat()
    urls = [(f"{SITE_URL}/", "daily", "1.0")]

    for movie in movies:
        tt = get_movie_id(movie)
        if quality.get(tt, {}).get("public") is True:
            urls.append((f"{SITE_URL}/{tt}", "weekly", "0.8"))

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ]
    for loc, changefreq, priority in urls:
        lines.extend([
            "  <url>",
            f"    <loc>{loc}</loc>",
            f"    <lastmod>{today}</lastmod>",
            f"    <changefreq>{changefreq}</changefreq>",
            f"    <priority>{priority}</priority>",
            "  </url>"
        ])
    lines.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    print(json.dumps(build_quality(), ensure_ascii=False, indent=2))
