// ============================================================
// app/kb/_components/ArticleReader.tsx
//
// Client component dat de hybrid SEO/auth model verzorgt.
//
// Flow:
//   1. Server geeft initialArticle door (preview, requiresAuth=true voor anon)
//   2. Op mount: check sessionStorage/localStorage voor access token
//   3. Als token gevonden: fetch met Authorization header
//   4. Als response bodyMarkdown bevat: swap content
//   5. Anders: blijf op preview, toon paywall CTA
//
// Token detection probeert meerdere locaties omdat Zustand persist
// de token onder een eigen key (auth-storage etc.) plaatst.
// ============================================================

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lock, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

interface Article {
  id:                 string;
  slug:               string;
  title:              string;
  description:        string;
  excerptMarkdown:    string;
  bodyMarkdown?:      string;
  category:           string;
  categoryLabel:      string;
  tags:               string[];
  readingTimeMinutes: number;
  publishedAt:        string;
  requiresAuth:       boolean;
}

interface ArticleReaderProps {
  initialArticle: Article;
  slug:           string;
}

const apiBase = () => process.env.NEXT_PUBLIC_API_URL
  || 'https://marketgrowth-production.up.railway.app';

// Probeer meerdere bekende locaties om het access token te vinden.
// Zustand persist gebruikt sessionStorage/localStorage met een
// custom key zoals 'auth-storage' en wraps state in JSON.
function findAccessToken(): string | null {
  if (typeof window === 'undefined') return null;

  const stores: Storage[] = [window.sessionStorage, window.localStorage];

  // Eerst: directe key lookup
  const directKeys = ['accessToken', 'access_token', 'token', 'jwt'];
  for (const store of stores) {
    for (const key of directKeys) {
      const val = store.getItem(key);
      if (val && val.length > 20 && !val.startsWith('{')) {
        return val;
      }
    }
  }

  // Daarna: Zustand persist style (JSON-wrapped state)
  const zustandKeys = ['auth-storage', 'auth-store', 'user-storage', 'session-storage', 'mg-auth'];
  for (const store of stores) {
    for (const key of zustandKeys) {
      const raw = store.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        const candidates = [
          parsed?.state?.accessToken,
          parsed?.state?.access_token,
          parsed?.state?.token,
          parsed?.accessToken,
          parsed?.token,
        ];
        for (const c of candidates) {
          if (typeof c === 'string' && c.length > 20) return c;
        }
      } catch {
        // Niet-JSON value, skip
      }
    }
  }

  return null;
}

export function ArticleReader({ initialArticle, slug }: ArticleReaderProps) {
  const [article, setArticle] = useState<Article>(initialArticle);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    // Geen upgrade nodig als server al full body teruggaf
    // (zou alleen kunnen als er een httpOnly cookie was, niet onze setup)
    if (!initialArticle.requiresAuth) return;

    const token = findAccessToken();
    if (!token) return;

    setIsUpgrading(true);

    fetch(`${apiBase()}/api/kb/article/${slug}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept':        'application/json',
      },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.article && !data.article.requiresAuth && data.article.bodyMarkdown) {
          setArticle(data.article);
        }
      })
      .catch(() => {
        // Stilletjes falen: user blijft preview zien
      })
      .finally(() => setIsUpgrading(false));
  }, [slug, initialArticle.requiresAuth]);

  const hasFullContent = !article.requiresAuth && !!article.bodyMarkdown;
  const contentMarkdown = hasFullContent ? article.bodyMarkdown! : article.excerptMarkdown;

  return (
    <>
      {/* Loading indicator als we aan het upgraden zijn */}
      {isUpgrading && (
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6 -mt-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Loading full article...
        </div>
      )}

      {/* Markdown content */}
      <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:text-slate-700 prose-p:leading-relaxed prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900 prose-code:text-indigo-700 prose-code:bg-indigo-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-table:text-sm prose-th:bg-slate-100 prose-th:text-slate-900 prose-th:font-semibold prose-th:p-3 prose-td:p-3 prose-td:border-t prose-td:border-slate-200 prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:not-italic prose-blockquote:text-slate-700">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {contentMarkdown}
        </ReactMarkdown>
      </div>

      {/* Paywall CTA als we GEEN full content hebben */}
      {!hasFullContent && !isUpgrading && (
        <div className="mt-10 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-xl mb-4">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Read the full article
          </h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Sign up free to access the complete guide, plus AI-powered insights from
            your own store data.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
              Start free trial
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-900 font-semibold px-6 py-3 rounded-xl border border-slate-300 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      )}

      {/* Related links footer als we wel full content hebben */}
      {hasFullContent && (
        <div className="mt-12 pt-8 border-t border-slate-200">
          <Link href="/kb" className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
            Browse all articles in the knowledge base
          </Link>
        </div>
      )}
    </>
  );
}
