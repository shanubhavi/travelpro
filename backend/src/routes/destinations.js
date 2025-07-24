// ============================================
// src/routes/destinations.js - COMPLETE FIXED VERSION
// ============================================
const express = require("express");
const router = express.Router();
const destinationController = require("../controllers/destinationController");
const { auth, adminOnly } = require("../middleware/auth");

// Get all destinations
router.get("/", destinationController.getAll);

// Get single destination by ID
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

    console.log(`📊 Found ${content.length} content items:`);
    content.forEach((item, index) => {
      console.log(
        `  ${index + 1}. Type: ${item.content_type}, Content: "${item.content}"`
      );
    });

    // ✅ FIXED: Group content by type - MATCH DATABASE STRUCTURE
    const groupedContent = {
      attraction: [], // ✅ Match database content_type
      local_tip: [], // ✅ Match database content_type
      sales_point: [], // ✅ Match database content_type
    };

    content.forEach((item) => {
      console.log(`🔄 Processing content item: ${item.content_type}`);
      if (groupedContent.hasOwnProperty(item.content_type)) {
        groupedContent[item.content_type].push({
          id: item.id,
          title: item.title,
          content: item.content,
          file_url: item.file_url,
          sort_order: item.sort_order,
        });
        console.log(`  ✅ Added to ${item.content_type} group`);
      } else {
        console.log(`  ❌ Unknown content type: ${item.content_type}`);
      }
    });

    console.log(`📋 GROUPED CONTENT SUMMARY:`);
    console.log(`  attraction: ${groupedContent.attraction.length} items`);
    console.log(`  local_tip: ${groupedContent.local_tip.length} items`);
    console.log(`  sales_point: ${groupedContent.sales_point.length} items`);

    // Parse climate if it's a JSON string
    if (destination.climate && typeof destination.climate === "string") {
      try {
        destination.climate = JSON.parse(destination.climate);
        console.log(`✅ Parsed climate JSON`);
      } catch (e) {
        console.warn("Failed to parse climate JSON:", e);
      }
    }

    // ✅ FIXED: Combine destination with content - MAP TO FRONTEND EXPECTED NAMES
    const result = {
      ...destination,
      attractions: groupedContent.attraction, // ✅ Map attraction -> attractions
      localTips: groupedContent.local_tip, // ✅ Map local_tip -> localTips
      salesPoints: groupedContent.sales_point, // ✅ Map sales_point -> salesPoints
    };

    console.log(`🎯 FINAL RESULT FOR FRONTEND:`);
    console.log(`  - attractions: ${result.attractions.length} items`);
    console.log(`  - localTips: ${result.localTips.length} items`);
    console.log(`  - salesPoints: ${result.salesPoints.length} items`);

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
// Create new destination (admin only) - COMPLETE FIXED VERSION
router.post("/", auth, adminOnly, async (req, res) => {
  try {
    console.log("🔍 === AUTHENTICATION DEBUG ===");
    console.log("Headers:", req.headers);
    console.log("Authorization header:", req.headers.authorization);
    console.log("req.user:", req.user);
    console.log("req.user type:", typeof req.user);
    if (req.user) {
      console.log("req.user.id:", req.user.id);
      console.log("req.user.id type:", typeof req.user.id);
    }

    console.log("🔍 === REQUEST BODY DEBUG ===");
    console.log("req.body:", JSON.stringify(req.body, null, 2));

    const db = require("../config/database");

    // EXTRACT ALL VARIABLES FIRST - BEFORE USING THEM
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
      attractions, // ✅ Now extracted
      localTips, // ✅ Now extracted
      salesPoints, // ✅ Now extracted
      // Climate could come as separate fields or as object
      springClimate,
      summerClimate,
      autumnClimate,
      winterClimate,
    } = req.body;

    // NOW we can safely use the variables in console.log
    console.log("🔍 === CONTENT FIELDS EXTRACTION ===");
    console.log("attractions:", attractions, "(type:", typeof attractions, ")");
    console.log("localTips:", localTips, "(type:", typeof localTips, ")");
    console.log("salesPoints:", salesPoints, "(type:", typeof salesPoints, ")");

    if (!name || !country) {
      return res.status(400).json({
        success: false,
        error: "Name and country are required",
      });
    }

    // EXPLICITLY handle undefined user ID
    let userId;
    if (req.user && req.user.id !== undefined && req.user.id !== null) {
      userId = req.user.id;
      console.log("✅ Using authenticated user ID:", userId);
    } else {
      userId = 1; // Fallback
      console.log("⚠️ Using fallback user ID:", userId);
    }

    console.log("🔍 === CLIMATE DATA PROCESSING ===");
    let processedClimate = null;

    // Handle climate data - could come as object or separate fields
    if (climate && typeof climate === "object") {
      // Climate sent as single object
      console.log("Climate received as object:", climate);
      processedClimate = JSON.stringify(climate);
    } else if (
      springClimate ||
      summerClimate ||
      autumnClimate ||
      winterClimate
    ) {
      // Climate sent as separate fields (from form)
      console.log("Climate received as separate fields");
      const climateObject = {
        spring: springClimate || "",
        summer: summerClimate || "",
        autumn: autumnClimate || "",
        winter: winterClimate || "",
      };
      // Only stringify if at least one field has content
      const hasContent = Object.values(climateObject).some(
        (val) => val && val.trim()
      );
      if (hasContent) {
        processedClimate = JSON.stringify(climateObject);
        console.log("Combined climate object:", processedClimate);
      }
    } else if (climate && typeof climate === "string") {
      // Climate sent as string
      processedClimate = climate.trim() || null;
      console.log("Climate as string:", processedClimate);
    }

    console.log("Final processed climate:", processedClimate);

    console.log("🔍 === VALUES PROCESSING ===");
    const processValue = (value, fieldName) => {
      if (value === undefined) {
        console.log(`  ${fieldName}: undefined -> null`);
        return null;
      }
      if (value === null) {
        console.log(`  ${fieldName}: null -> null`);
        return null;
      }
      if (typeof value === "string" && value.trim() === "") {
        console.log(`  ${fieldName}: empty string -> null`);
        return null;
      }
      console.log(`  ${fieldName}: ${typeof value} = "${value}"`);
      return value;
    };

    try {
      // 1. INSERT INTO destinations table
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
        processedClimate, // ✅ Single JSON string for climate
        userId,
        "published",
      ];

      console.log("🔍 === FINAL ARRAY CHECK ===");
      destinationValues.forEach((val, index) => {
        const status = val === undefined ? "❌ UNDEFINED!" : "✅";
        console.log(
          `  [${index + 1}] ${typeof val} = ${JSON.stringify(val)} ${status}`
        );
      });

      // Last safety check
      const undefinedIndex = destinationValues.findIndex(
        (v) => v === undefined
      );
      if (undefinedIndex !== -1) {
        console.log(`❌ FOUND UNDEFINED AT INDEX ${undefinedIndex + 1}`);
        return res.status(400).json({
          success: false,
          error: `Undefined value at parameter ${undefinedIndex + 1}`,
          debug: { values: destinationValues, undefinedIndex },
        });
      }

      const destinationSql = `INSERT INTO destinations (
        name, country, region, overview, best_time_to_visit, visa_rules,
        currency, language, time_zone, climate, created_by, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;

      console.log("🔍 === SQL EXECUTION ===");
      console.log("SQL:", destinationSql);
      console.log("Values count:", destinationValues.length);
      console.log("About to execute query...");

      const destinationResult = await db.query(
        destinationSql,
        destinationValues
      );
      const destinationId = destinationResult.insertId;

      console.log("✅ SUCCESS! Insert ID:", destinationId);

      // 2. INSERT INTO destination_content table (attractions, local_tips, sales_points)
      const insertContent = async (contentData, contentType) => {
        console.log(
          `\n🔍 === PROCESSING ${contentType.toUpperCase()} CONTENT ===`
        );
        console.log(`Content data received:`, contentData);
        console.log(`Content data type:`, typeof contentData);
        console.log(`Content data is array:`, Array.isArray(contentData));

        if (!contentData) {
          console.log(`❌ No ${contentType} data provided - skipping`);
          return 0;
        }

        let contentArray = [];

        // Handle different input formats
        if (Array.isArray(contentData)) {
          console.log(
            `📝 Processing as array with ${contentData.length} items`
          );
          contentArray = contentData.filter((item) => {
            const isValid = item && typeof item === "string" && item.trim();
            console.log(`  Item: "${item}" -> Valid: ${!!isValid}`);
            return isValid;
          });
          console.log(
            `✅ Array format: ${contentArray.length} valid items after filtering`
          );
        } else if (typeof contentData === "string" && contentData.trim()) {
          console.log(`📝 Processing as string: "${contentData}"`);
          contentArray = contentData
            .split("\n")
            .map((item) => item.trim())
            .filter((item) => item);
          console.log(
            `✅ String format: ${contentArray.length} items after splitting by newlines`
          );
        } else {
          console.log(`❌ Invalid ${contentType} format or empty data`);
          console.log(`  Data type: ${typeof contentData}`);
          console.log(`  Data value: ${contentData}`);
          return 0;
        }

        if (contentArray.length === 0) {
          console.log(
            `❌ No valid ${contentType} items found after processing`
          );
          return 0;
        }

        console.log(
          `🎯 Will insert ${contentArray.length} ${contentType} items:`
        );
        contentArray.forEach((item, i) =>
          console.log(`  ${i + 1}. "${item.substring(0, 60)}..."`)
        );

        let insertedCount = 0;
        for (let i = 0; i < contentArray.length; i++) {
          const item = contentArray[i];

          try {
            console.log(
              `🔄 Inserting ${contentType} item ${i + 1}: "${item.substring(
                0,
                30
              )}..."`
            );
            const insertResult = await db.query(
              `INSERT INTO destination_content (
                destination_id, content_type, title, content, sort_order, status, created_at
              ) VALUES (?, ?, ?, ?, ?, 'active', NOW())`,
              [destinationId, contentType, null, item, i]
            );

            console.log(
              `  ✅ Inserted ${contentType} ${i + 1}: ID ${
                insertResult.insertId
              } - "${item.substring(0, 50)}..."`
            );
            insertedCount++;
          } catch (insertError) {
            console.error(
              `  ❌ Error inserting ${contentType} item ${i + 1}:`,
              insertError.message
            );
            console.error(`  ❌ Values were:`, [
              destinationId,
              contentType,
              null,
              item,
              i,
            ]);
            throw insertError;
          }
        }

        console.log(
          `🎉 Successfully inserted ${insertedCount}/${contentArray.length} ${contentType} items`
        );
        return insertedCount;
      };

      // Insert content with detailed logging
      console.log("\n🔍 === STARTING CONTENT INSERTION ===");
      const attractionsInserted = await insertContent(
        attractions,
        "attraction"
      );
      const tipsInserted = await insertContent(localTips, "local_tip");
      const salesInserted = await insertContent(salesPoints, "sales_point");

      console.log(`\n📊 CONTENT INSERTION SUMMARY:`);
      console.log(`  Attractions: ${attractionsInserted} inserted`);
      console.log(`  Local Tips: ${tipsInserted} inserted`);
      console.log(`  Sales Points: ${salesInserted} inserted`);
      console.log(
        `  Total Content Items: ${
          attractionsInserted + tipsInserted + salesInserted
        } inserted`
      );

      // Fetch the created destination to return complete data
      const createdDestination = await db.query(
        "SELECT * FROM destinations WHERE id = ?",
        [destinationId]
      );

      // Get destination content from destination_content table
      console.log(`\n🔍 === RETRIEVING CONTENT FROM DATABASE ===`);
      console.log(
        `Looking for content where destination_id = ${destinationId}`
      );

      const content = await db.query(
        "SELECT * FROM destination_content WHERE destination_id = ? AND status = 'active' ORDER BY sort_order ASC",
        [destinationId]
      );

      console.log(`📊 Found ${content.length} content items in database:`);
      content.forEach((item, index) => {
        console.log(
          `  ${index + 1}. ID: ${item.id}, Type: ${
            item.content_type
          }, Content: "${item.content.substring(0, 50)}..."`
        );
      });

      // Group content by type
      const groupedContent = {
        attraction: [], // ✅ Match database content_type
        local_tip: [], // ✅ Match database content_type
        sales_point: [], // ✅ Match database content_type
      };

      content.forEach((item) => {
        console.log(`🔄 Processing item: ${item.content_type}`);
        if (groupedContent.hasOwnProperty(item.content_type)) {
          groupedContent[item.content_type].push({
            id: item.id,
            title: item.title,
            content: item.content,
            file_url: item.file_url,
            sort_order: item.sort_order,
          });
          console.log(`  ✅ Added to ${item.content_type} group`);
        } else {
          console.log(`  ❌ Unknown content type: ${item.content_type}`);
        }
      });

      console.log(`\n📋 GROUPED CONTENT SUMMARY:`);
      console.log(`  attraction: ${groupedContent.attraction.length} items`);
      console.log(`  local_tip: ${groupedContent.local_tip.length} items`);
      console.log(`  sales_point: ${groupedContent.sales_point.length} items`);

      // Parse climate back to object for response
      let destination = createdDestination[0];
      if (destination.climate && typeof destination.climate === "string") {
        try {
          destination.climate = JSON.parse(destination.climate);
        } catch (e) {
          console.warn("Failed to parse climate JSON for response");
        }
      }

      // Combine destination with content - MAP TO FRONTEND EXPECTED NAMES
      const result = {
        ...destination,
        attractions: groupedContent.attraction, // ✅ Map attraction -> attractions
        localTips: groupedContent.local_tip, // ✅ Map local_tip -> localTips
        salesPoints: groupedContent.sales_point, // ✅ Map sales_point -> salesPoints
      };

      console.log("✅ === FINAL RESULT ===");
      console.log("Destination created with:", {
        id: result.id,
        name: result.name,
        currency: result.currency,
        language: result.language,
        time_zone: result.time_zone,
        climate: result.climate,
        attractions: result.attractions.length,
        localTips: result.localTips.length,
        salesPoints: result.salesPoints.length,
      });

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
    console.error("❌ === DETAILED ERROR ANALYSIS ===");
    console.error("Error message:", error.message);
    console.error("Error name:", error.name);
    console.error("Error code:", error.code);
    console.error("Error errno:", error.errno);
    console.error("Error sqlState:", error.sqlState);
    console.error("Error sqlMessage:", error.sqlMessage);
    console.error("Full error object keys:", Object.keys(error));
    console.error(
      "Full error:",
      JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    );
    console.error("Error stack:", error.stack);

    res.status(500).json({
      success: false,
      error: "Failed to create destination",
      details: error.message,
      debug: {
        errorType: error.constructor.name,
        errorCode: error.code,
        sqlMessage: error.sqlMessage,
        user: req.user,
        userId: req.user?.id,
        hasAuthHeader: !!req.headers.authorization,
      },
    });
  }
});

// Update destination (admin only) - FIXED VERSION WITHOUT TRANSACTIONS
// Update destination (admin only) - FIXED VERSION WITH CLEAN DELETE
router.put("/:id", auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🔥 === UPDATE DESTINATION ===");
    console.log("ID:", id);
    console.log("Raw request body:", req.body);

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

    // Validation
    if (!name || !country) {
      return res.status(400).json({
        success: false,
        error: "Name and country are required",
      });
    }

    const userId = req.user?.id || 1;

    // Helper functions
    const processStringField = (data, fieldName) => {
      if (data === null || data === undefined) {
        return null;
      }
      if (typeof data === "string") {
        const trimmed = data.trim();
        return trimmed || null;
      }
      return null;
    };

    const processJSONField = (data, fieldName) => {
      if (data === null || data === undefined) {
        return null;
      }
      if (typeof data === "object") {
        const hasContent = Object.values(data).some(
          (value) => value && value.toString().trim()
        );
        if (!hasContent) {
          return null;
        }
        return JSON.stringify(data);
      }
      if (typeof data === "string") {
        const trimmed = data.trim();
        return trimmed || null;
      }
      return null;
    };

    try {
      // 1. UPDATE destinations table
      const updateResult = await db.query(
        `UPDATE destinations SET 
          name = ?,
          country = ?,
          region = ?,
          overview = ?,
          best_time_to_visit = ?,
          visa_rules = ?,
          currency = ?,
          language = ?,
          time_zone = ?,
          climate = ?,
          status = ?,
          featured = ?,
          updated_by = ?,
          updated_at = NOW()
        WHERE id = ?`,
        [
          processStringField(name, "name"),
          processStringField(country, "country"),
          processStringField(region, "region"),
          processStringField(overview, "overview"),
          processStringField(bestTimeToVisit, "bestTimeToVisit"),
          processStringField(visaRules, "visaRules"),
          processStringField(currency, "currency"),
          processStringField(language, "language"),
          processStringField(timeZone, "timeZone"),
          processJSONField(climate, "climate"),
          status || "published",
          featured !== undefined ? featured : false,
          userId,
          id,
        ]
      );

      console.log("✅ Destination updated successfully");

      // 2. CLEAN UPDATE destination_content table - DELETE AND REPLACE
      console.log("🔄 Cleaning up old content...");

      // ✅ FIXED: DELETE all existing content completely (don't just mark inactive)
      const deleteResult = await db.query(
        "DELETE FROM destination_content WHERE destination_id = ?",
        [id]
      );

      console.log(`🗑️ Deleted ${deleteResult.affectedRows} old content items`);

      // Then insert new content with better error handling
      const insertContent = async (contentArray, contentType) => {
        if (
          !contentArray ||
          !Array.isArray(contentArray) ||
          contentArray.length === 0
        ) {
          console.log(`  No ${contentType} to insert`);
          return 0;
        }

        console.log(`📝 Inserting ${contentArray.length} ${contentType} items`);
        let insertedCount = 0;

        for (let i = 0; i < contentArray.length; i++) {
          const item = contentArray[i];
          if (!item || typeof item !== "string" || !item.trim()) {
            console.log(`  Skipping empty ${contentType} item at index ${i}`);
            continue;
          }

          try {
            const insertResult = await db.query(
              `INSERT INTO destination_content (
                destination_id, content_type, title, content, sort_order, status, created_at
              ) VALUES (?, ?, ?, ?, ?, 'active', NOW())`,
              [id, contentType, null, item.trim(), i]
            );

            console.log(
              `  ✅ Inserted ${contentType} ${i + 1}: ID ${
                insertResult.insertId
              } - "${item.trim().substring(0, 50)}..."`
            );
            insertedCount++;
          } catch (insertError) {
            console.error(
              `  ❌ Error inserting ${contentType} item ${i + 1}:`,
              insertError.message
            );
            throw insertError;
          }
        }

        console.log(
          `🎉 Successfully inserted ${insertedCount}/${contentArray.length} ${contentType} items`
        );
        return insertedCount;
      };

      // Update content for each type with detailed logging
      console.log("🔄 Inserting new content...");
      const attractionsInserted = await insertContent(
        attractions,
        "attraction"
      );
      const tipsInserted = await insertContent(localTips, "local_tip");
      const salesInserted = await insertContent(salesPoints, "sales_point");

      console.log(`📊 CONTENT UPDATE SUMMARY:`);
      console.log(`  Attractions: ${attractionsInserted} inserted`);
      console.log(`  Local Tips: ${tipsInserted} inserted`);
      console.log(`  Sales Points: ${salesInserted} inserted`);
      console.log(
        `  Total New Items: ${
          attractionsInserted + tipsInserted + salesInserted
        }`
      );

      // Verify what was actually saved
      const verifyContent = await db.query(
        "SELECT content_type, COUNT(*) as count FROM destination_content WHERE destination_id = ? AND status = 'active' GROUP BY content_type",
        [id]
      );

      console.log("🔍 VERIFICATION - Content in database after update:");
      verifyContent.forEach((row) => {
        console.log(`  ${row.content_type}: ${row.count} items`);
      });

      // Get updated destination with content
      const updatedDestination = await db.query(
        "SELECT * FROM destinations WHERE id = ?",
        [id]
      );

      const content = await db.query(
        "SELECT * FROM destination_content WHERE destination_id = ? AND status = 'active' ORDER BY sort_order ASC",
        [id]
      );

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

      // Parse climate
      let destination = updatedDestination[0];
      if (destination.climate && typeof destination.climate === "string") {
        try {
          destination.climate = JSON.parse(destination.climate);
        } catch (e) {
          console.warn("Failed to parse climate JSON for response");
        }
      }

      // ✅ FIXED: Map to frontend expected names
      const result = {
        ...destination,
        attractions: groupedContent.attraction, // ✅ Map attraction -> attractions
        localTips: groupedContent.local_tip, // ✅ Map local_tip -> localTips
        salesPoints: groupedContent.sales_point, // ✅ Map sales_point -> salesPoints
      };

      console.log("✅ Destination and content updated successfully");

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

// Delete destination (admin only) - FIXED VERSION FOR TWO-TABLE STRUCTURE
router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🗑️ === DELETE DESTINATION ===");
    console.log("ID:", id);
    console.log("User:", req.user?.name, "Role:", req.user?.role);

    const db = require("../config/database");

    // Check if destination exists
    const existingDestination = await db.query(
      "SELECT * FROM destinations WHERE id = ?",
      [id]
    );

    if (existingDestination.length === 0) {
      console.log(`❌ Destination ${id} not found`);
      return res.status(404).json({
        success: false,
        error: "Destination not found",
      });
    }

    const destination = existingDestination[0];
    console.log(`✅ Found destination: ${destination.name}`);

    try {
      // 1. First delete all related content
      console.log("🔄 Deleting destination content...");
      const contentDeleteResult = await db.query(
        "DELETE FROM destination_content WHERE destination_id = ?",
        [id]
      );
      console.log(
        `🗑️ Deleted ${contentDeleteResult.affectedRows} content items`
      );

      // 2. Then delete the destination itself
      console.log("🔄 Deleting destination...");
      const destinationDeleteResult = await db.query(
        "DELETE FROM destinations WHERE id = ?",
        [id]
      );
      console.log(
        `🗑️ Deleted destination: ${destinationDeleteResult.affectedRows} row(s)`
      );

      if (destinationDeleteResult.affectedRows === 0) {
        throw new Error("Failed to delete destination - no rows affected");
      }

      console.log(`✅ Successfully deleted destination: ${destination.name}`);

      res.json({
        success: true,
        message: `Destination "${destination.name}" deleted successfully`,
        data: {
          deletedDestination: {
            id: destination.id,
            name: destination.name,
          },
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
      debug: {
        errorType: error.constructor.name,
        user: req.user?.name,
        destinationId: req.params.id,
      },
    });
  }
});

// Debug route to see raw request data
router.post("/debug-request", (req, res) => {
  console.log("🔍 === RAW DEBUG REQUEST ===");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  console.log("Body type:", typeof req.body);
  console.log("Body keys:", Object.keys(req.body || {}));

  res.json({
    success: true,
    received: {
      body: req.body,
      bodyType: typeof req.body,
      bodyKeys: Object.keys(req.body || {}),
      attractions: req.body.attractions,
      localTips: req.body.localTips,
      salesPoints: req.body.salesPoints,
    },
  });
});

// Test endpoint for debugging
router.post("/simple", destinationController.createSimple);

// Test endpoint WITHOUT authentication
router.post("/test-no-auth", async (req, res) => {
  try {
    console.log("🧪 === TEST WITHOUT AUTH ===");
    console.log("Request body:", req.body);

    const db = require("../config/database");

    // Hardcoded test values
    const testValues = [
      "Test Destination",
      "Test Country",
      null, // region
      null, // overview
      null, // best_time_to_visit
      null, // visa_rules
      "USD", // currency
      "English", // language
      "EST", // time_zone
      null, // climate
      1, // created_by (hardcoded)
      "published", // status
    ];

    console.log("Test values:", testValues);

    // Check for undefined
    const hasUndefined = testValues.some((val) => val === undefined);
    console.log("Has undefined?", hasUndefined);

    if (hasUndefined) {
      return res.status(400).json({
        success: false,
        error: "Test values contain undefined",
      });
    }

    const sql = `INSERT INTO destinations (
      name, country, region, overview, best_time_to_visit, visa_rules,
      currency, language, time_zone, climate, created_by, status,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;

    const result = await db.query(sql, testValues);

    res.status(201).json({
      success: true,
      message: "Test destination created without auth",
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error("❌ Test error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
    });
  }
});

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
