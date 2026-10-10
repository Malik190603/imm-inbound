// ======================= LIST → Infrastructure (Work Order, Reminder), LP Observasi, Project & Schedule =======================
// Semua penulisan lewat fungsi Supabase (IMMStore.rpc) yang memeriksa aturan yang sama dengan IMMWo.
I.camera=I.cam||'';
const nowLocal=()=>{const d=new Date();const p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`};
const fmtDT=t=>{if(!t)return '–';const d=new Date(t);return isNaN(d)?esc(String(t)):d.toLocaleString('id-ID',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})};
const rp=v=>v==null||v===''?'–':'Rp '+f0(+v);
const errOf=e=>e&&e.message==='RULE'?e.why:e&&e.message==='NETWORK'?'Tidak ada internet. Coba lagi saat tersambung.':e&&e.message==='NOCONFIG'?'Penyimpanan belum diatur.':e&&e.message==='MAX'?'Maksimal 4 foto.':'Gagal menyimpan. Coba lagi.';
function fieldErr(form,errors){document.querySelectorAll(`#${form} .inb-field`).forEach(f=>{const m=errors[f.dataset.f]||'';f.classList.toggle('bad',!!m);const em=f.querySelector('.inb-msg');if(em)em.textContent=m});const bad=document.querySelector(`#${form} .inb-field.bad input,#${form} .inb-field.bad select,#${form} .inb-field.bad textarea`);bad&&bad.focus()}
const fld=(id,label,html,hint)=>`<label class="inb-field" data-f="${id}"><span>${label}</span>${html}${hint?`<small class="fh">${hint}</small>`:''}<em class="inb-msg"></em></label>`;
const opts=(list,cur,ph)=>`<option value="">${ph}</option>`+list.map(x=>`<option${x===cur?' selected':''}>${esc(x)}</option>`).join('');

// ---------- foto draf (dipakai WO selesai dan isian observasi) ----------
const PH_DRAFT={list:[],busy:false};
function phDraftClear(){PH_DRAFT.list.forEach(p=>{try{URL.revokeObjectURL(p.url)}catch(e){}});PH_DRAFT.list=[]}
function phDraftHtml(min){const n=PH_DRAFT.list.length;
  return `<div class="ph-grid">${PH_DRAFT.list.map((p,i)=>`<div class="ph-item"><img src="${p.url}" alt="Foto ${i+1}"><button type="button" class="ph-x press" data-ph-un="${i}" aria-label="Hapus foto ${i+1}">${I.x}</button></div>`).join('')}</div>
    ${n<4?`<div class="ph-add"><button type="button" class="btn ghost sm press" data-ph-pick="cam">${I.cam}Kamera</button><button type="button" class="btn ghost sm press" data-ph-pick="gal">${I.plus}Galeri</button></div>`:''}
    <p class="fh">${n}/4 foto${min?' · wajib minimal 1':''}</p>
    <input id="phCamMM" type="file" accept="image/*" capture="environment" hidden data-mm-photo><input id="phGalMM" type="file" accept="image/*" hidden data-mm-photo>`}
function phDraftPaint(){const b=document.getElementById('phDraft');if(b)b.innerHTML=phDraftHtml(b.dataset.min==='1')}
async function phDraftBlobs(label){const out=[];for(const p of PH_DRAFT.list)out.push(await IMMStore.preparePhoto(p.file,[IMMCore.stampText(p.at),label],1600));return out}
document.addEventListener('change',e=>{const el=e.target;if(!el||!el.matches||!el.matches('[data-mm-photo]'))return;const f=el.files&&el.files[0];el.value='';if(!f)return;
  if(!/^image\//.test(f.type||'')){toast('File ini bukan foto');return}if(PH_DRAFT.list.length>=4){toast('Maksimal 4 foto');return}PH_DRAFT.list.push({file:f,url:URL.createObjectURL(f),at:new Date()});phDraftPaint()});

// ======================= WORK ORDER =======================
const WO={rows:[],state:'idle',at:0,err:''};
function woLoad(force){
  if(!IMMStore.configured()){WO.state='error';WO.err='Penyimpanan belum diatur';return}
  if(!force&&(WO.state==='loading'||(WO.state==='ok'&&Date.now()-WO.at<60e3)))return;
  WO.state=WO.rows.length?'refreshing':'loading';
  IMMStore.woList().then(r=>{WO.rows=r;WO.state='ok';WO.at=Date.now();WOS.pending=r.filter(w=>w.status==='menunggu').length;renderShell()},e=>{WO.state='error';WO.err=errOf(e)}).then(()=>{if(S.page==='mm'&&(S.route.menu==='infra'||S.route.sub==='mhe'))render();if(S.woOpen){const n=S.woOpen;S.woOpen='';openWo(n)}});
}
function woState(){woLoad(false);return WO}
const WO_TONE={menunggu:'warn',disetujui:'',pending:'warn',selesai:'good',ditolak:'crit'};
const woTag=s=>tag(IMMWo.WO_STATUS[s]||s,WO_TONE[s]||'');
function woRow(w){return `<button class="row press wo-row" data-wo="${esc(w.no)}"><span class="a"><span class="mono">${esc(w.no)}</span> ${woTag(w.status)}</span><span class="b">${esc(w.alat)} · ${esc(w.pekerjaan)}</span><span class="b">${fmtDT(w.mulai)} · ${esc(w.tim)}</span><span class="v">${w.biaya!=null?`<small>${rp(w.biaya)}</small>`:I.chev}</span></button>`}
function pageWO(){
  woLoad(false);const me=SES;const mgr=IMMAuth.isManager(me);
  if(mgr&&NOTIF.unread.length)notifReadAll();
  const add=`<button class="btn block press" id="woAdd" style="--i:2">${I.plus}Tambah Work Order</button>`;
  if(WO.state==='loading'||WO.state==='idle')return add+loadingCards(2);
  if(WO.state==='error'&&!WO.rows.length)return add+`<section class="card" style="--i:2">${emptyState('Work order belum bisa dimuat',esc(WO.err),false,I.crit)}<div class="empty" style="padding-top:0"><button class="btn press" data-wo-reload>Coba lagi</button></div></section>`;
  const R=WO.rows;const sm=IMMWo.summary(R);const f=S.woF||'aksi';
  const mine=w=>IMMWo.actions(me,w).length>0;
  const FIL={aksi:['Perlu tindakan',mine],jalan:['Berjalan',w=>w.status==='disetujui'||w.status==='pending'],menunggu:['Menunggu',w=>w.status==='menunggu'],selesai:['Selesai',w=>w.status==='selesai'],semua:['Semua',()=>true]};
  const list=R.filter(FIL[f][1]);const n=lim('wo',20);
  return lead({tone:'mark',i:1,empty:!R.length,headline:R.length?(mgr&&sm.byStatus.menunggu?`<b>${f0(sm.byStatus.menunggu)} work order</b> menunggu persetujuanmu.`:`<b>${f0(sm.open)}</b> work order masih berjalan.`):'Belum ada work order. Catat pekerjaan perawatan atau perbaikan alat lewat tombol di bawah.',
      value:R.length?cnt(R.length):null,unit:'work order',stats:[{l:'Menunggu',v:f0(sm.byStatus.menunggu)},{l:'Berjalan',v:f0(sm.byStatus.disetujui+sm.byStatus.pending)},{l:'Selesai',v:f0(sm.byStatus.selesai)},{l:'Estimasi biaya',v:'Rp '+fC(sm.biaya)}]})
    +add+`<section class="card" style="--i:3">${secHead({icon:I.wrench,title:'Daftar work order',hint:`${f0(list.length)} WO`,sub:mgr?'Hanya Manager yang bisa menyetujui. Ketuk untuk rincian dan tindakan.':'Ketuk untuk rincian, riwayat, dan foto.'})}
      <div class="tools"><div class="chips-row">${Object.entries(FIL).map(([k,[l,fn]])=>`<button class="chip press" data-wo-f="${k}" aria-pressed="${k===f}">${l} <b>${f0(R.filter(fn).length)}</b></button>`).join('')}</div></div>
      <div class="cb" style="padding-top:6px">${list.length?`<div class="list">${list.slice(0,n).map(woRow).join('')}</div>${moreBtn('wo',list.length,n)}`:emptyState('Tidak ada',f==='aksi'?'Tidak ada work order yang menunggu tindakanmu.':'Tidak ada work order di kelompok ini.',false,I.ok)}</div></section>`;
}
function openWoForm(){
  const me=SES;
  sheet(sHead('Tambah Work Order','Nomor dibuat otomatis saat disimpan','',false),
    `<form id="woForm" class="mm-form" novalidate>
      <div class="ro2"><div><small>Nomor</small><b class="mono">WO-${TODAY.replace(/-/g,'')}-····</b></div><div><small>Tanggal</small><b>${dlong(TODAY)}</b></div></div>
      ${fld('alat','Alat / Mesin',`<select id="woAlat">${opts(IMMWo.ALAT,'','Pilih alat / mesin')}</select>`)}
      ${fld('pekerjaan','Nama pekerjaan',`<select id="woKerja">${opts(IMMWo.PEKERJAAN,'','Pilih pekerjaan')}</select>`)}
      ${fld('detail','Detail pekerjaan',`<textarea id="woDetail" rows="3" maxlength="1000" placeholder="Apa yang dikerjakan, di mana, kondisi alat"></textarea>`)}
      ${fld('mulai','Waktu mulai',`<input id="woMulai" type="datetime-local" value="${nowLocal()}">`)}
      ${fld('tim','Tim yang terlibat',`<input id="woTim" type="text" maxlength="200" autocomplete="off" placeholder="Mis. Teknisi MHE, vendor">`)}
      ${fld('biaya','Biaya estimasi (Rp)',`<input id="woBiaya" type="text" inputmode="numeric" autocomplete="off" placeholder="0">`,'Boleh dikosongkan')}
      ${fld('catatan','Catatan tambahan',`<textarea id="woCatatan" rows="2" maxlength="1000"></textarea>`)}
      <p class="fh">Dicatat atas NIK <b class="mono">${esc(me?me.nik:'')}</b>. Manager mendapat pemberitahuan untuk persetujuan.</p>
      <button type="submit" class="btn block press" id="woSave">Simpan Work Order</button>
    </form>`);
}
let woSaving=false;
async function woSave(){
  if(woSaving)return;const v=id=>{const e=document.getElementById(id);return e?e.value:''};
  const f={alat:v('woAlat'),pekerjaan:v('woKerja'),detail:v('woDetail'),mulai:v('woMulai'),tim:v('woTim'),biaya:v('woBiaya'),catatan:v('woCatatan')};
  const r=IMMWo.validateWo(f);if(!r.ok){fieldErr('woForm',r.errors);buzz(30);return}
  const b=document.getElementById('woSave');woSaving=true;b.disabled=true;b.textContent='Menyimpan…';
  try{const w=await IMMStore.woCreate(r.value,SES.nik);closeSheet();buzz(12);toast(`${w&&w.no||'Work order'} tersimpan`);if(w&&w.no)WO.rows.unshift(w);S.woF='semua';woLoad(true);render()}
  catch(e){toast(errOf(e));b.disabled=false;b.textContent='Simpan Work Order'}finally{woSaving=false}
}
async function openWo(no,mode){
  const w=WO.rows.find(x=>x.no===no);if(!w){woLoad(true);return}
  const acts=IMMWo.actions(SES,w);phDraftClear();
  const body=(ev)=>`<dl class="kv"><dt>Status</dt><dd>${woTag(w.status)}</dd><dt>Tanggal</dt><dd>${dlong(w.tanggal)}</dd><dt>Alat / Mesin</dt><dd>${esc(w.alat)}</dd><dt>Pekerjaan</dt><dd>${esc(w.pekerjaan)}</dd><dt>Detail</dt><dd>${esc(w.detail)}</dd><dt>Waktu mulai</dt><dd>${fmtDT(w.mulai)}</dd><dt>Tim</dt><dd>${esc(w.tim)}</dd><dt>Biaya estimasi</dt><dd>${rp(w.biaya)}</dd>${w.catatan?`<dt>Catatan</dt><dd>${esc(w.catatan)}</dd>`:''}<dt>Dibuat oleh</dt><dd class="mono">${esc(w.created_by)}</dd></dl>
    ${(w.photos||[]).length?`<div><h4>Dokumentasi (${w.photos.length})</h4><div class="ph-grid">${w.photos.map(p=>`<div class="ph-item"><button class="ph-thumb press" data-photo-view="${esc(p)}" aria-label="Lihat foto"><img loading="lazy" src="${esc(IMMStore.photoUrl(p))}" alt="Foto ${esc(w.no)}"></button></div>`).join('')}</div></div>`:''}
    <div><h4>Riwayat</h4>${ev==null?'<p class="foot" style="padding:0">Memuat…</p>':`<div class="tl">${ev.map(x=>`<div class="st done"><i></i><span class="n">${esc(IMMWo.WO_STATUS[x.ke]||x.ke)}${x.catatan?`<br><small>${esc(x.catatan)}</small>`:''}</span><span class="d">${fmtDT(x.at)}<br><span class="mono">${esc(x.nik)}</span></span></div>`).join('')}</div>`}</div>
    ${mode==='selesai'?`<div class="done-box"><h4>Dokumentasi selesai</h4><p class="fh">Lampirkan 1–4 foto hasil pekerjaan. Tanpa foto, status tidak bisa diubah ke Selesai.</p><div id="phDraft" data-min="1">${phDraftHtml(true)}</div>
      <label class="inb-field"><span>Catatan</span><textarea id="woNote" rows="2" maxlength="500"></textarea></label><button class="btn block press" data-wo-move="selesai" data-wo-no="${esc(w.no)}" data-confirm="1">Tandai selesai</button></div>`
    :acts.length?`<div class="wo-acts">${acts.map(a=>`<button class="btn ${a==='ditolak'?'ghost':''} block press" data-wo-move="${a}" data-wo-no="${esc(w.no)}">${{disetujui:w.status==='pending'?'Lanjutkan (setujui)':'Setujui',ditolak:'Tolak',pending:'Tandai pending',selesai:'Tandai selesai…'}[a]}</button>`).join('')}</div>`:''}`;
  sheet(sHead(esc(w.no),`<span>${esc(w.alat)}</span>`),body(null));
  try{const ev=await IMMStore.woEvents(no);const sb=document.querySelector('.sheet .sb');if(sb&&document.querySelector('.sheet .sh h3')?.textContent===w.no)sb.innerHTML=body(ev)}catch(e){}
}
let woMoving=false;
async function woMove(no,to,confirmed){
  const w=WO.rows.find(x=>x.no===no);if(!w||woMoving)return;
  if(to==='selesai'&&!confirmed){openWo(no,'selesai');return}
  if(to==='ditolak'&&!confirm(`Tolak ${no}?`))return;
  const chk=IMMWo.canMove(SES,w,to,to==='selesai'?PH_DRAFT.list.length:undefined);if(!chk.ok){toast(chk.why);buzz(30);return}
  woMoving=true;const btns=document.querySelectorAll('[data-wo-move]');btns.forEach(b=>b.disabled=true);
  try{const blobs=to==='selesai'?await phDraftBlobs('WO '+no):[];const note=(document.getElementById('woNote')||{}).value||'';
    const r=await IMMStore.woMove(no,to,SES,blobs,note);Object.assign(w,r||{status:to});phDraftClear();closeSheet();buzz(12);toast(`${no}: ${IMMWo.WO_STATUS[to]}`);woLoad(true);render()}
  catch(e){toast(errOf(e));btns.forEach(b=>b.disabled=false)}finally{woMoving=false}
}
function pageReminder(){
  woLoad(false);if(WO.state==='loading'||WO.state==='idle')return loadingCards(2);
  const r=IMMWo.reminders(WO.rows,nowLocal());
  const sec=(t,sub,list,i,ic)=>`<section class="card" style="--i:${i}">${secHead({icon:ic,title:t,hint:`${f0(list.length)} WO`,sub})}<div class="cb">${list.length?`<div class="list">${list.map(woRow).join('')}</div>`:`<p class="foot" style="padding:0">Tidak ada.</p>`}</div></section>`;
  return lead({tone:'mark',i:1,empty:!r.total,headline:r.total?`<b>${f0(r.total)} work order</b> perlu diingatkan.`:'Tidak ada work order yang perlu diingatkan.',value:r.total?cnt(r.total):null,unit:'work order',stats:[{l:'Menunggu persetujuan',v:f0(r.menunggu.length)},{l:'Lewat waktu mulai',v:f0(r.terlambat.length)},{l:'Pending',v:f0(r.pending.length)}]})
    +sec('Menunggu persetujuan Manager','Belum disetujui atau ditolak.',r.menunggu,2,I.wait)+sec('Lewat waktu mulai','Sudah disetujui, waktu mulai sudah lewat, belum selesai.',r.terlambat,3,I.crit)+sec('Pending','Tertunda, perlu dilanjutkan.',r.pending,4,I.warn);
}

// ======================= OBSERVASI LP =======================
const OBS={rows:[],state:'idle',at:0,err:'',entries:{}};
function obsLoad(force){
  if(!IMMStore.configured()){OBS.state='error';OBS.err='Penyimpanan belum diatur';return}
  if(!force&&(OBS.state==='loading'||(OBS.state==='ok'&&Date.now()-OBS.at<60e3)))return;
  OBS.state=OBS.rows.length?'refreshing':'loading';
  IMMStore.obsList().then(r=>{OBS.rows=r;OBS.state='ok';OBS.at=Date.now()},e=>{OBS.state='error';OBS.err=errOf(e)}).then(()=>{if(S.page==='mm'&&S.route.menu==='lp')render()});
}
const OBS_TONE={open:'warn',ongoing:'',closed:'good'};
const obsTag=s=>tag(IMMWo.OBS_STATUS[s]||s,OBS_TONE[s]||'');
function pageObs(){
  obsLoad(false);const can=IMMWo.canMoveObs(SES,{status:'open'},'ongoing').ok;
  const add=can?`<button class="btn block press" id="obsAdd" style="--i:2">${I.plus}Tambah Observasi</button>`:'';
  if(OBS.state==='loading'||OBS.state==='idle')return add+loadingCards(2);
  if(OBS.state==='error'&&!OBS.rows.length)return add+`<section class="card" style="--i:2">${emptyState('Observasi belum bisa dimuat',esc(OBS.err),false,I.crit)}<div class="empty" style="padding-top:0"><button class="btn press" data-obs-reload>Coba lagi</button></div></section>`;
  const R=OBS.rows;const c=k=>R.filter(o=>o.status===k).length;
  return lead({tone:'mark',i:1,empty:!R.length,headline:R.length?`${c('ongoing')?`<b>${f0(c('ongoing'))} observasi</b> sedang berjalan`:'Tidak ada observasi berjalan'}${c('open')?`, ${f0(c('open'))} belum check-in`:''}.`:'Belum ada observasi. Mulai observasi area dan checklist alat lewat tombol di bawah.',
      value:R.length?cnt(R.length):null,unit:'observasi',stats:[{l:'Open',v:f0(c('open'))},{l:'Ongoing',v:f0(c('ongoing'))},{l:'Closed',v:f0(c('closed'))}]})
    +add+`<section class="card" style="--i:3">${secHead({icon:I.shield,title:'Daftar observasi',hint:`${f0(R.length)}`,sub:'Open → check-in → Ongoing (isi observasi dan checklist) → Closed.'})}<div class="cb">${R.length?`<div class="list">${R.slice(0,lim('obs',20)).map(o=>`<button class="row press" data-obs="${esc(o.no)}"><span class="a"><span class="mono">${esc(o.no)}</span> ${obsTag(o.status)}</span><span class="b">${fmtDT(o.mulai)} · ${esc(o.tim)}</span><span class="b mono">oleh ${esc(o.created_by)}</span><span class="v">${I.chev}</span></button>`).join('')}</div>${moreBtn('obs',R.length,lim('obs',20))}`:emptyState('Belum ada observasi','Observasi yang dibuat LP tampil di sini.',false,I.shield)}</div></section>`;
}
function openObsForm(){
  sheet(sHead('Tambah Observasi','Nomor dibuat otomatis saat disimpan','',false),
    `<form id="obsForm" class="mm-form" novalidate>
      <div class="ro2"><div><small>Nomor</small><b class="mono">OBS-${TODAY.replace(/-/g,'')}-····</b></div><div><small>Tanggal</small><b>${dlong(TODAY)}</b></div></div>
      ${fld('mulai','Waktu mulai',`<input id="obsMulai" type="datetime-local" value="${nowLocal()}">`)}
      ${fld('tim','Tim yang terlibat',`<input id="obsTim" type="text" maxlength="200" autocomplete="off" placeholder="Mis. LP shift pagi">`)}
      <p class="fh">Status awal Open. Tekan Check-in saat observasi dimulai.</p>
      <button type="submit" class="btn block press" id="obsSave">Simpan Observasi</button></form>`);
}
async function obsSave(){
  const m=(document.getElementById('obsMulai')||{}).value||'',t=((document.getElementById('obsTim')||{}).value||'').trim();
  const e={};if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(m))e.mulai='Isi tanggal dan jam mulai';if(!t)e.tim='Isi tim yang terlibat';
  if(Object.keys(e).length){fieldErr('obsForm',e);return}
  const b=document.getElementById('obsSave');b.disabled=true;b.textContent='Menyimpan…';
  try{const o=await IMMStore.obsCreate({mulai:m,tim:t},SES);closeSheet();toast(`${o&&o.no||'Observasi'} tersimpan`);if(o)OBS.rows.unshift(o);obsLoad(true);render()}
  catch(err){toast(errOf(err));b.disabled=false;b.textContent='Simpan Observasi'}
}
async function openObs(no,refresh){
  const o=OBS.rows.find(x=>x.no===no);if(!o)return;
  const can=IMMWo.canMoveObs(SES,o,o.status==='open'?'ongoing':'closed').ok;
  const ent=OBS.entries[no];
  const grp=j=>(ent||[]).filter(x=>x.jenis===j);
  const entHtml=(list,lab)=>`<div><h4>${lab} (${list.length})</h4>${list.length?list.map(x=>`<div class="obs-e"><div class="obs-h"><b>${esc(x.objek)}</b>${o.status==='ongoing'&&can?`<button class="lnk press" data-obs-cancel="${x.id}" data-obs-no="${esc(no)}">Batalkan</button>`:''}</div><div class="obs-k">${(x.kondisi||[]).map(k=>tag(esc(k),IMMWo.BAD_KONDISI.includes(k)?'crit':'good')).join('')}</div>${x.detail?`<p>${esc(x.detail)}</p>`:''}${(x.photos||[]).length?`<div class="ph-grid">${x.photos.map(p=>`<div class="ph-item"><button class="ph-thumb press" data-photo-view="${esc(p)}"><img loading="lazy" src="${esc(IMMStore.photoUrl(p))}" alt="Foto ${esc(x.objek)}"></button></div>`).join('')}</div>`:''}<small class="mono">${esc(x.nik)} · ${fmtDT(x.at)}</small></div>`).join(''):'<p class="foot" style="padding:0">Belum ada isian.</p>'}</div>`;
  const html=`<dl class="kv"><dt>Status</dt><dd>${obsTag(o.status)}</dd><dt>Tanggal</dt><dd>${dlong(o.tanggal)}</dd><dt>Waktu mulai</dt><dd>${fmtDT(o.mulai)}</dd><dt>Tim</dt><dd>${esc(o.tim)}</dd><dt>Dibuat oleh</dt><dd class="mono">${esc(o.created_by)}</dd>${o.checkin_by?`<dt>Check-in</dt><dd><span class="mono">${esc(o.checkin_by)}</span> · ${fmtDT(o.checkin_at)}</dd>`:''}${o.closed_by?`<dt>Ditutup</dt><dd><span class="mono">${esc(o.closed_by)}</span> · ${fmtDT(o.closed_at)}</dd>`:''}</dl>
    ${o.status==='open'?(can?`<button class="btn block press" data-obs-move="ongoing" data-obs-no="${esc(no)}">${I.ok}Check-in, mulai observasi</button>`:''):ent==null?'<p class="foot">Memuat isian…</p>':entHtml(grp('lokasi'),'Observasi lokasi')+entHtml(grp('checklist'),'Checklist')}
    ${o.status==='ongoing'&&can?`<div class="wo-acts"><button class="btn ghost block press" data-obs-entry="lokasi" data-obs-no="${esc(no)}">${I.plus}Isi observasi lokasi</button><button class="btn ghost block press" data-obs-entry="checklist" data-obs-no="${esc(no)}">${I.plus}Isi checklist</button><button class="btn block press" data-obs-move="closed" data-obs-no="${esc(no)}">Tutup observasi</button></div>`:''}
    ${o.status==='closed'?'<p class="fh">Observasi sudah ditutup dan hanya bisa dibaca.</p>':''}`;
  sheet(sHead(esc(no),obsTag(o.status)),html);
  if(o.status!=='open'&&(ent==null||refresh)){try{OBS.entries[no]=await IMMStore.obsEntries(no);if(document.querySelector('.sheet .sh h3')?.textContent===no)openObs(no)}catch(e){toast(errOf(e))}}
}
const OBS_DRAFT={kondisi:[]};
function openObsEntry(no,jenis){
  phDraftClear();OBS_DRAFT.kondisi=[];const list=jenis==='checklist'?IMMWo.CHECKLIST:IMMWo.LOKASI;
  sheet(sHead(jenis==='checklist'?'Isi checklist':'Isi observasi lokasi',esc(no),'',false),
    `<form id="obsEntry" class="mm-form" novalidate data-no="${esc(no)}" data-jenis="${jenis}">
      ${fld('objek',jenis==='checklist'?'Item':'Lokasi',`<select id="oeObjek">${opts(list,'',jenis==='checklist'?'Pilih item':'Pilih lokasi')}</select>`)}
      <div class="inb-field" data-f="kondisi"><span>Kondisi <small>(boleh lebih dari satu)</small></span><div class="kchips" role="group" aria-label="Kondisi">${IMMWo.KONDISI.map(k=>`<button type="button" class="chip press" data-kond="${esc(k)}" aria-pressed="false">${esc(k)}</button>`).join('')}</div><em class="inb-msg"></em></div>
      ${fld('detail','Detail lokasi',`<textarea id="oeDetail" rows="2" maxlength="500" placeholder="Posisi tepat, temuan"></textarea>`)}
      <div class="inb-field" data-f="photos"><span>Dokumentasi</span><div id="phDraft">${phDraftHtml(false)}</div><em class="inb-msg"></em></div>
      <button type="submit" class="btn block press" id="oeSave">Simpan isian</button></form>`);
}
async function obsEntrySave(){
  const fm=document.getElementById('obsEntry');if(!fm)return;const no=fm.dataset.no,jenis=fm.dataset.jenis;
  const v={no,jenis,objek:document.getElementById('oeObjek').value,kondisi:OBS_DRAFT.kondisi.slice(),detail:document.getElementById('oeDetail').value,photos:PH_DRAFT.list.length};
  const r=IMMWo.validateObsEntry(v);if(!r.ok){fieldErr('obsEntry',r.errors);buzz(30);return}
  const b=document.getElementById('oeSave');b.disabled=true;b.textContent='Menyimpan…';
  try{const blobs=await phDraftBlobs(`OBS ${no} · ${v.objek}`);await IMMStore.obsAdd({...v},blobs,SES);phDraftClear();toast('Isian tersimpan');buzz(12);delete OBS.entries[no];openObs(no,true)}
  catch(e){toast(errOf(e));b.disabled=false;b.textContent='Simpan isian'}
}
async function obsMove(no,to){
  const o=OBS.rows.find(x=>x.no===no);if(!o)return;if(to==='closed'&&!confirm(`Tutup ${no}? Setelah ditutup isian tidak bisa diubah.`))return;
  try{const r=await IMMStore.obsMove(no,to,SES);Object.assign(o,r||{status:to});toast(to==='ongoing'?'Check-in tercatat':'Observasi ditutup');buzz(12);openObs(no,true);render()}catch(e){toast(errOf(e))}
}

// ======================= PROJECT & SCHEDULE =======================
const SCH={rows:[],state:'idle',at:0,err:''};
function schLoad(force){
  if(!IMMStore.configured()){SCH.state='error';SCH.err='Penyimpanan belum diatur';return}
  if(!force&&(SCH.state==='loading'||(SCH.state==='ok'&&Date.now()-SCH.at<60e3)))return;
  SCH.state=SCH.rows.length?'refreshing':'loading';
  IMMStore.schedList().then(r=>{SCH.rows=r;SCH.state='ok';SCH.at=Date.now()},e=>{SCH.state='error';SCH.err=errOf(e)}).then(()=>{if(S.page==='mm'&&S.route.menu==='schedule')render()});
}
const SCH_TONE={rencana:'',berjalan:'warn',selesai:'good',batal:'crit'};
function pageSchedule(sub){
  schLoad(false);const jenis=sub==='official'?'official':'project';const can=IMMAuth.canEditSchedule(SES);
  const add=can?`<button class="btn block press" data-sch-add="${jenis}" style="--i:2">${I.plus}Tambah ${jenis==='official'?'jadwal resmi HO':'project'}</button>`:'';
  if(SCH.state==='loading'||SCH.state==='idle')return add+loadingCards(1);
  if(SCH.state==='error'&&!SCH.rows.length)return add+`<section class="card" style="--i:2">${emptyState('Jadwal belum bisa dimuat',esc(SCH.err),false,I.crit)}</section>`;
  const list=SCH.rows.filter(r=>r.jenis===jenis);const act=list.filter(r=>r.status==='berjalan'||(r.status==='rencana'&&(!r.selesai||r.selesai>=TODAY)));
  const next=list.filter(r=>r.mulai>=TODAY&&r.status!=='batal').sort((a,b)=>a.mulai<b.mulai?-1:1)[0];
  return lead({tone:'mark',i:1,empty:!list.length,headline:list.length?(jenis==='official'?(next?`Jadwal resmi berikutnya: <b>${esc(next.nama)}</b>, ${dlong(next.mulai)}.`:'Tidak ada jadwal resmi yang akan datang.'):`<b>${f0(list.filter(r=>r.status==='berjalan').length)} project</b> sedang berjalan.`):(jenis==='official'?'Belum ada jadwal resmi HO (mis. stock opname).':'Belum ada project DC yang dicatat.'),
      value:list.length?cnt(act.length):null,unit:'aktif',foot:can?'':`<p class="lead-note">Hanya Manager, Asst Manager, dan Supervisor yang bisa menambah atau mengubah.</p>`})
    +add+`<section class="card" style="--i:3">${secHead({icon:I.cal,title:jenis==='official'?'Official Schedule (Head Office)':'DC Project',hint:`${f0(list.length)}`,sub:'Urut tanggal mulai.'})}<div class="cb">${list.length?`<div class="list">${list.sort((a,b)=>a.mulai<b.mulai?-1:1).map(r=>`<button class="row press" ${can?`data-sch="${r.id}"`:''}><span class="a">${esc(r.nama)} ${tag(IMMWo.SCHED_STATUS[r.status]||r.status,SCH_TONE[r.status]||'')}</span><span class="b">${dshort(r.mulai)}${r.selesai&&r.selesai!==r.mulai?' – '+dshort(r.selesai):''}${r.keterangan?' · '+esc(r.keterangan):''}</span><span class="v">${can?I.chev:''}</span></button>`).join('')}</div>`:emptyState('Belum ada','Belum ada yang dicatat.',false,I.cal)}</div></section>`;
}
function openSchForm(jenis,id){
  const r=id?SCH.rows.find(x=>String(x.id)===String(id)):null;const j=r?r.jenis:jenis;
  sheet(sHead(r?'Ubah jadwal':j==='official'?'Tambah jadwal resmi HO':'Tambah project','','',false),
    `<form id="schForm" class="mm-form" novalidate data-id="${r?r.id:''}" data-jenis="${j}">
      ${fld('nama','Nama',`<input id="schNama" type="text" maxlength="200" value="${esc(r?r.nama:'')}" placeholder="${j==='official'?'Mis. Stock Opname Q4':'Mis. Penambahan rak lorong C'}">`)}
      <div class="two">${fld('mulai','Mulai',`<input id="schMulai" type="date" value="${r?r.mulai:TODAY}">`)}${fld('selesai','Selesai',`<input id="schSelesai" type="date" value="${r&&r.selesai?r.selesai:''}">`)}</div>
      ${fld('status','Status',`<select id="schStatus">${Object.entries(IMMWo.SCHED_STATUS).map(([k,l])=>`<option value="${k}"${(r?r.status:'rencana')===k?' selected':''}>${l}</option>`).join('')}</select>`)}
      ${fld('keterangan','Keterangan',`<textarea id="schKet" rows="2" maxlength="1000">${esc(r?r.keterangan:'')}</textarea>`)}
      <button type="submit" class="btn block press" id="schSave">Simpan</button></form>`);
}
async function schSave(){
  const fm=document.getElementById('schForm');const v=id=>(document.getElementById(id)||{}).value||'';
  const f={id:fm.dataset.id||'',jenis:fm.dataset.jenis,nama:v('schNama'),mulai:v('schMulai'),selesai:v('schSelesai'),status:v('schStatus'),keterangan:v('schKet')};
  const r=IMMWo.validateSchedule(f);if(!r.ok){fieldErr('schForm',r.errors);return}
  const b=document.getElementById('schSave');b.disabled=true;b.textContent='Menyimpan…';
  try{await IMMStore.schedSave(f,SES);closeSheet();toast('Tersimpan');schLoad(true)}catch(e){toast(errOf(e));b.disabled=false;b.textContent='Simpan'}
}

// ---------- klik & form ----------
document.addEventListener('click',e=>{
  const g=s=>e.target.closest(s);let t;let done=true;
  if(g('#woAdd'))openWoForm();
  else if(t=g('[data-wo-f]')){S.woF=t.dataset.woF;S.more.wo=0;buzz(5);render()}
  else if(g('[data-wo-reload]')){woLoad(true);render()}
  else if(t=g('[data-wo-move]'))woMove(t.dataset.woNo,t.dataset.woMove,!!t.dataset.confirm);
  else if(t=g('[data-wo]'))openWo(t.dataset.wo);
  else if(t=g('[data-ph-pick]')){const el=document.getElementById(t.dataset.phPick==='cam'?'phCamMM':'phGalMM');el&&el.click()}
  else if(t=g('[data-ph-un]')){const p=PH_DRAFT.list.splice(+t.dataset.phUn,1)[0];if(p)try{URL.revokeObjectURL(p.url)}catch(_){}phDraftPaint()}
  else if(g('#obsAdd'))openObsForm();
  else if(g('[data-obs-reload]')){obsLoad(true);render()}
  else if(t=g('[data-obs-move]'))obsMove(t.dataset.obsNo,t.dataset.obsMove);
  else if(t=g('[data-obs-entry]'))openObsEntry(t.dataset.obsNo,t.dataset.obsEntry);
  else if(t=g('[data-obs-cancel]')){if(confirm('Batalkan isian ini?'))IMMStore.obsCancel(+t.dataset.obsCancel,SES).then(()=>{delete OBS.entries[t.dataset.obsNo];openObs(t.dataset.obsNo,true)},err=>toast(errOf(err)))}
  else if(t=g('[data-obs]'))openObs(t.dataset.obs);
  else if(t=g('[data-kond]')){const k=t.dataset.kond;const i=OBS_DRAFT.kondisi.indexOf(k);if(i>=0)OBS_DRAFT.kondisi.splice(i,1);else OBS_DRAFT.kondisi.push(k);t.setAttribute('aria-pressed',i<0);buzz(4);const f=t.closest('.inb-field');f.classList.remove('bad');f.querySelector('.inb-msg').textContent=''}
  else if(t=g('[data-sch-add]'))openSchForm(t.dataset.schAdd);
  else if(t=g('[data-sch]'))openSchForm('',t.dataset.sch);
  else if(S.page==='mm'&&(t=g('[data-photo-view]'))&&typeof photoView==='function')photoView(t.dataset.photoView);
  else if(S.page==='mm'&&(g('[data-pv-x]')||(e.target&&e.target.id==='photoView'))&&typeof inboundOverlayBack==='function')inboundOverlayBack();
  else done=false;
  if(done)e.stopPropagation();
},true);
document.addEventListener('submit',e=>{const id=e.target&&e.target.id;const fn={woForm:woSave,obsForm:obsSave,obsEntry:obsEntrySave,schForm:schSave}[id];if(fn){e.preventDefault();fn()}});
document.addEventListener('input',e=>{const f=e.target&&e.target.closest&&e.target.closest('.mm-form .inb-field.bad');if(f){f.classList.remove('bad');const m=f.querySelector('.inb-msg');if(m)m.textContent=''}});

MM_PAGES.infra=sub=>sub==='reminder'?pageReminder():pageWO();
MM_PAGES.schedule=sub=>pageSchedule(sub);
