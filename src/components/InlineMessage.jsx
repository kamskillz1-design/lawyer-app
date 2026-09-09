import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

// Muted inline status text — the shared loading / no-access placeholder
// used by data-fetching pages across staff and portal areas.
export default function InlineMessage({ text, className }) {
  const { t } = useI18n();
  return <p className={cn("text-muted-foreground", className)}>{text || t("loading")}</p>;
}