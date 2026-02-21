import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { RoutePath, isAuthRoute, isProtectedRoute } from '@/constants/routes'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const isAuth = isAuthRoute(request.nextUrl.pathname);
  const isRootRoute = request.nextUrl.pathname === RoutePath.ROOT;

  if (user && (isAuth || isRootRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = RoutePath.DASHBOARD;
    return NextResponse.redirect(url);
  }

  if (!user && isProtectedRoute(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = RoutePath.AUTH;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}