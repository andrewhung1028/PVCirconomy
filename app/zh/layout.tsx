import { Noto_Sans_TC } from "next/font/google";
import type { ReactNode } from "react";

const noto = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "800"],
  display: "swap",
  variable: "--solution-chart-font",
});

export default function TraditionalChineseLayout({ children }: { children: ReactNode }) {
  return <div className={`${noto.className} ${noto.variable}`} lang="zh-TW">{children}</div>;
}
