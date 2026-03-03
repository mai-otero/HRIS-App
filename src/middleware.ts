import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Start with a plain "continue" response that we may replace below.
  let supabaseResponse = NextResponse.next({ request });

  // IMPORTANT: always call getUser() — it refreshes the session token if
  // needed. Do NOT remove this call or the session will go stale.
  // The entire Supabase setup is wrapped in try/catch so that any failure
  // (missing env vars, paused project, network hiccup, cold start) causes
  // us to treat the user as unauthenticated rather than crashing the middleware
  // and returning a broken RSC payload that shows errors in the browser.
  let user = null;
  try {
    // Build a Supabase client that can read + write cookies on the response.
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            // Write updated cookies back to the request (for downstream middleware)
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            // Re-create the response so the new cookies are included
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              supabaseResponse.cookies.set(name, value, options as any)
            );
          },
        },
      }
    );

    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase unreachable or misconfigured — fail open (unauthenticated)
  }

  const { pathname } = request.nextUrl;

  // Auth callback routes must always pass through
  if (pathname.startsWith("/auth")) {
    return supabaseResponse;
  }

  // Unauthenticated → send to login
  if (!user && pathname !== "/login") {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // Already logged in → skip the login page
  if (user && pathname === "/login") {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}

export const config = {
  // Exclude ALL /_next/* paths (static files, image optimizer, internal routes
  // like /_next/undefined that webpack tries when a chunk isn't pre-cached),
  // plus common static asset extensions and Next.js metadata routes.
  // Previously, only _next/static and _next/image were excluded; that caused
  // /_next/undefined (webpack's fallback URL when r.u=e=>{} returns undefined)
  // to hit the middleware, get a 307 redirect to /login, and receive HTML
  // instead of a JS chunk — which broke the webpack chunk-load promise and
  // produced "Unexpected end of JSON input".
  matcher: [
    "/((?!_next|favicon\\.ico|icon(?:\\.[^/?]+)?|apple-icon(?:\\.[^/?]+)?|manifest(?:\\.[^/?]+)?|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
