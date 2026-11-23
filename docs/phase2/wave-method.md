# Our Solution capacity and retirement parameters

Authoritative source: `tests/fixtures/our-solution-master-2026-11-22.xlsx`, Instructions B15–B21. Regenerate the seed with `node scripts/generate-our-solution-parameters.cjs`. The parameter seed is `data/our-solution-parameters.json`.

Capacity History contains 2000–2024 actuals and 2050 values. Between 2024 and 2050, each market grows at a constant annual compound rate. Other markets = World minus Europe, United States, Japan, Taiwan, China and Australia. The chart displays every year 2025–2050.

The pure model in `lib/our-solution/model.ts` and the retirement recursion in `lib/us-retirement-wave.ts` implement Weibull F(a) = 1 − exp(−(a/T)^shape). No retirement occurs in the installation year. Retired capacity is replaced; replacement vintages can retire again. Initial 2000 stock enters as the 2000 vintage. New capacity is floored at zero.

Default lifetime and loss scenario come from Section 10 (18 years and early loss in the supplied workbook); the selector also offers 25, 15 and 12 years. Both shapes are parameters. Module mass is constant across vintages: panel weight × 0.45359237 × 1,000,000 ÷ panel watts = kg/MW (45 lb, 350 W gives 58,319.019 kg/MW). This replaces the prior vintage-specific IRENA mass assumptions.

Population is in thousands of people. Europe sums the 27 countries in EU-27 Population. Source: UN World Population Prospects 2022, Medium variant. Per-capita pressure is annual retired mass in kg divided by population in people, using the selected master lifetime/loss scenario.

The reference output copied to `tests/fixtures/our-solution-reference.json` is checked by `tests/our-solution-model.cjs`. The US early-loss T18 reference values are 576,583 t in 2030 and 5,559,221 t in 2050; threshold years are 2023 / 2030 / 2034 for 100 kt / 500 kt / 1 Mt.
