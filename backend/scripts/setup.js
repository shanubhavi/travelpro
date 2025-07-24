require("dotenv").config();
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const createDatabase = async () => {
  let connection;

  try {
    console.log("🚀 Starting TravelPro Academy database setup...");

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    console.log("✅ Connected to MySQL server");

    // Create database
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``
    );
    await connection.query(`USE \`${process.env.DB_NAME}\``);

    // Create tables in order (respecting foreign key constraints)
    console.log("📊 Creating tables...");

    const tables = [
      {
        name: "companies",
        sql: `CREATE TABLE IF NOT EXISTS companies (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          business_license VARCHAR(255),
          company_size ENUM('1-10', '11-50', '51-200', '200+'),
          status ENUM('pending', 'active', 'suspended') DEFAULT 'pending',
          logo_url VARCHAR(500),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_email (email),
          INDEX idx_status (status)
        )`,
      },
      {
        name: "users",
        sql: `CREATE TABLE IF NOT EXISTS users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          company_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role ENUM('super_admin', 'company_admin', 'employee') NOT NULL,
          status ENUM('pending', 'active', 'suspended') DEFAULT 'pending',
          last_login TIMESTAMP NULL,
          email_verified BOOLEAN DEFAULT FALSE,
          password_reset_token VARCHAR(500),
          password_reset_expires TIMESTAMP NULL,
          avatar_url VARCHAR(500),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
          INDEX idx_email (email),
          INDEX idx_company (company_id),
          INDEX idx_role (role),
          INDEX idx_status (status)
        )`,
      },
      {
        name: "destinations",
        sql: `CREATE TABLE IF NOT EXISTS destinations (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          country VARCHAR(100) NOT NULL,
          region VARCHAR(100) NOT NULL,
          overview TEXT,
          best_time_to_visit TEXT,
          visa_rules TEXT,
          currency VARCHAR(10),
          language VARCHAR(100),
          time_zone VARCHAR(50),
          climate TEXT,
          status ENUM('draft', 'published', 'archived') DEFAULT 'published',
          featured BOOLEAN DEFAULT FALSE,
          created_by INT,
          updated_by INT,
          version INT DEFAULT 1,
          view_count INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id),
          FOREIGN KEY (updated_by) REFERENCES users(id),
          INDEX idx_country (country),
          INDEX idx_region (region),
          INDEX idx_status (status),
          INDEX idx_featured (featured),
          FULLTEXT idx_search (name, country, region, overview)
        )`,
      },
      {
        name: "destination_content",
        sql: `CREATE TABLE IF NOT EXISTS destination_content (
          id INT PRIMARY KEY AUTO_INCREMENT,
          destination_id INT NOT NULL,
          content_type ENUM('attraction', 'local_tip', 'sales_point', 'image', 'document', 'video') NOT NULL,
          title VARCHAR(255),
          content TEXT,
          file_url VARCHAR(500),
          sort_order INT DEFAULT 0,
          status ENUM('active', 'inactive') DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE,
          INDEX idx_destination (destination_id),
          INDEX idx_type (content_type),
          INDEX idx_status (status)
        )`,
      },
      {
        name: "content_submissions",
        sql: `CREATE TABLE IF NOT EXISTS content_submissions (
          id INT PRIMARY KEY AUTO_INCREMENT,
          destination_id INT NOT NULL,
          submitted_by INT NOT NULL,
          submission_type ENUM('new_destination', 'update_existing', 'new_content') NOT NULL,
          field_name VARCHAR(100),
          old_content TEXT,
          new_content TEXT,
          notes TEXT,
          status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
          reviewed_by INT NULL,
          reviewed_at TIMESTAMP NULL,
          review_notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (destination_id) REFERENCES destinations(id),
          FOREIGN KEY (submitted_by) REFERENCES users(id),
          FOREIGN KEY (reviewed_by) REFERENCES users(id),
          INDEX idx_status (status),
          INDEX idx_submitted_by (submitted_by),
          INDEX idx_destination (destination_id)
        )`,
      },
      {
        name: "quizzes",
        sql: `CREATE TABLE IF NOT EXISTS quizzes (
          id INT PRIMARY KEY AUTO_INCREMENT,
          destination_id INT,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'intermediate',
          passing_score INT DEFAULT 70,
          time_limit INT DEFAULT 600,
          status ENUM('draft', 'active', 'archived') DEFAULT 'active',
          featured BOOLEAN DEFAULT FALSE,
          attempts_count INT DEFAULT 0,
          average_score DECIMAL(5,2) DEFAULT 0,
          created_by INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (destination_id) REFERENCES destinations(id),
          FOREIGN KEY (created_by) REFERENCES users(id),
          INDEX idx_destination (destination_id),
          INDEX idx_status (status),
          INDEX idx_difficulty (difficulty),
          INDEX idx_featured (featured)
        )`,
      },
      {
        name: "quiz_questions",
        sql: `CREATE TABLE IF NOT EXISTS quiz_questions (
          id INT PRIMARY KEY AUTO_INCREMENT,
          quiz_id INT NOT NULL,
          question_text TEXT NOT NULL,
          question_type ENUM('multiple_choice', 'true_false', 'scenario') DEFAULT 'multiple_choice',
          options JSON,
          correct_answer JSON,
          explanation TEXT,
          points INT DEFAULT 1,
          sort_order INT DEFAULT 0,
          difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
          INDEX idx_quiz (quiz_id),
          INDEX idx_sort_order (sort_order)
        )`,
      },
      {
        name: "quiz_results",
        sql: `CREATE TABLE IF NOT EXISTS quiz_results (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          quiz_id INT NOT NULL,
          score DECIMAL(5,2) NOT NULL,
          points_earned INT DEFAULT 0,
          time_spent INT NOT NULL,
          answers JSON,
          passed BOOLEAN DEFAULT FALSE,
          attempt_number INT DEFAULT 1,
          ip_address VARCHAR(45),
          user_agent TEXT,
          completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
          INDEX idx_user (user_id),
          INDEX idx_quiz (quiz_id),
          INDEX idx_completed (completed_at),
          INDEX idx_score (score),
          INDEX idx_passed (passed)
        )`,
      },
      {
        name: "badges",
        sql: `CREATE TABLE IF NOT EXISTS badges (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          icon VARCHAR(100),
          criteria JSON,
          points_reward INT DEFAULT 0,
          rarity ENUM('common', 'rare', 'epic', 'legendary') DEFAULT 'common',
          category ENUM('quiz', 'learning', 'social', 'achievement') DEFAULT 'achievement',
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_rarity (rarity),
          INDEX idx_category (category),
          INDEX idx_active (is_active)
        )`,
      },
      {
        name: "user_badges",
        sql: `CREATE TABLE IF NOT EXISTS user_badges (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          badge_id INT NOT NULL,
          earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          points_awarded INT DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
          UNIQUE KEY unique_user_badge (user_id, badge_id),
          INDEX idx_user (user_id),
          INDEX idx_badge (badge_id),
          INDEX idx_earned_at (earned_at)
        )`,
      },
      {
        name: "user_points",
        sql: `CREATE TABLE IF NOT EXISTS user_points (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          points INT NOT NULL,
          source ENUM('quiz_completion', 'perfect_score', 'high_score', 'content_contribution', 'daily_login', 'badge_earned', 'streak_bonus') NOT NULL,
          source_id INT,
          description VARCHAR(255),
          multiplier DECIMAL(3,2) DEFAULT 1.00,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user (user_id),
          INDEX idx_source (source),
          INDEX idx_created (created_at)
        )`,
      },
      {
        name: "learning_streaks",
        sql: `CREATE TABLE IF NOT EXISTS learning_streaks (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          current_streak INT DEFAULT 0,
          longest_streak INT DEFAULT 0,
          last_activity_date DATE,
          streak_type ENUM('daily', 'weekly') DEFAULT 'daily',
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY unique_user_streak (user_id, streak_type),
          INDEX idx_user (user_id),
          INDEX idx_current_streak (current_streak)
        )`,
      },
      {
        name: "notifications",
        sql: `CREATE TABLE IF NOT EXISTS notifications (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          type ENUM('badge_earned', 'quiz_completed', 'rank_changed', 'content_approved', 'system', 'achievement') NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          data JSON,
          read_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user (user_id),
          INDEX idx_type (type),
          INDEX idx_read_at (read_at),
          INDEX idx_created_at (created_at)
        )`,
      },
      {
        name: "user_sessions",
        sql: `CREATE TABLE IF NOT EXISTS user_sessions (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          session_token VARCHAR(255) NOT NULL,
          refresh_token VARCHAR(255),
          ip_address VARCHAR(45),
          user_agent TEXT,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user (user_id),
          INDEX idx_session_token (session_token),
          INDEX idx_expires_at (expires_at)
        )`,
      },
      {
        name: "audit_logs",
        sql: `CREATE TABLE IF NOT EXISTS audit_logs (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT,
          action VARCHAR(100) NOT NULL,
          table_name VARCHAR(100),
          record_id INT,
          old_values JSON,
          new_values JSON,
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          INDEX idx_user (user_id),
          INDEX idx_action (action),
          INDEX idx_table (table_name),
          INDEX idx_created_at (created_at)
        )`,
      },
      {
        name: "system_settings",
        sql: `CREATE TABLE IF NOT EXISTS system_settings (
          id INT PRIMARY KEY AUTO_INCREMENT,
          setting_key VARCHAR(100) NOT NULL UNIQUE,
          setting_value TEXT,
          setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
          description TEXT,
          is_public BOOLEAN DEFAULT FALSE,
          updated_by INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (updated_by) REFERENCES users(id),
          INDEX idx_key (setting_key),
          INDEX idx_public (is_public)
        )`,
      },
      {
        name: "email_templates",
        sql: `CREATE TABLE IF NOT EXISTS email_templates (
          id INT PRIMARY KEY AUTO_INCREMENT,
          template_key VARCHAR(100) NOT NULL UNIQUE,
          subject VARCHAR(255) NOT NULL,
          html_content TEXT NOT NULL,
          text_content TEXT,
          variables JSON,
          is_active BOOLEAN DEFAULT TRUE,
          created_by INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id),
          INDEX idx_key (template_key),
          INDEX idx_active (is_active)
        )`,
      },
    ];

    // Create each table
    for (const table of tables) {
      await connection.execute(table.sql);
      console.log(`  ✅ ${table.name} table created`);
    }

    console.log("✅ All tables created successfully");

    // Insert default badges
    console.log("🏅 Creating default badges...");

    const badges = [
      {
        name: "First Steps",
        description: "Complete your first quiz",
        icon: "🎯",
        criteria: JSON.stringify({ quiz_count: 1 }),
        points_reward: 50,
        rarity: "common",
        category: "quiz",
      },
      {
        name: "Perfectionist",
        description: "Score 100% on any quiz",
        icon: "⭐",
        criteria: JSON.stringify({ perfect_score: true }),
        points_reward: 100,
        rarity: "rare",
        category: "quiz",
      },
      {
        name: "Quiz Master",
        description: "Complete 5 quizzes",
        icon: "🎓",
        criteria: JSON.stringify({ quiz_count: 5 }),
        points_reward: 200,
        rarity: "epic",
        category: "quiz",
      },
      {
        name: "High Performer",
        description: "Maintain 85%+ average score",
        icon: "🏆",
        criteria: JSON.stringify({ average_score: 85 }),
        points_reward: 150,
        rarity: "rare",
        category: "achievement",
      },
      {
        name: "Knowledge Seeker",
        description: "View 10 destination details",
        icon: "🌍",
        criteria: JSON.stringify({ destinations_viewed: 10 }),
        points_reward: 75,
        rarity: "common",
        category: "learning",
      },
      {
        name: "Streak Warrior",
        description: "Maintain 7-day learning streak",
        icon: "🔥",
        criteria: JSON.stringify({ streak_days: 7 }),
        points_reward: 300,
        rarity: "legendary",
        category: "learning",
      },
      {
        name: "Content Creator",
        description: "Submit 5 approved content contributions",
        icon: "✍️",
        criteria: JSON.stringify({ content_contributions: 5 }),
        points_reward: 250,
        rarity: "epic",
        category: "social",
      },
      {
        name: "Speed Demon",
        description: "Complete a quiz in under 2 minutes",
        icon: "⚡",
        criteria: JSON.stringify({ quick_completion: 120 }),
        points_reward: 100,
        rarity: "rare",
        category: "achievement",
      },
    ];

    for (const badge of badges) {
      await connection.execute(
        "INSERT IGNORE INTO badges (name, description, icon, criteria, points_reward, rarity, category) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          badge.name,
          badge.description,
          badge.icon,
          badge.criteria,
          badge.points_reward,
          badge.rarity,
          badge.category,
        ]
      );
    }

    console.log("✅ Default badges created");

    // Insert system settings
    console.log("⚙️ Creating system settings...");

    const settings = [
      {
        key: "quiz_time_limit_default",
        value: "600",
        type: "number",
        description: "Default quiz time limit in seconds",
      },
      {
        key: "passing_score_default",
        value: "70",
        type: "number",
        description: "Default passing score percentage",
      },
      {
        key: "points_quiz_completion",
        value: "100",
        type: "number",
        description: "Points awarded for quiz completion",
      },
      {
        key: "points_perfect_score",
        value: "50",
        type: "number",
        description: "Bonus points for perfect score",
      },
      {
        key: "points_content_contribution",
        value: "50",
        type: "number",
        description: "Points for approved content contribution",
      },
      {
        key: "maintenance_mode",
        value: "false",
        type: "boolean",
        description: "Enable maintenance mode",
      },
      {
        key: "max_file_size",
        value: "5242880",
        type: "number",
        description: "Maximum file upload size in bytes",
      },
      {
        key: "company_approval_required",
        value: "true",
        type: "boolean",
        description: "Require admin approval for new companies",
      },
    ];

    for (const setting of settings) {
      await connection.execute(
        "INSERT IGNORE INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES (?, ?, ?, ?, ?)",
        [setting.key, setting.value, setting.type, setting.description, false]
      );
    }

    console.log("✅ System settings created");

    // Insert email templates
    console.log("📧 Creating email templates...");

    const emailTemplates = [
      {
        key: "company_registration",
        subject: "Welcome to TravelPro Academy!",
        html_content: `
          <h1>Welcome {{companyName}}!</h1>
          <p>Hello {{adminName}},</p>
          <p>Thank you for registering your company with TravelPro Academy!</p>
          <p>Your registration is currently under review and you'll be notified once approved.</p>
        `,
        variables: JSON.stringify(["companyName", "adminName"]),
      },
      {
        key: "user_invitation",
        subject: "You're invited to join {{companyName}} on TravelPro Academy",
        html_content: `
          <h1>You're Invited!</h1>
          <p>Hello {{userName}},</p>
          <p>You've been invited to join {{companyName}}'s TravelPro Academy team!</p>
          <p><a href="{{inviteUrl}}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Accept Invitation</a></p>
        `,
        variables: JSON.stringify(["userName", "companyName", "inviteUrl"]),
      },
      {
        key: "content_approved",
        subject: "Your Content Submission Has Been Approved!",
        html_content: `
          <h1>Content Approved! 🎉</h1>
          <p>Hello {{userName}},</p>
          <p>Your content submission for "{{destinationName}}" has been approved and published.</p>
          <p>You've earned {{pointsEarned}} points for your contribution!</p>
        `,
        variables: JSON.stringify([
          "userName",
          "destinationName",
          "pointsEarned",
        ]),
      },
    ];

    for (const template of emailTemplates) {
      await connection.execute(
        "INSERT IGNORE INTO email_templates (template_key, subject, html_content, variables) VALUES (?, ?, ?, ?)",
        [
          template.key,
          template.subject,
          template.html_content,
          template.variables,
        ]
      );
    }

    console.log("✅ Email templates created");

    // Create super admin if specified
    if (process.env.SUPER_ADMIN_EMAIL && process.env.SUPER_ADMIN_PASSWORD) {
      console.log("👑 Creating super admin account...");

      // Check if super admin company exists
      const [adminCompanies] = await connection.execute(
        "SELECT id FROM companies WHERE email = ?",
        [process.env.SUPER_ADMIN_EMAIL]
      );

      let companyId;
      if (adminCompanies.length === 0) {
        // Create admin company
        const [companyResult] = await connection.execute(
          "INSERT INTO companies (name, email, status) VALUES (?, ?, ?)",
          ["TravelPro Academy Admin", process.env.SUPER_ADMIN_EMAIL, "active"]
        );
        companyId = companyResult.insertId;
      } else {
        companyId = adminCompanies[0].id;
      }

      // Check if super admin user exists
      const [adminUsers] = await connection.execute(
        "SELECT id FROM users WHERE email = ?",
        [process.env.SUPER_ADMIN_EMAIL]
      );

      if (adminUsers.length === 0) {
        const hashedPassword = await bcrypt.hash(
          process.env.SUPER_ADMIN_PASSWORD,
          12
        );
        await connection.execute(
          "INSERT INTO users (company_id, name, email, password_hash, role, status, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            companyId,
            "Super Admin",
            process.env.SUPER_ADMIN_EMAIL,
            hashedPassword,
            "super_admin",
            "active",
            true,
          ]
        );
        console.log("✅ Super admin account created");
      } else {
        console.log("ℹ️  Super admin account already exists");
      }
    }

    await connection.end();

    console.log("\n🎉 Database setup completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("1. Copy .env.example to .env and configure your settings");
    console.log("2. Run: npm run seed (optional - adds sample data)");
    console.log("3. Run: npm run dev (starts the development server)");
    console.log("\n🔗 Useful commands:");
    console.log("  npm run dev          - Start development server");
    console.log("  npm start            - Start production server");
    console.log("  npm run seed         - Add sample data");
    console.log("  npm run create-admin - Create super admin account");
    console.log("  npm test             - Run tests");
  } catch (error) {
    console.error("❌ Database setup failed:", error.message);
    process.exit(1);
  }
};

createDatabase();
