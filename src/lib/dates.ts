import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function nowIso(): string {
  return new Date().toISOString();
}

export function formatDate(iso: string, pattern = "d MMM yyyy"): string {
  try {
    return format(parseISO(iso), pattern, { locale: es });
  } catch {
    return iso;
  }
}

export function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) {
    return `${hours} h`;
  }
  return `${hours} h ${rest} min`;
}
