import React from "react";
import { base44 } from "@/api/base44Client";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function ArchiveClientDialog({ open, onOpenChange, client, onDone }) {
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
    onDone("Cliente archivado");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archivar cliente</AlertDialogTitle>
          <AlertDialogDescription>
            {client?.legal_name} pasará a estado archivado. Nada se borra: expedientes, documentos,
            facturas y comunicaciones se conservan. El acceso al portal se desactivará y podrá
            reactivarlo en cualquier momento.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={archive}>Archivar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}