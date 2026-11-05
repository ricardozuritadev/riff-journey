import { expect, test } from "@playwright/test";

test.describe("Riff Journey smoke", () => {
  test("loads dashboard with seeded SUM 41 challenge", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Inicio" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("link", { name: "SUM 41" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Nothing on My Back" }),
    ).toBeVisible();
  });

  test("navigates to bands and opens seed band", async ({ page }) => {
    await page.goto("/bands");
    await expect(page.getByRole("heading", { name: "Bandas" })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole("link", { name: /SUM 41/i }).first().click();
    await expect(page.getByRole("heading", { name: "SUM 41" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /All Killer No Filler/i }),
    ).toBeVisible();
  });

  test("opens practice form from dashboard CTA", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("link", { name: "Nothing on My Back" }),
    ).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole("link", { name: "Practicar ahora" }).click();
    await expect(
      page.getByRole("heading", { name: "Nueva sesión" }),
    ).toBeVisible();
  });

  test("settings page exposes export", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Ajustes" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("button", { name: /Exportar/i }),
    ).toBeVisible();
  });
});
