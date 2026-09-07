import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const ACTIVE_STAGES = [
  'new_enquiry', 'consultation_pending', 'consultation_completed', 'awaiting_engagement', 'open_documents_requested',
  'documents_under_review', 'preparation_in_progress', 'awaiting_lawyer_approval', 'ready_to_submit', 'submitted',
  'awaiting_decision', 'further_info_requested', 'resolution_received', 'post_resolution',
];

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00Z');
  if (isNaN(target)) return null;
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return Math.round((target - today) / 86400000);
};

const chaseTemplate = (title, number) =>
  'Estimado/a cliente: recordatorio amable — seguimos necesitando el documento «' + title + '» para su expediente ' + number +
  '. Si tiene alguna duda o le resulta difícil obtenerlo, escríbanos un mensaje y le ayudaremos encantados. — Despacho LexPath';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const [matters, tasks, checklistItems, invoices, clients] = await Promise.all([
      svc.entities.Matter.list(),
      svc.entities.Task.list(),
      svc.entities.ChecklistItem.list(),
      svc.entities.Invoice.list(),
      svc.entities.Client.list(),
    ]);

    const existing = new Set(tasks.map((t) => t.source_ref).filter(Boolean));
    const today = new Date().toISOString().slice(0, 10);
    const clientById = Object.fromEntries(clients.map((c) => [c.id, c]));
    const toCreate = [];

    const addTask = (payload, ref) => {
      if (existing.has(ref)) return;
      existing.add(ref);
      toCreate.push({ ...payload, source: 'automation', source_ref: ref, status: 'todo' });
    };

    const ownerOf = (m) => (m.next_action_owner === 'lawyer' ? (m.assigned_lawyer || '') : (m.assigned_caseworker || ''));

    // 1. Matter deadlines: reminders at 30 / 7 / 1 days and overdue
    for (const m of matters.filter((x) => ACTIVE_STAGES.includes(x.stage))) {
      const d = daysUntil(m.next_deadline);
      if (d == null || d > 30) continue;
      const bucket = d < 0 ? 'overdue' : String(d);
      const label = d < 0 ? ('Plazo vencido hace ' + (-d) + ' día/s') : ('Plazo en ' + d + ' día/s');
      addTask({
        title: label + ': ' + m.matter_number + ' — ' + m.procedure_type,
        matter_id: m.id, client_id: m.client_id, matter_number: m.matter_number,
        owner: ownerOf(m), due_date: today,
        priority: d <= 1 ? 'urgent' : d <= 7 ? 'high' : 'medium',
        task_type: 'legal_deadline',
        instructions: 'Automatización: próximo paso «' + (m.next_action || '—') + '» (responsable: ' + (m.next_action_owner || '—') + ').',
      }, 'deadline|' + m.id + '|' + bucket);
    }

    // 2. Escalation for overdue manual tasks
    for (const t of tasks) {
      if (t.status === 'done' || t.source === 'automation') continue;
      const d = daysUntil(t.due_date);
      if (d == null || d >= 0) continue;
      addTask({
        title: 'Tarea vencida — escalar: ' + t.title,
        matter_id: t.matter_id || '', client_id: t.client_id || '', matter_number: t.matter_number || '',
        owner: t.owner || '', due_date: today, priority: 'high', task_type: 'general',
        instructions: 'La tarea original venció hace ' + (-d) + ' día/s. Escalar al responsable o a la letrada.',
      }, 'overdue_task|' + t.id);
    }

    // 3. Missing checklist documents + client-language chase draft (staff review, never auto-sent)
    for (const item of checklistItems) {
      if (item.status !== 'needed') continue;
      const d = daysUntil(item.deadline);
      if (d == null || d > 7) continue;
      const bucket = d < 0 ? 'overdue' : 'due_soon';
      const client = clientById[item.client_id];
      const lang = (client && client.written_language) || 'es';
      let instructions = 'Revisar y contactar con el cliente.';
      if (lang === 'es') {
        instructions = 'Borrador en es para revisar y enviar al cliente: «' + chaseTemplate(item.title, item.matter_number) + '»';
      } else {
        try {
          const res = await svc.integrations.Core.InvokeLLM({
            prompt: 'Traduce al idioma ' + lang + ' (código BCP 47) este mensaje de un despacho de extranjería al cliente. Devuelve solo la traducción fiel y natural:\n\n' + chaseTemplate(item.title, item.matter_number),
            response_json_schema: {
              type: 'object',
              properties: { translation: { type: 'string' } },
              required: ['translation'],
            },
          });
          const draft = (res && res.translation) || '';
          if (draft) instructions = 'Borrador en ' + lang + ' para revisar y enviar al cliente: «' + draft + '»';
        } catch (e) {
          // keep default instructions — human will chase
        }
      }
      addTask({
        title: 'Documento pendiente' + (d < 0 ? (' (venció hace ' + (-d) + ' día/s)') : ' (vence en <7 días)') + ': ' + item.title,
        matter_id: item.matter_id, client_id: item.client_id, matter_number: item.matter_number,
        owner: '', due_date: today, priority: d < 0 ? 'high' : 'medium',
        task_type: 'client_document', instructions,
      }, 'checklist|' + item.id + '|' + bucket);
    }

    // 4. Unpaid invoices: overdue and due within 7 days
    for (const inv of invoices) {
      if (!['sent', 'overdue'].includes(inv.status)) continue;
      const d = daysUntil(inv.due_date);
      if (d == null) continue;
      if (d < 0) {
        addTask({
          title: 'Factura vencida: ' + inv.number + ' — ' + inv.client_name,
          client_id: inv.client_id, owner: '', due_date: today, priority: 'high', task_type: 'payment',
          instructions: 'Gestionar el cobro pendiente y recordar al cliente desde el portal.',
        }, 'invoice|' + inv.id + '|overdue');
      } else if (d <= 7) {
        addTask({
          title: 'Factura vence en ' + d + ' día/s: ' + inv.number + ' — ' + inv.client_name,
          client_id: inv.client_id, owner: '', due_date: today, priority: 'medium', task_type: 'payment',
          instructions: 'Recordar el pago antes del vencimiento.',
        }, 'invoice|' + inv.id + '|due_soon');
      }
    }

    // 5. Expiring permits and passports
    for (const c of clients) {
      if (c.status === 'archived') continue;
      const pd = daysUntil(c.permit_expiry);
      if (pd != null && pd >= 0 && pd <= 60) {
        const bucket = pd <= 30 ? '30' : '60';
        addTask({
          title: 'Permiso de residencia de ' + c.legal_name + ' caduca en ' + pd + ' días',
          client_id: c.id, owner: c.assigned_caseworker || '', due_date: today,
          priority: pd <= 30 ? 'high' : 'medium', task_type: 'permit_expiry',
          instructions: 'Evaluar renovación y abrir expediente si procede.',
        }, 'permit|' + c.id + '|' + bucket);
      }
      const ppd = daysUntil(c.passport_expiry);
      if (ppd != null && ppd >= 0 && ppd <= 30) {
        addTask({
          title: 'Pasaporte de ' + c.legal_name + ' caduca en ' + ppd + ' días',
          client_id: c.id, owner: c.assigned_caseworker || '', due_date: today,
          priority: ppd <= 7 ? 'high' : 'medium', task_type: 'passport_expiry',
          instructions: 'Pedir al cliente el pasaporte renovado para el expediente.',
        }, 'passport|' + c.id + '|' + (ppd <= 7 ? '7' : '30'));
      }
    }

    if (toCreate.length) await svc.entities.Task.bulkCreate(toCreate);
    const summary = { created: toCreate.length, scan_date: today };
    console.log('dailyReminderScan result: ' + JSON.stringify(summary));
    if (toCreate.length) console.log('Created: ' + toCreate.map((t) => t.title).join(' | '));
    return Response.json(summary);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}