// Receiving sites are independent of customer pickup cities. Add confirmed sites here.
export const dropoffLocations = [
  { id: 'menifee-ca', city: 'Menifee', state: 'CA', zip: '92584', label: 'Menifee, CA 92584' },
] as const;
export function dropoffLocation(id?: string | null) {
  return dropoffLocations.find(location => location.id === id) ?? dropoffLocations[0];
}
