require("dotenv").config();
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const seedDatabase = async () => {
  let connection;

  try {
    console.log("🌱 Starting database seeding...");

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log("✅ Connected to database");

    // Create sample company
    console.log("🏢 Creating sample company...");
    const [companyResult] = await connection.execute(
      "INSERT INTO companies (name, email, business_license, company_size, status) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)",
      [
        "Global Tours Ltd",
        "demo@globaltours.com",
        "BL123456789",
        "11-50",
        "active",
      ]
    );
    const companyId = companyResult.insertId;

    // Create sample users
    console.log("👥 Creating sample users...");
    const users = [
      {
        name: "Sarah Johnson",
        email: "demo@globaltours.com",
        password: "demo123",
        role: "company_admin",
      },
      {
        name: "Mike Chen",
        email: "mike@globaltours.com",
        password: "demo123",
        role: "employee",
      },
      {
        name: "Emma Rodriguez",
        email: "emma@globaltours.com",
        password: "demo123",
        role: "employee",
      },
      {
        name: "James Wilson",
        email: "james@globaltours.com",
        password: "demo123",
        role: "employee",
      },
    ];

    const userIds = [];
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      const [userResult] = await connection.execute(
        "INSERT INTO users (company_id, name, email, password_hash, role, status, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)",
        [
          companyId,
          user.name,
          user.email,
          hashedPassword,
          user.role,
          "active",
          true,
        ]
      );
      userIds.push(userResult.insertId);
    }

    // Create sample destinations
    console.log("🗺️  Creating sample destinations...");
    const destinations = [
      {
        name: "Tokyo",
        country: "Japan",
        region: "Asia",
        overview:
          "Tokyo, Japan's bustling capital, seamlessly blends traditional culture with cutting-edge technology. This megacity offers everything from ancient temples to futuristic skyscrapers.",
        bestTimeToVisit:
          "March-May (Spring) and September-November (Fall) offer pleasant weather and beautiful seasonal changes.",
        visaRules:
          "Many countries can visit Japan visa-free for up to 90 days. Check specific requirements based on nationality.",
      },
      {
        name: "Paris",
        country: "France",
        region: "Europe",
        overview:
          "Paris, the City of Light, captivates visitors with its timeless elegance, world-class art museums, iconic landmarks, and romantic atmosphere along the Seine River.",
        bestTimeToVisit:
          "April-June and September-October offer pleasant weather and fewer crowds than peak summer.",
        visaRules:
          "EU citizens travel freely. Other nationals may need Schengen visa for stays over 90 days.",
      },
      {
        name: "Bali",
        country: "Indonesia",
        region: "Southeast Asia",
        overview:
          "Bali offers a perfect tropical paradise with lush rice terraces, ancient temples, vibrant culture, pristine beaches, and spiritual wellness experiences.",
        bestTimeToVisit:
          "April-October during dry season. Avoid December-March rainy season.",
        visaRules:
          "Many countries get 30-day visa-free entry. Visa on arrival available for longer stays.",
      },
      {
        name: "New York City",
        country: "United States",
        region: "North America",
        overview:
          "The city that never sleeps offers iconic landmarks, world-class museums, Broadway shows, diverse neighborhoods, and unparalleled dining experiences.",
        bestTimeToVisit:
          "April-June and September-November provide pleasant weather for walking and outdoor activities.",
        visaRules:
          "ESTA required for most visitors. Some countries require tourist visas. Check current requirements.",
      },
      {
        name: "Sydney",
        country: "Australia",
        region: "Oceania",
        overview:
          "Sydney combines stunning harbor views, iconic architecture, beautiful beaches, and a vibrant cultural scene in Australia's most famous city.",
        bestTimeToVisit:
          "September-November and March-May offer mild weather and fewer crowds.",
        visaRules:
          "Tourist visa or Electronic Travel Authority (ETA) required for most visitors.",
      },
    ];

    const destinationIds = [];
    for (const dest of destinations) {
      const [destResult] = await connection.execute(
        "INSERT INTO destinations (name, country, region, overview, best_time_to_visit, visa_rules, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)",
        [
          dest.name,
          dest.country,
          dest.region,
          dest.overview,
          dest.bestTimeToVisit,
          dest.visaRules,
          userIds[0],
          "published",
        ]
      );
      destinationIds.push(destResult.insertId);
    }

    // Add destination content
    console.log("📝 Adding destination content...");
    const destinationContent = [
      // Tokyo content
      {
        destId: destinationIds[0],
        type: "attraction",
        content: "Senso-ji Temple - Ancient Buddhist temple in Asakusa",
      },
      {
        destId: destinationIds[0],
        type: "attraction",
        content: "Tokyo Skytree - World's second tallest structure",
      },
      {
        destId: destinationIds[0],
        type: "attraction",
        content: "Shibuya Crossing - World's busiest pedestrian crossing",
      },
      {
        destId: destinationIds[0],
        type: "local_tip",
        content: "Learn basic Japanese phrases - locals appreciate the effort",
      },
      {
        destId: destinationIds[0],
        type: "local_tip",
        content: "Always carry cash - many places don't accept cards",
      },
      {
        destId: destinationIds[0],
        type: "sales_point",
        content: "Perfect blend of traditional and modern experiences",
      },
      {
        destId: destinationIds[0],
        type: "sales_point",
        content: "Exceptional safety and cleanliness",
      },

      // Paris content
      {
        destId: destinationIds[1],
        type: "attraction",
        content: "Eiffel Tower - Iconic iron lattice tower and symbol of Paris",
      },
      {
        destId: destinationIds[1],
        type: "attraction",
        content: "Louvre Museum - World's largest art museum",
      },
      {
        destId: destinationIds[1],
        type: "attraction",
        content: "Notre-Dame Cathedral - Gothic masterpiece",
      },
      {
        destId: destinationIds[1],
        type: "local_tip",
        content:
          'Learn basic French greetings - "Bonjour" and "Merci" go a long way',
      },
      {
        destId: destinationIds[1],
        type: "local_tip",
        content: "Dress elegantly - Parisians take pride in their appearance",
      },
      {
        destId: destinationIds[1],
        type: "sales_point",
        content: "Unmatched romantic atmosphere perfect for couples",
      },
      {
        destId: destinationIds[1],
        type: "sales_point",
        content: "World's finest art collections and museums",
      },
    ];

    for (const content of destinationContent) {
      await connection.execute(
        "INSERT INTO destination_content (destination_id, content_type, content, status) VALUES (?, ?, ?, ?)",
        [content.destId, content.type, content.content, "active"]
      );
    }

    // Create default badges
    console.log("🏅 Creating default badges...");
    const badges = [
      {
        name: "First Steps",
        description: "Complete your first quiz",
        icon: "🎯",
        criteria: JSON.stringify({ quiz_count: 1 }),
        points_reward: 50,
        rarity: "common",
      },
      {
        name: "Perfectionist",
        description: "Score 100% on any quiz",
        icon: "⭐",
        criteria: JSON.stringify({ perfect_score: true }),
        points_reward: 100,
        rarity: "rare",
      },
      {
        name: "Quiz Master",
        description: "Complete 5 quizzes",
        icon: "🎓",
        criteria: JSON.stringify({ quiz_count: 5 }),
        points_reward: 200,
        rarity: "epic",
      },
      {
        name: "High Performer",
        description: "Maintain 85%+ average score",
        icon: "🏆",
        criteria: JSON.stringify({ average_score: 85 }),
        points_reward: 150,
        rarity: "rare",
      },
      {
        name: "Knowledge Seeker",
        description: "View 10 destination details",
        icon: "🌍",
        criteria: JSON.stringify({ destinations_viewed: 10 }),
        points_reward: 75,
        rarity: "common",
      },
      {
        name: "Streak Warrior",
        description: "Maintain 7-day learning streak",
        icon: "🔥",
        criteria: JSON.stringify({ streak_days: 7 }),
        points_reward: 300,
        rarity: "legendary",
      },
    ];

    for (const badge of badges) {
      await connection.execute(
        "INSERT IGNORE INTO badges (name, description, icon, criteria, points_reward, rarity) VALUES (?, ?, ?, ?, ?, ?)",
        [
          badge.name,
          badge.description,
          badge.icon,
          badge.criteria,
          badge.points_reward,
          badge.rarity,
        ]
      );
    }

    // Create sample quizzes
    console.log("🧠 Creating sample quizzes...");
    const [tokyoQuizResult] = await connection.execute(
      "INSERT INTO quizzes (destination_id, title, description, difficulty, passing_score, time_limit, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)",
      [
        destinationIds[0],
        "Tokyo Travel Expert",
        "Test your knowledge about Tokyo's attractions, culture, and travel tips",
        "intermediate",
        70,
        600,
        userIds[0],
        "active",
      ]
    );
    const tokyoQuizId = tokyoQuizResult.insertId;

    // Add quiz questions for Tokyo
    const tokyoQuestions = [
      {
        questionText:
          "What is the world's busiest pedestrian crossing located in Tokyo?",
        questionType: "multiple_choice",
        options: JSON.stringify([
          "Shibuya Crossing",
          "Harajuku Crossing",
          "Ginza Crossing",
          "Shinjuku Crossing",
        ]),
        correctAnswer: JSON.stringify(0),
        explanation:
          "Shibuya Crossing is famous for being the world's busiest pedestrian crossing, with thousands of people crossing simultaneously during peak times.",
        points: 1,
        sortOrder: 1,
      },
      {
        questionText:
          "Cash is preferred over credit cards in many Tokyo establishments.",
        questionType: "true_false",
        options: JSON.stringify(["True", "False"]),
        correctAnswer: JSON.stringify(true),
        explanation:
          "While this is changing, many places in Tokyo still prefer cash payments, and it's always recommended to carry cash when visiting.",
        points: 1,
        sortOrder: 2,
      },
      {
        questionText:
          "What is the best time of year to visit Tokyo for cherry blossoms?",
        questionType: "multiple_choice",
        options: JSON.stringify([
          "December-February",
          "March-May",
          "June-August",
          "September-November",
        ]),
        correctAnswer: JSON.stringify(1),
        explanation:
          "March to May is spring season in Tokyo, which is when the famous cherry blossoms (sakura) bloom, typically peaking in early April.",
        points: 1,
        sortOrder: 3,
      },
    ];

    for (const question of tokyoQuestions) {
      await connection.execute(
        "INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, explanation, points, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          tokyoQuizId,
          question.questionText,
          question.questionType,
          question.options,
          question.correctAnswer,
          question.explanation,
          question.points,
          question.sortOrder,
        ]
      );
    }

    // Add sample quiz results and points
    console.log("📊 Adding sample user data...");
    const sampleData = [
      {
        userId: userIds[0],
        points: 850,
        badges: [
          "First Steps",
          "Perfectionist",
          "Quiz Master",
          "High Performer",
        ],
        streak: 12,
      },
      {
        userId: userIds[1],
        points: 720,
        badges: ["First Steps", "High Performer", "Knowledge Seeker"],
        streak: 5,
      },
      {
        userId: userIds[2],
        points: 650,
        badges: ["First Steps", "Knowledge Seeker"],
        streak: 3,
      },
      { userId: userIds[3], points: 580, badges: ["First Steps"], streak: 1 },
    ];

    for (let i = 0; i < sampleData.length; i++) {
      const userData = sampleData[i];

      // Add points
      await connection.execute(
        "INSERT INTO user_points (user_id, points, source, description) VALUES (?, ?, ?, ?)",
        [
          userData.userId,
          userData.points,
          "quiz_completion",
          "Sample points from setup",
        ]
      );

      // Add quiz result
      await connection.execute(
        "INSERT INTO quiz_results (user_id, quiz_id, score, points_earned, time_spent, answers, passed, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          userData.userId,
          tokyoQuizId,
          85 + i * 5,
          100 + i * 25,
          300 + i * 60,
          JSON.stringify([0, true, 1]),
          true,
          new Date(),
        ]
      );

      // Add learning streak
      await connection.execute(
        "INSERT INTO learning_streaks (user_id, current_streak, longest_streak, last_activity_date) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE current_streak = VALUES(current_streak)",
        [
          userData.userId,
          userData.streak,
          userData.streak,
          new Date().toISOString().split("T")[0],
        ]
      );

      // Add badges
      for (const badgeName of userData.badges) {
        const [badges] = await connection.execute(
          "SELECT id FROM badges WHERE name = ?",
          [badgeName]
        );

        if (badges.length > 0) {
          await connection.execute(
            "INSERT IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)",
            [userData.userId, badges[0].id]
          );
        }
      }
    }

    await connection.end();

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n📊 Sample data created:");
    console.log(`  👥 ${users.length} users`);
    console.log(`  🗺️  ${destinations.length} destinations`);
    console.log(`  🧠 1 quiz with 3 questions`);
    console.log(`  🏅 6 badges`);
    console.log(`  📈 Sample points and achievements`);
    console.log("\n🔑 Demo login credentials:");
    console.log("  Email: demo@globaltours.com");
    console.log("  Password: demo123");
    console.log("\n🚀 Start the server with: npm run dev");
  } catch (error) {
    console.error("❌ Database seeding failed:", error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
};

seedDatabase();
