import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminRoute = path.startsWith('/admin') && path !== '/admin/login';
  const isApiAdminRoute =
    path.startsWith('/api') &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) &&
    !path.startsWith('/api/auth');

  if (!user && isAdminRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }

  if (!user && isApiAdminRoute) {
    return NextResponse.json({ error: 'Tidak terautentikasi. Silakan login sebagai admin.' }, { status: 401 });
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
