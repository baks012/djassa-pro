import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "djassa_pro_fallback_secret_key_ci_2026";
const encodedKey = new TextEncoder().encode(JWT_SECRET);
export const AUTH_COOKIE_NAME = "djassa_token";

export interface SessionUser {
  id: string;
  role: "client" | "prestataire" | "admin";
  phone: string;
  nom?: string;
  prenom?: string;
}

export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    role: user.role,
    phone: user.phone,
    nom: user.nom,
    prenom: user.prenom,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(encodedKey);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionUser;
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

