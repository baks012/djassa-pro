import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import prisma from "@/lib/prisma";
import { loginSchema } from "@/features/auth/schemas/auth.schema";
import { signToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = loginSchema.parse(body);

    const identifier = validated.identifier.trim();
    
    // Recherche par téléphone (normalisé ou non) ou email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: identifier },
          { phone: `+225${identifier.replace(/\D/g, "").slice(-10)}` },
          { email: identifier.toLowerCase() },
        ],
      },
      include: { profile: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: "Numéro de téléphone/email ou mot de passe incorrect." },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: "Numéro de téléphone/email ou mot de passe incorrect." },
        { status: 401 }
      );
    }

    const token = signToken({
      id: user.id,
      role: user.role as "client" | "prestataire" | "admin",
      phone: user.phone,
      nom: user.profile?.nom,
      prenom: user.profile?.prenom,
    });

    const response = NextResponse.json({
      success: true,
      message: "Connexion réussie.",
      data: {
        id: user.id,
        role: user.role,
        prenom: user.profile?.prenom || "",
        nom: user.profile?.nom || "",
        phone: user.phone,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, message: "Veuillez renseigner vos identifiants." },
        { status: 400 }
      );
    }

    console.error("[LOGIN_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Une erreur technique est survenue." },
      { status: 500 }
    );
  }
}
