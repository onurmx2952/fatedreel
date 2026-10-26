import { ArrowUpRight, Database, Github, Heart } from "lucide-react";
import { useAtlas } from "../atlas/context";
import { REPO_URL } from "../config";
const BASE = import.meta.env.BASE_URL;
export function About() {
  const atlas = useAtlas();
  return <div className="page about">
    <header className="about-hero">
      <img src={`${BASE}brand/og.webp`} alt="" />
      <div>
        <p className="eyebrow">Kelime Atlası · Türkçe</p>
        <h1 className="display">Her kelimeyle yeni bir dünya keşfet.</h1>
        <p className="lede">{atlas.count.toLocaleString("tr-TR")} İngilizce kelime; Türkçe anlamlar, iki örnek cümle, resimler ve İngiliz / Amerikan telaffuzlarıyla bir arada. A1’den C2’ye ilerle, öğrendiğin her kelimeyle yıldız haritanı aydınlat.</p>
        <p className="lede">Ücretsiz, açık kaynak ve kayıt gerektirmez. İlerlemen bu tarayıcıda saklanır; İlerlemem bölümünden yedekleyebilirsin.</p>
        <div className="about-actions">
          <a className="btn btn-primary" href={REPO_URL} target="_blank" rel="noreferrer"><Github size={18} /> Özgün proje</a>
          <a className="btn btn-ghost" href={`${BASE}word-atlas.tr.json`} download><Database size={18} /> Türkçe kelime verisini indir</a>
        </div>
      </div>
    </header>
    <div className="about-grid">
      <section className="panel">
        <h3 className="eyebrow">Nasıl öğrenirsin?</h3>
        <ul className="feature-list">
          <li><b>Önce gör.</b> Resim, anlam ve örnek cümleyle kelimeyi tanı.</li>
          <li><b>Sonra hatırla.</b> Anlam seçme, cümle tamamlama, dinleme ve yazım sorularıyla pratik yap.</li>
          <li><b>Zamanında tekrarla.</b> FSRS algoritması tekrarları hatırlama durumuna göre planlar.</li>
          <li><b>İlerlemeni takip et.</b> Doğruluk oranı ilk yanıtı esas alır. Yanlışların yeniden sorulur.</li>
        </ul>
      </section>
      <section className="panel">
        <h3 className="eyebrow">Kısayollar</h3>
        <dl className="keys">
          <div><dt><kbd>Ctrl / ⌘</kbd> <kbd>K</kbd> veya <kbd>/</kbd></dt><dd>Kelime ara</dd></div>
          <div><dt><kbd>1</kbd>–<kbd>4</kbd></dt><dd>Yanıt seç</dd></div>
          <div><dt><kbd>Enter</kbd></dt><dd>Kontrol et / devam et</dd></div>
          <div><dt><kbd>←</kbd> <kbd>→</kbd></dt><dd>Önceki / sonraki kelime</dd></div>
          <div><dt><kbd>Esc</kbd></dt><dd>Pencereyi kapat</dd></div>
        </dl>
      </section>
      <section className="panel">
        <h3 className="eyebrow">Türkçe uyarlama ve çeviri</h3>
        <p className="muted">Türkçe anlamlar ve örnek cümle çevirileri otomatik hazırlanmıştır; tüm cümleler tek tek editoryal incelemeden geçmemiştir. Deyim ve çok anlamlı kullanım hataları için incelenmiş düzeltmeler uygulanmıştır. İpucu bölümünde yalnızca doğrudan denetlenmiş notlar gösterilir. İngilizce tanımlar ve cümleler karşılaştırma için korunmuştur.</p>
        <p className="muted">Arayüz Türkçeleştirildi; Türkçe arama, tarih ve süre gösterimleri eklendi. Ses kayıtları İngilizcedir ve kaynak deponun sabit sürümünden yüklenir; ses için internet gerekir. Kayıt oynatılamazsa tarayıcının İngilizce seslendirmesi kullanılır.</p>
      </section>
      <section className="panel">
        <h3 className="eyebrow">Kaynak ve lisans</h3>
        <p className="muted">Word Atlas contributors — <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Kelime verileri, resimler ve İngilizce kayıtlar özgün Word Atlas projesinden alınmıştır. Türkçe çeviriler ve yerelleştirme eklenmiştir. Uygulama kodu MIT lisanslıdır.</p>
        <p className="muted">Özgün içerikler de yapay zekâyla üretilmiş ve otomatik kontrol edilmiştir. Bu uygulama resmî bir IELTS kelime listesi değildir.</p>
        <a className="link" href={`${BASE}CONTENT_LICENSE.md`} target="_blank" rel="noreferrer">İçerik lisansı <ArrowUpRight size={14} /></a>{" · "}
        <a className="link" href={`${BASE}LICENSE`} target="_blank" rel="noreferrer">MIT lisansı</a>
      </section>
    </div>
    <p className="colophon"><Heart size={14} /> İngilizce öğrenen herkes için.</p>
  </div>;
}
