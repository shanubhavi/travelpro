const db = require("../config/database");
const emailService = require("../services/emailService");

class SubmissionController {
  // Get all submissions (with filtering)
  async getAll(req, res) {
    try {
      const { status, destinationId, limit = 20, offset = 0 } = req.query;

      let query = `
        SELECT cs.*, u.name as submitted_by_name, d.name as destination_name,
               reviewer.name as reviewed_by_name
        FROM content_submissions cs
        JOIN users u ON cs.submitted_by = u.id
        JOIN destinations d ON cs.destination_id = d.id
        LEFT JOIN users reviewer ON cs.reviewed_by = reviewer.id
        WHERE 1=1
      `;

      const params = [];

      // Company isolation (unless super admin)
      if (req.user.role !== "super_admin") {
        query += " AND u.company_id = ?";
        params.push(req.user.company_id);
      }

      if (status) {
        query += " AND cs.status = ?";
        params.push(status);
      }

      if (destinationId) {
        query += " AND cs.destination_id = ?";
        params.push(destinationId);
      }

      query += " ORDER BY cs.created_at DESC LIMIT ? OFFSET ?";
      params.push(parseInt(limit), parseInt(offset));

      const submissions = await db.query(query, params);

      res.json({
        success: true,
        data: submissions,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: submissions.length,
        },
      });
    } catch (error) {
      console.error("Get submissions error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch submissions",
      });
    }
  }

  // Create new content submission
  async create(req, res) {
    try {
      const {
        destinationId,
        submissionType,
        fieldName,
        oldContent,
        newContent,
        notes,
      } = req.body;

      // Validate destination exists
      const destination = await db.query(
        "SELECT * FROM destinations WHERE id = ?",
        [destinationId]
      );
      if (destination.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Destination not found",
        });
      }

      const [result] = await db.query(
        "INSERT INTO content_submissions (destination_id, submitted_by, submission_type, field_name, old_content, new_content, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          destinationId,
          req.user.id,
          submissionType,
          fieldName,
          oldContent,
          newContent,
          notes,
        ]
      );

      res.status(201).json({
        success: true,
        message: "Content submission created successfully",
        data: { id: result.insertId },
      });
    } catch (error) {
      console.error("Create submission error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create submission",
      });
    }
  }

  // Approve submission (admin only)
  async approve(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      // Verify admin access
      if (
        req.user.role !== "company_admin" &&
        req.user.role !== "super_admin"
      ) {
        return res.status(403).json({
          success: false,
          error: "Admin access required",
        });
      }

      // Get submission details
      const submissions = await db.query(
        `
        SELECT cs.*, u.name as submitted_by_name, u.email as submitted_by_email,
               d.name as destination_name
        FROM content_submissions cs
        JOIN users u ON cs.submitted_by = u.id
        JOIN destinations d ON cs.destination_id = d.id
        WHERE cs.id = ? AND cs.status = 'pending'
      `,
        [id]
      );

      if (submissions.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Submission not found or already processed",
        });
      }

      const submission = submissions[0];

      await db.transaction(async (connection) => {
        // Update submission status
        await connection.execute(
          "UPDATE content_submissions SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_notes = ? WHERE id = ?",
          ["approved", req.user.id, notes, id]
        );

        // Apply the content change based on submission type
        if (submission.submission_type === "update_existing") {
          if (submission.field_name === "overview") {
            await connection.execute(
              "UPDATE destinations SET overview = ?, updated_by = ?, updated_at = NOW() WHERE id = ?",
              [submission.new_content, req.user.id, submission.destination_id]
            );
          } else if (submission.field_name === "best_time_to_visit") {
            await connection.execute(
              "UPDATE destinations SET best_time_to_visit = ?, updated_by = ?, updated_at = NOW() WHERE id = ?",
              [submission.new_content, req.user.id, submission.destination_id]
            );
          } else if (submission.field_name === "visa_rules") {
            await connection.execute(
              "UPDATE destinations SET visa_rules = ?, updated_by = ?, updated_at = NOW() WHERE id = ?",
              [submission.new_content, req.user.id, submission.destination_id]
            );
          }
        } else if (submission.submission_type === "new_content") {
          // Add new content to destination_content table
          const contentType = submission.field_name; // Should be 'attraction', 'local_tip', or 'sales_point'
          await connection.execute(
            "INSERT INTO destination_content (destination_id, content_type, content, status) VALUES (?, ?, ?, ?)",
            [
              submission.destination_id,
              contentType,
              submission.new_content,
              "active",
            ]
          );
        }

        // Award points to contributor
        await connection.execute(
          "INSERT INTO user_points (user_id, points, source, source_id, description) VALUES (?, ?, ?, ?, ?)",
          [
            submission.submitted_by,
            50,
            "content_contribution",
            submission.destination_id,
            "Approved content contribution",
          ]
        );
      });

      // Send approval email
      await emailService.sendContentApprovalEmail(
        {
          name: submission.submitted_by_name,
          email: submission.submitted_by_email,
        },
        {
          destinationName: submission.destination_name,
          content: submission.new_content,
        }
      );

      res.json({
        success: true,
        message: "Submission approved successfully",
      });
    } catch (error) {
      console.error("Approve submission error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to approve submission",
      });
    }
  }

  // Reject submission (admin only)
  async reject(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      // Verify admin access
      if (
        req.user.role !== "company_admin" &&
        req.user.role !== "super_admin"
      ) {
        return res.status(403).json({
          success: false,
          error: "Admin access required",
        });
      }

      // Check if submission exists and is pending
      const submission = await db.query(
        "SELECT * FROM content_submissions WHERE id = ? AND status = ?",
        [id, "pending"]
      );

      if (submission.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Submission not found or already processed",
        });
      }

      // Update submission status
      await db.query(
        "UPDATE content_submissions SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_notes = ? WHERE id = ?",
        ["rejected", req.user.id, notes, id]
      );

      res.json({
        success: true,
        message: "Submission rejected successfully",
      });
    } catch (error) {
      console.error("Reject submission error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to reject submission",
      });
    }
  }
}

module.exports = new SubmissionController();
