"""
Generate synthetic Nanoscribe-style alignment-mark images for testing the
Aligned-Write Calculator.

Each mark is a single filled dark square; the tool finds each square's centre
by fitting all four sides. Marks are rendered with 4x supersampling so the
edges are anti-aliased and sit at true sub-pixel positions, then a Gaussian
blur (finite optical resolution) and Gaussian sensor noise are applied.

Outputs:
  calibration.png  -- reference marks (printer origin)
  target.png       -- same marks shifted (and slightly rotated)

Run:  python tools-dev/generate_marks.py
"""

import math
import os
import numpy as np
from PIL import Image, ImageDraw

# ---- scene parameters ---------------------------------------------------
W, H = 600, 600          # output image size (px)
SS = 4                   # supersampling factor for anti-aliased edges
L = 60                   # square side length (px)
DARK = 70                # mark grey level (0-255)
LIGHT = 205              # background grey level
BLUR_SIGMA = 1.6         # optical blur (px, in output resolution)
NOISE_SD = 9.0           # gaussian sensor noise std-dev (grey levels)
SEED = 12345

# calibration mark centres (px). A 2x2 grid, 300 px pitch.
CAL_CENTRES = [(150.0, 150.0), (450.0, 150.0),
               (150.0, 450.0), (450.0, 450.0)]
CAL_ROT_DEG = 0.0

# how the target sample sits relative to calibration
SHIFT = (37.3, -22.6)    # px translation applied to every mark
TARGET_ROT_DEG = 4.0     # extra rotation of the marks (degrees)


def square_polygon(cx, cy, length, theta):
    """Return one square mark (centred on cx,cy, side `length`) in SS coords."""
    ct, st = math.cos(theta), math.sin(theta)
    h = length / 2.0

    def rot(px, py):
        rx = px * ct - py * st + cx
        ry = px * st + py * ct + cy
        return (rx * SS, ry * SS)

    return [rot(-h, -h), rot(h, -h), rot(h, h), rot(-h, h)]


def render(centres, length, theta, blur_sigma, noise_sd, seed):
    """Render marks -> blurred, noisy uint8 grayscale array."""
    hi = Image.new("L", (W * SS, H * SS), color=LIGHT)
    d = ImageDraw.Draw(hi)
    for (cx, cy) in centres:
        d.polygon(square_polygon(cx, cy, length, theta), fill=DARK)

    # area-average downsample -> anti-aliased sub-pixel edges
    img = hi.resize((W, H), Image.Resampling.BOX)
    arr = np.asarray(img, dtype=np.float64)

    # optical blur
    from scipy.ndimage import gaussian_filter
    arr = gaussian_filter(arr, sigma=blur_sigma)

    # sensor noise
    rng = np.random.default_rng(seed)
    arr = arr + rng.normal(0.0, noise_sd, arr.shape)

    return np.clip(arr, 0, 255).astype(np.uint8)


def main():
    out_dir = os.path.dirname(os.path.abspath(__file__))

    # --- calibration ---
    cal = render(CAL_CENTRES, L, math.radians(CAL_ROT_DEG),
                 BLUR_SIGMA, NOISE_SD, SEED)
    Image.fromarray(cal, "L").save(os.path.join(out_dir, "calibration.png"))

    # --- target: shift every centre, add rotation ---
    sx, sy = SHIFT
    tgt_centres = [(cx + sx, cy + sy) for (cx, cy) in CAL_CENTRES]
    tgt = render(tgt_centres, L, math.radians(TARGET_ROT_DEG),
                 BLUR_SIGMA, NOISE_SD, SEED + 1)
    Image.fromarray(tgt, "L").save(os.path.join(out_dir, "target.png"))

    # --- ground truth ---
    cal_cx = sum(c[0] for c in CAL_CENTRES) / len(CAL_CENTRES)
    cal_cy = sum(c[1] for c in CAL_CENTRES) / len(CAL_CENTRES)
    print("Wrote calibration.png and target.png to", out_dir)
    print("\nGround truth")
    print("  square side                : %d px" % L)
    print("  nearest-neighbour pitch    : 300 px")
    print("  calibration mark centre    : (%.2f, %.2f) px" % (cal_cx, cal_cy))
    print("  target mark centre         : (%.2f, %.2f) px"
          % (cal_cx + sx, cal_cy + sy))
    print("  applied shift (target-cal) : (%.2f, %.2f) px" % (sx, sy))
    print("  applied rotation (target)  : %.2f deg" % TARGET_ROT_DEG)
    print("  blur sigma / noise sd      : %.1f px / %.1f levels"
          % (BLUR_SIGMA, NOISE_SD))
    print("\nIn the tool: set Mark size = %d px and pitch = 300" % L)
    print("(matching px units => scale 1 px/um), or your real pitch in um.")


if __name__ == "__main__":
    main()
