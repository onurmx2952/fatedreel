'use strict';
const $ = id => document.getElementById(id);
let lessons = [], selected = null, subject = 'Tümü';
const video = $('video');
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const text = (tag, value, cls) => { const el = document.createElement(tag); el.textContent = value; if (cls) el.className = cls; return el; };
function mediaPath(path) {
  const url = new URL(path, location.href);
  if (url.origin !== location.origin || !url.pathname.startsWith('/ortaokul/media/')) throw new Error('Geçersiz içerik yolu');
  return url.href;
}
function drawList() {
  const query = $('search').value.toLocaleLowerCase('tr').trim();
  const visible = lessons.filter(l => (subject === 'Tümü' || l.subject === subject) && `${l.title} ${l.subject} ${l.description}`.toLocaleLowerCase('tr').includes(query));
  $('count').textContent = `${visible.length} ders`;
  $('lesson-list').replaceChildren();
  for (const l of visible) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'lesson-card'; b.setAttribute('aria-current', String(l.id === selected?.id));
    const img = document.createElement('img'); img.src = mediaPath(l.poster); img.alt = ''; img.loading = 'lazy';
    const bottom = text('span', '', 'card-bottom'); bottom.append(text('span', `${fmt(l.duration)} · ${l.audioMode === 'silent' ? 'Sessiz' : 'Türkçe sesli'}`), text('span', 'İzle ↗'));
    b.append(img, text('small', `${l.subject} / Ortaokul`), text('strong', l.title), bottom);
    b.addEventListener('click', () => { location.hash = l.id; select(l); }); $('lesson-list').append(b);
  }
  if (!visible.length) $('lesson-list').append(text('p', 'Bu aramada ders bulunamadı. Başka bir konu dene.', 'empty'));
}
function drawFilters() {
  $('filters').replaceChildren();
  for (const name of ['Tümü', ...new Set(lessons.map(l => l.subject))]) {
    const b = text('button', name); b.type = 'button'; b.setAttribute('aria-pressed', String(name === subject));
    b.onclick = () => { subject = name; drawFilters(); drawList(); }; $('filters').append(b);
  }
}
function select(l) {
  if (selected?.id === l.id) return;
  selected = l; video.pause(); $('video-error').hidden = true;
  $('audio-description').textContent = l.audioMode === 'silent' ? 'Sessiz anlatım · Türkçe açıklama yazıları' : 'Türkçe sesli anlatım · Görüntüye gömülü altyazı';
  $('text-heading').textContent = l.audioMode === 'silent' ? 'Ekrandaki açıklamalar' : 'Anlatım metni';
  video.src = mediaPath(l.video); video.poster = mediaPath(l.poster); video.load();
  $('lesson-title').textContent = l.title; $('lesson-meta').textContent = `${l.subject.toLocaleUpperCase('tr')} · ORTAOKUL · ${fmt(l.duration)}`;
  $('description').textContent = l.description; $('download').href = mediaPath(l.video); $('subtitle').href = mediaPath(l.subtitle);
  $('lesson').hidden = false; $('chapters').replaceChildren();
  for (const c of l.chapters) {
    const b = text('button', ''); b.type = 'button'; b.append(text('span', fmt(c.start)), document.createTextNode(c.title));
    b.onclick = () => { video.currentTime = c.start; video.play().catch(() => { $('status').textContent = 'Oynat düğmesine basarak videoyu başlatabilirsin.'; }); }; $('chapters').append(b);
  }
  $('takeaways').replaceChildren(...l.takeaways.map(t => text('li', t)));
  $('transcript').replaceChildren(...l.transcript.map(p => text('p', p)));
  $('question').textContent = l.quiz.question; $('answers').replaceChildren(); $('feedback').textContent = '';
  l.quiz.options.forEach((o, i) => {
    const b = text('button', o); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
    b.onclick = () => { for (const other of $('answers').children) other.setAttribute('aria-pressed', String(other === b)); $('feedback').textContent = `${i === l.quiz.correct ? 'Doğru! ' : 'Bir daha düşün. '}${l.quiz.explanation}`; }; $('answers').append(b);
  });
  drawList(); document.title = `${l.title} · Ortaokul`;
}
video.addEventListener('timeupdate', () => {
  if (!selected) return;
  selected.chapters.forEach((c, i) => $('chapters').children[i].setAttribute('aria-current', String(video.currentTime >= c.start && video.currentTime < (selected.chapters[i + 1]?.start ?? Infinity))));
});
video.addEventListener('error', () => { if (selected) $('video-error').hidden = false; });
$('search').addEventListener('input', drawList);
$('classroom').onclick = () => { const enabled = document.body.classList.toggle('classroom'); $('classroom').textContent = enabled ? '↙ Normal görünüm' : '⛶ Sınıf görünümü'; $('classroom').setAttribute('aria-pressed', String(enabled)); $('lesson').scrollIntoView({block:'start'}); };
document.querySelector('.archive-link').onclick = () => { document.body.classList.remove('classroom'); $('classroom').textContent = '⛶ Sınıf görünümü'; $('classroom').setAttribute('aria-pressed', 'false'); };
$('share').onclick = async () => {
  if (!selected) return;
  const url = `${location.origin}${location.pathname}#${selected.id}`;
  try { await navigator.clipboard.writeText(url); $('status').textContent = 'Ders bağlantısı kopyalandı.'; }
  catch { $('status').replaceChildren(text('span', 'Ders bağlantısı: ')); const a = text('a', url); a.href = url; $('status').append(a); }
};
function fromHash() { let id; try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; } const l = lessons.find(l => l.id === id); if (l) select(l); }
window.addEventListener('hashchange', fromHash);
(async () => {
  try {
    const response = await fetch('./library.json', {cache:'no-cache'}); if (!response.ok) throw new Error('Arşiv yüklenemedi');
    const data = await response.json(); if (!Array.isArray(data.lessons)) throw new Error('Arşiv geçersiz'); lessons = data.lessons;
    drawFilters(); drawList(); if (lessons.length) { fromHash(); if (!selected) select(lessons[0]); }
  } catch { $('lesson-list').replaceChildren(text('p', 'Ders arşivi yüklenemedi. Sayfayı yenileyerek tekrar dene.', 'empty')); $('status').textContent = 'Bağlantını kontrol edip tekrar deneyebilirsin.'; }
})();
