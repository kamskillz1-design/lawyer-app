// Staff-facing constants (staff workspace is in Spanish by design).
export const STAGES = [
  { id: "new_enquiry", label: "Nueva consulta" },
  { id: "consultation_pending", label: "Consulta pendiente" },
  { id: "consultation_completed", label: "Consulta realizada" },
  { id: "awaiting_engagement", label: "Pendiente encargo/pago" },
  { id: "open_documents_requested", label: "Abierto — documentos solicitados" },
  { id: "documents_under_review", label: "Documentos en revisión" },
  { id: "preparation_in_progress", label: "Preparación en curso" },
  { id: "awaiting_lawyer_approval", label: "Pendiente aprobación letrada" },
  { id: "ready_to_submit", label: "Listo para presentar" },
  { id: "submitted", label: "Presentado" },
  { id: "awaiting_decision", label: "Esperando resolución" },
  { id: "further_info_requested", label: "Requerimiento de información" },
  { id: "resolution_received", label: "Resolución recibida" },
  { id: "post_resolution", label: "Post-resolución / TIE / cita" },
  { id: "completed", label: "Completado" },
  { id: "closed_not_proceeding", label: "Cerrado — no instruye/no procede" },
  { id: "archived", label: "Archivado" },
];

export const PROCEDURE_FAMILIES = [
  "Residencia", "Trabajo y empleo", "Estudios", "Familia", "Nacionalidad", "Documentación (NIE/TIE)", "Otros"
];

export const PROCEDURE_TYPES = [
  "Renovación de residencia", "Residencia inicial (régimen general)", "Arraigo", "Residencia y trabajo por cuenta ajena",
  "Residencia y trabajo por cuenta propia", "Trabajador transfronterizo", "Estudiante", "Estancia por estudios",
  "Reagrupación familiar", "Tarjeta azul UE", "Residencia larga duración UE", "Nacionalidad española (residencia)",
  "NIE (número de identidad de extranjero)", "TIE (tarjeta de identidad de extranjero)", "Cita toma de huellas TIE",
  "Recurso de alzada / reposición", "Reconsideración", "Cambio de situación", "Reagrupación de ascendientes", "Otro"
];

export const DOC_CATEGORIES = [
  { id: "passport", label: "Pasaporte" },
  { id: "visa", label: "Visado" },
  { id: "nie_certificate", label: "Certificado NIE" },
  { id: "tie_card", label: "Tarjeta TIE" },
  { id: "residence_authorisation", label: "Autorización/resolución de residencia" },
  { id: "birth_certificate", label: "Certificado de nacimiento" },
  { id: "marriage_certificate", label: "Certificado de matrimonio" },
  { id: "divorce_document", label: "Documento de divorcio/separación" },
  { id: "criminal_record", label: "Certificado de antecedentes penales" },
  { id: "padron_certificate", label: "Certificado de empadronamiento" },
  { id: "proof_of_address", label: "Justificante de domicilio" },
  { id: "employment_contract", label: "Contrato de trabajo" },
  { id: "employer_evidence", label: "Acreditación del empleador" },
  { id: "payslips", label: "Nóminas" },
  { id: "social_security", label: "Prueba de Seguridad Social" },
  { id: "tax_documentation", label: "Documentación fiscal" },
  { id: "bank_statements", label: "Extractos bancarios" },
  { id: "study_enrolment", label: "Matrícula / prueba de estudios" },
  { id: "health_insurance", label: "Seguro de salud" },
  { id: "medical_certificate", label: "Certificado médico" },
  { id: "proof_of_funds", label: "Prueba de medios económicos" },
  { id: "apostille", label: "Apostilla / legalización" },
  { id: "sworn_translation", label: "Traducción jurada" },
  { id: "power_of_attorney", label: "Poder de representación" },
  { id: "official_form", label: "Modelo oficial" },
  { id: "fee_receipt", label: "Justificante de tasas" },
  { id: "submission_receipt", label: "Resguardo de presentación" },
  { id: "authority_notification", label: "Notificación de la autoridad" },
  { id: "appointment_confirmation", label: "Confirmación de cita" },
  { id: "final_resolution", label: "Resolución final" },
  { id: "internal_work_product", label: "Trabajo interno" },
  { id: "other", label: "Otro" },
];

export const REVIEW_STATUSES = [
  { id: "not_requested", label: "No solicitado" },
  { id: "requested", label: "Solicitado" },
  { id: "uploaded", label: "Subido" },
  { id: "under_review", label: "En revisión" },
  { id: "accepted", label: "Aceptado" },
  { id: "needs_correction", label: "Requiere corrección" },
  { id: "missing_page", label: "Falta página" },
  { id: "incorrect_document", label: "Documento incorrecto" },
  { id: "expired", label: "Caducado" },
  { id: "replaced", label: "Sustituido" },
  { id: "not_applicable", label: "No aplica" },
  { id: "archived", label: "Archivado" },
];

export const CHECKLIST_STATUSES = [
  { id: "needed", label: "Pendiente" },
  { id: "uploaded", label: "Subido" },
  { id: "being_checked", label: "En revisión" },
  { id: "accepted", label: "Aceptado" },
  { id: "needs_correction", label: "Requiere corrección" },
  { id: "not_required", label: "No necesario" },
];

export const TASK_TYPES = [
  { id: "legal_deadline", label: "Plazo legal" },
  { id: "authority_deadline", label: "Plazo de la autoridad" },
  { id: "client_document", label: "Documento del cliente" },
  { id: "internal_review", label: "Revisión interna" },
  { id: "permit_expiry", label: "Caducidad de permiso" },
  { id: "passport_expiry", label: "Caducidad de pasaporte" },
  { id: "tie_expiry", label: "Caducidad de TIE" },
  { id: "appointment", label: "Cita" },
  { id: "payment", label: "Pago" },
  { id: "renewal", label: "Renovación" },
  { id: "archive_review", label: "Revisión de archivo" },
  { id: "general", label: "General" },
];

export const APPOINTMENT_TYPES = [
  { id: "consultation", label: "Consulta inicial" },
  { id: "document_review", label: "Revisión de documentos" },
  { id: "submission_prep", label: "Preparación de presentación" },
  { id: "office_followup", label: "Seguimiento en oficina" },
  { id: "video", label: "Videollamada" },
  { id: "authority", label: "Cita en autoridad (extranjería)" },
  { id: "tie_fingerprint", label: "Cita policía — huellas/TIE" },
  { id: "payment", label: "Cita de pagos" },
];

export const LEAD_STATUSES = [
  { id: "new", label: "Nuevo" },
  { id: "awaiting_response", label: "Esperando respuesta" },
  { id: "appointment_proposed", label: "Cita propuesta" },
  { id: "appointment_booked", label: "Cita reservada" },
  { id: "consultation_completed", label: "Consulta realizada" },
  { id: "awaiting_engagement", label: "Pendiente encargo" },
  { id: "converted", label: "Convertido en cliente" },
  { id: "not_proceeding", label: "No procede" },
  { id: "referred_elsewhere", label: "Derivado" },
  { id: "closed", label: "Cerrado" },
];

export const SENSITIVITIES = [
  { id: "routine", label: "Rutina", review: "staff" },
  { id: "important", label: "Importante", review: "staff" },
  { id: "lawyer_review", label: "Requiere letrado", review: "lawyer" },
  { id: "urgent", label: "Urgente", review: "lawyer" },
];

export const INVOICE_STATUSES = [
  { id: "draft", label: "Borrador" },
  { id: "sent", label: "Enviada" },
  { id: "paid", label: "Pagada" },
  { id: "overdue", label: "Vencida" },
  { id: "void", label: "Anulada" },
];

export const stageLabel = (id) => (STAGES.find((s) => s.id === id) || {}).label || id;
export const categoryLabel = (id) => (DOC_CATEGORIES.find((c) => c.id === id) || {}).label || id;
export const reviewLabel = (id) => (REVIEW_STATUSES.find((s) => s.id === id) || {}).label || id;
export const checklistLabel = (id) => (CHECKLIST_STATUSES.find((s) => s.id === id) || {}).label || id;
export const taskTypeLabel = (id) => (TASK_TYPES.find((s) => s.id === id) || {}).label || id;
export const appointmentLabel = (id) => (APPOINTMENT_TYPES.find((s) => s.id === id) || {}).label || id;
export const leadLabel = (id) => (LEAD_STATUSES.find((s) => s.id === id) || {}).label || id;
export const sensitivityLabel = (id) => (SENSITIVITIES.find((s) => s.id === id) || {}).label || id;
export const invoiceLabel = (id) => (INVOICE_STATUSES.find((s) => s.id === id) || {}).label || id;

// Staff hint shown next to AI translation confidence values.
export const CONFIDENCE_HINT = {
  normal: "Traducción fiable",
  review_recommended: "Revisar antes de enviar",
  uncertain: "Traducción dudosa — considerar traducción humana",
  human_required: "Requiere traducción/intérprete humano",
};