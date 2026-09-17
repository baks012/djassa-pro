"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Phone,
  Lock,
  AlertCircle,
  Loader2,
  Camera,
  UploadCloud,
  CheckCircle2,
} from "lucide-react";
import { COMMUNES_CI } from "@/lib/security";

const DEMO_AVATARS = [
  { label: "Artisan 1", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80" },
  { label: "Artisan 2", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80" },
  { label: "Artisane 3", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80" },
  { label: "Artisane 4", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80" },
];

export default function RegisterProviderPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    phone: "",
    email: "",
    password: "",
    commune: "Cocody",
    quartier: "",
    specialite: "Électricité",
    competencesRaw: "Dépannage rapide, Installation tableau, Climatisation",
    prixIndicatif: "5000",
    bio: "",
    photoUrl: "",
  });

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.message || "Échec de l'import de la photo.");
      }

      setForm((prev) => ({ ...prev, photoUrl: data.url }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'upload.";
      setError(msg);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.photoUrl || form.photoUrl.trim() === "") {
      setError("📸 Votre photo de profil est obligatoire pour inspirer confiance aux clients.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

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
          {/* PHOTO DE PROFIL OBLIGATOIRE */}
          <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 p-4">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <Camera className="h-4 w-4 text-emerald-600" />
                <span>Photo de profil professionnelle (Obligatoire *)</span>
              </label>
              {form.photoUrl && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Photo ajoutée
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Une vraie photo de vous augmente vos chances d'être contacté de 80%.
            </p>

            <div className="mt-3 flex flex-col sm:flex-row items-center gap-4">
              {/* Aperçu de la photo */}
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-emerald-500 bg-white shadow-sm">
                {form.photoUrl ? (
                  <Image
                    src={form.photoUrl}
                    alt="Aperçu"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 text-slate-400">
                    <Camera className="h-7 w-7" />
                    <span className="text-[9px] font-bold mt-0.5">Requise</span>
                  </div>
                )}
                {uploadingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>

              {/* Boutons d'action */}
              <div className="flex-1 space-y-2 w-full text-center sm:text-left">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white border border-emerald-600/30 px-3.5 py-2 text-xs font-bold text-emerald-700 shadow-sm hover:bg-emerald-50 active:scale-95 transition"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Importer ma photo (JPG, PNG)</span>
                </button>

                {/* Suggestions d'avatars pour test rapide */}
                <div className="flex items-center gap-1.5 justify-center sm:justify-start pt-1">
                  <span className="text-[10px] text-slate-400 font-semibold">Exemples :</span>
                  {DEMO_AVATARS.map((avatar, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, photoUrl: avatar.url }))}
                      className="h-6 w-6 overflow-hidden rounded-full border border-slate-300 hover:border-emerald-600 transition"
                      title={avatar.label}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={avatar.url} alt={avatar.label} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Nom & Prénom */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-bold text-slate-700">Nom *</label>
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
              <label className="block font-bold text-slate-700">Prénom *</label>
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
              Numéro WhatsApp professionnel (10 chiffres) *
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
            <label className="block font-bold text-slate-700">Mot de passe pour votre espace *</label>
            <div className="relative mt-1 flex items-center">
              <Lock className="absolute left-3.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="•••••••• (Min 8 caractères)"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Commune & Quartier */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-bold text-slate-700">Commune d'intervention *</label>
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
              <label className="block font-bold text-slate-700">Métier / Spécialité *</label>
              <input
                type="text"
                required
                value={form.specialite}
                onChange={(e) => setForm({ ...form, specialite: e.target.value })}
                placeholder="Ex: Électricité, Plomberie, Coiffure..."
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700">Tarif indicatif de départ (FCFA) *</label>
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
              placeholder="Ex: Dépannage d'urgence, Pose tableau, Climatisation"
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
            />
          </div>

          {/* Présentation rapide */}
          <div>
            <label className="block font-bold text-slate-700">Présentation / Bio</label>
            <textarea
              rows={3}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Décrivez vos points forts et votre expérience pour convaincre les clients..."
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading || uploadingPhoto}
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
            Se connecter à mon espace
          </Link>
        </p>
      </div>
    </div>
  );
}
