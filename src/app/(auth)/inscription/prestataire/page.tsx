"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Phone, Lock, MapPin, Wrench, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { COMMUNES_CI } from "@/lib/security";

export default function RegisterProviderPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    phone: "",
    email: "",
    password: "",
    commune: "Cocody",
    quartier: "",
    specialite: "Plomberie",
    competencesRaw: "Dépannage rapide, Recherche de fuite",
    prixIndicatif: "5000",
    bio: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const competences = form.competencesRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        ...form,
        competences: competences.length > 0 ? competences : [form.specialite],
        prixIndicatif: Number(form.prixIndicatif) || 3500,
      };

      const res = await fetch("/api/auth/register-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors && data.errors.length > 0) {
          setError(data.errors[0].message);
        } else {
          setError(data.message || "Erreur lors de l'inscription.");
        }
        setLoading(false);
        return;
      }

      router.push("/dashboard/prestataire");
      router.refresh();
    } catch {
      setError("Problème de connexion. Veuillez réessayer.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-10">
        <div className="text-center">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800">
            Espace Prestataire
          </span>
          <h1 className="mt-3 text-2xl font-black text-slate-900 sm:text-3xl">
            Rejoins les pros de ton quartier
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Trouve des clients à Abidjan et reçois directement des demandes sur WhatsApp.
          </p>
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-2xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
          {/* Nom & Prénom */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-bold text-slate-700">Nom</label>
              <input
                type="text"
                required
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Ex: Kouassi"
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700">Prénom</label>
              <input
                type="text"
                required
                value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                placeholder="Ex: Jean-Eudes"
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Numéro de téléphone (format ivoirien) */}
          <div>
            <label className="block font-bold text-slate-700">
              Numéro de téléphone WhatsApp (10 chiffres)
            </label>
            <div className="relative mt-1 flex items-center">
              <Phone className="absolute left-3.5 h-4 w-4 text-slate-400" />
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Ex: 0701020304"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              Commence par 01 (Moov), 05 (MTN) ou 07 (Orange).
            </p>
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block font-bold text-slate-700">Mot de passe (Min 8 caractères)</label>
            <div className="relative mt-1 flex items-center">
              <Lock className="absolute left-3.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Commune & Quartier */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-bold text-slate-700">Commune</label>
              <select
                value={form.commune}
                onChange={(e) => setForm({ ...form, commune: e.target.value })}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
              >
                {COMMUNES_CI.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700">Quartier précis</label>
              <input
                type="text"
                value={form.quartier}
                onChange={(e) => setForm({ ...form, quartier: e.target.value })}
                placeholder="Ex: Angré 8ème Tranche, Niangon..."
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Spécialité & Tarif */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-bold text-slate-700">Métier / Spécialité</label>
              <input
                type="text"
                required
                value={form.specialite}
                onChange={(e) => setForm({ ...form, specialite: e.target.value })}
                placeholder="Ex: Plomberie, Coiffure..."
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700">Tarif de départ (FCFA)</label>
              <input
                type="number"
                required
                value={form.prixIndicatif}
                onChange={(e) => setForm({ ...form, prixIndicatif: e.target.value })}
                placeholder="Ex: 5000"
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Compétences clés */}
          <div>
            <label className="block font-bold text-slate-700">
              Compétences clés (séparées par une virgule)
            </label>
            <input
              type="text"
              value={form.competencesRaw}
              onChange={(e) => setForm({ ...form, competencesRaw: e.target.value })}
              placeholder="Ex: Pose sanitaire, Soudure, Débouchage"
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
            />
          </div>

          {/* Présentation rapide */}
          <div>
            <label className="block font-bold text-slate-700">Présentation / Bio (Optionnel)</label>
            <textarea
              rows={3}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Décrivez votre expérience et ce que vous proposez..."
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-98 disabled:opacity-50 mt-4"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span>Créer mon profil prestataire</span>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Déjà inscrit ?{" "}
          <Link href="/connexion" className="font-bold text-emerald-600 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
