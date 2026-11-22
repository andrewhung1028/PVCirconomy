// Requires a disposable PostgreSQL database; refuses any non-local connection.
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os"),
  ts = require("typescript");
const { Pool } = require("pg");
const url =
  process.env.PV_DELIVERY_TEST_DATABASE_URL ||
  "postgresql://postgres:pv-local-test-only@127.0.0.1:55432/pv_delivery_test";
const parsed = new URL(url);
if (
  !["127.0.0.1", "localhost"].includes(parsed.hostname) ||
  !parsed.pathname.endsWith("_test")
)
  throw Error("Only a local disposable test database is allowed.");
const pool = new Pool({ connectionString: url, max: 12 });
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "pv-delivery-integration-"));
function tag(parts, ...values) {
  const text = parts.reduce(
    (s, p, i) => s + p + (i < values.length ? "$" + (i + 1) : ""),
    "",
  );
  return {
    text,
    values,
    then(resolve, reject) {
      return pool
        .query(text, values)
        .then((r) => r.rows)
        .then(resolve, reject);
    },
  };
}
tag.transaction = async (queries) => {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const out = [];
    for (const q of queries) out.push((await c.query(q.text, q.values)).rows);
    await c.query("COMMIT");
    return out;
  } catch (e) {
    console.error("Test transaction error:", e.message);
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
};
global.__deliverySql = tag;
global.__staff = null;
const files = [
  "app/api/recycling-orders/status/route",
  "lib/pickup",
  "lib/pickup-cargo",
  "app/api/admin/pricing/route",
  "server/delivery/communications",
  "app/api/admin/communications/route",
  "app/api/quotations/email/route",
  "lib/quotation-contact",
  "lib/quotation-document",
  "lib/quotation-email",
  "lib/us-timezones",
  "server/delivery/order-management",
  "app/api/admin/orders/route",
  "lib/delivery",
  "lib/pricing-rules",
  "lib/panel-weight",
  "lib/recycling-quote",
  "lib/batch-quote",
  "server/pricing/store",
  "server/delivery/store",
  "server/delivery/http",
  "server/delivery/limits",
  "server/delivery/quotations",
  "server/delivery/freight",
  "app/api/quotations/route",
  "app/api/pricing/route",
  "app/api/delivery/settings/route",
  "app/api/delivery/availability/route",
  "app/api/delivery/freight/route",
  "app/api/recycling-orders/route",
  "app/api/admin/delivery/route",
];
for (const f of files) {
  const p = path.join(temp, f + ".js");
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(
    p,
    ts.transpileModule(
      fs.readFileSync(path.join(__dirname, "..", f + ".ts"), "utf8"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          esModuleInterop: true,
        },
      },
    ).outputText,
  );
}
fs.mkdirSync(path.join(temp, "server/db"), { recursive: true });
fs.writeFileSync(
  path.join(temp, "server/db/client.js"),
  "exports.database=()=>global.__deliverySql;",
);
fs.mkdirSync(path.join(temp, "server/auth"), { recursive: true });
fs.writeFileSync(
  path.join(temp, "server/auth/microsoft.js"),
  'exports.authConfig=()=>global.__mailAuth||null;exports.companyEmail=e=>["pvcirconomy.com","tsgc.com.tw"].includes(e.split("@")[1]);exports.staffSession=async()=>global.__staff;exports.trustedOrigin=r=>r.headers.get("origin")===new URL(r.url).origin;',
);
fs.symlinkSync(path.join(__dirname, "../data"), path.join(temp, "data"), "dir");
const load = (p) => require(path.join(temp, p + ".js"));
const request = (route, body) =>
  new Request("http://localhost/" + route, {
    method: "POST",
    headers: { Origin: "http://localhost", "Content-Type": "application/json" },
    body: JSON.stringify(
      body.method === "pickup" || route === "api/delivery/freight/"
        ? {
            ...body,
            pickup: body.pickup ?? {
              ...load("lib/pickup").defaultPickupDetails,
              removed: true,
              properlyPacked: true,
              palletized: true,
              wrapped: true,
              strapped: true,
              forklift: true,
            },
          }
        : route === "api/quotations/"
          ? {
              contact: {
                name: "Test Customer",
                email: "test@example.invalid",
                company: "",
                phone: "",
              },
              ...body,
            }
          : body,
    ),
  });
(async () => {
  try {
    await pool.query(
      "DROP TABLE IF EXISTS pv_quotation_mail,pv_mail_settings,pv_recycling_order_requests,pv_freight_quotes,pv_recycling_quotations,pv_delivery_rate_limits,pv_delivery_settings_history,pv_delivery_settings,pv_pricing_active,pv_pricing_versions CASCADE",
    );
    const legacyRules = { ...load("lib/pricing-rules").initialRules };
    delete legacyRules.unknownGramsPerWatt;
    const legacyId = crypto.randomUUID();
    await pool.query(
      "CREATE TABLE pv_pricing_versions(id uuid PRIMARY KEY,rules jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),actor_oid text NOT NULL,actor_email text NOT NULL)",
    );
    await pool.query(
      "CREATE TABLE pv_pricing_active(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),version_id uuid NOT NULL REFERENCES pv_pricing_versions(id))",
    );
    await pool.query(
      "INSERT INTO pv_pricing_versions(id,rules,actor_oid,actor_email) VALUES($1,$2,$3,$4)",
      [legacyId, legacyRules, "fixture", "fixture"],
    );
    await pool.query(
      "INSERT INTO pv_pricing_active(singleton,version_id) VALUES(true,$1)",
      [legacyId],
    );
    const quotes = load("app/api/quotations/route"),
      orders = load("app/api/recycling-orders/route"),
      calendar = load("app/api/delivery/availability/route"),
      admin = load("app/api/admin/delivery/route");
    const { newQuoteLine } = load("lib/batch-quote");
    const { deliverySettings, usage } = load("server/delivery/store");
    const line = { ...newQuoteLine(), quantity: "300", watts: "350" };
    let response = await quotes.POST(
      request("api/quotations/", { lines: [line] }),
    );
    assert.equal(response.status, 201);
    const q = await response.json();
    assert.equal(q.processingTotal, 3375);
    assert.ok(q.recordId && q.accessToken);
    assert.match(q.document.text, /Validity: 7 days/);
    assert.equal(
      (
        await quotes.POST(
          request("api/quotations/", {
            lines: [
              {
                ...line,
                mode: "model",
                selectedModel: { id: "made-up", rated_watts: 100 },
              },
            ],
          }),
        )
      ).status,
      400,
    );
    const upgradedPricing = await load("server/pricing/store").activePricing();
    assert.notEqual(upgradedPricing.version, legacyId);
    assert.equal(upgradedPricing.rules.unknownGramsPerWatt, null);
    assert.equal(upgradedPricing.rules.panelBase, legacyRules.panelBase);
    assert.equal(
      (
        await pool.query("SELECT rules FROM pv_pricing_versions WHERE id=$1", [
          legacyId,
        ])
      ).rows[0].rules.unknownGramsPerWatt,
      undefined,
    );
    const config = await deliverySettings();
    const { validDeliverySettings } = load("lib/delivery");
    assert.equal(
      validDeliverySettings({ ...config.settings, timezone: "Europe/London" }),
      false,
    );
    for (const [zone] of load("lib/us-timezones").usTimezones)
      assert.equal(
        validDeliverySettings({ ...config.settings, timezone: zone }),
        true,
      );
    const cal = await calendar
      .GET(
        new Request(
          "http://localhost/api/delivery/availability/?method=self",
        ),
      )
      .then((r) => r.json());
    const date = cal.days[0].date;
    assert.equal(cal.days[0].periods[0].truckRemaining, 2);
    assert.equal(cal.days[0].periods[0].trailerRemaining, 1);
    async function freshQuote() {
      const r = await quotes.POST(
        request("api/quotations/", { lines: [line] }),
      );
      assert.equal(r.status, 201);
      return r.json();
    }
    const base = {
      quotationId: q.recordId,
      accessToken: q.accessToken,
      idempotencyKey: crypto.randomUUID(),
      method: "self",
      bookings: [{ date, period: "am", vehicle: "truck", count: 1 }],
      contact: {
        name: "Test Customer",
        email: "test@example.invalid",
        phone: "5555550100",
        company: "Test",
      },
      acceptedTerms: true,
    };
    response = await orders.POST(request("api/recycling-orders/", base));
    assert.equal(response.status, 201);
    const first = await response.json();
    const orderStatus = load("app/api/recycling-orders/status/route");
    assert.equal(
      (
        await orderStatus
          .POST(
            request("api/recycling-orders/status/", {
              quotationId: q.recordId,
              accessToken: q.accessToken,
            }),
          )
          .then((r) => r.json())
      ).order.id,
      first.id,
    );
    assert.equal(
      (
        await orderStatus.POST(
          request("api/recycling-orders/status/", {
            quotationId: q.recordId,
            accessToken: "bad",
          }),
        )
      ).status,
      401,
    );
    assert.equal(
      (await orders.POST(request("api/recycling-orders/", base))).status,
      200,
    );
    assert.equal(
      (
        await orders.POST(
          request("api/recycling-orders/", {
            ...base,
            idempotencyKey: crypto.randomUUID(),
          }),
        )
      ).status,
      200,
    );
    assert.equal(
      (await pool.query("SELECT count(*) FROM pv_recycling_order_requests"))
        .rows[0].count,
      "1",
    );
    const q2 = await freshQuote();
    assert.equal(
      (
        await orders.POST(
          request("api/recycling-orders/", {
            ...base,
            quotationId: q2.recordId,
            accessToken: q2.accessToken,
            idempotencyKey: crypto.randomUUID(),
            bookings: [{ date, period: "am", vehicle: "trailer", count: 1 }],
          }),
        )
      ).status,
      409,
    );
    response = await orders.POST(
      request("api/recycling-orders/", {
        ...base,
        quotationId: q2.recordId,
        accessToken: q2.accessToken,
        idempotencyKey: crypto.randomUUID(),
      }),
    );
    assert.equal(response.status, 201);
    const second = await response.json();
    const q3 = await freshQuote();
    assert.equal(
      (
        await orders.POST(
          request("api/recycling-orders/", {
            ...base,
            quotationId: q3.recordId,
            accessToken: q3.accessToken,
            idempotencyKey: crypto.randomUUID(),
          }),
        )
      ).status,
      409,
    );
    delete process.env.GOOGLE_MAPS_API_KEY;
    response = await orders.POST(
      request("api/recycling-orders/", {
        ...base,
        quotationId: q3.recordId,
        accessToken: q3.accessToken,
        idempotencyKey: crypto.randomUUID(),
        method: "pickup",
        bookings: [{ date, period: "am", vehicle: "trailer", count: 1 }],
        origin: {
          street: "123 Test St",
          city: "Menifee",
          state: "CA",
          zip: "92584",
        },
      }),
    );
    assert.equal(response.status, 201);
    assert.equal((await usage("pickup"))[0].trailers, 1);
    assert.equal(
      (
        await admin.POST(
          request("api/admin/delivery/", {
            action: "status",
            id: first.id,
            status: "rejected",
          }),
        )
      ).status,
      401,
    );
    const ordersAdmin = load("app/api/admin/orders/route");
    assert.equal(
      (
        await ordersAdmin.GET(
          new Request("http://localhost/api/admin/orders/"),
        )
      ).status,
      401,
    );
    global.__staff = { email: "staff@tsgc.com.tw", oid: "test" };
    const listed = await ordersAdmin
      .GET(
        new Request(
          "http://localhost/api/admin/orders/?status=pending&q=Test%20Customer",
        ),
      )
      .then((r) => r.json());
    assert.equal(listed.total, 3);
    assert.equal(listed.orders.length, 3);
    assert.equal(
      (
        await ordersAdmin.GET(
          new Request("http://localhost/api/admin/orders/?page=0"),
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await ordersAdmin
          .GET(
            new Request(
              "http://localhost/api/admin/orders/?page=2",
            ),
          )
          .then((r) => r.json())
      ).orders.length,
      0,
    );
    assert.equal(
      (
        await ordersAdmin.POST(
          new Request("http://localhost/api/admin/orders/", {
            method: "POST",
            headers: {
              Origin: "https://other.invalid",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: first.id, status: "rejected" }),
          }),
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await ordersAdmin.POST(
          request("api/admin/orders/", { id: first.id, status: "rejected" }),
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await admin.POST(
          request("api/admin/delivery/", {
            action: "status",
            id: second.id,
            status: "rejected",
          }),
        )
      ).status,
      200,
    );
    const pricingAdmin = load("app/api/admin/pricing/route");
    const beforePricing = await load("server/pricing/store").activePricing();
    const noted = await pricingAdmin.POST(
      request("api/admin/pricing/", {
        rules: beforePricing.rules,
        expectedVersion: beforePricing.version,
        note: "測試價格備註\n保留既有係數",
        noteTitle: "價格邏輯標題",
      }),
    );
    assert.equal(noted.status, 201);
    const notedData = await noted.json();
    assert.ok(
      notedData.history.some(
        (v) =>
          v.id === notedData.active.version &&
          v.note === "測試價格備註\n保留既有係數" &&
          v.note_title === "價格邏輯標題",
      ),
    );
    assert.equal("note" in notedData.active, false);
    assert.equal(
      (
        await pricingAdmin.POST(
          request("api/admin/pricing/", {
            rules: beforePricing.rules,
            expectedVersion: beforePricing.version,
            note: "stale",
          }),
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await pricingAdmin.POST(
          request("api/admin/pricing/", {
            rules: beforePricing.rules,
            expectedVersion: notedData.active.version,
            note: "x".repeat(2001),
          }),
        )
      ).status,
      400,
    );
    const candidates = await Promise.all(
      Array.from({ length: 4 }, () => freshQuote()),
    );
    const parallel = await Promise.all(
      candidates.map((q) =>
        orders.POST(
          request("api/recycling-orders/", {
            ...base,
            quotationId: q.recordId,
            accessToken: q.accessToken,
            idempotencyKey: crypto.randomUUID(),
            bookings: [{ date, period: "pm", vehicle: "truck", count: 1 }],
          }),
        ),
      ),
    );
    assert.equal(parallel.filter((r) => r.status === 201).length, 2);
    assert.equal(parallel.filter((r) => r.status === 409).length, 2);
    const badToken = await orders.POST(
      request("api/recycling-orders/", {
        ...base,
        accessToken: "bad-token-value-longer-than-thirty-two-characters",
        idempotencyKey: crypto.randomUUID(),
      }),
    );
    assert.equal(badToken.status, 401);
    const changed = await admin.POST(
      request("api/admin/delivery/", {
        action: "settings",
        expectedVersion: config.version,
        noteTitle: "Integration test",
        note: "Freight rate settings",
        settings: {
          ...config.settings,
          rates: {
            truck: { base: 50, perMile: 2, minimum: 100 },
            trailer: { base: 80, perMile: 3, minimum: 150 },
          },
        },
      }),
    );
    assert.equal(changed.status, 200);
    assert.equal(
      (
        await admin.POST(
          request("api/admin/delivery/", {
            action: "settings",
            expectedVersion: config.version,
            noteTitle: "Conflict test",
            note: "Stale delivery settings",
            settings: config.settings,
          }),
        )
      ).status,
      409,
    );
    const originalFetch = global.fetch;
    process.env.GOOGLE_MAPS_API_KEY = "local-test-only";
    global.fetch = async (url) =>
      new Response(
        JSON.stringify(
          String(url).includes("geocode")
            ? {
                status: "OK",
                results: [
                  {
                    address_components: [
                      { types: ["country"], short_name: "US" },
                    ],
                    geometry: { location: { lat: 33.6, lng: -117.1 } },
                  },
                ],
              }
            : { routes: [{ distanceMeters: 16093.44 }] },
        ),
        { headers: { "Content-Type": "application/json" } },
      );
    const freightApi = load("app/api/delivery/freight/route");
    const origin = {
      street: "123 Test St",
      city: "Menifee",
      state: "CA",
      zip: "92584",
    };
    const bookings = [{ date, period: "pm", vehicle: "trailer", count: 1 }];
    response = await freightApi.POST(
      request("api/delivery/freight/", {
        quotationId: q.recordId,
        accessToken: q.accessToken,
        origin,
        bookings,
      }),
    );
    assert.equal(response.status, 200);
    const freight = await response.json();
    assert.equal(freight.amount, 150);
    assert.equal(freight.distanceMiles, 10);
    global.fetch = originalFetch;

    const latestDelivery = await deliverySettings();
    const policy = {
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
    assert.equal(
      (
        await admin.POST(
          request("api/admin/delivery/", {
            action: "settings",
            expectedVersion: latestDelivery.version,
            noteTitle: "Integration test",
            note: "Dynamic pallet loading rules",
            settings: {
              ...latestDelivery.settings,
              transport: policy,
              pickupFees: {
                ...latestDelivery.settings.pickupFees,
                handlingMinimum: 100,
                laborPerPersonHour: 50,
              },
            },
          }),
        )
      ).status,
      200,
    );
    const smallTrailer = await quotes
      .POST(
        request("api/quotations/", {
          lines: [
            {
              ...line,
              quantity: "100",
              scale: "trailer",
              construction: "glass-backsheet",
            },
          ],
        }),
      )
      .then((r) => r.json());
    assert.equal(smallTrailer.processingTotal, 1125);
    assert.equal(smallTrailer.lines[0].scale, "trailer");
    assert.match(smallTrailer.document.text, /Processing basis: Truck/);
    const bigTrailer = await quotes
      .POST(
        request("api/quotations/", {
          lines: [
            {
              ...line,
              quantity: "500",
              scale: "trailer",
              construction: "glass-backsheet",
            },
          ],
        }),
      )
      .then((r) => r.json());
    assert.ok(bigTrailer.processingTotal > 0);
    assert.match(bigTrailer.document.text, /Processing basis: Trailer/);
    const pickupDetails = {
      ...load("lib/pickup").defaultPickupDetails,
      removed: true,
      properlyPacked: true,
      palletized: true,
      wrapped: true,
      strapped: true,
      forklift: true,
      carryingHelp: true,
      palletCount: 17,
      lengthIn: 65,
      widthIn: 40,
      heightIn: 48,
      grossWeightLb: 20000,
      workers: 2,
      laborHours: 1,
    };
    const nextDate = cal.days[1].date;
    const pickupBooking = [
      { date: nextDate, period: "am", vehicle: "trailer", count: 1 },
    ];
    global.fetch = async (url) =>
      new Response(
        JSON.stringify(
          String(url).includes("geocode")
            ? {
                status: "OK",
                results: [
                  {
                    address_components: [
                      { types: ["country"], short_name: "US" },
                    ],
                    geometry: { location: { lat: 33.6, lng: -117.1 } },
                  },
                ],
              }
            : { routes: [{ distanceMeters: 16093.44 }] },
        ),
        { headers: { "Content-Type": "application/json" } },
      );
    const pickupFreight = await freightApi
      .POST(
        request("api/delivery/freight/", {
          quotationId: bigTrailer.recordId,
          accessToken: bigTrailer.accessToken,
          origin,
          bookings: pickupBooking,
          pickup: pickupDetails,
        }),
      )
      .then((r) => r.json());
    assert.equal(pickupFreight.amount, 250);
    assert.equal(
      pickupFreight.breakdown.services.find((i) => i.key === "handling").amount,
      100,
    );
    const pickupOrder = {
      ...base,
      quotationId: bigTrailer.recordId,
      accessToken: bigTrailer.accessToken,
      idempotencyKey: crypto.randomUUID(),
      method: "pickup",
      origin,
      bookings: pickupBooking,
      pickup: pickupDetails,
      freightQuoteId: pickupFreight.id,
    };
    assert.equal(
      (
        await orders.POST(
          request("api/recycling-orders/", {
            ...pickupOrder,
            bookings: [{ ...pickupBooking[0], vehicle: "truck" }],
          }),
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await orders.POST(
          request("api/recycling-orders/", {
            ...pickupOrder,
            pickup: { ...pickupDetails, carryingHelp: false },
          }),
        )
      ).status,
      409,
    );
    const acceptedPickup = await orders.POST(
      request("api/recycling-orders/", pickupOrder),
    );
    assert.equal(acceptedPickup.status, 201);
    const acceptedPickupId = (await acceptedPickup.json()).id;
    const pickupRow = (
      await pool.query(
        "SELECT pickup_details,freight_breakdown,freight_total FROM pv_recycling_order_requests WHERE id=$1",
        [acceptedPickupId],
      )
    ).rows[0];
    assert.equal(pickupRow.pickup_details.grossWeightLb, 20000);
    assert.equal(Number(pickupRow.freight_total), 250);
    assert.equal(
      pickupRow.freight_breakdown.services[0].label,
      "Manual handling",
    );
    global.fetch = originalFetch;
    console.log(
      "Passed: authoritative Trailer qualification, retained pricing selection, pickup load rejection, stale-service quote rejection and stored service breakdown.",
    );
    const mailAdmin = load("app/api/admin/communications/route"),
      emailApi = load("app/api/quotations/email/route");
    assert.equal((await mailAdmin.GET()).status, 200);
    assert.equal(
      (await mailAdmin.GET().then((r) => r.json())).sender,
      "terry.ko@pvcirconomy.com",
    );
    assert.equal(
      (
        await mailAdmin.POST(
          request("api/admin/communications/", {
            sender: "outside@example.com",
          }),
        )
      ).status,
      400,
    );
    const contact = {
      name: "Quotation Customer",
      email: "quote@example.invalid",
      company: "Test Company",
      phone: "",
    };
    const mailQuote = await quotes
      .POST(request("api/quotations/", { lines: [line], contact }))
      .then((r) => r.json());
    assert.ok(
      mailQuote.document.text.includes("Prepared for: Quotation Customer"),
    );
    assert.equal(
      (
        await quotes.POST(
          request("api/quotations/", {
            lines: [line],
            contact: { ...contact, name: "bad\nname" },
          }),
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await emailApi.POST(
          request("api/quotations/email/", {
            quotationId: mailQuote.recordId,
            accessToken: mailQuote.accessToken,
            email: contact.email,
          }),
        )
      ).status,
      503,
    );
    global.__mailAuth = {
      tenant: "test-tenant",
      client: "test-client",
      secret: "test-only-secret",
    };
    process.env.MICROSOFT_MAIL_ENABLED = "true";
    let mailSends = 0;
    global.fetch = async (url, options) => {
      if (String(url).includes("/oauth2/v2.0/token"))
        return Response.json({ access_token: "mock-token" });
      assert.ok(String(url).includes("terry.ko%40pvcirconomy.com/sendMail"));
      const payload = JSON.parse(options.body);
      assert.equal(
        payload.message.toRecipients[0].emailAddress.address,
        contact.email,
      );
      assert.ok(
        payload.message.body.content.includes(
          "Quotation Customer",
        ),
      );
      assert.equal(payload.message.body.contentType, "HTML");
      assert.match(payload.message.body.content, /<table/);
      mailSends++;
      return new Response(null, { status: 202 });
    };
    const emailBody = {
      quotationId: mailQuote.recordId,
      accessToken: mailQuote.accessToken,
      email: contact.email,
    };
    assert.equal(
      (
        await emailApi.POST(
          request("api/quotations/email/", {
            ...emailBody,
            email: "other@example.invalid",
          }),
        )
      ).status,
      400,
    );
    assert.equal(
      (await emailApi.POST(request("api/quotations/email/", emailBody))).status,
      200,
    );
    assert.equal(
      (await emailApi.POST(request("api/quotations/email/", emailBody))).status,
      200,
    );
    assert.equal(mailSends, 1);
    await pool.query("DELETE FROM pv_delivery_rate_limits");
    let orderEmailText = "";
    global.fetch = async (url, options) => {
      if (String(url).includes("/oauth2/v2.0/token"))
        return Response.json({ access_token: "mock-token" });
      orderEmailText = JSON.parse(options.body).message.body.content;
      return new Response(null, { status: 202 });
    };
    assert.equal(
      (
        await emailApi.POST(
          request("api/quotations/email/", {
            quotationId: bigTrailer.recordId,
            accessToken: bigTrailer.accessToken,
            email: "test@example.invalid",
            orderId: acceptedPickupId,
          }),
        )
      ).status,
      200,
    );
    assert.match(orderEmailText, /Recycling order request/);
    assert.match(orderEmailText, /Manual handling/);
    assert.match(orderEmailText, /\$100.00/);
    global.fetch = originalFetch;
    delete process.env.MICROSOFT_MAIL_ENABLED;
    global.__mailAuth = null;
    console.log(
      "Quotation contact validation, company sender settings, disabled mail, recipient binding and single Microsoft Graph send passed (mock only).",
    );
    if (process.env.PV_DELIVERY_BROWSER === "1") {
      const {
        chromium,
      } = require("/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
      const browser = await chromium.launch({
        executablePath: "/usr/bin/chromium",
        args: ["--no-sandbox"],
      });
      try {
        for (const width of [1440, 390]) {
          const page = await browser.newPage({
            viewport: { width, height: 1000 },
            reducedMotion: "reduce",
          });
          const routes = {
            pricing: load("app/api/pricing/route"),
            "delivery/settings": load("app/api/delivery/settings/route"),
            "delivery/availability": calendar,
            quotations: quotes,
            "recycling-orders": orders,
            "admin/delivery": admin,
          };
          await page.route("**/api/**", async (intercepted) => {
            const r = intercepted.request();
            const uri = new URL(r.url());
            const name = uri.pathname
              .replace("/api/", "")
              .replace(/\/$/, "");
            if (name === "auth/session")
              return intercepted.fulfill({
                json: {
                  configured: true,
                  user: {
                    email: "staff@tsgc.com.tw",
                    name: "Test staff",
                    role: "staff",
                  },
                },
              });
            const handler = routes[name];
            if (!handler) return intercepted.continue();
            const result = await handler[r.method()](
              new Request(r.url(), {
                method: r.method(),
                headers: r.headers(),
                body: r.method() === "GET" ? undefined : r.postData(),
              }),
            );
            await intercepted.fulfill({
              status: result.status,
              contentType: "application/json",
              body: await result.text(),
            });
          });
          await page.goto("http://localhost:3105/");
          const plan = page.getByRole("button", {
            name: "Plan your delivery",
            exact: true,
          });
          await plan.waitFor();
          await plan.click();
          const delivery = page.locator("#delivery");
          await delivery
            .getByRole("button", { name: "Place recycling order", exact: true })
            .waitFor();
          await delivery
            .getByRole("button", { name: "Place recycling order", exact: true })
            .click();
          const dateInput = delivery.getByLabel("Batch 1 date", {
            exact: true,
          });
          await dateInput.waitFor();
          await page.waitForFunction(
            () => document.querySelector('[aria-label="Batch 1 date"]')?.value,
          );
          await page.locator(".pv-booking-expanded").waitFor();
          const left = await page.locator(".pv-booking-left").boundingBox(),
            right = await page.locator(".pv-month-calendar").boundingBox();
          if (width > 960) assert.ok(right.x >= left.x + left.width);
          else assert.ok(right.y < left.y);
          const originalDate = await dateInput.inputValue();
          await page
            .locator(".pv-calendar-days button:not([disabled])")
            .nth(1)
            .click();
          assert.notEqual(await dateInput.inputValue(), originalDate);
          const clickedDate = await dateInput.inputValue();
          await page
            .locator(".pv-calendar-days button[aria-pressed=true]")
            .focus();
          await page.keyboard.press("ArrowRight");
          await page.keyboard.press("Enter");
          assert.notEqual(await dateInput.inputValue(), clickedDate);
          await page.locator(".pv-calendar-slots>button").last().click();
          assert.equal(
            await delivery
              .getByLabel("Batch 1 time window", { exact: true })
              .inputValue(),
            "pm",
          );
          const month = await page.locator(".pv-month-heading h4").innerText();
          await page
            .getByRole("button", { name: "Next month", exact: true })
            .click();
          assert.notEqual(
            await page.locator(".pv-month-heading h4").innerText(),
            month,
          );
          await page
            .getByRole("button", { name: "Previous month", exact: true })
            .click();
          assert.equal(
            await page.locator(".pv-month-heading h4").innerText(),
            month,
          );
          await page.evaluate(() =>
            document.getElementById("delivery").scrollIntoView(),
          );
          await page.screenshot({
            path: "/tmp/pv-expanded-calendar-" + width + ".png",
          });
          const retainedDate = await dateInput.inputValue();
          await delivery
            .getByRole("button", {
              name: "Back to delivery options",
              exact: true,
            })
            .click();
          await page.waitForFunction(
            () => !document.querySelector(".pv-booking-expanded"),
          );
          await delivery
            .getByRole("button", { name: "Place recycling order", exact: true })
            .click();
          await page.locator(".pv-booking-expanded").waitFor();
          assert.equal(await dateInput.inputValue(), retainedDate);
          await delivery
            .getByLabel("Contact name", { exact: true })
            .fill("Browser Test");
          await delivery
            .getByLabel("Email", { exact: true })
            .fill("browser@example.invalid");
          await delivery
            .getByLabel("Phone", { exact: true })
            .fill("5555550123");
          await delivery
            .getByLabel(
              "I confirm the panel details and request these time windows, subject to receiving requirements and company confirmation.",
              { exact: true },
            )
            .check();
          await delivery
            .getByRole("button", {
              name: "Submit recycling order request",
              exact: true,
            })
            .click();
          await delivery
            .getByRole("heading", {
              name: "Order request received",
              exact: true,
            })
            .waitFor({ timeout: 20000 });
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth,
            ),
            false,
          );
          await page.screenshot({
            path: "/tmp/pv-real-order-flow-" + width + ".png",
          });
          console.log(
            width,
            "browser → stored quotation → delivery → calendar → PostgreSQL order request passed",
          );
          await page.goto("http://localhost:3105/admin/delivery/");
          const capacity = page.getByLabel("每半天 Truck 容量", {
            exact: true,
          });
          await capacity.waitFor();
          assert.equal(
            await page.getByLabel("收貨地址", { exact: true }).inputValue(),
            config.settings.address,
          );
          await capacity.fill(width === 1440 ? "3" : "2");
          await page
            .getByRole("button", { name: "儲存並啟用交付設定", exact: true })
            .click();
          await page
            .getByText("已儲存並啟用交付設定。", { exact: true })
            .waitFor();
          await page.evaluate(() => scrollTo(0, 0));
          await page.screenshot({
            path: "/tmp/pv-delivery-admin-" + width + ".png",
          });
          console.log(
            width,
            "staff delivery settings form saved to PostgreSQL",
          );
          await page.close();
        }
      } finally {
        await browser.close();
      }
    }
    console.log(
      "Passed on PostgreSQL: authoritative stored quotation, forged model rejection, shared capacity, separate pickup pool, concurrent reservations, idempotency, rejection release, staff authorization, config conflicts and freight calculation (Google mocked; no real dispatch).",
    );
  } finally {
    await pool.end();
    fs.rmSync(temp, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
