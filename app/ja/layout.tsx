import { Noto_Sans_JP } from "next/font/google";
import type { ReactNode } from "react";

const noto = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "800"],
  display: "swap",
  variable: "--solution-chart-font",
});

export default function JapaneseLayout({ children }: { children: ReactNode }) {
  return <div className={`${noto.className} ${noto.variable}`} lang="ja">{children}</div>;
}
