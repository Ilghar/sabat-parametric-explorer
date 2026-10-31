import pathlib, re, unittest
ROOT = pathlib.Path(__file__).resolve().parents[1]

class RetiredDarkValues(unittest.TestCase):
    """ilghar.studio src/styles.css (PR #1, round 3): dark --subtle #cbbdce, --line #a394ae."""
    def test_site_page_has_no_retired_dark_values(self):
        h = (ROOT / "site/index.html").read_text(encoding="utf-8")
        self.assertEqual(re.findall(r"#(?:9a8a9c|2c262f|4a424c)\b", h, re.I), [])
    def test_dark_tokens_match_the_studio_stylesheet(self):
        h = (ROOT / "site/index.html").read_text(encoding="utf-8")
        self.assertIn("--subtle:#cbbdce;", h); self.assertIn("--line:#a394ae", h)

if __name__ == "__main__": unittest.main()
