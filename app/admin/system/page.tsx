import { BusinessCaseAdmin } from "../../components/business-case-admin";
import localFont from "next/font/local";
import { EconomicsAdmin } from "../../components/economics-admin";

const font = localFont({ src: "../../../public/fonts/Manrope-Variable.ttf", weight: "300 800", display: "swap" });
export const metadata = { title: "系統管理 | PV Circonomy", robots: { index: false, follow: false } };
export default function Page() { return <div className={font.className}><EconomicsAdmin /><BusinessCaseAdmin /></div>; }
