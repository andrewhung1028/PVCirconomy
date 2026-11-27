import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { BusinessCaseMethodology } from '../methodology-content';
import '../calculator.css';

const manrope = localFont({ src: '../../../public/fonts/Manrope-Variable.ttf', weight: '300 800', display: 'swap' });

export const metadata: Metadata = {
  title: 'Calculation Methodology | PV Circonomy Business Case Calculator',
  description: 'How the PV recycling business case estimates processing capacity, material revenue, operating expenses, EBITDA, and simple payback.',
  alternates: { languages: { 'en-US': '/business-case/methodology/', 'ja-JP': '/ja/business-case/methodology/' } },
};

export default async function MethodologyPage({ searchParams }: { searchParams: Promise<{ region?: string; market?: string; panelsPerMonth?: string }> }) {
  return <div className={manrope.className}><BusinessCaseMethodology {...await searchParams} /></div>;
}
