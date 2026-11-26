import { NextResponse } from 'next/server';
import { loadJapanBusinessCase, loadMasterData } from '@/lib/business-case/master-data';
import { isSupportedCountry } from '@/lib/business-case/supported-countries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [d, japan] = await Promise.all([
      loadMasterData(),
      loadJapanBusinessCase().catch(error => {
        console.error('Japan calculator data unavailable:', error);
        return null;
      }),
    ]);
    const regions = [...d.regions.filter(region => region.countryCode !== 'JP'), ...(japan?.data.regions ?? [])]
      .filter((x) => x.active && isSupportedCountry(x.countryCode))
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const solutions = d.solutions
      .filter((x) => x.active)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    // The processing schedule uses country-level OPEX assumptions.
    // Include only the two schedule parameters in the public endpoint.
    // Current master-data.ts may expose SharePoint descriptions instead
    // of parameter codes, so support both until that mapping is corrected.
    const scheduleNames: Record<string, string> = {
      'OPERATING_DAYS_MONTH': 'OPERATING_DAYS_MONTH',
      'OPERATING_HOURS_DAY': 'OPERATING_HOURS_DAY',
      'OPERATING DAYS': 'OPERATING_DAYS_MONTH',
      'OPERATING HOURS': 'OPERATING_HOURS_DAY',
    };
    const opex = [...d.opex.filter(row => row.countryCode !== 'JP'), ...(japan?.data.opex ?? [])]
      .filter((row) => row.active && isSupportedCountry(row.countryCode))
      .map((row) => {
        const raw = String(row.parameter || '').trim().toUpperCase();
        const unprefixed = raw.replace(/^[A-Z]{2}-/, '');
        const parameter = scheduleNames[unprefixed];
        return parameter
          ? { countryCode: row.countryCode, parameter, value: row.value, active: true }
          : null;
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    return NextResponse.json({
      source: d.source,
      regions,
      solutions,
      opex,
      japan: japan && {
        source: japan.data.source,
        defaultPanels: japan.defaultPanels,
        solutions: japan.data.solutions,
      },
    });
  } catch (error: any) {
    console.error('Calculator data load failed:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Unable to load calculator data' },
      { status: 500 }
    );
  }
}
