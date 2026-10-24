/**
 * Finished Project service (Stage 4 / COMPLETED)
 * ---------------------------------------------------------------------------
 * - Builds the end-to-end project dossier (Day-1 inquiry -> final handover)
 * - Auto-syncs >= 90% progress still photos into the Projects Showcase (draft)
 * - Computes the 12-chapter "Wrapped" payload from real records
 * - Redacts peso amounts / street address / GPS for the public share link
 *
 * Every figure is derived from rows that already exist in the database; nothing
 * is invented. When a source record is missing the related field is simply null
 * and the UI hides that chapter detail.
 */
const crypto = require("crypto");
const db = require("./dbFailoverEngine");
const { ensureStage4Schema } = require("./stage4Schema");
const { STAGE_NAMES } = require("../middleware/stageGate");

const WRAPPED_VERSION = 2;
const SHOWCASE_PCT_THRESHOLD = 90;
const POOL_LIMIT = 30;
const VIDEO_RE = /\.(mp4|webm|mov|mkv|avi|m4v)(\?|$)/i;
const DAY_MS = 86400000;

const q = (sql, params = []) =>
  db
    .query(sql, params)
    .then((r) => r.rows || [])
    .catch((err) => {
      console.warn("[finishedProjectService] query notice:", err.message);
      return [];
    });

function safeDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function iso(value) {
  const d = safeDate(value);
  return d ? d.toISOString() : null;
}

function daysBetween(a, b) {
  const da = safeDate(a);
  const dbb = safeDate(b);
  if (!da || !dbb) return null;
  return Math.max(0, Math.round((dbb.getTime() - da.getTime()) / DAY_MS));
}

function isStill(photo) {
  if (!photo || !photo.image_url) return false;
  if (photo.is_360) return false;
  const type = (photo.media_type || "image").toLowerCase();
  return type === "image" && !VIDEO_RE.test(photo.image_url);
}

/** "12 Rizal St., Brgy. X, Plaridel, Bulacan, Philippines" -> "Plaridel, Bulacan" */
function toCityProvince(location) {
  if (!location || typeof location !== "string") return "";
  const parts = location
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p && !/^philippines$/i.test(p) && !/^\d{4}$/.test(p));
  if (parts.length <= 2) return parts.join(", ");
  return parts.slice(-2).join(", ");
}

/** "300" -> "300 sqm", "300 sqm" -> "300 sqm" (intake forms store both shapes). */
function withUnit(value, unit) {
  if (value === null || value === undefined || value === "") return "";
  const text = String(value).trim();
  return new RegExp(unit, "i").test(text) ? text : `${text} ${unit}`;
}

function storeyLabel(value) {
  if (!value) return "";
  const text = String(value).trim();
  return /storey|story|floor/i.test(text) ? text : `${text} storey`;
}

function firstName(fullName) {
  if (!fullName) return "";
  const cleaned = String(fullName).replace(/^(mr\.|ms\.|mrs\.|engr\.|arch\.|dr\.)\s*/i, "").trim();
  return cleaned.split(/\s+/)[0] || "";
}

/**
 * Resolve a progress % for every still photo. Photos stamped by the new
 * addPhotoLog flow carry the real value. Legacy photos (NULL) get a monotone
 * position-based estimate where the last quarter of the archive maps to 90-100.
 */
function resolveStills(photos) {
  const stills = photos
    .filter(isStill)
    .sort((a, b) => (safeDate(a.created_at)?.getTime() || 0) - (safeDate(b.created_at)?.getTime() || 0) || a.log_id - b.log_id);
  const total = stills.length;
  return stills.map((p, idx) => {
    const explicit = p.progress_pct === null || p.progress_pct === undefined ? null : Number(p.progress_pct);
    let pct = explicit;
    let estimated = false;
    if (pct === null || Number.isNaN(pct)) {
      const f = total <= 1 ? 1 : idx / (total - 1);
      pct = f <= 0.75 ? Math.round((f / 0.75) * 89) : 90 + Math.round(((f - 0.75) / 0.25) * 10);
      estimated = true;
    }
    return {
      id: p.log_id,
      url: p.image_url,
      title: p.title || "",
      caption: p.caption || "",
      date: iso(p.created_at),
      pct: Math.max(0, Math.min(100, pct)),
      estimated,
    };
  });
}

function evenSample(list, limit) {
  if (list.length <= limit) return list;
  const out = [];
  for (let i = 0; i < limit; i += 1) out.push(list[Math.floor((i * list.length) / limit)]);
  return out;
}

function buildPools(stills) {
  const early = stills.filter((s) => s.pct <= 35);
  const mid = stills.filter((s) => s.pct > 35 && s.pct < SHOWCASE_PCT_THRESHOLD);
  const final = stills.filter((s) => s.pct >= SHOWCASE_PCT_THRESHOLD);
  return {
    early: evenSample(early, POOL_LIMIT),
    mid: evenSample(mid, POOL_LIMIT),
    final: evenSample(final, POOL_LIMIT),
    all: evenSample(stills, POOL_LIMIT * 2),
  };
}

function pickArchetype(sig) {
  const rationale = [];
  if (sig.consultations) rationale.push(`${sig.consultations} consultation session${sig.consultations === 1 ? "" : "s"} before ground was broken`);
  if (sig.blueprintRevisions) rationale.push(`${sig.blueprintSheets} drawing sheet${sig.blueprintSheets === 1 ? "" : "s"}, up to revision ${sig.blueprintRevisions}`);
  if (sig.delayCount) rationale.push(`${sig.delayCount} site delay event${sig.delayCount === 1 ? "" : "s"} logged (${sig.delayDays} day${sig.delayDays === 1 ? "" : "s"})`);
  else rationale.push("no site delay events logged");
  if (sig.imagesLogged) rationale.push(`${sig.imagesLogged} verified progress photos`);

  let key = "steady";
  let title = "The Steady Build";
  if (sig.delayCount > 0 && sig.delayDays >= 3) {
    key = "weathered";
    title = "The Weather-Tested Build";
  } else if (sig.blueprintRevisions >= 3 || sig.consultations >= 4) {
    key = "collaborative";
    title = "The Collaborative Design";
  } else if (sig.delayCount === 0 && sig.buildDays !== null && sig.buildDays > 0 && sig.milestones >= 3) {
    key = "clockwork";
    title = "The Clockwork Build";
  } else if (sig.buildDays && sig.imagesLogged / Math.max(1, sig.buildDays / 7) >= 4) {
    key = "documented";
    title = "The Fully Documented Build";
  }
  return { key, title, rationale: rationale.slice(0, 4) };
}

async function loadProjectContext(clientProjectId) {
  const cpRows = await q(
    `SELECT cp.*, u.email AS client_email, u.full_name AS client_name
       FROM public.client_projects cp
       LEFT JOIN public.users u ON u.user_id = cp.user_id
      WHERE cp.client_project_id = $1 LIMIT 1;`,
    [clientProjectId]
  );
  const cp = cpRows[0];
  if (!cp) return null;

  const siteCodes = [cp.site_project_code, cp.project_code].filter(Boolean);
  const [spRows, briefRows] = await Promise.all([
    q(`SELECT * FROM public.site_projects WHERE project_code = ANY($1::text[]) OR client_project_id = $2 LIMIT 1;`, [siteCodes, clientProjectId]),
    q(
      `SELECT * FROM public.client_briefs WHERE brief_id = $1 OR client_project_id = $2 ORDER BY brief_id ASC LIMIT 1;`,
      [cp.brief_id || -1, clientProjectId]
    ),
  ]);
  const sp = spRows[0] || null;
  const brief = briefRows[0] || null;
  const code = sp?.project_code || cp.site_project_code || cp.project_code;
  const codes = [...new Set([code, cp.project_code, cp.site_project_code].filter(Boolean))];

  const [
    transitions, meetings, blueprints, permits, contracts, quotations, groundbreaking,
    milestones, delays, billing, photos, wrappedRows, showcaseRows,
  ] = await Promise.all([
    q(`SELECT * FROM public.stage_transitions WHERE client_project_id = $1 ORDER BY created_at ASC, transition_id ASC;`, [clientProjectId]),
    q(
      `SELECT * FROM public.meeting_history_logs
        WHERE project_code = ANY($1::text[]) OR ($2::text IS NOT NULL AND room_code = $2)
        ORDER BY created_at ASC;`,
      [codes, brief?.meeting_room_code || null]
    ),
    q(`SELECT * FROM public.blueprints WHERE client_project_id = $1 ORDER BY created_at ASC;`, [clientProjectId]),
    q(`SELECT * FROM public.permit_records WHERE client_project_id = $1 ORDER BY created_at ASC;`, [clientProjectId]),
    q(`SELECT * FROM public.contracts WHERE client_project_id = $1 ORDER BY created_at ASC;`, [clientProjectId]),
    q(`SELECT * FROM public.client_quotations WHERE client_project_id = $1 ORDER BY quotation_id DESC;`, [clientProjectId]),
    q(`SELECT * FROM public.groundbreaking_history WHERE client_project_id = $1 ORDER BY created_at ASC;`, [clientProjectId]),
    q(`SELECT * FROM public.site_milestones WHERE project_code = ANY($1::text[]) ORDER BY phase_code ASC;`, [codes]),
    q(`SELECT * FROM public.delay_events WHERE project_code = ANY($1::text[]) ORDER BY logged_at ASC;`, [codes]),
    q(`SELECT * FROM public.billing_ledger WHERE project_code = ANY($1::text[]) OR client_project_id = $2 ORDER BY bill_id ASC;`, [codes, clientProjectId]),
    q(`SELECT * FROM public.site_photo_logs WHERE project_code = ANY($1::text[]) ORDER BY created_at ASC, log_id ASC;`, [codes]),
    q(`SELECT * FROM public.project_wrapped WHERE client_project_id = $1 LIMIT 1;`, [clientProjectId]),
    q(`SELECT project_id, is_web_visible, images, name FROM public.projects WHERE source_client_project_id = $1 LIMIT 1;`, [clientProjectId]),
  ]);

  return {
    cp, sp, brief, code, transitions, meetings, blueprints, permits, contracts,
    quotation: quotations.find((x) => /approved|accepted|signed|published/i.test(x.status || "")) || quotations[0] || null,
    groundbreaking, milestones, delays, billing, photos,
    wrapped: wrappedRows[0] || null,
    showcase: showcaseRows[0] || null,
  };
}

function resolveKeyDates(ctx) {
  const { cp, brief, transitions, groundbreaking, photos, meetings, blueprints, contracts, sp } = ctx;
  const inquiry = safeDate(brief?.created_at) || safeDate(cp.created_at);
  const trans = (stage) => transitions.find((t) => t.to_stage === stage);
  const consult = trans("CONSULTATION") || trans("PRE_CONSTRUCTION");
  const build = trans("ACTIVE_BUILD");
  const done = [...transitions].reverse().find((t) => t.to_stage === "COMPLETED");

  const firstMeeting = safeDate(meetings[0]?.meeting_date) || safeDate(meetings[0]?.created_at) || safeDate(brief?.meeting_date);
  const gbDate = safeDate(groundbreaking[groundbreaking.length - 1]?.scheduled_date) || safeDate(cp.groundbreaking_date);
  const firstPhoto = safeDate(photos[0]?.created_at);
  const contractSigned = safeDate(contracts[0]?.created_at);

  let designStart = safeDate(consult?.created_at) || firstMeeting || safeDate(blueprints[0]?.created_at) || inquiry;
  let buildStart = safeDate(build?.created_at) || gbDate || firstPhoto || contractSigned || designStart;
  let turnover =
    safeDate(done?.created_at) ||
    (cp.stage_id === "COMPLETED" ? safeDate(cp.updated_at) : null) ||
    safeDate(photos[photos.length - 1]?.created_at) ||
    new Date();

  // keep the sequence monotone so no phase ever shows negative days
  if (inquiry && designStart < inquiry) designStart = inquiry;
  if (buildStart < designStart) buildStart = designStart;
  if (turnover < buildStart) turnover = buildStart;

  return { inquiry, designStart, buildStart, turnover, firstMeeting, gbDate, contractSigned, siteContractDate: safeDate(sp?.contract_date) };
}

function buildTimeline(ctx, dates, { includeAmounts = false } = {}) {
  const { brief, transitions, meetings, blueprints, permits, contracts, quotation, groundbreaking, delays, billing, photos } = ctx;
  const ev = [];
  const inquiryAt = safeDate(dates.inquiry);
  const push = (at, phase, kind, title, detail = "") => {
    let d = safeDate(at);
    // Date-only records (meeting_date) land at midnight UTC; never let them precede the inquiry itself.
    if (d && inquiryAt && kind !== "inquiry" && d < inquiryAt && inquiryAt - d < DAY_MS) d = inquiryAt;
    if (d) ev.push({ at: d.toISOString(), phase, kind, title, detail });
  };

  push(dates.inquiry, 1, "inquiry", "Inquiry submitted", [brief?.project_type, storeyLabel(brief?.storeys), brief?.lot_area ? `${withUnit(brief.lot_area, "sqm")} lot` : null].filter(Boolean).join(" · "));

  transitions.forEach((t) => {
    const phase = t.to_stage === "ACTIVE_BUILD" ? 3 : t.to_stage === "COMPLETED" ? 4 : t.to_stage === "PRE_INQUIRY" ? 1 : 2;
    push(t.created_at, phase, "stage", `Advanced to ${STAGE_NAMES[t.to_stage] || t.to_stage}`, t.reason || "");
  });

  if (!meetings.length && brief?.meeting_date) {
    push(brief.meeting_date, 2, "meeting", "Consultation scheduled", [brief.meeting_mode, brief.meeting_time].filter(Boolean).join(" · "));
  }
  meetings.forEach((m) => {
    const mins = m.duration_seconds ? Math.round(m.duration_seconds / 60) : null;
    push(m.meeting_date || m.created_at, 2, "meeting", m.round_title || "Consultation session", [m.mode, mins ? `${mins} min` : m.duration].filter(Boolean).join(" · "));
  });

  if (quotation) {
    push(quotation.published_at || quotation.created_at, 2, "boq", "BOQ & quotation published", quotation.duration_months ? `${quotation.duration_months}-month schedule` : "");
  }

  if (blueprints.length) {
    const disciplines = [...new Set(blueprints.map((b) => b.discipline).filter(Boolean))];
    push(blueprints[0].created_at, 2, "blueprint", "Drawing set issued", `${blueprints.length} sheet${blueprints.length === 1 ? "" : "s"}${disciplines.length ? ` · ${disciplines.join(", ")}` : ""}`);
    const lastRev = [...blueprints].sort((a, b) => (safeDate(b.updated_at)?.getTime() || 0) - (safeDate(a.updated_at)?.getTime() || 0))[0];
    const maxRev = Math.max(...blueprints.map((b) => Number(b.revision_no) || 0));
    if (maxRev > 0 && daysBetween(blueprints[0].created_at, lastRev.updated_at) >= 1) {
      push(lastRev.updated_at, 2, "blueprint", `Drawings revised to Rev ${maxRev}`);
    }
  }

  permits.forEach((p) => {
    push(p.filing_date || p.created_at, 2, "permit", `Filed ${p.permit_type || "permit"}`, p.lgu_agency || "");
    if (p.actual_release_date) push(p.actual_release_date, 2, "permit", `Released ${p.permit_type || "permit"}`, p.lgu_agency || "");
  });

  contracts.forEach((c) => {
    push(c.created_at, 2, "contract", "Contract executed", [c.contract_number, includeAmounts && c.total_contract_amount ? `PHP ${Number(c.total_contract_amount).toLocaleString("en-PH")}` : null].filter(Boolean).join(" · "));
  });

  groundbreaking.forEach((g) => {
    if (/cancel/i.test(g.status || "")) return;
    push(g.scheduled_date, 3, "groundbreaking", g.previous_date ? "Groundbreaking rescheduled" : "Groundbreaking ceremony", g.venue || "");
  });

  if (photos[0]) push(photos[0].created_at, 3, "site", "First site photo logged", photos[0].title || "");
  const crossed = photos.find((p) => Number(p.progress_pct) >= SHOWCASE_PCT_THRESHOLD);
  if (crossed) push(crossed.created_at, 3, "site", "Reached 90% accomplishment", crossed.title || "");

  delays.forEach((d) => {
    push(d.logged_at, 3, "delay", `Site delay logged · ${d.category || "General"}`, d.days_delayed ? `${d.days_delayed} day${Number(d.days_delayed) === 1 ? "" : "s"}` : "");
  });

  billing.forEach((b) => {
    if (b.paid_date && /paid|verified|settled/i.test(b.status || "")) {
      push(b.paid_date, 3, "billing", `Payment verified · ${b.milestone_title || "Progress billing"}`, includeAmounts && b.amount_due ? `PHP ${Number(b.amount_due).toLocaleString("en-PH")}` : "");
    }
  });

  push(dates.turnover, 4, "handover", "Turnover & key handover", "Project completed");
  return ev.sort((a, b) => new Date(a.at) - new Date(b.at));
}

function buildStats(ctx, dates, stills) {
  const { milestones, delays, billing, meetings, blueprints, permits, photos } = ctx;
  const delayDays = delays.reduce((s, d) => s + (Number(d.days_delayed) || 0), 0);
  const videos = photos.filter((p) => !isStill(p) && !p.is_360).length;
  const paid = billing.filter((b) => /paid|verified|settled/i.test(b.status || ""));
  const logDays = new Set(photos.map((p) => iso(p.created_at)?.slice(0, 10)).filter(Boolean)).size;
  const consultMinutes = meetings.reduce((s, m) => s + (Number(m.duration_seconds) ? Math.round(Number(m.duration_seconds) / 60) : 0), 0);
  return {
    totalDays: daysBetween(dates.inquiry, dates.turnover),
    buildDays: daysBetween(dates.buildStart, dates.turnover),
    consultations: meetings.length,
    consultationMinutes: consultMinutes,
    blueprintSheets: blueprints.length,
    blueprintRevisions: blueprints.reduce((m, b) => Math.max(m, Number(b.revision_no) || 0), 0),
    permitsTotal: permits.length,
    permitsReleased: permits.filter((p) => p.actual_release_date || /releas|approv|issued/i.test(p.status || "")).length,
    milestones: milestones.length,
    milestonesCompleted: milestones.filter((m) => Number(m.completion_pct) >= 100).length,
    delayCount: delays.length,
    delayDays,
    imagesLogged: stills.length,
    videosLogged: videos,
    siteLogDays: logDays,
    inspectors: new Set(photos.map((p) => (p.inspector || "").trim()).filter(Boolean)).size,
    billingTranches: billing.length,
    billingSettled: paid.length,
    billingFullySettled: billing.length > 0 && paid.length === billing.length,
  };
}

function buildPhases(dates) {
  return [
    { key: "inquiry", label: "Inquiry & Pool", start: iso(dates.inquiry), end: iso(dates.designStart), days: daysBetween(dates.inquiry, dates.designStart) },
    { key: "planning", label: "Consultation & Planning", start: iso(dates.designStart), end: iso(dates.buildStart), days: daysBetween(dates.designStart, dates.buildStart) },
    { key: "construction", label: "Site Construction", start: iso(dates.buildStart), end: iso(dates.turnover), days: daysBetween(dates.buildStart, dates.turnover) },
    { key: "handover", label: "Turnover & Handover", start: iso(dates.turnover), end: iso(dates.turnover), days: 0 },
  ];
}

function composeWrappedPayload(ctx) {
  const dates = resolveKeyDates(ctx);
  const stills = resolveStills(ctx.photos);
  const pools = buildPools(stills);
  const stats = buildStats(ctx, dates, stills);
  const { cp, brief, quotation, milestones, delays, groundbreaking } = ctx;
  const gb = groundbreaking[groundbreaking.length - 1] || null;

  const finalStills = stills.filter((s) => s.pct >= SHOWCASE_PCT_THRESHOLD);
  const before = stills[0] || null;
  const after = finalStills[finalStills.length - 1] || stills[stills.length - 1] || null;

  const delayCategories = {};
  delays.forEach((d) => {
    const k = d.category || "General";
    delayCategories[k] = (delayCategories[k] || 0) + (Number(d.days_delayed) || 0);
  });

  return {
    version: WRAPPED_VERSION,
    generatedAt: new Date().toISOString(),
    project: {
      title: cp.project_title || "Your Residence",
      type: cp.project_type || brief?.project_type || "Residential",
      projectCode: cp.project_code || ctx.code,
      cityProvince: toCityProvince(cp.target_location || brief?.location || ctx.sp?.location),
      clientFirstName: firstName(cp.client_name || brief?.client_name),
      storeys: brief?.storeys || null,
      lotArea: brief?.lot_area || null,
      floorArea: quotation?.floor_area_sqm ? Number(quotation.floor_area_sqm) : null,
      preferredStyle: brief?.preferred_style || null,
      completionYear: dates.turnover.getFullYear(),
    },
    dates: {
      inquiry: iso(dates.inquiry),
      firstConsultation: iso(dates.firstMeeting),
      contractSigned: iso(dates.contractSigned),
      quotationPublished: iso(quotation?.published_at || quotation?.created_at),
      blueprintsIssued: iso(ctx.blueprints[0]?.created_at),
      groundbreaking: iso(dates.gbDate),
      buildStart: iso(dates.buildStart),
      turnover: iso(dates.turnover),
    },
    phases: buildPhases(dates),
    stats,
    consultations: ctx.meetings.slice(0, 40).map((m) => ({
      date: iso(m.meeting_date || m.created_at),
      minutes: m.duration_seconds ? Math.round(Number(m.duration_seconds) / 60) : 0,
    })),
    groundbreaking: gb ? { date: iso(gb.scheduled_date), venue: gb.venue || null } : null,
    milestones: milestones.map((m) => ({ name: m.phase_name, pct: Number(m.completion_pct) || 0, targetDate: m.target_date || null })),
    delays: { count: stats.delayCount, days: stats.delayDays, categories: delayCategories },
    pools,
    beforeAfter: { before, after },
    archetype: pickArchetype(stats),
  };
}

/** Strip anything that must never reach an unauthenticated visitor. */
function sanitizeWrappedForPublic(row) {
  if (!row) return row;
  const payload = row.wrapped_payload && typeof row.wrapped_payload === "object" ? { ...row.wrapped_payload } : {};
  delete payload.private;
  const project = { ...(payload.project || {}) };
  delete project.address;
  delete project.coordinates;
  payload.project = project;
  return {
    wrapped_id: row.wrapped_id,
    share_token: row.share_token,
    before_photo_url: row.before_photo_url,
    after_photo_url: row.after_photo_url,
    project_title: row.project_title || project.title,
    project_type: row.project_type || project.type,
    city_province: project.cityProvince || "",
    wrapped_payload: payload,
    created_at: row.created_at,
  };
}

async function getOrCreateWrapped(clientProjectId, { forceRefresh = false, ctx: providedCtx = null } = {}) {
  await ensureStage4Schema();
  const ctx = providedCtx || (await loadProjectContext(clientProjectId));
  if (!ctx) return null;

  const existing = ctx.wrapped;
  const payload0 = existing?.wrapped_payload;
  const hasPayload = payload0 && typeof payload0 === "object" && payload0.version === WRAPPED_VERSION;
  if (existing && hasPayload && !forceRefresh) return existing;

  const payload = composeWrappedPayload(ctx);
  const before = payload.beforeAfter.before?.url || null;
  const after = payload.beforeAfter.after?.url || null;
  const totalDays = payload.stats.totalDays || 0;
  const photoTotal = payload.stats.imagesLogged + payload.stats.videosLogged;

  const legacyCards = [
    { id: "intro", headline: "From Vision to Reality", subtext: `${payload.project.title} reached 100% completion.`, metric: "100%", metricLabel: "Completed" },
    { id: "duration", headline: "Inquiry to Handover", subtext: "Every phase, from first inquiry to key turnover.", metric: `${totalDays} Days`, metricLabel: "Total Journey" },
    { id: "craft", headline: "Site Records", subtext: `${photoTotal} progress logs across ${payload.stats.milestones} milestones.`, metric: `${photoTotal}`, metricLabel: "Progress Logs" },
  ];

  if (existing) {
    const upd = await db.query(
      `UPDATE public.project_wrapped
          SET wrapped_payload = $1::jsonb, total_days_duration = $2, total_photos_logged = $3,
              before_photo_url = $4, after_photo_url = $5, story_cards = $6::jsonb
        WHERE wrapped_id = $7 RETURNING *;`,
      [JSON.stringify(payload), totalDays, photoTotal, before, after, JSON.stringify(legacyCards), existing.wrapped_id]
    );
    return upd.rows[0];
  }

  const shareToken = `mcpa-wrapped-${crypto.randomBytes(6).toString("hex")}`;
  const ins = await db.query(
    `INSERT INTO public.project_wrapped (
        client_project_id, total_days_duration, total_workers_employed, total_concrete_bags, total_steel_kg,
        total_photos_logged, before_photo_url, after_photo_url, story_cards, wrapped_payload, share_token, is_public_shared, created_at
     ) VALUES ($1, $2, 0, 0, 0, $3, $4, $5, $6::jsonb, $7::jsonb, $8, TRUE, NOW()) RETURNING *;`,
    [clientProjectId, totalDays, photoTotal, before, after, JSON.stringify(legacyCards), JSON.stringify(payload), shareToken]
  );
  return ins.rows[0];
}

function parseBedBath(text) {
  const s = typeof text === "string" ? text : JSON.stringify(text || "");
  const bed = s.match(/(\d+)\s*[- ]?\s*(?:bed(?:room)?s?|BR)\b/i) || s.match(/bed(?:room)?s?\D{0,12}(\d+)/i);
  const bath = s.match(/(\d+)\s*[- ]?\s*(?:bath(?:room)?s?|T&B|CR)\b/i) || s.match(/bath(?:room)?s?\D{0,12}(\d+)/i);
  return { bedrooms: bed ? bed[1] : null, bathrooms: bath ? bath[1] : null };
}

/**
 * Selects >= 90% still photos for the Showcase.
 * Priority: stamped progress_pct >= 90; legacy photos use the estimated 90-100 bucket.
 */
function selectShowcaseImages(photos) {
  return resolveStills(photos)
    .filter((s) => s.pct >= SHOWCASE_PCT_THRESHOLD)
    .sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0))
    .map((s) => s.url);
}

async function syncFinishedProjectToShowcase(clientProjectId, { forceResync = false, ctx: providedCtx = null } = {}) {
  await ensureStage4Schema();
  const ctx = providedCtx || (await loadProjectContext(clientProjectId));
  if (!ctx) return { synced: false, reason: "Project not found." };

  const images = selectShowcaseImages(ctx.photos);
  const dates = resolveKeyDates(ctx);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const { cp, brief, quotation } = ctx;
  const { bedrooms, bathrooms } = parseBedBath(brief?.spatial_wishlist);
  const cityProvince = toCityProvince(cp.target_location || brief?.location || ctx.sp?.location);
  const totalDays = daysBetween(dates.inquiry, dates.turnover);
  const description = `Turnkey ${(cp.project_type || "residential").toLowerCase()} build${cityProvince ? ` in ${cityProvince}` : ""}, delivered by MCPA${totalDays ? ` ${totalDays} days from first inquiry to key handover` : ""}.`;
  const details = [
    brief?.storeys ? `Storeys: ${brief.storeys}` : null,
    brief?.preferred_style ? `Style: ${brief.preferred_style}` : null,
    quotation?.floor_area_sqm ? `Floor area: ${Number(quotation.floor_area_sqm)} sqm` : null,
  ].filter(Boolean).join("\n");

  const existing = ctx.showcase;
  if (existing) {
    const current = Array.isArray(existing.images) ? existing.images.filter(Boolean) : [];
    if (!forceResync && current.length > 0) {
      return { synced: true, created: false, projectId: existing.project_id, imageCount: current.length, untouched: true };
    }
    const merged = [...new Set([...images, ...current])];
    await db.query("UPDATE public.projects SET images = $1 WHERE project_id = $2;", [merged, existing.project_id]);
    return { synced: true, created: false, projectId: existing.project_id, imageCount: merged.length };
  }

  const ins = await db.query(
    `INSERT INTO public.projects (
        name, location, category, year, month, status, description, images,
        is_admin_added, is_web_visible, featured_on_home, lot_area, floor_area, bedrooms, bathrooms,
        features, architectural_details, source_client_project_id, source_project_code
     ) VALUES ($1, $2, $3, $4, $5, 'completed', $6, $7, TRUE, FALSE, FALSE, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING project_id;`,
    [
      cp.project_title || "Completed Project",
      cityProvince,
      cp.project_type || "Residential",
      String(dates.turnover.getFullYear()),
      months[dates.turnover.getMonth()],
      description,
      images,
      brief?.lot_area ? withUnit(brief.lot_area, "sqm") : null,
      quotation?.floor_area_sqm ? withUnit(Number(quotation.floor_area_sqm), "sqm") : null,
      bedrooms,
      bathrooms,
      [],
      details || null,
      clientProjectId,
      ctx.code || null,
    ]
  );
  return { synced: true, created: true, projectId: ins.rows[0]?.project_id, imageCount: images.length };
}

async function buildDossier(ctx, { audience = "admin" } = {}) {
  const dates = resolveKeyDates(ctx);
  const stills = resolveStills(ctx.photos);
  const stats = buildStats(ctx, dates, stills);
  const includeAmounts = audience === "admin" || audience === "client";
  const finalPhotos = stills
    .filter((s) => s.pct >= SHOWCASE_PCT_THRESHOLD)
    .reverse()
    .slice(0, 12);
  const { cp, brief, quotation, wrapped, showcase } = ctx;

  const settledAmount = ctx.billing
    .filter((b) => /paid|verified|settled/i.test(b.status || ""))
    .reduce((s, b) => s + (Number(b.amount_due) || 0), 0);

  return {
    clientProjectId: cp.client_project_id,
    projectCode: cp.project_code || ctx.code,
    title: cp.project_title || "Untitled Project",
    type: cp.project_type || brief?.project_type || "Residential",
    clientName: cp.client_name || brief?.client_name || "",
    clientEmail: cp.client_email || brief?.client_email || "",
    location: cp.target_location || brief?.location || "",
    cityProvince: toCityProvince(cp.target_location || brief?.location),
    storeys: brief?.storeys || null,
    lotArea: brief?.lot_area || null,
    floorArea: quotation?.floor_area_sqm ? Number(quotation.floor_area_sqm) : null,
    leadEngineer: ctx.sp?.lead_engineer || null,
    inquiryDate: iso(dates.inquiry),
    turnoverDate: iso(dates.turnover),
    stats,
    phases: buildPhases(dates),
    timeline: buildTimeline(ctx, dates, { includeAmounts }),
    heroPhoto: finalPhotos[0]?.url || stills[stills.length - 1]?.url || null,
    finalPhotos,
    contractAmount: includeAmounts && ctx.contracts[0]?.total_contract_amount ? Number(ctx.contracts[0].total_contract_amount) : null,
    settledAmount: includeAmounts ? settledAmount : null,
    showcase: showcase
      ? { projectId: showcase.project_id, isWebVisible: Boolean(showcase.is_web_visible), imageCount: Array.isArray(showcase.images) ? showcase.images.length : 0 }
      : null,
    wrapped: wrapped
      ? { shareToken: wrapped.share_token, isPublicShared: Boolean(wrapped.is_public_shared), onboardingCompletedAt: wrapped.onboarding_completed_at || null }
      : null,
  };
}

async function getFinishedProjectsDossier({ role, userId, email }) {
  await ensureStage4Schema();
  const isAdmin = ["admin", "super_admin", "engineer", "architect"].includes(String(role || "").toLowerCase());
  const rows = isAdmin
    ? await q(`SELECT client_project_id FROM public.client_projects WHERE stage_id = 'COMPLETED' ORDER BY updated_at DESC NULLS LAST;`)
    : await q(
        `SELECT cp.client_project_id FROM public.client_projects cp
           LEFT JOIN public.users u ON u.user_id = cp.user_id
          WHERE cp.stage_id = 'COMPLETED' AND (cp.user_id = $1 OR LOWER(u.email) = LOWER($2))
          ORDER BY cp.updated_at DESC NULLS LAST;`,
        [userId || -1, email || ""]
      );

  const dossiers = [];
  for (const row of rows) {
    const ctx = await loadProjectContext(row.client_project_id);
    if (!ctx) continue;
    // Self-heal: completed projects that predate the auto-sync get their draft + wrapped on first view.
    if (isAdmin && !ctx.showcase) {
      try {
        await syncFinishedProjectToShowcase(row.client_project_id, { ctx });
        const refreshed = await q(`SELECT project_id, is_web_visible, images, name FROM public.projects WHERE source_client_project_id = $1 LIMIT 1;`, [row.client_project_id]);
        ctx.showcase = refreshed[0] || null;
      } catch (e) {
        console.warn("[finishedProjectService] lazy showcase sync notice:", e.message);
      }
    }
    if (!ctx.wrapped || !ctx.wrapped.wrapped_payload || ctx.wrapped.wrapped_payload.version !== WRAPPED_VERSION) {
      try {
        ctx.wrapped = await getOrCreateWrapped(row.client_project_id, { ctx });
      } catch (e) {
        console.warn("[finishedProjectService] lazy wrapped notice:", e.message);
      }
    }
    dossiers.push(await buildDossier(ctx, { audience: isAdmin ? "admin" : "client" }));
  }
  return dossiers;
}

/** Ownership guard shared by wrapped endpoints. */
async function assertProjectAccess(clientProjectId, user) {
  const role = String(user?.role || "").toLowerCase();
  if (["admin", "super_admin", "engineer", "architect"].includes(role)) return true;
  const rows = await q(
    `SELECT 1 FROM public.client_projects cp LEFT JOIN public.users u ON u.user_id = cp.user_id
      WHERE cp.client_project_id = $1 AND (cp.user_id = $2 OR LOWER(u.email) = LOWER($3)) LIMIT 1;`,
    [clientProjectId, user?.userId || -1, user?.email || ""]
  );
  if (!rows.length) {
    const err = new Error("You do not have access to this project.");
    err.statusCode = 403;
    throw err;
  }
  return true;
}

async function markOnboardingSeen(clientProjectId) {
  await ensureStage4Schema();
  const rows = await db.query(
    "UPDATE public.project_wrapped SET onboarding_completed_at = COALESCE(onboarding_completed_at, NOW()) WHERE client_project_id = $1 RETURNING *;",
    [clientProjectId]
  );
  return rows.rows[0] || null;
}

async function updateShareSettings(clientProjectId, { isPublicShared, rotateToken }) {
  await ensureStage4Schema();
  const sets = [];
  const params = [];
  if (typeof isPublicShared === "boolean") {
    params.push(isPublicShared);
    sets.push(`is_public_shared = $${params.length}`);
  }
  if (rotateToken) {
    params.push(`mcpa-wrapped-${crypto.randomBytes(6).toString("hex")}`);
    sets.push(`share_token = $${params.length}`);
  }
  if (!sets.length) return null;
  params.push(clientProjectId);
  const rows = await db.query(
    `UPDATE public.project_wrapped SET ${sets.join(", ")} WHERE client_project_id = $${params.length} RETURNING *;`,
    params
  );
  return rows.rows[0] || null;
}

async function getPublicWrappedByToken(shareToken) {
  await ensureStage4Schema();
  const rows = await q(
    `SELECT pw.*, cp.project_title, cp.project_type
       FROM public.project_wrapped pw
       JOIN public.client_projects cp ON pw.client_project_id = cp.client_project_id
      WHERE pw.share_token = $1 AND pw.is_public_shared = TRUE LIMIT 1;`,
    [shareToken]
  );
  if (!rows.length) {
    const err = new Error("Project recap not found or private.");
    err.statusCode = 404;
    throw err;
  }
  let row = rows[0];
  const p = row.wrapped_payload;
  if (!p || p.version !== WRAPPED_VERSION) {
    const fresh = await getOrCreateWrapped(row.client_project_id, { forceRefresh: true });
    row = { ...row, ...fresh };
  }
  return sanitizeWrappedForPublic(row);
}

/** Runs after a project reaches COMPLETED. Never throws into the stage transition. */
async function onProjectCompleted(clientProjectId) {
  try {
    const ctx = await loadProjectContext(clientProjectId);
    if (!ctx) return;
    await syncFinishedProjectToShowcase(clientProjectId, { ctx });
    await getOrCreateWrapped(clientProjectId, { forceRefresh: true, ctx });
  } catch (err) {
    console.warn("[finishedProjectService] onProjectCompleted notice:", err.message);
  }
}

module.exports = {
  WRAPPED_VERSION,
  SHOWCASE_PCT_THRESHOLD,
  loadProjectContext,
  composeWrappedPayload,
  buildDossier,
  selectShowcaseImages,
  syncFinishedProjectToShowcase,
  getOrCreateWrapped,
  getFinishedProjectsDossier,
  getPublicWrappedByToken,
  sanitizeWrappedForPublic,
  assertProjectAccess,
  markOnboardingSeen,
  updateShareSettings,
  onProjectCompleted,
};
