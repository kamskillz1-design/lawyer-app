import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, Archive, HardDriveDownload } from "lucide-react";

export default function ClientListCards({ clients, muted = false, onArchive, onExport }) {
  const showActions = !muted || !!onExport;
  const portal = (c) =>
    c.status === "archived" ? "archivado" : c.portal_user_id ? "✓ activo" : "—";

  return (
    <div className="md:hidden space-y-2">
      {clients.map((c) => (
        <div key={c.id} className={`card-soft p-4 space-y-1 ${muted ? "opacity-60" : ""}`}>
          <Link to={`/clients/${c.id}`} className="font-medium hover:text-primary break-words">{c.legal_name}</Link>
          <p className="text-xs text-muted-foreground break-words">NIE: {c.nie_number || "—"} · {c.phone || "—"} · {c.email || "—"}</p>
          {c.legacy_dropbox_path && <p className="text-xs text-muted-foreground break-all">Archivo Dropbox: {c.legacy_dropbox_path}</p>}
          <p className="text-xs text-muted-foreground break-words">{c.written_language || "es"} / {c.spoken_language || "—"}{c.interpreter_required ? " · intérprete" : ""}</p>
          <p className="text-xs text-muted-foreground break-words">{c.engagement_status || "—"}{c.service_package ? ` · ${c.service_package}` : ""} · Portal: {portal(c)}</p>
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-lg h-11 w-11" aria-label="Acciones">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="h-11" asChild>
                  <Link to={`/clients/${c.id}`}><Eye className="w-4 h-4" /> Ver detalle</Link>
                </DropdownMenuItem>
                {onArchive && (
                  <DropdownMenuItem className="h-11 text-destructive focus:text-destructive" onClick={() => onArchive(c)}>
                    <Archive className="w-4 h-4" /> Archivar
                  </DropdownMenuItem>
                )}
                {onExport && c.status === "archived" && (
                  <DropdownMenuItem className="h-11" onClick={() => onExport(c)}>
                    <HardDriveDownload className="w-4 h-4" /> Exportar al archivo
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ))}
      {!clients.length && <p className="text-sm text-muted-foreground p-4">Sin resultados.</p>}
    </div>
  );
}