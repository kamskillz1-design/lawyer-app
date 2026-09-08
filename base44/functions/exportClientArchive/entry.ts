import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { jsPDF } from 'npm:jspdf@4.2.1';

// Exporta el expediente completo de un cliente archivado a Dropbox (documentos,
// resumen PDF y copia de seguridad JSON) y, solo tras verificar cada subida,
// purga todos sus registros dejando un registro mínimo con la referencia al archivo.

const sanitizeSegment = (s) => (s || "")
  .replace(/[\/\\?*<>:"|#\x00-\x1f]/g, "-")
  .replace(/\.+$/, "")
  .trim()
  .slice(0, 120) || "sin-nombre";

const todayISODate = () => new Date().toISOString().slice(0, 10);

async function dropboxEnsureFolder(accessToken, path) {
  const res = await fetch("https://api.dropboxapi.com/2/files/create_folder_v2", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path }),
  });
  // 409 = la carpeta ya existe (reintento idempotente)
  if (!res.ok && res.status !== 409) {
    const detail = await res.text().catch(() => "");
    throw new Error(`No se pudo crear la carpeta ${path} en Dropbox (HTTP ${res.status}). ${detail.slice(0, 200)}`);
  }
}

async function dropboxUpload(accessToken, path, bytes) {
  const res = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Dropbox-API-Arg": JSON.stringify({ path, mode: "overwrite", autorename: false, mute: true }),
      "Content-Type": "application/octet-stream",
    },
    body: bytes,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Dropbox rechazó la subida de ${path} (HTTP ${res.status}). ${detail.slice(0, 200)}`);
  }
  return res.json();
}

function buildSummaryPdf(client, matters, communications, appointments, invoices, tasks, documents) {
  const pdf = new jsPDF();
  let y = 20;

  const write = (line, size = 10) => {
    pdf.setFontSize(size);
    const wrapped = pdf.splitTextToSize(String(line), 180);
    for (const w of wrapped) {
      if (y > 280) { pdf.addPage(); y = 20; }
      pdf.text(w, 14, y);
      y += size * 0.55 + 1.5;
    }
  };

  const section = (title) => {
    y += 4;
    write(title.toUpperCase(), 11);
    y -= 2;
  };

  write(`Archivo de cliente - ${client.legal_name}`, 16);
  write(`Exportado por GlobalLaw OS el ${new Date().toLocaleDateString("es-ES")}`, 8);
  y += 2;
  write(`NIE: ${client.nie_number || "-"} | Email: ${client.email || "-"} | Tel: ${client.phone || "-"}`);
  write(`Nacionalidades: ${client.nationalities || "-"} | Nacimiento: ${client.date_of_birth || "-"} (${client.country_of_birth || "-"})`);
  write(`Referencia legada: ${client.legacy_reference || "-"} | Dropbox legado: ${client.legacy_dropbox_path || "-"}`);

  section(`Expedientes (${matters.length})`);
  matters.forEach((m) => write(`${m.matter_number || "-"} | ${m.procedure_type || "-"} | Etapa: ${m.stage || "-"} | Autoridad: ${m.authority || "-"} | Resultado: ${m.outcome || "-"}`));

  section(`Comunicaciones (${communications.length})`);
  communications.forEach((c) => write(`[${c.direction}] ${c.channel} | ${c.original_language || "-"} | ${c.original_content?.slice(0, 180) || "-"}`));

  section(`Citas (${appointments.length})`);
  appointments.forEach((a) => write(`${a.date_time || "-"} | ${a.type} | ${a.location || a.video_link || "-"} | Estado: ${a.status}`));

  section(`Facturas (${invoices.length})`);
  invoices.forEach((i) => write(`${i.number} | Total: ${i.total ?? "-"} EUR | Estado: ${i.status} | Emitida: ${i.issue_date || "-"}`));

  section(`Tareas (${tasks.length})`);
  tasks.forEach((t) => write(`${t.title} | Estado: ${t.status} | Vence: ${t.due_date || "-"}`));

  section(`Documentos (${documents.length})`);
  documents.forEach((d) => write(`${d.title} | ${d.category || "otros"} | ${d.file_name || d.file_url || "-"} | Revisión: ${d.review_status}`));

  return pdf.output('arraybuffer');
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Solo los administradores pueden exportar al archivo' }, { status: 403 });
    }

    const { client_id } = await req.json();
    if (!client_id || typeof client_id !== 'string') {
      return Response.json({ error: 'client_id requerido' }, { status: 400 });
    }

    let accessToken;
    try {
      ({ accessToken } = await base44.asServiceRole.connectors.getConnection('dropbox'));
    } catch {
      return Response.json({
        status: 'not_connected',
        message: 'La cuenta de Dropbox de la despacho aún no está conectada a la aplicación. Conéctela primero desde la configuración de integraciones.',
      });
    }

    const client = await base44.entities.Client.get(client_id);
    if (!client) return Response.json({ error: 'Cliente no encontrado' }, { status: 404 });
    if (client.status !== 'archived') {
      return Response.json({ error: 'Solo se pueden exportar clientes archivados' }, { status: 400 });
    }
    if (client.dropbox_export_date) {
      return Response.json({ error: 'Este cliente ya fue exportado y purgado anteriormente' }, { status: 400 });
    }

    const loadRelated = (entity) => base44.entities[entity].filter({ client_id }, undefined, 500);
    const [matters, checklists, tasks, communications, appointments, invoices, documents] = await Promise.all([
      loadRelated('Matter'),
      loadRelated('ChecklistItem'),
      loadRelated('Task'),
      loadRelated('Communication'),
      loadRelated('Appointment'),
      loadRelated('Invoice'),
      loadRelated('Document'),
    ]);

    const root = `/GlobalLaw OS/Archivo/${sanitizeSegment(client.legal_name)}${client.nie_number ? ` - ${sanitizeSegment(client.nie_number)}` : ''}`;
    await dropboxEnsureFolder(accessToken, root);
    await dropboxEnsureFolder(accessToken, `${root}/Documentos`);

    const categories = [...new Set(documents.filter((d) => d.file_url).map((d) => d.category || 'otros'))];
    for (const cat of categories) {
      await dropboxEnsureFolder(accessToken, `${root}/Documentos/${sanitizeSegment(cat)}`);
    }

    // 1. Copia de seguridad JSON completa
    const backup = {
      exported_at: new Date().toISOString(),
      exported_by: user.full_name || user.email,
      client, matters, checklists, tasks, communications, appointments, invoices, documents,
    };
    const backupBytes = new TextEncoder().encode(JSON.stringify(backup, null, 2));
    await dropboxUpload(accessToken, `${root}/Backup completo.json`, backupBytes);

    // 2. Resumen legible en PDF
    const pdfBytes = buildSummaryPdf(client, matters, communications, appointments, invoices, tasks, documents);
    await dropboxUpload(accessToken, `${root}/Resumen del expediente.pdf`, pdfBytes);

    // 3. Documentos originales, con verificación por archivo
    const usedNames = new Set();
    const failed = [];
    let uploadedDocs = 0;
    for (const d of documents) {
      if (!d.file_url) continue;
      try {
        const fileRes = await fetch(d.file_url);
        if (!fileRes.ok) throw new Error(`HTTP ${fileRes.status} al descargar el archivo`);
        const bytes = await fileRes.arrayBuffer();
        let name = sanitizeSegment(d.file_name || d.file_url.split('/').pop() || d.title || 'documento');
        if (!/\.[a-z0-9]{1,8}$/i.test(name)) name += '.pdf';
        let unique = name;
        let i = 1;
        while (usedNames.has(unique)) { unique = name.replace(/(\.[^.]+)$/, ` (${i})$1`); i += 1; }
        usedNames.add(unique);
        await dropboxUpload(accessToken, `${root}/Documentos/${sanitizeSegment(d.category || 'otros')}/${unique}`, bytes);
        uploadedDocs += 1;
      } catch (e) {
        failed.push(`${d.title || d.file_name || 'documento'}: ${e.message}`);
      }
    }

    if (failed.length) {
      return Response.json({
        error: 'La exportación no se completó. NO se ha eliminado ningún dato; puede reintentarlo.',
        failed,
      }, { status: 502 });
    }

    // 4. Exportación verificada: purgar en orden de dependencia
    await base44.entities.ChecklistItem.deleteMany({ client_id });
    await base44.entities.Task.deleteMany({ client_id });
    await base44.entities.Communication.deleteMany({ client_id });
    await base44.entities.Appointment.deleteMany({ client_id });
    await base44.entities.Invoice.deleteMany({ client_id });
    await base44.entities.Document.deleteMany({ client_id });
    await base44.entities.Matter.deleteMany({ client_id });

    // 5. Reducir el cliente a un registro mínimo (stub)
    await base44.entities.Client.update(client_id, {
      preferred_name: '', date_of_birth: '', country_of_birth: '', nationalities: '',
      passport_number: '', passport_expiry: '', tie_number: '', permit_type: '', permit_expiry: '',
      phone: '', email: '', address: '', preferred_channel: '',
      interface_language: '', written_language: '', spoken_language: '',
      interpreter_required: false, interpreter_language: '',
      reads_spanish: false, reads_english: false, language_notes: '',
      portal_user_id: '', portal_email: '', portal_access_enabled: false,
      assigned_lawyer: '', assigned_caseworker: '', service_package: '', referral_source: '',
      retention_review_date: '', notes: '',
      legacy_dropbox_path: root,
      dropbox_export_date: todayISODate(),
      legacy_notes: `Expediente exportado a Dropbox el ${todayISODate()}: ${root}`,
    });

    await base44.entities.AuditLog.create({
      entity_type: 'Client',
      entity_id: client_id,
      action: 'dropbox_archive_export',
      actor: user.email,
      actor_name: user.full_name || 'Personal',
      summary: `Cliente ${client.legal_name} exportado a Dropbox y purgado (${uploadedDocs} documentos, ${matters.length} expedientes). Archivo: ${root}`,
      details: JSON.stringify({
        folder: root,
        documents: uploadedDocs,
        matters: matters.length,
        communications: communications.length,
        appointments: appointments.length,
        invoices: invoices.length,
        tasks: tasks.length,
        checklists: checklists.length,
      }),
    });

    return Response.json({
      status: 'ok',
      folder: root,
      documents: uploadedDocs,
      records: {
        matters: matters.length,
        communications: communications.length,
        appointments: appointments.length,
        invoices: invoices.length,
        tasks: tasks.length,
        checklists: checklists.length,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}