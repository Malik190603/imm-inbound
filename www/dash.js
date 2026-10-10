// ======================= LIST → DASHBOARD per departemen =======================
// Inbound memakai halaman Beranda lama (index.html). LP ada di lp.js, MHE memakai data Work Order (forms.js).
const LD_KEYS=['ldH','ldA'];
// Laporan Daily Update yang dipakai sesuai filter BU (hanya HCI & AHI yang punya laporan)
function ldUse(R){const bu=curBU();const L={HCI:IMMKpi.ld(R.ldH,TODAY),AHI:IMMKpi.ld(R.ldA,TODAY)};return bu==='ALL'?[L.HCI,L.AHI].filter(Boolean):L[bu]?[L[bu]]:[]}
const ldNote=()=>{const b=curBU();return b==='ALL'?'HCI + AHI':b};
const nv=(v,fmt)=>v==null?'–':(fmt||f1)(v);
// Tabel ringkas dua kolom (label kiri, angka kanan); baris anak (– DC) menjorok
function mrows(items,o){o=o||{};items=(items||[]).filter(x=>!x.group);if(!items.length)return `<p class="foot" style="padding:0">${o.empty||'Belum ada angka.'}</p>`;
  return `<div class="mrows">${items.map(x=>`<div class="mr${x.parent?' sub':''}"><span class="ml">${esc(x.label)}${x.note?`<small>${x.note}</small>`:''}</span><span class="mv">${x.vh!=null?x.vh:nv(x.v,x.fmt||o.fmt)}${x.unit?`<small>${esc(x.unit)}</small>`:''}</span></div>`).join('')}</div>`}
// Tabel beberapa kolom: head=[..], rows=[[..]]
function mtab(head,rows,o){o=o||{};if(!rows.length)return `<p class="foot" style="padding:0">${o.empty||'Belum ada angka.'}</p>`;
  return `<div class="mtab-w"><table class="mtab"><thead><tr>${head.map((h,i)=>`<th${i?' class="r"':''}>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr${r.cls?` class="${r.cls}"`:''}>${(r.cells||r).map((c,i)=>`<td${i?' class="r"':''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}
function card(o,i){return `<section class="card" style="--i:${i==null?3:i}">${secHead(o)}<div class="cb">${o.body}</div></section>`}
const loadingCards=n=>Array.from({length:n||2},()=>`<div class="sk" style="height:140px"></div>`).join('');
function srcFail(keys,title){const e=srcErr(keys);return e?`<section class="card" style="--i:2">${emptyState(title||'Data belum bisa dimuat',esc(e.message||String(e)),false,I.crit)}<div class="empty" style="padding-top:0"><button class="btn press" data-src-retry="${keys.join(',')}">Coba lagi</button></div></section>`:''}
const dateTag=d=>d?`<span class="dtag">${esc(dateNote(d))}</span>`:'';
// Bagian Laporan Daily Update → baris
function ldRows(Ls,sec,filter){const S2=IMMKpi.ldSection(Ls,sec,TODAY,TODAY);if(!S2||!S2.items.length)return {date:null,items:[]};let it=S2.items;if(filter)it=it.filter(filter);return {date:S2.date,items:it}}
function planReal(Ls,secPlan,secReal,labels){
  const P1=IMMKpi.ldSection(Ls,secPlan,TODAY,TODAY),R1=IMMKpi.ldSection(Ls,secReal,TODAY,TODAY);if(!P1||!R1)return {rows:[],date:null};
  const get=(S2,l)=>{const x=S2.items.find(y=>y.label===l&&!y.group);return x?x:null};
  const rows=labels.map(l=>{const p=get(P1,l),r=get(R1,l);if(!p&&!r)return null;const pv=p&&p.v,rv=r&&r.v;const u=(p||r).unit;
    return [esc(l),nv(pv)+` <small>${esc(u)}</small>`,nv(rv),pv?`<b class="${rv!=null&&rv>=pv?'ok':'lo'}">${f0((rv||0)/pv*100)}%</b>`:'–']}).filter(Boolean);
  return {rows,date:R1.date||P1.date};
}

// ---------- STORING ----------
function dashStoring(){
  const R=need(['caseId','trans','dp',...LD_KEYS]);const bu=curBU();const ahiOk=bu==='ALL'||bu==='AHI';
  const st=ahiOk?IMMKpi.storing(R.caseId,R.trans,TODAY):IMMKpi.miss('Data case ID hanya tersedia untuk AHI');
  const busy=srcBusy(['caseId','trans'])&&!R.caseId;
  const Ls=ldUse(R);const dpWeek=R.dp?IMMKpi.dpRange(R.dp,TODAY,7):[];const dpToday=R.dp?IMMKpi.dpDay(R.dp,TODAY,TODAY)||IMMKpi.dpDay(R.dp,addD(TODAY,-1),TODAY):null;
  const inbCbm=D?dayCbm(TODAY,0):null;
  const pr=planReal(Ls,'DC PROCESS|PLAN','DC PROCESS|REALISASI',['Putaway (ke racking)','Sweeper','Pressing','Replenish','Picking Stock']);
  const lv={bawah:'Level bawah',atas:'Level atas',floor:'Floor'};
  const top=busy?`<div class="sk" style="height:170px"></div>`:st.missing?lead({tone:'mark',i:1,empty:true,headline:esc(st.reason)+(bu!=='AHI'?'. Pilih BU AHI atau Semua BU.':'')})
    :lead({tone:'mark',i:1,headline:`Picking ${st.date===TODAY?'hari ini':dshort(st.date)}: <b>${f0(st.picked)}</b> dari ${f0(st.released)} case ID sudah dipick${st.open?`, <b>${f0(st.open)} masih open</b>`:', tidak ada yang open'}.`,
      value:cnt(st.released),unit:'case ID',stats:[{l:'Picked',v:f0(st.picked)},{l:'Open',v:f0(st.open)},{l:'Selesai',v:st.pct!=null?f0(st.pct):'–',u:'%'},{l:'CBM picking',v:f1(st.cbm)}],
      foot:`<p class="lead-note">Gudang A · AHI${st.date!==TODAY?' · data terakhir '+dshort(st.date):''}</p>`});
  return top+srcFail(['caseId','trans'])+`<div class="grid2" style="--i:2">
    ${st.missing||busy?'':card({icon:I.stock,title:'Per level picking',hint:'case ID',sub:'Dirilis, sudah dipick, dan masih open per level rak.',body:mtab(['Level','Dirilis','Picked','Open'],st.levels.map(x=>[lv[x.k],f0(x.released),f0(x.picked),x.open?`<b class="lo">${f0(x.open)}</b>`:'0'])),right:dateTag(st.date)},2)}
    ${st.missing||busy?'':card({icon:I.layers,title:'Rincian level rak',hint:'baris picking',sub:'Jumlah baris picking per tingkat rak (FLR = floor).',body:hbars(st.rak.map(([k,v])=>({l:k==='FLR'?'Floor':'Level '+esc(k),vt:f0(v),v,color:'var(--p3)'})))},3)}
    ${card({icon:I.box,title:'Demand dari Inbound',hint:'CBM',sub:'Barang dari kontainer yang dijadwalkan bongkar hari ini dan masuk storing.',body:inbCbm==null?`<p class="foot" style="padding:0">Memuat jadwal bongkar…</p>`:mrows([{label:'Ke storing hari ini',v:inbCbm,unit:'CBM'},{label:'Besok',v:dayCbm(addD(TODAY,1),0),unit:'CBM'}])},4)}
    ${card({icon:I.trend,title:'Demand picking',hint:'CBM per hari',sub:'Total picking (GRW + customer) dari sheet Demand Picking.',right:dpToday?dateTag(dpToday.date):'',
      body:!R.dp?(srcBusy(['dp'])?'<div class="sk" style="height:90px"></div>':`<p class="foot" style="padding:0">${esc((srcErr(['dp'])||{}).message||'Belum ada data bulan ini.')}</p>`)
        :(dpToday?mrows([{label:'OD',v:dpToday.total.od,fmt:f0},{label:'Case ID',v:dpToday.total.cid,fmt:f0},{label:'Qty',v:dpToday.total.qty,fmt:f0},{label:'CBM',v:dpToday.total.cbm}]):'')+(dpWeek.some(x=>x.v>0)?`<div class="lt-sec">CBM 5 hari terakhir</div>`+hbars(dpWeek.slice(-5).map(x=>({l:esc(dshort(x.d)),vt:x.v?f1(x.v):'–',v:x.v,color:x.d===TODAY?'var(--mark)':'var(--p3)'}))):'')},5)}
  </div>
  ${card({icon:I.done,title:'Proses storing: plan vs realisasi',sub:`Laporan Daily Update (${ldNote()}). Pressing tercatat di sini.`,right:dateTag(pr.date),body:Ls.length?mtab(['Proses','Plan','Realisasi','Capai'],pr.rows,{empty:'Laporan hari ini belum diisi.'}):`<p class="foot" style="padding:0">Laporan Daily Update hanya untuk HCI dan AHI.</p>`},6)}
  ${notWired('Outstanding floor','Sheet Storing belum punya angka outstanding floor (kolom berlabel itu berisi occupancy). Kirim sumbernya agar bisa ditampilkan.',7)}`;
}

// ---------- OUTBOUND ----------
function dashOutbound(){
  const R=need(['rit','caseId','trans',...LD_KEYS]);const Ls=ldUse(R);const bu=curBU();
  if(!Ls.length&&srcBusy(LD_KEYS))return `<div class="sk" style="height:170px"></div>`+loadingCards(3);
  const out=k=>ldRows(Ls,'OUTSTANDING ORDER|'+k);
  const sumOf=(sec,parent,label,unit)=>{const it=sec.items.find(x=>x.label===label&&x.parent===parent&&x.unit===unit);return it?it.v:null};
  const AD=out('AKAN DATANG'),H0=out('H+0'),TL=out('TELAT');
  const bookCbm=sumOf(AD,'Customer','DC','cbm'),bookOd=sumOf(AD,'Customer','DC','OD'),trCbm=sumOf(AD,'Customer','Transit','cbm'),trOd=sumOf(AD,'Customer','Transit','OD');
  const late=sumOf(TL,'','Customer','OD');
  const backlog=['0','1-3','4-7','8-14','15-21','22 UP'].map(b=>{const s=ldRows(Ls,'BACKLOG STORE|'+b);const t=s.items.find(x=>x.label==='Total');return {b,v:t?t.v:null,date:s.date}});
  const dem=ldRows(Ls,'OUTBOUND PLANNING|DEMAND IN'),wave=ldRows(Ls,'OUTBOUND PLANNING|REALISASI WAVE');
  const pr=planReal(Ls,'DC PROCESS|PLAN','DC PROCESS|REALISASI',['Picking Transit','QC Outbound','Consolidation','Loading','Unloading RT']);
  const rit=R.rit||[];const code=d=>d.slice(2).replace(/-/g,'');const tom=addD(TODAY,1);
  const ritN=(d,k)=>rit.filter(r=>String(r[0]).startsWith(code(d))&&new RegExp('RIT\\s*'+k,'i').test(r[2]||'')).length;
  const st=bu==='ALL'||bu==='AHI'?IMMKpi.storing(R.caseId,R.trans,TODAY):null;
  const head=lead({tone:'mark',i:1,empty:bookOd==null,headline:bookOd==null?(Ls.length?'Laporan Daily Update belum mencatat outstanding order.':'Data outbound hanya dilaporkan untuk HCI dan AHI.')
      :`Outstanding booking DC: <b>${f0(bookOd)} order</b> (${f1(bookCbm||0)} CBM)${trOd?`, intransit ${f0(trOd)} order`:''}${late?`, <b>${f0(late)} order telat</b>`:''}.`,
    value:bookOd!=null?cnt(bookOd):null,unit:'order',stats:[{l:'CBM booking DC',v:nv(bookCbm)},{l:'Intransit',v:nv(trOd,f0),u:'order'},{l:'CBM intransit',v:nv(trCbm)},{l:'Telat',v:nv(late,f0),u:'order'}],
    foot:`<p class="lead-note">Laporan Daily Update ${ldNote()}${AD.date?' · '+dshort(AD.date):''}</p>`});
  const ritBody=rit.length?mrows([{label:'Rit 2 kirim hari ini',v:ritN(TODAY,2),fmt:f0,unit:'armada'},{label:'Rit 1 kirim besok',v:ritN(tom,1),fmt:f0,unit:'armada'}])
    :`<p class="foot" style="padding:0">${srcBusy(['rit'])?'Memuat logbook…':'Logbook barang keluar belum diisi untuk hari ini dan besok (data terakhir 15 Sep).'}</p>`;
  return head+`<div class="grid2" style="--i:2">
    ${card({icon:I.truck,title:'Rit pengiriman',sub:'Dari logbook barang keluar LP (kolom RETASE).',body:ritBody},2)}
    ${card({icon:I.done,title:'Picked dan status',hint:'case ID',sub:'Case ID yang dirilis dan sudah dipick (AHI).',body:st&&!st.missing?mrows([{label:'Total picked',v:st.picked,fmt:f0},{label:'Status open',v:st.open,fmt:f0},{label:'Status close',v:Math.min(st.picked,st.released),fmt:f0}]):`<p class="foot" style="padding:0">${st&&st.missing?esc(st.reason):'Hanya tersedia untuk AHI.'}</p>`},3)}
    ${card({icon:I.cal,title:'Outstanding order',sub:'Order customer yang belum terkirim, per waktu kirim.',right:dateTag(AD.date),body:mtab(['','Akan datang','H+0','Telat'],[['Order DC',nv(sumOf(AD,'Customer','DC','OD'),f0),nv(sumOf(H0,'Customer','DC','OD'),f0),nv(sumOf(TL,'Customer','DC','OD'),f0)],['CBM DC',nv(sumOf(AD,'Customer','DC','cbm')),nv(sumOf(H0,'Customer','DC','cbm')),nv(sumOf(TL,'Customer','DC','cbm'))],['Order transit',nv(sumOf(AD,'Customer','Transit','OD'),f0),nv(sumOf(H0,'Customer','Transit','OD'),f0),nv(sumOf(TL,'Customer','Transit','OD'),f0)],['CBM transit',nv(sumOf(AD,'Customer','Transit','cbm')),nv(sumOf(H0,'Customer','Transit','cbm')),nv(sumOf(TL,'Customer','Transit','cbm'))]])},4)}
    ${card({icon:I.wait,title:'Backlog store',hint:'CBM',sub:'Kiriman store yang tertunda, per lama tertunda (hari).',body:hbars(backlog.map(x=>({l:esc(x.b)+' hari',vt:nv(x.v),v:x.v||0,color:x.b==='0'||x.b==='1-3'?'var(--p2)':'var(--crit)'})))},5)}
  </div>
  ${card({icon:I.trend,title:'Planning outbound',hint:'CBM',sub:'Demand masuk dan realisasi wave hari ini.',right:dateTag(dem.date),body:mtab(['','Demand in','Realisasi wave'],dem.items.filter(x=>x.unit==='cbm').map(x=>{const w=wave.items.find(y=>y.label===x.label&&y.parent===x.parent&&y.unit===x.unit);return {cls:x.parent?'sub':'',cells:[(x.parent?'– ':'')+esc(x.label),nv(x.v),nv(w&&w.v)]}}))},6)}
  ${card({icon:I.done,title:'Proses outbound: plan vs realisasi',sub:'QC, konsolidasi, dan loading.',right:dateTag(pr.date),body:mtab(['Proses','Plan','Realisasi','Capai'],pr.rows,{empty:'Laporan hari ini belum diisi.'})},7)}
  ${notWired('Aging LC → Check in → Open → Close','Belum ada jam check in, open, dan close dock di spreadsheet mana pun. Rata-rata, minimum, dan maksimum tiap tahap tampil setelah sumbernya ada.',8)}
  ${notWired('Outstanding location pack','Belum ada stok per lokasi PACK yang diperbarui harian.',9)}`;
}

// ---------- INVENTORY ----------
function dashInventory(){
  const R=need(['wtwH','wtwA','occH','occA','occAll','virtual','sloc','barus','ccPick','ccMove']);const bu=curBU();
  const ak=IMMKpi.akurasi(R.wtwH,R.wtwA,bu,TODAY),oc=IMMKpi.occupancy(R.occH,R.occA,R.occAll,bu,TODAY);
  if(srcBusy(['wtwH','wtwA','occH'])&&!R.wtwH)return `<div class="sk" style="height:170px"></div>`+loadingCards(3);
  const bus=(bu==='ALL'?['HCI','AHI']:[bu]).filter(b=>b==='HCI'||b==='AHI');
  const W={HCI:IMMKpi.wtw(R.wtwH,TODAY).latest,AHI:IMMKpi.wtw(R.wtwA,TODAY).latest};
  const vl=IMMKpi.virtualLoc(R.virtual,bu),sl=IMMKpi.sloc(R.sloc,bu,TODAY),bb=IMMKpi.barusBudget(R.barus,bu);
  const cp=IMMKpi.ccTotal(R.ccPick),cm=IMMKpi.ccTotal(R.ccMove);
  const head=lead({tone:'mark',i:1,empty:!!ak.missing,headline:ak.missing?esc(ak.reason):`Akurasi lokasi <b>${f2(ak.pct)}%</b>${oc.missing?'':`, occupancy <b>${f1(oc.pct)}%</b>`}.`,
    value:ak.missing?null:`${f2(ak.pct)}`,unit:'%',stats:[{l:'Target lokasi',v:ak.missing?'–':f0(ak.target)},{l:'Selisih',v:ak.missing?'–':f0(ak.selisih)},{l:'Occupancy',v:oc.missing?'–':f1(oc.pct),u:'%'}],
    foot:`<p class="lead-note">Cycle count wall to wall ${ak.date?'· '+dshort(ak.date):''}</p>`});
  const w=b=>W[b]||{};
  const wtwRows=['target','plus','minus','kosong','aktual','pct'].map(k=>[{target:'Target',plus:'Plus',minus:'Minus',kosong:'Lokasi kosong',aktual:'Aktual',pct:'Akurasi lokasi'}[k],...bus.map(b=>W[b]?(k==='pct'?f2(W[b].pct)+'%':f0(W[b][k])):'–')]);
  const occBars=oc.missing?'':hbars(Object.entries(oc.perBu).map(([b,x])=>({l:buLabel(b),s:`${fC(x.used)} / ${fC(x.cap)} CBM`,vt:f1(x.pct)+'%',v:Math.min(x.pct,130),color:x.pct>=100?'var(--crit)':x.pct>=90?'var(--warn)':'var(--good)'})));
  const vRows=vl.missing?[]:[vl.intransit,vl.pack,vl.floor].map(x=>[esc(tc(x.loc)),f0(x.qty),f0(x.sku),`${f0(x.old.qty)} <small>qty</small>`]);
  const rc=(o,lab)=>o&&Object.keys(o).length?bus.filter(b=>o[b]).map(b=>({label:`${lab} ${b}`,vh:`${o[b].acc!=null?f2(o[b].acc)+'%':'–'}`,note:` · ${f0(o[b].plus)} plus, ${f0(o[b].minus)} minus dari ${f0(o[b].total)}`})):[];
  return head+`<div class="grid2" style="--i:2">
    ${card({icon:I.layers,title:'Occupancy',sub:'Ruang terpakai dibanding kapasitas, per BU.',right:dateTag(oc.date),body:oc.missing?`<p class="foot" style="padding:0">${esc(oc.reason)}</p>`:occBars},2)}
    ${card({icon:I.ok,title:'Cycle count wall to wall',sub:'Hari terakhir yang terisi.',right:dateTag(ak.date),body:bus.length?mtab(['',...bus],wtwRows):'<p class="foot" style="padding:0">Hanya untuk HCI dan AHI.</p>'},3)}
    ${card({icon:I.done,title:'Perbaikan wall to wall',sub:'Selisih yang sudah diperbaiki, per lokasi, count, dan qty.',body:bus.length?mtab(['','Selesai','Plus','Minus','Akurasi'],bus.flatMap(b=>[['done','Lokasi'],['countDone','Count'],['qtyDone','Qty']].map(([g,l])=>{const x=w(b)[g];return [`${l} <small>${b}</small>`,x?f0(x.loc):'–',x?f0(x.plus):'–',x?f0(x.minus):'–',x&&x.acc!=null?f1(x.acc)+'%':'–']}))):''},4)}
    ${card({icon:I.spark,title:'Akurasi dan root cause',sub:'Akurasi count per jenis cycle count. Pressing, adjustment, dan miss cycle belum ada di spreadsheet.',body:mrows([...bus.filter(b=>W[b]).map(b=>({label:'Akurasi count '+b,vh:W[b].accCount!=null?f2(W[b].accCount)+'%':'–'})),...rc(cm,'Move'),...rc(cp,'Picking')])},5)}
  </div>
  ${card({icon:I.wait,title:'Aging lokasi virtual & floor',sub:'Qty dan SKU per lokasi; kolom kanan = umur lebih dari 3 hari.',right:dateTag(vl.date),body:vl.missing?`<p class="foot" style="padding:0">${esc(vl.reason)}</p>`:mtab(['Lokasi','Qty','SKU','> 3 hari'],vRows)},6)}
  ${!vl.missing?card({icon:I.trend,title:'Floor per umur',hint:'qty',sub:'Barang di floor dikelompokkan per lama tersimpan (hari).',body:hbars(vl.floor.buckets.map((x,i)=>({l:vl.BUCKETS[i]+' hari',s:`${f0(x.sku)} SKU`,vt:f0(x.qty),v:x.qty,color:i<1?'var(--p2)':i<3?'var(--warn)':'var(--crit)'})).filter(x=>x.v>0))},7):''}
  <div class="grid2" style="--i:8">
    ${card({icon:I.db,title:'Sloc 1007 & 1009',sub:'Lebih/kurang kirim dan discrepancy.',right:dateTag(sl.date),body:sl.missing?`<p class="foot" style="padding:0">${esc(sl.reason)}</p>`:mtab(['Sloc','SKU','Qty','Value'],sl.items.map(x=>[esc(x.k),f0(x.sku),f0(x.qty),'Rp '+fC(x.value)]))},8)}
    ${card({icon:I.crit,title:'Budget BARUS',sub:'Barang rusak: batas dan pemakaian budget bulan ini.',body:bb.missing?`<p class="foot" style="padding:0">${esc(bb.reason)}</p>`:mrows([{label:'Budget limit',vh:'Rp '+fC(bb.limit)},{label:'Sisa budget',vh:`<span class="${bb.sisa<0?'lo':''}">Rp ${fC(bb.sisa)}</span>`},{label:'Penggunaan DC',vh:'Rp '+fC(bb.dc)},{label:'Penggunaan Store',vh:'Rp '+fC(bb.store)}])},9)}
  </div>`;
}

// ---------- PLANNER ----------
function dashPlanner(){
  const R=need(['plDash','plPending',...LD_KEYS]);const bu=curBU();
  if(!R.plDash&&srcBusy(['plDash']))return `<div class="sk" style="height:170px"></div>`+loadingCards(3);
  const p=IMMKpi.planner(R.plDash,bu);const Ls=ldUse(R);
  const tr=ldRows(Ls,'OUTSTANDING ORDER|AKAN DATANG');const trCbm=(tr.items.find(x=>x.label==='Transit'&&x.parent==='Customer'&&x.unit==='cbm')||{}).v;
  const pend=(R.plPending||[]).slice(1);const pendCbm=pend.reduce((a,r)=>a+(IMMParse.num(r[3])||0),0);
  if(p.missing)return lead({tone:'mark',i:1,empty:true,headline:esc(p.reason)})+srcFail(['plDash']);
  const T=p.total;const lbl={'CUSTOMER RDC':'Customer RDC','CUSTOMER NDC':'Customer NDC','RT':'RT'};const okl={today:'Today',h1:'H+1',h2:'H+2',h3:'H+3 up'};
  return lead({tone:'mark',i:1,headline:`Realisasi kirim <b>${f0(T.real.od)} dari ${f0(T.plan.od)} OD</b> (${T.pct!=null?f0(T.pct):0}% CBM).`,
      value:cnt(T.plan.od),unit:'OD plan',stats:[{l:'Plan CBM',v:f1(T.plan.cbm)},{l:'Realisasi CBM',v:f1(T.real.cbm)},{l:'Plan qty',v:fC(T.plan.qty)},{l:'Pending kirim',v:f0(pend.length),u:'OD'}],
      foot:`<p class="lead-note">Dashboard Planner ${p.bus.join(' + ')}${p.date?' · '+dshort(p.date):''}</p>`})
  +`<div class="grid2" style="--i:2">
    ${card({icon:I.trend,title:'Plan vs realisasi',sub:'Per jenis customer.',body:mtab(['','Plan OD','CBM','Qty','Real OD','CBM','Qty'],p.types.map(t=>[lbl[t.k],f0(t.plan.od),f1(t.plan.cbm),f0(t.plan.qty),f0(t.real.od),f1(t.real.cbm),f0(t.real.qty)]))},2)}
    ${card({icon:I.cal,title:'Outstanding customer',sub:'Order customer menurut jadwal kirim.',body:mtab(['','OD','CBM','Qty'],p.outstanding.map(x=>[okl[x.k],f0(x.od),f1(x.cbm),f0(x.qty)]))},3)}
    ${card({icon:I.ship,title:'Outstanding transit dan pending',body:mrows([{label:'Outstanding transit',v:trCbm,unit:'CBM',note:' · Laporan Daily Update'},{label:'Pending kirim',v:pend.length,fmt:f0,unit:'OD'},{label:'CBM pending',v:pendCbm,unit:'CBM'}])},4)}
    ${card({icon:I.wait,title:'Aging intransit customer di DC',hint:'CBM',sub:'Per store, dikelompokkan per lama di DC (hari).',body:p.aging.length?mtab(['Store','1-3','4-7','8-15','16-30','>30'],p.aging.map(a=>[esc(a.store),...a.v.map(v=>v?f1(v):'–')])):`<p class="foot" style="padding:0">Tidak ada barang intransit customer yang tertahan${bu==='AHI'?' (blok aging hanya tersedia untuk HCI)':''}.</p>`},5)}
  </div>`;
}

// ---------- MHE ----------
function dashMHE(){
  const R=need(LD_KEYS);const Ls=ldUse(R);const ws=typeof woState==='function'?woState():null;
  const wos=ws&&ws.rows||[];const sm=IMMWo.summary(wos);const asset=ldRows(Ls.length?Ls:[],'MHE|PEMAKAIAN');
  const A={};Ls.forEach(L=>(L.secs['MHE|PEMAKAIAN']||[]).forEach(it=>{const a=IMMParse.num(L.rows[it.row][2]);const u=L.val(it,asset.date);(A[it.label]=A[it.label]||{asset:0,pakai:0}).asset+=a||0;A[it.label].pakai+=u||0}));
  const cost=wos.filter(w=>w.status!=='ditolak').reduce((a,w)=>a+(+w.biaya||0),0);
  return lead({tone:'mark',i:1,empty:!wos.length,headline:wos.length?`<b>${f0(sm.open)} work order</b> masih berjalan, ${f0(sm.byStatus.menunggu)} menunggu persetujuan Manager.`:(ws&&ws.state==='loading'?'Memuat work order…':'Belum ada work order yang dicatat.'),
      value:wos.length?cnt(wos.length):null,unit:'work order',stats:[{l:'Selesai',v:f0(sm.byStatus.selesai)},{l:'Pending',v:f0(sm.byStatus.pending)},{l:'Estimasi biaya',v:'Rp '+fC(cost)}],
      foot:`<button class="btn sm press" data-go-list="infra/workorder">${I.wrench}Buka Work Order</button>`})
  +`<div class="grid2" style="--i:2">
    ${card({icon:I.wrench,title:'Status aset',sub:`Jumlah alat dan yang dipakai (Laporan Daily Update ${ldNote()}).`,right:dateTag(asset.date),body:Object.keys(A).length?mtab(['Alat','Aset','Dipakai'],Object.entries(A).filter(([k])=>k!=='Total').map(([k,v])=>[esc(k),f0(v.asset),f0(v.pakai)])):'<p class="foot" style="padding:0">Belum ada data aset.</p>'},2)}
    ${card({icon:I.crit,title:'Jenis kerusakan',sub:'Work order per alat / mesin.',body:sm.byAlat.length?hbars(sm.byAlat.map(([k,v])=>({l:esc(k),vt:f0(v),v,color:'var(--p3)'}))):'<p class="foot" style="padding:0">Belum ada work order.</p>'},3)}
    ${card({icon:I.clip,title:'Jenis pekerjaan',body:sm.byPekerjaan.length?hbars(sm.byPekerjaan.map(([k,v])=>({l:esc(k),vt:f0(v),v,color:'var(--p2)'}))):'<p class="foot" style="padding:0">Belum ada work order.</p>'},4)}
    ${card({icon:I.trend,title:'Tren per hari',hint:'work order',body:sm.perHari.length?hbars(sm.perHari.slice(-10).map(([d,v])=>({l:dshort(d),vt:f0(v),v,color:'var(--p3)'}))):'<p class="foot" style="padding:0">Belum ada work order.</p>'},5)}
  </div>`;
}

// ---------- Dashboard Inbound: tambahan di bawah Beranda lama ----------
function dashInboundExtra(){
  const R=need(LD_KEYS);const Ls=ldUse(R);
  const p=planReal(Ls,'UNLOADING|PLAN','UNLOADING|REALISASI',['Container','Darat','Vendor Local']);
  const pend=ldRows(Ls,'UNLOADING|PENDING BONGKAR');
  const tools=SES&&(SES.role==='INBOUND'||['MANAGER','ASST. MANAGER','ADMIN'].includes(SES.jabatan));
  return `${Ls.length?card({icon:I.done,title:'Unloading: plan vs realisasi',sub:`Laporan Daily Update ${ldNote()}. Pending bongkar di baris bawah.`,right:dateTag(p.date),
      body:mtab(['','Plan','Realisasi','Capai'],p.rows,{empty:'Laporan hari ini belum diisi.'})+(pend.items.some(x=>x.v)?mrows(pend.items.map(x=>({label:'Pending '+x.label,v:x.v,fmt:f0,unit:x.unit}))):'')},7):''}
    ${tools?`<button class="tile wide row press" data-go-list="dashboard/tools" style="--i:8"><span class="tile-ic">${I.lock}</span><span class="t">Alat tim Inbound</span><span class="tile-n"><span class="tile-u">Putaway · Productivity · MPP detail</span></span><span class="tile-go">${I.chev}</span></button>`:''}`;
}

MM_PAGES.dashboard=sub=>({storing:dashStoring,outbound:dashOutbound,inventory:dashInventory,planner:dashPlanner,mhe:dashMHE,lp:typeof lpDash==='function'?lpDash:()=>notWired('LP','Sedang disiapkan',1)})[sub]?.()||notWired('Sedang disiapkan','',1);
