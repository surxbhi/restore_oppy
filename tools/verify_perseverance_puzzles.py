"""Check every Secret in the Stripes puzzle, and count its fewest moves.

Run: python3 tools/verify_perseverance_puzzles.py      (exits 1 on any failure)

The real code (NASA parachute coding activity, p. 4): each letter is a 7-digit binary number,
A = 1 ... Z = 26; numbers are written as themselves. Place values 64 32 16 8 4 2 1.

Game rules (owner, 2026-11-14: "copy the stripes", no maths for the child):
- A puzzle shows one or more words of the real canopy. Some letters are blank: their 7 stripes
  start white. The child copies each blank letter's stripe pattern from the stripe key.
- A move is a tap on one stripe of a blank (white <-> orange), or OPEN.
- OPEN is judged on every blank. Success needs every blank to read its letter.
- Best moves = fewest taps to reach the answer (found by search) + 1 for OPEN.

Checks:
1. Each ring, decoded from its full answer, reads exactly the real text.
2. Every blank is a letter (1..26).
3. Each puzzle can be solved, and its best moves match the number in PUZZLES.
4. Best moves strictly rise from puzzle to puzzle.
"""
import sys
from collections import deque

VALUES = [64, 32, 16, 8, 4, 2, 1]
RINGS = {
    "DARE": ["D", "A", "R", "E"],
    "MIGHTY": ["M", "I", "G", "H", "T", "Y"],
    "THINGS": ["T", "H", "I", "N", "G", "S"],
    "JPL": [34, 11, 58, "N", 118, 10, 31, "W"],      # 34 11 58 N, 118 10 31 W (Figure 2)
}
PUZZLES = [   # (words shown, blanks as (word, letter index), best moves claimed in the design doc and the game)
    (["DARE"], [("DARE", 3)], 3),                                       # E
    (["THINGS"], [("THINGS", 0), ("THINGS", 2)], 5),                    # T, I
    (["MIGHTY"], [("MIGHTY", 0), ("MIGHTY", 5)], 7),                    # M, Y
    (["DARE", "MIGHTY", "THINGS"], [("DARE", 2), ("MIGHTY", 5), ("THINGS", 3)], 9),   # R, Y, N
]


def number(item):
    return item if isinstance(item, int) else ord(item) - 64


def bits(item):
    n = number(item)
    return tuple(int(b) for b in format(n, "07b"))


def decode(item_bits, as_letter):
    n = sum(v for v, b in zip(VALUES, item_bits) if b)
    if not as_letter:
        return n
    return chr(64 + n) if 1 <= n <= 26 else None


def fewest_taps(start, goal):
    """Breadth-first search over stripe states; one tap flips one stripe."""
    dist = {start: 0}
    q = deque([start])
    while q:
        s = q.popleft()
        if s == goal:
            return dist[s]
        for i in range(len(s)):
            n = s[:i] + (1 - s[i],) + s[i + 1:]
            if n not in dist:
                dist[n] = dist[s] + 1
                q.append(n)
    return None


def main():
    ok = True
    for name, items in RINGS.items():
        read = [decode(bits(it), isinstance(it, str)) for it in items]
        if read != items:
            print(f"FAIL ring {name}: decodes to {read}")
            ok = False
    last = 0
    for i, (words, blanks, claimed) in enumerate(PUZZLES, 1):
        for w, j in blanks:
            it = RINGS[w][j]
            if not isinstance(it, str) or not 1 <= number(it) <= 26:
                print(f"FAIL puzzle {i}: blank {it!r} is not a letter")
                ok = False
        goal = tuple(b for w, j in blanks for b in bits(RINGS[w][j]))
        start = tuple(0 for _ in goal)
        taps = fewest_taps(start, goal)
        if taps is None:
            print(f"FAIL puzzle {i}: cannot be solved")
            ok = False
            continue
        best = taps + 1
        shown = " ".join(RINGS[w][j] for w, j in blanks)
        print(f"puzzle {i}: {' '.join(words):20s} blanks {shown:6s} best {best:2d} moves")
        if best != claimed:
            print(f"FAIL puzzle {i}: best is {best}, design doc says {claimed}")
            ok = False
        if best <= last:
            print(f"FAIL puzzle {i}: best {best} does not rise above {last}")
            ok = False
        last = best
    print("OK" if ok else "FAILED")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
