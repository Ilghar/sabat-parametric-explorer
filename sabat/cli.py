import argparse, json, sys
from .core import frame, public, svg, panel_proxies, connector_table

def main(argv=None):
    p = argparse.ArgumentParser(prog="sabat", description="SÁBÁT structure explorer")
    p.add_argument("spec", help="JSON pavilion spec")
    p.add_argument("--svg", help="write plan-view SVG here")
    a = p.parse_args(argv)
    try:
        with open(a.spec, encoding="utf-8") as fh: spec = json.load(fh)
    except OSError as e:
        print(f"cannot read spec: {e.strerror}: {a.spec}", file=sys.stderr); return 2
    except json.JSONDecodeError as e:
        print(f"spec is not valid JSON: {e}", file=sys.stderr); return 2
    try:
        r = frame(spec)
    except ValueError as e:
        print(f"invalid spec: {e}", file=sys.stderr); return 2
    out = public(r); out["connector_table"] = connector_table(r)
    pp = panel_proxies(r); out["panel_proxy_HEURISTIC"] = {"note": "geometric heuristic, not a measured acoustic result", "mean_openness": round(sum(x["openness"] for x in pp)/len(pp),4), "mean_facing_centre": round(sum(x["facing_centre"] for x in pp)/len(pp),4), "panels": pp}
    for w in r["warnings"]: print(f"warning: {w}", file=sys.stderr)
    print(json.dumps(out, indent=2, ensure_ascii=False))
    if a.svg:
        open(a.svg, "w", encoding="utf-8").write(svg(r))
    return 0
if __name__ == "__main__": sys.exit(main())
