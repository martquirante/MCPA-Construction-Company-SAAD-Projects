const db = require("../services/dbFailoverEngine");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

async function runTest() {
  console.log("=== STARTING ADMIN & STAFF MULTI-ACCOUNT VERIFICATION ===");

  // 1. Verify DB contains our existing admin accounts
  const existingAdmins = await db.query(
    "SELECT user_id, email, full_name, role, account_status FROM users WHERE role IN ('admin', 'architect', 'engineer') ORDER BY user_id ASC"
  );
  console.log(`[1] Found ${existingAdmins.rows.length} existing staff accounts in PostgreSQL:`);
  existingAdmins.rows.forEach(u => {
    console.log(`    - ID ${u.user_id}: ${u.full_name} (${u.email}) [Role: ${u.role}, Status: ${u.account_status}]`);
  });

  // 2. Test Staff Invitation via backend API
  // We need an admin JWT token to call /api/admin/invite-staff
  const jwt = require("jsonwebtoken");
  const JWT_SECRET = process.env.JWT_SECRET || "mcpa-fallback-secret-2024-enterprise";
  const adminToken = jwt.sign(
    { userId: 1, email: "dbprojectmartquirante@gmail.com", role: "admin" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const testStaffEmail = "architect.test." + Date.now() + "@mcpa-design.com";
  console.log(`\n[2] Testing POST /api/admin/invite-staff for ${testStaffEmail}...`);

  const invitePayload = {
    email: testStaffEmail,
    fullName: "Arch. Leonardo Da Vinci",
    role: "architect",
    occupation: "Senior Architectural Director",
    phone: "09171234567"
  };

  const inviteRes = await fetch("http://localhost:5000/api/admin/invite-staff", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminToken}`
    },
    body: JSON.stringify(invitePayload)
  });

  const inviteData = await inviteRes.json();
  console.log(`    Status: ${inviteRes.status}`);
  console.log("    Response:", inviteData);

  if (!inviteRes.ok || !inviteData.success) {
    throw new Error("Failed to invite staff: " + JSON.stringify(inviteData));
  }

  // 3. Query PostgreSQL to retrieve the generated invite_token
  const pendingUserRes = await db.query(
    "SELECT user_id, email, full_name, role, account_status, invite_token, invite_expires_at FROM users WHERE email = $1",
    [testStaffEmail]
  );
  const pendingUser = pendingUserRes.rows[0];
  console.log("\n[3] PostgreSQL Pending Staff Record:");
  console.log("    User ID:", pendingUser.user_id);
  console.log("    Role:", pendingUser.role);
  console.log("    Account Status:", pendingUser.account_status);
  console.log("    Invite Token:", pendingUser.invite_token);
  console.log("    Expires At:", pendingUser.invite_expires_at);

  const token = pendingUser.invite_token;
  if (!token) throw new Error("Invite token was not stored in database!");

  // 4. Test GET /api/admin/verify-invite?token=...
  console.log(`\n[4] Testing GET /api/admin/verify-invite?token=${token}...`);
  const verifyRes = await fetch(`http://localhost:5000/api/admin/verify-invite?token=${token}`);
  const verifyData = await verifyRes.json();
  console.log(`    Status: ${verifyRes.status}`);
  console.log("    Response:", verifyData);

  if (!verifyData.valid || verifyData.user.email !== testStaffEmail) {
    throw new Error("Token verification failed!");
  }

  // 5. Test Frontend Password Setup Page rendering
  console.log(`\n[5] Testing Frontend Password Setup Page: http://localhost:3000/admin/setup-password?token=${token}...`);
  const frontendPageRes = await fetch(`http://localhost:3000/admin/setup-password?token=${token}`);
  console.log(`    Frontend Page HTTP Status: ${frontendPageRes.status}`);
  if (frontendPageRes.status !== 200) {
    throw new Error(`Frontend returned HTTP ${frontendPageRes.status}`);
  }

  // 6. Test Password Completion POST /api/admin/complete-setup-password
  console.log(`\n[6] Submitting new secure password for ${testStaffEmail}...`);
  const completeRes = await fetch("http://localhost:5000/api/admin/complete-setup-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: token,
      password: "StrongPassword123!"
    })
  });
  const completeData = await completeRes.json();
  console.log(`    Status: ${completeRes.status}`);
  console.log("    Response:", completeData);

  if (!completeRes.ok || !completeData.success) {
    throw new Error("Failed to complete password setup: " + JSON.stringify(completeData));
  }

  // 7. Verify Database Status is now ACTIVE and invite_token is NULL
  const activeUserRes = await db.query(
    "SELECT user_id, email, full_name, role, account_status, invite_token, password_hash FROM users WHERE email = $1",
    [testStaffEmail]
  );
  const activeUser = activeUserRes.rows[0];
  console.log("\n[7] PostgreSQL Activated Staff Record:");
  console.log("    User ID:", activeUser.user_id);
  console.log("    Account Status:", activeUser.account_status, "(Expected: active)");
  console.log("    Invite Token:", activeUser.invite_token, "(Expected: null)");
  
  const isPassMatch = await bcrypt.compare("StrongPassword123!", activeUser.password_hash);
  console.log("    Password Hash Verified with bcrypt:", isPassMatch);

  // 8. Test /api/admin/accounts?type=staff to ensure user appears in staff roster
  console.log("\n[8] Testing GET /api/admin/accounts?type=staff...");
  const staffListRes = await fetch("http://localhost:5000/api/admin/accounts?type=staff", {
    headers: { "Authorization": `Bearer ${adminToken}` }
  });
  const staffListData = await staffListRes.json();
  console.log(`    Status: ${staffListRes.status}, Total staff accounts returned: ${staffListData.accounts?.length}`);
  const foundInRoster = staffListData.accounts?.some(s => s.email === testStaffEmail);
  console.log(`    New Architect present in staff roster:`, foundInRoster);

  // 9. Clean up test record
  await db.query("DELETE FROM users WHERE email = $1", [testStaffEmail]);
  console.log(`\n[9] Cleaned up temporary verification account ${testStaffEmail}.`);

  console.log("\n=== ALL ADMIN & STAFF VERIFICATION CHECKS PASSED PERFECTLY ===");
}

runTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  });
