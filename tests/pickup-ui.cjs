const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os"),
  ts = require("typescript");
const {
  chromium,
} = require("/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "pv-pickup-ui-"));
for (const n of [
  "pickup",
  "panel-weight",
  "us-timezones",
  "delivery",
  "pricing-rules",
  "recycling-quote",
  "batch-quote",
])
  fs.writeFileSync(
    path.join(temp, n + ".js"),
    ts.transpileModule(
      fs.readFileSync(path.join(__dirname, "../lib", n + ".ts"), "utf8"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
        },
      },
    ).outputText,
  );
const { defaultDeliverySettings } = require(path.join(temp, "delivery.js")),
  { initialRules } = require(path.join(temp, "pricing-rules.js")),
  { generateQuote, batchTotals } = require(path.join(temp, "batch-quote.js"));
const base = process.env.PV_TEST_BASE_URL || "http://localhost:3115";
const limits = {
  trailerMinimumPanels: 500,
  truckMaxWeightLb: 20000,
  trailerMaxWeightLb: 43000,
  truckInteriorLengthIn: 312,
  truckInteriorWidthIn: 96,
  trailerInteriorLengthIn: 630,
  trailerInteriorWidthIn: 99,
  maxPanelsPerPallet: 30,
  panelThicknessMm: 35,
  palletTareLb: 68,
};
const rules = {
  ...initialRules,
  weightIncrement: 0.005,
  unknownGramsPerWatt: 55,
};
const pricing = {
  version: "test-pricing",
  transportVersion: "test-delivery",
  transport: limits,
  rules,
  createdAt: new Date().toISOString(),
};
const settings = {
  ...defaultDeliverySettings,
  transport: limits,
  rates: {
    truck: { base: 50, perMile: 2, minimum: 100 },
    trailer: { base: 80, perMile: 3, minimum: 150 },
  },
};
const date = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    for (const width of [1440, 390]) {
      let bundle, orderBody, emailBody, freightBody;
      const page = await browser.newPage({
        viewport: { width, height: 1100 },
        reducedMotion: "reduce",
      });
      await page.route("**/api/**", async (r) => {
        const request = r.request(),
          url = new URL(request.url()),
          p = url.pathname;
        if (p.endsWith("/auth/session/"))
          return r.fulfill({
            json: {
              configured: true,
              googleConfigured: true,
              mailConfigured: true,
              user: {
                name: "Test Customer",
                email: "customer@example.invalid",
                role: "customer",
              },
            },
          });
        if (p.endsWith("/api/pricing/")) return r.fulfill({ json: pricing });
        if (p.endsWith("/delivery/settings/"))
          return r.fulfill({
            json: { version: "test-delivery", settings, mapsConfigured: true },
          });
        if (p.endsWith("/delivery/availability/"))
          return r.fulfill({
            json: {
              timezone: settings.timezone,
              days: [
                {
                  date,
                  periods: [
                    {
                      period: "am",
                      label: "Morning",
                      availableUnits: 2,
                      truckRemaining: 2,
                      trailerRemaining: 1,
                    },
                    {
                      period: "pm",
                      label: "Afternoon",
                      availableUnits: 2,
                      truckRemaining: 2,
                      trailerRemaining: 1,
                    },
                  ],
                },
              ],
            },
          });
        if (p.endsWith("/api/quotations/")) {
          const b = request.postDataJSON(),
            document = generateQuote(b.lines, new Date(), pricing);
          document.text += "\nEmail: " + b.contact.email;
          bundle = {
            recordId: crypto.randomUUID(),
            accessToken: "test-token",
            document,
            lines: b.lines,
            pricing,
            contact: b.contact,
            processingTotal: batchTotals(b.lines, rules, limits).total,
            expiresAt: document.expires,
          };
          return r.fulfill({ status: 201, json: bundle });
        }
        if (p.endsWith("/delivery/freight/")) {
          freightBody = request.postDataJSON();
          return r.fulfill({
            json: {
              id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
              amount: 150,
              distanceMiles: 10,
              expiresAt: new Date(Date.now() + 86400000).toISOString(),
              breakdown: {
                baseAmount: 150,
                services: [],
                pending: [],
                knownSubtotal: 150,
              },
            },
          });
        }
        if (p.endsWith("/api/recycling-orders/")) {
          orderBody = request.postDataJSON();
          return r.fulfill({
            status: 201,
            json: {
              id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
              status: "pending",
            },
          });
        }
        if (p.endsWith("/quotations/email/")) {
          emailBody = request.postDataJSON();
          return r.fulfill({ json: { ok: true } });
        }
        return r.fulfill({ status: 404, json: { error: "not_mocked" } });
      });
      await page.goto(base + "/", {
        waitUntil: "domcontentloaded",
      });
      const pricingPanel = page.locator("#pricing"),
        delivery = page.locator("#delivery");
      await pricingPanel.getByLabel("Panel count", { exact: true }).fill("100");
      const scale = pricingPanel.getByLabel("Shipment scale", { exact: true });
      assert.equal(await scale.locator("option[value=dropoff]").count(), 0);
      await scale.selectOption("trailer");
      await pricingPanel
        .locator(".pv-batch-total strong")
        .getByText("$1,125.00", { exact: true })
        .waitFor();
      await pricingPanel
        .getByRole("button", { name: "Plan your delivery", exact: true })
        .click();
      await delivery
        .getByRole("button", { name: "Place recycling order", exact: true })
        .waitFor();
      assert.equal(
        await delivery.locator(".pv-delivery-steps li.is-reached").count(),
        1,
      );
      await delivery
        .getByLabel("Request pickup pricing", { exact: true })
        .check();
      await delivery
        .getByRole("button", { name: "Place recycling order", exact: true })
        .click();
      const vehicle = delivery.getByLabel("Batch 1 vehicle", { exact: true });
      await vehicle.waitFor();
      assert.equal(await vehicle.inputValue(), "truck");
      const dateBox = await delivery
          .getByLabel("Batch 1 date", { exact: true })
          .boundingBox(),
        vehicleBox = await vehicle.boundingBox(),
        timeBox = await delivery
          .getByLabel("Batch 1 time window", { exact: true })
          .boundingBox(),
        countBox = await delivery
          .getByLabel("Batch 1 vehicle count", { exact: true })
          .boundingBox();
      assert.ok(
        dateBox.x < vehicleBox.x && Math.abs(dateBox.y - vehicleBox.y) < 3,
      );
      assert.ok(timeBox.x < countBox.x && Math.abs(timeBox.y - countBox.y) < 3);
      assert.ok(timeBox.y > dateBox.y);
      await delivery
        .locator(".pv-booking-row")
        .first()
        .scrollIntoViewIfNeeded();
      await page.screenshot({
        path: "/tmp/pv-booking-grid-" + width + ".png",
        timeout: 10000,
      });
      await vehicle.selectOption("trailer");
      assert.equal(
        await delivery.locator(".pv-delivery-steps li.is-reached").count(),
        2,
      );
      for (const label of [
        "Panels are removed from their installation and consolidated for pickup",
        "Panels are properly packed",
        "Panels are securely stacked on pallets",
        "Stretch wrap is applied",
        "A suitable forklift is available",
      ])
        await delivery.getByLabel(label, { exact: true }).check();
      await delivery
        .getByText("Actual shipment measurements (optional)", { exact: true })
        .click();
      for (const [label, value] of [
        ["Actual total gross weight (lb)", "5000"],
        ["Actual pallet count", "4"],
        ["Pallet outside length (in)", "90"],
        ["Pallet outside width (in)", "48"],
        ["Pallet outside height (in)", "40"],
        ["Street address", "123 Test St"],
        ["City", "Menifee"],
        ["ZIP code", "92584"],
      ])
        await delivery.getByLabel(label, { exact: true }).fill(value);
      await delivery
        .getByText("Pickup pricing calculated.", { exact: true })
        .waitFor({ timeout: 15000 });
      assert.equal(freightBody.pickup.grossWeightLb, 5000);
      assert.equal(freightBody.bookings[0].vehicle, "trailer");
      assert.equal(bundle.processingTotal, 1125);
      assert.equal(
        await delivery
          .getByRole("button", { name: "Download quotation", exact: true })
          .count(),
        0,
      );
      assert.equal(
        await delivery
          .getByRole("button", { name: "Proceed to payment", exact: true })
          .isDisabled(),
        true,
      );
      await delivery.getByLabel("Phone", { exact: true }).fill("5555550123");
      await delivery
        .getByLabel(
          "I confirm the panel details and request these time windows, subject to receiving requirements and company confirmation.",
          { exact: true },
        )
        .check();
      const submit = delivery.getByRole("button", {
        name: "Submit recycling order request",
        exact: true,
      });
      assert.equal(
        await submit.evaluate((e) => getComputedStyle(e).backgroundColor),
        "rgb(244, 197, 38)",
      );
      assert.deepEqual(
        await delivery.locator("form").evaluate((e) =>
          Array.from(e.elements)
            .filter((x) => x.willValidate && !x.validity.valid)
            .map((x) => ({
              name: x.name,
              value: x.value,
              validation: x.validationMessage,
            })),
        ),
        [],
      );
      await submit.click();
      await delivery
        .getByRole("heading", { name: "Order request received", exact: true })
        .waitFor();
      assert.equal(orderBody.pickup.grossWeightLb, 5000);
      assert.equal(orderBody.bookings[0].vehicle, "trailer");
      assert.equal(
        await delivery.locator(".pv-delivery-steps li.is-reached").count(),
        3,
      );
      await delivery
        .getByRole("button", { name: "Email quotation", exact: true })
        .click();
      await delivery
        .getByText("Quotation sent to customer@example.invalid.", {
          exact: true,
        })
        .waitFor();
      assert.equal(
        emailBody.freightQuoteId,
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      await page.screenshot({
        path: "/tmp/pv-pickup-" + width + ".png",
        timeout: 10000,
      });
      console.log(
        width,
        "Trailer pricing fallback, separate actual vehicle, pickup details, automatic freight, itemized email, yellow submit, progress and disabled payment passed (mock only)",
      );
      await page.close();
    }
  } finally {
    await browser.close();
    fs.rmSync(temp, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
