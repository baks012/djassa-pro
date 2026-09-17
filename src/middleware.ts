import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, verifyToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const user = token ? await verifyToken(token) : null;

  // 1. Protection du panneau d'administration (/admin)
  if (pathname.startsWith("/admin")) {
    if (!user || user.role !== "admin") {
      const url = new URL("/connexion", request.url);
      url.searchParams.set("callbackUrl", pathname);
      url.searchParams.set("error", "Accès réservé aux administrateurs.");
      return NextResponse.redirect(url);
    }
  }

  // 2. Protection des dashboards utilisateurs (/dashboard)
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      const url = new URL("/connexion", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
