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
      const {
        name, location, category, year, month, description, images, status, is_web_visible,
        featured_on_home, is_featured_home,
        lot_area, floor_area, bedrooms, bathrooms, features, architectural_details
      } = req.body;
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

      let featureList = [];
      try {
        if (features) {
          featureList = typeof features === "string" ? JSON.parse(features) : features;
        }
      } catch (e) {
        featureList = Array.isArray(features) ? features : [features];
      }
      if (!Array.isArray(featureList)) featureList = [];

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
      const isFeaturedHome = featured_on_home === 'true' || featured_on_home === true || is_featured_home === 'true' || is_featured_home === true;
      const projectStatus = status || "completed";
      const projectMonth = month || "January";

      const result = await db.query(
        `INSERT INTO projects (
          name, location, category, year, description, images, is_web_visible, status, month, is_admin_added,
          lot_area, floor_area, bedrooms, bathrooms, features, architectural_details, featured_on_home
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
        [
          name,
          location || "",
          category || "Residential",
          year || new Date().getFullYear().toString(),
          description || "",
          imageList,
          isWebVisible,
          projectStatus,
          projectMonth,
          lot_area || null,
          floor_area || null,
          bedrooms || null,
          bathrooms || null,
          featureList,
          architectural_details || null,
          isFeaturedHome
        ]
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

  async toggleFeatured(req, res) {
    try {
      const { id } = req.params;
      const check = await db.query("SELECT * FROM projects WHERE project_id = $1", [parseInt(id, 10)]);
      if (check.rows.length === 0) {
        return res.status(404).json({ message: "Project not found." });
      }

      const currentFeatured = Boolean(check.rows[0].featured_on_home);
      const newFeatured = !currentFeatured;

      // Enforce maximum 6 featured projects on Home
      if (newFeatured) {
        const countRes = await db.query("SELECT COUNT(*) as count FROM projects WHERE featured_on_home = TRUE");
        const count = parseInt(countRes.rows[0].count, 10);
        if (count >= 6) {
          return res.status(400).json({
            success: false,
            message: "Maximum 6 projects can be featured on the Home Page. Please unfeature another project first."
          });
        }
      }

      const result = await db.query(
        "UPDATE projects SET featured_on_home = $1 WHERE project_id = $2 RETURNING *",
        [newFeatured, parseInt(id, 10)]
      );

      return res.json({
        success: true,
        project: result.rows[0],
        featured_on_home: newFeatured,
        message: newFeatured ? "Project featured on Home Page." : "Project unfeatured from Home Page."
      });
    } catch (err) {
      console.error("[ProjectsController.toggleFeatured] Error:", err);
      return res.status(500).json({ message: "Failed to toggle featured status: " + err.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const {
        name, location, category, year, month, description, is_web_visible, status, existing_images, images,
        featured_on_home, is_featured_home,
        lot_area, floor_area, bedrooms, bathrooms, features, architectural_details
      } = req.body;

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

      let featureList = [];
      try {
        if (features) {
          featureList = typeof features === "string" ? JSON.parse(features) : features;
        }
      } catch (e) {
        featureList = Array.isArray(features) ? features : [features];
      }
      if (!Array.isArray(featureList)) featureList = [];

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

      const finalFeaturedHome = featured_on_home !== undefined
        ? (featured_on_home === 'true' || featured_on_home === true)
        : (is_featured_home !== undefined
          ? (is_featured_home === 'true' || is_featured_home === true)
          : Boolean(check.rows[0].featured_on_home));

      const finalLotArea = lot_area !== undefined ? lot_area : check.rows[0].lot_area;
      const finalFloorArea = floor_area !== undefined ? floor_area : check.rows[0].floor_area;
      const finalBedrooms = bedrooms !== undefined ? bedrooms : check.rows[0].bedrooms;
      const finalBathrooms = bathrooms !== undefined ? bathrooms : check.rows[0].bathrooms;
      const finalFeatures = features !== undefined ? featureList : check.rows[0].features || [];
      const finalArchDetails = architectural_details !== undefined ? architectural_details : check.rows[0].architectural_details;

      const result = await db.query(
        `UPDATE projects 
         SET name = $1, location = $2, category = $3, year = $4, description = $5, images = $6, is_web_visible = $7, status = $8, month = $9,
             lot_area = $10, floor_area = $11, bedrooms = $12, bathrooms = $13, features = $14, architectural_details = $15,
             featured_on_home = $16
         WHERE project_id = $17 RETURNING *`,
        [
          name,
          location || "",
          category || "Residential",
          year || new Date().getFullYear().toString(),
          description || "",
          imageList,
          isWebVisible,
          projectStatus,
          projectMonth,
          finalLotArea,
          finalFloorArea,
          finalBedrooms,
          finalBathrooms,
          finalFeatures,
          finalArchDetails,
          finalFeaturedHome,
          parseInt(id, 10)
        ]
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
