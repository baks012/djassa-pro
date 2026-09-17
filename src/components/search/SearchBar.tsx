"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ArrowRight, Sparkles } from "lucide-react";
import { COMMUNES_CI } from "@/lib/security";

interface SearchBarProps {
  initialQuery?: string;
  initialCommune?: string;
  onSearch?: (query: string, commune: string) => void;
  showSuggestions?: boolean;
}

const POPULAR_SEARCHES = [
  { label: "Plomberie", query: "Plomberie" },
  { label: "Électricité", query: "Électricité" },
  { label: "Coiffure", query: "Coiffure" },
  { label: "Livreur", query: "Livreur" },
  { label: "Ménage", query: "Ménage" },
];

export const SearchBar: React.FC<SearchBarProps> = ({
  initialQuery = "",
  initialCommune = "Toutes les communes",
  onSearch,
  showSuggestions = true,
}) => {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [commune, setCommune] = useState(initialCommune);

  const executeSearch = (q: string, c: string) => {
    if (onSearch) {
      onSearch(q, c);
    } else {
      const params = new URLSearchParams();
      if (q) params.set("query", q);
      if (c && c !== "Toutes les communes") params.set("commune", c);
      router.push(`/prestataires?${params.toString()}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query, commune);
  };

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="w-full rounded-3xl bg-white p-2 shadow-xl shadow-slate-900/10 ring-1 ring-slate-100 sm:p-2.5 transition-all duration-300 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:shadow-2xl"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Champ texte métier / service */}
          <div className="relative flex flex-1 items-center">
            <Search className="absolute left-4 h-5 w-5 text-emerald-600 transition-transform group-focus-within:scale-110" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex: Plombier à Angré, Coiffeuse, Dépannage..."
              className="h-12 w-full rounded-2xl bg-slate-50/80 pl-12 pr-4 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white"
            />
          </div>

          {/* Sélecteur de Commune (Abidjan & CI) */}
          <div className="relative flex sm:w-56 items-center">
            <MapPin className="pointer-events-none absolute left-3.5 h-4 w-4 text-amber-500" />
            <select
              value={commune}
              onChange={(e) => setCommune(e.target.value)}
              className="h-12 w-full appearance-none rounded-2xl bg-slate-50/80 pl-10 pr-8 text-xs sm:text-sm font-semibold text-slate-700 outline-none transition focus:bg-white cursor-pointer"
            >
              <option value="Toutes les communes">Toutes les communes</option>
              {COMMUNES_CI.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 text-xs text-slate-400">▼</div>
          </div>

          {/* Bouton de soumission */}
          <button
            type="submit"
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 font-bold text-white shadow-md shadow-emerald-600/30 transition-all duration-200 hover:bg-emerald-700 hover:scale-[1.02] active:scale-95"
          >
            <span>Trouver</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* Suggestions rapides interactives */}
      {showSuggestions && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs">
          <span className="text-emerald-200/80 flex items-center gap-1 font-medium text-[11px] mr-1">
            <Sparkles className="h-3 w-3 text-amber-400" />
            Recherches populaires :
          </span>
          {POPULAR_SEARCHES.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setQuery(item.query);
                executeSearch(item.query, commune);
              }}
              className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-emerald-100 backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:scale-105 hover:text-white"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
