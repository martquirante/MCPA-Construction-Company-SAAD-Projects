/**
 * MCPA Construction — Automated Acceptance Test Suite (Tests 0 through 6)
 * Verifies:
 *   Test 0: Admin Accounts (`mcpa.construction@gmail.com`, `contact@mcpaconstruction.com`, `dbprojectmartquirante@gmail.com`)
 *   Test 1: Create Post with formatted text, 5 images, 1 video, and hashtags
 *   Test 2: Edit Post caption, reorder images, add hashtag
 *   Test 3: Website-Wide CMS text update & live retrieval
 *   Test 4: Website Theme & Appearance update & reset to default
 *   Test 5: Blog Display Layout switch (Grid -> Social Feed) while preserving posts
 *   Test 6: Media Library active-post reference protection & cleanup
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("../services/dbFailoverEngine");
const cmsController = require("../controllers/cmsController");

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

async function runTests() {
  console.log("=================================================================");
  console.log("  MCPA SOCIAL BLOG & DYNAMIC CMS — ACCEPTANCE TEST SUITE         ");
  console.log("=================================================================");

  await new Promise((r) => setTimeout(r, 1500));

  // Clean up any leftover test post from previous run
  await db.query(`DELETE FROM blog_posts WHERE title LIKE 'Acceptance Test:%'`);

  // ---------------------------------------------------------------------------
  // TEST 0: Verify Admin Accounts & Password Authentication
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 0: Admin Accounts & Password Verification ---");
  const staffRes = await db.query(
    `SELECT user_id, email, full_name, role, account_status, email_verified, password_hash
     FROM public.users
     WHERE role IN ('admin', 'architect', 'engineer')
     ORDER BY user_id ASC`
  );
  const emails = staffRes.rows.map((u) => u.email.toLowerCase());
  assert(emails.includes("mcpa.construction@gmail.com"), "mcpa.construction@gmail.com exists in staff");
  assert(emails.includes("contact@mcpaconstruction.com"), "contact@mcpaconstruction.com exists in staff");
  assert(emails.includes("dbprojectmartquirante@gmail.com"), "dbprojectmartquirante@gmail.com is preserved");
  assert(emails.length === 3, `Only the 3 authorized admin accounts remain in staff (found ${emails.length}: ${emails.join(", ")})`);

  for (const targetEmail of ["mcpa.construction@gmail.com", "contact@mcpaconstruction.com"]) {
    const user = staffRes.rows.find((u) => u.email.toLowerCase() === targetEmail);
    assert(user.role === "admin", `${targetEmail} has role='admin'`);
    assert(user.account_status === "active", `${targetEmail} has account_status='active' (not pending)`);
    assert(user.email_verified === true, `${targetEmail} has email_verified=true`);
    const passMatch = await bcrypt.compare("MCPAcons@2026", user.password_hash);
    assert(passMatch === true, `${targetEmail} authenticates with password 'MCPAcons@2026'`);
  }

  // ---------------------------------------------------------------------------
  // TEST 1: Create Post (Formatted text, 5 images, 1 video, hashtags)
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 1: Create Post (5 Images + 1 Video + Rich Text + Hashtags) ---");
  const fiveImages = [
    { url: "/images/hero-poster.jpg", file_name: "site-progress-1.jpg", media_type: "image", caption: "Front elevation view" },
    { url: "/images/about-1.jpg", file_name: "site-progress-2.jpg", media_type: "image", caption: "Structural column rebar" },
    { url: "/images/about-2.jpg", file_name: "site-progress-3.jpg", media_type: "image", caption: "Second floor slab formworks" },
    { url: "/images/about-3.jpg", file_name: "site-progress-4.jpg", media_type: "image", caption: "Roof beam steel framing" },
    { url: "/assets/hero-residence-day-wide-v2.jpg", file_name: "site-progress-5.jpg", media_type: "image", caption: "Site safety inspection" },
  ];
  const oneVideo = {
    url: "/videos/hero-drone.mp4",
    file_name: "drone-flyover.mp4",
    media_type: "video",
    thumbnail_url: "/images/hero-poster.jpg",
    caption: "Aerial drone flyover of site progress",
  };

  const createReq = {
    user: { userId: 1, email: "mcpa.construction@gmail.com", fullName: "MCPA Engr. Pau", role: "admin" },
    ip: "127.0.0.1",
    body: {
      title: "Acceptance Test: 2-Storey Residence Structural Topping-Off",
      caption: "<h2>Structural Milestone Achieved</h2><p>Our engineering team completed the <strong>second-floor slab pour</strong> ahead of schedule. Visit https://www.mcpaconstruction.com for inquiries.</p><ul><li>3,500 PSI Ready-Mix Concrete</li><li>Grade 60 Structural Rebar</li></ul>",
      post_type: "project_update",
      status: "published",
      hashtags: ["MCPAConstruction", "ConstructionProgress", "ProjectUpdates", "BuiltToLast"],
      media: [...fiveImages, oneVideo],
      link_preview: {
        url: "https://www.mcpaconstruction.com",
        title: "MCPA Construction & Supply",
        description: "Architectural Precision & Turnkey Construction in Bulacan & Central Luzon",
        image: "/images/hero-poster.jpg",
        siteName: "mcpaconstruction.com",
      },
      metadata: {
        projectName: "Acceptance Test Residence",
        location: "Malolos, Bulacan",
        progressStatus: "In Progress (65%)",
      },
    },
  };
  const createRes = createMockRes();
  await cmsController.createPost(createReq, createRes);
  assert(createRes.statusCode === 201 && createRes.body?.success, "Created post returns HTTP 201 and success=true");

  const createdPost = createRes.body.post;
  const createdPostId = createdPost.post_id;
  const createdSlug = createdPost.slug;

  assert(Array.isArray(createdPost.media) && createdPost.media.length === 6, `Created post has 6 media attachments (found ${createdPost.media?.length})`);
  assert(createdPost.media.filter((m) => m.media_type === "image").length === 5, "Created post contains 5 images");
  assert(createdPost.media.filter((m) => m.media_type === "video").length === 1, "Created post contains 1 video");
  assert(
    createdPost.hashtags.some((h) => (h.tag || h) === "mcpaconstruction"),
    "Created post includes #MCPAConstruction hashtag"
  );

  // Verify it appears on the public blog endpoint
  const pubGetReq = { params: { slug: createdSlug } };
  const pubGetRes = createMockRes();
  await cmsController.getPostBySlug(pubGetReq, pubGetRes);
  assert(pubGetRes.statusCode === 200 && pubGetRes.body?.post?.post_id === createdPostId, "Public blog endpoint serves the newly published post by slug");

  // ---------------------------------------------------------------------------
  // TEST 2: Edit Post (Modify caption, reorder images, add hashtag)
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 2: Edit Post (Update Caption, Reorder Images, Add Hashtag) ---");
  const reorderedMedia = [
    fiveImages[4], // Move 5th image (/assets/hero-residence-day-wide-v2.jpg) to 1st position
    fiveImages[0],
    fiveImages[1],
    fiveImages[2],
    fiveImages[3],
    oneVideo,
  ];
  const updateReq = {
    params: { id: String(createdPostId) },
    user: { userId: 1, email: "mcpa.construction@gmail.com", fullName: "MCPA Engr. Pau", role: "admin" },
    ip: "127.0.0.1",
    body: {
      title: "Acceptance Test: 2-Storey Residence Structural Topping-Off (Updated)",
      caption: "<h2>Updated Engineering Report</h2><p>Updated caption after structural inspection. #ModernHouse</p>",
      hashtags: ["MCPAConstruction", "ConstructionProgress", "ProjectUpdates", "BuiltToLast", "ModernHouse"],
      media: reorderedMedia,
    },
  };
  const updateRes = createMockRes();
  await cmsController.updatePost(updateReq, updateRes);
  assert(updateRes.statusCode === 200 && updateRes.body?.success, "Updated post returns HTTP 200 and success=true");

  const updatedPost = updateRes.body.post;
  assert(updatedPost.title.includes("(Updated)"), "Updated post title reflects edit");
  assert(updatedPost.media[0].url === "/assets/hero-residence-day-wide-v2.jpg", "Reordered media places 5th image at index 0 (display_order=1)");
  assert(
    updatedPost.hashtags.some((h) => (h.tag || h) === "modernhouse"),
    "Updated post includes newly added #ModernHouse hashtag"
  );

  // ---------------------------------------------------------------------------
  // TEST 3: Change Website Text (Homepage Hero Heading) & Restore
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 3: Website-Wide CMS Text Update & Live Retrieval ---");
  const contentGetRes1 = createMockRes();
  await cmsController.getWebsiteContent({ query: { page: "home" } }, contentGetRes1);
  const originalHeadingValue = contentGetRes1.body?.flatKeyMap?.heroHeading || "Build Your Forever Home";

  // Update heroHeading
  const testHeadingValue = "Engineering Generational Landmarks Across Central Luzon";
  const upsertContentReq = {
    user: { userId: 1, email: "mcpa.construction@gmail.com", role: "admin" },
    ip: "127.0.0.1",
    body: {
      items: [
        {
          page_key: "home",
          section_key: "hero",
          content_key: "heroHeading",
          content_type: "text",
          content_value: testHeadingValue,
        },
      ],
    },
  };
  const upsertContentRes = createMockRes();
  await cmsController.updateWebsiteContent(upsertContentReq, upsertContentRes);
  assert(upsertContentRes.statusCode === 200 && upsertContentRes.body?.success, "Updated homepage heroHeading via CMS API");

  // Verify public API immediately returns new value
  const contentGetRes2 = createMockRes();
  await cmsController.getWebsiteContent({ query: { page: "home" } }, contentGetRes2);
  assert(
    contentGetRes2.body?.flatKeyMap?.heroHeading === testHeadingValue,
    `Public CMS API immediately reflects updated heroHeading: "${testHeadingValue}"`
  );

  // Restore original heroHeading value
  await cmsController.updateWebsiteContent(
    {
      user: { userId: 1, email: "mcpa.construction@gmail.com", role: "admin" },
      ip: "127.0.0.1",
      body: {
        items: [
          {
            page_key: "home",
            section_key: "hero",
            content_key: "heroHeading",
            content_type: "text",
            content_value: originalHeadingValue,
          },
        ],
      },
    },
    createMockRes()
  );
  console.log(`  [PASS] Restored heroHeading to original value: "${originalHeadingValue}"`);

  // ---------------------------------------------------------------------------
  // TEST 4 & TEST 5: Change Website Theme & Switch Blog Display Layout
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 4 & 5: Website Theme Customization & Blog Layout Switching ---");
  const themeUpdateReq = {
    user: { userId: 1, email: "mcpa.construction@gmail.com", role: "admin" },
    ip: "127.0.0.1",
    body: {
      primaryColor: "#d97706",
      defaultBlogLayout: "grid",
      presetName: "Blueprint Bronze",
    },
  };
  const themeUpdateRes = createMockRes();
  await cmsController.updateThemeSettings(themeUpdateReq, themeUpdateRes);
  assert(themeUpdateRes.statusCode === 200 && themeUpdateRes.body?.theme?.primaryColor === "#d97706", "Updated primary color to #d97706");
  assert(themeUpdateRes.body?.theme?.defaultBlogLayout === "grid", "Switched blog layout to Grid View ('grid')");

  // Switch layout from Grid View to Social Feed View
  const layoutSwitchRes = createMockRes();
  await cmsController.updateThemeSettings(
    {
      user: { userId: 1, email: "mcpa.construction@gmail.com", role: "admin" },
      ip: "127.0.0.1",
      body: { defaultBlogLayout: "feed" },
    },
    layoutSwitchRes
  );
  assert(layoutSwitchRes.body?.theme?.defaultBlogLayout === "feed", "Switched blog layout from Grid View to Social Feed View ('feed')");

  // Verify posts are still intact after layout switch
  const feedPostsRes = createMockRes();
  await cmsController.getPosts({ query: { limit: 20 } }, feedPostsRes);
  assert(
    Array.isArray(feedPostsRes.body?.posts) && feedPostsRes.body.posts.some((p) => p.post_id === createdPostId),
    "All published posts remain intact after switching layouts"
  );

  // Reset theme to default MCPA Signature Amber
  const themeResetRes = createMockRes();
  await cmsController.resetThemeSettings(
    {
      user: { userId: 1, email: "mcpa.construction@gmail.com", role: "admin" },
      ip: "127.0.0.1",
    },
    themeResetRes
  );
  assert(
    themeResetRes.body?.theme?.primaryColor === "#f59e0b" &&
      themeResetRes.body?.theme?.presetName === "MCPA Signature Amber",
    "Reset theme to default MCPA Signature Amber (#f59e0b)"
  );

  // ---------------------------------------------------------------------------
  // TEST 6: Media Library Reference Protection & Clean Up Test Post
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 6: Media Library Reference Protection & Clean Up ---");
  const mediaLibRes = createMockRes();
  await cmsController.getMediaLibrary({ query: {} }, mediaLibRes);
  const inUseItem = (mediaLibRes.body?.media || []).find((m) => m.active_references > 0);
  if (inUseItem) {
    const delProtectedRes = createMockRes();
    await cmsController.deleteMediaItem(
      { params: { id: String(inUseItem.id) }, query: {}, user: { userId: 1 } },
      delProtectedRes
    );
    assert(
      delProtectedRes.statusCode === 409 && delProtectedRes.body?.inUse === true,
      `Media Library blocks accidental deletion of in-use media (${inUseItem.file_name} referenced in ${delProtectedRes.body?.referenceCount} item(s))`
    );
  }

  const deletePostRes = createMockRes();
  await cmsController.deletePost(
    { params: { id: String(createdPostId) }, user: { userId: 1, email: "mcpa.construction@gmail.com" }, ip: "127.0.0.1" },
    deletePostRes
  );
  assert(deletePostRes.statusCode === 200 && deletePostRes.body?.success, "Cleaned up temporary test post");

  console.log("\n=================================================================");
  console.log("  ALL 6 ACCEPTANCE TESTS PASSED SUCCESSFULLY!                    ");
  console.log("=================================================================");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("\n[ACCEPTANCE TEST FAILURE]:", err);
  process.exit(1);
});
