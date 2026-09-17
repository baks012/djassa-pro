import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { MockDb } from "@/lib/mock-db";
import { loginSchema } from "@/features/auth/schemas/auth.schema";
import { signToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = loginSchema.parse(body);

    const identifier = validated.identifier.trim();
    const phoneNormalized = `+225${identifier.replace(/\D/g, "").slice(-10)}`;

    let user: any = null;
    let profile: any = null;

    // 1. Tenter la recherche dans Supabase
    try {
      const { data: dbUsers, error } = await supabaseAdmin
        .from("users")
        .select("*")
        .or(`email.eq.${identifier},phone.eq.${identifier},phone.eq.${phoneNormalized}`)
        .limit(1);

      if (!error && dbUsers && dbUsers.length > 0) {
        user = dbUsers[0];
        const { data: dbProfile } = await supabaseAdmin
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        profile = dbProfile;
      }
    } catch (e) {
      console.warn("Supabase query fallback to local DB:", e);
    }

    // 2. Fallback MockDb si non trouvé
    if (!user) {
      const mockUser = MockDb.findUserByIdentifier(identifier);
      if (mockUser) {
        user = mockUser;
        profile = MockDb.findProfileByUserId(mockUser.id);
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Numéro de téléphone/email ou mot de passe incorrect." },
        { status: 401 }
      );
    }

    if (user.is_active === false) {
      return NextResponse.json(
        { success: false, message: "Ce compte a été suspendu ou désactivé par l'administrateur." },
        { status: 401 }
      );
    }

    // Vérification du mot de passe
    const isValidPassword = await bcrypt.compare(validated.password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: "Numéro de téléphone/email ou mot de passe incorrect." },
        { status: 401 }
      );
    }

    const token = await signToken({
      id: user.id,
      role: user.role,
      phone: user.phone,
      nom: profile?.nom,
      prenom: profile?.prenom,
    });

    const response = NextResponse.json({
      success: true,
      message: "Connexion réussie.",
      data: {
        id: user.id,
        role: user.role,
        prenom: profile?.prenom || "",
        nom: profile?.nom || "",
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
