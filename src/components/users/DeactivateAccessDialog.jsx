import React from "react";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function DeactivateAccessDialog({ open, onOpenChange, user, client, onDone }) {
  const { t } = useI18n();
  if (!user) return null;
  const isAdmin = user.role === "admin";

  const unlinkClient = async () => {
    if (client) {
      await base44.entities.Client.update(client.id, { portal_user_id: "", portal_access_enabled: false });
    }
  };

  const deactivateClientRole = async () => {
    await unlinkClient();
    await base44.entities.AuditLog.create({
      entity_type: "User", entity_id: user.id, action: "deactivate_access",
      summary: `Acceso al portal desactivado para ${user.email}${client ? ` — desvinculado de ${client.legal_name}` : ""}.`,
    });
    onDone(t("toast_access_deactivated"));
  };

  const demoteOnly = async () => {
    await base44.entities.User.update(user.id, { role: "user" });
    await base44.entities.AuditLog.create({
      entity_type: "User", entity_id: user.id, action: "deactivate_access",
      summary: `Acceso de equipo desactivado para ${user.email} (rol cambiado a Cliente).`,
    });
    onDone(t("toast_team_deactivated"));
  };

  const fullLockdown = async () => {
    await base44.entities.User.update(user.id, { role: "user" });
    await unlinkClient();
    await base44.entities.AuditLog.create({
      entity_type: "User", entity_id: user.id, action: "deactivate_access",
      summary: `Bloqueo total para ${user.email}: rol cambiado a Cliente${client ? ` y portal de ${client.legal_name} desvinculado y bloqueado` : ""}.`,
    });
    onDone(t("toast_full_lockdown"));
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isAdmin ? t("deactivate_team_title") : t("deactivate_portal_title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {isAdmin
              ? <>{user.email} {t("deact_admin_body")}</>
              : client
                ? <>{t("deact_client_body_a")} {user.email} {t("deact_client_body_b")} {client.legal_name} {t("deact_client_body_c")}</>
                : t("deact_none_body")}
            {isAdmin && client && ` ${t("deact_admin_extra")}`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          {isAdmin ? (
            <>
              <AlertDialogAction className="mt-2 sm:mt-0" onClick={demoteOnly}>{t("remove_team_only")}</AlertDialogAction>
              <AlertDialogAction className="mt-2 sm:mt-0 bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={fullLockdown}>{t("full_lockdown")}</AlertDialogAction>
            </>
          ) : (
            <AlertDialogAction onClick={deactivateClientRole}>{t("deactivate_access")}</AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}