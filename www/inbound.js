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

// ---------- Data sheet inbound (stock + transit), dimuat saat menu Inbound dibuka ----------
const DOC_INB='1crYUpCJSYHrfBbZ99aUee3v4hRJrxWw4XRIryl9rong',GID_STOCK='349104626',GID_TRANSIT='2022396471';
const INB={state:'idle',stock:[],transit:[],err:{},at:0};
let inbLoading=null;
// Kolom dicari lewat judulnya: baca baris judul dulu, lalu ambil hanya kolom yang dipakai.
async function inbFetchSheet(gid,needed,label){
  const get=async tq=>{let r;try{r=await fetch(gvizUrl({doc:DOC_INB,gid,csv:true,h:1,tq}),{cache:'no-store'})}catch(e){throw new Error('Tidak bisa terhubung ke Google Sheets. Cek koneksi internet.')}
    if(!r.ok)throw new Error(`Sheet ${label} gagal dibaca (HTTP ${r.status}).`);const t=await r.text();
    if(/^\s*</.test(t))throw new Error(`Sheet ${label} tidak bisa dibaca. Pastikan dibagikan "Siapa saja yang memiliki link".`);return parseCSV(t)};
  const head=(await get('select * limit 1'))[0]||[];const headers=head.map(h=>String(h).trim());
  const miss=IMMCore.missingHeaders(headers,needed);
  if(miss.length)throw new Error(`Kolom ${miss.join(', ')} tidak ditemukan di sheet ${label}.`);
  const cols=needed.map(h=>IMMCore.columnLetter(headers.indexOf(h)));
  const o=IMMCore.toObjects(await get('select '+cols.join(',')));
  const miss2=IMMCore.missingHeaders(o.headers,needed);
  if(miss2.length)throw new Error(`Kolom ${miss2.join(', ')} tidak ditemukan di sheet ${label}.`);
  return o.rows;
}
function loadInbound(force){
  if(inbLoading)return inbLoading;
  if(!force&&INB.state==='ok'&&Date.now()-INB.at<5*60e3)return Promise.resolve();
  INB.state=INB.at?'refreshing':'loading';
  inbLoading=(async()=>{
    const [st,tr]=await Promise.allSettled([inbFetchSheet(GID_STOCK,IMMCore.STOCK_HEADERS,'stock'),inbFetchSheet(GID_TRANSIT,IMMCore.TRANSIT_HEADERS,'transit')]);
    INB.err={};
    if(st.status==='fulfilled')INB.stock=st.value;else INB.err.stock=st.reason.message||String(st.reason);
    if(tr.status==='fulfilled')INB.transit=tr.value;else INB.err.transit=tr.reason.message||String(tr.reason);
    INB.state=(INB.err.stock&&INB.err.transit)?'error':'ok';INB.at=Date.now();inbLoading=null;
    if(S.page==='inb')render();
  })();
  return inbLoading;
}
const inbBusy=()=>INB.state==='idle'||INB.state==='loading';
const inbSkeleton=()=>`<div class="sk" style="height:84px"></div><div class="sk" style="height:120px"></div><div class="sk" style="height:120px"></div>`;
const inbErrCard=(title,msg,i=1)=>`<section class="card" style="--i:${i}">${emptyState(title,esc(msg),false,I.crit)}<div class="empty" style="padding-top:0"><button class="btn press" data-inb-reload>Coba lagi</button></div></section>`;
const inbOpt=()=>{const [from,to]=range();return {from,to,bu:allBU()?'ALL':[...F().bus]}};

// ---------- Putaway ----------
let PUT_LIST=[];
const lpnTag=l=>l.kind==='damage'?tag('Damage','crit'):'';
function inbPutaway(){
  const head=inbHead('Putaway',`LPN ke lokasi FLR · ${esc(rlabel())}`);
  if(inbBusy())return head+inbSkeleton();
  if(INB.err.stock)return head+inbErrCard('Data putaway belum bisa dibaca',INB.err.stock);
  PUT_LIST=IMMCore.putawayLpns(INB.stock,inbOpt());
  const q=(S.q.put||'').toUpperCase().replace(/\s+/g,'');
  const fl=q?PUT_LIST.filter(l=>(l.lpn+' '+l.tolocs.join(' ')).toUpperCase().replace(/\s+/g,'').includes(q)):PUT_LIST;
  const nDmg=PUT_LIST.filter(l=>l.kind==='damage').length,nMix=PUT_LIST.filter(l=>l.mixed).length;const n=lim('put',20);
  return head+`<section class="card pad" style="--i:1"><div class="put-sum">
      <div><b>${cnt(PUT_LIST.length)}</b><span>LPN</span></div><div class="${nDmg?'crit':''}"><b>${cnt(nDmg)}</b><span>damage</span></div><div class="${nMix?'warn':''}"><b>${cnt(nMix)}</b><span>campur Dept</span></div>
    </div></section>
    <section class="card" style="--i:2"><div class="ch"><span class="hic">${I.box}</span><h2>Daftar LPN</h2><span class="hint">${f0(fl.length)} LPN</span><div class="right" style="flex:1 1 170px;max-width:230px">${searchBox('put','Cari LPN / lokasi')}</div></div>
    <div class="cb" style="padding-top:6px">${fl.length?`<div class="lpns">${fl.slice(0,n).map(l=>`<button class="lpn press${l.kind==='damage'?' dmg':''}" data-lpn="${esc(l.lpn)}">
        <div class="lpn-top"><span class="mono lpn-id">${esc(l.lpn)}</span>${lpnTag(l)}<span class="lpn-time">${l.date!==TODAY?dshort(l.date)+' ':''}${esc(l.time)}</span></div>
        <div class="lpn-loc">${I.port}<span>${l.tolocs.map(esc).join(', ')}</span></div>
        <div class="lpn-meta"><span>${l.items.length} SKU</span><span>${f0(l.qty)} qty</span><span>${f2(l.cbm)} CBM</span>${buTag(l.bu||'-')}<span>${esc(l.operator)}</span></div>
        ${l.mixed?`<div class="lpn-warn">${I.warn}<span><b>Campur Dept</b> · ${l.depts.map(esc).join(', ')}</span></div>`:''}
      </button>`).join('')}</div>${moreBtn('put',fl.length,n)}`:emptyState(q?'Tidak ditemukan':'Belum ada putaway',q?'Tidak ada LPN atau lokasi yang cocok.':`Tidak ada LPN yang diputaway ke lokasi FLR ${esc(rlabel())}.`,!q,I.box)}</div></section>`;
}
function openLpn(id){
  const l=PUT_LIST.find(x=>x.lpn===id);if(!l)return;
  const depts=groupBy(l.items,i=>i.dept,k=>({k,qty:0,n:0}),(g,i)=>{g.qty+=i.qty;g.n++});
  sheet(sHead(esc(l.lpn),`<span><b>${dlong(l.date)}</b> ${esc(l.time)}</span>${buTag(l.bu||'-')}<span>${esc(l.operator)}</span>`,lpnTag(l)),
    `<div class="lpn-loc big">${I.port}<span>${l.tolocs.map(esc).join(', ')}</span></div>
     ${l.mixed?`<div class="lpn-warn">${I.warn}<span><b>Campur Dept</b> · LPN ini berisi ${l.depts.length} Dept: ${depts.map(d=>`${esc(d.k)} (${d.n} SKU)`).join(', ')}</span></div>`:''}
     <div><h4>Isi LPN · ${l.items.length} SKU · ${f0(l.qty)} qty · ${f2(l.cbm)} CBM</h4><div class="list">${l.items.map(i=>`<div class="row"><span class="a" style="font-size:13px;white-space:normal">${esc(i.desc||'-')}</span><span class="b" style="white-space:normal"><span class="mono">${esc(i.sku)}</span> · Dept ${esc(i.dept)}${l.tolocs.length>1?' · '+esc(i.toloc):''}</span><span class="v">${f0(i.qty)}<small>qty</small></span></div>`).join('')}</div></div>`);
}
// ---------- Productivity ----------
function inbProd(){
  const head=inbHead('Productivity',`CBM Receive dan Putaway · ${esc(rlabel())}`);
  if(inbBusy())return head+inbSkeleton();
  if(INB.err.stock&&INB.err.transit)return head+inbErrCard('Data productivity belum bisa dibaca',INB.err.stock);
  const o=inbOpt(),st=INB.err.stock?[]:INB.stock,tr=INB.err.transit?[]:INB.transit;
  const P=IMMCore.productivity(st,tr,o);const tot=x=>x.rcv+x.put;const teamTot=tot(P.team);
  const errs=[INB.err.stock,INB.err.transit].filter(Boolean);
  const ins=[];const top=P.ops[0];const active=P.ops.filter(x=>tot(x)>0);
  if(teamTot>0){
    ins.push({c:'h',h:'Tertinggi',t:`<b>${esc(top.name)}</b> paling banyak: ${f2(top.rcv)} CBM receive dan ${f2(top.put)} CBM putaway (${pc(tot(top),teamTot)}% dari total tim).`});
    const idle=P.ops.filter(x=>tot(x)===0);
    ins.push({c:idle.length?'w':'',h:'Operator aktif',t:`<b>${active.length} dari ${P.ops.length}</b> operator punya transaksi ${esc(rlabel())}.${idle.length?` Belum ada: ${idle.map(x=>esc(x.name)).join(', ')}.`:''}`});
    const rT=P.ops.reduce((a,x)=>a+x.rcvTransit,0),pS=P.ops.reduce((a,x)=>a+x.putStock,0);
    ins.push({h:'Stock dan transit',t:`Receive: <b>${pc(rT,P.team.rcv)}%</b> dari transit, sisanya stock. Putaway stock ${f2(pS)} CBM dari total ${f2(P.team.put)} CBM.`});
    const [from,to]=range();
    if(from>'1000'&&to<'9000'){const n=days(from,to);const Q=IMMCore.productivity(st,tr,{from:addD(from,-n),to:addD(from,-1),bu:o.bu});const q=tot(Q.team);
      if(q>0){const d=(teamTot-q)/q*100;ins.push({c:d<0?'w':'',h:'Dibanding periode sebelumnya',t:`Total tim <b>${d>=0?'naik':'turun'} ${f0(Math.abs(d))}%</b> dibanding ${dshort(addD(from,-n))}${n>1?' – '+dshort(addD(from,-1)):''} (${f2(q)} CBM → ${f2(teamTot)} CBM).`})}}
    if(P.days.length>1){const best=P.days.slice().sort((a,b)=>tot(b)-tot(a))[0];ins.push({h:'Hari tersibuk',t:`<b>${dday(best.d)}</b>: ${f2(best.rcv)} CBM receive dan ${f2(best.put)} CBM putaway.`})}
  }
  const mx=Math.max(1e-9,...P.ops.map(x=>Math.max(x.rcv,x.put)));
  const bar=(lbl,v,s,t,c)=>`<div class="prod-row"><div class="prod-l"><span>${lbl}</span> <b>${f2(v)}</b> <small>CBM</small></div><div class="prod-bar"><i style="width:${v/mx*100}%;background:${c}"></i></div><div class="prod-s">stock ${f2(s)} · transit ${f2(t)}</div></div>`;
  const [from,to]=range();const multi=from!==to;
  const bks=multi?bucketize(from,to,P.days,d=>d.d,d=>[d.rcv,d.put],2):[];
  const SER=[{name:'Receive',color:'var(--lg2)'},{name:'Putaway',color:'var(--lg3)'}];
  return head+
  (errs.length?`<div class="inb-note" style="--i:1">${I.warn}<span>${errs.map(esc).join(' ')} Angka di bawah hanya dari sheet yang terbaca.</span></div>`:'')+
  `<section class="card pad" style="--i:1"><div class="prod-team">
    <div><span>Receive</span><b>${cnt(P.team.rcv,2)}</b><small>CBM · tim</small></div><div><span>Putaway</span><b>${cnt(P.team.put,2)}</b><small>CBM · tim</small></div>
  </div></section>
  <div style="--i:2">${insights('Ringkasan pintar',ins)}</div>
  <section class="card" style="--i:3"><div class="ch"><span class="hic">${I.users}</span><h2>Per operator</h2><span class="hint">urut dari tertinggi</span></div><div class="cb">${teamTot>0?'':`<p class="foot" style="padding:0 0 8px">Belum ada transaksi yang dihitung ${esc(rlabel())}.</p>`}<div class="prod-ops">${P.ops.map((x,i)=>`<div class="prod-op"><div class="prod-top"><span class="rank${i===0&&tot(x)>0?' first':''}">${i+1}</span><span class="prod-n">${esc(x.name)}</span><span class="prod-id mono">${x.id}</span></div>${bar('Receive',x.rcv,x.rcvStock,x.rcvTransit,'var(--lg2)')}${bar('Putaway',x.put,x.putStock,x.putTransit,'var(--lg3)')}</div>`).join('')}</div></div></section>
  ${multi&&bks.length?`<section class="card" style="--i:4"><div class="ch"><span class="hic">${I.trend}</span><h2>CBM per ${bks[0].mode==='m'?'bulan':bks[0].mode==='w'?'minggu':'hari'}</h2><span class="hint">tim</span></div><div class="cb"><div class="legend">${SER.map(s=>`<span><i class="dot" style="background:${s.color}"></i>${s.name}</span>`).join('')}</div>${stackChart('cProd',bks,SER,{unit:'CBM',fmt:f2})}</div></section>`:''}`;
}
const INB_PAGES={mpp:inbMpp,put:inbPutaway,tto:()=>inbSoon('TTO/Dokumen'),prod:inbProd};
function pageInbound(){
  if(!inbUnlocked())return inbLock();
  loadInbound();
  if(!S.inb||!INB_PAGES[S.inb])return inbList();
  return INB_PAGES[S.inb]();
}
function inboundBack(){if(S.page!=='inb'||!S.inb||!inbUnlocked())return false;S.inb='';S.more={};render(true);window.scrollTo({top:0});return true}
function inboundClick(e){
  if(S.page!=='inb')return false;const g=s=>e.target.closest(s);let t;
  if(g('#inbGo')){inbTryUnlock();return true}
  if(g('[data-inb-back]')){inboundBack();return true}
  if(!inbUnlocked())return false;
  if(g('#sync')||g('[data-inb-reload]')){buzz(6);loadInbound(true);render();return true}
  if(t=g('[data-lpn]')){openLpn(t.dataset.lpn);return true}
  if(t=g('[data-inb]')){if(!inbUnlocked()){render();return true}S.inb=t.dataset.inb;S.more={};buzz(6);render(true);window.scrollTo({top:0});return true}
  return false;
}
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target&&e.target.id==='inbPw'){e.preventDefault();inbTryUnlock()}});
