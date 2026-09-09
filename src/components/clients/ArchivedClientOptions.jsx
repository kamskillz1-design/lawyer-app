import React from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArchiveRestore, UserPlus } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const COPY_FIELDS = [
  "preferred_name", "date_of_birth", "country_of_birth", "nationalities",
  "passport_number", "passport_expiry", "nie_number", "tie_number",
  "permit_type", "permit_expiry", "phone", "email", "address",
  "preferred_channel", "interface_language", "written_language", "spoken_language",
  "interpreter_required", "interpreter_language",
];

export default function ArchivedClientOptions({ client, onDone }) {
  const navigate = useNavigate();
  const { t } = useI18n();

  const reactivate = async () => {
    await base44.entities.Client.update(client.id, {
      status: "active",
      engagement_status: "engaged",
      portal_access_enabled: true,
    });
    await base44.entities.AuditLog.create({
      entity_type: "Client",
      entity_id: client.id,
      action: "reactivate",
      summary: `Cliente reactivado: ${client.legal_name}. Acceso al portal restaurado.`,
    });
    onDone(t("toast_client_reactivated"));
  };

  const newRecord = async () => {
    const data = {
      legal_name: client.legal_name,
      status: "active",
      engagement_status: "prospect",
      portal_user_id: client.portal_user_id,
      portal_email: client.portal_email,
      portal_access_enabled: true,
    };
    COPY_FIELDS.forEach((k) => { if (client[k]) data[k] = client[k]; });
    const created = await base44.entities.Client.create(data);
    await base44.entities.AuditLog.create({
      entity_type: "Client",
      entity_id: created.id,
      action: "create",
      summary: `Nuevo registro para ${client.legal_name} (desde cliente archivado), vinculado a la misma cuenta de portal.`,
    });
    navigate(`/clients/${created.id}`);
  };

  return (
    <div className="card-soft p-5 space-y-4">
      <div>
        <h3 className="font-heading font-semibold">{t("archived_client_title")}</h3>
        <p className="text-sm text-muted-foreground">{t("archived_client_body")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button className="rounded-xl" onClick={reactivate}>
          <ArchiveRestore className="w-4 h-4 me-1" /> {t("reactivate_client")}
        </Button>
        <Button variant="outline" className="rounded-xl" onClick={newRecord}>
          <UserPlus className="w-4 h-4 me-1" /> {t("new_record_same_account")}
        </Button>
      </div>
    </div>
  );
}