"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ArrowRight } from "lucide-react";
import { COMMUNES_CI } from "@/lib/security";

interface SearchBarProps {
  initialQuery?: string;
  initialCommune?: string;
  onSearch?: (query: string, commune: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  initialQuery = "",
  initialCommune = "Toutes les communes",
  onSearch,
}) => {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [commune, setCommune] = useState(initialCommune);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query, commune);
    } else {
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      if (commune && commune !== "Toutes les communes") params.set("commune", commune);
      router.push(`/prestataires?${params.toString()}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-2xl bg-white p-2 shadow-lg shadow-slate-200/50 ring-1 ring-slate-100 sm:p-2 sm:ring-2 sm:ring-emerald-600/10"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Champ texte métier / service */}
        <div className="relative flex flex-1 items-center">
          <Search className="absolute left-3.5 h-5 w-5 text-emerald-600" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: Plombier à Angré, Coiffeuse, Dépannage..."
            className="h-12 w-full rounded-xl bg-slate-50/80 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Sélecteur de Commune (Abidjan & CI) */}
        <div className="relative flex sm:w-56 items-center">
          <MapPin className="pointer-events-none absolute left-3.5 h-4 w-4 text-amber-500" />
          <select
            value={commune}
            onChange={(e) => setCommune(e.target.value)}
            className="h-12 w-full appearance-none rounded-xl bg-slate-50/80 pl-10 pr-8 text-sm font-medium text-slate-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
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
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-95"
        >
          <span>Trouver</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
};
