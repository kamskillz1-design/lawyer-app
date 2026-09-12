import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { logout as signOut } from "@/api/auth";
import { Scale, LayoutDashboard, Users, FolderOpen, CheckSquare, CalendarDays, FileText, MessageCircle, Receipt, Inbox, LogOut, Menu, UserRound, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const NAV = [
  { to: "/dashboard", key: "nav_panel", icon: LayoutDashboard },
  { to: "/leads", key: "nav_leads", icon: Inbox },
  { to: "/clients", key: "nav_clients", icon: Users },
  { to: "/matters", key: "nav_matters", icon: FolderOpen },
  { to: "/tasks", key: "nav_tasks", icon: CheckSquare },
  { to: "/appointments", key: "nav_appointments", icon: CalendarDays },
  { to: "/documents", key: "nav_documents", icon: FileText },
  { to: "/messages", key: "nav_messages", icon: MessageCircle },
  { to: "/billing", key: "nav_billing", icon: Receipt },
  { to: "/users", key: "nav_users", icon: UserCog },
];

export default function Layout() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <aside className={cn("fixed lg:sticky top-0 z-40 h-screen w-60 shrink-0 bg-[hsl(218_35%_22%)] text-stone-100 flex flex-col transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full lg:rtl:translate-x-0")}>
          <div className="flex items-center gap-2 px-5 py-5">
            <Scale className="w-6 h-6 text-amber-100/90 shrink-0" />
            <div>
              <p className="font-heading font-bold text-lg leading-none">Legal Lex</p>
              <p className="text-[11px] text-stone-300 mt-1">Extranjería · Bilbao</p>
            </div>
          </div>
          <nav className="flex-1 min-h-0 overflow-y-auto px-3 space-y-1 mt-2">
            {NAV.map(({ to, key, icon: Icon }) => (
              <NavLink key={to} to={to} onClick={() => setOpen(false)}
                className={({ isActive }) => cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive ? "bg-white/15 text-white font-medium" : "text-stone-300 hover:bg-white/10 hover:text-white")}>
                <Icon className="w-4 h-4 shrink-0" /> {t(key)}
              </NavLink>
            ))}
            <p className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-widest text-stone-400">{t("nav_client_area")}</p>
            <NavLink to="/portal" onClick={() => setOpen(false)}
              className={({ isActive }) => cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm border transition-colors",
                isActive
                  ? "bg-amber-400/25 text-amber-50 border-amber-200/40 font-medium"
                  : "text-amber-100/90 border-amber-200/30 bg-amber-400/10 hover:bg-amber-400/20 hover:text-amber-50")}>
              <UserRound className="w-4 h-4 shrink-0" /> {t("nav_portal")}
            </NavLink>
          </nav>
          <button onClick={logout} className="flex items-center gap-3 px-4 py-4 text-sm text-stone-300 hover:text-white border-t border-white/10">
            <LogOut className="w-4 h-4" /> {t("logout")}
          </button>
        </aside>
        {open && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
            <button onClick={() => setOpen(true)} aria-label={t("open_menu")} className="p-2 -ms-2 lg:hidden"><Menu className="w-6 h-6" /></button>
            <p className="font-heading font-bold hidden sm:block">Legal Lex</p>
            <p className="font-heading font-bold sm:hidden">Legal&nbsp;Lex</p>
            <LanguageSwitcher />
          </div>
          <div className="p-4 md:p-8 max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
