"""Check every Phoenix case is fair and that difficulty keeps rising.

Run: python3 tools/verify_phoenix_cases.py      (exit 1 on any problem)

Cases live in prototype/phoenix-cases.json (the game inlines the same file). Checks:
- the vanished chunks (best taps) strictly rise from case to case;
- every chunk sits on an icy square, so digging really uncovers it, and not on the far wall;
- chunks, pebbles and the dug squares never overlap, so each tap has one clear answer;
- pebbles are on the trench floor (not on a rock square);
- lookalikes grow with difficulty: case 2 adds a pebble, case 3 a moving shadow, case 4 a growing pile;
- the start square can be dug, and the number of dig actions rises.
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT / "prototype" / "phoenix-cases.json").read_text())
TX, TY, TW, TH = DATA["trench"]
WALL = 6                         # the far wall's height at the top of the trench (not floor)
GAP = 12                         # minimum distance between two things you can tap
LAYERS = {"s": 1, "S": 2, "i": 1, "I": 1, "J": 2}
HARD = {"I", "J"}
ICY = {"i", "I", "J"}


def square_at(case, x, y):
    rows, cols = len(case["squares"]), len(case["squares"][0])
    if not (TX <= x < TX + TW and TY <= y < TY + TH):
        return None
    c, r = int((x - TX) * cols / TW), int((y - TY) * rows / TH)
    return case["squares"][r][c]


def dig_actions(case):
    """Fewest key presses to dig everything: one Dig per soil layer, Turn + Rasp for hard ice,
    moves between squares (visiting in reading order, a fair upper bound kept simple)."""
    sq = case["squares"]
    n = sum(LAYERS.get(ch, 0) for row in sq for ch in row)
    hard = sum(ch in HARD for row in sq for ch in row)
    diggable = sum(ch != "#" for row in sq for ch in row)
    return n + hard * 2 + (diggable - 1)


def main():
    ok, last_best, last_dig = True, 0, 0
    problems = []
    for k, case in enumerate(DATA["cases"]):
        cid = case["id"]
        cols = {len(r) for r in case["squares"]}
        if len(cols) != 1:
            problems.append(f"{cid}: rows differ in length")
        best = sum(c["fate"] == "gone" for c in case["chunks"])
        if best <= last_best:
            problems.append(f"{cid}: best taps {best} does not rise above {last_best}")
        last_best = best
        things = [(c["x"], c["y"], "chunk") for c in case["chunks"]] + [(p["x"], p["y"], "pebble") for p in case["pebbles"]]
        for c in case["chunks"]:
            s = square_at(case, c["x"], c["y"])
            if s not in ICY:
                problems.append(f"{cid}: chunk at {c['x']},{c['y']} is not on an icy square ({s})")
            if c["y"] < TY + WALL + 6:
                problems.append(f"{cid}: chunk at {c['x']},{c['y']} is on the far wall")
        for p in case["pebbles"]:
            if square_at(case, p["x"], p["y"]) in (None, "#"):
                problems.append(f"{cid}: pebble at {p['x']},{p['y']} is not on the trench floor")
        for i in range(len(things)):
            for j in range(i + 1, len(things)):
                a, b = things[i], things[j]
                if ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5 < GAP:
                    problems.append(f"{cid}: {a[2]} {a[:2]} and {b[2]} {b[:2]} are too close to tell apart")
        sc, sr = case["start"]
        if case["squares"][sr][sc] == "#":
            problems.append(f"{cid}: the scoop starts on a rock")
        want = [{"pebble": False, "shadow": False, "pile": False}, {"pebble": True, "shadow": False, "pile": False},
                {"pebble": True, "shadow": True, "pile": False}, {"pebble": True, "shadow": True, "pile": True}][min(k, 3)]
        have = {"pebble": bool(case["pebbles"]), "shadow": case["shadow"], "pile": case["pile"]}
        if have != want:
            problems.append(f"{cid}: lookalikes {have} should be {want}")
        if case["compare"] != ("side" if k < 2 else "blink"):
            problems.append(f"{cid}: compare should be {'side' if k < 2 else 'blink'}")
        dig = dig_actions(case)
        if dig <= last_dig:
            problems.append(f"{cid}: dig actions {dig} do not rise above {last_dig}")
        last_dig = dig
        print(f"{cid} ({case['name']}): {len(case['squares'][0])}x{len(case['squares'])} squares, "
              f"dig actions ~{dig}, best taps {best}, compare {case['compare']}, lookalikes "
              + (", ".join(n for n, v in have.items() if v) or "none"))
    for p in problems:
        print("FAIL", p)
        ok = False
    print("OK" if ok else "FAILED")
    raise SystemExit(0 if ok else 1)


if __name__ == "__main__":
    main()
