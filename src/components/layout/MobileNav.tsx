"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusCircle, User } from "lucide-react";

export const MobileNav = () => {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Accueil", icon: Home },
    { href: "/prestataires", label: "Recherche", icon: Search },
    { href: "/inscription/prestataire", label: "S'inscrire", icon: PlusCircle },
    { href: "/connexion", label: "Compte", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/95 px-3 py-2 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1 text-[11px] font-medium transition ${
                isActive
                  ? "text-emerald-600 font-bold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-emerald-600" : "text-slate-500"}`} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
