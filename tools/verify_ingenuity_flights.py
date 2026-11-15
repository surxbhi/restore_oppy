"""Check every Ingenuity flight can be solved, and count its fewest moves.

Run: python3 tools/verify_ingenuity_flights.py      (exit 1 on any failure)

Legend: S home airfield (start), A new airfield, . sand, R rock, ~ featureless ripples, a striped rock.

Rules (plans/INGENUITY-GAME-DESIGN.md, owner 2026-11-14):
- Moves: F fly forward one square the way it faces; L / R turn left / right 90 degrees on the spot;
  P photo: a picture of the square straight in front. Takeoff and landing are automatic.
- It can fly over sand, rocks and the striped rock. Ripples (nothing for the navigation camera to
  follow) and the board edge stop the flight.
- Goal: enough photos of the striped rock, each from a different square ("views"), then the plan ends
  over the right airfield ("land": S = home, A = new).
- Plan length is capped at best + 3 ("motor heat").
Checks:
- every flight can be solved;
- best moves strictly rise from flight to flight;
- the game's hint route solves its flight in exactly the best number of moves;
- "the shortcut": with the rocks inside the ripple field turned to ripples, the long way round
  is longer than the heat cap, so only the shortcut fits.
"""
import sys
from collections import deque

DX = {"U": (0, -1), "R": (1, 0), "D": (0, 1), "L": (-1, 0)}
HD = "URDL"

# Keep in step with FLIGHTS in prototype/ingenuity.template.html and section 6 of the design doc.
FLIGHTS = [
    {"id": "out-and-back", "rows": ["S.a"], "h0": "R", "views": 1, "land": "S", "best": 5, "hint": "FPLLF"},
    {"id": "new-airfield", "rows": ["S.R.", ".~aA"], "h0": "R", "views": 1, "land": "A", "best": 7, "hint": "FFFRFRP"},
    {"id": "science-scout", "rows": ["S...", ".Ra.", ".~.A"], "h0": "R", "views": 2, "land": "A", "best": 11, "hint": "FFRPFFLLPRF"},
    {"id": "shortcut", "rows": ["S~~~~.", ".R~~~.", ".RR~~.", ".~RRa.", ".~~~~A", "......"], "h0": "D",
     "views": 1, "land": "A", "best": 14, "hint": "FFLFFRFLFPFFRF", "stones": [(1, 1), (1, 2), (2, 2), (2, 3), (3, 3)]},
]


def parse(f):
    g = [list(r) for r in f["rows"]]
    w, h = len(g[0]), len(g)
    assert all(len(r) == w for r in g), f["id"] + ": ragged rows"
    start = next((x, y) for y in range(h) for x in range(w) if g[y][x] == "S")
    return g, w, h, start


def step(g, w, h, s, a):
    """One move from state (x, y, heading, views). None = the flight stops (ripples or edge)."""
    x, y, hd, views = s
    if a == "F":
        dx, dy = DX[hd]
        nx, ny = x + dx, y + dy
        if not (0 <= nx < w and 0 <= ny < h) or g[ny][nx] == "~":
            return None
        return (nx, ny, hd, views)
    if a in "LR":
        return (x, y, HD[(HD.index(hd) + (1 if a == "R" else 3)) % 4], views)
    dx, dy = DX[hd]
    tx, ty = x + dx, y + dy
    if 0 <= tx < w and 0 <= ty < h and g[ty][tx] == "a":
        return (x, y, hd, views | {(x, y)})
    return (x, y, hd, views)


def done(g, f, s):
    return len(s[3]) >= f["views"] and g[s[1]][s[0]] == f["land"]


def solve(f, rows=None):
    g, w, h, start = parse(dict(f, rows=rows or f["rows"]))
    s0 = (start[0], start[1], f["h0"], frozenset())
    prev, q = {s0: None}, deque([s0])
    while q:
        s = q.popleft()
        if done(g, f, s):
            path = []
            while prev[s]:
                s, a = prev[s]
                path.append(a)
            return "".join(reversed(path))
        for a in "FLRP":
            n = step(g, w, h, s, a)
            if n is not None:
                n = (n[0], n[1], n[2], frozenset(n[3]))
                if n not in prev:
                    prev[n] = (s, a)
                    q.append(n)
    return None


def run(f, plan):
    g, w, h, start = parse(f)
    s = (start[0], start[1], f["h0"], frozenset())
    for a in plan:
        s = step(g, w, h, s, a)
        if s is None:
            return False
    return done(g, f, s)


def main():
    ok, last = True, 0
    for f in FLIGHTS:
        p = solve(f)
        if p is None:
            print(f"FAIL {f['id']}: cannot be solved"); ok = False; continue
        n = len(p)
        msg = f"{f['id']}: best {n} ({p})"
        if n != f["best"]:
            msg += f"  FAIL: data says best {f['best']}"; ok = False
        if n <= last:
            msg += f"  FAIL: not harder than the flight before ({last})"; ok = False
        if not (len(f["hint"]) == n and run(f, f["hint"])):
            msg += f"  FAIL: hint route {f['hint']} does not solve it in {n}"; ok = False
        if "stones" in f:
            rows = [list(r) for r in f["rows"]]
            for x, y in f["stones"]:
                rows[y][x] = "~"
            around = solve(f, ["".join(r) for r in rows])
            cap = n + 3
            msg += f"; the long way round: {len(around) if around else 'none'} (heat cap {cap})"
            if around and len(around) <= cap:
                msg += "  FAIL: the long way fits under the cap"; ok = False
        print(msg)
        last = n
    print("OK" if ok else "FAILED")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
