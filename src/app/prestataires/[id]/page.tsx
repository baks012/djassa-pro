import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ShieldCheck,
  MapPin,
  Star,
  MessageSquare,
  Phone,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { MockDb } from "@/lib/mock-db";
import { formatFCFA, buildWhatsAppLink } from "@/lib/utils";
import { ProviderReviewsSection } from "@/components/reviews/ProviderReviewsSection";
import { supabaseAdmin } from "@/lib/supabase";

interface PageProps {
  params: { id: string };
}

async function getProvider(id: string) {
  try {
    // 1. Essai depuis Supabase
    try {
      const [{ data: profile }, { data: user }, { data: servicesList }, { data: reviewsData }] =
        await Promise.all([
          supabaseAdmin.from("profiles").select("*").eq("user_id", id).maybeSingle(),
          supabaseAdmin.from("users").select("id, is_active, role").eq("id", id).maybeSingle(),
          supabaseAdmin.from("services").select("*").eq("provider_id", id),
          supabaseAdmin.from("reviews").select("*").eq("provider_id", id).order("created_at", { ascending: false }),
        ]);

      if (profile && (!user || user.is_active !== false) && profile.kyc_status !== "REJETE") {
        const sList = servicesList || [];
        const rList = reviewsData || [];
        const mainService = sList[0];

        const reviews = rList.map((r: any) => ({
          id: r.id,
          note: r.note,
          commentaire: r.commentaire,
          clientName: `${r.client_prenom || "Client"} ${r.client_nom ? r.client_nom.charAt(0) + "." : ""}`,
          createdAt: new Date(r.created_at).toLocaleDateString("fr-FR"),
        }));

        return {
          id: profile.user_id,
          nom: profile.nom,
          prenom: profile.prenom,
          specialite: mainService?.nom || (profile.competences && profile.competences[0]) || "Artisan",
          commune: profile.commune,
          quartier: profile.quartier,
          bio: profile.bio,
          competences: (Array.isArray(profile.competences) ? profile.competences : []) as string[],
          prixIndicatif: mainService ? Number(mainService.prix_indicatif) : 3500,
          photoUrl: profile.photo_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
          whatsappNumber: profile.whatsapp_number || "0700000000",
          callNumber: profile.call_number || profile.whatsapp_number,
          estVerifie: profile.est_verifie,
          disponible: profile.disponible,
          note: Number(profile.rating_avg) || 5.0,
          avisCount: profile.reviews_count || 0,
          services: sList.map((s: any) => ({
            id: s.id,
            nom: s.nom,
            categorie: s.categorie,
            prixIndicatif: Number(s.prix_indicatif),
            description: s.description,
          })),
          reviews,
        };
      }
    } catch (dbErr) {
      console.warn("[PROVIDER_DETAIL] Supabase error:", dbErr);
    }

    return null;
  } catch {
    return null;
  }
}



export default async function ProviderDetailPage({ params }: PageProps) {
  const provider = await getProvider(params.id);

  if (!provider) {
    notFound();
  }

  const whatsappUrl = buildWhatsAppLink(
    provider.whatsappNumber,
    provider.prenom,
    provider.specialite
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24 pt-4 sm:pt-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Bouton retour */}
        <Link
          href="/prestataires"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour aux prestataires</span>
        </Link>

        {/* Fiche d'en-tête du profil */}
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-4 ring-emerald-50">
              <Image
                src={provider.photoUrl}
                alt={`${provider.prenom} ${provider.nom}`}
                fill
                sizes="112px"
                className="object-cover"
              />
              {provider.disponible && (
                <span
                  className="absolute bottom-1.5 right-1.5 h-4 w-4 rounded-full border-2 border-white bg-emerald-500 shadow-sm"
                  title="Disponible immédiatement"
                />
              )}
            </div>

            {/* Infos Prestataire */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 sm:text-2xl">
                  {provider.prenom} {provider.nom}
                </h1>
                {provider.estVerifie && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Identité Vérifiée</span>
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm font-bold text-emerald-700 sm:text-base">
                {provider.specialite}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-slate-900">{provider.note.toFixed(1)}</span>
                  <span className="text-slate-400">({provider.avisCount} avis)</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-amber-500" />
                  <span>
                    {provider.commune}
                    {provider.quartier ? ` (${provider.quartier})` : ""}
                  </span>
                </div>
              </div>

              {/* Boutons d'appel & WhatsApp */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 font-bold text-white shadow-md transition hover:bg-[#20ba5a] active:scale-95"
                >
                  <MessageSquare className="h-5 w-5 fill-current" />
                  <span className="text-sm">Contacter sur WhatsApp</span>
                </a>

                {provider.whatsappNumber && (
                  <a
                    href={`tel:+225${provider.whatsappNumber.replace(/\D/g, "").slice(-10)}`}
                    className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-emerald-700 active:scale-95"
                  >
                    <Phone className="h-4 w-4" />
                    <span className="text-sm hidden xs:inline">Appeler</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Bio / Présentation */}
          {provider.bio && (
            <div className="mt-8 border-t border-slate-100 pt-6">
              <h2 className="text-sm font-bold text-slate-900">À propos de {provider.prenom}</h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                {provider.bio}
              </p>
            </div>
          )}

          {/* Compétences */}
          {provider.competences && provider.competences.length > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-6">
              <h2 className="text-sm font-bold text-slate-900">Compétences & Savoir-faire</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(provider.competences as string[]).map((comp: string) => (
                  <span
                    key={comp}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{comp}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Liste des Services & Tarifs */}
        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-base font-black text-slate-900 sm:text-lg">
            Services proposés & Tarifs
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Les tarifs sont indicatifs et peuvent être affinés sur devis direct.
          </p>

          <div className="mt-4 divide-y divide-slate-100">
            {provider.services && provider.services.length > 0 ? (
              provider.services.map((service) => (
                <div key={service.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{service.nom}</h3>
                      {service.description && (
                        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                          {service.description}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 font-extrabold text-emerald-700 text-sm">
                      {formatFCFA(service.prixIndicatif)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-4 text-xs text-slate-400">Aucun service spécifique listé.</p>
            )}
          </div>
        </div>

        {/* Section Avis et Retours Clients Interactifs */}
        <ProviderReviewsSection
          providerId={provider.id}
          providerName={`${provider.prenom} ${provider.nom}`}
          ratingAvg={provider.note}
          reviewsCount={provider.avisCount}
          initialReviews={provider.reviews}
        />
      </div>
    </div>
  );
}
