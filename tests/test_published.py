"""Regression against published Class I icosahedral 3V 5/8 dome tables.

Source (numbers only, no code copied): Desert Domes, "Dome Formulas",
https://desertdomes.com/formula.html, cross-checked with Domerama,
"Chord factor charts", http://www.domerama.com/calculators/chord-charts/
3V: A .34862, B .40355, C .41241; 5/8 dome = 30/55/80 struts,
connectors 15 four-way, 6 five-way, 40 six-way; bend angles 10.04/11.64/11.90 deg.
"""
import math, unittest
from sabat.core import dome, connector_table, public

PUBLISHED = {"A": (0.34862, 30), "B": (0.40355, 55), "C": (0.41241, 80)}

class Published3V(unittest.TestCase):
    def setUp(self):
        self.R = 100.0
        self.r = dome({"name": "ref", "frequency": 3, "diameter_cm": 2 * self.R, "height_cm": 2 * self.R * 0.625})

    def test_chord_factors_and_counts(self):
        fam = {f["id"]: f for f in self.r["strut_families"]}
        for k, (cf, n) in PUBLISHED.items():
            self.assertAlmostEqual(fam[k]["length_cm"] / self.R, cf, delta=0.0006)
            self.assertEqual(fam[k]["count"], n)

    def test_connectors_and_panels(self):
        self.assertEqual({c["valence"]: c["count"] for c in self.r["connectors_by_valence"]}, {4: 15, 5: 6, 6: 40})
        self.assertEqual(self.r["panels"], 105); self.assertEqual(self.r["nodes"], 61)

    def test_bend_angles_within_published_range(self):
        t = connector_table(self.r)
        lo = min(x["strut_elevation_deg"][0] for x in t); hi = max(x["strut_elevation_deg"][1] for x in t)
        self.assertAlmostEqual(lo, 10.04, delta=0.02); self.assertAlmostEqual(hi, 11.90, delta=0.02)

if __name__ == "__main__": unittest.main()
