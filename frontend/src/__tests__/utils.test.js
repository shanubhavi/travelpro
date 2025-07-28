import {
  formatNumber,
  formatDate,
  formatTime,
  getInitials,
  calculatePercentage,
  truncateText,
  validateEmail,
} from "../utils/helpers";

describe("Utility Functions", () => {
  test("formatNumber formats numbers correctly", () => {
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(1234567)).toBe("1,234,567");
  });

  test("getInitials returns correct initials", () => {
    expect(getInitials("John Doe")).toBe("JD");
    expect(getInitials("Sarah Jane Smith")).toBe("SJ");
  });

  test("calculatePercentage calculates correctly", () => {
    expect(calculatePercentage(25, 100)).toBe(25);
    expect(calculatePercentage(0, 100)).toBe(0);
    expect(calculatePercentage(50, 0)).toBe(0);
  });

  test("truncateText truncates correctly", () => {
    expect(truncateText("Hello World", 5)).toBe("Hello...");
    expect(truncateText("Hi", 10)).toBe("Hi");
  });

  test("validateEmail validates emails correctly", () => {
    expect(validateEmail("test@example.com")).toBe(true);
    expect(validateEmail("invalid-email")).toBe(false);
    expect(validateEmail("test@")).toBe(false);
  });
});
