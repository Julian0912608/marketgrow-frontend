'use client';

// app/dashboard/meta-studio/page.tsx
//
// Meta Ad Creative Studio (PR 3a — draft only)
//
// Functionaliteit:
//   - Klant typt prompt + selecteert eventueel product
//   - Kiest format (single image / carousel / video / story)
//   - AI genereert primary text, headline, description, CTA + (optioneel) image
//   - Preview toont hoe de ad eruit ziet op Facebook/Instagram
//   - Drafts lijst met edit/regenerate/archive acties
//
// PR 3b voegt de "Publish to Meta" knop toe — voor nu blijft alles
// als 'draft' in de DB staan.

import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, Loader2, Image as ImageIcon, Video,
  BookOpen, Layers, Wand2, RefreshCw, Edit2, Trash2,
  CheckCircle, AlertCircle, Send, ChevronDown,
} from 'lucide-react';
import { api } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────
type MetaFormat = 'single_image' | 'carousel' | 'video' | 'story';
type MetaCTA    =
  | 'SHOP_NOW' | 'LEARN_MORE' | 'SIGN_UP' | 'GET_OFFER'
  | 'BOOK_TRAVEL' | 'CONTACT_US' | 'DOWNLOAD' | 'DONATE_NOW'
  | 'APPLY_NOW' | 'GET_QUOTE' | 'SUBSCRIBE' | 'WATCH_MORE'
  | 'GET_DIRECTIONS';

interface Product {
  id:        string;
  title:     string;
  platform:  string;
  price_min: number | null;
  image_url: string | null;
}

interface Creative {
  id:               string;
  format:           MetaFormat;
  primaryText:      string;
  headline:         string;
  description:      string;
  callToAction:     string;
  assetUrls:        string[];
  status:           string;
  source:           string;
  generationPrompt: string | null;
  imageAspectRatio: string | null;
  productTitle:     string | null;
  createdAt:        string;
  updatedAt:        string;
}

const FORMATS: { id: MetaFormat; label: string; desc: string; icon: any }[] = [
  { id: 'single_image', label: 'Single image', desc: 'Eén afbeelding',          icon: ImageIcon },
  { id: 'carousel',     label: 'Carousel',     desc: 'Meerdere afbeeldingen',   icon: Layers },
  { id: 'video',        label: 'Video',        desc: 'Video advertentie',       icon: Video },
  { id: 'story',        label: 'Story',        desc: 'Verticaal 9:16',          icon: BookOpen },
];

const TONES = [
  { id: 'lifestyle',   label: 'Lifestyle',   desc: 'Aspiratie & warmte' },
  { id: 'urgent',      label: 'Urgent',      desc: 'Schaarste / deadline' },
  { id: 'educational', label: 'Educatief',   desc: 'Probleem oplossen' },
  { id: 'promotional', label: 'Promotie',    desc: 'Korting & deal' },
  { id: 'storytelling', label: 'Verhaal',    desc: 'Emotioneel verhaal' },
];

const CTA_LABELS: Record<MetaCTA, string> = {
  SHOP_NOW:        'Shop now',
  LEARN_MORE:      'Learn more',
  SIGN_UP:         'Sign up',
  GET_OFFER:       'Get offer',
  BOOK_TRAVEL:     'Book travel',
  CONTACT_US:      'Contact us',
  DOWNLOAD:        'Download',
  DONATE_NOW:      'Donate',
  APPLY_NOW:       'Apply now',
  GET_QUOTE:       'Get quote',
  SUBSCRIBE:       'Subscribe',
  WATCH_MORE:      'Watch more',
  GET_DIRECTIONS:  'Get directions',
};

// ── Ad Preview Component ───────────────────────────────────────
function AdPreview({ creative, compact = false }: { creative: Creative | null; compact?: boolean }) {
  if (!creative) {
    return (
      <div className={`bg-slate-800/30 border border-slate-700/50 border-dashed rounded-2xl ${compact ? 'p-6' : 'p-12'} text-center`}>
        <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Preview verschijnt hier na generatie</p>
      </div>
    );
  }

  const image = creative.assetUrls?.[0];
  const aspect = creative.imageAspectRatio === '9:16' ? 'aspect-[9/16]'
                : creative.imageAspectRatio === '16:9' ? 'aspect-video'
                : 'aspect-square';

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
      {/* Mock Facebook header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
          M
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-slate-900">Jouw Bedrijf</p>
          <p className="text-[11px] text-slate-500">Sponsored · 🌍</p>
        </div>
      </div>

      {/* Primary text */}
      {creative.primaryText && (
        <div className="px-4 py-3 text-[14px] text-slate-900 whitespace-pre-wrap">
          {creative.primaryText}
        </div>
      )}

      {/* Image */}
      {image ? (
        <div className={`${aspect} bg-slate-100 overflow-hidden`}>
          <img src={image} alt="Ad creative" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className={`${aspect} bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center`}>
          <ImageIcon className="w-12 h-12 text-slate-300" />
        </div>
      )}

      {/* Headline + description + CTA bar */}
      <div className="px-4 py-3 bg-slate-50 flex items-center justify-between border-t border-slate-100">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 truncate">jouwbedrijf.nl</p>
          <p className="text-[14px] font-bold text-slate-900 leading-tight truncate">{creative.headline || '—'}</p>
          {creative.description && (
            <p className="text-[12px] text-slate-600 truncate">{creative.description}</p>
          )}
        </div>
        <button className="ml-3 px-3 py-1.5 bg-slate-200 text-slate-900 text-[12px] font-semibold rounded-md whitespace-nowrap">
          {CTA_LABELS[creative.callToAction as MetaCTA] || creative.callToAction}
        </button>
      </div>
    </div>
  );
}

// ── Edit modal ─────────────────────────────────────────────────
function EditModal({ creative, onSave, onClose }: {
  creative: Creative;
  onSave: (updates: Partial<Creative>) => Promise<void>;
  onClose: () => void;
}) {
  const [primaryText,  setPrimaryText]  = useState(creative.primaryText);
  const [headline,     setHeadline]     = useState(creative.headline);
  const [description,  setDescription]  = useState(creative.description);
  const [callToAction, setCallToAction] = useState(creative.callToAction);
  const [saving,       setSaving]       = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onSave({
        primaryText,
        headline,
        description,
        callToAction,
      } as any);
      onClose();
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-white text-lg font-bold mb-4">Bewerk creative</h2>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Primary text (max 500)</label>
            <textarea
              value={primaryText}
              onChange={e => setPrimaryText(e.target.value.slice(0, 500))}
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
            <p className="text-xs text-slate-500 mt-0.5">{primaryText.length} / 500</p>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Headline (max 100)</label>
            <input
              value={headline}
              onChange={e => setHeadline(e.target.value.slice(0, 100))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Description (max 100)</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value.slice(0, 100))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Call to action</label>
            <select
              value={callToAction}
              onChange={e => setCallToAction(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              {Object.entries(CTA_LABELS).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Opslaan
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-700 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-600"
          >
            Annuleren
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function MetaStudioPage() {
  // Form state
  const [prompt,         setPrompt]         = useState('');
  const [format,         setFormat]         = useState<MetaFormat>('single_image');
  const [tone,           setTone]           = useState('lifestyle');
  const [language,       setLanguage]       = useState<'nl' | 'en'>('nl');
  const [generateImage,  setGenerateImage]  = useState(true);
  const [products,       setProducts]       = useState<Product[]>([]);
  const [productId,      setProductId]      = useState<string>('');
  const [brandContext,   setBrandContext]   = useState('');
  const [showAdvanced,   setShowAdvanced]   = useState(false);

  // Generation state
  const [generating,     setGenerating]     = useState(false);
  const [currentResult,  setCurrentResult]  = useState<Creative | null>(null);
  const [error,          setError]          = useState('');

  // Drafts list
  const [drafts,         setDrafts]         = useState<Creative[]>([]);
  const [loadingDrafts,  setLoadingDrafts]  = useState(true);
  const [editing,        setEditing]        = useState<Creative | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // Meta connection check
  const [hasMetaAccount, setHasMetaAccount] = useState<boolean | null>(null);

  // ── Load functies ───────────────────────────────────────
  const loadProducts = useCallback(async () => {
    try {
      const res = await api.get('/ai/products');
      setProducts(res.data.products?.slice(0, 30) ?? []);
    } catch {}
  }, []);

  const loadDrafts = useCallback(async () => {
    setLoadingDrafts(true);
    try {
      const res = await api.get('/ai/meta-creative/list');
      setDrafts(res.data.creatives ?? []);
    } catch {}
    setLoadingDrafts(false);
  }, []);

  const checkMetaAccount = useCallback(async () => {
    try {
      const res = await api.get('/ai/meta-creative/ad-accounts');
      setHasMetaAccount((res.data.adAccounts?.length ?? 0) > 0);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setHasMetaAccount(false);
      } else {
        setHasMetaAccount(null);
      }
    }
  }, []);

  useEffect(() => {
    checkMetaAccount();
    loadProducts();
    loadDrafts();
  }, [checkMetaAccount, loadProducts, loadDrafts]);

  // ── Generate ───────────────────────────────────────────
  const generate = async () => {
    if (!prompt.trim()) {
      setError('Schrijf eerst een korte beschrijving van wat je wilt adverteren.');
      return;
    }
    setGenerating(true);
    setError('');
    setCurrentResult(null);

    try {
      const res = await api.post('/ai/meta-creative/generate', {
        format,
        prompt:        prompt.trim(),
        productId:     productId || undefined,
        language,
        tone,
        generateImage: generateImage && format !== 'video',
        brandContext:  brandContext.trim() || undefined,
      });

      const c = res.data.creative;
      setCurrentResult({
        id:               c.creativeId,
        format:           c.format,
        primaryText:      c.primaryText,
        headline:         c.headline,
        description:      c.description,
        callToAction:     c.callToAction,
        assetUrls:        c.imageUrl ? [c.imageUrl] : [],
        status:           c.status,
        source:           'ai_generated',
        generationPrompt: prompt.trim(),
        imageAspectRatio: format === 'story' ? '9:16' : format === 'single_image' ? '1:1' : null,
        productTitle:     productId ? (products.find(p => p.id === productId)?.title ?? null) : null,
        createdAt:        new Date().toISOString(),
        updatedAt:        new Date().toISOString(),
      });

      // Refresh drafts list zodat de nieuwe ook in onderaan komt
      loadDrafts();
    } catch (err: any) {
      const errMsg = err.response?.data?.error ?? err.response?.data?.message ?? 'Generatie mislukt.';
      setError(errMsg);
    }
    setGenerating(false);
  };

  const regenerateImage = async (creativeId: string) => {
    setRegeneratingId(creativeId);
    try {
      const res = await api.post(`/ai/meta-creative/${creativeId}/regenerate-image`);
      // Update lokaal
      setDrafts(d => d.map(x => x.id === creativeId
        ? { ...x, assetUrls: [res.data.imageUrl], imageAspectRatio: res.data.aspectRatio }
        : x
      ));
      if (currentResult?.id === creativeId) {
        setCurrentResult(c => c ? { ...c, assetUrls: [res.data.imageUrl], imageAspectRatio: res.data.aspectRatio } : c);
      }
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Image opnieuw genereren mislukt');
    }
    setRegeneratingId(null);
  };

  const updateCreative = async (creativeId: string, updates: any) => {
    const apiPayload: any = {};
    if (updates.primaryText !== undefined)  apiPayload.primary_text   = updates.primaryText;
    if (updates.headline !== undefined)     apiPayload.headline       = updates.headline;
    if (updates.description !== undefined)  apiPayload.description    = updates.description;
    if (updates.callToAction !== undefined) apiPayload.call_to_action = updates.callToAction;

    await api.patch(`/ai/meta-creative/${creativeId}`, apiPayload);

    // Update lokaal
    setDrafts(d => d.map(x => x.id === creativeId ? { ...x, ...updates } : x));
    if (currentResult?.id === creativeId) {
      setCurrentResult(c => c ? { ...c, ...updates } : c);
    }
  };

  const archiveCreative = async (creativeId: string) => {
    if (!confirm('Deze creative archiveren?')) return;
    try {
      await api.delete(`/ai/meta-creative/${creativeId}`);
      setDrafts(d => d.filter(x => x.id !== creativeId));
      if (currentResult?.id === creativeId) setCurrentResult(null);
    } catch {}
  };

  // ── No Meta account state ──────────────────────────────
  if (hasMetaAccount === false) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-display text-2xl font-800 text-white">Meta Ad Studio</h1>
          </div>
          <p className="text-slate-400 text-sm ml-12">AI-gegenereerde Facebook & Instagram advertenties.</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-white font-semibold text-lg mb-2">Koppel eerst Meta Ads</h2>
          <p className="text-slate-400 text-sm mb-5 max-w-md mx-auto">
            Om creatives te genereren moet er een Meta Ads account gekoppeld zijn. Dat duurt twee minuten via de Integraties pagina.
          </p>
          <a
            href="/dashboard/integrations"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Naar Integraties
          </a>
        </div>
      </div>
    );
  }

  // ── Hoofdview ─────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Wand2 className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-display text-2xl font-800 text-white">Meta Ad Studio</h1>
        </div>
        <p className="text-slate-400 text-sm ml-12">
          AI-gegenereerde Facebook + Instagram advertenties. Drafts worden lokaal opgeslagen — publishing volgt later.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Linker kolom: Form */}
        <div className="space-y-4">

          {/* Prompt */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">
              1. Wat wil je adverteren?
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Bijvoorbeeld: 'Een ad voor onze nieuwe wintercollectie sjaals, focus op duurzaamheid en handgemaakt in Nederland'"
              rows={4}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-slate-500">{prompt.length} / 1000</p>
            </div>
          </div>

          {/* Format */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">
              2. Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FORMATS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`p-3 rounded-lg text-left transition-all border ${
                    format === f.id
                      ? 'bg-brand-600/20 border-brand-500/50 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
                >
                  <f.icon className="w-4 h-4 mb-1.5" />
                  <p className="text-sm font-semibold">{f.label}</p>
                  <p className="text-xs opacity-70">{f.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Tone & language */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 space-y-4">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              3. Stijl
            </label>

            <div>
              <p className="text-xs text-slate-500 mb-2">Toon</p>
              <div className="grid grid-cols-2 gap-2">
                {TONES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={`p-2.5 rounded-lg text-left transition-all text-xs ${
                      tone === t.id
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <p className="font-semibold">{t.label}</p>
                    <p className="opacity-70 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Taal</p>
              <div className="flex gap-2">
                {(['nl', 'en'] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setLanguage(l)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      language === l ? 'bg-brand-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {format !== 'video' && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">AI image genereren</p>
                <button
                  onClick={() => setGenerateImage(!generateImage)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    generateImage ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {generateImage ? 'Aan' : 'Uit'}
                </button>
              </div>
            )}
          </div>

          {/* Advanced */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            Geavanceerd
          </button>

          {showAdvanced && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Koppel aan product (optioneel)</label>
                <select
                  value={productId}
                  onChange={e => setProductId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="">— Geen product gekoppeld —</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title.slice(0, 60)} ({p.platform})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Extra brand context (optioneel, max 500)</label>
                <textarea
                  value={brandContext}
                  onChange={e => setBrandContext(e.target.value.slice(0, 500))}
                  rows={2}
                  placeholder="Bijv: 'We zijn een duurzaam Nederlands merk, sinds 2018, premium positionering'"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500"
                />
              </div>
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={generating || !prompt.trim()}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? 'AI genereert...' : 'Genereer creative'}
          </button>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
              <button onClick={() => setError('')} className="ml-auto text-rose-400 hover:text-white">×</button>
            </div>
          )}
        </div>

        {/* Rechter kolom: Preview */}
        <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Live preview</p>
            <AdPreview creative={currentResult} />
          </div>

          {currentResult && (
            <div className="flex gap-2">
              <button
                onClick={() => regenerateImage(currentResult.id)}
                disabled={regeneratingId === currentResult.id}
                className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${regeneratingId === currentResult.id ? 'animate-spin' : ''}`} />
                Nieuwe image
              </button>
              <button
                onClick={() => setEditing(currentResult)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium py-2 rounded-lg"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Bewerken
              </button>
            </div>
          )}

          {currentResult && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
              <Send className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300 leading-relaxed">
                <strong className="font-semibold">Draft opgeslagen.</strong> Publiceren naar Meta wordt toegevoegd in een volgende update.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Drafts list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Eerder gegenereerd ({drafts.length})
          </h2>
          {loadingDrafts && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
        </div>

        {drafts.length === 0 && !loadingDrafts ? (
          <div className="bg-slate-800/30 border border-slate-700/50 border-dashed rounded-2xl p-8 text-center">
            <p className="text-slate-500 text-sm">Geen drafts. Genereer je eerste creative hierboven.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drafts.map(d => (
              <div key={d.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-600 transition-colors">
                <div className="aspect-square bg-slate-900 relative overflow-hidden">
                  {d.assetUrls?.[0] ? (
                    <img src={d.assetUrls[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-10 h-10 text-slate-600" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur text-xs text-white rounded">
                    {FORMATS.find(f => f.id === d.format)?.label ?? d.format}
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-white line-clamp-2 leading-tight mb-1">
                    {d.headline || 'Geen headline'}
                  </p>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">
                    {d.primaryText || d.generationPrompt}
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditing(d)}
                      className="flex-1 px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-xs rounded-md transition-colors"
                      title="Bewerken"
                    >
                      <Edit2 className="w-3 h-3 mx-auto" />
                    </button>
                    <button
                      onClick={() => regenerateImage(d.id)}
                      disabled={regeneratingId === d.id}
                      className="flex-1 px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-xs rounded-md transition-colors disabled:opacity-50"
                      title="Nieuwe image"
                    >
                      <RefreshCw className={`w-3 h-3 mx-auto ${regeneratingId === d.id ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => archiveCreative(d.id)}
                      className="flex-1 px-2 py-1.5 bg-slate-700 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 text-xs rounded-md transition-colors"
                      title="Archiveren"
                    >
                      <Trash2 className="w-3 h-3 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <EditModal
          creative={editing}
          onSave={(updates) => updateCreative(editing.id, updates)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
