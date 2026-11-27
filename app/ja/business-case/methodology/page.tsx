import type { Metadata } from 'next';
import { BusinessCaseMethodology } from '../../../business-case/methodology-content';
import '../../../business-case/calculator.css';


export const metadata: Metadata = {
  title: '事業収支の試算方法 | PV Circonomy',
  description: '太陽光パネルの処理能力、材料売却収入、運営費、EBITDA、投資回収期間の算出方法。',
  alternates: { languages: { 'en-US': '/business-case/methodology/', 'ja-JP': '/ja/business-case/methodology/' } },
};

export default async function MethodologyPage({ searchParams }: { searchParams: Promise<{ region?: string; market?: string; panelsPerMonth?: string }> }) {
  return <div lang="ja"><BusinessCaseMethodology locale="ja-JP" {...await searchParams} /></div>;
}
