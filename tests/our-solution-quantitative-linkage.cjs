const assert=require('node:assert/strict'),fs=require('node:fs');
require('./helpers/typescript.cjs');
const {seededOurSolutionData:seed,economicsView,effectiveParameters}=require('../lib/our-solution-data.ts');
const {model}=require('../lib/our-solution/model.ts');
const {websiteDataDefaults,normalizedWebsiteAssumptionRows}=require('../lib/our-solution/public-data.ts');

const component=fs.readFileSync('app/components/our-solution.tsx','utf8');
const referenced=[...component.matchAll(/webNum\([^,]+,\s*["`]([^"`]+)["`]/g)].map(match=>match[1]);
for(const key of referenced)assert.ok(websiteDataDefaults[key],`UI quantitative key is absent from Assumptions section 12: ${key}`);

assert.doesNotMatch(component,/recovery:\s*["`]~?88%/,'thermal recovery must come from the workbook');
assert.doesNotMatch(component,/recovery:\s*["`]99\.3%/,'PV Circulator recovery must come from the workbook');
assert.doesNotMatch(component,/lineCapacityMw\s*=\s*50\b/,'line capacity must come from the workbook');
assert.doesNotMatch(component,/Elkem|Actual measured value 1\.5%/,'measured silver content must come from the workbook without a named company');
assert.doesNotMatch(component,/direct_staff_per_shift|indirect_staff_per_shift/,'the current UI uses one total-staff value per method');

const baseline=model(seed),edited=structuredClone(seed);
edited.assumptions[12]['methods.thermal.total_staff_per_shift'][0]=5;
const changed=model(edited);
assert.equal(changed.solutions.HOT_KNIFE.opex.labor/baseline.solutions.HOT_KNIFE.opex.labor,5/4,'thermal labor follows the workbook total-staff value');
assert.equal(changed.solutions.SHREDDING.opex.labor,baseline.solutions.SHREDDING.opex.labor,'editing thermal staff does not alter shredding labor');
assert.equal(changed.solutions.PVCIRCULATOR.opex.labor,baseline.solutions.PVCIRCULATOR.opex.labor,'editing thermal staff does not alter PV Circulator labor');

const legacy=structuredClone(seed);
delete legacy.assumptions[12]['methods.thermal.total_staff_per_shift'];
legacy.assumptions[12]['methods.thermal.direct_staff_per_shift']=[2,'people/shift','legacy','Methods','legacy'];
legacy.assumptions[12]['methods.thermal.indirect_staff_per_shift']=[2,'people/shift','legacy','Methods','legacy'];
legacy.assumptions[12]['value.circulator_elkem_silver_percent']=legacy.assumptions[12]['value.circulator_measured_silver_percent'];
delete legacy.assumptions[12]['value.circulator_measured_silver_percent'];
legacy.assumptions[12]['materials.silver_demand_recovered_percent'][2]='IEA assessment';
legacy.assumptions[4]['Operators per shift']=[5,5,3,'people'];
const normalized=effectiveParameters(legacy);
assert.equal(normalized.assumptions[12]['methods.thermal.total_staff_per_shift'][0],4,'legacy staff fields migrate to one total');
assert.ok(!('Operators per shift' in normalized.assumptions[4]),'the obsolete duplicate staffing row is removed');
assert.ok(!Object.keys(normalized.assumptions[12]).some(key=>/\.(direct|indirect)_staff_per_shift$/.test(key)),'legacy split staffing rows are removed');
assert.equal(normalized.assumptions[12]['materials.silver_demand_recovered_percent'][2],'IEA, Solar PV Global Supply Chains (2022)','legacy generic IEA citation is upgraded');
assert.equal(normalized.assumptions[12]['value.circulator_measured_silver_percent'][0],1.5,'legacy measured silver value migrates without the company name');

const view=economicsView(seed);
for(const key of Object.keys(websiteDataDefaults))assert.ok(view.websiteData[key],`view exposes Assumptions section 12 key: ${key}`);
assert.equal(view.websiteData['methods.shredding.total_staff_per_shift'].value,5);
assert.equal(view.websiteData['methods.thermal.total_staff_per_shift'].value,4);
assert.equal(view.websiteData['methods.circulator.total_staff_per_shift'].value,3);
assert.deepEqual(Object.keys(normalizedWebsiteAssumptionRows(seed.assumptions[12])),Object.keys(websiteDataDefaults));
const silverShare=view.productMaterials.find(material=>material.name==='Silver').valueShare;
const zeroRealization=structuredClone(seed);
zeroRealization.assumptions[6].Silver[1]=0;zeroRealization.assumptions[6].Silver[4]=0;zeroRealization.assumptions[6].Silver[7]=0;
assert.equal(economicsView(zeroRealization).productMaterials.find(material=>material.name==='Silver').valueShare,silverShare,'silver material-value share always uses 100% benchmark value');
assert.equal(view.productMaterials.find(material=>material.name==='Silver').valueFactor,1,'silver uses 100% benchmark value');
assert.equal(view.productMaterials.find(material=>material.name==='Aluminium').valueFactor,.5,'aluminium uses 50% LME value');
assert.equal(view.productMaterials.find(material=>material.name==='Copper').valueFactor,.5,'copper uses 50% LME value');
assert.equal(view.productMaterials.find(material=>material.name==='Glass').valueFactor,1,'glass uses the cement benchmark');
assert.equal(view.productMaterials.find(material=>material.name==='EVA').value,0,'EVA value is zero');
assert.equal(view.productMaterials.find(material=>material.name==='Backsheet').value,0,'backsheet value is zero');
assert.equal(view.productMaterials.find(material=>material.name==='Junction box').valueFactor,1,'junction box and cable follow Excel');
assert.ok(Math.abs(silverShare-0.6123066881059206)<1e-12,'seed silver value share is recalculated from the approved value rules');

console.log(`Our Solution quantitative linkage: ${Object.keys(websiteDataDefaults).length} public-data fields are workbook-backed; labor, recovery, silver measurement and line-capacity regressions passed.`);
