const request = require("supertest");
const app = require("../server");

describe("Authentication", () => {
  describe("POST /api/auth/register-company", () => {
    it("should register a new company successfully", async () => {
      const companyData = {
        companyName: "Test Travel Agency",
        email: "test@example.com",
        password: "password123",
        businessLicense: "BL123456",
        companySize: "11-50",
        adminName: "Test Admin",
      };

      const response = await request(app)
        .post("/api/auth/register-company")
        .send(companyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("registration submitted");
    });

    it("should reject registration with invalid email", async () => {
      const invalidData = {
        companyName: "Test Company",
        email: "invalid-email",
        password: "password123",
        adminName: "Test Admin",
      };

      const response = await request(app)
        .post("/api/auth/register-company")
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Validation failed");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login with valid credentials", async () => {
      const loginData = {
        email: "demo@globaltours.com",
        password: "demo123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
    });

    it("should reject login with invalid credentials", async () => {
      const invalidLogin = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(invalidLogin)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Invalid credentials");
    });
  });
});
