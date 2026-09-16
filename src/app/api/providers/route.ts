import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseCompetences } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim() || "";
    const commune = searchParams.get("commune")?.trim() || "";
    const categorie = searchParams.get("categorie")?.trim() || "";
    const onlyVerified = searchParams.get("onlyVerified") === "true";

    const whereClause: Record<string, unknown> = {
      user: {
        isActive: true,
        role: "prestataire",
      },
      disponible: true,
    };

    if (onlyVerified) {
      whereClause.estVerifie = true;
    }

    if (commune && commune !== "Toutes les communes") {
      whereClause.commune = {
        equals: commune,
        mode: "insensitive",
      };
    }

    if (query) {
      whereClause.OR = [
        { nom: { contains: query, mode: "insensitive" } },
        { prenom: { contains: query, mode: "insensitive" } },
        { quartier: { contains: query, mode: "insensitive" } },
        { bio: { contains: query, mode: "insensitive" } },
        {
          services: {
            some: {
              OR: [
                { nom: { contains: query, mode: "insensitive" } },
                { categorie: { contains: query, mode: "insensitive" } },
              ],
            },
          },
        },
      ];
    }

    if (categorie) {
      whereClause.services = {
        some: {
          categorie: { contains: categorie, mode: "insensitive" },
        },
      };
    }

    const profiles = await prisma.profile.findMany({
      where: whereClause,
      include: {
        services: {
          take: 3,
        },
      },
      orderBy: [
        { estVerifie: "desc" },
        { ratingAvg: "desc" },
      ],
      take: 50,
    });

    const formatted = profiles.map((p) => {
      const competences = parseCompetences(p.competences);
      return {
        id: p.userId,
        nom: p.nom,
        prenom: p.prenom,
        specialite: p.services[0]?.nom || competences[0] || "Services divers",
        commune: p.commune,
        quartier: p.quartier,
        bio: p.bio,
        competences,
        prixIndicatif: p.services[0] ? Number(p.services[0].prixIndicatif) : 3500,
        photoUrl: p.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
        whatsappNumber: p.whatsappNumber || "0700000000",
        callNumber: p.callNumber || p.whatsappNumber,
        estVerifie: p.estVerifie,
        disponible: p.disponible,
        note: Number(p.ratingAvg) || 4.8,
        avisCount: p.reviewsCount || 10,
      };
    });

    return NextResponse.json({ providers: formatted });
  } catch (error) {
    console.error("[GET_PROVIDERS_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de la récupération des prestataires." },
      { status: 500 }
    );
  }
}
