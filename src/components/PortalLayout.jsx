import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Scale, Home, FileText, MessageCircle, UserRound, LogOut } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { cn } from "@/lib/utils";

export default function PortalLayout() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const tabs = [
    { to: "/portal", label: t("nav_home"), icon: Home, end: true },
    { to: "/portal/documents", label: t("nav_documents"), icon: FileText },
    { to: "/portal/messages", label: t("nav_messages"), icon: MessageCircle },
    { to: "/portal/profile", label: t("nav_profile"), icon: UserRound },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-primary" />
            <div>
              <p className="font-heading font-bold leading-none">LexPath</p>
              <p className="text-[11px] text-muted-foreground">{t("hero_sub").split(".")[0]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button onClick={() => base44.auth.logout()} title={t("logout")}
              className="p-2 rounded-lg hover:bg-secondary text-muted-foreground">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        <nav className="max-w-5xl mx-auto px-4 pb-2 flex gap-1 overflow-x-auto">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => cn("flex items-center gap-2 px-3 py-2 rounded-full text-sm whitespace-nowrap transition-colors",
                isActive ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-secondary")}>
              <Icon className="w-4 h-4" /> {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">LexPath · Bilbao</footer>
    </div>
  );
}