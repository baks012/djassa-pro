import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFCFA(amount: number | string | { toString: () => string }): string {
  const num = typeof amount === "number" ? amount : Number(amount.toString());
  if (isNaN(num)) return "0 FCFA";
  return `${new Intl.NumberFormat("fr-FR").format(num)} FCFA`;
}

export function normalizeIvorianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("225") && digits.length === 13) {
    return `+${digits}`;
  }
  return `+225${digits.slice(-10)}`;
}

export function buildWhatsAppLink(phone: string, prenom: string, serviceName?: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  const text = serviceName
    ? `Bonjour ${prenom}, j'ai vu votre profil sur Djassa Pro pour votre service "${serviceName}". Êtes-vous disponible ?`
    : `Bonjour ${prenom}, j'ai vu votre profil sur Djassa Pro. J'aimerais avoir des informations sur vos services.`;
  return `https://wa.me/225${cleanPhone.slice(-10)}?text=${encodeURIComponent(text)}`;
}

export function parseCompetences(val: unknown): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return val.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}
