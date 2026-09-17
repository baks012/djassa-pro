import { NextResponse } from "next/server";
import { MockDb } from "@/lib/mock-db";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "prestataire" && session.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Accès réservé aux prestataires." },
        { status: 401 }
      );
    }

    // Tenter de récupérer depuis Supabase
    try {
      const [{ data: profile }, { data: services }, { data: kycDocs }] = await Promise.all([
        supabaseAdmin.from("profiles").select("*").eq("user_id", session.id).single(),
        supabaseAdmin.from("services").select("*").eq("provider_id", session.id),
        supabaseAdmin.from("kyc_documents").select("*").eq("provider_id", session.id),
      ]);

      if (profile) {
        const formattedProfile = {
          ...profile,
          userId: profile.user_id,
          photoUrl: profile.photo_url,
          whatsappNumber: profile.whatsapp_number,
          callNumber: profile.call_number,
          estVerifie: profile.est_verifie,
          kycStatus: profile.kyc_status,
          ratingAvg: Number(profile.rating_avg) || 5.0,
          reviewsCount: profile.reviews_count || 0,
          kycDocuments: (kycDocs || []).map((k) => ({
            id: k.id,
            typePiece: k.type_piece,
            numeroPiece: k.numero_piece,
            documentUrl: k.document_url,
            statut: k.statut,
            motifRejet: k.motif_rejet,
            createdAt: k.created_at,
          })),
          services: (services || []).map((s) => ({
            id: s.id,
            nom: s.nom,
            categorie: s.categorie,
            prixIndicatif: Number(s.prix_indicatif),
            description: s.description,
          })),
        };

        return NextResponse.json({ success: true, profile: formattedProfile });
      }
    } catch (dbErr) {
      console.warn("[GET_PROFILE] Supabase fallback to MockDb:", dbErr);
    }

    // Fallback MockDb
    const profile = MockDb.findProfileByUserId(session.id);
    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Profil introuvable." },
        { status: 404 }
      );
    }

    const services = MockDb.getServicesByProviderId(session.id);
    const kycDocs = MockDb.getKycDocuments().filter((k) => k.provider_id === session.id);

    const formattedProfile = {
      ...profile,
      userId: profile.user_id,
      photoUrl: profile.photo_url,
      whatsappNumber: profile.whatsapp_number,
      callNumber: profile.call_number,
      estVerifie: profile.est_verifie,
      kycStatus: profile.kyc_status,
      ratingAvg: profile.rating_avg,
      reviewsCount: profile.reviews_count,
      kycDocuments: kycDocs.map((k) => ({
        id: k.id,
        typePiece: k.type_piece,
        numeroPiece: k.numero_piece,
        documentUrl: k.document_url,
        statut: k.statut,
        motifRejet: k.motif_rejet,
        createdAt: k.created_at,
      })),
      services: services.map((s) => ({
        id: s.id,
        nom: s.nom,
        categorie: s.categorie,
        prixIndicatif: s.prix_indicatif,
        description: s.description,
      })),
    };

    return NextResponse.json({ success: true, profile: formattedProfile });
  } catch (error) {
    console.error("[GET_PROVIDER_PROFILE_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur lors de la récupération du profil." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "prestataire" && session.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Accès non autorisé." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { disponible, bio, commune, quartier, whatsappNumber, callNumber, documentUrl, typePiece, numeroPiece } = body;

    const updates: Record<string, unknown> = {};

    if (typeof disponible === "boolean") updates.disponible = disponible;
    if (typeof bio === "string") updates.bio = bio.trim();
    if (typeof commune === "string" && commune.trim()) updates.commune = commune.trim();
    if (typeof quartier === "string") updates.quartier = quartier.trim() || null;
    if (typeof whatsappNumber === "string" && whatsappNumber.trim()) updates.whatsapp_number = whatsappNumber.trim();
    if (typeof callNumber === "string") updates.call_number = callNumber.trim() || null;

    if (documentUrl) {
      updates.kyc_status = "EN_ATTENTE";
      updates.est_verifie = false;
    }

    // Mettre à jour Supabase
    try {
      if (Object.keys(updates).length > 0) {
        await supabaseAdmin.from("profiles").update(updates).eq("user_id", session.id);
      }

      if (documentUrl) {
        await supabaseAdmin.from("kyc_documents").insert({
          provider_id: session.id,
          type_piece: typePiece || "CNI",
          numero_piece: numeroPiece || null,
          document_url: documentUrl,
          statut: "EN_ATTENTE",
        });
      }
    } catch (err) {
      console.warn("[PATCH_PROFILE] Supabase update warning:", err);
    }

    // Mettre à jour MockDb
    if (documentUrl) {
      MockDb.addKycDocument({
        id: `k-${Date.now()}`,
        provider_id: session.id,
        type_piece: typePiece || "CNI",
        numero_piece: numeroPiece || undefined,
        document_url: documentUrl,
        statut: "EN_ATTENTE",
        created_at: new Date().toISOString(),
      });
    }

    const updatedProfile = MockDb.updateProfile(session.id, updates as any);

    const formattedProfile = updatedProfile
      ? {
          ...updatedProfile,
          userId: updatedProfile.user_id,
          photoUrl: updatedProfile.photo_url,
          whatsappNumber: updatedProfile.whatsapp_number,
          callNumber: updatedProfile.call_number,
          estVerifie: updatedProfile.est_verifie,
          kycStatus: updatedProfile.kyc_status,
          ratingAvg: updatedProfile.rating_avg,
          reviewsCount: updatedProfile.reviews_count,
        }
      : null;

    return NextResponse.json({
      success: true,
      message: "Profil mis à jour avec succès.",
      profile: formattedProfile,
    });
  } catch (error) {
    console.error("[PATCH_PROVIDER_PROFILE_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur lors de la mise à jour." },
      { status: 500 }
    );
  }
}
