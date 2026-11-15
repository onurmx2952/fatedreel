import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const readJson = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const [movies, trailers, quality] = await Promise.all(
  ['movies.json', 'trailers.json', 'movie-quality.json'].map(readJson)
);
// Small buckets avoid parsing the entire catalogue for one movie request.
const buckets = Array.from({length:64}, () => ({}));
for (const movie of movies) {
  const id = String(movie.tt).toLowerCase();
  if (!/^tt\d{6,12}$/.test(id)) throw new Error(`Invalid movie ID: ${id}`);
  buckets[Number(id.slice(2)) % 64][id] = {
    movie, trailer: trailers[id], quality: quality.movies?.[id]
  };
}
await mkdir(resolve(root, 'movie-data'), {recursive:true});
const sizes = await Promise.all(buckets.map(async (bucket, index) => {
  const text = JSON.stringify(bucket);
  await writeFile(resolve(root, `movie-data/${index}.json`), text);
  return Buffer.byteLength(text);
}));
console.log(`Built ${movies.length} movies in 64 buckets; largest ${Math.max(...sizes)} bytes.`);
