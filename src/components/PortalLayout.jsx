import React, { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { me as authMe, logout as signOut } from "@/api/auth";
import { Scale, Home, FileText, MessageCircle, UserRound, LogOut, Lock, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { cn } from "@/lib/utils";

export default function PortalLayout() {
  const { t } = useI18n();
  const [state, setState] = useState("loading");

  useEffect(() => {
    const check = async () => {
      try {
        const me = await authMe();
        const clients = await base44.entities.Client.filter({ portal_user_id: me.id });
        const client = clients[0];
        setState(client && client.portal_access_enabled === false ? "locked" : "ok");
      } catch {
        setState("ok");
      }
    };
    check();
  }, []);

  const brand = (
    <div className="flex items-center gap-2 min-w-0">
      <Scale className="w-6 h-6 text-primary shrink-0" />
      <div className="min-w-0">
        <p className="font-heading font-bold leading-none">Legal Lex</p>
        <p className="text-[11px] text-muted-foreground truncate hidden sm:block">{t("hero_sub").split(".")[0]}</p>
      </div>
    </div>
  );

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (state === "locked") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            {brand}
            <div className="flex items-center gap-2 shrink-0">
              <LanguageSwitcher />
              <button onClick={async () => { await signOut(); window.location.href = "/login"; }} title={t("logout")}
                className="p-2.5 rounded-lg hover:bg-secondary text-muted-foreground">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 w-full max-w-md mx-auto px-4 py-16">
          <div className="card-soft p-8 text-center">
            <Lock className="w-10 h-10 text-primary mx-auto" />
            <h1 className="font-heading text-2xl font-bold mt-4">{t("portal_locked_title")}</h1>
            <p className="text-sm text-muted-foreground mt-2">{t("portal_locked_body")}</p>
          </div>
        </main>
        <footer className="border-t py-4 text-center text-xs text-muted-foreground">Legal Lex · Bilbao</footer>
      </div>
    );
  }

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
          {brand}
          <div className="flex items-center gap-2 shrink-0">
            <LanguageSwitcher />
            <button onClick={async () => { await signOut(); window.location.href = "/login"; }} title={t("logout")}
              className="p-2.5 rounded-lg hover:bg-secondary text-muted-foreground">
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
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">Legal Lex · Bilbao</footer>
    </div>
  );
}
