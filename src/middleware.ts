import { type NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intl = createMiddleware(routing);

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const redirectMatch = await resolveRedirect(request);
  if (redirectMatch) {
    return NextResponse.redirect(new URL(redirectMatch.to, request.url), redirectMatch.status);
  }
  return intl(request);
}

async function resolveRedirect(
  request: NextRequest,
): Promise<{ to: string; status: 301 | 302 } | null> {
  const pathname = request.nextUrl.pathname;
  if (!pathname || pathname === '/') return null;
  const base = request.nextUrl.origin;
  try {
    const res = await fetch(`${base}/api/redirect-lookup?from=${encodeURIComponent(pathname)}`, {
      next: { revalidate: 300, tags: ['redirects'] },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      to: string;
      type: '301' | '302';
    } | null;
    if (!data) return null;
    return { to: data.to, status: data.type === '302' ? 302 : 301 };
  } catch (err) {
    console.error('[middleware] redirect lookup failed', err);
    return null;
  }
}

export const config = {
  matcher: [
    // Skip admin, payload API, static files, images, favicon, robots, sitemap
    '/((?!admin|api|_next|brand|favicon|robots|sitemap|.*\\..*).*)',
  ],
};
