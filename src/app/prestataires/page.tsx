"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/search/SearchBar";
import { ProviderCard } from "@/components/cards/ProviderCard";
import { Provider } from "@/types/provider";
import { SlidersHorizontal, UserX, Loader2 } from "lucide-react";

function PrestatairesDirectoryContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || "";
  const initialCommune = searchParams.get("commune") || "Toutes les communes";

  const [query, setQuery] = useState(initialQuery);
  const [commune, setCommune] = useState(initialCommune);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      if (commune && commune !== "Toutes les communes") params.set("commune", commune);
      if (onlyVerified) params.set("onlyVerified", "true");

      const res = await fetch(`/api/providers?${params.toString()}`);
      const data = await res.json();
      if (data?.providers) {
        setProviders(data.providers);
      }
    } catch (e) {
      console.error("Erreur de chargement :", e);
    } finally {
      setLoading(false);
    }
  }, [query, commune, onlyVerified]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* Titre & En-tête */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
          Annuaire des prestataires à Abidjan & CI
        </h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Trouvez les jeunes artisans, réparateurs et professionnels disponibles dans votre commune.
        </p>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <SearchBar
          initialQuery={query}
          initialCommune={commune}
          onSearch={(q, c) => {
            setQuery(q);
            setCommune(c);
          }}
        />
      </div>

      {/* Filtres interactifs rapides */}
      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
        <div className="flex items-center gap-1 font-bold text-slate-700 mr-1">
          <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" />
          <span>Filtres :</span>
        </div>

        {/* Toggle Vérifié */}
        <button
          type="button"
          onClick={() => setOnlyVerified(!onlyVerified)}
          className={`rounded-full px-3.5 py-1.5 font-semibold transition ${
            onlyVerified
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
          }`}
        >
          ✓ Profils vérifiés uniquement
        </button>

        {/* Filtres rapides par commune populaire */}
        {["Cocody", "Yopougon", "Koumassi", "Marcory"].map((cName) => (
          <button
            key={cName}
            type="button"
            onClick={() => setCommune(commune === cName ? "Toutes les communes" : cName)}
            className={`rounded-full px-3 py-1.5 font-medium transition ${
              commune === cName
                ? "bg-amber-500 text-white shadow-sm font-bold"
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
            }`}
          >
            {cName}
          </button>
        ))}

        {(query || commune !== "Toutes les communes" || onlyVerified) && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCommune("Toutes les communes");
              setOnlyVerified(false);
            }}
            className="text-slate-400 hover:text-rose-600 ml-auto text-xs underline"
          >
            Effacer les filtres
          </button>
        )}
      </div>

      {/* Compteur de résultats */}
      <div className="mb-4 text-xs font-semibold text-slate-500">
        {loading ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
            Recherche des prestataires en cours...
          </span>
        ) : (
          `${providers.length} prestataire${providers.length > 1 ? "s" : ""} trouvé${
            providers.length > 1 ? "s" : ""
          }`
        )}
      </div>

      {/* Résultats */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-2xl border border-slate-100 bg-white p-4"
            />
          ))}
        </div>
      ) : providers.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <UserX className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">
            Aucun prestataire trouvé
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            Aucun professionnel ne correspond à ces critères pour l'instant. Essayez d'élargir la commune ou le métier recherché.
          </p>
          <button
            onClick={() => {
              setQuery("");
              setCommune("Toutes les communes");
              setOnlyVerified(false);
            }}
            className="mt-5 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
          >
            Réinitialiser la recherche
          </button>
        </div>
      )}
    </div>
  );
}

export default function PrestatairesDirectoryPage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-6">
      <Suspense
        fallback={
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        }
      >
        <PrestatairesDirectoryContent />
      </Suspense>
    </div>
  );
}
