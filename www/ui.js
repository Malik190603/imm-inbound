// ======================= KOMPONEN BERSAMA (desain v1.4) =======================
// Semua fungsi mengembalikan string HTML. Angka dan teks yang masuk sudah harus aman (pakai esc() untuk data dari sheet).
I.up='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 16V4M5 9l5-5 5 5"/></svg>';
I.eq='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 8h10M5 12h10"/></svg>';

// angka bulat yang diringkas bila terlalu panjang untuk kotak kecil
const fC=v=>IMMUi.compact(v)||f0(v);
// delta: hasil IMMUi.deltaInfo + keterangan pembanding ("rata-rata 7 hari")
function leadDelta(info,against){
  if(!info)return '';
  if(info.dir==='same')return `<span class="lead-d same">${I.eq}Setara ${against}</span>`;
  return `<span class="lead-d ${info.dir}">${I.up}${info.dir==='up'?'Naik':'Turun'} ${info.pct}% dari ${against}</span>`;
}
// Kartu jawaban. o = {tone, headline, value, unit, delta, body, stats:[{l,v,u,dot}], foot, empty, i}
function lead(o){
  const stats=(o.stats||[]).filter(Boolean);
  return `<section class="lead${o.empty?' lead-empty':''}" data-tone="${o.tone||'mark'}" style="--i:${o.i==null?1:o.i}">
    <p class="lead-h">${o.headline}</p>
    ${o.value!=null?`<div class="lead-main"><div class="lead-v">${o.value}${o.unit?`<span class="lead-u">${o.unit}</span>`:''}</div>${o.delta||''}</div>`:''}
    ${o.body||''}
    ${stats.length?`<div class="lead-stats n${stats.length}">${stats.map(s=>`<div><span>${s.dot?`<i class="dot" style="background:${s.dot}"></i>`:''}${s.l}</span><b>${s.v}${s.u?`<small>${s.u}</small>`:''}</b></div>`).join('')}</div>`:''}
    ${o.foot||''}
  </section>`;
}
// Strip minggu. days=[{d:'YYYY-MM-DD', v:number}], selected = tanggal terpilih atau ''
function weekStrip(days,selected,fmt){
  const max=Math.max(1e-9,...days.map(x=>x.v||0));fmt=fmt||f0;
  return `<div class="ws" role="group" aria-label="CBM per hari, ketuk untuk pindah tanggal">${days.map((x,i)=>{const dd=pd(x.d);const today=x.d===TODAY;
    return `<button class="ws-d press${today?' today':''}" data-day="${x.d}" aria-pressed="${x.d===selected}" aria-label="${dlong(x.d)}: ${fmt(x.v||0)} CBM${today?' (hari ini)':''}">
      <span class="ws-n">${x.v>0?(IMMUi.compact(x.v)||fmt(x.v)):'–'}</span><span class="ws-bar"><i style="height:${Math.max(4,(x.v||0)/max*100)}%;animation-delay:${i*45}ms"></i></span><span class="ws-l">${HARI[dd.getDay()]} ${dd.getDate()}</span></button>`}).join('')}</div>`;
}
// Perlu perhatian. items=[{n, u, label, sub, tone:'w'|'c', attr}] — attr = atribut data-* supaya bisa diketuk
function attention(items,i){
  items=(items||[]).filter(Boolean).slice(0,3);
  if(!items.length)return `<div class="attn calm" style="--i:${i==null?2:i}">${I.ok}<span>Tidak ada yang perlu ditindak</span></div>`;
  return `<section class="attn" style="--i:${i==null?2:i}" aria-label="Perlu perhatian">${items.map(x=>{const inner=`<span class="attn-n">${x.n}${x.u?`<small>${x.u}</small>`:''}</span><span class="attn-t">${x.label}${x.sub?`<span>${x.sub}</span>`:''}</span>${x.attr?I.chev:'<span></span>'}`;
    return x.attr?`<button class="attn-i ${x.tone||'w'} press" ${x.attr}>${inner}</button>`:`<div class="attn-i ${x.tone||'w'}">${inner}</div>`}).join('')}</section>`;
}
const zeroLine=text=>`<p class="zero-line">${text}</p>`;
const glossBtn=keys=>`<button class="gloss press" data-gloss="${keys.join(',')}" aria-label="Arti istilah di bagian ini">${I.info}</button>`;
// Judul bagian. o = {icon, title, sub, hint, gloss:[kunci], right, cls}
function secHead(o){
  return `<div class="ch ${o.cls||''}">${o.icon?`<span class="hic">${o.icon}</span>`:''}<div class="ch-t"><div class="ch-r"><h2>${o.title}</h2>${o.hint?`<span class="hint">${o.hint}</span>`:''}</div>${o.sub?`<p class="ch-s">${o.sub}</p>`:''}</div>${o.gloss?glossBtn(o.gloss):''}${o.right||''}</div>`;
}
function openGloss(keys){
  const all=!keys||!keys.length;const ks=(all?Object.keys(IMMUi.GLOSSARY):keys).filter(k=>IMMUi.GLOSSARY[k]);
  sheet(sHead('Kamus istilah',all?'Arti istilah yang dipakai di aplikasi ini':'Arti istilah di bagian ini','',false),
    `<dl class="gloss-list">${ks.map(k=>`<div><dt>${esc(IMMUi.GLOSSARY[k].t)}</dt><dd>${esc(IMMUi.GLOSSARY[k].d)}</dd></div>`).join('')}</dl>${all?'':`<button class="btn ghost block press" data-gloss="">Lihat semua istilah</button>`}`);
}
// Baris bernilai nol diringkas: kembalikan {rows, zero} — zero = HTML satu baris atau ''
function withZeros(items,value,label){
  const r=IMMUi.splitZeros(items,value);
  return {rows:r.shown,zero:r.zeros.length&&r.shown.length?zeroLine(label(r.zeros)):''};
}
