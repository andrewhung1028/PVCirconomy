const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const ts = require("typescript");

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "pv-quotation-email-"));
for (const file of [
  "lib/quotation-email",
  "lib/quotation-document",
  "lib/batch-quote",
  "lib/pricing-rules",
  "lib/pickup",
  "lib/panel-weight",
  "lib/recycling-quote",
]) {
  const output = path.join(temp, `${file}.js`);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(
    output,
    ts.transpileModule(
      fs.readFileSync(path.join(__dirname, "..", `${file}.ts`), "utf8"),
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

const { quotationEmail } = require(path.join(temp, "lib/quotation-email.js"));
const { initialRules } = require(path.join(temp, "lib/pricing-rules.js"));
const line = {
  id: "line-1",
  mode: "watts",
  quantity: "300",
  watts: "350",
  condition: "complete",
  scale: "truck",
  modelQuery: "",
  selectedModel: null,
  length: "",
  width: "",
  dimensionUnit: "mm",
  construction: "glass-backsheet",
};
const message = quotationEmail({
  document: {
    id: "PVC-TEST",
    issued: "2026-11-18T12:00:00.000Z",
    expires: "2026-11-25T12:00:00.000Z",
    text: "Prepared for: Jane Owner\nEmail: jane@example.com\nCompany: Solar Owner LLC",
  },
  lines: [line],
  pricing: { version: "test", createdAt: "2026-11-18T00:00:00.000Z", rules: initialRules },
  processingTotal: 3375,
  recipient: "jane@example.com",
  order: {
    id: "ORD-TEST",
    deliveryMethod: "pickup",
    bookings: [{ date: "2026-12-04", period: "am", vehicle: "truck", count: 1 }],
    freightTotal: 725,
    freightBreakdown: {
      baseAmount: 625,
      knownSubtotal: 725,
      services: [{ label: "Manual handling", amount: 100 }],
      pending: ["Receiving appointment time requires confirmation"],
    },
    originAddress: { address1: "100 Solar Way", city: "Fresno", state: "CA", postalCode: "93721" },
  },
});

assert.match(message.subject, /recycling order request ORD-TEST/i);
assert.match(message.html, /<table/);
assert.match(message.html, /350 W solar panel/);
assert.match(message.html, /Manual handling/);
assert.match(message.html, /Known charges subtotal/);
assert.match(message.html, /\$4,100\.00/);
assert.match(message.html, /Pending confirmation/);
assert.doesNotMatch(message.html, /<pre/);
console.log("Passed: structured quotation and order email tables, totals and pending terms.");
