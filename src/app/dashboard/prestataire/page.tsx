"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Loader2,
  MapPin,
  Phone,
  Save,
  CheckCircle2,
  FileCheck,
  Upload,
  Sparkles,
  Camera,
  ImageIcon,
  Trash2,
  ExternalLink,
  Eye,
} from "lucide-react";
import { COMMUNES_CI } from "@/lib/security";

interface Service {
  id: string;
  nom: string;
  categorie: string;
  prixIndicatif: number;
  description?: string | null;
}

interface KycDocument {
  id: string;
  typePiece: string;
  numeroPiece?: string | null;
  documentUrl: string;
  statut: string;
  motifRejet?: string | null;
}

interface ProfileData {
  nom: string;
  prenom: string;
  commune: string;
  quartier?: string | null;
  bio?: string | null;
  whatsappNumber?: string | null;
  callNumber?: string | null;
  disponible: boolean;
  estVerifie: boolean;
  kycStatus: string;
  ratingAvg: number;
  reviewsCount: number;
  services?: Service[];
  kycDocuments?: KycDocument[];
}

export default function ProviderDashboardPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states for profile editing
  const [form, setForm] = useState({
    commune: "",
    quartier: "",
    bio: "",
    whatsappNumber: "",
    callNumber: "",
  });

  // KYC submission file & state
  const [cniFile, setCniFile] = useState<File | null>(null);
  const [cniPreview, setCniPreview] = useState<string | null>(null);
  const [cniNumber, setCniNumber] = useState("");
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = async () => {
    try {
      const res = await fetch("/api/providers/profile");
      const data = await res.json();
      if (data?.profile) {
        setProfile(data.profile);
        setForm({
          commune: data.profile.commune || "Cocody",
          quartier: data.profile.quartier || "",
          bio: data.profile.bio || "",
          whatsappNumber: data.profile.whatsappNumber || "",
          callNumber: data.profile.callNumber || "",
        });
      }
    } catch {
      // Fallback to /api/auth/me
      const fallback = await fetch("/api/auth/me").then((r) => r.json());
      if (fallback?.user?.profile) {
        setProfile(fallback.user.profile);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleToggleDisponible = async () => {
    if (!profile) return;
    setToggleLoading(true);
    setMessage(null);

    const newStatus = !profile.disponible;
    // Optimistic update
    setProfile({ ...profile, disponible: newStatus });

    try {
      const res = await fetch("/api/providers/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disponible: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Erreur serveur");
      }

      setMessage({
        type: "success",
        text: newStatus
          ? "✅ Vous êtes maintenant visible et disponible pour les clients !"
          : "⏸️ Vous êtes en mode indisponible / en mission.",
      });
    } catch {
      // Rollback on error
      setProfile({ ...profile, disponible: !newStatus });
      setMessage({
        type: "error",
        text: "Impossible de modifier la disponibilité. Vérifiez votre connexion.",
      });
    } finally {
      setToggleLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/providers/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erreur de mise à jour");
      }

      setProfile(data.profile);
      setMessage({ type: "success", text: "✅ Vos informations ont été mises à jour avec succès !" });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Erreur lors de la sauvegarde.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCniFile(file);
      if (file.type.startsWith("image/")) {
        setCniPreview(URL.createObjectURL(file));
      } else {
        setCniPreview(null);
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setCniFile(file);
      if (file.type.startsWith("image/")) {
        setCniPreview(URL.createObjectURL(file));
      } else {
        setCniPreview(null);
      }
    }
  };

  const handleRemoveSelectedFile = () => {
    setCniFile(null);
    setCniPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cniFile) {
      setMessage({ type: "error", text: "Veuillez sélectionner la photo de votre CNI." });
      return;
    }
    setSubmittingKyc(true);
    setMessage(null);

    try {
      // 1. Upload file to /api/upload
      const uploadFormData = new FormData();
      uploadFormData.append("file", cniFile);
      uploadFormData.append("bucket", "cni_documents");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.message || "Erreur lors de l'upload de la photo CNI");
      }

      const uploadedUrl = uploadData.url;

      // 2. Submit KYC with the uploaded URL
      const res = await fetch("/api/providers/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentUrl: uploadedUrl,
          numeroPiece: cniNumber,
          typePiece: "CNI",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erreur de soumission");
      }

      setProfile(data.profile);
      handleRemoveSelectedFile();
      setCniNumber("");
      setMessage({
        type: "success",
        text: "✅ Votre photo CNI a été téléversée avec succès ! L'administrateur validera votre badge 'Vérifié' sous peu.",
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Erreur de soumission.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setSubmittingKyc(false);
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
        <p className="mt-1 text-xs text-slate-500">Veuillez vous reconnecter pour accéder à votre espace.</p>
        <a
          href="/connexion"
          className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
        >
          Se connecter
        </a>
      </div>
    );
  }

  const latestKycDoc = profile.kycDocuments && profile.kycDocuments.length > 0 ? profile.kycDocuments[0] : null;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-6">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* En-tête */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Espace Travailleur
            </span>
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
              Bienvenue, {profile.prenom} {profile.nom} !
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Gérez votre visibilité, vos coordonnées et suivez votre statut de vérification.
            </p>
          </div>

          {/* Bouton de disponibilité avec persistance réelle */}
          <button
            onClick={handleToggleDisponible}
            disabled={toggleLoading}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50 ${
              profile.disponible
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            {toggleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : profile.disponible ? (
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

        {/* Message d'état */}
        {message && (
          <div
            className={`mt-4 rounded-2xl p-3.5 text-xs font-semibold ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Bannière de Statut de Vérification (Anti-Fraude KYC) */}
        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  profile.estVerifie
                    ? "bg-emerald-100 text-emerald-700"
                    : profile.kycStatus === "EN_ATTENTE"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {profile.estVerifie ? (
                  <ShieldCheck className="h-6 w-6" />
                ) : (
                  <ShieldAlert className="h-6 w-6" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Statut de vérification d'identité
                  </h3>
                  {profile.estVerifie ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                      ✓ Badge Vérifié Actif
                    </span>
                  ) : profile.kycStatus === "EN_ATTENTE" ? (
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                      ⏳ Examen en cours
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                      Non vérifié
                    </span>
                  )}
                </div>

                <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-xl">
                  {profile.estVerifie
                    ? "Félicitations ! Votre pièce d'identité a été validée par l'administrateur. Vos annonces affichent le badge de confiance vert et sont mises en avant."
                    : profile.kycStatus === "EN_ATTENTE"
                    ? "Votre document a bien été téléversé et est en cours d'examen par l'administrateur. Dès validation, le badge vert sera automatiquement activé sur votre profil."
                    : "Pour rassurer les clients et obtenir plus de demandes d'interventions, téléversez la photo de votre pièce d'identité (CNI, Passeport ou Attestation d'identité)."}
                </p>
              </div>
            </div>
          </div>

          {/* Affichage du document KYC actuel s'il existe */}
          {latestKycDoc && (
            <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shrink-0 overflow-hidden">
                  {latestKycDoc.documentUrl.match(/\.(jpg|jpeg|png|webp)/i) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={latestKycDoc.documentUrl}
                      alt="CNI"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FileCheck className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span>Pièce d'identité soumise ({latestKycDoc.typePiece})</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        latestKycDoc.statut === "VALIDE"
                          ? "bg-emerald-100 text-emerald-800"
                          : latestKycDoc.statut === "REJETE"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {latestKycDoc.statut === "VALIDE"
                        ? "Validée"
                        : latestKycDoc.statut === "REJETE"
                        ? "Rejetée"
                        : "En attente"}
                    </span>
                  </div>
                  {latestKycDoc.numeroPiece && (
                    <p className="text-[11px] text-slate-500">N° : {latestKycDoc.numeroPiece}</p>
                  )}
                </div>
              </div>

              <a
                href={latestKycDoc.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-sm transition"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Voir</span>
              </a>
            </div>
          )}

          {/* Formulaire d'upload direct de la CNI si non vérifié */}
          {!profile.estVerifie && (
            <form
              onSubmit={handleSubmitKyc}
              className="mt-5 border-t border-slate-100 pt-5 text-xs space-y-4"
            >
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                <Camera className="h-4 w-4 text-emerald-600" />
                <span>Uploader la photo de votre CNI (Recto ou Document complet)</span>
              </h4>

              {/* Zone Drag & Drop / File Selector */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition ${
                  dragActive
                    ? "border-emerald-500 bg-emerald-50/50"
                    : cniFile
                    ? "border-emerald-400 bg-emerald-50/20"
                    : "border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {cniPreview ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative max-h-48 max-w-xs overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cniPreview}
                        alt="Aperçu CNI"
                        className="max-h-48 w-auto object-contain"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{cniFile?.name}</span>
                      <span className="text-slate-400 text-[10px]">
                        ({cniFile ? (cniFile.size / 1024).toFixed(0) + " Ko" : ""})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSelectedFile();
                      }}
                      className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Changer de photo</span>
                    </button>
                  </div>
                ) : cniFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileCheck className="h-10 w-10 text-emerald-600" />
                    <span className="font-bold text-slate-800">{cniFile.name}</span>
                    <span className="text-slate-400 text-[10px]">
                      ({(cniFile.size / 1024).toFixed(0)} Ko)
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSelectedFile();
                      }}
                      className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600 hover:bg-rose-100 transition mt-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs sm:text-sm">
                        Cliquez ici ou glissez votre photo de CNI
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Formats acceptés : JPG, PNG, WEBP ou PDF (Max 10 Mo)
                      </p>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                        <Camera className="h-3 w-3" /> Prendre une photo
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                        <ImageIcon className="h-3 w-3" /> Galerie
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Champ Numéro de pièce optionnel */}
              <div>
                <label className="block font-semibold text-slate-700">
                  Numéro de la pièce d'identité (Optionnel)
                </label>
                <input
                  type="text"
                  value={cniNumber}
                  onChange={(e) => setCniNumber(e.target.value)}
                  placeholder="Ex: CI-01928374 / N° CNI"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              {/* Bouton de soumission */}
              <button
                type="submit"
                disabled={submittingKyc || !cniFile}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-bold text-white shadow-md hover:bg-slate-800 disabled:opacity-40 transition w-full sm:w-auto text-xs"
              >
                {submittingKyc ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Téléversement et enregistrement en cours...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Envoyer la photo de ma CNI pour validation</span>
                  </>
                )}
              </button>
            </form>
          )}
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
            <span className="text-[11px] font-semibold text-slate-400">Avis clients reçus</span>
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

        {/* Formulaire de modification des coordonnées & Bio */}
        <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-base font-black text-slate-900">Modifier mes informations de contact</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Ces informations sont directement visibles sur votre fiche publique pour les clients.
          </p>

          <form onSubmit={handleSaveProfile} className="mt-4 space-y-4 text-xs">
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block font-bold text-slate-700">Numéro WhatsApp</label>
                <input
                  type="tel"
                  value={form.whatsappNumber}
                  onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                  placeholder="Ex: 0701020304"
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700">Numéro d'appel vocal</label>
                <input
                  type="tel"
                  value={form.callNumber}
                  onChange={(e) => setForm({ ...form, callNumber: e.target.value })}
                  placeholder="Ex: 0701020304"
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700">Présentation / Bio</label>
              <textarea
                rows={3}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Décrivez votre savoir-faire et vos garanties de qualité..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 disabled:opacity-50 transition"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Enregistrer mes modifications</span>
            </button>
          </form>
        </div>

        {/* Conseils pour maximiser ses contacts WhatsApp */}
        <div className="mt-6 rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-6 text-xs text-emerald-900">
          <h4 className="font-bold text-sm text-emerald-950">
            💡 Astuce Djassa Pro pour avoir plus de clients :
          </h4>
          <ul className="mt-2 space-y-1.5 list-disc pl-4 text-emerald-800">
            <li>Répondez poliment et rapidement sur WhatsApp dès qu'un client vous écrit.</li>
            <li>Proposez des tarifs clairs dès le départ pour instaurer la confiance.</li>
            <li>Demandez à vos clients satisfaits de laisser une note 5 étoiles sur votre fiche publique.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
