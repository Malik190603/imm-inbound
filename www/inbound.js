// ======================= MENU INBOUND =======================
// Terkunci sandi (berlaku 2 jam per HP). Isi: Putaway, TTO/Dokumen, Productivity, MPP detail.
I.lock='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="9" width="12" height="8" rx="2"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9M10 12.5v1.5"/></svg>';
I.cam='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5a1.5 1.5 0 0 1 1.5-1.5H6l1.2-1.8h5.6L14 6h1.5A1.5 1.5 0 0 1 17 7.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 14.5z"/><circle cx="10" cy="11" r="2.8"/></svg>';
I.plus='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 4.5v11M4.5 10h11"/></svg>';
I.scan='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M13 3h2a2 2 0 0 1 2 2v2M17 13v2a2 2 0 0 1-2 2h-2M7 17H5a2 2 0 0 1-2-2v-2M6.5 10h7"/></svg>';
const INB_ICON={put:I.box,tto:I.doc,prod:I.trend,mpp:I.users};
const INB_UNLOCK_KEY='imm.inb.unlock';
let inbPwErr='';
function inbUnlocked(){return IMMCore.unlockValid(LS.get(INB_UNLOCK_KEY),Date.now())}
const inbWhen=()=>{const p=F().preset;return p==='today'?'hari ini':p==='tomorrow'?'besok':p==='all'?'di semua tanggal':'pada '+esc(rlabel())};
function inbShowsFilter(){return inbUnlocked()&&['','put','tto','prod'].includes(S.inb||'')}

function inbLock(){
  return `<div class="hello slim" style="--i:0"><h1>Inbound</h1><p>Khusus tim inbound DC Tallo</p></div>
  <section class="card inb-lock" style="--i:1"><div class="cb">
    <div class="inb-lock-top"><span class="inb-lock-ic">${I.lock}</span><div><h2>Menu ini terkunci</h2><p>Masukkan kata sandi tim inbound.</p></div></div>
    <label class="inb-field"><span>Kata sandi</span><input id="inbPw" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" placeholder="Kata sandi"></label>
    <p class="inb-err" id="inbErr" role="alert">${esc(inbPwErr)}</p>
    <button class="btn block press" id="inbGo">Buka</button>
    <p class="inb-lock-note">${I.wait}<span>Setelah benar, menu terbuka selama 2 jam di HP ini.</span></p>
  </div></section>`;
}
async function inbTryUnlock(){
  const el=document.getElementById('inbPw');if(!el)return;const pw=el.value;
  if(!pw){inbPwErr='Isi kata sandi dulu.';render();return}
  let ok=false;try{ok=await IMMCore.checkPassword(pw)}catch(e){inbPwErr='Sandi tidak bisa diperiksa di HP ini.';render();return}
  if(ok){inbPwErr='';LS.set(INB_UNLOCK_KEY,Date.now());S.inb='';buzz(12);render(true)}
  else{inbPwErr='Sandi salah. Coba lagi.';buzz(30);render();const n=document.getElementById('inbPw');n&&n.focus()}
}
// Angka di kartu daftar mengikuti filter periode dan BU di atas halaman (bawaan: hari ini, semua BU). TTO tidak punya BU.
const TILE={key:'',okKey:'',state:'idle',tto:null,noPh:null,at:0};
function inbTilesStale(){TILE.state='idle'}
function inbSyncTiles(lpns){
  if(!IMMStore.configured())return;const [from,to]=range();const key=from+'|'+to+'|'+lpns.join('|');
  if(key===TILE.key&&TILE.state!=='idle'&&!(TILE.state==='ok'&&Date.now()-TILE.at>INB_FRESH_MS))return;TILE.key=key;TILE.state='loading';
  Promise.all([IMMStore.listTto({from,to}),lpns.length?IMMStore.listPutawayPhotos(lpns):[]])
    .then(([tto,ph])=>{if(TILE.key!==key)return;const has=new Set(ph.map(r=>r.lpn));TILE.tto=tto.length;TILE.noPh=lpns.filter(l=>!has.has(l)).length;TILE.state='ok';TILE.okKey=key;TILE.at=Date.now()},()=>{if(TILE.key===key)TILE.state='error'})
    .then(()=>{if(TILE.key===key&&S.page==='inb'&&!S.inb&&inbUnlocked())render()});
}
function inbList(){
  const WAIT='…',NONE='–',busy=inbBusy(),cfg=IMMStore.configured(),o=inbOpt(),when=inbWhen();
  let put=WAIT,putFlags=[],putNote='',prod=WAIT,prodNote=`CBM tim ${when}`;
  if(!busy){
    let lpns=[];
    if(INB.err.stock){put=NONE;putNote='Data putaway belum bisa dibaca'}
    else{const L=IMMCore.putawayLpns(INB.stock,o);lpns=L.map(l=>l.lpn);put=f0(L.length);
      const d=L.filter(l=>l.kind==='damage').length,m=L.filter(l=>l.mixed).length,seen=cfg&&TILE.state!=='error'&&TILE.at>0&&TILE.okKey===o.from+'|'+o.to+'|'+lpns.join('|');
      if(seen&&TILE.noPh)putFlags.push(tag(`${f0(TILE.noPh)} belum ada foto`,'warn'));
      if(d)putFlags.push(tag(`${f0(d)} damage`,'crit'));if(m)putFlags.push(tag(`${f0(m)} campur Dept`,'warn'));
      if(!L.length)putNote=`Belum ada putaway ${when}`;else if(!putFlags.length)putNote=seen?'Semua sudah berfoto, tanpa damage':'Tanpa damage dan campur Dept'}
    if(INB.err.stock&&INB.err.transit)prod=NONE;
    else{const P=IMMCore.productivity(INB.err.stock?[]:INB.stock,INB.err.transit?[]:INB.transit,o);prod=f2(P.team.rcv+P.team.put);if(INB.err.stock||INB.err.transit)prodNote='CBM tim · sebagian data'}
    inbSyncTiles(lpns);
  }
  const tto=!cfg||TILE.state==='error'?NONE:TILE.at>0?f0(TILE.tto):WAIT;
  const ic=k=>INB_ICON[k],go=`<span class="tile-go">${I.chev}</span>`;
  return `<div class="hello slim" style="--i:0"><h1>Inbound</h1><p>Angka ${when} · ketuk kartu untuk membuka</p></div>
  <div class="tiles" style="--i:1">
    <button class="tile wide press" data-inb="put"><span class="tile-h"><span class="tile-ic">${ic('put')}</span>${go}</span><span class="t">Putaway</span>
      <span class="tile-n"><span class="tile-v">${put}</span><span class="tile-u">LPN ${when}</span></span>
      ${putFlags.length?`<span class="tile-f">${putFlags.join('')}</span>`:putNote?`<span class="tile-x">${putNote}</span>`:''}</button>
    <button class="tile press" data-inb="tto"><span class="tile-h"><span class="tile-ic">${ic('tto')}</span>${go}</span><span class="t">TTO/Dokumen</span>
      <span class="tile-v">${tto}</span><span class="tile-u">${cfg?`TTO ${when}`:'Penyimpanan belum diatur'}</span></button>
    <button class="tile press" data-inb="prod"><span class="tile-h"><span class="tile-ic">${ic('prod')}</span>${go}</span><span class="t">Productivity</span>
      <span class="tile-v">${prod}</span><span class="tile-u">${prodNote}</span></button>
    <button class="tile wide row press" data-inb="mpp"><span class="tile-ic">${ic('mpp')}</span><span class="t">MPP detail</span><span class="tile-n"><span class="tile-v">${IMMCore.MPP.length}</span><span class="tile-u">orang</span></span>${go}</button>
  </div>`;
}
function inbHead(title,sub){return `<div class="inb-head" style="--i:0"><button class="icon-btn press" data-inb-back aria-label="Kembali ke daftar Inbound">${I.left}</button><div class="hello"><h1>${title}</h1><p>${sub}</p></div></div>`}
function inbMpp(){
  const groups=[];IMMCore.MPP.forEach(p=>{let g=groups.find(x=>x.title===p.title);if(!g){g={title:p.title,people:[]};groups.push(g)}g.people.push(p)});
  const ini=n=>n.replace(/[^A-Za-z ]/g,'').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('');
  return inbHead('MPP detail',`${IMMCore.MPP.length} orang · tim inbound DC Tallo`)+`<section class="card" style="--i:1"><div class="cb mpp-all">${groups.map(g=>`<div class="mpp-g"><h2 class="mpp-gt">${esc(g.title)}<span>${g.people.length} orang</span></h2><div class="mpp">${g.people.map(p=>`<div class="mpp-p"><span class="mpp-av">${ini(p.name)}</span><span><div class="mpp-n">${esc(p.name)}</div><div class="mpp-b">${esc(p.bu)}</div></span></div>`).join('')}</div></div>`).join('')}</div></section>`;
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
const INB_FRESH_MS=5*60e3; // data dari HP lain (foto, TTO) dimuat ulang paling lama tiap 5 menit, dan tiap masuk halaman
const PH={map:new Map(),key:'',state:'idle',busy:false,at:0};
const phRows=lpn=>PH.map.get(lpn)||[];
function phSet(rows){PH.map=new Map();rows.forEach(r=>{if(!PH.map.has(r.lpn))PH.map.set(r.lpn,[]);PH.map.get(r.lpn).push(r)})}
function inbSyncPhotos(){
  if(!IMMStore.configured())return;const key=PUT_LIST.map(l=>l.lpn).join('|');
  if(key===PH.key&&PH.state!=='idle'&&!(PH.state==='ok'&&Date.now()-PH.at>INB_FRESH_MS))return;PH.key=key;PH.state='loading';
  IMMStore.listPutawayPhotos(PUT_LIST.map(l=>l.lpn)).then(rows=>{if(PH.key!==key)return;phSet(rows);PH.state='ok';PH.at=Date.now()},()=>{if(PH.key===key)PH.state='error'})
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
function phRefresh(){const box=document.getElementById('lpnPhotos');if(!box)return;const l=PUT_LIST.find(x=>x.lpn===box.dataset.photosFor);if(l)box.innerHTML=lpnPhotosHtml(l)}
function phErrToast(e,what){const m=e&&e.message;toast(m==='BADIMAGE'?'File ini bukan foto yang bisa dibaca':m==='NOCONFIG'?'Penyimpanan foto belum diatur':what)}
async function phAdd(file){
  const box=document.getElementById('lpnPhotos');if(!box||!file||PH.busy)return;const lpn=box.dataset.photosFor;const l=PUT_LIST.find(x=>x.lpn===lpn);if(!l)return;
  PH.busy=true;phRefresh();
  try{const blob=await IMMStore.preparePhoto(file,[IMMCore.stampText(new Date()),l.lpn+' → '+l.tolocs.join(', ')]);
    const row=await IMMStore.addPutawayPhoto(l.lpn,l.tolocs[0]||'',blob,deviceId());
    if(!PH.map.has(lpn))PH.map.set(lpn,[]);PH.map.get(lpn).push(row);buzz(12);toast('Foto tersimpan')}
  catch(e){if(e&&e.message==='MAX'){toast(`LPN ini sudah ${IMMStore.MAX_PHOTOS} foto`);try{PH.map.set(lpn,await IMMStore.listPutawayPhotos([lpn]))}catch(_){}}
    else phErrToast(e,'Foto gagal diunggah. Coba lagi.')}
  PH.busy=false;phRefresh();if(S.page==='inb'&&S.inb==='put')render();
}
async function phDel(id){
  const box=document.getElementById('lpnPhotos');if(!box)return;const lpn=box.dataset.photosFor;const row=phRows(lpn).find(r=>String(r.id)===String(id));if(!row)return;
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
  const cfg=IMMStore.configured(),phOk=cfg&&PH.state==='ok';
  const noPh=l=>!phRows(l.lpn).length;
  const nNoPh=phOk?PUT_LIST.filter(noPh).length:0,nDmg=PUT_LIST.filter(l=>l.kind==='damage').length,nMix=PUT_LIST.filter(l=>l.mixed).length;
  // filter: kartu ringkasan (S.putF) + lokasi (S.putLoc) + kata cari
  const locs=[...new Set(PUT_LIST.flatMap(l=>l.tolocs))].sort((x,y)=>x.localeCompare(y));
  if(S.putLoc&&!locs.includes(S.putLoc))S.putLoc='';
  if(S.putF==='noph'&&!cfg)S.putF='';
  const F_LABEL={dmg:'Damage',mix:'Campur Dept',noph:'Belum ada foto'};
  const byF={dmg:l=>l.kind==='damage',mix:l=>l.mixed,noph:l=>!phOk||noPh(l)}[S.putF];
  const q=(S.q.put||'').toUpperCase().replace(/\s+/g,'');
  let fl=PUT_LIST;if(byF)fl=fl.filter(byF);if(S.putLoc)fl=fl.filter(l=>l.tolocs.includes(S.putLoc));
  if(q)fl=fl.filter(l=>(l.lpn+' '+l.tolocs.join(' ')).toUpperCase().replace(/\s+/g,'').includes(q));
  const filtered=!!(S.putF||S.putLoc||q);const n=lim('put',20);
  const tile=(k,num,label,tone)=>`<button class="press ${tone||''}" data-putf="${k}" aria-pressed="${(S.putF||'all')===k}"><b>${num}</b><span>${label}</span></button>`;
  const active=[S.putF?F_LABEL[S.putF]:'',S.putLoc?esc(S.putLoc):''].filter(Boolean).join(' · ');
  const N=PUT_LIST.length,cbm=PUT_LIST.reduce((a,l)=>a+l.cbm,0),qty=PUT_LIST.reduce((a,l)=>a+l.qty,0),nOp=new Set(PUT_LIST.map(l=>l.operator).filter(Boolean)).size;
  const flags=[nDmg?`${f0(nDmg)} damage`:'',nMix?`${f0(nMix)} campur Dept`:'',phOk&&nNoPh?`${f0(nNoPh)} belum ada foto`:''].filter(Boolean);
  const say=N?`<b>${f0(N)} LPN</b> masuk lokasi FLR ${inbWhen()}. ${flags.length?`Perlu dicek: ${flags.join(', ')}.`:phOk?'Semua sudah berfoto, tanpa damage maupun campur Dept.':'Tanpa damage maupun campur Dept.'}`:`Belum ada LPN yang diputaway ke lokasi FLR ${inbWhen()}.`;
  return head+lead({tone:'inb',i:1,empty:!N,headline:say,value:cnt(cbm,2),unit:'CBM diputaway',
    body:`<div class="put-sum">
      ${tile('all',cnt(PUT_LIST.length),'LPN')}${tile('dmg',cnt(nDmg),'damage',nDmg?'crit':'')}${tile('mix',cnt(nMix),'campur Dept',nMix?'warn':'')}${cfg?tile('noph',phOk?cnt(nNoPh):'…','belum ada foto',phOk?(nNoPh?'warn':'good'):''):''}
    </div><p class="lead-note">Ketuk satu kotak untuk menampilkan LPN-nya saja.</p>`,
    stats:[{l:'Qty',v:fC(qty)},{l:'Lokasi',v:f0(locs.length)},{l:'Operator',v:f0(nOp)}]})+`
    <section class="card" style="--i:2">${secHead({icon:I.box,title:active||'Daftar LPN',hint:`${f0(fl.length)} LPN`,sub:'Urut dari yang terbaru. Ketuk satu LPN untuk isi dan fotonya.',gloss:['lpn','campur','dept'],cls:'put-list-head',right:filtered?`<button class="btn ghost sm press" data-put-reset>Hapus filter</button>`:''})}
    <div class="put-tools">${searchBox('put','Cari LPN / lokasi')}<label class="put-loc"><span class="sr">Filter lokasi</span><select id="putLoc" aria-label="Filter lokasi"><option value="">Semua lokasi</option>${locs.map(x=>`<option value="${esc(x)}" ${S.putLoc===x?'selected':''}>${esc(x)}</option>`).join('')}</select></label></div>
    <div class="cb" style="padding-top:6px">${fl.length?`<div class="lpns">${fl.slice(0,n).map(l=>`<button class="lpn press${l.kind==='damage'?' dmg':''}" data-lpn="${esc(l.lpn)}">
        <div class="lpn-top"><span class="mono lpn-id">${esc(l.lpn)}</span>${lpnTag(l)}${phRows(l.lpn).length?`<span class="lpn-cam">${I.cam}${phRows(l.lpn).length}</span>`:''}<span class="lpn-time">${l.date!==TODAY?dshort(l.date)+' ':''}${esc(l.time)}</span></div>
        <div class="lpn-loc">${I.port}<span>${l.tolocs.map(esc).join(', ')}</span></div>
        <div class="lpn-meta"><span>${l.skus} SKU</span><span>${f0(l.qty)} qty</span><span>${f2(l.cbm)} CBM</span>${buTag(l.bu||'-')}<span>${esc(l.operator)}</span></div>
        ${l.mixed?`<div class="lpn-warn">${I.warn}<span><b>Campur Dept</b> · ${l.depts.map(esc).join(', ')}</span></div>`:''}
      </button>`).join('')}</div>${moreBtn('put',fl.length,n)}`:emptyState(filtered?'Tidak ada LPN':'Belum ada putaway',filtered?'Tidak ada LPN yang cocok dengan filter ini.':`Tidak ada LPN yang diputaway ke lokasi FLR ${esc(rlabel())}.`,!filtered,I.box)}</div></section>`;
}
function openLpn(id){
  const l=PUT_LIST.find(x=>x.lpn===id);if(!l)return;
  const depts=groupBy(l.items,i=>i.dept,k=>({k,qty:0,n:0}),(g,i)=>{g.qty+=i.qty;g.n++});
  sheet(sHead(esc(l.lpn),`<span><b>${dlong(l.date)}</b> ${esc(l.time)}</span>${buTag(l.bu||'-')}<span>${esc(l.operator)}</span>`,lpnTag(l)),
    `<div class="lpn-loc big">${I.port}<span>${l.tolocs.map(esc).join(', ')}</span></div>
     ${l.mixed?`<div class="lpn-warn">${I.warn}<span><b>Campur Dept</b> · LPN ini berisi ${l.depts.length} Dept: ${depts.map(d=>`${esc(d.k)} (${d.n} SKU)`).join(', ')}</span></div>`:''}
     <div><h4>Isi LPN · ${l.skus} SKU · ${f0(l.qty)} qty · ${f2(l.cbm)} CBM</h4><div class="list">${l.items.map(i=>`<div class="row"><span class="a" style="font-size:13px;white-space:normal">${esc(i.desc||'-')}</span><span class="b" style="white-space:normal"><span class="mono">${esc(i.sku)}</span> · Dept ${esc(i.dept)}${l.tolocs.length>1?' · '+esc(i.toloc):''}</span><span class="v">${f0(i.qty)}<small>qty</small></span></div>`).join('')}</div></div>
     <div id="lpnPhotos" data-photos-for="${esc(l.lpn)}">${lpnPhotosHtml(l)}</div>`);
}
// ---------- Productivity ----------
function inbProd(){
  const head=inbHead('Productivity',`CBM Receive dan Putaway · ${esc(rlabel())}`);
  if(inbBusy())return head+inbSkeleton();
  if(INB.err.stock&&INB.err.transit)return head+inbErrCard('Data productivity belum bisa dibaca',INB.err.stock);
  const o=inbOpt(),st=INB.err.stock?[]:INB.stock,tr=INB.err.transit?[]:INB.transit;
  const P=IMMCore.productivity(st,tr,o);const tot=x=>x.rcv+x.put;const teamTot=tot(P.team);
  const errs=[INB.err.stock,INB.err.transit].filter(Boolean);
  const ins=[];const top=P.ops[0];const active=P.ops.filter(x=>tot(x)>0),idle=P.ops.filter(x=>tot(x)===0);let prodDelta='';
  if(teamTot>0){
    const rT=P.ops.reduce((a,x)=>a+x.rcvTransit,0),pS=P.ops.reduce((a,x)=>a+x.putStock,0);
    ins.push({h:'Stock dan transit',t:`Receive: <b>${pc(rT,P.team.rcv)}%</b> dari transit, sisanya stock. Putaway stock ${f2(pS)} CBM dari total ${f2(P.team.put)} CBM.`});
    const [from,to]=range();
    if(from>'1000'&&to<'9000'){const n=days(from,to);const Q=IMMCore.productivity(st,tr,{from:addD(from,-n),to:addD(from,-1),bu:o.bu});const q=tot(Q.team);
      if(q>0){const d=(teamTot-q)/q*100;prodDelta=leadDelta(IMMUi.deltaInfo(teamTot,q),'periode sebelumnya');ins.push({c:d<0?'w':'',h:'Dibanding periode sebelumnya',t:`Total tim <b>${d>=0?'naik':'turun'} ${f0(Math.abs(d))}%</b> dibanding ${dshort(addD(from,-n))}${n>1?' – '+dshort(addD(from,-1)):''} (${f2(q)} CBM → ${f2(teamTot)} CBM).`})}}
    if(P.days.length>1){const best=P.days.slice().sort((a,b)=>tot(b)-tot(a))[0];ins.push({h:'Hari tersibuk',t:`<b>${dday(best.d)}</b>: ${f2(best.rcv)} CBM receive dan ${f2(best.put)} CBM putaway.`})}
  }
  const mx=Math.max(1e-9,...P.ops.map(x=>Math.max(x.rcv,x.put)));
  const bar=(lbl,v,s,t,c)=>`<div class="prod-row"><div class="prod-l"><span>${lbl}</span> <b>${f2(v)}</b> <small>CBM</small></div><div class="prod-bar"><i style="width:${v/mx*100}%;background:${c}"></i></div><div class="prod-s">stock ${f2(s)} · transit ${f2(t)}</div></div>`;
  const [from,to]=range();const multi=from!==to;
  const bks=multi?bucketize(from,to,P.days,d=>d.d,d=>[d.rcv,d.put],2):[];
  const SER=[{name:'Receive',color:'var(--lg2)'},{name:'Putaway',color:'var(--lg3)'}];
  return head+
  (errs.length?`<div class="inb-note" style="--i:1">${I.warn}<span>${errs.map(esc).join(' ')} Angka di bawah hanya dari sheet yang terbaca.</span></div>`:'')+
  lead({tone:'inb',i:1,empty:!(teamTot>0),headline:teamTot>0?`Tertinggi ${inbWhen()}: <b>${esc(top.name)}</b> dengan ${f2(tot(top))} CBM (${pc(tot(top),teamTot)}% dari total tim).${active.length<P.ops.length?` ${P.ops.length-active.length} operator belum ada transaksi.`:''}`:`Belum ada transaksi receive atau putaway ${inbWhen()}.`,
    value:cnt(teamTot,2),unit:'CBM',delta:prodDelta,
    body:`<div class="lead-stats n3 prod-team"><div><span><i class="dot" style="background:var(--lg2)"></i>Receive</span><b>${f2(P.team.rcv)}<small>CBM</small></b></div><div><span><i class="dot" style="background:var(--lg3)"></i>Putaway</span><b>${f2(P.team.put)}<small>CBM</small></b></div><div><span>Operator aktif</span><b>${active.length}<small>dari ${P.ops.length}</small></b></div></div>`})+`
  <div style="--i:2">${insights('Ringkasan pintar',ins)}</div>
  <section class="card" style="--i:3">${secHead({icon:I.users,title:'Per operator',hint:'urut dari tertinggi',sub:'Persen di kanan nama = porsi dari total tim.',gloss:['cbm']})}<div class="cb">${teamTot>0?'':`<p class="foot" style="padding:0 0 8px">Belum ada transaksi yang dihitung ${esc(rlabel())}.</p>`}<div class="prod-ops">${active.map((x,i)=>`<div class="prod-op"><div class="prod-top"><span class="rank${i===0&&tot(x)>0?' first':''}">${i+1}</span><span class="prod-n">${esc(x.name)}</span><span class="prod-id mono">${x.id}</span><span class="prod-share" title="Porsi dari total tim">${pc(tot(x),teamTot)}%</span></div>${bar('Receive',x.rcv,x.rcvStock,x.rcvTransit,'var(--lg2)')}${bar('Putaway',x.put,x.putStock,x.putTransit,'var(--lg3)')}</div>`).join('')}</div>${idle.length?zeroLine(`${idle.length} operator belum ada transaksi: ${idle.map(x=>esc(x.name)).join(', ')}`):''}</div></section>
  ${multi&&bks.length?`<section class="card" style="--i:4"><div class="ch"><span class="hic">${I.trend}</span><h2>CBM per ${bks[0].mode==='m'?'bulan':bks[0].mode==='w'?'minggu':'hari'}</h2><span class="hint">tim</span></div><div class="cb"><div class="legend">${SER.map(s=>`<span><i class="dot" style="background:${s.color}"></i>${s.name}</span>`).join('')}</div>${stackChart('cProd',bks,SER,{unit:'CBM',fmt:f2})}</div></section>`:''}`;
}
// ---------- TTO / Dokumen ----------
const TTO={rows:[],key:'',state:'idle',at:0};
let TTO_DRAFT=null; // {photos:[{file,url,at}],saving}
function inbSyncTto(force){
  if(!IMMStore.configured())return;const [from,to]=range();const key=from+'|'+to;
  if(!force&&key===TTO.key&&TTO.state!=='idle'&&!(TTO.state==='ok'&&Date.now()-TTO.at>INB_FRESH_MS))return;TTO.key=key;TTO.state=TTO.rows.length&&force?'refreshing':'loading';
  IMMStore.listTto({from,to}).then(rows=>{if(TTO.key!==key)return;TTO.rows=rows;TTO.state='ok';TTO.at=Date.now()},()=>{if(TTO.key===key)TTO.state='error'})
    .then(()=>{if(TTO.key===key&&S.page==='inb'&&S.inb==='tto')render()});
}
function inbTto(){
  const head=inbHead('TTO/Dokumen',`Serah terima · ${esc(rlabel())}`);
  if(!IMMStore.configured())return head+`<section class="card" style="--i:1">${emptyState('Penyimpanan belum diatur','Data TTO disimpan di server. Fitur ini aktif setelah penyimpanan diatur.',false,I.doc)}</section>`;
  inbSyncTto();
  const add=`<button class="btn block press tto-add" id="ttoAdd" style="--i:2">${I.plus}Tambah TTO</button>`;
  if(TTO.state==='loading'||TTO.state==='idle')return head+add+inbSkeleton();
  if(TTO.state==='error')return head+add+inbErrCard('Data TTO belum bisa dibaca','Cek koneksi internet, lalu coba lagi.',2);
  const q=(S.q.tto||'').toLowerCase().trim();
  const fl=q?TTO.rows.filter(r=>(r.no_tto+' '+r.barang+' '+r.penerima+' '+r.pic).toLowerCase().includes(q)):TTO.rows;const n=lim('tto',20);
  const koli=TTO.rows.reduce((a,r)=>a+(+r.koli||0),0),N=TTO.rows.length,withPh=TTO.rows.filter(r=>(r.photos||[]).length).length,pics=new Set(TTO.rows.map(r=>r.pic).filter(Boolean)).size;
  const top=lead({tone:'inb',i:1,empty:!N,headline:N?`Serah terima ${inbWhen()}: <b>${fC(koli)} koli</b> lewat ${f0(pics)} PIC.${withPh<N?` ${f0(N-withPh)} TTO belum ada fotonya.`:' Semua sudah berfoto.'}`:`Belum ada serah terima yang dicatat ${inbWhen()}.`,
    value:cnt(N),unit:'TTO',stats:[{l:'Koli',v:fC(koli)},{l:'Berfoto',v:f0(withPh),u:`dari ${f0(N)}`},{l:'Penerima',v:f0(new Set(TTO.rows.map(r=>r.penerima).filter(Boolean)).size),u:'orang'}]});
  return head+top+add+`<section class="card" style="--i:3">${secHead({icon:I.doc,title:'Daftar TTO',hint:`${f0(fl.length)} TTO`,sub:'Urut dari yang terbaru. Ketuk untuk rincian dan foto.',gloss:['tto']})}<div class="tools">${searchBox('tto','Cari No TTO / barang')}</div>
    <div class="cb" style="padding-top:8px">${fl.length?`<div class="list">${fl.slice(0,n).map(r=>`<button class="tto-row press" data-tto="${r.id}"><div class="tto-top"><span class="mono tto-no">${esc(r.no_tto)}</span>${(r.photos||[]).length?`<span class="lpn-cam">${I.cam}${r.photos.length}</span>`:''}<span class="lpn-time">${dshort(r.tgl)}</span></div><div class="tto-b">${esc(r.barang)}</div><div class="tto-m"><span>${f0(r.koli)} koli</span><span>${esc(r.pic)} → ${esc(r.penerima)}</span></div></button>`).join('')}</div>${moreBtn('tto',fl.length,n)}`
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
// ---------- Scan TTO dari foto: foto dibaca AI di server (fungsi scan-tto), hasilnya mengisi form untuk dicek pengguna ----------
const SCAN_MARK='Hasil scan, cek lagi';
const SCAN_ERR={NOSCAN:'Scan belum diaktifkan di server. Isi kolom di bawah secara manual.',NOCONFIG:'Scan belum diaktifkan di server. Isi kolom di bawah secara manual.',UNREADABLE:'Foto tidak terbaca sebagai dokumen TTO. Foto ulang lebih dekat dan terang, atau isi manual.',SCANQUOTA:'Kuota scan hari ini habis. Isi manual, atau coba lagi besok.',NETWORK:'Tidak ada internet. Isi manual, atau coba lagi saat tersambung.',TIMEOUT:'Scan terlalu lama. Coba lagi, atau isi manual.',TOOBIG:'Foto terlalu besar untuk di-scan. Isi manual.',BADIMAGE:'File ini bukan foto yang bisa dibaca.'};
function ttoScanHtml(){
  const sc=TTO_DRAFT.scan,dis=(sc.busy||TTO_DRAFT.saving)?'disabled':'';
  return `<div class="scan-h"><span class="scan-ic">${I.scan}</span><div><b>Scan dari foto</b><span>Foto dokumen TTO, lalu No TTO, barang, dan koli terisi sendiri.</span></div></div>
    <div class="ph-actions"><button type="button" class="btn ghost press" data-tto-scan="cam" ${dis}>${I.cam}Kamera</button><button type="button" class="btn ghost press" data-tto-scan="gal" ${dis}>${I.doc}Galeri</button></div>
    ${sc.msg?`<p class="scan-res" data-tone="${sc.tone}" role="status">${sc.busy?'<i class="scan-spin" aria-hidden="true"></i>':''}<span>${esc(sc.msg)}</span></p>`:''}
    <input id="ttoScanCam" type="file" accept="image/*" capture="environment" data-tto-scan-input hidden><input id="ttoScanGal" type="file" accept="image/*" data-tto-scan-input hidden>`;
}
function ttoScanPaint(){const box=document.getElementById('ttoScan');if(box&&TTO_DRAFT)box.innerHTML=ttoScanHtml()}
// Hanya kolom yang terbaca yang diisi; isi yang sudah diketik tidak dikosongkan.
function ttoFill(f){[['ttoNo',f.no_tto],['ttoBarang',f.barang],['ttoKoli',f.koli]].forEach(([id,v])=>{if(v===''||v==null)return;const el=document.getElementById(id);if(!el)return;el.value=String(v);ttoGrow(el);
  const fld=el.closest('.inb-field');fld.classList.remove('bad');fld.classList.add('scanned');fld.querySelector('.inb-msg').textContent=SCAN_MARK})}
function ttoGrow(el){if(!el||el.tagName!=='TEXTAREA')return;el.style.height='auto';el.style.height=Math.min(180,el.scrollHeight+2)+'px'}
async function ttoScan(file){
  const draft=TTO_DRAFT;if(!draft||!file||draft.scan.busy||draft.saving)return;
  if(!/^image\//.test(file.type||'')){toast('File ini bukan foto');return}
  ttoPick(file); // foto dokumen ikut jadi dokumentasi (kalau belum 4)
  draft.scan={busy:true,tone:'busy',msg:'Membaca foto…'};ttoScanPaint();let out;
  try{const blob=await IMMStore.preparePhoto(file,[],1600);const scan=await IMMStore.scanTto(blob,deviceId());
    if(TTO_DRAFT!==draft)return; // form sudah ditutup
    const f=IMMCore.scanToForm(scan);ttoFill(f);const n=(scan.items||[]).length;
    out={tone:f.notes.length?'warn':'ok',msg:`Terbaca: ${f.no_tto||'tanpa nomor'} · ${f0(n)} barang${f.koli!==''?` · ${f0(f.koli)} koli`:''}. ${f.notes.length?f.notes.join(' '):'Cek lagi sebelum disimpan.'}`};buzz(12)}
  catch(e){if(TTO_DRAFT!==draft)return;out={tone:'err',msg:SCAN_ERR[e&&e.message]||'Scan gagal. Coba lagi, atau isi manual.'};buzz(30)}
  draft.scan={busy:false,...out};ttoScanPaint();
}
function ttoDraftClear(){if(TTO_DRAFT)TTO_DRAFT.photos.forEach(p=>{try{URL.revokeObjectURL(p.url)}catch(e){}});TTO_DRAFT=null}
function openTtoForm(){
  ttoDraftClear();TTO_DRAFT={photos:[],saving:false,scan:{busy:false,tone:'',msg:''}};
  const fld=(id,label,html)=>`<label class="inb-field" data-f="${id}"><span>${label}</span>${html}<em class="inb-msg"></em></label>`;
  sheet(sHead('Tambah TTO','Serah terima dokumen atau barang','',false),
    `<form id="ttoForm" class="tto-form" novalidate>
      <div id="ttoScan" class="tto-scan">${ttoScanHtml()}</div>
      ${fld('ttoTgl','Tanggal serah terima',`<input id="ttoTgl" type="date" value="${TODAY}">`)}
      ${fld('ttoNo','No TTO',`<input id="ttoNo" type="text" autocomplete="off" autocapitalize="characters" maxlength="60">`)}
      ${fld('ttoBarang','Nama barang',`<textarea id="ttoBarang" rows="1" autocomplete="off" maxlength="${IMMCore.TTO_BARANG_MAX}"></textarea>`)}
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
  document.querySelectorAll('#ttoForm .inb-field').forEach(f=>{const m=bad[f.dataset.f]||'';f.classList.toggle('bad',!!m);if(m)f.classList.remove('scanned');f.querySelector('.inb-msg').textContent=m||(f.classList.contains('scanned')?SCAN_MARK:'')});
  return !Object.keys(bad).length;
}
async function ttoSave(){
  if(!TTO_DRAFT||TTO_DRAFT.saving)return;if(TTO_DRAFT.scan.busy){toast('Tunggu sampai foto selesai dibaca');return}const e=ttoRead();
  if(!ttoValidate(e)){buzz(30);const f=document.querySelector('#ttoForm .inb-field.bad input,#ttoForm .inb-field.bad select,#ttoForm .inb-field.bad textarea');f&&f.focus();return}
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
// Muat ulang data halaman Inbound yang sedang dibuka (tombol sinkron, tarik-untuk-segarkan, "Coba lagi").
function inbRefresh(){PH.state='idle';inbTilesStale();if(S.inb==='tto'){inbSyncTto(true);return Promise.resolve()}return loadInbound(true)}
function inboundBack(){if(S.page!=='inb'||!S.inb||!inbUnlocked())return false;S.inb='';inbTilesStale();S.more={};render(true);window.scrollTo({top:0});return true}
function inboundClick(e){
  if(S.page!=='inb')return false;const g=s=>e.target.closest(s);let t;
  if(g('[data-pv-x]')||(e.target&&e.target.id==='photoView')){inboundOverlayBack();return true}
  if(g('#inbGo')){inbTryUnlock();return true}
  if(g('[data-inb-back]')){inboundBack();return true}
  if(!inbUnlocked())return false;
  if(g('#sync')||g('[data-inb-reload]')){buzz(6);inbRefresh();render();return true}
  if(t=g('[data-putf]')){const k=t.dataset.putf;S.putF=(k==='all'||S.putF===k)?'':k;S.more.put=0;buzz(5);render();return true}
  if(g('[data-put-reset]')){S.putF='';S.putLoc='';S.q.put='';S.more.put=0;buzz(5);render();return true}
  if(t=g('[data-photo-add]')){const el=document.getElementById(t.dataset.photoAdd==='cam'?'phCam':'phGal');el&&el.click();return true}
  if(t=g('[data-photo-view]')){photoView(t.dataset.photoView);return true}
  if(t=g('[data-photo-del]')){phDel(t.dataset.photoDel);return true}
  if(t=g('[data-lpn]')){openLpn(t.dataset.lpn);return true}
  if(g('#ttoAdd')){openTtoForm();return true}
  if(g('#ttoSave')){ttoSave();return true}
  if(t=g('[data-tto-scan]')){const el=document.getElementById(t.dataset.ttoScan==='cam'?'ttoScanCam':'ttoScanGal');el&&el.click();return true}
  if(t=g('[data-tto-photo]')){const el=document.getElementById(t.dataset.ttoPhoto==='cam'?'ttoCam':'ttoGal');el&&el.click();return true}
  if(t=g('[data-tto-unphoto]')){if(TTO_DRAFT&&!TTO_DRAFT.saving){const p=TTO_DRAFT.photos.splice(+t.dataset.ttoUnphoto,1)[0];if(p)try{URL.revokeObjectURL(p.url)}catch(_){}document.getElementById('ttoPhotos').innerHTML=ttoPhotosHtml()}return true}
  if(g('#ttoDel')){ttoDelete(g('#ttoDel').dataset.id);return true}
  if(t=g('[data-tto]')){openTto(t.dataset.tto);return true}
  if(t=g('[data-inb]')){if(!inbUnlocked()){render();return true}S.inb=t.dataset.inb;S.more={};buzz(6);if(S.inb==='put')PH.state='idle';if(S.inb==='tto'&&TTO.state!=='idle')inbSyncTto(true);render(true);window.scrollTo({top:0});return true}
  return false;
}
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target&&e.target.id==='inbPw'){e.preventDefault();inbTryUnlock()}});
document.addEventListener('change',e=>{const el=e.target;if(!el||!el.matches||!el.matches('[data-photo-input]'))return;const f=el.files&&el.files[0];el.value='';if(f&&el.closest('#lpnPhotos'))phAdd(f)});
document.addEventListener('change',e=>{const el=e.target;if(!el||!el.matches||!el.matches('[data-tto-input]'))return;const f=el.files&&el.files[0];el.value='';ttoPick(f)});
document.addEventListener('submit',e=>{if(e.target&&e.target.id==='ttoForm'){e.preventDefault();ttoSave()}});
document.addEventListener('input',e=>{const f=e.target&&e.target.closest&&e.target.closest('#ttoForm .inb-field.bad,#ttoForm .inb-field.scanned');if(f){f.classList.remove('bad','scanned');f.querySelector('.inb-msg').textContent=''}});
document.addEventListener('input',e=>{if(e.target&&e.target.id==='ttoBarang'){if(/[\r\n]/.test(e.target.value))e.target.value=e.target.value.replace(/\s*[\r\n]+\s*/g,' ');ttoGrow(e.target)}});
document.addEventListener('change',e=>{const el=e.target;if(!el||!el.matches||!el.matches('[data-tto-scan-input]'))return;const f=el.files&&el.files[0];el.value='';ttoScan(f)});
document.addEventListener('change',e=>{if(e.target&&e.target.id==='putLoc'){S.putLoc=e.target.value;S.more.put=0;buzz(5);render()}});
