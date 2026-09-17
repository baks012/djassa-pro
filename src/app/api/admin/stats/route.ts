import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

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

    const [{ data: users }, { data: profiles }, { data: kycDocs }, { data: services }] =
      await Promise.all([
        supabaseAdmin.from("users").select("id, phone, email, role, is_active, created_at"),
        supabaseAdmin.from("profiles").select("*"),
        supabaseAdmin.from("kyc_documents").select("*"),
        supabaseAdmin.from("services").select("*"),
      ]);

    const userList = users || [];
    const profileList = profiles || [];
    const kycList = kycDocs || [];
    const servicesList = services || [];

    const providerProfiles = profileList.filter((p) => {
      const u = userList.find((user) => user.id === p.user_id);
      return u?.role === "prestataire" || (!u && p.competences && p.competences.length > 0);
    });

    const providers = providerProfiles.map((p) => {
      const u = userList.find((user) => user.id === p.user_id);
      const kyc = kycList.find((k) => k.provider_id === p.user_id);
      const pServices = servicesList.filter((s) => s.provider_id === p.user_id);
      const isActive = u?.is_active ?? true;

      return {
        id: p.user_id,
        nom: p.nom,
        prenom: p.prenom,
        phone: u?.phone || p.call_number || p.whatsapp_number || "",
        email: u?.email || "",
        commune: p.commune,
        quartier: p.quartier,
        specialite: pServices[0]?.nom || p.competences?.[0] || "Artisan",
        disponible: p.disponible,
        estVerifie: p.est_verifie,
        kycStatus: p.kyc_status || (p.est_verifie ? "VERIFIE" : "NON_VERIFIE"),
        isActive: isActive,
        motifRejet: kyc?.motif_rejet,
        documentUrl: kyc?.document_url,
        typePiece: kyc?.type_piece || "CNI",
        createdAt: p.created_at,
      };
    });

    const totalUsers = userList.length;
    const totalProviders = providers.length;
    const verifiedProviders = providers.filter((p) => p.estVerifie && p.isActive).length;
    const pendingKyc = providers.filter((p) => p.kycStatus === "EN_ATTENTE" && p.isActive).length;
    const rejectedProviders = providers.filter((p) => !p.isActive || p.kycStatus === "REJETE").length;

    return NextResponse.json({
      stats: {
        totalUsers,
        totalProviders,
        verifiedProviders,
        pendingKyc,
        rejectedProviders,
      },
      providers,
    });
  } catch (error) {
    console.error("[ADMIN_STATS_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur lors de la récupération des stats." },
      { status: 500 }
    );
  }
}
