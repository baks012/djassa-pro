"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Check,
  X,
  Loader2,
  ExternalLink,
  MapPin,
  Phone,
  RefreshCw,
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
  kycStatus: string;
  documentUrl?: string;
  typePiece: string;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  totalProviders: number;
  verifiedProviders: number;
  pendingKyc: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [providers, setProviders] = useState<AdminProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "VERIFIED">("ALL");

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

  const handleVerify = async (providerId: string, estVerifie: boolean) => {
    setActionLoading(providerId);
    try {
      const res = await fetch("/api/admin/verify-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, estVerifie }),
      });

      if (res.ok) {
        setProviders((prev) =>
          prev.map((p) =>
            p.id === providerId
              ? {
                  ...p,
                  estVerifie,
                  kycStatus: estVerifie ? "VERIFIE" : "REJETE",
                }
              : p
          )
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredProviders = providers.filter((p) => {
    if (filter === "PENDING") return !p.estVerifie;
    if (filter === "VERIFIED") return p.estVerifie;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                Back-Office
              </span>
              <h1 className="text-xl font-black text-slate-900 sm:text-2xl">
                Tableau de bord Administrateur
              </h1>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Contrôle KYC des jeunes travailleurs, prévention des arnaques et validation des badges.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden xs:inline">Actualiser</span>
          </button>
        </div>

        {/* Métriques */}
        {stats && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400">Total Utilisateurs</span>
              <div className="mt-1 text-2xl font-black text-slate-900">{stats.totalUsers}</div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400">Prestataires inscrits</span>
              <div className="mt-1 text-2xl font-black text-emerald-700">{stats.totalProviders}</div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400">Badges "Vérifiés"</span>
              <div className="mt-1 text-2xl font-black text-slate-900">{stats.verifiedProviders}</div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400">Dossiers en attente</span>
              <div className="mt-1 text-2xl font-black text-amber-600">{stats.pendingKyc}</div>
            </div>
          </div>
        )}

        {/* Onglets de filtrage */}
        <div className="mt-8 flex items-center gap-2 border-b border-slate-200 pb-3 text-xs font-bold">
          <button
            onClick={() => setFilter("ALL")}
            className={`rounded-xl px-3 py-1.5 transition ${
              filter === "ALL" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Tous les prestataires ({providers.length})
          </button>
          <button
            onClick={() => setFilter("PENDING")}
            className={`rounded-xl px-3 py-1.5 transition ${
              filter === "PENDING" ? "bg-amber-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            En attente de vérification ({providers.filter((p) => !p.estVerifie).length})
          </button>
          <button
            onClick={() => setFilter("VERIFIED")}
            className={`rounded-xl px-3 py-1.5 transition ${
              filter === "VERIFIED" ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Vérifiés ({providers.filter((p) => p.estVerifie).length})
          </button>
        </div>

        {/* Liste des Prestataires pour Modération */}
        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : filteredProviders.length > 0 ? (
            filteredProviders.map((p) => (
              <div
                key={p.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      {p.prenom} {p.nom}
                    </h3>
                    {p.estVerifie ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <ShieldCheck className="h-3 w-3" />
                        Vérifié
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        Non vérifié
                      </span>
                    )}
                  </div>

                  <p className="mt-0.5 text-xs font-semibold text-emerald-700">{p.specialite}</p>

                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {p.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {p.commune}
                      {p.quartier ? ` (${p.quartier})` : ""}
                    </span>
                    <span className="text-[10px] text-slate-400">Inscrit le {new Date(p.createdAt).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>

                {/* Actions Administrateur */}
                <div className="flex items-center gap-2 pt-2 sm:pt-0">
                  {p.documentUrl && (
                    <a
                      href={p.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      title="Voir la pièce d'identité CNI"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Voir CNI</span>
                    </a>
                  )}

                  {!p.estVerifie ? (
                    <button
                      onClick={() => handleVerify(p.id, true)}
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
                      onClick={() => handleVerify(p.id, false)}
                      disabled={actionLoading === p.id}
                      className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 active:scale-95 transition disabled:opacity-50"
                    >
                      {actionLoading === p.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                      <span>Retirer le badge</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-xs text-slate-400">
              Aucun prestataire dans cette catégorie.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
