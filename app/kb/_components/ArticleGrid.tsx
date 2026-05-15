// ============================================================
// app/kb/_components/ArticleGrid.tsx
//
// Server component: grid van article cards.
// ============================================================

import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';

interface ArticleGridItem {
  id:                 string;
  slug:               string;
  title:              string;
  description:        string;
  excerpt:            string;
  category:           string;
  categoryLabel:      string;
  readingTimeMinutes: number;
}

interface ArticleGridProps {
  items: ArticleGridItem[];
}

const CATEGORY_COLORS: Record<string, string> = {
  foundation:  'bg-blue-50 text-blue-700',
  conversion:  'bg-emerald-50 text-emerald-700',
  advertising: 'bg-violet-50 text-violet-700',
  retention:   'bg-amber-50 text-amber-700',
  product:     'bg-rose-50 text-rose-700',
  analytics:   'bg-cyan-50 text-cyan-700',
};

export function ArticleGrid({ items }: ArticleGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map(article => {
        const categoryColor = CATEGORY_COLORS[article.category] ?? 'bg-slate-100 text-slate-700';

        return (
          <Link key={article.id} href={`/kb/${article.slug}`} className="group block bg-white rounded-2xl border border-slate-200 p-6 hover:border-indigo-300 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${categoryColor}`}>
                {article.categoryLabel}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                {article.readingTimeMinutes} min
              </span>
            </div>

            <h2 className="font-bold text-slate-900 text-lg leading-snug mb-2 group-hover:text-indigo-600 transition-colors">
              {article.title}
            </h2>

            <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-3">
              {article.description}
            </p>

            <div className="flex items-center gap-1 text-sm font-medium text-indigo-600 group-hover:gap-2 transition-all">
              Read article
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
