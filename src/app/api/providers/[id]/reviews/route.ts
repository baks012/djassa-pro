import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { MockDb } from "@/lib/mock-db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser();
    const providerId = params.id;

    if (session && session.id === providerId) {
      return NextResponse.json(
        { success: false, message: "Vous ne pouvez pas laisser d'avis sur votre propre profil." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const note = Number(body.note);
    const commentaire = typeof body.commentaire === "string" ? body.commentaire.trim() : "";
    const clientName = typeof body.nomClient === "string" && body.nomClient.trim()
      ? body.nomClient.trim()
      : session
      ? `${session.prenom || "Client"} ${session.nom ? session.nom.charAt(0) + "." : ""}`
      : "Client vérifié";

    if (isNaN(note) || note < 1 || note > 5) {
      return NextResponse.json(
        { success: false, message: "La note doit être comprise entre 1 et 5 étoiles." },
        { status: 400 }
      );
    }

    // 1. Insérer dans Supabase
    let reviewItem: any = null;
    try {
      const { data: insertedReview, error: revError } = await supabaseAdmin
        .from("reviews")
        .insert({
          provider_id: providerId,
          client_id: session ? session.id : null,
          client_nom: clientName,
          client_prenom: "",
          note: Math.round(note),
          commentaire,
        })
        .select("*")
        .single();

      if (!revError && insertedReview) {
        reviewItem = insertedReview;

        // Recalculer la moyenne des notes du prestataire dans Supabase
        const { data: allReviews } = await supabaseAdmin
          .from("reviews")
          .select("note")
          .eq("provider_id", providerId);

        if (allReviews && allReviews.length > 0) {
          const avg = allReviews.reduce((sum, r) => sum + r.note, 0) / allReviews.length;
          await supabaseAdmin
            .from("profiles")
            .update({
              rating_avg: Number(avg.toFixed(1)),
              reviews_count: allReviews.length,
            })
            .eq("user_id", providerId);
        }
      }
    } catch (e) {
      console.warn("Supabase review error:", e);
    }

    // 2. Sync MockDb
    const mockReview = MockDb.addReview({
      provider_id: providerId,
      client_id: session?.id || `visitor-${Date.now()}`,
      note: Math.round(note),
      commentaire,
      client_nom: clientName,
      client_prenom: "",
    });

    return NextResponse.json({
      success: true,
      message: "Merci ! Votre avis a été publié avec succès.",
      review: reviewItem || mockReview,
    });
  } catch (error) {
    console.error("[POST_REVIEW_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Une erreur est survenue lors de l'enregistrement de l'avis." },
      { status: 500 }
    );
  }
}
