import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Scale, LayoutDashboard, Users, FolderOpen, CheckSquare, CalendarDays, FileText, MessageCircle, Receipt, Inbox, LogOut, Menu, X, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { to: "/leads", label: "Consultas", icon: Inbox },
  { to: "/clients", label: "Clientes", icon: Users },
  { to: "/matters", label: "Expedientes", icon: FolderOpen },
  { to: "/tasks", label: "Tareas", icon: CheckSquare },
  { to: "/appointments", label: "Citas", icon: CalendarDays },
  { to: "/documents", label: "Documentos", icon: FileText },
  { to: "/messages", label: "Mensajes", icon: MessageCircle },
  { to: "/billing", label: "Facturación", icon: Receipt },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const logout = async () => {
    await base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <aside className={cn("fixed lg:sticky top-0 z-40 h-screen w-60 shrink-0 bg-[hsl(218_35%_22%)] text-stone-100 flex flex-col transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full lg:rtl:translate-x-0")}>
          <div className="flex items-center gap-2 px-5 py-5">
            <Scale className="w-6 h-6 text-amber-100/90" />
            <div>
              <p className="font-heading font-bold text-lg leading-none">Legal Lex</p>
              <p className="text-[11px] text-stone-300 mt-1">Extranjería · Bilbao</p>
            </div>
          </div>
          <nav className="flex-1 px-3 space-y-1 mt-2">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} onClick={() => setOpen(false)}
                className={({ isActive }) => cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive ? "bg-white/15 text-white font-medium" : "text-stone-300 hover:bg-white/10 hover:text-white")}>
                <Icon className="w-4 h-4 shrink-0" /> {label}
              </NavLink>
            ))}
            <p className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-widest text-stone-400">Área de cliente</p>
            <NavLink to="/portal" onClick={() => setOpen(false)}
              className={({ isActive }) => cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm border transition-colors",
                isActive
                  ? "bg-amber-400/25 text-amber-50 border-amber-200/40 font-medium"
                  : "text-amber-100/90 border-amber-200/30 bg-amber-400/10 hover:bg-amber-400/20 hover:text-amber-50")}>
              <UserRound className="w-4 h-4 shrink-0" /> Portal de cliente
            </NavLink>
          </nav>
          <button onClick={logout} className="flex items-center gap-3 px-4 py-4 text-sm text-stone-300 hover:text-white border-t border-white/10">
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </aside>
        {open && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}
        <main className="flex-1 min-w-0">
          <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b bg-card">
            <button onClick={() => setOpen(true)} aria-label="Abrir menú" className="p-2 -ms-2"><Menu className="w-6 h-6" /></button>
            <p className="font-heading font-bold">Legal Lex</p>
            <div className="w-6" />
          </div>
          <div className="p-4 md:p-8 max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}