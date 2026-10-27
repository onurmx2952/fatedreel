import { go } from "../lib/router";
import { startLevelSession } from "../store/session";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useAtlas } from "../atlas/context";
import { store } from "../store/store";

const LEVELS = [
  ["A1", "Başlangıç", "En temel kelimelerden başlayarak öğren"],
  ["A2", "Temel", "Günlük kelimelerle sağlam bir temel"],
  ["B1", "Orta", "Hedef 5,5 – 6 puan"],
  ["B2", "Orta üstü", "Hedef 6,5 – 7 puan"],
  ["C1", "İleri", "Hedef IELTS 7,5 ve üzeri"],
  ["C2", "Uzman", "İnce anlamlar ve gelişmiş kelimeler"],
];

export function Onboarding() {
  const atlas = useAtlas();
  const [level, setLevel] = useState(0);
  const [goal, setGoal] = useState(10);
  const finish = () => {
    const startLevel = atlas.cefr.indexOf(LEVELS[level][0]);
    store.settings({ onboarded: true, startLevel, dailyNew: goal });
    if (startLevelSession(atlas, startLevel)) go({ page: "learn" });
  };
  return (
    <div className="onboard" role="dialog" aria-modal="true" aria-label="Hoş geldin">
      <div className="onboard-card">
        <img className="onboard-art" src={`${import.meta.env.BASE_URL}brand/hero.webp`} alt="" />
        <div className="onboard-body">
          <p className="eyebrow">Kelime Atlası’na hoş geldin</p>
          <h1 className="display">
            {atlas.count.toLocaleString("tr-TR")} kelime,<br />keşfedilecek bir dünya. </h1>
          <fieldset>
            <legend>Hangi seviyeden başlayalım?</legend>
            <div className="choice-grid">
              {LEVELS.map(([code, name, desc], i) => (
                <button key={code} className={`choice ${level === i ? "is-on" : ""}`} onClick={() => setLevel(i)} aria-pressed={level === i}>
                  <span className={`chip chip-level lv-${code}`}>{code}</span>
                  <b>{name}</b>
                  <small>{desc}</small>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Her gün kaç yeni kelime öğrenmek istersin?</legend>
            <div className="segmented segmented-wide">
              {[5, 10, 15, 20].map((n) => (
                <button key={n} className={goal === n ? "is-on" : ""} onClick={() => setGoal(n)} aria-pressed={goal === n}>
                  {n} kelime{n === 10 ? " · önerilen" : ""}
                </button>
              ))}
            </div>
          </fieldset>
          <button className="btn btn-primary btn-xl" onClick={finish}> Başla <ArrowRight size={20} />
          </button>
          <p className="muted">Kayıt gerekmez. İlerlemen bu tarayıcıda saklanır. Seviye ve hedefini İlerlemem bölümünden değiştirebilirsin.</p>
        </div>
      </div>
    </div>
  );
}
