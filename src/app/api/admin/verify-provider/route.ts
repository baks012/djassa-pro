import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Accès refusé. Privilèges administrateur requis." },
        { status: 403 }
      );
    }

    const { providerId, estVerifie, motifRejet } = await request.json();

    if (!providerId || typeof estVerifie !== "boolean") {
      return NextResponse.json(
        { success: false, message: "Paramètres invalides." },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const profile = await tx.profile.update({
        where: { userId: providerId },
        data: {
          estVerifie,
          kycStatus: estVerifie ? "VERIFIE" : "REJETE",
        },
      });

      // Mettre à jour le statut du document KYC
      await tx.kycDocument.updateMany({
        where: { providerId },
        data: {
          statut: estVerifie ? "VERIFIE" : "REJETE",
          motifRejet: estVerifie ? null : motifRejet || "Document non conforme ou illisible",
          reviewedAt: new Date(),
        },
      });

      // Journal d'audit obligatoire en cybersécurité
      await tx.adminAuditLog.create({
        data: {
          adminId: session.id,
          action: estVerifie ? "VALIDATE_PROVIDER_BADGE" : "REJECT_PROVIDER_BADGE",
          targetId: providerId,
          details: JSON.stringify({ estVerifie, motifRejet }),
        },
      });

      return profile;
    });

    return NextResponse.json({
      success: true,
      message: estVerifie
        ? "Badge Vérifié attribué avec succès."
        : "Vérification rejetée.",
      profile: updated,
    });
  } catch (error) {
    console.error("[ADMIN_VERIFY_PROVIDER_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de la mise à jour du statut." },
      { status: 500 }
    );
  }
}
