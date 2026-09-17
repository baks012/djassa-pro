"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Check,
  X,
  Loader2,
  ExternalLink,
  MapPin,
  Phone,
  RefreshCw,
  Eye,
  FileCheck,
  Ban,
  UserCheck,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

interface AdminProvider {
  id: string;
  nom: string;
  prenom: string;
  phone: string;
  email?: string;
  commune: string;
  quartier?: string;
  specialite: string;
  disponible: boolean;
  estVerifie: boolean;
  kycStatus: "NON_VERIFIE" | "EN_ATTENTE" | "VERIFIE" | "REJETE";
  isActive: boolean;
  motifRejet?: string;
  documentUrl?: string;
  typePiece: string;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  totalProviders: number;
  verifiedProviders: number;
  pendingKyc: number;
  rejectedProviders: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [providers, setProviders] = useState<AdminProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "VERIFIED" | "REJECTED">("ALL");
  const [selectedDoc, setSelectedDoc] = useState<{ url: string; name: string } | null>(null);

  // Modal de rejet
  const [rejectingProvider, setRejectingProvider] = useState<AdminProvider | null>(null);
  const [motifRejet, setMotifRejet] = useState("Photo non conforme ou pièce d'identité invalide");
  const [customMotif, setCustomMotif] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data?.stats) {
        setStats(data.stats);
        setProviders(data.providers);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (providerId: string, action: "APPROVE" | "REJECT" | "ACTIVATE", customReason?: string) => {
    setActionLoading(providerId);
    try {
      const res = await fetch("/api/admin/verify-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId,
          action,
          motifRejet: customReason || motifRejet,
        }),
      });

      if (res.ok) {
        await loadData();
        setRejectingProvider(null);
        setCustomMotif("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredProviders = providers.filter((p) => {
    if (filter === "PENDING") return p.kycStatus === "EN_ATTENTE" && p.isActive;
    if (filter === "VERIFIED") return p.estVerifie && p.isActive;
    if (filter === "REJECTED") return p.kycStatus === "REJETE" || !p.isActive;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                Espace Modération
              </span>
              <h1 className="text-xl font-black text-slate-900 sm:text-2xl">
                Gestion & Contrôle des Prestataires
              </h1>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Validez les badges de confiance ou rejetez les inscriptions indésirables pour les masquer de la plateforme.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
            <span>Actualiser</span>
          </button>
        </div>

        {/* Métriques */}
        {stats && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400">Total Inscrits</span>
              <div className="mt-1 text-2xl font-black text-slate-900">{stats.totalProviders}</div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400">Badges Vérifiés (En ligne)</span>
              <div className="mt-1 text-2xl font-black text-emerald-700">{stats.verifiedProviders}</div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400">Dossiers en attente</span>
              <div className="mt-1 text-2xl font-black text-amber-600">{stats.pendingKyc}</div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400">Rejetés / Masqués</span>
              <div className="mt-1 text-2xl font-black text-rose-600">{stats.rejectedProviders}</div>
            </div>
          </div>
        )}

        {/* Onglets de filtrage */}
        <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 text-xs font-bold">
          <button
            onClick={() => setFilter("ALL")}
            className={`rounded-xl px-3.5 py-2 transition ${
              filter === "ALL" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Tous ({providers.length})
          </button>
          <button
            onClick={() => setFilter("PENDING")}
            className={`rounded-xl px-3.5 py-2 transition ${
              filter === "PENDING" ? "bg-amber-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            En attente ({providers.filter((p) => p.kycStatus === "EN_ATTENTE" && p.isActive).length})
          </button>
          <button
            onClick={() => setFilter("VERIFIED")}
            className={`rounded-xl px-3.5 py-2 transition ${
              filter === "VERIFIED" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Vérifiés ({providers.filter((p) => p.estVerifie && p.isActive).length})
          </button>
          <button
            onClick={() => setFilter("REJECTED")}
            className={`rounded-xl px-3.5 py-2 transition ${
              filter === "REJECTED" ? "bg-rose-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            🚫 Rejetés / Masqués ({providers.filter((p) => !p.isActive || p.kycStatus === "REJETE").length})
          </button>
        </div>

        {/* Liste des Prestataires pour Modération */}
        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : filteredProviders.length > 0 ? (
            filteredProviders.map((p) => {
              const isRejected = !p.isActive || p.kycStatus === "REJETE";

              return (
                <div
                  key={p.id}
                  className={`flex flex-col justify-between gap-4 rounded-2xl border p-4.5 shadow-sm transition sm:flex-row sm:items-center ${
                    isRejected
                      ? "border-rose-200 bg-rose-50/40 opacity-90"
                      : "border-slate-100 bg-white"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        {p.prenom} {p.nom}
                      </h3>

                      {isRejected ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-200">
                          <Ban className="h-3 w-3" />
                          Masqué / Rejeté du site
                        </span>
                      ) : p.estVerifie ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          <ShieldCheck className="h-3 w-3 text-emerald-600" />
                          Vérifié & Public
                        </span>
                      ) : p.kycStatus === "EN_ATTENTE" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                          ⏳ Examen CNI en attente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                          Non vérifié (Public)
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-emerald-700">{p.specialite}</p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {p.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {p.commune}
                        {p.quartier ? ` (${p.quartier})` : ""}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Inscrit le {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                    </div>

                    {isRejected && p.motifRejet && (
                      <p className="mt-1 text-[11px] font-medium text-rose-700 bg-rose-100/70 rounded-lg px-2.5 py-1 inline-block">
                        ⚠️ Motif : {p.motifRejet}
                      </p>
                    )}
                  </div>

                  {/* Actions Administrateur */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                    {p.documentUrl && (
                      <button
                        onClick={() =>
                          setSelectedDoc({
                            url: p.documentUrl!,
                            name: `${p.prenom} ${p.nom}`,
                          })
                        }
                        className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-sm"
                        title="Inspecter la pièce d'identité CNI"
                      >
                        <Eye className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Voir CNI</span>
                      </button>
                    )}

                    {isRejected ? (
                      /* Bouton Réactiver */
                      <button
                        onClick={() => handleAction(p.id, "ACTIVATE")}
                        disabled={actionLoading === p.id}
                        className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 active:scale-95 transition disabled:opacity-50"
                        title="Réintégrer ce prestataire dans l'annuaire public"
                      >
                        {actionLoading === p.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                        <span>Réactiver le profil</span>
                      </button>
                    ) : (
                      <>
                        {/* Bouton Valider Badge */}
                        {!p.estVerifie ? (
                          <button
                            onClick={() => handleAction(p.id, "APPROVE")}
                            disabled={actionLoading === p.id}
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50"
                          >
                            {actionLoading === p.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            <span>Valider le badge</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction(p.id, "ACTIVATE")}
                            disabled={actionLoading === p.id}
                            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition disabled:opacity-50"
                            title="Retirer uniquement le badge vérifié sans bloquer le profil"
                          >
                            <span>Retirer badge</span>
                          </button>
                        )}

                        {/* BOUTON REJETER L'INSCRIPTION & MASQUER */}
                        <button
                          onClick={() => setRejectingProvider(p)}
                          disabled={actionLoading === p.id}
                          className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 active:scale-95 transition disabled:opacity-50"
                          title="Rejeter et masquer ce prestataire de la plateforme"
                        >
                          <Ban className="h-3.5 w-3.5 text-rose-600" />
                          <span>Rejeter</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
              Aucun prestataire dans cette catégorie.
            </div>
          )}
        </div>

        {/* MODAL DE REJET D'INSCRIPTION */}
        {rejectingProvider && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm animate-fade-in"
            onClick={() => setRejectingProvider(null)}
          >
            <div
              className="w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl animate-scale-in text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Rejeter l'inscription
                  </h3>
                  <p className="text-slate-500 text-[11px]">
                    {rejectingProvider.prenom} {rejectingProvider.nom} ({rejectingProvider.specialite})
                  </p>
                </div>
              </div>

              <p className="mt-4 text-slate-600 leading-relaxed">
                Ce prestataire sera <strong className="text-rose-700">immédiatement masqué</strong> de l'annuaire public et ne pourra plus recevoir de contacts de clients.
              </p>

              {/* Sélection du motif */}
              <div className="mt-4 space-y-2">
                <label className="block font-bold text-slate-700">Motif du rejet :</label>
                <select
                  value={motifRejet}
                  onChange={(e) => setMotifRejet(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs outline-none focus:border-rose-500"
                >
                  <option value="Photo de profil non conforme ou floue">Photo de profil non conforme ou floue</option>
                  <option value="Pièce d'identité (CNI) illisible ou invalide">Pièce d'identité (CNI) illisible ou invalide</option>
                  <option value="Numéro de téléphone non joignable">Numéro de téléphone non joignable</option>
                  <option value="Faux profil ou usurpation d'identité">Faux profil ou usurpation d'identité</option>
                  <option value="AUTRE">Autre motif personnalisé...</option>
                </select>

                {motifRejet === "AUTRE" && (
                  <input
                    type="text"
                    required
                    value={customMotif}
                    onChange={(e) => setCustomMotif(e.target.value)}
                    placeholder="Précisez le motif du rejet..."
                    className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs outline-none focus:border-rose-500"
                  />
                )}
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRejectingProvider(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleAction(
                      rejectingProvider.id,
                      "REJECT",
                      motifRejet === "AUTRE" ? customMotif : motifRejet
                    )
                  }
                  disabled={actionLoading === rejectingProvider.id}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 active:scale-95 transition disabled:opacity-50"
                >
                  {actionLoading === rejectingProvider.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Ban className="h-4 w-4" />
                  )}
                  <span>Confirmer le rejet</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de prévisualisation CNI */}
        {selectedDoc && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm"
            onClick={() => setSelectedDoc(null)}
          >
            <div
              className="relative max-h-[90vh] max-w-2xl w-full overflow-hidden rounded-3xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Pièce d'identité de {selectedDoc.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={selectedDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Plein écran</span>
                  </a>
                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 flex items-center justify-center max-h-[70vh] overflow-auto bg-slate-100/50">
                {selectedDoc.url.match(/\.(jpg|jpeg|png|webp)/i) || selectedDoc.url.includes("supabase.co/storage") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedDoc.url}
                    alt={`CNI de ${selectedDoc.name}`}
                    className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-md"
                  />
                ) : (
                  <iframe
                    src={selectedDoc.url}
                    title="Document CNI"
                    className="h-[60vh] w-full rounded-xl border border-slate-200"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
