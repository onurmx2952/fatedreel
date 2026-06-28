const MOVIE_PATH_PATTERN = /^\/(tt\d{6,12})\/?$/i;
const SITE_DESCRIPTION = 'Roll through hand-picked movies, reviews, scenes, trailers, and IMDb links.';

export async function onRequest(context) {
  const requestUrl = new URL(context.request.url);

  if (requestUrl.pathname.startsWith('/api/program/')) {
    return handleProgramApi(context, requestUrl);
  }

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

async function handleProgramApi(context, requestUrl) {
  const { request } = context;
  const path = requestUrl.pathname.replace(/\/+$/, '');

  try {
    if (path === '/api/program/config' && request.method === 'GET') {
      return jsonResponse({
        googleClientId: context.env.GOOGLE_CLIENT_ID || ''
      });
    }

    if (path === '/api/program/auth/google' && request.method === 'POST') {
      requireProgramDb(context);
      await ensureProgramSchema(context);
      const body = await readJson(request);
      const profile = await verifyGoogleCredential(context, body.credential);
      const user = await upsertProgramUser(context, profile);
      const token = createSessionToken();
      const tokenHash = await hashToken(token);
      const expiresAt = sqliteDateTime(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await context.env.PROGRAM_DB.prepare(
        'INSERT INTO program_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)'
      ).bind(tokenHash, user.id, expiresAt).run();

      return jsonResponse({ user }, 200, {
        'Set-Cookie': sessionCookie(token)
      });
    }

    if (path === '/api/program/me' && request.method === 'GET') {
      requireProgramDb(context);
      await ensureProgramSchema(context);
      const user = await getProgramUser(context);
      if (!user) return jsonResponse({ user: null }, 401);
      return jsonResponse({ user });
    }

    if (path === '/api/program/data' && request.method === 'GET') {
      requireProgramDb(context);
      await ensureProgramSchema(context);
      const user = await requireProgramUser(context);
      const row = await context.env.PROGRAM_DB.prepare(
        'SELECT data_json FROM program_data WHERE user_id = ?'
      ).bind(user.id).first();

      return jsonResponse({
        programData: row?.data_json ? JSON.parse(row.data_json) : null
      });
    }

    if (path === '/api/program/data' && request.method === 'PUT') {
      requireProgramDb(context);
      await ensureProgramSchema(context);
      const user = await requireProgramUser(context);
      const body = await readJson(request);
      const programData = body.programData;
      if (!programData || typeof programData !== 'object') {
        return jsonResponse({ error: 'Kaydedilecek program verisi bulunamadı.' }, 400);
      }

      await context.env.PROGRAM_DB.prepare(`
        INSERT INTO program_data (user_id, data_json, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
          data_json = excluded.data_json,
          updated_at = CURRENT_TIMESTAMP
      `).bind(user.id, JSON.stringify(programData)).run();

      return jsonResponse({ ok: true });
    }

    if (path === '/api/program/logout' && request.method === 'POST') {
      requireProgramDb(context);
      await ensureProgramSchema(context);
      const token = getCookie(request, 'program_session');
      if (token) {
        await context.env.PROGRAM_DB.prepare(
          'DELETE FROM program_sessions WHERE token_hash = ?'
        ).bind(await hashToken(token)).run();
      }

      return jsonResponse({ ok: true }, 200, {
        'Set-Cookie': expiredSessionCookie()
      });
    }

    return jsonResponse({ error: 'Program API yolu bulunamadı.' }, 404);
  } catch (error) {
    const status = error.status || 500;
    return jsonResponse({ error: error.message || 'Beklenmeyen hata oluştu.' }, status);
  }
}

function requireProgramDb(context) {
  if (!context.env.PROGRAM_DB) {
    const error = new Error('PROGRAM_DB D1 bağlantısı ayarlı değil.');
    error.status = 500;
    throw error;
  }
}

async function ensureProgramSchema(context) {
  await context.env.PROGRAM_DB.prepare(`
    CREATE TABLE IF NOT EXISTS program_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      google_sub TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      name TEXT,
      picture TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await context.env.PROGRAM_DB.prepare(`
    CREATE TABLE IF NOT EXISTS program_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES program_users(id) ON DELETE CASCADE
    )
  `).run();

  await context.env.PROGRAM_DB.prepare(`
    CREATE TABLE IF NOT EXISTS program_data (
      user_id INTEGER PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES program_users(id) ON DELETE CASCADE
    )
  `).run();
}

async function verifyGoogleCredential(context, credential) {
  if (!context.env.GOOGLE_CLIENT_ID) {
    const error = new Error('GOOGLE_CLIENT_ID ayarlı değil.');
    error.status = 500;
    throw error;
  }

  if (!credential || typeof credential !== 'string') {
    const error = new Error('Google giriş bilgisi eksik.');
    error.status = 400;
    throw error;
  }

  const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
  const response = await fetch(verifyUrl, { headers: { Accept: 'application/json' } });
  const profile = await response.json().catch(() => ({}));

  if (!response.ok || profile.aud !== context.env.GOOGLE_CLIENT_ID || !profile.sub || !profile.email) {
    const error = new Error('Google hesabı doğrulanamadı.');
    error.status = 401;
    throw error;
  }

  return {
    googleSub: String(profile.sub),
    email: String(profile.email),
    name: String(profile.name || profile.email),
    picture: String(profile.picture || '')
  };
}

async function upsertProgramUser(context, profile) {
  await context.env.PROGRAM_DB.prepare(`
    INSERT INTO program_users (google_sub, email, name, picture, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(google_sub) DO UPDATE SET
      email = excluded.email,
      name = excluded.name,
      picture = excluded.picture,
      updated_at = CURRENT_TIMESTAMP
  `).bind(profile.googleSub, profile.email, profile.name, profile.picture).run();

  const row = await context.env.PROGRAM_DB.prepare(
    'SELECT id, email, name, picture FROM program_users WHERE google_sub = ?'
  ).bind(profile.googleSub).first();

  return publicProgramUser(row);
}

async function getProgramUser(context) {
  const token = getCookie(context.request, 'program_session');
  if (!token) return null;

  const tokenHash = await hashToken(token);
  const row = await context.env.PROGRAM_DB.prepare(`
    SELECT u.id, u.email, u.name, u.picture
    FROM program_sessions s
    JOIN program_users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP
  `).bind(tokenHash).first();

  return row ? publicProgramUser(row) : null;
}

async function requireProgramUser(context) {
  const user = await getProgramUser(context);
  if (!user) {
    const error = new Error('Önce Google ile giriş yapmalısınız.');
    error.status = 401;
    throw error;
  }
  return user;
}

function publicProgramUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name || row.email,
    picture: row.picture || ''
  };
}

async function readJson(request) {
  try {
    return await request.json();
  } catch (_) {
    const error = new Error('Geçersiz JSON verisi.');
    error.status = 400;
    throw error;
  }
}

function getCookie(request, name) {
  const cookie = request.headers.get('Cookie') || '';
  const parts = cookie.split(';').map((item) => item.trim());
  const prefix = `${name}=`;
  const match = parts.find((item) => item.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : '';
}

function createSessionToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashToken(token) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function sessionCookie(token) {
  return `program_session=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`;
}

function expiredSessionCookie() {
  return 'program_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';
}

function sqliteDateTime(value) {
  return new Date(value).toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
}

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers
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
