import type {ReactNode} from 'react';
const links=[['system','系統管理'],['pricing','價格管理'],['delivery','運輸管理'],['quotations','報價管理'],['orders','訂單管理']] as const;
export function AdminNavigation({active,action}:{active:'system'|'pricing'|'delivery'|'quotations'|'orders';action?:ReactNode}){return <header className="pa-header"><a href="/">PV Circonomy</a><nav aria-label="後台導航">{links.map(([id,label])=><a key={id} href={'/admin/'+id+'/'} aria-current={active===id?'page':undefined}>{label}</a>)}</nav>{action}</header>}
