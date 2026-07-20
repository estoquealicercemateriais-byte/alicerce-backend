import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDate(dateString: string) {
  try {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch (e) {
    return dateString;
  }
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatPhone(phone: string) {
  if (!phone) return phone;
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 12 || cleaned.length === 13) {
    return `+${cleaned.substring(0, 2)} (${cleaned.substring(2, 4)}) ${cleaned.substring(4, 9)}-${cleaned.substring(9)}`;
  }
  return phone;
}
