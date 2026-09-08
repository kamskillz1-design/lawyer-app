import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { inputClass as input } from "@/lib/formStyles";

export default function ChangeRoleDialog({ open, onOpenChange, user, onDone }) {
  const [role, setRole] = useState("user");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) { setRole(user.role === "admin" ? "admin" : "user"); setError(""); }
  }, [user, open]);

  if (!user) return null;
  const name = user.full_name || user.email;

  const submit = async () => {
    setBusy(true); setError("");
    try {
      await base44.entities.User.update(user.id, { role });
      onOpenChange(false); onDone("Rol actualizado");
    } catch (e) {
      setError(e?.message || "No se pudo cambiar el rol.");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar rol</DialogTitle>
          <DialogDescription>
            Va a cambiar el rol de <span className="font-medium text-foreground break-words">{name}</span>.
            El cambio surtirá efecto en su próxima visita.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <select className={input} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="user">Cliente (portal)</option>
            <option value="admin">Equipo (admin)</option>
          </select>
          {error && <p className="text-sm text-red-600 break-words">{error}</p>}
          <Button className="rounded-xl" onClick={submit} disabled={busy || role === user.role}>
            {busy ? "Guardando…" : "Confirmar cambio"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}