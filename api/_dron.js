// api/_dron.js — serverové hodnotenie simulátorov. Rovnaký výpočet ako v prehliadači,
// ale server ho prepočíta z PARAMETROV, takže výsledok sa nedá sfalšovať v prehliadači.
const N = 20, B = 60 / 96, BEATS = 16, ACCENT = 9, CX = 450, CY = 215;
const ease = x => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
function along(v) {
  const L = []; let tot = 0;
  for (let i = 0; i < v.length; i++) { const a = v[i], b = v[(i + 1) % v.length], d = Math.hypot(b[0] - a[0], b[1] - a[1]); L.push(d); tot += d; }
  const o = [];
  for (let k = 0; k < N; k++) { let s = (k / N) * tot, i = 0; while (s > L[i]) { s -= L[i]; i++; } const a = v[i], b = v[(i + 1) % v.length], u = s / L[i]; o.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]); }
  return o;
}
const circ = Array.from({ length: N }, (_, i) => { const a = -Math.PI / 2 + (i / N) * 2 * Math.PI; return [Math.cos(a), Math.sin(a)]; });
const star = along(Array.from({ length: 10 }, (_, k) => { const a = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? 0.42 : 1; return [r * Math.cos(a), r * Math.sin(a)]; }));
const square = along([[-0.8, -0.8], [0.8, -0.8], [0.8, 0.8], [-0.8, 0.8]]);

// Pozície dronov v čase t (sekundy). c = parametre show.
const POS = {
  "1.2": (t, i, c) => {
    const R = c.R, T = c.shape === "star" ? star : circ, gx = CX + (i - (N - 1) / 2) * 34, e1 = ease(t / (2 * B)), e2 = ease((t - (c.beat - 1) * B) / (c.dur * B));
    let x = gx + (CX + circ[i][0] * R - gx) * e1, y = 440 + (CY + circ[i][1] * R - 440) * e1;
    x += (T[i][0] - circ[i][0]) * R * e2; y += (T[i][1] - circ[i][1]) * R * e2; return [x, y];
  },
  "2.1": (t, i, c) => {
    const gx = CX + (i - (N - 1) / 2) * 34, e1 = ease(t / (2 * B));
    return [gx + (c.cx + circ[i][0] * c.R - gx) * e1, 440 + (440 - c.h + circ[i][1] * c.R - 440) * e1];
  },
  "2.2": (t, i, c) => {
    const R = 135, T = c.shape === "square" ? square : star, j = (i + c.k) % N, gx = CX + (i - (N - 1) / 2) * 34, e1 = ease(t / (2 * B)), e2 = ease((t - (ACCENT - 1) * B) / (c.dur * B));
    let x = gx + (CX + circ[i][0] * R - gx) * e1, y = 440 + (CY + circ[i][1] * R - 440) * e1;
    x += (T[j][0] - circ[i][0]) * R * e2; y += (T[j][1] - circ[i][1]) * R * e2; return [x, y];
  }
};

function measure(lesson, c) {
  let md = 1e9, ms = 0, top = 1e9, zone = false; const dt = 1 / 60, pos = POS[lesson];
  for (let t = 2 * B; t <= BEATS * B; t += dt) {
    const P = [], Q = [];
    for (let i = 0; i < N; i++) { P.push(pos(t, i, c)); Q.push(pos(t - dt, i, c)); }
    for (let i = 0; i < N; i++) {
      ms = Math.max(ms, Math.hypot(P[i][0] - Q[i][0], P[i][1] - Q[i][1]) / dt); top = Math.min(top, P[i][1]);
      if (lesson === "2.1" && P[i][0] > c.zx1 - 6 && P[i][0] < 866 && P[i][1] > 134 && P[i][1] < 306) zone = true;
      for (let j = i + 1; j < N; j++) md = Math.min(md, Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]));
    }
  }
  return { md, ms, top, zone };
}

// Definície lekcií: východiskové (pokazené) show, čo smie žiak meniť na ktorej úrovni a rozsahy posuvníkov.
const R_ = (a, b, s) => ({ min: a, max: b, step: s });
export const LESSONS = {
  "1.2": {
    levels: [{ sep: 30, vmax: 120 }, { sep: 32, vmax: 100 }, { sep: 33, vmax: 60 }],
    cases: {
      A: { def: { R: 55, shape: "circle", beat: 9, dur: 1 }, free: [["R"], ["R"], ["R"]] },
      B: { def: { R: 135, shape: "star", beat: 9, dur: 0.25 }, free: [["dur"], ["dur"], ["dur"]] },
      C: { def: { R: 135, shape: "star", beat: 6, dur: 4 }, free: [["beat"], ["beat"], ["beat"]] }
    },
    rng: { R: R_(40, 150, 5), beat: R_(3, 14, 1), dur: { opts: [0.25, 0.5, 1, 2, 4] } }
  },
  "2.1": {
    levels: [{ sep: 30, ceil: 110, zx1: 600 }, { sep: 36, ceil: 150, zx1: 560 }, { sep: 40, ceil: 170, zx1: 520 }],
    cases: {
      A: { def: { R: 100, cx: 450, h: 340 }, free: [["h"], ["h", "cx", "R"], ["h", "cx", "R"]] },
      B: { def: { R: 100, cx: 690, h: 190 }, free: [["cx"], ["h", "cx", "R"], ["h", "cx", "R"]] },
      C: { def: { R: 130, cx: 700, h: 340 }, free: [["h", "cx", "R"], ["h", "cx", "R"], ["h", "cx", "R"]] }
    },
    rng: { h: R_(130, 400, 10), cx: R_(150, 750, 10), R: R_(60, 160, 5) }
  },
  "2.2": {
    levels: [{ sep: 30, vmax: 120 }, { sep: 32, vmax: 100 }, { sep: 33, vmax: 70 }],
    cases: {
      A: { def: { shape: "star", k: 10, dur: 2 }, free: [["k"], ["k", "dur"], ["k", "dur"]] },
      B: { def: { shape: "square", k: 12, dur: 2 }, free: [["k"], ["k", "dur"], ["k", "dur"]] },
      C: { def: { shape: "star", k: 6, dur: 1 }, free: [["k", "dur"], ["k", "dur"], ["k", "dur"]] }
    },
    rng: { k: R_(0, 19, 1), dur: { opts: [1, 2, 3, 4] } }
  }
};

// Overí a doplní parametre. Neznáme alebo nepovolené polia sa ignorujú (použije sa východisková hodnota).
export function cleanParams(lesson, caseId, level, params) {
  const L = LESSONS[lesson], cs = L?.cases[caseId];
  if (!cs || !(level >= 0 && level <= 2)) return null;
  const c = { ...cs.def };
  for (const key of cs.free[level]) {
    const r = L.rng[key], v = Number(params?.[key]);
    if (!Number.isFinite(v)) return null;
    if (r.opts) { if (!r.opts.includes(v)) return null; }
    else if (v < r.min || v > r.max || (v - r.min) % r.step !== 0) return null;
    c[key] = v;
  }
  return c;
}

const row = (k, ok, msg) => ({ k, ok, msg });
export function evaluate(lesson, caseId, level, params) {
  const c = cleanParams(lesson, caseId, level, params);
  if (!c) return { error: "Neplatné parametre." };
  const lv = LESSONS[lesson].levels[level], m = measure(lesson, { ...c, zx1: lv.zx1 });
  const rows = [], okSep = m.md >= lv.sep - 0.5;
  rows.push(row("odstup", okSep, `Najmenší odstup je ${Math.round(m.md)}, potrebných je aspoň ${lv.sep}.`));
  if (lesson !== "2.1") rows.push(row("rychlost", m.ms <= lv.vmax, `Najvyššia rýchlosť je ${Math.round(m.ms)}, povolených je najviac ${lv.vmax}.`));
  if (lesson === "1.2") rows.push(row("casovanie", c.beat === ACCENT, c.beat === ACCENT ? "Zmena sa trafila na zvýraznený úder." : `Zmena je na údere ${c.beat}, zvýraznený je ${ACCENT}.`));
  if (lesson === "2.1") {
    rows.push(row("vyska", m.top >= lv.ceil, `Najvyšší dron je vo výške ${Math.round(440 - m.top)}, povolené je najviac ${440 - lv.ceil}.`));
    rows.push(row("zona", !m.zone, m.zone ? "Časť show zasahuje do zakázaného priestoru." : "Žiadny dron nezasahuje do zakázaného priestoru."));
  }
  return { pass: rows.every(r => r.ok), rows, params: c };
}
