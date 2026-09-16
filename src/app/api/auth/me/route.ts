import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      phone: true,
      email: true,
      role: true,
      profile: {
        select: {
          nom: true,
          prenom: true,
          commune: true,
          quartier: true,
          bio: true,
          competences: true,
          photoUrl: true,
          disponible: true,
          estVerifie: true,
          kycStatus: true,
          ratingAvg: true,
          reviewsCount: true,
        },
      },
    },
  });

  return NextResponse.json({ user });
}
