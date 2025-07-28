// ============================================
// src/services/emailService.js - Fixed Email Service
// ============================================
const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;

    // Initialize transporter only if email config is provided
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      // Check if email configuration exists
      if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
        console.log(
          "⚠️  Email service not configured - email notifications disabled"
        );
        console.log(
          "   To enable: Set EMAIL_USER and EMAIL_APP_PASSWORD in .env"
        );
        return;
      }

      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD,
        },
      });

      // Verify transporter configuration
      await this.verifyConnection();
    } catch (error) {
      console.error("❌ Email service initialization failed:", error.message);
      console.log("   Email notifications will be disabled");
    }
  }

  async verifyConnection() {
    try {
      if (!this.transporter) return;

      await this.transporter.verify();
      console.log("✅ Email service connected successfully");
      this.isConfigured = true;
    } catch (error) {
      console.error("❌ Email service connection failed:", error.message);
      console.log("   Email notifications will be disabled");
    }
  }

  async sendEmail({ to, subject, text, html }) {
    try {
      if (!this.isConfigured) {
        console.log(
          `📧 Email not sent (service disabled): ${subject} to ${to}`
        );
        return { success: false, error: "Email service not configured" };
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject,
        text,
        html: html || this.generateHTML(subject, text),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email sent successfully to ${to}:`, result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("📧 Email sending failed:", error);
      return { success: false, error: error.message };
    }
  }

  generateHTML(subject, content) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white; 
            border-radius: 8px; 
            overflow: hidden; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h1 { 
            margin: 0; 
            font-size: 24px; 
            font-weight: 600; 
          }
          .content { 
            padding: 30px 20px; 
            background: white; 
          }
          .content h2 { 
            color: #333; 
            margin-top: 0; 
          }
          .content p { 
            margin-bottom: 16px; 
          }
          .button { 
            display: inline-block; 
            background: #667eea; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: 500; 
            margin: 16px 0; 
          }
          .footer { 
            padding: 20px; 
            text-align: center; 
            font-size: 12px; 
            color: #666; 
            background: #f8f9fa; 
            border-top: 1px solid #e9ecef; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🗺️ TravelPro Academy</h1>
          </div>
          <div class="content">
            <h2>${subject}</h2>
            ${content
              .split("\n")
              .map((line) => `<p>${line}</p>`)
              .join("")}
          </div>
          <div class="footer">
            <p>© 2024 TravelPro Academy. All rights reserved.</p>
            <p>This email was sent to you as part of your TravelPro Academy account.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendCompanyRegistrationEmail(email, companyName, adminName) {
    const subject = "Welcome to TravelPro Academy!";
    const content = `
      Hello ${adminName},

      Thank you for registering ${companyName} with TravelPro Academy!

      Your company registration has been submitted and is currently under review. You'll receive another email once your account has been approved and activated.

      What happens next:
      • Our team will review your registration within 1-2 business days
      • You'll receive an approval email with login instructions
      • You can then invite your team members and start learning

      What you'll get access to:
      • Comprehensive destination knowledge base
      • Interactive training quizzes with gamification
      • Team leaderboards and progress tracking
      • Content contribution system
      • Admin tools for team management

      If you have any questions, please don't hesitate to contact our support team.

      Best regards,
      The TravelPro Academy Team
    `;

    return this.sendEmail({ to: email, subject, text: content });
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const subject = "Password Reset Request - TravelPro Academy";
    const content = `
      Hello ${user.name},

      You requested a password reset for your TravelPro Academy account.

      Click the button below to reset your password:
      <a href="${resetUrl}" class="button">Reset Password</a>

      Or copy and paste this link into your browser:
      ${resetUrl}

      This link will expire in 1 hour for security reasons.

      If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

      Best regards,
      The TravelPro Academy Team
    `;

    return this.sendEmail({ to: user.email, subject, text: content });
  }

  async sendUserInviteEmail(inviteData) {
    const { name, email, companyName, inviteToken } = inviteData;
    const joinUrl = `${process.env.FRONTEND_URL}/join?token=${inviteToken}`;

    const subject = `You're invited to join ${companyName} on TravelPro Academy`;
    const content = `
      Hello ${name},

      You've been invited to join ${companyName}'s TravelPro Academy team!

      TravelPro Academy is a gamified learning platform designed specifically for travel professionals. You'll have access to:

      • Comprehensive destination guides and travel information
      • Interactive quizzes to test and improve your knowledge
      • Gamification features including points, badges, and leaderboards
      • Team collaboration and knowledge sharing tools

      Click the button below to accept your invitation and create your account:
      <a href="${joinUrl}" class="button">Join ${companyName}</a>

      Or copy and paste this link into your browser:
      ${joinUrl}

      This invitation will expire in 7 days.

      Welcome to the team!

      Best regards,
      The TravelPro Academy Team
    `;

    return this.sendEmail({ to: email, subject, text: content });
  }

  async sendContentApprovalEmail(user, submissionData) {
    const subject = "Your Content Submission Has Been Approved!";
    const content = `
      Hello ${user.name},

      Great news! Your content submission for "${submissionData.destinationName}" has been approved and published.

      Your contribution:
      ${submissionData.content}

      You've earned 50 bonus points for your approved contribution!

      Thank you for helping improve our destination knowledge base. Your expertise makes TravelPro Academy better for everyone.

      Keep up the great work!

      Best regards,
      The TravelPro Academy Team
    `;

    return this.sendEmail({ to: user.email, subject, text: content });
  }

  // Mock methods for when email is disabled
  async mockEmail(method, ...args) {
    console.log(
      `📧 Mock email (${method}):`,
      args[0]?.email || "No email specified"
    );
    return { success: true, mock: true };
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
