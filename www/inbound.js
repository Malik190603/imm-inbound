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

// ---------- Data sheet inbound (stock + transit), dimuat saat menu Inbound dibuka ----------
const DOC_INB='1crYUpCJSYHrfBbZ99aUee3v4hRJrxWw4XRIryl9rong',GID_STOCK='349104626',GID_TRANSIT='2022396471';
const INB={state:'idle',stock:[],transit:[],err:{},at:0};
let inbLoading=null;
// Kolom dicari lewat judulnya: baca baris judul dulu, lalu ambil hanya kolom yang dipakai.
async function inbFetchSheet(gid,needed,label){
  const get=async tq=>{if(window.IMM_SNAPSHOT)return parseCSV(String(window.IMM_SNAPSHOT[gid===GID_STOCK?'INB_STOCK':'INB_TRANSIT']||''));let r;try{r=await fetch(gvizUrl({doc:DOC_INB,gid,csv:true,h:1,tq}),{cache:'no-store'})}catch(e){throw new Error('Tidak bisa terhubung ke Google Sheets. Cek koneksi internet.')}
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
  // Tanpa 'force', jangan memuat lagi dalam 5 menit sejak percobaan terakhir, berhasil ataupun gagal (mencegah pengulangan tanpa henti saat offline).
  if(!force&&INB.at&&Date.now()-INB.at<5*60e3)return Promise.resolve();
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
function inbSourceText(){if(INB.state==='idle')return 'Dibaca saat menu Inbound dibuka';if(INB.state==='loading')return 'Memuat…';const e=[INB.err.stock,INB.err.transit].filter(Boolean);return e.length?esc(e.join(' ')):`${f0(INB.stock.length)} baris stock · ${f0(INB.transit.length)} baris transit`}
const inbBusy=()=>INB.state==='idle'||INB.state==='loading';
const inbSkeleton=()=>`<div class="sk" style="height:84px"></div><div class="sk" style="height:120px"></div><div class="sk" style="height:120px"></div>`;
const inbErrCard=(title,msg,i=1)=>`<section class="card" style="--i:${i}">${emptyState(title,esc(msg),false,I.crit)}<div class="empty" style="padding-top:0"><button class="btn press" data-inb-reload>Coba lagi</button></div></section>`;
const inbOpt=()=>{const [from,to]=range();return {from,to,bu:allBU()?'ALL':[...F().bus]}};

// ---------- Foto putaway (Supabase) ----------
const PH={map:new Map(),key:'',state:'idle',busy:false};
const phRows=lpn=>PH.map.get(lpn)||[];
function phSet(rows){PH.map=new Map();rows.forEach(r=>{if(!PH.map.has(r.lpn))PH.map.set(r.lpn,[]);PH.map.get(r.lpn).push(r)})}
function inbSyncPhotos(){
  if(!IMMStore.configured())return;const key=PUT_LIST.map(l=>l.lpn).join('|');
  if(key===PH.key&&PH.state!=='idle')return;PH.key=key;PH.state='loading';
  IMMStore.listPutawayPhotos(PUT_LIST.map(l=>l.lpn)).then(rows=>{if(PH.key!==key)return;phSet(rows);PH.state='ok'},()=>{if(PH.key===key)PH.state='error'})
    .then(()=>{if(PH.key!==key)return;phRefresh();if(S.page==='inb'&&S.inb==='put')render()});
}
function lpnPhotosHtml(l){
  if(!IMMStore.configured())return `<h4>Foto</h4><p class="foot" style="padding:0">Penyimpanan foto belum diatur.</p>`;
  const rows=phRows(l.lpn),n=rows.length,max=IMMStore.MAX_PHOTOS,dis=(n>=max||PH.busy)?'disabled':'';
  const note=PH.busy?'Mengunggah foto…':PH.state==='error'?'Foto belum bisa dimuat. Cek koneksi internet.':PH.state==='loading'?'Memuat foto…':n>=max?`Sudah ${max} foto. Hapus salah satu untuk mengganti.`:'Foto barang di lokasi tujuan. Cap waktu ditambahkan otomatis.';
  return `<h4>Foto (${n}/${max})</h4>
    ${n?`<div class="ph-grid">${rows.map(r=>`<div class="ph-item"><button class="ph-thumb press" data-photo-view="${esc(r.path)}" aria-label="Lihat foto"><img loading="lazy" src="${esc(IMMStore.photoUrl(r.path))}" alt="Foto LPN ${esc(l.lpn)}"></button><button class="ph-del press" data-photo-del="${r.id}" aria-label="Hapus foto">${I.trash}</button></div>`).join('')}</div>`:''}
    <div class="ph-actions"><button class="btn ghost press" data-photo-add="cam" ${dis}>${I.cam}Kamera</button><button class="btn ghost press" data-photo-add="gal" ${dis}>${I.doc}Galeri</button></div>
    <p class="foot" style="padding:6px 0 0">${note}</p>
    <input id="phCam" type="file" accept="image/*" capture="environment" data-photo-input hidden><input id="phGal" type="file" accept="image/*" data-photo-input hidden>`;
}
function phRefresh(){const box=document.getElementById('lpnPhotos');if(!box)return;const l=PUT_LIST.find(x=>x.lpn===box.dataset.lpn);if(l)box.innerHTML=lpnPhotosHtml(l)}
function phErrToast(e,what){const m=e&&e.message;toast(m==='BADIMAGE'?'File ini bukan foto yang bisa dibaca':m==='NOCONFIG'?'Penyimpanan foto belum diatur':what)}
async function phAdd(file){
  const box=document.getElementById('lpnPhotos');if(!box||!file||PH.busy)return;const lpn=box.dataset.lpn;const l=PUT_LIST.find(x=>x.lpn===lpn);if(!l)return;
  PH.busy=true;phRefresh();
  try{const blob=await IMMStore.preparePhoto(file,[IMMCore.stampText(new Date()),l.lpn+' → '+l.tolocs.join(', ')]);
    const row=await IMMStore.addPutawayPhoto(l.lpn,l.tolocs[0]||'',blob,deviceId());
    if(!PH.map.has(lpn))PH.map.set(lpn,[]);PH.map.get(lpn).push(row);buzz(12);toast('Foto tersimpan')}
  catch(e){if(e&&e.message==='MAX'){toast(`LPN ini sudah ${IMMStore.MAX_PHOTOS} foto`);try{PH.map.set(lpn,await IMMStore.listPutawayPhotos([lpn]))}catch(_){}}
    else phErrToast(e,'Foto gagal diunggah. Coba lagi.')}
  PH.busy=false;phRefresh();if(S.page==='inb'&&S.inb==='put')render();
}
async function phDel(id){
  const box=document.getElementById('lpnPhotos');if(!box)return;const lpn=box.dataset.lpn;const row=phRows(lpn).find(r=>String(r.id)===String(id));if(!row)return;
  if(!confirm('Hapus foto ini? Foto yang dihapus tidak bisa dikembalikan.'))return;
  try{await IMMStore.removePutawayPhoto(row);PH.map.set(lpn,phRows(lpn).filter(r=>r!==row));toast('Foto dihapus')}catch(e){phErrToast(e,'Foto gagal dihapus. Coba lagi.')}
  phRefresh();if(S.page==='inb'&&S.inb==='put')render();
}
function photoView(path){const el=document.createElement('div');el.id='photoView';el.innerHTML=`<button class="icon-btn press" data-pv-x aria-label="Tutup">${I.x}</button><img src="${esc(IMMStore.photoUrl(path))}" alt="Foto">`;document.body.appendChild(el)}
function inboundOverlayBack(){const pv=document.getElementById('photoView');if(pv){pv.remove();return true}return false}

// ---------- Putaway ----------
let PUT_LIST=[];
const lpnTag=l=>l.kind==='damage'?tag('Damage','crit'):'';
function inbPutaway(){
  const head=inbHead('Putaway',`LPN ke lokasi FLR · ${esc(rlabel())}`);
  if(inbBusy())return head+inbSkeleton();
  if(INB.err.stock)return head+inbErrCard('Data putaway belum bisa dibaca',INB.err.stock);
  PUT_LIST=IMMCore.putawayLpns(INB.stock,inbOpt());inbSyncPhotos();
  const phOk=IMMStore.configured()&&PH.state==='ok',nNoPh=phOk?PUT_LIST.filter(l=>!phRows(l.lpn).length).length:0;
  const q=(S.q.put||'').toUpperCase().replace(/\s+/g,'');
  const fl=q?PUT_LIST.filter(l=>(l.lpn+' '+l.tolocs.join(' ')).toUpperCase().replace(/\s+/g,'').includes(q)):PUT_LIST;
  const nDmg=PUT_LIST.filter(l=>l.kind==='damage').length,nMix=PUT_LIST.filter(l=>l.mixed).length;const n=lim('put',20);
  return head+`<section class="card pad" style="--i:1"><div class="put-sum">
      <div><b>${cnt(PUT_LIST.length)}</b><span>LPN</span></div><div class="${nDmg?'crit':''}"><b>${cnt(nDmg)}</b><span>damage</span></div><div class="${nMix?'warn':''}"><b>${cnt(nMix)}</b><span>campur Dept</span></div>${phOk?`<div class="${nNoPh?'':'good'}"><b>${cnt(nNoPh)}</b><span>belum ada foto</span></div>`:''}
    </div></section>
    <section class="card" style="--i:2"><div class="ch"><span class="hic">${I.box}</span><h2>Daftar LPN</h2><span class="hint">${f0(fl.length)} LPN</span><div class="right" style="flex:1 1 170px;max-width:230px">${searchBox('put','Cari LPN / lokasi')}</div></div>
    <div class="cb" style="padding-top:6px">${fl.length?`<div class="lpns">${fl.slice(0,n).map(l=>`<button class="lpn press${l.kind==='damage'?' dmg':''}" data-lpn="${esc(l.lpn)}">
        <div class="lpn-top"><span class="mono lpn-id">${esc(l.lpn)}</span>${lpnTag(l)}${phRows(l.lpn).length?`<span class="lpn-cam">${I.cam}${phRows(l.lpn).length}</span>`:''}<span class="lpn-time">${l.date!==TODAY?dshort(l.date)+' ':''}${esc(l.time)}</span></div>
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
     <div><h4>Isi LPN · ${l.items.length} SKU · ${f0(l.qty)} qty · ${f2(l.cbm)} CBM</h4><div class="list">${l.items.map(i=>`<div class="row"><span class="a" style="font-size:13px;white-space:normal">${esc(i.desc||'-')}</span><span class="b" style="white-space:normal"><span class="mono">${esc(i.sku)}</span> · Dept ${esc(i.dept)}${l.tolocs.length>1?' · '+esc(i.toloc):''}</span><span class="v">${f0(i.qty)}<small>qty</small></span></div>`).join('')}</div></div>
     <div id="lpnPhotos" data-lpn="${esc(l.lpn)}">${lpnPhotosHtml(l)}</div>`);
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
// ---------- TTO / Dokumen ----------
const TTO={rows:[],key:'',state:'idle'};
let TTO_DRAFT=null; // {photos:[{file,url,at}],saving}
function inbSyncTto(force){
  if(!IMMStore.configured())return;const [from,to]=range();const key=from+'|'+to;
  if(!force&&key===TTO.key&&TTO.state!=='idle')return;TTO.key=key;TTO.state=TTO.rows.length&&force?'refreshing':'loading';
  IMMStore.listTto({from,to}).then(rows=>{if(TTO.key!==key)return;TTO.rows=rows;TTO.state='ok'},()=>{if(TTO.key===key)TTO.state='error'})
    .then(()=>{if(TTO.key===key&&S.page==='inb'&&S.inb==='tto')render()});
}
function inbTto(){
  const head=inbHead('TTO/Dokumen',`Serah terima · ${esc(rlabel())}`);
  if(!IMMStore.configured())return head+`<section class="card" style="--i:1">${emptyState('Penyimpanan belum diatur','Data TTO disimpan di server. Fitur ini aktif setelah penyimpanan diatur.',false,I.doc)}</section>`;
  inbSyncTto();
  const add=`<button class="btn block press tto-add" id="ttoAdd" style="--i:1">Tambah TTO</button>`;
  if(TTO.state==='loading'||TTO.state==='idle')return head+add+inbSkeleton();
  if(TTO.state==='error')return head+add+inbErrCard('Data TTO belum bisa dibaca','Cek koneksi internet, lalu coba lagi.',2);
  const q=(S.q.tto||'').toLowerCase().trim();
  const fl=q?TTO.rows.filter(r=>(r.no_tto+' '+r.barang+' '+r.penerima+' '+r.pic).toLowerCase().includes(q)):TTO.rows;const n=lim('tto',20);
  const koli=TTO.rows.reduce((a,r)=>a+(+r.koli||0),0);
  return head+add+`<section class="card" style="--i:2"><div class="ch"><span class="hic">${I.doc}</span><h2>Daftar TTO</h2><span class="hint">${f0(TTO.rows.length)} TTO · ${f0(koli)} koli</span><div class="right" style="flex:1 1 170px;max-width:230px">${searchBox('tto','Cari No TTO / barang')}</div></div>
    <div class="cb" style="padding-top:4px">${fl.length?`<div class="list">${fl.slice(0,n).map(r=>`<button class="tto-row press" data-tto="${r.id}"><div class="tto-top"><span class="mono tto-no">${esc(r.no_tto)}</span>${(r.photos||[]).length?`<span class="lpn-cam">${I.cam}${r.photos.length}</span>`:''}<span class="lpn-time">${dshort(r.tgl)}</span></div><div class="tto-b">${esc(r.barang)}</div><div class="tto-m"><span>${f0(r.koli)} koli</span><span>${esc(r.pic)} → ${esc(r.penerima)}</span></div></button>`).join('')}</div>${moreBtn('tto',fl.length,n)}`
      :emptyState(q?'Tidak ditemukan':'Belum ada TTO',q?'Tidak ada TTO yang cocok.':`Belum ada serah terima yang dicatat ${esc(rlabel())}.`,!q,I.doc)}</div></section>`;
}
function ttoPhotosHtml(){
  const ph=TTO_DRAFT.photos,max=IMMStore.MAX_PHOTOS,dis=(ph.length>=max||TTO_DRAFT.saving)?'disabled':'';
  return `<h4>Dokumentasi (${ph.length}/${max})</h4>
    ${ph.length?`<div class="ph-grid">${ph.map((p,i)=>`<div class="ph-item"><span class="ph-thumb"><img src="${p.url}" alt="Foto ${i+1}"></span><button type="button" class="ph-del press" data-tto-unphoto="${i}" aria-label="Buang foto">${I.x}</button></div>`).join('')}</div>`:''}
    <div class="ph-actions"><button type="button" class="btn ghost press" data-tto-photo="cam" ${dis}>${I.cam}Kamera</button><button type="button" class="btn ghost press" data-tto-photo="gal" ${dis}>${I.doc}Galeri</button></div>
    <p class="foot" style="padding:6px 0 0">Opsional, maksimal ${max} foto. Cap waktu dan No TTO ditambahkan otomatis.</p>
    <input id="ttoCam" type="file" accept="image/*" capture="environment" data-tto-input hidden><input id="ttoGal" type="file" accept="image/*" data-tto-input hidden>`;
}
function ttoDraftClear(){if(TTO_DRAFT)TTO_DRAFT.photos.forEach(p=>{try{URL.revokeObjectURL(p.url)}catch(e){}});TTO_DRAFT=null}
function openTtoForm(){
  ttoDraftClear();TTO_DRAFT={photos:[],saving:false};
  const fld=(id,label,html)=>`<label class="inb-field" data-f="${id}"><span>${label}</span>${html}<em class="inb-msg"></em></label>`;
  sheet(sHead('Tambah TTO','Serah terima dokumen atau barang','',false),
    `<form id="ttoForm" class="tto-form" novalidate>
      ${fld('ttoTgl','Tanggal serah terima',`<input id="ttoTgl" type="date" value="${TODAY}">`)}
      ${fld('ttoNo','No TTO',`<input id="ttoNo" type="text" autocomplete="off" autocapitalize="characters" maxlength="60">`)}
      ${fld('ttoBarang','Nama barang',`<input id="ttoBarang" type="text" autocomplete="off" maxlength="120">`)}
      ${fld('ttoKoli','Jumlah koli',`<input id="ttoKoli" type="number" inputmode="numeric" min="1" step="1">`)}
      ${fld('ttoPic','PIC yang menyerahkan',`<select id="ttoPic"><option value="">Pilih PIC</option>${IMMCore.PICS.map(p=>`<option>${esc(p)}</option>`).join('')}</select>`)}
      ${fld('ttoPenerima','Penerima',`<input id="ttoPenerima" type="text" autocomplete="off" maxlength="60">`)}
      <div id="ttoPhotos">${ttoPhotosHtml()}</div>
      <button type="button" class="btn block press" id="ttoSave">Simpan TTO</button>
    </form>`);
}
function ttoRead(){const v=id=>{const e=document.getElementById(id);return e?String(e.value).trim():''};return {tgl:v('ttoTgl'),no_tto:v('ttoNo'),barang:v('ttoBarang'),koli:v('ttoKoli'),pic:v('ttoPic'),penerima:v('ttoPenerima')}}
function ttoValidate(e){
  const bad={};const k=Number(e.koli);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(e.tgl))bad.ttoTgl='Pilih tanggal';
  if(!e.no_tto)bad.ttoNo='Wajib diisi';if(!e.barang)bad.ttoBarang='Wajib diisi';
  if(e.koli===''||!Number.isInteger(k)||k<1)bad.ttoKoli='Isi angka bulat, minimal 1';
  if(!e.pic)bad.ttoPic='Pilih PIC';if(!e.penerima)bad.ttoPenerima='Wajib diisi';
  document.querySelectorAll('#ttoForm .inb-field').forEach(f=>{const m=bad[f.dataset.f]||'';f.classList.toggle('bad',!!m);f.querySelector('.inb-msg').textContent=m});
  return !Object.keys(bad).length;
}
async function ttoSave(){
  if(!TTO_DRAFT||TTO_DRAFT.saving)return;const e=ttoRead();
  if(!ttoValidate(e)){buzz(30);const f=document.querySelector('#ttoForm .inb-field.bad input,#ttoForm .inb-field.bad select');f&&f.focus();return}
  const btn=document.getElementById('ttoSave');TTO_DRAFT.saving=true;btn.disabled=true;btn.textContent='Menyimpan…';
  try{const blobs=[];for(const p of TTO_DRAFT.photos)blobs.push(await IMMStore.preparePhoto(p.file,[IMMCore.stampText(p.at),'TTO '+e.no_tto]));
    const row=await IMMStore.addTto({...e,koli:Number(e.koli)},blobs,deviceId());
    ttoDraftClear();closeSheet();buzz(12);toast('TTO tersimpan');
    const [from,to]=range();if(row&&row.tgl>=from&&row.tgl<=to){TTO.rows.unshift(row);TTO.rows.sort((a,b)=>(b.tgl+(b.created_at||'')).localeCompare(a.tgl+(a.created_at||'')))}
    if(S.page==='inb'&&S.inb==='tto')render()}
  catch(err){TTO_DRAFT.saving=false;const b=document.getElementById('ttoSave');if(b){b.disabled=false;b.textContent='Simpan TTO'}phErrToast(err,'TTO gagal disimpan. Coba lagi.')}
}
function ttoPick(file){
  if(!TTO_DRAFT||!file||TTO_DRAFT.photos.length>=IMMStore.MAX_PHOTOS)return;
  if(!/^image\//.test(file.type||'')){toast('File ini bukan foto');return}
  TTO_DRAFT.photos.push({file,url:URL.createObjectURL(file),at:new Date()});const box=document.getElementById('ttoPhotos');if(box)box.innerHTML=ttoPhotosHtml();
}
function openTto(id){
  const r=TTO.rows.find(x=>String(x.id)===String(id));if(!r)return;const ph=r.photos||[];
  sheet(sHead(esc(r.no_tto),`<span><b>${dlong(r.tgl)}</b></span><span>${f0(r.koli)} koli</span>`),
    `<dl class="kv"><dt>Nama barang</dt><dd>${esc(r.barang)}</dd><dt>Jumlah koli</dt><dd>${f0(r.koli)} koli</dd><dt>Yang menyerahkan</dt><dd>${esc(r.pic)}</dd><dt>Penerima</dt><dd>${esc(r.penerima)}</dd><dt>Tanggal</dt><dd>${dlong(r.tgl)}</dd></dl>
     <div><h4>Dokumentasi (${ph.length})</h4>${ph.length?`<div class="ph-grid">${ph.map(p=>`<div class="ph-item"><button class="ph-thumb press" data-photo-view="${esc(p)}" aria-label="Lihat foto"><img loading="lazy" src="${esc(IMMStore.photoUrl(p))}" alt="Foto TTO ${esc(r.no_tto)}"></button></div>`).join('')}</div>`:'<p class="foot" style="padding:0">Tidak ada foto.</p>'}</div>
     <button class="btn ghost block press tto-del" id="ttoDel" data-id="${r.id}">${I.trash}Hapus TTO</button>`);
}
async function ttoDelete(id){
  const r=TTO.rows.find(x=>String(x.id)===String(id));if(!r)return;
  if(!confirm(`Hapus TTO ${r.no_tto}? Data dan fotonya tidak bisa dikembalikan.`))return;
  try{await IMMStore.removeTto(r);TTO.rows=TTO.rows.filter(x=>x!==r);closeSheet();toast('TTO dihapus');if(S.page==='inb'&&S.inb==='tto')render()}catch(e){phErrToast(e,'TTO gagal dihapus. Coba lagi.')}
}
const INB_PAGES={mpp:inbMpp,put:inbPutaway,tto:inbTto,prod:inbProd};
function pageInbound(){
  if(!inbUnlocked())return inbLock();
  loadInbound();
  if(!S.inb||!INB_PAGES[S.inb])return inbList();
  return INB_PAGES[S.inb]();
}
function inboundBack(){if(S.page!=='inb'||!S.inb||!inbUnlocked())return false;S.inb='';S.more={};render(true);window.scrollTo({top:0});return true}
function inboundClick(e){
  if(S.page!=='inb')return false;const g=s=>e.target.closest(s);let t;
  if(g('[data-pv-x]')||(e.target&&e.target.id==='photoView')){inboundOverlayBack();return true}
  if(g('#inbGo')){inbTryUnlock();return true}
  if(g('[data-inb-back]')){inboundBack();return true}
  if(!inbUnlocked())return false;
  if(g('#sync')||g('[data-inb-reload]')){buzz(6);PH.key='';PH.state='idle';if(S.inb==='tto')inbSyncTto(true);else loadInbound(true);render();return true}
  if(t=g('[data-photo-add]')){const el=document.getElementById(t.dataset.photoAdd==='cam'?'phCam':'phGal');el&&el.click();return true}
  if(t=g('[data-photo-view]')){photoView(t.dataset.photoView);return true}
  if(t=g('[data-photo-del]')){phDel(t.dataset.photoDel);return true}
  if(t=g('[data-lpn]')){openLpn(t.dataset.lpn);return true}
  if(g('#ttoAdd')){openTtoForm();return true}
  if(g('#ttoSave')){ttoSave();return true}
  if(t=g('[data-tto-photo]')){const el=document.getElementById(t.dataset.ttoPhoto==='cam'?'ttoCam':'ttoGal');el&&el.click();return true}
  if(t=g('[data-tto-unphoto]')){if(TTO_DRAFT&&!TTO_DRAFT.saving){const p=TTO_DRAFT.photos.splice(+t.dataset.ttoUnphoto,1)[0];if(p)try{URL.revokeObjectURL(p.url)}catch(_){}document.getElementById('ttoPhotos').innerHTML=ttoPhotosHtml()}return true}
  if(g('#ttoDel')){ttoDelete(g('#ttoDel').dataset.id);return true}
  if(t=g('[data-tto]')){openTto(t.dataset.tto);return true}
  if(t=g('[data-inb]')){if(!inbUnlocked()){render();return true}S.inb=t.dataset.inb;S.more={};buzz(6);render(true);window.scrollTo({top:0});return true}
  return false;
}
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target&&e.target.id==='inbPw'){e.preventDefault();inbTryUnlock()}});
document.addEventListener('change',e=>{const el=e.target;if(!el||!el.matches||!el.matches('[data-photo-input]'))return;const f=el.files&&el.files[0];el.value='';if(f&&el.closest('#lpnPhotos'))phAdd(f)});
document.addEventListener('change',e=>{const el=e.target;if(!el||!el.matches||!el.matches('[data-tto-input]'))return;const f=el.files&&el.files[0];el.value='';ttoPick(f)});
document.addEventListener('submit',e=>{if(e.target&&e.target.id==='ttoForm'){e.preventDefault();ttoSave()}});
document.addEventListener('input',e=>{const f=e.target&&e.target.closest&&e.target.closest('#ttoForm .inb-field.bad');if(f){f.classList.remove('bad');f.querySelector('.inb-msg').textContent=''}});
