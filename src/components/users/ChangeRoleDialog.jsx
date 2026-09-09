import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { inputClass as input } from "@/lib/formStyles";

export default function ChangeRoleDialog({ open, onOpenChange, user, onDone }) {
  const { t } = useI18n();
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
      onOpenChange(false); onDone(t("toast_role_updated"));
    } catch (e) {
      setError(e?.message || t("role_error_default"));
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("change_role_title")}</DialogTitle>
          <DialogDescription>
            {t("change_role_desc")} <span className="font-medium text-foreground break-words">{name}</span>.
            {t("change_role_effect")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <select className={input} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="user">{t("opt_client_portal")}</option>
            <option value="admin">{t("opt_team_admin")}</option>
          </select>
          {error && <p className="text-sm text-red-600 break-words">{error}</p>}
          <Button className="rounded-xl" onClick={submit} disabled={busy || role === user.role}>
            {busy ? t("saving") : t("confirm_change")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}