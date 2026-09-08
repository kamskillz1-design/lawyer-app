import React from "react";
import { Link } from "react-router-dom";

export default function ClientListTable({ clients, muted = false }) {
  const portal = (c) =>
    c.status === "archived" ? "archivado" : c.portal_user_id ? "✓ activo" : "—";

  return (
    <div className="card-soft hidden md:block overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground border-b">
            <th className="p-3 text-start">Cliente</th><th className="p-3 text-start">Contacto</th>
            <th className="p-3 text-start">Idiomas</th><th className="p-3 text-start">Encargo</th><th className="p-3 text-start">Portal</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id} className={`border-b last:border-0 hover:bg-secondary/50 ${muted ? "opacity-60" : ""}`}>
              <td className="p-3">
                <Link to={`/clients/${c.id}`} className="font-medium hover:text-primary">{c.legal_name}</Link>
                <p className="text-xs text-muted-foreground">NIE: {c.nie_number || "—"}</p>
              </td>
              <td className="p-3 text-xs">{c.phone || "—"}<br />{c.email || "—"}</td>
              <td className="p-3 text-xs">{c.written_language || "es"} / {c.spoken_language || "—"}{c.interpreter_required ? " · intérprete" : ""}</td>
              <td className="p-3 text-xs">{c.engagement_status || "—"}{c.service_package ? ` · ${c.service_package}` : ""}</td>
              <td className="p-3 text-xs">{portal(c)}</td>
            </tr>
          ))}
          {!clients.length && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Sin resultados.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}