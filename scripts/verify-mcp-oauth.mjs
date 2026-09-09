import http from 'node:http';
import crypto from 'node:crypto';
const origin='https://setupvencedor.com.br';
const verifier=crypto.randomBytes(32).toString('base64url');
const challenge=crypto.createHash('sha256').update(verifier).digest('base64url');
const state=crypto.randomBytes(24).toString('base64url');
let clientId,redirectUri;
const server=http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://127.0.0.1');
    if(url.pathname!='/callback' || url.searchParams.get('state')!==state){res.writeHead(400).end('Invalid callback');return;}
    const response=await fetch(origin+'/api/oauth/token',{method:'POST',body:new URLSearchParams({grant_type:'authorization_code',code:url.searchParams.get('code'),client_id:clientId,redirect_uri:redirectUri,code_verifier:verifier})});
    const auth=await response.json();
    if(!response.ok||!auth.access_token)throw new Error(`Token exchange failed: ${response.status}`);
    const firstRefreshToken=auth.refresh_token;
    if(!firstRefreshToken)throw new Error('Missing refresh token');
    const refreshResponse=await fetch(origin+'/api/oauth/token',{method:'POST',body:new URLSearchParams({grant_type:'refresh_token',refresh_token:firstRefreshToken,client_id:clientId,resource:origin+'/api/mcp'})});
    const refreshed=await refreshResponse.json();
    if(!refreshResponse.ok||!refreshed.access_token||refreshed.refresh_token===firstRefreshToken)throw new Error('Refresh rotation failed');
    auth.access_token=refreshed.access_token;
    const rpc=async(id,method,params)=>{
      const r=await fetch(origin+'/api/mcp',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+auth.access_token},body:JSON.stringify({jsonrpc:'2.0',...(id===null?{}:{id}),method,...(params?{params}:{})})});
      return r.status===202?{status:202}:r.json();
    };
    const init=await rpc(1,'initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'setup-smoke-test',version:'1.0'}});
    const notification=await rpc(null,'notifications/initialized');
    const listing=await rpc(2,'tools/list');
    const search=await rpc(3,'tools/call',{name:'search_resources',arguments:{query:'design'}});
    const resources=search.result?.content?.[0]?.text?JSON.parse(search.result.content[0].text):[];
    const replay=await fetch(origin+'/api/oauth/token',{method:'POST',body:new URLSearchParams({grant_type:'refresh_token',refresh_token:firstRefreshToken,client_id:clientId})});
    const afterReplay=await fetch(origin+'/api/mcp',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+auth.access_token},body:JSON.stringify({jsonrpc:'2.0',id:4,method:'tools/list'})});
    if(replay.status!==400||afterReplay.status!==401)throw new Error('Replay revocation failed');
    console.log(JSON.stringify({authenticated:true,refreshRotated:true,replayRejected:replay.status,revokedSessionRejected:afterReplay.status,expires_in:auth.expires_in,server:init.result?.serverInfo,notification,tools:listing.result?.tools?.map(t=>t.name),resources:resources.map(r=>({slug:r.slug,title:r.title})),error:search.error??null}));
    res.writeHead(200,{'content-type':'text/plain; charset=utf-8'}).end('Setup Agent conectado. Leitura do acervo verificada.');
    server.close();
  }catch(e){console.error(e.message);res.writeHead(500).end('Verification failed');server.close();process.exitCode=1;}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
redirectUri=`http://127.0.0.1:${server.address().port}/callback`;
const registration=await fetch(origin+'/api/oauth/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({client_name:'Setup Vencedor verification',redirect_uris:[redirectUri]})});
const client=await registration.json();
if(!registration.ok||!client.client_id)throw new Error('Registration failed');
clientId=client.client_id;
console.log(origin+'/api/oauth/authorize?'+new URLSearchParams({response_type:'code',client_id:clientId,redirect_uri:redirectUri,state,code_challenge:challenge,code_challenge_method:'S256',resource:origin+'/api/mcp'}));
setTimeout(()=>{server.close();},300_000).unref();
