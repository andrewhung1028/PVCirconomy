"use client";
import {useEffect,useState} from "react";
import type {ReactNode} from 'react';
const links=[['system','系統管理'],['pricing','價格管理'],['delivery','運輸管理'],['quotations','報價管理'],['orders','訂單管理']] as const;
export function AdminNavigation({active,action}:{active:'system'|'pricing'|'delivery'|'quotations'|'orders';action?:ReactNode}){const [admin,setAdmin]=useState(false);useEffect(()=>{fetch("/api/auth/session/").then(r=>r.json()).then(s=>setAdmin(s.user?.adminRole==="admin")).catch(()=>{});},[]);return <header className="pa-header"><a href="/">PV Circonomy</a><nav aria-label="後台導航">{links.filter(([id])=>admin||['orders','quotations'].includes(id)).map(([id,label])=><a key={id} href={'/admin/'+id+'/'} aria-current={active===id?'page':undefined}>{label}</a>)}</nav>{action}</header>}
