import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import prisma from "@/lib/prisma";
import { providerRegisterSchema } from "@/features/auth/schemas/auth.schema";
import { signToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = providerRegisterSchema.parse(body);

    // Vérification de l'unicité
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: validated.phone },
          ...(validated.email ? [{ email: validated.email }] : []),
        ],
      },
    });

    if (existing) {
      const isPhone = existing.phone === validated.phone;
      return NextResponse.json(
        {
          success: false,
          message: isPhone
            ? "Ce numéro de téléphone est déjà utilisé."
            : "Cette adresse email est déjà utilisée.",
        },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(validated.password, 12);

    // Transaction atomique pour User + Profile + 1er Service
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          phone: validated.phone,
          email: validated.email || null,
          passwordHash,
          role: "prestataire",
        },
      });

      const newProfile = await tx.profile.create({
        data: {
          userId: newUser.id,
          nom: validated.nom,
          prenom: validated.prenom,
          commune: validated.commune,
          quartier: validated.quartier || null,
          bio: validated.bio || null,
          competences: JSON.stringify(validated.competences),
          photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
          whatsappNumber: validated.phone,
          callNumber: validated.phone,
          disponible: true,
          estVerifie: false, // Réservé à l'administrateur
          kycStatus: "EN_ATTENTE",
          services: {
            create: [
              {
                nom: validated.specialite,
                categorie: validated.specialite,
                prixIndicatif: validated.prixIndicatif,
                description: validated.bio || "Service proposé par le prestataire",
              },
            ],
          },
        },
      });

      return { user: newUser, profile: newProfile };
    });

    // Génération du token de session et cookie HttpOnly
    const token = signToken({
      id: result.user.id,
      role: "prestataire",
      phone: result.user.phone,
      nom: result.profile.nom,
      prenom: result.profile.prenom,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Compte prestataire créé avec succès.",
        data: {
          id: result.user.id,
          prenom: result.profile.prenom,
          nom: result.profile.nom,
          role: "prestataire",
        },
      },
      { status: 201 }
    );

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 jours
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

    console.error("[REGISTER_PROVIDER_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Une erreur est survenue lors de la création de votre compte." },
      { status: 500 }
    );
  }
}
