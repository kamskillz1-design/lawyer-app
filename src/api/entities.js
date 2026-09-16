import { supabase } from "@/api/supabaseClient";

const SORT_COLUMNS = {
  created_date: "created_at",
  updated_date: "updated_at",
  created_at: "created_at",
  updated_at: "updated_at",
};

function mapRow(row) {
  if (!row || typeof row !== "object") return row;
  const out = { ...row };
  if (out.created_at != null && out.created_date == null) out.created_date = out.created_at;
  if (out.updated_at != null && out.updated_date == null) out.updated_date = out.updated_at;
  return out;
}

function mapRows(rows) {
  return (rows || []).map(mapRow);
}

function parseSort(sort) {
  if (!sort || typeof sort !== "string") return null;
  const desc = sort.startsWith("-");
  const key = desc ? sort.slice(1) : sort;
  const column = SORT_COLUMNS[key] || key;
  return { column, ascending: !desc };
}

function applyFilters(query, filters) {
  if (!filters || typeof filters !== "object") return query;
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    query = query.eq(key, value);
  }
  return query;
}

function throwIf(error) {
  if (error) throw error;
}

function sanitizeBody(payload) {
  const body = { ...payload };
  delete body.id;
  delete body.created_date;
  delete body.updated_date;
  delete body.created_at;
  delete body.updated_at;
  for (const [key, value] of Object.entries(body)) {
    if (value === "") body[key] = null;
  }
  return body;
}

export function createTableApi(table) {
  return {
    async list(sort) {
      let q = supabase.from(table).select("*");
      const s = parseSort(sort);
      if (s) q = q.order(s.column, { ascending: s.ascending });
      const { data, error } = await q;
      throwIf(error);
      return mapRows(data);
    },
    async filter(filters, sort) {
      let q = applyFilters(supabase.from(table).select("*"), filters);
      const s = parseSort(sort);
      if (s) q = q.order(s.column, { ascending: s.ascending });
      const { data, error } = await q;
      throwIf(error);
      return mapRows(data);
    },
    async get(id) {
      const { data, error } = await supabase.from(table).select("*").eq("id", id).single();
      throwIf(error);
      return mapRow(data);
    },
    async create(payload) {
      const { data, error } = await supabase.from(table).insert(sanitizeBody(payload)).select("*").single();
      throwIf(error);
      return mapRow(data);
    },
    async bulkCreate(rows) {
      const list = (rows || []).map(sanitizeBody);
      if (!list.length) return [];
      const { data, error } = await supabase.from(table).insert(list).select("*");
      throwIf(error);
      return mapRows(data);
    },
    async update(id, payload) {
      const body = sanitizeBody(payload);
      delete body.id;
      const { data, error } = await supabase.from(table).update(body).eq("id", id).select("*").single();
      throwIf(error);
      return mapRow(data);
    },
    async delete(id) {
      const { error } = await supabase.from(table).delete().eq("id", id);
      throwIf(error);
      return { id };
    },
    async deleteMany(filters) {
      let q = applyFilters(supabase.from(table).delete(), filters);
      const { error } = await q;
      throwIf(error);
      return { ok: true };
    },
    async bulkUpdate(updates) {
      const results = [];
      for (const row of updates || []) {
        if (!row?.id) continue;
        results.push(await this.update(row.id, row));
      }
      return results;
    },
    async updateMany(filters, patch) {
      const body = sanitizeBody(patch || {});
      if (body.$unset && typeof body.$unset === "object") {
        Object.keys(body.$unset).forEach((key) => {
          body[key] = null;
        });
        delete body.$unset;
      }
      delete body.id;
      let q = applyFilters(supabase.from(table).update(body), filters);
      const { error } = await q;
      throwIf(error);
      return { ok: true };
    },
  };
}

export const entities = {
  Client: createTableApi("clients"),
  Matter: createTableApi("matters"),
  ChecklistItem: createTableApi("checklist_items"),
  Document: createTableApi("documents"),
  Communication: createTableApi("communications"),
  Appointment: createTableApi("appointments"),
  Task: createTableApi("tasks"),
  Invoice: createTableApi("invoices"),
  Lead: createTableApi("leads"),
  AuditLog: createTableApi("audit_logs"),
  UiDictCache: createTableApi("ui_dict_cache"),
  User: createTableApi("profiles"),
};
