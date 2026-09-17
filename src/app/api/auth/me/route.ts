import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { MockDb } from "@/lib/mock-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  let user: any = null;
  let profile: any = null;

  // 1. Chercher dans Supabase
  try {
    const { data: dbUser } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", session.id)
      .maybeSingle();

    if (dbUser) {
      user = dbUser;
      const { data: dbProfile } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("user_id", session.id)
        .maybeSingle();
      profile = dbProfile;
    }
  } catch (e) {
    console.warn("Supabase me error:", e);
  }

  // 2. Fallback MockDb
  if (!user) {
    user = MockDb.findUserById(session.id);
    if (user) {
      profile = MockDb.findProfileByUserId(user.id);
    }
  }

  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const formattedUser = {
    id: user.id,
    phone: user.phone,
    email: user.email,
    role: user.role,
    profile: profile
      ? {
          nom: profile.nom,
          prenom: profile.prenom,
          commune: profile.commune,
          quartier: profile.quartier,
          bio: profile.bio,
          competences: profile.competences || [],
          photoUrl: profile.photo_url,
          whatsappNumber: profile.whatsapp_number,
          callNumber: profile.call_number,
          disponible: profile.disponible,
          estVerifie: profile.est_verifie,
          kycStatus: profile.kyc_status,
          ratingAvg: Number(profile.rating_avg) || 5.0,
          reviewsCount: Number(profile.reviews_count) || 0,
        }
      : null,
  };

  return NextResponse.json({ user: formattedUser });
}
