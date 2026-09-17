import { NextResponse } from "next/server";
import { MockDb } from "@/lib/mock-db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const profile = MockDb.findProfileByUserId(id);
    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Prestataire introuvable." },
        { status: 404 }
      );
    }

    const services = MockDb.getServicesByProviderId(id);
    const reviewsData = MockDb.getReviewsByProviderId(id);
    const mainService = services[0];

    const reviews = reviewsData.map((r) => ({
      id: r.id,
      note: r.note,
      commentaire: r.commentaire,
      clientName: `${r.client_prenom || "Client"} ${r.client_nom ? r.client_nom.charAt(0) + "." : ""}`,
      createdAt: r.created_at,
    }));

    const formatted = {
      id: profile.user_id,
      nom: profile.nom,
      prenom: profile.prenom,
      specialite: mainService?.nom || profile.competences[0] || "Artisan qualifié",
      commune: profile.commune,
      quartier: profile.quartier,
      bio: profile.bio,
      competences: profile.competences,
      prixIndicatif: mainService ? Number(mainService.prix_indicatif) : 5000,
      photoUrl: profile.photo_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
      whatsappNumber: profile.whatsapp_number || "0700000000",
      callNumber: profile.call_number || profile.whatsapp_number,
      estVerifie: profile.est_verifie,
      disponible: profile.disponible,
      note: Number(profile.rating_avg) || 5.0,
      avisCount: profile.reviews_count || 0,
      services: services.map((s) => ({
        id: s.id,
        nom: s.nom,
        categorie: s.categorie,
        prixIndicatif: Number(s.prix_indicatif),
        description: s.description,
      })),
      reviews,
    };

    return NextResponse.json({ provider: formatted });
  } catch (error) {
    console.error("[GET_PROVIDER_BY_ID_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Erreur technique lors de la récupération du profil." },
      { status: 500 }
    );
  }
}
