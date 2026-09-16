import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseCompetences } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const profile = await prisma.profile.findUnique({
      where: { userId: id },
      include: {
        services: true,
        reviews: {
          include: {
            client: {
              include: {
                profile: {
                  select: { nom: true, prenom: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Prestataire introuvable." },
        { status: 404 }
      );
    }

    const competences = parseCompetences(profile.competences);

    const formatted = {
      id: profile.userId,
      nom: profile.nom,
      prenom: profile.prenom,
      specialite: profile.services[0]?.nom || competences[0] || "Artisan qualifié",
      commune: profile.commune,
      quartier: profile.quartier,
      bio: profile.bio,
      competences,
      prixIndicatif: profile.services[0] ? Number(profile.services[0].prixIndicatif) : 5000,
      photoUrl: profile.photoUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
      whatsappNumber: profile.whatsappNumber || "0700000000",
      callNumber: profile.callNumber || profile.whatsappNumber,
      estVerifie: profile.estVerifie,
      disponible: profile.disponible,
      note: Number(profile.ratingAvg) || 5.0,
      avisCount: profile.reviewsCount || 0,
      services: profile.services.map((s) => ({
        id: s.id,
        nom: s.nom,
        categorie: s.categorie,
        prixIndicatif: Number(s.prixIndicatif),
        description: s.description,
      })),
      reviews: profile.reviews.map((r) => ({
        id: r.id,
        note: r.note,
        commentaire: r.commentaire,
        clientName: `${r.client.profile?.prenom || "Client"} ${r.client.profile?.nom?.charAt(0) || ""}.`,
        createdAt: r.createdAt.toISOString(),
      })),
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
