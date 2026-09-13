const db = require("../services/dbFailoverEngine");
const storage = require("../services/storageService");

class ProjectsController {
  async getAll(req, res) {
    try {
      const result = await db.query("SELECT * FROM projects ORDER BY project_id DESC");
      return res.json({ success: true, projects: result.rows || [] });
    } catch (err) {
      console.error("[ProjectsController.getAll] Error:", err);
      return res.status(500).json({ message: "Failed to fetch projects: " + err.message });
    }
  }

  async create(req, res) {
    try {
      const { name, location, category, year, description, images } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Project title is required." });
      }

      let imageList = Array.isArray(images) ? images : (images ? [images] : []);

      // If a file was uploaded via multipart/form-data
      if (req.file) {
        const uploadedUrl = await storage.uploadFile(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          "portfolio"
        );
        imageList = [uploadedUrl, ...imageList];
      }

      const result = await db.query(
        `INSERT INTO projects (name, location, category, year, description, images, is_admin_added)
         VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING *`,
        [name, location || "", category || "Residential", year || new Date().getFullYear().toString(), description || "", imageList]
      );

      return res.status(201).json({
        success: true,
        project: result.rows[0],
        message: "Project published successfully.",
      });
    } catch (err) {
      console.error("[ProjectsController.create] Error:", err);
      return res.status(500).json({ message: "Failed to create project: " + err.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      await db.query("DELETE FROM projects WHERE project_id = $1", [parseInt(id, 10)]);
      return res.json({ success: true, message: "Project removed." });
    } catch (err) {
      console.error("[ProjectsController.delete] Error:", err);
      return res.status(500).json({ message: "Failed to delete project: " + err.message });
    }
  }
}

module.exports = new ProjectsController();
