import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_CACHE_TTL_MS = 60 * 1000; // 60 seconds

// Simple in-memory cache for session validations.
// Edge functions are short-lived but reused — this saves backend hits on hot paths.
const validationCache = new Map<string, { valid: boolean; expiresAt: number }>();

async function validateSession(token: string): Promise<boolean> {
  const cached = validationCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.valid;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL
              || 'https://marketgrowth-production.up.railway.app';

  try {
    const res = await fetch(`${apiUrl}/api/admin/session`, {
      method: 'GET',
      headers: {
        'x-admin-session': token,
      },
      // Don't cache the upstream response itself; we cache locally instead
      cache: 'no-store',
    });

    const valid = res.ok;
    validationCache.set(token, {
      valid,
      expiresAt: Date.now() + SESSION_CACHE_TTL_MS,
    });

    // Trim cache if it grows too large (defensive)
    if (validationCache.size > 1000) {
      const now = Date.now();
      for (const [k, v] of validationCache.entries()) {
        if (v.expiresAt < now) validationCache.delete(k);
      }
    }

    return valid;
  } catch {
    // If backend is unreachable, fail closed (deny access).
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Login page itself must not be protected
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('admin_session')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const valid = await validateSession(token);
    if (!valid) {
      // Clear stale cookie on the redirect response
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('admin_session');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
