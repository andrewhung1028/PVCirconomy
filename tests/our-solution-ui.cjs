const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const base = process.env.PV_TEST_BASE_URL || "http://localhost:3127";

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [1633, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(base + "/solutions/", { waitUntil: "domcontentloaded" });
      await page.locator("#os-title").waitFor();

      assert.equal(
        await page.locator("body").evaluate((body) => body.scrollWidth > body.clientWidth),
        false,
        `${width}px page should not overflow horizontally`,
      );
      assert.equal(
        await page.locator("#os-title").innerText(),
        "Owners pay less.\nRecyclers earn more.\nMaterials stay in circulation.",
      );
      assert.deepEqual(
        await page.locator("#pathways article>span").allTextContents(),
        ["Solar panel owner", "Recycler"],
      );
      await page.getByRole("heading", { name: "No heat. No chemicals. No water." }).waitFor();
      await page.getByRole("heading", { name: "Every panel gets a record." }).waitFor();
      await page.getByRole("heading", {
        name: "TSGC builds. PV Circonomy runs. EasyCycle proves.",
      }).waitFor();
      assert.equal(await page.locator("main>.pv-screen").count(), 7);

      if (width <= 760) {
        await page.getByRole("button", { name: "Open navigation" }).click();
        await page.locator("#os-main-navigation").getByRole("link", { name: "PV Circulator" }).waitFor();
        assert.equal(
          await page.locator("#os-main-navigation").evaluate((nav) => nav.scrollWidth > nav.clientWidth),
          false,
        );
        await page.getByRole("button", { name: "Close navigation" }).click();
      }

      const output = width === 1633 ? "desktop" : `mobile-${width}`;
      await page.screenshot({
        path: `.impeccable/review/our-solution-${output}.png`,
        fullPage: true,
        timeout: 20000,
      });
      console.log(width, "Our Solution content, roles, navigation and overflow passed");
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
