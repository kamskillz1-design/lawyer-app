import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus, Search, ShieldCheck, Link2, UserX } from "lucide-react";
import InviteUserDialog from "@/components/users/InviteUserDialog";
import ChangeRoleDialog from "@/components/users/ChangeRoleDialog";
import LinkClientDialog from "@/components/users/LinkClientDialog";
import DeactivateAccessDialog from "@/components/users/DeactivateAccessDialog";

const RoleBadge = ({ role }) => (
  <Badge variant="outline" className={role === "admin"
    ? "bg-sky-50 text-sky-800 border-sky-200"
    : "bg-stone-100 text-stone-700 border-stone-200"}>
    {role === "admin" ? "Equipo" : "Cliente"}
  </Badge>
);

export default function Users() {
  const { toast } = useToast();
  const [me, setMe] = useState(undefined);
  const [users, setUsers] = useState(null);
  const [usersError, setUsersError] = useState(false);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState(null);
  const [linkTarget, setLinkTarget] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  const reload = async () => {
    try {
      setUsersError(false);
      const [us, cs] = await Promise.all([base44.entities.User.list(), base44.entities.Client.list()]);
      setUsers(us);
      setClients(cs);
    } catch {
      setUsersError(true);
    }
  };

  useEffect(() => {
    base44.auth.me().then((u) => setMe(u)).catch(() => setMe(null));
    reload();
  }, []);

  if (me === undefined) return <p className="text-muted-foreground">Cargando…</p>;
  if (!me || me.role !== "admin") return <Navigate to="/portal" replace />;
  if (usersError) return (
    <div className="card-soft p-6 space-y-3">
      <p className="text-sm text-muted-foreground">No se pudo cargar la lista de usuarios.</p>
      <Button size="sm" variant="outline" className="rounded-lg" onClick={reload}>
        Reintentar
      </Button>
    </div>
  );
  if (users === null) return <p className="text-muted-foreground">Cargando…</p>;

  const linkedClient = (u) => clients.find((c) => c.portal_user_id === u.id);
  const q = search.trim().toLowerCase();
  const filtered = users.filter((u) => !q
    || (u.full_name || "").toLowerCase().includes(q)
    || (u.email || "").toLowerCase().includes(q));

  const onDone = (msg) => { reload(); toast({ title: msg }); };
  const actions = (u) => (
    <div className="flex flex-wrap gap-1">
      <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setRoleTarget(u)}>
        <ShieldCheck className="w-3.5 h-3.5 me-1" /> Rol
      </Button>
      {u.role !== "admin" && (
        <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setLinkTarget(u)}>
          <Link2 className="w-3.5 h-3.5 me-1" /> Vincular
        </Button>
      )}
      {u.id !== me.id && (
        <Button size="sm" variant="outline" className="rounded-lg text-destructive hover:text-destructive" onClick={() => setDeactivateTarget(u)}>
          <UserX className="w-3.5 h-3.5 me-1" /> Desactivar
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold">Usuarios</h1>
        <Button className="rounded-xl" onClick={() => setInviteOpen(true)}>
          <UserPlus className="w-4 h-4 me-1" /> Invitar
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input className="w-full h-10 ps-9 rounded-xl border border-input bg-card px-3 text-sm"
          placeholder="Buscar por nombre o email" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card-soft hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-start text-xs text-muted-foreground border-b">
              <th className="p-3 text-start">Usuario</th><th className="p-3 text-start">Rol</th>
              <th className="p-3 text-start">Cliente vinculado</th><th className="p-3 text-start">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const c = linkedClient(u);
              return (
                <tr key={u.id} className="border-b last:border-0 hover:bg-secondary/50">
                  <td className="p-3">
                    <p className="font-medium break-words">{u.full_name || "(sin nombre)"}</p>
                    <p className="text-xs text-muted-foreground break-words">{u.email}</p>
                  </td>
                  <td className="p-3"><RoleBadge role={u.role} /></td>
                  <td className="p-3">
                    {c
                      ? <Link to={`/clients/${c.id}`} className="text-primary hover:underline break-words">{c.legal_name}</Link>
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="p-3">{actions(u)}</td>
                </tr>
              );
            })}
            {!filtered.length && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Sin usuarios.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-2">
        {filtered.map((u) => {
          const c = linkedClient(u);
          return (
            <div key={u.id} className="card-soft p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium break-words">{u.full_name || "(sin nombre)"}</p>
                <RoleBadge role={u.role} />
              </div>
              <p className="text-xs text-muted-foreground break-words">{u.email}</p>
              <p className="text-xs">
                {c
                  ? <Link to={`/clients/${c.id}`} className="text-primary hover:underline break-words">{c.legal_name}</Link>
                  : <span className="text-muted-foreground">Sin cliente vinculado</span>}
              </p>
              {actions(u)}
            </div>
          );
        })}
        {!filtered.length && <p className="text-sm text-muted-foreground p-4">Sin usuarios.</p>}
      </div>

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} clients={clients} onDone={onDone} />
      <ChangeRoleDialog open={!!roleTarget} onOpenChange={(v) => !v && setRoleTarget(null)} user={roleTarget} onDone={onDone} />
      <LinkClientDialog open={!!linkTarget} onOpenChange={(v) => !v && setLinkTarget(null)} user={linkTarget}
        clients={clients} currentClientId={linkTarget ? (linkedClient(linkTarget) || {}).id : ""}
        onDone={onDone} />
      <DeactivateAccessDialog open={!!deactivateTarget} onOpenChange={(v) => !v && setDeactivateTarget(null)}
        user={deactivateTarget} client={deactivateTarget ? linkedClient(deactivateTarget) : null} onDone={onDone} />
    </div>
  );
}