import React from "react";
import { base44 } from "@/api/base44Client";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function DeactivateAccessDialog({ open, onOpenChange, user, client, onDone }) {
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
    onDone("Acceso desactivado");
  };

  const demoteOnly = async () => {
    await base44.entities.User.update(user.id, { role: "user" });
    await base44.entities.AuditLog.create({
      entity_type: "User", entity_id: user.id, action: "deactivate_access",
      summary: `Acceso de equipo desactivado para ${user.email} (rol cambiado a Cliente).`,
    });
    onDone("Acceso de equipo desactivado");
  };

  const fullLockdown = async () => {
    await base44.entities.User.update(user.id, { role: "user" });
    await unlinkClient();
    await base44.entities.AuditLog.create({
      entity_type: "User", entity_id: user.id, action: "deactivate_access",
      summary: `Bloqueo total para ${user.email}: rol cambiado a Cliente${client ? ` y portal de ${client.legal_name} desvinculado y bloqueado` : ""}.`,
    });
    onDone("Cuenta bloqueada por completo");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isAdmin ? "Desactivar cuenta de equipo" : "Desactivar acceso al portal"}</AlertDialogTitle>
          <AlertDialogDescription>
            {isAdmin
              ? `${user.email} dejará de tener acceso al área de equipo. La cuenta y todo el historial se conservan.`
              : client
                ? `La cuenta de ${user.email} se desvinculará del cliente ${client.legal_name} y su acceso al portal quedará bloqueado. La cuenta y todo el historial se conservan.`
                : "Esta cuenta no tiene ningún cliente vinculado; se registrará la desactivación."}
            {isAdmin && client && " El bloqueo total también desvinculará el cliente y bloqueará su portal."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          {isAdmin ? (
            <>
              <AlertDialogAction className="mt-2 sm:mt-0" onClick={demoteOnly}>Solo quitar acceso de equipo</AlertDialogAction>
              <AlertDialogAction className="mt-2 sm:mt-0 bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={fullLockdown}>Bloqueo total</AlertDialogAction>
            </>
          ) : (
            <AlertDialogAction onClick={deactivateClientRole}>Desactivar acceso</AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}