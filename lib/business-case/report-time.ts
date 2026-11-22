/** Browser time zones are user-supplied. Invalid or omitted zones use explicit UTC. */
export function resolveReportTimeZone(value: unknown): string {
  if(typeof value !== 'string' || value.length > 100) return 'UTC';
  try {return new Intl.DateTimeFormat('en-US',{timeZone:value}).resolvedOptions().timeZone;}
  catch {return 'UTC';}
}

export function reportDate(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US',{
    timeZone:resolveReportTimeZone(timeZone),year:'numeric',month:'2-digit',day:'2-digit',
  }).formatToParts(date);
  const value=(type:string)=>parts.find(p=>p.type===type)!.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}
