import json, unittest, math
from sabat.core import subdivide, frame, public, svg

SPEC = json.load(open("fixtures/sabat_pavilion.json", encoding="utf-8"))

class T(unittest.TestCase):
    def test_euler_sphere(self):
        for f in (1, 2, 3, 4):
            p, t = subdivide(f)
            self.assertEqual(len(p), 10 * f * f + 2); self.assertEqual(len(t), 20 * f * f)
    def test_full_sphere_valences(self):
        r = frame({"name": "s", "frequency": 2, "diameter_cm": 100, "height_cm": 100})
        self.assertEqual({c["valence"]: c["count"] for c in r["connectors_by_valence"]}, {5: 12, 6: 30})
    def test_pavilion_deterministic(self):
        a, b = public(frame(SPEC)), public(frame(SPEC))
        self.assertEqual(a, b)
        self.assertLessEqual(a["built_height_cm"], 260)
        self.assertEqual(sum(f["count"] for f in a["strut_families"]), a["struts"])
        self.assertEqual(len(a["strut_families"]), 3)  # 3V sphere has 3 strut lengths
    def test_invalid(self):
        for bad in ({}, {**SPEC, "frequency": 0}, {**SPEC, "height_cm": 999}, {**SPEC, "frequency": True}):
            with self.assertRaises(ValueError): frame(bad)
    def test_svg(self):
        s = svg(frame(SPEC)); self.assertIn("#473448", s); self.assertIn("ilghar.studio", s)

if __name__ == "__main__": unittest.main()

from sabat.core import girih_infill, geometry_json
class Infill(unittest.TestCase):
    def test_star_inside_triangle(self):
        t = ((0, 0, 0), (10, 0, 0), (5, 8, 0))
        st = girih_infill(t); self.assertEqual(len(st), 6)
        def inside(p):
            (x1,y1,_),(x2,y2,_),(x3,y3,_) = t
            d = (y2-y3)*(x1-x3)+(x3-x2)*(y1-y3)
            a = ((y2-y3)*(p[0]-x3)+(x3-x2)*(p[1]-y3))/d; b = ((y3-y1)*(p[0]-x3)+(x1-x3)*(p[1]-y3))/d
            return a > 0 and b > 0 and 1-a-b > 0
        self.assertTrue(all(inside(p) for p in st))
    def test_svg_has_one_infill_per_panel(self):
        r = frame(SPEC); self.assertEqual(svg(r).count("<polygon"), r["panels"])
    def test_geometry_json(self):
        g = geometry_json(frame(SPEC)); self.assertEqual(len(g["edges"]), 165); self.assertEqual(len(g["nodes"]), 61)

from sabat.core import panel_proxies, connector_table
class Proxies(unittest.TestCase):
    def test_proxy_ranges_and_determinism(self):
        r = frame(SPEC); p = panel_proxies(r)
        self.assertEqual(len(p), r["panels"]); self.assertEqual(p, panel_proxies(frame(SPEC)))
        for x in p:
            self.assertTrue(0 < x["infill_ratio"] < 1); self.assertAlmostEqual(x["infill_ratio"] + x["openness"], 1, places=3)
            self.assertTrue(0 <= x["facing_centre"] <= 1)
    def test_connector_table(self):
        r = frame(SPEC); t = connector_table(r)
        self.assertEqual({x["valence"]: x["count"] for x in t}, {c["valence"]: c["count"] for c in r["connectors_by_valence"]})
        six = [x for x in t if x["valence"] == 6][0]
        self.assertTrue(50 < six["angle_between_struts_deg"][0] <= 60 <= six["angle_between_struts_deg"][1] < 70)
        self.assertTrue(0 < six["strut_elevation_deg"][0] and six["strut_elevation_deg"][1] < 15)
    def test_full_sphere_gaps_sum_360(self):
        t = connector_table(frame({"name": "s", "frequency": 2, "diameter_cm": 100, "height_cm": 100}))
        five = [x for x in t if x["valence"] == 5][0]; self.assertTrue(five["angle_between_struts_deg"][1] < 73)

class StarShape(unittest.TestCase):
    def test_star_is_concave_tips_out_waists_in(self):
        t = ((0, 0, 0), (10, 0, 0), (5, 8.66, 0)); st = girih_infill(t)
        c = (5, 8.66 / 3); d = [math.dist(p, c) for p in st]
        self.assertTrue(min(d[0::2]) > 1.5 * max(d[1::2]))
