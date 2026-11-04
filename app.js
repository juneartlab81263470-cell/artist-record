(() => {
'use strict';
/* =========================================================
   작가 활동기록 — 설치형 웹앱
   - config.js에 Supabase 정보가 있으면: 로그인 + 기기 간 동기화
   - 없으면: 이 기기에만 저장하는 체험 모드
   ========================================================= */

const TYPES = {
  work:{label:'작품', fields:[
    {k:'title',l:'국문 제목',req:1},{k:'titleHan',l:'한문 제목',ph:'歡喜',half:1},{k:'titleEn',l:'영문 제목',ph:'Exultation',half:1},
    {k:'code',l:'관리번호',ph:'2001',half:1},{k:'year',l:'제작연도',t:'number',ph:'2025',half:1},
    {k:'size',l:'크기',ph:'60×90cm',half:1},{k:'edition',l:'에디션',ph:'ED.1, 3/20, A.P.',half:1},
    {k:'medium',l:'기법·재료',ph:'Woodcut (Reduction Method) · 소멸기법'},{k:'base',l:'바탕 재료',ph:'한지, 은행나무 판 등'},
    {k:'subject',l:'작품에 보이는 소재',ph:'모란'},
    {k:'statement',l:'작업 의도 · 나의 이야기',t:'area'},
    {k:'desc',l:'포트폴리오에 넣을 작품 설명',t:'area',ph:'포트폴리오 작품 쪽에 그대로 들어가요'},
    {k:'descEn',l:'작품 설명 · 영문',t:'area'},
    {k:'phrase',l:'문구',grp:'calli',t:'area'},{k:'source',l:'출처',grp:'calli',ph:'시인, 경전, 자작 등'},{k:'script',l:'서체',grp:'calli',ph:'궁체 흘림, 자유체 등'},
    {k:'plate',l:'판종',grp:'print',ph:'목판, 고무판, 동판',half:1},{k:'colors',l:'판 수 · 색 수',grp:'print',ph:'1판 5색',half:1},
    {k:'method',l:'찍는 방식 · 기법 상세',grp:'print',ph:'소멸기법, 다색 판화, 바렌 인쇄 등'},
    {k:'note',l:'메모',t:'area'}],
    slots:[{k:'main',l:'작품 사진',multi:1}]},
  exhibition:{label:'전시', fields:[
    {k:'title',l:'전시명',req:1},{k:'kind',l:'구분',t:'select',opts:['개인전','단체전','초대전','아트페어','공모전']},
    {k:'venue',l:'장소'},{k:'start',l:'시작일',t:'date',half:1},{k:'end',l:'종료일',t:'date',half:1},
    {k:'host',l:'주최·주관'},{k:'note',l:'메모',t:'area'}],
    slots:[{k:'main',l:'증빙 사진',hint:'포스터, 리플렛, 전시 전경',multi:1}]},
  award:{label:'수상', fields:[
    {k:'title',l:'대회·공모전명',req:1},{k:'prize',l:'상 이름',ph:'특선, 입선, 대상'},{k:'host',l:'주최'},{k:'workId',l:'수상 작품',t:'worksel'},
    {k:'date',l:'수상일',t:'date'},{k:'note',l:'메모',t:'area'}],
    slots:[{k:'main',l:'상장 사진',multi:1}]},
  catalog:{label:'도록', fields:[
    {k:'title',l:'도록명',req:1},{k:'exhibitionId',l:'연결할 전시',t:'exsel'},{k:'publisher',l:'발행처'},
    {k:'date',l:'발행일',t:'date',half:1},{k:'pages',l:'내 작품 수록 쪽',ph:'p.24–25',half:1},{k:'note',l:'메모',t:'area'}],
    slots:[{k:'cover',l:'표지'},{k:'colophon',l:'내지',hint:'판권면, 참여작가 명단 등'},{k:'mypage',l:'내 작품 페이지',multi:1}]},
  class:{label:'강의', fields:[
    {k:'title',l:'강의명',req:1},{k:'org',l:'기관'},{k:'start',l:'시작일',t:'date',half:1},{k:'end',l:'종료일',t:'date',half:1},
    {k:'sessions',l:'회차·시간',ph:'8회, 회당 2시간'},{k:'note',l:'메모',t:'area'}],
    slots:[{k:'main',l:'수업 사진',multi:1}]}
};
const TYPE_ORDER=['work','exhibition','award','catalog','class'];
const PRESETS = {
  artproof:{label:'예술활동증명용',desc:'최근 5년 전시·도록·수상과 증빙 사진',title:'예술활동증명 제출 자료',types:['exhibition','catalog','award'],years:5,photos:true},
  assoc:{label:'미술협회 제출용',desc:'개인전·단체전·수상 약력 목록',title:'작가 약력',types:['exhibition','award','class'],years:0,photos:false},
  portfolio:{label:'장르별 포트폴리오',desc:'표지, 약력, 한 쪽에 한 작품',title:'포트폴리오',types:['work','exhibition','award'],years:0,photos:true,oneGenre:true,layout:'book'},
  custom:{label:'직접 고르기',desc:'항목·기간·장르를 직접 선택',title:'활동 기록',types:['work','exhibition','award','catalog','class'],years:0,photos:true}
};
const PLANS={free:{l:'무료',n:10},friend:{l:'지인·협회 무료',n:100},basic:{l:'베이직',n:20},pro:{l:'프로',n:100}};
const DEFAULT_SETTINGS={name:'',genres:['회화','판화','서예','한국화','서양화','공예']};

/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>(crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16)}));
function dateOf(r){const f=r.f||{};return f.start||f.date||(f.year?f.year+'-01-01':'')||''}
function fmtDate(d){if(!d)return'';const [y,m,dd]=d.split('-');return dd&&m?`${y}. ${+m}. ${+dd}.`:m?`${y}. ${+m}.`:y}
function fmtRange(a,b){if(!a)return'';if(!b||a===b)return fmtDate(a);const [y1]=a.split('-'),[y2,m2,d2]=b.split('-');return fmtDate(a)+' – '+(y1===y2?`${+m2}. ${+d2}.`:fmtDate(b))}
function toast(m){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>t.hidden=true,2400)}
const sorted=a=>[...a].sort((x,y)=>dateOf(y).localeCompare(dateOf(x)));
function dataURLtoBlob(u){const [h,b]=u.split(',');const bin=atob(b);const a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:h.match(/:(.*?);/)[1]})}
function blobToDataURL(b){return new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;fr.readAsDataURL(b)})}
function shrink(file,max=1600){return new Promise((res,rej)=>{const fr=new FileReader();fr.onerror=rej;fr.onload=()=>{const im=new Image();im.onerror=rej;im.onload=()=>{
  const sc=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*sc);c.height=Math.round(im.height*sc);
  const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.85))};im.src=fr.result};fr.readAsDataURL(file)})}

/* =========================================================
   Stores — same interface for local and cloud
   record: {id,type,f,genres,photos:[{slot,src?|path?}],created,updated}
   ========================================================= */
function LocalStore(){
  let db=null;const mem={records:new Map(),meta:new Map()};
  const open=()=>new Promise(res=>{try{const r=indexedDB.open('artist-record',1);
    r.onupgradeneeded=()=>{const d=r.result;d.createObjectStore('records',{keyPath:'id'});d.createObjectStore('meta')};
    r.onsuccess=()=>{db=r.result;res()};r.onerror=()=>res();r.onblocked=()=>res()}catch(e){res()}});
  const tx=(store,mode,fn)=>new Promise(res=>{if(!db){res(null);return}
    try{const t=db.transaction(store,mode);const out=fn(t.objectStore(store));t.oncomplete=()=>res(out instanceof IDBRequest?out.result:out);t.onerror=()=>res(null)}catch(e){res(null)}});
  return {
    mode:'local', persistent:()=>!!db,
    async init(){await open()},
    async user(){return {email:null}},
    async list(){if(!db)return[...mem.records.values()];return (await tx('records','readonly',s=>s.getAll()))||[]},
    async save(r){r.photos=r.photos.map(({slot,src})=>({slot,src}));mem.records.set(r.id,r);if(db)await tx('records','readwrite',s=>s.put(r));return r},
    async remove(r){mem.records.delete(r.id);if(db)await tx('records','readwrite',s=>s.delete(r.id))},
    async getSettings(){return (db?await tx('meta','readonly',s=>s.get('settings')):mem.meta.get('settings'))||null},
    async setSettings(v){mem.meta.set('settings',v);if(db)await tx('meta','readwrite',s=>s.put(v,'settings'))},
    async photoURLs(){},  // local photos carry src
    url:p=>p.src,
    async photoData(p){return p.src},
    async signOut(){}
  };
}

function CloudStore(cfg){
  const sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
  const urls=new Map(); // path -> {url, exp}
  let me=null;
  const BUCKET='photos';
  function fail(error,msg){if(error){console.error(error);throw new Error(msg||error.message)}}
  return {
    mode:'cloud', sb, persistent:()=>true,
    async init(){const {data}=await sb.auth.getSession();me=data.session?.user||null},
    async user(){return me},
    async signIn(email,password){const {data,error}=await sb.auth.signInWithPassword({email,password});if(error)throw error;me=data.user;return me},
    async signUp(email,password){const {data,error}=await sb.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}});if(error)throw error;me=data.session?data.user:null;return data},
    async resetPassword(email){const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(error)throw error},
    async updatePassword(pw){const {error}=await sb.auth.updateUser({password:pw});if(error)throw error},
    async signOut(){await sb.auth.signOut();me=null},
    async list(){const {data,error}=await sb.from('records').select('id,type,f,genres,photos,created_at,updated_at');fail(error,'기록을 불러오지 못했어요');
      return data.map(d=>({id:d.id,type:d.type,f:d.f||{},genres:d.genres||[],photos:d.photos||[],created:d.created_at,updated:d.updated_at}))},
    async save(r,prev){
      // 새로 올린 사진(src)은 저장소에 올리고 경로(path)로 바꿉니다
      const photos=[];
      for(const p of r.photos){
        if(p.path){photos.push({slot:p.slot,path:p.path});continue}
        const path=`${me.id}/${r.id}/${uid()}.jpg`;
        const {error}=await sb.storage.from(BUCKET).upload(path,dataURLtoBlob(p.src),{contentType:'image/jpeg',upsert:false});
        fail(error,'사진을 올리지 못했어요. 인터넷 연결을 확인해 주세요');
        urls.set(path,{url:p.src,exp:Date.now()+3e6});photos.push({slot:p.slot,path});
      }
      const row={id:r.id,user_id:me.id,type:r.type,f:r.f,genres:r.genres,photos,updated_at:new Date().toISOString()};
      const {error}=await sb.from('records').upsert(row);fail(error,'저장하지 못했어요. 인터넷 연결을 확인해 주세요');
      // 뺀 사진은 저장소에서도 지웁니다
      const keep=new Set(photos.map(p=>p.path));const gone=(prev?.photos||[]).filter(p=>p.path&&!keep.has(p.path)).map(p=>p.path);
      if(gone.length)await sb.storage.from(BUCKET).remove(gone);
      return {...r,photos};
    },
    async remove(r){const {error}=await sb.from('records').delete().eq('id',r.id);fail(error,'지우지 못했어요');
      const paths=(r.photos||[]).filter(p=>p.path).map(p=>p.path);if(paths.length)await sb.storage.from(BUCKET).remove(paths)},
    async getSettings(){const {data}=await sb.from('settings').select('name,genres,profile').eq('user_id',me.id).maybeSingle();return data?{...(data.profile||{}),name:data.name||'',genres:data.genres?.length?data.genres:DEFAULT_SETTINGS.genres}:null},
    async setSettings(v){const {name,genres,...profile}=v;const {error}=await sb.from('settings').upsert({user_id:me.id,name,genres,profile});fail(error,'설정을 저장하지 못했어요')},
    async photoURLs(records){
      const need=[];const now=Date.now();
      for(const r of records)for(const p of r.photos||[])if(p.path){const u=urls.get(p.path);if(!u||u.exp<now)need.push(p.path)}
      for(let i=0;i<need.length;i+=100){const chunk=need.slice(i,i+100);
        const {data}=await sb.storage.from(BUCKET).createSignedUrls(chunk,3600);
        (data||[]).forEach(d=>{if(d.signedUrl)urls.set(d.path,{url:d.signedUrl,exp:now+3.3e6})})}
    },
    async touch(){await sb.rpc('touch_member')},
    async myPlan(){const {data,error}=await sb.rpc('my_plan');if(error)throw error;return Array.isArray(data)?data[0]:data},
    async adminMembers(){const {data,error}=await sb.rpc('admin_members');fail(error,'회원 목록을 불러오지 못했어요');return data},
    async updateMember(id,patch){const {error}=await sb.from('members').update(patch).eq('user_id',id);fail(error,'회원 정보를 저장하지 못했어요')},
    url:p=>p.src||urls.get(p.path)?.url||'',
    async photoData(p){if(p.src)return p.src;const {data}=await sb.storage.from(BUCKET).download(p.path);return data?blobToDataURL(data):''}
  };
}

/* ---------- state ---------- */
const cfg=window.APP_CONFIG||{};
const cloudReady=!!(cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY&&window.supabase);
const store=cloudReady?CloudStore(cfg):LocalStore();
const S={records:[],settings:{...DEFAULT_SETTINGS,genres:[...DEFAULT_SETTINGS.genres]},tab:'list',view:'list',plan:null,ftype:'all',fgenre:'all',user:null,
  out:{preset:'artproof',types:[],years:5,genres:[],photos:true,title:'',layout:'list',desc:'ko',order:[],skip:[]}};

function subline(r){const f=r.f||{};switch(r.type){
  case'work':return[f.code&&('#'+f.code),f.year,f.medium,f.size,f.edition].filter(Boolean).join(' · ');
  case'exhibition':return[f.kind,f.venue,fmtRange(f.start,f.end)].filter(Boolean).join(' · ');
  case'award':return[f.prize,f.host,fmtDate(f.date)].filter(Boolean).join(' · ');
  case'catalog':{const ex=S.records.find(x=>x.id===f.exhibitionId);return[ex&&('「'+ex.f.title+'」'),f.publisher,fmtDate(f.date)].filter(Boolean).join(' · ')}
  case'class':return[f.org,fmtRange(f.start,f.end),f.sessions].filter(Boolean).join(' · ')}}

/* ---------- navigation ---------- */
function setTab(t){if(t==='add'){openEditor(null);return}S.tab=t;
  document.querySelectorAll('.tabbar button').forEach(b=>b.setAttribute('aria-current',String(b.dataset.tab===t)));render();window.scrollTo(0,0)}
function render(){({list:viewList,out:viewOut,set:viewSet})[S.tab]()}

/* ---------- login (cloud mode) ---------- */
function viewLogin(mode='in',msg=''){
  $('.tabbar').hidden=true;
  const T={in:['로그인','기록을 보려면 로그인하세요.','로그인'],up:['가입하기','이메일과 비밀번호로 계정을 만들어요.','가입하기'],reset:['비밀번호 찾기','가입한 이메일로 재설정 링크를 보내요.','링크 보내기'],newpw:['새 비밀번호','새로 쓸 비밀번호를 정해 주세요.','저장']}[mode];
  $('#app').innerHTML=`<form class="login" id="lf" novalidate>
    <h1><span class="seal">記</span>작가 활동기록</h1>
    <h2>${T[0]}</h2><p class="lead">${T[1]}</p>
    ${mode!=='newpw'?`<div class="field"><label for="le">이메일</label><input id="le" type="email" autocomplete="email" required></div>`:''}
    ${mode!=='reset'?`<div class="field"><label for="lp">비밀번호${mode!=='in'?' (8자 이상)':''}</label><input id="lp" type="password" autocomplete="${mode==='in'?'current-password':'new-password'}" required></div>`:''}
    ${msg?`<p class="err" role="alert">${esc(msg)}</p>`:''}
    <button class="btn primary" id="lgo">${T[2]}</button>
    ${mode==='in'?`<button type="button" class="switch" data-m="up">처음이에요. 가입할게요</button><button type="button" class="switch" data-m="reset">비밀번호를 잊었어요</button>`:mode!=='newpw'?`<button type="button" class="switch" data-m="in">로그인 화면으로</button>`:''}
  </form>`;
  document.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>viewLogin(b.dataset.m));
  $('#lf').onsubmit=async e=>{e.preventDefault();const em=$('#le')?.value.trim(),pw=$('#lp')?.value||'';const go=$('#lgo');go.disabled=true;
    try{
      if(mode==='in'){await store.signIn(em,pw);await afterLogin()}
      else if(mode==='up'){if(pw.length<8)throw new Error('비밀번호를 8자 이상으로 정해 주세요');const d=await store.signUp(em,pw);
        if(d.session)await afterLogin();else viewLogin('in',`${em}로 확인 메일을 보냈어요. 메일의 링크를 누른 뒤 여기서 로그인하세요.`)}
      else if(mode==='reset'){await store.resetPassword(em);viewLogin('in','재설정 메일을 보냈어요. 메일의 링크를 누르면 새 비밀번호를 정할 수 있어요.')}
      else if(mode==='newpw'){if(pw.length<8)throw new Error('비밀번호를 8자 이상으로 정해 주세요');await store.updatePassword(pw);toast('비밀번호를 바꿨어요');await afterLogin()}
    }catch(err){go.disabled=false;const m=String(err.message||err);
      viewLogin(mode,/Invalid login/i.test(m)?'이메일 또는 비밀번호가 맞지 않아요':/not confirmed/i.test(m)?'메일함의 확인 링크를 먼저 눌러 주세요':/already registered/i.test(m)?'이미 가입된 이메일이에요. 로그인해 주세요':m)}};
}
async function afterLogin(){
  S.user=await store.user();$('#app').innerHTML='<div class="loading">기록을 불러오는 중…</div>';
  try{
    const st=await store.getSettings();if(st)S.settings=st;
    S.records=await store.list();await store.photoURLs(S.records);
  }catch(e){toast(e.message)}
  if(store.touch){try{await store.touch();S.plan=await store.myPlan()}catch(e){S.plan=null}}
  applyPreset('artproof');$('.tabbar').hidden=false;setTab('list');
}

/* ---------- list ---------- */
function viewList(){
  const R=S.records;
  const counts=TYPE_ORDER.map(t=>[t,R.filter(r=>r.type===t).length]);
  const L=R.filter(r=>(S.ftype==='all'||r.type===S.ftype)&&(S.fgenre==='all'||(r.genres||[]).includes(S.fgenre)));
  $('#app').innerHTML=`
  <div class="top"><div><h1><span class="seal">記</span>활동 기록</h1><div class="sub">${esc(S.settings.name||'작가')} · 한 번 기록하고 제출처마다 골라 출력</div></div></div>
  ${store.mode==='local'?`<div class="banner"><span><span class="syncdot local"></span>체험 모드예요. 기록이 이 기기에만 저장돼요.</span></div>`:''}
  <div class="stats">${counts.map(([t,n])=>`<button class="stat" data-ft="${t}" aria-pressed="${S.ftype===t}"><b>${n}</b><span>${TYPES[t].label}</span></button>`).join('')}</div>
  ${yearLine()}
  <div class="chips" role="group" aria-label="종류">${['all',...TYPE_ORDER].map(t=>`<button class="chip" data-ft="${t}" aria-pressed="${S.ftype===t}">${t==='all'?'전체':TYPES[t].label}</button>`).join('')}</div>
  <div class="chips" role="group" aria-label="장르">${['all',...S.settings.genres].map(g=>`<button class="chip" data-fg="${esc(g)}" aria-pressed="${S.fgenre===g}">${g==='all'?'모든 장르':esc(g)}</button>`).join('')}</div>
  <div class="viewtog">${[['list','목록'],['grid','사진 보기'],['table','표 보기']].map(([k,l])=>`<button class="chip" data-vw="${k}" aria-pressed="${S.view===k}">${l}</button>`).join('')}<span class="note" style="margin-left:auto;align-self:center">${L.length}건</span></div>
  <div class="${S.view==='grid'?'pgrid':S.view==='table'?'':'list'}">${L.length?(S.view==='table'?tableHTML(sorted(L)):sorted(L).map(S.view==='grid'?pcard:card).join('')):R.length?`<div class="empty">이 조건에 맞는 기록이 없어요.</div>`:`<div class="empty">아직 기록이 없어요.<br>아래 <b>+ 추가</b>로 첫 기록을 남겨 보세요.<br><br>작품, 전시, 수상, 도록, 강의를 기록해 두면<br>출력 탭에서 제출처별 문서로 골라 뽑을 수 있어요.</div>`}</div>`;
  document.querySelectorAll('[data-ft]').forEach(b=>b.onclick=()=>{S.ftype=(b.classList.contains('stat')&&S.ftype===b.dataset.ft)?'all':b.dataset.ft;render()});
  document.querySelectorAll('[data-fg]').forEach(b=>b.onclick=()=>{S.fgenre=b.dataset.fg;render()});
  document.querySelectorAll('[data-vw]').forEach(b=>b.onclick=()=>{S.view=b.dataset.vw;render()});
  document.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>openDetail(S.records.find(r=>r.id===b.dataset.id)));
}
function yearLine(){const y=String(new Date().getFullYear());const R=S.records.filter(r=>dateOf(r).startsWith(y));if(!S.records.length)return'';
  const n=t=>R.filter(r=>r.type===t).length;const parts=[['exhibition','전시','회'],['award','수상','건'],['work','새 작품','점'],['class','강의','건']].filter(([t])=>n(t)).map(([t,l,u])=>`${l} ${n(t)}${u}`);
  return `<p class="yearline">${y}년 ${parts.length?parts.join(' · '):'아직 기록이 없어요'}</p>`}
function tableHTML(L){const onlyWork=L.every(r=>r.type==='work');
  const th=onlyWork?['순번','관리번호','사진','작품명','장르','제작연도','크기','기법·재료','에디션','수상·비고']:['','사진','종류','제목','날짜','내용'];
  const LL=onlyWork?[...L].sort((a,b)=>(a.f.year||'').localeCompare(b.f.year||'')||(a.f.code||'').localeCompare(b.f.code||'')):L;L=LL;
  return `<div class="tblwrap">${onlyWork?`<div class="tbltitle">${esc(S.settings.name||'')} 작품 전체 목록</div>`:''}<table class="tbl"><thead><tr>${th.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${L.map((r,i)=>{const p=(r.photos||[])[0];const u=p&&store.url(p);const f=r.f;
    const img=`<td>${u?`<img src="${esc(u)}" alt="" loading="lazy">`:''}</td>`;
    return onlyWork?`<tr data-id="${r.id}"><td class="n">${i+1}</td><td class="n">${esc(f.code||'')}</td>${img}<td><b>${esc(f.title)}</b>${(f.titleHan?`<small>${esc(f.titleHan)}</small>`:'')+(f.titleEn?`<small>${esc(f.titleEn)}</small>`:'')}</td><td>${esc((r.genres||[]).join(', '))}</td><td class="n">${esc(f.year||'')}</td><td>${esc(f.size||'')}</td><td>${esc(f.medium||'')}</td><td>${esc(f.edition||'')}</td><td>${esc([...awardsFor(r),f.note].filter(Boolean).join(', '))}</td></tr>`
      :`<tr data-id="${r.id}"><td class="n">${i+1}</td>${img}<td><span class="pill type">${TYPES[r.type].label}</span></td><td><b>${esc(f.title)}</b></td><td class="n">${esc(fmtDate(dateOf(r)))}</td><td>${esc(subline(r))}</td></tr>`}).join('')}</tbody></table></div>`}
function openDetail(r){if(!r)return;const sh=$('#sheet');const T=TYPES[r.type];
  const rows=T.fields.filter(fd=>r.f[fd.k]&&fd.k!=='title').map(fd=>{let v=r.f[fd.k];
    if(fd.t==='exsel'||fd.t==='worksel'){const x=S.records.find(y=>y.id===v);return x?`<div class="dr"><dt>${fd.l}</dt><dd><button class="linkbtn" data-go="${x.id}">${esc(x.f.title)}</button></dd></div>`:''}
    if(fd.t==='date')v=fmtDate(v);
    return `<div class="dr"><dt>${fd.l}</dt><dd>${esc(v)}</dd></div>`}).join('');
  const linked=S.records.filter(x=>x.f.exhibitionId===r.id||x.f.workId===r.id);
  sh.innerHTML=`<div class="head"><div class="in"><button class="btn" id="cancel">닫기</button><b>${T.label}</b><button class="btn primary" id="edit">수정</button></div></div>
  <div class="wrap detail"><h1>${esc(r.f.title||'(제목 없음)')}</h1>
    ${r.type==='work'&&workTitles(r.f)?`<p class="dsub2">${esc(workTitles(r.f))}</p>`:''}
    <div class="tags" style="margin:8px 0 14px"><span class="pill type">${T.label}</span>${(r.genres||[]).map(g=>`<span class="pill">${esc(g)}</span>`).join('')}</div>
    ${T.slots.map(sl=>{const ps=r.photos.filter(p=>p.slot===sl.k);return ps.length?`<div class="dph"><span class="flabel">${sl.l}</span>${ps.map(p=>`<img src="${esc(store.url(p))}" alt="${sl.l}">`).join('')}</div>`:''}).join('')}
    <dl class="dl">${rows||'<p class="note">적힌 정보가 없어요. 수정을 눌러 채워 보세요.</p>'}</dl>
    ${linked.length?`<h2 style="margin-top:18px">연결된 기록</h2><div class="list" style="margin-top:8px">${linked.map(card).join('')}</div>`:''}
  </div>`;
  sh.hidden=false;sh.scrollTop=0;document.body.style.overflow='hidden';
  const close=()=>{sh.hidden=true;sh.innerHTML='';document.body.style.overflow=''};
  sh.querySelector('#cancel').onclick=close;
  sh.querySelector('#edit').onclick=()=>openEditor(r);
  sh.querySelectorAll('[data-go],.detail .card').forEach(b=>b.onclick=()=>openDetail(S.records.find(x=>x.id===(b.dataset.go||b.dataset.id))));
}
function pcard(r){const p=(r.photos||[])[0];const u=p&&store.url(p);const T=TYPES[r.type];
  return `<button class="pcard" data-id="${r.id}"><span class="pimg">${u?`<img src="${esc(u)}" alt="" loading="lazy">`:T.label[0]}</span><span class="pm"><b>${esc(r.f.title||'(제목 없음)')}</b><span>${esc(r.type==='work'?workTitles(r.f)||workMeta(r.f):subline(r))}</span>${r.type==='work'&&workTitles(r.f)?`<span>${esc(workMeta(r.f))}</span>`:''}</span></button>`}
function card(r){const p=(r.photos||[])[0];const T=TYPES[r.type];const nPh=(r.photos||[]).length;const u=p&&store.url(p);
  return `<button class="card" data-id="${r.id}">${u?`<img class="thumb" src="${esc(u)}" alt="" loading="lazy">`:`<span class="thumb">${T.label[0]}</span>`}
  <span class="meta"><span class="t">${esc(r.f.title||'(제목 없음)')}</span><span class="d">${esc(subline(r))}</span>
  <span class="tags"><span class="pill type">${T.label}</span>${(r.genres||[]).map(g=>`<span class="pill">${esc(g)}</span>`).join('')}${nPh?`<span class="pill">사진 ${nPh}</span>`:''}</span></span></button>`}

/* ---------- editor ---------- */
function openEditor(rec){
  const isNew=!rec; const r=rec?JSON.parse(JSON.stringify(rec)):{id:uid(),type:S.ftype!=='all'?S.ftype:'work',f:{},genres:S.fgenre!=='all'?[S.fgenre]:[],photos:[],created:new Date().toISOString()};
  const sh=$('#sheet');let confirmDel=false,busy=false;
  function draw(){const T=TYPES[r.type];
    sh.innerHTML=`<div class="head"><div class="in"><button class="btn" id="cancel">닫기</button><b>${isNew?'새 기록':'기록 수정'}</b><button class="btn primary" id="save" ${busy?'disabled':''}>${busy?'저장 중…':'저장'}</button></div></div>
    <div class="wrap" style="padding-bottom:40px"><form class="form" id="ef" novalidate>
      ${isNew?`<div><span class="flabel">무엇을 기록할까요?</span><div class="typesel">${TYPE_ORDER.map(t=>`<button type="button" data-t="${t}" aria-pressed="${r.type===t}">${TYPES[t].label}</button>`).join('')}</div></div>`:''}
      ${fieldsHTML(T)}
      <div><span class="flabel">장르 (여러 개 선택 가능)</span><div class="checks">${S.settings.genres.map((g,i)=>`<label><input type="checkbox" id="g${i}" value="${esc(g)}" ${r.genres.includes(g)?'checked':''}>${esc(g)}</label>`).join('')}</div></div>
      ${T.slots.map(s=>slotHTML(s)).join('')}
      ${!isNew?`<div class="confirm">${confirmDel?`정말 지울까요? 되돌릴 수 없어요. <button type="button" class="btn small danger" id="delyes">지우기</button><button type="button" class="btn small" id="delno">취소</button>`:`<button type="button" class="btn small danger" id="del">이 기록 지우기</button>`}</div>`:''}
    </form></div>`;
    sh.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{collect();r.type=b.dataset.t;draw()});
    sh.querySelector('#cancel').onclick=close;
    sh.querySelector('#save').onclick=save;
    sh.querySelector('#ef').onsubmit=e=>{e.preventDefault();save()};
    sh.querySelectorAll('input[type=file]').forEach(inp=>inp.onchange=async()=>{collect();const slot=inp.dataset.slot;
      if(!inp.multiple)r.photos=r.photos.filter(p=>p.slot!==slot);
      for(const f of inp.files){try{r.photos.push({slot,src:await shrink(f)})}catch(e){toast('이미지를 읽지 못했어요: '+f.name)}}draw()});
    sh.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{collect();r.photos.splice(+b.dataset.rm,1);draw()});
    sh.querySelector('#del')?.addEventListener('click',()=>{collect();confirmDel=true;draw()});
    sh.querySelector('#delno')?.addEventListener('click',()=>{confirmDel=false;draw()});
    sh.querySelector('#delyes')?.addEventListener('click',async()=>{try{await store.remove(rec);S.records=S.records.filter(x=>x.id!==r.id);close();toast('기록을 지웠어요')}catch(e){toast(e.message)}});
  }
  function fieldsHTML(T){const main=T.fields.filter(f=>!f.grp);let h=fieldsList(main);
    const G={calli:'문구 · 출처 · 서체 기록 (서예·캘리그라피)',print:'판화 기법 기록'};
    for(const g of Object.keys(G)){const fs=T.fields.filter(f=>f.grp===g);if(!fs.length)continue;const open=fs.some(f=>r.f[f.k]);
      h+=`<details class="grp" ${open?'open':''}><summary>${G[g]} <small>(선택)</small></summary><div class="form">${fieldsList(fs)}</div></details>`}
    return h}
  function fieldsList(list){let h='',buf=[];const flush=()=>{if(buf.length){h+=`<div class="row2">${buf.join('')}</div>`;buf=[]}};
    for(const fd of list){const v=r.f[fd.k]??'';const id='f_'+fd.k;let inp;
      if(fd.t==='area')inp=`<textarea id="${id}" placeholder="${esc(fd.ph||'')}">${esc(v)}</textarea>`;
      else if(fd.t==='select')inp=`<select id="${id}">${fd.opts.map(o=>`<option ${v===o?'selected':''}>${o}</option>`).join('')}</select>`;
      else if(fd.t==='exsel'){const exs=sorted(S.records.filter(x=>x.type==='exhibition'));inp=`<select id="${id}"><option value="">연결 안 함</option>${exs.map(x=>`<option value="${x.id}" ${v===x.id?'selected':''}>${esc(x.f.title)} (${esc((x.f.start||'').slice(0,4))})</option>`).join('')}</select>`}
      else if(fd.t==='worksel'){const ws=[...S.records.filter(x=>x.type==='work')].sort((a,b)=>(a.f.title||'').localeCompare(b.f.title||''));inp=`<select id="${id}"><option value="">연결 안 함</option>${ws.map(x=>`<option value="${x.id}" ${v===x.id?'selected':''}>${esc(x.f.title)}${x.f.year?' ('+esc(x.f.year)+')':''}</option>`).join('')}</select>`}
      else inp=`<input id="${id}" type="${fd.t||'text'}" value="${esc(v)}" placeholder="${esc(fd.ph||'')}" ${fd.t==='number'?'inputmode="numeric"':''}>`;
      const el=`<div class="field"><label for="${id}">${fd.l}${fd.req?' *':''}</label>${inp}</div>`;
      if(fd.half)buf.push(el);else{flush();h+=el}}
    flush();return h}
  function slotHTML(s){const ph=r.photos.map((p,i)=>[p,i]).filter(([p])=>p.slot===s.k);
    return `<div class="slot"><div class="sh"><b>${s.l}${s.hint?`<small>${s.hint}</small>`:''}</b>
      <span class="btn small filebtn">${ph.length&&!s.multi?'바꾸기':'사진 추가'}<input type="file" accept="image/*" data-slot="${s.k}" ${s.multi?'multiple':''} aria-label="${s.l} 사진 추가"></span></div>
      ${ph.length?`<div class="photos">${ph.map(([p,i])=>`<div class="pghead"><img src="${esc(store.url(p))}" alt="${s.l}"><button type="button" data-rm="${i}" aria-label="사진 빼기">✕</button></div>`).join('')}</div>`:`<div class="note">아직 사진이 없어요.</div>`}</div>`}
  function collect(){const T=TYPES[r.type];for(const fd of T.fields){const el=sh.querySelector('#f_'+fd.k);if(el)r.f[fd.k]=el.value.trim()}
    const cb=[...sh.querySelectorAll('.checks input')];if(cb.length)r.genres=cb.filter(c=>c.checked).map(c=>c.value)}
  async function save(){if(busy)return;collect();if(!r.f.title){toast(TYPES[r.type].fields[0].l+'을(를) 적어 주세요');sh.querySelector('#f_title')?.focus();return}
    const keep=new Set(TYPES[r.type].slots.map(s=>s.k));r.photos=r.photos.filter(p=>keep.has(p.slot));
    // 화면에 쓰지 않는 칸 정리
    const fk=new Set(TYPES[r.type].fields.map(f=>f.k));for(const k of Object.keys(r.f))if(!fk.has(k))delete r.f[k];
    if(r.type==='work'&&(!rec||rec.type!=='work')&&S.plan){const n=S.records.filter(x=>x.type==='work').length;
      if(n>=S.plan.work_limit){toast(`지금 등급(${PLANS[S.plan.plan]?.l||'무료'})에서는 작품을 ${S.plan.work_limit}점까지 올릴 수 있어요`);return}}
    busy=true;draw();
    try{const saved=await store.save(r,rec);if(S.plan&&r.type==='work'&&!rec)S.plan.work_count++;saved.updated=new Date().toISOString();
      const i=S.records.findIndex(x=>x.id===r.id);if(i>=0)S.records[i]=saved;else S.records.push(saved);close();toast('저장했어요')}
    catch(e){busy=false;draw();toast(/WORK_LIMIT/.test(e.message+(e.cause||''))?'지금 등급에서 올릴 수 있는 작품 수를 넘었어요':e.message)}}
  function close(){sh.hidden=true;sh.innerHTML='';document.body.style.overflow='';render()}
  draw();sh.hidden=false;sh.scrollTop=0;document.body.style.overflow='hidden';
}

/* ---------- output ---------- */
function applyPreset(k){const p=PRESETS[k];S.out.preset=k;S.out.types=[...p.types];S.out.years=p.years;S.out.photos=p.photos;S.out.layout=p.layout||'list';
  S.out.genres=p.oneGenre?[S.settings.genres[0]]:[...S.settings.genres];S.out.title=p.oneGenre?`${S.settings.genres[0]} 포트폴리오`:p.title}
function selection(){const o=S.out;const cut=o.years?`${new Date().getFullYear()-o.years+1}-01-01`:'';
  const one=PRESETS[o.preset].oneGenre;
  return sorted(S.records.filter(r=>o.types.includes(r.type)&&((r.genres||[]).some(g=>o.genres.includes(g))||(!one&&!(r.genres||[]).length))&&(!cut||dateOf(r)>=cut)&&!(r.type==='work'&&o.skip.includes(r.id))))}
function orderedWorks(sel){const o=S.out;const ws=sel.filter(r=>r.type==='work');const idx=id=>{const i=o.order.indexOf(id);return i<0?1e9:i};
  return ws.sort((a,b)=>idx(a.id)-idx(b.id)||(a.f.year||'').localeCompare(b.f.year||'')||(a.f.code||'').localeCompare(b.f.code||''))}
function candidateWorks(){const o=S.out;const keep=o.skip;o.skip=[];const all=orderedWorks(selection());o.skip=keep;return all}
function workTitles(f){return [f.titleHan,f.titleEn].filter(Boolean).join(' / ')}
function workMeta(f){return [f.year,f.medium,f.size,f.edition].filter(Boolean).join(' · ')}
function awardsFor(r){return S.records.filter(a=>a.type==='award'&&a.f.workId===r.id).map(a=>[(a.f.date||'').slice(0,4),a.f.title,a.f.prize].filter(Boolean).join(' '))}
function line(r){const f=r.f;switch(r.type){
  case'exhibition':return`「${f.title}」${f.kind?' '+f.kind:''}${f.venue?', '+f.venue:''}${f.host&&f.host!==f.venue?' (주최 '+f.host+')':''}`;
  case'award':return`${f.title}${f.prize?' '+f.prize:''}${f.host?' ('+f.host+')':''}`;
  case'class':return`「${f.title}」${f.org?', '+f.org:''}${f.sessions?' ('+f.sessions+')':''}`;
  case'catalog':return`『${f.title}』${f.publisher?', '+f.publisher:''}${f.pages?', '+f.pages:''}`;
  case'work':return`「${f.title}」${f.titleEn?' '+f.titleEn:''}${[f.year,f.medium,f.size,f.edition].filter(Boolean).map(x=>', '+x).join('')}`}}
function docBody(img=p=>store.url(p),listOnly=false){const o=S.out,sel=selection();const by=t=>sel.filter(r=>r.type===t);const yr=r=>{const d=dateOf(r);return d?d.slice(0,4)+(d.length>4?'. '+(+d.slice(5,7)):''):''};
  const ul=arr=>`<ul>${arr.map(r=>`<li><span class="y">${yr(r)}</span><span>${esc(line(r))}</span></li>`).join('')}</ul>`;
  const exs=by('exhibition'),solo=exs.filter(r=>r.f.kind==='개인전'),group=exs.filter(r=>r.f.kind!=='개인전');
  const range=o.years?`최근 ${o.years}년 (${new Date().getFullYear()-o.years+1}–${new Date().getFullYear()})`:'전체 기간';
  let h=listOnly?'':`<h1>${esc(o.title||'활동 기록')}</h1><div class="dsub">${esc(S.settings.name||'작가')} · ${esc(o.genres.join(', '))} · ${range}</div>`;
  if(!sel.length)return h+`<p>조건에 맞는 기록이 없어요. 장르·기간·항목을 바꿔 보세요.</p>`;
  if(solo.length)h+=`<h2>개인전 (${solo.length}회)</h2>`+ul(solo);
  if(group.length)h+=`<h2>단체전·초대전 (${group.length}회)</h2>`+ul(group);
  if(by('award').length)h+=`<h2>수상</h2>`+ul(by('award'));
  if(by('catalog').length)h+=`<h2>도록·출판</h2>`+ul(by('catalog'));
  if(by('class').length)h+=`<h2>강의·워크숍</h2>`+ul(by('class'));
  if(listOnly)return h;
  if(o.photos){
    const works=orderedWorks(sel);
    if(works.length)h+=`<h2>작품</h2><div class="grid">${works.map(r=>{const p=r.photos.find(p=>p.slot==='main');return`<figure>${p?`<img src="${esc(img(p))}" alt="">`:''}<figcaption>${esc(line(r))}</figcaption></figure>`}).join('')}</div>`;
    const ev=[...exs,...by('award'),...by('catalog'),...by('class')].filter(r=>r.photos.length);
    if(ev.length){h+=`<h2>증빙 자료</h2>`;
      for(const r of ev){h+=`<div class="ev"><h3>${esc(TYPES[r.type].label)} · ${esc(line(r))}</h3><div class="grid">${
        TYPES[r.type].slots.flatMap(s=>r.photos.filter(p=>p.slot===s.k).map(p=>`<figure><img src="${esc(img(p))}" alt=""><figcaption>${esc(s.l)}</figcaption></figure>`)).join('')}</div></div>`}}
  }
  h+=`<div class="foot">작성일 ${fmtDate(new Date().toISOString().slice(0,10))}</div>`;return h}
function bookPages(img=p=>store.url(p)){const o=S.out,st=S.settings,sel=selection();
  const pages=[];const awards=sorted(sel.filter(r=>r.type==='award')).slice(0,8);
  pages.push(`<section class="page cover"><div class="cv-top">PORTFOLIO</div>
    <div class="cv-mid"><h1>${esc(o.title||st.ptitle||'포트폴리오')}</h1><div class="cv-name">${esc(st.name||'')}</div>
    ${st.tagline?`<p class="cv-tag">${esc(st.tagline)}</p>`:''}${st.bio?`<p class="cv-bio">${esc(st.bio)}</p>`:''}
    ${awards.length?`<ul class="cv-aw">${awards.map(a=>`<li>${esc([(a.f.date||'').slice(0,4),a.f.title,a.f.prize].filter(Boolean).join(' '))}</li>`).join('')}</ul>`:''}</div>
    <div class="cv-bot">${esc(o.genres.join(' · '))}</div></section>`);
  if(sel.some(r=>r.type==='exhibition'||r.type==='catalog'||r.type==='class')){pages.push(`<section class="page cvpage doc"><h2 class="pghead">약력</h2>${docBody(img,true)}</section>`)}
  for(const r of orderedWorks(sel)){const ps=r.photos.filter(p=>p.slot==='main');const f=r.f;const aw=awardsFor(r);
    const d=o.desc==='none'?'':[o.desc!=='en'&&f.desc,o.desc!=='ko'&&f.descEn].filter(Boolean).map(t=>`<p>${esc(t)}</p>`).join('');
    pages.push(`<section class="page workpage"><div class="wimg">${ps[0]?`<img src="${esc(img(ps[0]))}" alt="">`:'<div class="noimg">사진 없음</div>'}</div>
    <div class="wcap"><b>${esc(f.title)}</b>${workTitles(f)?`<span class="wsub">${esc(workTitles(f))}</span>`:''}<span>${esc(workMeta(f))}</span>${aw.map(t=>`<span class="waw">${esc(t)}</span>`).join('')}${d}</div>
    ${ps.length>1&&!d?`<div class="wmore">${ps.slice(1,4).map(p=>`<img src="${esc(img(p))}" alt="">`).join('')}</div>`:''}</section>`)}
  if(o.photos){const ev=sel.filter(r=>r.type!=='work'&&r.photos.length);
    for(const r of ev)pages.push(`<section class="page evpage"><h2 class="pghead">${esc(TYPES[r.type].label)}</h2><h3>${esc(line(r))}</h3><div class="grid">${TYPES[r.type].slots.flatMap(s=>r.photos.filter(p=>p.slot===s.k).map(p=>`<figure><img src="${esc(img(p))}" alt=""><figcaption>${esc(s.l)}</figcaption></figure>`)).join('')}</div></section>`)}
  if(!sel.length)pages.push(`<section class="page"><p>조건에 맞는 기록이 없어요. 장르·기간·항목을 바꿔 보세요.</p></section>`);
  return pages.join('')}
function plainText(){const sel=selection();const groups=[['개인전',r=>r.type==='exhibition'&&r.f.kind==='개인전'],['단체전·초대전',r=>r.type==='exhibition'&&r.f.kind!=='개인전'],['수상',r=>r.type==='award'],['도록·출판',r=>r.type==='catalog'],['강의·워크숍',r=>r.type==='class'],['작품',r=>r.type==='work']];
  return groups.map(([n,fn])=>{const a=sel.filter(fn);return a.length?`[${n}]\n`+a.map(r=>`${dateOf(r).slice(0,4)}  ${line(r)}`).join('\n'):''}).filter(Boolean).join('\n\n')}
function workOrderHTML(){const ws=candidateWorks();const o=S.out;
  if(!ws.length)return '';
  return `<div class="section"><div class="sh2"><h2>넣을 작품 ${ws.length-ws.filter(w=>o.skip.includes(w.id)).length}점</h2><button class="btn small" id="oyear">제작연도 순으로</button></div>
  <div class="worder">${ws.map((w,i)=>`<div class="wo"><label><input type="checkbox" data-wk="${w.id}" ${o.skip.includes(w.id)?'':'checked'}><span>${i+1}. ${esc(w.f.title)}${w.f.year?` <small>${esc(w.f.year)}</small>`:''}</span></label>
    <span class="mv"><button class="btn small" data-up="${i}" ${i===0?'disabled':''} aria-label="위로">위</button><button class="btn small" data-dn="${i}" ${i===ws.length-1?'disabled':''} aria-label="아래로">아래</button></span></div>`).join('')}</div></div>`}
function viewOut(){const o=S.out;const sel=selection();const one=PRESETS[o.preset].oneGenre;
  $('#app').innerHTML=`<div class="top"><div><h1><span class="seal">出</span>골라서 출력</h1><div class="sub">제출처를 고르면 필요한 항목만 모아 문서로 만들어요</div></div></div>
  <div class="presets">${Object.entries(PRESETS).map(([k,p])=>`<button class="preset" data-p="${k}" aria-pressed="${o.preset===k}"><b>${p.label}</b><span>${p.desc}</span></button>`).join('')}</div>
  <div class="section" id="oopts" style="margin-top:12px">
    <div class="field"><label for="otitle">문서 제목</label><input id="otitle" value="${esc(o.title)}"></div>
    <div><span class="flabel">장르${one?' (하나만)':''}</span><div class="checks">${S.settings.genres.map((g,i)=>`<label><input type="${one?'radio':'checkbox'}" name="og" id="og${i}" value="${esc(g)}" ${o.genres.includes(g)?'checked':''}>${esc(g)}</label>`).join('')}</div></div>
    <div><span class="flabel">넣을 항목</span><div class="checks">${TYPE_ORDER.map(t=>`<label><input type="checkbox" id="ot_${t}" value="${t}" ${o.types.includes(t)?'checked':''}>${TYPES[t].label}</label>`).join('')}</div></div>
    <div class="row2"><div class="field"><label for="oyears">기간</label><select id="oyears">${[[0,'전체'],[3,'최근 3년'],[5,'최근 5년'],[10,'최근 10년']].map(([v,l])=>`<option value="${v}" ${o.years==v?'selected':''}>${l}</option>`).join('')}</select></div>
    <div class="field"><label for="ophotos">사진</label><select id="ophotos"><option value="1" ${o.photos?'selected':''}>사진 넣기</option><option value="0" ${!o.photos?'selected':''}>목록만</option></select></div></div>
    <div class="field"><label for="olayout">모양</label><select id="olayout"><option value="list" ${o.layout==='list'?'selected':''}>제출 서류형 (목록 + 증빙 사진)</option><option value="book" ${o.layout==='book'?'selected':''}>포트폴리오 책자형 (표지 + 한 쪽에 한 작품)</option></select></div>
    ${o.types.includes('work')?`<div class="field"><label for="odesc">작품 설명</label><select id="odesc">${[['ko','국문 설명 넣기'],['both','국문 + 영문'],['en','영문만'],['none','설명 없이']].map(([v,l])=>`<option value="${v}" ${o.desc===v?'selected':''}>${l}</option>`).join('')}</select></div>`:''}
  </div>
  ${o.layout==='book'?`<div class="section"><h2>표지와 작가 소개</h2>
    <div class="field"><label for="pname">작가 이름</label><input id="pname" value="${esc(S.settings.name)}" placeholder="김정은 I 金廷恩 I Kim Jeong Eun"></div>
    <div class="field"><label for="ptag">한 줄 소개</label><input id="ptag" value="${esc(S.settings.tagline||'')}" placeholder="작가와 작업을 한 문장으로"></div>
    <div class="field"><label for="pbio">작가 소개</label><textarea id="pbio" placeholder="표지에 들어가요">${esc(S.settings.bio||'')}</textarea></div>
    <p>표지에는 고른 기록 중 수상 내역이 자동으로 들어가요.</p></div>`:''}
  ${o.types.includes('work')?workOrderHTML():''}
  <div class="section">
    <p>골라진 기록 <b>${sel.length}</b>건${sel.some(r=>r.type==='work')?` (작품 ${sel.filter(r=>r.type==='work').length}점)`:''}</p>
    <div class="actions"><button class="btn primary" id="preview">미리보기</button><button class="btn" id="copy">약력 글로 복사</button></div>
  </div>
  <p class="note">미리보기에서 <b>인쇄 / PDF 저장</b>을 누르면 종이로 뽑거나 PDF 파일로 저장할 수 있어요.</p>`;
  document.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{applyPreset(b.dataset.p);render()});
  const upd=()=>{o.title=$('#otitle').value;o.genres=[...document.querySelectorAll('[name=og]:checked')].map(x=>x.value);
    o.types=TYPE_ORDER.filter(t=>$('#ot_'+t).checked);o.years=+$('#oyears').value;o.photos=$('#ophotos').value==='1';o.layout=$('#olayout').value;if($('#odesc'))o.desc=$('#odesc').value};
  $('#otitle').oninput=()=>{o.title=$('#otitle').value};
  document.querySelectorAll('#oopts input:not(#otitle),#oopts select').forEach(el=>el.onchange=()=>{upd();render()});
  const ws=candidateWorks();const mv=(i,j)=>{const ids=ws.map(w=>w.id);[ids[i],ids[j]]=[ids[j],ids[i]];o.order=ids;render()};
  document.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>mv(+b.dataset.up,+b.dataset.up-1));
  document.querySelectorAll('[data-dn]').forEach(b=>b.onclick=()=>mv(+b.dataset.dn,+b.dataset.dn+1));
  document.querySelectorAll('[data-wk]').forEach(c=>c.onchange=()=>{o.skip=c.checked?o.skip.filter(x=>x!==c.dataset.wk):[...o.skip,c.dataset.wk];render()});
  $('#oyear')?.addEventListener('click',()=>{o.order=[...ws].sort((a,b)=>(a.f.year||'').localeCompare(b.f.year||'')||(a.f.code||'').localeCompare(b.f.code||'')).map(w=>w.id);render()});
  const prof=async()=>{S.settings.name=$('#pname').value.trim();S.settings.tagline=$('#ptag').value.trim();S.settings.bio=$('#pbio').value.trim();try{await store.setSettings(S.settings)}catch(e){toast(e.message)}};
  ['#pname','#ptag','#pbio'].forEach(id=>{const el=$(id);if(el)el.onchange=prof});
  $('#preview').onclick=async()=>{upd();await store.photoURLs(selection());openPreview()};
  $('#copy').onclick=async()=>{upd();const t=plainText()||'조건에 맞는 기록이 없어요.';try{await navigator.clipboard.writeText(t);toast('약력을 복사했어요')}catch(e){openPreview(t)}};
}
function openPreview(text){const sh=$('#sheet');
  sh.innerHTML=`<div class="head"><div class="in"><button class="btn" id="cancel">닫기</button><b>${text?'약력 글':'미리보기'}</b>${text?'<span></span>':'<button class="btn primary" id="print">인쇄 / PDF 저장</button>'}</div></div>
  <div class="wrap">${text?`<p class="note">아래 글을 길게 눌러 전체 선택한 뒤 복사하세요.</p><div class="field"><textarea id="ptext" style="min-height:60vh" readonly>${esc(text)}</textarea></div>`:(S.out.layout==='book'?`<div class="docwrap"><div class="book">${bookPages()}</div></div>`:`<div class="docwrap"><div class="doc">${docBody()}</div></div>`)}</div>`;
  sh.hidden=false;sh.scrollTop=0;document.body.style.overflow='hidden';
  sh.querySelector('#cancel').onclick=()=>{sh.hidden=true;sh.innerHTML='';document.body.style.overflow=''};
  if(text){const ta=sh.querySelector('#ptext');ta.focus();ta.select()}
  sh.querySelector('#print')?.addEventListener('click',async()=>{
    const imgs=[...sh.querySelectorAll('.doc img,.book img')];await Promise.all(imgs.map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r})));
    const t=document.title;document.title=S.out.title||'활동기록';window.print();document.title=t});
}

/* ---------- admin ---------- */
async function openAdmin(){const sh=$('#sheet');let list=[],q='';
  sh.innerHTML=`<div class="head"><div class="in"><button class="btn" id="cancel">닫기</button><b>회원 관리</b><button class="btn" id="reload">새로고침</button></div></div><div class="wrap" id="adm"><div class="loading">불러오는 중…</div></div>`;
  sh.hidden=false;sh.scrollTop=0;document.body.style.overflow='hidden';
  sh.querySelector('#cancel').onclick=()=>{sh.hidden=true;sh.innerHTML='';document.body.style.overflow='';render()};
  sh.querySelector('#reload').onclick=load;
  const day=d=>d?fmtDate(String(d).slice(0,10)):'';
  const ago=d=>{if(!d)return'';const n=Math.floor((Date.now()-new Date(d))/864e5);return n<=0?'오늘':n===1?'어제':n+'일 전'};
  function limitOf(m){if(m.user_id===S.user?.id&&S.plan?.admin)return '∞';if(m.plan==='friend'&&m.plan_until&&m.plan_until<new Date().toISOString().slice(0,10))return 10;return PLANS[m.plan]?.n??10}
  function draw(){const box=sh.querySelector('#adm');if(!box)return;
    const L=list.filter(m=>!q||(m.email||'').includes(q)||(m.name||'').includes(q)||(m.memo||'').includes(q));
    const cnt=k=>list.filter(m=>m.plan===k).length;const week=list.filter(m=>m.last_seen&&Date.now()-new Date(m.last_seen)<7*864e5).length;
    const soon=list.filter(m=>m.plan==='friend'&&m.plan_until&&(new Date(m.plan_until)-Date.now())<30*864e5).length;
    box.innerHTML=`<div class="stats" style="grid-template-columns:repeat(3,1fr)">
      <div class="stat"><b>${list.length}</b><span>전체 회원</span></div><div class="stat"><b>${week}</b><span>7일 내 접속</span></div><div class="stat"><b>${soon}</b><span>무료 30일 내 만료</span></div></div>
      <div class="stats" style="grid-template-columns:repeat(4,1fr)">${Object.entries(PLANS).map(([k,p])=>`<div class="stat"><b>${cnt(k)}</b><span>${p.l}</span></div>`).join('')}</div>
      <div class="field" style="margin-bottom:10px"><label for="aq">찾기 (이메일·이름·메모)</label><input id="aq" value="${esc(q)}"></div>
      <div class="list">${L.map(m=>`<div class="section mem" data-u="${m.user_id}">
        <div><b>${esc(m.name||'(이름 없음)')}</b> <span class="note">${esc(m.email||'')}</span></div>
        <p>가입 ${day(m.created_at)} · 마지막 접속 ${ago(m.last_seen)} · 작품 ${m.work_count} / ${limitOf(m)}점 · 전체 기록 ${m.record_count}건</p>
        <div class="row2"><div class="field"><label for="ap_${m.user_id}">등급</label><select id="ap_${m.user_id}">${Object.entries(PLANS).map(([k,p])=>`<option value="${k}" ${m.plan===k?'selected':''}>${p.l} (${p.n}점)</option>`).join('')}</select></div>
        <div class="field"><label for="au_${m.user_id}">무료 기간 끝나는 날</label><input type="date" id="au_${m.user_id}" value="${m.plan_until||''}"></div></div>
        <div class="field"><label for="am_${m.user_id}">메모</label><input id="am_${m.user_id}" value="${esc(m.memo||'')}" placeholder="예: ○○협회 소개, 3월 워크숍 수강생"></div>
        <div class="actions"><button class="btn small primary" data-save="${m.user_id}">저장</button>${m.plan==='friend'?`<button class="btn small" data-six="${m.user_id}">오늘부터 6개월</button>`:''}</div></div>`).join('')||'<div class="empty">회원이 없어요.</div>'}</div>`;
    box.querySelector('#aq').oninput=e=>{q=e.target.value.trim();const pos=e.target.selectionStart;draw();const el=box.querySelector('#aq');el.focus();el.setSelectionRange(pos,pos)};
    box.querySelectorAll('[data-six]').forEach(b=>b.onclick=()=>{const d=new Date();d.setMonth(d.getMonth()+6);box.querySelector('#au_'+b.dataset.six).value=d.toISOString().slice(0,10)});
    box.querySelectorAll('[id^=ap_]').forEach(sel=>sel.onchange=()=>{const m=list.find(x=>x.user_id===sel.id.slice(3));m.plan=sel.value;m.memo=box.querySelector('#am_'+m.user_id).value;m.plan_until=box.querySelector('#au_'+m.user_id).value||null;draw()});
    box.querySelectorAll('[data-save]').forEach(b=>b.onclick=async()=>{const id=b.dataset.save;const patch={plan:box.querySelector('#ap_'+id).value,plan_until:box.querySelector('#au_'+id).value||null,memo:box.querySelector('#am_'+id).value.trim()};
      b.disabled=true;try{await store.updateMember(id,patch);Object.assign(list.find(x=>x.user_id===id),patch);toast('저장했어요');draw()}catch(e){toast(e.message);b.disabled=false}});
  }
  async function load(){try{list=await store.adminMembers()||[];draw()}catch(e){const box=sh.querySelector('#adm');if(box)box.innerHTML=`<p class="note">${esc(e.message)}. 관리자 설정 글(admin.sql)을 실행했는지 확인해 주세요.</p>`}}
  load();
}

/* ---------- settings ---------- */
function viewSet(){const s=S.settings;
  $('#app').innerHTML=`<div class="top"><div><h1><span class="seal">設</span>설정</h1></div></div>
  <div class="section"><div class="field"><label for="sname">작가 이름 (출력 문서에 들어가요)</label><input id="sname" value="${esc(s.name)}" placeholder="예: 홍길동"></div></div>
  <div class="section"><h2>내 장르</h2><p>기록마다 장르를 붙여 두면, 출력할 때 장르별로 따로 뽑을 수 있어요.</p>
    <div class="genrelist">${s.genres.map((g,i)=>`<div class="g"><span>${esc(g)}</span><button class="btn small" data-rg="${i}" ${s.genres.length<2?'disabled':''}>빼기</button></div>`).join('')}</div>
    <div class="actions"><input id="newg" class="btn" style="flex:1;min-width:0" placeholder="새 장르 (예: 회화)" aria-label="새 장르"><button class="btn" id="addg">추가</button></div></div>
  <div class="section"><h2>계정</h2>
    ${store.mode==='cloud'?`<p><span class="syncdot"></span>${esc(S.user?.email||'')} 로 로그인됨. 휴대폰·컴퓨터 어디서 로그인해도 같은 기록이 보여요.</p>
    ${S.plan?`<p>등급: <b>${S.plan.admin?'관리자':esc(PLANS[S.plan.plan]?.l||'무료')}</b>${S.plan.plan_until&&S.plan.plan==='friend'?` (${fmtDate(S.plan.plan_until)}까지)`:''} · 작품 ${S.records.filter(r=>r.type==='work').length}${S.plan.admin?'점':` / ${S.plan.work_limit}점`}</p>`:''}
    ${S.plan?.admin?`<div class="actions"><button class="btn primary" id="admin">회원 관리</button></div>`:''}<div class="actions"><button class="btn" id="out">로그아웃</button></div>`
      :`<p><span class="syncdot local"></span>체험 모드예요. 기록이 이 기기에만 저장되고, 다른 기기에서는 보이지 않아요.${!store.persistent()?' 이 브라우저는 저장이 막혀 있어 창을 닫으면 기록이 사라져요.':''}</p>`}</div>
  <div class="section"><h2>홈 화면에 앱 아이콘 놓기</h2>
    <p><b>아이폰:</b> 사파리에서 열고 아래쪽 공유 버튼 → "홈 화면에 추가"</p>
    <p><b>안드로이드:</b> 크롬에서 열고 오른쪽 위 ⋮ → "홈 화면에 추가" 또는 "앱 설치"</p></div>
  <div class="section"><h2>백업</h2><p>지금까지의 기록을 사진까지 한 파일로 내려받아요.</p>
    <div class="actions"><button class="btn" id="bk">백업 파일 받기</button><button class="btn" id="csv">작품 목록 엑셀로 받기</button></div></div>`;
  const saveS=async()=>{try{await store.setSettings(s)}catch(e){toast(e.message)}};
  $('#sname').onchange=async e=>{s.name=e.target.value.trim();await saveS();toast('저장했어요')};
  document.querySelectorAll('[data-rg]').forEach(b=>b.onclick=async()=>{s.genres.splice(+b.dataset.rg,1);await saveS();render()});
  $('#addg').onclick=async()=>{const v=$('#newg').value.trim();if(!v||s.genres.includes(v))return;s.genres.push(v);await saveS();render()};
  $('#admin')?.addEventListener('click',openAdmin);
  $('#out')?.addEventListener('click',async()=>{await store.signOut();S.records=[];S.user=null;viewLogin('in')});
  $('#csv').onclick=()=>{const ws=[...S.records.filter(r=>r.type==='work')].sort((a,b)=>(a.f.year||'').localeCompare(b.f.year||'')||(a.f.code||'').localeCompare(b.f.code||''));
    const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
    const rows=[['순번','관리번호','국문 제목','한문 제목','영문 제목','장르','제작연도','크기','기법·재료','바탕 재료','에디션','소재','수상','작품 설명']];
    ws.forEach((r,i)=>{const f=r.f;rows.push([i+1,f.code,f.title,f.titleHan,f.titleEn,(r.genres||[]).join(', '),f.year,f.size,f.medium,f.base,f.edition,f.subject,awardsFor(r).join(' / '),f.desc])});
    const blob=new Blob(['\ufeff'+rows.map(r=>r.map(q).join(',')).join('\r\n')],{type:'text/csv'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`작품목록-${new Date().toISOString().slice(0,10)}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000);toast('작품 목록을 받았어요')};
  $('#bk').onclick=async e=>{const b=e.target;b.disabled=true;b.textContent='만드는 중…';
    try{const recs=[];for(const r of S.records){const photos=[];for(const p of r.photos)photos.push({slot:p.slot,src:await store.photoData(p)});recs.push({...r,photos})}
      const blob=new Blob([JSON.stringify({app:'artist-record',v:1,settings:s,records:recs})],{type:'application/json'});
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`활동기록-백업-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000);toast('백업 파일을 받았어요')}
    catch(err){toast('백업 파일을 만들지 못했어요')}
    b.disabled=false;b.textContent='백업 파일 받기'};
}

/* ---------- boot ---------- */
document.querySelectorAll('.tabbar button').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
(async()=>{
  try{await store.init()}catch(e){console.error(e)}
  if(store.mode==='cloud'){
    store.sb.auth.onAuthStateChange((ev)=>{if(ev==='PASSWORD_RECOVERY')viewLogin('newpw')});
    if(/type=recovery/.test(location.hash))return; // 재설정 링크로 들어온 경우 위 이벤트가 화면을 엽니다
    if(!(await store.user())){viewLogin('in');return}
  }
  await afterLogin();
})();
})();
