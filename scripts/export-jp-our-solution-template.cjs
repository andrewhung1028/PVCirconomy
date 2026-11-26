const fs = require('node:fs');
const path = require('node:path');
require('../tests/helpers/typescript.cjs');

const { seededJapanOurSolutionData } = require('../lib/our-solution-japan-data.ts');
const { createOurSolutionWorkbook } = require('../server/our-solution/workbook.ts');

(async () => {
  const output = path.join(__dirname, '..', 'exports', 'PV-Circonomy-Our-Solution-JP-Template.xlsx');
  const bytes = await createOurSolutionWorkbook(seededJapanOurSolutionData, true);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, bytes);
  console.log(output);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
