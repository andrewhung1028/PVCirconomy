const assert = require("node:assert/strict"),
  ts = require("typescript"),
  fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pv-pickup-policy-"));
try {
  for (const name of [
    "pickup",
    "pickup-cargo",
    "panel-weight",
    "pricing-rules",
    "recycling-quote",
    "batch-quote",
  ])
    fs.writeFileSync(
      path.join(dir, name + ".js"),
      ts.transpileModule(
        fs.readFileSync(path.join(__dirname, "../lib", name + ".ts"), "utf8"),
        {
          compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022,
          },
        },
      ).outputText,
    );
  const p = require(path.join(dir, "pickup.js")),
    { cargoTotals } = require(path.join(dir, "pickup-cargo.js")),
    { initialRules } = require(path.join(dir, "pricing-rules.js")),
    { lineQuote, batchTotals, newQuoteLine } = require(
      path.join(dir, "batch-quote.js"),
    );
  const limits = {
    trailerMinimumPanels: 500,
    truckMaxWeightLb: 11000,
    trailerMaxWeightLb: 43000,
    truckInteriorLengthIn: 312,
    truckInteriorWidthIn: 96,
    trailerInteriorLengthIn: 630,
    trailerInteriorWidthIn: 99,
    maxPanelsPerPallet: 30,
    panelThicknessMm: 35,
    palletTareLb: 68,
  };
  const line = {
    ...newQuoteLine(),
    quantity: "100",
    watts: "350",
    construction: "glass-backsheet",
    scale: "trailer",
  };
  assert.equal(lineQuote(line, initialRules, limits).total, 1125);
  assert.equal(lineQuote(line, initialRules, limits).unit, "panel");
  assert.equal(line.scale, "trailer");
  assert.equal(
    lineQuote({ ...line, quantity: "500" }, initialRules, limits).unit,
    "lb",
  );
  assert.equal(
    lineQuote(line, initialRules, p.defaultTransportLimits).unit,
    "panel",
  );
  assert.equal(
    batchTotals(
      [
        { ...line, quantity: "300" },
        { ...line, quantity: "250" },
      ],
      initialRules,
      limits,
    ).prices.every((x) => x.unit === "lb"),
    true,
  );
  const panels400 = cargoTotals(
    [{ ...line, quantity: "480", watts: "400", construction: "unknown" }],
    { ...initialRules, unknownGramsPerWatt: 55 },
    undefined,
    limits,
  );
  assert.equal(panels400.estimatedPalletCount, 16);
  assert.equal(
    p.requiredVehicles(panels400, "truck", limits).count,
    3,
  );
  assert.equal(
    p.requiredVehicles(panels400, "trailer", limits).count,
    1,
  );
  assert.equal(
    p.capacityFits(panels400, [{ vehicle: "trailer", count: 1 }], limits),
    true,
  );
  assert.equal(
    p.capacityFits(panels400, [{ vehicle: "truck", count: 2 }], limits),
    false,
  );
  const ready = {
    ...p.defaultPickupDetails,
    removed: true,
    properlyPacked: true,
    palletized: true,
    wrapped: true,
    forklift: true,
  };
  assert.equal(p.validPickup(ready), true);
  assert.equal(p.validPickup({ ...ready, workers: 1.5 }), false);
  assert.equal(p.pickupCharges(ready, p.defaultPickupFees).knownTotal, 0);
  assert.equal(p.pickupCharges(ready, p.defaultPickupFees).pending.length, 0);
  const unpacked = {
    ...ready,
    properlyPacked: false,
    packingHelp: true,
    workers: 2,
    laborHours: 3,
    palletCount: 2,
  };
  const costs = p.pickupCharges(unpacked, {
    ...p.defaultPickupFees,
    packingPerPallet: 10,
    materialsPerPallet: 5,
    handlingMinimum: 100,
    laborPerPersonHour: 50,
  });
  assert.equal(costs.knownTotal, 330);
  assert.equal(costs.pending.length, 0);
  assert.equal(
    p
      .pickupCharges({ ...unpacked, laborHours: null }, p.defaultPickupFees)
      .items.find((x) => x.key === "handling").amount,
    null,
  );
  assert.ok(
    p.pickupCharges({ ...ready, forklift: false }, p.defaultPickupFees).pending
      .length,
  );
  console.log(
    "Passed: trailer eligibility, 400 W pallet planning, floor layout, gross-weight loading, packing/labor and liftgate review.",
  );
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
