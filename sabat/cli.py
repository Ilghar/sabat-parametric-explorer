import argparse, json, sys
from .core import dome, public, svg

def main(argv=None):
    p = argparse.ArgumentParser(prog="sabat", description="SÁBÁT geodesic module explorer")
    p.add_argument("spec", help="JSON pavilion spec")
    p.add_argument("--svg", help="write plan-view SVG here")
    a = p.parse_args(argv)
    try:
        r = dome(json.load(open(a.spec, encoding="utf-8")))
    except ValueError as e:
        print(f"invalid spec: {e}", file=sys.stderr); return 2
    print(json.dumps(public(r), indent=2, ensure_ascii=False))
    if a.svg:
        open(a.svg, "w", encoding="utf-8").write(svg(r))
    return 0
if __name__ == "__main__": sys.exit(main())
