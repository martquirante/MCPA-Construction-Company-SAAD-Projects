const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const jwt = require("jsonwebtoken");
const http = require("http");

const token = jwt.sign(
  { userId: 1, email: "mcpa.construction@gmail.com", role: "admin" },
  process.env.JWT_SECRET || "mcpa-fallback-secret-2026"
);

const req = http.request(
  "http://localhost:5000/api/admin/analytics/dashboard?period=today",
  {
    headers: { Authorization: "Bearer " + token },
  },
  (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      console.log("Dashboard API Status:", res.statusCode);
      try {
        const json = JSON.parse(data);
        console.log("Success:", json.success);
        console.log("KPI Keys:", Object.keys(json.kpis || {}));
        console.log("Charts Available:", Object.keys(json.charts || {}));
      } catch {
        console.log("Raw body:", data.slice(0, 200));
      }
    });
  }
);

req.on("error", (err) => console.error("Error:", err.message));
req.end();
