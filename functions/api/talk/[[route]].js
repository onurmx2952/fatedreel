const headers = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json = (data, status = 200) => new Response(JSON.stringify(data), {status,headers});
const encoder = new TextEncoder();
const encode = (value) => btoa(String.fromCharCode(...value)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const encodedJson = (value) => encode(encoder.encode(JSON.stringify(value)));
async function equal(a, b) {
  const [x,y] = await Promise.all([a,b].map(v => crypto.subtle.digest('SHA-256',encoder.encode(v))));
  let diff = 0; const right = new Uint8Array(y); new Uint8Array(x).forEach((v,i) => {diff |= v ^ right[i];}); return diff === 0;
}
export async function onRequest({request,env}) {
  const url = new URL(request.url);
  const route = url.pathname.replace(/\/$/,'');
  const configured = Boolean(env.LIVEKIT_URL && env.LIVEKIT_API_KEY && env.LIVEKIT_API_SECRET && env.TALK_ACCESS_CODE);
  if (route === '/api/talk/config' && request.method === 'GET') return json({configured,requiresAccessCode:true});
  if (route !== '/api/talk/session') return json({error:'Bulunamadı.'},404);
  if (request.method !== 'POST') return json({error:'POST gerekli.'},405);
  if (request.headers.get('Origin') !== url.origin) return json({error:'İstek kaynağı geçersiz.'},403);
  if (!configured) return json({error:'Sesli öğretmen bağlantısı henüz yapılandırılmadı.'},503);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({error:'JSON gerekli.'},415);
  if (Number(request.headers.get('Content-Length') || 0) > 2048) return json({error:'İstek çok büyük.'},413);
  let body;
  try { const text = await request.text(); if (text.length > 2048) return json({error:'İstek çok büyük.'},413); body = JSON.parse(text); } catch { return json({error:'Geçersiz istek.'},400); }
  if (!body || typeof body.accessCode !== 'string' || body.accessCode.length > 256 || !await equal(body.accessCode,env.TALK_ACCESS_CODE)) return json({error:'Erişim kodu doğru değil.'},401);
  try {
    const server = new URL(env.LIVEKIT_URL);
    if (server.protocol !== 'wss:') throw new Error('Invalid LiveKit URL');
    const now = Math.floor(Date.now()/1000);
    const room = `talk-${crypto.randomUUID()}`;
    const claims = {iss:env.LIVEKIT_API_KEY,sub:`learner-${crypto.randomUUID()}`,nbf:now-5,exp:now+300,name:'Öğrenci',
      video:{roomJoin:true,room,canPublish:true,canSubscribe:true,canPublishData:true,canPublishSources:['microphone']},
      roomConfig:{maxParticipants:2,emptyTimeout:60,departureTimeout:20,agents:[{agentName:'fatedreel-talk'}]}};
    const unsigned = `${encodedJson({alg:'HS256',typ:'JWT'})}.${encodedJson(claims)}`;
    const key = await crypto.subtle.importKey('raw',encoder.encode(env.LIVEKIT_API_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
    const signature = await crypto.subtle.sign('HMAC',key,encoder.encode(unsigned));
    return json({url:server.toString(),token:`${unsigned}.${encode(new Uint8Array(signature))}`});
  } catch { return json({error:'Sesli bağlantı hazırlanamadı.'},503); }
}
