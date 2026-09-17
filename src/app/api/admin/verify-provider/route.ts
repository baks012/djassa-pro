import { NextResponse } from "next/server";
import { MockDb } from "@/lib/mock-db";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Accès refusé. Privilèges administrateur requis." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { providerId, action, estVerifie, motifRejet } = body;

    if (!providerId) {
      return NextResponse.json(
        { success: false, message: "Identifiant du prestataire manquant." },
        { status: 400 }
      );
    }

    let resultStatus = "VERIFIE";
    let message = "";
    const now = new Date().toISOString();

    if (action === "REJECT" || estVerifie === false) {
      const reason = motifRejet?.trim() || "Demande d'inscription ou pièce rejetée par l'administrateur.";
      
      // 1. Mise à jour Supabase
      try {
        const [resUser, resProfile, resKyc] = await Promise.all([
          supabaseAdmin.from("users").update({ is_active: false }).eq("id", providerId),
          supabaseAdmin.from("profiles").update({
            est_verifie: false,
            kyc_status: "REJETE",
            disponible: false,
            updated_at: now,
          }).eq("user_id", providerId),
          supabaseAdmin.from("kyc_documents").update({
            statut: "REJETE",
            motif_rejet: reason,
            reviewed_at: now,
          }).eq("provider_id", providerId),
        ]);

        if (resUser.error) console.error("[SUPABASE_REJECT_USER_ERR]", resUser.error);
        if (resProfile.error) console.error("[SUPABASE_REJECT_PROFILE_ERR]", resProfile.error);
        if (resKyc.error) console.error("[SUPABASE_REJECT_KYC_ERR]", resKyc.error);

        // Audit log
        await supabaseAdmin.from("admin_audit_logs").insert({
          admin_id: session.id,
          action: "REJECT_PROVIDER",
          target_id: providerId,
          details: `Motif de rejet: ${reason}`,
        });
      } catch (err) {
        console.warn("[ADMIN_VERIFY] Supabase reject error:", err);
      }

      // 2. Mise à jour MockDb (résilience)
      MockDb.rejectProvider(providerId, reason);
      resultStatus = "REJETE";
      message = "Demande du prestataire rejetée. Le profil est immédiatement masqué de l'annuaire public.";
    } else if (action === "ACTIVATE") {
      // 1. Mise à jour Supabase
      try {
        const [resUser, resProfile] = await Promise.all([
          supabaseAdmin.from("users").update({ is_active: true }).eq("id", providerId),
          supabaseAdmin.from("profiles").update({
            kyc_status: "NON_VERIFIE",
            disponible: true,
            updated_at: now,
          }).eq("user_id", providerId),
        ]);

        if (resUser.error) console.error("[SUPABASE_ACTIVATE_USER_ERR]", resUser.error);
        if (resProfile.error) console.error("[SUPABASE_ACTIVATE_PROFILE_ERR]", resProfile.error);

        // Audit log
        await supabaseAdmin.from("admin_audit_logs").insert({
          admin_id: session.id,
          action: "ACTIVATE_PROVIDER",
          target_id: providerId,
          details: "Réactivation du compte prestataire par l'administrateur",
        });
      } catch (err) {
        console.warn("[ADMIN_VERIFY] Supabase activate error:", err);
      }

      // 2. Mise à jour MockDb
      MockDb.activateProvider(providerId);
      resultStatus = "NON_VERIFIE";
      message = "Profil prestataire réactivé avec succès.";
    } else {
      // 1. Mise à jour Supabase (Approbation & Badge Vérifié)
      try {
        const [resUser, resProfile, resKyc] = await Promise.all([
          supabaseAdmin.from("users").update({ is_active: true }).eq("id", providerId),
          supabaseAdmin.from("profiles").update({
            est_verifie: true,
            kyc_status: "VERIFIE",
            disponible: true,
            updated_at: now,
          }).eq("user_id", providerId),
          supabaseAdmin.from("kyc_documents").update({
            statut: "VERIFIE",
            motif_rejet: null,
            reviewed_at: now,
          }).eq("provider_id", providerId),
        ]);

        if (resUser.error) console.error("[SUPABASE_APPROVE_USER_ERR]", resUser.error);
        if (resProfile.error) console.error("[SUPABASE_APPROVE_PROFILE_ERR]", resProfile.error);
        if (resKyc.error) console.error("[SUPABASE_APPROVE_KYC_ERR]", resKyc.error);

        // Audit log
        await supabaseAdmin.from("admin_audit_logs").insert({
          admin_id: session.id,
          action: "APPROVE_PROVIDER",
          target_id: providerId,
          details: "Validation du dossier et attribution du badge vérifié",
        });
      } catch (err) {
        console.warn("[ADMIN_VERIFY] Supabase approve error:", err);
      }

      // 2. Mise à jour MockDb
      MockDb.approveProvider(providerId);
      resultStatus = "VERIFIE";
      message = "Prestataire validé et badge vérifié activé avec succès.";
    }

    const updatedProfile = MockDb.findProfileByUserId(providerId);
    const updatedUser = MockDb.findUserById(providerId);

    return NextResponse.json({
      success: true,
      message,
      status: resultStatus,
      profile: updatedProfile,
      isActive: updatedUser?.is_active ?? true,
    });
  } catch (error) {
    console.error("[ADMIN_VERIFY_PROVIDER_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de la modération du prestataire." },
      { status: 500 }
    );
  }
}
