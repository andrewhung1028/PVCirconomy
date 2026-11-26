const assert = require('node:assert/strict');
require('./helpers/typescript.cjs');

const { initialRules, initialJapanRules, pricingProfiles } = require('../lib/pricing-rules.ts');
const { recyclingQuote } = require('../lib/recycling-quote.ts');
const { money } = require('../lib/batch-quote.ts');

const jp = recyclingQuote({quantity:1,watts:300,scale:'trailer',condition:'complete',weightKg:20,weightUnit:'kg'},initialJapanRules,undefined,1000);
assert.equal(jp.unit,'kg');assert.equal(jp.weight,20);assert.equal(jp.total,1253.98);
assert.equal(money(1253.98,pricingProfiles.JP),'￥1,254');

const us = recyclingQuote({quantity:1,watts:300,scale:'trailer',condition:'complete',weightLb:44.09},initialRules,undefined,1000);
assert.equal(us.unit,'lb');assert.equal(us.weight,44.09);assert.equal(us.total,7.94);
assert.equal(money(7.94,pricingProfiles.US),'$7.94');

console.log('Passed: coexisting JP JPY/kg and US USD/lb pricing profiles with unchanged US behavior.');
