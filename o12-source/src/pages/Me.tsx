import { Download, RotateCcw, Upload } from "lucide-react";
import { useMemo, useRef } from "react";
import { useAtlas } from "../atlas/context";
import { isMastered } from "../store/srs";
import { dayKey, exportBackup, importBackup, resetProgress, store, useStore, type Settings } from "../store/store";
import { toast } from "../ui/Toast";
import { streakOf } from "./Today";

export function Me({ privateAvailable }: { privateAvailable: boolean }) {
  const atlas = useAtlas();
  const progress = useStore((s) => s.progress);
  const settings = useStore((s) => s.settings);
  const saveError = useStore((s) => s.saveError);
  const file = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const cards = Object.values(progress.cards);
    const days = Object.values(progress.days);
    const r = days.reduce((n, d) => n + d.r, 0);
    const c = days.reduce((n, d) => n + d.c, 0);
    const t = days.reduce((n, d) => n + d.t, 0);
    const now = Date.now();
    const forecast = Array.from({ length: 7 }, (_, i) => {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      end.setDate(end.getDate() + i);
      const start = new Date(end);
      start.setHours(0, 0, 0, 0);
      return cards.filter((x) => (i === 0 ? x.due <= end.getTime() : x.due >= start.getTime() && x.due <= end.getTime())).length;
    });
    void now;
    return { learned: cards.length, mastered: cards.filter(isMastered).length, reviews: r, accuracy: r ? Math.round((c / r) * 100) : 0, minutes: Math.round(t / 60), forecast };
  }, [progress]);

  const set = (patch: Partial<Settings>) => store.settings(patch);
  const download = () => {
    const blob = new Blob([exportBackup()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `word-atlas-backup-${dayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const restore = async (f: File) => {
    if (f.size > 30 * 1024 * 1024) return toast("Dosya, öğrenme yedeği olarak kullanılamayacak kadar büyük.", "warn");
    const r = importBackup(await f.text());
    toast(r.ok ? `Geri yüklendi ${r.cards} kelime hafızası` : r.error, r.ok ? "ok" : "warn");
  };
  const maxF = Math.max(1, ...stats.forecast);

  return (
    <div className="page me">
      <header className="page-head">
        <p className="eyebrow">İlerlemem</p>
        <h1 className="display">Senin kelime yolculuğun</h1>
      </header>

      <section className="stat-strip">
        <div>
          <dt>Öğrenme serisi</dt>
          <dd>
            {streakOf(progress.days)}
            <small>gün</small>
          </dd>
        </div>
        <div>
          <dt>Öğrenilen kelime</dt>
          <dd>{stats.learned.toLocaleString("tr-TR")}</dd>
        </div>
        <div>
          <dt>uzun süreli hafıza</dt>
          <dd>{stats.mastered.toLocaleString("tr-TR")}</dd>
        </div>
        <div>
          <dt>İlk yanıt doğruluğu</dt>
          <dd>
            {stats.accuracy}
            <small>%</small>
          </dd>
        </div>
        <div>
          <dt>Çalışma süresi</dt>
          <dd>
            {stats.minutes}
            <small>dakika</small>
          </dd>
        </div>
      </section>

      <div className="me-grid">
        <section className="panel">
          <h3 className="eyebrow">son 20 hafta</h3>
          <Heatmap days={progress.days} />
          <p className="muted">Bir ızgara bir günü temsil eder ve renk ne kadar koyu olursa o gün o kadar çok yanıt alırsınız. "Uzun süreli hafıza", 21 günü aşan hafıza stabilitesini ifade eder.</p>
        </section>

        <section className="panel">
          <h3 className="eyebrow">Önümüzdeki 7 günün tekrarları</h3>
          <ol className="forecast">
            {stats.forecast.map((n, i) => (
              <li key={i}>
                <span style={{ height: `${(n / maxF) * 100}%` }} />
                <b>{n}</b>
                <small>{i === 0 ? "Bugün" : i === 1 ? "Yarın" : `+${i}`}</small>
              </li>
            ))}
          </ol>
        </section>

        <section className="panel settings">
          <h3 className="eyebrow">Öğrenme ayarları</h3>
          <Field label="Günlük yeni kelime" hint="Tekrar sayısı sınırlanmaz; algoritma unutmaya yaklaştığın kelimeleri seçer.">
            <div className="segmented">
              {[5, 10, 15, 20, 30].map((n) => (
                <button key={n} className={settings.dailyNew === n ? "is-on" : ""} onClick={() => set({ dailyNew: n })}>
                  {n}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Başlangıç seviyesi" hint="Zaten tanıdık olan düşük seviyeli kelimeleri atlayın.">
            <div className="segmented">
              {atlas.cefr.map((l, i) => (
                <button key={l} className={settings.startLevel === i ? "is-on" : ""} onClick={() => set({ startLevel: i })}>
                  {l}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Hedef hatırlama oranı" hint="Yüksek oran daha sık tekrar gerektirir. Çoğu kişi için %90 uygundur.">
            <div className="segmented">
              {[0.85, 0.9, 0.95].map((n) => (
                <button key={n} className={settings.retention === n ? "is-on" : ""} onClick={() => set({ retention: n })}>
                  {Math.round(n * 100)}%
                </button>
              ))}
            </div>
          </Field>
          <Field label="Okuma sesi" hint="O11’deki Caro Davy: A1/A2’nin ilk 60 kelimesi ve ilk örnekleri hazır. Diğerlerinde seçili İngiliz/Amerikan kaydı kullanılır.">
            <div className="segmented"><button className={settings.voice === "caro" ? "is-on" : ""} onClick={()=>set({voice:"caro"})}>O11 · Caro Davy</button><button className={settings.voice === "original" ? "is-on" : ""} onClick={()=>set({voice:"original"})}>Orijinal kayıtlar</button></div>
          </Field>
          <Field label="Orijinal kayıt aksanı">
            <div className="segmented">
              <button className={settings.accent === "uk" ? "is-on" : ""} onClick={() => set({ accent: "uk" })}> İngiliz </button>
              <button className={settings.accent === "us" ? "is-on" : ""} onClick={() => set({ accent: "us" })}> Amerikan </button>
            </div>
          </Field>
          <Field label="Görünüm">
            <div className="segmented">
              {(
                [
                  ["system", "Sistem"],
                  ["light", "Açık"],
                  ["dark", "Koyu"],
                ] as const
              ).map(([k, l]) => (
                <button key={k} className={settings.theme === k ? "is-on" : ""} onClick={() => set({ theme: k })}>
                  {l}
                </button>
              ))}
            </div>
          </Field>
          <Toggle label="Telaffuzu otomatik çal" on={settings.autoplay} set={(v) => set({ autoplay: v })} />
          <Toggle label="Arayüz ses efektleri" on={settings.sfx} set={(v) => set({ sfx: v })} />
          <Toggle label="Açılış animasyonu (günde bir kez)" on={settings.splash} set={(v) => set({ splash: v })} />
          <Toggle label="Tekrarlara yazım soruları ekle" on={settings.spell} set={(v) => set({ spell: v })} />
          {privateAvailable && (
            <Field label="kelime bilgisi" hint="Özel eş anlamlılar sözlüğü yalnızca yerel geliştirme sunucusunda mevcuttur ve paketlenip dağıtılmayacaktır.">
              <div className="segmented">
                <button className={settings.dataset === "open" ? "is-on" : ""} onClick={() => set({ dataset: "open" })}> Resimli kitabı aç </button>
                <button className={settings.dataset === "private" ? "is-on" : ""} onClick={() => set({ dataset: "private" })}> Özel 8000 </button>
              </div>
            </Field>
          )}
        </section>

        <section className="panel">
          <h3 className="eyebrow">Veriler</h3>
          <p className="muted">İlerleme yalnızca bu cihazın tarayıcısında mevcuttur: hesap yok, sunucu yok. Cihazları değiştirirken, yedeği dışa aktarın ve ardından içe aktarın.</p>
          {saveError && <p className="warn-text">Tarayıcı kaydetmeyi reddetti (muhtemelen özel mod veya tam alan). Lütfen yedeği mümkün olan en kısa sürede dışa aktarın.</p>}
          <div className="data-actions">
            <button className="btn btn-ghost" onClick={download}>
              <Download size={18} /> Yedeği dışa aktar </button>
            <button className="btn btn-ghost" onClick={() => file.current?.click()}>
              <Upload size={18} /> Yedeği içe aktar </button>
            <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && restore(e.target.files[0]).finally(() => (e.target.value = ""))} />
            <button
              className="btn btn-ghost btn-danger"
              onClick={() => {
                if (confirm("Bu kelime dağarcığına ilişkin tüm öğrenme kayıtlarını temizlemek istediğinizden emin misiniz? Bu işlem geri alınamaz. Önce yedeğin dışa aktarılması önerilir.")) {
                  resetProgress();
                  toast("Araştırma kayıtları temizlendi");
                }
              }}
            >
              <RotateCcw size={18} /> İlerlemeyi sıfırla </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <div>
        <b>{label}</b>
        {hint && <small>{hint}</small>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, on, set }: { label: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <label className="field toggle">
      <b>{label}</b>
      <input type="checkbox" role="switch" checked={on} onChange={(e) => set(e.target.checked)} />
      <span className="switch" aria-hidden="true" />
    </label>
  );
}

function Heatmap({ days }: { days: Record<string, { r: number }> }) {
  const weeks = 20;
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (weeks * 7 - 1) - end.getDay());
  const cells: { k: string; v: number; future: boolean }[] = [];
  const d = new Date(start);
  for (let i = 0; i < (weeks + 1) * 7; i++) {
    const k = dayKey(d);
    cells.push({ k, v: days[k]?.r ?? 0, future: d > end });
    d.setDate(d.getDate() + 1);
  }
  const lvl = (v: number) => (v === 0 ? 0 : v < 10 ? 1 : v < 25 ? 2 : v < 50 ? 3 : 4);
  return (
    <div className="heatmap" role="img" aria-label="Isı haritasını öğrenme">
      {cells.map((c) => (
        <span key={c.k} className={`h${c.future ? "x" : lvl(c.v)}`} title={`${c.k} · ${c.v} soru`} />
      ))}
    </div>
  );
}
