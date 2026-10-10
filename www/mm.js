// ======================= MINI MONITORING: sesi NIK, 3 tab (Home · List · Settings), filter BU, Home, List =======================
// Halaman lama tetap dipakai di dalam List: Beranda → Dashboard Inbound, Role → Demand Storing/Outbound,
// Monitoring → Monitoring Container dan LPPBDO Inbound, TTO/Dokumen → TTO & Dokumen.
I.grid='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/></svg>';
I.logout='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4H5a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 5 16h3M12.5 13.5 16 10l-3.5-3.5M16 10H8"/></svg>';
I.bell='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 8.5a4.5 4.5 0 0 1 9 0c0 4 1.5 5 1.5 5H4s1.5-1 1.5-5M8.5 16.5a1.8 1.8 0 0 0 3 0"/></svg>';
I.wrench='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12.6 3.4a4 4 0 0 0-4.9 5.3L3.5 12.9a1.6 1.6 0 0 0 2.3 2.3L10 11a4 4 0 0 0 5.3-4.9l-2.4 2.4-2-.4-.4-2z"/></svg>';
I.shield='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2.8 4 5v4.6c0 3.6 2.4 6.4 6 7.6 3.6-1.2 6-4 6-7.6V5z"/><path d="m7.6 10 1.7 1.7 3.2-3.4"/></svg>';
I.layers='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3 3 6.5 10 10l7-3.5zM3 10l7 3.5 7-3.5M3 13.5 10 17l7-3.5"/></svg>';
I.flag='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 17V3.5M4.5 4h9l-1.8 3 1.8 3h-9"/></svg>';
I.clip='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="3.5" width="11" height="14" rx="2"/><path d="M7.5 3.5V5h5V3.5M7.5 9h5M7.5 12h5M7.5 15h3"/></svg>';
I.user='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="7" r="3.2"/><path d="M3.8 16.5a6.2 6.2 0 0 1 12.4 0"/></svg>';
I.ext='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4h5v5M16 4l-7 7M14 11.5V15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3.5"/></svg>';
I.down='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5.5 8 4.5 4.5L14.5 8"/></svg>';
I.pulse='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 10.5h3.2l2-5 3.3 9 2-4h4.5"/></svg>';

const BRAND={informa:'Informa','informa-custom':'Informa Custom Furniture','informa-electronics':'Informa Electronics',selma:'Selma',azko:'Azko',krisbow:'Krisbow','toys-kingdom':'Toys Kingdom',ataru:'Ataru',eyesoul:'Eyesoul',chatime:'Chatime'};
const BU_BRANDS={HCI:['informa','selma'],AHI:['azko','ataru'],KWI:['krisbow'],TGI:['toys-kingdom'],FBI:['chatime']};
const BU_NAME={HCI:'Home Center Indonesia',AHI:'Aspirasi Hidup Indonesia',KWI:'Kawan Lama Wira Indonesia',TGI:'Toys Games Indonesia',FBI:'Food & Beverages Indonesia'};
const brandImg=(k,cls)=>`<img class="${cls||'brand-img'}" src="brand/${k}.png" alt="${esc(BRAND[k]||k)}" decoding="async">`;
const MENU_IC={dashboard:I.pulse,monitoring:I.ship,occupancy:I.layers,sloc:I.db,schedule:I.cal,demand:I.trend,lppb:I.doc,report:I.clip,tto:I.doc,infra:I.wrench,mpp:I.users,lp:I.shield};
const DEPT_IC={inbound:I.box,storing:I.stock,outbound:I.truck,inventory:I.db,planner:I.cal,lp:I.shield,mhe:I.wrench};
const ROLE_LABEL={'INBOUND':'Inbound','STORING':'Storing','OUTBOUND':'Outbound','INVENTORY':'Inventory','PLANNER':'Planner','LP':'LP','MHE':'MHE','MANAGER':'Manager','ASST. MANAGER':'Assistant Manager'};
const tc=s=>String(s||'').toLowerCase().replace(/(^|[\s.])([a-z])/g,(m,a,b)=>a+b.toUpperCase());
const firstName=n=>tc(String(n||'').trim().split(/\s+/)[0]||'');
const CTX=()=>({today:TODAY});

// ---------- sesi ----------
let SES=LS.get('imm.session');
const ME=()=>SES;
const USERS={map:null,at:0,err:''};
IMMSrc.setStore({get:k=>LS.get(k),set:(k,v)=>LS.set(k,v)});
(function(){const c=LS.get('imm.users');if(Array.isArray(c))USERS.map=new Map(c.map(([nik,role,jabatan])=>[nik,{nik,role,jabatan,name:''}]))})();
async function loadUsers(force){
  try{const r=await IMMSrc.load('users',CTX(),{force:!!force});const m=IMMAuth.parseMaster(r.rows);if(!m.size)throw new Error('Master User kosong');
    USERS.map=m;USERS.at=Date.now();USERS.err='';LS.set('imm.users',[...m.values()].map(u=>[u.nik,u.role,u.jabatan]));syncSession();return m}
  catch(e){USERS.err=e.message||String(e);throw e}
}
function syncSession(){
  if(!SES||!USERS.map||!USERS.at)return;const u=USERS.map.get(SES.nik);
  if(!u){forceLogout('Akun ini tidak lagi terdaftar di Master User. Hubungi admin.');return}
  if(u.role!==SES.role||u.jabatan!==SES.jabatan||(u.name&&u.name!==SES.name)){SES=Object.assign({},SES,{role:u.role,jabatan:u.jabatan,name:u.name||SES.name});LS.set('imm.session',SES);routeFix();render()}
}
function routeFix(){normalizeRoute();legacyPage()}
function setSession(u){
  SES={nik:u.nik,name:u.name||'',role:u.role,jabatan:u.jabatan,at:Date.now()};LS.set('imm.session',SES);
  LS.set('imm.role',{role:ROLE_LABEL[u.role]||tc(u.role),t:Date.now()});try{sendRole()}catch(e){}
}
function forceLogout(msg){SES=null;LS.del('imm.session');closeSheet();S.tab='home';S.route={menu:'',sub:''};legacyPage();render();loginGate(msg)}
function logout(){if(!confirm('Keluar dari akun ini? Kamu perlu memasukkan NIK lagi.'))return;buzz(10);forceLogout('')}

function loginGate(msg){
  if(document.getElementById('login'))return;
  const el=document.createElement('div');el.id='login';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','loginT');
  el.innerHTML=`<div class="lg-card">
    <div class="lg-top"><span class="lg-mark">${(document.getElementById('brandMark')||{}).innerHTML||''}</span><div><h2 id="loginT">Mini Monitoring</h2><p>DC Tallo Makassar</p></div></div>
    <div class="lg-brands" aria-hidden="true">${['informa','azko','krisbow','toys-kingdom','chatime','selma','ataru','eyesoul'].map(k=>`<span>${brandImg(k)}</span>`).join('')}</div>
    <form id="loginForm" novalidate>
      <label class="inb-field"><span>NIK</span><input id="loginNik" type="text" inputmode="text" autocomplete="username" autocapitalize="characters" spellcheck="false" enterkeyhint="go" maxlength="20" placeholder="Contoh: 123456"></label>
      <p class="inb-err" id="loginErr" role="alert">${esc(msg||'')}</p>
      <button class="btn block press" id="loginGo" type="submit">Masuk</button>
    </form>
    <p class="lg-note">${I.info}<span>NIK sesuai daftar Master User. Belum terdaftar atau pindah bagian? Hubungi admin.</span></p></div>`;
  document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add('in'));
  setTimeout(()=>{const i=document.getElementById('loginNik');i&&i.focus()},350);
}
async function loginSubmit(){
  const inp=document.getElementById('loginNik'),err=document.getElementById('loginErr'),btn=document.getElementById('loginGo');if(!inp||btn.disabled)return;
  const nik=IMMAuth.normNik(inp.value);
  if(!nik){err.textContent='Isi NIK dulu.';inp.focus();return}
  btn.disabled=true;btn.textContent='Memeriksa…';err.textContent='';
  let m=USERS.at&&Date.now()-USERS.at<60e3?USERS.map:null;
  if(!m){try{m=await loadUsers(true)}catch(e){m=USERS.map}}
  btn.disabled=false;btn.textContent='Masuk';
  if(!m){err.innerHTML='Butuh internet untuk masuk pertama kali. Periksa koneksi lalu coba lagi.';buzz(30);return}
  const u=m.get(nik);
  if(!u){err.textContent='NIK tidak terdaftar. Hubungi admin.';buzz(30);inp.select();return}
  setSession(u);buzz(12);
  const el=document.getElementById('login');if(el){el.classList.remove('in');el.classList.add('out');setTimeout(()=>el.remove(),450)}
  S.tab='home';S.route={menu:'',sub:''};routeFix();render(true);window.scrollTo({top:0});
  toast(SES.name?`Selamat datang, ${firstName(SES.name)}`:'Berhasil masuk');notifPoll(true);
}
document.addEventListener('submit',e=>{if(e.target&&e.target.id==='loginForm'){e.preventDefault();loginSubmit()}});

// ---------- navigasi ----------
S.tab='home';S.route={menu:'',sub:''};
const MM_TABS=[['home','Home',I.home],['list','List',I.grid],['set','Settings',I.set]];
function subsFor(menu){if(menu==='dashboard')return IMMAuth.dashDepts(SES);const m=IMMAuth.menu(menu);return m?m.subs.map(s=>s.id):[]}
function normalizeRoute(){
  const r=S.route;if(S.tab!=='list'){r.menu='';r.sub='';return}
  if(r.menu&&!IMMAuth.can(SES,r.menu)){r.menu='';r.sub=''}
  if(!r.menu){r.sub='';return}
  if(r.menu==='dashboard'&&r.sub==='tools'&&IMMAuth.canSub(SES,'dashboard','inbound'))return;
  const subs=subsFor(r.menu);if(subs.indexOf(r.sub)<0)r.sub=subs[0]||'';
}
function legacyPage(){
  if(S.inbFree)S.inb=''; // keluar dari TTO & Dokumen: halaman alat Inbound kembali ke daftarnya
  S.inbFree=false;
  if(S.tab==='home'){S.page='mmhome';return}
  if(S.tab==='set'){S.page='set';return}
  const {menu,sub}=S.route;
  if(!menu){S.page='hub';return}
  if(menu==='dashboard'&&sub==='inbound'){S.page='home';return}
  if(menu==='dashboard'&&sub==='tools'){S.page='inb';return}
  if(menu==='demand'&&(sub==='storing'||sub==='outbound')){S.page='role';S.roleTab=sub==='storing'?'stock':'out';return}
  if(menu==='monitoring'&&sub==='container'){S.page='mon';S.monTab='kont';return}
  if(menu==='lppb'&&sub==='inbound'){S.page='mon';S.monTab='lpp';return}
  if(menu==='tto'){S.page='inb';S.inb='tto';S.inbFree=true;return}
  S.page='mm';
}
function mmHash(){return S.tab==='list'?['list',S.route.menu,S.route.sub].filter(Boolean).join('/'):S.tab}
function readHash(){const h=location.hash.slice(1).split('/');S.tab=h[0]==='list'?'list':h[0]==='set'?'set':'home';S.route={menu:S.tab==='list'?(h[1]||''):'',sub:S.tab==='list'?(h[2]||''):''};routeFix()}
function go(tab,menu,sub,opt){
  const same=S.tab===tab&&S.route.menu===(menu||'')&&(!sub||S.route.sub===sub);
  if(same&&!(opt&&opt.force)){window.scrollTo({top:0,behavior:'smooth'});return}
  S.tab=tab;S.route={menu:menu||'',sub:sub||''};if(tab==='list'&&menu==='dashboard'&&sub==='tools')S.inb='';
  const was=S.page;routeFix();S.more={};buzz(6);inbEnter(was);render(true);window.scrollTo({top:0});
}
// Masuk ke alat Inbound dari halaman lain → hitungan kartu dimuat ulang.
function inbEnter(was){if(S.page==='inb'&&was!=='inb'&&typeof inbTilesStale==='function')inbTilesStale()}
// Tombol kembali: sub menu → List, List/Settings → Home. Mengembalikan true bila sudah ditangani.
function mmBack(){
  if(S.tab==='list'&&S.route.menu==='dashboard'&&S.route.sub==='tools'){go('list','dashboard','inbound');return true}
  if(S.tab==='list'&&S.route.menu){go('list');return true}
  if(S.tab!=='home'){go('home');return true}
  return false;
}

// ---------- filter BU (dropdown global) ----------
function setBU(b){BUSG=b==='ALL'?BUS:[b];Object.values(S.f).forEach(f=>{f.bus=new Set(BUSG)});S.more={};buzz(5);closeSheet();render(true)}
const curBU=()=>{const f=F();return f.bus.size===BUS.length?'ALL':[...f.bus][0]};
function buChip(){
  const b=curBU();
  return `<button class="chip bu-pick press" data-open-bu aria-haspopup="dialog" aria-label="Filter BU: ${b==='ALL'?'Semua BU':b}">${b==='ALL'?`<span class="bu-all">${I.grid}</span><span>Semua BU</span>`:`<span class="bu-logos">${BU_BRANDS[b].map(k=>brandImg(k,'bu-logo')).join('')}</span><span>${b}</span>`}${I.down}</button>`;
}
function openBU(){
  const b=curBU();
  sheet(sHead('Pilih BU','Berlaku untuk semua halaman','',false),
    `<div class="bu-opts" role="listbox" aria-label="BU">
      <button class="bu-opt press" role="option" aria-selected="${b==='ALL'}" data-bu-set="ALL"><span class="bu-opt-logos all">${I.grid}</span><span class="bu-opt-t"><b>Semua BU</b><small>HCI, AHI, KWI, TGI, FBI</small></span>${b==='ALL'?I.ok:''}</button>
      ${['HCI','AHI','KWI','TGI','FBI'].map(k=>`<button class="bu-opt press" role="option" aria-selected="${b===k}" data-bu-set="${k}"><span class="bu-opt-logos">${BU_BRANDS[k].map(x=>brandImg(x,'bu-logo-l')).join('')}</span><span class="bu-opt-t"><b>${k}</b><small>${BU_BRANDS[k].map(x=>BRAND[x]).join(' · ')}</small></span>${b===k?I.ok:''}</button>`).join('')}
    </div>`);
}
// Bilah filter: halaman mana memakai periode dan/atau BU
function stripFor(){
  const p=S.page,m=S.route.menu,s=S.route.sub;
  if(p==='hub'||p==='set')return {};
  if(p==='mmhome')return {bu:true};
  if(p==='inb')return S.inbFree?{period:true}:(typeof inbShowsFilter==='function'&&inbShowsFilter()?{period:true,bu:S.inb!=='tto'}:{});
  if(p!=='mm')return {period:true,bu:true};
  if(m==='dashboard')return s==='mhe'||s==='lp'?{period:true}:{period:true,bu:true};
  if(m==='monitoring')return {bu:true};
  if(m==='occupancy'||m==='sloc')return {bu:true};
  if(m==='demand')return {bu:true};
  if(m==='lppb')return {};
  if(m==='lp')return s==='inout'?{period:true}:{};
  return {};
}

// ---------- pemuat sumber per halaman (tampilkan cache, segarkan di latar) ----------
const SRC={};let srcRenderT=0;
function srcRender(){clearTimeout(srcRenderT);srcRenderT=setTimeout(()=>{if(!document.querySelector('.sheet input:focus,.sheet textarea:focus,.sheet select:focus'))render()},60)}
function srcLoad(k,force){
  const ctx=CTX(),prev=SRC[k];SRC[k]={st:'loading',res:prev&&prev.res,day:ctx.today,at:prev?prev.at:0};
  return IMMSrc.load(k,ctx,{force:!!force}).then(res=>{SRC[k]={st:'ok',res,day:ctx.today,at:Date.now()}},err=>{SRC[k]={st:'error',err,res:prev&&prev.res,day:ctx.today,at:Date.now()}}).then(srcRender);
}
// need(['occH',...]) → {occH: rows|null, ...}; sumber yang belum ada / basi dimuat lalu halaman dirender ulang
function need(keys){
  const ctx=CTX(),out={};
  keys.forEach(k=>{const s=SRC[k];const ttl=(IMMSrc.REG[k]||{}).ttl||30*60e3;
    if(!s||s.day!==ctx.today||(s.st!=='loading'&&Date.now()-s.at>ttl))srcLoad(k);
    const t=SRC[k];out[k]=t&&t.res?t.res.rows:null});
  return out;
}
const srcBusy=keys=>keys.some(k=>SRC[k]&&SRC[k].st==='loading'&&!SRC[k].res);
const srcErr=keys=>keys.map(k=>SRC[k]&&SRC[k].st==='error'&&!SRC[k].res?SRC[k].err:null).find(Boolean);
const srcAt=keys=>{const ts=keys.map(k=>SRC[k]&&SRC[k].res&&SRC[k].res.at).filter(Boolean);return ts.length?Math.min(...ts):0};
function srcRefresh(keys){return Promise.all((keys||Object.keys(SRC)).map(k=>srcLoad(k,true)))}

// ---------- komponen kartu KPI ----------
const pctS=v=>v==null?'–':f1(v)+'<small>%</small>';
const dateNote=d=>d?(d===TODAY?'hari ini':d===addD(TODAY,-1)?'kemarin':dshort(d)):'';
function kpiCard(o){
  const inner=o.state==='loading'?`<span class="kc-sk sk"></span><span class="kc-sk sk short"></span>`
    :o.state==='error'?`<span class="kc-miss">${I.crit}<span>Data belum bisa dimuat</span></span><span class="kc-retry">Ketuk untuk coba lagi</span>`
    :o.state==='missing'?`<span class="kc-miss">${I.info}<span>${esc(o.reason||'Belum tersambung ke data')}</span></span>`
    :`<span class="kc-v">${o.value}${o.unit?`<small>${o.unit}</small>`:''}</span>${o.sub?`<span class="kc-s">${o.sub}</span>`:''}${o.bar!=null?`<span class="kc-bar ${o.tone||''}"><i style="width:${Math.max(2,Math.min(100,o.bar))}%"></i></span>`:''}`;
  const attr=o.state==='error'?`data-src-retry="${o.keys||''}"`:o.link?`data-go-list="${o.link}"`:'';
  const tag2=attr?'button':'div';
  return `<${tag2} class="kc ${o.wide?'wide':''} ${o.tone?'t-'+o.tone:''} ${attr?'press':''}" ${attr} ${o.style?`style="${o.style}"`:''}>
    <span class="kc-h"><span class="kc-ic">${o.icon||I.trend}</span>${o.date&&o.state==='ok'?`<span class="kc-d">${esc(dateNote(o.date))}</span>`:''}${o.link&&o.state!=='error'?`<span class="kc-go">${I.chev}</span>`:''}</span><span class="kc-l">${o.label}</span>${inner}</${tag2}>`;
}
const notWired=(title,reason,i)=>`<section class="card nw" style="--i:${i==null?2:i}"><div class="nw-in"><span class="nw-ic">${I.info}</span><div><b>${title}</b><p>${esc(reason||'Belum tersambung ke data. Kirim link spreadsheet sumbernya agar bisa ditampilkan.')}</p></div></div></section>`;
function stateOf(keys,res){if(res&&!res.missing)return 'ok';if(srcBusy(keys))return 'loading';if(srcErr(keys))return 'error';return 'missing'}

// ---------- HOME ----------
const HOME_KEYS=['wtwH','wtwA','occH','occA','occAll','barus','ldH','ldA'];
function pageMMHome(){
  const R=need(HOME_KEYS);const bu=curBU();const L=IMMAuth.homeLinks(SES);
  const ak=IMMKpi.akurasi(R.wtwH,R.wtwA,bu,TODAY),oc=IMMKpi.occupancy(R.occH,R.occA,R.occAll,bu,TODAY),dm=IMMKpi.damage(R.barus,bu),sl=IMMKpi.slaOutbound(R.ldH,R.ldA,bu,TODAY);
  const inc=IMMKpi.incoming(D&&D.rdc||[],bu);
  const hr=new Date().getHours();const greet=hr<11?'Selamat pagi':hr<15?'Selamat siang':hr<18?'Selamat sore':'Selamat malam';
  const sAk=stateOf(['wtwH','wtwA'],ak),sOc=stateOf(['occH','occA','occAll'],oc),sDm=stateOf(['barus'],dm),sSl=stateOf(['ldH','ldA'],sl);
  const sInc=D?'ok':STATUS.state==='error'?'error':'loading';
  // kalimat jawaban: yang perlu perhatian dulu
  const notes=[];
  if(sOc==='ok'&&oc.pct>=100)notes.push(`occupancy <b>${f1(oc.pct)}%</b>, melebihi kapasitas`);else if(sOc==='ok'&&oc.pct>=90)notes.push(`occupancy <b>${f1(oc.pct)}%</b>, hampir penuh`);
  if(sSl==='ok'&&sl.cust!=null&&sl.std!=null&&sl.cust<sl.std)notes.push(`SLA customer <b>${f1(sl.cust)}%</b> di bawah standar ${f0(sl.std)}%`);
  if(sAk==='ok'&&ak.pct<99)notes.push(`akurasi <b>${f2(ak.pct)}%</b> di bawah 99%`);
  if(inc.pod.n)notes.push(`<b>${f0(inc.pod.n)} kontainer</b> menunggu di pelabuhan`);
  const headline=notes.length?`Perlu perhatian: ${notes.join(', ')}.`:(sOc==='ok'||sAk==='ok')?'Semua angka utama dalam batas normal.':'Mengambil angka terbaru dari spreadsheet…';
  const occTone=sOc!=='ok'?'':oc.pct>=100?'crit':oc.pct>=90?'warn':'good';
  const unread=NOTIF.unread.length;
  return `<div class="hello" style="--i:0"><h1>${greet}${SES&&SES.name?', '+esc(firstName(SES.name)):''}</h1><p>${dlong(TODAY)}${SES?` · ${esc(ROLE_LABEL[SES.role]||SES.role)} · ${esc(tc(SES.jabatan))}`:''}</p></div>
  ${IMMAuth.isManager(SES)&&unread?`<button class="notif-banner press" style="--i:1" data-open-notif>${I.bell}<span><b>${f0(unread)} pemberitahuan baru</b><small>${esc(NOTIF.unread[0].pesan)}</small></span>${I.chev}</button>`:''}
  ${lead({tone:'mark',i:1,headline,foot:`<p class="lead-note">${bu==='ALL'?'Semua BU':esc(bu)} · angka terbaru yang tersedia di spreadsheet, tanggalnya tertulis di tiap kartu.</p>`})}
  <div class="kgrid" style="--i:2">
    ${kpiCard({label:'Akurasi DC Tallo',icon:I.ok,state:sAk,keys:'wtwH,wtwA',reason:ak.reason,value:sAk==='ok'?f2(ak.pct):'',unit:'%',date:ak.date,link:L.akurasi,tone:sAk==='ok'?(ak.pct>=99?'good':'warn'):'',
      sub:sAk==='ok'?`Cycle count lokasi · ${f0(ak.selisih)} selisih dari ${f0(ak.target)} lokasi`:'',bar:sAk==='ok'?ak.pct:null})}
    ${kpiCard({label:'Occupancy',icon:I.layers,state:sOc,keys:'occH,occA,occAll',reason:oc.reason,value:sOc==='ok'?f1(oc.pct):'',unit:'%',date:oc.date,link:L.occupancy,tone:occTone,
      sub:sOc==='ok'?`${fC(oc.used)} dari ${fC(oc.cap)} CBM${oc.free<0?` · lebih ${fC(-oc.free)} CBM`:` · sisa ${fC(oc.free)} CBM`}`:'',bar:sOc==='ok'?oc.pct:null})}
    ${kpiCard({label:'Barang damage (Sloc 1001)',icon:I.crit,state:sDm,keys:'barus',reason:dm.reason,value:sDm==='ok'?fC(dm.qty):'',unit:'qty',date:null,link:L.damage,
      sub:sDm==='ok'?`${fC(dm.sku)} SKU on hand${dm.month?' · '+esc(tc(dm.month)):''}<br><span class="kc-note">Nilai rupiah belum ada di spreadsheet</span>`:''})}
    ${kpiCard({label:'SLA Outbound',icon:I.truck,state:sSl,keys:'ldH,ldA',reason:sl.reason,value:sSl==='ok'&&sl.cust!=null?f1(sl.cust):'–',unit:'%',date:sl.date,link:L.sla,tone:sSl==='ok'&&sl.cust!=null&&sl.std!=null?(sl.cust>=sl.std?'good':'crit'):'',
      sub:sSl==='ok'?`Customer · Store ${sl.store!=null?f1(sl.store)+'%':'–'} · standar ${sl.std!=null?f0(sl.std)+'%':'–'}`:''})}
    ${kpiCard({label:'Incoming container',icon:I.ship,state:sInc,keys:'',wide:true,link:L.container,value:sInc==='ok'?f0(inc.total.n):'',unit:'kontainer',
      sub:sInc==='ok'?`<span class="inc3">${[['POO','poo','Tunggu kapal'],['OTW','otw','Berlayar'],['POD','pod','Di pelabuhan']].map(([l,k,x])=>`<span><b>${f0(inc[k].n)}</b><em>${l}</em><small>${x} · ${f0(inc[k].te)} TEUs</small></span>`).join('')}</span>`:''})}
  </div>
  ${!SES?'':`<p class="foot" style="--i:3">Data dari ${f0(Object.keys(IMMSrc.DOCS).length)} spreadsheet. Ketuk kartu untuk rinciannya${Object.values(L).some(x=>!x)?' (kartu tanpa panah: menu tidak termasuk aksesmu)':''}.</p>`}`;
}

// ---------- LIST (hub) ----------
function pageHub(){
  const ids=IMMAuth.visibleMenus(SES);
  const badge=id=>id==='infra'&&WOS.pending>0?`<span class="hub-badge">${f0(WOS.pending)}</span>`:'';
  return `<div class="hello slim" style="--i:0"><h1>List</h1><p>${f0(ids.length)} menu sesuai akses ${esc(tc(SES?SES.jabatan:''))} ${esc(ROLE_LABEL[SES&&SES.role]||'')}</p></div>
  <div class="hub" style="--i:1">${ids.map((id,i)=>{const m=IMMAuth.menu(id);const subs=subsFor(id);
    return `<button class="hub-i press" data-go-list="${id}" style="animation-delay:${i*30}ms"><span class="hub-ic">${MENU_IC[id]||I.grid}</span>${badge(id)}<span class="hub-t">${esc(m.label)}</span><span class="hub-d">${esc(m.desc)}</span><span class="hub-s">${subs.length>1?f0(subs.length)+' bagian':esc((m.subs.find(s=>s.id===subs[0])||{}).label||'')}</span></button>`}).join('')}</div>
  ${ids.length<=1?`<p class="foot">Menu lain mengikuti jabatan di Master User. Hubungi admin bila aksesmu perlu ditambah.</p>`:''}`;
}
// Kepala halaman sub menu: kembali + judul + pilihan bagian
function listHead(){
  const {menu,sub}=S.route;const m=IMMAuth.menu(menu);if(!m)return '';
  const subs=subsFor(menu);const lab=id=>id==='tools'?'Alat tim Inbound':((m.subs.find(s=>s.id===id)||{}).label||id);
  let pick='';
  if(sub==='tools'){pick=''}
  else if(menu==='dashboard'&&subs.length>1)pick=`<button class="dept-pick press" data-open-dept aria-haspopup="dialog"><span class="dp-ic">${DEPT_IC[sub]||I.pulse}</span><span><small>Departemen</small><b>${esc(lab(sub))}</b></span>${I.down}</button>`;
  else if(subs.length>1)pick=`<div class="seg mm-seg" role="group" aria-label="Bagian ${esc(m.label)}"><span class="knob"></span>${subs.map(s=>`<button data-mm-sub="${s}" aria-pressed="${s===sub}">${esc(lab(s))}</button>`).join('')}</div>`;
  return `<div class="lh" style="--i:0"><button class="icon-btn press" data-mm-back aria-label="${sub==='tools'?'Kembali ke Dashboard Inbound':'Kembali ke List'}">${I.left}</button><div class="lh-t"><h1>${esc(sub==='tools'?'Alat tim Inbound':m.label)}</h1><p>${esc(sub==='tools'?'Putaway, Productivity, MPP detail':m.desc)}</p></div></div>${pick?`<div class="lh-pick" style="--i:0">${pick}</div>`:''}`;
}
function openDept(){
  const subs=subsFor('dashboard'),cur=S.route.sub;
  sheet(sHead('Pilih departemen','Dashboard per departemen','',false),`<div class="bu-opts">${subs.map(d=>{const l=(IMMAuth.DEPTS.find(x=>x[0]===d)||[])[1]||d;return `<button class="bu-opt press" aria-selected="${d===cur}" data-dept-set="${d}"><span class="bu-opt-logos all">${DEPT_IC[d]||I.pulse}</span><span class="bu-opt-t"><b>${esc(l)}</b></span>${d===cur?I.ok:''}</button>`}).join('')}</div>`);
}
// halaman List generik (menu baru); modul lain mendaftar lewat MM_PAGES[menu] = fungsi(sub)
const MM_PAGES={};
function pageMM(){
  const {menu,sub}=S.route;const f=MM_PAGES[menu];
  if(f)return f(sub);
  return notWired('Sedang disiapkan','Menu ini belum tersedia.',1);
}

// ---------- pemberitahuan Manager (dalam aplikasi) ----------
const NOTIF={rows:[],unread:[],at:0,busy:false};
const WOS={pending:0};
async function notifPoll(force){
  if(!SES||!IMMAuth.isManager(SES)||!IMMStore.configured()||NOTIF.busy)return;
  if(!force&&Date.now()-NOTIF.at<110e3)return;NOTIF.busy=true;
  try{const rows=await IMMStore.notifList(addD(TODAY,-30));NOTIF.rows=rows;NOTIF.unread=rows.filter(r=>(r.dibaca_oleh||[]).indexOf(SES.nik)<0);NOTIF.at=Date.now();
    const wos=await IMMStore.woList();WOS.pending=wos.filter(w=>w.status==='menunggu').length;renderShell();if(S.page==='mmhome'||S.page==='hub')render()}
  catch(e){}finally{NOTIF.busy=false}
}
setInterval(()=>{if(!document.hidden)notifPoll(false)},120e3);
function openNotif(){
  const rows=NOTIF.rows.slice(0,40);
  sheet(sHead('Pemberitahuan',`${f0(NOTIF.unread.length)} belum dibaca`,'',false),
    `${rows.length?`<div class="list">${rows.map(r=>{const unread=(r.dibaca_oleh||[]).indexOf(SES.nik)<0;return `<button class="row press notif-row${unread?' unread':''}" data-go-wo="${esc(r.ref||'')}"><span class="a">${unread?'<i class="nd"></i>':''}${esc(r.pesan)}</span><span class="b">${esc(new Date(r.at).toLocaleString('id-ID',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}))}</span><span class="v">${I.chev}</span></button>`}).join('')}</div>`:emptyState('Belum ada pemberitahuan','Pemberitahuan Work Order muncul di sini.',false,I.bell)}
     ${NOTIF.unread.length?`<button class="btn ghost block press" data-notif-read>Tandai semua sudah dibaca</button>`:''}`);
}
async function notifReadAll(){
  const ids=NOTIF.unread.map(r=>r.id);if(!ids.length)return;
  try{await IMMStore.notifRead(ids,SES.nik);NOTIF.rows.forEach(r=>{if(ids.indexOf(r.id)>=0)(r.dibaca_oleh=r.dibaca_oleh||[]).push(SES.nik)});NOTIF.unread=[];renderShell();render()}catch(e){toast('Gagal menandai. Coba lagi.')}
}

// ---------- SETTINGS ----------
function pageMMSet(){
  const v=currentVersion();const liveOk=!!livePlugin();const nG=Object.keys(IMMUi.GLOSSARY).length;
  const lastPull=USERS.at?new Date(USERS.at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}):'';
  return `
  <header class="set-head" style="--i:0"><span class="mark">${(document.getElementById('brandMark')||{}).innerHTML||''}</span>
    <div class="set-id"><h1>Settings</h1><p>Mini Monitoring · DC Tallo Makassar</p></div>
    <dl class="set-meta"><div><dt>Versi</dt><dd>${esc(v)}</dd></div><div><dt>Akun</dt><dd>${SES?esc(SES.nik):'–'}</dd></div><div><dt>Data</dt><dd>${D&&D.snap?esc(D.snap.split('T')[1]||''):'–'}</dd></div></dl>
  </header>
  <section class="card" style="--i:1"><div class="ch"><span class="hic">${I.user}</span><h2>Akun</h2></div><div class="cb">
    <dl class="kv"><dt>Nama</dt><dd>${SES&&SES.name?esc(tc(SES.name)):'–'}</dd><dt>NIK</dt><dd class="mono">${SES?esc(SES.nik):'–'}</dd><dt>Role</dt><dd>${SES?esc(ROLE_LABEL[SES.role]||SES.role):'–'}</dd><dt>Jabatan</dt><dd>${SES?esc(tc(SES.jabatan)):'–'}</dd></dl>
    <p class="foot" style="padding:8px 0 0">Role dan jabatan mengikuti Master User APK${lastPull?` (dicek ${esc(lastPull)})`:''}. Menu List menyesuaikan otomatis.</p>
  </div></section>
  <section class="card" style="--i:2"><div class="ch"><span class="hic">${I.sun}</span><h2>Tampilan</h2></div><div class="cb">
    <div style="margin-bottom:12px">${seg('theme',[['auto','Otomatis'],['light','Terang'],['dark','Gelap']],S.theme)}</div>
    <div class="set-group"><button class="set-row press" data-toggle="calm"><span class="ic">${I.motion}</span><span><div class="t">Kurangi animasi</div><div class="x">Matikan animasi masuk, angka berjalan, dan transisi</div></span><span class="end">${S.calm?tag('Aktif','good'):tag('Mati')}</span></button></div>
  </div></section>
  <section class="card" style="--i:3"><div class="ch"><span class="hic">${I.dl}</span><h2>Versi & pembaruan</h2></div><div class="cb"><div class="set-group">
    <div class="set-row"><span class="ic">${I.info}</span><span><div class="t">Versi APK</div><div class="x">${esc(v)}${CFG.nativeBase?` · basis aplikasi ${esc(CFG.nativeBase)}`:''} · ${NATIVE?'Android':'Browser'}</div></span><span class="end"></span></div>
    <div class="set-row"><span class="ic">${I.spark}</span><span><div class="t">Live Akses</div><div class="x">${liveOk?'Aktif: perubahan tampilan dipasang langsung tanpa instal APK':'Tersedia di aplikasi Android'}</div></span><span class="end">${liveOk?tag('Aktif','good'):tag('–')}</span></div>
    <button class="set-row press" id="updCheck"><span class="ic">${I.dl}</span><span><div class="t">Pembaruan</div><div class="x">Periksa versi baru${S.updChecked?` · dicek ${esc(S.updChecked)}`:''}</div></span><span class="end">${I.chev}</span></button>
  </div></div></section>
  <section class="card" style="--i:4"><div class="ch"><span class="hic">${I.db}</span><h2>Database Spreadsheet</h2></div><div class="cb"><div class="set-group">
    <button class="set-row press" data-open-db><span class="ic">${I.db}</span><span><div class="t">Sumber data</div><div class="x">${f0(IMMSrc.LINKS.length)} spreadsheet per departemen · status muat</div></span><span class="end">${I.chev}</span></button>
    <button class="set-row press" data-open-gaps><span class="ic">${I.info}</span><span><div class="t">Data yang belum tersedia</div><div class="x">${f0(GAPS.length)} angka menunggu sumber spreadsheet</div></span><span class="end">${I.chev}</span></button>
    <button class="set-row press" data-gloss=""><span class="ic">${I.doc}</span><span><div class="t">Kamus istilah</div><div class="x">${nG} istilah yang dipakai di aplikasi</div></span><span class="end">${I.chev}</span></button>
  </div></div></section>
  <section class="card" style="--i:5"><div class="ch"><span class="hic">${I.star}</span><h2>Tentang</h2></div><div class="cb">
    <dl class="kv"><dt>Aplikasi</dt><dd>Mini Monitoring</dd><dt>Lokasi</dt><dd>DC Tallo Makassar</dd><dt>Brand</dt><dd>Informa · Selma · Azko · Ataru · Krisbow · Toys Kingdom · Chatime · Eyesoul</dd><dt>Dibuat oleh</dt><dd>Tim Inbound DC Tallo</dd></dl>
  </div></section>
  <button class="btn ghost block press logout" data-logout style="--i:6">${I.logout}Keluar</button>`;
}
const GAPS=[
  ['Home','Nilai rupiah barang damage (Sloc 1001)'],['Storing','Pressing'],['Storing','Outstanding floor (label di sheet berisi occupancy)'],
  ['Outbound','Aging LC → Check in → Open → Close'],['Outbound','Outstanding location pack'],['Outbound','Rit 1/Rit 2 bulan ini (logbook berhenti 15 Sep)'],
  ['Inventory','Root cause Pressing, Adjustment Plus/Minus, Miss Cycle'],['Inventory','Demand Inventory'],['LPPBPO','LPPBPO Outbound (DC ke store)'],
  ['MPP','Standar produktivitas dan kehadiran per departemen'],['Layout','Stok per lokasi terbaru (file layout terakhir 2025)'],['BU','Banyak data Storing/Outbound hanya untuk AHI; KWI dan TGI jarang tersedia']];
function openDb(){
  const groups={};IMMSrc.LINKS.forEach(([g,k,t])=>{(groups[g]=groups[g]||[]).push([k,t])});
  const stat=docKey=>{const ks=Object.keys(IMMSrc.REG).filter(k=>IMMSrc.REG[k].doc===docKey&&SRC[k]);if(!ks.length)return tag('–');return ks.some(k=>SRC[k].st==='error'&&!SRC[k].res)?tag('Gagal','crit'):ks.some(k=>SRC[k].st==='loading')?tag('Memuat'):tag('OK','good')};
  sheet(sHead('Database Spreadsheet','Ketuk untuk membuka di browser','',false),
    Object.entries(groups).map(([g,xs])=>`<div class="lt-sec">${esc(g)}</div><div class="set-group">${xs.map(([k,t])=>`<a class="set-row press" href="${IMMSrc.docUrl(k)}" target="_blank" rel="noopener"><span class="ic">${I.db}</span><span><div class="t">${esc(t)}</div></span><span class="end">${stat(k)}${I.ext}</span></a>`).join('')}</div>`).join('')
    +`<p class="foot">Status OK berarti sudah terbaca di HP ini. Spreadsheet harus dibagikan "Siapa saja yang memiliki link".</p>`);
}
function openGaps(){sheet(sHead('Data yang belum tersedia','Kartu ini tampil "Belum tersambung" sampai sumbernya ada','',false),`<dl class="gloss-list">${GAPS.map(([a,b])=>`<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl><p class="foot">Kirim link spreadsheet sumbernya ke tim pengembang agar angka ini bisa ditampilkan.</p>`)}

// ---------- klik (fase capture: ditangani lebih dulu dari penangan lama, lalu dihentikan) ----------
function mmClick(e){
  const g=s=>e.target.closest(s);let t;
  if(g('#login'))return false; // layar masuk menangani formnya sendiri (submit)
  if(t=g('[data-go-list]')){const [m,s]=t.dataset.goList.split('/');go('list',m,s||'');return}
  if(g('[data-mm-back]')){mmBack();return}
  if(t=g('[data-mm-sub]')){go('list',S.route.menu,t.dataset.mmSub);return}
  if(g('[data-open-dept]')){openDept();return}
  if(t=g('[data-dept-set]')){closeSheet();go('list','dashboard',t.dataset.deptSet);return}
  if(g('[data-open-bu]')){openBU();return}
  if(t=g('[data-bu-set]')){setBU(t.dataset.buSet);return}
  if(t=g('[data-src-retry]')){const ks=(t.dataset.srcRetry||'').split(',').filter(Boolean);buzz(6);if(ks.length)srcRefresh(ks);else loadData(true);render();return}
  if(g('[data-open-notif]')){openNotif();return}
  if(g('[data-notif-read]')){notifReadAll();closeSheet();return}
  if(t=g('[data-go-wo]')){closeSheet();S.woOpen=t.dataset.goWo||'';go('list','infra','workorder',{force:true});return}
  if(g('[data-logout]')){logout();return}
  if(g('[data-open-db]')){openDb();return}
  if(g('[data-open-gaps]')){openGaps();return}
  return false;
}
document.addEventListener('click',e=>{if(mmClick(e)!==false)e.stopPropagation()},true);
addEventListener('hashchange',()=>{if(mmHash()!==location.hash.slice(1)){const was=S.page;readHash();inbEnter(was);render(true)}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){rollDay();notifPoll(false);if(SES&&Date.now()-USERS.at>30*60e3)loadUsers(false).catch(()=>{})}});
setInterval(rollDay,60e3);
readHash(); // halaman awal sesuai alamat (#home, #list/…, #set)
