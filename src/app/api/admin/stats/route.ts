import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Accès refusé. Administrateur requis." },
        { status: 403 }
      );
    }

    const [totalUsers, totalProviders, verifiedProviders, pendingKyc, providersList] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "prestataire" } }),
        prisma.profile.count({ where: { estVerifie: true } }),
        prisma.kycDocument.count({ where: { statut: "EN_ATTENTE" } }),
        prisma.profile.findMany({
          include: {
            user: {
              select: { phone: true, email: true, createdAt: true },
            },
            services: true,
            kycDocuments: true,
          },
          orderBy: { updatedAt: "desc" },
          take: 30,
        }),
      ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalProviders,
        verifiedProviders,
        pendingKyc,
      },
      providers: providersList.map((p) => ({
        id: p.userId,
        nom: p.nom,
        prenom: p.prenom,
        phone: p.user.phone,
        email: p.user.email,
        commune: p.commune,
        quartier: p.quartier,
        specialite: p.services[0]?.nom || p.competences[0] || "Non spécifié",
        disponible: p.disponible,
        estVerifie: p.estVerifie,
        kycStatus: p.kycStatus,
        documentUrl: p.kycDocuments[0]?.documentUrl || null,
        typePiece: p.kycDocuments[0]?.typePiece || "CNI",
        createdAt: p.user.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[ADMIN_STATS_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur lors de la récupération des stats." },
      { status: 500 }
    );
  }
}
