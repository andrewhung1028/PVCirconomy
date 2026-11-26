"use client";
import { useEffect, useState } from "react";

const links = [
  ["system", "系統管理"], ["pricing", "價格管理"], ["delivery", "運輸管理"],
  ["inquiries", "詢價管理"], ["quotations", "報價管理"], ["orders", "訂單管理"],
] as const;
type Staff = { email: string; adminRole: string };

export function AdminNavigation({ active, onLogout }: {
  active: (typeof links)[number][0];
  onLogout?: () => void;
}) {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  useEffect(() => {
    fetch("/api/auth/session/", { cache: "no-store" })
      .then(response => response.json())
      .then(session => { if (session.user?.role === "staff") setStaff(session.user); })
      .catch(() => {});
  }, []);

  async function logout() {
    setLoggingOut(true);
    setLogoutError(false);
    try {
      const response = await fetch("/api/auth/logout/", { method: "POST" });
      if (!response.ok) throw Error("logout_failed");
      setStaff(null);
      if (onLogout) onLogout();
      else location.replace("/");
    } catch {
      setLogoutError(true);
    } finally {
      setLoggingOut(false);
    }
  }

  return <header className="pa-header">
    <a href="/">PV Circonomy</a>
    <nav aria-label="後台導航">
      {links.filter(([id]) => staff?.adminRole === "admin" || id === "orders" || id === "quotations")
        .map(([id, label]) => <a key={id} href={`/admin/${id}/`} aria-current={active === id ? "page" : undefined}>{label}</a>)}
    </nav>
    {staff && <div className="pa-header-session">
      <span>{staff.email}</span>
      <button type="button" disabled={loggingOut} onClick={logout}>登出</button>
      {logoutError && <span role="alert">登出失敗，請重試。</span>}
    </div>}
  </header>;
}
