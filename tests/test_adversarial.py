import io, json, math, os, tempfile, unittest, contextlib
from sabat.core import dome, svg, _label
from sabat.cli import main
B = {"name": "t", "frequency": 3, "diameter_cm": 370, "height_cm": 230}

class Adv(unittest.TestCase):
    def test_freq8_labels(self):
        r = dome({**B, "frequency": 8, "height_cm": 370})
        ids = [f["id"] for f in r["strut_families"]]; self.assertEqual(len(ids), len(set(ids)))
        self.assertEqual(_label(25), "Z"); self.assertEqual(_label(26), "AA")
    def test_height_warning(self):
        self.assertTrue(dome({**B, "frequency": 1, "height_cm": 150})["warnings"])
        self.assertEqual(dome(B)["warnings"], [])
    def test_too_small_height(self):
        with self.assertRaisesRegex(ValueError, "too small"): dome({**B, "height_cm": 5})
    def test_bad_numbers(self):
        for k, v in (("diameter_cm", float("nan")), ("diameter_cm", float("inf")), ("diameter_cm", 1e12), ("diameter_cm", 1e-9), ("height_cm", float("nan"))):
            with self.assertRaises(ValueError): dome({**B, k: v})
    def test_svg_escapes_name(self):
        s = svg(dome({**B, "name": "<script>&"})); self.assertNotIn("<script>", s); self.assertIn("&lt;script&gt;&amp;", s)
    def _run(self, *a):
        e = io.StringIO()
        with contextlib.redirect_stderr(e), contextlib.redirect_stdout(io.StringIO()): code = main(list(a))
        return code, e.getvalue()
    def test_file_errors(self):
        c, e = self._run("/nonexistent.json"); self.assertEqual(c, 2); self.assertIn("cannot read", e)
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f: f.write("{bad")
        c, e = self._run(f.name); os.unlink(f.name); self.assertEqual(c, 2); self.assertIn("not valid JSON", e)
    def test_list_input(self):
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f: json.dump([B], f)
        c, e = self._run(f.name); os.unlink(f.name); self.assertEqual(c, 2); self.assertIn("JSON object", e)
    def test_length_grouping_robust(self):
        for d in (370, 370.0000001, 1234.5678):
            r = dome({**B, "diameter_cm": d, "height_cm": d * 0.625})
            self.assertEqual(len(r["strut_families"]), 3)

class Theme(unittest.TestCase):
    TOK = {"light": {"canvas": "#f3f1f6", "surface": "#fffcfe", "ink": "#473448", "accent": "#856a8e"},
           "dark": {"canvas": "#473448", "surface": "#5a535c", "ink": "#f4eef3", "accent": "#e8a8bc"}}
    @staticmethod
    def cr(a, b):
        def L(h):
            c = [int(h[i:i+2], 16) / 255 for i in (1, 3, 5)]
            c = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
            return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]
        a, b = sorted((L(a), L(b)), reverse=True); return (a + .05) / (b + .05)
    def test_wcag_aa_text_and_graphics(self):
        for t in self.TOK.values():
            self.assertGreaterEqual(self.cr(t["ink"], t["canvas"]), 4.5)   # body text
            self.assertGreaterEqual(self.cr(t["ink"], t["surface"]), 4.5)  # toggle button
        # front struts (non-text graphics, WCAG 1.4.11 >= 3:1): ink in light, accent in dark
        self.assertGreaterEqual(self.cr(self.TOK["light"]["ink"], self.TOK["light"]["canvas"]), 3)
        self.assertGreaterEqual(self.cr(self.TOK["dark"]["accent"], self.TOK["dark"]["canvas"]), 3)
    def test_page_has_toggle_and_tokens(self):
        h = open("site/index.html", encoding="utf-8").read()
        for needle in ("prefers-color-scheme", "localStorage", "aria-pressed", ".dark", "#473448", "var(--ink"):
            self.assertIn(needle, h)
    def test_svg_valid_xml_and_themeable(self):
        import xml.dom.minidom
        s = svg(dome(B)); xml.dom.minidom.parseString(s); self.assertIn("var(--canvas,#f3f1f6)", s)
