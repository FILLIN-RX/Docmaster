import { z } from "zod";

const namePattern = /^[\p{L}'][\p{L}' -]*$/u;
const pseudoPattern = /^[a-zA-Z0-9_]+$/;

export function parseIsoDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function ageFromDate(date: Date): number {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;
  return age;
}

export const registerSchema = z
  .object({
    nom: z
      .string()
      .trim()
      .min(2, "Le nom doit contenir au moins 2 caractères")
      .regex(namePattern, "Le nom contient des caractères invalides"),
    prenom: z
      .string()
      .trim()
      .min(2, "Le prénom doit contenir au moins 2 caractères")
      .regex(namePattern, "Le prénom contient des caractères invalides"),
    dateNaissance: z
      .string()
      .min(1, "Sélectionnez votre date de naissance")
      .refine((v) => {
        const d = parseIsoDate(v);
        return !!d && d <= new Date();
      }, "Date de naissance invalide")
      .refine((v) => {
        const d = parseIsoDate(v);
        return !d || ageFromDate(d) >= 16;
      }, "Vous devez avoir au moins 16 ans"),
    email: z.string().trim().min(1, "L'adresse e-mail est requise").email("Adresse e-mail invalide"),
    telephone: z
      .string()
      .trim()
      .min(8, "Numéro de téléphone invalide")
      .max(15, "Numéro de téléphone invalide"),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .refine(
        (pw) =>
          (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) || /\d/.test(pw) || /[^a-zA-Z0-9]/.test(pw),
        "Mot de passe trop faible : ajoutez une majuscule, un chiffre ou un caractère spécial"
      ),
    passwordConfirm: z.string().min(1, "Confirmez votre mot de passe"),
    pseudo: z
      .string()
      .trim()
      .min(3, "Le pseudo doit contenir au moins 3 caractères")
      .regex(pseudoPattern, "Lettres, chiffres et underscores uniquement"),
    referral: z.string().trim().optional(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["passwordConfirm"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
export type RegisterFieldName = keyof RegisterFormValues;

export const registerDefaultValues: RegisterFormValues = {
  nom: "",
  prenom: "",
  dateNaissance: "",
  email: "",
  telephone: "",
  password: "",
  passwordConfirm: "",
  pseudo: "",
  referral: "",
};

export const registerStepFields: Record<number, RegisterFieldName[]> = {
  1: ["nom", "prenom"],
  2: ["dateNaissance"],
  3: ["email", "telephone"],
  4: ["password", "passwordConfirm"],
  5: ["pseudo", "referral"],
};
