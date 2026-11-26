import { UnifiedPublicPage, type UnifiedPublicPageProps } from "./unified-public-page";


export function UnifiedPageRoute(props: UnifiedPublicPageProps) {
  const japanese = props.locale === "ja-JP";
  const chinese = props.locale === "zh-TW";
  return <div className={chinese ? "pv-traditional-chinese" : undefined} lang={japanese ? "ja" : chinese ? "zh-TW" : undefined}><UnifiedPublicPage {...props} /></div>;
}
