"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, MapPin, Star, MessageSquare, Phone, Copy } from "lucide-react";
import { Provider } from "@/types/provider";
import { formatFCFA, buildWhatsAppLink } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

interface ProviderCardProps {
  provider: Provider;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({ provider }) => {
  const { showToast } = useToast();
  const whatsappUrl = buildWhatsAppLink(
    provider.whatsappNumber,
    provider.prenom,
    provider.specialite
  );

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cleanPhone = `+225 ${provider.whatsappNumber.replace(/\D/g, "").slice(-10)}`;
    navigator.clipboard.writeText(cleanPhone);
    showToast(`Numéro copié : ${cleanPhone}`, "success");
  };

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-emerald-200">
      <div>
        <div className="flex items-start gap-3.5">
          {/* Avatar avec badge de disponibilité animé */}
          <Link
            href={`/prestataires/${provider.id}`}
            className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-2 ring-emerald-50 transition group-hover:ring-emerald-200"
          >
            <Image
              src={provider.photoUrl}
              alt={`${provider.prenom} ${provider.nom}`}
              fill
              sizes="64px"
              className="object-cover transition duration-300 group-hover:scale-110"
            />
            {provider.disponible ? (
              <span
                className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 shadow-sm animate-pulse"
                title="Disponible immédiatement"
              />
            ) : (
              <span
                className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-slate-400 shadow-sm"
                title="Actuellement en mission"
              />
            )}
          </Link>

          {/* Informations principales */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Link
                href={`/prestataires/${provider.id}`}
                className="truncate font-black text-slate-900 hover:text-emerald-700 transition"
              >
                {provider.prenom} {provider.nom.charAt(0)}.
              </Link>
              {provider.estVerifie && (
                <span
                  className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                  title="Identité vérifiée par l'équipe Djassa Pro"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="hidden xs:inline">Vérifié</span>
                </span>
              )}
            </div>

            <p className="mt-0.5 truncate text-xs font-bold text-emerald-700">
              {provider.specialite}
            </p>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <div className="flex items-center gap-1 font-semibold">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-extrabold text-slate-800">{provider.note.toFixed(1)}</span>
                <span className="text-slate-400 text-[11px]">({provider.avisCount})</span>
              </div>
              <div className="flex items-center gap-1 truncate text-slate-600 font-medium">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span className="truncate">
                  {provider.commune}
                  {provider.quartier ? `, ${provider.quartier}` : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tarif indicatif */}
        <div className="mt-3.5 flex items-center justify-between rounded-2xl bg-slate-50/90 px-3 py-2 text-xs transition group-hover:bg-emerald-50/50">
          <span className="text-slate-500 font-medium">Tarif indicatif</span>
          <span className="font-black text-slate-900 text-xs sm:text-sm">
            dès {formatFCFA(provider.prixIndicatif)}
          </span>
        </div>
      </div>

      {/* Actions WhatsApp, Appel & Copie (Mobile First) */}
      <div className="mt-3.5 flex items-center gap-2 pt-1">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-3 font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#20ba5a] hover:shadow-md hover:shadow-emerald-600/20 active:scale-95"
        >
          <MessageSquare className="h-4 w-4 fill-current" />
          <span className="text-xs tracking-wide">WhatsApp</span>
        </a>

        {provider.whatsappNumber && (
          <>
            <a
              href={`tel:+225${provider.whatsappNumber.replace(/\D/g, "").slice(-10)}`}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:text-emerald-700 hover:border-emerald-300 active:scale-95"
              title="Appel direct"
            >
              <Phone className="h-4 w-4" />
            </a>

            <button
              onClick={handleCopyPhone}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:text-emerald-700 hover:border-emerald-300 active:scale-95"
              title="Copier le numéro"
            >
              <Copy className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
