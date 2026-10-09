require("dotenv").config();
const db = require("../services/dbFailoverEngine");

async function updateBriefsMeetingDefaults() {
  try {
    console.log("Updating client_briefs meeting_mode and venue defaults...");

    await db.query(`
      ALTER TABLE client_briefs 
      ALTER COLUMN meeting_mode SET DEFAULT 'Online Video Call';
    `);

    await db.query(`
      ALTER TABLE client_briefs 
      ALTER COLUMN meeting_venue_type SET DEFAULT 'Online Video Call';
    `);

    const updateRes1 = await db.query(`
      UPDATE client_briefs 
      SET meeting_mode = 'Online Video Call' 
      WHERE meeting_mode ILIKE '%Google Meet%';
    `);

    const updateRes2 = await db.query(`
      UPDATE client_briefs 
      SET meeting_venue_type = 'Online Video Call' 
      WHERE meeting_venue_type ILIKE '%Google Meet%';
    `);

    console.log("[SUCCESS] client_briefs meeting defaults and existing records updated successfully!");
    console.log(`Updated ${updateRes1.rowCount || 0} meeting_mode rows and ${updateRes2.rowCount || 0} meeting_venue_type rows.`);
    process.exit(0);
  } catch (err) {
    console.error("[ERROR] Failed to update client_briefs:", err.message);
    process.exit(1);
  }
}

updateBriefsMeetingDefaults();
