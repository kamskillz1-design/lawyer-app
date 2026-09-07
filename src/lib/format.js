import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale";

export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), "d MMM yyyy", { locale: es });
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), "d MMM yyyy · HH:mm", { locale: es });
  } catch {
    return dateStr;
  }
};

export const formatMoney = (amount) =>
  amount == null ? "—" : new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);

export const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  try {
    return differenceInCalendarDays(parseISO(dateStr), new Date());
  } catch {
    return null;
  }
};

export const todayISO = () => format(new Date(), "yyyy-MM-dd");