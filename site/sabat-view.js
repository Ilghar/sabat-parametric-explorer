/* SÁBÁT viewer, Revision 9 (4 Nov 2026: covers are the tension membrane from stage1/cover_membrane.py, smooth normals; dark grey peak connector; walnut sticks; elevation fitted to the drawing). Revision 8 (4 Nov 2026: soft rounded crowns, looser knit, palette colour per connector group, L corners at the entrance). Revision 7: live parameters, entrance toggle, soft tension-surface knit. Palette colours only, no blue. */
(function(){
const $=id=>document.getElementById(id);
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const q=new URLSearchParams(location.search);
let res=null,yaw=+(q.get("yaw")||0.6),pitch=+(q.get("pitch")||0.25);
const st={open:q.get("open")==="1",star:+(q.get("star")||1),cover:q.get("cover")!=="0"};
["dia","peak","leg","stk"].forEach(k=>{if(q.get(k))$(k).value=q.get(k)});
const KNIT=[90,63,82],TARP=[163,160,155],WOOD="#473448"/* walnut: wood material colour of the sticks */,GAMMA=1.15,NU=6,NT=9;
// one colour per connector group, from the studio palette (same as the stage 1 GLBs and renders)
const GRP={hub5:"#473448",hub6:"#775a76",corner:"#775a76",tee:"#856a8e",peak:"#2a272d"/* peak connector material: dark grey (Hāèl) */};
const RIM=()=>"#f9fafb";
const rgb=(c,k)=>`rgb(${c.map(v=>Math.round(Math.min(255,v*k))).join(",")})`;
const sub=(a,b)=>a.map((v,i)=>v-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l)};
// tension surface of one pyramid side: base point B on edge P→Q, height fraction t. Cross-sections shrink as (1−t)^γ, so sides and ridges are concave.
const surf=(C,A,B,t)=>C.map((c,n)=>c+t*(A[n]-c)+(B[n]-c)*Math.pow(1-t,GAMMA));
// rev 9 cover: field F (0 on the base sticks, 1 at the tip) on a barycentric lattice; i weights the 5-way hub corner
const CV=window.SabatCover,CN=CV.N,FF=(i,j)=>CV.f[i][j];
const tipOff=()=>2.5*res.o.stick/20;   // cover tip sits 25 mm over the peak connector node at the built size
function corner0(t){const k=t.v.findIndex(i=>res.kind[i]==="hub5");return k<0?0:k}
function covAt(t,i,j){const k0=corner0(t),V=[0,1,2].map(m=>res.pts[t.v[(k0+m)%3]]),w=[i/CN,j/CN,(CN-i-j)/CN],h=FF(i,j)*(res.peak+tipOff());
  return [0,1,2].map(n=>w[0]*V[0][n]+w[1]*V[1][n]+w[2]*V[2][n]+t.n[n]*h)}
// point on the valley between corner m (index into t.v) and the tip, at fraction 1/2
function valley(t,vi){const k0=corner0(t),m=(vi-k0+3)%3,w=[CN/6,CN/6,CN/6];w[m]=2*CN/3;return covAt(t,w[0],w[1])}
function theme(t){document.documentElement.dataset.theme=t;try{localStorage.setItem("sabat-theme",t)}catch(e){}$("theme").textContent=t==="dark"?"light":"dark";$("theme").setAttribute("aria-pressed",t==="dark");draw();}
$("theme").onclick=()=>theme(document.documentElement.dataset.theme==="dark"?"light":"dark");
const B=SabatGeom.BUILT,mark=(v,b)=>v===b?" · built":"";
function compute(){
  const D=+$("dia").value,pk=+$("peak").value,lg=+$("leg").value,sk=+$("stk").value;
  $("diaO").textContent=`Ø ${D} cm${mark(D,B.D)}`;$("peakO").textContent=`${pk} cm${mark(pk,B.peak)}`;$("legO").textContent=`${lg} cm${mark(lg,B.leg)}`;$("stkO").textContent=`${sk} mm${mark(sk,B.stick)}`;
  $("ent").setAttribute("aria-pressed",st.open);$("ent").textContent=st.open?"Entrance open":"Entrance closed";
  $("pick").style.display=st.open?"flex":"none";$("pick").querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",+b.dataset.s===st.star));
  $("cov").setAttribute("aria-pressed",!st.cover);$("cov").textContent=st.cover?"Covers on":"Covers off";$("covO").textContent=st.cover?"on · built":"off, bare structure";
  $("entO").textContent=st.open?`open, star ${st.star}`:"closed · built";
  res=SabatGeom.build({D,peak:pk,leg:lg,stick:sk,open:st.open,star:st.star});const c=res.counts;
  const f1=v=>v.toFixed(1);
  $("fam").tBodies[0].innerHTML=res.families.map(f=>`<tr><td>${f.type}${f.stick!=null?` <span class="note">(stick ${f1(f.stick)})</span>`:""}</td><td class="n">${f1(f.len)}</td><td class="n">${f.count}</td></tr>`).join("")+`<tr><td><b>Total</b></td><td></td><td class="n"><b>${c.struts+c.pstruts+c.legs}</b></td></tr>`;
  $("len").textContent=`Wood total ${f1(c.wood)} m (frame sticks + pyramid struts + legs). Frame lengths are hub centre to hub centre; sticks are 88 mm shorter (Hubs kit). Frame struts: ${c.struts}. Stick Ø ${sk} mm, pyramid struts Ø ${sk/2} mm.`;
  const k=sk/26.9;
  const sw=(g,sq)=>g?`<span class="sw${sq?" sq":""}" style="background:${GRP[g]}" aria-hidden="true"></span>`:`<span class="sw none" aria-hidden="true"></span>`;
  $("con").tBodies[0].innerHTML=[["5-way hub",c.hub5,"hub5"],["6-way hub",c.hub6,"hub6"],["L-shaped Rohrverbinder, Eckstück durchgehend 20A, 20 mm bores, at the entrance",c.corner,"corner",1],["T-shaped Rohrverbinder, T-Stück kurz 2A (1 pyramid strut)",c.teeShort,"tee"],["T-shaped Rohrverbinder, T-Stück 2A with side outlet (2 pyramid struts)",c.teeSide,"tee"],["Three-arm peak connector, 3D-printed, held under the cover",c.peaks,"peak"],["Knitted pyramid",c.pyramid],["Grey tarp triangle",c.flat],["Entrance (open triangles)",c.entrance],[`Leg (${lg} cm)`,c.legs]].map(([a,b,g,sq])=>`<tr><td>${sw(g,sq)}${a}</td><td class="n">${b}</td></tr>`).join("");
  $("conN").textContent=`Frame: 2V hub kit. Rohrverbinder after the cast clamps 6080Z20 (L) and 6080Z02 (T), scaled to a ${sk} mm stick (corner a ≈ ${f1(40*k)} mm, tee a ≈ ${f1(41*k)} mm). ${st.open?`The ${c.corner} L corners sit at the foot of the entrance, where the ring stick runs through and one frame stick rises.`:"L corners are only needed when the entrance is open."} ${st.open?`Star ${st.star} removed for the entrance: ${c.pyramid} pyramids.`:`All ${c.stars} stars closed: ${c.pyramid} pyramids.`}`;
  $("big").innerHTML=`Ø ${D} × H ${Math.round(c.hubH)} cm`;
  $("hOut").textContent=`Height to the crown hub ${f1(c.hubH)} cm (structure ${f1(res.R)} + legs ${lg}); to the crown peak tip ${f1(c.tipH)} cm. Footprint across the peak tips Ø ${f1(c.tipD)} cm. Built: Ø 352 × 230 cm.`;
  draw();
}
function draw(){if(!res)return;plan();elev();iso();}
// shared mesh: membrane lattice per pyramid with smooth (vertex-averaged) normals, flat tarp triangles
function mesh(){
  const out=[];
  for(const t of res.tris){const v=t.v.map(i=>res.pts[i]);
    if(t.role==="flat"){let n=unit(cross(sub(v[1],v[0]),sub(v[2],v[0])));if(n[0]*v[0][0]+n[1]*v[0][1]+n[2]*(v[0][2]-res.leg)<0)n=n.map(x=>-x);out.push({p:v,col:TARP,n,flat:1});continue}
    if(t.role!=="pyramid")continue;
    const P={},Nn={},key=(i,j)=>i*(CN+1)+j;
    for(let i=0;i<=CN;i++)for(let j=0;j<=CN-i;j++){P[key(i,j)]=covAt(t,i,j);Nn[key(i,j)]=[0,0,0]}
    const F=[];for(let i=0;i<CN;i++)for(let j=0;j<CN-i;j++){F.push([key(i,j),key(i+1,j),key(i,j+1)]);if(i+j<CN-1)F.push([key(i+1,j),key(i+1,j+1),key(i,j+1)])}
    for(const f of F){let n=cross(sub(P[f[1]],P[f[0]]),sub(P[f[2]],P[f[0]]));if(n[0]*t.n[0]+n[1]*t.n[1]+n[2]*t.n[2]<0)n=n.map(x=>-x);f.forEach(k=>{for(let m=0;m<3;m++)Nn[k][m]+=n[m]})}
    for(const f of F){const n=unit([0,1,2].map(m=>Nn[f[0]][m]+Nn[f[1]][m]+Nn[f[2]][m]));out.push({p:f.map(k=>P[k]),col:KNIT,n})}
  }
  return out;
}
const shade=(n,L)=>0.62+0.42*Math.max(0,n[0]*L[0]+n[1]*L[1]+n[2]*L[2]); // gentle Lambert
function poly(d,fill,stroke,w){return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`}
// a pyramid side as a curved 2D path: base P→Q straight, ridges bowed through the real surface at t=½
function sidePath(X,t,P,Q,jP){const A=covAt(t,...(()=>{const k0=corner0(t);return [CN/3,CN/3]})()),mP=valley(t,jP),mQ=valley(t,(jP+1)%3),ctl=(m,E)=>{const a=X(m),e=X(E),z=X(A);return [2*a[0]-(+e[0]+(+z[0]))/2,2*a[1]-(+e[1]+(+z[1]))/2].map(v=>v.toFixed(1))};
  const p=X(P),qq=X(Q),a=X(A),cQ=ctl(mQ,Q),cP=ctl(mP,P);return `M${p}L${qq}Q${cQ} ${a}Q${cP} ${p}Z`}
function plan(){
  const c=res.counts,s=200/(c.tipD/2),C0=240,ink=css("--ink"),X=p=>[(C0+p[0]*s).toFixed(1),(C0-p[1]*s).toFixed(1)];
  let o=`<title id="planT">Plan from above: ${c.stars} pyramid stars${st.open?`, star ${st.star} open as the entrance`:""}</title>`;
  const L=unit([-.4,.5,.75]);
  if(st.cover)for(const t of res.tris.slice().sort((a,b)=>a.c[2]-b.c[2])){const v=t.v.map(i=>res.pts[i]);
    if(t.role==="flat")o+=poly(`M${X(v[0])}L${X(v[1])}L${X(v[2])}Z`,rgb(TARP,.96),ink,.6);
    else if(t.role==="pyramid")v.forEach((P,j)=>{const Q=v[(j+1)%3],n=unit(cross(sub(Q,P),sub(t.apex,P)));o+=poly(sidePath(X,t,P,Q,j),rgb(KNIT,shade(n[2]<0?n.map(x=>-x):n,L)),ink,.6)})}
  o+=`<g stroke="${WOOD}" stroke-width="${Math.max(1,res.o.stick/10*s).toFixed(2)}" stroke-linecap="round">`+res.edges.filter(([a,b])=>!st.cover||res.tris.some(t=>t.role!=="pyramid"&&t.v.includes(a)&&t.v.includes(b))||res.pts[a][2]<=res.leg+1e-6&&res.pts[b][2]<=res.leg+1e-6).map(([a,b])=>`<line x1="${X(res.pts[a])[0]}" y1="${X(res.pts[a])[1]}" x2="${X(res.pts[b])[0]}" y2="${X(res.pts[b])[1]}"/>`).join("")+`</g>`;
  if(!st.cover)o+=`<g stroke="${WOOD}" stroke-width="${Math.max(.8,res.o.stick/20*s).toFixed(2)}" stroke-linecap="round">`+res.pstruts.map(([a,b])=>`<line x1="${X(a)[0]}" y1="${X(a)[1]}" x2="${X(b)[0]}" y2="${X(b)[1]}"/>`).join("")+`</g>`;
  if(!st.cover)res.tris.forEach(t=>{if(t.role!=="pyramid")return;const [x,y]=X(t.apex);o+=`<circle cx="${x}" cy="${y}" r="2.2" fill="${GRP.peak}" stroke="${RIM()}" stroke-width=".6"/>`});
  res.tees.forEach(t=>{const [x,y]=X(t.p);o+=`<circle cx="${x}" cy="${y}" r="1.9" fill="${GRP.tee}" stroke="${ink}" stroke-width=".5"/>`});
  res.pts.forEach((p,i)=>{if(!res.used.has(i)||p[2]<res.leg-1e-6)return;const k=res.kind[i],[x,y]=X(p);
    if(k==="corner")o+=`<rect x="${(+x-3.6).toFixed(1)}" y="${(+y-3.6).toFixed(1)}" width="7.2" height="7.2" fill="${GRP.corner}" stroke="${RIM()}" stroke-width=".8"/>`;
    else o+=`<circle cx="${x}" cy="${y}" r="${k==="hub5"?3.6:2.8}" fill="${GRP[k]}" stroke="${RIM()}" stroke-width=".8"/>`});
  for(let k=1;k<=5;k++){const a=(k-1)*2*Math.PI/5,r=246;o+=`<text x="${(C0+Math.cos(a)*r*.93).toFixed(1)}" y="${(C0-Math.sin(a)*r*.93+4).toFixed(1)}" text-anchor="middle" font-size="12" fill="${css("--muted")}" font-weight="${st.open&&k===st.star?600:300}">${k}</text>`}
  $("plan").innerHTML=o;
}
function elev(){
  const c=res.counts,ink=css("--ink"),mu=css("--muted"),s=Math.min(360/c.tipD,330/c.tipH),gx=240,gy=420,X=p=>[(gx+p[0]*s).toFixed(1),(gy-p[2]*s).toFixed(1)];
  let o=`<title id="elevT">Side elevation: ${Math.round(c.hubH)} cm to the crown hub</title>`;const L=unit([-.4,-.7,.6]);
  const items=[];for(const t of res.tris){const v=t.v.map(i=>res.pts[i]);if(t.role==="flat")items.push({d:t.c[1],h:poly(`M${X(v[0])}L${X(v[1])}L${X(v[2])}Z`,rgb(TARP,.96),ink,.6)});
    else if(t.role==="pyramid")v.forEach((P,j)=>{const Q=v[(j+1)%3];let n=unit(cross(sub(Q,P),sub(t.apex,P)));if(n[0]*(P[0])+n[1]*P[1]+n[2]*(P[2]-res.leg)<0)n=n.map(x=>-x);if(n[1]>0.05)return;items.push({d:(P[1]+Q[1]+t.apex[1])/3,h:poly(sidePath(X,t,P,Q,j),rgb(KNIT,shade(n,L)),ink,.6)})})}
  if(st.cover)items.sort((a,b)=>b.d-a.d).forEach(i=>o+=i.h);
  else{const ln2=(a,b,w)=>`<line x1="${X(a)[0]}" y1="${X(a)[1]}" x2="${X(b)[0]}" y2="${X(b)[1]}" stroke="${WOOD}" stroke-width="${w}" stroke-linecap="round"/>`;
    o+=res.edges.map(([a,b])=>ln2(res.pts[a],res.pts[b],Math.max(1,res.o.stick/10*s).toFixed(2))).join("")+res.pstruts.map(([a,b])=>ln2(a,b,Math.max(.7,res.o.stick/20*s).toFixed(2))).join("")}
  const w=Math.max(1,res.o.stick/10*s).toFixed(2);
  o+=`<g stroke="${WOOD}" stroke-width="${w}" stroke-linecap="round">`+res.legs.filter(([a])=>a[1]<=1e-6).map(([a,b])=>`<line x1="${X(a)[0]}" y1="${X(a)[1]}" x2="${X(b)[0]}" y2="${X(b)[1]}"/>`).join("")+`</g>`;
  const dx=(gx+c.tipD/2*s+14).toFixed(1),ln=(y1,y2,x)=>`<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${mu}" stroke-width=".8" stroke-linecap="round"/>`;
  o+=`<line x1="20" y1="${gy}" x2="460" y2="${gy}" stroke="${ink}" stroke-width="1" stroke-linecap="round"/>`;
  const yH=X([0,0,c.hubH])[1],yT=X([0,0,c.tipH])[1];
  o+=ln(gy,yH,dx)+`<text x="${+dx-4}" y="${(+yH+gy)/2}" font-size="12" fill="${mu}" text-anchor="end">${Math.round(c.hubH)}</text>`;
  o+=`<line x1="${gx-c.tipD/2*s}" y1="${yT}" x2="${dx}" y2="${yT}" stroke="${mu}" stroke-width=".5" stroke-dasharray="2 3" stroke-linecap="round"/><text x="${dx}" y="${+yT-4}" font-size="12" fill="${mu}" text-anchor="end">${Math.round(c.tipH)}</text>`;
  const y0=gy+14;o+=`<line x1="${X([-res.R,0,0])[0]}" y1="${y0}" x2="${X([res.R,0,0])[0]}" y2="${y0}" stroke="${mu}" stroke-width=".8" stroke-linecap="round"/><text x="${gx}" y="${y0+14}" font-size="12" fill="${mu}" text-anchor="middle">Ø ${res.o.D} cm</text>`;
  const sv=$("elev");sv.innerHTML=o;try{const b=sv.getBBox(),p=12;if(b.width>0){sv.setAttribute("viewBox",`${(b.x-p).toFixed(1)} ${(b.y-p).toFixed(1)} ${(b.width+2*p).toFixed(1)} ${(b.height+2*p).toFixed(1)}`);sv.style.aspectRatio=`${b.width+2*p}/${b.height+2*p}`}}catch(e){}
}
function proj(W,H){const c=res.counts,S=W*0.47/Math.max(c.tipD/2,c.tipH*0.62)*(+(q.get("zoom")||1)),zc=c.tipH*0.47-(+(q.get("dz")||0));
  const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
  const f=p=>{const Xx=p[0],Y=p[1],Z=p[2]-zc;const x1=Xx*cy-Y*sy,y1=Xx*sy+Y*cy;const y2=y1*cp-Z*sp,z2=y1*sp+Z*cp;return [W/2+x1*S,H/2-z2*S,y2]};
  f.rot=n=>{const x1=n[0]*cy-n[1]*sy,y1=n[0]*sy+n[1]*cy;return [x1,y1*cp-n[2]*sp,y1*sp+n[2]*cp]};f.S=S;return f}
let M=null,Mkey="";
function iso(){
  const cv=$("iso"),dpr=Math.min(2,window.devicePixelRatio||1),Wc=Math.round((cv.clientWidth||480)*dpr);
  if(cv.width!==Wc){cv.width=cv.height=Wc}
  const x=cv.getContext("2d"),W=cv.width,H=cv.height,pr=proj(W,H),ink=css("--ink");
  x.fillStyle=css("--surface");x.fillRect(0,0,W,H);x.lineJoin="round";x.lineCap="round";
  const key=JSON.stringify(res.o);if(key!==Mkey){M=mesh();Mkey=key}
  const Lv=unit([-.45,-.55,.7]); // light in view space: upper left, from the viewer side
  const fs=[];for(const f of M){const nv=pr.rot(f.n),back=nv[1]>0&&!f.flat,qd=f.p.map(pr);fs.push({q:qd,d:qd.reduce((s,a)=>s+a[2],0)/qd.length,c:rgb(f.col,back?0.55:shade(nv[1]>0?nv.map(v=>-v):nv,Lv))})}
  fs.sort((a,b)=>b.d-a.d);
  const cm=v=>v*pr.S,sk=res.o.stick/10,k=res.o.stick/26.9;
  const seg=(a,b,w,col)=>{const p=pr(a),q2=pr(b);if(p[2]+q2[2]>0)return;x.strokeStyle=col;x.lineWidth=w;x.beginPath();x.moveTo(p[0],p[1]);x.lineTo(q2[0],q2[1]);x.stroke()};
  x.lineWidth=Math.max(1.1,dpr*1.1);
  if(st.cover)for(const f of fs){x.beginPath();f.q.forEach((a,i)=>i?x.lineTo(a[0],a[1]):x.moveTo(a[0],a[1]));x.closePath();x.fillStyle=f.c;x.strokeStyle=f.c;x.fill();x.stroke()}
  const sw=Math.max(1.6*dpr,cm(sk));
  for(const [a,b] of res.legs)seg(a,b,sw,WOOD);
  if(!st.cover)for(const [p,q2] of res.pstruts)seg(p,q2,Math.max(1.1*dpr,cm(sk/2)),WOOD);
  for(const [a,b] of res.edges){if(st.cover&&res.tris.some(t=>t.role==="pyramid"&&t.v.includes(a)&&t.v.includes(b))&&!res.tris.some(t=>t.role!=="pyramid"&&t.v.includes(a)&&t.v.includes(b)))continue;seg(res.pts[a],res.pts[b],sw,WOOD)}
  for(const t of res.tees){if(st.cover)continue;const a=pr(t.p);if(a[2]>0)continue;const h=(41*k/10)/Math.hypot(...t.dir),e1=t.p.map((c,n)=>c-t.dir[n]*h),e2=t.p.map((c,n)=>c+t.dir[n]*h);seg(e1,e2,Math.max(3*dpr,cm((26.9*k+8)/10)),GRP.tee)}
  if(!st.cover)for(const t of res.tris){if(t.role!=="pyramid")continue;const a=pr(t.apex);if(a[2]>0)continue;x.beginPath();x.arc(a[0],a[1],Math.max(2.6*dpr,cm(3)),0,7);x.fillStyle=GRP.peak;x.fill()}
  res.pts.forEach((p,i)=>{const a=pr(p);if(a[2]>0||!res.used.has(i))return;const k=res.kind[i],h5=k==="hub5",rr=Math.max((h5?4:3.4)*dpr,cm(h5?5:4.5));x.beginPath();
    if(k==="corner")x.rect(a[0]-rr,a[1]-rr,2*rr,2*rr);else x.arc(a[0],a[1],rr,0,7);x.fillStyle=GRP[k];x.fill();x.strokeStyle=RIM();x.lineWidth=dpr*1;x.stroke()});
}
let drag=null;const cv=$("iso");
cv.onpointerdown=e=>{drag=[e.clientX,e.clientY];cv.setPointerCapture(e.pointerId)};
cv.onpointermove=e=>{if(!drag)return;yaw+=(e.clientX-drag[0])*.01;pitch=Math.max(-.6,Math.min(1.5,pitch+(e.clientY-drag[1])*.01));drag=[e.clientX,e.clientY];requestAnimationFrame(iso)};
cv.onpointerup=()=>drag=null;
cv.onkeydown=e=>{const m={ArrowLeft:[-.1,0],ArrowRight:[.1,0],ArrowUp:[0,-.08],ArrowDown:[0,.08]}[e.key];if(!m)return;e.preventDefault();yaw+=m[0];pitch=Math.max(-.6,Math.min(1.5,pitch+m[1]));iso()};
let pend=0;const live=()=>{if(!pend)pend=requestAnimationFrame(()=>{pend=0;compute()})};
["dia","peak","leg","stk"].forEach(id=>$(id).addEventListener("input",live));
$("cov").onclick=()=>{st.cover=!st.cover;compute()};
$("ent").onclick=()=>{st.open=!st.open;compute()};
$("pick").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;st.star=+b.dataset.s;compute()});
$("reset").onclick=()=>{$("dia").value=B.D;$("peak").value=B.peak;$("leg").value=B.leg;$("stk").value=B.stick;st.open=false;st.star=1;st.cover=true;compute()};
addEventListener("resize",()=>res&&iso());
let pref=q.get("theme");
try{if(!pref)pref=localStorage.getItem("sabat-theme")}catch(e){}
if(pref!=="light"&&pref!=="dark")pref=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
document.documentElement.dataset.theme=pref;$("theme").textContent=pref==="dark"?"light":"dark";$("theme").setAttribute("aria-pressed",pref==="dark");
document.fonts.ready.then(compute);compute();
})();
