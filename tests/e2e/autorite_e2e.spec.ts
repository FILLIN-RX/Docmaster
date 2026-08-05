import { test, expect } from "@playwright/test";

test("Flux complet espace autorité", async ({ page }) => {
  await page.goto("http://localhost:3003/autorite/connexion");
  await expect(page.getByText("Espace institutionnel des autorités")).toBeVisible();

  await page.getByPlaceholder("autorite@exemple.cm").fill("ruxel.autorite@dm.cm");
  await page.getByPlaceholder("••••••••").fill("TempPass123");
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page.getByText("Changez votre mot de passe")).toBeVisible({ timeout: 15000 });

  await page.getByPlaceholder("••••••••").first().fill("TempPass123");
  await page.getByPlaceholder("••••••••").nth(1).fill("NouveauPass456");
  await page.getByPlaceholder("••••••••").nth(2).fill("NouveauPass456");
  await page.getByRole("button", { name: "Enregistrer le nouveau mot de passe" }).click();

  await expect(page.getByText("Djeutchou Ruxel")).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("Tableau de bord")).toBeVisible();

  await page.getByText("Déclarations").click();
  await expect(page.getByText("Gestion des déclarations")).toBeVisible({ timeout: 10000 });
  await expect(page.getByText("Accès à l'ensemble des déclarations") .or(page.getByText("Déclarations de votre ville"))).toBeVisible({ timeout: 10000 });

  const screenshot = await page.screenshot({ path: "/tmp/opencode/autorite_declarations.png", fullPage: true });
  expect(screenshot.length).toBeGreaterThan(1000);
});
