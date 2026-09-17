"use client";

import React, { useState } from "react";
import { Star, Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";

interface ReviewFormProps {
  providerId: string;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ providerId }) => {
  const router = useRouter();
  const [note, setNote] = useState(5);
  const [hoverNote, setHoverNote] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/providers/${providerId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note, commentaire }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erreur lors de l'envoi de l'avis.");
      }

      setMessage({ type: "success", text: "Merci ! Votre avis a été enregistré." });
      setCommentaire("");
      router.refresh();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Erreur de soumission.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-xs">
      <h4 className="font-bold text-slate-900 text-sm">Laisser un avis sur ce prestataire</h4>
      <p className="mt-0.5 text-slate-500 text-[11px]">
        Partagez votre expérience pour aider les autres habitants de la commune.
      </p>

      {message && (
        <div
          className={`mt-3 rounded-xl p-2.5 font-semibold text-xs ${
            message.type === "success"
              ? "bg-emerald-100/70 text-emerald-800"
              : "bg-rose-100/70 text-rose-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Étoiles interactives */}
      <div className="mt-3 flex items-center gap-1.5">
        <span className="font-semibold text-slate-700 mr-1">Votre note :</span>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setNote(star)}
            onMouseEnter={() => setHoverNote(star)}
            onMouseLeave={() => setHoverNote(0)}
            className="p-1 text-slate-300 hover:scale-110 transition"
          >
            <Star
              className={`h-5 w-5 ${
                (hoverNote || note) >= star
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-300"
              }`}
            />
          </button>
        ))}
        <span className="ml-2 font-bold text-slate-800">{note} / 5</span>
      </div>

      {/* Commentaire */}
      <div className="mt-3">
        <textarea
          rows={3}
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          placeholder="Ponctualité, qualité du travail, respect du prix convenu..."
          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs outline-none transition focus:border-emerald-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-3 flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 disabled:opacity-50 transition"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Send className="h-3.5 w-3.5" />
        )}
        <span>Publier mon avis</span>
      </button>
    </form>
  );
};
