// app/api/admin-proxy/[...path]/route.ts
//
// Server-side proxy zodat de admin frontend nooit meer het session token
// uit document.cookie hoeft te lezen. De httpOnly cookie wordt door de
// browser automatisch meegestuurd naar deze route, en wij forwarden hem
// als header naar de Railway backend.
//
// Frontend gebruik:
//   await fetch('/api/admin-proxy/admin/kpis')
//   await fetch('/api/admin-proxy/admin/tenants/X/suspend', { method:'POST' })
//
// Niet meer:
//   document.cookie.split(...) // ← oude patroon, verwijderd

import { NextRequest, NextResponse } from 'next/server';

const apiBase = () => process.env.NEXT_PUBLIC_API_URL
                   || 'https://marketgrowth-production.up.railway.app';

async function forward(req: NextRequest, path: string[]) {
  const session = req.cookies.get('admin_session')?.value;
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const targetPath = path.join('/');
  const search     = req.nextUrl.search;
  const targetUrl  = `${apiBase()}/api/${targetPath}${search}`;

  const headers: Record<string, string> = {
    'x-admin-session': session,
    'x-forwarded-for': req.headers.get('x-forwarded-for') ?? '',
    'user-agent':      req.headers.get('user-agent') ?? '',
  };

  const contentType = req.headers.get('content-type');
  if (contentType) headers['content-type'] = contentType;

  const init: RequestInit = {
    method: req.method,
    headers,
    cache: 'no-store',
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const body = await req.text();
    if (body) init.body = body;
  }

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, init);
  } catch {
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 502 });
  }

  const responseBody = await upstream.text();
  const response = new NextResponse(responseBody, { status: upstream.status });

  const upstreamContentType = upstream.headers.get('content-type');
  if (upstreamContentType) {
    response.headers.set('content-type', upstreamContentType);
  }

  return response;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}
