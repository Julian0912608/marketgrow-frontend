// app/api/admin-auth/logout/route.ts
//
// Logout: revoke session backend-side, clear cookie client-side.

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const session = req.cookies.get('admin_session')?.value;

  if (session) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
                || 'https://marketgrowth-production.up.railway.app';
    try {
      await fetch(`${apiUrl}/api/admin/logout`, {
        method: 'POST',
        headers: { 'x-admin-session': session },
        cache: 'no-store',
      });
    } catch {
      // Best effort: continue with cookie clear even if backend call fails
    }
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.delete('admin_session');
  return res;
}
