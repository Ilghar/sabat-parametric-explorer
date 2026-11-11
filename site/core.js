/* Faithful JS port of sabat/core.py (Ilghar/sabat-parametric-explorer @468752b):
   subdivide(), frame(), girih star, panel_proxies(). Same algorithm, same order. */
(function (root) {
const PHI = (1 + Math.sqrt(5)) / 2;
const norm = p => { const l = Math.hypot(p[0], p[1], p[2]); return [p[0]/l, p[1]/l, p[2]/l]; };
const r9 = x => Math.round(x * 1e9) / 1e9;
const pyRound = (x, n) => Number(x.toFixed(n));
function icosahedron() {
  const v = [[-1,PHI,0],[1,PHI,0],[-1,-PHI,0],[1,-PHI,0],[0,-1,PHI],[0,1,PHI],[0,-1,-PHI],[0,1,-PHI],[PHI,0,-1],[PHI,0,1],[-PHI,0,-1],[-PHI,0,1]];
  const f = [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  return [v.map(norm), f];
}
function rotToZ(pts, a) {
  let [ax, ay, az] = a; let kx = ay, ky = -ax; const s = Math.hypot(kx, ky), c = az;
  if (s < 1e-12) return pts; kx /= s; ky /= s;
  return pts.map(([x, y, z]) => { const kd = kx*x + ky*y; const cx = ky*z, cy = -kx*z, cz = kx*y - ky*x;
    return [x*c + cx*s + kx*kd*(1-c), y*c + cy*s + ky*kd*(1-c), z*c + cz*s]; });
}
function subdivide(freq) {
  if (!(Number.isInteger(freq) && freq >= 1 && freq <= 8)) throw new Error("frequency must be an int in 1..8");
  let [v, faces] = icosahedron(); v = rotToZ(v, v[0]);
  const key = new Map(), pts = [];
  const add = p => { p = norm(p); const k = p.map(c => Math.round(c * 1e9)).join(",");
    if (!key.has(k)) { key.set(k, pts.length); pts.push(p); } return key.get(k); };
  const tris = [];
  for (const [a, b, c] of faces) {
    const A = v[a], B = v[b], C = v[c], grid = {};
    for (let i = 0; i <= freq; i++) for (let j = 0; j <= freq - i; j++) { const k = freq - i - j;
      grid[i+","+j] = add([0,1,2].map(n => (A[n]*k + B[n]*i + C[n]*j) / freq)); }
    for (let i = 0; i < freq; i++) for (let j = 0; j < freq - i; j++) {
      tris.push([grid[i+","+j], grid[(i+1)+","+j], grid[i+","+(j+1)]]);
      if (i + j < freq - 1) tris.push([grid[(i+1)+","+j], grid[(i+1)+","+(j+1)], grid[i+","+(j+1)]]);
    }
  }
  return [pts, tris];
}
function label(i) { let s = ""; i += 1; while (i) { const r = (i - 1) % 26; i = Math.floor((i - 1) / 26); s = String.fromCharCode(65 + r) + s; } return s; }
function frame(spec) {
  const [pts, tris] = subdivide(spec.frequency);
  const R = spec.diameter_cm / 2, H = spec.height_cm, zcut = 1 - H / R;
  const cz = t => (pts[t[0]][2] + pts[t[1]][2] + pts[t[2]][2]) / 3;
  const cut = zc => { const k = tris.filter(t => cz(t) >= zc - 1e-9); if (!k.length) return [k, null];
    let mx = -Infinity, mn = Infinity; for (const t of k) for (const i of t) { mx = Math.max(mx, pts[i][2]); mn = Math.min(mn, pts[i][2]); }
    return [k, R * (mx - mn)]; };
  const cents = [...new Set(tris.map(t => r9(cz(t))))].sort((a, b) => a - b);
  let best = null;
  for (const zc of cents) { const [k, h] = cut(zc);
    if (h !== null && (best === null || Math.abs(h - H) < Math.abs(best[1] - H) - 1e-9)) best = [k, h]; }
  if (best && best[1] > 2 * H) throw new Error(`target height too small: the lowest panel row is ${best[1].toFixed(1)} cm tall`);
  const keep = best && best[1] >= 0.5 * H ? best[0] : cut(zcut)[0];
  if (!keep.length) throw new Error("no complete panel row fits");
  const es = new Set(); for (const t of keep) for (const [a, b] of [[t[0],t[1]],[t[1],t[2]],[t[0],t[2]]]) es.add(Math.min(a,b) + "," + Math.max(a,b));
  const edges = [...es].map(s => s.split(",").map(Number)).sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  const nodes = [...new Set(edges.flat())].sort((a, b) => a - b);
  const zmin = Math.min(...nodes.map(i => pts[i][2])), zmax = Math.max(...nodes.map(i => pts[i][2]));
  const dist = (p, q) => Math.hypot(p[0]-q[0], p[1]-q[1], p[2]-q[2]);
  const raw = edges.map(([a, b]) => R * dist(pts[a], pts[b])).sort((a, b) => a - b);
  const groups = [];
  for (const L of raw) { const g = groups[groups.length - 1];
    if (g && L - g[0] <= 1e-6 * Math.max(1, L)) g.push(L); else groups.push([L]); }
  const families = groups.map((g, i) => ({ id: label(i), length_cm: pyRound(g.reduce((s, x) => s + x, 0) / g.length, 1), count: g.length }));
  const val = {}; for (const [a, b] of edges) { val[a] = (val[a] || 0) + 1; val[b] = (val[b] || 0) + 1; }
  const conn = {}; for (const n of nodes) conn[val[n]] = (conn[val[n]] || 0) + 1;
  const real_h = pyRound(R * (zmax - zmin), 1);
  const idx = new Map(nodes.map((n, k) => [n, k]));
  return { name: spec.name, frequency: spec.frequency, diameter_cm: spec.diameter_cm, target_height_cm: H,
    built_height_cm: real_h, nodes: nodes.length, struts: edges.length, panels: keep.length,
    strut_families: families,
    connectors_by_valence: Object.keys(conn).map(Number).sort((a, b) => a - b).map(k => ({ valence: k, count: conn[k] })),
    total_strut_length_m: pyRound(families.reduce((s, f) => s + f.length_cm * f.count, 0) / 100, 2),
    _geom: { pts: nodes.map(i => pts[i].map(c => pyRound(R * c, 2))), idx, edges, tris: keep } };
}
const sub = (a, b) => a.map((x, i) => x - b[i]);
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
function area(p) { let s = [0,0,0]; for (let i = 1; i < p.length - 1; i++) { const c = cross(sub(p[i], p[0]), sub(p[i+1], p[0])); s = s.map((x, j) => x + c[j]); } return 0.5 * Math.sqrt(dot(s, s)); }
function panels(res) { const g = res._geom; return g.tris.map(t => t.map(i => g.pts[g.idx.get(i)])); }
function star(tri, k = 0.22, m_in = 0.62) { const d = tri[0].length; const c = [...Array(d)].map((_, j) => (tri[0][j] + tri[1][j] + tri[2][j]) / 3); const out = [];
  for (let i = 0; i < 3; i++) { const a = tri[i], b = tri[(i+1)%3]; const m = a.map((x, j) => (x + b[j]) / 2);
    out.push(a.map((x, j) => x + (c[j] - x) * k), m.map((x, j) => x + (c[j] - x) * m_in)); } return out; }
function panelProxies(res, k = 0.22) {
  const zf = Math.min(...res._geom.pts.map(p => p[2]));
  return panels(res).map((t, i) => { const a_p = area(t), a_s = area(star(t, k));
    const n = cross(sub(t[1], t[0]), sub(t[2], t[0])), nl = Math.sqrt(dot(n, n));
    const c = [0,1,2].map(j => (t[0][j] + t[1][j] + t[2][j]) / 3); const d = sub([0, 0, zf], c), dl = Math.sqrt(dot(d, d));
    const f = Math.abs(dot(n, d)) / (nl * dl), r = a_s / a_p;
    return { panel: i, infill_ratio: pyRound(r, 4), openness: pyRound(1 - r, 4), facing_centre: pyRound(f, 4), focus_proxy: pyRound(r * f, 4) }; });
}
function publicOut(r) { const o = {}; for (const k in r) if (!k.startsWith("_")) o[k] = r[k]; return o; }
const api = { subdivide, frame, star, panels, panelProxies, publicOut, pyRound };
if (typeof module !== "undefined") module.exports = api; else root.Sabat = api;
})(this);
