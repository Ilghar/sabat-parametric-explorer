/* SÁBÁT 2V model, Revision 8 (2026-11-04; Rev 7 2026-10-31). Confirmed by Hāèl ("Yes exactly").
   2V hub kit, icosahedral frame cut at the equator (structure height = ½ Ø at the hub centres),
   6 stars of 5 knitted pyramids (crown + 5 side). Optional entrance: one side star removed.
   Stick = hub-centre chord − 88 mm (Hubs kit size table). Units: cm. */
(function(root){
const nrm=p=>{const l=Math.hypot(...p);return p.map(c=>c/l)};
const HUB=8.8, CF_SHORT=0.546533, CF_LONG=0.618034;
const BUILT={D:352,peak:57,leg:54,stick:20,open:false,star:1};
function build(o){
  o=Object.assign({},BUILT,o||{});
  const R=o.D/2, peak=o.peak, leg=o.leg, removed=o.open?o.star:-1;
  const V=[[0,0,1]],a=Math.atan(0.5);
  for(let k=0;k<5;k++){const t=k*2*Math.PI/5;V.push([Math.cos(a)*Math.cos(t),Math.cos(a)*Math.sin(t),Math.sin(a)])}
  for(let k=0;k<5;k++){const t=(k+.5)*2*Math.PI/5;V.push([Math.cos(a)*Math.cos(t),Math.cos(a)*Math.sin(t),-Math.sin(a)])}
  const F=[];for(let k=0;k<5;k++){const u=1+k,u2=1+(k+1)%5,l=6+k,lp=6+(k+4)%5;F.push([0,u,u2],[u,u2,l],[u,l,lp])}
  const pts=[],key=new Map();
  const add=p=>{p=nrm(p);const k=p.map(c=>Math.round(c*1e6)).join();if(!key.has(k)){key.set(k,pts.length);pts.push(p)}return key.get(k)};
  const tris=[];
  F.forEach((f,fi)=>{
    const m=[[0,1],[1,2],[2,0]].map(([i,j])=>V[f[i]].map((c,n)=>c+V[f[j]][n]));
    [[V[f[0]],m[0],m[2],f[0]],[V[f[1]],m[1],m[0],f[1]],[V[f[2]],m[2],m[1],f[2]],[m[0],m[1],m[2],-1]].forEach(([p,q,s,hub])=>{
      const v=[p,q,s].map(add); if(Math.min(...v.map(i=>pts[i][2]))<-1e-6) return; // below the equator cut
      const role=hub<0?"flat":hub===removed?"entrance":"pyramid";
      tris.push({v,role,hub});});
  });
  const isHub=i=>V.some(w=>Math.hypot(w[0]-pts[i][0],w[1]-pts[i][1],w[2]-pts[i][2])<1e-6);
  const X=pts.map(p=>[p[0]*R,p[1]*R,p[2]*R+leg]);
  const ek=new Set(),edges=[],pushE=(a,b)=>{const k=a<b?a+","+b:b+","+a;if(!ek.has(k)){ek.add(k);edges.push([a,b])}};
  tris.forEach(t=>t.v.forEach((a,i)=>{const b=t.v[(i+1)%3];
    if(t.role!=="entrance"||(Math.abs(pts[a][2])<1e-6&&Math.abs(pts[b][2])<1e-6))pushE(a,b)})); // ring strut stays across the entrance
  const used=new Set(edges.flat());
  const kind=pts.map((p,i)=>isHub(i)?"hub5":"hub6");
  // Rev 8 (Hāèl, 4 Nov 2026): at the entrance the two ring nodes left with only the ring stick running through
  // and one frame stick rising take an L-shaped Rohrverbinder Eckstück durchgehend 20A (20 mm bores), not a hub.
  const val={};edges.forEach(([a,b])=>{val[a]=(val[a]||0)+1;val[b]=(val[b]||0)+1});
  const entV=new Set(tris.filter(t=>t.role==="entrance").flatMap(t=>t.v));
  pts.forEach((p,i)=>{if(entV.has(i)&&Math.abs(p[2])<1e-6&&val[i]===3)kind[i]="corner"});
  const ring=pts.map((p,i)=>i).filter(i=>Math.abs(pts[i][2])<1e-6);
  const legs=leg>0?ring.map(i=>[X[i],[X[i][0],X[i][1],0]]):[];
  // pyramids: apex outward from the triangle centroid; struts to edge midpoints
  const tKey=new Map(),tees=[],pstruts=[];
  tris.forEach(t=>{const c=[0,1,2].map(n=>(X[t.v[0]][n]+X[t.v[1]][n]+X[t.v[2]][n])/3);const d=[c[0],c[1],c[2]-leg],l=Math.hypot(...d);
    t.c=c;t.n=d.map(x=>x/l);t.apex=c.map((x,n)=>x+t.n[n]*peak);
    if(t.role!=="pyramid")return;
    t.v.forEach((a,i)=>{const b=t.v[(i+1)%3],k=a<b?a+","+b:b+","+a;
      if(!tKey.has(k)){tKey.set(k,tees.length);tees.push({p:X[a].map((c,n)=>(c+X[b][n])/2),dir:[0,1,2].map(n=>X[b][n]-X[a][n]),n:0})}
      const T=tees[tKey.get(k)];T.n++;pstruts.push([t.apex,T.p])})});
  const L=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]);
  const fam={short:{type:"short (hub to midpoint)",len:CF_SHORT*R,count:0},long:{type:"long (midpoint to midpoint)",len:CF_LONG*R,count:0}};
  edges.forEach(([a,b])=>fam[(kind[a]==="hub5"||kind[b]==="hub5")?"short":"long"].count++);
  Object.values(fam).forEach(f=>f.stick=f.len-HUB);
  const pl=pstruts.length?pstruts.reduce((s,[p,q])=>s+L(p,q),0)/pstruts.length:0;
  const families=[fam.short,fam.long,{type:"pyramid strut",len:pl,stick:null,count:pstruts.length,thin:true}];
  if(legs.length)families.push({type:"leg",len:leg,stick:null,count:legs.length});
  const wood=(families.reduce((s,f)=>s+(f.stick??f.len)*f.count,0))/100;
  const rc=x=>tris.filter(t=>t.role===x).length;
  const crownTip=Math.max(R+leg,...tris.filter(t=>t.role==="pyramid").map(t=>t.apex[2]));
  const tipR=Math.max(R,...tris.filter(t=>t.role==="pyramid").map(t=>Math.hypot(t.apex[0],t.apex[1])));
  return {o,R,pts:X,kind,used,tris,edges,legs,tees,pstruts,families,leg,peak,
    counts:{hub5:kind.filter((k,i)=>k==="hub5"&&used.has(i)).length,hub6:kind.filter((k,i)=>k==="hub6"&&used.has(i)).length,corner:kind.filter((k,i)=>k==="corner"&&used.has(i)).length,
      small:tris.length,pyramid:rc("pyramid"),flat:rc("flat"),entrance:rc("entrance"),stars:rc("pyramid")/5,
      struts:edges.length,legs:legs.length,peaks:rc("pyramid"),pstruts:pstruts.length,
      teeShort:tees.filter(t=>t.n===1).length,teeSide:tees.filter(t=>t.n===2).length,
      D:o.D,hubH:R+leg,tipH:crownTip,tipD:2*tipR,wood}};
}
root.SabatGeom={build,BUILT,HUB};
if(typeof module!=="undefined")module.exports={build,BUILT,HUB};
})(typeof window!=="undefined"?window:globalThis);
