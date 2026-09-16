import React from "react";
import Link from "next/link";
import { ShieldCheck, Heart, Code2 } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-slate-100 bg-white py-10 text-xs text-slate-500">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900">
              Djassa<span className="text-emerald-600">Pro</span>
            </span>
            <span>— Plateforme d'insertion et d'entraide pour la jeunesse ivoirienne.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/prestataires" className="hover:text-emerald-600 transition">
              Annuaire
            </Link>
            <Link href="/inscription/prestataire" className="hover:text-emerald-600 transition">
              Devenir prestataire
            </Link>
            <Link href="/connexion" className="hover:text-emerald-600 transition">
              Espace membre
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 text-[11px] text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Djassa Pro Côte d'Ivoire. Tous droits réservés.</p>
          <div className="flex flex-col items-center gap-1.5 sm:items-end">
            <div className="flex items-center gap-1">
              <span>Fait avec</span>
              <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
              <span>pour les artisans et travailleurs d'Abidjan &amp; CI</span>
            </div>
            <div className="flex items-center gap-1 text-slate-300">
              <Code2 className="h-3 w-3" />
              <span>
                Conçu &amp; développé par{" "}
                <span className="font-semibold text-emerald-600">Bakayoko Sory</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
