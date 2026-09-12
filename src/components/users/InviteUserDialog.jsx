import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { inviteUser } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { inputClass as input } from "@/lib/formStyles";

export default function InviteUserDialog({ open, onOpenChange, clients, onDone }) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [clientId, setClientId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reset = () => { setEmail(""); setRole("user"); setClientId(""); setError(""); };

  const submit = async () => {
    setBusy(true); setError("");
    try {
      await inviteUser(email.trim(), role);
      if (role === "user" && clientId) {
        await base44.entities.Client.update(clientId, { portal_email: email.trim() });
      }
      onOpenChange(false); reset(); onDone(t("toast_invite_sent"));
    } catch (e) {
      setError(e?.message || t("invite_error_default"));
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("invite_user_title")}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <select className={input} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="user">{t("opt_client_portal")}</option>
            <option value="admin">{t("opt_team_admin")}</option>
          </select>
          <input className={input} type="email" placeholder={t("ph_email")} value={email} onChange={(e) => setEmail(e.target.value)} />
          {role === "user" && (
            <select className={input} value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">{t("link_later")}</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.legal_name}</option>)}
            </select>
          )}
          {error && <p className="text-sm text-red-600 break-words">{error}</p>}
          <Button className="rounded-xl" onClick={submit} disabled={busy || !email.trim()}>
            {busy ? t("sending") : t("send_invite")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
