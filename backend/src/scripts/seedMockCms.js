const path = require("path");
const fs = require("fs");

const mockFilePath = path.join(__dirname, "../../data/local_mock_db.json");
if (fs.existsSync(mockFilePath)) {
  const data = JSON.parse(fs.readFileSync(mockFilePath, "utf8"));
  data.blog_categories = [
    { category_id: 1, name: "Project Updates", slug: "project-updates", icon: "HammerIcon" },
    { category_id: 2, name: "Announcements", slug: "announcements", icon: "MegaphoneIcon" },
    { category_id: 3, name: "Completed Works", slug: "completed-works", icon: "CheckCircleIcon" },
    { category_id: 4, name: "Behind the Scenes", slug: "behind-the-scenes", icon: "CameraIcon" }
  ];
  data.blog_hashtags = [
    { hashtag_id: 1, tag: "mcpaconstruction", display_tag: "#MCPAConstruction", usage_count: 5 },
    { hashtag_id: 2, tag: "constructionprogress", display_tag: "#ConstructionProgress", usage_count: 4 },
    { hashtag_id: 3, tag: "modernhouse", display_tag: "#ModernHouse", usage_count: 3 },
    { hashtag_id: 4, tag: "builttolast", display_tag: "#BuiltToLast", usage_count: 3 }
  ];
  data.theme_settings = [
    {
      setting_key: "active_theme",
      setting_value: {
        primaryColor: "#f59e0b",
        secondaryColor: "#5b6770",
        accentColor: "#d97706",
        surfaceLight: "#f8f7f5",
        surfaceDark: "#080a0e",
        headingFont: "Plus Jakarta Sans",
        bodyFont: "Plus Jakarta Sans",
        presetName: "MCPA Signature Amber"
      }
    }
  ];
  data.website_content = [
    { page_key: "home", section_key: "hero", content_key: "heading_line1", content_value: "Built with Integrity." },
    { page_key: "home", section_key: "hero", content_key: "heading_line2", content_value: "Engineered to Last." }
  ];
  fs.writeFileSync(mockFilePath, JSON.stringify(data, null, 2));
  console.log("Updated mock data with initial CMS entries.");
}
