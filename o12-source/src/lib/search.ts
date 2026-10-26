import type { Atlas, WordRef } from "../atlas/types";
export function searchAtlas(atlas: Atlas, raw: string, limit = 40): WordRef[] {
  const fold = (s: string) => s.normalize("NFKC").toLocaleLowerCase("tr-TR").replace(/ı/g, "i").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const q = fold(raw.trim());
  if (!q) return [];
  const hits: [number, WordRef][] = [];
  for (const w of atlas.words) {
    let score = 0;
    const word = fold(w.word);
    if (word === q) score = 1000;
    else if (word.startsWith(q)) score = 500 - word.length;
    else if (word.includes(q)) score = 200 - word.indexOf(q) - word.length;
    const i = fold(`${w.zh} ${w.search ?? ""}`).indexOf(q);
    if (i >= 0) score = Math.max(score, 100 - Math.min(40, i) - w.zh.length * 0.2);
    if (score > 0) hits.push([score, w]);
  }
  hits.sort((a, b) => b[0] - a[0] || a[1].order - b[1].order);
  return hits.slice(0, limit).map((h) => h[1]);
}

