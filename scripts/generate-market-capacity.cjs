// Regenerates data/our-solution-market-capacity.json (seed for the Market Capacity sheet).
// Non-US markets and World reproduce the pre-sheet chart formula exactly; US uses IRENA statistics 2000–2025, then fixed growth to 3,200 GW in 2050.
const fs=require('fs');
const markets=["Europe","United States","Japan","Taiwan","Australia","China"];
const start=[361.49691, 260.89131, 98.366494, 16.100058, 43.946566, 951.13452],end=[1940, 3200, 524, 80, 1900, 5500];
const old=[],rows=[];
const csv=fs.readFileSync('data/us-pv-installations.csv','utf8').trim().split('\n').slice(1).map(l=>l.split(',').map(Number));
const us2025=csv.find(r=>r[0]===2025)[1]/1000;
for(let index=0;index<26;index++){const year=2025+index,progress=index/25;
 const total=2185.4493*Math.pow(20059/2185.4493,progress);
 const named=start.map((s,m)=>s*Math.pow(end[m]/s,progress));
 old.push({year,total,values:[...named,Math.max(0,total-named.reduce((a,b)=>a+b,0))]});
 const nn=named.slice();nn[1]=us2025*Math.pow(3200/us2025,progress);
 const other=total-nn.reduce((a,b)=>a+b,0);if(other<0)throw Error('neg other '+year);
 markets.forEach((m,i)=>{if(m==='United States'&&year===2025)return;rows.push({market:m,year,gw:nn[i],source:m==='United States'?'待補':'待補',sourceYear:null,note:m==='United States'?'2026–2050：自 IRENA 2025 實績以固定年增率成長至 2050 年 3,200 GW（網站原情境終點）':'網站原情境：2025→2050 固定年增率'});});
 rows.push({market:'Other markets',year,gw:other,source:'待補',sourceYear:null,note:'= World − 六個市場'});
 rows.push({market:'World',year,gw:total,source:'待補',sourceYear:null,note:'網站原情境：2025→2050 固定年增率（2.185 TW → 20.059 TW）'});
}
for(const [y,mw] of csv)rows.push({market:'United States',year:y,gw:Math.round(mw*10)/10000,source:'IRENA statistics',sourceYear:null,note:'累積裝置量（AC，未做 AC→DC 換算），與既有美國退役曲線相同'});
const order=["Europe","United States","Japan","Taiwan","Australia","China","Other markets","World"];
rows.sort((a,b)=>order.indexOf(a.market)-order.indexOf(b.market)||a.year-b.year);
fs.writeFileSync('data/our-solution-market-capacity.json',JSON.stringify(rows,null,1)+'\n');
console.log(rows.length,'rows; US2025',us2025,'US2026',rows.find(r=>r.market==='United States'&&r.year===2026).gw);
