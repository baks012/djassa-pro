"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, User as UserIcon, LogOut, PlusCircle, LayoutDashboard } from "lucide-react";

interface UserSession {
  id: string;
  role: "client" | "prestataire" | "admin";
  prenom?: string;
  nom?: string;
}

export const Navbar = () => {
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setUser({
            id: data.user.id,
            role: data.user.role,
            prenom: data.user.profile?.prenom,
            nom: data.user.profile?.nom,
          });
        }
      })
      .catch(() => setUser(null));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo Djassa Pro */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 font-black text-white shadow-sm transition group-hover:bg-emerald-700">
            D
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-black tracking-tight text-slate-900">
                Djassa<span className="text-emerald-600">Pro</span>
              </span>
              <span className="rounded bg-emerald-100 px-1 py-0.2 text-[9px] font-bold text-emerald-800">
                CI
              </span>
            </div>
            <p className="text-[10px] font-medium text-slate-400 -mt-1 hidden xs:block">
              Entraide & Pros locaux
            </p>
          </div>
        </Link>

        {/* Liens de navigation Desktop */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/prestataires" className="hover:text-emerald-600 transition">
            Trouver un prestataire
          </Link>
          <Link href="/#comment-ca-marche" className="hover:text-emerald-600 transition">
            Comment ça marche
          </Link>
        </nav>

        {/* Actions Utilisateur */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <div className="flex items-center gap-2">
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
                >
                  <LayoutDashboard className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Admin</span>
                </Link>
              )}

              {user.role === "prestataire" && (
                <Link
                  href="/dashboard/prestataire"
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                >
                  <UserIcon className="h-3.5 w-3.5" />
                  <span>Mon Espace</span>
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 transition"
                title="Déconnexion"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/connexion"
                className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Connexion
              </Link>
              <Link
                href="/inscription/prestataire"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition active:scale-95"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Devenir Prestataire</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
