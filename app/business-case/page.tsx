import Calculator from "./calculator";
import {loadMasterData} from "../../lib/business-case/master-data";
import "./calculator.css";
export const dynamic="force-dynamic";
export default async function Page(){const data=await loadMasterData();return <div className="bc-calculator"><Calculator sourceLabel={data.source}/></div>;}
