"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, Lock, AlertCircle, Loader2 } from "lucide-react";
import { COMMUNES_CI } from "@/lib/security";

export default function RegisterClientPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    phone: "",
    email: "",
    password: "",
    commune: "Cocody",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Erreur lors de l'inscription.");
        setLoading(false);
        return;
      }

      router.push("/prestataires");
      router.refresh();
    } catch {
      setError("Problème de connexion. Veuillez réessayer.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
        <div className="text-center">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700">
            Espace Client
          </span>
          <h1 className="mt-3 text-2xl font-black text-slate-900">Inscription Client</h1>
          <p className="mt-1 text-xs text-slate-500">
            Recherchez et contactez les artisans vérifiés de votre commune.
          </p>
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-2xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700">Nom</label>
              <input
                type="text"
                required
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Ex: Konan"
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
                placeholder="Ex: Sarah"
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700">
              Téléphone (10 chiffres)
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
          </div>

          <div>
            <label className="block font-bold text-slate-700">Votre commune de résidence</label>
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
            <label className="block font-bold text-slate-700">Mot de passe</label>
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

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 font-bold text-white shadow-md transition hover:bg-slate-800 active:scale-98 disabled:opacity-50 mt-4"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span>Créer mon compte client</span>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Vous êtes artisan ?{" "}
          <Link href="/inscription/prestataire" className="font-bold text-emerald-600 hover:underline">
            S'inscrire comme prestataire
          </Link>
        </p>
      </div>
    </div>
  );
}
