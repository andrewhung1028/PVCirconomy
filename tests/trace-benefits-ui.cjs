const assert = require("node:assert/strict");
const {
  chromium,
} = require("/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const base = process.env.PV_TEST_BASE_URL || "http://localhost:3118";
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    for (const width of [1919, 390, 320]) {
      const page = await browser.newPage({
        viewport: { width, height: 1000 },
        reducedMotion: "reduce",
      });
      await page.route("**/api/**", (r) =>
        r.fulfill({ status: 503, json: { error: "mock" } }),
      );
      await page.route("**/*youtube*/**", (r) =>
        r.fulfill({
          contentType: "text/html",
          body: '<html style="background:transparent"><body style="background:transparent"></body></html>',
        }),
      );
      await page.goto(base + "/#traceability", {
        waitUntil: "domcontentloaded",
      });
      if (width > 760) {
        await page.locator(".pv-topnav").getByRole("button", { name: "PV Circulator" }).click();
      } else {
        await page.getByRole("button", { name: "Open account menu" }).click();
        await page.locator(".pv-mobile-company").getByRole("button", { name: "PV Circulator" }).click();
      }
      const solutionTopics = page.locator("#pv-company-panel .pv-company-topics");
      await solutionTopics.waitFor();
      assert.deepEqual(await solutionTopics.getByRole("link").allTextContents(), [
        "Our Solution",
        "Business Case",
        "PV Circulator",
        "Material Upcycling",
        "EasyCycle",
      ]);
      const topicBoxes = await solutionTopics.getByRole("link").evaluateAll((links) =>
        links.map((link) => ({ left: link.getBoundingClientRect().left, top: link.getBoundingClientRect().top })),
      );
      assert.ok(
        topicBoxes[0].top < topicBoxes[1].top || topicBoxes[0].left < topicBoxes[1].left,
        "Our Solution should appear before PV Circulator",
      );
      assert.equal(await solutionTopics.evaluate((e) => e.scrollWidth > e.clientWidth), false);
      await solutionTopics.getByRole("link", { name: "Our Solution" }).hover();
      await page.locator("#pv-company-panel").getByRole("heading", { name: "Our Solution" }).waitFor();
      await page.locator("#pv-company-panel .pv-panel-close").click();
      const section = page.locator("#traceability");
      await section.scrollIntoViewIfNeeded();
      const cards = section.locator(".pv-trace-benefits li");
      await cards.first().waitFor();
      assert.equal(await cards.count(), 3);
      assert.deepEqual(await cards.locator("h3").allTextContents(), [
        "Traceable",
        "Measurable",
        "Trusted",
      ]);
      const media = await section.locator(".pv-tech-media").boundingBox();
      let previousRight = 0;
      for (const card of await cards.all()) {
        const box = await card.boundingBox();
        assert.ok(
          box.x >= media.x && box.x + box.width <= media.x + media.width + 1,
        );
        assert.ok(
          box.y >= media.y && box.y + box.height <= media.y + media.height,
        );
        assert.ok(box.x >= previousRight);
        previousRight = box.x + box.width;
        assert.equal(
          await card.evaluate((e) => e.scrollWidth > e.clientWidth),
          false,
        );
        assert.equal(
          await card.evaluate((e) => getComputedStyle(e).backgroundColor),
          "rgba(0, 0, 0, 0)",
        );
        assert.equal(
          await card.evaluate((e) => getComputedStyle(e).borderTopWidth),
          "0px",
        );
      }
      assert.match(
        await cards.nth(2).innerText(),
        /Automated Web3 records.*Equipment-uploaded recycling history/s,
      );
      assert.equal(await section.locator("figcaption").count(), 0);
      const videoSrc = await section.locator("iframe").getAttribute("src");
      assert.match(videoSrc, /controls=0/);
      assert.match(videoSrc, /disablekb=1/);
      assert.equal(await section.locator(".pv-tech-band details").count(), 0);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      assert.ok(
        !/350\+|\bFree\b/.test(
          await section.locator(".pv-trace-benefits").innerText(),
        ),
      );
      assert.equal(await page.locator(".pv-hero-copy .pv-button").count(), 0);
      assert.equal(await page.locator(".pv-hero-copy .pv-caption").count(), 0);
      assert.match(await page.locator("#pv-hero-title").innerText(), /Solar panel recycling.*Stay compliant.*Keep circular/s);
      assert.match(await page.locator(".pv-hero-copy>p").innerText(), /California DTSC-permitted recycling.*online quotes.*verified recycling records/s);
      const heroAxis=await page.locator('.pv-hero-copy').evaluate(e=>({top:e.offsetTop,height:e.offsetParent.clientHeight}));
      assert.ok(Math.abs(heroAxis.top-heroAxis.height/2)<1,'hero copy top edge should align to the horizontal center axis');
      await page.screenshot({
        path: "/tmp/pv-trace-benefits-" + width + ".png",
        timeout: 10000,
      });
      await section
        .getByRole("link", { name: "Explore EasyCycle →", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "EasyCycle", exact: true })
        .waitFor();
      await page
        .getByRole("heading", {
          name: "LCI: the data behind environmental reporting",
          exact: true,
        })
        .waitFor();
      console.log(
        width,
        "direct white benefit copy, Trustable Web3 record, no video chrome labels, simplified hero and EasyCycle link passed",
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
