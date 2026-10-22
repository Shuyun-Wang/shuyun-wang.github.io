const CLIPS=[

 {id:'tides_longhair_1228_1500',title:'Game CG',w:3840,h:2160,fps:60,frames:273,credit:'Tides of Annihilation reveal trailer',nv:'05_game_cg_tides_3840x2160'},
 {id:'7147374_cut103_297',title:'Six friends',w:3840,h:2160,fps:30,frames:195,credit:'Pexels',nv:'02_six_friends_3840x2160'},
 {id:'331079_medium_revrun',title:'AI-generated',w:1440,h:2144,fps:25,frames:127,credit:'Pixabay',nv:'03_ai_generated_1440x2144'},
 {id:'pexels_4065468',title:'Moving camera',w:3840,h:2160,fps:29.97,frames:425,credit:'Pavel Danilyuk / Pexels',nv:'04_moving_camera_3840x2160'},
 {id:'14629559_2560_1440_30fps',title:'Long hair',w:2560,h:1440,fps:29.97,frames:370,credit:'Stock footage',nv:'01_long_hair_2560x1440'},
 {id:'mk452_break',title:'Breakdancing',w:1920,h:1080,fps:23.976,frames:155,credit:'Mixkit',nv:'07_breakdancing_1920x1080'},
 {id:'mk231_rooftop',title:'Rooftop at dusk',w:3840,h:2160,fps:23.976,frames:144,credit:'Mixkit',nv:'06_rooftop_dusk_3840x2160'}
];
const $=s=>document.querySelector(s);
const VN=['Input','Green screen','Alpha'];

/* ---------- native-resolution player: input video underneath, green screen (or alpha) on top, kept frame-synced to the input;
   the Input | Matte wipe clips the top video ---------- */
const gs={m:'cmp',split:0.5}; let cur=CLIPS[0];
/* whole-file loader: a clip starts only once its input and matte are fully downloaded, so a slow connection sees a progress ring
   on the first-frame poster instead of a stuttering video; loops and seeks then never touch the network. A fetch that fails
   (e.g. opened from file://) falls back to the plain URL, which streams as before. At most 6 finished files stay in memory. */
const BL=(()=>{ const M=new Map();
  function get(u){ let e=M.get(u); if(e){ M.delete(u); M.set(u,e); return e; }
    e={got:0,total:0,done:false,obj:'',ctl:new AbortController(),cbs:new Set()};
    e.p=(async()=>{ try{ const r=await fetch(u,{signal:e.ctl.signal}); if(!r.ok||!r.body) throw new Error(r.status);
        e.total=+r.headers.get('content-length')||0; const rd=r.body.getReader(), parts=[];
        for(;;){ const {done,value}=await rd.read(); if(done) break; parts.push(value); e.got+=value.length; e.cbs.forEach(f=>f()); }
        e.obj=URL.createObjectURL(new Blob(parts,{type:'video/mp4'})); e.done=true; trim(); return e.obj; }
      catch(err){ if(e.ctl.signal.aborted) throw err; M.delete(u); return u; } })();
    e.p.catch(()=>{}); M.set(u,e); return e; }
  function abortExcept(keep){ for(const [u,e] of [...M]) if(!e.done&&!keep.includes(u)){ e.ctl.abort(); M.delete(u); } }
  function trim(){ const used=new Set([...document.querySelectorAll('#g video')].map(v=>v.src)); let n=[...M.values()].filter(e=>e.done).length;
    for(const [u,e] of [...M]){ if(n<=6) break; if(e.done&&!used.has(e.obj)){ URL.revokeObjectURL(e.obj); M.delete(u); n--; } } }
  return {get,abortExcept}; })();
const LD=(()=>{ const el=$('#ld'), pg=el.querySelector('.pg'), lt=el.querySelector('.lt'), lm=el.querySelector('.lm'), C=106.8, mb=x=>(x/1048576).toFixed(1);
  return { show(label,es){ const got=es.reduce((a,e)=>a+e.got,0), tot=es.reduce((a,e)=>a+e.total,0); el.hidden=false; el.classList.remove('spin');
      lt.textContent=label; lm.textContent=tot?`${mb(got)} / ${mb(tot)} MB`:`${mb(got)} MB`; pg.style.strokeDashoffset=tot?C*(1-got/tot):C*.75; },
    spin(label){ el.hidden=false; el.classList.add('spin'); pg.style.strokeDashoffset=''; lt.textContent=label; lm.textContent=''; },
    hide(){ el.hidden=true; } }; })();
const U=(c,k)=>`static/videos/results/${c.nv}_${k}.mp4`;
const G=(()=>{ const root=$('#g'), vi=root.querySelector('.vi'), vg=root.querySelector('.vg'), va=root.querySelector('.va'), line=root.querySelector('.cmpline');
  let tok=0, gen=0, ready=false, stalled=false;
  const top=()=>gs.m==='2'?va:vg, live=()=>gs.m==='0'?[]:[top()];
  const frame=v=>v.readyState>=2?Promise.resolve():new Promise(r=>{ v.addEventListener('loadeddata',r,{once:true}); v.addEventListener('error',r,{once:true}); });
  function sync(){ const t=vi.currentTime, f=1/(cur.fps||30);
    for(const s of live()){ if(!s.src) continue; const d=s.currentTime-t;
      if(Math.abs(d)>1.5*f||(vi.paused&&Math.abs(d)>0.3*f)) s.currentTime=t;
      else s.playbackRate=d>0.3*f?0.96:(d<-0.3*f?1.04:1);
      if(!vi.paused&&s.paused) s.play().catch(()=>{}); if(vi.paused&&!s.paused) s.pause(); }
    for(const s of [vg,va]) if(!live().includes(s)&&!s.paused) s.pause(); }
  function draw(){ const aok=!!va.dataset.ok;
    vg.style.visibility=(gs.m==='cmp'||gs.m==='1')?'visible':'hidden'; va.style.visibility=gs.m==='2'&&aok?'visible':'hidden';
    vg.style.clipPath=gs.m==='cmp'?`inset(0 0 0 ${gs.split*100}%)`:'none'; line.style.left=(gs.split*100)+'%'; line.hidden=gs.m!=='cmp';
    if(gs.m==='2'&&!aok&&ready) alpha(); else if(ready&&!stalled) LD.hide();
    sync(); }
  function arm(){ const g=++gen; if('requestVideoFrameCallback' in HTMLVideoElement.prototype){ const L=()=>{ if(g!==gen) return; sync(); vi.requestVideoFrameCallback(L); }; vi.requestVideoFrameCallback(L); } }
  if(!('requestVideoFrameCallback' in HTMLVideoElement.prototype)) setInterval(sync,100);
  ['play','pause','seeked','loadeddata'].forEach(e=>vi.addEventListener(e,sync));
  // fallback for streamed files: if the matte stalls, hold the input too instead of seeking the matte over and over
  const later=f=>setTimeout(f,300);
  [vg,va].forEach(s=>{ s.addEventListener('waiting',()=>later(()=>{ if(ready&&live().includes(s)&&s.readyState<3&&!vi.paused){ stalled=true; vi.pause(); LD.spin('Buffering'); } }));
    s.addEventListener('canplay',()=>{ if(stalled){ stalled=false; LD.hide(); vi.play().catch(()=>{}); } }); });
  vi.addEventListener('waiting',()=>later(()=>{ if(ready&&vi.readyState<3&&!vi.paused) LD.spin('Buffering'); }));
  vi.addEventListener('playing',()=>{ if(ready&&!stalled) LD.hide(); });
  const sp=e=>{ const r=vi.getBoundingClientRect(); gs.split=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)); draw(); };
  root.addEventListener('pointerdown',e=>{ if(gs.m!=='cmp'){ vi.paused?vi.play().catch(()=>{}):vi.pause(); return; } sp(e); root.setPointerCapture(e.pointerId); });
  root.addEventListener('pointermove',e=>{ if(gs.m==='cmp'&&e.buttons) sp(e); });
  function poster(c){ vi.poster=`static/images/posters/${c.id}_input.jpg`; vg.poster=`static/images/posters/${c.id}_green.jpg`; }
  async function load(c){ const my=++tok; ready=false; stalled=false;
    root.parentElement.style.setProperty('--nw',(c.w/(window.devicePixelRatio||1))+'px');
    BL.abortExcept([U(c,'input'),U(c,'green')]);
    for(const v of [vi,vg,va]){ v.pause(); v.removeAttribute('src'); v.load(); }
    poster(c); va.dataset.src=U(c,'alpha'); delete va.dataset.ok; delete va.dataset.busy;
    const es=[BL.get(U(c,'input')),BL.get(U(c,'green'))], lab=`Loading ${c.w}×${c.h} clip`, prog=()=>{ if(my===tok&&!ready) LD.show(lab,es); };
    es.forEach(e=>e.cbs.add(prog)); prog(); draw();
    let s; try{ s=await Promise.all(es.map(e=>e.p)); }catch(_){ return; } finally{ es.forEach(e=>e.cbs.delete(prog)); }
    if(my!==tok) return;
    vi.src=s[0]; vg.src=s[1]; await Promise.all([frame(vi),frame(vg)]); if(my!==tok) return;
    vi.currentTime=0; vg.currentTime=0; ready=true; LD.hide(); arm(); draw(); vi.play().catch(()=>{});
    prefetch(CLIPS[(CLIPS.indexOf(c)+1)%CLIPS.length]); }
  async function alpha(){ if(va.dataset.busy) return; va.dataset.busy='1'; const my=tok, e=BL.get(va.dataset.src);
    const prog=()=>{ if(my===tok&&gs.m==='2'&&!va.dataset.ok) LD.show('Loading alpha matte',[e]); }; e.cbs.add(prog); prog();
    let s; try{ s=await e.p; }catch(_){ return; } finally{ e.cbs.delete(prog); }
    if(my!==tok) return; va.src=s; await frame(va); if(my!==tok) return; va.currentTime=vi.currentTime; va.dataset.ok='1'; draw(); }
  function prefetch(c){ if(ready&&c) { BL.get(U(c,'input')); BL.get(U(c,'green')); } }
  return {v:vi,draw,load,poster,prefetch}; })();
$('#zoom').onclick=()=>{ const b=$('#zoom'), on=b.getAttribute('aria-pressed')!=='true', box=$('#g').parentElement; b.setAttribute('aria-pressed',on); box.classList.toggle('z',on);
  box.style.setProperty('--nw',(cur.w/(window.devicePixelRatio||1))+'px'); if(on) requestAnimationFrame(()=>{ box.scrollLeft=(box.scrollWidth-box.clientWidth)/2; box.scrollTop=(box.scrollHeight-box.clientHeight)*0.25; }); };
$('#pills').innerHTML=CLIPS.map((c,i)=>`<button type="button" class="pill" data-i="${i}" aria-current="${i===0}" aria-label="${c.title}, ${c.w} by ${c.h}"><img alt="" src="static/images/thumbs/${c.id}_sq.jpg"><span><small>${c.w}×${c.h}</small></span></button>`).join('');
function labels(){ const c=gs.m==='cmp'; $('#g .tag.l').textContent=c?'Input':VN[+gs.m]; $('#g .tag.r').textContent='Green screen'; $('#g .tag.r').hidden=!c;
  $('#vs').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===gs.m)); $('#g').classList.toggle('cmp',c); G.draw(); }
let started=false;
function selectClip(i){ cur=CLIPS[i]; $('#gm').textContent=`${cur.w}×${cur.h} · ${cur.fps>=50?60:cur.fps} fps`;
  document.querySelectorAll('.pill').forEach(b=>b.setAttribute('aria-current',+b.dataset.i===i)); }
function load(i){ selectClip(i); started=true; G.load(cur); }
$('#pills').addEventListener('click',e=>{ const b=e.target.closest('.pill'); if(b) load(+b.dataset.i); });
$('#pills').addEventListener('pointerover',e=>{ const b=e.target.closest('.pill'); if(b) G.prefetch(CLIPS[+b.dataset.i]); });
$('#vs').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; gs.m=b.dataset.m; labels(); });
labels(); selectClip(0); G.poster(cur);
// start downloading only when the player is near the viewport, so the speed race at the top gets the bandwidth first
if('IntersectionObserver' in window){ const io=new IntersectionObserver(es=>{ if(es.some(x=>x.isIntersecting)){ io.disconnect(); if(!started) load(CLIPS.indexOf(cur)); } },{rootMargin:'600px 0px'}); io.observe($('#g')); } else load(0);

/* ---------- gate widget ---------- */
// sequential ramp for attention (magma-like stops) on the paper figure's log10 range; alpha grows with value
const STOPS=[[0,[60,20,110]],[.3,[150,40,150]],[.6,[240,85,95]],[.82,[255,165,80]],[1,[255,245,170]]];
function ramp(v){ for(let i=1;i<STOPS.length;i++){ if(v<=STOPS[i][0]){ const [a,ca]=STOPS[i-1],[b,cb]=STOPS[i],u=(v-a)/(b-a); return ca.map((x,k)=>Math.round(x+(cb[k]-x)*u)); } } return STOPS[STOPS.length-1][1]; }
$('#rampbar').style.background=`linear-gradient(90deg,${STOPS.map(([p,c])=>`rgb(${c}) ${p*100}%`).join(',')})`;
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const hex=h=>{ h=h.replace('#',''); return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)); };
const GW={showGate:true,prune:true,sel:-1};
let D=null, ATT=null, qimg=null, mimgs=[], keepCv=[], lookup=null;
function img(src){ return new Promise((ok,no)=>{ const im=new Image(); im.onload=()=>ok(im); im.onerror=no; im.src=src; }); }
function bits(b64,n){ const s=atob(b64), out=new Uint8Array(n); for(let i=0;i<n;i++) out[i]=(s.charCodeAt(i>>3)>>(7-(i&7)))&1; return out; }
function buildKeep(){ // pruned cells darkened, kept cells clear
  const [Hf,Wf]=D.fine, pg=[6,8,7]; keepCv=D.keep.map(b=>{ const k=bits(b,Hf*Wf), c=document.createElement('canvas'); c.width=Wf; c.height=Hf; const x=c.getContext('2d'), id=x.createImageData(Wf,Hf);
    for(let i=0;i<k.length;i++){ const o=i*4; id.data[o]=pg[0]; id.data[o+1]=pg[1]; id.data[o+2]=pg[2]; id.data[o+3]=k[i]?0:190; } x.putImageData(id,0,0); return c; }); }
// grid cells in canvas pixels: the 16 px feature grid reaches slightly past the bottom edge of 1080p (68 rows = 1088 px)
const cellW=c=>c.width*D.x_cover/D.grid[1], cellH=c=>c.height*D.y_cover/D.grid[0];
function drawQuery(){
  const c=$('#qc'), x=c.getContext('2d'), Wc=D.grid[1], sx=cellW(c), sy=cellH(c); x.drawImage(qimg,0,0,c.width,c.height);
  if(GW.showGate){ const o=hex(css('--ours')); x.fillStyle=`rgba(${o},0.58)`; for(let i=0;i<D.gate.length;i++) if(D.gate[i]>D.thr*255) x.fillRect((i%Wc)*sx,Math.floor(i/Wc)*sy,sx+.5,sy+.5); }
  for(const [r,cc,g] of D.queries) if(!g){ x.beginPath(); x.arc((cc+.5)*sx,(r+.5)*sy,2.2,0,7); x.fillStyle='rgba(255,255,255,.5)'; x.fill(); }
  if(GW.sel>=0){ const [r,cc]=D.queries[GW.sel], X=(cc+.5)*sx, Y=(r+.5)*sy; x.lineWidth=6; x.strokeStyle='rgba(0,0,0,.55)'; x.beginPath(); x.arc(X,Y,17,0,7); x.stroke(); x.lineWidth=3; x.strokeStyle='#fff'; x.beginPath(); x.arc(X,Y,17,0,7); x.stroke(); }
}
function drawMems(){
  const [T,ah,aw]=D.attn_grid, off=document.createElement('canvas'); off.width=aw; off.height=ah; const ox=off.getContext('2d');
  const q=GW.sel, gated=q>=0&&D.queries[q][2], showPrune=GW.prune&&(gated||q<0);
  D.mem.forEach((n,t)=>{ const c=document.getElementById('m'+t), x=c.getContext('2d');
    // with a query picked, the frame goes grey and dim so the attention colours carry the view
    if(q>=0){ x.filter='grayscale(1) brightness(0.62)'; x.drawImage(mimgs[t],0,0,c.width,c.height); x.filter='none'; if(!('filter' in x)){ x.fillStyle='rgba(8,10,9,.45)'; x.fillRect(0,0,c.width,c.height); } }
    else x.drawImage(mimgs[t],0,0,c.width,c.height);
    if(q>=0){ const id=ox.createImageData(aw,ah), base=(q*T+t)*ah*aw; for(let i=0;i<ah*aw;i++){ const v=ATT[base+i]/255, col=ramp(v), o=i*4; id.data[o]=col[0]; id.data[o+1]=col[1]; id.data[o+2]=col[2]; id.data[o+3]=v>0?Math.round(120+135*v):0; }
      ox.putImageData(id,0,0); x.imageSmoothingEnabled=true; x.drawImage(off,0,0,c.width*D.x_cover,c.height*D.y_cover); }
    if(showPrune){ x.imageSmoothingEnabled=false; x.drawImage(keepCv[t],0,0,c.width*D.x_cover,c.height*D.y_cover); }
    document.getElementById('ml'+t).textContent=`Memory #${n}${t===0?' (first)':''}${showPrune?` · ${D.stats.kv_kept_per_frame_pct[t]}% kept`:''}`; });
}
function pick(e){ const c=$('#qc'), rc=c.getBoundingClientRect(), [Hc,Wc]=D.grid;
  const fc=(e.clientX-rc.left)/rc.width*Wc/D.x_cover-.5, fr=(e.clientY-rc.top)/rc.height*Hc/D.y_cover-.5;
  const exact=lookup.get(Math.round(fr)*Wc+Math.round(fc)); if(exact!==undefined&&D.queries[exact][2]){ GW.sel=exact; } else { let best=-1,bd=1e9; D.queries.forEach(([r,cc,g],i)=>{ const d=(r-fr)**2+(cc-fc)**2-(g?1:0); if(d<bd){bd=d;best=i;} }); GW.sel=best; }
  drawQuery(); drawMems(); }
(async()=>{ try{
  await new Promise((ok,no)=>{ const e=document.createElement('script'); e.src='static/js/gate_data.js'; e.onload=ok; e.onerror=no; document.head.append(e); }); const dj=window.GATE_DATA, txt=window.GATE_ATTN; if(!dj||!txt) throw new Error('gate data missing'); D=dj;
  { const s=atob(txt.trim()); ATT=new Uint8Array(s.length); for(let i=0;i<s.length;i++) ATT[i]=s.charCodeAt(i); }
  [qimg,...mimgs]=await Promise.all(['static/images/gate/query.jpg',...D.mem.map(n=>`static/images/gate/mem_${n}.jpg`)].map(img));
  $('#qtag').textContent=`Query frame #${D.query_frame} · ${D.image[1]}×${D.image[0]} · CRGNN`;
  $('#vis').insertAdjacentHTML('beforeend',D.mem.map((n,t)=>`<div class="mem"><canvas id="m${t}" width="640" height="360"></canvas><span id="ml${t}"></span></div>`).join(''));
  lookup=new Map(D.queries.map(([r,c],i)=>[r*D.grid[1]+c,i]));
  const S=D.stats; $('#nums').innerHTML=`<div><b>${S.gated_pct.toFixed(1)}%</b><span>of queries pass the uncertainty gate and are refined</span></div><div><b>${S.kv_kept_pct.toFixed(0)}%</b><span>of the memory is kept for the refined read</span></div><div><b>${(100*(1-S.gated_pct/100*S.kv_kept_pct/100)).toFixed(1)}%</b><span>of full-resolution attention is skipped: 1 − ${S.gated_pct.toFixed(1)}% × ${S.kv_kept_pct.toFixed(0)}%</span></div>`;
  // default: the hair query of the paper figure (row 12, col 22), else the most uncertain gated query
  let best=D.queries.findIndex(([r,c,g])=>r===12&&c===22&&g), bp=-1;
  if(best<0) D.queries.forEach(([r,c,g],i)=>{ const p=D.gate[r*D.grid[1]+c]; if(g&&p>bp){bp=p;best=i;} }); GW.sel=best;
  buildKeep(); drawQuery(); drawMems();
  $('#qbox').addEventListener('click',pick);
  const redraw=()=>{ buildKeep(); drawQuery(); drawMems(); };
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',redraw);
  new MutationObserver(redraw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 }catch(err){ $('#qtag').textContent='The captured attention could not be loaded.'; } })();
$('#gseg').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b||!D) return; GW.showGate=b.dataset.g==='1'; $('#gseg').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b)); drawQuery(); });
$('#pseg').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b||!D) return; GW.prune=b.dataset.p==='1'; $('#pseg').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b)); drawMems(); });

/* ---------- speed charts: grouped bars, FPS (higher is better), value on every bar, a missing value is drawn as n/a ---------- */
const SPEED={"cats": ["1024×1024", "1920×1080", "2560×1440", "3840×2160"], "ma2": [29.5, 13.6, 5.6, 1.1], "ma2_note": [null, null, null, "estimated; out of memory at 80 GB"], "ours": [41.3, 26.6, 16.5, 8.1], "ours_c": [47.3, 37.6, 25.1, 13.6], "speedup": ["1.40", "1.96", "2.95", "7.36"], "a800": {"fps_ma2": [29.5, 13.6, 5.6, 1.1], "fps_ours": [41.3, 26.6, 16.5, 8.1], "fps_ours_c": [47.3, 37.6, 25.1, 13.6], "fps_x": ["1.40", "1.96", "2.95", "7.36"], "mem_ma2": [1.60, 5.47, 16.20, 79.69], "mem_ours": [0.92, 1.66, 3.04, 6.08], "mem_ours_c": [0.61, 1.07, 2.02, 3.89], "mem_x": ["1.74", "3.30", "5.33", "13.11"]}, "gpu": {"rtx": {"eager": [33.6, 19.81, 11.99, 5.69], "comp": [45.97, 29.37, 18.27, 9.0], "mem_eager": [0.87, 1.61, 2.98, 6.09], "mem_comp": [0.5, 0.87, 1.89, 3.16]}, "h200": {"eager": [71.57, 45.22, 29.22, 14.38], "comp": [102.1, 73.07, 52.89, 28.62], "mem_eager": [0.89, 1.63, 3.0, 6.12], "mem_comp": [0.52, 1.05, 1.9, 3.1]}}};
function bars(svg, cats, series, notes, opt={}){
  const X0=40,X1=552,Y0=opt.y0||256,Y1=26, all=series.flatMap(s=>s.vals).filter(v=>v!=null), max=Math.max(...all)*1.14;
  const ys=v=>Y0-(Y0-Y1)*v/max, n=cats.length, gw=(X1-X0)/n, bw=Math.min(46,(gw*0.74)/series.length), gap=2;
  const raw=max/4, b10=Math.pow(10,Math.floor(Math.log10(raw))), stp=[1,2,2.5,5,10].map(m=>m*b10).find(x=>x>=raw);
  let h=`<defs><filter id="${svg.slice(1)}glow" x="-60%" y="-20%" width="220%" height="140%"><feGaussianBlur stdDeviation="4"/></filter></defs>`;
  for(let t=0;t<=max;t+=stp){ const near=opt.ref!=null&&Math.abs(ys(t)-ys(opt.ref))<18;   // keep the reference label readable
    h+=`<line x1="${X0}" x2="${X1}" y1="${ys(t)}" y2="${ys(t)}" stroke="var(--rule)"/>`+(near?'':`<text x="${X0-7}" y="${ys(t)+4}" text-anchor="end">${+t.toFixed(1)}</text>`); }
  const fmt=opt.fmt||(v=>v.toFixed(1)), unit=opt.unit||' FPS';
  h+=`<text x="${X0}" y="${Y1-10}">${opt.ylab||'FPS'}</text>`;
  cats.forEach((c,i)=>{ const cx=X0+gw*(i+.5), w0=series.length*bw+(series.length-1)*gap, x0=cx-w0/2;
    series.forEach((s,k)=>{ const v=s.vals[i], x=x0+k*(bw+gap);
      if(v==null){ h+=`<rect x="${x+.75}" y="${Y0-22}" width="${bw-1.5}" height="21" rx="4" fill="none" stroke="var(--faint)" stroke-dasharray="3 3"/><text x="${x+bw/2}" y="${Y0-28}" text-anchor="middle">n/a</text>`; return; }
      const y=ys(v), r=Math.min(4,(Y0-y)/2);
      const mk=(opt.mark||[]).some(([a,b])=>a===k&&b===i);
      if(mk){ const bx=x-14, bwid=bw+28;
        h+=`<rect x="${bx}" y="${Y1-4}" width="${bwid}" height="${Y0-Y1+4}" rx="10" fill="var(--ours-soft)"/>`;
        h+=`<path d="M${x},${Y0} V${y+r} q0,-${r} ${r},-${r} h${bw-2*r} q${r},0 ${r},${r} V${Y0} Z" fill="none" stroke="var(--ours)" stroke-width="7" opacity=".35" filter="url(#${svg.slice(1)}glow)"/>`; }
      h+=`<path d="M${x},${Y0} V${y+r} q0,-${r} ${r},-${r} h${bw-2*r} q${r},0 ${r},${r} V${Y0} Z" fill="${s.color}"${mk?' stroke="var(--ours)" stroke-width="2.5"':''}><title>${s.name} · ${c}: ${fmt(v)}${unit}${s.mem?` · ${s.mem[i].toFixed(2)} GB`:''}${s.note?.[i]?' ('+s.note[i]+')':''}</title></path>`;
      if(mk){ const tw=62, ty=Math.max(Y1-2, y-40);
        h+=`<rect x="${x+bw/2-tw/2}" y="${ty}" width="${tw}" height="17" rx="8.5" fill="var(--ours)"/><text x="${x+bw/2}" y="${ty+12.5}" text-anchor="middle" style="font:700 10.5px var(--sans);fill:#fff">≥ 25 FPS</text>`; }
      h+=`<text class="v" x="${x+bw/2}" y="${y-6}" text-anchor="middle">${s.note?.[i]?'~':''}${fmt(v)}</text>`; });
    h+=`<text class="cat" x="${cx}" y="${Y0+19}" text-anchor="middle">${c}</text>`;
    if(notes&&notes[i]) h+=`<text class="up" x="${cx}" y="${Y0+36}" text-anchor="middle">${notes[i]}</text>`; });
  if(opt.ref){ const y=ys(opt.ref); h+=`<line x1="${X0}" x2="${X1}" y1="${y}" y2="${y}" stroke="${opt.refColor||'var(--c-ec)'}" stroke-width="1.2" stroke-dasharray="5 4" opacity=".7"/><text class="ref"${opt.refColor?` style="fill:${opt.refColor}"`:''} x="${X0-7}" y="${y+4}" text-anchor="end">${opt.refLabel}</text>`; }
  h+=`<line x1="${X0}" x2="${X1}" y1="${Y0}" y2="${Y0}" stroke="var(--muted)"/>`;
  document.querySelector(svg).innerHTML=h;
}
{ const S=SPEED;
  // A800, both without compile (paper Table 2); 4K MatAnyone 2 is extrapolated because it runs out of memory
  const est=[null,null,null,'MatAnyone 2 estimated at 4K'];
  const A=SPEED.a800;
  bars('#c1', S.cats, [{name:'MatAnyone 2',color:'var(--c-ma2)',vals:A.fps_ma2,note:est},{name:'MatAnyone-E',color:'var(--c-e)',vals:A.fps_ours},{name:'MatAnyone-E (C.)',color:'var(--c-ec)',vals:A.fps_ours_c}],
       A.fps_x.map(x=>`×${x} faster`), {y0:186});
  bars('#c2', S.cats, [{name:'MatAnyone 2',color:'var(--c-ma2)',vals:A.mem_ma2,note:est},{name:'MatAnyone-E',color:'var(--c-e)',vals:A.mem_ours},{name:'MatAnyone-E (C.)',color:'var(--c-ec)',vals:A.mem_ours_c}],
       A.mem_x.map(x=>`×${x} less memory`), {y0:186, ylab:'GB', unit:' GB', fmt:v=>v.toFixed(2)});
  const G=SPEED.gpu;
  bars('#c3090', SPEED.cats, [{name:'MatAnyone-E (C.)',color:'var(--c-ec)',vals:G.rtx.comp,mem:G.rtx.mem_comp}], null, {y0:170, ref:25, refLabel:'25', mark:[[0,1]]});
  bars('#ch200', SPEED.cats, [{name:'MatAnyone-E (C.)',color:'var(--c-ec)',vals:G.h200.comp,mem:G.h200.mem_comp}], null, {y0:170, ref:25, refLabel:'25', mark:[[0,3]]});
}

{ const dd=document.getElementById('dd'), b=dd.querySelector('.ddbtn');
  b.addEventListener('click',e=>{ e.stopPropagation(); const o=dd.classList.toggle('open'); b.setAttribute('aria-expanded',o); });
  document.addEventListener('click',e=>{ if(!dd.contains(e.target)){ dd.classList.remove('open'); b.setAttribute('aria-expanded','false'); } });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ dd.classList.remove('open'); b.setAttribute('aria-expanded','false'); } }); }
