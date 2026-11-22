// /solutions Methods/Materials tables: existing verified figures stay as-is (AGENTS.md content rules, Andrew t526u).
const assert=require('node:assert/strict'),fs=require('node:fs');
const src=fs.readFileSync('app/components/our-solution.tsx','utf8');
{const m=src.match(/.{0,80}(To be confirmed|No operating data).{0,40}/i);assert.equal(m,null,'placeholder: '+(m&&m[0]));}
const row=label=>{const m=src.match(new RegExp(`\\{ label: "${label}", shredding: "([^"]*)", thermal: "([^"]*)", pyrolysis: "([^"]*)", circulator: "([^"]*)" \\}`));assert.ok(m,label);return m.slice(1);};
assert.deepEqual(row('Footprint'),['~480 m²','~57 m² (three machines)','~180 m²','~30–40 m²']);
assert.deepEqual(row('Energy'),['~5 kWh / panel','—','~8 kWh / panel','<1 kWh / panel']);
assert.deepEqual(row('Throughput'),['~50–60 panels / h','~40 panels / h (~90 s per panel)','~20 panels / h','~60 panels / h']);
assert.deepEqual(row('Staff'),['5 / shift','—','6 / shift','1 direct + 2 indirect']);
assert.deepEqual(row('Secondary treatment'),['~54 t / MW','—','~5 t / MW','~0.5 t / MW']);
assert.match(src,/92–94% less footprint than shredding and 78–83% less than pyrolysis/);
assert.match(src,/NPC line of three machines, ~57 m²/);
assert.match(fs.readFileSync('AGENTS.md','utf8'),/Existing website content was already verified by Andrew/);
console.log('Methods table: existing figures kept, Pyrolysis figures restored, Hot knife ~57 m² / ~90 s, no "To be confirmed".');
