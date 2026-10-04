"""
Independent reference implementation of the physics rules (docs/TEST_PLAN.md §4).

Written from the formulas in docs/RULE_CATALOGUE.md, NOT translated from the TypeScript engine,
so that both can be checked against each other. Run locally:

    python3 tools/reference/reference.py

It rewrites tests/fixtures/reference.json. Regenerate only deliberately, with a reason in the
commit message.
"""

import itertools
import json
import math
from pathlib import Path

import numpy as np

C = 343.0
ROOM = {"W": 4.0, "L": 5.0, "H": 2.5}  # Room R


def mode_frequency(n, room, c=C):
    nx, ny, nz = n
    return (c / 2) * math.sqrt((nx / room["W"]) ** 2 + (ny / room["L"]) ** 2 + (nz / room["H"]) ** 2)


def all_modes(room, f_max, c=C, include_zero=False):
    modes = []
    for nx, ny, nz in itertools.product(range(40), range(40), range(40)):
        if (nx, ny, nz) == (0, 0, 0) and not include_zero:
            continue
        f = mode_frequency((nx, ny, nz), room, c)
        if f <= f_max:
            modes.append(((nx, ny, nz), f))
    return sorted(modes, key=lambda m: m[1])


def psi(n, p, room):
    return (
        math.cos(n[0] * math.pi * p[0] / room["W"])
        * math.cos(n[1] * math.pi * p[1] / room["L"])
        * math.cos(n[2] * math.pi * p[2] / room["H"])
    )


def butterworth_highpass(f, f6, order):
    # |H| = 1 / sqrt(1 + (fc/f)^(2n)); |H(f6)| = 1/2  =>  (fc/f6)^(2n) = 3
    fc = f6 * 3 ** (1 / (2 * order))
    return 1 / np.sqrt(1 + (fc / f) ** (2 * order))


def modal_response_db(room, sources, receiver, freqs, t60, f6, order, truncation):
    volume = room["W"] * room["L"] * room["H"]
    delta = 6.91 / t60
    omega = 2 * np.pi * freqs
    p = np.zeros(len(freqs), dtype=complex)
    for n, fn in all_modes(room, truncation * freqs[-1], include_zero=True):
        eps = np.prod([1 if i == 0 else 2 for i in n])
        k_n = volume / eps
        omega_n = 2 * np.pi * fn
        coupling = sum(psi(n, s, room) for s in sources) * psi(n, receiver, room)
        p += coupling / (k_n * (omega_n**2 - omega**2 + 2j * delta * omega_n))
    return 20 * np.log10(np.abs(p) * butterworth_highpass(freqs, f6, order))


def reflection_point_left_wall(s, r):
    # Mirror the source in x = 0; intersect the image→receiver line with x = 0.
    image = (-s[0], s[1], s[2])
    t = (0 - image[0]) / (r[0] - image[0])
    return tuple(image[i] + t * (r[i] - image[i]) for i in range(3))


def main():
    out = {}

    out["modes"] = [{"n": list(n), "f": f} for n, f in all_modes(ROOM, 120)]

    out["sbir"] = [{"d": d, "f": C / (4 * d)} for d in (0.3, 0.5, 1.0, 1.5)]

    s, r = (1.2, 1.0, 1.0), (2.0, 3.5, 1.0)
    point = reflection_point_left_wall(s, r)
    direct = math.dist(s, r)
    reflected = math.dist(s, point) + math.dist(point, r)
    out["reflection"] = {
        "source": s,
        "receiver": r,
        "point": point,
        "delayMs": (reflected - direct) / C * 1000,
        "levelDb": 20 * math.log10(direct / reflected),
    }

    out["schroeder"] = {"t60": 0.4, "V": 50, "f": 2000 * math.sqrt(0.4 / 50)}

    # Sabine per band for Room R: plaster-brick walls and ceiling, wood floor, furnishing 5 m² sabins
    # (×0.5 at 125 Hz, ×0.8 at 250 Hz). Coefficients copied from RULE_CATALOGUE Appendix A.
    plaster_brick = [0.14, 0.10, 0.06, 0.05, 0.04, 0.03]
    wood_floor = [0.15, 0.11, 0.10, 0.07, 0.06, 0.07]
    furnishing = [5 * f for f in (0.5, 0.8, 1, 1, 1, 1)]
    W, L, H = ROOM["W"], ROOM["L"], ROOM["H"]
    walls_ceiling = 2 * W * H + 2 * L * H + W * L
    floor = W * L
    volume = W * L * H
    out["sabine"] = [
        0.161 * volume / (walls_ceiling * a + floor * b + f)
        for a, b, f in zip(plaster_brick, wood_floor, furnishing)
    ]

    freqs = 20 * 2 ** (np.arange(0, int(math.log2(200 / 20) * 24) + 1) / 24)
    sources = [(1.0, 0.75, 0.8), (3.0, 0.75, 0.8)]
    receiver = (2.0, 3.2, 1.1)
    db = modal_response_db(ROOM, sources, receiver, freqs, t60=0.5, f6=50, order=4, truncation=1.5)
    out["bass"] = {
        "sources": sources,
        "receiver": receiver,
        "t60": 0.5,
        "f6": 50,
        "fMax": 200,
        "freqs": freqs.tolist(),
        "db": db.tolist(),
    }

    target = Path(__file__).resolve().parents[2] / "tests" / "fixtures" / "reference.json"
    target.write_text(json.dumps(out, indent=1) + "\n")
    print(f"wrote {target}")


if __name__ == "__main__":
    main()
