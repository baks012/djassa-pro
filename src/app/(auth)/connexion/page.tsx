"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Phone, Lock, AlertCircle, Loader2, ArrowRight } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const urlError = searchParams.get("error");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(urlError || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Identifiants invalides.");
        setLoading(false);
        return;
      }

      if (data.data?.role === "admin") {
        router.push("/admin");
      } else if (data.data?.role === "prestataire") {
        router.push("/dashboard/prestataire");
      } else {
        router.push(callbackUrl);
      }
      router.refresh();
    } catch {
      setError("Erreur de connexion. Vérifiez votre réseau.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 font-black text-white text-xl">
          D
        </div>
        <h1 className="mt-4 text-2xl font-black text-slate-900">Connexion</h1>
        <p className="mt-1 text-xs text-slate-500">
          Accédez à votre compte Djassa Pro (Prestataire ou Client)
        </p>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700">
            Téléphone (10 chiffres) ou Email
          </label>
          <div className="relative mt-1.5 flex items-center">
            <Phone className="absolute left-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Ex: 0701020304 ou email"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">Mot de passe</label>
          <div className="relative mt-1.5 flex items-center">
            <Lock className="absolute left-3.5 h-4 w-4 text-slate-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-98 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <span>Se connecter</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 border-t border-slate-100 pt-6 text-center text-xs text-slate-500">
        <p>Pas encore inscrit ?</p>
        <div className="mt-2 flex justify-center gap-4">
          <Link
            href="/inscription/prestataire"
            className="font-bold text-emerald-600 hover:underline"
          >
            Je suis Prestataire
          </Link>
          <span className="text-slate-300">•</span>
          <Link
            href="/inscription/client"
            className="font-bold text-slate-700 hover:underline"
          >
            Je suis Client
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-emerald-600" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
