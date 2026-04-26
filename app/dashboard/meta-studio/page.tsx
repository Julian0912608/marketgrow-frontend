'use client';

// app/dashboard/meta-studio/page.tsx
//
// Meta Ad Creative Studio (PR 3a.2 — herziene flow)
//
// Nieuwe flow:
//   1. (optioneel) Selecteer een product uit Shopify catalogus
//   2. Beschrijf wat je wilt adverteren (prompt)
//   3. Kies format (single/carousel/video/story)
//   4. Kies image bron:
//      - AI generated (Gemini)
//      - Product foto (uit Shopify)
//      - Upload eigen foto
//      - Geen image (alleen copy)
//   5. Genereer
//
// Drafts blijven onderaan zichtbaar met edit/regenerate/archive.

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles, Loader2, Image as ImageIcon, Video,
  BookOpen, Layers, Wand2, RefreshCw, Edit2, Trash2,
  CheckCircle, AlertCircle, Send, ChevronDown,
  Package, Upload, X, Search, ShoppingBag,
} from 'lucide-react';
import { api } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────
type MetaFormat = 'single_image' | 'carousel' | 'video' | 'story';
type ImageMode  = 'ai_generated' | 'product_image' | 'uploaded' | 'none';
type MetaCTA    =
  | 'SHOP_NOW' | 'LEARN_MORE' | 'SIGN_UP' | 'GET_OFFER'
  | 'BOOK_TRAVEL' | 'CONTACT_US' | 'DOWNLOAD' | 'DONATE_NOW'
  | 'APPLY_NOW' | 'GET_QUOTE' | 'SUBSCRIBE' | 'WATCH_MORE'
  | 'GET_DIRECTIONS';

interface Product {
  id:            string;
  title:         string;
  platform:      string;
  price_min:     number | null;
  image_url:     string | null;
  units_sold:    number;
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
  imageSource:      string | null;
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
  { id: 'lifestyle',    label: 'Lifestyle',   desc: 'Aspiratie & warmte' },
  { id: 'urgent',       label: 'Urgent',      desc: 'Schaarste / deadline' },
  { id: 'educational',  label: 'Educatief',   desc: 'Probleem oplossen' },
  { id: 'promotional',  label: 'Promotie',    desc: 'Korting & deal' },
  { id: 'storytelling', label: 'Verhaal',     desc: 'Emotioneel verhaal' },
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

// ── Ad Preview ──────────────────────────────────────────────────
function AdPreview({ creative }: { creative: Creative | null }) {
  if (!creative) {
    return (
      <div className="bg-slate-800/30 border border-slate-700/50 border-dashed rounded-2xl p-12 text-center">
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
      <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
          M
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-slate-900">Jouw Bedrijf</p>
          <p className="text-[11px] text-slate-500">Sponsored · 🌍</p>
        </div>
      </div>

      {creative.primaryText && (
        <div className="px-4 py-3 text-[14px] text-slate-900 whitespace-pre-wrap">
          {creative.primaryText}
        </div>
      )}

      {image ? (
        <div className={`${aspect} bg-slate-100 overflow-hidden`}>
          <img src={image} alt="Ad creative" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className={`${aspect} bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center`}>
          <ImageIcon className="w-12 h-12 text-slate-300" />
        </div>
      )}

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

// ── Product Picker Modal ───────────────────────────────────────
function ProductPickerModal({ products, onSelect, onClose }: {
  products: Product[];
  onSelect: (p: Product) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white text-lg font-bold">Kies een product</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Zoek op product naam..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">
                {products.length === 0 ? 'Geen producten in catalogus' : 'Geen producten gevonden'}
              </p>
              {products.length === 0 && (
                <p className="text-slate-500 text-xs mt-1">
                  Koppel je Shopify of Bol.com winkel via Integraties
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map(p => (
                <button
                  key={p.id}
                  onClick={() => { onSelect(p); onClose(); }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-slate-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{p.title}</p>
                    <p className="text-xs text-slate-500">
                      {p.platform} · €{(p.price_min ?? 0).toFixed(2)}
                      {p.units_sold > 0 && ` · ${p.units_sold} verkocht`}
                    </p>
                  </div>
                  {p.image_url && (
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                      Met foto
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
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
  const [brandContext,   setBrandContext]   = useState('');
  const [showAdvanced,   setShowAdvanced]   = useState(false);

  // Product state
  const [products,           setProducts]           = useState<Product[]>([]);
  const [selectedProduct,    setSelectedProduct]    = useState<Product | null>(null);
  const [showProductPicker,  setShowProductPicker]  = useState(false);

  // Image mode state
  const [imageMode,          setImageMode]          = useState<ImageMode>('ai_generated');
  const [uploadedImage,      setUploadedImage]      = useState<string>('');
  const [uploadedFileName,   setUploadedFileName]   = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Load functies
  const loadProducts = useCallback(async () => {
    try {
      const res = await api.get('/ai/products');
      setProducts(res.data.products?.slice(0, 50) ?? []);
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
      if (err.response?.status === 403) setHasMetaAccount(false);
      else setHasMetaAccount(null);
    }
  }, []);

  useEffect(() => {
    checkMetaAccount();
    loadProducts();
    loadDrafts();
  }, [checkMetaAccount, loadProducts, loadDrafts]);

  // Image upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Bestand te groot. Maximaal 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      setUploadedImage(dataUrl);
      setUploadedFileName(file.name);
      setImageMode('uploaded');
    };
    reader.readAsDataURL(file);
  };

  // Wanneer product wordt geselecteerd: zet automatisch image mode op product_image als foto beschikbaar
  const selectProduct = (p: Product) => {
    setSelectedProduct(p);
    if (p.image_url && imageMode === 'ai_generated') {
      setImageMode('product_image');
    } else if (!p.image_url && imageMode === 'product_image') {
      setImageMode('ai_generated');
    }
  };

  // Generate
  const generate = async () => {
    if (!prompt.trim()) {
      setError('Schrijf eerst een korte beschrijving van wat je wilt adverteren.');
      return;
    }
    if (imageMode === 'product_image' && !selectedProduct?.image_url) {
      setError('Geen productfoto beschikbaar. Kies een ander product of een andere image-modus.');
      return;
    }
    if (imageMode === 'uploaded' && !uploadedImage) {
      setError('Geen foto geüpload.');
      return;
    }

    setGenerating(true);
    setError('');
    setCurrentResult(null);

    try {
      const res = await api.post('/ai/meta-creative/generate', {
        format,
        prompt:        prompt.trim(),
        productId:     selectedProduct?.id,
        language,
        tone,
        imageMode:     format === 'video' ? 'none' : imageMode,
        uploadedImage: imageMode === 'uploaded' ? uploadedImage : undefined,
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
        imageSource:      c.imageSource,
        productTitle:     selectedProduct?.title ?? null,
        createdAt:        new Date().toISOString(),
        updatedAt:        new Date().toISOString(),
      });

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

  // No Meta account state
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

  const productsWithImage = products.filter(p => p.image_url).length;

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

          {/* 1. Product picker (eerst) */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">
              1. Product (optioneel)
            </label>

            {selectedProduct ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-700">
                <div className="w-12 h-12 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden">
                  {selectedProduct.image_url ? (
                    <img src={selectedProduct.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-slate-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{selectedProduct.title}</p>
                  <p className="text-xs text-slate-500">
                    {selectedProduct.platform} · €{(selectedProduct.price_min ?? 0).toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-slate-400 hover:text-white p-1"
                  title="Verwijder selectie"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowProductPicker(true)}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-slate-900 border border-slate-700 border-dashed text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
              >
                <Package className="w-4 h-4" />
                <span className="text-sm">
                  {products.length > 0
                    ? `Kies uit ${products.length} producten (${productsWithImage} met foto)`
                    : 'Geen producten gevonden — koppel een winkel'}
                </span>
              </button>
            )}
          </div>

          {/* 2. Prompt */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">
              2. Wat wil je adverteren?
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={selectedProduct
                ? `Bijv: 'Maak een ad voor ${selectedProduct.title.slice(0, 40)}, focus op kwaliteit en duurzaamheid'`
                : `Bijv: 'Een ad voor onze nieuwe wintercollectie sjaals, focus op handgemaakt in Nederland'`
              }
              rows={4}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              maxLength={1000}
            />
            <p className="text-xs text-slate-500 mt-1">{prompt.length} / 1000</p>
          </div>

          {/* 3. Format */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">
              3. Format
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

          {/* 4. Image source */}
          {format !== 'video' && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">
                4. Afbeelding
              </label>

              <div className="space-y-2">
                {/* AI Generated */}
                <button
                  onClick={() => setImageMode('ai_generated')}
                  className={`w-full p-3 rounded-lg text-left transition-all border ${
                    imageMode === 'ai_generated'
                      ? 'bg-brand-600/20 border-brand-500/50 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <p className="text-sm font-semibold flex-1">AI genereert nieuwe afbeelding</p>
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">3 credits</span>
                  </div>
                  <p className="text-xs opacity-70 mt-1 ml-6">Gemini maakt een passende ad foto</p>
                </button>

                {/* Product image */}
                <button
                  onClick={() => selectedProduct?.image_url && setImageMode('product_image')}
                  disabled={!selectedProduct?.image_url}
                  className={`w-full p-3 rounded-lg text-left transition-all border ${
                    imageMode === 'product_image'
                      ? 'bg-brand-600/20 border-brand-500/50 text-white'
                      : !selectedProduct?.image_url
                      ? 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    <p className="text-sm font-semibold flex-1">Productfoto gebruiken</p>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">1 credit</span>
                  </div>
                  <p className="text-xs opacity-70 mt-1 ml-6">
                    {selectedProduct?.image_url
                      ? 'De foto van het geselecteerde product'
                      : selectedProduct
                      ? 'Dit product heeft geen foto in catalogus'
                      : 'Selecteer eerst een product'}
                  </p>
                </button>

                {/* Upload */}
                <div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full p-3 rounded-lg text-left transition-all border ${
                      imageMode === 'uploaded'
                        ? 'bg-brand-600/20 border-brand-500/50 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      <p className="text-sm font-semibold flex-1">
                        {uploadedImage ? `Geüpload: ${uploadedFileName}` : 'Eigen foto uploaden'}
                      </p>
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">1 credit</span>
                    </div>
                    <p className="text-xs opacity-70 mt-1 ml-6">JPG, PNG of WebP (max 5MB)</p>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* No image */}
                <button
                  onClick={() => setImageMode('none')}
                  className={`w-full p-3 rounded-lg text-left transition-all border ${
                    imageMode === 'none'
                      ? 'bg-brand-600/20 border-brand-500/50 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4" />
                    <p className="text-sm font-semibold flex-1">Alleen copy, geen afbeelding</p>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">1 credit</span>
                  </div>
                  <p className="text-xs opacity-70 mt-1 ml-6">Genereer alleen tekst, voeg later zelf een afbeelding toe</p>
                </button>
              </div>
            </div>
          )}

          {/* 5. Tone & language */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 space-y-4">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              5. Stijl
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
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
              <label className="text-xs text-slate-400 mb-1 block">Extra brand context (optioneel, max 500)</label>
              <textarea
                value={brandContext}
                onChange={e => setBrandContext(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="Bijv: 'We zijn een duurzaam Nederlands merk, sinds 2018, premium positionering, lokaal geproduceerd in een sociale werkplaats'"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500"
              />
              <p className="text-xs text-slate-500 mt-1">{brandContext.length} / 500</p>
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
              <span className="flex-1">{error}</span>
              <button onClick={() => setError('')} className="text-rose-400 hover:text-white">×</button>
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
                Nieuwe AI image
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
                  {d.imageSource && d.imageSource !== 'ai_generated' && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-500/80 backdrop-blur text-xs text-white rounded">
                      {d.imageSource === 'product_image' ? 'Product' : d.imageSource === 'uploaded' ? 'Upload' : 'No img'}
                    </div>
                  )}
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
                      title="Nieuwe AI image"
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

      {/* Modals */}
      {showProductPicker && (
        <ProductPickerModal
          products={products}
          onSelect={selectProduct}
          onClose={() => setShowProductPicker(false)}
        />
      )}
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
