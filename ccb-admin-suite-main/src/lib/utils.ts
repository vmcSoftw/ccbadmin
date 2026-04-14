import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata hora para formato 24 horas (HH:mm)
 * @param horario - String no formato "HH:mm" ou "H:mm"
 * @returns String formatada como "HH:mm"
 */
export function formatarHora24(horario: string): string {
  if (!horario) return '';
  
  // Remove AM/PM se existir
  const hora = horario.replace(/\s*(AM|PM|am|pm)\s*$/i, '').trim();
  
  // Divide hora e minutos
  const [h, m] = hora.split(':');
  
  if (!h || !m) return horario;
  
  const horas = parseInt(h, 10);
  const minutos = parseInt(m, 10);
  
  // Formata com zero à esquerda
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

/**
 * Valida se uma hora está no formato 24 horas
 * @param horario - String a validar
 * @returns boolean - true se válido
 */
export function validarHora24(horario: string): boolean {
  const regex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(horario);
}
