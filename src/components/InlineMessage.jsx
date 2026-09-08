import { cn } from "@/lib/utils";

// Muted inline status text — the shared loading / no-access placeholder
// used by data-fetching pages across staff and portal areas.
export default function InlineMessage({ text = "Cargando…", className }) {
  return <p className={cn("text-muted-foreground", className)}>{text}</p>;
}