"""Geodesic module generator for the SÁBÁT pavilion (stdlib only).

Builds a frequency-v icosahedral geodesic sphere, cuts it to a dome of a
target height/diameter, groups struts into length families (=modules to
fabricate) and counts node valences (=3D-printed / machined connectors).
"""
import json, math

PHI = (1 + 5 ** 0.5) / 2

def _norm(p):
    l = math.sqrt(sum(c * c for c in p)); return tuple(c / l for c in p)

def icosahedron():
    v = [(-1, PHI, 0), (1, PHI, 0), (-1, -PHI, 0), (1, -PHI, 0), (0, -1, PHI), (0, 1, PHI),
         (0, -1, -PHI), (0, 1, -PHI), (PHI, 0, -1), (PHI, 0, 1), (-PHI, 0, -1), (-PHI, 0, 1)]
    f = [(0,11,5),(0,5,1),(0,1,7),(0,7,10),(0,10,11),(1,5,9),(5,11,4),(11,10,2),(10,7,6),(7,1,8),
         (3,9,4),(3,4,2),(3,2,6),(3,6,8),(3,8,9),(4,9,5),(2,4,11),(6,2,10),(8,6,7),(9,8,1)]
    # rotate so a vertex points up (z): vertex 0 direction -> z
    return [_norm(p) for p in v], f

def _rot_to_z(pts, a):
    ax, ay, az = a
    # rotation axis = a x z
    kx, ky = ay, -ax; s = math.hypot(kx, ky); c = az
    if s < 1e-12: return pts
    kx, ky = kx / s, ky / s
    out = []
    for x, y, z in pts:
        kd = kx * x + ky * y
        cx, cy, cz = ky * z, -kx * z, kx * y - ky * x  # k x p
        out.append((x * c + cx * s + kx * kd * (1 - c), y * c + cy * s + ky * kd * (1 - c), z * c + cz * s))
    return out

def geodesic(freq):
    if not (isinstance(freq, int) and 1 <= freq <= 8):
        raise ValueError("frequency must be an int in 1..8")
    v, faces = icosahedron()
    v = _rot_to_z(v, v[0])
    key = {}; pts = []
    def add(p):
        p = _norm(p); k = tuple(round(c, 9) for c in p)
        if k not in key: key[k] = len(pts); pts.append(p)
        return key[k]
    tris = []
    for a, b, c in faces:
        A, B, C = v[a], v[b], v[c]; grid = {}
        for i in range(freq + 1):
            for j in range(freq + 1 - i):
                k = freq - i - j
                grid[i, j] = add(tuple((A[n] * k + B[n] * i + C[n] * j) / freq for n in range(3)))
        for i in range(freq):
            for j in range(freq - i):
                tris.append((grid[i, j], grid[i + 1, j], grid[i, j + 1]))
                if i + j < freq - 1:
                    tris.append((grid[i + 1, j], grid[i + 1, j + 1], grid[i, j + 1]))
    return pts, tris

def dome(spec):
    validate(spec)
    pts, tris = geodesic(spec["frequency"])
    R = spec["diameter_cm"] / 2
    zcut = 1 - spec["height_cm"] / R  # dome measured from apex down
    keep = [t for t in tris if sum(pts[i][2] for i in t) / 3 >= zcut - 1e-9]
    edges = sorted({tuple(sorted((a, b))) for t in keep for a, b in ((t[0], t[1]), (t[1], t[2]), (t[0], t[2]))})
    nodes = sorted({i for e in edges for i in e})
    zmin = min(pts[i][2] for i in nodes)
    fam = {}
    for a, b in edges:
        L = round(R * math.dist(pts[a], pts[b]), 1); fam[L] = fam.get(L, 0) + 1
    labels = "ABCDEFGHIJKLMNOP"
    families = [{"id": labels[i], "length_cm": L, "count": fam[L]} for i, L in enumerate(sorted(fam))]
    val = {}
    for a, b in edges:
        val[a] = val.get(a, 0) + 1; val[b] = val.get(b, 0) + 1
    conn = {}
    for n in nodes: conn[val[n]] = conn.get(val[n], 0) + 1
    real_h = round(R * (max(pts[i][2] for i in nodes) - zmin), 1)
    return {
        "name": spec["name"], "frequency": spec["frequency"],
        "diameter_cm": spec["diameter_cm"], "target_height_cm": spec["height_cm"],
        "built_height_cm": real_h, "nodes": len(nodes), "struts": len(edges), "panels": len(keep),
        "strut_families": families,
        "connectors_by_valence": [{"valence": k, "count": conn[k]} for k in sorted(conn)],
        "total_strut_length_m": round(sum(f["length_cm"] * f["count"] for f in families) / 100, 2),
        "_geom": {"pts": [tuple(round(R * c, 2) for c in pts[i]) for i in nodes],
                  "idx": {n: k for k, n in enumerate(nodes)}, "edges": edges, "tris": keep},
    }

REQUIRED = {"name": str, "frequency": int, "diameter_cm": (int, float), "height_cm": (int, float)}

def validate(spec):
    errs = []
    for k, t in REQUIRED.items():
        if k not in spec: errs.append(f"missing {k}")
        elif not isinstance(spec[k], t) or isinstance(spec[k], bool): errs.append(f"{k}: wrong type")
    if not errs:
        if not 1 <= spec["frequency"] <= 8: errs.append("frequency must be 1..8")
        if spec["diameter_cm"] <= 0: errs.append("diameter_cm must be > 0")
        if not 0 < spec["height_cm"] <= spec["diameter_cm"]: errs.append("height_cm must be in (0, diameter]")
    if errs: raise ValueError("; ".join(errs))

def geometry_json(result):
    g = result["_geom"]
    return {"nodes": g["pts"], "edges": [[g["idx"][a], g["idx"][b]] for a, b in g["edges"]]}

def public(result):
    return {k: v for k, v in result.items() if not k.startswith("_")}

PALETTE = {"canvas": "#f3f1f6", "plum": "#4a3a5c", "rose": "#c97a98", "mauve": "#a394ae"}

def svg(result, size=520):
    g = result["_geom"]; R = result["diameter_cm"] / 2; s = (size - 80) / (2 * R); c = size / 2
    lines = []
    for a, b in g["edges"]:
        (x1, y1, z1), (x2, y2, z2) = g["pts"][g["idx"][a]], g["pts"][g["idx"][b]]
        col = PALETTE["rose"] if (z1 + z2) / 2 > R * 0.5 else PALETTE["plum"]
        lines.append(f'<line x1="{c+x1*s:.1f}" y1="{c-y1*s:.1f}" x2="{c+x2*s:.1f}" y2="{c-y2*s:.1f}" stroke="{col}" stroke-width="1.4"/>')
    inf = []
    for k, t in enumerate(_panels(result)):
        pts = " ".join(f"{c+x*s:.1f},{c-y*s:.1f}" for x, y in girih_infill(t))
        col = PALETTE["rose"] if k % 2 else PALETTE["mauve"]
        inf.append(f'<polygon points="{pts}" fill="{col}" fill-opacity="0.16" stroke="{col}" stroke-width="0.5" stroke-linejoin="miter"/>')
    lines = inf + lines
    nodes = "".join(f'<circle cx="{c+x*s:.1f}" cy="{c-y*s:.1f}" r="2.4" fill="{PALETTE["mauve"]}"/>' for x, y, _ in g["pts"])
    title = f'{result["name"]} · {result["frequency"]}V · Ø{result["diameter_cm"]:g} cm'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}">'
            f'<rect width="100%" height="100%" fill="{PALETTE["canvas"]}"/>' + "".join(lines) + nodes +
            f'<text x="24" y="{size-20}" font-family="Jost, sans-serif" font-size="14" fill="{PALETTE["plum"]}">{title} — ilghar.studio</text></svg>')

def _panels(result):
    g = result["_geom"]; P = g["pts"]; I = g["idx"]
    return [tuple(P[I[i]] for i in t) for t in g["tris"]]

def girih_infill(tri, k=0.22, m_in=0.62):
    """Six-point star inscribed in a triangle, built from first principles:
    edge midpoints and points pulled toward the centroid alternate to form a
    star polygon (the triangular unit of a 6-fold girih rosette)."""
    cx = sum(p[0] for p in tri) / 3; cy = sum(p[1] for p in tri) / 3
    out = []
    for i in range(3):
        a, b = tri[i], tri[(i + 1) % 3]
        m = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
        v = (a[0] + (cx - a[0]) * k, a[1] + (cy - a[1]) * k)  # tip toward vertex
        out += [v, (m[0] + (cx - m[0]) * m_in, m[1] + (cy - m[1]) * m_in)]  # waist toward centre
    return out  # 6 vertices, alternating vertex-point / midpoint-point

def _sub(a, b): return tuple(x - y for x, y in zip(a, b))
def _cross(a, b): return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])
def _dot(a, b): return sum(x * y for x, y in zip(a, b))
def _area(pts):  # planar polygon area in 3D via fan
    s = (0.0, 0.0, 0.0)
    for i in range(1, len(pts) - 1):
        c = _cross(_sub(pts[i], pts[0]), _sub(pts[i + 1], pts[0])); s = tuple(x + y for x, y in zip(s, c))
    return 0.5 * math.sqrt(_dot(s, s))

def panel_proxies(result, k=0.22):
    """HEURISTIC, NOT A MEASURED ACOUSTIC RESULT.
    infill_ratio  = star area / panel area (share of panel that is mosaic infill)
    openness      = 1 - infill_ratio (geometric open share of the panel)
    facing_centre = |cos| between panel normal and the direction to the floor
                    centre of the dome (1 = panel faces the listener spot)
    focus_proxy   = infill_ratio * facing_centre (a rough reflection-focus flag)"""
    out = []; zfloor = min(p[2] for p in result["_geom"]["pts"])
    for i, t in enumerate(_panels(result)):
        star = _star3d(t, k)
        a_p, a_s = _area(t), _area(star)
        n = _cross(_sub(t[1], t[0]), _sub(t[2], t[0])); nl = math.sqrt(_dot(n, n))
        c = tuple(sum(p[j] for p in t) / 3 for j in range(3))
        d = _sub((0.0, 0.0, zfloor), c); dl = math.sqrt(_dot(d, d))
        f = abs(_dot(n, d)) / (nl * dl)
        r = a_s / a_p
        out.append({"panel": i, "infill_ratio": round(r, 4), "openness": round(1 - r, 4),
                    "facing_centre": round(f, 4), "focus_proxy": round(r * f, 4)})
    return out

def _star3d(tri, k, m_in=0.62):
    c = tuple(sum(p[j] for p in tri) / 3 for j in range(3)); out = []
    for i in range(3):
        a, b = tri[i], tri[(i + 1) % 3]
        m = tuple((a[j] + b[j]) / 2 for j in range(3))
        out += [tuple(a[j] + (c[j] - a[j]) * k for j in range(3)),
                tuple(m[j] + (c[j] - m[j]) * m_in for j in range(3))]
    return out

def connector_table(result):
    """Per hub valence: strut elevation below the hub's tangent plane
    (degrees) and the angles between consecutive struts around the hub."""
    g = result["_geom"]; P = g["pts"]; I = g["idx"]; nb = {}
    for a, b in g["edges"]:
        nb.setdefault(a, []).append(b); nb.setdefault(b, []).append(a)
    hubs = {}
    for n, ns in nb.items():
        p = P[I[n]]; pl = math.sqrt(_dot(p, p)); u = tuple(x / pl for x in p)
        ref = _cross(u, (1, 0, 0) if abs(u[0]) < 0.9 else (0, 1, 0)); ref2 = _cross(u, ref)
        els, az = [], []
        for m in ns:
            d = _sub(P[I[m]], p); dl = math.sqrt(_dot(d, d))
            els.append(math.degrees(math.asin(max(-1, min(1, -_dot(d, u) / dl)))))
            az.append(math.atan2(_dot(d, ref2), _dot(d, ref)))
        az.sort(); gaps = [math.degrees((az[(i + 1) % len(az)] - az[i]) % (2 * math.pi)) for i in range(len(az))]
        h = hubs.setdefault(len(ns), {"count": 0, "elev": [], "gap": []})
        h["count"] += 1; h["elev"] += els; h["gap"] += gaps
    return [{"valence": v, "count": h["count"],
             "strut_elevation_deg": [round(min(h["elev"]), 2), round(max(h["elev"]), 2)],
             "angle_between_struts_deg": [round(min(h["gap"]), 2), round(max(h["gap"]), 2)]}
            for v, h in sorted(hubs.items())]
