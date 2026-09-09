import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, Archive, HardDriveDownload } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function ClientListTable({ clients, muted = false, onArchive, onExport }) {
  const { t } = useI18n();
  const showActions = !muted || !!onExport;
  const portal = (c) =>
    c.status === "archived" ? t("portal_state_archived") : c.portal_user_id ? t("portal_state_active") : "—";

  return (
    <div className="card-soft hidden md:block overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground border-b">
            <th className="p-3 text-start">{t("clients_title")}</th><th className="p-3 text-start">{t("th_contact")}</th>
            <th className="p-3 text-start">{t("th_languages")}</th><th className="p-3 text-start">{t("th_engagement")}</th><th className="p-3 text-start">{t("th_portal")}</th>
            {showActions && <th className="p-3 text-start">{t("th_actions")}</th>}
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id} className={`border-b last:border-0 hover:bg-secondary/50 ${muted ? "opacity-60" : ""}`}>
              <td className="p-3">
                <Link to={`/clients/${c.id}`} className="font-medium hover:text-primary">{c.legal_name}</Link>
                <p className="text-xs text-muted-foreground">{t("nie_lbl")}: {c.nie_number || "—"}</p>
                {c.legacy_dropbox_path && <p className="text-xs text-muted-foreground break-all">{t("dropbox_archive")} {c.legacy_dropbox_path}</p>}
              </td>
              <td className="p-3 text-xs">{c.phone || "—"}<br />{c.email || "—"}</td>
              <td className="p-3 text-xs">{c.written_language || "es"} / {c.spoken_language || "—"}{c.interpreter_required ? ` · ${t("interpreter_short")}` : ""}</td>
              <td className="p-3 text-xs">{c.engagement_status || "—"}{c.service_package ? ` · ${c.service_package}` : ""}</td>
              <td className="p-3 text-xs">{portal(c)}</td>
              {showActions && (
                <td className="p-3">
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
                </td>
              )}
            </tr>
          ))}
          {!clients.length && <tr><td colSpan={showActions ? 6 : 5} className="p-6 text-center text-muted-foreground">{t("no_results")}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}