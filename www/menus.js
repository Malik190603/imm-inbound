// ======================= LIST → Monitoring LC DC, Occupancy & Layout, Sloc, Demand, LPPBPO, Report, MPP =======================

// ---------- Monitoring → LC DC ----------
function pageLcDc(){
  if(!D)return `<div class="sk" style="height:170px"></div>`+loadingCards(2);
  const bu=curBU();const a=IMMKpi.lcAging(D.rdc||[],TODAY,bu);
  const old=a.buckets[2].n,mid=a.buckets[1].n;
  return lead({tone:'mark',i:1,empty:!a.total,headline:a.total?`<b>${f0(a.total)} kontainer</b> sudah tiba di Makassar tetapi belum dibongkar${old?`, <b>${f0(old)} lebih dari 14 hari</b>`:mid?`, ${f0(mid)} sudah 8–14 hari`:''}.`:'Tidak ada kontainer yang menunggu dibongkar.',
      value:a.total?cnt(a.total):null,unit:'kontainer',stats:[{l:'Sudah di DC',v:f0(a.atDc),u:'dooring'},{l:'TEUs',v:f0(a.rows.reduce((x,r)=>x+r.te,0))},{l:'Bongkar ≤ 7 hari',v:a.sla!=null?f0(a.sla):'–',u:a.sla!=null?`% dari ${f0(a.done30)}`:''}],
      foot:`<p class="lead-note">Aging dihitung dari ATA (tiba di pelabuhan) sampai tanggal bongkar · 30 hari terakhir untuk SLA</p>`})
  +`<section class="card" style="--i:2">${secHead({icon:I.wait,title:'Kelompok aging',sub:'Jumlah kontainer per lama menunggu bongkar.'})}<div class="cb">${hbars(a.buckets.map((b,i)=>({l:b.label,s:`${f0(b.te)} TEUs`,vt:f0(b.n),v:b.n,color:['var(--good)','var(--warn)','var(--crit)'][i]})))}</div></section>
  <section class="card" style="--i:3">${secHead({icon:I.ship,title:'Daftar LC',hint:`${f0(a.total)} LC`,sub:'Urut dari yang paling lama. Ketuk untuk posisi dan isinya.',gloss:['lc','yard','dooring']})}<div class="cb">
    ${a.rows.length?`<div class="list">${a.rows.slice(0,lim('lcdc',20)).map(r=>{const i=RDC_BY_SI[r.lc];return `<button class="row press" ${i!=null?`data-rdc="${i}"`:''}><span class="a"><span class="mono">${esc(r.lc)}</span> ${buTag(r.bu)}</span><span class="b">${esc(r.k||'')} · tiba ${dshort(r.ata)}${r.door?` · dooring ${dshort(r.door)}`:''}</span><span class="v"><b class="${r.b===2?'lo':''}">${f0(r.ag)}</b><small> hari</small></span></button>`}).join('')}</div>${moreBtn('lcdc',a.rows.length,lim('lcdc',20))}`:emptyState('Semua sudah dibongkar','Tidak ada kontainer yang menunggu di pelabuhan atau di DC.',false,I.ok)}
  </div></section>`;
}

// ---------- Occupancy & Capacity ----------
function pageOccupancy(){
  const R=need(['occH','occA','occAll']);const bu=curBU();
  if(!R.occH&&srcBusy(['occH']))return `<div class="sk" style="height:170px"></div>`+loadingCards(2);
  const o=IMMKpi.occupancy(R.occH,R.occA,R.occAll,bu,TODAY);
  if(o.missing)return lead({tone:'mark',i:1,empty:true,headline:esc(o.reason)})+srcFail(['occH','occA','occAll']);
  const tone=o.pct>=100?'crit':o.pct>=90?'warn':'good';
  const tr=o.trend.slice(-14);const mx=Math.max(...tr.map(t=>t.pct||0),100);
  return lead({tone:'mark',i:1,headline:`Gudang terisi <b>${f1(o.pct)}%</b>: ${fC(o.used)} dari ${fC(o.cap)} CBM${o.free<0?`, <b>lebih ${fC(-o.free)} CBM dari kapasitas</b>`:`, sisa ${fC(o.free)} CBM`}.`,
      value:`${f1(o.pct)}`,unit:'%',stats:[{l:'Terpakai',v:fC(o.used),u:'CBM'},{l:'Kapasitas',v:fC(o.cap),u:'CBM'},{l:'Masuk',v:o.inCbm!=null?f1(o.inCbm):'–',u:'CBM'},{l:'Keluar',v:o.outCbm!=null?f1(o.outCbm):'–',u:'CBM'}],
      foot:`<p class="lead-note">Posisi ${dshort(o.date)} · arus masuk/keluar ${o.flowDate?dshort(o.flowDate):'–'}</p>`})
  +`<div class="grid2" style="--i:2">
    <section class="card">${secHead({icon:I.layers,title:'Per BU',sub:'Ruang terpakai dibanding kapasitas.'})}<div class="cb">${hbars(Object.entries(o.perBu).map(([b,x])=>({l:buLabel(b),s:`${fC(x.used)} / ${fC(x.cap)} CBM`,vt:f1(x.pct)+'%',v:Math.min(x.pct,130),color:x.pct>=100?'var(--crit)':x.pct>=90?'var(--warn)':'var(--good)'})))}</div></section>
    <section class="card">${secHead({icon:I.trend,title:'Tren occupancy',hint:'14 hari',sub:'Persen terisi per hari, dengan CBM masuk dan keluar.'})}<div class="cb">
      <div class="occ-tr">${tr.map(t=>`<div class="occ-d" title="${esc(dlong(t.date))}"><span class="occ-b ${t.pct>=100?'crit':t.pct>=90?'warn':''}" style="height:${Math.max(4,(t.pct||0)/mx*100)}%"></span><span class="occ-l">${pd(t.date).getDate()}</span></div>`).join('')}</div>
      ${mtab(['Tanggal','Terisi','Masuk','Keluar'],tr.slice(-5).reverse().map(t=>[dshort(t.date),t.pct!=null?f1(t.pct)+'%':'–',t.inC?f1(t.inC):'–',t.outC?f1(t.outC):'–']))}
    </div></section>
  </div>`;
}
function pageLayout(){
  const R=need(['locH']);const bu=curBU();
  if(!R.locH&&srcBusy(['locH']))return `<div class="sk" style="height:170px"></div>`+loadingCards(2);
  const L=IMMKpi.layout(R.locH,bu);
  if(L.missing)return lead({tone:'mark',i:1,empty:true,headline:esc(L.reason)})+srcFail(['locH']);
  const by={};L.zones.forEach(z=>{(by[z.bu]=by[z.bu]||[]).push(z)});
  return lead({tone:'mark',i:1,headline:`<b>${f0(L.total)} lokasi</b> rak di ${f0(L.zones.length)} lorong, kapasitas ${fC(L.cap)} CBM.`,value:cnt(L.total),unit:'lokasi',stats:Object.entries(by).map(([b,zs])=>({l:b,v:f0(zs.reduce((a,z)=>a+z.n,0)),u:'lokasi'})).slice(0,4)})
  +Object.entries(by).map(([b,zs],k)=>`<section class="card" style="--i:${2+k}">${secHead({icon:I.layers,title:'Lorong '+esc(b),hint:`${f0(zs.length)} lorong`,sub:'Tiap kotak satu lorong: jumlah bay, lokasi, dan kapasitas. Batang kecil = lokasi per level rak.'})}<div class="cb"><div class="lay">${zs.map(z=>`<div class="lay-z"><b>${esc(z.zone)}</b><span>${f0(z.bays)} bay · ${f0(z.n)} lokasi</span><small>${f1(z.cap)} CBM</small><span class="lay-lv">${z.levels.map(([lv,n])=>`<i title="Level ${esc(lv)}: ${n} lokasi" style="height:${Math.max(3,n/z.n*36)}px"></i>`).join('')}</span></div>`).join('')}</div></div></section>`).join('')
  +notWired('Isi per lokasi','Warna isi per lokasi (heat map) butuh ekspor stok per lokasi terbaru. Data stok di file layout terakhir diperbarui 2025.',9);
}

// ---------- Sloc ----------
function pageSloc(sub){
  const R=need(['sloc','barus']);const bu=curBU();
  if(!R.sloc&&srcBusy(['sloc']))return `<div class="sk" style="height:170px"></div>`+loadingCards(2);
  const s=IMMKpi.sloc(R.sloc,bu,TODAY),d=IMMKpi.damage(R.barus,bu);const isV=sub!=='qty';
  const NAME={'1007-':'Lebih kirim','1007+':'Kurang kirim','1009-':'Discrepancy plus','1009+':'Discrepancy minus'};
  const tot=s.missing?0:s.items.reduce((a,x)=>a+(isV?x.value:x.qty),0);
  const rows=[{k:'1001',n:'Damage',v:isV?null:(d.missing?null:d.qty),sku:d.missing?null:d.sku,note:isV?'nilai rupiah belum ada':''}].concat(s.missing?[]:s.items.map(x=>({k:x.k,n:NAME[x.k],v:isV?x.value:x.qty,sku:x.sku})));
  return lead({tone:'mark',i:1,empty:s.missing,headline:s.missing?esc(s.reason):isV?`Nilai Sloc 1007 & 1009: <b>Rp ${fC(tot)}</b>.`:`Qty Sloc 1007 & 1009: <b>${f0(tot)}</b>${d.missing?'':`, damage (1001) ${f0(d.qty)}`}.`,
      value:s.missing?null:(isV?fC(tot):cnt(tot)),unit:isV?'rupiah':'qty',foot:`<p class="lead-note">${s.missing?'':'Posisi '+dshort(s.date)+' · '}${bu==='ALL'?'HCI + AHI':esc(bu)}</p>`})
  +`<section class="card" style="--i:2">${secHead({icon:I.db,title:isV?'Value per Sloc':'Qty per Sloc',sub:'Sloc 1001 = barang damage (BARUS).'})}<div class="cb">${mtab(['Sloc','',isV?'Value':'Qty','SKU'],rows.map(r=>[`<b>${r.k}</b>`,`${esc(r.n)}${r.note?`<br><small>${r.note}</small>`:''}`,r.v==null?'–':isV?'Rp '+fC(r.v):f0(r.v),r.sku==null?'–':f0(r.sku)]))}</div></section>
  ${!s.missing&&isV&&s.trend.length>1?`<section class="card" style="--i:3">${secHead({icon:I.trend,title:'Tren value',hint:'1007 + 1009',sub:'Nilai per hari, 14 hari terakhir yang terisi.'})}<div class="cb">${hbars(s.trend.slice(-7).reverse().map(t=>({l:esc(dshort(t.d)),vt:'Rp '+fC(t.value),v:t.value,color:'var(--p3)'})))}</div></section>`:''}`;
}

// ---------- Demand (Inbound, Inventory, Planner; Storing & Outbound memakai halaman Role lama) ----------
function pageDemand(sub){
  if(sub==='inbound'){
    if(!D)return `<div class="sk" style="height:170px"></div>`;
    const days=[0,1,2,3,4,5,6].map(k=>addD(TODAY,k));const t=days.map(d=>{const X=slice(d,d);const s=sumRows(X.rows);return {d,cbm:s[0]+s[1]+s[2],stock:s[0],out:s[1]+s[2],te:teu(X.cont),n:X.cont.length}});
    const d0=t[0];
    return lead({tone:'mark',i:1,empty:!d0.n,headline:d0.n?`Hari ini <b>${f0(d0.n)} kontainer</b> (${f0(d0.te)} TEUs) dijadwalkan bongkar.`:'Tidak ada kontainer dijadwalkan bongkar hari ini.',value:cnt(d0.cbm,1),unit:'CBM',stats:[{l:'Ke storing',v:f1(d0.stock)},{l:'Ke outbound',v:f1(d0.out)},{l:'TEUs',v:f0(d0.te)}]})
      +`<section class="card" style="--i:2">${secHead({icon:I.cal,title:'Rencana bongkar 7 hari',hint:'CBM',sub:'Dari MASTER_PLAN, mengikuti filter BU.'})}<div class="cb">${mtab(['Hari','Kontainer','TEUs','CBM'],t.map(x=>[x.d===TODAY?'Hari ini':esc(HARI[pd(x.d).getDay()]+' '+dshort(x.d)),f0(x.n),f0(x.te),f1(x.cbm)]))}</div></section>`;
  }
  if(sub==='planner'){
    const R=need(LD_KEYS);const Ls=ldUse(R);const dem=ldRows(Ls,'OUTBOUND PLANNING|DEMAND IN'),fc=ldRows(Ls,'OUTBOUND PLANNING|FORECAST');
    if(!Ls.length)return srcBusy(LD_KEYS)?'<div class="sk" style="height:170px"></div>':lead({tone:'mark',i:1,empty:true,headline:'Demand planner hanya dilaporkan untuk HCI dan AHI.'});
    const tot=dem.items.filter(x=>!x.parent&&x.unit==='cbm').reduce((a,x)=>a+(x.v||0),0);const f=(fc.items.find(x=>x.label==='Total')||{}).v;
    return lead({tone:'mark',i:1,headline:`Demand outbound masuk <b>${f1(tot)} CBM</b>${f!=null?`, forecast ${f1(f)} CBM`:''}.`,value:f1(tot),unit:'CBM',foot:`<p class="lead-note">Laporan Daily Update ${ldNote()}${dem.date?' · '+dshort(dem.date):''}</p>`})
      +card({icon:I.trend,title:'Demand in',sub:'Customer dan store, per jalur.',right:dateTag(dem.date),body:mrows(dem.items.map(x=>({label:x.label,parent:x.parent,v:x.v,unit:x.unit,fmt:x.unit==='OD'?f0:f1})))},2);
  }
  if(sub==='inventory'){
    const R=need(['wtwH','wtwA']);const bu=curBU();const W=['HCI','AHI'].filter(b=>bu==='ALL'||bu===b).map(b=>[b,IMMKpi.wtw(b==='HCI'?R.wtwH:R.wtwA,TODAY).latest]).filter(x=>x[1]);
    return lead({tone:'mark',i:1,empty:!W.length,headline:W.length?`Target cycle count: <b>${f0(W.reduce((a,x)=>a+x[1].target,0))} lokasi</b>.`:'Demand inventory belum tersedia untuk BU ini.',value:W.length?cnt(W.reduce((a,x)=>a+x[1].target,0)):null,unit:'lokasi'})
      +(W.length?card({icon:I.ok,title:'Target harian wall to wall',sub:'Pekerjaan hitung lokasi per BU.',body:mtab(['BU','Target','Aktual','Kosong'],W.map(([b,x])=>[b,f0(x.target),f0(x.aktual),f0(x.kosong)]))},2):'')
      +notWired('Demand Inventory dalam CBM','Belum ada sumber demand inventory selain target cycle count.',3);
  }
  return notWired('Sedang disiapkan','',1);
}

// ---------- LPPBPO (Outbound) ----------
const pageLppbOut=()=>notWired('LPPBPO Outbound belum ada sumbernya','Data selisih kiriman DC ke store (LPPBPO) tidak ditemukan di spreadsheet mana pun. Kirim link spreadsheetnya agar bisa ditampilkan seperti LPPBDO Inbound.',1);

// ---------- Report ----------
const REP_LINK={rep1:'MC',rep2:'MCU',rep3:'DRH',rep4:'DRA',rep5:'DRN',rep6:'OPI',rep7:'D26',rep8:'LD',rep9:'DCR'};
function pageReportDaily(){
  return `<section class="card" style="--i:1">${secHead({icon:I.clip,title:'Daily Report',hint:'9 laporan',sub:'Ketuk untuk membuka spreadsheet di browser.'})}<div class="cb"><div class="set-group">
    ${IMMSrc.REPORTS.map(r=>`<a class="set-row press" href="${IMMSrc.docUrl(r.doc)}" target="_blank" rel="noopener"><span class="ic">${I.doc}</span><span><div class="t">${esc(r.name)}</div><div class="x">${r.weekly?'Mingguan':'Harian'}</div></span><span class="end">${I.ext}</span></a>`).join('')}
  </div></div></section>`;
}
function pageReportStatus(){
  const keys=['rep1','rep2','rep3','rep4','rep5','rep6','rep7','rep9',...LD_KEYS];const R=need(keys);
  const plannedToday=D?slice(TODAY,TODAY).cont.length:1;
  const s=IMMKpi.reportStatus(R,TODAY,TODAY,D&&plannedToday===0);
  const busy=srcBusy(keys);const nm=id=>IMMSrc.REPORTS.find(r=>r.id===id).name;
  const ST={ok:['Terisi','good'],no:['Belum','crit'],idle:['Tidak ada bongkar',''],unknown:[busy?'Memuat':'Tidak terbaca','warn']};
  return lead({tone:'mark',i:1,empty:s.pct==null,headline:s.pct==null?(busy?'Memeriksa laporan…':'Laporan belum bisa dibaca.'):s.missing.length?`<b>${f0(s.filled)} dari ${f0(s.of)}</b> laporan sudah diisi untuk hari ini. Belum: ${s.missing.map(id=>esc(nm(id))).join(', ')}.`:`Semua ${f0(s.of)} laporan sudah diisi untuk hari ini.`,
      value:s.pct!=null?s.pct:null,unit:'% terisi',stats:[{l:'Terisi',v:f0(s.filled)},{l:'Belum',v:f0(s.missing.length)},{l:'Tidak dihitung',v:f0(s.idle.length+s.unknown.length)}],foot:`<p class="lead-note">${dlong(TODAY)} · laporan tanpa jadwal bongkar hari ini tidak dihitung</p>`})
  +`<section class="card" style="--i:2">${secHead({icon:I.clip,title:'Status per laporan',sub:'Aturan "terisi" per laporan mengikuti isinya (realisasi, tanggal bongkar, atau kolom tanggal hari ini).'})}<div class="cb"><div class="set-group">
    ${IMMSrc.REPORTS.map(r=>{const v=s.st[r.id];const t=ST[v]||ST.unknown;return `<a class="set-row press" href="${IMMSrc.docUrl(REP_LINK[r.id])}" target="_blank" rel="noopener"><span class="ic">${v==='ok'?I.ok:v==='no'?I.crit:I.wait}</span><span><div class="t">${esc(r.name)}</div><div class="x">${r.weekly?'Mingguan · rencana bongkar':'Harian'}</div></span><span class="end">${tag(t[0],t[1])}</span></a>`}).join('')}
  </div></div></section>`;
}

// ---------- MPP ----------
function pageMpp(){
  const per={};if(USERS.map)USERS.map.forEach(u=>{(per[u.role]=per[u.role]||{n:0,wh:0});per[u.role].n++;if(u.jabatan==='WAREHOUSEMAN')per[u.role].wh++});
  const rows=Object.entries(per).sort((a,b)=>b[1].n-a[1].n);
  return lead({tone:'mark',i:1,headline:'Perhitungan kurang/lebih MPP menunggu standar produktivitas dan data kehadiran per departemen.',foot:`<p class="lead-note">Sementara ditampilkan jumlah orang terdaftar per departemen dari Master User.</p>`})
    +(rows.length?card({icon:I.users,title:'Orang terdaftar per departemen',hint:'Master User',body:mtab(['Departemen','Total','Warehouseman'],rows.map(([r,x])=>[esc(ROLE_LABEL[r]||r),f0(x.n),f0(x.wh)]))},2):'')
    +notWired('Kebutuhan MPP vs demand','Kirim standar produktivitas (mis. CBM atau case ID per orang per hari) dan sumber kehadiran per departemen agar keterangan kurang/lebih bisa dihitung.',3);
}

MM_PAGES.monitoring=sub=>sub==='lcdc'?pageLcDc():notWired('Sedang disiapkan','',1);
MM_PAGES.occupancy=sub=>sub==='layout'?pageLayout():pageOccupancy();
MM_PAGES.sloc=sub=>pageSloc(sub);
MM_PAGES.demand=sub=>pageDemand(sub);
MM_PAGES.lppb=sub=>pageLppbOut();
MM_PAGES.report=sub=>sub==='status'?pageReportStatus():pageReportDaily();
MM_PAGES.mpp=()=>pageMpp();
