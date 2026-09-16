import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import prisma from "@/lib/prisma";
import { clientRegisterSchema } from "@/features/auth/schemas/auth.schema";
import { signToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = clientRegisterSchema.parse(body);

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: validated.phone },
          ...(validated.email ? [{ email: validated.email }] : []),
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Ce numéro de téléphone ou cet email est déjà utilisé." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(validated.password, 12);

    const newUser = await prisma.user.create({
      data: {
        phone: validated.phone,
        email: validated.email || null,
        passwordHash,
        role: "client",
        profile: {
          create: {
            nom: validated.nom,
            prenom: validated.prenom,
            commune: validated.commune,
            disponible: true,
            estVerifie: false,
          },
        },
      },
      include: { profile: true },
    });

    const token = signToken({
      id: newUser.id,
      role: "client",
      phone: newUser.phone,
      nom: newUser.profile?.nom,
      prenom: newUser.profile?.prenom,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Compte client créé avec succès.",
        data: {
          id: newUser.id,
          prenom: newUser.profile?.prenom,
          nom: newUser.profile?.nom,
          role: "client",
        },
      },
      { status: 201 }
    );

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
        {
          success: false,
          message: "Données d'inscription invalides.",
          errors: error.errors.map((e) => ({ champ: e.path.join("."), message: e.message })),
        },
        { status: 400 }
      );
    }

    console.error("[REGISTER_CLIENT_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Une erreur est survenue lors de la création de votre compte." },
      { status: 500 }
    );
  }
}
