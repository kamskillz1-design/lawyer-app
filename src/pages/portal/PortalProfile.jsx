import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Save } from "lucide-react";
import { LANGUAGES } from "@/lib/languages";

const input = "w-full h-10 rounded-xl border border-input bg-card px-3 text-sm";

export default function PortalProfile() {
  const { t, setLang } = useI18n();
  const { toast } = useToast();
  const [client, setClient] = useState(null);
  const [noAccess, setNoAccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      const clients = await base44.entities.Client.filter({ portal_user_id: me.id });
      if (!clients[0]) { setNoAccess(true); return; }
      setClient(clients[0]);
      if (clients[0].interface_language) setLang(clients[0].interface_language);
    };
    load().catch(() => setNoAccess(true));
  }, []);

  const set = (k, v) => setClient({ ...client, [k]: v });

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.Client.update(client.id, {
        phone: client.phone, email: client.email, address: client.address,
        interface_language: client.interface_language, written_language: client.written_language,
        spoken_language: client.spoken_language, interpreter_required: !!client.interpreter_required,
        interpreter_language: client.interpreter_language || "",
      });
      if (client.interface_language) setLang(client.interface_language);
      toast({ title: t("saved") });
    } finally {
      setSaving(false);
    }
  };

  if (noAccess) return <p className="p-6 text-muted-foreground">No client profile is linked to this account yet. Please contact the office.</p>;
  if (!client) return <p className="text-muted-foreground">{t("loading")}</p>;

  const langSelect = (k, label) => (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <select className={input} value={client[k] || ""} onChange={(e) => set(k, e.target.value)}>
        {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.native}</option>)}
      </select>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold">{t("profile_title")}</h1>
        <div className="flex gap-2">
          <LanguageSwitcher />
          <Button className="rounded-xl" onClick={save} disabled={saving}>
            <Save className="w-4 h-4 me-1" /> {saving ? t("loading") : t("save")}
          </Button>
        </div>
      </div>

      <div className="card-soft p-5">
        <h2 className="font-heading font-semibold mb-4">{t("contact_section")}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className="text-xs text-muted-foreground">{t("phone_l")}</label>
            <input className={input} value={client.phone || ""} onChange={(e) => set("phone", e.target.value)} /></div>
          <div><label className="text-xs text-muted-foreground">{t("email_l")}</label>
            <input className={input} value={client.email || ""} onChange={(e) => set("email", e.target.value)} /></div>
          <div className="md:col-span-2"><label className="text-xs text-muted-foreground">{t("contact_section")}</label>
            <input className={input} value={client.address || ""} onChange={(e) => set("address", e.target.value)} /></div>
        </div>
      </div>

      <div className="card-soft p-5">
        <h2 className="font-heading font-semibold mb-4">{t("language_section")}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {langSelect("interface_language", t("nav_profile") + " · UI")}
          {langSelect("written_language", t("messages_title"))}
          {langSelect("spoken_language", t("appointments"))}
          {client.interpreter_required && langSelect("interpreter_language", t("language"))}
        </div>
        <label className="flex items-center gap-2 text-sm mt-4">
          <input type="checkbox" checked={!!client.interpreter_required} onChange={(e) => set("interpreter_required", e.target.checked)} />
          {t("interpreter_question")}
        </label>
      </div>
    </div>
  );
}