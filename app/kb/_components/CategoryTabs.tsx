// ============================================================
// app/kb/_components/CategoryTabs.tsx
//
// Server component voor category navigation.
// Pure Link-based, geen JS nodig. Active state via prop.
// ============================================================

import Link from 'next/link';

interface CategoryTabsProps {
  activeCategory: string | null;
  categories:     string[];
  categoryLabels: Record<string, string>;
}

export function CategoryTabs({ activeCategory, categories, categoryLabels }: CategoryTabsProps) {
  const tabs: { value: string | null; label: string }[] = [
    { value: null, label: 'All articles' },
    ...categories.map(c => ({
      value: c,
      label: categoryLabels[c] ?? c,
    })),
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto py-3 -mx-2 px-2" aria-label="Filter by category">
      {tabs.map(tab => {
        const isActive = (tab.value === null && activeCategory === null)
          || tab.value === activeCategory;
        const href = tab.value === null ? '/kb' : `/kb?category=${tab.value}`;

        return (
          <Link key={tab.value ?? 'all'} href={href} className={[
              'whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
            ].join(' ')}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
