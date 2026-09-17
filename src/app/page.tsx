import React from "react";
import Link from "next/link";
import { SearchBar } from "@/components/search/SearchBar";
import { ProviderCard } from "@/components/cards/ProviderCard";
import {
  ShieldCheck,
  Wrench,
  Zap,
  Scissors,
  BookOpen,
  Truck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  PhoneCall,
  Clock,
  Star,
  UserCheck,
} from "lucide-react";
import { MockDb } from "@/lib/mock-db";
import { Provider } from "@/types/provider";

const CATEGORIES = [
  { label: "Plomberie", icon: Wrench, query: "Plomberie", color: "from-blue-500/10 to-emerald-500/10" },
  { label: "Électricité", icon: Zap, query: "Electricite", color: "from-amber-500/10 to-orange-500/10" },
  { label: "Coiffure / Beauté", icon: Scissors, query: "Coiffure", color: "from-rose-500/10 to-pink-500/10" },
  { label: "Soutien scolaire", icon: BookOpen, query: "Soutien", color: "from-indigo-500/10 to-purple-500/10" },
  { label: "Livraison & Courses", icon: Truck, query: "Livraison", color: "from-teal-500/10 to-cyan-500/10" },
  { label: "Nettoyage & Ménage", icon: Sparkles, query: "Nettoyage", color: "from-emerald-500/10 to-teal-500/10" },
];

import { supabaseAdmin } from "@/lib/supabase";

async function getFeaturedProviders(): Promise<Provider[]> {
  try {
    const { data: dbProviders, error } = await supabaseAdmin
      .from("active_providers_view")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6);

    if (!error && dbProviders && dbProviders.length > 0) {
      const providerIds = dbProviders.map((p) => p.id || p.user_id).filter(Boolean);
      let dbServices: any[] = [];

      if (providerIds.length > 0) {
        const { data: servicesData } = await supabaseAdmin
          .from("services")
          .select("*")
          .in("provider_id", providerIds);
        dbServices = servicesData || [];
      }

      return dbProviders.map((row: any) => {
        const pId = row.id || row.user_id;
        const pServices = dbServices.filter((s) => s.provider_id === pId);
        const mainService = pServices[0];
        return {
          id: pId,
          nom: row.nom,
          prenom: row.prenom,
          commune: row.commune,
          quartier: row.quartier,
          specialite: mainService?.nom || (row.competences && row.competences[0]) || "Artisan Pro",
          note: Number(row.rating_avg) || 5.0,
          avisCount: row.reviews_count || 0,
          prixIndicatif: Number(mainService?.prix_indicatif) || 5000,
          photoUrl: row.photo_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
          estVerifie: Boolean(row.est_verifie),
          disponible: Boolean(row.disponible),
          whatsappNumber: row.whatsapp_number || "0700000000",
          callNumber: row.call_number || row.whatsapp_number,
          competences: row.competences || [],
        };
      });
    }
  } catch (err) {
    console.warn("[HOMEPAGE_FEATURED] Supabase error:", err);
  }

  return [];
}

export default async function HomePage() {
  const featuredProviders = await getFeaturedProviders();

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden">
      {/* 1. HERO SECTION AVEC ANIMATIONS & GLOW */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 px-4 pb-20 pt-10 text-white sm:px-6 sm:pb-28 sm:pt-16">
        {/* Cercles de lumière d'arrière-plan */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Badge de confiance animé */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-400/30 backdrop-blur-md shadow-lg shadow-emerald-950/40 animate-float">
            <ShieldCheck className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span>Prestataires locaux vérifiés par l'équipe Djassa Pro</span>
          </div>

          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl leading-tight">
            Trouvez un pro de confiance dans votre quartier à{" "}
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
              Abidjan & CI
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-xs sm:text-sm leading-relaxed text-emerald-100/90 font-medium">
            Donnez de la force aux jeunes travailleurs compétents de votre commune. Contact direct sans intermédiaire ni frais via WhatsApp.
          </p>

          {/* Moteur de recherche interactif */}
          <div className="mt-8">
            <SearchBar />
          </div>

          {/* Rassurance rapide sous la barre */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-emerald-200/90">
            <div className="flex items-center gap-2 hover:text-white transition">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-amber-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <span className="font-semibold">0 FCFA de commission</span>
            </div>

            <div className="flex items-center gap-2 hover:text-white transition">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-amber-400">
                <PhoneCall className="h-3.5 w-3.5" />
              </div>
              <span className="font-semibold">WhatsApp direct</span>
            </div>

            <div className="flex items-center gap-2 hover:text-white transition">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-amber-400">
                <Clock className="h-3.5 w-3.5" />
              </div>
              <span className="font-semibold">Interventions express</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS CLÉS */}
      <section className="relative -mt-8 mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-200/60 border border-slate-100">
          <div className="flex flex-col items-center text-center p-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">100%</span>
            <span className="text-[11px] font-semibold text-slate-500 mt-0.5">Vrais Artisans</span>
          </div>

          <div className="flex flex-col items-center text-center p-2 border-l border-slate-100">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">Direct</span>
            <span className="text-[11px] font-semibold text-slate-500 mt-0.5">WhatsApp & Appel</span>
          </div>

          <div className="flex flex-col items-center text-center p-2 border-l border-slate-100">
            <div className="flex items-center gap-1 text-2xl sm:text-3xl font-black text-amber-500">
              <span>5.0</span>
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            </div>
            <span className="text-[11px] font-semibold text-slate-500 mt-0.5">Avis certifiés</span>
          </div>

          <div className="flex flex-col items-center text-center p-2 border-l border-slate-100">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">0 F</span>
            <span className="text-[11px] font-semibold text-slate-500 mt-0.5">Frais cachés</span>
          </div>
        </div>
      </section>

      {/* 3. CATÉGORIES DE SERVICES */}
      <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 sm:text-2xl">Catégories de services</h2>
            <p className="text-xs text-slate-500">Choisissez votre besoin pour trouver les artisans proches</p>
          </div>
          <Link
            href="/prestataires"
            className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 group"
          >
            <span>Explorer tout</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.label}
                href={`/prestataires?query=${encodeURIComponent(cat.query)}`}
                className="group flex flex-col items-center rounded-3xl border border-slate-100 bg-white p-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-emerald-300 active:scale-95"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 transition-all duration-300 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110 shadow-sm">
                  <Icon className="h-7 w-7" />
                </div>
                <span className="mt-3 text-xs font-black text-slate-800 line-clamp-1 group-hover:text-emerald-700 transition">
                  {cat.label}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
                  Voir les pros
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. PRESTATAIRES DISPONIBLES EN BASE */}
      <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 sm:text-2xl">
                Prestataires disponibles
              </h2>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <p className="text-xs text-slate-500">Prêts à intervenir immédiatement dans votre commune</p>
          </div>
          <Link
            href="/prestataires"
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            Voir tous les pros
          </Link>
        </div>

        <div className="mt-5">
          {featuredProviders.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProviders.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <UserCheck className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">
                Soyez le premier prestataire inscrit dans votre quartier !
              </h3>
              <p className="mt-1 max-w-md text-xs text-slate-500">
                Rejoignez Djassa Pro dès maintenant pour recevoir directement des clients de votre commune sur WhatsApp sans payer de commission.
              </p>
              <Link
                href="/inscription/prestataire"
                className="mt-5 rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition active:scale-95"
              >
                Créer mon compte prestataire
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 5. COMMENT ÇA MARCHE */}
      <section id="comment-ca-marche" className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-12">
          <div className="text-center max-w-xl mx-auto">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase text-emerald-800">
              Simple & Transparent
            </span>
            <h2 className="mt-3 text-2xl font-black text-slate-900 sm:text-3xl">
              Comment fonctionne Djassa Pro ?
            </h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Une mise en relation ultra-simple, gratuite et sans intermédiaire.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center p-4 rounded-2xl hover:bg-slate-50/80 transition">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-xl font-black text-emerald-800 shadow-sm">
                1
              </div>
              <h3 className="mt-4 text-sm font-black text-slate-900">Recherchez un métier</h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Entrez votre besoin et votre commune (Cocody, Yopougon, Koumassi, Marcory...).
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 rounded-2xl hover:bg-slate-50/80 transition">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-xl font-black text-amber-800 shadow-sm">
                2
              </div>
              <h3 className="mt-4 text-sm font-black text-slate-900">Consultez les profils vérifiés</h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Vérifiez les compétences, les avis clients certifiés et le badge de confiance.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 rounded-2xl hover:bg-slate-50/80 transition">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-xl font-black text-emerald-800 shadow-sm">
                3
              </div>
              <h3 className="mt-4 text-sm font-black text-slate-900">Contactez direct sur WhatsApp</h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Échangez directement avec le travailleur en un clic pour fixer le rendez-vous.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. APPEL À L'ACTION JEUNESSE */}
      <section className="mx-auto my-14 max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 p-8 text-white shadow-2xl sm:p-12">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-xl">
            <span className="rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black uppercase text-slate-950 shadow-sm">
              Jeunes d'Abidjan & de l'intérieur
            </span>
            <h3 className="mt-4 text-2xl font-black sm:text-4xl leading-tight">
              Tu as un métier ou un talent ? Rejoins les pros de ton quartier.
            </h3>
            <p className="mt-2.5 text-xs leading-relaxed text-emerald-100 sm:text-sm font-medium">
              Inscris-toi gratuitement en 2 minutes, fais vérifier ta pièce d'identité et reçois directement des clients sans payer de commission.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/inscription/prestataire"
                className="flex items-center gap-2 rounded-2xl bg-amber-400 px-6 py-3.5 text-xs sm:text-sm font-black text-slate-950 shadow-lg shadow-amber-400/30 transition-all hover:bg-amber-300 hover:scale-105 active:scale-95"
              >
                <span>Créer mon profil prestataire</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
