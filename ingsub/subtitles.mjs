export function parseSubtitles(input) {
  const blocks=input.replace(/^\uFEFF/,'').replace(/\r/g,'').trim().split(/\n\s*\n/);
  const cues=[];
  const timestamp='(?:(\\d{1,3}):)?(\\d{2}):(\\d{2})[.,](\\d{3})';
  const timing=new RegExp('^'+timestamp+'\\s*-->\\s*'+timestamp+'(?:\\s.*)?$');
  const seconds=(m,i)=>(Number(m[i]||0)*3600+Number(m[i+1])*60+Number(m[i+2])+Number(m[i+3])/1000);
  for(const block of blocks){
    const lines=block.split('\n');
    if(/^(NOTE(?:\s|$)|STYLE$|REGION$)/.test(lines[0]))continue;
    const index=lines.findIndex(line=>timing.test(line.trim()));
    if(index<0)continue;
    const m=lines[index].trim().match(timing),start=seconds(m,1),end=seconds(m,5);
    const text=lines.slice(index+1).join('\n').replace(/<[^>]*>/g,'').replace(/\{\\[^}]*\}/g,'').replace(/&(amp|lt|gt|quot|apos|nbsp);/g,(_,v)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '}[v])).trim();
    if(text&&end>start&&Number(m[3])<60&&Number(m[7])<60)cues.push({start,end,text});
  }
  return cues.sort((a,b)=>a.start-b.start);
}
export function cueIndex(cues,time,offset=0){let lo=0,hi=cues.length-1,result=-1;while(lo<=hi){const mid=(lo+hi)>>1;if(cues[mid].start+offset<=time){result=mid;lo=mid+1}else hi=mid-1}return result;}
export function activeCue(cues,time,offset=0){const i=cueIndex(cues,time,offset);return i>=0&&time<cues[i].end+offset?cues[i]:null;}
export function youtubeId(value){try{const u=new URL(value);const host=u.hostname.toLowerCase().replace(/^www\./,'');let id=null;if(host==='youtu.be')id=u.pathname.slice(1).split('/')[0];else if(['youtube.com','m.youtube.com','youtube-nocookie.com'].includes(host))id=u.searchParams.get('v')||u.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1];return /^[\w-]{11}$/.test(id||'')?id:null}catch{return null}}
export function formatTime(t){t=Math.max(0,Math.floor(t));return(t>=3600?Math.floor(t/3600)+':':'')+String(Math.floor(t/60)%60).padStart(2,'0')+':'+String(t%60).padStart(2,'0');}
