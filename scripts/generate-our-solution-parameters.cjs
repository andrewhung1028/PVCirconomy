// Regenerate the parameter seed from Andrew's authoritative fixture. No database/network.
require('../tests/helpers/typescript.cjs');
const fs=require('node:fs'),{parseOurSolutionWorkbook}=require('../server/our-solution/workbook.ts');
parseOurSolutionWorkbook(fs.readFileSync('tests/fixtures/our-solution-master-2026-11-22.xlsx')).then(p=>fs.writeFileSync('data/our-solution-parameters.json',JSON.stringify(p,null,2)+'\n')).catch(e=>{console.error(e);process.exit(1)});
