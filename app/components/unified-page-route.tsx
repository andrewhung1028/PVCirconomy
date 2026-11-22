import localFont from "next/font/local";
import { UnifiedPublicPage, type UnifiedPublicPageProps } from "./unified-public-page";

const manrope = localFont({
  src: "../../public/fonts/Manrope-Variable.ttf",
  weight: "300 800",
  display: "swap",
});

export function UnifiedPageRoute(props: UnifiedPublicPageProps) {
  return <div className={manrope.className}><UnifiedPublicPage {...props} /></div>;
}
