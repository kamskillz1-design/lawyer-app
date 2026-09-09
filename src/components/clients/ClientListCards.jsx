import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, Archive, HardDriveDownload } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function ClientListCards({ clients, muted = false, onArchive, onExport }) {
  const { t } = useI18n();
  const showActions = !muted || !!onExport;
  const portal = (c) =>
    c.status === "archived" ? t("portal_state_archived") : c.portal_user_id ? t("portal_state_active") : "—";

  return (
    <div className="md:hidden space-y-2">
      {clients.map((c) => (
        <div key={c.id} className={`card-soft p-4 space-y-1 ${muted ? "opacity-60" : ""}`}>
          <Link to={`/clients/${c.id}`} className="font-medium hover:text-primary break-words">{c.legal_name}</Link>
          <p className="text-xs text-muted-foreground break-words">{t("nie_lbl")}: {c.nie_number || "—"} · {c.phone || "—"} · {c.email || "—"}</p>
          {c.legacy_dropbox_path && <p className="text-xs text-muted-foreground break-all">{t("dropbox_archive")} {c.legacy_dropbox_path}</p>}
          <p className="text-xs text-muted-foreground break-words">{c.written_language || "es"} / {c.spoken_language || "—"}{c.interpreter_required ? ` · ${t("interpreter_short")}` : ""}</p>
          <p className="text-xs text-muted-foreground break-words">{c.engagement_status || "—"}{c.service_package ? ` · ${c.service_package}` : ""} · {t("portal_colon")} {portal(c)}</p>
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-lg h-11 w-11" aria-label={t("actions")}>
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="h-11" asChild>
                  <Link to={`/clients/${c.id}`}><Eye className="w-4 h-4" /> {t("view_detail")}</Link>
                </DropdownMenuItem>
                {onArchive && (
                  <DropdownMenuItem className="h-11 text-destructive focus:text-destructive" onClick={() => onArchive(c)}>
                    <Archive className="w-4 h-4" /> {t("archive")}
                  </DropdownMenuItem>
                )}
                {onExport && c.status === "archived" && (
                  <DropdownMenuItem className="h-11" onClick={() => onExport(c)}>
                    <HardDriveDownload className="w-4 h-4" /> {t("export_archive")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ))}
      {!clients.length && <p className="text-sm text-muted-foreground p-4">{t("no_results")}</p>}
    </div>
  );
}