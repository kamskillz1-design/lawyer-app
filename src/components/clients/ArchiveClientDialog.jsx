import React from "react";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function ArchiveClientDialog({ open, onOpenChange, client, onDone }) {
  const { t } = useI18n();
  const archive = async () => {
    await base44.entities.Client.update(client.id, {
      status: "archived",
      engagement_status: "archived",
      portal_access_enabled: false,
    });
    await base44.entities.AuditLog.create({
      entity_type: "Client",
      entity_id: client.id,
      action: "archive",
      summary: `Cliente archivado: ${client.legal_name}. Acceso al portal desactivado.`,
    });
    onDone(t("toast_client_archived"));
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("archive_client_title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {client?.legal_name} {t("archive_client_body")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={archive}>{t("archive")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}