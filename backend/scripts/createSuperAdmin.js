require("dotenv").config();
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

const createSuperAdmin = async () => {
  let connection;

  try {
    console.log("🔐 Creating Super Admin Account\n");

    const name = await question("Enter admin name: ");
    const email = await question("Enter admin email: ");
    const password = await question("Enter admin password: ");

    if (!name || !email || !password) {
      console.log("❌ All fields are required");
      process.exit(1);
    }

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Check if email already exists
    const [existingUsers] = await connection.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      console.log("❌ Email already exists");
      process.exit(1);
    }

    // Create super admin company
    const [companyResult] = await connection.execute(
      "INSERT INTO companies (name, email, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)",
      ["TravelPro Academy Admin", email, "active"]
    );

    // Create super admin user
    const hashedPassword = await bcrypt.hash(password, 12);
    await connection.execute(
      "INSERT INTO users (company_id, name, email, password_hash, role, status, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        companyResult.insertId,
        name,
        email,
        hashedPassword,
        "super_admin",
        "active",
        true,
      ]
    );

    console.log("\n✅ Super admin account created successfully!");
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log("\n🚀 You can now login with these credentials");
  } catch (error) {
    console.error("❌ Failed to create super admin:", error.message);
  } finally {
    if (connection) await connection.end();
    rl.close();
  }
};

createSuperAdmin();
