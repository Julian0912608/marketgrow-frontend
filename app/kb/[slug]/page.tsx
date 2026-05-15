// ============================================================
// app/kb/[slug]/page.tsx
//
// Public article page.
// Server component: fetches /api/kb/article/:slug zonder auth.
// SEO-vriendelijk: title, description, excerptMarkdown in initial HTML.
//
// De ArticleReader (client) upgrade naar full bodyMarkdown als
// de user een access token in sessionStorage heeft.
//
// Logged-in users zien een "Back to dashboard" link bovenaan
// (via KbBackToDashboard client component).
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ArticleReader } from '../_components/ArticleReader';
import { KbBackToDashboard } from '../_components/KbBackToDashboard';

export const dynamic = 'force-dynamic';

interface ArticlePreview {
  id:                 string;
  slug:               string;
  title:              string;
  description:        string;
  excerptMarkdown:    string;
  bodyMarkdown?:      string;
  category:           string;
  categoryLabel:      string;
  tags:               string[];
  countryCode:        string | null;
  readingTimeMinutes: number;
  publishedAt:        string;
  requiresAuth:       boolean;
}

const apiBase = () => process.env.NEXT_PUBLIC_API_URL
  || 'https://marketgrowth-production.up.railway.app';

async function fetchArticle(slug: string): Promise<ArticlePreview | null> {
  try {
    const res = await fetch(`${apiBase()}/api/kb/article/${slug}`, {
      cache:   'no-store',
      headers: { 'Accept': 'application/json' },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = await res.json();
    return data.article as ArticlePreview;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticle(slug);

  if (!article) {
    return {
      title:       'Article not found | MarketGrow',
      description: 'This article could not be found.',
    };
  }

  return {
    title:       `${article.title} | MarketGrow`,
    description: article.description,
    openGraph: {
      title:       article.title,
      description: article.description,
      type:        'article',
    },
    twitter: {
      card:        'summary_large_image',
      title:       article.title,
      description: article.description,
    },
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  foundation:  'bg-blue-50 text-blue-700',
  conversion:  'bg-emerald-50 text-emerald-700',
  advertising: 'bg-violet-50 text-violet-700',
  retention:   'bg-amber-50 text-amber-700',
  product:     'bg-rose-50 text-rose-700',
  analytics:   'bg-cyan-50 text-cyan-700',
};

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await fetchArticle(slug);

  if (!article) notFound();

  const categoryColor = CATEGORY_COLORS[article.category] ?? 'bg-slate-100 text-slate-700';
  const publishedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  });

  return (
    <main className="min-h-screen bg-white">
      {/* Logged-in only: back to dashboard link */}
      <KbBackToDashboard />

      {/* Header */}
      <header className="border-b border-slate-200 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <Link href="/kb" className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-indigo-600 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to knowledge base
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${categoryColor}`}>
              {article.categoryLabel}
            </span>
            <span className="text-xs text-slate-500">
              {article.readingTimeMinutes} min read
            </span>
            <span className="text-xs text-slate-500">
              Published {publishedDate}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-3">
            {article.title}
          </h1>

          <p className="text-lg text-slate-600 leading-relaxed">
            {article.description}
          </p>
        </div>
      </header>

      {/* Article body */}
      <article className="max-w-3xl mx-auto px-6 py-12">
        <ArticleReader initialArticle={article} slug={slug} />
      </article>
    </main>
  );
}
