import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Scale, Gavel, FileCheck, Briefcase, HeartHandshake, Flag, IdCard, ChevronDown } from "lucide-react";

const SERVICES = [
  { key: "sv_consult", icon: Gavel },
  { key: "sv_permits", icon: FileCheck },
  { key: "sv_work", icon: Briefcase },
  { key: "sv_family", icon: HeartHandshake },
  { key: "sv_nationality", icon: Flag },
  { key: "sv_tie", icon: IdCard },
];

const FAQS = [
  {
    q: { es: "¿Cuánto cuesta la consulta inicial?", en: "How much does the initial consultation cost?", fr: "Combien coûte la consultation initiale ?", ar: "كم تكلّف الاستشارة الأولية؟" },
    a: { es: "La primera consulta tiene un coste fijo que se informa al reservar la cita. Si contrata el servicio, parte del importe se descuenta del presupuesto.", en: "The first consultation has a fixed fee quoted when booking. If you engage our services, part of it is credited to your budget.", fr: "La première consultation a un tarif fixe communiqué lors de la prise de rendez-vous. Si vous engagez nos services, une partie est déduite du budget.", ar: "للاستشارة الأولى رسم ثابت يُبلغ عنه عند حجز الموعد. وإذا كلفتم المكتب بالخدمة، يُخصم جزء من المبلغ من الميزانية." },
  },
  {
    q: { es: "¿Qué documentos debo traer a la primera cita?", en: "What documents should I bring to the first appointment?", fr: "Quels documents dois-je apporter au premier rendez-vous ?", ar: "ما المستندات التي يجب إحضارها في الموعد الأول؟" },
    a: { es: "Pasaporte vigente y, si los tiene, su tarjeta TIE, NIE y cualquier notificación oficial recibida. Tras la consulta le daremos una lista personalizada en su idioma.", en: "A valid passport and, if you have them, your TIE card, NIE and any official notifications received. After the consultation we will give you a personalised checklist in your language.", fr: "Un passeport valide et, si vous les avez, votre carte TIE, votre NIE et toute notification officielle reçue. Après la consultation, nous vous remettrons une liste personnalisée dans votre langue.", ar: "جواز سفر ساري المفعول، وإن وُجدت بطاقة TIE ورقم NIE وأي إخطارات رسمية. بعد الاستشارة سنمنحكم قائمة مستندات مخصصة بلغتكم." },
  },
  {
    q: { es: "¿Hablan mi idioma?", en: "Do you speak my language?", fr: "Parlez-vous ma langue ?", ar: "هل تتحدثون لغتي؟" },
    a: { es: "Nuestro portal y comunicaciones funcionan en muchos idiomas, con traducción revisada. Si es necesario, organizamos un intérprete para su cita.", en: "Our portal and communications work in many languages, with reviewed translation. If needed, we arrange an interpreter for your appointment.", fr: "Notre portail et nos communications fonctionnent dans de nombreuses langues, avec traduction vérifiée. Si nécessaire, nous organisons un interprète pour votre rendez-vous.", ar: "يعمل بوابة المكتب واتصالاته بالعديد من اللغات مع ترجمة مُراجَعة. وإذا لزم، نرتّب مترجماً فورياً لموعدكم." },
  },
];

export default function PublicLanding() {
  const { t, lang } = useI18n();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", nationality: "", enquiry_category: "", message: "" });
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!consent || !form.full_name || !form.message) return;
    setSending(true); setError("");
    try {
      await base44.entities.Lead.create({
        ...form,
        preferred_language: lang,
        urgency: "normal",
        consent_status: "granted",
        status: "new",
        source: "web",
      });
      setDone(true);
    } catch (err) {
      setError(err.message || "Error");
    } finally {
      setSending(false);
    }
  };

  const pick = (o) => o[lang] || o.en;

  const inputCls = "w-full h-11 rounded-xl border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/95 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-primary" />
            <span className="font-heading font-bold text-lg">Legal Lex</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link to="/login"><Button variant="outline" size="sm">Acceso clientes</Button></Link>
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 pt-16 pb-12 text-center">
        <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-primary leading-tight">{t("hero_title")}</h1>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-lg">{t("hero_sub")}</p>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-14">
        <h2 className="font-heading text-2xl font-semibold mb-6">{t("services_title")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {SERVICES.map(({ key, icon: Icon }) => (
            <div key={key} className="card-soft p-5 flex flex-col gap-3 items-start">
              <div className="w-10 h-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <p className="font-medium text-sm">{t(key)}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="enquiry" className="max-w-3xl mx-auto px-4 pb-14">
        <div className="card-soft p-6 md:p-8">
          <h2 className="font-heading text-2xl font-semibold mb-1">{t("enquiry_title")}</h2>
          {done ? (
            <p className="mt-4 p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">{t("thanks")}</p>
          ) : (
            <form onSubmit={submit} className="mt-5 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <input className={inputCls} placeholder={`${t("full_name")} *`} value={form.full_name} onChange={set("full_name")} required />
                <input className={inputCls} type="email" placeholder={t("email_l")} value={form.email} onChange={set("email")} />
                <input className={inputCls} placeholder={t("phone_l")} value={form.phone} onChange={set("phone")} />
                <input className={inputCls} placeholder={t("nationality_l")} value={form.nationality} onChange={set("nationality")} />
              </div>
              <textarea className="w-full min-h-32 rounded-xl border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                placeholder={`${t("message_l")} *`} value={form.message} onChange={set("message")} required />
              <label className="flex items-start gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
                {t("privacy_ok")}
              </label>
              {error && <p className="text-sm text-red-700">{error}</p>}
              <Button type="submit" className="w-full h-11 rounded-xl" disabled={sending || !consent}>
                {sending ? t("loading") : t("submit")}
              </Button>
            </form>
          )}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-14">
        <h2 className="font-heading text-2xl font-semibold mb-4">{t("faq_title")}</h2>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <details key={i} className="card-soft p-4 group">
              <summary className="flex items-center justify-between cursor-pointer font-medium text-sm list-none">
                {pick(f.q)}
                <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform" />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{pick(f.a)}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="max-w-5xl mx-auto px-4 text-sm text-muted-foreground flex flex-col md:flex-row justify-between gap-2">
          <p>Legal Lex · Despacho de extranjería · Bilbao</p>
          <p>Lunes–Viernes 9:00–18:00 · +34 XXX XXX XXX</p>
        </div>
      </footer>
    </div>
  );
}