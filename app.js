(() => {
'use strict';
/* =========================================================
   JALP — 설치형 웹앱
   - config.js에 Supabase 정보가 있으면: 로그인 + 기기 간 동기화
   - 없으면: 이 기기에만 저장하는 체험 모드
   ========================================================= */

const TYPES = {
  work:{label:'작품', fields:[
    {k:'title',l:'국문 제목',req:1},{k:'titleHan',l:'한문 제목',ph:'歡喜',half:1},{k:'titleEn',l:'영문 제목',ph:'Exultation',half:1},
    {k:'year',l:'제작연도',t:'number',ph:'2025',half:1},{k:'made',l:'제작일',ph:'2025.05',half:1},{k:'code',l:'관리번호',ph:'비우면 자동 (예: 2501)'},
    {k:'size',l:'크기',ph:'60×90cm',half:1},{k:'edition',l:'에디션',ph:'ED.1, 3/20, A.P.',half:1},
    {k:'medium',l:'기법·재료',ph:'Woodcut (Reduction Method) · 소멸기법'},{k:'base',l:'바탕 재료',ph:'한지, 은행나무 판 등'},
    {k:'subject',l:'작품에 보이는 소재',ph:'모란'},
    {k:'statement',l:'작업 의도 · 나의 이야기',t:'area'},
    {k:'desc',l:'긴 설명 (작품 해설)',t:'area',ph:'포트폴리오 작품 쪽에 들어가요. "이 작품은"으로 시작하지 말고 제목으로 시작해 보세요'},
    {k:'summary',l:'한 줄 요약',ph:'50자 안팎으로 작품을 한 문장에'},
    {k:'descEn',l:'영문 해설',t:'area'},
    {k:'phrase',l:'문구',grp:'calli',t:'area'},{k:'source',l:'출처',grp:'calli',ph:'시인, 경전, 자작 등'},{k:'script',l:'서체',grp:'calli',ph:'궁체 흘림, 자유체 등'},
    {k:'plate',l:'판종',grp:'print',ph:'목판, 고무판, 동판',half:1},{k:'colors',l:'판 수 · 색 수',grp:'print',ph:'1판 5색',half:1},
    {k:'method',l:'찍는 방식 · 기법 상세',grp:'print',ph:'소멸기법, 다색 판화, 바렌 인쇄 등'},
    {k:'note',l:'메모',t:'area'}],
    slots:[{k:'main',l:'작품 사진',multi:1}]},
  exhibition:{label:'전시', fields:[
    {k:'title',l:'전시명',req:1},{k:'kind',l:'구분',t:'select',req:1,opts:['개인전','초대전','기획전','단체전','아트페어','공모전','기타']},
    {k:'y',l:'연도',t:'number',ph:'2025',half:1},{k:'venue',l:'장소',half:1},{k:'start',l:'시작일',t:'date',half:1},{k:'end',l:'종료일',t:'date',half:1},
    {k:'host',l:'주최',half:1},{k:'organizer',l:'주관',half:1},{k:'note',l:'메모',t:'area'}],
    slots:[{k:'ccover',l:'도록 표지',need:'필수'},{k:'cinner',l:'도록 내지',need:'선택',hint:'판권면, 참여작가 명단 등 · 여러 장 넣을 수 있어요',multi:1},{k:'cpage',l:'도록 작품 페이지',need:'필수',hint:'내 작품이 실린 쪽',multi:1},{k:'venue',l:'전시장 사진',need:'필수',hint:'전경, 작품이 걸린 모습',multi:1},{k:'works',l:'출품 작품 사진',hint:'작품 기록이 없어도 여기 바로 넣을 수 있어요',multi:1},{k:'poster',l:'포스터·리플렛',multi:1},{k:'main',l:'기타 증빙',hint:'초대장, 기사 등',multi:1}]},
  award:{label:'수상', fields:[
    {k:'title',l:'대회·공모전명',req:1},{k:'y',l:'연도',t:'number',ph:'2025',half:1},{k:'cat',l:'부문',ph:'캘리그라피, 판화 등',half:1},
    {k:'prize',l:'수상 내역',ph:'특선, 입선, 대상'},{k:'host',l:'주최'},
    {k:'date',l:'수상일',t:'date'},{k:'note',l:'메모',t:'area'}],
    slots:[{k:'main',l:'상장',need:'필수',multi:1},{k:'acover',l:'도록 표지'},{k:'apage',l:'작품 페이지',hint:'내 작품이 실린 쪽 · 여러 장',multi:1},{k:'work',l:'수상 작품 사진',hint:'작품 기록이 없어도 여기 바로 넣을 수 있어요',multi:1}]},
  catalog:{label:'도록', fields:[
    {k:'title',l:'도록명',req:1},{k:'exhibitionId',l:'연결할 전시',t:'exsel'},{k:'publisher',l:'발행처'},
    {k:'date',l:'발행일',t:'date',half:1},{k:'pages',l:'내 작품 수록 쪽',ph:'p.24–25',half:1},{k:'note',l:'메모',t:'area'}],
    slots:[{k:'cover',l:'표지',need:'필수'},{k:'colophon',l:'내지',need:'선택',hint:'판권면, 참여작가 명단 등'},{k:'mypage',l:'작품 페이지',need:'필수',hint:'내 작품이 실린 쪽',multi:1}]},
  class:{label:'강의', fields:[
    {k:'title',l:'강의명',req:1},{k:'org',l:'기관'},{k:'start',l:'시작일',t:'date',half:1},{k:'end',l:'종료일',t:'date',half:1},
    {k:'sessions',l:'회차·시간',ph:'8회, 회당 2시간'},{k:'note',l:'메모',t:'area'}],
    slots:[{k:'main',l:'수업 사진',multi:1}]}
};
const TYPE_ORDER=['work','exhibition','award','catalog','class'];
const PRESETS = {
  artproof:{label:'예술활동증명용',desc:'최근 5년 전시·도록·수상과 증빙 사진 (공모전 전시는 빠져요)',noContest:1,title:'예술활동증명 제출 자료',types:['exhibition','catalog','award'],years:5,photos:true},
  assoc:{label:'미술협회 제출용',desc:'개인전·단체전·수상 약력 목록',title:'작가 약력',types:['exhibition','award','class'],years:0,photos:false},
  portfolio:{label:'장르별 포트폴리오',desc:'표지, 약력, 한 쪽에 한 작품',title:'포트폴리오',types:['work','exhibition','award'],years:0,photos:true,oneGenre:true,layout:'book'},
  custom:{label:'직접 고르기',desc:'항목·기간·장르를 직접 선택',title:'활동 기록',types:['work','exhibition','award','catalog','class'],years:0,photos:true}
};
const PLANS={free:{l:'무료',n:10},friend:{l:'지인·협회 무료',n:100},basic:{l:'베이직',n:20},pro:{l:'프로',n:100},vip:{l:'VIP',n:'무제한'}};
const DEFAULT_SETTINGS={name:'',genres:['한국화','서양화','수채화','판화','조각','공예','디자인','서예','문인화','캘리그라피','민화','서각','사진','미디어아트']};

/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>(crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16)}));
function dateOf(r){const f=r.f||{};if(r.type==='work'){const m=String(f.made||'').match(/(\d{4})\D*(\d{1,2})?\D*(\d{1,2})?/);
  if(m)return `${m[1]}-${String(m[2]||1).padStart(2,'0')}-${String(m[3]||1).padStart(2,'0')}`;return f.year?f.year+'-01-01':''}
  return f.start||f.date||(f.y?f.y+'-01-01':'')}
function fmtDate(d){if(!d)return'';const [y,m,dd]=d.split('-');return dd&&m?`${y}. ${+m}. ${+dd}.`:m?`${y}. ${+m}.`:y}
function fmtRange(a,b){if(!a)return'';if(!b||a===b)return fmtDate(a);const [y1]=a.split('-'),[y2,m2,d2]=b.split('-');return fmtDate(a)+' – '+(y1===y2?`${+m2}. ${+d2}.`:fmtDate(b))}
/* sheet stack: phone back button closes the top sheet */
const sheetStack=[];
function hideSheet(){const sh=$('#sheet');sh.hidden=true;sh.innerHTML='';document.body.style.overflow=''}
function openSheet(onClose){const sh=$('#sheet');sh.hidden=false;sh.scrollTop=0;document.body.style.overflow='hidden';sheetStack.push(onClose||hideSheet);try{history.pushState({sheet:sheetStack.length},'')}catch(e){}}
function closeSheet(){if(sheetStack.length)history.back();else{hideSheet();render()}}
window.addEventListener('popstate',()=>{if($('#lightbox')){$('#lightbox').remove();return}const fn=sheetStack.pop();if(fn)fn()});
function lightbox(src){if(!src)return;const d=document.createElement('div');d.id='lightbox';d.innerHTML=`<img src="${esc(src)}" alt=""><button class="btn" aria-label="닫기">닫기</button>`;d.onclick=()=>history.back();document.body.appendChild(d);try{history.pushState({lb:1},'')}catch(e){}}
function toast(m){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>t.hidden=true,2400)}
const byDate=(x,y)=>dateOf(x).localeCompare(dateOf(y))||String(x.f?.code||'').localeCompare(String(y.f?.code||''),undefined,{numeric:true});
const sorted=a=>[...a].sort((x,y)=>byDate(y,x));
const sortedView=a=>[...a].sort((x,y)=>S.sort==='old'?byDate(x,y):byDate(y,x));
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
    async redeem(code){const {data,error}=await sb.rpc('redeem_code',{c:code});if(error)throw error;return data},
    async listCodes(){const {data,error}=await sb.from('invite_codes').select('*').order('created_at',{ascending:false});fail(error,'초대 코드를 불러오지 못했어요');return data},
    async createCode(row){const {error}=await sb.from('invite_codes').insert(row);fail(error,'초대 코드를 만들지 못했어요')},
    async deleteCode(code){const {error}=await sb.from('invite_codes').delete().eq('code',code);fail(error,'지우지 못했어요')},
    async setContact(phone,ok){const {error}=await sb.rpc('set_contact',{p:phone,ok});fail(error,'연락처를 저장하지 못했어요')},
    async myContact(){const {data}=await sb.rpc('my_contact');return Array.isArray(data)?data[0]:data},
    async latestNotice(){const {data}=await sb.from('notices').select('id,title,body,created_at').eq('active',true).order('created_at',{ascending:false}).limit(1);return data?.[0]||null},
    async listNotices(){const {data,error}=await sb.from('notices').select('*').order('created_at',{ascending:false}).limit(20);fail(error,'공지를 불러오지 못했어요');return data},
    async postNotice(row){const {error}=await sb.from('notices').insert(row);fail(error,'공지를 올리지 못했어요')},
    async setNotice(id,active){const {error}=await sb.from('notices').update({active}).eq('id',id);fail(error,'공지를 바꾸지 못했어요')},
    async updateMember(id,patch){const {error}=await sb.from('members').update(patch).eq('user_id',id);fail(error,'회원 정보를 저장하지 못했어요')},
    url:p=>p.src||urls.get(p.path)?.url||'',
    async photoData(p){if(p.src)return p.src;const {data}=await sb.storage.from(BUCKET).download(p.path);return data?blobToDataURL(data):''}
  };
}

/* ---------- 임시저장 (이 기기에만) ---------- */
const Drafts=(()=>{let db=null;const mem=new Map();const ids=new Set();
  const open=()=>new Promise(res=>{try{const r=indexedDB.open('jalp-drafts',1);r.onupgradeneeded=()=>r.result.createObjectStore('d');r.onsuccess=()=>{db=r.result;res()};r.onerror=()=>res()}catch(e){res()}});
  const tx=(mode,fn)=>new Promise(res=>{if(!db){res(null);return}try{const t=db.transaction('d',mode);const q=fn(t.objectStore('d'));t.oncomplete=()=>res(q&&q.result);t.onerror=()=>res(null)}catch(e){res(null)}});
  return {ids,
    async init(){await open();const ks=db?await tx('readonly',s=>s.getAllKeys()):[...mem.keys()];(ks||[]).forEach(k=>ids.add(k))},
    async get(k){return db?await tx('readonly',s=>s.get(k)):mem.get(k)},
    async put(k,v){ids.add(k);if(db)await tx('readwrite',s=>s.put(v,k));else mem.set(k,v)},
    async del(k){ids.delete(k);if(db)await tx('readwrite',s=>s.delete(k));else mem.delete(k)}}})();
const norm=t=>String(t||'').replace(/\s+/g,'').toLowerCase();
const recYear=x=>(dateOf(x)||'').slice(0,4);
const linksOf=w=>w.f?.links||[];
function worksOf(rec){return S.records.filter(w=>w.type==='work'&&(linksOf(w).includes(rec.id)||(rec.type==='award'&&rec.f.workId===w.id)))}
function exhibitionsOf(w){return sorted(S.records.filter(x=>x.type==='exhibition'&&linksOf(w).includes(x.id)))}
function awardsOf(w){return sorted(S.records.filter(a=>a.type==='award'&&(linksOf(w).includes(a.id)||a.f.workId===w.id)))}
const awardLine=a=>[recYear(a),a.f.title,a.f.cat,a.f.prize].filter(Boolean).join(' ');
const exLine=x=>[recYear(x),`「${x.f.title}」`,x.f.kind,x.f.venue].filter(Boolean).join(' ');

/* ---------- state ---------- */
const cfg=window.APP_CONFIG||{};
const cloudReady=!!(cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY&&window.supabase);
const store=cloudReady?CloudStore(cfg):LocalStore();
const S={records:[],settings:{...DEFAULT_SETTINGS,genres:[...DEFAULT_SETTINGS.genres]},tab:'list',view:'list',sort:'old',plan:null,notice:null,contact:null,ftype:'work',fgenre:'all',user:null,
  out:{preset:'artproof',types:[],years:5,genres:[],photos:true,title:'',layout:'list',desc:'ko',order:[],skip:[]}};

function subline(r){const f=r.f||{};switch(r.type){
  case'work':return[f.code&&('#'+f.code),f.year,f.medium,f.size,f.edition].filter(Boolean).join(' · ');
  case'exhibition':return[f.kind,f.venue,fmtRange(f.start,f.end)||f.y].filter(Boolean).join(' · ');
  case'award':return[f.cat,f.prize,f.host,fmtDate(f.date)||f.y].filter(Boolean).join(' · ');
  case'catalog':{const ex=S.records.find(x=>x.id===f.exhibitionId);return[ex&&('「'+ex.f.title+'」'),f.publisher,fmtDate(f.date)].filter(Boolean).join(' · ')}
  case'class':return[f.org,fmtRange(f.start,f.end),f.sessions].filter(Boolean).join(' · ')}}

/* ---------- navigation ---------- */
function setTab(t){if(t==='add'){openEditor(null);return}S.tab=t;
  document.querySelectorAll('.tabbar button').forEach(b=>b.setAttribute('aria-current',String(b.dataset.tab===t)));render();window.scrollTo(0,0)}
function render(){({list:viewList,out:viewOut,set:viewSet})[S.tab]()}
let syncing=false,lastSync=Date.now();
async function syncNow(quiet){if(syncing||store.mode!=='cloud'||!S.user)return;if($('#sheet')&&!$('#sheet').hidden)return;syncing=true;
  try{const st=await store.getSettings();if(st)S.settings=st;S.records=await store.list();await store.photoURLs(S.records);lastSync=Date.now();render();if(!quiet)toast('최신 기록을 불러왔어요')}catch(e){if(!quiet)toast(e.message)}syncing=false}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&Date.now()-lastSync>30000)syncNow(true)});

/* ---------- login (cloud mode) ---------- */
function viewLogin(mode='in',msg=''){
  $('.tabbar').hidden=true;
  const T={in:['로그인','기록을 보려면 로그인하세요.','로그인'],up:['가입하기','이메일과 비밀번호로 계정을 만들어요.','가입하기'],reset:['비밀번호 찾기','가입한 이메일로 재설정 링크를 보내요.','링크 보내기'],newpw:['새 비밀번호','새로 쓸 비밀번호를 정해 주세요.','저장']}[mode];
  $('#app').innerHTML=`<form class="login" id="lf" novalidate>
    <h1 class="wm wm-lg" role="img" aria-label="JALP · JuneArtLab Portfolio"></h1><div class="sub">작가 활동기록</div>
    <h2>${T[0]}</h2><p class="lead">${T[1]}</p>
    ${mode!=='newpw'?`<div class="field"><label for="le">이메일</label><input id="le" type="email" autocomplete="email" required></div>`:''}
    ${mode!=='reset'?`<div class="field"><label for="lp">비밀번호${mode!=='in'?' (8자 이상)':''}</label><div class="pw"><input id="lp" type="password" autocomplete="${mode==='in'?'current-password':'new-password'}" required><button type="button" id="pweye" class="pweye" aria-label="비밀번호 보기" aria-pressed="false"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></button></div></div>`:''}
    ${mode==='up'?`<div class="field"><label for="lph">연락처 (선택)</label><input id="lph" type="tel" autocomplete="tel" placeholder="010-0000-0000"></div>
    <label class="consent"><input type="checkbox" id="lok"> 업데이트 공지·안내를 받을 목적으로 연락처를 쓰는 데 동의해요 (선택)</label>`:''}
    ${mode==='up'?`<div class="field"><label for="lc">초대 코드 (있으면)</label><input id="lc" autocomplete="off" placeholder="예: VIP-7K3Q-M9XA" value="${esc((()=>{try{return localStorage.getItem('pendingCode')||''}catch(e){return''}})())}"></div>`:''}
    ${msg?`<p class="err" role="alert">${esc(msg)}</p>`:''}
    <button class="btn primary" id="lgo">${T[2]}</button>
    ${chLinks()}
    ${mode==='in'?`<button type="button" class="switch" data-m="up">처음이에요. 가입할게요</button><button type="button" class="switch" data-m="reset">비밀번호를 잊었어요</button>`:mode!=='newpw'?`<button type="button" class="switch" data-m="in">로그인 화면으로</button>`:S.records.length||S.user?`<button type="button" class="switch" id="pwback">취소하고 돌아가기</button>`:''}
  </form>`;
  document.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>viewLogin(b.dataset.m));
  $('#pwback')?.addEventListener('click',()=>{$('.tabbar').hidden=false;setTab('set')});
  const eyeB=$('#pweye');if(eyeB)eyeB.onclick=()=>{const i=$('#lp'),on=i.type==='password';i.type=on?'text':'password';eyeB.setAttribute('aria-pressed',on);eyeB.setAttribute('aria-label',on?'비밀번호 숨기기':'비밀번호 보기');eyeB.classList.toggle('on',on);i.focus()};
  $('#lf').onsubmit=async e=>{e.preventDefault();const em=$('#le')?.value.trim(),pw=$('#lp')?.value||'';const go=$('#lgo');go.disabled=true;
    try{
      if(mode==='in'){await store.signIn(em,pw);await afterLogin()}
      else if(mode==='up'){if(pw.length<8)throw new Error('비밀번호를 8자 이상으로 정해 주세요');const lc=$('#lc')?.value.trim();if(lc){try{localStorage.setItem('pendingCode',lc)}catch(e){}}
        const lph=$('#lph')?.value.trim();if(lph){try{localStorage.setItem('pendingContact',JSON.stringify({p:lph,ok:!!$('#lok')?.checked}))}catch(e){}}const d=await store.signUp(em,pw);
        if(d.session)await afterLogin();else viewLogin('in',`${em}로 확인 메일을 보냈어요. 메일의 링크를 누른 뒤 여기서 로그인하세요.`)}
      else if(mode==='reset'){await store.resetPassword(em);viewLogin('in','재설정 메일을 보냈어요. 메일의 링크를 누르면 새 비밀번호를 정할 수 있어요.')}
      else if(mode==='newpw'){if(pw.length<8)throw new Error('비밀번호를 8자 이상으로 정해 주세요');await store.updatePassword(pw);toast('비밀번호를 바꿨어요');await afterLogin()}
    }catch(err){go.disabled=false;const m=String(err.message||err);
      viewLogin(mode,/Invalid login/i.test(m)?`로그인이 안 됐어요. 이메일(${em})이 가입한 주소가 맞는지 먼저 확인하고, 맞다면 비밀번호를 다시 넣어 주세요.`:/not confirmed/i.test(m)?'메일함의 확인 링크를 먼저 눌러 주세요':/already registered/i.test(m)?'이미 가입된 이메일이에요. 로그인해 주세요':m);if(em&&$('#le'))$('#le').value=em}};
}
function chLinks(){const k=cfg.KAKAO_CHANNEL_URL;return `<div class="actions" style="font-size:.85rem">${k?`<a class="btn small kakao" href="${esc(k)}" target="_blank" rel="noopener">카카오톡 채널 추가</a>`:''}<a class="btn small" href="privacy.html" target="_blank" rel="noopener">개인정보처리방침</a></div>`}
const HELPQ=[['what','무엇을 표현했나요?','예: 활짝 핀 모란, 어머니의 뒷모습'],['how','어떤 재료와 기법으로 만들었나요?','예: 목판에 여러 번 찍는 소멸기법'],['heart','작업할 때 어떤 마음이었나요?','예: 꽃이 열리는 순간을 기다리는 설렘이 있었다'],['feel','보는 사람이 무엇을 느꼈으면 하나요?','예: 고요함 속의 기쁨']];
function josa(w,a,b){const c=String(w||'').trim().slice(-1).charCodeAt(0);if(c>=0xAC00&&c<=0xD7A3)return (c-0xAC00)%28?a:b;return /[0-9LMNlmn]$/.test(String(w).trim())?a:b}
function makeDraft(f,qa={}){const t=f.title||'이 작품';const ko=[];
  const head=`「${t}」${f.titleHan?`(${f.titleHan})`:''}`;const nun=josa(t,'은','는');
  const subj=qa.what||f.subject;const how=qa.how||f.medium;
  const kind=how?`${how} 작품`:'작품';const yr=f.year?`${f.year}년에 제작한 `:'';
  ko.push(subj?`${head}${nun} ${subj}${josa(subj,'을','를')} 담아 ${yr}${kind}이다.`:`${head}${nun} ${yr}${kind}이다.`);
  if(f.plate||f.colors||f.method){const p=[];if(f.plate)p.push(`${f.plate}에 새겨`);if(f.colors)p.push(`${f.colors}${josa(f.colors,'으로','로')} 찍었`);else p.push('찍었');
    ko.push(p.join(' ')+(f.method?`으며, ${f.method}${josa(f.method,'을','를')} 썼다.`:'다.'))}
  if(f.phrase)ko.push(`화면에는 「${f.phrase.split('\n')[0]}」${f.source?`(${f.source})`:''} 구절을 ${f.script?f.script+josa(f.script,'으로','로')+' ':''}썼다.`);
  if(f.base)ko.push(`바탕 재료는 ${f.base}이다.`);
  if(qa.heart)ko.push(`작업하는 동안 ${qa.heart.replace(/[.。]$/,'')}.`);
  if(f.statement&&!qa.heart)ko.push(f.statement.trim());
  if(qa.feel){const fe=qa.feel.replace(/[.。]$/,'');ko.push(/[다요]$/.test(fe)?`${fe}.`:`보는 이가 ${fe}${josa(fe,'을','를')} 느끼기를 바란다.`)}
  const meta=[f.size,f.edition].filter(Boolean).join(', ');if(meta)ko.push(`(${meta})`);
  const ascii=v=>v&&/^[\x00-\x7F]+$/.test(v);
  const en=(f.titleEn||ascii(how))?`${f.titleEn?`"${f.titleEn}"`:'This work'}${f.year?` (${f.year})`:''} is ${ascii(how)?`a ${how} work`:'a work'}${ascii(subj)?` depicting ${subj}`:''}.${f.size?` Size: ${f.size}.`:''}${f.edition?` Edition: ${f.edition}.`:''}`:'';
  return {ko:ko.join(' '),en}}
let installEvt=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e;if(S.tab==='list'||S.tab==='set')render()});
window.addEventListener('appinstalled',()=>{installEvt=null;toast('홈 화면에 설치했어요');render()});
const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function installHow(){if(installEvt)return `<button class="btn small primary" data-install>앱으로 설치하기</button>`;
  if(isIOS())return `<span>사파리 아래쪽 <b>공유 버튼</b>(네모에 위 화살표 <span aria-hidden="true">⬆︎</span>) → <b>홈 화면에 추가</b>를 누르세요. 다른 앱 안에서 열었다면 먼저 사파리로 여세요.</span>`;
  if(/android/i.test(navigator.userAgent))return `<span>크롬 오른쪽 위 <b>⋮</b> → <b>앱 설치</b> 또는 <b>홈 화면에 추가</b>를 누르세요.</span>`;
  return `<span>크롬·엣지 주소창 오른쪽의 <b>설치 아이콘</b>(모니터에 화살표)이나 메뉴 <b>⋮ → 앱 설치</b>를 누르면 바탕화면에 아이콘이 생겨요.</span>`}
function installBanner(){if(isStandalone())return'';let hide=false;try{hide=localStorage.getItem('installHide')==='1'}catch(e){}if(hide)return'';
  return `<div class="banner install"><div style="min-width:0"><b>홈 화면에 앱 아이콘을 놓아 보세요</b><div class="note" style="margin-top:4px">${installHow()}</div></div><button class="btn small" id="insthide">닫기</button></div>`}
function bindInstall(){document.querySelectorAll('[data-install]').forEach(b=>b.onclick=async()=>{if(!installEvt)return;installEvt.prompt();try{await installEvt.userChoice}catch(e){}installEvt=null;render()});
  $('#insthide')?.addEventListener('click',()=>{try{localStorage.setItem('installHide','1')}catch(e){}render()})}
function redeemMsg(r){if(String(r).startsWith('OK:'))return `초대 코드가 적용됐어요. 이제 ${PLANS[String(r).slice(3)]?.l||''} 등급이에요`;
  return {NOT_FOUND:'없는 초대 코드예요. 글자를 다시 확인해 주세요',EXPIRED:'사용 기한이 지난 초대 코드예요',USED_UP:'이미 사용된 초대 코드예요'}[r]||'초대 코드를 적용하지 못했어요'}
async function afterLogin(){
  await Drafts.init();
  S.user=await store.user();$('#app').innerHTML='<div class="loading">기록을 불러오는 중…</div>';
  try{
    const st=await store.getSettings();if(st)S.settings=st;
    S.records=await store.list();await store.photoURLs(S.records);
  }catch(e){toast(e.message)}
  if(store.touch){try{await store.touch();
    let pend=null;try{pend=localStorage.getItem('pendingCode')}catch(e){}
    let pc=null;try{pc=JSON.parse(localStorage.getItem('pendingContact')||'null')}catch(e){}
    if(pc){try{await store.setContact(pc.p,pc.ok);localStorage.removeItem('pendingContact')}catch(e){}}
    try{S.contact=await store.myContact()}catch(e){}
    if(pend){let adm=false;try{adm=!!(await store.myPlan())?.admin}catch(e){}if(adm){try{localStorage.removeItem('pendingCode')}catch(e){}toast('관리자 계정이라 초대 코드를 쓰지 않았어요. 코드는 그대로 남아 있어요');pend=null}}
    if(pend){try{const r=await store.redeem(pend);try{localStorage.removeItem('pendingCode')}catch(e){}toast(redeemMsg(r))}catch(e){}}
    S.plan=await store.myPlan()}catch(e){S.plan=null}
    try{const n=await store.latestNotice();let seen='';try{seen=localStorage.getItem('noticeSeen')||''}catch(e){}if(n&&String(n.id)!==seen)S.notice=n}catch(e){}}
  applyPreset('artproof');$('.tabbar').hidden=false;setTab('list');
}

/* ---------- list ---------- */
function viewList(){
  const R=S.records;
  const counts=TYPE_ORDER.map(t=>[t,R.filter(r=>r.type===t).length]);
  const L=R.filter(r=>(S.ftype==='all'||r.type===S.ftype)&&(S.fgenre==='all'||(r.genres||[]).includes(S.fgenre)));
  $('#app').innerHTML=`
  <div class="top"><div><h1 class="wm" role="img" aria-label="JALP · JuneArtLab Portfolio"></h1><div class="sub">${esc(S.settings.name||'작가')} · 한 번 기록하고 제출처마다 골라 출력</div></div>${store.mode==='cloud'?'<button class="btn small" id="sync" aria-label="다른 기기에서 넣은 기록 불러오기">↻ 새로고침</button>':''}</div>
  ${installBanner()}
  ${S.notice?`<div class="banner notice"><div style="min-width:0"><b>📢 ${esc(S.notice.title)}</b>${S.notice.body?`<p style="margin:4px 0 0;white-space:pre-line">${esc(S.notice.body)}</p>`:''}</div><button class="btn small" id="ncl">닫기</button></div>`:''}
  ${Drafts.ids.has('new')?`<div class="banner draftb"><span>✎ 쓰다 만 새 기록이 임시저장돼 있어요.</span><button class="btn small primary" id="resume">이어서 쓰기</button></div>`:''}
  ${store.mode==='local'?`<div class="banner"><span><span class="syncdot local"></span>체험 모드예요. 기록이 이 기기에만 저장돼요.</span></div>`:''}
  <div class="stats">${counts.map(([t,n])=>`<button class="stat" data-ft="${t}" aria-pressed="${S.ftype===t}"><b>${n}</b><span>${TYPES[t].label}</span></button>`).join('')}</div>
  ${yearLine()}
  <div class="chips" role="group" aria-label="종류">${['all',...TYPE_ORDER].map(t=>`<button class="chip" data-ft="${t}" aria-pressed="${S.ftype===t}">${t==='all'?'전체':TYPES[t].label}</button>`).join('')}</div>
  <div class="chips" role="group" aria-label="장르">${['all',...S.settings.genres].map(g=>`<button class="chip" data-fg="${esc(g)}" aria-pressed="${S.fgenre===g}">${g==='all'?'모든 장르':esc(g)}</button>`).join('')}</div>
  <div class="viewtog">${[['list','목록'],['grid','사진 보기'],['table','표 보기']].map(([k,l])=>`<button class="chip" data-vw="${k}" aria-pressed="${S.view===k}">${l}</button>`).join('')}<button class="chip" id="sortbtn" style="margin-left:auto">${S.sort==='old'?'오래된 순 ↑':'최신 순 ↓'}</button><span class="note" style="align-self:center">${L.length}건</span></div>
  <div class="${S.view==='grid'?'pgrid':S.view==='table'?'':'list'}">${L.length?(S.view==='table'?tableHTML(sortedView(L)):sortedView(L).map(S.view==='grid'?pcard:card).join('')):R.length?`<div class="empty">이 조건에 맞는 기록이 없어요.</div>`:`<div class="empty">아직 기록이 없어요.<br>아래 <b>+ 추가</b>로 첫 기록을 남겨 보세요.<br><br>작품, 전시, 수상, 도록, 강의를 기록해 두면<br>출력 탭에서 제출처별 문서로 골라 뽑을 수 있어요.</div>`}</div>`;
  document.querySelectorAll('[data-ft]').forEach(b=>b.onclick=()=>{S.ftype=(b.classList.contains('stat')&&S.ftype===b.dataset.ft)?'all':b.dataset.ft;render()});
  document.querySelectorAll('[data-fg]').forEach(b=>b.onclick=()=>{S.fgenre=b.dataset.fg;render()});
  bindInstall();
  $('#ncl')?.addEventListener('click',()=>{try{localStorage.setItem('noticeSeen',String(S.notice.id))}catch(e){}S.notice=null;render()});
  $('#sortbtn').onclick=()=>{S.sort=S.sort==='old'?'new':'old';render()};
  document.querySelectorAll('[data-vw]').forEach(b=>b.onclick=()=>{S.view=b.dataset.vw;render()});
  document.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>openDetail(S.records.find(r=>r.id===b.dataset.id)));
  $('#sync')?.addEventListener('click',()=>syncNow(false));
  $('#resume')?.addEventListener('click',()=>openEditor(null));
}
function yearLine(){const y=String(new Date().getFullYear());const R=S.records.filter(r=>dateOf(r).startsWith(y));if(!S.records.length)return'';
  const n=t=>R.filter(r=>r.type===t).length;const parts=[['exhibition','전시','회'],['award','수상','건'],['work','새 작품','점'],['class','강의','건']].filter(([t])=>n(t)).map(([t,l,u])=>`${l} ${n(t)}${u}`);
  return `<p class="yearline">${y}년 ${parts.length?parts.join(' · '):'아직 기록이 없어요'}</p>`}
function tableHTML(L){const onlyWork=L.every(r=>r.type==='work');
  const th=onlyWork?['순번','관리번호','사진','작품명','장르','제작일','크기','기법·재료','에디션','수상·비고','']:['순번','사진','종류','제목','날짜','내용',''];
  return `<div class="tblwrap">${onlyWork?`<div class="tbltitle">${esc(S.settings.name||'')} 작품 전체 목록</div>`:''}<table class="tbl"><thead><tr>${th.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${L.map((r,i)=>{const p=(r.photos||[])[0];const u=p&&store.url(p);const f=r.f;
    const img=`<td>${u?`<img src="${esc(u)}" alt="" loading="lazy">`:''}</td>`;
    return onlyWork?`<tr data-id="${r.id}"><td class="n">${i+1}</td><td class="n">${esc(f.code||'')}</td>${img}<td><b>${esc(f.title)}</b>${(f.titleHan?`<small>${esc(f.titleHan)}</small>`:'')+(f.titleEn?`<small>${esc(f.titleEn)}</small>`:'')}</td><td>${esc((r.genres||[]).join(', '))}</td><td class="n">${esc(f.made||f.year||'')}</td><td>${esc(f.size||'')}</td><td>${esc(f.medium||'')}</td><td>${esc(f.edition||'')}</td><td>${esc([...awardsFor(r),f.note].filter(Boolean).join(', '))}</td><td><span class="btn small">상세보기</span></td></tr>`
      :`<tr data-id="${r.id}"><td class="n">${i+1}</td>${img}<td><span class="pill type">${TYPES[r.type].label}</span></td><td><b>${esc(f.title)}</b></td><td class="n">${esc(fmtDate(dateOf(r)))}</td><td>${esc(subline(r))}</td><td><span class="btn small">상세보기</span></td></tr>`}).join('')}</tbody></table></div>`}
function thumbs(ps,cls='dthumbs'){return ps.length?`<div class="${cls}">${ps.map(p=>{const u=store.url(p);return u?`<img src="${esc(u)}" alt="" loading="lazy" data-lb>`:''}).join('')}</div>`:''}
function openDetail(r,opts={}){
  if(!r){if(opts.replace)closeSheet();return}
  const sh=$('#sheet');const T=TYPES[r.type];const f=r.f||{};
  const self=()=>S.records.find(x=>x.id===r.id);
  const reopen=()=>openDetail(self(),{replace:true});
  const dl=keys=>keys.map(k=>{const fd=T.fields.find(x=>x.k===k);let v=f[k];if(!fd||!v)return'';if(fd.t==='date')v=fmtDate(v);return `<div class="dr"><dt>${fd.l}</dt><dd>${esc(v)}</dd></div>`}).join('');
  const sec=(h,body)=>body?`<section class="dsec"><h2>${h}</h2>${body}</section>`:'';
  let body='',head=T.label;
  if(r.type==='work'){
    const ws=sortedView(S.records.filter(x=>x.type==='work'));const i=ws.findIndex(x=>x.id===r.id);const prev=ws[i-1],next=ws[i+1];
    const ph=(r.photos||[]).filter(p=>store.url(p));const big=ph[0];
    const exs=exhibitionsOf(r),aws=awardsOf(r);
    const extra=dl(['statement','phrase','source','script','plate','colors','method','note']);
    body=`${big?`<img class="dbig" src="${esc(store.url(big))}" alt="${esc(f.title||'')}" data-lb>`:`<div class="dbig empty">사진이 아직 없어요</div>`}
    ${ph.length>1?thumbs(ph.slice(1)):''}
    <h1>${esc(f.title||'(제목 없음)')}</h1>
    ${f.titleHan?`<p class="dsub2 han">${esc(f.titleHan)}</p>`:''}${f.titleEn?`<p class="dsub2">${esc(f.titleEn)}</p>`:''}
    <div class="tags" style="margin:8px 0 6px">${(r.genres||[]).map(g=>`<span class="pill">${esc(g)}</span>`).join('')}${Drafts.ids.has(r.id)?'<span class="pill draftpill">임시저장 있음</span>':''}</div>
    ${f.summary?`<p class="dsum">${esc(f.summary)}</p>`:''}
    ${sec('제작 정보',(()=>{const x=dl(['year','made','code','size','edition','medium','base','subject']);return x?`<dl class="dl">${x}</dl>`:''})())}
    ${sec('작품 해설',f.desc?`<p class="dtext">${esc(f.desc)}</p>`:'')}
    ${sec('영문 해설',f.descEn?`<p class="dtext" lang="en">${esc(f.descEn)}</p>`:'')}
    ${sec('전시 이력',exs.map(x=>`<div class="hist"><button class="linkrow" data-go="${x.id}"><span>${esc(exLine(x))}</span><span aria-hidden="true">›</span></button>${thumbs((x.photos||[]).filter(p=>p.slot==='ccover'||p.slot==='cpage'),'mini')}</div>`).join(''))}
    ${sec('수상 이력',aws.map(a=>`<div class="hist"><button class="linkrow" data-go="${a.id}"><span>${esc(awardLine(a))}</span><span aria-hidden="true">›</span></button>${thumbs((a.photos||[]).filter(p=>p.slot==='main'),'mini')}</div>`).join(''))}
    ${!exs.length&&!aws.length?`<p class="note">전시·수상 이력은 [수정하기]에서 바로 넣을 수 있어요.</p>`:''}
    ${sec('추가 정보',extra?`<dl class="dl">${extra}</dl>`:'')}
    <div class="pnav">${prev?`<button class="btn" data-pn="${prev.id}">‹ 이전 작품<small>${esc(prev.f.title||'')}</small></button>`:'<span></span>'}${next?`<button class="btn" data-pn="${next.id}">다음 작품 ›<small>${esc(next.f.title||'')}</small></button>`:'<span></span>'}</div>`;
  }else if(r.type==='exhibition'||r.type==='award'){
    const isEx=r.type==='exhibition';const ws=worksOf(r);
    const info=dl(isEx?['kind','y','start','end','venue','host','organizer']:['y','cat','prize','host','date']);
    const photos=T.slots.map(sl=>{const ps=(r.photos||[]).filter(p=>p.slot===sl.k&&store.url(p));return ps.length?`<div class="dslot"><span class="flabel">${sl.l} <small>${ps.length}장</small></span>${thumbs(ps)}</div>`:''}).join('');
    body=`<h1>${esc(f.title||'(제목 없음)')}</h1>
    <div class="tags" style="margin:8px 0 14px"><span class="pill type">${T.label}</span>${f.kind?`<span class="pill">${esc(f.kind)}</span>`:''}${(r.genres||[]).map(g=>`<span class="pill">${esc(g)}</span>`).join('')}</div>
    ${info?`<dl class="dl">${info}</dl>`:''}
    ${f.note?`<p class="dtext">${esc(f.note)}</p>`:''}
    <button class="btn primary wide" id="addev">${isEx?'자료·사진 추가':'자료·상장 추가'}</button>
    ${sec(isEx?'도록·전시 자료':'상장·자료',photos||`<p class="note">${isEx?'도록 표지, 내지, 작품 페이지, 전시장 사진':'상장, 도록 표지, 작품 페이지'}을 위 버튼으로 넣어 주세요.</p>`)}
    ${sec(isEx?`출품작 ${ws.length}점`:`수상작 ${ws.length}점`,ws.length?`<div class="list">${ws.map(card).join('')}</div>`:`<p class="note">작품의 [수정하기]에서 이 ${isEx?'전시':'상'}을 고르면 여기에 나와요.</p>`)}`;
  }else{
    const rows=T.fields.filter(fd=>f[fd.k]&&fd.k!=='title').map(fd=>{let v=f[fd.k];
      if(fd.t==='exsel'){const x=S.records.find(y=>y.id===v);return x?`<div class="dr"><dt>${fd.l}</dt><dd><button class="linkbtn" data-go="${x.id}">${esc(x.f.title)}</button></dd></div>`:''}
      if(fd.t==='date')v=fmtDate(v);return `<div class="dr"><dt>${fd.l}</dt><dd>${esc(v)}</dd></div>`}).join('');
    const photos=T.slots.map(sl=>{const ps=(r.photos||[]).filter(p=>p.slot===sl.k&&store.url(p));return ps.length?`<div class="dslot"><span class="flabel">${sl.l}</span>${thumbs(ps)}</div>`:''}).join('');
    const linked=S.records.filter(x=>x.f.exhibitionId===r.id);
    body=`<h1>${esc(f.title||'(제목 없음)')}</h1>
    <div class="tags" style="margin:8px 0 14px"><span class="pill type">${T.label}</span>${(r.genres||[]).map(g=>`<span class="pill">${esc(g)}</span>`).join('')}</div>
    ${photos}<dl class="dl">${rows||'<p class="note">적힌 정보가 없어요. 수정을 눌러 채워 보세요.</p>'}</dl>
    ${linked.length?sec('연결된 기록',`<div class="list">${linked.map(card).join('')}</div>`):''}`;
  }
  sh.innerHTML=`<div class="head"><div class="in"><button class="btn" id="cancel">‹ 목록</button><b>${head}</b><button class="btn primary" id="edit">수정하기</button></div></div><div class="wrap detail">${body}</div>`;
  if(!opts.replace)openSheet(opts.onClose||(()=>{hideSheet();render()}));else sh.scrollTop=0;
  const edit=()=>openEditor(self(),{fromDetail:true,onClose:reopen});
  sh.querySelector('#cancel').onclick=closeSheet;
  sh.querySelector('#edit').onclick=edit;
  sh.querySelector('#addev')?.addEventListener('click',edit);
  sh.querySelectorAll('img[data-lb]').forEach(im=>im.onclick=e=>{e.stopPropagation();lightbox(im.src)});
  sh.querySelectorAll('[data-pn]').forEach(b=>b.onclick=()=>openDetail(S.records.find(x=>x.id===b.dataset.pn),{replace:true}));
  sh.querySelectorAll('[data-go],.detail .card').forEach(b=>b.onclick=()=>openDetail(S.records.find(x=>x.id===(b.dataset.go||b.dataset.id)),{onClose:reopen}));
}
function pcard(r){const p=(r.photos||[])[0];const u=p&&store.url(p);const T=TYPES[r.type];
  return `<button class="pcard" data-id="${r.id}"><span class="pimg">${u?`<img src="${esc(u)}" alt="" loading="lazy">`:T.label[0]}</span><span class="pm"><b>${esc(r.f.title||'(제목 없음)')}</b>${Drafts.ids.has(r.id)?'<span class="pill draftpill">임시저장 있음</span>':''}<span>${esc(r.type==='work'?workTitles(r.f)||workMeta(r.f):subline(r))}</span>${r.type==='work'&&workTitles(r.f)?`<span>${esc(workMeta(r.f))}</span>`:''}</span></button>`}
function card(r){const p=(r.photos||[])[0];const T=TYPES[r.type];const nPh=(r.photos||[]).length;const u=p&&store.url(p);
  return `<button class="card" data-id="${r.id}">${u?`<img class="thumb" src="${esc(u)}" alt="" loading="lazy">`:`<span class="thumb">${T.label[0]}</span>`}
  <span class="meta"><span class="t">${esc(r.f.title||'(제목 없음)')}</span><span class="d">${esc(subline(r))}</span>
  <span class="tags"><span class="pill type">${T.label}</span>${(r.genres||[]).map(g=>`<span class="pill">${esc(g)}</span>`).join('')}${nPh?`<span class="pill">사진 ${nPh}</span>`:''}${Drafts.ids.has(r.id)?'<span class="pill draftpill">임시저장 있음</span>':''}</span></span></button>`}

/* ---------- editor ---------- */
async function openEditor(rec,opts={}){
  const isNew=!rec;const dkey=rec?rec.id:'new';
  const blank=()=>({id:uid(),type:S.ftype!=='all'?S.ftype:'work',f:{},genres:S.fgenre!=='all'?[S.fgenre]:[],photos:[],created:new Date().toISOString()});
  let r=rec?JSON.parse(JSON.stringify(rec)):blank();
  let restored=null;try{const d=await Drafts.get(dkey);if(d&&d.r&&(isNew||d.r.id===rec.id)){r=d.r;restored=d.ts||Date.now()}}catch(e){}
  const sh=$('#sheet');let confirmDel=false,busy=false,draft=null,helpQ=false,qa={},replaceAsk=false;
  let lx={y:'',title:'',venue:''},la={y:'',title:'',cat:'',prize:''},acFor=null;
  const DONE=()=>{};
  /* --- autosave --- */
  let tmr=null;
  const snapshot=()=>JSON.stringify({f:r.f,genres:r.genres,photos:r.photos.map(p=>p.path||(p.src||'').length),type:r.type});
  const origSnap=rec?JSON.stringify({f:rec.f,genres:rec.genres,photos:rec.photos.map(p=>p.path||(p.src||'').length),type:rec.type}):null;
  async function autosave(){clearTimeout(tmr);tmr=null;if(busy||!sh.querySelector('#ef'))return;collect();
    const empty=isNew&&!Object.values(r.f).some(v=>Array.isArray(v)?v.length:String(v||'').trim())&&!r.photos.length;
    if(empty||(origSnap&&snapshot()===origSnap)){if(Drafts.ids.has(dkey))await Drafts.del(dkey);return}
    try{await Drafts.put(dkey,{r:JSON.parse(JSON.stringify(r)),ts:Date.now()})}catch(e){}}
  const later=()=>{clearTimeout(tmr);tmr=setTimeout(autosave,600)};
  const onHide=()=>{if(document.visibilityState==='hidden'&&tmr)autosave()};
  document.addEventListener('visibilitychange',onHide);
  /* --- links (work only) --- */
  function linkHTML(){if(r.type!=='work')return'';const L=r.f.links||[];
    const exs=L.map(id=>S.records.find(x=>x.id===id)).filter(x=>x&&x.type==='exhibition');
    const aws=L.map(id=>S.records.find(x=>x.id===id)).filter(x=>x&&x.type==='award');
    const ac=(kind)=>{if(acFor!==kind)return'';const q=norm(kind==='ex'?lx.title:la.title);if(!q)return'';
      const pool=S.records.filter(x=>x.type===(kind==='ex'?'exhibition':'award')&&!L.includes(x.id)&&norm(x.f.title).includes(q)).slice(0,6);
      return pool.length?`<div class="aclist">${pool.map(x=>`<button type="button" data-ac="${x.id}">${esc(x.type==='award'?awardLine(x):exLine(x))}</button>`).join('')}</div>`:''};
    return `<div class="links"><h3>전시 이력</h3>
      ${exs.length?`<div class="lchips">${exs.map(x=>`<span class="lchip">${esc(exLine(x))}<button type="button" data-unlink="${x.id}" aria-label="연결 빼기">✕</button></span>`).join('')}</div>`:'<p class="note">아직 연결된 전시가 없어요.</p>'}
      <div class="laddrow"><input id="lx_y" inputmode="numeric" placeholder="연도" value="${esc(lx.y)}" aria-label="전시 연도"><div class="acwrap"><input id="lx_title" placeholder="전시명 (치면 이미 넣은 전시가 떠요)" value="${esc(lx.title)}" autocomplete="off" aria-label="전시명">${ac('ex')}</div><input id="lx_venue" placeholder="장소" value="${esc(lx.venue)}" aria-label="전시 장소"><button type="button" class="btn small" id="lx_add">추가</button></div>
      <h3>수상 이력</h3>
      ${aws.length?`<div class="lchips">${aws.map(x=>`<span class="lchip">${esc(awardLine(x))}<button type="button" data-unlink="${x.id}" aria-label="연결 빼기">✕</button></span>`).join('')}</div>`:'<p class="note">아직 연결된 수상이 없어요.</p>'}
      <div class="laddrow"><input id="la_y" inputmode="numeric" placeholder="연도" value="${esc(la.y)}" aria-label="수상 연도"><div class="acwrap"><input id="la_title" placeholder="대회·공모전명" value="${esc(la.title)}" autocomplete="off" aria-label="대회·공모전명">${ac('aw')}</div><input id="la_cat" placeholder="부문" value="${esc(la.cat)}" aria-label="부문"><input id="la_prize" placeholder="수상 내역 (특선 등)" value="${esc(la.prize)}" aria-label="수상 내역"><button type="button" class="btn small" id="la_add">추가</button></div>
      <p class="note">같은 이름·같은 연도는 새로 만들지 않고 이미 있는 기록에 연결해요. 도록·상장 사진은 저장한 뒤 그 전시·수상 기록에서 넣어요.</p></div>`}
  function readLinks(){const v=id=>sh.querySelector('#'+id)?.value??'';if(sh.querySelector('#lx_title')){lx={y:v('lx_y').trim(),title:v('lx_title'),venue:v('lx_venue')};la={y:v('la_y').trim(),title:v('la_title'),cat:v('la_cat'),prize:v('la_prize')}}}
  function link(id){r.f.links=[...new Set([...(r.f.links||[]),id])]}
  async function addLink(kind){readLinks();const o=kind==='ex'?lx:la;const t=o.title.trim();if(!t){toast(kind==='ex'?'전시명을 적어 주세요':'대회·공모전명을 적어 주세요');return}
    const type=kind==='ex'?'exhibition':'award';const y=(o.y.match(/\d{4}/)||[''])[0];
    let found=S.records.find(x=>x.type===type&&norm(x.f.title)===norm(t)&&(!y||!recYear(x)||recYear(x)===y));
    if(!found){const nr={id:uid(),type,f:kind==='ex'?{title:t,y,venue:o.venue.trim()}:{title:t,y,cat:o.cat.trim(),prize:o.prize.trim()},genres:[...r.genres],photos:[],created:new Date().toISOString()};
      try{found=await store.save(nr,null);S.records.push(found);toast(kind==='ex'?'새 전시를 만들고 연결했어요':'새 수상 기록을 만들고 연결했어요')}catch(e){toast(e.message);return}}
    else toast('이미 있는 기록에 연결했어요');
    link(found.id);if(kind==='ex')lx={y:'',title:'',venue:''};else la={y:'',title:'',cat:'',prize:''};acFor=null;draw();later()}
  function draw(){const T=TYPES[r.type];const keepY=sh.querySelector('.wrap')?.scrollTop;
    sh.innerHTML=`<div class="head"><div class="in"><button class="btn" id="cancel">닫기</button><b>${isNew?'새 기록':'기록 수정'}</b><button class="btn primary" id="save" ${busy?'disabled':''}>${busy?'저장 중…':'저장'}</button></div></div>
    <div class="wrap" style="padding-bottom:40px"><form class="form" id="ef" novalidate>
      ${restored?`<div class="banner draftb"><span>임시저장된 내용을 불러왔어요 <small>(${new Date(restored).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'numeric',minute:'2-digit'})})</small></span><button type="button" class="btn small" id="dropdraft">임시저장 버리기</button></div>`:''}
      ${isNew?`<div><span class="flabel">무엇을 기록할까요?</span><div class="typesel">${TYPE_ORDER.map(t=>`<button type="button" data-t="${t}" aria-pressed="${r.type===t}">${TYPES[t].label}</button>`).join('')}</div></div>`:''}
      ${fieldsHTML(T)}
      ${linkHTML()}
      ${r.type==='work'?`<div class="draft"><div class="sh2"><b>작품 설명 도우미</b><span class="actions"><button type="button" class="btn small primary" id="helpq">내 이야기로 쓰기</button><button type="button" class="btn small" id="mkdraft">입력한 내용으로 초안</button></span></div>
        <p class="note">직접 쓰셔도 되고, 쓰기 어려우면 질문에 짧게 답해 보세요. 작가님이 적은 소재와 이야기로 초안을 엮어 드려요.</p>
        ${helpQ?`<div class="form">${HELPQ.map(([k,l,ph])=>`<div class="field"><label for="hq_${k}">${l}</label><textarea id="hq_${k}" rows="2" placeholder="${ph}">${esc(qa[k]||'')}</textarea></div>`).join('')}
          <div class="actions"><button type="button" class="btn small primary" id="qadraft">답으로 초안 만들기</button></div></div>`:''}
        ${draft?`<div class="draftbox">${esc(draft.ko)}${draft.en?`<hr><span lang="en">${esc(draft.en)}</span>`:''}</div><div class="actions">${replaceAsk?`<span class="note">이미 적힌 긴 설명이 있어요. 초안으로 바꿀까요?</span><button type="button" class="btn small primary" id="usedraft2">바꾸기</button><button type="button" class="btn small" id="nodraft">그대로 두기</button>`:`<button type="button" class="btn small primary" id="usedraft">이 초안을 긴 설명에 넣기</button>`}</div>`:''}</div>`:''}
      <div><span class="flabel">장르 (여러 개 선택 가능)</span><div class="checks">${[...S.settings.genres,...r.genres.filter(g=>!S.settings.genres.includes(g))].map((g,i)=>`<label><input type="checkbox" id="g${i}" value="${esc(g)}" ${r.genres.includes(g)?'checked':''}>${esc(g)}</label>`).join('')}</div>
        <div class="field" style="margin-top:8px"><label for="gother">기타 (목록에 없으면 직접 입력)</label><input id="gother" placeholder="예: 판각캘리그라피, 도자, 섬유미술"></div></div>
      ${T.slots.map(s=>slotHTML(s)).join('')}
      ${!isNew?`<div class="confirm">${confirmDel?`정말 지울까요? 되돌릴 수 없어요. <button type="button" class="btn small danger" id="delyes">지우기</button><button type="button" class="btn small" id="delno">취소</button>`:`<button type="button" class="btn small danger" id="del">이 기록 지우기</button>`}</div>`:''}
    </form></div>`;
    if(keepY)sh.querySelector('.wrap').scrollTop=keepY;
    sh.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{collect();r.type=b.dataset.t;draw();later()});
    sh.querySelector('#cancel').onclick=()=>{if(tmr)autosave();closeSheet()};
    sh.querySelector('#save').onclick=save;
    sh.querySelector('#ef').onsubmit=e=>{e.preventDefault();save()};
    sh.querySelector('#ef').addEventListener('input',e=>{if(/^(lx_|la_)/.test(e.target.id||''))return;later();if(e.target.id==='f_summary'||e.target.id==='f_desc'||e.target.id==='f_descEn')tools()});
    sh.querySelector('#ef').addEventListener('change',e=>{if(!/^(lx_|la_)/.test(e.target.id||''))later()});
    sh.querySelector('#dropdraft')?.addEventListener('click',async()=>{await Drafts.del(dkey);r=rec?JSON.parse(JSON.stringify(rec)):blank();restored=null;draw();toast('임시저장을 버렸어요')});
    sh.querySelectorAll('input[type=file]').forEach(inp=>inp.onchange=async()=>{collect();const slot=inp.dataset.slot;
      if(!inp.multiple)r.photos=r.photos.filter(p=>p.slot!==slot);
      for(const f of inp.files){try{r.photos.push({slot,src:await shrink(f)})}catch(e){toast('이미지를 읽지 못했어요: '+f.name)}}draw();later()});
    sh.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{collect();r.photos.splice(+b.dataset.rm,1);draw();later()});
    sh.querySelectorAll('.photos img').forEach(im=>im.onclick=()=>lightbox(im.src));
    /* links */
    ['lx_title','la_title'].forEach(id=>{const el=sh.querySelector('#'+id);if(!el)return;el.oninput=()=>{const pos=el.selectionStart;readLinks();acFor=id==='lx_title'?'ex':'aw';collect();draw();const n=sh.querySelector('#'+id);n.focus();n.setSelectionRange(pos,pos)}});
    ['lx_y','lx_venue','la_y','la_cat','la_prize'].forEach(id=>{const el=sh.querySelector('#'+id);if(el)el.oninput=readLinks});
    sh.querySelectorAll('[data-ac]').forEach(b=>b.onclick=()=>{collect();link(b.dataset.ac);if(acFor==='ex')lx={y:'',title:'',venue:''};else la={y:'',title:'',cat:'',prize:''};acFor=null;draw();later();toast('연결했어요')});
    sh.querySelectorAll('[data-unlink]').forEach(b=>b.onclick=()=>{collect();r.f.links=(r.f.links||[]).filter(x=>x!==b.dataset.unlink);draw();later()});
    sh.querySelector('#lx_add')?.addEventListener('click',()=>{collect();addLink('ex')});
    sh.querySelector('#la_add')?.addEventListener('click',()=>{collect();addLink('aw')});
    ['lx_title','lx_venue','la_title','la_prize'].forEach(id=>sh.querySelector('#'+id)?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();collect();addLink(id.startsWith('lx')?'ex':'aw')}}));
    /* summary & desc tools */
    sh.querySelector('#pick1')?.addEventListener('click',()=>{collect();const d=String(r.f.desc||'').trim();if(!d){toast('긴 설명을 먼저 적어 주세요');return}
      const m=d.match(/^[\s\S]*?[.!?。](?=\s|$)/);r.f.summary=(m?m[0]:d.split('\n')[0]).trim();draw();later();toast('긴 설명의 첫 문장을 넣었어요')});
    sh.querySelector('#fixko')?.addEventListener('click',()=>{collect();r.f.desc=fixStart(r.f.desc,r.f,'ko');draw();later();toast('제목으로 시작하게 고쳤어요')});
    sh.querySelector('#fixen')?.addEventListener('click',()=>{collect();r.f.descEn=fixStart(r.f.descEn,r.f,'en');draw();later();toast('Fixed the opening')});
    tools();
    const readQ=()=>{for(const [k] of HELPQ){const el=sh.querySelector('#hq_'+k);if(el)qa[k]=el.value.trim()}};
    const put=()=>{r.f.desc=draft.ko;if(draft.en&&!r.f.descEn)r.f.descEn=draft.en;if(!r.f.summary){const m=draft.ko.match(/^[\s\S]*?[.!?。](?=\s|$)/);if(m)r.f.summary=m[0].trim()}draft=null;replaceAsk=false;draw();later();toast('긴 설명 칸에 넣었어요. 고쳐서 저장하세요');sh.querySelector('#f_desc')?.focus()};
    sh.querySelector('#mkdraft')?.addEventListener('click',()=>{collect();readQ();draft=makeDraft(r.f,qa);replaceAsk=false;draw();sh.querySelector('.draftbox')?.scrollIntoView({block:'center'})});
    sh.querySelector('#helpq')?.addEventListener('click',()=>{collect();helpQ=!helpQ;if(helpQ&&!qa.what)qa={what:r.f.subject||'',how:r.f.medium||'',heart:r.f.statement||'',feel:''};draw();sh.querySelector('#hq_what')?.focus()});
    sh.querySelector('#qadraft')?.addEventListener('click',()=>{collect();readQ();draft=makeDraft(r.f,qa);replaceAsk=false;draw();sh.querySelector('.draftbox')?.scrollIntoView({block:'center'})});
    sh.querySelector('#usedraft')?.addEventListener('click',()=>{collect();readQ();if(r.f.desc){replaceAsk=true;draw();return}put()});
    sh.querySelector('#usedraft2')?.addEventListener('click',()=>{collect();readQ();put()});
    sh.querySelector('#nodraft')?.addEventListener('click',()=>{collect();readQ();replaceAsk=false;draw()});
    sh.querySelector('#del')?.addEventListener('click',()=>{collect();confirmDel=true;draw()});
    sh.querySelector('#delno')?.addEventListener('click',()=>{confirmDel=false;draw()});
    sh.querySelector('#delyes')?.addEventListener('click',async()=>{try{await store.remove(rec);await Drafts.del(dkey);S.records=S.records.filter(x=>x.id!==r.id);S.records.forEach(w=>{if(w.f.links?.includes(r.id))w.f.links=w.f.links.filter(x=>x!==r.id)});closeSheet();toast('기록을 지웠어요')}catch(e){toast(e.message)}});
  }
  function tools(){const sm=sh.querySelector('#f_summary');const c=sh.querySelector('#sumcnt');if(sm&&c){const n=[...sm.value.trim()].length;c.textContent=`${n}자${n>70?' · 조금 길어요 (50자 안팎 권장)':n&&n<20?' · 조금 짧아요':''}`;c.classList.toggle('warn',n>70)}
    const w=(id,boxId,lang)=>{const el=sh.querySelector('#'+id),box=sh.querySelector('#'+boxId);if(!el||!box)return;const bad=badStart(el.value,lang);
      box.innerHTML=bad?`<div class="warnline">${lang==='ko'?'설명이 "이 작품은"으로 시작해요. 제목으로 시작하면 더 좋아요.':'Starts with "This work". Starting with the title reads better.'} <button type="button" class="btn small" id="${lang==='ko'?'fixko':'fixen'}">자동 고치기</button></div>`:'';
      box.querySelector('button')?.addEventListener('click',()=>{collect();if(lang==='ko')r.f.desc=fixStart(r.f.desc,r.f,'ko');else r.f.descEn=fixStart(r.f.descEn,r.f,'en');draw();later();toast('제목으로 시작하게 고쳤어요')})};
    w('f_desc','warnko','ko');w('f_descEn','warnen','en')}
  function fieldsHTML(T){const main=T.fields.filter(f=>!f.grp);let h=fieldsList(main);
    const G={calli:'문구 · 출처 · 서체 기록 (서예·캘리그라피)',print:'판화 기법 기록'};
    for(const g of Object.keys(G)){const fs=T.fields.filter(f=>f.grp===g);if(!fs.length)continue;const open=fs.some(f=>r.f[f.k]);
      h+=`<details class="grp" ${open?'open':''}><summary>${G[g]} <small>(선택)</small></summary><div class="form">${fieldsList(fs)}</div></details>`}
    return h}
  function fieldsList(list){let h='',buf=[];const flush=()=>{if(buf.length){h+=`<div class="row2">${buf.join('')}</div>`;buf=[]}};
    for(const fd of list){const v=r.f[fd.k]??'';const id='f_'+fd.k;let inp;
      if(fd.t==='area')inp=`<textarea id="${id}" placeholder="${esc(fd.ph||'')}">${esc(v)}</textarea>`;
      else if(fd.t==='select')inp=`<select id="${id}">${fd.req?`<option value="" ${v?'':'selected'}>골라 주세요</option>`:''}${fd.opts.map(o=>`<option ${v===o?'selected':''}>${o}</option>`).join('')}</select>`;
      else if(fd.t==='exsel'){const exs=sorted(S.records.filter(x=>x.type==='exhibition'));inp=`<select id="${id}"><option value="">연결 안 함</option>${exs.map(x=>`<option value="${x.id}" ${v===x.id?'selected':''}>${esc(x.f.title)} (${esc(recYear(x))})</option>`).join('')}</select>${exs.length?'':'<small class="note">아직 기록한 전시가 없어요. 전시를 먼저 추가하면 여기서 고를 수 있어요. 지금은 저장해 두고 나중에 연결해도 돼요.</small>'}`}
      else inp=`<input id="${id}" type="${fd.t||'text'}" value="${esc(v)}" placeholder="${esc(fd.ph||'')}" ${fd.t==='number'?'inputmode="numeric"':''}>`;
      if(fd.k==='summary')inp+=`<div class="sumtools"><span id="sumcnt" class="note"></span><button type="button" class="btn small" id="pick1">긴 설명에서 한 줄 뽑기</button></div>`;
      if(fd.k==='desc')inp+=`<div id="warnko"></div>`;
      if(fd.k==='descEn')inp+=`<div id="warnen"></div>`;
      const el=`<div class="field"><label for="${id}">${fd.l}${fd.req?' *':''}</label>${inp}</div>`;
      if(fd.half)buf.push(el);else{flush();h+=el}}
    flush();return h}
  function slotHTML(s){const ph=r.photos.map((p,i)=>[p,i]).filter(([p])=>p.slot===s.k);
    return `<div class="slot"><div class="sh"><b>${s.l}${s.need?` <em class="need ${s.need==='필수'?'req':''}">${s.need}</em>`:''}${s.hint?`<small>${s.hint}</small>`:''}</b>
      <span class="btn small filebtn">${ph.length&&!s.multi?'바꾸기':'사진 추가'}<input type="file" accept="image/*" data-slot="${s.k}" ${s.multi?'multiple':''} aria-label="${s.l} 사진 추가"></span></div>
      ${ph.length?`<div class="photos">${ph.map(([p,i])=>`<div class="pghead"><img src="${esc(store.url(p))}" alt="${s.l}"><button type="button" data-rm="${i}" aria-label="사진 빼기">✕</button></div>`).join('')}</div>`:`<div class="note">아직 사진이 없어요.</div>`}</div>`}
  function collect(){if(!sh.querySelector('#ef'))return;const T=TYPES[r.type];for(const fd of T.fields){const el=sh.querySelector('#f_'+fd.k);if(el)r.f[fd.k]=el.value.trim()}
    const cb=[...sh.querySelectorAll('.checks input')];if(cb.length)r.genres=cb.filter(c=>c.checked).map(c=>c.value);
    const go=sh.querySelector('#gother');if(go&&go.value.trim()){for(const g of go.value.split(/[,·]/).map(x=>x.trim()).filter(Boolean))if(!r.genres.includes(g))r.genres.push(g);go.value=''}}
  async function save(){if(busy)return;clearTimeout(tmr);tmr=null;collect();if(!r.f.title){toast(TYPES[r.type].fields[0].l+'을(를) 적어 주세요');sh.querySelector('#f_title')?.focus();return}
    const miss=TYPES[r.type].fields.find(fd=>fd.req&&fd.k!=='title'&&!r.f[fd.k]);if(miss){toast(miss.l+'을(를) 골라 주세요');sh.querySelector('#f_'+miss.k)?.focus();return}
    const keep=new Set(TYPES[r.type].slots.map(s=>s.k));r.photos=r.photos.filter(p=>keep.has(p.slot));
    // 화면에 쓰지 않는 칸 정리
    const fk=new Set([...TYPES[r.type].fields.map(f=>f.k),'links','workId']);for(const k of Object.keys(r.f))if(!fk.has(k))delete r.f[k];
    if(r.type!=='work')delete r.f.links;
    if(r.type==='work'&&(!rec||rec.type!=='work')&&S.plan){const n=S.records.filter(x=>x.type==='work').length;
      if(n>=S.plan.work_limit){toast(`지금 등급(${PLANS[S.plan.plan]?.l||'무료'})에서는 작품을 ${S.plan.work_limit}점까지 올릴 수 있어요`);return}}
    if(r.type==='work'){const y=r.f.year||(String(r.f.made||'').match(/\d{4}/)||[])[0];if(!r.f.year&&y)r.f.year=y;
      if(!r.f.code&&y){const pre=y.slice(2);const used=S.records.filter(x=>x.type==='work'&&x.id!==r.id).map(x=>String(x.f.code||'')).filter(c=>c.startsWith(pre)&&c.length===4).map(c=>+c.slice(2));
        let n=1;while(used.includes(n))n++;r.f.code=pre+String(n).padStart(2,'0')}}
    if((r.type==='exhibition'||r.type==='award')&&!r.f.y){const y=(String(r.f.start||r.f.date||'').match(/\d{4}/)||[])[0];if(y)r.f.y=y}
    busy=true;draw();
    try{const saved=await store.save(r,rec);if(S.plan&&r.type==='work'&&!rec)S.plan.work_count++;saved.updated=new Date().toISOString();
      const i=S.records.findIndex(x=>x.id===r.id);if(i>=0)S.records[i]=saved;else S.records.push(saved);
      await Drafts.del(dkey);
      const ng=r.genres.filter(g=>!S.settings.genres.includes(g));if(ng.length){S.settings.genres.push(...ng);try{await store.setSettings(S.settings)}catch(e){}}
      document.removeEventListener('visibilitychange',onHide);
      if(isNew&&!opts.fromDetail){openDetail(S.records.find(x=>x.id===saved.id),{replace:true});sheetStack[sheetStack.length-1]=()=>{hideSheet();render()}}
      else closeSheet();toast('저장했어요')}
    catch(e){busy=false;draw();toast(/WORK_LIMIT/.test(e.message+(e.cause||''))?'지금 등급에서 올릴 수 있는 작품 수를 넘었어요':e.message)}}
  draw();
  openSheet(()=>{document.removeEventListener('visibilitychange',onHide);if(opts.onClose)opts.onClose();else{hideSheet();render()}});
}
function badStart(t,lang){t=String(t||'').trim();return lang==='ko'?/^이\s*작품(은|는|에서|에는)?/.test(t):/^this\s+(work|piece|artwork)\b/i.test(t)}
function fixStart(t,f,lang){t=String(t||'').trim();if(lang==='ko'){const ti=f.title||'';if(!ti)return t.replace(/^이\s*작품(은|는)\s*/,'');return t.replace(/^이\s*작품(은|는)?\s*/,`「${ti}」${josa(ti,'은','는')} `)}
  const te=f.titleEn||f.title||'';return t.replace(/^this\s+(work|piece|artwork)\b/i,te?`"${te}"`:'It')}

/* ---------- output ---------- */
function applyPreset(k){const p=PRESETS[k];S.out.preset=k;S.out.types=[...p.types];S.out.years=p.years;S.out.photos=p.photos;S.out.layout=p.layout||'list';
  S.out.genres=p.oneGenre?[S.settings.genres[0]]:[...S.settings.genres];S.out.title=p.oneGenre?`${S.settings.genres[0]} 포트폴리오`:p.title}
function selection(){const o=S.out;const cut=o.years?`${new Date().getFullYear()-o.years+1}-01-01`:'';
  const one=PRESETS[o.preset].oneGenre;
  const contest=new Set(PRESETS[o.preset].noContest?S.records.filter(r=>r.type==='exhibition'&&r.f.kind==='공모전').map(r=>r.id):[]);
  return sorted(S.records.filter(r=>!contest.has(r.id)&&!(r.type==='catalog'&&contest.has(r.f.exhibitionId))&&o.types.includes(r.type)&&((r.genres||[]).some(g=>o.genres.includes(g))||(!one&&!(r.genres||[]).length))&&(!cut||dateOf(r)>=cut)&&!(r.type==='work'&&o.skip.includes(r.id))))}
function orderedWorks(sel){const o=S.out;const ws=sel.filter(r=>r.type==='work');const idx=id=>{const i=o.order.indexOf(id);return i<0?1e9:i};
  return ws.sort((a,b)=>idx(a.id)-idx(b.id)||byDate(a,b))}
function candidateWorks(){const o=S.out;const keep=o.skip;o.skip=[];const all=orderedWorks(selection());o.skip=keep;return all}
function workTitles(f){return [f.titleHan,f.titleEn].filter(Boolean).join(' / ')}
function workMeta(f){return [f.year,f.medium,f.size,f.edition].filter(Boolean).join(' · ')}
function awardsFor(r){return awardsOf(r).map(awardLine)}
function line(r){const f=r.f;switch(r.type){
  case'exhibition':{const hs=[f.host&&f.host!==f.venue&&'주최 '+f.host,f.organizer&&'주관 '+f.organizer].filter(Boolean).join(', ');return`「${f.title}」${f.kind?' '+f.kind:''}${f.venue?', '+f.venue:''}${hs?' ('+hs+')':''}`}
  case'award':return`${f.title}${f.cat?' '+f.cat+' 부문':''}${f.prize?' '+f.prize:''}${f.host?' ('+f.host+')':''}`;
  case'class':return`「${f.title}」${f.org?', '+f.org:''}${f.sessions?' ('+f.sessions+')':''}`;
  case'catalog':return`『${f.title}』${f.publisher?', '+f.publisher:''}${f.pages?', '+f.pages:''}`;
  case'work':return`「${f.title}」${f.titleEn?' '+f.titleEn:''}${[f.year,f.medium,f.size,f.edition].filter(Boolean).map(x=>', '+x).join('')}`}}
function evPhotos(r,lc){const ORD=['ccover','cinner','cpage','venue','works','poster','main'];const CM={cover:'ccover',colophon:'cinner',mypage:'cpage'};
  const out=[];lc.forEach(c=>TYPES.catalog.slots.forEach(sl=>c.photos.filter(p=>p.slot===sl.k).forEach(p=>out.push({p,l:'도록 '+sl.l,k:CM[sl.k]}))));
  TYPES.exhibition.slots.forEach(sl=>r.photos.filter(p=>p.slot===sl.k).forEach(p=>out.push({p,l:sl.l,k:sl.k})));
  return out.map((x,i)=>[x,i]).sort((a,b)=>ORD.indexOf(a[0].k)-ORD.indexOf(b[0].k)||a[1]-b[1]).map(a=>a[0])}
function docBody(img=p=>store.url(p),listOnly=false){const o=S.out,sel=selection();const by=t=>sel.filter(r=>r.type===t);const yr=r=>{const d=dateOf(r);return d?d.slice(0,4)+(d.length>4?'. '+(+d.slice(5,7)):''):''};
  const ul=arr=>`<ul>${arr.map(r=>`<li><span class="y">${yr(r)}</span><span>${esc(line(r))}</span></li>`).join('')}</ul>`;
  const exs=by('exhibition'),solo=exs.filter(r=>r.f.kind==='개인전'),group=exs.filter(r=>r.f.kind!=='개인전');
  const range=o.years?`최근 ${o.years}년 (${new Date().getFullYear()-o.years+1}–${new Date().getFullYear()})`:'전체 기간';
  let h=listOnly?'':`<h1>${esc(o.title||'활동 기록')}</h1><div class="dsub">${esc(S.settings.name||'작가')} · ${esc(o.genres.length>=S.settings.genres.length?'전체 분야':o.genres.join(', '))} · ${range}</div>`;
  const st=S.settings;const lines=t=>`<ul class="plain">${String(t).split('\n').map(x=>x.trim()).filter(Boolean).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
  if(!listOnly&&o.preset==='assoc'){if(st.edu)h+=`<h2>학력</h2>`+lines(st.edu);if(st.current)h+=`<h2>현재</h2>`+lines(st.current)}
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
    const fig=(p,l)=>`<figure><img src="${esc(img(p))}" alt=""><figcaption>${esc(l)}</figcaption></figure>`;
    const EVORD={exhibition:['ccover','cinner','cpage','venue','works','poster','main']};const slotsOf=r=>{const o=EVORD[r.type],sl=TYPES[r.type].slots;return o?o.map(k=>sl.find(x=>x.k===k)).filter(Boolean):sl};
    const photosOf=(r,pre='')=>slotsOf(r).flatMap(sl=>r.photos.filter(p=>p.slot===sl.k).map(p=>fig(p,pre+sl.l))).join('');
    const cats=by('catalog');const usedCat=new Set();let evh='';
    for(const r of exs){const f=r.f;const lc=cats.filter(c=>c.f.exhibitionId===r.id);lc.forEach(c=>usedCat.add(c.id));
      const ph=evPhotos(r,lc).map(x=>fig(x.p,x.l)).join('');
      if(!ph&&!lc.length)continue;
      evh+=`<div class="ev"><h3>${f.kind?`[${esc(f.kind)}] `:'전시 · '}「${esc(f.title)}」</h3>
        <table class="evinfo">${[['구분',f.kind],['기간',fmtRange(f.start,f.end)],['장소',f.venue],['주최',f.host],['주관',f.organizer],...lc.map(c=>['도록',`『${c.f.title}』${c.f.publisher?', '+c.f.publisher:''}${c.f.date?', '+fmtDate(c.f.date)+' 발행':''}${c.f.pages?', 수록 '+c.f.pages:''}`])].filter(x=>x[1]).map(([k,v])=>`<tr><th>${k}</th><td>${esc(v)}</td></tr>`).join('')}</table>
        ${ph?`<div class="grid">${ph}</div>`:''}</div>`}
    for(const r of [...cats.filter(c=>!usedCat.has(c.id)),...by('award'),...by('class')].filter(r=>r.photos.length))
      evh+=`<div class="ev"><h3>${esc(TYPES[r.type].label)} · ${esc(line(r))}${dateOf(r)?' · '+fmtDate(dateOf(r)):''}</h3><div class="grid">${photosOf(r)}</div></div>`;
    if(evh)h+=`<h2 class="evh">증빙 자료</h2>`+evh;
  }
  h+=`<div class="foot">작성일 ${fmtDate(new Date().toISOString().slice(0,10))}</div>`;return h}
function bookPages(img=p=>store.url(p)){const o=S.out,st=S.settings,sel=selection();
  const pages=[];const awards=sorted(sel.filter(r=>r.type==='award')).slice(0,8);
  pages.push(`<section class="page cover"><div class="cv-top">PORTFOLIO</div>
    <div class="cv-mid">${st.photo?`<img class="cv-photo" src="${esc(st.photo)}" alt="">`:''}<h1>${esc(o.title||st.ptitle||'포트폴리오')}</h1><div class="cv-name">${esc(st.name||'')}</div>
    ${st.tagline?`<p class="cv-tag">${esc(st.tagline)}</p>`:''}${st.bio?`<p class="cv-bio">${esc(st.bio)}</p>`:''}
    ${awards.length?`<ul class="cv-aw">${awards.map(a=>`<li>${esc([(a.f.date||'').slice(0,4),a.f.title,a.f.prize].filter(Boolean).join(' '))}</li>`).join('')}</ul>`:''}</div>
    <div class="cv-bot"><span>${esc(o.genres.join(' · '))}</span>${[st.pemail,st.insta,st.web].filter(Boolean).length?`<span>${esc([st.pemail,st.insta,st.web].filter(Boolean).join('  ·  '))}</span>`:''}</div></section>`);
  if(sel.some(r=>r.type==='exhibition'||r.type==='catalog'||r.type==='class')){pages.push(`<section class="page cvpage doc"><h2 class="pghead">약력</h2>${docBody(img,true)}</section>`)}
  for(const r of orderedWorks(sel)){const ps=r.photos.filter(p=>p.slot==='main');const f=r.f;const aw=awardsFor(r);const exs=exhibitionsOf(r).map(exLine);
    const d=o.desc==='none'?'':[o.desc!=='en'&&f.desc,o.desc!=='ko'&&f.descEn].filter(Boolean).map(t=>`<p>${esc(t)}</p>`).join('');
    pages.push(`<section class="page workpage"><div class="wimg">${ps[0]?`<img src="${esc(img(ps[0]))}" alt="">`:'<div class="noimg">사진 없음</div>'}</div>
    <div class="wcap"><b>${esc(f.title)}</b>${workTitles(f)?`<span class="wsub">${esc(workTitles(f))}</span>`:''}<span>${esc(workMeta(f))}</span>${f.summary?`<span class="wsum">${esc(f.summary)}</span>`:''}${exs.length?`<span class="whist"><em>전시</em> ${exs.map(esc).join(' / ')}</span>`:''}${aw.length?`<span class="whist"><em>수상</em> ${aw.map(esc).join(' / ')}</span>`:''}${d}</div>
    ${ps.length>1&&!d?`<div class="wmore">${ps.slice(1,4).map(p=>`<img src="${esc(img(p))}" alt="">`).join('')}</div>`:''}</section>`)}
  if(o.photos&&o.evpages){const ev=sel.filter(r=>r.type!=='work'&&r.photos.length);
    for(const r of ev)pages.push(`<section class="page evpage"><h2 class="pghead">${esc(TYPES[r.type].label)}</h2><h3>${esc(line(r))}</h3><div class="grid">${TYPES[r.type].slots.flatMap(s=>r.photos.filter(p=>p.slot===s.k).map(p=>`<figure><img src="${esc(img(p))}" alt=""><figcaption>${esc(s.l)}</figcaption></figure>`)).join('')}</div></section>`)}
  if(!sel.length)pages.push(`<section class="page"><p>조건에 맞는 기록이 없어요. 장르·기간·항목을 바꿔 보세요.</p></section>`);
  return pages.join('')}
function plainText(){const sel=selection();const groups=[['개인전',r=>r.type==='exhibition'&&r.f.kind==='개인전'],['단체전·초대전',r=>r.type==='exhibition'&&r.f.kind!=='개인전'],['수상',r=>r.type==='award'],['도록·출판',r=>r.type==='catalog'],['강의·워크숍',r=>r.type==='class'],['작품',r=>r.type==='work']];
  const st=S.settings;const pre=S.out.preset==='assoc'?[st.edu&&'[학력]\n'+st.edu.trim(),st.current&&'[현재]\n'+st.current.trim()].filter(Boolean):[];
  return [...pre,...groups.map(([n,fn])=>{const a=sel.filter(fn);return a.length?`[${n}]${n==='개인전'||n==='단체전·초대전'?' '+a.length+'회':''}\n`+a.map(r=>`${dateOf(r).slice(0,4)}  ${line(r)}`).join('\n'):''})].filter(Boolean).join('\n\n')}
function workOrderHTML(){const ws=candidateWorks();const o=S.out;
  if(!ws.length)return '';
  return `<div class="section"><div class="sh2"><h2>넣을 작품 ${ws.length-ws.filter(w=>o.skip.includes(w.id)).length}점</h2><button class="btn small" id="oyear">제작연도 순으로</button></div>
  <div class="worder">${ws.map((w,i)=>`<div class="wo"><label><input type="checkbox" data-wk="${w.id}" ${o.skip.includes(w.id)?'':'checked'}><span>${i+1}. ${esc(w.f.title)}${w.f.year?` <small>${esc(w.f.year)}</small>`:''}</span></label>
    <span class="mv"><button class="btn small" data-up="${i}" ${i===0?'disabled':''} aria-label="위로">위</button><button class="btn small" data-dn="${i}" ${i===ws.length-1?'disabled':''} aria-label="아래로">아래</button></span></div>`).join('')}</div></div>`}
function viewOut(){const o=S.out;const sel=selection();const one=PRESETS[o.preset].oneGenre;
  $('#app').innerHTML=`<div class="top"><div><h1>골라서 출력</h1><div class="sub">제출처를 고르면 필요한 항목만 모아 문서로 만들어요</div></div></div>
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
    <p>표지에는 고른 기록 중 수상 내역이 자동으로 들어가요.</p>
    <label class="consent"><input type="checkbox" id="oev" ${o.evpages?'checked':''}> 수상·전시 자료(상장·도록 사진) 페이지 넣기</label></div>`:''}
  ${o.types.includes('work')?workOrderHTML():''}
  <div class="section">
    <p>골라진 기록 <b>${sel.length}</b>건${sel.some(r=>r.type==='work')?` (작품 ${sel.filter(r=>r.type==='work').length}점)`:''}</p>
    <div class="actions"><button class="btn primary" id="preview">미리보기</button><button class="btn" id="copy">약력 글로 복사</button>${o.preset==='artproof'?'<button class="btn" id="entry">사이트 입력용 (항목별 복사)</button>':''}</div>${o.preset==='artproof'?'<p class="note">예술인활동증명은 재단 사이트에 활동을 하나씩 입력해요. <b>사이트 입력용</b>을 누르면 전시마다 칸별 복사 버튼과 증빙 사진 받기가 나와요.</p>':''}
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
  $('#oyear')?.addEventListener('click',()=>{o.order=[...ws].sort(byDate).map(w=>w.id);render()});
  const prof=async()=>{S.settings.name=$('#pname').value.trim();S.settings.tagline=$('#ptag').value.trim();S.settings.bio=$('#pbio').value.trim();try{await store.setSettings(S.settings)}catch(e){toast(e.message)}};
  ['#pname','#ptag','#pbio'].forEach(id=>{const el=$(id);if(el)el.onchange=prof});
  $('#oev')?.addEventListener('change',e=>{o.evpages=e.target.checked});
  $('#preview').onclick=async()=>{upd();await store.photoURLs(selection());openPreview()};
  $('#entry')?.addEventListener('click',async()=>{upd();await store.photoURLs(selection());openEntry()});
  $('#copy').onclick=async()=>{upd();const t=plainText()||'조건에 맞는 기록이 없어요.';try{await navigator.clipboard.writeText(t);toast('약력을 복사했어요')}catch(e){openPreview(t)}};
}
function pdfName(base){const d=new Date();const day=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const b=`${safeName(base)||'JALP'}_${day}`;let used=[];try{used=JSON.parse(localStorage.getItem('pdfNames')||'[]')}catch(e){}
  let n=b,i=2;while(used.includes(n))n=`${b} (${i++})`;used.push(n);try{localStorage.setItem('pdfNames',JSON.stringify(used.slice(-200)))}catch(e){}return n}
function openPreview(text){const sh=$('#sheet');
  sh.innerHTML=`<div class="head"><div class="in"><button class="btn" id="cancel">닫기</button><b>${text?'약력 글':'미리보기'}</b>${text?'<span></span>':'<button class="btn primary" id="print">인쇄 / PDF 저장</button>'}</div></div>
  <div class="wrap">${text?`<p class="note">아래 글을 길게 눌러 전체 선택한 뒤 복사하세요.</p><div class="field"><textarea id="ptext" style="min-height:60vh" readonly>${esc(text)}</textarea></div>`:(S.out.layout==='book'?`<div class="docwrap"><div class="book">${bookPages()}</div></div>`:`<div class="docwrap"><div class="doc">${docBody()}</div></div>`)}</div>`;
  openSheet();
  sh.querySelector('#cancel').onclick=closeSheet;
  if(text){const ta=sh.querySelector('#ptext');ta.focus();ta.select()}
  sh.querySelector('#print')?.addEventListener('click',async()=>{
    const imgs=[...sh.querySelectorAll('.doc img,.book img')];await Promise.all(imgs.map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r})));
    const t=document.title;document.title=pdfName(S.out.title||'JALP');window.print();document.title=t});
}

/* ---------- 예술인활동증명 사이트 입력 도우미 ---------- */
function inviteLink(code){return location.origin+location.pathname+'?invite='+encodeURIComponent(code)}
async function copyText(t){try{await navigator.clipboard.writeText(t);return true}catch(e){const ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand('copy')}catch(_){}ta.remove();return ok}}
function safeName(t){return String(t||'').replace(/[\\/:*?"<>|]+/g,' ').replace(/\s+/g,' ').trim().slice(0,40)}
async function downloadPhoto(url,name){try{const res=await fetch(url);const blob=await res.blob();const ext=(blob.type.split('/')[1]||'jpg').replace('jpeg','jpg');
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name+'.'+ext;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000);return true}catch(e){console.error("dl",e);window.open(url,"_blank");return false}}
function entryItems(){const sel=selection();const cats=S.records.filter(r=>r.type==='catalog');
  return sel.filter(r=>r.type==='exhibition').map(r=>{const f=r.f;const lc=cats.filter(c=>c.f.exhibitionId===r.id);
    const photos=evPhotos(r,lc);
    const rows=[['활동명(전시명)',f.title],['구분',f.kind],['시작일',f.start?f.start.replace(/-/g,'.'):''],['종료일',f.end?f.end.replace(/-/g,'.'):''],['기간',fmtRange(f.start,f.end)],['장소',f.venue],['주최',f.host],['주관',f.organizer],
      ...lc.map(c=>['도록',`${c.f.title||''}${c.f.publisher?', '+c.f.publisher:''}${c.f.date?', '+fmtDate(c.f.date)+' 발행':''}${c.f.pages?', 수록 '+c.f.pages:''}`])].filter(x=>x[1]);
    return {r,rows,photos}})}
function openEntry(){const sh=$('#sheet');const items=entryItems();
  sh.innerHTML=`<div class="head"><div class="in"><button class="btn" id="cancel">닫기</button><b>사이트 입력용</b><span></span></div></div>
  <div class="wrap entry">
    <p class="note">재단 사이트의 칸에 맞춰 <b>복사</b>를 누르고 붙여 넣으세요. 증빙 사진은 표지 → 내지 → 작품 페이지 → 전시장 순서로 번호가 붙어 내려받아져요. 공모전 전시는 빠져 있어요.</p>
    ${items.length?items.map((it,i)=>`<div class="section ecard"><h2>${i+1}. ${it.r.f.kind?`<span class="kind">${esc(it.r.f.kind)}</span> `:''}${esc(it.r.f.title)}</h2>
      <table class="etbl">${it.rows.map(([k,v],j)=>`<tr><th>${k}</th><td>${esc(v)}</td><td><button class="btn small" data-cp="${i}:${j}">복사</button></td></tr>`).join('')}</table>
      <div class="actions"><button class="btn small" data-cpall="${i}">전체 한 번에 복사</button></div>
      ${it.photos.length?`<div class="flabel" style="margin-top:10px">증빙 사진 ${it.photos.length}장</div><div class="ephotos">${it.photos.map((x,k)=>`<figure><img src="${esc(store.url(x.p))}" alt="${esc(x.l)}"><figcaption>${k+1}. ${esc(x.l)}</figcaption><button class="btn small" data-dl="${i}:${k}">받기</button></figure>`).join('')}</div>
        <div class="actions"><button class="btn primary" data-dlall="${i}">사진 ${it.photos.length}장 모두 받기</button></div>`:`<p class="note">증빙 사진이 아직 없어요. 도록 표지·작품 페이지와 전시장 사진을 넣어 주세요.</p>`}
    </div>`).join(''):`<p>조건에 맞는 전시가 없어요. 기간이나 장르를 바꿔 보세요.</p>`}
  </div>`;
  openSheet();
  sh.querySelector('#cancel').onclick=closeSheet;
  const nm=(it,k)=>`${String(k+1).padStart(2,'0')}_${safeName(it.r.f.title)}_${safeName(it.photos[k].l)}`;
  sh.querySelectorAll('[data-cp]').forEach(b=>b.onclick=async()=>{const [i,j]=b.dataset.cp.split(':').map(Number);if(await copyText(items[i].rows[j][1])){toast('복사했어요: '+items[i].rows[j][0]);b.textContent='복사됨';setTimeout(()=>b.textContent='복사',1500)}else toast('복사가 안 돼요. 글자를 길게 눌러 복사해 주세요')});
  sh.querySelectorAll('[data-cpall]').forEach(b=>b.onclick=async()=>{const it=items[+b.dataset.cpall];if(await copyText(it.rows.map(([k,v])=>k+': '+v).join('\n')))toast('전시 정보를 모두 복사했어요')});
  sh.querySelectorAll('[data-dl]').forEach(b=>b.onclick=async()=>{const [i,k]=b.dataset.dl.split(':').map(Number);await downloadPhoto(store.url(items[i].photos[k].p),nm(items[i],k))});
  sh.querySelectorAll('[data-dlall]').forEach(b=>b.onclick=async()=>{const it=items[+b.dataset.dlall];b.disabled=true;toast('사진을 받는 중이에요. "여러 파일 다운로드"를 물어보면 허용을 눌러 주세요');
    for(let k=0;k<it.photos.length;k++){await downloadPhoto(store.url(it.photos[k].p),nm(it,k));await new Promise(r=>setTimeout(r,400))}b.disabled=false;toast('사진 '+it.photos.length+'장을 받았어요')});
}

/* ---------- admin ---------- */
async function openAdmin(){const sh=$('#sheet');let list=[],codes=[],notices=[],q='';
  sh.innerHTML=`<div class="head"><div class="in"><button class="btn" id="cancel">닫기</button><b>회원 관리</b><button class="btn" id="reload">새로고침</button></div></div><div class="wrap" id="adm"><div class="loading">불러오는 중…</div></div>`;
  openSheet(()=>{hideSheet();render()});
  sh.querySelector('#cancel').onclick=closeSheet;
  sh.querySelector('#reload').onclick=load;
  const day=d=>d?fmtDate(String(d).slice(0,10)):'';
  const ago=d=>{if(!d)return'';const n=Math.floor((Date.now()-new Date(d))/864e5);return n<=0?'오늘':n===1?'어제':n+'일 전'};
  function limitOf(m){if(m.user_id===S.user?.id&&S.plan?.admin)return '∞';if(m.plan==='vip')return '∞';if(m.plan==='friend'&&m.plan_until&&m.plan_until<new Date().toISOString().slice(0,10))return 10;return PLANS[m.plan]?.n??10}
  function draw(){const box=sh.querySelector('#adm');if(!box)return;
    const L=list.filter(m=>!q||(m.email||'').includes(q)||(m.name||'').includes(q)||(m.memo||'').includes(q)||(m.phone||'').includes(q));
    const cnt=k=>list.filter(m=>m.plan===k).length;const week=list.filter(m=>m.last_seen&&Date.now()-new Date(m.last_seen)<7*864e5).length;
    const soon=list.filter(m=>m.plan==='friend'&&m.plan_until&&(new Date(m.plan_until)-Date.now())<30*864e5).length;
    box.innerHTML=`<div class="stats" style="grid-template-columns:repeat(3,1fr)">
      <div class="stat"><b>${list.length}</b><span>전체 회원</span></div><div class="stat"><b>${week}</b><span>7일 내 접속</span></div><div class="stat"><b>${soon}</b><span>무료 30일 내 만료</span></div></div>
      <div class="section"><h2>공지</h2><p>올리면 회원이 앱을 열 때 맨 위에 보여요. 회원이 닫으면 다시 안 떠요.</p>
        <div class="field"><label for="ntitle">제목</label><input id="ntitle" placeholder="예: 예술활동증명 출력이 새로 바뀌었어요"></div>
        <div class="field"><label for="nbody">내용</label><textarea id="nbody" placeholder="바뀐 점을 짧게 적어 주세요"></textarea></div>
        <div class="actions"><button class="btn primary" id="npost">공지 올리기</button></div>
        <div class="worder">${notices.map(n=>`<div class="wo"><span style="min-width:0"><b>${esc(n.title)}</b><br><small>${day(n.created_at)} · ${n.active?'보이는 중':'내림'}</small></span><span class="mv"><button class="btn small" data-nt="${n.id}" data-on="${n.active?0:1}">${n.active?'내리기':'다시 올리기'}</button></span></div>`).join('')}</div></div>
      <div class="section"><div class="sh2"><h2>초대 코드</h2></div>
        <p>코드는 한 번만 쓸 수 있어요. 가입할 때 입력하거나, 가입한 뒤 설정 탭에서 입력하면 등급이 바로 바뀌어요.</p>
        <div class="row2"><div class="field"><label for="cplan">줄 등급</label><select id="cplan">${['vip','friend','pro','basic'].map(k=>`<option value="${k}">${PLANS[k].l}</option>`).join('')}</select></div>
        <div class="field"><label for="cmon">기간</label><select id="cmon"><option value="">기한 없음</option><option value="6">6개월</option><option value="12">1년</option><option value="3">3개월</option></select></div></div>
        <div class="field"><label for="cmemo">누구에게 (메모)</label><input id="cmemo" placeholder="예: ○○○ 선생님"></div>
        <div class="actions"><button class="btn primary" id="cnew">코드 만들기</button></div>
        <div class="worder">${codes.map(c=>`<div class="wo"><span style="min-width:0"><b class="code">${esc(c.code)}</b> <small>${esc(PLANS[c.plan]?.l||c.plan)}${c.months?' · '+c.months+'개월':''}${c.memo?' · '+esc(c.memo):''}</small><br><small>${c.used>=c.max_uses?`사용됨${c.used_by?' · '+esc(c.used_by):''}${c.used_at?' · '+day(c.used_at):''}`:'아직 안 씀'} · ${day(c.created_at)} 만듦</small></span>
          <span class="mv">${c.used<c.max_uses?`<button class="btn small primary" data-link="${esc(c.code)}">링크 복사</button><button class="btn small" data-copy="${esc(c.code)}">코드 복사</button>`:''}<button class="btn small danger" data-del="${esc(c.code)}">지우기</button></span></div>`).join('')}</div></div>
      <div class="stats" style="grid-template-columns:repeat(5,1fr)">${Object.entries(PLANS).map(([k,p])=>`<div class="stat"><b>${cnt(k)}</b><span>${p.l}</span></div>`).join('')}</div>
      <div class="field" style="margin-bottom:10px"><label for="aq">찾기 (이메일·이름·연락처·메모)</label><input id="aq" value="${esc(q)}"></div>
      <div class="list">${L.map(m=>`<div class="section mem" data-u="${m.user_id}">
        <div><b>${esc(m.name||'(이름 없음)')}</b> <span class="note">${esc(m.email||'')}</span></div>
        ${m.phone?`<p>연락처 <b>${esc(m.phone)}</b> · ${m.contact_ok?'안내 수신 동의':'안내 수신 미동의'}</p>`:''}
        <p>가입 ${day(m.created_at)} · 마지막 접속 ${ago(m.last_seen)} · 작품 ${m.work_count} / ${limitOf(m)}점 · 전체 기록 ${m.record_count}건</p>
        <div class="row2"><div class="field"><label for="ap_${m.user_id}">등급</label><select id="ap_${m.user_id}">${Object.entries(PLANS).map(([k,p])=>`<option value="${k}" ${m.plan===k?'selected':''}>${p.l} (${p.n}${typeof p.n==='number'?'점':''})</option>`).join('')}</select></div>
        <div class="field"><label for="au_${m.user_id}">무료 기간 끝나는 날</label><input type="date" id="au_${m.user_id}" value="${m.plan_until||''}"></div></div>
        <div class="field"><label for="am_${m.user_id}">메모</label><input id="am_${m.user_id}" value="${esc(m.memo||'')}" placeholder="예: ○○협회 소개, 3월 워크숍 수강생"></div>
        <div class="actions"><button class="btn small primary" data-save="${m.user_id}">저장</button>${m.plan==='friend'?`<button class="btn small" data-six="${m.user_id}">오늘부터 6개월</button>`:''}</div></div>`).join('')||'<div class="empty">회원이 없어요.</div>'}</div>`;
    box.querySelector('#aq').oninput=e=>{q=e.target.value.trim();const pos=e.target.selectionStart;draw();const el=box.querySelector('#aq');el.focus();el.setSelectionRange(pos,pos)};
    box.querySelectorAll('[data-six]').forEach(b=>b.onclick=()=>{const d=new Date();d.setMonth(d.getMonth()+6);box.querySelector('#au_'+b.dataset.six).value=d.toISOString().slice(0,10)});
    box.querySelectorAll('[id^=ap_]').forEach(sel=>sel.onchange=()=>{const m=list.find(x=>x.user_id===sel.id.slice(3));m.plan=sel.value;m.memo=box.querySelector('#am_'+m.user_id).value;m.plan_until=box.querySelector('#au_'+m.user_id).value||null;draw()});
    box.querySelector('#npost').onclick=async()=>{const t=box.querySelector('#ntitle').value.trim();if(!t){toast('제목을 적어 주세요');return}
      try{await store.postNotice({title:t,body:box.querySelector('#nbody').value.trim()});notices=await store.listNotices();draw();toast('공지를 올렸어요')}catch(e){toast(e.message)}};
    box.querySelectorAll('[data-nt]').forEach(b=>b.onclick=async()=>{try{await store.setNotice(+b.dataset.nt,b.dataset.on==='1');notices=await store.listNotices();draw()}catch(e){toast(e.message)}});
    box.querySelector('#cnew').onclick=async()=>{const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const rnd=n=>Array.from(crypto.getRandomValues(new Uint8Array(n)),x=>A[x%A.length]).join('');
      const plan=box.querySelector('#cplan').value;const code=`${plan==='vip'?'VIP':plan==='friend'?'FRD':plan.toUpperCase().slice(0,3)}-${rnd(4)}-${rnd(4)}`;
      const months=box.querySelector('#cmon').value;try{await store.createCode({code,plan,months:months?+months:null,max_uses:1,memo:box.querySelector('#cmemo').value.trim()});codes=await store.listCodes();draw();
        if(await copyText(inviteLink(code)))toast(`${code} 초대 링크를 만들고 복사했어요`);else toast(`${code} 를 만들었어요`)}catch(e){toast(e.message)}};
    box.querySelectorAll('[data-link]').forEach(b=>b.onclick=async()=>{const l=inviteLink(b.dataset.link);if(await copyText(l))toast('초대 링크를 복사했어요. 카톡·문자로 보내 주세요');else toast(l)});
    box.querySelectorAll('[data-copy]').forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(b.dataset.copy);toast('복사했어요')}catch(e){toast(b.dataset.copy)}});
    box.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{if(b.dataset.armed!=='1'){b.dataset.armed='1';b.textContent='정말 지우기';return}try{await store.deleteCode(b.dataset.del);codes=codes.filter(c=>c.code!==b.dataset.del);draw()}catch(e){toast(e.message)}});
    box.querySelectorAll('[data-save]').forEach(b=>b.onclick=async()=>{const id=b.dataset.save;const patch={plan:box.querySelector('#ap_'+id).value,plan_until:box.querySelector('#au_'+id).value||null,memo:box.querySelector('#am_'+id).value.trim()};
      b.disabled=true;try{await store.updateMember(id,patch);Object.assign(list.find(x=>x.user_id===id),patch);toast('저장했어요');draw()}catch(e){toast(e.message);b.disabled=false}});
  }
  async function load(){try{list=await store.adminMembers()||[];try{codes=await store.listCodes()||[]}catch(e){codes=[]}try{notices=await store.listNotices()||[]}catch(e){notices=[]}draw()}catch(e){const box=sh.querySelector('#adm');if(box)box.innerHTML=`<p class="note">${esc(e.message)}. 관리자 설정 글(admin.sql)을 실행했는지 확인해 주세요.</p>`}}
  load();
}

/* ---------- settings ---------- */
const PRIZE_RANK=['대상','최우수','금상','우수','은상','동상','특별','특선','장려','입선'];
function prizeScore(a){const t=(a.f.prize||'')+' '+(a.f.title||'');const i=PRIZE_RANK.findIndex(k=>t.includes(k));return i<0?PRIZE_RANK.length:i}
const EX_KINDS=['개인전','초대전','기획전','단체전','아트페어','공모전','기타'];
function profileText(short){const s=S.settings;const lines=v=>String(v||'').split('\n').map(x=>x.trim()).filter(Boolean);
  const name=[s.name,s.nameHan,s.nameEn].filter(Boolean).join(' · ');
  const aw=S.records.filter(r=>r.type==='award');const ex=S.records.filter(r=>r.type==='exhibition');
  const newest=L=>[...L].sort((a,b)=>(dateOf(b)||'').localeCompare(dateOf(a)||''));
  if(short){const top=[...aw].sort((a,b)=>prizeScore(a)-prizeScore(b)||(dateOf(b)||'').localeCompare(dateOf(a)||'')).slice(0,2);
    const cnt=EX_KINDS.map(k=>[k,ex.filter(x=>x.f.kind===k).length]).filter(([,n])=>n).map(([k,n])=>`${k} ${n}회`);
    const last=newest(ex)[0];
    return [name,s.tagline,
      top.length?'수상: '+top.map(awardLine).join(', '):'',
      ex.length?`전시 ${ex.length}회${cnt.length?` (${cnt.join(' · ')})`:''}${last?` · 최근 ${exLine(last)}`:''}`:'',
      lines(s.current).length?'경력: '+lines(s.current).slice(0,2).join(', '):''].filter(Boolean).join('\n')}
  const out=[name,s.tagline].filter(Boolean);const add=(h,arr)=>{if(arr.length)out.push('',`[${h}]`,...arr)};
  add('작가 소개',lines(s.bio));add('학력',lines(s.edu));add('주요 경력',lines(s.current));
  add('수상 경력',newest(aw).map(awardLine));
  if(ex.length){out.push('','[전시 경력]');const groups=[...EX_KINDS,''];
    groups.forEach(k=>{const g=newest(ex.filter(x=>(x.f.kind||'')===k||(!k&&!EX_KINDS.includes(x.f.kind))));if(g.length)out.push(`■ ${k||'기타 전시'}`,...g.map(x=>[recYear(x),`「${x.f.title}」`,x.f.venue].filter(Boolean).join(' ')))})}
  add('연락처',[s.pemail&&('이메일 '+s.pemail),s.insta&&('인스타그램 '+s.insta),s.web&&('웹 '+s.web)].filter(Boolean));
  return out.join('\n')}
function viewSet(){const s=S.settings;
  $('#app').innerHTML=`<div class="top"><div><h1>설정</h1></div></div>
  <div class="section"><h2>작가 프로필</h2><p>여기 적은 내용이 포트폴리오 표지와 협회 제출용 약력에 들어가요. 입력하는 대로 자동 저장돼요. <span id="psaved" class="note"></span></p>
    <div class="actions"><button class="btn small" id="cp5">5줄 요약 복사</button><button class="btn small" id="cpfull">풀버전 복사</button></div>
    <p class="note" style="margin-top:4px">전시·수상 경력은 기록에 넣은 내용에서 자동으로 가져와요.</p>
    <div class="profrow"><div class="pphoto">${s.photo?`<img src="${esc(s.photo)}" alt="프로필 사진">`:'<span>사진 없음</span>'}</div>
      <div class="actions"><span class="btn small filebtn">${s.photo?'사진 바꾸기':'프로필 사진 넣기'}<input type="file" accept="image/*" id="sphoto" aria-label="프로필 사진"></span>${s.photo?'<button class="btn small" id="sphotorm">빼기</button>':''}</div></div>
    <div class="field"><label for="sname">작가 이름</label><input id="sname" value="${esc(s.name)}" placeholder="예: 홍길동"></div>
    <div class="row2"><div class="field"><label for="snh">한자 이름</label><input id="snh" value="${esc(s.nameHan||'')}" placeholder="洪吉童"></div>
    <div class="field"><label for="sne">영문 이름</label><input id="sne" value="${esc(s.nameEn||'')}" placeholder="Hong Gil-dong"></div></div>
    <div class="field"><label for="ptag">한 줄 소개</label><input id="ptag" value="${esc(s.tagline||'')}" placeholder="작가와 작업을 한 문장으로"></div>
    <div class="field"><label for="pbio">작가 소개</label><textarea id="pbio" placeholder="작업 세계, 주로 다루는 재료와 주제 등">${esc(s.bio||'')}</textarea></div>
    <div class="field"><label for="sedu">학력 (한 줄에 하나)</label><textarea id="sedu" placeholder="○○대학교 미술대학 서양화과 졸업">${esc(s.edu||'')}</textarea></div>
    <div class="field"><label for="scur">주요 경력 · 현재 활동 (한 줄에 하나)</label><textarea id="scur" placeholder="한국미술협회 회원&#10;○○판화가협회 회원&#10;○○평생학습관 강사">${esc(s.current||'')}</textarea></div>
    <div class="row2"><div class="field"><label for="pmail">이메일 (공개용)</label><input id="pmail" type="email" value="${esc(s.pemail||'')}" placeholder="표지에 넣을 이메일"></div>
    <div class="field"><label for="pinsta">인스타그램</label><input id="pinsta" value="${esc(s.insta||'')}" placeholder="@아이디"></div></div>
    <div class="field"><label for="pweb">웹사이트·블로그</label><input id="pweb" value="${esc(s.web||'')}" placeholder="https://"></div></div>
  <div class="section"><h2>내 장르</h2><p>기록마다 장르를 붙여 두면, 출력할 때 장르별로 따로 뽑을 수 있어요.</p>
    <div class="genrelist">${s.genres.map((g,i)=>`<div class="g"><span>${esc(g)}</span><button class="btn small" data-rg="${i}" ${s.genres.length<2?'disabled':''}>빼기</button></div>`).join('')}</div>
    <div class="actions"><input id="newg" class="btn" style="flex:1;min-width:0" placeholder="새 장르 (예: 회화)" aria-label="새 장르"><button class="btn" id="addg">추가</button></div></div>
  <div class="section"><h2>계정</h2>
    ${store.mode==='cloud'?`<p><span class="syncdot"></span>${esc(S.user?.email||'')} 로 로그인됨. 휴대폰·컴퓨터 어디서 로그인해도 같은 기록이 보여요.</p>
    ${S.plan?`<p>등급: <b>${S.plan.admin?'관리자':esc(PLANS[S.plan.plan]?.l||'무료')}</b>${S.plan.plan_until&&S.plan.plan==='friend'?` (${fmtDate(S.plan.plan_until)}까지)`:''} · 작품 ${S.records.filter(r=>r.type==='work').length}${S.plan.admin?'점':` / ${S.plan.work_limit}점`}</p>`:''}
    ${S.plan?.admin?`<div class="actions"><button class="btn primary" id="admin">회원 관리 · 초대 코드</button></div>`:''}
    ${S.plan?`<div class="field"><label for="sph">연락처 (선택)</label><input id="sph" type="tel" value="${esc(S.contact?.phone||'')}" placeholder="010-0000-0000"></div>
    <label class="consent"><input type="checkbox" id="sok" ${S.contact?.contact_ok?'checked':''}> 업데이트 공지·안내를 받을 목적으로 연락처를 쓰는 데 동의해요 (선택)</label>
    <div class="actions"><button class="btn small" id="sphgo">연락처 저장</button></div>`:''}
    ${chLinks()}
    ${S.plan&&!S.plan.admin?`<div class="actions"><input id="code" class="btn" style="flex:1;min-width:0" placeholder="초대 코드 입력" aria-label="초대 코드" autocomplete="off"><button class="btn" id="codego">적용</button></div>`:''}<div class="actions"><button class="btn" id="chpw">비밀번호 바꾸기</button><button class="btn" id="out">로그아웃</button></div>`
      :`<p><span class="syncdot local"></span>체험 모드예요. 기록이 이 기기에만 저장되고, 다른 기기에서는 보이지 않아요.${!store.persistent()?' 이 브라우저는 저장이 막혀 있어 창을 닫으면 기록이 사라져요.':''}</p>`}</div>
  <div class="section"><h2>홈 화면에 앱 아이콘 놓기</h2>
    ${isStandalone()?'<p>이미 앱으로 설치해서 쓰고 있어요.</p>':`<div class="actions">${installHow()}</div>`}
    <p><b>아이폰:</b> 사파리에서 열고 아래쪽 공유 버튼 → "홈 화면에 추가"</p>
    <p><b>안드로이드:</b> 크롬에서 열고 오른쪽 위 ⋮ → "앱 설치" 또는 "홈 화면에 추가"</p>
    <p><b>컴퓨터:</b> 크롬·엣지 주소창 오른쪽 설치 아이콘 또는 ⋮ → "앱 설치"</p></div>
  <div class="section"><h2>백업</h2><p>지금까지의 기록을 사진까지 한 파일로 내려받아요.</p>
    <div class="actions"><button class="btn" id="bk">백업 파일 받기</button><button class="btn" id="csv">작품 목록 엑셀로 받기</button></div></div>`;
  const saveS=async()=>{try{await store.setSettings(s)}catch(e){toast(e.message)}};
  let pt=null;const ps=$('#psaved');
  const flushP=async()=>{if(!pt)return;clearTimeout(pt);pt=null;ps.textContent='저장 중…';await saveS();ps.textContent='✓ 저장됨'};
  [['#sname','name'],['#snh','nameHan'],['#sne','nameEn'],['#ptag','tagline'],['#pbio','bio'],['#sedu','edu'],['#scur','current'],['#pmail','pemail'],['#pinsta','insta'],['#pweb','web']].forEach(([id,k])=>{
    $(id).addEventListener('input',e=>{s[k]=e.target.value.trim();ps.textContent='입력 중…';clearTimeout(pt);pt=setTimeout(flushP,700)});
    $(id).addEventListener('blur',flushP)});
  $('#cp5').onclick=async()=>{toast(await copyText(profileText(true))?'5줄 요약을 복사했어요':'복사하지 못했어요')};
  $('#cpfull').onclick=async()=>{toast(await copyText(profileText(false))?'풀버전을 복사했어요':'복사하지 못했어요')};
  $('#sphoto').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{s.photo=await shrink(f,600);await saveS();toast('프로필 사진을 넣었어요');render()}catch(_){toast('이미지를 읽지 못했어요')}};
  $('#sphotorm')?.addEventListener('click',async()=>{delete s.photo;await saveS();render()});
  document.querySelectorAll('[data-rg]').forEach(b=>b.onclick=async()=>{s.genres.splice(+b.dataset.rg,1);await saveS();render()});
  $('#addg').onclick=async()=>{const v=$('#newg').value.trim();if(!v||s.genres.includes(v))return;s.genres.push(v);await saveS();render()};
  bindInstall();
  $('#admin')?.addEventListener('click',openAdmin);
  $('#sphgo')?.addEventListener('click',async()=>{const p=$('#sph').value.trim(),ok=$('#sok').checked;try{await store.setContact(p,ok);S.contact={phone:p,contact_ok:ok};toast('연락처를 저장했어요')}catch(e){toast(e.message)}});
  $('#codego')?.addEventListener('click',async()=>{const c=$('#code').value.trim();if(!c)return;try{const r=await store.redeem(c);toast(redeemMsg(r));S.plan=await store.myPlan();render()}catch(e){toast('초대 코드를 적용하지 못했어요')}});
  $('#chpw')?.addEventListener('click',()=>viewLogin('newpw'));
  $('#out')?.addEventListener('click',async()=>{await store.signOut();S.records=[];S.user=null;viewLogin('in')});
  $('#csv').onclick=()=>{const ws=[...S.records.filter(r=>r.type==='work')].sort(byDate);
    const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
    const rows=[['순번','관리번호','국문 제목','한문 제목','영문 제목','장르','제작연도','제작일','크기','기법·재료','바탕 재료','에디션','소재','수상','작품 설명']];
    ws.forEach((r,i)=>{const f=r.f;rows.push([i+1,f.code,f.title,f.titleHan,f.titleEn,(r.genres||[]).join(', '),f.year,f.made,f.size,f.medium,f.base,f.edition,f.subject,awardsFor(r).join(' / '),f.desc])});
    const blob=new Blob(['\ufeff'+rows.map(r=>r.map(q).join(',')).join('\r\n')],{type:'text/csv'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`작품목록-${new Date().toISOString().slice(0,10)}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000);toast('작품 목록을 받았어요')};
  $('#bk').onclick=async e=>{const b=e.target;b.disabled=true;b.textContent='만드는 중…';
    try{const recs=[];for(const r of S.records){const photos=[];for(const p of r.photos)photos.push({slot:p.slot,src:await store.photoData(p)});recs.push({...r,photos})}
      const blob=new Blob([JSON.stringify({app:'artist-record',v:1,settings:s,records:recs})],{type:'application/json'});
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`JALP-백업-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000);toast('백업 파일을 받았어요')}
    catch(err){toast('백업 파일을 만들지 못했어요')}
    b.disabled=false;b.textContent='백업 파일 받기'};
}

/* ---------- boot ---------- */
document.querySelectorAll('.tabbar button').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
(async()=>{
  let invited=null;try{const q=new URLSearchParams(location.search);invited=(q.get('invite')||'').trim().toUpperCase();if(invited){try{localStorage.setItem('pendingCode',invited)}catch(e){}q.delete('invite');history.replaceState(null,'',location.pathname+(q.toString()?'?'+q:'')+location.hash)}}catch(e){}
  const recovering=/type=recovery/.test(location.hash);
  if(store.mode==='cloud')store.sb.auth.onAuthStateChange((ev)=>{if(ev==='PASSWORD_RECOVERY')viewLogin('newpw')});
  try{await store.init()}catch(e){console.error(e)}
  if(store.mode==='cloud'){
    if(recovering){history.replaceState(null,'',location.pathname);if(await store.user()){viewLogin('newpw');return}viewLogin('reset','재설정 링크가 만료됐어요. 이메일을 넣고 링크를 다시 받아 주세요.');return}
    if(!(await store.user())){if(invited){viewLogin('up',`초대 코드 ${invited} 가 들어 있어요. 이메일과 비밀번호만 정하면 가입이 끝나요.`)}else viewLogin('in');return}
  }
  await afterLogin();
})();
})();
