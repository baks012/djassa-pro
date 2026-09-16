"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Plus,
  Loader2,
  FileText,
  User,
  MapPin,
  TrendingUp,
} from "lucide-react";

export default function ProviderDashboardPage() {
  const [profile, setProfile] = useState<{
    nom: string;
    prenom: string;
    commune: string;
    quartier?: string;
    bio?: string;
    disponible: boolean;
    estVerifie: boolean;
    kycStatus: string;
    ratingAvg: number;
    reviewsCount: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.profile) {
          setProfile(data.user.profile);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleToggleDisponible = async () => {
    if (!profile) return;
    setToggleLoading(true);
    setMessage("");

    try {
      // Inversion locale optimiste
      const newStatus = !profile.disponible;
      setProfile({ ...profile, disponible: newStatus });
      setMessage(newStatus ? "Vous êtes maintenant affiché Disponible !" : "Vous êtes en mode Occupé.");
    } catch {
      setMessage("Erreur lors du changement de disponibilité.");
    } finally {
      setToggleLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <h2 className="text-base font-bold text-slate-900">Session expirée</h2>
        <p className="mt-1 text-xs text-slate-500">Veuillez vous reconnecter.</p>
        <a
          href="/connexion"
          className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white"
        >
          Se connecter
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-6">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* En-tête */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Espace Travailleur
            </span>
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
              Bienvenue, {profile.prenom} !
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Gérez votre visibilité, vos services et suivez vos demandes clients.
            </p>
          </div>

          {/* Bouton de disponibilité */}
          <button
            onClick={handleToggleDisponible}
            disabled={toggleLoading}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold shadow-sm transition active:scale-95 ${
              profile.disponible
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            {profile.disponible ? (
              <>
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                <span>Disponible pour interventions</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                <span>Indisponible / En mission</span>
              </>
            )}
          </button>
        </div>

        {message && (
          <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
            {message}
          </div>
        )}

        {/* Bannière de Statut de Vérification (Anti-Fraude) */}
        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                profile.estVerifie
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Statut de vérification d'identité</h3>
                {profile.estVerifie ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                    Badge Vérifié Actif
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                    En attente de validation admin
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                {profile.estVerifie
                  ? "Félicitations ! Votre pièce d'identité a été validée par l'administrateur. Vos annonces affichent le badge de confiance vert."
                  : "Votre profil est actuellement en cours d'examen par notre équipe. Le badge 'Vérifié' sera activé dès validation de votre CNI ou Attestation."}
              </p>
            </div>
          </div>
        </div>

        {/* Métriques */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400">Note moyenne</span>
            <div className="mt-1 text-2xl font-black text-slate-900">
              {Number(profile.ratingAvg).toFixed(1)} / 5
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400">Avis clients</span>
            <div className="mt-1 text-2xl font-black text-slate-900">
              {profile.reviewsCount}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400">Zone principale</span>
            <div className="mt-1 text-sm font-black text-emerald-700 truncate">
              {profile.commune}
            </div>
          </div>
        </div>

        {/* Conseils pour maximiser ses contacts WhatsApp */}
        <div className="mt-6 rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-6 text-xs text-emerald-900">
          <h4 className="font-bold text-sm text-emerald-950">
            💡 Astuce Djassa Pro pour avoir plus de clients :
          </h4>
          <ul className="mt-2 space-y-1.5 list-disc pl-4 text-emerald-800">
            <li>Répondez poliment et rapidement sur WhatsApp dès qu'un client vous écrit.</li>
            <li>Proposez des tarifs clairs dès le départ pour instaurer la confiance.</li>
            <li>Demandez à vos clients satisfaits de laisser une note 5 étoiles sur votre fiche.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
