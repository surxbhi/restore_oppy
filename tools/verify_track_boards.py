"""Check every Track Detective board can be solved, and count its fewest moves.

Run: python3 tools/verify_track_boards.py

Legend: S start, X the rock to study, # other rock (any kind), . open sand.

Rules (owner decisions, 2026-11-14):
- Sojourner drives FORWARD one square the way it faces (F), or REVERSES one square backwards
  without turning (B), like the real rover. It turns on the spot: turn right (O) and turn left
  (P), a quarter turn each.
- Each board says which way Sojourner faces at the start (U, R, D or L).
- Its rock tool (APXS) is on its BACK, so it must park on an open square right next to X, with
  its BACK toward X, and then EXPLORE (I, the 🔍 key): the tool reaches out and studies the rock.
  Explore is a move, so it counts in the total (owner, 2026-11-14).
- Driving into a rock (# or X) or off the grid is a bump: the drive stops and the rover goes back.
"""
from collections import deque

BOARDS = {   # name: (rows, start facing). Best moves must rise: 3, 7, 10, 12 (with reverse and explore).
    "sojourner-1": (["....",
                     "S..X",
                     "....",
                     "...."], "L"),
    "sojourner-2": ([".....",
                     ".S#.X",
                     ".....",
                     ".#...",
                     "....."], "U"),
    "sojourner-3": (["S....",
                     "##.#.",
                     ".....",
                     "#.#..",
                     ".X..."], "R"),
    "sojourner-4": (["S.#...",
                     ".##.#.",
                     "...#..",
                     ".#....",
                     ".#.#X.",
                     "...#.."], "U"),
}
HEAD = "URDL"                                  # heading index 0..3, clockwise
DIRS = {"U": (0, -1), "R": (1, 0), "D": (0, 1), "L": (-1, 0)}


def solve(grid, facing):
    assert all(len(r) == len(grid[0]) for r in grid), "rows differ in length"
    cells = {(x, y): c for y, r in enumerate(grid) for x, c in enumerate(r)}
    start = next(p for p, c in cells.items() if c == "S")
    rock = next(p for p, c in cells.items() if c == "X")

    def step(s, a):
        x, y, h = s
        if a == "O":
            return (x, y, (h + 1) % 4)
        if a == "P":
            return (x, y, (h + 3) % 4)
        dx, dy = DIRS[HEAD[h]]
        if a == "B":
            dx, dy = -dx, -dy
        n = (x + dx, y + dy)
        return None if cells.get(n, "#") in "#X" else (n[0], n[1], h)

    def goal(s):
        dx, dy = DIRS[HEAD[(s[2] + 2) % 4]]      # the BACK points at the rock
        return (s[0] + dx, s[1] + dy) == rock

    s0 = (start[0], start[1], HEAD.index(facing))
    dist, ways, path = {s0: 0}, {s0: 1}, {s0: ""}
    q = deque([s0])
    while q:
        s = q.popleft()
        for a in "FBOP":
            n = step(s, a)
            if n is None:
                continue
            if n not in dist:
                dist[n], ways[n], path[n] = dist[s] + 1, ways[s], path[s] + a
                q.append(n)
            elif dist[n] == dist[s] + 1:
                ways[n] += ways[s]
    goals = [s for s in dist if goal(s)]
    if not goals:
        return None, 0, None
    best = min(dist[g] for g in goals)            # moves to park, then one more: explore (I)
    return best + 1, sum(ways[g] for g in goals if dist[g] == best), sorted(path[g] for g in goals if dist[g] == best)[0] + "I"


if __name__ == "__main__":
    ok, last = True, 0
    for name, (g, facing) in BOARDS.items():
        moves, routes, example = solve(g, facing)
        good = moves is not None and moves > last          # difficulty must keep rising
        ok &= good
        last = moves or last
        print(f"{name}: {len(g[0])}x{len(g)} start facing {facing} fewest={moves} "
              f"shortest_routes={routes} example={example} {'OK' if good else 'FAIL'}")
    raise SystemExit(0 if ok else 1)
