import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "djassa_pro_fallback_secret_key_ci_2026";
export const AUTH_COOKIE_NAME = "djassa_token";

export interface SessionUser {
  id: string;
  role: "client" | "prestataire" | "admin";
  phone: string;
  nom?: string;
  prenom?: string;
}

export function signToken(user: SessionUser): string {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      phone: user.phone,
      nom: user.nom,
      prenom: user.prenom,
    },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

export function verifyToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
