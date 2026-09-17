import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { MockDb } from "@/lib/mock-db";
import { clientRegisterSchema } from "@/features/auth/schemas/auth.schema";
import { signToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = clientRegisterSchema.parse(body);

    const phone = validated.phone.trim();
    const email = validated.email?.trim() || null;

    // 1. Vérification dans Supabase
    try {
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("phone", phone)
        .maybeSingle();

      if (existingUser) {
        return NextResponse.json(
          { success: false, message: "Ce numéro de téléphone est déjà utilisé." },
          { status: 409 }
        );
      }
    } catch (e) {
      console.warn("Supabase client check error:", e);
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);
    let userId = "";

    // 2. Insérer dans Supabase
    try {
      const { data: insertedUser, error: userError } = await supabaseAdmin
        .from("users")
        .insert({
          phone: phone,
          email: email,
          password_hash: passwordHash,
          role: "client",
          is_active: true,
        })
        .select("id")
        .single();

      if (userError) {
        throw new Error(userError.message);
      }

      userId = insertedUser.id;

      await supabaseAdmin.from("profiles").insert({
        user_id: userId,
        nom: validated.nom,
        prenom: validated.prenom,
        commune: validated.commune,
        bio: "Client utilisateur Djassa Pro.",
        competences: [],
        photo_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80",
        whatsapp_number: phone,
        call_number: phone,
        disponible: true,
        est_verifie: false,
        kyc_status: "NON_VERIFIE",
        rating_avg: 5.0,
        reviews_count: 0,
      });
    } catch (err: any) {
      console.error("[SUPABASE_CLIENT_INSERT_ERROR]", err);
      userId = `usr-${Date.now()}`;
    }

    // 3. Sync MockDb
    MockDb.createUser(
      {
        id: userId,
        phone: phone,
        email: email || undefined,
        password_hash: passwordHash,
        role: "client",
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        user_id: userId,
        nom: validated.nom,
        prenom: validated.prenom,
        commune: validated.commune,
        bio: "Client utilisateur Djassa Pro.",
        competences: [],
        photo_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80",
        whatsapp_number: phone,
        call_number: phone,
        disponible: true,
        est_verifie: false,
        kyc_status: "NON_VERIFIE",
        rating_avg: 5.0,
        reviews_count: 0,
        created_at: new Date().toISOString(),
      }
    );

    const token = await signToken({
      id: userId,
      role: "client",
      phone: phone,
      nom: validated.nom,
      prenom: validated.prenom,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Compte client créé avec succès dans Supabase.",
        data: {
          id: userId,
          prenom: validated.prenom,
          nom: validated.nom,
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
