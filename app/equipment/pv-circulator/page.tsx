import { Shell } from '../../components/marketing';
import { EquipmentFlow } from '../../components/equipment-flow';
import '../../components/journey.css';

export const metadata = { title: 'PV Circulator | PV Circonomy', description: 'Configure a PV Circulator equipment request. Prices are quoted after review.' };

export default function CirculatorPage() {
  return <Shell><article className="pc-journey"><header className="pc-journey-hero pc-wrap"><p className="pc-eyebrow">TSGC · PV CIRCULATOR</p><h1>Configure my equipment request</h1><p className="pc-lead">PV Circulator is built for automated physical dismantling and material separation. Tell us the configuration name you want to discuss and the needs of your site.</p></header><div className="pc-wrap"><EquipmentFlow product="pv-circulator" /></div></article></Shell>;
}
