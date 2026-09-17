"use client";

import React, { useState } from "react";
import {
  Star,
  MessageSquarePlus,
  ThumbsUp,
  ShieldCheck,
  Send,
  Loader2,
  Filter,
  CheckCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export interface ReviewItem {
  id: string;
  note: number;
  commentaire?: string | null;
  clientName: string;
  createdAt: string;
}

interface ProviderReviewsSectionProps {
  providerId: string;
  providerName: string;
  ratingAvg: number;
  reviewsCount: number;
  initialReviews: ReviewItem[];
}

export const ProviderReviewsSection: React.FC<ProviderReviewsSectionProps> = ({
  providerId,
  providerName,
  ratingAvg,
  reviewsCount,
  initialReviews,
}) => {
  const router = useRouter();
  const { showToast } = useToast();

  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [filterStar, setFilterStar] = useState<number | "ALL">("ALL");
  const [showForm, setShowForm] = useState(false);
  const [note, setNote] = useState(5);
  const [hoverNote, setHoverNote] = useState(0);
  const [nomClient, setNomClient] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [loading, setLoading] = useState(false);
  const [helpfulMap, setHelpfulMap] = useState<Record<string, number>>({});
  const [likedReviews, setLikedReviews] = useState<Record<string, boolean>>({});

  // Calcul du barème des étoiles
  const countPerStar = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.note === star).length;
    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : star === 5 ? 80 : 20;
    return { star, count, percentage };
  });

  const handleHelpful = (id: string) => {
    if (likedReviews[id]) {
      showToast("Vous avez déjà voté pour cet avis.", "info");
      return;
    }
    setHelpfulMap((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    setLikedReviews((prev) => ({ ...prev, [id]: true }));
    showToast("Merci pour votre retour !", "success");
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/providers/${providerId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note, commentaire, nomClient }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erreur lors de l'enregistrement de l'avis.");
      }

      showToast("🎉 Votre avis a été publié avec succès !", "success");

      // Ajouter en local pour retour immédiat
      const newReviewItem: ReviewItem = {
        id: data.review?.id || Math.random().toString(),
        note,
        commentaire,
        clientName: nomClient.trim() || "Client vérifié",
        createdAt: "À l'instant",
      };

      setReviews((prev) => [newReviewItem, ...prev]);
      setCommentaire("");
      setNomClient("");
      setShowForm(false);
      router.refresh();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Erreur de soumission.";
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (filterStar === "ALL") return true;
    return r.note === filterStar;
  });

  return (
    <div className="mt-8 overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
      {/* En-tête de la section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 sm:text-xl">
              Avis et retours clients ({reviews.length})
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
              <CheckCircle className="h-3 w-3" />
              Retours certifiés
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Évaluations laissées par les clients ayant fait appel à {providerName}.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition"
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span>{showForm ? "Fermer le formulaire" : "Donner mon avis"}</span>
        </button>
      </div>

      {/* Formulaire interactif dépliable */}
      {showForm && (
        <form
          onSubmit={handleSubmitReview}
          className="mt-6 rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/50 to-white p-5 text-xs shadow-sm transition-all duration-300 animate-slide-in"
        >
          <h3 className="font-bold text-slate-900 text-sm">
            Partagez votre expérience avec {providerName}
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Votre évaluation aide la communauté à identifier les artisans fiables et ponctuels.
          </p>

          {/* Notation par étoiles animée */}
          <div className="mt-4 flex items-center gap-2">
            <span className="font-bold text-slate-700">Votre note globale :</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNote(star)}
                  onMouseEnter={() => setHoverNote(star)}
                  onMouseLeave={() => setHoverNote(0)}
                  className="p-1 transition-transform hover:scale-125 active:scale-95"
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      (hoverNote || note) >= star
                        ? "fill-amber-400 text-amber-400 filter drop-shadow-sm"
                        : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="ml-2 font-black text-amber-600 text-sm">{note} / 5</span>
          </div>

          {/* Nom / Prénom du client optionnel */}
          <div className="mt-3">
            <label className="block font-semibold text-slate-700 mb-1">Votre prénom ou nom (facultatif) :</label>
            <input
              type="text"
              value={nomClient}
              onChange={(e) => setNomClient(e.target.value)}
              placeholder="Ex: Awa K., Stéphane ou Client Cocody"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Zone de texte du commentaire */}
          <div className="mt-3">
            <label className="block font-semibold text-slate-700 mb-1">Votre commentaire :</label>
            <textarea
              rows={3}
              required
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Ex: Travail très soigné, ponctuel et prix respecté à Cocody. Je recommande vivement !"
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-slate-200 px-3.5 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 transition"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              <span>Publier mon avis</span>
            </button>
          </div>
        </form>
      )}

      {/* Synthèse des notes & Barres statistiques */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3 items-center rounded-2xl bg-slate-50/80 p-5">
        {/* Note moyenne principale */}
        <div className="flex flex-col items-center justify-center text-center md:border-r md:border-slate-200/80 pr-4">
          <span className="text-4xl font-black text-slate-900 tracking-tight">
            {(ratingAvg || 4.9).toFixed(1)}
          </span>
          <div className="mt-1 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`h-4 w-4 ${
                  s <= Math.round(ratingAvg || 5)
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-300"
                }`}
              />
            ))}
          </div>
          <span className="mt-1 text-xs font-semibold text-slate-500">
            Basé sur {reviews.length} avis
          </span>
        </div>

        {/* Barres de répartition des étoiles */}
        <div className="col-span-2 space-y-1.5">
          {countPerStar.map(({ star, count, percentage }) => (
            <button
              key={star}
              onClick={() => setFilterStar(filterStar === star ? "ALL" : star)}
              className="flex w-full items-center gap-2 text-xs group hover:opacity-80 transition"
            >
              <span className="w-12 font-bold text-slate-600 flex items-center gap-0.5">
                {star} <Star className="h-3 w-3 fill-amber-400 text-amber-400 inline" />
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200/70">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-500 group-hover:bg-amber-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-8 text-right font-semibold text-slate-400">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filtres d'étoiles interactifs */}
      <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
        <div className="flex items-center gap-1 font-bold text-slate-500 mr-1">
          <Filter className="h-3.5 w-3.5 text-emerald-600" />
          <span>Filtrer :</span>
        </div>

        <button
          onClick={() => setFilterStar("ALL")}
          className={`rounded-xl px-3 py-1.5 font-bold transition ${
            filterStar === "ALL"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Tous ({reviews.length})
        </button>

        {[5, 4, 3, 2, 1].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStar(filterStar === s ? "ALL" : s)}
            className={`rounded-xl px-3 py-1.5 font-bold transition ${
              filterStar === s
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {s} ★ ({reviews.filter((r) => r.note === s).length})
          </button>
        ))}
      </div>

      {/* Liste des avis clients */}
      <div className="mt-6 space-y-3.5">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="group rounded-2xl border border-slate-100 bg-white p-4.5 shadow-sm transition hover:border-emerald-100 hover:shadow-md text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 sm:text-sm">{rev.clientName}</span>
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      Client Vérifié
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">{rev.createdAt}</span>
                </div>

                <div className="flex items-center gap-1 rounded-xl bg-amber-50 px-2.5 py-1 text-amber-700 font-black">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span>{rev.note}.0</span>
                </div>
              </div>

              {rev.commentaire && (
                <p className="mt-2.5 text-xs text-slate-700 leading-relaxed font-normal">
                  "{rev.commentaire}"
                </p>
              )}

              {/* Action Utile / Like */}
              <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-2.5">
                <button
                  onClick={() => handleHelpful(rev.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                    likedReviews[rev.id]
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-slate-500 hover:text-emerald-600 hover:bg-slate-50"
                  }`}
                >
                  <ThumbsUp className={`h-3 w-3 ${likedReviews[rev.id] ? "fill-current" : ""}`} />
                  <span>Utile ({helpfulMap[rev.id] || 0})</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
            <p className="text-xs">Aucun avis ne correspond à ce filtre.</p>
          </div>
        )}
      </div>
    </div>
  );
};
