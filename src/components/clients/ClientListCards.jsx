import React from "react";
import { Link } from "react-router-dom";

export default function ClientListCards({ clients, muted = false }) {
  const portal = (c) =>
    c.status === "archived" ? "archivado" : c.portal_user_id ? "✓ activo" : "—";

  return (
    <div className="md:hidden space-y-2">
      {clients.map((c) => (
        <div key={c.id} className={`card-soft p-4 space-y-1 ${muted ? "opacity-60" : ""}`}>
          <Link to={`/clients/${c.id}`} className="font-medium hover:text-primary break-words">{c.legal_name}</Link>
          <p className="text-xs text-muted-foreground break-words">NIE: {c.nie_number || "—"} · {c.phone || "—"} · {c.email || "—"}</p>
          <p className="text-xs text-muted-foreground break-words">{c.written_language || "es"} / {c.spoken_language || "—"}{c.interpreter_required ? " · intérprete" : ""}</p>
          <p className="text-xs text-muted-foreground break-words">{c.engagement_status || "—"}{c.service_package ? ` · ${c.service_package}` : ""} · Portal: {portal(c)}</p>
        </div>
      ))}
      {!clients.length && <p className="text-sm text-muted-foreground p-4">Sin resultados.</p>}
    </div>
  );
}