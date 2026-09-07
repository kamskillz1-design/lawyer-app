import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// Dashboard section card. On phones it renders collapsed (title + count) and
// expands on tap; on tablet/desktop it renders the full card as before.
export default function CollapsibleSection({ icon: Icon, iconClass, title, count, titleExtra, className, contentClass, children }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (!isMobile) {
    return (
      <Card className={cn("card-soft", className)}>
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
    <Card className="card-soft min-w-0">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
        className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-3">
        <Icon className={cn("w-4 h-4 shrink-0", iconClass)} />
        <span className="text-sm font-medium break-words min-w-0 text-start">{title}</span>
        <span className="shrink-0 font-heading font-bold text-primary">{count}</span>
        <ChevronDown className={cn("w-4 h-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <CardContent className={cn("pt-0", contentClass || "space-y-2")}>{children}</CardContent>}
    </Card>
  );
}