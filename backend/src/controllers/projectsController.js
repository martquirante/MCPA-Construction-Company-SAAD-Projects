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
      const { name, location, category, year, month, description, images, status, is_web_visible } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Project title is required." });
      }

      let imageList = [];
      try {
        if (images) {
          imageList = typeof images === "string" ? JSON.parse(images) : images;
        }
      } catch (e) {
        imageList = Array.isArray(images) ? images : [images];
      }
      if (!Array.isArray(imageList)) imageList = [];

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

      const isWebVisible = is_web_visible === 'false' || is_web_visible === false ? false : true;
      const projectStatus = status || "completed";
      const projectMonth = month || "January";

      const result = await db.query(
        `INSERT INTO projects (name, location, category, year, description, images, is_web_visible, status, month, is_admin_added)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true) RETURNING *`,
        [name, location || "", category || "Residential", year || new Date().getFullYear().toString(), description || "", imageList, isWebVisible, projectStatus, projectMonth]
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

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, location, category, year, month, description, is_web_visible, status, existing_images, images } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Project title is required." });
      }

      let imageList = [];
      const incomingImgs = images || existing_images;
      try {
        if (incomingImgs) {
          imageList = typeof incomingImgs === "string" ? JSON.parse(incomingImgs) : incomingImgs;
        }
      } catch (e) {
        imageList = Array.isArray(incomingImgs) ? incomingImgs : [incomingImgs];
      }
      if (!Array.isArray(imageList)) imageList = [];

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

      // Check if project exists
      const check = await db.query("SELECT * FROM projects WHERE project_id = $1", [parseInt(id, 10)]);
      if (check.rows.length === 0) {
        return res.status(404).json({ message: "Project not found." });
      }

      const isWebVisible = is_web_visible === 'false' || is_web_visible === false ? false : true;
      const projectStatus = status || check.rows[0].status || "completed";
      const projectMonth = month || check.rows[0].month || "January";

      const result = await db.query(
        `UPDATE projects 
         SET name = $1, location = $2, category = $3, year = $4, description = $5, images = $6, is_web_visible = $7, status = $8, month = $9
         WHERE project_id = $10 RETURNING *`,
        [name, location || "", category || "Residential", year || new Date().getFullYear().toString(), description || "", imageList, isWebVisible, projectStatus, projectMonth, parseInt(id, 10)]
      );

      return res.json({
        success: true,
        project: result.rows[0],
        message: "Project updated successfully.",
      });
    } catch (err) {
      console.error("[ProjectsController.update] Error:", err);
      return res.status(500).json({ message: "Failed to update project: " + err.message });
    }
  }
}

module.exports = new ProjectsController();
