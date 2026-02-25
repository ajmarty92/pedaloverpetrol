/**
 * E2E tests for the admin web interface.
 *
 * Prerequisites:
 *   - Backend running at http://localhost:8000 with seed data
 *   - Web app running at http://localhost:3000
 *   - Run: cd backend && make seed
 *
 * These tests use the seeded admin credentials.
 */

import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = "admin@pedaloverpetrol.com";
const ADMIN_PASSWORD = "admin123";

test.describe("Admin login flow", () => {
  test("should show login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("PedalOverPetrol");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("should reject invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "wrong@example.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Invalid")).toBeVisible({ timeout: 5000 });
  });

  test("should login and redirect to admin dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin", { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("Dashboard");
  });
});

test.describe("Admin jobs page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin", { timeout: 10000 });
  });

  test("should navigate to jobs page and see table", async ({ page }) => {
    await page.click('a[href="/admin/jobs"]');
    await page.waitForURL("**/admin/jobs");
    await expect(page.locator("h1")).toContainText("Jobs");
    await expect(page.locator("table")).toBeVisible();
    await expect(page.locator("th:has-text('Tracking ID')")).toBeVisible();
  });

  test("should filter jobs by status", async ({ page }) => {
    await page.goto("/admin/jobs");
    await page.selectOption("select", "delivered");
    await page.waitForTimeout(1000);
    const badges = page.locator("text=Delivered");
    await expect(badges.first()).toBeVisible();
  });
});

test.describe("Customer login flow", () => {
  test("should show customer login page", async ({ page }) => {
    await page.goto("/customer/login");
    await expect(page.locator("text=Customer portal")).toBeVisible();
  });
});

test.describe("Public tracking page", () => {
  test("should show error for invalid tracking ID", async ({ page }) => {
    await page.goto("/tracking/INVALIDID123");
    await expect(page.locator("text=not found")).toBeVisible({ timeout: 5000 });
  });
});
