// Utilitaires de sécurité et sanitisation de données

export function sanitizeText(input: string): string {
  if (!input) return "";
  return input
    .trim()
    .replace(/[<>]/g, "") // Élimine les balises d'injection HTML directes
    .slice(0, 1000); // Limite de taille
}

export const IVORIAN_PHONE_REGEX = /^(?:\+225|00225)?\s*(01|05|07)\d{8}$/;

export function isValidIvorianPhone(phone: string): boolean {
  return IVORIAN_PHONE_REGEX.test(phone.trim());
}

// Liste officielle des communes d'Abidjan et villes principales
export const COMMUNES_CI = [
  "Abobo",
  "Adjamé",
  "Attécoubé",
  "Bingerville",
  "Cocody",
  "Koumassi",
  "Marcory",
  "Plateau",
  "Port-Bouët",
  "Treichville",
  "Yopougon",
  "Songon",
  "Anyama",
  "Bouaké",
  "Yamoussoukro",
  "San Pédro",
] as const;
