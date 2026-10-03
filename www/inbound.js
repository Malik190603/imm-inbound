// ======================= MENU INBOUND =======================
// Terkunci sandi (berlaku 2 jam per HP). Isi: Putaway, TTO/Dokumen, Productivity, MPP detail.
I.lock='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="9" width="12" height="8" rx="2"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9M10 12.5v1.5"/></svg>';
I.cam='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5a1.5 1.5 0 0 1 1.5-1.5H6l1.2-1.8h5.6L14 6h1.5A1.5 1.5 0 0 1 17 7.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 14.5z"/><circle cx="10" cy="11" r="2.8"/></svg>';
const INB_ITEMS=[['put','Putaway','LPN yang diputaway ke lokasi FLR',I.box],['tto','TTO/Dokumen','Serah terima dokumen dan barang',I.doc],['prod','Productivity','CBM Receive dan Putaway per operator',I.trend],['mpp','MPP detail','Profil tim inbound',I.users]];
const INB_UNLOCK_KEY='imm.inb.unlock';
let inbPwErr='';
function inbUnlocked(){return IMMCore.unlockValid(LS.get(INB_UNLOCK_KEY),Date.now())}
function inbShowsFilter(){return inbUnlocked()&&['put','tto','prod'].includes(S.inb)}

function inbLock(){
  return `<div class="hello" style="--i:0"><h1>Inbound</h1><p>Khusus tim inbound DC Tallo</p></div>
  <section class="card inb-lock" style="--i:1"><div class="cb">
    <span class="inb-lock-ic">${I.lock}</span>
    <h2>Menu ini terkunci</h2><p>Masukkan kata sandi tim inbound. Setelah benar, menu terbuka selama 2 jam di HP ini.</p>
    <label class="inb-field"><span>Kata sandi</span><input id="inbPw" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" placeholder="Kata sandi"></label>
    <p class="inb-err" id="inbErr" role="alert">${esc(inbPwErr)}</p>
    <button class="btn block press" id="inbGo">Buka</button>
  </div></section>`;
}
async function inbTryUnlock(){
  const el=document.getElementById('inbPw');if(!el)return;const pw=el.value;
  if(!pw){inbPwErr='Isi kata sandi dulu.';render();return}
  let ok=false;try{ok=await IMMCore.checkPassword(pw)}catch(e){inbPwErr='Sandi tidak bisa diperiksa di HP ini.';render();return}
  if(ok){inbPwErr='';LS.set(INB_UNLOCK_KEY,Date.now());S.inb='';buzz(12);render(true)}
  else{inbPwErr='Sandi salah. Coba lagi.';buzz(30);render();const n=document.getElementById('inbPw');n&&n.focus()}
}
function inbList(){
  return `<div class="hello" style="--i:0"><h1>Inbound</h1><p>Pilih yang mau dibuka</p></div>
  <section class="card" style="--i:1"><div class="cb"><div class="set-group">${INB_ITEMS.map(([k,l,x,ic])=>`<button class="set-row press" data-inb="${k}"><span class="ic">${ic}</span><span><div class="t">${l}</div><div class="x">${x}</div></span><span class="end">${I.chev}</span></button>`).join('')}</div></div></section>`;
}
function inbHead(title,sub){return `<div class="inb-head" style="--i:0"><button class="icon-btn press" data-inb-back aria-label="Kembali ke daftar Inbound">${I.left}</button><div class="hello"><h1>${title}</h1><p>${sub}</p></div></div>`}
function inbMpp(){
  const groups=[];IMMCore.MPP.forEach(p=>{let g=groups.find(x=>x.title===p.title);if(!g){g={title:p.title,people:[]};groups.push(g)}g.people.push(p)});
  const ini=n=>n.replace(/[^A-Za-z ]/g,'').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('');
  return inbHead('MPP detail',`${IMMCore.MPP.length} orang · tim inbound DC Tallo`)+groups.map((g,i)=>`<section class="card" style="--i:${i+1}"><div class="ch"><span class="hic">${I.users}</span><h2>${esc(g.title)}</h2><span class="hint">${g.people.length} orang</span></div><div class="cb"><div class="mpp">${g.people.map(p=>`<div class="mpp-p"><span class="mpp-av">${ini(p.name)}</span><span><div class="mpp-n">${esc(p.name)}</div><div class="mpp-b">${esc(p.bu)}</div></span></div>`).join('')}</div></div></section>`).join('');
}
function inbSoon(title){return inbHead(title,'')+`<section class="card" style="--i:1">${emptyState('Sedang disiapkan','Halaman ini belum tersedia.',false,I.box)}</section>`}
const INB_PAGES={mpp:inbMpp,put:()=>inbSoon('Putaway'),tto:()=>inbSoon('TTO/Dokumen'),prod:()=>inbSoon('Productivity')};
function pageInbound(){
  if(!inbUnlocked())return inbLock();
  if(!S.inb||!INB_PAGES[S.inb])return inbList();
  return INB_PAGES[S.inb]();
}
function inboundBack(){if(S.page!=='inb'||!S.inb||!inbUnlocked())return false;S.inb='';S.more={};render(true);window.scrollTo({top:0});return true}
function inboundClick(e){
  if(S.page!=='inb')return false;const g=s=>e.target.closest(s);let t;
  if(g('#inbGo')){inbTryUnlock();return true}
  if(g('[data-inb-back]')){inboundBack();return true}
  if(t=g('[data-inb]')){if(!inbUnlocked()){render();return true}S.inb=t.dataset.inb;S.more={};buzz(6);render(true);window.scrollTo({top:0});return true}
  return false;
}
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target&&e.target.id==='inbPw'){e.preventDefault();inbTryUnlock()}});
