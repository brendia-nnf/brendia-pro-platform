import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

// Create the intl middleware
const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  // First, handle the Supabase session
  const supabaseResponse = await updateSession(request);

  // If updateSession returned a redirect, use that
  if (supabaseResponse.headers.get("location")) {
    return supabaseResponse;
  }

  // Then handle internationalization
  const intlResponse = intlMiddleware(request);

  // Copy Supabase cookies to the intl response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, {
      ...cookie,
    });
  });

  return intlResponse;
}

export const config = {
  // Match all pathnames except for
  // - /api (API routes)
  // - /auth (Auth routes like activation - outside i18n)
  // - /_next (Next.js internals)
  // - /_vercel (Vercel internals)
  // - /.*\..* (files with extensions, e.g. favicon.ico)
  matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
