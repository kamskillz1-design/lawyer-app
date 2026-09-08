import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const input = "w-full h-9 rounded-md border border-input bg-card px-3 text-sm";

export default function InviteUserDialog({ open, onOpenChange, clients, onDone }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [clientId, setClientId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reset = () => { setEmail(""); setRole("user"); setClientId(""); setError(""); };

  const submit = async () => {
    setBusy(true); setError("");
    try {
      await base44.users.inviteUser(email.trim(), role);
      if (role === "user" && clientId) {
        await base44.entities.Client.update(clientId, { portal_email: email.trim() });
      }
      onOpenChange(false); reset(); onDone("Invitación enviada");
    } catch (e) {
      setError(e?.message || "No se pudo enviar la invitación.");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Invitar usuario</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <select className={input} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="user">Cliente (portal)</option>
            <option value="admin">Equipo (admin)</option>
          </select>
          <input className={input} type="email" placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)} />
          {role === "user" && (
            <select className={input} value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Vincular cliente más tarde</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.legal_name}</option>)}
            </select>
          )}
          {error && <p className="text-sm text-red-600 break-words">{error}</p>}
          <Button className="rounded-xl" onClick={submit} disabled={busy || !email.trim()}>
            {busy ? "Enviando…" : "Enviar invitación"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}