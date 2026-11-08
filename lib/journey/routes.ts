export const journeyRoutes = [
  { route: '/', file: 'app/page.tsx', title: 'Choose a task' },
  { route: '/replus', file: 'app/replus/page.tsx', title: 'RE+ entry' },
  { route: '/services/solar-panel-recycling', file: 'app/services/solar-panel-recycling/page.tsx', title: 'Solar panel recycling' },
  { route: '/equipment/pv-circulator', file: 'app/equipment/pv-circulator/page.tsx', title: 'PV Circulator' },
  { route: '/equipment/jbtool', file: 'app/equipment/jbtool/page.tsx', title: 'JB Tool' },
  { route: '/evidence', file: 'app/evidence/page.tsx', title: 'Evidence' },
] as const;
