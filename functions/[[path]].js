const MOVIE_PATH_PATTERN = /^\/(tt\d{6,12})\/?$/i;
const SITE_DESCRIPTION = 'Roll through hand-picked movies, reviews, scenes, trailers, and IMDb links.';

export async function onRequest(context) {
  const requestUrl = new URL(context.request.url);
  const match = requestUrl.pathname.match(MOVIE_PATH_PATTERN);

  if (!match) {
    return context.env.ASSETS.fetch(context.request);
  }

  const movieId = match[1].toLowerCase();
  const [templateRes, moviesRes, trailersRes, qualityRes] = await Promise.all([
    fetchAsset(context, '/index.html'),
    fetchAsset(context, '/movies.json'),
    fetchAsset(context, '/trailers.json'),
    fetchAsset(context, '/movie-quality.json')
  ]);

  if (!templateRes.ok || !moviesRes.ok) {
    return context.env.ASSETS.fetch(context.request);
  }

  const [template, movies, trailers, qualityDoc] = await Promise.all([
    templateRes.text(),
    moviesRes.json(),
    trailersRes.ok ? trailersRes.json() : {},
    qualityRes.ok ? qualityRes.json() : {}
  ]);

  const movie = Array.isArray(movies)
    ? movies.find((item) => String(item?.tt || '').toLowerCase() === movieId)
    : null;

  if (!movie || !isPublicMovie(movie, qualityDoc)) {
    return movieNotFoundResponse(movieId);
  }

  const reviewsRes = await fetchAsset(context, `/reviews/${encodeURIComponent(movieId)}.json`);
  const reviews = reviewsRes.ok ? await reviewsRes.json() : [];
  const html = renderMovieHtml(template, movie, Array.isArray(reviews) ? reviews : [], trailers?.[movieId], requestUrl.origin);

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate'
    }
  });
}

function fetchAsset(context, pathname) {
  const assetUrl = new URL(pathname, context.request.url);
  return context.env.ASSETS.fetch(new Request(assetUrl.toString(), { method: 'GET' }));
}

function isPublicMovie(movie, qualityDoc) {
  const movieId = decodeText(movie?.tt || '').toLowerCase();
  const quality = qualityDoc?.movies?.[movieId];
  if (quality && quality.public === false) return false;
  return displayScenes(movie).length >= 4;
}

function movieNotFoundResponse(movieId) {
  return new Response(`<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,follow">
<title>Movie not found - FatedReel</title>
<link rel="canonical" href="https://fatedreel.com/">
</head>
<body>
<main>
<h1>Movie not found</h1>
<p>${escapeHtml(movieId)} is not in the FatedReel movie list.</p>
</main>
</body>
</html>`, {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate'
    }
  });
}

function renderMovieHtml(template, movie, reviews, trailerId, origin) {
  const movieId = decodeText(movie.tt).toLowerCase();
  const title = decodeText(movie.title || 'Movie').trim();
  const year = decodeText(movie.year || '').trim();
  const titleWithYear = year ? `${title} (${year})` : title;
  const canonical = `https://fatedreel.com/${movieId}`;
  const description = movieMetaDescription(movie);
  const posterUrl = absoluteUrl(movie.poster, origin);
  const scenes = displayScenes(movie);
  const schema = structuredDataForMovie(movie, origin);

  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(titleWithYear)} - FatedReel</title>`);
  html = html.replace(/<meta name="description" content="[^"]*">/i, `<meta name="description" content="${escapeHtml(description)}">`);
  html = html.replace(/<link rel="canonical" href="[^"]*">/i, `<link rel="canonical" href="${canonical}">`);
  html = html.replace(
    /<script id="structuredData" type="application\/ld\+json">[\s\S]*?<\/script>/i,
    `<script id="structuredData" type="application/ld+json">${safeJson(schema)}</script>`
  );
  html = html.replace(
    /(<meta name="description" content="[^"]*">)/i,
    `$1\n<meta name="robots" content="index,follow">\n<meta property="og:type" content="video.movie">\n<meta property="og:title" content="${escapeHtml(`${titleWithYear} - FatedReel`)}">\n<meta property="og:description" content="${escapeHtml(description)}">\n<meta property="og:url" content="${canonical}">\n${posterUrl ? `<meta property="og:image" content="${escapeHtml(posterUrl)}">` : ''}`
  );

  html = html.replace(
    '<div class="hero-bg" id="heroBg"></div>',
    `<div class="hero-bg" id="heroBg" style="opacity: 1; background-image: url(&quot;${escapeHtmlAttr(movie.poster || '')}&quot;);"></div>`
  );
  html = html.replace(
    '<div class="genre-tags" id="genreTags"></div>',
    `<div class="genre-tags" id="genreTags">${(movie.genres || []).map((genre) => `<span class="genre-tag">${escapeHtml(decodeText(genre))}</span>`).join('')}</div>`
  );
  html = html.replace('<h1 class="hero-title" id="heroTitle"></h1>', `<h1 class="hero-title" id="heroTitle">${escapeHtml(title)}</h1>`);
  html = html.replace('<span class="year" id="heroYear"></span>', `<span class="year" id="heroYear">${escapeHtml(year)}</span>`);
  html = html.replace('<span id="heroRating"></span>', `<span id="heroRating">${escapeHtml(String(movie.rating || '-'))} / 10</span>`);
  html = html.replace('<div class="hero-summary" id="heroSummary"></div>', `<div class="hero-summary" id="heroSummary">${renderExpandableText(movie.summary, 180)}</div>`);
  html = html.replace('<div class="scenes-scroll" id="scenesScroll"></div>', `<div class="scenes-scroll" id="scenesScroll">${renderScenes(scenes)}</div>`);
  html = html.replace('<div id="reviewsList"></div>', `<div id="reviewsList">${renderReviews(movie, reviews)}</div>`);
  html = html.replace('<div class="trailer-card" id="trailerCard">', `<div class="trailer-card visible${trailerId ? '' : ' search-mode'}" id="trailerCard">`);
  html = html.replace('<div class="trailer-title" id="trailerTitle">Official Trailer</div>', `<div class="trailer-title" id="trailerTitle">${escapeHtml(`${title} ${trailerId ? 'Official Trailer' : 'Trailer Search'}`)}</div>`);
  html = html.replace(/(<iframe[\s\S]*?id="trailerFrame"[\s\S]*?src=")[^"]*(")/i, `$1${trailerId ? trailerEmbedUrl(trailerId) : ''}$2`);
  html = html.replace('<a class="trailer-search-link" id="trailerSearchLink" href="#"', `<a class="trailer-search-link" id="trailerSearchLink" href="${escapeHtmlAttr(trailerSearchUrl(movie))}"`);
  html = html.replace('<a class="imdb-link" id="imdbLink" href="#"', `<a class="imdb-link" id="imdbLink" href="https://www.imdb.com/title/${movieId}/"`);
  html = html.replace('<span class="imdb-title">View on IMDb</span>', `<span class="imdb-title">${escapeHtml(`${title} on IMDb`)}</span>`);

  return html;
}

function structuredDataForMovie(movie, origin) {
  const movieId = decodeText(movie?.tt || '').toLowerCase();
  const rating = Number(movie?.rating);
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: decodeText(movie?.title || '').trim(),
    url: `https://fatedreel.com/${movieId}`,
    sameAs: `https://www.imdb.com/title/${movieId}/`,
    description: movieMetaDescription(movie),
    image: absoluteUrl(movie?.poster, origin),
    datePublished: decodeText(movie?.year || '').trim() || undefined,
    genre: Array.isArray(movie?.genres) ? movie.genres.map(decodeText).filter(Boolean) : undefined
  };

  if (Number.isFinite(rating) && rating > 0) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating,
      bestRating: 10,
      worstRating: 1
    };
  }

  Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);
  return data;
}

function movieMetaDescription(movie) {
  const title = decodeText(movie?.title || 'Movie').trim();
  const year = decodeText(movie?.year || '').trim();
  const label = year ? `${title} (${year})` : title;
  const summary = decodeText(movie?.summary || '').replace(/\s+/g, ' ').trim();
  const context = 'Explore reviews, scenes, trailers, and IMDb links for this movie on FatedReel.';
  const copy = summary ? `${label}: ${summary} ${context}` : `${label}. ${context}`;
  return metaDescriptionText(copy);
}

function metaDescriptionText(text, maxLength = 155) {
  const cleanText = decodeText(text || '').replace(/\s+/g, ' ').trim();
  if (cleanText.length <= maxLength) return cleanText;

  const trimmed = cleanText.slice(0, maxLength - 3).trimEnd();
  const lastSpace = trimmed.lastIndexOf(' ');
  const sentence = lastSpace > maxLength * 0.65 ? trimmed.slice(0, lastSpace) : trimmed;
  return `${sentence.replace(/[.,;:!?-]+$/, '')}...`;
}

function displayScenes(movie) {
  return [...new Set((movie?.scenes || []).filter(Boolean))];
}

function renderScenes(scenes) {
  return scenes.map((src, sceneIndex) => `
    <div class="scene-card" data-scene-index="${sceneIndex}">
      <img src="${escapeHtmlAttr(src)}" alt="scene" loading="lazy" onerror="this.parentElement.style.display='none'">
    </div>
  `).join('');
}

function renderReviews(movie, reviews) {
  const safeReviews = Array.isArray(reviews) ? reviews.slice(0, 5) : [];
  if (!safeReviews.length) {
    return `
      <div class="review-card fade-up visible">
        <div class="review-text">No review text.</div>
      </div>
    `;
  }

  return safeReviews.map((review, i) => `
    <div class="review-card fade-up visible" style="transition-delay:${Math.min(i, 4) * 0.06}s">
      <div class="stars">${starsHTML(movie.rating)}</div>
      <div class="review-text">${renderExpandableText(review?.body || 'No review text.', 260)}</div>
    </div>
  `).join('');
}

function starsHTML(rating) {
  const full = Math.round(Number(rating || 0) / 2);
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="star ${i <= full ? 'filled' : 'empty'}">&#9733;</span>`;
  }
  return html;
}

function renderExpandableText(text, maxLength) {
  const fullText = decodeText(text || '').trim();
  const needsToggle = fullText.length > maxLength;
  const collapsedText = needsToggle ? `${fullText.slice(0, maxLength).trimEnd()}...` : fullText;
  const buttonHtml = needsToggle
    ? '<button class="expandable-toggle" type="button" aria-expanded="false" data-more-label="More" data-less-label="Less">More</button>'
    : '';
  return `<span class="expandable-copy" data-full="${escapeHtml(fullText)}" data-collapsed="${escapeHtml(collapsedText)}" data-expanded="false">${escapeHtml(collapsedText)}</span>${buttonHtml}`;
}

function trailerEmbedUrl(videoId) {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(String(videoId || '').trim())}?rel=0&modestbranding=1&playsinline=1`;
}

function trailerSearchUrl(movie) {
  const query = `${decodeText(movie.title)} ${decodeText(movie.year || '')} official trailer`.trim();
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function absoluteUrl(value, origin) {
  if (!value) return undefined;
  try {
    return new URL(value, origin).href;
  } catch (_) {
    return undefined;
  }
}

function decodeText(value) {
  return String(value ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(x?[0-9a-f]+);/gi, (_, code) => {
      const value = code[0].toLowerCase() === 'x'
        ? parseInt(code.slice(1), 16)
        : parseInt(code, 10);
      return Number.isFinite(value) ? String.fromCodePoint(value) : '';
    });
}

function escapeHtml(text = '') {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeHtmlAttr(text = '') {
  return escapeHtml(text);
}

function safeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}
