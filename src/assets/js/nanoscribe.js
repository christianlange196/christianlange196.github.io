/* ============================================================
   Nanoscribe GT2 Aligned-Write Calculator
   Pure client-side. Sub-pixel alignment-mark detection via
   edge-line intersection of checkerboard X-junctions.
   ============================================================ */
(function () {
  "use strict";

  const app = document.querySelector(".ns-app");
  if (!app) return;

  /* ---------- small math / image helpers ---------- */

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function bilinear(g, w, h, x, y) {
    x = clamp(x, 0, w - 1); y = clamp(y, 0, h - 1);
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const x1 = Math.min(x0 + 1, w - 1), y1 = Math.min(y0 + 1, h - 1);
    const fx = x - x0, fy = y - y0;
    const a = g[y0 * w + x0], b = g[y0 * w + x1];
    const c = g[y1 * w + x0], d = g[y1 * w + x1];
    return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy;
  }

  function toGray(imageData) {
    const { data, width: w, height: h } = imageData;
    const g = new Float32Array(w * h);
    for (let i = 0, p = 0; i < g.length; i++, p += 4) {
      // Rec. 601 luma, normalised 0..1
      g[i] = (0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]) / 255;
    }
    return { gray: g, w, h };
  }

  function gaussianBlur(src, w, h, sigma) {
    const radius = Math.max(1, Math.ceil(sigma * 3));
    const k = new Float32Array(2 * radius + 1);
    let sum = 0;
    for (let i = -radius; i <= radius; i++) {
      const v = Math.exp(-(i * i) / (2 * sigma * sigma));
      k[i + radius] = v; sum += v;
    }
    for (let i = 0; i < k.length; i++) k[i] /= sum;

    const tmp = new Float32Array(w * h);
    const out = new Float32Array(w * h);
    // horizontal
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let acc = 0;
        for (let i = -radius; i <= radius; i++) {
          acc += k[i + radius] * src[y * w + clamp(x + i, 0, w - 1)];
        }
        tmp[y * w + x] = acc;
      }
    }
    // vertical
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let acc = 0;
        for (let i = -radius; i <= radius; i++) {
          acc += k[i + radius] * tmp[clamp(y + i, 0, h - 1) * w + x];
        }
        out[y * w + x] = acc;
      }
    }
    return out;
  }

  /* ---------- global mark orientation (mod 90 deg) ---------- */

  function globalOrientation(blur, w, h) {
    const NB = 180; // bins over 0..pi/2
    const hist = new Float64Array(NB);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const gx = blur[y * w + x + 1] - blur[y * w + x - 1];
        const gy = blur[(y + 1) * w + x] - blur[(y - 1) * w + x];
        const mag = Math.hypot(gx, gy);
        if (mag < 0.01) continue;
        let a = Math.atan2(gy, gx);          // -pi..pi
        a = ((a % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2); // fold to 0..pi/2
        const bin = Math.min(NB - 1, Math.floor((a / (Math.PI / 2)) * NB));
        hist[bin] += mag;
      }
    }
    // peak with parabolic + neighbourhood weighting (circular over 0..pi/2)
    let best = 0;
    for (let i = 1; i < NB; i++) if (hist[i] > hist[best]) best = i;
    let num = 0, den = 0;
    for (let d = -3; d <= 3; d++) {
      const idx = ((best + d) % NB + NB) % NB;
      const wgt = hist[idx];
      num += wgt * (best + d);
      den += wgt;
    }
    const binPos = den > 0 ? num / den : best;
    let theta = (binPos / NB) * (Math.PI / 2); // 0..pi/2
    // map into (-pi/4, pi/4]
    if (theta > Math.PI / 4) theta -= Math.PI / 2;
    return theta;
  }

  /* ---------- square-mark detection (threshold + connected components) ---------- */

  // Otsu threshold on the normalised grey image (returns level in 0..1).
  function otsuThreshold(gray) {
    const hist = new Array(256).fill(0);
    for (let i = 0; i < gray.length; i++) {
      let b = Math.round(gray[i] * 255);
      hist[b < 0 ? 0 : b > 255 ? 255 : b]++;
    }
    const total = gray.length;
    let sum = 0;
    for (let t = 0; t < 256; t++) sum += t * hist[t];
    let sumB = 0, wB = 0, maxVar = -1, thr = 128;
    for (let t = 0; t < 256; t++) {
      wB += hist[t];
      if (wB === 0) continue;
      const wF = total - wB;
      if (wF === 0) break;
      sumB += t * hist[t];
      const mB = sumB / wB, mF = (sum - sumB) / wF;
      const v = wB * wF * (mB - mF) * (mB - mF);
      if (v > maxVar) { maxVar = v; thr = t; }
    }
    return thr / 255;
  }

  // Find dark square marks: connected components of the below-threshold mask,
  // filtered to blobs whose size and aspect match a square of side ~markLen.
  function detectSquares(gray, w, h, markLen, maxCount) {
    const thr = otsuThreshold(gray);
    // marks are dark; decide polarity from which side of the threshold is rarer
    let darkN = 0;
    for (let i = 0; i < gray.length; i++) if (gray[i] < thr) darkN++;
    const markDark = darkN <= gray.length / 2;       // marks are the minority class
    const mask = new Uint8Array(w * h);
    for (let i = 0; i < gray.length; i++) {
      const below = gray[i] < thr;
      mask[i] = (below === markDark) ? 1 : 0;
    }

    const lab = new Int32Array(w * h);
    const stack = new Int32Array(w * h);
    const comps = [];
    const Amin = 0.2 * markLen * markLen, Amax = 4 * markLen * markLen;
    let label = 0;
    for (let s = 0; s < w * h; s++) {
      if (!mask[s] || lab[s]) continue;
      label++;
      let sp = 0; stack[sp++] = s; lab[s] = label;
      let area = 0, sx = 0, sy = 0, minx = w, maxx = 0, miny = h, maxy = 0;
      while (sp > 0) {
        const i = stack[--sp];
        const x = i % w, y = (i - x) / w;
        area++; sx += x; sy += y;
        if (x < minx) minx = x; if (x > maxx) maxx = x;
        if (y < miny) miny = y; if (y > maxy) maxy = y;
        if (x > 0 && mask[i - 1] && !lab[i - 1]) { lab[i - 1] = label; stack[sp++] = i - 1; }
        if (x < w - 1 && mask[i + 1] && !lab[i + 1]) { lab[i + 1] = label; stack[sp++] = i + 1; }
        if (y > 0 && mask[i - w] && !lab[i - w]) { lab[i - w] = label; stack[sp++] = i - w; }
        if (y < h - 1 && mask[i + w] && !lab[i + w]) { lab[i + w] = label; stack[sp++] = i + w; }
      }
      if (area < Amin || area > Amax) continue;
      const bw = maxx - minx + 1, bh = maxy - miny + 1;
      const aspect = Math.max(bw, bh) / Math.min(bw, bh);
      if (aspect > 1.8) continue;                    // not square-ish
      if (bw < 0.4 * markLen || bw > 2.2 * markLen) continue;
      if (bh < 0.4 * markLen || bh > 2.2 * markLen) continue;
      // score: closeness of area to the expected square (and fill fraction)
      const fill = area / (bw * bh);
      comps.push({ x: sx / area, y: sy / area, score: fill - Math.abs(area - markLen * markLen) / (markLen * markLen) });
    }
    comps.sort((a, b) => b.score - a.score);
    return comps.slice(0, maxCount);
  }

  /* ---------- sub-pixel edge fit + line intersection ---------- */

  // Fit one straight side of a square. The side is expected near
  // `center + offset*normal`, runs along unit `along`, and is located by
  // searching perpendicular (`normal`). It is sampled one cross-section per
  // pixel over the full side length to maximise SNR. Returns a line object
  // (with the sub-pixel sample points attached for the overlay) or null.
  function fitSquareEdge(g, w, h, center, normal, along, offset, markLen) {
    const half = markLen / 2;
    const S = clamp(Math.round(markLen * 0.18), 6, 22); // perpendicular search half-width
    const ds = 0.5;                                      // perpendicular step (sub-pixel)
    const margin = Math.max(3, S);                       // stay clear of the corners
    const n = Math.round((2 * S) / ds);
    const pts = [];
    const bx0 = center.x + offset * normal.x;
    const by0 = center.y + offset * normal.y;
    for (let u = -half + margin; u <= half - margin; u += 1) {
      const bx = bx0 + u * along.x;
      const by = by0 + u * along.y;
      let pmin = Infinity, pmax = -Infinity;
      const prof = new Float64Array(n + 1);
      for (let j = 0; j <= n; j++) {
        const s = -S + j * ds;
        const v = bilinear(g, w, h, bx + s * normal.x, by + s * normal.y);
        prof[j] = v;
        if (v < pmin) pmin = v; if (v > pmax) pmax = v;
      }
      const contrast = pmax - pmin;
      if (contrast < 0.05) continue;
      let peak = -1, peakIdx = -1;
      const mg = new Float64Array(n + 1);
      for (let j = 1; j < n; j++) {
        const m = Math.abs(prof[j + 1] - prof[j - 1]);
        mg[j] = m;
        if (m > peak) { peak = m; peakIdx = j; }
      }
      if (peakIdx < 2 || peakIdx > n - 2) continue;
      if (peak < 0.25 * contrast) continue;
      let num = 0, den = 0;
      for (let j = peakIdx - 2; j <= peakIdx + 2; j++) { num += j * mg[j]; den += mg[j]; }
      if (den <= 0) continue;
      const s0 = -S + (num / den) * ds;
      pts.push({ x: bx + s0 * normal.x, y: by + s0 * normal.y });
    }
    if (pts.length < 6) return null;
    const line = tlsLine(pts);
    line.pts = line.inliers || pts;
    return line;
  }

  // Total-least-squares line through points, with one outlier-rejection pass.
  function tlsLine(pts) {
    function fit(arr) {
      let mx = 0, my = 0;
      for (const p of arr) { mx += p.x; my += p.y; }
      mx /= arr.length; my /= arr.length;
      let sxx = 0, sxy = 0, syy = 0;
      for (const p of arr) {
        const dx = p.x - mx, dy = p.y - my;
        sxx += dx * dx; sxy += dx * dy; syy += dy * dy;
      }
      const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy); // direction of max variance
      return { cx: mx, cy: my, dx: Math.cos(ang), dy: Math.sin(ang) };
    }
    let line = fit(pts);
    // residuals to line normal
    const nx = -line.dy, ny = line.dx;
    const res = pts.map(p => Math.abs((p.x - line.cx) * nx + (p.y - line.cy) * ny));
    const sorted = res.slice().sort((a, b) => a - b);
    const med = sorted[Math.floor(sorted.length / 2)] || 0;
    const cut = Math.max(0.75, med * 3);
    const inliers = pts.filter((p, i) => res[i] <= cut);
    if (inliers.length >= 6 && inliers.length < pts.length) line = fit(inliers);
    line.n = inliers.length;
    line.inliers = inliers;
    return line;
  }

  function intersectLines(L1, L2) {
    // L: point (cx,cy) + dir (dx,dy). Solve along L1: c1 + a*d1, hit L2.
    const n2x = -L2.dy, n2y = L2.dx;
    const denom = L1.dx * n2x + L1.dy * n2y;
    if (Math.abs(denom) < 1e-9) return null;
    const a = ((L2.cx - L1.cx) * n2x + (L2.cy - L1.cy) * n2y) / denom;
    return { x: L1.cx + a * L1.dx, y: L1.cy + a * L1.dy };
  }

  // Refine the centre of a square mark near `seed` to sub-pixel precision by
  // fitting all four sides and averaging the four corner intersections.
  // Returns {x, y, ok, edgeAngles, edges} where `edges` carries the fitted
  // lines and sample points for the trust overlay.
  function refineMark(g, w, h, seed, theta, markLen) {
    markLen = markLen || 40;
    const half = markLen / 2;
    let cur = { x: seed.x, y: seed.y };
    let result = null;
    for (let it = 0; it < 2; it++) {
      const e1 = { x: Math.cos(theta), y: Math.sin(theta) };
      const e2 = { x: -Math.sin(theta), y: Math.cos(theta) };
      // four sides: right/left (normal e1, along e2), bottom/top (normal e2, along e1)
      const right = fitSquareEdge(g, w, h, cur, e1, e2, +half, markLen);
      const left = fitSquareEdge(g, w, h, cur, e1, e2, -half, markLen);
      const bottom = fitSquareEdge(g, w, h, cur, e2, e1, +half, markLen);
      const top = fitSquareEdge(g, w, h, cur, e2, e1, -half, markLen);
      // corners from adjacent sides; centre = mean of available corners
      const corners = [];
      for (const v of [top, bottom]) for (const hh of [left, right]) {
        if (v && hh) { const p = intersectLines(v, hh); if (p) corners.push(p); }
      }
      if (corners.length >= 2) {
        let cx = 0, cy = 0;
        for (const p of corners) { cx += p.x; cy += p.y; }
        cx /= corners.length; cy /= corners.length;
        if (Math.hypot(cx - cur.x, cy - cur.y) < markLen) {
          const sides = [right, left, bottom, top].filter(Boolean);
          const angles = sides.map(s => foldAngle(Math.atan2(s.dy, s.dx)));
          result = {
            x: cx, y: cy,
            edgeAngles: angles,
            edges: sides.map(s => ({ cx: s.cx, cy: s.cy, dx: s.dx, dy: s.dy, pts: s.pts }))
          };
          cur = { x: cx, y: cy };
          // refine theta from this mark's own sides for the next iteration
          if (angles.length) theta = meanFoldedAngle(angles);
          continue;
        }
      }
      break;
    }
    if (result) { result.ok = true; return result; }
    return { x: seed.x, y: seed.y, ok: false, edgeAngles: null, edges: null };
  }

  // Fold an angle into (-pi/4, pi/4] given the marks' 90-deg symmetry.
  function foldAngle(a) {
    a = ((a % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2);
    if (a > Math.PI / 4) a -= Math.PI / 2;
    return a;
  }

  // Circular mean of angles that live on a period of pi/2.
  function meanFoldedAngle(angles) {
    let c = 0, s = 0;
    for (const a of angles) { c += Math.cos(4 * a); s += Math.sin(4 * a); }
    if (c === 0 && s === 0) return 0;
    return Math.atan2(s, c) / 4;
  }

  /* ---------- panel state ---------- */

  function makePanel(side) {
    const root = app.querySelector(`.ns-panel[data-side="${side}"]`);
    return {
      side, root,
      dropzone: app.querySelector(`.ns-dropzone[data-side="${side}"]`),
      canvas: app.querySelector(`.ns-canvas[data-side="${side}"]`),
      fileInput: app.querySelector(`.ns-file[data-side="${side}"]`),
      empty: root.querySelector(".ns-dropzone-empty"),
      tools: app.querySelector(`.ns-panel-tools[data-side="${side}"]`),
      metrics: app.querySelector(`.ns-metrics[data-side="${side}"]`),
      bitmap: null, gray: null, w: 0, h: 0,
      theta: 0, marks: [], center: null, spacing: null,
      selected: -1, addMode: false,
      view: { scale: 1, tx: 0, ty: 0 },
      ctx: null
    };
  }

  const panels = { cal: makePanel("cal"), tgt: makePanel("tgt") };

  function settings() {
    const num = id => parseFloat(document.getElementById(id).value);
    return {
      pitch: num("ns-pitch"),
      scale: num("ns-scale"),
      offX: num("ns-offx"),
      offY: num("ns-offy"),
      invX: document.getElementById("ns-invx").checked,
      invY: document.getElementById("ns-invy").checked,
      swap: document.getElementById("ns-swap").checked,
      sens: parseInt(document.getElementById("ns-sens").value, 10),
      markLen: num("ns-marklen")
    };
  }

  let scaleUserEdited = false;

  /* ---------- per-panel derived quantities ---------- */

  function nearestNeighbourSpacing(marks) {
    if (marks.length < 2) return null;
    const ds = [];
    for (let i = 0; i < marks.length; i++) {
      let best = Infinity;
      for (let j = 0; j < marks.length; j++) {
        if (i === j) continue;
        const d = Math.hypot(marks[i].x - marks[j].x, marks[i].y - marks[j].y);
        if (d < best) best = d;
      }
      if (isFinite(best)) ds.push(best);
    }
    ds.sort((a, b) => a - b);
    return ds.length ? ds[Math.floor(ds.length / 2)] : null;
  }

  function recompute(p) {
    if (p.marks.length) {
      let sx = 0, sy = 0;
      for (const m of p.marks) { sx += m.x; sy += m.y; }
      p.center = { x: sx / p.marks.length, y: sy / p.marks.length };
    } else {
      p.center = null;
    }
    p.spacing = nearestNeighbourSpacing(p.marks);
    updateMetrics(p);
  }

  function updateMetrics(p) {
    const set = (k, v) => { const el = p.metrics.querySelector(`dd[data-k="${k}"]`); if (el) el.textContent = v; };
    set("count", p.bitmap ? String(p.marks.length) : "—");
    set("center", p.center ? `${p.center.x.toFixed(2)}, ${p.center.y.toFixed(2)}` : "—");
    set("rot", p.bitmap ? `${(p.theta * 180 / Math.PI).toFixed(3)}°` : "—");
    set("spacing", p.spacing ? p.spacing.toFixed(2) : "—");
  }

  /* ---------- auto scale ---------- */

  function maybeAutoScale() {
    if (scaleUserEdited) return;
    const s = settings();
    const src = panels.cal.spacing ? panels.cal : (panels.tgt.spacing ? panels.tgt : null);
    if (src && src.spacing && s.pitch > 0) {
      const sc = src.spacing / s.pitch;
      document.getElementById("ns-scale").value = sc.toFixed(4);
    }
  }

  /* ---------- rendering ---------- */

  function fitView(p) {
    const cssW = p.dropzone.clientWidth || 480;
    const cssH = p.dropzone.clientHeight || 380;
    // contain the image inside the fixed-size box, centred (letterboxed)
    const scale = Math.min(cssW / p.w, cssH / p.h);
    p.view = {
      scale,
      tx: (cssW - p.w * scale) / 2,
      ty: (cssH - p.h * scale) / 2
    };
    sizeCanvas(p, cssW, cssH);
    render(p);
  }

  function sizeCanvas(p, cssW, cssH) {
    const dpr = window.devicePixelRatio || 1;
    p.canvas.style.width = cssW + "px";
    p.canvas.style.height = cssH + "px";
    p.canvas.width = Math.round(cssW * dpr);
    p.canvas.height = Math.round(cssH * dpr);
    p._cssW = cssW; p._cssH = cssH; p._dpr = dpr;
  }

  function imgToCss(p, x, y) {
    return { x: x * p.view.scale + p.view.tx, y: y * p.view.scale + p.view.ty };
  }
  function cssToImg(p, x, y) {
    return { x: (x - p.view.tx) / p.view.scale, y: (y - p.view.ty) / p.view.scale };
  }

  function crosshair(ctx, x, y, color, opts) {
    opts = opts || {};
    const len = opts.len || 13, gap = opts.gap || 4, r = opts.ring || 8;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = opts.lw || 1.5;
    ctx.beginPath();
    ctx.moveTo(x - len, y); ctx.lineTo(x - gap, y);
    ctx.moveTo(x + gap, y); ctx.lineTo(x + len, y);
    ctx.moveTo(x, y - len); ctx.lineTo(x, y - gap);
    ctx.moveTo(x, y + gap); ctx.lineTo(x, y + len);
    ctx.stroke();
    if (r) {
      ctx.beginPath();
      if (opts.dashed) ctx.setLineDash([3, 3]);
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function render(p) {
    if (!p.ctx || !p.bitmap) return;
    const ctx = p.ctx, dpr = p._dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, p._cssW, p._cssH);
    // image
    ctx.imageSmoothingEnabled = true;
    ctx.setTransform(dpr * p.view.scale, 0, 0, dpr * p.view.scale, dpr * p.view.tx, dpr * p.view.ty);
    ctx.drawImage(p.bitmap, 0, 0);
    // overlays in css space
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const s = settings();

    // trust overlay: the actual sub-pixel sample points (bright dots) and the
    // straight edge fitted through them (orange), for every mark.
    p.marks.forEach(m => {
      if (!m.edges) return;
      for (const e of m.edges) {
        // fitted line, drawn across the span of its own sample points
        if (e.pts && e.pts.length) {
          let tmin = Infinity, tmax = -Infinity;
          for (const q of e.pts) {
            const t = (q.x - e.cx) * e.dx + (q.y - e.cy) * e.dy;
            if (t < tmin) tmin = t; if (t > tmax) tmax = t;
          }
          const a = imgToCss(p, e.cx + tmin * e.dx, e.cy + tmin * e.dy);
          const b = imgToCss(p, e.cx + tmax * e.dx, e.cy + tmax * e.dy);
          ctx.save();
          ctx.strokeStyle = "#ff7a18"; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          ctx.restore();
        }
        // sample points
        ctx.save();
        ctx.fillStyle = "#aaff00";
        for (const q of e.pts) {
          const c = imgToCss(p, q.x, q.y);
          ctx.fillRect(c.x - 1, c.y - 1, 2, 2);
        }
        ctx.restore();
      }
    });

    // mark crosshairs (centre of each square)
    p.marks.forEach((m, i) => {
      const c = imgToCss(p, m.x, m.y);
      let color = m.ok === false ? "#ff5d5d" : (m.locked ? "#3ddc84" : "#ffffff");
      if (i === p.selected) color = "#ffd23d";
      crosshair(ctx, c.x, c.y, color, { lw: i === p.selected ? 2.2 : 1.5 });
      // index label
      ctx.save();
      ctx.fillStyle = color;
      ctx.font = "600 11px ui-monospace, monospace";
      ctx.fillText(String(i + 1), c.x + 10, c.y - 9);
      ctx.restore();
    });

    // mark-set centre
    if (p.center) {
      const c = imgToCss(p, p.center.x, p.center.y);
      crosshair(ctx, c.x, c.y, "#ff43c0", { len: 18, gap: 5, ring: 11, lw: 2 });
    }

    // desired write point on target
    if (p.side === "tgt" && p.center && (s.offX || s.offY) && s.scale > 0) {
      const e1 = { x: Math.cos(p.theta), y: Math.sin(p.theta) };
      const e2 = { x: -Math.sin(p.theta), y: Math.cos(p.theta) };
      const dx = (s.offX * e1.x + s.offY * e2.x) * s.scale;
      const dy = (s.offX * e1.y + s.offY * e2.y) * s.scale;
      const c = imgToCss(p, p.center.x + dx, p.center.y + dy);
      crosshair(ctx, c.x, c.y, "#ffae00", { len: 16, gap: 5, ring: 10, lw: 2, dashed: true });
    }
  }

  /* ---------- detection driver ---------- */

  function runDetect(p) {
    if (!p.gray) return;
    const s = settings();
    const blur = gaussianBlur(p.gray, p.w, p.h, 1.4);
    p.theta = globalOrientation(blur, p.w, p.h);
    const cands = detectSquares(p.gray, p.w, p.h, s.markLen, s.sens);

    // first pass: refine with the (coarse) histogram orientation as a seed,
    // collecting the sub-pixel edge directions from every mark
    let marks = [];
    const edgeAngles = [];
    for (const cnd of cands) {
      const r = refineMark(p.gray, p.w, p.h, cnd, p.theta, s.markLen);
      if (marks.some(m => Math.hypot(m.x - r.x, m.y - r.y) < 0.4 * s.markLen)) continue; // dedupe
      if (r.edgeAngles) edgeAngles.push(...r.edgeAngles);
      marks.push({ x: r.x, y: r.y, ok: r.ok, locked: false, edges: r.edges });
    }

    // refine the global orientation from the fitted edges (far more accurate
    // than the whole-image histogram), then re-refine each mark with it and
    // re-derive the orientation from the now better-centred edge fits
    if (edgeAngles.length >= 2) {
      p.theta = meanFoldedAngle(edgeAngles);
      const angles2 = [];
      marks = marks.map(m => {
        const r = refineMark(p.gray, p.w, p.h, m, p.theta, s.markLen);
        if (r.ok && r.edgeAngles) angles2.push(...r.edgeAngles);
        return r.ok ? { x: r.x, y: r.y, ok: true, locked: false, edges: r.edges } : m;
      });
      if (angles2.length >= 2) p.theta = meanFoldedAngle(angles2);
    }

    p.marks = marks;
    p.selected = -1;
    recompute(p);
    maybeAutoScale();
    render(p);
    computeResult();
  }

  /* ---------- image loading ---------- */

  async function loadImage(p, file) {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = rej;
        im.src = url;
      });
      p.bitmap = img; p.w = img.naturalWidth; p.h = img.naturalHeight;
      // grayscale via offscreen canvas
      const off = document.createElement("canvas");
      off.width = p.w; off.height = p.h;
      const octx = off.getContext("2d", { willReadFrequently: true });
      octx.drawImage(img, 0, 0);
      const gd = toGray(octx.getImageData(0, 0, p.w, p.h));
      p.gray = gd.gray;
      // reveal canvas
      p.empty.hidden = true;
      p.canvas.hidden = false;
      p.dropzone.classList.add("ns-has-image");
      p.tools.hidden = false;
      p.ctx = p.canvas.getContext("2d");
      fitView(p);
      runDetect(p);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /* ---------- cross-image transformation ---------- */

  function wrapDeg90(d) {
    d = ((d % 90) + 90) % 90;
    if (d > 45) d -= 90;
    return d;
  }

  function computeResult() {
    const cal = panels.cal, tgt = panels.tgt;
    const emptyEl = document.getElementById("ns-result-empty");
    const bodyEl = document.getElementById("ns-result-body");
    const ready = cal.center && tgt.center;
    emptyEl.hidden = ready;
    bodyEl.hidden = !ready;
    if (!ready) return;

    const s = settings();
    const scale = s.scale > 0 ? s.scale : 1;

    // desired write point (target image px) = target centre + offset in mark frame
    const e1t = { x: Math.cos(tgt.theta), y: Math.sin(tgt.theta) };
    const e2t = { x: -Math.sin(tgt.theta), y: Math.cos(tgt.theta) };
    const desX = tgt.center.x + (s.offX * e1t.x + s.offY * e2t.x) * scale;
    const desY = tgt.center.y + (s.offX * e1t.y + s.offY * e2t.y) * scale;

    // pixel displacement from current write point (calibration centre = printer origin)
    const dpx = desX - cal.center.x;
    const dpy = desY - cal.center.y;

    // project onto calibration stage axes, convert to microns
    const e1c = { x: Math.cos(cal.theta), y: Math.sin(cal.theta) };
    const e2c = { x: -Math.sin(cal.theta), y: Math.cos(cal.theta) };
    let sxUm = (dpx * e1c.x + dpy * e1c.y) / scale;
    let syUm = (dpx * e2c.x + dpy * e2c.y) / scale;

    if (s.invX) sxUm = -sxUm;
    if (s.invY) syUm = -syUm;
    if (s.swap) { const t = sxUm; sxUm = syUm; syUm = t; }

    const dTheta = wrapDeg90(tgt.theta * 180 / Math.PI - cal.theta * 180 / Math.PI);
    const dist = Math.hypot(dpx, dpy) / scale;

    const fmt = v => (v >= 0 ? "+" : "") + v.toFixed(3);
    document.getElementById("ns-out-shift").textContent = `${fmt(sxUm)}, ${fmt(syUm)}`;
    document.getElementById("ns-out-rot").textContent = fmt(dTheta);
    document.getElementById("ns-out-px").textContent = `${fmt(dpx)}, ${fmt(dpy)}`;
    document.getElementById("ns-out-dist").textContent = dist.toFixed(3);

    const note = document.getElementById("ns-result-note");
    const offNote = (s.offX || s.offY) ? ` Target offset (${s.offX}, ${s.offY}) µm from mark centre is included.` : "";
    note.textContent =
      `Command the stage to shift by (${fmt(sxUm)}, ${fmt(syUm)}) µm and rotate the pattern by ` +
      `${fmt(dTheta)}° so the print lands on the target marks' centre.` + offNote +
      ` Scale ${scale.toFixed(4)} px/µm.`;
  }

  /* ---------- interaction ---------- */

  function attachPanel(p) {
    const dz = p.dropzone;

    // file input + drag/drop
    p.fileInput.addEventListener("change", e => { if (e.target.files[0]) loadImage(p, e.target.files[0]); });
    dz.addEventListener("dragover", e => { e.preventDefault(); dz.classList.add("ns-dragover"); });
    dz.addEventListener("dragleave", () => dz.classList.remove("ns-dragover"));
    dz.addEventListener("drop", e => {
      e.preventDefault(); dz.classList.remove("ns-dragover");
      const f = e.dataTransfer.files[0]; if (f) loadImage(p, f);
    });

    // click empty zone to browse
    dz.addEventListener("click", e => {
      if (!p.bitmap) { p.fileInput.click(); }
    });
    dz.addEventListener("keydown", e => {
      if (!p.bitmap && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); p.fileInput.click(); }
    });

    // click on the canvas: select / correct / add a mark (no pan or zoom)
    p.canvas.addEventListener("click", e => {
      if (!p.bitmap) return;
      handleClick(p, e.offsetX, e.offsetY);
    });

    // tool buttons
    p.tools.querySelector(".ns-btn-redetect").addEventListener("click", () => runDetect(p));
    p.tools.querySelector(".ns-btn-clear").addEventListener("click", () => {
      p.marks = []; p.selected = -1; recompute(p); render(p); computeResult();
    });
    const addBtn = p.tools.querySelector(".ns-btn-addmode");
    addBtn.addEventListener("click", () => {
      p.addMode = !p.addMode;
      p.selected = -1;
      addBtn.setAttribute("aria-pressed", String(p.addMode));
      dz.classList.toggle("ns-addmode", p.addMode);
      render(p);
    });
  }

  function handleClick(p, cx, cy) {
    const img = cssToImg(p, cx, cy);

    if (p.addMode) {
      const r = refineMark(p.gray, p.w, p.h, img, p.theta, settings().markLen);
      p.marks.push({ x: r.x, y: r.y, ok: r.ok, locked: true, edges: r.edges });
      p.addMode = false;
      p.tools.querySelector(".ns-btn-addmode").setAttribute("aria-pressed", "false");
      p.dropzone.classList.remove("ns-addmode");
      recompute(p); maybeAutoScale(); render(p); computeResult();
      return;
    }

    if (p.selected >= 0) {
      const sel = p.marks[p.selected];
      const selCss = imgToCss(p, sel.x, sel.y);
      // click on the selected mark again -> cancel selection
      if (Math.hypot(cx - selCss.x, cy - selCss.y) < 9) {
        p.selected = -1; render(p); return;
      }
      // otherwise treat click as the true location -> refine & lock
      const r = refineMark(p.gray, p.w, p.h, img, p.theta, settings().markLen);
      sel.x = r.x; sel.y = r.y; sel.ok = r.ok; sel.locked = true; sel.edges = r.edges;
      p.selected = -1;
      recompute(p); maybeAutoScale(); render(p); computeResult();
      return;
    }

    // no selection: select nearest mark within 14 css px
    let best = -1, bestD = 14;
    p.marks.forEach((m, i) => {
      const c = imgToCss(p, m.x, m.y);
      const d = Math.hypot(cx - c.x, cy - c.y);
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best >= 0) { p.selected = best; render(p); }
  }

  attachPanel(panels.cal);
  attachPanel(panels.tgt);

  /* ---------- settings reactivity ---------- */

  ["ns-pitch", "ns-offx", "ns-offy"].forEach(id =>
    document.getElementById(id).addEventListener("input", () => {
      maybeAutoScale(); render(panels.tgt); computeResult();
    }));

  document.getElementById("ns-scale").addEventListener("input", () => {
    scaleUserEdited = true; render(panels.tgt); computeResult();
  });

  ["ns-invx", "ns-invy", "ns-swap"].forEach(id =>
    document.getElementById(id).addEventListener("change", computeResult));

  // mark size: live-update the outline while typing, re-detect when committed
  const markLenEl = document.getElementById("ns-marklen");
  markLenEl.addEventListener("input", () => {
    for (const k of ["cal", "tgt"]) if (panels[k].bitmap) render(panels[k]);
  });
  markLenEl.addEventListener("change", () => {
    for (const k of ["cal", "tgt"]) if (panels[k].bitmap) runDetect(panels[k]);
  });

  // keyboard: Escape cancels selection / add mode
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    for (const k of ["cal", "tgt"]) {
      const p = panels[k];
      if (p.selected >= 0 || p.addMode) {
        p.selected = -1; p.addMode = false;
        p.tools && p.tools.querySelector(".ns-btn-addmode").setAttribute("aria-pressed", "false");
        p.dropzone.classList.remove("ns-addmode");
        render(p);
      }
    }
  });

  // re-fit canvases on resize
  let rT;
  window.addEventListener("resize", () => {
    clearTimeout(rT);
    rT = setTimeout(() => {
      for (const k of ["cal", "tgt"]) { if (panels[k].bitmap) fitView(panels[k]); }
    }, 150);
  });
})();
