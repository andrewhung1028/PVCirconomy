import { activePricing } from "../../../server/pricing/store";
import { pricingMarket, panelAreaWeightFactors } from "../../../lib/pricing-rules";
import { database } from '../../../server/db/client';
import reference from '../../../data/module-reference.json';
import {panelWeight} from '../../../lib/panel-weight';
export const runtime = 'nodejs';
export async function GET(request: Request) {
 const headers={'Cache-Control':'no-store'};const params=new URL(request.url).searchParams;
 const q=params.get('q')?.trim()||'';const length=Number(params.get('length'));const width=Number(params.get('width'));
 const dimensional=params.has('length')||params.has('width');
 if(dimensional?(!Number.isFinite(length)||!Number.isFinite(width)||length<100||width<100||length>5000||width>5000):(q.length<2||q.length>100))return Response.json({error:'invalid_search'},{status:400,headers});
 // Reference data preserves source estimates. It is not marked verified wholesale.
 const tokens=q.toLowerCase().split(/\s+/);const [long,short]=[length,width].sort((a,b)=>b-a);
 const matches=reference.filter(m=>dimensional?['CEC','datasheet'].includes(m.dimension_category||'')&&m.length_mm!==null&&m.width_mm!==null&&Math.abs(Math.max(m.length_mm,m.width_mm)-long)<=10&&Math.abs(Math.min(m.length_mm,m.width_mm)-short)<=10:tokens.every(t=>(m.manufacturer+' '+m.model).toLowerCase().includes(t)));
 if(!dimensional&&process.env.DATABASE_URL){try{const sql=database();const rows=await sql`SELECT id, manufacturer, model, rated_watts, weight_lb, construction, source_url FROM pv_panel_models WHERE verified = true AND strpos(lower(manufacturer || ' ' || model),lower(${q})) > 0 ORDER BY manufacturer,model LIMIT 20`;if(rows.length)return Response.json({models:rows.map(m=>({...m,id:'db-'+m.id,length_mm:null,width_mm:null,dimension_source:'Verified database record; dimensions not provided',verified_weight_kg:m.weight_lb?Number(m.weight_lb)/2.2046226218:null,estimated_weight_kg:null})),source:'database',total:rows.length},{headers})}catch{/* The source-labelled uploaded reference remains available. */}}
 const pricing=await activePricing(pricingMarket(params.get("market"))).catch(()=>null);
 const factors=panelAreaWeightFactors(pricing?.rules);
 return Response.json({models:matches.slice(0,30).map(m=>{const weight=panelWeight(m.length_mm,m.width_mm,m.construction,m.verified_weight_kg,factors);return {...m,estimated_weight_kg:weight?.estimated?weight.kg:null,weight_method:weight?.estimated?`${weight.area} m² × ${weight.factor} kg/m²`:m.weight_method}}),total:matches.length,source:'uploaded-reference',tolerance_mm:dimensional?10:undefined},{headers});
}
