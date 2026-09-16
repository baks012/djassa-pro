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
} from "lucide-react";
import prisma from "@/lib/prisma";
import { Provider } from "@/types/provider";
import { parseCompetences } from "@/lib/utils";

// Données de repli rapides
const FALLBACK_PROVIDERS: Provider[] = [
  {
    id: "demo-1",
    nom: "Kouassi",
    prenom: "Jean-Eudes",
    specialite: "Plomberie & Sanitaire",
    commune: "Cocody",
    quartier: "Angré 8ème Tranche",
    prixIndicatif: 5000,
    photoUrl: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&q=80",
    estVerifie: true,
    disponible: true,
    note: 4.9,
    avisCount: 24,
    whatsappNumber: "0701020304",
    competences: ["Plomberie", "Sanitaire"],
  },
  {
    id: "demo-2",
    nom: "Touré",
    prenom: "Aïcha",
    specialite: "Coiffure & Tresses",
    commune: "Yopougon",
    quartier: "Niangon Lokoa",
    prixIndicatif: 4000,
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
    estVerifie: true,
    disponible: true,
    note: 4.8,
    avisCount: 18,
    whatsappNumber: "0505060708",
    competences: ["Coiffure", "Tresses"],
  },
  {
    id: "demo-3",
    nom: "Bakayoko",
    prenom: "Amadou",
    specialite: "Électricité Bâtiment & Froid",
    commune: "Koumassi",
    quartier: "Remblais",
    prixIndicatif: 6000,
    photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80",
    estVerifie: true,
    disponible: true,
    note: 5.0,
    avisCount: 31,
    whatsappNumber: "0102030405",
    competences: ["Électricité", "Froid"],
  },
];

const CATEGORIES = [
  { label: "Plomberie", icon: Wrench, query: "Plomberie" },
  { label: "Électricité", icon: Zap, query: "Electricite" },
  { label: "Coiffure / Beauté", icon: Scissors, query: "Coiffure" },
  { label: "Soutien scolaire", icon: BookOpen, query: "Soutien" },
  { label: "Livraison & Courses", icon: Truck, query: "Livraison" },
  { label: "Nettoyage & Ménage", icon: Sparkles, query: "Nettoyage" },
];

async function getFeaturedProviders(): Promise<Provider[]> {
  try {
    const dbProfiles = await prisma.profile.findMany({
      where: {
        disponible: true,
        estVerifie: true,
      },
      include: {
        services: { take: 1 },
      },
      take: 6,
      orderBy: { ratingAvg: "desc" },
    });

    if (!dbProfiles || dbProfiles.length === 0) {
      return FALLBACK_PROVIDERS;
    }

    return dbProfiles.map((p) => {
      const competences = parseCompetences(p.competences);
      return {
        id: p.userId,
        nom: p.nom,
        prenom: p.prenom,
        specialite: p.services[0]?.nom || competences[0] || "Artisan local",
        commune: p.commune,
        quartier: p.quartier,
        prixIndicatif: p.services[0] ? Number(p.services[0].prixIndicatif) : 3500,
        photoUrl: p.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
        estVerifie: p.estVerifie,
        disponible: p.disponible,
        note: Number(p.ratingAvg) || 4.8,
        avisCount: p.reviewsCount || 10,
        whatsappNumber: p.whatsappNumber || "0700000000",
        competences,
      };
    });
  } catch {
    return FALLBACK_PROVIDERS;
  }
}

export default async function HomePage() {
  const featuredProviders = await getFeaturedProviders();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 1. HERO SECTION MOBILE-FIRST */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-950 px-4 pb-16 pt-10 text-white sm:px-6 sm:pb-24 sm:pt-16">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge de confiance */}
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-700/50 px-3.5 py-1.5 text-xs font-medium text-emerald-200 ring-1 ring-emerald-500/30 backdrop-blur-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Prestataires locaux aux identités vérifiées (CNI / Attestation)</span>
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Trouvez un pro de confiance dans votre quartier à{" "}
            <span className="text-amber-400">Abidjan</span>
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-emerald-100/90 sm:text-base">
            Donnez de la force aux jeunes travailleurs compétents de votre commune. Contact direct sans intermédiaire via WhatsApp.
          </p>

          {/* Moteur de recherche rapide */}
          <div className="mt-8">
            <SearchBar />
          </div>

          {/* Rassurance rapide sous la barre */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-emerald-200">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-amber-400" />
              <span>Zéro commission</span>
            </div>
            <div className="flex items-center gap-1.5">
              <PhoneCall className="h-4 w-4 text-amber-400" />
              <span>Contact direct WhatsApp</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-400" />
              <span>Interventions rapides</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATÉGORIES POPULAIRES */}
      <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Catégories de services</h2>
            <p className="text-xs text-slate-500">Choisissez votre besoin pour trouver les artisans proches</p>
          </div>
          <Link
            href="/prestataires"
            className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            <span>Voir tout</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-6">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.label}
                href={`/prestataires?query=${encodeURIComponent(cat.query)}`}
                className="group flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-3.5 text-center shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/40 active:scale-95"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="mt-2 text-xs font-bold text-slate-800 line-clamp-1">
                  {cat.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. PRESTATAIRES EN VEDETTE DISPONIBLES */}
      <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              Disponibles maintenant
            </h2>
            <p className="text-xs text-slate-500">Prêts à intervenir immédiatement dans votre commune</p>
          </div>
          <Link
            href="/prestataires"
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            Tous les pros
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProviders.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      </section>

      {/* 4. SECTION COMMENT ÇA MARCHE */}
      <section id="comment-ca-marche" className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-10">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
              Comment fonctionne Djassa Pro ?
            </h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Une mise en relation ultra-simple, gratuite et sans intermédiaire.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-lg font-black text-emerald-800">
                1
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900">Recherchez un métier</h3>
              <p className="mt-1 text-xs text-slate-500">
                Entrez votre besoin et votre commune (Cocody, Yopougon, Marcory...).
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-lg font-black text-amber-800">
                2
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900">Consultez les profils vérifiés</h3>
              <p className="mt-1 text-xs text-slate-500">
                Vérifiez les compétences, les tarifs indicatifs et le badge de validation.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-lg font-black text-emerald-800">
                3
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900">Contactez direct sur WhatsApp</h3>
              <p className="mt-1 text-xs text-slate-500">
                Échangez directement avec le jeune travailleur pour convenir du rendez-vous.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. APPEL À L'ACTION JEUNESSE */}
      <section className="mx-auto my-12 max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-700 to-emerald-900 p-6 text-white shadow-xl sm:p-10">
          <div className="max-w-xl">
            <span className="rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black uppercase text-slate-950">
              Jeunes d'Abidjan & de l'intérieur
            </span>
            <h3 className="mt-3 text-2xl font-black sm:text-3xl">
              Tu as un métier ou un talent ? Rejoins les pros de ton quartier.
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-emerald-100 sm:text-sm">
              Inscris-toi gratuitement en 2 minutes, fais vérifier ta pièce d'identité et reçois directement des clients sans payer de commission.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/inscription/prestataire"
                className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 shadow-md transition hover:bg-amber-300 active:scale-95"
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
