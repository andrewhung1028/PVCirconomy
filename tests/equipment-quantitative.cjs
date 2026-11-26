const assert = require('node:assert/strict');
const ExcelJS = require('exceljs');
const { PGlite } = require('@electric-sql/pglite');
require('./helpers/typescript.cjs');

async function main() {
  const db = new PGlite();
  const databaseUrl = process.env.DATABASE_URL;
  const fetchBefore = global.fetch;
  process.env.DATABASE_URL = 'test-fixture';
  global.fetch = async () => new Response('', { status: 503 });
  require('../server/db/client.ts').database = () => async (parts, ...values) => {
    const sql = parts.reduce((statement, part, index) => statement + part + (index < values.length ? '$' + (index + 1) : ''), '');
    return (await db.query(sql, values)).rows;
  };

  try {
    const store = require('../server/equipment-configurations/store.ts');
    const { exportEquipmentWorkbook, importEquipmentWorkbook } = require('../server/equipment-configurations/workbook.ts');
    const { equipmentLineRating, integratedEquipmentThroughput } = require('../lib/equipment-configurations.ts');
    const { equipmentSchedule } = require('../lib/equipment-quantitative.ts');
    const { equipmentMouMarket } = require('../server/equipment-mou/market.ts');
    const { equipmentMouArticles } = require('../lib/equipment-mou-articles.ts');

    // Simulate the existing table before the quantitative column was added.
    await db.exec(`CREATE TABLE pv_equipment_configuration_versions (
      revision integer PRIMARY KEY, configurations jsonb NOT NULL, msrp jsonb, module_prices jsonb,
      saved_at timestamptz NOT NULL DEFAULT now(), actor_email text NOT NULL
    )`);
    await db.query('INSERT INTO pv_equipment_configuration_versions(revision, configurations, actor_email) VALUES (1, $1::jsonb, $2)', [
      JSON.stringify(require('../lib/equipment-configurations.ts').defaultEquipmentConfigurations), 'test@example.invalid',
    ]);
    const current = await store.loadEquipmentSettings();
    assert.equal(current.revision, 1);
    assert.equal(current.quantitative.claims.annualPanels, 240000);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await exportEquipmentWorkbook(current));
    assert.equal(workbook.getWorksheet('Workbook').getCell('B1').value, 'PV Circulator equipment v4');
    const edit = (name, key, column, value) => {
      const sheet = workbook.getWorksheet(name);
      const row = sheet.getRows(2, sheet.rowCount - 1).find(row => row.getCell(1).value === key);
      assert.ok(row, name + ' ' + key);
      row.getCell(column).value = value;
    };
    const jpColumn = workbook.getWorksheet('Calculator Defaults').getRow(1).values.indexOf('JP');
    edit('Website Claims', 'annualPanels', 3, 250000);
    edit('Site Power', 'JP', 3, '200 V · 50 Hz\n220 V · 60 Hz');
    edit('Calculator Defaults', 'shifts', jpColumn, 4);
    const upload = async () => importEquipmentWorkbook(Buffer.from(await workbook.xlsx.writeBuffer()));
    await assert.rejects(upload, /Calculator Defaults/);

    edit('Calculator Defaults', 'shifts', jpColumn, 2);
    edit('Calculator Defaults', 'lineQuantity', jpColumn, 2);
    edit('Pricing Settings', 'nonUsdFactor', 3, 1.07);
    edit('MOU Parameters', 'basicInstalledKw', 3, 88);
    edit('Performance', 'Rated throughput', 4, '1.5 panels/min');
    const draft = await upload();
    const publish = () => store.publishEquipmentSettings(draft.configurations, draft.modulePrices, draft.quantitative, draft.expectedRevision, 'test@example.invalid');
    const published = await publish();
    assert.equal(published.revision, 2);
    assert.equal(await publish(), null);
    const equipment = await store.publicEquipmentData();
    assert.equal(equipment.quantitative.claims.annualPanels, 250000);
    assert.equal(equipment.quantitative.markets.JP.lineQuantity, 2);
    assert.equal(equipment.quantitative.markets.US.lineQuantity, 1);
    assert.deepEqual(equipment.quantitative.sitePower.JP, ['200 V · 50 Hz', '220 V · 60 Hz']);
    assert.equal(equipmentSchedule(equipment.quantitative.markets.JP).dailyHours, 16);
    assert.equal(equipmentLineRating(equipment.configurations).panelsPerMinute, 1.5);
    assert.equal(integratedEquipmentThroughput(equipment.configurations),1.5);
    const slowerPlus=structuredClone(equipment.configurations);
    slowerPlus.plus.values['Rated throughput']='0.5 panel/min';
    assert.equal(integratedEquipmentThroughput(slowerPlus),0.5);
    assert.ok(!Object.hasOwn(equipment, 'modulePrices'));

    const input = { configuration: 'basic', installationMarket: 'JP', locale: 'en-US' };
    const { terms } = await equipmentMouMarket(input);
    assert.equal(await equipmentMouMarket({...input,sitePowerSupply:'200 V · 60 Hz'}), null);
    assert.ok(await equipmentMouMarket({...input,sitePowerSupply:'220 V · 60 Hz'}));
    assert.equal(terms.specifications.installedKw, 88);
    assert.equal(terms.specifications.ratedThroughput, 1.5);
    assert.match(equipmentMouArticles(input, terms)[2].items.flat().join(' '), /88 kW/);
    const { specifications, ...legacyTerms } = terms;
    assert.match(equipmentMouArticles(input, legacyTerms)[2].items.flat().join(' '), /85 kW/);

    const reexport = new ExcelJS.Workbook();
    await reexport.xlsx.load(await exportEquipmentWorkbook(published));
    const japanMsrp = reexport.getWorksheet('MSRP').getRows(2, 6).find(row => row.getCell(1).value === 'JP');
    assert.deepEqual(japanMsrp.getCell(4).value, { formula: "'Pricing Settings'!C2", result: 1.07 });
    reexport.getWorksheet('Workbook').getCell('B1').value = 'PV Circulator equipment v3';
    const oldUpload = await importEquipmentWorkbook(Buffer.from(await reexport.xlsx.writeBuffer()));
    assert.equal(oldUpload.quantitative, undefined, 'legacy imports leave newly published values untouched');
  } finally {
    if (databaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = databaseUrl;
    global.fetch = fetchBefore;
    await db.close();
  }
}
main().then(() => console.log('Equipment quantitative settings round trip passed')).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
