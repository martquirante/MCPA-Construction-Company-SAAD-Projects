/**
 * Wrapped scene builder
 * ---------------------------------------------------------------------------
 * Every chapter is described once, as a flat list of primitives on a fixed
 * 1080 x 1920 sheet (rect, line, text, image). The on-screen player renders
 * that list as SVG and the exporter paints the very same list onto a canvas,
 * so the slide you see is the slide you download or share to an IG Story.
 *
 * All values come from the Wrapped payload produced by the backend; nothing is
 * invented. Fields that are missing simply drop their row.
 */

export const STORY_W = 1080;
export const STORY_H = 1920;
const M = 72;
const CW = STORY_W - M * 2; // content width 936
const TZ = "Asia/Manila";

export const PALETTES = {
  light: {
    bg: "#f8f7f5",
    surface: "#ffffff",
    ink: "#0b0b0c",
    muted: "#6a6a64",
    faint: "#c9c7c0",
    hair: "rgba(11,11,12,0.2)",
    accent: "#b45309",
    accentSoft: "rgba(180,83,9,0.16)",
    onAccent: "#ffffff",
  },
  dark: {
    bg: "#080a0e",
    surface: "#11141a",
    ink: "#f5f4f1",
    muted: "#8b8e98",
    faint: "#3a3d47",
    hair: "rgba(255,255,255,0.18)",
    accent: "#f59e0b",
    accentSoft: "rgba(245,158,11,0.18)",
    onAccent: "#080a0e",
  },
};

export const CHAPTER_TITLES = [
  "Cover",
  "Day zero",
  "The dialogue",
  "Ink and clearances",
  "First earth",
  "Anatomy of time",
  "Rising form",
  "Site, by the numbers",
  "Milestones and grit",
  "The final ten percent",
  "Then and now",
  "Handover seal",
];

/* ------------------------------------------------------------------ utils */

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(list, rand) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function fmtParts(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const f = (o) => new Intl.DateTimeFormat("en-US", { timeZone: TZ, ...o }).format(d);
  const day = f({ day: "2-digit" });
  const mon = f({ month: "short" }).toUpperCase().replace(".", "");
  const year = f({ year: "numeric" });
  return { day, mon, year, weekday: f({ weekday: "long" }), monthLong: f({ month: "long" }), short: `${day} ${mon}`, full: `${day} ${mon} ${year}`, ms: d.getTime() };
}

function fmtMinutes(m) {
  const n = Math.round(Number(m) || 0);
  if (n < 60) return `${n} MIN`;
  const h = Math.floor(n / 60);
  const r = n % 60;
  return r ? `${h} H ${r} MIN` : `${h} H`;
}

const pad2 = (n) => String(n).padStart(2, "0");

/** Reads the real family stacks next/font registered, so canvas and SVG share them. */
export function resolveFonts() {
  const cs = typeof window !== "undefined" ? getComputedStyle(document.documentElement) : null;
  const display = (cs && cs.getPropertyValue("--font-plus-jakarta-sans").trim()) || "'Plus Jakarta Sans', system-ui, sans-serif";
  const mono = (cs && cs.getPropertyValue("--font-geist-mono").trim()) || "ui-monospace, 'SF Mono', Menlo, monospace";
  return { display, mono };
}

export async function ensureFonts(fonts) {
  if (typeof document === "undefined" || !document.fonts) return;
  const loads = [];
  [500, 600, 700, 800].forEach((w) => loads.push(document.fonts.load(`${w} 48px ${fonts.display}`)));
  [400, 500, 600].forEach((w) => loads.push(document.fonts.load(`${w} 24px ${fonts.mono}`)));
  try {
    await Promise.all(loads);
    await document.fonts.ready;
  } catch {
    /* fall back to whatever is available */
  }
}

export function createMeasurer(fonts) {
  const canvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
  const ctx = canvas ? canvas.getContext("2d") : null;
  return function measure(str, { font = "display", size = 32, weight = 600, ls = 0 } = {}) {
    if (!ctx) return str.length * size * 0.55;
    ctx.font = `${weight} ${size}px ${font === "mono" ? fonts.mono : fonts.display}`;
    return ctx.measureText(str).width + ls * str.length;
  };
}

/* ------------------------------------------------------------ primitives */

const rect = (x, y, w, h, o = {}) => ({ t: "rect", x, y, w, h, fill: o.fill, stroke: o.stroke, sw: o.sw || 1 });
const line = (x1, y1, x2, y2, color, w = 1) => ({ t: "line", x1, y1, x2, y2, color, w });
const hline = (x1, x2, y, color) => line(x1, y + 0.5, x2, y + 0.5, color, 1);
const vline = (x, y1, y2, color) => line(x + 0.5, y1, x + 0.5, y2, color, 1);
const text = (s, x, y, o) => ({
  t: "text",
  text: String(s),
  x,
  y,
  font: o.font || "display",
  size: o.size,
  weight: o.weight || 700,
  color: o.color,
  align: o.align || "left",
  ls: o.ls || 0,
});
const image = (src, x, y, w, h) => ({ t: "image", src, x, y, w, h });

function wrap(measure, str, opts, maxW) {
  const words = String(str || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  words.forEach((w) => {
    const next = cur ? `${cur} ${w}` : w;
    if (measure(next, opts) <= maxW || !cur) cur = next;
    else {
      lines.push(cur);
      cur = w;
    }
  });
  if (cur) lines.push(cur);
  return lines;
}

function fit(measure, str, opts, maxW, sizes, maxLines) {
  for (const size of sizes) {
    const lines = wrap(measure, str, { ...opts, size }, maxW);
    if (lines.length <= maxLines) return { lines, size };
  }
  const size = sizes[sizes.length - 1];
  const lines = wrap(measure, str, { ...opts, size }, maxW).slice(0, maxLines);
  if (lines.length) lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[\s.,;:]+$/, "")}…`;
  return { lines, size };
}

function ellipsize(measure, str, opts, maxW) {
  if (measure(str, opts) <= maxW) return str;
  let s = str;
  while (s.length > 1 && measure(`${s}…`, opts) > maxW) s = s.slice(0, -1);
  return `${s.trimEnd()}…`;
}

/* --------------------------------------------------------------- chrome */

function chrome(P, index, total, payload, title) {
  const arm = 30;
  const o = 48;
  const c = P.muted;
  const items = [
    rect(0, 0, STORY_W, STORY_H, { fill: P.bg }),
    // registration marks
    line(o, o, o + arm, o, c, 2), line(o, o, o, o + arm, c, 2),
    line(STORY_W - o, o, STORY_W - o - arm, o, c, 2), line(STORY_W - o, o, STORY_W - o, o + arm, c, 2),
    line(o, STORY_H - o, o + arm, STORY_H - o, c, 2), line(o, STORY_H - o, o, STORY_H - o - arm, c, 2),
    line(STORY_W - o, STORY_H - o, STORY_W - o - arm, STORY_H - o, c, 2), line(STORY_W - o, STORY_H - o, STORY_W - o, STORY_H - o - arm, c, 2),
    text("MCPA  /  PROJECT WRAPPED", M, 112, { font: "mono", size: 20, weight: 500, color: P.muted, ls: 3 }),
    text(`${pad2(index + 1)} / ${pad2(total)}`, STORY_W - M, 112, { font: "mono", size: 20, weight: 600, color: P.ink, ls: 3, align: "right" }),
    hline(M, STORY_W - M, 138, P.hair),
    hline(M, STORY_W - M, 1786, P.hair),
    text(payload.project.projectCode || "MCPA", M, 1834, { font: "mono", size: 18, weight: 500, color: P.muted, ls: 2 }),
    text(title.toUpperCase(), STORY_W - M, 1834, { font: "mono", size: 18, weight: 500, color: P.muted, ls: 2, align: "right" }),
  ];
  return items;
}

const eyebrow = (P, str, y = 232) => text(str, M, y, { font: "mono", size: 22, weight: 600, color: P.accent, ls: 4 });

function heading(P, m, str, y = 320, sizes = [92, 80, 68]) {
  const { lines, size } = fit(m, str, { font: "display", weight: 800 }, CW, sizes, 2);
  return {
    items: lines.map((l, i) => text(l, M, y + i * (size + 8), { size, weight: 800, color: P.ink })),
    bottom: y + (lines.length - 1) * (size + 8),
  };
}

function placeholder(P, x, y, w, h, label = "NO PHOTO LOGGED") {
  return [
    rect(x, y, w, h, { fill: P.surface, stroke: P.hair }),
    line(x, y, x + w, y + h, P.hair, 1),
    line(x + w, y, x, y + h, P.hair, 1),
    text(label, x + w / 2, y + h / 2 + 7, { font: "mono", size: 20, weight: 500, color: P.muted, ls: 3, align: "center" }),
  ];
}

function plate(P, m, photo, r, caption) {
  const out = [];
  if (!photo) return placeholder(P, r.x, r.y, r.w, r.h);
  out.push(rect(r.x, r.y, r.w, r.h, { fill: P.surface }));
  out.push(image(photo.url, r.x, r.y, r.w, r.h));
  out.push(rect(r.x, r.y, r.w, r.h, { stroke: P.hair }));
  const label = caption || "";
  if (label) {
    const cw = Math.ceil(m(label, { font: "mono", size: 18, weight: 500, ls: 2 })) + 28;
    out.push(rect(r.x, r.y + r.h - 40, cw, 40, { fill: P.bg }));
    out.push(text(label, r.x + 14, r.y + r.h - 14, { font: "mono", size: 18, weight: 500, color: P.ink, ls: 2 }));
  }
  return out;
}

function photoCaption(photo) {
  if (!photo) return "";
  const d = fmtParts(photo.date);
  const pct = photo.estimated ? "" : `${photo.pct}%  `;
  return `${pct}${d ? d.short : ""}`.trim();
}

function collageRects(n, rand, top, h) {
  const g = 20;
  const x = M;
  const w = CW;
  const half = (w - g) / 2;
  const R = (rx, ry, rw, rh) => ({ x: Math.round(rx), y: Math.round(ry), w: Math.round(rw), h: Math.round(rh) });
  const pick = rand() < 0.5 ? 0 : 1;
  if (n <= 1) return [R(x, top, w, h)];
  if (n === 2) {
    return pick === 0
      ? [R(x, top, w, (h - g) / 2), R(x, top + (h - g) / 2 + g, w, (h - g) / 2)]
      : [R(x, top, half, h), R(x + half + g, top, half, h)];
  }
  if (n === 3) {
    if (pick === 0) {
      const topH = Math.round(h * 0.58);
      return [R(x, top, w, topH), R(x, top + topH + g, half, h - topH - g), R(x + half + g, top + topH + g, half, h - topH - g)];
    }
    const leftW = Math.round(w * 0.6);
    const rightW = w - leftW - g;
    const rh = (h - g) / 2;
    return [R(x, top, leftW, h), R(x + leftW + g, top, rightW, rh), R(x + leftW + g, top + rh + g, rightW, rh)];
  }
  if (pick === 0) {
    const topH = Math.round(h * 0.5);
    const tw = (w - g * 2) / 3;
    return [
      R(x, top, w, topH),
      R(x, top + topH + g, tw, h - topH - g),
      R(x + tw + g, top + topH + g, tw, h - topH - g),
      R(x + (tw + g) * 2, top + topH + g, tw, h - topH - g),
    ];
  }
  const rh = (h - g) / 2;
  return [R(x, top, half, rh), R(x + half + g, top, half, rh), R(x, top + rh + g, half, rh), R(x + half + g, top + rh + g, half, rh)];
}

/* ---------------------------------------------------------------- slides */

export function buildScenes({ payload, theme = "light", fonts, seeds = [] }) {
  const P = PALETTES[theme] || PALETTES.light;
  const m = createMeasurer(fonts);
  const total = CHAPTER_TITLES.length;
  const pr = payload.project || {};
  const dates = payload.dates || {};
  const stats = payload.stats || {};
  const pools = payload.pools || { early: [], mid: [], final: [], all: [] };
  const phases = payload.phases || [];
  const D = (key) => fmtParts(dates[key]);

  const build = [];
  const add = (id, shuffle, body) => build.push({ id, shuffle, body });

  /* 01 cover */
  add("cover", false, (items) => {
    const hero = payload.beforeAfter?.after || pools.final[pools.final.length - 1] || pools.all[pools.all.length - 1] || null;
    items.push(...plate(P, m, hero, { x: M, y: 176, w: CW, h: 900 }, hero ? "AS COMPLETED" : ""));
    items.push(text("PLATE 01", M, 1112, { font: "mono", size: 18, weight: 500, color: P.muted, ls: 3 }));
    const t = D("turnover");
    if (t) items.push(text(t.full, STORY_W - M, 1112, { font: "mono", size: 18, weight: 500, color: P.muted, ls: 3, align: "right" }));
    const meta = [pr.type, pr.cityProvince].filter(Boolean).join("  ·  ").toUpperCase();
    if (meta) items.push(text(meta, M, 1204, { font: "mono", size: 22, weight: 600, color: P.accent, ls: 3 }));
    const { lines, size } = fit(m, pr.title || "Your residence", { font: "display", weight: 800 }, CW, [96, 84, 72, 60], 3);
    lines.forEach((l, i) => items.push(text(l, M, 1300 + i * (size + 6), { size, weight: 800, color: P.ink })));
    const baseY = 1300 + (lines.length - 1) * (size + 6);
    const colY = Math.max(baseY + 70, 1650);
    items.push(hline(M, STORY_W - M, colY - 34, P.hair));
    if (pr.clientFirstName) {
      items.push(text("PREPARED FOR", M, colY, { font: "mono", size: 18, weight: 500, color: P.muted, ls: 3 }));
      items.push(text(pr.clientFirstName, M, colY + 44, { size: 38, weight: 700, color: P.ink }));
    }
    items.push(text("HANDED OVER", STORY_W - M, colY, { font: "mono", size: 18, weight: 500, color: P.muted, ls: 3, align: "right" }));
    items.push(text(t ? `${t.monthLong} ${t.year}` : String(pr.completionYear || ""), STORY_W - M, colY + 44, { size: 38, weight: 700, color: P.ink, align: "right" }));
  });

  /* 02 day zero */
  add("day-zero", false, (items) => {
    const d = D("inquiry");
    items.push(eyebrow(P, "CHAPTER 02  —  DAY ZERO"));
    if (d) {
      items.push(text(d.day, M - 14, 700, { size: 440, weight: 800, color: P.ink }));
      items.push(text(`${d.mon} ${d.year}`, M, 790, { font: "mono", size: 60, weight: 500, color: P.ink, ls: 2 }));
      items.push(text(d.weekday.toUpperCase(), M, 846, { font: "mono", size: 24, weight: 500, color: P.muted, ls: 4 }));
    }
    items.push(...heading(P, m, "You sent the first inquiry.", 1000, [76, 68, 60]).items);
    const rows = [
      ["TYPE", pr.type],
      ["STOREYS", pr.storeys],
      ["LOT AREA", pr.lotArea],
      ["STYLE", pr.preferredStyle],
    ].filter((r) => r[1]);
    let y = 1220;
    rows.slice(0, 4).forEach((r) => {
      items.push(hline(M, STORY_W - M, y, P.hair));
      items.push(text(r[0], M, y + 56, { font: "mono", size: 20, weight: 500, color: P.muted, ls: 3 }));
      const v = ellipsize(m, String(r[1]), { size: 38, weight: 700 }, 620);
      items.push(text(v, STORY_W - M, y + 60, { size: 38, weight: 700, color: P.ink, align: "right" }));
      y += 88;
    });
    if (rows.length) items.push(hline(M, STORY_W - M, y, P.hair));
    const days = stats.totalDays;
    items.push(text(days ? `Day 00 of ${days}. Every phase that follows is measured from here.` : "Every phase that follows is measured from here.", M, 1690, { size: 28, weight: 500, color: P.muted }));
  });

  /* 03 dialogue */
  add("dialogue", false, (items) => {
    const n = stats.consultations || 0;
    items.push(eyebrow(P, "CHAPTER 03  —  THE DIALOGUE"));
    items.push(text(pad2(n), M - 20, 800, { size: 560, weight: 800, color: P.ink }));
    items.push(text(n === 1 ? "consultation session" : "consultation sessions", M, 912, { size: 54, weight: 700, color: P.ink }));
    const sessions = (payload.consultations || []).slice(0, 36);
    const baseY = 1250;
    if (sessions.length) {
      const maxMin = Math.max(1, ...sessions.map((s) => s.minutes || 0));
      const gap = 8;
      const bw = Math.max(6, Math.floor((CW - gap * (sessions.length - 1)) / sessions.length));
      const used = bw * sessions.length + gap * (sessions.length - 1);
      const startX = M;
      sessions.forEach((s, i) => {
        const h = 36 + Math.round(((s.minutes || 0) / maxMin) * 190);
        items.push(rect(startX + i * (bw + gap), baseY - h, bw, h, { fill: i === sessions.length - 1 ? P.accent : P.ink }));
      });
      items.push(hline(M, M + Math.max(used, 40), baseY + 10, P.hair));
      items.push(text("EACH BAR IS ONE SESSION, HEIGHT = LENGTH", M, baseY + 52, { font: "mono", size: 18, weight: 500, color: P.muted, ls: 2 }));
    }
    const cols = [
      ["TIME TOGETHER", stats.consultationMinutes ? fmtMinutes(stats.consultationMinutes) : "—"],
      ["FIRST SESSION", D("firstConsultation")?.short || "—"],
      ["AVERAGE", n && stats.consultationMinutes ? fmtMinutes(stats.consultationMinutes / n) : "—"],
    ];
    const cw = CW / 3;
    items.push(hline(M, STORY_W - M, 1430, P.hair));
    cols.forEach((c, i) => {
      const x = M + i * cw;
      if (i) items.push(vline(x - 18, 1430, 1700, P.hair));
      items.push(text(c[0], x, 1490, { font: "mono", size: 18, weight: 500, color: P.muted, ls: 3 }));
      items.push(text(c[1], x, 1566, { size: 40, weight: 800, color: P.ink }));
    });
    items.push(text("Every session shaped the drawings that followed.", M, 1700, { size: 26, weight: 500, color: P.muted }));
  });

  /* 04 ink & clearances */
  add("ink", false, (items) => {
    items.push(eyebrow(P, "CHAPTER 04  —  INK AND CLEARANCES"));
    const h = heading(P, m, "Ink and clearances", 330);
    items.push(...h.items);
    const rows = [
      {
        label: "Drawings",
        sub: stats.blueprintSheets ? `Issued ${D("blueprintsIssued")?.full || ""}${stats.blueprintRevisions ? `  ·  up to Rev ${stats.blueprintRevisions}` : ""}`.trim() : "Not recorded",
        value: stats.blueprintSheets ? `${stats.blueprintSheets} sheets` : "—",
      },
      {
        label: "Permits",
        sub: stats.permitsTotal ? "Released by the agencies" : "Not recorded",
        value: stats.permitsTotal ? `${stats.permitsReleased} of ${stats.permitsTotal}` : "—",
      },
      {
        label: "BOQ and quotation",
        sub: "Published to you for review",
        value: D("quotationPublished")?.short || "—",
      },
      {
        label: "Contract",
        sub: "Executed and e-signed",
        value: D("contractSigned")?.short || "—",
      },
    ];
    let y = 520;
    rows.forEach((r, i) => {
      items.push(hline(M, STORY_W - M, y, P.hair));
      items.push(text(pad2(i + 1), M, y + 62, { font: "mono", size: 22, weight: 600, color: P.accent, ls: 2 }));
      items.push(text(r.label, M + 80, y + 66, { size: 44, weight: 700, color: P.ink }));
      items.push(text(r.sub.toUpperCase(), M + 80, y + 116, { font: "mono", size: 18, weight: 500, color: P.muted, ls: 2 }));
      items.push(text(r.value, STORY_W - M, y + 200, { size: 84, weight: 800, color: P.ink, align: "right" }));
      y += 290;
    });
    items.push(hline(M, STORY_W - M, y, P.hair));
  });

  const collage = (id, num, title, bucket, subline, extraTop) =>
    add(id, true, (items, i) => {
      items.push(eyebrow(P, `CHAPTER ${pad2(num)}  —  ${title.toUpperCase()}`));
      const h = heading(P, m, extraTop || title, 330);
      items.push(...h.items);
      items.push(text(subline.toUpperCase(), M, h.bottom + 52, { font: "mono", size: 20, weight: 500, color: P.muted, ls: 3 }));
      const rand = mulberry32((seeds[i] || 0) * 7919 + num * 104729 + 17);
      const source = pools[bucket] && pools[bucket].length ? pools[bucket] : pools.all || [];
      const want = source.length >= 4 ? (rand() < 0.5 ? 3 : 4) : source.length;
      const chosen = shuffled(source, rand).slice(0, want);
      const top = h.bottom + 100;
      const rects = chosen.length ? collageRects(chosen.length, rand, top, 1744 - top) : [{ x: M, y: top, w: CW, h: 1744 - top }];
      if (!chosen.length) items.push(...placeholder(P, rects[0].x, rects[0].y, rects[0].w, rects[0].h));
      chosen.forEach((ph, k) => items.push(...plate(P, m, ph, rects[k], photoCaption(ph))));
    });

  const gb = payload.groundbreaking;
  const gbDate = gb?.date ? fmtParts(gb.date) : D("groundbreaking");
  collage(
    "first-earth", 5, "First earth", "early",
    gbDate ? `Groundbreaking  ·  ${gbDate.full}${gb?.venue ? `  ·  ${gb.venue}` : ""}` : "Groundwork  ·  0 to 35 percent of the build",
    "First earth"
  );

  /* 06 anatomy of time */
  add("anatomy", false, (items) => {
    items.push(eyebrow(P, "CHAPTER 06  —  ANATOMY OF TIME"));
    const days = stats.totalDays || 0;
    items.push(text(String(days), M - 16, 640, { size: 380, weight: 800, color: P.ink }));
    items.push(text("days from inquiry to key handover", M, 722, { size: 44, weight: 700, color: P.ink }));
    const real = phases.filter((p) => p.key !== "handover");
    const sum = Math.max(1, real.reduce((s, p) => s + (p.days || 0), 0));
    const tints = [P.faint, P.muted, P.accent];
    let x = M;
    const barY = 800;
    items.push(rect(M, barY, CW, 64, { stroke: P.hair }));
    real.forEach((p, i) => {
      const w = Math.max(i === real.length - 1 ? CW - (x - M) : 4, Math.round(((p.days || 0) / sum) * CW));
      const ww = Math.min(w, M + CW - x);
      if (ww > 0) items.push(rect(x, barY, ww, 64, { fill: tints[i] || P.ink }));
      x += ww;
    });
    let y = 940;
    phases.forEach((p, i) => {
      const a = fmtParts(p.start);
      const b = fmtParts(p.end);
      items.push(hline(M, STORY_W - M, y, P.hair));
      items.push(text(`P${i + 1}`, M, y + 62, { font: "mono", size: 22, weight: 600, color: P.accent, ls: 2 }));
      items.push(text(p.label, M + 84, y + 64, { size: 42, weight: 700, color: P.ink }));
      const range = p.key === "handover" ? (a ? a.full : "") : a && b ? `${a.short}  →  ${b.short}` : "";
      items.push(text(range, M + 84, y + 112, { font: "mono", size: 20, weight: 500, color: P.muted, ls: 2 }));
      const val = p.key === "handover" ? "KEYS" : `${p.days || 0}`;
      items.push(text(val, STORY_W - M, y + 112, { size: p.key === "handover" ? 52 : 92, weight: 800, color: P.ink, align: "right" }));
      if (p.key !== "handover") items.push(text("DAYS", STORY_W - M, y + 148, { font: "mono", size: 18, weight: 500, color: P.muted, ls: 3, align: "right" }));
      y += 190;
    });
    items.push(hline(M, STORY_W - M, y, P.hair));
  });

  collage("rising", 7, "Rising form", "mid", "Structure, envelope and systems  ·  36 to 89 percent", "Rising form");

  /* 08 telemetry */
  add("telemetry", false, (items) => {
    items.push(eyebrow(P, "CHAPTER 08  —  SITE TELEMETRY"));
    items.push(...heading(P, m, "Site, by the numbers", 330).items);
    const cells = [
      stats.imagesLogged ? ["PROGRESS PHOTOS", String(stats.imagesLogged), "logged on site"] : null,
      stats.siteLogDays ? ["ACTIVE LOG DAYS", String(stats.siteLogDays), "days with a site log"] : null,
      stats.milestones ? ["MILESTONES CLOSED", `${stats.milestonesCompleted}/${stats.milestones}`, "major phases"] : null,
      stats.inspectors ? ["FIELD INSPECTORS", String(stats.inspectors), "on the log"] : null,
      ["DELAY DAYS", String(stats.delayDays || 0), stats.delayCount ? `across ${stats.delayCount} events` : "no events logged"],
      stats.billingTranches ? ["TRANCHES SETTLED", `${stats.billingSettled}/${stats.billingTranches}`, stats.billingFullySettled ? "billing fully settled" : "billing in progress"] : null,
      stats.videosLogged ? ["SITE VIDEOS", String(stats.videosLogged), "walkthrough clips"] : null,
      stats.consultationMinutes ? ["PLANNING TIME", fmtMinutes(stats.consultationMinutes), "with the team"] : null,
    ].filter(Boolean).slice(0, 6);
    const top = 520;
    const cw = CW / 2;
    const ch = 380;
    cells.forEach((c, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = M + col * cw;
      const y = top + row * ch;
      items.push(rect(x, y, cw, ch, { stroke: P.hair }));
      items.push(text(c[0], x + 28, y + 56, { font: "mono", size: 18, weight: 500, color: P.muted, ls: 3 }));
      const big = c[1].length > 6 ? 96 : c[1].length > 4 ? 124 : 156;
      items.push(text(c[1], x + 24, y + 238, { size: big, weight: 800, color: P.ink }));
      items.push(text(c[2], x + 28, y + 322, { font: "mono", size: 19, weight: 500, color: P.accent, ls: 1 }));
    });
  });

  /* 09 milestones & grit */
  add("milestones", false, (items) => {
    items.push(eyebrow(P, "CHAPTER 09  —  MILESTONES AND GRIT"));
    items.push(...heading(P, m, "Milestones and grit", 330).items);
    const list = (payload.milestones || []).slice(0, 7);
    let y = 500;
    if (!list.length) {
      items.push(text("No phase milestones were recorded for this build.", M, y + 40, { size: 30, weight: 500, color: P.muted }));
    }
    list.forEach((ms, i) => {
      const name = ellipsize(m, ms.name || `Phase ${i + 1}`, { size: 34, weight: 600 }, 700);
      items.push(text(pad2(i + 1), M, y + 36, { font: "mono", size: 20, weight: 600, color: P.accent, ls: 2 }));
      items.push(text(name, M + 70, y + 40, { size: 34, weight: 600, color: P.ink }));
      items.push(text(`${ms.pct}%`, STORY_W - M, y + 40, { font: "mono", size: 28, weight: 600, color: P.ink, align: "right" }));
      items.push(rect(M + 70, y + 66, CW - 70, 8, { fill: P.faint }));
      if (ms.pct > 0) items.push(rect(M + 70, y + 66, Math.round(((CW - 70) * Math.min(100, ms.pct)) / 100), 8, { fill: P.accent }));
      y += 118;
    });
    const by = 1440;
    items.push(rect(M, by, CW, 300, { stroke: P.hair }));
    const cats = Object.entries(payload.delays?.categories || {}).sort((a, b) => b[1] - a[1]).slice(0, 2);
    const headline = stats.delayCount
      ? `${stats.delayCount} delay event${stats.delayCount === 1 ? "" : "s"}, ${stats.delayDays} day${stats.delayDays === 1 ? "" : "s"} in all.`
      : "No delay events were logged.";
    items.push(text("SITE CONDITIONS", M + 32, by + 64, { font: "mono", size: 18, weight: 500, color: P.muted, ls: 3 }));
    const hl = fit(m, headline, { font: "display", weight: 800 }, CW - 64, [52, 44, 38], 2);
    hl.lines.forEach((l, i) => items.push(text(l, M + 32, by + 130 + i * (hl.size + 6), { size: hl.size, weight: 800, color: P.ink })));
    const detail = cats.length ? `Mostly ${cats.map((c) => `${c[0].toLowerCase()} (${c[1]}d)`).join(", ")}. Handover still landed.` : "The schedule held from groundbreaking to handover.";
    items.push(text(ellipsize(m, detail, { size: 26, weight: 500 }, CW - 64), M + 32, by + 250, { size: 26, weight: 500, color: P.muted }));
  });

  collage("final-ten", 10, "The final ten percent", "final", "Finishes, facade and handover  ·  90 to 100 percent", "The final ten percent");

  /* 11 then & now */
  add("then-now", false, (items) => {
    items.push(eyebrow(P, "CHAPTER 11  —  THEN AND NOW"));
    items.push(...heading(P, m, "Then and now", 330).items);
    const before = payload.beforeAfter?.before || null;
    const after = payload.beforeAfter?.after || null;
    const top = 470;
    const ph = 560;
    const bd = before ? fmtParts(before.date) : null;
    const ad = after ? fmtParts(after.date) : null;
    items.push(...plate(P, m, before, { x: M, y: top, w: CW, h: ph }, before ? `FIRST LOG${bd ? `  ${bd.short}` : ""}` : ""));
    items.push(...plate(P, m, after, { x: M, y: top + ph + 24, w: CW, h: ph }, after ? `HANDOVER${ad ? `  ${ad.short}` : ""}` : ""));
    const gap = bd && ad ? Math.max(0, Math.round((ad.ms - bd.ms) / 86400000)) : null;
    items.push(text(gap !== null ? `${gap} DAYS BETWEEN THE FIRST SITE LOG AND THE LAST` : "FIRST SITE LOG  ·  HANDOVER", M, 1700, { font: "mono", size: 20, weight: 500, color: P.muted, ls: 3 }));
  });

  /* 12 seal */
  add("seal", false, (items) => {
    items.push(eyebrow(P, "CHAPTER 12  —  HANDOVER SEAL"));
    const arch = payload.archetype || { title: "The Steady Build", rationale: [] };
    const h = fit(m, arch.title, { font: "display", weight: 800 }, CW, [108, 96, 84, 72], 3);
    h.lines.forEach((l, i) => items.push(text(l, M, 380 + i * (h.size + 8), { size: h.size, weight: 800, color: P.ink })));
    let y = 380 + (h.lines.length - 1) * (h.size + 8) + 80;
    items.push(text("WHY THIS ONE", M, y, { font: "mono", size: 18, weight: 500, color: P.muted, ls: 3 }));
    y += 24;
    (arch.rationale || []).slice(0, 4).forEach((r) => {
      items.push(hline(M, STORY_W - M, y, P.hair));
      const lines = wrap(m, r, { size: 30, weight: 500 }, CW - 40).slice(0, 2);
      lines.forEach((l, i) => items.push(text(l, M + 40, y + 52 + i * 38, { size: 30, weight: 500, color: P.ink })));
      items.push(text("—", M, y + 52, { size: 30, weight: 600, color: P.accent }));
      y += 52 + lines.length * 38 + 16;
    });
    items.push(hline(M, STORY_W - M, y, P.hair));

    // total + seal
    const baseY = 1540;
    items.push(text(String(stats.totalDays || 0), M - 10, baseY, { size: 220, weight: 800, color: P.ink }));
    items.push(text("days, inquiry to handover", M, baseY + 56, { size: 34, weight: 700, color: P.ink }));
    items.push(text("Built by MCPA Construction and Supply", M, baseY + 112, { font: "mono", size: 18, weight: 500, color: P.muted, ls: 2 }));
    const sx = STORY_W - M - 250;
    const sy = baseY - 190;
    items.push(rect(sx, sy, 250, 250, { stroke: P.accent, sw: 2 }));
    items.push(rect(sx + 10, sy + 10, 230, 230, { stroke: P.hair }));
    items.push(text("MCPA", sx + 125, sy + 112, { size: 58, weight: 800, color: P.accent, align: "center" }));
    items.push(text("HANDED OVER", sx + 125, sy + 154, { font: "mono", size: 18, weight: 600, color: P.ink, ls: 3, align: "center" }));
    const t = D("turnover");
    if (t) items.push(text(t.full, sx + 125, sy + 190, { font: "mono", size: 18, weight: 500, color: P.muted, ls: 2, align: "center" }));
  });

  return build.map((b, i) => {
    const title = CHAPTER_TITLES[i];
    const items = chrome(P, i, total, payload, title);
    b.body(items, i);
    return { id: b.id, index: i, title, shuffle: b.shuffle, items, bg: P.bg };
  });
}
