import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim().toLowerCase() || "";
    const commune = searchParams.get("commune")?.trim() || "";
    const categorie = searchParams.get("categorie")?.trim() || "";
    const onlyVerified = searchParams.get("onlyVerified") === "true";

    let providers: any[] = [];

    // Récupération directe depuis Supabase
    try {
      let supabaseQuery = supabaseAdmin.from("active_providers_view").select("*");

      if (onlyVerified) {
        supabaseQuery = supabaseQuery.eq("est_verifie", true);
      }

      if (commune && commune !== "Toutes les communes") {
        supabaseQuery = supabaseQuery.ilike("commune", `%${commune}%`);
      }

      supabaseQuery = supabaseQuery.order("created_at", { ascending: false });

      const { data: dbProviders, error } = await supabaseQuery;

      if (!error && dbProviders) {
        // Récupérer les services associés
        const providerIds = dbProviders.map((p) => p.id || p.user_id).filter(Boolean);
        let dbServices: any[] = [];

        if (providerIds.length > 0) {
          const { data: servicesData } = await supabaseAdmin
            .from("services")
            .select("*")
            .in("provider_id", providerIds);
          dbServices = servicesData || [];
        }

        providers = dbProviders.map((p) => {
          const pId = p.id || p.user_id;
          const services = dbServices.filter((s) => s.provider_id === pId);
          const mainService = services[0];
          return {
            id: pId,
            nom: p.nom,
            prenom: p.prenom,
            specialite: mainService?.nom || (p.competences && p.competences[0]) || "Artisan Pro",
            commune: p.commune,
            quartier: p.quartier,
            bio: p.bio,
            competences: p.competences || [],
            prixIndicatif: Number(mainService?.prix_indicatif) || 5000,
            photoUrl: p.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
            whatsappNumber: p.whatsapp_number || p.phone || "0700000000",
            callNumber: p.call_number || p.phone || p.whatsapp_number,
            estVerifie: Boolean(p.est_verifie),
            disponible: Boolean(p.disponible),
            note: Number(p.rating_avg) || 5.0,
            avisCount: Number(p.reviews_count) || 0,
            services: services,
          };
        });
      }
    } catch (e) {
      console.warn("Supabase providers query error:", e);
    }

    // Filtrage textuel (Query / Métier)
    if (query || categorie) {
      providers = providers.filter((p) => {
        const fullText = `${p.nom} ${p.prenom} ${p.commune} ${p.quartier || ""} ${p.specialite} ${(p.competences || []).join(" ")}`.toLowerCase();
        const servicesText = (p.services || []).map((s: any) => `${s.nom} ${s.categorie}`).join(" ").toLowerCase();

        const matchesQuery = !query || fullText.includes(query) || servicesText.includes(query);
        const matchesCat = !categorie || servicesText.includes(categorie.toLowerCase()) || p.specialite.toLowerCase().includes(categorie.toLowerCase());

        return matchesQuery && matchesCat;
      });
    }

    return NextResponse.json({ providers });
  } catch (error) {
    console.error("[GET_PROVIDERS_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de la récupération des prestataires." },
      { status: 500 }
    );
  }
}
