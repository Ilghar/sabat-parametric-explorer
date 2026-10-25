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
        self.assertLessEqual(a["built_height_cm"], 260)
        self.assertEqual(sum(f["count"] for f in a["strut_families"]), a["struts"])
        self.assertEqual(len(a["strut_families"]), 3)  # 3V sphere has 3 strut lengths
    def test_invalid(self):
        for bad in ({}, {**SPEC, "frequency": 0}, {**SPEC, "height_cm": 999}, {**SPEC, "frequency": True}):
            with self.assertRaises(ValueError): dome(bad)
    def test_svg(self):
        s = svg(dome(SPEC)); self.assertIn("#4a3a5c", s); self.assertIn("ilghar.studio", s)

if __name__ == "__main__": unittest.main()
