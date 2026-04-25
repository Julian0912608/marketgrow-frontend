import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  let password: string | undefined;
  try {
    const body = await req.json();
    password = body?.password;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (typeof password !== 'string' || password.length === 0) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 });
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL
              || 'https://marketgrowth-production.up.railway.app';

  let backendRes: Response;
  try {
    backendRes = await fetch(`${apiUrl}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': req.headers.get('x-forwarded-for') ?? '',
        'user-agent': req.headers.get('user-agent') ?? '',
      },
      body: JSON.stringify({ password }),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 502 });
  }

  if (!backendRes.ok) {
    // Don't leak which credential was wrong
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  let data: { token?: string; expiresAt?: string };
  try {
    data = await backendRes.json();
  } catch {
    return NextResponse.json({ error: 'Malformed backend response' }, { status: 502 });
  }

  if (!data.token) {
    return NextResponse.json({ error: 'Malformed backend response' }, { status: 502 });
  }

  const res = NextResponse.json({ ok: true });

  res.cookies.set('admin_session', data.token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   8 * 60 * 60, // 8 hours
    path:     '/',
  });

  return res;
}
