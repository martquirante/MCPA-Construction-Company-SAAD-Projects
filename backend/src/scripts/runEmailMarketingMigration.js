require("dotenv").config();
const { ensureEmailMarketingSchema } = require("../services/emailMarketingSchema");

async function main() {
  console.log("Starting Email Marketing schema verification...");
  const success = await ensureEmailMarketingSchema();
  if (success) {
    console.log("Email Marketing schema initialized & verified successfully!");
    process.exit(0);
  } else {
    console.error("Email Marketing schema failed.");
    process.exit(1);
  }
}

main();
