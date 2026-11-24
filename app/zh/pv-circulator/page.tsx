import { zhCopy } from "../../components/pv-circulator-copy";
import { CirculatorContent } from "../../pv-circulator/content";

export const dynamic = "force-dynamic";
export const metadata = { title: zhCopy.title, description: zhCopy.description };

export default function Page() {
  return <CirculatorContent zh />;
}
