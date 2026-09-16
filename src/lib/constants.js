// Staff-facing constants. `label` is the Spanish fallback; each entry also
// carries a `key` resolved through the i18n dictionary, so every option
// label follows the user's interface language.
export const STAGES = [
  { id: "new_enquiry", key: "st_new_enquiry", label: "Nueva consulta" },
  { id: "consultation_pending", key: "st_consultation_pending", label: "Consulta pendiente" },
  { id: "consultation_completed", key: "st_consultation_completed", label: "Consulta realizada" },
  { id: "awaiting_engagement", key: "st_awaiting_engagement", label: "Pendiente encargo/pago" },
  { id: "open_documents_requested", key: "st_docs_requested", label: "Abierto — documentos solicitados" },
  { id: "documents_under_review", key: "st_docs_review", label: "Documentos en revisión" },
  { id: "preparation_in_progress", key: "st_prep", label: "Preparación en curso" },
  { id: "awaiting_lawyer_approval", key: "st_lawyer_approval", label: "Pendiente aprobación letrada" },
  { id: "ready_to_submit", key: "st_ready", label: "Listo para presentar" },
  { id: "submitted", key: "st_submitted", label: "Presentado" },
  { id: "awaiting_decision", key: "st_awaiting_decision", label: "Esperando resolución" },
  { id: "further_info_requested", key: "st_further_info", label: "Requerimiento de información" },
  { id: "resolution_received", key: "st_resolution", label: "Resolución recibida" },
  { id: "post_resolution", key: "st_post_resolution", label: "Post-resolución / TIE / cita" },
  { id: "completed", key: "st_completed", label: "Completado" },
  { id: "closed_not_proceeding", key: "st_closed", label: "Cerrado — no instruye/no procede" },
  { id: "archived", key: "st_archived", label: "Archivado" },
];

export const PROCEDURE_FAMILIES = [
  { id: "Residencia", key: "pf_residence", label: "Residencia" },
  { id: "Trabajo y empleo", key: "pf_work", label: "Trabajo y empleo" },
  { id: "Estudios", key: "pf_studies", label: "Estudios" },
  { id: "Familia", key: "pf_family", label: "Familia" },
  { id: "Nacionalidad", key: "pf_nationality", label: "Nacionalidad" },
  { id: "Documentación (NIE/TIE)", key: "pf_docs", label: "Documentación (NIE/TIE)" },
  { id: "Otros", key: "pf_other", label: "Otros" },
];

export const PROCEDURE_TYPES = [
  { id: "Renovación de residencia", key: "pt_renewal", label: "Renovación de residencia" },
  { id: "Residencia inicial (régimen general)", key: "pt_initial", label: "Residencia inicial (régimen general)" },
  { id: "Arraigo", key: "pt_arraigo", label: "Arraigo" },
  { id: "Residencia y trabajo por cuenta ajena", key: "pt_employed", label: "Residencia y trabajo por cuenta ajena" },
  { id: "Residencia y trabajo por cuenta propia", key: "pt_self_employed", label: "Residencia y trabajo por cuenta propia" },
  { id: "Trabajador transfronterizo", key: "pt_frontier", label: "Trabajador transfronterizo" },
  { id: "Estudiante", key: "pt_student", label: "Estudiante" },
  { id: "Estancia por estudios", key: "pt_study_stay", label: "Estancia por estudios" },
  { id: "Reagrupación familiar", key: "pt_family_reunion", label: "Reagrupación familiar" },
  { id: "Tarjeta azul UE", key: "pt_blue_card", label: "Tarjeta azul UE" },
  { id: "Residencia larga duración UE", key: "pt_long_term", label: "Residencia larga duración UE" },
  { id: "Nacionalidad española (residencia)", key: "pt_nationality", label: "Nacionalidad española (residencia)" },
  { id: "NIE (número de identidad de extranjero)", key: "pt_nie", label: "NIE (número de identidad de extranjero)" },
  { id: "TIE (tarjeta de identidad de extranjero)", key: "pt_tie", label: "TIE (tarjeta de identidad de extranjero)" },
  { id: "Cita toma de huellas TIE", key: "pt_tie_fingerprint", label: "Cita toma de huellas TIE" },
  { id: "Recurso de alzada / reposición", key: "pt_appeal", label: "Recurso de alzada / reposición" },
  { id: "Reconsideración", key: "pt_reconsideration", label: "Reconsideración" },
  { id: "Cambio de situación", key: "pt_change", label: "Cambio de situación" },
  { id: "Reagrupación de ascendientes", key: "pt_ascendants", label: "Reagrupación de ascendientes" },
  { id: "Otro", key: "pt_other", label: "Otro" },
];

const PROCEDURE_KEY_ALIASES = {
  "Arraigo laboral": "pt_arraigo_laboral",
};

export const procedureLabel = (value, t) => {
  if (!value) return value || "";
  const entry = PROCEDURE_TYPES.find((p) => p.id === value);
  if (entry) return t ? t(entry.key) : entry.label;
  const alias = PROCEDURE_KEY_ALIASES[value];
  return t && alias ? t(alias) : value;
};

export const DOC_CATEGORIES = [
  { id: "passport", key: "cat_passport", label: "Pasaporte" },
  { id: "visa", key: "cat_visa", label: "Visado" },
  { id: "nie_certificate", key: "cat_nie", label: "Certificado NIE" },
  { id: "tie_card", key: "cat_tie", label: "Tarjeta TIE" },
  { id: "residence_authorisation", key: "cat_residence", label: "Autorización/resolución de residencia" },
  { id: "birth_certificate", key: "cat_birth", label: "Certificado de nacimiento" },
  { id: "marriage_certificate", key: "cat_marriage", label: "Certificado de matrimonio" },
  { id: "divorce_document", key: "cat_divorce", label: "Documento de divorcio/separación" },
  { id: "criminal_record", key: "cat_criminal", label: "Certificado de antecedentes penales" },
  { id: "padron_certificate", key: "cat_padron", label: "Certificado de empadronamiento" },
  { id: "proof_of_address", key: "cat_address", label: "Justificante de domicilio" },
  { id: "employment_contract", key: "cat_employment", label: "Contrato de trabajo" },
  { id: "employer_evidence", key: "cat_employer", label: "Acreditación del empleador" },
  { id: "payslips", key: "cat_payslips", label: "Nóminas" },
  { id: "social_security", key: "cat_social", label: "Prueba de Seguridad Social" },
  { id: "tax_documentation", key: "cat_tax", label: "Documentación fiscal" },
  { id: "bank_statements", key: "cat_bank", label: "Extractos bancarios" },
  { id: "study_enrolment", key: "cat_enrolment", label: "Matrícula / prueba de estudios" },
  { id: "health_insurance", key: "cat_insurance", label: "Seguro de salud" },
  { id: "medical_certificate", key: "cat_medical", label: "Certificado médico" },
  { id: "proof_of_funds", key: "cat_funds", label: "Prueba de medios económicos" },
  { id: "apostille", key: "cat_apostille", label: "Apostilla / legalización" },
  { id: "sworn_translation", key: "cat_translation", label: "Traducción jurada" },
  { id: "power_of_attorney", key: "cat_poower", label: "Poder de representación" },
  { id: "official_form", key: "cat_form", label: "Modelo oficial" },
  { id: "fee_receipt", key: "cat_fee", label: "Justificante de tasas" },
  { id: "submission_receipt", key: "cat_submission", label: "Resguardo de presentación" },
  { id: "authority_notification", key: "cat_notification", label: "Notificación de la autoridad" },
  { id: "appointment_confirmation", key: "cat_appt_confirm", label: "Confirmación de cita" },
  { id: "final_resolution", key: "cat_final", label: "Resolución final" },
  { id: "internal_work_product", key: "cat_internal", label: "Trabajo interno" },
  { id: "other", key: "cat_other", label: "Otro" },
];

export const REVIEW_STATUSES = [
  { id: "not_requested", key: "rev_not_requested", label: "No solicitado" },
  { id: "requested", key: "rev_requested", label: "Solicitado" },
  { id: "uploaded", key: "rev_uploaded", label: "Subido" },
  { id: "under_review", key: "rev_under_review", label: "En revisión" },
  { id: "accepted", key: "rev_accepted", label: "Aceptado" },
  { id: "needs_correction", key: "rev_correction", label: "Requiere corrección" },
  { id: "missing_page", key: "rev_missing_page", label: "Falta página" },
  { id: "incorrect_document", key: "rev_incorrect", label: "Documento incorrecto" },
  { id: "expired", key: "rev_expired", label: "Caducado" },
  { id: "replaced", key: "rev_replaced", label: "Sustituido" },
  { id: "not_applicable", key: "rev_not_applicable", label: "No aplica" },
  { id: "archived", key: "rev_archived", label: "Archivado" },
];

export const CHECKLIST_STATUSES = [
  { id: "needed", key: "cl_needed", label: "Pendiente" },
  { id: "uploaded", key: "cl_uploaded", label: "Subido" },
  { id: "being_checked", key: "cl_checking", label: "En revisión" },
  { id: "accepted", key: "cl_accepted", label: "Aceptado" },
  { id: "needs_correction", key: "cl_correction", label: "Requiere corrección" },
  { id: "not_required", key: "cl_not_required", label: "No necesario" },
];

export const TASK_TYPES = [
  { id: "legal_deadline", key: "tt_legal", label: "Plazo legal" },
  { id: "authority_deadline", key: "tt_authority", label: "Plazo de la autoridad" },
  { id: "client_document", key: "tt_client_doc", label: "Documento del cliente" },
  { id: "internal_review", key: "tt_internal", label: "Revisión interna" },
  { id: "permit_expiry", key: "tt_permit", label: "Caducidad de permiso" },
  { id: "passport_expiry", key: "tt_passport", label: "Caducidad de pasaporte" },
  { id: "tie_expiry", key: "tt_tie", label: "Caducidad de TIE" },
  { id: "appointment", key: "tt_appointment", label: "Cita" },
  { id: "payment", key: "tt_payment", label: "Pago" },
  { id: "renewal", key: "tt_renewal", label: "Renovación" },
  { id: "archive_review", key: "tt_archive", label: "Revisión de archivo" },
  { id: "general", key: "tt_general", label: "General" },
];

export const APPOINTMENT_TYPES = [
  { id: "consultation", key: "at_consultation", label: "Consulta inicial" },
  { id: "document_review", key: "at_doc_review", label: "Revisión de documentos" },
  { id: "submission_prep", key: "at_submission", label: "Preparación de presentación" },
  { id: "office_followup", key: "at_followup", label: "Seguimiento en oficina" },
  { id: "video", key: "at_video", label: "Videollamada" },
  { id: "authority", key: "at_authority", label: "Cita en autoridad (extranjería)" },
  { id: "tie_fingerprint", key: "at_fingerprint", label: "Cita policía — huellas/TIE" },
  { id: "payment", key: "at_payment", label: "Cita de pagos" },
];

export const LEAD_STATUSES = [
  { id: "new", key: "ls_new", label: "Nuevo" },
  { id: "awaiting_response", key: "ls_awaiting", label: "Esperando respuesta" },
  { id: "appointment_proposed", key: "ls_proposed", label: "Cita propuesta" },
  { id: "appointment_booked", key: "ls_booked", label: "Cita reservada" },
  { id: "consultation_completed", key: "ls_consulted", label: "Consulta realizada" },
  { id: "awaiting_engagement", key: "ls_engagement", label: "Pendiente encargo" },
  { id: "converted", key: "ls_converted", label: "Convertido en cliente" },
  { id: "not_proceeding", key: "ls_not_proceeding", label: "No procede" },
  { id: "referred_elsewhere", key: "ls_referred", label: "Derivado" },
  { id: "closed", key: "ls_closed", label: "Cerrado" },
];

export const SENSITIVITIES = [
  { id: "routine", key: "sens_routine", label: "Rutina", review: "staff" },
  { id: "important", key: "sens_important", label: "Importante", review: "staff" },
  { id: "lawyer_review", key: "sens_lawyer", label: "Requiere letrado", review: "lawyer" },
  { id: "urgent", key: "sens_urgent", label: "Urgente", review: "lawyer" },
];

export const INVOICE_STATUSES = [
  { id: "draft", key: "inv_draft", label: "Borrador" },
  { id: "sent", key: "inv_sent", label: "Enviada" },
  { id: "paid", key: "inv_paid", label: "Pagada" },
  { id: "overdue", key: "inv_overdue", label: "Vencida" },
  { id: "void", key: "inv_void", label: "Anulada" },
];

const byId = (list, id) => list.find((s) => s.id === id);
export const stageLabel = (id, t) => { const s = byId(STAGES, id); return s ? (t ? t(s.key) : s.label) : id; };
export const categoryLabel = (id, t) => { const s = byId(DOC_CATEGORIES, id); return s ? (t ? t(s.key) : s.label) : id; };
export const reviewLabel = (id, t) => { const s = byId(REVIEW_STATUSES, id); return s ? (t ? t(s.key) : s.label) : id; };
export const checklistLabel = (id, t) => { const s = byId(CHECKLIST_STATUSES, id); return s ? (t ? t(s.key) : s.label) : id; };
export const taskTypeLabel = (id, t) => { const s = byId(TASK_TYPES, id); return s ? (t ? t(s.key) : s.label) : id; };
export const appointmentLabel = (id, t) => { const s = byId(APPOINTMENT_TYPES, id); return s ? (t ? t(s.key) : s.label) : id; };
export const leadLabel = (id, t) => { const s = byId(LEAD_STATUSES, id); return s ? (t ? t(s.key) : s.label) : id; };
export const sensitivityLabel = (id, t) => { const s = byId(SENSITIVITIES, id); return s ? (t ? t(s.key) : s.label) : id; };
export const invoiceLabel = (id, t) => { const s = byId(INVOICE_STATUSES, id); return s ? (t ? t(s.key) : s.label) : id; };

export const familyLabel = (id, t) => { const s = byId(PROCEDURE_FAMILIES, id); return s ? (t ? t(s.key) : s.label) : (id || ""); };
export const ownerLabel = (id, t) => {
  if (!id) return "";
  const key = "owner_" + id;
  return t ? (t(key) || id) : id;
};

export const CONFIDENCE_HINT = {
  normal: "Traducción fiable",
  review_recommended: "Revisar antes de enviar",
  uncertain: "Traducción dudosa — considerar traducción humana",
  human_required: "Requiere traducción/intérprete humano",
};

export const confidenceHint = (id, t) => {
  if (t) {
    const map = { normal: "conf_normal", review_recommended: "conf_review", uncertain: "conf_uncertain", human_required: "conf_human" };
    return map[id] ? t(map[id]) : (CONFIDENCE_HINT[id] || id);
  }
  return CONFIDENCE_HINT[id] || id;
};
