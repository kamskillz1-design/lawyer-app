import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { inputClass as input } from "@/lib/formStyles";

export default function LinkClientDialog({ open, onOpenChange, user, clients, currentClientId, onDone }) {
  const { t } = useI18n();
  const [clientId, setClientId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) { setClientId(currentClientId || ""); setError(""); }
  }, [open, currentClientId]);

  if (!user) return null;

  const submit = async () => {
    setBusy(true); setError("");
    try {
      await base44.entities.Client.updateMany(
        { portal_user_id: user.id },
        { $unset: { portal_user_id: "" } }
      );
      if (clientId) {
        await base44.entities.Client.update(clientId, { portal_user_id: user.id, portal_email: user.email });
      }
      onOpenChange(false); onDone(clientId ? t("toast_linked") : t("toast_unlinked"));
    } catch (e) {
      setError(e?.message || t("link_error_default"));
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("link_client_title")}</DialogTitle>
          <DialogDescription>
            {t("account_prefix")} <span className="font-medium text-foreground break-words">{user.email}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <select className={input} value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">{t("unlink_option")}</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.legal_name}</option>)}
          </select>
          {error && <p className="text-sm text-red-600 break-words">{error}</p>}
          <Button className="rounded-xl" onClick={submit} disabled={busy}>
            {busy ? t("saving") : t("save_link")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}