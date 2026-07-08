import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get the pathname
  const pathname = request.nextUrl.pathname;

  // Extract locale from pathname
  const localeMatch = pathname.match(/^\/(hr|en)(\/|$)/);
  const locale = localeMatch ? localeMatch[1] : "hr";

  // Define protected routes (dashboard, admin, etc.)
  const protectedRoutes = ["/dashboard", "/profil", "/tecaj", "/certifikat", "/webshop"];
  const adminRoutes = ["/admin"];
  const authRoutes = ["/prijava", "/registracija"];

  // Check if current path (without locale) matches protected routes
  const pathWithoutLocale = pathname.replace(/^\/(hr|en)/, "") || "/";

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathWithoutLocale.startsWith(route)
  );
  const isAdminRoute = adminRoutes.some((route) =>
    pathWithoutLocale.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) =>
    pathWithoutLocale.startsWith(route)
  );

  // Redirect unauthenticated users to login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/prijava`;
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect unauthenticated users trying to access admin
  if (!user && isAdminRoute) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/prijava`;
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Check admin role for admin routes
  if (user && isAdminRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/dashboard`;
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    const redirectTo = request.nextUrl.searchParams.get("redirectTo");
    url.pathname = redirectTo || `/${locale}/dashboard`;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
