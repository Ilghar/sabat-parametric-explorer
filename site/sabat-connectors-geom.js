/* SÁBÁT stage 2: parametric connectors (4 Nov 2026). Pure geometry, no drawing.
   Input: a SabatGeom.build() result (cm) + stick Ø (mm). Output per connector: primitives in mm (Y up),
   computed angles/dimensions, counts. At the built values every part reproduces the stage-1 originals
   (/workspace/portfolio/images/sabat_3d/stage1, build_stage1.py P dict). Source tags: [S] product spec / drawing,
   [H] Hāèl, [C] computed from the dome, [A] assumption kept from stage 1. */
(function(root){
const sub=(a,b)=>a.map((v,i)=>v-b[i]),add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,k)=>a.map(v=>v*k),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len=a=>Math.hypot(...a),unit=a=>mul(a,1/(len(a)||1));
const deg=r=>r*180/Math.PI,rad=d=>d*Math.PI/180,ang=(a,b)=>deg(Math.acos(Math.max(-1,Math.min(1,dot(unit(a),unit(b))))));
const COL={hub5:"#473448",hub6:"#775a76",ball:"#2a272d",tee:"#fcb4c4",corner:"#c4768c",peak:"#3a3a3c",stick:"#5b4032"};
// stage-1 constants (mm)
const K={clear:0.2,wallF:4.45,/* (29.3-20.4)/2: 21.3 tube + 4 mm casting wall [A] */
  aCornerB:40,aTeeB:41,sizeScale:21.3/26.9,/* drawings 6080Z20 / 6080Z02 size B, scaled to size A [S]+[A] */
  teeL:41.3,teeSockWall:5.0,/* tee through length [A]; socket OD 20.4 on a 10.4 bore [A] */
  hub5:{D:52.6,T:16,rb:18},hub6:{D:54.6,T:12,rb:19},/* Hubs spec PDF [S]; 6-way slimmed to 12 [stage 1] */
  ball:16,neck:8,base2ball:25,baseH:6,screw:4.8,hubBore:6.1,/* Hubs ball connector [S] */
  pkNode:9.5,pkArmOD:15,pkArm:24,pkDepth:16,/* after Hāèl's STL 01M67KEQ0QDH [H]+[A] */
  boss:9,hubAllow:88/* Hubs kit: stick = chord − 88 mm [S] */};
function derive(res,stick){
  const s=stick/20,ps=stick/2,boreF=stick+2*K.clear,boreP=ps+2*K.clear;
  const P=res.pts.map(p=>mul(p,10)),O=[0,0,res.leg*10];           // mm, dome centre
  const nb=i=>res.edges.filter(e=>e[0]===i||e[1]===i).map(e=>e[0]===i?e[1]:e[0]);
  const out={},f1=x=>Math.round(x*10)/10;
  // ---------- hubs: strut directions in the hub frame (Y = outward normal) ----------
  function hub(kind){
    const spec=K[kind],n=kind==="hub5"?5:6;
    let i=kind==="hub5"?P.reduce((b,p,j)=>res.kind[j]==="hub5"&&p[2]>P[b][2]?j:b,res.kind.indexOf("hub5"))
                       :P.map((p,j)=>j).filter(j=>res.kind[j]==="hub6"&&nb(j).length===6).sort((a,b)=>P[b][2]-P[a][2])[0];
    const N=unit(sub(P[i],O)),ns=nb(i),dirs=ns.map(j=>unit(sub(P[j],P[i])));
    const e1=unit(sub(dirs[0],mul(N,dot(dirs[0],N)))),e2=cross(N,e1);
    const az=dirs.map(d=>(deg(Math.atan2(dot(d,e2),dot(d,e1)))+360)%360),ord=az.map((a,k)=>k).sort((a,b)=>az[a]-az[b]);
    const elev=ord.map(k=>deg(Math.asin(-dot(dirs[k],N))));        // below the hub plane
    const gaps=ord.map((k,m)=>((az[ord[(m+1)%ord.length]]-az[k])+360)%360||360);
    const chords=ord.map(k=>len(sub(P[ns[k]],P[i])));
    // dihedral between the two frame triangles that share each strut
    const dih=ord.map(k=>{const j=ns[k],tt=res.tris.filter(t=>t.v.includes(i)&&t.v.includes(j));if(tt.length<2)return null;
      const nn=tt.map(t=>{const v=t.v.map(q=>P[q]);let m=unit(cross(sub(v[1],v[0]),sub(v[2],v[0])));if(dot(m,sub(v[0],O))<0)m=mul(m,-1);return m});
      return 180-ang(nn[0],nn[1])}).filter(x=>x!=null);
    const prims=[{t:"tube",a:[0,-spec.T/2,0],d:[0,1,0],L:spec.T,ro:spec.D/2,ri:K.hubBore/2,depth:spec.T,col:COL[kind]}];
    for(let k=0;k<n;k++){const ph=rad(360*k/n),e=rad(elev[k%elev.length]);
      const c=[spec.rb*Math.cos(ph),0,-spec.rb*Math.sin(ph)],d=[Math.cos(ph)*Math.cos(e),-Math.sin(e),-Math.sin(ph)*Math.cos(e)];
      prims.push({t:"sph",c,r:K.ball/2,col:COL.ball},{t:"tube",a:c,d,L:K.base2ball-K.baseH,ro:K.neck/2,col:COL.ball},
        {t:"tube",a:add(c,mul(d,K.base2ball-K.baseH)),d,L:K.baseH,ro:Math.max(K.neck/2+1,ps),col:COL.ball},
        {t:"stub",a:add(c,mul(d,K.base2ball)),d,L:30,r:stick/2})}
    const c0=[spec.rb,0,0],d0=[Math.cos(rad(elev[0])),-Math.sin(rad(elev[0])),0];
    return {prims,i,n,az,elev,gaps,chords,dih,spec,
      ann:[{v:"front",o:c0,v1:[1,0,0],v2:d0,label:`${f1(elev[0])}°`},{v:"top",o:[0,0,0],v1:[1,0,0],v2:[Math.cos(rad(360/n)),0,-Math.sin(rad(360/n))],label:`${f1(360/n)}°`}],
      lin:[{v:"top",p1:[-spec.D/2,0,spec.D/2+6],p2:[spec.D/2,0,spec.D/2+6],label:`Ø ${spec.D}`},{v:"front",p1:[-spec.D/2-6,-spec.T/2,0],p2:[-spec.D/2-6,spec.T/2,0],label:`${spec.T}`}],
      notes:[{v:"top",p:[spec.rb,0,0],t:`ball seat r ${spec.rb}`},{v:"top",p:[0,0,0],t:`bore Ø ${K.hubBore}`}]};
  }
  for(const kind of ["hub5","hub6"]){const h=hub(kind),rng=a=>{const lo=Math.min(...a),hi=Math.max(...a);return Math.abs(hi-lo)<0.05?`${f1(lo)}`:`${f1(lo)} – ${f1(hi)}`};
    out[kind]={key:kind,name:kind==="hub5"?"5-way hub":"6-way hub",col:COL[kind],count:res.counts[kind],prims:h.prims,ann:h.ann,lin:h.lin,notes:h.notes,
      rows:[["Sockets",`${h.n}, product spacing ${f1(360/h.n)}°`,"S"],["Hub Ø × thickness",`${h.spec.D} × ${h.spec.T} mm`,kind==="hub6"?"S, slimmed in stage 1":"S"],
        ["Ball seat radius",`${h.spec.rb} mm, ball Ø ${K.ball}`,"S"],
        ["Strut angle below the hub plane",`${rng(h.elev)}°`,"C"],["Strut spacing in plan (true)",`${h.gaps.map(f1).join(" · ")}°`,"C"],
        ["Ball joint takes up",`${f1(Math.max(...h.gaps.map(g=>Math.abs(g-360/h.n))))}° in plan, ${f1(Math.max(...h.elev.map(Math.abs)))}° out of plane`,"C"],
        ["Dihedral between frame triangles",`${rng(h.dih)}°`,"C"],
        ["Strut lengths at this hub, centre to centre",`${rng(h.chords)} mm (sticks ${rng(h.chords.map(c=>c-K.hubAllow))})`,"C"]]};}
  // ---------- crown pyramid: tees + peak ----------
  const t=res.tris.filter(q=>q.role==="pyramid").sort((a,b)=>b.c[2]-a.c[2])[0];
  const V=t.v.map(q=>P[q]),A=mul(t.apex,10);
  let Np=unit(cross(sub(V[1],V[0]),sub(V[2],V[0])));if(dot(Np,mul(t.n,1))<0)Np=mul(Np,-1);
  const M=[0,1,2].map(k=>mul(add(V[k],V[(k+1)%3]),.5)),arms=M.map(m=>unit(sub(m,A))),cc=M.map(m=>len(sub(m,A)));
  const below=arms.map(d=>deg(Math.asin(-dot(d,Np)))),between=[0,1,2].map(k=>ang(arms[k],arms[(k+1)%3]));
  const axisTilt=deg(Math.acos(dot(unit(mul(t.n,1)),Np)));
  // tee: through tube on X (edge), socket rises toward the apex; τ = rotation of the socket about the tube
  const ek=1,E=unit(sub(V[(ek+1)%3],V[ek])),Zin=unit(sub(mul(add(add(V[0],V[1]),V[2]),1/3),M[ek])),Zp=unit(sub(Zin,mul(Np,dot(Zin,Np))));
  const dS=mul(arms[ek],-1),tau=deg(Math.atan2(dot(dS,Np),dot(dS,Zp))),inPlane=90-ang(E,dS);
  // neighbour pyramid on the same edge (side-outlet tee)
  const t2=res.tris.find(q=>q!==t&&q.role==="pyramid"&&q.v.includes(t.v[ek])&&q.v.includes(t.v[(ek+1)%3]));
  let tau2=null,between2=null;if(t2){const d2=unit(sub(mul(t2.apex,10),M[ek]));between2=deg(Math.acos(Math.max(-1,Math.min(1,dot(unit(sub(dS,mul(E,dot(dS,E)))),unit(sub(d2,mul(E,dot(d2,E)))))))));}
  // ---- tee
  { const OD=boreF+2*K.wallF,a=K.aTeeB*K.sizeScale*s,L=K.teeL*s,rs=(boreP+2*K.teeSockWall)/2,depth=a-(boreF/2-0.5);
    const dz=[0,Math.sin(rad(tau)),Math.cos(rad(tau))];
    const prims=[{t:"tube",a:[-L/2,0,0],d:[1,0,0],L,ro:OD/2,ri:boreF/2,depth:L,col:COL.tee},
      {t:"tube",a:[0,0,0],d:dz,L:a,ro:rs,ri:boreP/2,depth,col:COL.tee},
      {t:"tube",a:[0,0,0],d:[0,-Math.cos(rad(tau)),Math.sin(rad(tau))],L:OD/2+3*s,ro:K.boss/2*s,col:COL.tee},
      {t:"stub",a:mul(dz,a-depth),d:dz,L:depth+20,r:ps/2},{t:"stub",a:[L/2,0,0],d:[1,0,0],L:30,r:stick/2},{t:"stub",a:[-L/2,0,0],d:[-1,0,0],L:30,r:stick/2}];
    out.tee={key:"tee",name:"T tee 2A",col:COL.tee,count:res.counts.teeShort+res.counts.teeSide,prims,
      ann:[{v:"side",o:[0,0,0],v1:[0,0,1],v2:dz,label:`τ ${f1(tau)}°`},{v:"top",o:[0,0,0],v1:[1,0,0],v2:[0,0,1],label:"90°"}],
      lin:[{v:"front",p1:[-L/2,-OD/2-6,0],p2:[L/2,-OD/2-6,0],label:`${f1(L)}`},{v:"top",p1:[L/2+6,0,0],p2:[L/2+6,0,a],label:`a ${f1(a)}`}],
      notes:[{v:"front",p:[-L/2,0,0],t:`through Ø ${f1(boreF)}`},{v:"side",p:mul(dz,a),t:`socket Ø ${f1(boreP)}, ${f1(depth)} deep`}],
      rows:[["Through bore (frame stick)",`Ø ${f1(boreF)} mm, OD ${f1(OD)}, length ${f1(L)}`,"S/A"],["Socket bore (pyramid stick)",`Ø ${f1(boreP)} mm, ${f1(depth)} deep, socket OD ${f1(2*rs)}`,"A"],
        ["a, tube axis to socket end",`${f1(a)} mm`,"S scaled"],["Socket to tube, product",`90°`,"S"],
        ["Socket rotation about the tube τ (pyramid stick above the frame plane)",`${f1(tau)}°`,"C"],["Pyramid stick off square to the tube, in its own plane",`${f1(inPlane)}°`,"C"],
        ...(between2!=null?[["Side-outlet tee: angle between its 2 sockets about the tube",`${f1(between2)}°`,"C"]]:[]),
        ["Count",`${res.counts.teeShort} with 1 socket, ${res.counts.teeSide} with 2`,"C"]]};}
  // ---- peak connector: local Y = base-plane normal, arm 0 along +X in plan
  { const X0=unit(sub(arms[0],mul(Np,dot(arms[0],Np)))),Z0=cross(X0,Np),loc=d=>[dot(d,X0),dot(d,Np),dot(d,Z0)];
    const node=K.pkNode*s,od=K.pkArmOD*s,al=K.pkArm*s,dp=K.pkDepth*s,la=arms.map(loc);
    const prims=[{t:"sph",c:[0,0,0],r:node,col:COL.peak}];
    la.forEach(d=>prims.push({t:"tube",a:[0,0,0],d,L:al,ro:od/2,ri:boreP/2,depth:dp,col:COL.peak,cap0:"sph"},{t:"stub",a:mul(d,al-dp+0.5),d,L:dp+18,r:ps/2}));
    const cut=cc.map(c=>c-(al-dp+0.5)-(boreF/2-0.5));
    out.peak={key:"peak",name:"Three-arm peak connector",col:COL.peak,count:res.counts.peaks,prims,
      ann:[{v:"front",o:[0,0,0],v1:[1,0,0],v2:la[0],label:`${f1(below[0])}°`},
        ...[0,1,2].map(k=>({v:"top",o:[0,0,0],v1:la[k],v2:la[(k+1)%3],r:46+18*k,label:`${f1(((deg(Math.atan2(-la[(k+1)%3][2],la[(k+1)%3][0]))-deg(Math.atan2(-la[k][2],la[k][0])))+720)%360)}° plan`}))],
      lin:[],
      notes:[{v:"front",p:mul(la[0],al),t:`socket Ø ${f1(boreP)}, ${f1(dp)} deep`},{v:"top",p:[0,0,0],t:`node r ${f1(node)}`}],
      rows:[["Arm angles below the base plane",`${below.map(f1).join(" · ")}°`,"C"],["Angles between the arms",`${between.map(f1).join(" · ")}°`,"C"],
        ["Arm OD × length, node radius",`Ø ${f1(od)} × ${f1(al)} mm, r ${f1(node)}`,"H form, A size"],["Socket bore × depth",`Ø ${f1(boreP)} × ${f1(dp)} mm`,"C/A"],
        ["Pyramid sticks, apex to tee axis",`${cc.map(Math.round).join(" · ")} mm`,"C"],["Pyramid sticks, cut length (model)",`${cut.map(Math.round).join(" · ")} mm`,"C"],
        ["Peak above the base triangle",`${f1(res.peak*10)} mm, cover axis ${f1(axisTilt)}° off the base normal`,"H/C"]]};}
  // ---- L corner at the entrance (frame angles from the open-entrance geometry; scale-free)
  { const ro=(boreF+2*K.wallF)/2,a=K.aCornerB*K.sizeScale*s,L=2*a;
    const r2=root.SabatGeom.build(Object.assign({},res.o,{open:true})),P2=r2.pts.map(p=>mul(p,10)),ci=r2.kind.indexOf("corner");
    const n2=r2.edges.filter(e=>e.includes(ci)).map(e=>e[0]===ci?e[1]:e[0]),ringN=n2.filter(j=>Math.abs(P2[j][2]-P2[ci][2])<1e-3),up=n2.find(j=>!ringN.includes(j));
    const dR=ringN.map(j=>unit(sub(P2[j],P2[ci]))),dU=unit(sub(P2[up],P2[ci]));
    const bend=ang(dR[0],dR[1]),toRing=dR.map(d=>ang(d,dU)).sort((x,y)=>x-y),elev=deg(Math.asin(dU[2]));
    const prims=[{t:"tube",a:[-a,0,0],d:[1,0,0],L,ro,ri:boreF/2,depth:L,col:COL.corner},{t:"sph",c:[0,0,0],r:ro,col:COL.corner},
      {t:"tube",a:[0,0,0],d:[0,1,0],L:a,ro,ri:boreF/2,depth:a,col:COL.corner},{t:"tube",a:[0,0,0],d:[0,0,1],L:a,ro,ri:boreF/2,depth:a,col:COL.corner},
      {t:"tube",a:[a*.55,0,0],d:unit([0,-1,-1]),L:ro+3*s,ro:K.boss/2*s,col:COL.corner},{t:"tube",a:[0,a*.62,0],d:[-1,0,0],L:ro+3*s,ro:K.boss/2*s,col:COL.corner},{t:"tube",a:[0,0,a*.62],d:[-1,0,0],L:ro+3*s,ro:K.boss/2*s,col:COL.corner},
      {t:"stub",a:[a,0,0],d:[1,0,0],L:30,r:stick/2},{t:"stub",a:[-a,0,0],d:[-1,0,0],L:30,r:stick/2},{t:"stub",a:[0,a,0],d:[0,1,0],L:30,r:stick/2},{t:"stub",a:[0,0,a],d:[0,0,1],L:30,r:stick/2}];
    out.corner={key:"corner",name:"L corner Eckstück 20A",col:COL.corner,count:res.counts.corner,prims,
      ann:[{v:"front",o:[0,0,0],v1:[1,0,0],v2:[0,1,0],label:"90°"},{v:"top",o:[0,0,0],v1:[1,0,0],v2:[0,0,1],label:"90°"}],
      lin:[{v:"front",p1:[-a,-ro-6,0],p2:[a,-ro-6,0],label:`${f1(L)}`},{v:"front",p1:[a+ro*0+8,0,0],p2:[a+8,a,0],label:`a ${f1(a)}`}],
      notes:[{v:"front",p:[-a,0,0],t:`bores Ø ${f1(boreF)}`},{v:"top",p:[0,0,a],t:`OD ${f1(2*ro)}`}],
      rows:[["Bores, all three (frame sticks)",`Ø ${f1(boreF)} mm, OD ${f1(2*ro)}`,"C from stick Ø, A wall"],["a, centre to socket end",`${f1(a)} mm, through length ${f1(L)}`,"S scaled"],
        ["Product angles",`through 180°, sockets 90° / 90°`,"S"],["Frame at the entrance foot: ring sticks meet at",`${f1(bend)}° (product 180°)`,"C"],
        ["Rising frame stick to the ring sticks",`${toRing.map(f1).join(" · ")}° (product 90°)`,"C"],["Rising stick above horizontal",`${f1(elev)}°`,"C"],
        ["Count",res.counts.corner?`${res.counts.corner} (entrance open)`:"0 while the entrance is closed","C"]]};}
  // ---- ball connector
  { const ends=res.edges.reduce((n,[x,y])=>n+(res.kind[x]!=="corner")+(res.kind[y]!=="corner"),0),bd=Math.max(K.neck+2,stick);
    const fam=res.families.slice(0,2);
    const prims=[{t:"tube",a:[0,0,0],d:[0,1,0],L:K.baseH,ro:bd/2,ri:K.screw/2,depth:K.base2ball-4,rev:1,col:COL.ball},{t:"tube",a:[0,K.baseH,0],d:[0,1,0],L:K.base2ball-K.baseH,ro:K.neck/2,col:COL.ball},
      {t:"sph",c:[0,K.base2ball,0],r:K.ball/2,col:COL.ball},{t:"stub",a:[0,0,0],d:[0,-1,0],L:45,r:stick/2}];
    out.ball={key:"ball",name:"Ball connector",col:COL.ball,count:ends,prims,ann:[],
      lin:[{v:"front",p1:[bd/2+8,0,0],p2:[bd/2+8,K.base2ball,0],label:`${K.base2ball}`},{v:"front",p1:[-bd/2,-8,0],p2:[bd/2,-8,0],label:`Ø ${f1(bd)}`}],
      notes:[{v:"front",p:[0,K.base2ball,0],t:`ball Ø ${K.ball}`},{v:"side",p:[0,2,0],t:`screw hole Ø ${K.screw}`}],
      rows:[["Ball Ø, neck Ø, base to ball centre",`${K.ball} · ${K.neck} · ${K.base2ball} mm`,"S"],["Base Ø (follows the frame stick)",`${f1(bd)} mm`,"A"],
        ["Screw hole into the stick end",`Ø ${K.screw} mm`,"S"],["Frame sticks it closes",fam.map(f=>`${f.type.split(" ")[0]} ${Math.round(f.stick*10)} mm × ${f.count}`).join(", "),"C (chord − 88)"],
        ["Count",`${ends} (2 per frame stick, none where a stick runs into an L corner)`,"C"]]};}
  return out;
}
root.SabatConnectors={derive,COL,K};
if(typeof module!=="undefined")module.exports={derive,COL,K};
})(typeof window!=="undefined"?window:globalThis);
