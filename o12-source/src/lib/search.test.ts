import { test } from "node:test";
import assert from "node:assert/strict";
import { searchAtlas } from "./search";
import type { Atlas, WordRef } from "../atlas/types";
const words = [
  { id: "library", word: "library", zh: "n. kütüphane; kitaplık", search: "Kitapların ödünç alındığı yer", order: 0 },
  { id: "light", word: "light", zh: "n. ışık; aydınlık", order: 1 },
  { id: "work", word: "work", zh: "n. iş; çalışma", order: 2 },
] as WordRef[];
const atlas = { words } as Atlas;
test("Turkish meanings support case and keyboard variants", () => {
  for (const q of ["kütüphane", "KÜTÜPHANE", "kutuphane"]) assert.equal(searchAtlas(atlas, q)[0]?.id, "library");
  for (const q of ["ışık", "IŞIK", "isik"]) assert.equal(searchAtlas(atlas, q)[0]?.id, "light");
  for (const q of ["çalışma", "ÇALIŞMA", "calisma", "İŞ"]) assert.equal(searchAtlas(atlas, q)[0]?.id, "work");
});
test("English exact matches precede prefixes, and blank queries return no hits", () => {
  assert.equal(searchAtlas(atlas, "LIBRARY")[0]?.id, "library");
  assert.equal(searchAtlas(atlas, "lib")[0]?.id, "library");
  assert.equal(searchAtlas(atlas, "ODUNC")[0]?.id, "library");
  assert.deepEqual(searchAtlas(atlas, "  "), []);
  assert.equal(searchAtlas(atlas, "a", 1).length, 1);
});
