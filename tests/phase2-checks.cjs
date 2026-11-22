const assert=require('node:assert/strict'),{execFileSync,spawnSync}=require('node:child_process');
const version=require('next/package.json').version;assert.match(version,/^16\.4\./);assert.ok(Number(version.split('.')[2])>=6);console.log(`T1: installed Next ${version}.`);
const audit=spawnSync('npm',['audit','--omit=dev','--json'],{encoding:'utf8'});const report=JSON.parse(audit.stdout);assert.ok(!report.error,JSON.stringify(report.error));assert.ok(!report.vulnerabilities?.next);console.log('T1: production audit has no Next advisories; exceljs/uuid advisory remains out of scope.');
// T2 originally froze calculator paths at 0e0d257. The approved EU/local-currency work (t506/t507) intentionally changes them,
// so the guard is now behavioural: the v2 engine must replay all 225 recorded v1 cases and 2,485 v1/v2 scenarios at zero tolerance.
execFileSync(process.execPath,['tests/business-case-parity.cjs'],{encoding:'utf8',stdio:'inherit'});console.log('T2: calculator changes keep v1 parity (225 recorded cases, zero tolerance).');
