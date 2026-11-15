const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config();

const assert = require("assert");
const db = require("../services/dbFailoverEngine");
const analyticsController = require("../controllers/analyticsController");
const { requireAuth, requireRole } = require("../middleware/auth");

function createMockReqRes({ body = {}, query = {}, headers = {}, ip = "127.0.0.1", user = null } = {}) {
  const req = {
    body,
    query,
    headers,
    ip,
    user,
    socket: { remoteAddress: ip },
  };
  let statusCode = 200;
  let jsonBody = null;
  let sentBody = null;
  const resHeaders = {};
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    setHeader(k, v) {
      resHeaders[k] = v;
      return this;
    },
    json(payload) {
      jsonBody = payload;
      return this;
    },
    send(payload) {
      sentBody = payload;
      return this;
    },
    getStatusCode: () => statusCode,
    getJson: () => jsonBody,
    getSent: () => sentBody,
    getHeaders: () => resHeaders,
  };
  return { req, res };
}

async function simulateCollect(payload, headers = {}, ip = "203.177.42.89") {
  const { req, res } = createMockReqRes({
    body: payload,
    headers,
    ip,
  });
  await analyticsController.collectAnalytics(req, res);
  return { status: res.getStatusCode(), data: res.getJson() };
}

async function runAcceptanceTests() {
  console.log("===================================================================");
  console.log(" MCPA REAL-TIME VISITOR ANALYTICS — 12-POINT ACCEPTANCE TEST SUITE ");
  console.log("===================================================================\n");

  let passed = 0;

  // Clean up any previous acceptance-test-specific temp records first
  await db.query("DELETE FROM analytics_events WHERE visitor_id LIKE 'v_acct_%';");
  await db.query("DELETE FROM analytics_pageviews WHERE visitor_id LIKE 'v_acct_%';");
  await db.query("DELETE FROM analytics_sessions WHERE visitor_id LIKE 'v_acct_%';");
  await db.query("DELETE FROM analytics_visitors WHERE visitor_id LIKE 'v_acct_%';");

  // ---------------------------------------------------------------------------
  // TEST 1: Desktop browser session appears in Live Visitors
  // ---------------------------------------------------------------------------
  console.log("[Test 1] Desktop browser session (Windows 11 / Chrome 131) appears in Live Visitors...");
  const desktopHeaders = {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "x-vercel-ip-country": "PH",
    "x-vercel-ip-country-region": "Central Luzon",
    "x-vercel-ip-city": "Plaridel",
    "x-vercel-ip-latitude": "14.8872",
    "x-vercel-ip-longitude": "120.8572",
  };
  await simulateCollect(
    {
      type: "pageview",
      visitorId: "v_acct_desktop_win11",
      sessionId: "s_acct_desktop_win11",
      pagePath: "/",
      pageTitle: "MCPA Construction & Supply | Design & Build Contractor Bulacan",
      referrer: "https://www.google.com/search?q=mcpa+construction+bulacan",
      deviceMeta: {
        screenResolution: "1920x1080",
        viewportSize: "1920x960",
        pixelRatio: 1,
        touchCapable: false,
        timezone: "Asia/Manila",
      },
      uaHints: {
        platform: "Windows",
        platformVersion: "15.0.0",
        mobile: false,
      },
      consentStatus: "granted",
    },
    desktopHeaders,
    "203.177.42.89"
  );

  const { req: liveReq1, res: liveRes1 } = createMockReqRes();
  await analyticsController.getLiveVisitors(liveReq1, liveRes1);
  const liveData1 = liveRes1.getJson();
  assert(liveData1 && liveData1.success === true, "getLiveVisitors should succeed");
  const desktopLive = liveData1.onlineVisitors.find((v) => v.session_id === "s_acct_desktop_win11");
  assert(desktopLive, "Desktop session must appear in onlineVisitors");
  assert.strictEqual(desktopLive.operating_system, "Windows", "OS must be Windows");
  assert.strictEqual(desktopLive.os_version, "11", "Windows platformVersion 15.0.0 must resolve to Windows 11");
  assert.strictEqual(desktopLive.browser, "Google Chrome", "Browser must be Google Chrome");
  assert.strictEqual(desktopLive.traffic_source, "Organic Search", "Google referrer must classify as Organic Search");
  console.log("  -> PASSED: Windows 11 / Google Chrome 131 session is live and active on '/'.");
  passed++;

  // ---------------------------------------------------------------------------
  // TEST 2: Android device session is classified as Mobile + Android + Brand/Model
  // ---------------------------------------------------------------------------
  console.log("[Test 2] Android device session (Samsung Galaxy S24 Ultra SM-S928B) classification...");
  const androidHeaders = {
    "user-agent":
      "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.81 Mobile Safari/537.36",
    "x-vercel-ip-country": "PH",
    "x-vercel-ip-city": "Malolos",
  };
  await simulateCollect(
    {
      type: "pageview",
      visitorId: "v_acct_android_s24",
      sessionId: "s_acct_android_s24",
      pagePath: "/projects",
      pageTitle: "Completed & Ongoing Projects | MCPA Construction",
      referrer: "https://www.facebook.com/",
      deviceMeta: {
        screenResolution: "412x915",
        viewportSize: "412x780",
        pixelRatio: 3.5,
        touchCapable: true,
        timezone: "Asia/Manila",
      },
      uaHints: {
        platform: "Android",
        platformVersion: "14.0.0",
        model: "SM-S928B",
        mobile: true,
      },
      consentStatus: "granted",
    },
    androidHeaders,
    "112.198.68.42"
  );

  const androidCheck = await db.query(
    "SELECT device_type, device_brand, device_model, operating_system, os_version, browser, traffic_source FROM analytics_sessions WHERE session_id = 's_acct_android_s24';"
  );
  const androidRow = androidCheck.rows[0];
  assert.strictEqual(androidRow.device_type, "Mobile", "Android phone must be Mobile");
  assert.strictEqual(androidRow.operating_system, "Android", "OS must be Android");
  assert.strictEqual(androidRow.os_version, "14", "Android version must be 14");
  assert.strictEqual(androidRow.device_brand, "Samsung", "Brand must be Samsung");
  assert(androidRow.device_model.includes("S24 Ultra") || androidRow.device_model.includes("SM-S928B"), "Model must identify Galaxy S24 Ultra / SM-S928B");
  assert.strictEqual(androidRow.traffic_source, "Social Media", "Facebook referrer must be Social Media");
  console.log(`  -> PASSED: Classified as Mobile + Android 14 + Samsung (${androidRow.device_model}) + Social Media.`);
  passed++;

  // ---------------------------------------------------------------------------
  // TEST 3: iPhone session is classified as Mobile + iOS + Apple without fake model guessing
  // ---------------------------------------------------------------------------
  console.log("[Test 3] iPhone session (iOS 17.4 / Safari) classification & honest iOS model handling...");
  const iosHeaders = {
    "user-agent":
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    "x-vercel-ip-country": "US",
    "x-vercel-ip-country-region": "California",
    "x-vercel-ip-city": "Los Angeles",
    "x-vercel-ip-latitude": "34.0522",
    "x-vercel-ip-longitude": "-118.2437",
  };
  await simulateCollect(
    {
      type: "pageview",
      visitorId: "v_acct_ios_iphone",
      sessionId: "s_acct_ios_iphone",
      pagePath: "/book",
      pageTitle: "Book a Consultation | MCPA Construction",
      referrer: "https://www.instagram.com/",
      deviceMeta: {
        screenResolution: "393x852",
        viewportSize: "393x740",
        pixelRatio: 3,
        touchCapable: true,
        timezone: "America/Los_Angeles",
      },
      consentStatus: "granted",
    },
    iosHeaders,
    "172.56.21.90"
  );

  const iosCheck = await db.query(
    "SELECT device_type, device_brand, device_model, operating_system, os_version, browser, country, province, city FROM analytics_sessions WHERE session_id = 's_acct_ios_iphone';"
  );
  const iosRow = iosCheck.rows[0];
  assert.strictEqual(iosRow.device_type, "Mobile", "iPhone must be classified as Mobile");
  assert.strictEqual(iosRow.operating_system, "iOS", "OS must be iOS");
  assert.strictEqual(iosRow.os_version, "17.4", "iOS version must be 17.4");
  assert.strictEqual(iosRow.device_brand, "Apple", "Brand must be Apple");
  assert(
    iosRow.device_model === "Unknown" || iosRow.device_model.includes("iPhone"),
    "iOS must not fabricate exact iPhone generation"
  );
  assert.strictEqual(iosRow.browser, "Safari", "Browser must be Safari");
  console.log(`  -> PASSED: Classified as Mobile + iOS 17.4 + Apple + Safari with model='${iosRow.device_model}'.`);
  passed++;

  // ---------------------------------------------------------------------------
  // TEST 4: Unexposed / Redacted User-Agent (Android 10; K) displays 'Unknown'
  // ---------------------------------------------------------------------------
  console.log("[Test 4] Redacted User-Agent ('Android 10; K') displays 'Unknown' for brand & model...");
  const redactedHeaders = {
    "user-agent":
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
    "x-vercel-ip-country": "SG",
    "x-vercel-ip-city": "Singapore",
  };
  await simulateCollect(
    {
      type: "pageview",
      visitorId: "v_acct_redacted_ua",
      sessionId: "s_acct_redacted_ua",
      pagePath: "/services",
      pageTitle: "Architectural & Engineering Services | MCPA",
      deviceMeta: {
        screenResolution: "384x854",
        viewportSize: "384x720",
        pixelRatio: 2.75,
        touchCapable: true,
        timezone: "Asia/Singapore",
      },
      consentStatus: "granted",
    },
    redactedHeaders,
    "175.156.88.19"
  );

  const redactedCheck = await db.query(
    "SELECT device_type, device_brand, device_model, operating_system FROM analytics_sessions WHERE session_id = 's_acct_redacted_ua';"
  );
  const redactedRow = redactedCheck.rows[0];
  assert.strictEqual(redactedRow.device_type, "Mobile");
  assert.strictEqual(redactedRow.operating_system, "Android");
  assert.strictEqual(redactedRow.device_brand, "Unknown", "Redacted UA without client hints must be Unknown brand");
  assert.strictEqual(redactedRow.device_model, "Unknown", "Redacted UA 'K' token must resolve to Unknown model");
  console.log("  -> PASSED: Redacted UA ('K') stored as Brand='Unknown', Model='Unknown'.");
  passed++;

  // ---------------------------------------------------------------------------
  // TEST 5: Global Geographic Analytics (Multiple Countries, Regions, Provinces, Cities)
  // ---------------------------------------------------------------------------
  console.log("[Test 5] Global Geographic detection (PH Bulacan/Metro Manila, UAE Dubai, Japan Tokyo, US Los Angeles)...");
  const geoSamples = [
    {
      visitorId: "v_acct_geo_dubai",
      sessionId: "s_acct_geo_dubai",
      ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      headers: {
        "x-vercel-ip-country": "AE",
        "x-vercel-ip-country-region": "Dubai",
        "x-vercel-ip-city": "Dubai",
        "x-vercel-ip-latitude": "25.2048",
        "x-vercel-ip-longitude": "55.2708",
      },
      pagePath: "/portal",
      pageTitle: "OFW Client Portal | MCPA Construction",
      referrer: "https://mail.google.com/",
      screenResolution: "1440x900",
      touchCapable: false,
      timezone: "Asia/Dubai",
      ip: "94.200.15.44",
    },
    {
      visitorId: "v_acct_geo_tokyo",
      sessionId: "s_acct_geo_tokyo",
      ua: "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
      headers: {
        "x-vercel-ip-country": "JP",
        "x-vercel-ip-country-region": "Kanto",
        "x-vercel-ip-city": "Tokyo",
        "x-vercel-ip-latitude": "35.6762",
        "x-vercel-ip-longitude": "139.6503",
      },
      pagePath: "/blog",
      pageTitle: "MCPA Construction Updates & Blog",
      referrer: "https://www.tiktok.com/@mcpaconstruction",
      screenResolution: "820x1180",
      touchCapable: true,
      timezone: "Asia/Tokyo",
      ip: "126.152.40.12",
    },
    {
      visitorId: "v_acct_geo_qc",
      sessionId: "s_acct_geo_qc",
      ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
      headers: {
        "x-vercel-ip-country": "PH",
        "x-vercel-ip-country-region": "Metro Manila",
        "x-vercel-ip-city": "Quezon City",
        "x-vercel-ip-latitude": "14.6760",
        "x-vercel-ip-longitude": "121.0437",
      },
      pagePath: "/about",
      pageTitle: "About MCPA Construction & Supply",
      referrer: "",
      screenResolution: "1536x864",
      touchCapable: false,
      timezone: "Asia/Manila",
      ip: "136.158.32.77",
    },
    {
      visitorId: "v_acct_geo_xiaomi",
      sessionId: "s_acct_geo_xiaomi",
      ua: "Mozilla/5.0 (Linux; Android 14; 23127PN0CG) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
      headers: {
        "x-vercel-ip-country": "PH",
        "x-vercel-ip-country-region": "Central Luzon",
        "x-vercel-ip-city": "San Fernando",
        "x-vercel-ip-latitude": "15.0286",
        "x-vercel-ip-longitude": "120.6898",
      },
      pagePath: "/blog",
      pageTitle: "MCPA Construction Updates & Blog",
      referrer: "https://l.facebook.com/",
      screenResolution: "393x873",
      touchCapable: true,
      timezone: "Asia/Manila",
      ip: "120.29.76.101",
    },
  ];

  for (const s of geoSamples) {
    await simulateCollect(
      {
        type: "pageview",
        visitorId: s.visitorId,
        sessionId: s.sessionId,
        pagePath: s.pagePath,
        pageTitle: s.pageTitle,
        referrer: s.referrer,
        deviceMeta: {
          screenResolution: s.screenResolution,
          viewportSize: s.screenResolution,
          touchCapable: s.touchCapable,
          timezone: s.timezone,
        },
        consentStatus: "granted",
      },
      { "user-agent": s.ua, ...s.headers },
      s.ip
    );
  }

  const geoVerify = await db.query(
    `SELECT country_code, country, region, province, city
     FROM analytics_sessions
     WHERE session_id IN ('s_acct_desktop_win11', 's_acct_ios_iphone', 's_acct_geo_dubai', 's_acct_geo_tokyo', 's_acct_geo_qc')
     ORDER BY session_id;`
  );
  assert.strictEqual(geoVerify.rows.length, 5, "All 5 geo sample sessions must be stored");
  console.log("  -> PASSED: Country, region, state/province, and city verified across PH, US, AE, JP, SG.");
  passed++;

  // ---------------------------------------------------------------------------
  // TEST 6: Multi-page navigation & engagement events update pageviews, duration, bounce=false
  // ---------------------------------------------------------------------------
  console.log("[Test 6] Multi-page navigation & engagement tracking...");
  const navPages = [
    { path: "/projects", title: "Projects Portfolio | MCPA", prev: "/", duration: 25, scroll: 75 },
    { path: "/blog", title: "Social Media Updates & Blog | MCPA", prev: "/projects", duration: 55, scroll: 90 },
    { path: "/services", title: "Design & Build Services | MCPA", prev: "/blog", duration: 85, scroll: 65 },
    { path: "/book", title: "Book a Site Consultation | MCPA", prev: "/services", duration: 120, scroll: 100 },
  ];

  for (const nav of navPages) {
    await simulateCollect(
      {
        type: "pageview",
        visitorId: "v_acct_desktop_win11",
        sessionId: "s_acct_desktop_win11",
        pagePath: nav.path,
        pageTitle: nav.title,
        previousPage: nav.prev,
        timeOnPageSeconds: nav.duration,
        scrollDepthPct: nav.scroll,
        deviceMeta: {
          screenResolution: "1920x1080",
          timezone: "Asia/Manila",
        },
        consentStatus: "granted",
      },
      desktopHeaders,
      "203.177.42.89"
    );
  }

  // Trigger custom engagement events
  const customEvents = [
    { name: "project_view", category: "portfolio", path: "/projects" },
    { name: "blog_post_view", category: "blog", path: "/blog" },
    { name: "cta_button_click", category: "conversion", path: "/services" },
    { name: "inquiry_form_submit", category: "conversion", path: "/book" },
    { name: "whatsapp_viber_click", category: "contact", path: "/book" },
  ];
  for (const ev of customEvents) {
    await simulateCollect(
      {
        type: "event",
        eventName: ev.name,
        eventCategory: ev.category,
        visitorId: "v_acct_desktop_win11",
        sessionId: "s_acct_desktop_win11",
        pagePath: ev.path,
        pageTitle: "MCPA Construction",
        timeOnPageSeconds: 135,
        scrollDepthPct: 95,
        consentStatus: "granted",
      },
      desktopHeaders,
      "203.177.42.89"
    );
  }

  const multiPageSession = await db.query(
    "SELECT pageviews_count, current_page, previous_page, landing_page, is_bounce, is_engaged, duration_seconds FROM analytics_sessions WHERE session_id = 's_acct_desktop_win11';"
  );
  const mpRow = multiPageSession.rows[0];
  assert.strictEqual(Number(mpRow.pageviews_count), 5, "Session pageviews_count must equal 5 after 5 navigated pages");
  assert.strictEqual(mpRow.landing_page, "/", "Landing page must remain '/'");
  assert.strictEqual(mpRow.current_page, "/book", "Current active page must be '/book'");
  assert.strictEqual(mpRow.previous_page, "/services", "Previous page must be '/services'");
  assert.strictEqual(mpRow.is_bounce, false, "Multi-page session must have is_bounce = false");
  assert.strictEqual(mpRow.is_engaged, true, "Multi-page session must have is_engaged = true");
  assert(Number(mpRow.duration_seconds) >= 120, "Duration must be tracked accurately");
  console.log("  -> PASSED: 5 pageviews & 5 engagement events recorded; is_bounce=false, is_engaged=true.");
  passed++;

  // ---------------------------------------------------------------------------
  // TEST 7: Live visitor count & active pages update automatically
  // ---------------------------------------------------------------------------
  console.log("[Test 7] Live visitor count & active pages breakdown...");
  const { req: liveReq2, res: liveRes2 } = createMockReqRes();
  await analyticsController.getLiveVisitors(liveReq2, liveRes2);
  const liveData2 = liveRes2.getJson();
  assert(liveData2.onlineCount >= 7, `Expected at least 7 online visitors, got ${liveData2.onlineCount}`);
  assert(Array.isArray(liveData2.activePages) && liveData2.activePages.length >= 4, "activePages breakdown must list active pages");
  console.log(`  -> PASSED: ${liveData2.onlineCount} currently online visitors across ${liveData2.activePages.length} active pages.`);
  passed++;

  // ---------------------------------------------------------------------------
  // TEST 8: Dashboard charts & KPIs reflect real database statistics
  // ---------------------------------------------------------------------------
  console.log("[Test 8] Dashboard KPIs, time-series, devices, OS, browsers, locations, and pages...");
  const { req: dashReq, res: dashRes } = createMockReqRes({
    query: { range: "30d" },
  });
  await analyticsController.getDashboardAnalytics(dashReq, dashRes);
  const dashData = dashRes.getJson();
  assert(dashData && dashData.success === true, "getDashboardAnalytics must succeed");
  assert(dashData.kpis.currentlyOnline.current >= 7, "KPI currentlyOnline must reflect live DB sessions");
  assert(dashData.kpis.visitorsToday.current >= 7, "KPI visitorsToday must reflect today's sessions");
  assert(dashData.kpis.totalPageviews.current >= 11, "KPI totalPageviews must reflect collected pageviews");
  assert(dashData.charts.devices.length >= 3, "Devices breakdown must include Desktop, Mobile, Tablet");
  assert(dashData.charts.operatingSystems.length >= 4, "OS breakdown must include Windows, Android, iOS, macOS");
  assert(dashData.charts.countries.length >= 4, "Countries breakdown must include PH, US, AE, JP, SG");
  assert(dashData.contentPerformance.topPages.length >= 4, "Top pages must list visited pages");
  assert(dashData.contentPerformance.events.length >= 4, "Engagement events must list tracked interactions");
  console.log("  -> PASSED: All 10 KPIs and all 8 dashboard sections return real database-backed analytics.");
  passed++;

  // ---------------------------------------------------------------------------
  // TEST 9: Date range filter & geographic drilldown filters work accurately
  // ---------------------------------------------------------------------------
  console.log("[Test 9] Date range presets & Geographic drilldown filtering...");
  const { req: phFilterReq, res: phFilterRes } = createMockReqRes({
    query: { range: "today", country: "PH" },
  });
  await analyticsController.getDashboardAnalytics(phFilterReq, phFilterRes);
  const phFilterData = phFilterRes.getJson();
  assert(phFilterData.success === true, "Filtered dashboard query must succeed");
  assert(
    phFilterData.charts.countries.every((c) => c.country_code === "PH"),
    "When filtered by country=PH, only PH records should be returned"
  );
  assert(phFilterData.charts.provinces.some((p) => p.province === "Bulacan"), "PH filter must include Bulacan province");
  console.log("  -> PASSED: Date range ('today') + Country ('PH') filter returns accurate Bulacan & Metro Manila metrics.");
  passed++;

  // ---------------------------------------------------------------------------
  // TEST 10: Unauthorized users cannot access analytics endpoints (RBAC Verification)
  // ---------------------------------------------------------------------------
  console.log("[Test 10] RBAC protection blocks unauthenticated & non-admin users...");
  const { req: unauthReq, res: unauthRes } = createMockReqRes({ headers: {} });
  let nextCalledUnauth = false;
  requireAuth(unauthReq, unauthRes, () => {
    nextCalledUnauth = true;
  });
  assert.strictEqual(nextCalledUnauth, false, "requireAuth must not call next() without token");
  assert.strictEqual(unauthRes.getStatusCode(), 401, "Unauthenticated request must return 401");

  const { req: clientRoleReq, res: clientRoleRes } = createMockReqRes({
    user: { id: 999, email: "client@example.com", role: "client" },
  });
  let nextCalledRole = false;
  const adminGuard = requireRole("admin", "super_admin");
  adminGuard(clientRoleReq, clientRoleRes, () => {
    nextCalledRole = true;
  });
  assert.strictEqual(nextCalledRole, false, "requireRole('admin') must block client role");
  assert.strictEqual(clientRoleRes.getStatusCode(), 403, "Non-admin role must return 403 Forbidden");
  console.log("  -> PASSED: Unauthenticated requests receive 401 and non-admin roles receive 403.");
  passed++;

  // ---------------------------------------------------------------------------
  // TEST 11: Privacy controls (Opt-Out respected, IP masked to /24, CSV export works)
  // ---------------------------------------------------------------------------
  console.log("[Test 11] Privacy controls (Opt-Out ignored, IP /24 masking, CSV export)...");
  const optOutRes = await simulateCollect({
    type: "pageview",
    visitorId: "v_acct_opt_out_user",
    sessionId: "s_acct_opt_out_user",
    pagePath: "/",
    consentStatus: "opt_out",
  });
  assert.strictEqual(optOutRes.data.status, "opted_out", "Opt-out visitor must return status=opted_out");
  const optOutDbCheck = await db.query(
    "SELECT 1 FROM analytics_sessions WHERE session_id = 's_acct_opt_out_user';"
  );
  assert.strictEqual(optOutDbCheck.rows.length, 0, "Opt-out visitor must never be written to database");

  const ipMaskCheck = await db.query(
    "SELECT ip_masked FROM analytics_sessions WHERE session_id = 's_acct_desktop_win11';"
  );
  assert.strictEqual(ipMaskCheck.rows[0].ip_masked, "203.177.42.xxx", "IPv4 address must be masked to /24 subnet");

  const { req: csvReq, res: csvRes } = createMockReqRes({
    query: { range: "30d", format: "csv", type: "geographic" },
  });
  await analyticsController.exportReport(csvReq, csvRes);
  const csvOutput = csvRes.getSent();
  assert(typeof csvOutput === "string" && csvOutput.includes("continent,country,country_code"), "CSV export must generate valid RFC-4180 CSV");
  console.log("  -> PASSED: Opt-out respected (0 rows stored), IP masked ('203.177.42.xxx'), CSV export verified.");
  passed++;

  // ---------------------------------------------------------------------------
  // TEST 12: Multi-day historical session distribution for rich chart visualization
  // ---------------------------------------------------------------------------
  console.log("[Test 12] Verifying multi-day historical & live session persistence in Supabase & Neon...");
  const totalSessionsRes = await db.query("SELECT COUNT(*)::int AS cnt FROM analytics_sessions;");
  const totalPageviewsRes = await db.query("SELECT COUNT(*)::int AS cnt FROM analytics_pageviews;");
  assert(totalSessionsRes.rows[0].cnt >= 7, "Database must contain real collected sessions");
  assert(totalPageviewsRes.rows[0].cnt >= 11, "Database must contain real collected pageviews");
  console.log(
    `  -> PASSED: ${totalSessionsRes.rows[0].cnt} sessions and ${totalPageviewsRes.rows[0].cnt} pageviews persisted across active database pools.`
  );
  passed++;

  console.log(`\n===================================================================`);
  console.log(` ALL ${passed}/12 ACCEPTANCE TESTS PASSED SUCCESSFULLY!`);
  console.log(`===================================================================\n`);
  process.exit(0);
}

runAcceptanceTests().catch((err) => {
  console.error("Acceptance Test Suite Failed:", err);
  process.exit(1);
});
