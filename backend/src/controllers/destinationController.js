// ============================================
// src/controllers/destinationController.js - CORRECTED FOR TWO-TABLE STRUCTURE
// ============================================
const db = require("../config/database");

class DestinationController {
  // Get single destination by ID with content
  async getById(req, res) {
    try {
      const { id } = req.params;

      console.log("🔍 GET DESTINATION BY ID:", id);

      // Get destination basic info
      const destinations = await db.query(
        "SELECT * FROM destinations WHERE id = ?",
        [id]
      );

      if (destinations.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Destination not found",
        });
      }

      const destination = destinations[0];

      // Get destination content
      const content = await db.query(
        "SELECT * FROM destination_content WHERE destination_id = ? AND status = 'active' ORDER BY sort_order ASC",
        [id]
      );

      // Group content by type
      const groupedContent = {
        attractions: [],
        local_tips: [],
        sales_points: [],
      };

      content.forEach((item) => {
        if (groupedContent[item.content_type]) {
          groupedContent[item.content_type].push({
            id: item.id,
            title: item.title,
            content: item.content,
            file_url: item.file_url,
            sort_order: item.sort_order,
          });
        }
      });

      // Combine destination with content
      const result = {
        ...destination,
        attractions: groupedContent.attractions,
        localTips: groupedContent.local_tips,
        salesPoints: groupedContent.sales_points,
      };

      console.log("✅ Retrieved destination with content:", {
        id: result.id,
        name: result.name,
        attractions: result.attractions.length,
        localTips: result.localTips.length,
        salesPoints: result.salesPoints.length,
      });

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
  }

  // Create new destination - CORRECTED VERSION
  async create(req, res) {
    try {
      console.log("🔥 === CREATE DESTINATION - COMPREHENSIVE DEBUG ===");
      console.log("Raw request body:", JSON.stringify(req.body, null, 2));
      console.log("Request headers:", req.headers);
      console.log("Request method:", req.method);
      console.log("Request URL:", req.url);

      // Check if req.body is actually populated
      if (!req.body || Object.keys(req.body).length === 0) {
        console.log("❌ REQUEST BODY IS EMPTY OR UNDEFINED");
        return res.status(400).json({
          success: false,
          error: "Request body is empty",
          debug: {
            bodyType: typeof req.body,
            bodyKeys: req.body ? Object.keys(req.body) : "N/A",
            contentType: req.headers["content-type"],
          },
        });
      }

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
        status = "published",
        featured = false,
      } = req.body;

      console.log("🔍 EXTRACTED VALUES:");
      console.log("  name:", name);
      console.log("  currency:", currency, "(type:", typeof currency, ")");
      console.log("  language:", language, "(type:", typeof language, ")");
      console.log("  timeZone:", timeZone, "(type:", typeof timeZone, ")");
      console.log("  climate:", climate, "(type:", typeof climate, ")");

      // Validation for required fields
      if (!name || !country) {
        return res.status(400).json({
          success: false,
          error: "Name and country are required",
        });
      }

      const userId = req.user?.id || 1;

      console.log("🔍 MIDDLEWARE/AUTH VALUES:");
      console.log("  req.user:", req.user);
      console.log("  userId:", userId, "(type:", typeof userId, ")");
      console.log("  status:", status, "(type:", typeof status, ")");
      console.log("  featured:", featured, "(type:", typeof featured, ")");

      console.log("🔍 DEBUGGING - Raw field values:");
      console.log("  currency:", typeof currency, "=", currency);
      console.log("  language:", typeof language, "=", language);
      console.log("  timeZone:", typeof timeZone, "=", timeZone);
      console.log("  climate:", typeof climate, "=", climate);

      // Helper function to process simple string fields
      const processStringField = (data, fieldName) => {
        console.log(
          `🔄 Processing ${fieldName}:`,
          typeof data,
          "=",
          JSON.stringify(data)
        );

        if (data === null || data === undefined) {
          console.log(`  ${fieldName} -> NULL (null/undefined)`);
          return null; // ✅ Always return null, never undefined
        }

        if (typeof data === "string") {
          const trimmed = data.trim();
          if (trimmed === "") {
            console.log(`  ${fieldName} -> NULL (empty string after trim)`);
            return null; // ✅ Always return null, never undefined
          }
          console.log(`  ${fieldName} -> "${trimmed}" (valid string)`);
          return trimmed;
        }

        console.log(
          `  ${fieldName} -> NULL (not a string, type: ${typeof data})`
        );
        return null; // ✅ Always return null, never undefined
      };

      // Helper function to process JSON fields for destinations table
      const processJSONField = (data, fieldName) => {
        console.log(
          `🔄 Processing JSON ${fieldName}:`,
          typeof data,
          "=",
          JSON.stringify(data)
        );
        if (data === null || data === undefined) {
          console.log(`  ${fieldName} -> NULL (null/undefined)`);
          return null; // ✅ Always return null, never undefined
        }
        if (typeof data === "object") {
          const hasContent = Object.values(data).some(
            (value) => value && value.toString().trim()
          );
          if (!hasContent) {
            console.log(`  ${fieldName} -> NULL (empty object)`);
            return null; // ✅ Always return null, never undefined
          }
          const result = JSON.stringify(data);
          console.log(`  ${fieldName} -> JSON: ${result}`);
          return result;
        }
        if (typeof data === "string") {
          const trimmed = data.trim();
          console.log(`  ${fieldName} -> "${trimmed}" (string)`);
          return trimmed || null; // ✅ Return null if empty, never undefined
        }
        console.log(`  ${fieldName} -> NULL (unknown type)`);
        return null; // ✅ Always return null, never undefined
      };

      // START TRANSACTION
      await db.query("START TRANSACTION");

      try {
        // Prepare the processed values with proper null handling
        const processedValues = {
          name: processStringField(name, "name") || "Unnamed Destination",
          country: processStringField(country, "country") || "Unknown Country",
          region: processStringField(region, "region"), // Can be null
          overview: processStringField(overview, "overview"), // Can be null
          bestTimeToVisit: processStringField(
            bestTimeToVisit,
            "bestTimeToVisit"
          ), // Can be null
          visaRules: processStringField(visaRules, "visaRules"), // Can be null
          currency: processStringField(currency, "currency"), // Can be null
          language: processStringField(language, "language"), // Can be null
          timeZone: processStringField(timeZone, "timeZone"), // Can be null
          climate: processJSONField(climate, "climate"), // Can be null
        };

        console.log(
          "🎯 PROCESSED VALUES FOR INSERT:",
          JSON.stringify(processedValues, null, 2)
        );

        // Validate that no values are undefined
        const undefinedFields = [];
        Object.entries(processedValues).forEach(([key, value]) => {
          if (value === undefined) {
            undefinedFields.push(key);
          }
        });

        if (undefinedFields.length > 0) {
          console.log("❌ UNDEFINED FIELDS DETECTED:", undefinedFields);
          return res.status(400).json({
            success: false,
            error: "Data processing error",
            details: `Undefined values detected in fields: ${undefinedFields.join(
              ", "
            )}`,
          });
        }

        // 1. Use a simple, fixed INSERT statement
        const insertSQL = `
          INSERT INTO destinations (
            name, country, region, overview, best_time_to_visit, visa_rules,
            currency, language, time_zone, climate,
            status, featured, created_by, view_count, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;

        const insertValues = [
          processedValues.name, // 1 - name (never null due to default)
          processedValues.country, // 2 - country (never null due to default)
          processedValues.region, // 3 - region (can be null)
          processedValues.overview, // 4 - overview (can be null)
          processedValues.bestTimeToVisit, // 5 - best_time_to_visit (can be null)
          processedValues.visaRules, // 6 - visa_rules (can be null)
          processedValues.currency, // 7 - currency (can be null) ✅
          processedValues.language, // 8 - language (can be null) ✅
          processedValues.timeZone, // 9 - time_zone (can be null) ✅
          processedValues.climate, // 10 - climate (can be null)
          status || "published", // 11 - status
          featured !== undefined ? featured : false, // 12 - featured (ensure not undefined)
          userId || 1, // 13 - created_by (ensure not undefined)
          0, // 14 - view_count
        ];

        console.log("🔍 DETAILED VALUE INSPECTION:");
        insertValues.forEach((value, index) => {
          console.log(
            `  [${index + 1}] ${typeof value} = ${JSON.stringify(value)} ${
              value === undefined ? "❌ UNDEFINED!" : "✅"
            }`
          );
        });

        // Check for undefined values one more time with detailed logging
        const undefinedInValues = insertValues.findIndex(
          (val) => val === undefined
        );
        if (undefinedInValues !== -1) {
          console.log(
            `❌ UNDEFINED VALUE FOUND at index ${undefinedInValues}:`,
            insertValues[undefinedInValues]
          );
          console.log("❌ Full values array:", insertValues);
          return res.status(400).json({
            success: false,
            error: "SQL parameter error",
            details: `Undefined value at parameter index ${
              undefinedInValues + 1
            }`,
            debug: {
              values: insertValues,
              undefinedIndex: undefinedInValues,
            },
          });
        }

        // Additional safety check - convert any remaining undefined to null
        const safeValues = insertValues.map((val, index) => {
          if (val === undefined) {
            console.log(`🔧 Converting undefined to null at index ${index}`);
            return null;
          }
          return val;
        });

        console.log(
          "🔍 FINAL SAFE VALUES:",
          JSON.stringify(safeValues, null, 2)
        );

        // Try the database query with detailed error catching
        try {
          console.log("📝 About to execute SQL query...");
          console.log("📝 SQL:", insertSQL);
          console.log("📝 Parameters count:", safeValues.length);
          console.log(
            "📝 Parameters:",
            safeValues.map(
              (val, i) => `[${i}]: ${typeof val} = ${JSON.stringify(val)}`
            )
          );

          const destinationResult = await db.query(insertSQL, safeValues);
          console.log("✅ SQL execution successful:", destinationResult);
        } catch (sqlError) {
          console.error("❌ SQL EXECUTION ERROR:");
          console.error("  Error message:", sqlError.message);
          console.error("  Error code:", sqlError.code);
          console.error("  Error errno:", sqlError.errno);
          console.error("  SQL State:", sqlError.sqlState);
          console.error("  SQL Message:", sqlError.sqlMessage);
          console.error("  Full error object:", sqlError);

          // Check if it's specifically the undefined parameter error
          if (sqlError.message && sqlError.message.includes("undefined")) {
            console.error("🔍 UNDEFINED PARAMETER ANALYSIS:");
            safeValues.forEach((val, index) => {
              if (val === undefined) {
                console.error(`  ❌ Parameter ${index + 1} is UNDEFINED`);
              } else {
                console.error(
                  `  ✅ Parameter ${
                    index + 1
                  }: ${typeof val} = ${JSON.stringify(val)}`
                );
              }
            });
          }

          throw new Error(
            `SQL Error: ${sqlError.message} | Code: ${sqlError.code} | SQL: ${sqlError.sqlMessage}`
          );
        }

        const destinationId = destinationResult.insertId;
        console.log("✅ Destination created with ID:", destinationId);

        // Verify what was actually saved to database
        const savedDestination = await db.query(
          "SELECT id, name, currency, language, time_zone, climate FROM destinations WHERE id = ?",
          [destinationId]
        );
        console.log("🔍 SAVED TO DATABASE:", savedDestination[0]);

        // 2. INSERT INTO destination_content table (attractions, local_tips, sales_points)
        const insertContent = async (contentArray, contentType) => {
          if (
            !contentArray ||
            !Array.isArray(contentArray) ||
            contentArray.length === 0
          ) {
            console.log(`  No ${contentType} to insert`);
            return;
          }

          for (let i = 0; i < contentArray.length; i++) {
            const item = contentArray[i];
            if (!item || typeof item !== "string" || !item.trim()) {
              console.log(`  Skipping empty ${contentType} item at index ${i}`);
              continue;
            }

            await db.query(
              `INSERT INTO destination_content (
                destination_id, content_type, title, content, sort_order, status, created_at
              ) VALUES (?, ?, ?, ?, ?, 'active', NOW())`,
              [
                destinationId,
                contentType,
                null, // title can be null for simple content
                item.trim(),
                i, // sort_order
              ]
            );
            console.log(
              `  ✅ Inserted ${contentType}: ${item.trim().substring(0, 50)}...`
            );
          }
        };

        // Insert content for each type
        await insertContent(attractions, "attraction");
        await insertContent(localTips, "local_tip");
        await insertContent(salesPoints, "sales_point");

        // COMMIT TRANSACTION
        await db.query("COMMIT");

        // Get the complete created destination with content
        const createdDestination = await this.getDestinationWithContent(
          destinationId
        );

        console.log("✅ Destination and content created successfully");

        res.status(201).json({
          success: true,
          message: "Destination created successfully",
          data: createdDestination,
        });
      } catch (error) {
        // ROLLBACK on error
        await db.query("ROLLBACK");
        throw error;
      }
    } catch (error) {
      console.error(
        "❌ =================== FULL ERROR DETAILS ==================="
      );
      console.error("❌ Error message:", error.message);
      console.error("❌ Error name:", error.name);
      console.error("❌ Error code:", error.code);
      console.error("❌ Error errno:", error.errno);
      console.error("❌ Error sqlState:", error.sqlState);
      console.error("❌ Error sqlMessage:", error.sqlMessage);
      console.error("❌ Error stack:", error.stack);
      console.error(
        "❌ Full error object:",
        JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      );
      console.error(
        "❌ ========================================================="
      );

      res.status(500).json({
        success: false,
        error: "Failed to create destination",
        details: error.message,
        debug: {
          errorType: error.constructor.name,
          errorCode: error.code,
          sqlMessage: error.sqlMessage,
          fullError: JSON.stringify(
            error,
            Object.getOwnPropertyNames(error),
            2
          ),
        },
      });
    }
  }

  // Update destination - CORRECTED VERSION
  async update(req, res) {
    try {
      const { id } = req.params;

      console.log("🔥 === UPDATE DESTINATION - TWO TABLE STRUCTURE ===");
      console.log("ID:", id);
      console.log("Raw request body:", req.body);

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

      // Helper functions (same as create)
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

      // START TRANSACTION
      await db.query("START TRANSACTION");

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
            processStringField(currency, "currency"), // ✅ Fixed
            processStringField(language, "language"), // ✅ Fixed
            processStringField(timeZone, "timeZone"), // ✅ Fixed
            processJSONField(climate, "climate"),
            status || "published",
            featured !== undefined ? featured : false,
            userId,
            id,
          ]
        );

        console.log("✅ Destination update data:", {
          name: processStringField(name, "name"),
          currency: processStringField(currency, "currency"),
          language: processStringField(language, "language"),
          timeZone: processStringField(timeZone, "timeZone"),
          climate: processJSONField(climate, "climate"),
          affectedRows: updateResult.affectedRows,
        });

        // 2. UPDATE destination_content table
        // First, mark all existing content as inactive
        await db.query(
          "UPDATE destination_content SET status = 'inactive' WHERE destination_id = ?",
          [id]
        );

        // Then insert new content
        const insertContent = async (contentArray, contentType) => {
          if (
            !contentArray ||
            !Array.isArray(contentArray) ||
            contentArray.length === 0
          ) {
            console.log(`  No ${contentType} to update`);
            return;
          }

          for (let i = 0; i < contentArray.length; i++) {
            const item = contentArray[i];
            if (!item || typeof item !== "string" || !item.trim()) {
              console.log(`  Skipping empty ${contentType} item at index ${i}`);
              continue;
            }

            await db.query(
              `INSERT INTO destination_content (
                destination_id, content_type, title, content, sort_order, status, created_at
              ) VALUES (?, ?, ?, ?, ?, 'active', NOW())`,
              [id, contentType, null, item.trim(), i]
            );
            console.log(
              `  ✅ Updated ${contentType}: ${item.trim().substring(0, 50)}...`
            );
          }
        };

        // Update content for each type
        await insertContent(attractions, "attraction");
        await insertContent(localTips, "local_tip");
        await insertContent(salesPoints, "sales_point");

        // COMMIT TRANSACTION
        await db.query("COMMIT");

        // Get updated destination with content
        const updatedDestination = await this.getDestinationWithContent(id);

        console.log("✅ Destination and content updated successfully");

        res.json({
          success: true,
          message: "Destination updated successfully",
          data: updatedDestination,
        });
      } catch (error) {
        // ROLLBACK on error
        await db.query("ROLLBACK");
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
  }

  // Helper method to get destination with content
  async getDestinationWithContent(destinationId) {
    // Get destination basic info
    const destinations = await db.query(
      "SELECT * FROM destinations WHERE id = ?",
      [destinationId]
    );

    if (destinations.length === 0) {
      return null;
    }

    const destination = destinations[0];

    // Get destination content
    const content = await db.query(
      "SELECT * FROM destination_content WHERE destination_id = ? AND status = 'active' ORDER BY sort_order ASC",
      [destinationId]
    );

    // Group content by type
    const groupedContent = {
      attractions: [],
      local_tips: [],
      sales_points: [],
    };

    content.forEach((item) => {
      if (groupedContent[item.content_type]) {
        groupedContent[item.content_type].push({
          id: item.id,
          title: item.title,
          content: item.content,
          file_url: item.file_url,
          sort_order: item.sort_order,
        });
      }
    });

    // Return combined data
    return {
      ...destination,
      attractions: groupedContent.attractions,
      localTips: groupedContent.local_tips,
      salesPoints: groupedContent.sales_points,
    };
  }

  // Simple test create method - MINIMAL VERSION
  async createSimple(req, res) {
    try {
      console.log("🧪 === SIMPLE CREATE TEST ===");
      console.log("Request body:", req.body);

      // Hardcoded values - no processing
      const hardcodedValues = [
        "Test Destination", // name
        "Test Country", // country
        null, // region
        null, // overview
        null, // best_time_to_visit
        null, // visa_rules
        "USD", // currency
        "English", // language
        "EST", // time_zone
        null, // climate
        "published", // status
        false, // featured
        1, // created_by
        0, // view_count
      ];

      console.log("Hardcoded values:", hardcodedValues);

      // Check for undefined
      const hasUndefined = hardcodedValues.some((val) => val === undefined);
      console.log("Has undefined values:", hasUndefined);

      if (hasUndefined) {
        console.log("❌ Found undefined in hardcoded values!");
        return res.status(400).json({
          success: false,
          error: "Undefined in hardcoded values",
        });
      }

      const sql = `
        INSERT INTO destinations (
          name, country, region, overview, best_time_to_visit, visa_rules,
          currency, language, time_zone, climate,
          status, featured, created_by, view_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      console.log("About to execute SQL...");
      const result = await db.query(sql, hardcodedValues);
      console.log("✅ Simple create successful:", result);

      res.status(201).json({
        success: true,
        message: "Simple destination created",
        data: { id: result.insertId },
      });
    } catch (error) {
      console.error("❌ Simple create error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        stack: error.stack,
      });
    }
  }
  async getAll(req, res) {
    try {
      const destinations = await db.query(
        "SELECT * FROM destinations WHERE status != 'archived' ORDER BY created_at DESC"
      );

      // Get content for each destination
      const destinationsWithContent = await Promise.all(
        destinations.map(async (destination) => {
          const content = await db.query(
            "SELECT * FROM destination_content WHERE destination_id = ? AND status = 'active' ORDER BY sort_order ASC",
            [destination.id]
          );

          // Group content by type
          const groupedContent = {
            attractions: [],
            local_tips: [],
            sales_points: [],
          };

          content.forEach((item) => {
            if (groupedContent[item.content_type]) {
              groupedContent[item.content_type].push({
                id: item.id,
                title: item.title,
                content: item.content,
                file_url: item.file_url,
                sort_order: item.sort_order,
              });
            }
          });

          return {
            ...destination,
            attractions: groupedContent.attractions,
            localTips: groupedContent.local_tips,
            salesPoints: groupedContent.sales_points,
          };
        })
      );

      res.json({
        success: true,
        data: destinationsWithContent,
      });
    } catch (error) {
      console.error("Get all error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch destinations",
      });
    }
  }

  // Delete destination (soft delete)
  async delete(req, res) {
    try {
      const { id } = req.params;

      // START TRANSACTION
      await db.query("START TRANSACTION");

      try {
        // Archive destination
        await db.query(
          "UPDATE destinations SET status = 'archived' WHERE id = ?",
          [id]
        );

        // Archive related content
        await db.query(
          "UPDATE destination_content SET status = 'inactive' WHERE destination_id = ?",
          [id]
        );

        // COMMIT TRANSACTION
        await db.query("COMMIT");

        res.json({
          success: true,
          message: "Destination archived successfully",
        });
      } catch (error) {
        // ROLLBACK on error
        await db.query("ROLLBACK");
        throw error;
      }
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete destination",
      });
    }
  }
}

module.exports = new DestinationController();
