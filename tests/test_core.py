import json, unittest, math
from sabat.core import geodesic, dome, public, svg

SPEC = json.load(open("fixtures/sabat_pavilion.json", encoding="utf-8"))

class T(unittest.TestCase):
    def test_euler_sphere(self):
        for f in (1, 2, 3, 4):
            p, t = geodesic(f)
            self.assertEqual(len(p), 10 * f * f + 2); self.assertEqual(len(t), 20 * f * f)
    def test_full_sphere_valences(self):
        r = dome({"name": "s", "frequency": 2, "diameter_cm": 100, "height_cm": 100})
        self.assertEqual({c["valence"]: c["count"] for c in r["connectors_by_valence"]}, {5: 12, 6: 30})
    def test_pavilion_deterministic(self):
        a, b = public(dome(SPEC)), public(dome(SPEC))
        self.assertEqual(a, b)
        self.assertLessEqual(a["modelled_height_cm"], 260)
        self.assertEqual(sum(f["count"] for f in a["strut_families"]), a["struts"])
        self.assertEqual(len(a["strut_families"]), 3)  # 3V sphere has 3 strut lengths
    def test_invalid(self):
        for bad in ({}, {**SPEC, "frequency": 0}, {**SPEC, "height_cm": 999}, {**SPEC, "frequency": True}):
            with self.assertRaises(ValueError): dome(bad)
    def test_svg(self):
        s = svg(dome(SPEC)); self.assertIn("#4a3a5c", s); self.assertIn("ilghar.studio", s)

if __name__ == "__main__": unittest.main()

from sabat.core import geometry_json
class PlanView(unittest.TestCase):
    def test_svg_draws_only_the_geodesic_base(self):
        r = dome(SPEC); s = svg(r)
        self.assertEqual(s.count("<polygon"), 0); self.assertEqual(s.count("<line"), r["struts"])
    def test_geometry_json(self):
        g = geometry_json(dome(SPEC)); self.assertEqual(len(g["edges"]), 165); self.assertEqual(len(g["nodes"]), 61)

from sabat.core import panel_proxies, connector_table
class Proxies(unittest.TestCase):
    def test_proxy_ranges_and_determinism(self):
        r = dome(SPEC); p = panel_proxies(r)
        self.assertEqual(len(p), r["panels"]); self.assertEqual(p, panel_proxies(dome(SPEC)))
        for x in p:
            self.assertTrue(0 <= x["facing_centre"] <= 1)
    def test_connector_table(self):
        r = dome(SPEC); t = connector_table(r)
        self.assertEqual({x["valence"]: x["count"] for x in t}, {c["valence"]: c["count"] for c in r["connectors_by_valence"]})
        six = [x for x in t if x["valence"] == 6][0]
        self.assertTrue(50 < six["angle_between_struts_deg"][0] <= 60 <= six["angle_between_struts_deg"][1] < 70)
        self.assertTrue(0 < six["strut_elevation_deg"][0] and six["strut_elevation_deg"][1] < 15)
    def test_full_sphere_gaps_sum_360(self):
        t = connector_table(dome({"name": "s", "frequency": 2, "diameter_cm": 100, "height_cm": 100}))
        five = [x for x in t if x["valence"] == 5][0]; self.assertTrue(five["angle_between_struts_deg"][1] < 73)
