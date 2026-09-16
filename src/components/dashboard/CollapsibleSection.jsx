import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export default function CollapsibleSection({
  icon: Icon, iconClass, title, count, titleExtra, className, contentClass, children, to,
}) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const go = (e) => {
    if (!to) return;
    if (e?.target?.closest?.("a, button, input, select, textarea")) return;
    navigate(to);
  };

  if (!isMobile) {
    return (
      <Card
        className={cn("card-soft", to && "cursor-pointer hover:shadow-md hover:bg-secondary/30 transition-shadow", className)}
        onClick={go}
        role={to ? "link" : undefined}
        tabIndex={to ? 0 : undefined}
        onKeyDown={to ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(to); } } : undefined}
      >
        <CardHeader className="pb-2">
          <CardTitle className="flex flex-wrap items-center gap-2 text-base min-w-0">
            <Icon className={cn("w-4 h-4 shrink-0", iconClass)} /> {title} ({count}){titleExtra}
          </CardTitle>
        </CardHeader>
        <CardContent className={contentClass}>{children}</CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("card-soft min-w-0", to && "hover:shadow-md")}>
      <div className="w-full min-h-[44px] flex items-center gap-2 px-4 py-3">
        <button
          type="button"
          className="flex-1 min-w-0 flex items-center gap-2 text-start"
          onClick={() => (to ? navigate(to) : setOpen(!open))}
        >
          <Icon className={cn("w-4 h-4 shrink-0", iconClass)} />
          <span className="text-sm font-medium break-words min-w-0">{title}</span>
          <span className="shrink-0 font-heading font-bold text-primary">{count}</span>
        </button>
        <button type="button" aria-expanded={open} aria-label={title} onClick={() => setOpen(!open)} className="p-1 shrink-0">
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
      </div>
      {open && <CardContent className={cn("pt-0", contentClass || "space-y-2")}>{children}</CardContent>}
    </Card>
  );
}
