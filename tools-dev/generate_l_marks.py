"""
Generate synthetic L-mark alignment images for testing the Aligned-Write
Calculator's L-mark concept.

Each mark is a right-angle L bracket whose INNER corner points toward the
centre of the pattern. The fiducial point of each L is that inner corner,
recovered by fitting the two inner edges and intersecting them. The four
inner corners form a square; their centroid is the pattern centre.

This multi-scale design works at low and high magnification: at 20x all four
L's are visible (centroid -> coarse centre); at 100x even one or two inner
corners still pin the location precisely.

Rendered with 4x supersampling (true sub-pixel edges), then Gaussian optical
blur and Gaussian sensor noise.

Outputs:
  l-calibration.png  -- reference marks (printer origin)
  l-target.png       -- same marks shifted (and slightly rotated)

Run:  python tools-dev/generate_l_marks.py
"""

import math
import os
import numpy as np
from PIL import Image, ImageDraw

# ---- scene parameters ---------------------------------------------------
W, H = 600, 600          # output image size (px)
SS = 4                   # supersampling factor
ARM = 55                 # length of each L arm (px)
WD = 14                  # arm thickness (px)
R = 120                  # inner-corner distance from centre along each axis (px)
DARK = 70                # mark grey level
LIGHT = 205              # background grey level
BLUR_SIGMA = 1.6         # optical blur (px)
NOISE_SD = 9.0           # gaussian sensor noise std-dev (grey levels)
SEED = 12345

CENTRE = (300.0, 300.0)
CAL_ROT_DEG = 0.0

SHIFT = (37.3, -22.6)    # px translation of every mark (target vs calibration)
TARGET_ROT_DEG = 4.0     # extra rotation of the marks (degrees)

# Four L's. Each entry: inner-corner offset from centre (unrotated) and the
# two OUTWARD arm directions (unit, perpendicular). Corner points toward centre.
LMARKS = [
    ((-R, -R), (-1, 0), (0, -1)),   # top-left
    ((+R, -R), (+1, 0), (0, -1)),   # top-right
    ((-R, +R), (-1, 0), (0, +1)),   # bottom-left
    ((+R, +R), (+1, 0), (0, +1)),   # bottom-right
]


def rot(vx, vy, theta):
    c, s = math.cos(theta), math.sin(theta)
    return (vx * c - vy * s, vx * s + vy * c)


def l_bars(cx, cy, corner, a, b, theta):
    """Return the two bar polygons (SS coords) of one L bracket.

    corner: inner-corner offset from centre (unrotated)
    a, b:   outward arm unit directions (unrotated, perpendicular)
    """
    # inner corner position (rotated about centre, translated by shift via cx,cy)
    px, py = rot(corner[0], corner[1], theta)
    P = (cx + px, cy + py)
    ax, ay = rot(a[0], a[1], theta)
    bx, by = rot(b[0], b[1], theta)

    def bar(ux, uy, vx, vy):
        # rectangle {P + s*u (0..ARM) + t*v (0..WD)}
        c0 = P
        c1 = (P[0] + ARM * ux, P[1] + ARM * uy)
        c2 = (P[0] + ARM * ux + WD * vx, P[1] + ARM * uy + WD * vy)
        c3 = (P[0] + WD * vx, P[1] + WD * vy)
        return [(x * SS, y * SS) for (x, y) in (c0, c1, c2, c3)]

    bar1 = bar(ax, ay, bx, by)   # arm along a, thickness toward b
    bar2 = bar(bx, by, ax, ay)   # arm along b, thickness toward a
    return bar1, bar2


def render(centre, theta, blur_sigma, noise_sd, seed):
    hi = Image.new("L", (W * SS, H * SS), color=LIGHT)
    d = ImageDraw.Draw(hi)
    for (corner, a, b) in LMARKS:
        b1, b2 = l_bars(centre[0], centre[1], corner, a, b, theta)
        d.polygon(b1, fill=DARK)
        d.polygon(b2, fill=DARK)

    img = hi.resize((W, H), Image.Resampling.BOX)
    arr = np.asarray(img, dtype=np.float64)

    from scipy.ndimage import gaussian_filter
    arr = gaussian_filter(arr, sigma=blur_sigma)

    rng = np.random.default_rng(seed)
    arr = arr + rng.normal(0.0, noise_sd, arr.shape)
    return np.clip(arr, 0, 255).astype(np.uint8)


def corner_positions(centre, theta):
    out = []
    for (corner, _a, _b) in LMARKS:
        px, py = rot(corner[0], corner[1], theta)
        out.append((centre[0] + px, centre[1] + py))
    return out


def main():
    out_dir = os.path.dirname(os.path.abspath(__file__))

    cal = render(CENTRE, math.radians(CAL_ROT_DEG), BLUR_SIGMA, NOISE_SD, SEED)
    Image.fromarray(cal, "L").save(os.path.join(out_dir, "l-calibration.png"))

    sx, sy = SHIFT
    tgt_centre = (CENTRE[0] + sx, CENTRE[1] + sy)
    tgt = render(tgt_centre, math.radians(TARGET_ROT_DEG),
                 BLUR_SIGMA, NOISE_SD, SEED + 1)
    Image.fromarray(tgt, "L").save(os.path.join(out_dir, "l-target.png"))

    print("Wrote l-calibration.png and l-target.png to", out_dir)
    print("\nGround truth")
    print("  arm length / thickness     : %d / %d px" % (ARM, WD))
    print("  inner-corner pitch         : %d px (2R)" % (2 * R))
    print("  calibration centre         : (%.2f, %.2f) px" % CENTRE)
    print("  target centre              : (%.2f, %.2f) px"
          % (CENTRE[0] + sx, CENTRE[1] + sy))
    print("  applied shift (target-cal) : (%.2f, %.2f) px" % (sx, sy))
    print("  applied rotation (target)  : %.2f deg" % TARGET_ROT_DEG)
    print("  blur sigma / noise sd      : %.1f px / %.1f levels"
          % (BLUR_SIGMA, NOISE_SD))
    print("  calibration inner corners  :")
    for i, (x, y) in enumerate(corner_positions(CENTRE, 0.0)):
        print("      L%d: (%.2f, %.2f)" % (i + 1, x, y))


if __name__ == "__main__":
    main()
