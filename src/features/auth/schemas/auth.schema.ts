import { z } from "zod";

// Regex officielle pour le plan de numérotation ivoirien (10 chiffres, Moov: 01, MTN: 05, Orange: 07)
export const ivorianPhoneRegex = /^(?:\+225|00225)?\s*(01|05|07)\d{8}$/;

export const phoneSchema = z
  .string({ required_error: "Le numéro de téléphone est obligatoire." })
  .trim()
  .regex(ivorianPhoneRegex, {
    message: "Numéro ivoirien invalide. Il doit comporter 10 chiffres et commencer par 01, 05 ou 07.",
  })
  .transform((val) => {
    const digits = val.replace(/\D/g, "");
    if (digits.startsWith("225") && digits.length === 13) {
      return `+${digits}`;
    }
    return `+225${digits.slice(-10)}`;
  });

export const passwordSchema = z
  .string({ required_error: "Le mot de passe est obligatoire." })
  .min(8, "Le mot de passe doit comporter au moins 8 caractères.")
  .max(72, "Le mot de passe ne peut pas dépasser 72 caractères.");

export const providerRegisterSchema = z.object({
  nom: z.string().trim().min(2, "Le nom doit comporter au moins 2 caractères.").max(80),
  prenom: z.string().trim().min(2, "Le prénom doit comporter au moins 2 caractères.").max(80),
  phone: phoneSchema,
  email: z.string().trim().email("Adresse email invalide.").optional().or(z.literal("")),
  password: passwordSchema,
  commune: z.string().min(2, "Veuillez sélectionner votre commune."),
  quartier: z.string().trim().max(100).optional(),
  specialite: z.string().trim().min(3, "Indiquez votre métier principal (ex: Plomberie, Coiffure).").max(80),
  competences: z.array(z.string()).min(1, "Ajoutez au moins une compétence clé."),
  prixIndicatif: z.coerce.number().min(500, "Le tarif indicatif minimum est de 500 FCFA."),
  bio: z.string().trim().max(600).optional(),
});

export const clientRegisterSchema = z.object({
  nom: z.string().trim().min(2, "Le nom doit comporter au moins 2 caractères.").max(80),
  prenom: z.string().trim().min(2, "Le prénom doit comporter au moins 2 caractères.").max(80),
  phone: phoneSchema,
  email: z.string().trim().email("Adresse email invalide.").optional().or(z.literal("")),
  password: passwordSchema,
  commune: z.string().min(2, "Veuillez sélectionner votre commune."),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(4, "Veuillez saisir votre numéro de téléphone ou email."),
  password: z.string().min(1, "Le mot de passe est requis."),
});

export type ProviderRegisterInput = z.infer<typeof providerRegisterSchema>;
export type ClientRegisterInput = z.infer<typeof clientRegisterSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
