// ======================= LP (Loss Prevention): Dashboard LP dan LP Menu → In/Out =======================
// Hanya kolom yang aman yang diminta dari spreadsheet (lihat sources.js); nama, NIK, nomor HP, dan nopol tidak pernah dibaca.
const LP_KEYS=['visitor','karyawan','jemput','seal','ttoOut','ttoIn','nmIn','nmOut','ret3pl','palopo','mamuju','palu','lbSum','tugu','sj','kardus'];
function lpData(){const R=need(LP_KEYS);const [from,to]=range();return {L:IMMKpi.lpStats(R,from,to,TODAY),R,from,to}}
const lpN=x=>x==null?'–':f0(x);
function lpTile(o){return `<button class="kc press" ${o.go?`data-lp-go="${o.go}"`:''}><span class="kc-h"><span class="kc-ic">${o.icon}</span>${o.note?`<span class="kc-d">${esc(o.note)}</span>`:''}${o.go?`<span class="kc-go">${I.chev}</span>`:''}</span><span class="kc-l">${o.label}</span>${o.v==null?`<span class="kc-miss">${I.info}<span>${esc(o.miss||'Belum terbaca')}</span></span>`:`<span class="kc-v">${o.v}${o.u?`<small>${o.u}</small>`:''}</span>`}${o.sub?`<span class="kc-s">${o.sub}</span>`:''}</button>`}
function lpDash(){
  const {L}=lpData();const w=whenWord();
  if(srcBusy(['visitor','jemput','seal'])&&!L.tamu)return `<div class="sk" style="height:170px"></div>`+loadingCards(3);
  const t=L.tamu,k=L.karyawan,j=L.jemput,s=L.seal,sm=L.summary||{};
  const head=lead({tone:'mark',i:1,headline:`${t?`<b>${f0(t.n)} tamu</b>`:'Tamu belum terbaca'}${t&&t.didalam?` (${f0(t.didalam)} masih di dalam)`:''}, ${j?`<b>${f0(j.n)} DO jemputan</b>`:'DO jemputan belum terbaca'} ${w}.`,
    value:t?cnt(t.n):null,unit:'tamu',stats:[{l:'Karyawan keluar',v:lpN(k&&k.n)},{l:'DO jemputan',v:lpN(j&&j.n)},{l:'Koli masuk',v:lpN(j&&j.koli)},{l:'Armada terseal',v:lpN(s&&s.armada)}]});
  return head+`<div class="kgrid" style="--i:2">
    ${lpTile({icon:I.users,label:'Tamu / kunjungan',v:t&&f0(t.n),sub:t?`${f0(t.didalam)} masih di dalam hari ini`:'',go:'tamu'})}
    ${lpTile({icon:I.user,label:'Keluar masuk karyawan',v:k&&f0(k.n),sub:k?(k.belum?`${f0(k.belum)} belum kembali`:'Jam keluar sering tidak diisi di form'):'',go:'tamu'})}
    ${lpTile({icon:I.shield,label:'Penggunaan segel',v:s&&f0(s.seal),u:'segel',note:s&&s.date?dateNote(s.date):'',sub:s?'Sheet ditimpa tiap hari: hanya hari terakhir':'',go:'armada'})}
    ${lpTile({icon:I.box,label:'DO jemputan',v:j&&f0(j.n),u:'dok',sub:j?`${f0(j.koli)} koli`:'',go:'masuk'})}
    ${lpTile({icon:I.truck,label:'Tarikan tugu',v:lpN(L.tugu),u:'dok',note:'2026',sub:'Total tahun ini; tanggal per hari belum terbaca'})}
    ${lpTile({icon:I.ship,label:'Return 3PL',v:L.ret3pl&&f0(L.ret3pl.n),sub:w,go:'masuk'})}
    ${lpTile({icon:I.doc,label:'Surat jalan',v:lpN(L.sj),note:'2026',sub:'Total baris tahun ini'})}
    ${lpTile({icon:I.doc,label:'TTO',v:L.ttoIn&&L.ttoOut?f0(L.ttoIn.n+L.ttoOut.n):null,sub:L.ttoIn&&L.ttoOut?`${f0(L.ttoIn.n)} masuk · ${f0(L.ttoOut.n)} keluar`:'',go:'masuk'})}
    ${lpTile({icon:I.clip,label:'Non merchandise',v:L.nmIn&&L.nmOut?f0(L.nmIn.n+L.nmOut.n):null,sub:L.nmIn&&L.nmOut?`${f0(L.nmIn.n)} masuk · ${f0(L.nmOut.n)} keluar`:'',go:'keluar'})}
    ${lpTile({icon:I.truck,label:'Armada Palopo · Mamuju · Palu',v:L.palopo?f0((L.palopo.n||0)+((L.mamuju||{}).n||0)+((L.palu||{}).n||0)):null,sub:L.palopo?`${f0(L.palopo.n)} · ${f0((L.mamuju||{}).n||0)} · ${f0((L.palu||{}).n||0)} armada`:'',go:'armada'})}
    ${lpTile({icon:I.spark,label:'Transaksi Rupa Rupa',v:sm.rupaS2!=null?f0(sm.rupaS2):null,note:'Semester 2',sub:sm.rupaS1!=null?`Semester 1: ${f0(sm.rupaS1)}`:''})}
    ${lpTile({icon:I.db,label:'Penjualan kardus',v:L.kardus&&f0(L.kardus.kg),u:'kg',sub:L.kardus?`Rp ${fC(L.kardus.rp)}${L.kardus.unpaid?` · ${f0(L.kardus.unpaid)} belum dibayar`:''}`:'',go:'kardus'})}
  </div>
  <p class="foot" style="--i:3">Angka ${w}. Logbook barang keluar: ${sm.odS2!=null?`${f0(sm.odS2)} OD di semester 2`:'–'} (data harian berhenti 15 Sep).</p>`;
}

// ---------- LP Menu → In/Out ----------
const LP_TABS=[['tamu','Tamu & karyawan'],['masuk','Barang masuk'],['keluar','Barang keluar'],['armada','Armada & segel'],['kardus','Kardus']];
function pageInOut(){
  const {L}=lpData();const tab=S.lpTab||'tamu';const w=whenWord();
  const segH=`<div class="seg mm-seg" role="group" aria-label="Bagian In/Out" style="--i:1"><span class="knob"></span>${LP_TABS.map(([k,l])=>`<button data-lp-tab="${k}" aria-pressed="${k===tab}">${l}</button>`).join('')}</div>`;
  const busy=srcBusy(LP_KEYS)&&!L.tamu;if(busy)return segH+loadingCards(2);
  const list=(rows,fn,empty)=>rows&&rows.length?`<div class="list">${rows.slice(0,lim('lp'+tab,25)).map(fn).join('')}</div>${moreBtn('lp'+tab,rows.length,lim('lp'+tab,25))}`:emptyState('Kosong',empty||`Tidak ada catatan ${w}.`,true,I.shield);
  let body='';
  if(tab==='tamu'){const t=L.tamu,k=L.karyawan;
    body=`<section class="card" style="--i:2">${secHead({icon:I.users,title:'Tamu / kunjungan',hint:t?`${f0(t.n)} tamu`:'',sub:'Dari logbook visitor. Nama dan nomor telepon tamu tidak ditampilkan.'})}<div class="cb">${t&&t.by.length?`<div class="chips-row" style="margin-bottom:8px">${t.by.map(([k2,v])=>tag(`${esc(k2)} · ${f0(v)}`)).join('')}</div>`:''}${list(t&&t.rows,x=>`<div class="row"><span class="a">${esc(x.tujuan||'Kunjungan')}</span><span class="b">${esc(x.at)}</span><span class="v">${x.keluar?`<small>keluar ${esc(x.keluar.slice(0,5))}</small>`:x.d===TODAY?tag('Di dalam','warn'):'<small>–</small>'}</span></div>`)}</div></section>
      <section class="card" style="--i:3">${secHead({icon:I.user,title:'Keluar masuk karyawan',hint:k?`${f0(k.n)}`:'',sub:'Izin keluar (ISOMA, toilet, dll). Nama dan NIK tidak ditampilkan.'})}<div class="cb">${list(k&&k.rows,x=>`<div class="row"><span class="a">${esc(x.bagian||'-')} ${x.store?`<span class="mono">${esc(x.store)}</span>`:''}</span><span class="b">${esc(x.ket||x.status||'')} · ${esc(x.at)}</span><span class="v"><small>${x.keluar?'keluar '+esc(x.keluar.slice(0,5)):''}${x.masuk?' · masuk '+esc(x.masuk.slice(0,5)):''}</small></span></div>`)}</div></section>`}
  if(tab==='masuk'){const j=L.jemput;
    body=`<section class="card" style="--i:2">${secHead({icon:I.box,title:'DO jemputan (barang masuk)',hint:j?`${f0(j.n)} dok · ${f0(j.koli)} koli`:'',sub:`Dari logbook barang masuk LP${j&&j.last?' · catatan terakhir '+dshort(j.last):''}. Nama customer dan driver tidak ditampilkan.`})}<div class="cb">${list(j&&j.rows,x=>`<div class="row"><span class="a mono">${esc(x.od)}</span><span class="b">${esc(x.store||'-')} · ${dshort(x.d)}</span><span class="v"><b>${f0(x.koli)}</b><small> koli</small></span></div>`)}</div></section>
      ${card({icon:I.doc,title:'Dokumen lain',sub:w,body:mrows([{label:'TTO masuk',v:L.ttoIn&&L.ttoIn.n,fmt:f0},{label:'Non merchandise masuk',v:L.nmIn&&L.nmIn.n,fmt:f0},{label:'Return 3PL',v:L.ret3pl&&L.ret3pl.n,fmt:f0},{label:'Tarikan tugu (total 2026)',v:L.tugu,fmt:f0},{label:'Surat jalan (total 2026)',v:L.sj,fmt:f0}])},3)}`}
  if(tab==='keluar'){const sm=L.summary||{};
    body=card({icon:I.truck,title:'Logbook barang keluar',sub:'Ringkasan dari tab SUMMARY (data harian berhenti 15 Sep).',body:mrows([{label:'Total OD semester 1',v:sm.odS1,fmt:f0},{label:'Total OD semester 2',v:sm.odS2,fmt:f0},{label:'Rupa Rupa semester 1',v:sm.rupaS1,fmt:f0},{label:'Rupa Rupa semester 2',v:sm.rupaS2,fmt:f0}])},2)
      +card({icon:I.doc,title:'Dokumen keluar',sub:w,body:mrows([{label:'TTO keluar',v:L.ttoOut&&L.ttoOut.n,fmt:f0},{label:'Non merchandise keluar',v:L.nmOut&&L.nmOut.n,fmt:f0}])},3)}
  if(tab==='armada'){const s=L.seal;
    body=`<section class="card" style="--i:2">${secHead({icon:I.shield,title:'Armada terseal',hint:s?`${f0(s.armada)} armada`:'',sub:`Pengiriman Astor${s&&s.date?' · '+dlong(s.date):''}. Nomor polisi tidak ditampilkan.`})}<div class="cb">${s&&s.rows.length?mtab(['Seal','Tujuan'],s.rows.map(x=>[`<span class="mono">${esc(x.seal)}</span>`,x.tujuan.map(esc).join(' + ')])):'<p class="foot" style="padding:0">Belum ada armada tersegel.</p>'}</div></section>`
      +card({icon:I.truck,title:'Armada ke luar kota',sub:w,body:mtab(['Tujuan','Periode ini','Total 2026','Terakhir'],[['Palopo',L.palopo],['Mamuju',L.mamuju],['Palu',L.palu]].map(([n,x])=>[n,x?f0(x.n):'–',x?f0(x.total):'–',x&&x.last?dshort(x.last):'–']))},3)}
  if(tab==='kardus'){const k=L.kardus;
    body=card({icon:I.db,title:'Rekap penjualan kardus',sub:`${w}. Rupiah kecil (mis. 218) dianggap ribuan.`,body:k?mtab(['Jenis','Kali','Kg','Rupiah'],k.by.map(([j,x])=>[esc(j),f0(x.n),f0(x.kg),'Rp '+fC(x.rp)]),{empty:`Tidak ada penjualan ${w}.`}):'<p class="foot" style="padding:0">Belum terbaca.</p>'},2)}
  return segH+body;
}
document.addEventListener('click',e=>{const t=e.target.closest('[data-lp-tab]');if(t){S.lpTab=t.dataset.lpTab;S.more={};buzz(5);render();e.stopPropagation();return}
  const g=e.target.closest('[data-lp-go]');if(g){S.lpTab=g.dataset.lpGo;e.stopPropagation();if(IMMAuth.can(SES,'lp'))go('list','lp','inout');else toast('Rincian ada di LP Menu')}},true);
MM_PAGES.lp=sub=>sub==='observasi'?pageObs():pageInOut();
