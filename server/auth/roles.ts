export type StaffRole = 'admin' | 'viewer' | 'denied';
const roles: Record<string, StaffRole> = {
  'andrew@tsgc.com.tw': 'admin',
  'terry.ko@pvcirconomy.com': 'viewer',
  'emily.cheng@tsgc.com.tw': 'viewer',
  'emily.cheng@pvcirconomy.com': 'viewer',
};
export function staffRole(email: string): StaffRole { return roles[email.toLowerCase()] ?? 'denied'; }
export function canAccess(email: string, resource: string, method = 'GET') {
  const role = staffRole(email);
  return role === 'admin' || (role === 'viewer' && method === 'GET' && ['orders', 'quotations'].includes(resource));
}
