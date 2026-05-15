// ============================================================
// app/kb/page.tsx
//
// Public Knowledge Base list page.
// Server component: fetches /api/kb/list zonder auth.
// SEO-vriendelijk: full HTML met excerpts wordt geserveerd
// aan Google crawlers.
//
// Conditionele UX:
//   - Anonymous: hero + footer CTA "Start free trial"
//   - Logged-in: "Back to dashboard" link bovenaan, geen footer CTA
//
// Category filtering via ?category= query param.
// ============================================================

import type { Metadata } from 'next';
import { CategoryTabs } from './_components/CategoryTabs';
import { ArticleGrid } from './_components/ArticleGrid';
import { KbBackToDashboard } from './_components/KbBackToDashboard';
import { KbAnonFooterCta } from './_components/KbAnonFooterCta';

export const metadata: Metadata = {
  title:       'Knowledge Base | MarketGrow',
  description: 'Practical guides for early-stage ecommerce founders. Conversion, advertising, retention, and analytics fundamentals.',
  openGraph: {
    title:       'MarketGrow Knowledge Base',
    description: 'Practical guides for early-stage ecommerce founders.',
    type:        'website',
  },
};

export const dynamic = 'force-dynamic';

interface KbListItem {
  id:                 string;
  slug:               string;
  title:              string;
  description:        string;
  excerpt:            string;
  category:           string;
  categoryLabel:      string;
  tags:               string[];
  countryCode:        string | null;
  readingTimeMinutes: number;
  publishedAt?:       string;
  updatedAt:          string;
}

interface KbListResponse {
  items:           KbListItem[];
  categories:      string[];
  categoryLabels:  Record<string, string>;
  isAuthenticated: boolean;
}

const apiBase = () => process.env.NEXT_PUBLIC_API_URL
  || 'https://marketgrowth-production.up.railway.app';

async function fetchArticles(category?: string): Promise<KbListResponse> {
  const url = new URL(`${apiBase()}/api/kb/list`);
  if (category) url.searchParams.set('category', category);

  try {
    const res = await fetch(url.toString(), {
      cache:   'no-store',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      return { items: [], categories: [], categoryLabels: {}, isAuthenticated: false };
    }
    return await res.json();
  } catch {
    return { items: [], categories: [], categoryLabels: {}, isAuthenticated: false };
  }
}

export default async function KbListPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const category = typeof params.category === 'string' ? params.category : undefined;
  const data = await fetchArticles(category);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Logged-in only: back to dashboard link */}
      <KbBackToDashboard />

      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
          <div className="text-center">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">
              Knowledge Base
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-4">
              Practical guides for ecommerce founders
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Fundamentals you actually need to grow in the first 12 months. No fluff,
              no jargon, written for founders making €0 to €20k per month.
            </p>
          </div>
        </div>
      </section>

      {/* Category filter */}
      <section className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6">
          <CategoryTabs activeCategory={category ?? null} categories={data.categories} categoryLabels={data.categoryLabels} />
        </div>
      </section>

      {/* Article grid */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6">
          {data.items.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-500">
                {category
                  ? 'No articles in this category yet. Check back soon.'
                  : 'Articles are being added. Check back soon.'}
              </p>
            </div>
          ) : (
            <ArticleGrid items={data.items} />
          )}
        </div>
      </section>

      {/* Anonymous-only: footer CTA */}
      <KbAnonFooterCta />
    </main>
  );
}
