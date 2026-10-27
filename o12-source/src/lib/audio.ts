import { store } from "../store/store";
import { duck } from "./sound";

const caroClips: Record<string,string> = {};
fetch(`${import.meta.env.BASE_URL}caro/index.json`).then(r=>r.ok?r.json():null).then(data=>{if(data?.clips)Object.assign(caroClips,data.clips);}).catch(()=>{});
const speechKey = (text:string) => text.toLowerCase().trim().replace(/[.!?]+$/, "").split(/\s+/).join(" ");
let current: HTMLAudioElement | null = null;
let token = 0;

export function stopAudio() {
  token++;
  current?.pause();
  current = null;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

/** Play a recording, falling back to the device voice. Resolves when playback ends. */
export async function play(url: string | null | undefined, text: string, accent: "uk" | "us" = "uk", rate = 1) {
  if(store.get().settings.voice === "caro") url = caroClips[speechKey(text)] || url;
  duck(true);
  try {
    return await speak(url, text, accent, rate);
  } finally {
    duck(false);
  }
}

async function speak(url: string | null | undefined, text: string, accent: "uk" | "us", rate: number) {
  stopAudio();
  const mine = ++token;
  if (url) {
    const a = new Audio(url);
    a.playbackRate = rate;
    current = a;
    try {
      const ended = new Promise<void>((resolve) => {
        a.onended = () => resolve();
        a.onpause = () => resolve();
        a.onerror = () => resolve();
      });
      await a.play();
      await ended;
      if (mine !== token) return "stopped" as const;
      if (a.error) throw a.error;
      return "recorded" as const;
    } catch {
      if (mine !== token) return "stopped" as const;
      current = null;
    }
  }
  if (!("speechSynthesis" in window)) return "unsupported" as const;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = accent === "uk" ? "en-GB" : "en-US";
  u.rate = rate * 0.95;
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.replace("_", "-") === u.lang);
  const best = voices.find((v) => /premium|enhanced|natural|google/i.test(v.name)) || voices[0];
  if (best) u.voice = best;
  await new Promise<void>((r) => {
    u.onend = () => r();
    u.onerror = () => r();
    speechSynthesis.speak(u);
  });
  return "device" as const;
}
