import React from "react";
import { base44 } from "@/api/base44Client";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function DeactivateAccessDialog({ open, onOpenChange, user, client, onDone }) {
  const deactivate = async () => {
    if (client) {
      await base44.entities.Client.update(client.id, { portal_user_id: "", portal_access_enabled: false });
    }
    await base44.entities.AuditLog.create({
      entity_type: "User",
      entity_id: user?.id,
      action: "deactivate_access",
      summary: `Acceso al portal desactivado para ${user?.email}${client ? ` — desvinculado de ${client.legal_name}` : ""}.`,
    });
    onDone("Acceso desactivado");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Desactivar acceso al portal</AlertDialogTitle>
          <AlertDialogDescription>
            {client
              ? `La cuenta de ${user?.email} se desvinculará del cliente ${client.legal_name} y su acceso al portal quedará bloqueado. La cuenta y todo el historial se conservan.`
              : "Esta cuenta no tiene ningún cliente vinculado; se registrará la desactivación."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={deactivate}>Desactivar acceso</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}