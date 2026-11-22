// Public display names for Business Case solution codes. Internal codes and master-data names are unchanged.
const labels: Record<string, string> = { CONVENTIONAL: 'Shredding', HOT_KNIFE: 'Hot knife', PVCIRCULATOR: 'PV Circulator' };
export function solutionLabel(code?: string, name?: string) { return (code && labels[code]) || name || code || ''; }
