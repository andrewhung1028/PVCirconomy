require('./typescript.cjs');
module.exports=()=>{const capacity=require('../../lib/market-capacity.ts'),wave=require('../../lib/us-retirement-wave.ts'),rows=require('../../data/our-solution-parameters.json');return {capacity,wave,rows,seedWave:wave.computeRetirementWave(capacity.usCumulativeMw(rows))};};
