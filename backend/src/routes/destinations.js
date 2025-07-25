// ============================================
// src/routes/destinations.js - UPDATED WITH IMAGE UPLOAD
// ============================================
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const destinationController = require("../controllers/destinationController");
const { auth, adminOnly } = require("../middleware/auth");

// ============================================
// IMAGE UPLOAD CONFIGURATION
// ============================================

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../uploads/destinations");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Created uploads directory:", uploadsDir);
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: destination-timestamp-random.ext
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `destination-${uniqueSuffix}${extension}`);
  },
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  console.log(
    "🔍 File filter - checking file:",
    file.originalname,
    file.mimetype
  );

  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// ============================================
// IMAGE UPLOAD ROUTES
// ============================================

// Upload destination images (multiple files) - STORES FILENAME ONLY
router.post(
  "/upload-images",
  auth,
  adminOnly,
  upload.array("images", 5),
  async (req, res) => {
    try {
      console.log("🖼️ === IMAGE UPLOAD ===");
      console.log("Files received:", req.files?.length || 0);

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No images uploaded",
        });
      }

      // ✅ Store only filename and metadata, not full path/URL
      const uploadedImages = req.files.map((file) => {
        console.log(`✅ Uploaded: ${file.originalname} -> ${file.filename}`);

        return {
          originalName: file.originalname,
          filename: file.filename, // ✅ Only store filename
          size: file.size,
          mimetype: file.mimetype,
        };
      });

      res.json({
        success: true,
        message: `${uploadedImages.length} image(s) uploaded successfully`,
        data: {
          images: uploadedImages,
        },
      });
    } catch (error) {
      console.error("❌ Image upload error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to upload images",
        details: error.message,
      });
    }
  }
);

// Delete uploaded image
router.delete("/images/:filename", auth, adminOnly, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);

    console.log("🗑️ Deleting image:", filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("✅ Image deleted successfully");

      res.json({
        success: true,
        message: "Image deleted successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        error: "Image not found",
      });
    }
  } catch (error) {
    console.error("❌ Error deleting image:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete image",
      details: error.message,
    });
  }
});

// ============================================
// EXISTING ROUTES WITH IMAGE SUPPORT
// ============================================

// Get all destinations
router.get("/", destinationController.getAll);

// Get single destination by ID - UPDATED WITH IMAGE HANDLING
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = require("../config/database");

    console.log(`🔍 GET /:id - Loading destination ${id}`);

    const destinations = await db.query(
      `SELECT d.* FROM destinations d WHERE d.id = ? AND d.status = 'published'`,
      [id]
    );

    if (destinations.length === 0) {
      console.log(`❌ Destination ${id} not found`);
      return res.status(404).json({
        success: false,
        error: "Destination not found",
      });
    }

    const destination = destinations[0];
    console.log(`✅ Found destination: ${destination.name}`);

    // Get destination content from destination_content table
    console.log(`🔍 Loading content for destination ${id}`);
    const content = await db.query(
      "SELECT * FROM destination_content WHERE destination_id = ? AND status = 'active' ORDER BY sort_order ASC",
      [id]
    );

    console.log(`📊 Found ${content.length} content items`);

    // Group content by type - MATCH DATABASE STRUCTURE
    const groupedContent = {
      attraction: [], // ✅ Match database content_type
      local_tip: [], // ✅ Match database content_type
      sales_point: [], // ✅ Match database content_type
    };

    content.forEach((item) => {
      if (groupedContent.hasOwnProperty(item.content_type)) {
        groupedContent[item.content_type].push({
          id: item.id,
          title: item.title,
          content: item.content,
          file_url: item.file_url,
          sort_order: item.sort_order,
        });
      }
    });

    // Parse climate if it's a JSON string
    if (destination.climate && typeof destination.climate === "string") {
      try {
        destination.climate = JSON.parse(destination.climate);
      } catch (e) {
        console.warn("Failed to parse climate JSON:", e);
      }
    }

    // ✅ NEW: Parse images and convert filenames to URLs for frontend
    let images = [];
    if (destination.images) {
      try {
        const imageData =
          typeof destination.images === "string"
            ? JSON.parse(destination.images)
            : destination.images;

        // Convert filenames to full URLs for frontend
        images = imageData.map((img) => ({
          ...img,
          url: `/uploads/destinations/${img.filename}`, // ✅ Create URL from filename
        }));

        console.log(`📸 Processed ${images.length} images`);
      } catch (e) {
        console.warn("Failed to parse images JSON:", e);
        images = [];
      }
    }

    // Combine destination with content - MAP TO FRONTEND EXPECTED NAMES
    const result = {
      ...destination,
      images: images, // ✅ Images with URLs created from filenames
      attractions: groupedContent.attraction, // ✅ Map attraction -> attractions
      localTips: groupedContent.local_tip, // ✅ Map local_tip -> localTips
      salesPoints: groupedContent.sales_point, // ✅ Map sales_point -> salesPoints
    };

    // Update view count
    await db.query(
      "UPDATE destinations SET view_count = view_count + 1 WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ Get destination error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch destination",
    });
  }
});

// Create new destination (admin only) - UPDATED WITH IMAGE SUPPORT
router.post("/", auth, adminOnly, async (req, res) => {
  try {
    console.log("🔍 === CREATE DESTINATION WITH IMAGES ===");
    console.log("req.body:", JSON.stringify(req.body, null, 2));

    const db = require("../config/database");

    // EXTRACT ALL VARIABLES INCLUDING IMAGES
    const {
      name,
      country,
      region,
      overview,
      bestTimeToVisit,
      visaRules,
      currency,
      language,
      timeZone,
      climate,
      attractions,
      localTips,
      salesPoints,
      images, // ✅ NEW: Extract images array
      springClimate,
      summerClimate,
      autumnClimate,
      winterClimate,
    } = req.body;

    console.log("🔍 === CONTENT FIELDS EXTRACTION ===");
    console.log("attractions:", attractions, "(type:", typeof attractions, ")");
    console.log("localTips:", localTips, "(type:", typeof localTips, ")");
    console.log("salesPoints:", salesPoints, "(type:", typeof salesPoints, ")");
    console.log("images:", images, "(type:", typeof images, ")"); // ✅ NEW

    if (!name || !country) {
      return res.status(400).json({
        success: false,
        error: "Name and country are required",
      });
    }

    const userId = req.user?.id || 1;

    // Process climate data
    let processedClimate = null;
    if (climate && typeof climate === "object") {
      processedClimate = JSON.stringify(climate);
    } else if (
      springClimate ||
      summerClimate ||
      autumnClimate ||
      winterClimate
    ) {
      const climateObject = {
        spring: springClimate || "",
        summer: summerClimate || "",
        autumn: autumnClimate || "",
        winter: winterClimate || "",
      };
      const hasContent = Object.values(climateObject).some(
        (val) => val && val.trim()
      );
      if (hasContent) {
        processedClimate = JSON.stringify(climateObject);
      }
    } else if (climate && typeof climate === "string") {
      processedClimate = climate.trim() || null;
    }

    // ✅ NEW: Process images data - store only metadata
    let processedImages = null;
    if (images && Array.isArray(images) && images.length > 0) {
      // Store only the metadata (filename, originalName, size, mimetype)
      const imageMetadata = images.map((img) => ({
        originalName: img.originalName,
        filename: img.filename,
        size: img.size,
        mimetype: img.mimetype,
      }));

      processedImages = JSON.stringify(imageMetadata);
      console.log("✅ Processed images metadata:", processedImages);
    }

    const processValue = (value, fieldName) => {
      if (value === undefined) {
        return null;
      }
      if (value === null) {
        return null;
      }
      if (typeof value === "string" && value.trim() === "") {
        return null;
      }
      return value;
    };

    try {
      // 1. INSERT INTO destinations table - WITH IMAGES COLUMN
      const destinationValues = [
        processValue(name, "name"),
        processValue(country, "country"),
        processValue(region, "region"),
        processValue(overview, "overview"),
        processValue(bestTimeToVisit, "bestTimeToVisit"),
        processValue(visaRules, "visaRules"),
        processValue(currency, "currency"),
        processValue(language, "language"),
        processValue(timeZone, "timeZone"),
        processedClimate,
        processedImages, // ✅ NEW: Add images to insert
        userId,
        "published",
      ];

      const destinationSql = `INSERT INTO destinations (
        name, country, region, overview, best_time_to_visit, visa_rules,
        currency, language, time_zone, climate, images, created_by, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;

      console.log("🔍 === SQL EXECUTION ===");
      const destinationResult = await db.query(
        destinationSql,
        destinationValues
      );
      const destinationId = destinationResult.insertId;

      console.log("✅ SUCCESS! Insert ID:", destinationId);

      // 2. INSERT content (same as before)
      const insertContent = async (contentData, contentType) => {
        if (!contentData) return 0;

        let contentArray = [];
        if (Array.isArray(contentData)) {
          contentArray = contentData.filter(
            (item) => item && typeof item === "string" && item.trim()
          );
        } else if (typeof contentData === "string" && contentData.trim()) {
          contentArray = contentData
            .split("\n")
            .map((item) => item.trim())
            .filter((item) => item);
        }

        let insertedCount = 0;
        for (let i = 0; i < contentArray.length; i++) {
          const item = contentArray[i];
          await db.query(
            `INSERT INTO destination_content (
              destination_id, content_type, title, content, sort_order, status, created_at
            ) VALUES (?, ?, ?, ?, ?, 'active', NOW())`,
            [destinationId, contentType, null, item, i]
          );
          insertedCount++;
        }
        return insertedCount;
      };

      await insertContent(attractions, "attraction");
      await insertContent(localTips, "local_tip");
      await insertContent(salesPoints, "sales_point");

      // Get the created destination with content
      const createdDestination = await db.query(
        "SELECT * FROM destinations WHERE id = ?",
        [destinationId]
      );

      const content = await db.query(
        "SELECT * FROM destination_content WHERE destination_id = ? AND status = 'active' ORDER BY sort_order ASC",
        [destinationId]
      );

      // Group content by type
      const groupedContent = {
        attraction: [],
        local_tip: [],
        sales_point: [],
      };

      content.forEach((item) => {
        if (groupedContent.hasOwnProperty(item.content_type)) {
          groupedContent[item.content_type].push({
            id: item.id,
            title: item.title,
            content: item.content,
            file_url: item.file_url,
            sort_order: item.sort_order,
          });
        }
      });

      // Parse response data
      let destination = createdDestination[0];
      if (destination.climate && typeof destination.climate === "string") {
        try {
          destination.climate = JSON.parse(destination.climate);
        } catch (e) {
          console.warn("Failed to parse climate JSON for response");
        }
      }

      // ✅ NEW: Parse images for response and add URLs
      let destinationImages = [];
      if (destination.images) {
        try {
          const imageData =
            typeof destination.images === "string"
              ? JSON.parse(destination.images)
              : destination.images;

          // Add URLs to image metadata for frontend
          destinationImages = imageData.map((img) => ({
            ...img,
            url: `/uploads/destinations/${img.filename}`,
          }));
        } catch (e) {
          console.warn("Failed to parse images JSON for response");
        }
      }

      const result = {
        ...destination,
        images: destinationImages, // ✅ NEW: Include images in response
        attractions: groupedContent.attraction,
        localTips: groupedContent.local_tip,
        salesPoints: groupedContent.sales_point,
      };

      res.status(201).json({
        success: true,
        message: "Destination created successfully",
        data: result,
      });
    } catch (error) {
      console.error("❌ Error during destination creation:", error);
      throw error;
    }
  } catch (error) {
    console.error("❌ Create error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create destination",
      details: error.message,
    });
  }
});

// Update destination (admin only) - UPDATED WITH IMAGE SUPPORT
router.put("/:id", auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🔥 === UPDATE DESTINATION WITH IMAGES ===");
    console.log("ID:", id);

    const db = require("../config/database");

    const {
      name,
      country,
      region,
      overview,
      bestTimeToVisit,
      visaRules,
      currency,
      language,
      timeZone,
      climate,
      attractions,
      localTips,
      salesPoints,
      images, // ✅ NEW: Extract images
      status,
      featured,
    } = req.body;

    // Check if destination exists
    const existingDestination = await db.query(
      "SELECT * FROM destinations WHERE id = ?",
      [id]
    );

    if (existingDestination.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Destination not found",
      });
    }

    if (!name || !country) {
      return res.status(400).json({
        success: false,
        error: "Name and country are required",
      });
    }

    const userId = req.user?.id || 1;

    // Helper functions
    const processStringField = (data) => {
      if (data === null || data === undefined) return null;
      if (typeof data === "string") return data.trim() || null;
      return null;
    };

    const processJSONField = (data) => {
      if (data === null || data === undefined) return null;
      if (typeof data === "object") {
        const hasContent = Object.values(data).some(
          (value) => value && value.toString().trim()
        );
        if (!hasContent) return null;
        return JSON.stringify(data);
      }
      if (typeof data === "string") return data.trim() || null;
      return null;
    };

    // ✅ NEW: Process images - store only metadata
    let processedImages = null;
    if (images && Array.isArray(images) && images.length > 0) {
      const imageMetadata = images.map((img) => ({
        originalName: img.originalName,
        filename: img.filename,
        size: img.size,
        mimetype: img.mimetype,
      }));
      processedImages = JSON.stringify(imageMetadata);
    }

    try {
      // 1. UPDATE destinations table - WITH IMAGES
      await db.query(
        `UPDATE destinations SET 
          name = ?, country = ?, region = ?, overview = ?, best_time_to_visit = ?,
          visa_rules = ?, currency = ?, language = ?, time_zone = ?, climate = ?,
          images = ?, status = ?, featured = ?, updated_by = ?, updated_at = NOW()
        WHERE id = ?`,
        [
          processStringField(name),
          processStringField(country),
          processStringField(region),
          processStringField(overview),
          processStringField(bestTimeToVisit),
          processStringField(visaRules),
          processStringField(currency),
          processStringField(language),
          processStringField(timeZone),
          processJSONField(climate),
          processedImages, // ✅ NEW: Update images
          status || "published",
          featured !== undefined ? featured : false,
          userId,
          id,
        ]
      );

      // 2. Clean update content (same as before)
      await db.query(
        "DELETE FROM destination_content WHERE destination_id = ?",
        [id]
      );

      const insertContent = async (contentArray, contentType) => {
        if (!contentArray || !Array.isArray(contentArray)) return 0;

        let insertedCount = 0;
        for (let i = 0; i < contentArray.length; i++) {
          const item = contentArray[i];
          if (!item || typeof item !== "string" || !item.trim()) continue;

          await db.query(
            `INSERT INTO destination_content (
              destination_id, content_type, title, content, sort_order, status, created_at
            ) VALUES (?, ?, ?, ?, ?, 'active', NOW())`,
            [id, contentType, null, item.trim(), i]
          );
          insertedCount++;
        }
        return insertedCount;
      };

      await insertContent(attractions, "attraction");
      await insertContent(localTips, "local_tip");
      await insertContent(salesPoints, "sales_point");

      // Get updated destination with content
      const updatedDestination = await db.query(
        "SELECT * FROM destinations WHERE id = ?",
        [id]
      );
      const content = await db.query(
        "SELECT * FROM destination_content WHERE destination_id = ? AND status = 'active' ORDER BY sort_order ASC",
        [id]
      );

      // Group content by type
      const groupedContent = {
        attraction: [],
        local_tip: [],
        sales_point: [],
      };

      content.forEach((item) => {
        if (groupedContent.hasOwnProperty(item.content_type)) {
          groupedContent[item.content_type].push({
            id: item.id,
            title: item.title,
            content: item.content,
            file_url: item.file_url,
            sort_order: item.sort_order,
          });
        }
      });

      // Parse response data
      let destination = updatedDestination[0];
      if (destination.climate && typeof destination.climate === "string") {
        try {
          destination.climate = JSON.parse(destination.climate);
        } catch (e) {
          console.warn("Failed to parse climate JSON for response");
        }
      }

      // ✅ NEW: Parse images for response and add URLs
      let destinationImages = [];
      if (destination.images) {
        try {
          const imageData =
            typeof destination.images === "string"
              ? JSON.parse(destination.images)
              : destination.images;

          destinationImages = imageData.map((img) => ({
            ...img,
            url: `/uploads/destinations/${img.filename}`,
          }));
        } catch (e) {
          console.warn("Failed to parse images JSON for response");
        }
      }

      const result = {
        ...destination,
        images: destinationImages, // ✅ NEW: Include images in response
        attractions: groupedContent.attraction,
        localTips: groupedContent.local_tip,
        salesPoints: groupedContent.sales_point,
      };

      res.json({
        success: true,
        message: "Destination updated successfully",
        data: result,
      });
    } catch (error) {
      console.error("❌ Update error:", error);
      throw error;
    }
  } catch (error) {
    console.error("❌ Update error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update destination",
      details: error.message,
    });
  }
});

// Delete destination (admin only) - ENHANCED WITH IMAGE CLEANUP
router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const db = require("../config/database");

    // Check if destination exists
    const existingDestination = await db.query(
      "SELECT * FROM destinations WHERE id = ?",
      [id]
    );

    if (existingDestination.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Destination not found",
      });
    }

    const destination = existingDestination[0];

    try {
      // ✅ NEW: Delete associated images from filesystem
      if (destination.images) {
        try {
          const images =
            typeof destination.images === "string"
              ? JSON.parse(destination.images)
              : destination.images;

          images.forEach((image) => {
            if (image.filename) {
              const filePath = path.join(uploadsDir, image.filename);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ Deleted image file: ${image.filename}`);
              }
            }
          });
        } catch (e) {
          console.warn("Failed to delete image files:", e);
        }
      }

      // Delete content and destination
      const contentDeleteResult = await db.query(
        "DELETE FROM destination_content WHERE destination_id = ?",
        [id]
      );

      const destinationDeleteResult = await db.query(
        "DELETE FROM destinations WHERE id = ?",
        [id]
      );

      if (destinationDeleteResult.affectedRows === 0) {
        throw new Error("Failed to delete destination - no rows affected");
      }

      res.json({
        success: true,
        message: `Destination "${destination.name}" deleted successfully`,
        data: {
          deletedDestination: { id: destination.id, name: destination.name },
          contentItemsDeleted: contentDeleteResult.affectedRows,
        },
      });
    } catch (dbError) {
      console.error("❌ Database error during deletion:", dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }
  } catch (error) {
    console.error("❌ Delete error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete destination",
      details: error.message,
    });
  }
});

// ============================================
// EXISTING UTILITY ROUTES
// ============================================

// Get countries list
router.get("/meta/countries", async (req, res) => {
  try {
    const db = require("../config/database");
    const countries = await db.query(
      'SELECT DISTINCT country FROM destinations WHERE status = "published" ORDER BY country ASC'
    );

    res.json({
      success: true,
      data: countries.map((row) => row.country),
    });
  } catch (error) {
    console.error("Get countries error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch countries",
    });
  }
});

// Get regions list
router.get("/meta/regions", async (req, res) => {
  try {
    const db = require("../config/database");
    const regions = await db.query(
      'SELECT DISTINCT region FROM destinations WHERE status = "published" ORDER BY region ASC'
    );

    res.json({
      success: true,
      data: regions.map((row) => row.region),
    });
  } catch (error) {
    console.error("Get regions error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch regions",
    });
  }
});

module.exports = router;
