import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function RoleRouter() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    base44.auth.me()
      .then((me) => {
        if (cancelled) return;
        if (me && me.role === "admin") navigate("/dashboard", { replace: true });
        else navigate("/portal", { replace: true });
      })
      .catch(() => { if (!cancelled) navigate("/portal", { replace: true }); });
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );
}