import { Shell } from '../../components/marketing';
import { EquipmentFlow } from '../../components/equipment-flow';
import '../../components/journey.css';

export const metadata = { title: 'JB Tool | PV Circonomy', description: 'Prepare a JB Tool equipment request. Specifications are quoted after review.' };

export default function JbToolPage() {
  return <Shell><article className="pc-journey"><header className="pc-journey-hero pc-wrap"><p className="pc-eyebrow">TSGC · JB TOOL</p><h1>Request JB Tool</h1><p className="pc-lead">JB Tool is its own equipment request. This page does not list functions or specifications. Describe what you need reviewed.</p></header><div className="pc-wrap"><EquipmentFlow product="jb-tool" /></div></article></Shell>;
}
