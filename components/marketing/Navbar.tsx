'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, Zap } from 'lucide-react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'How it works', href: '#how' },
    { label: 'Features',     href: '#features' },
    { label: 'Pricing',      href: '#pricing' },
    { label: 'FAQ',          href: '#faq' },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all ${
        scrolled
          ? 'bg-cream/85 backdrop-blur-md border-b border-warm-100'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-warm-900 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4 text-terra-400" fill="currentColor" />
          </div>
          <span className="font-serif-display font-600 text-warm-900 text-xl tracking-tight">
            MarketGrow
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-warm-700 hover:text-warm-900 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-warm-700 hover:text-warm-900 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="bg-warm-900 hover:bg-warm-700 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors shadow-sm"
          >
            Start free trial
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 -mr-2 text-warm-900"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-cream border-t border-warm-100">
          <div className="px-6 py-4 space-y-3">
            {links.map(l => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setIsOpen(false)}
                className="block text-sm font-medium text-warm-700 py-2"
              >
                {l.label}
              </a>
            ))}
            <div className="pt-3 border-t border-warm-100 flex flex-col gap-3">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="text-sm font-medium text-warm-700"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
                className="bg-warm-900 text-white text-sm font-medium px-4 py-2.5 rounded-full text-center"
              >
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
