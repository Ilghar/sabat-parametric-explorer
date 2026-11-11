/* SÁBÁT stage 2 UI: connector selector, dimensioned SVG drawing (front, side, top) and a three.js model,
   both rebuilt live from sabat-connectors-geom.js whenever the explorer recomputes. Palette only, no blue. */
import * as THREE from "three";
import {OrbitControls} from "./vendor/three/addons/controls/OrbitControls.js";
const $=id=>document.getElementById(id),q=new URLSearchParams(location.search);
const C=window.SabatConnectors,ORDER=["hub5","hub6","corner","tee","ball","peak"];
let cur=ORDER.includes(q.get("part"))?q.get("part"):"hub5",data=null;
const f1=x=>(Math.round(x*10)/10).toString();
// ---------- state from the explorer controls ----------
function params(){const open=$("ent").getAttribute("aria-pressed")==="true",pb=[...$("pick").querySelectorAll("button")].find(b=>b.getAttribute("aria-pressed")==="true");
  return {D:+$("dia").value,peak:+$("peak").value,leg:+$("leg").value,stick:+$("stk").value,open,star:pb?+pb.dataset.s:1}}
// ---------- projection helpers ----------
const VIEWS={front:p=>[p[0],-p[1]],side:p=>[-p[2],-p[1]],top:p=>[p[0],p[2]]},AX={front:[0,0,1],side:[1,0,0],top:[0,1,0]};
const nrm=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l)},cr=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function ring(c,d,r,n=28){const u=nrm(Math.abs(d[1])<.9?cr(d,[0,1,0]):cr(d,[1,0,0])),w=cr(d,u),o=[];for(let k=0;k<n;k++){const t=2*Math.PI*k/n;o.push(c.map((x,i)=>x+r*(Math.cos(t)*u[i]+Math.sin(t)*w[i])))}return o}
function hull(P){P=P.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const x=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);const lo=[],up=[];
  for(const p of P){while(lo.length>1&&x(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p)}for(const p of P.reverse()){while(up.length>1&&x(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p)}return lo.slice(0,-1).concat(up.slice(0,-1))}
function cylPts(a,d,L,r){const b=a.map((v,i)=>v+d[i]*L);return ring(a,d,r).concat(ring(b,d,r))}
// ---------- SVG technical drawing ----------
function drawing(p){
  const W=640,VH=300,views=["front","side","top"],pad=78;
  const shapes=v=>{const pr=VIEWS[v],o=[];for(const s of p.prims){
      if(s.t==="sph")o.push({k:"c",c:pr(s.c),r:s.r,s});
      else{const pts=cylPts(s.a,s.d,s.L,s.t==="stub"?s.r:s.ro).map(pr);o.push({k:"p",pts:hull(pts),s});
        if(s.ri){const b0=s.rev?s.a:s.a.map((x,i)=>x+s.d[i]*(s.L-s.depth)),bl=s.rev?s.depth:s.depth;o.push({k:"p",pts:hull(cylPts(b0,s.d,bl,s.ri).map(pr)),s,bore:1})}}}return o};
  const all=views.map(v=>{const a=shapes(v);return a.filter(z=>z.s.t==="stub").concat(a.filter(z=>z.s.t!=="stub"))}),bx=(sh,stub)=>{let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;sh.filter(z=>stub||z.s.t!=="stub").forEach(z=>{(z.k==="c"?[[z.c[0]-z.r,z.c[1]-z.r],[z.c[0]+z.r,z.c[1]+z.r]]:z.pts).forEach(([x,y])=>{x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)})});return {x0,x1,y0,y1}},ext=all.map(sh=>bx(sh)),exs=all.map(sh=>bx(sh,1));
  const sc=Math.min(...ext.map(e=>Math.min((W-2*pad-90)/(e.x1-e.x0||1),(VH-110)/(e.y1-e.y0||1))));
  let o=`<svg viewBox="0 0 ${W} ${VH*3}" role="img" aria-label="${p.name}: front, side and top views, dimensions in mm" font-family="Jost,sans-serif">`;
  views.forEach((v,vi)=>{const e=ext[vi],cx=pad+ (W-2*pad-60)/2,cy=vi*VH+VH/2+8,ox=cx-sc*(e.x0+e.x1)/2,oy=cy-sc*(e.y0+e.y1)/2,T=([x,y])=>[ox+sc*x,oy+sc*y],pr=VIEWS[v];
    o+=`<text x="16" y="${vi*VH+26}" font-size="12" letter-spacing="2.4" fill="var(--label)">${v.toUpperCase()}</text>`;
    if(vi)o+=`<line x1="16" x2="${W-16}" y1="${vi*VH}" y2="${vi*VH}" stroke="var(--line)" stroke-width=".6" stroke-dasharray="1 3"/>`;
    o+=`<line x1="${T([0,0])[0]-14}" y1="${T([0,0])[1]}" x2="${T([0,0])[0]+14}" y2="${T([0,0])[1]}" stroke="var(--line)" stroke-width=".5" stroke-dasharray="6 2 1 2"/><line x1="${T([0,0])[0]}" y1="${T([0,0])[1]-14}" x2="${T([0,0])[0]}" y2="${T([0,0])[1]+14}" stroke="var(--line)" stroke-width=".5" stroke-dasharray="6 2 1 2"/>`;
    for(const z of all[vi]){const st=z.s.t==="stub",fill=z.bore?"none":st?"#473448":z.s.col,fo=st?.55:.22,sw=z.bore?.8:st?.6:1.1,da=z.bore?' stroke-dasharray="3 2"':"",stroke=st?"#473448":"var(--ink)";
      if(z.k==="c"){const [x,y]=T(z.c);o+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(z.r*sc).toFixed(1)}" fill="${fill}" fill-opacity="${fo}" stroke="${stroke}" stroke-width="${sw}"/>`}
      else o+=`<polygon points="${z.pts.map(T).map(q=>q.map(n=>n.toFixed(1)).join(",")).join(" ")}" fill="${fill}" fill-opacity="${z.bore?0:fo}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"${da}/>`}
    // overall extents
    const es=exs[vi],a=T([e.x0,e.y1]),b=T([e.x1,e.y1]),c2=T([e.x1,e.y0]),dy=T([0,es.y1])[1]+16,dx=T([es.x1,0])[0]+16,mm=(e.x1-e.x0),mh=(e.y1-e.y0);
    const dim=(x1,y1,x2,y2,lab,vert)=>`<g stroke="var(--label)" stroke-width=".7" fill="none"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-start="url(#ar)" marker-end="url(#ar)"/></g><text x="${vert?x1+6:(x1+x2)/2}" y="${vert?(y1+y2)/2+4:y1-5}" font-size="11.5" fill="var(--label)" ${vert?"":'text-anchor="middle"'}>${lab}</text>`;
    o+=`<g stroke="var(--line)" stroke-width=".5"><line x1="${a[0]}" y1="${a[1]+3}" x2="${a[0]}" y2="${dy+4}"/><line x1="${b[0]}" y1="${b[1]+3}" x2="${b[0]}" y2="${dy+4}"/><line x1="${b[0]+3}" y1="${b[1]}" x2="${dx+4}" y2="${b[1]}"/><line x1="${c2[0]+3}" y1="${c2[1]}" x2="${dx+4}" y2="${c2[1]}"/></g>`;
    o+=dim(a[0],dy,b[0],dy,f1(mm))+dim(dx,c2[1],dx,b[1],f1(mh),1);
    for(const l of p.lin.filter(l=>l.v===v)){const p1=T(pr(l.p1)),p2=T(pr(l.p2));o+=dim(p1[0],p1[1],p2[0],p2[1],l.label,Math.abs(p1[0]-p2[0])<1)}
    for(const an of p.ann.filter(x=>x.v===v)){const o0=T(pr(an.o)),R=an.r||40,q1=pr(an.v1),q2=pr(an.v2),a1=Math.atan2(q1[1],q1[0]),a2=Math.atan2(q2[1],q2[0]);
      let d=a2-a1;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;const P1=[o0[0]+R*Math.cos(a1),o0[1]+R*Math.sin(a1)],P2=[o0[0]+R*Math.cos(a1+d),o0[1]+R*Math.sin(a1+d)],am=a1+d/2;
      o+=`<line x1="${o0[0]}" y1="${o0[1]}" x2="${o0[0]+(R+8)*Math.cos(a1)}" y2="${o0[1]+(R+8)*Math.sin(a1)}" stroke="var(--label)" stroke-width=".5" stroke-dasharray="2 2"/><line x1="${o0[0]}" y1="${o0[1]}" x2="${o0[0]+(R+8)*Math.cos(a1+d)}" y2="${o0[1]+(R+8)*Math.sin(a1+d)}" stroke="var(--label)" stroke-width=".5" stroke-dasharray="2 2"/>`;
      o+=`<path d="M${P1[0].toFixed(1)},${P1[1].toFixed(1)} A${R},${R} 0 0 ${d>0?1:0} ${P2[0].toFixed(1)},${P2[1].toFixed(1)}" fill="none" stroke="#856a8e" stroke-width="1.6"/><text x="${(o0[0]+(R+24)*Math.cos(am)).toFixed(1)}" y="${(o0[1]+(R+20)*Math.sin(am)+4).toFixed(1)}" font-size="12" fill="var(--title)" text-anchor="middle">${an.label}</text>`}
    p.notes.filter(n=>n.v===v).forEach((n,k)=>{const s=T(pr(n.p)),tx=W-20,ty=vi*VH+56+k*20;o+=`<polyline points="${s[0]},${s[1]} ${tx-150},${ty-4} ${tx-6},${ty-4}" fill="none" stroke="var(--line)" stroke-width=".6"/><circle cx="${s[0]}" cy="${s[1]}" r="1.8" fill="var(--label)"/><text x="${tx}" y="${ty-8}" font-size="11.5" fill="var(--ink)" text-anchor="end">${n.t}</text>`});
  });
  o+=`<defs><marker id="ar" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1.5 L7,4 L0,6.5" fill="none" stroke="var(--label)" stroke-width="1"/></marker></defs>`;
  o+=`<text x="${W-16}" y="${VH*3-12}" font-size="11" fill="var(--note-s)" text-anchor="end">mm · scale ${f1(sc)} : 1 on screen · walnut = stick ends</text></svg>`;
  return o;
}
// ---------- three.js model ----------
const cv=$("cx3d"),ren=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true,preserveDrawingBuffer:true});
ren.setPixelRatio(Math.min(2,devicePixelRatio||1));
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(30,1,1,5000),ctl=new OrbitControls(cam,cv);ctl.enableDamping=true;
scene.add(new THREE.HemisphereLight(0xf9fafb,0x5a515c,1.6));const key=new THREE.DirectionalLight(0xffffff,2.2);key.position.set(1,1.6,1.2);scene.add(key);
const rim=new THREE.DirectionalLight(0xfcb4c4,1.2);rim.position.set(-1.4,.6,-1.2);scene.add(rim);
let grp=null;const mats={};
const mat=(c,o)=>{const k=c+(o||"");return mats[k]||(mats[k]=new THREE.MeshStandardMaterial({color:c,roughness:o==="in"?.9:.55,metalness:0,side:o==="in"?THREE.BackSide:THREE.FrontSide}))};
function place(m,a,d){m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(...d).normalize());const A=new THREE.Vector3(...a),D=new THREE.Vector3(...d).normalize();m.position.copy(A);return m}
function tubeMesh(s){const g=new THREE.Group(),L=s.L,col=s.t==="stub"?"#473448":s.col;
  const ro=s.t==="stub"?s.r:s.ro;const ri=s.ri||0,dep=s.depth||0,rev=!!s.rev;
  const seg=48;
  // outer wall
  const outer=new THREE.Mesh(new THREE.CylinderGeometry(ro,ro,L,seg,1,true),mat(col));outer.position.y=L/2;g.add(outer);
  const cap=(y,r0,up)=>{const m=new THREE.Mesh(new THREE.RingGeometry(r0,ro,seg),mat(col));m.rotation.x=up?-Math.PI/2:Math.PI/2;m.position.y=y;g.add(m)};
  if(!ri){cap(L,0,1);cap(0,0,0)}
  else{const y0=rev?0:L-dep,y1=rev?dep:L,through=dep>=L-1e-6;
    const inner=new THREE.Mesh(new THREE.CylinderGeometry(ri,ri,y1-y0,seg,1,true),mat(s.col,"in"));inner.position.y=(y0+y1)/2;g.add(inner);
    if(rev){cap(0,ri,0);cap(L,0,1);}else{cap(L,ri,1);if(through)cap(0,ri,0);else{cap(0,0,0);const fl=new THREE.Mesh(new THREE.CircleGeometry(ri,seg),mat(s.col,"in"));fl.rotation.x=Math.PI/2;fl.position.y=y0;g.add(fl)}}}
  return place(g,s.a,s.d)}
function model(p){if(grp){scene.remove(grp);grp.traverse(o=>o.geometry&&o.geometry.dispose())}grp=new THREE.Group();
  for(const s of p.prims){if(s.t==="sph"){const m=new THREE.Mesh(new THREE.SphereGeometry(s.r,48,32),mat(s.col));m.position.set(...s.c);grp.add(m)}else grp.add(tubeMesh(s))}
  scene.add(grp);const b=new THREE.Box3().setFromObject(grp),sz=b.getSize(new THREE.Vector3()).length(),c=b.getCenter(new THREE.Vector3());
  if(!model.done||model.part!==p.key){cam.position.copy(c).add(new THREE.Vector3(.9,.62,1.05).normalize().multiplyScalar(sz*1.9));ctl.target.copy(c);model.part=p.key;model.done=1}
  cam.near=sz/50;cam.far=sz*20;cam.updateProjectionMatrix()}
function size(){const w=cv.clientWidth||600;ren.setSize(w,w*0.72,false);cam.aspect=1/0.72;cam.updateProjectionMatrix()}
(function loop(){ctl.update();ren.render(scene,cam);requestAnimationFrame(loop)})();
// ---------- STL export (current parameters; parts are separate shells, not unioned) ----------
function stl(){const tris=[];scene.updateMatrixWorld(true);grp.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry,p=g.attributes.position,v=new THREE.Vector3();
    const flip=o.material.side===THREE.BackSide;for(let i=0;i<p.count;i+=3){const t=[0,1,2].map(k=>v.fromBufferAttribute(p,i+k).applyMatrix4(o.matrixWorld).toArray());tris.push(flip?[t[0],t[2],t[1]]:t)}});
  const buf=new ArrayBuffer(84+50*tris.length),dv=new DataView(buf);dv.setUint32(80,tris.length,true);
  tris.forEach((t,i)=>{const o=84+50*i,n=nrm(cr(t[1].map((x,k)=>x-t[0][k]),t[2].map((x,k)=>x-t[0][k])));[n,...t].forEach((w,j)=>w.forEach((x,k)=>dv.setFloat32(o+12*j+4*k,x||0,true)))});
  const a=document.createElement("a"),pp=params();a.href=URL.createObjectURL(new Blob([buf],{type:"model/stl"}));a.download=`sabat_${cur}_D${pp.D}_peak${pp.peak}_stick${pp.stick}.stl`;a.click()}
// ---------- render ----------
function render(){const pp=params(),res=SabatGeom.build(pp);data=C.derive(res,pp.stick);const p=data[cur];
  $("cpick").querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.k===cur));
  $("cdraw").innerHTML=drawing(p);$("cname").textContent=p.name;
  $("crows").tBodies[0].innerHTML=p.rows.map(([a,b,t])=>`<tr><td>${a}</td><td class="n">${b}</td><td class="n"><span class="tag">${t}</span></td></tr>`).join("");
  $("cparts").tBodies[0].innerHTML=ORDER.map(k=>`<tr${k===cur?' aria-current="true"':""}><td><span class="sw${k==="corner"?" sq":""}" style="background:${data[k].col}" aria-hidden="true"></span>${data[k].name}</td><td class="n">${data[k].count}</td></tr>`).join("")+`<tr><td><b>Total connectors</b></td><td class="n"><b>${ORDER.reduce((s,k)=>s+data[k].count,0)}</b></td></tr>`;
  $("cfoot").textContent=`At Ø ${pp.D} cm, peak ${pp.peak} cm, frame stick ${pp.stick} mm, pyramid stick ${pp.stick/2} mm${pp.open?`, entrance open (star ${pp.star})`:""}.`;
  size();model(p)}
$("cpick").addEventListener("click",e=>{const b=e.target.closest("button");if(b){cur=b.dataset.k;model.done=0;render()}});
$("cstl").onclick=stl;
new MutationObserver(render).observe($("con").tBodies[0],{childList:true});
addEventListener("resize",()=>{size()});
render();window.__connReady=true;
