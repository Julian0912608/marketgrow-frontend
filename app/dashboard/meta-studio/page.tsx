'use client';

// app/dashboard/meta-studio/page.tsx
//
// Meta Ad Creative Studio
//
// PR 3a.4 toevoegingen:
//   - Productpicker badge "Geen context" voor producten zonder enrichment
//   - "Voeg context toe" knop per product in picker
//   - Enrichment modal met 5 velden (target_audience, key_benefits,
//     pain_points, brand_story, use_cases)
//   - "Help me invullen" AI-assist knop in modal (3 credits)
//   - Refresh van productlijst na save
//
// Behoudt:
//   - Quick mode (1 ad)
//   - 4 image modi (AI / product / upload / none)
//   - Alle bestaande draft functionaliteit

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles, Loader2, Image as ImageIcon, Video,
  BookOpen, Layers, Wand2, RefreshCw, Edit2, Trash2,
  CheckCircle, AlertCircle, Send, ChevronDown,
  Package, Upload, X, Search, ShoppingBag,
  Info, Plus, Minus, Lightbulb, BookText,
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
  id:              string;
  title:           string;
  platform:        string;
  price_min:       number | string | null;
  image_url:       string | null;
  units_sold:      number | string;
  has_description: boolean;
  has_enrichment:  boolean;
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

interface EnrichmentData {
  targetAudience: string;
  keyBenefits:    string[];
  painPoints:     string[];
  brandStory:     string;
  useCases:       string[];
}

const EMPTY_ENRICHMENT: EnrichmentData = {
  targetAudience: '',
  keyBenefits:    [],
  painPoints:     [],
  brandStory:     '',
  useCases:       [],
};

const FORMAT_LABELS: Record<MetaFormat, { label: string; icon: any; aspect: string; }> = {
  single_image: { label: 'Single image', icon: ImageIcon, aspect: 'aspect-square' },
  carousel:     { label: 'Carousel',     icon: Layers,    aspect: 'aspect-square' },
  video:        { label: 'Video',        icon: Video,     aspect: 'aspect-video'  },
  story:        { label: 'Story',        icon: BookOpen,  aspect: 'aspect-[9/16]' },
};

const CTA_LABELS: Record<MetaCTA, string> = {
  SHOP_NOW:        'Shop nu',
  LEARN_MORE:      'Meer info',
  SIGN_UP:         'Aanmelden',
  GET_OFFER:       'Bekijk aanbod',
  BOOK_TRAVEL:     'Boek nu',
  CONTACT_US:      'Contact',
  DOWNLOAD:        'Download',
  DONATE_NOW:      'Doneer',
  APPLY_NOW:       'Solliciteer',
  GET_QUOTE:       'Vraag offerte',
  SUBSCRIBE:       'Abonneer',
  WATCH_MORE:      'Bekijk',
  GET_DIRECTIONS:  'Routebeschrijving',
};

// ── Helpers ──────────────────────────────────────────────────
function safeNumber(v: unknown): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  const parsed = parseFloat(String(v));
  return isNaN(parsed) ? 0 : parsed;
}

// ── Enrichment Modal ──────────────────────────────────────────
function EnrichmentModal({
  product, onClose, onSaved,
}: {
  product: Product;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [data, setData] = useState<EnrichmentData>(EMPTY_ENRICHMENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiAssisting, setAiAssisting] = useState(false);
  const [error, setError] = useState('');
  const [aiConfidence, setAiConfidence] = useState<'low' | 'medium' | 'high' | null>(null);
  const [aiWarnings, setAiWarnings] = useState<string[]>([]);

  // Load bestaande enrichment
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/ai/meta-creative/products/${product.id}/enrichment`);
        if (res.data.enrichment) {
          setData({
            targetAudience: res.data.enrichment.targetAudience ?? '',
            keyBenefits:    res.data.enrichment.keyBenefits ?? [],
            painPoints:     res.data.enrichment.painPoints ?? [],
            brandStory:     res.data.enrichment.brandStory ?? '',
            useCases:       res.data.enrichment.useCases ?? [],
          });
        }
      } catch {
        // No enrichment yet — empty form
      }
      setLoading(false);
    };
    load();
  }, [product.id]);

  // AI assist
  const aiAssist = async () => {
    setAiAssisting(true);
    setError('');
    setAiConfidence(null);
    setAiWarnings([]);
    try {
      const res = await api.post(`/ai/meta-creative/products/${product.id}/enrichment-suggest`, {
        language: 'nl',
      });
      setData({
        targetAudience: res.data.target_audience ?? '',
        keyBenefits:    res.data.key_benefits ?? [],
        painPoints:     res.data.pain_points ?? [],
        brandStory:     res.data.brand_story ?? '',
        useCases:       res.data.use_cases ?? [],
      });
      setAiConfidence(res.data.confidence ?? 'low');
      setAiWarnings(res.data.warnings ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'AI-assist mislukt. Probeer het opnieuw of vul handmatig in.');
    }
    setAiAssisting(false);
  };

  // Save
  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/ai/meta-creative/products/${product.id}/enrichment`, {
        target_audience: data.targetAudience.trim() || null,
        key_benefits:    data.keyBenefits.filter(s => s.trim()).map(s => s.trim()),
        pain_points:     data.painPoints.filter(s => s.trim()).map(s => s.trim()),
        brand_story:     data.brandStory.trim() || null,
        use_cases:       data.useCases.filter(s => s.trim()).map(s => s.trim()),
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Opslaan mislukt. Probeer het opnieuw.');
    }
    setSaving(false);
  };

  // Helpers voor array velden
  const addBenefit = () => setData(d => ({ ...d, keyBenefits: [...d.keyBenefits, ''] }));
  const removeBenefit = (i: number) => setData(d => ({ ...d, keyBenefits: d.keyBenefits.filter((_, idx) => idx !== i) }));
  const updateBenefit = (i: number, v: string) =>
    setData(d => ({ ...d, keyBenefits: d.keyBenefits.map((b, idx) => idx === i ? v : b) }));

  const addPain = () => setData(d => ({ ...d, painPoints: [...d.painPoints, ''] }));
  const removePain = (i: number) => setData(d => ({ ...d, painPoints: d.painPoints.filter((_, idx) => idx !== i) }));
  const updatePain = (i: number, v: string) =>
    setData(d => ({ ...d, painPoints: d.painPoints.map((p, idx) => idx === i ? v : p) }));

  const addCase = () => setData(d => ({ ...d, useCases: [...d.useCases, ''] }));
  const removeCase = (i: number) => setData(d => ({ ...d, useCases: d.useCases.filter((_, idx) => idx !== i) }));
  const updateCase = (i: number, v: string) =>
    setData(d => ({ ...d, useCases: d.useCases.map((c, idx) => idx === i ? v : c) }));

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-white text-lg font-bold">Product context toevoegen</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Help AI om betere ad copy te maken voor: <span className="text-slate-300">{product.title}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scroll area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
            </div>
          ) : (
            <>
              {/* AI Assist knop */}
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Wand2 className="w-5 h-5 text-purple-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white text-sm font-semibold mb-1">AI-assist</h3>
                    <p className="text-xs text-slate-400 mb-3">
                      Laat AI een eerste versie invullen op basis van wat we van het product weten. Daarna kan je alles aanpassen.
                    </p>
                    <button
                      onClick={aiAssist}
                      disabled={aiAssisting}
                      className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      {aiAssisting
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> AI denkt na…</>
                        : <><Sparkles className="w-4 h-4" /> Help me invullen <span className="text-xs opacity-70">(3 credits)</span></>
                      }
                    </button>
                  </div>
                </div>

                {/* AI confidence + warnings */}
                {aiConfidence && (
                  <div className={`mt-3 text-xs px-3 py-2 rounded-lg ${
                    aiConfidence === 'high'   ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' :
                    aiConfidence === 'medium' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30' :
                                                'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                  }`}>
                    <strong>Confidence: {aiConfidence}</strong>
                    {aiConfidence === 'low' && ' — vul aan waar nodig, dit is een educated guess.'}
                    {aiConfidence === 'medium' && ' — controleer en pas aan waar nodig.'}
                    {aiConfidence === 'high' && ' — AI had genoeg context, kleine aanpassingen volstaan.'}
                  </div>
                )}
                {aiWarnings.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {aiWarnings.map((w, i) => (
                      <p key={i} className="text-xs text-amber-300 flex items-start gap-1.5">
                        <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{w}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* 1. Doelgroep */}
              <div>
                <label className="text-sm font-semibold text-white block mb-1">
                  Doelgroep
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Bijv: "Vrouwen 30-50 die kwaliteit waarderen, NL+BE, foodies"
                </p>
                <textarea
                  value={data.targetAudience}
                  onChange={e => setData(d => ({ ...d, targetAudience: e.target.value }))}
                  placeholder="Wie is de ideale klant van dit product?"
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  maxLength={500}
                />
              </div>

              {/* 2. Key Benefits */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-semibold text-white">USPs / voordelen</label>
                  <button onClick={addBenefit} className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Voeg toe
                  </button>
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  Bijv: "100% Europees eiken", "Levert generaties mee", "Handgemaakt in NL"
                </p>
                <div className="space-y-2">
                  {data.keyBenefits.length === 0 && (
                    <button
                      onClick={addBenefit}
                      className="w-full text-left px-3 py-2 bg-slate-800/50 border border-slate-700 border-dashed rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:border-slate-600"
                    >
                      + Voeg eerste voordeel toe
                    </button>
                  )}
                  {data.keyBenefits.map((b, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={b}
                        onChange={e => updateBenefit(i, e.target.value)}
                        placeholder={`Voordeel ${i + 1}`}
                        maxLength={200}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                      <button onClick={() => removeBenefit(i)} className="text-slate-500 hover:text-rose-400 p-2">
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Pain Points */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-semibold text-white">Pain points van klant</label>
                  <button onClick={addPain} className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Voeg toe
                  </button>
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  Bijv: "Plastic snijplanken zien er goedkoop uit", "Cadeau dat indruk maakt is moeilijk te vinden"
                </p>
                <div className="space-y-2">
                  {data.painPoints.length === 0 && (
                    <button
                      onClick={addPain}
                      className="w-full text-left px-3 py-2 bg-slate-800/50 border border-slate-700 border-dashed rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:border-slate-600"
                    >
                      + Voeg eerste pain point toe
                    </button>
                  )}
                  {data.painPoints.map((p, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={p}
                        onChange={e => updatePain(i, e.target.value)}
                        placeholder={`Pain point ${i + 1}`}
                        maxLength={200}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                      <button onClick={() => removePain(i)} className="text-slate-500 hover:text-rose-400 p-2">
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Brand Story */}
              <div>
                <label className="text-sm font-semibold text-white block mb-1">
                  Brand story
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Bijv: "Onze planken worden gemaakt in een sociale werkplaats in Nederland, waar mensen met afstand tot de arbeidsmarkt vakmanschap leren"
                </p>
                <textarea
                  value={data.brandStory}
                  onChange={e => setData(d => ({ ...d, brandStory: e.target.value }))}
                  placeholder="Wat maakt jouw merk uniek? 1-2 zinnen."
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  maxLength={1000}
                />
              </div>

              {/* 5. Use Cases */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-semibold text-white">Use cases</label>
                  <button onClick={addCase} className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Voeg toe
                  </button>
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  Bijv: "Borrelplank", "Kerstcadeau", "Verjaardag voor foodie"
                </p>
                <div className="space-y-2">
                  {data.useCases.length === 0 && (
                    <button
                      onClick={addCase}
                      className="w-full text-left px-3 py-2 bg-slate-800/50 border border-slate-700 border-dashed rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:border-slate-600"
                    >
                      + Voeg eerste use case toe
                    </button>
                  )}
                  {data.useCases.map((c, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={c}
                        onChange={e => updateCase(i, e.target.value)}
                        placeholder={`Use case ${i + 1}`}
                        maxLength={150}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                      <button onClick={() => removeCase(i)} className="text-slate-500 hover:text-rose-400 p-2">
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-sm text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            <Info className="w-3 h-3 inline mr-1" />
            Eenmalig invullen. Wordt gebruikt bij elke ad-generatie.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={save}
              disabled={saving || loading}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Opslaan…</>
                : <><CheckCircle className="w-4 h-4" /> Opslaan</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Edit Modal (existing, unchanged) ─────────────────────────
function EditModal({ creative, onSave, onClose }: {
  creative: Creative;
  onSave: (updates: Partial<Creative>) => Promise<void>;
  onClose: () => void;
}) {
  const [primaryText,  setPrimaryText]  = useState(creative.primaryText);
  const [headline,     setHeadline]     = useState(creative.headline);
  const [description,  setDescription]  = useState(creative.description);
  const [callToAction, setCallToAction] = useState(creative.callToAction as MetaCTA);
  const [saving,       setSaving]       = useState(false);

  const submit = async () => {
    setSaving(true);
    await onSave({
      primaryText,
      headline,
      description,
      callToAction,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg font-bold">Bewerk creative</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Primary text</label>
            <textarea
              value={primaryText}
              onChange={e => setPrimaryText(e.target.value)}
              rows={4}
              maxLength={500}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
            <p className="text-xs text-slate-500 mt-1">{primaryText.length}/500</p>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Headline</label>
            <input
              value={headline}
              onChange={e => setHeadline(e.target.value)}
              maxLength={100}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
            <p className="text-xs text-slate-500 mt-1">{headline.length}/100</p>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Description (optioneel)</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={100}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Call to action</label>
            <select
              value={callToAction}
              onChange={e => setCallToAction(e.target.value as MetaCTA)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              {Object.entries(CTA_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-6 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-700 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-600"
          >
            Annuleren
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Opslaan
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Product Card binnen picker ───────────────────────────────
function ProductPickerCard({ product, onSelect, onAddContext }: {
  product: Product;
  onSelect: () => void;
  onAddContext: () => void;
}) {
  // Een product heeft "context" als hij een description heeft (Shopify) OF enrichment heeft
  const hasContext = product.has_description || product.has_enrichment;

  return (
    <div
      className={`p-3 rounded-xl border bg-slate-800/30 hover:bg-slate-800/50 transition-all ${
        hasContext ? 'border-slate-700/50' : 'border-amber-500/40'
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onSelect}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          <div className="w-12 h-12 rounded-lg bg-slate-700 flex-shrink-0 overflow-hidden">
            {product.image_url ? (
              <img src={product.image_url} alt="" className="w-full h-full object-cover"
                   onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-5 h-5 text-slate-500" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{product.title}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-slate-500">{product.platform}</span>
              {product.price_min && (
                <span className="text-xs text-slate-500">€{safeNumber(product.price_min).toFixed(2)}</span>
              )}
              {!hasContext && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <AlertCircle className="w-2.5 h-2.5" />
                  Geen context
                </span>
              )}
              {product.has_enrichment && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ✓ Context
                </span>
              )}
            </div>
          </div>
        </button>
        <button
          onClick={onAddContext}
          className="text-xs px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg flex items-center gap-1.5 flex-shrink-0 transition-colors"
          title={hasContext ? 'Context bewerken' : 'Voeg context toe'}
        >
          <BookText className="w-3.5 h-3.5" />
          {hasContext ? 'Bewerk' : 'Voeg toe'}
        </button>
      </div>
    </div>
  );
}

// ── Product Picker Modal ──────────────────────────────────────
function ProductPickerModal({ products, onSelect, onAddContext, onClose }: {
  products: Product[];
  onSelect: (p: Product) => void;
  onAddContext: (p: Product) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const withoutContext = filtered.filter(p => !p.has_description && !p.has_enrichment).length;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-white text-lg font-bold">Kies een product</h2>
              {withoutContext > 0 && (
                <p className="text-xs text-amber-300 mt-0.5 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" />
                  {withoutContext} product{withoutContext !== 1 ? 'en' : ''} zonder context — voeg toe voor scherpere AI ads
                </p>
              )}
            </div>
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

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              {search ? 'Geen producten gevonden.' : 'Geen producten beschikbaar — koppel eerst een winkel.'}
            </p>
          ) : (
            filtered.map(p => (
              <ProductPickerCard
                key={p.id}
                product={p}
                onSelect={() => onSelect(p)}
                onAddContext={() => onAddContext(p)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Preview Card (existing, unchanged) ───────────────────────
function PreviewCard({ creative }: { creative: Creative }) {
  const aspect = FORMAT_LABELS[creative.format].aspect;
  const image  = creative.assetUrls?.[0];

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
      <div className="px-4 py-2.5 bg-slate-50 flex items-center gap-2 border-b border-slate-100">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-slate-900">Jouw bedrijf</p>
          <p className="text-[10px] text-slate-500">Sponsored · <span className="text-blue-600">●</span></p>
        </div>
      </div>

      {creative.primaryText && (
        <div className="px-4 py-2.5">
          <p className="text-[13px] text-slate-900 leading-relaxed line-clamp-3">{creative.primaryText}</p>
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

// ── Main Page ──────────────────────────────────────────────────
export default function MetaStudioPage() {
  const [prompt,         setPrompt]         = useState('');
  const [format,         setFormat]         = useState<MetaFormat>('single_image');
  const [tone,           setTone]           = useState('lifestyle');
  const [language,       setLanguage]       = useState<'nl' | 'en'>('nl');
  const [brandContext,   setBrandContext]   = useState('');
  const [showAdvanced,   setShowAdvanced]   = useState(false);

  const [products,           setProducts]           = useState<Product[]>([]);
  const [selectedProduct,    setSelectedProduct]    = useState<Product | null>(null);
  const [showProductPicker,  setShowProductPicker]  = useState(false);

  // PR 3a.4: enrichment modal state
  const [enrichmentForProduct, setEnrichmentForProduct] = useState<Product | null>(null);

  const [imageMode,          setImageMode]          = useState<ImageMode>('ai_generated');
  const [uploadedImage,      setUploadedImage]      = useState<string>('');
  const [uploadedFileName,   setUploadedFileName]   = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [generating,     setGenerating]     = useState(false);
  const [currentResult,  setCurrentResult]  = useState<Creative | null>(null);
  const [error,          setError]          = useState('');

  const [drafts,         setDrafts]         = useState<Creative[]>([]);
  const [loadingDrafts,  setLoadingDrafts]  = useState(true);
  const [editing,        setEditing]        = useState<Creative | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const [hasMetaAccount, setHasMetaAccount] = useState<boolean | null>(null);

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

  // Wanneer product wordt geselecteerd
  const selectProduct = (p: Product) => {
    setSelectedProduct(p);
    setShowProductPicker(false);
    if (p.image_url && imageMode === 'ai_generated') {
      setImageMode('product_image');
    } else if (!p.image_url && imageMode === 'product_image') {
      setImageMode('ai_generated');
    }
  };

  // Open enrichment modal vanaf picker
  const openEnrichmentFromPicker = (p: Product) => {
    setShowProductPicker(false);
    setEnrichmentForProduct(p);
  };

  // Na enrichment save: refresh products lijst en reopen picker
  const onEnrichmentSaved = async () => {
    await loadProducts();
    // Optioneel: reopen picker zodat user direct kan zien dat product nu context heeft
    setShowProductPicker(true);
  };

  // Open enrichment modal vanuit currently-selected product
  const openEnrichmentForSelected = () => {
    if (!selectedProduct) return;
    setEnrichmentForProduct(selectedProduct);
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
        status:           'draft',
        source:           'ai_generated',
        generationPrompt: prompt,
        imageAspectRatio: c.imageAspectRatio,
        imageSource:      imageMode,
        productTitle:     selectedProduct?.title ?? null,
        createdAt:        new Date().toISOString(),
        updatedAt:        new Date().toISOString(),
      });
      await loadDrafts();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Generatie mislukt.');
    }
    setGenerating(false);
  };

  // Update bestaande creative
  const updateCreative = async (id: string, updates: Partial<Creative>) => {
    try {
      await api.patch(`/ai/meta-creative/${id}`, {
        primary_text:   updates.primaryText,
        headline:       updates.headline,
        description:    updates.description,
        call_to_action: updates.callToAction,
      });
      setEditing(null);
      await loadDrafts();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Update mislukt.');
    }
  };

  // Verwijder
  const deleteCreative = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze creative wilt archiveren?')) return;
    try {
      await api.delete(`/ai/meta-creative/${id}`);
      await loadDrafts();
    } catch {}
  };

  // Hergenereer image
  const regenerateImage = async (id: string) => {
    setRegeneratingId(id);
    try {
      await api.post(`/ai/meta-creative/${id}/regenerate-image`);
      await loadDrafts();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Image regenereren mislukt.');
    }
    setRegeneratingId(null);
  };

  const productsWithImage = products.filter(p => p.image_url).length;
  const selectedHasContext = selectedProduct
    ? (selectedProduct.has_description || selectedProduct.has_enrichment)
    : false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Meta Ad Studio</h1>
        <p className="text-sm text-slate-400 mt-1">
          Genereer Facebook/Instagram ad creatives met AI. Drafts worden lokaal opgeslagen — publishing volgt later.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Linker kolom: Form */}
        <div className="space-y-4">

          {/* 1. Product picker */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">
              1. Product (optioneel)
            </label>

            {selectedProduct ? (
              <div>
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
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-500">
                        {selectedProduct.platform} · €{safeNumber(selectedProduct.price_min).toFixed(2)}
                      </p>
                      {selectedHasContext ? (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          ✓ Context
                        </span>
                      ) : (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Geen context
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="text-slate-400 hover:text-white p-1"
                    title="Verwijder selectie"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Voeg context toe knop wanneer geselecteerd product nog geen context heeft */}
                {!selectedHasContext && (
                  <button
                    onClick={openEnrichmentForSelected}
                    className="mt-2 w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-sm font-medium transition-colors"
                  >
                    <Lightbulb className="w-4 h-4" />
                    Voeg context toe voor scherpere ads
                  </button>
                )}
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
                ? `Bijv: "Wintercollectie launch, focus op aspirational lifestyle"`
                : 'Beschrijf je aanbod, doelgroep, en waarom mensen zouden moeten kopen...'
              }
              rows={4}
              maxLength={1000}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <p className="text-xs text-slate-500 mt-1">{prompt.length}/1000</p>
          </div>

          {/* 3. Format */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">
              3. Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(FORMAT_LABELS) as [MetaFormat, typeof FORMAT_LABELS['single_image']][]).map(([key, info]) => {
                const Icon = info.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setFormat(key)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      format === key
                        ? 'bg-brand-600/20 border-brand-500/50 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1.5" />
                    <p className="text-sm font-semibold">{info.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Image mode */}
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
              5. Tone & taal
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Tone</label>
                <select
                  value={tone}
                  onChange={e => setTone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="lifestyle">Lifestyle</option>
                  <option value="promotional">Promotioneel</option>
                  <option value="educational">Educatief</option>
                  <option value="ugc">UGC-stijl</option>
                  <option value="luxury">Premium / Luxe</option>
                  <option value="playful">Speels</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Taal</label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value as 'nl' | 'en')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="nl">Nederlands</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>

          {/* 6. Geavanceerd */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider"
            >
              <span>6. Geavanceerd (optioneel)</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>
            {showAdvanced && (
              <textarea
                value={brandContext}
                onChange={e => setBrandContext(e.target.value)}
                placeholder="Brand context, doelgroep details, USPs..."
                rows={3}
                maxLength={500}
                className="w-full mt-3 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500"
              />
            )}
          </div>

          {/* Generate */}
          <button
            onClick={generate}
            disabled={generating || !prompt.trim()}
            className="w-full bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            {generating
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Genereren...</>
              : <><Wand2 className="w-5 h-5" /> Genereer ad creative</>
            }
          </button>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-sm text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Rechter kolom: Preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          {generating ? (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl aspect-square flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
              <p className="text-slate-400 text-sm">AI genereert creative...</p>
              <p className="text-xs text-slate-600">Dit duurt 5-15 seconden</p>
            </div>
          ) : currentResult ? (
            <PreviewCard creative={currentResult} />
          ) : (
            <div className="bg-slate-800/50 border border-dashed border-slate-700/50 rounded-2xl aspect-square flex flex-col items-center justify-center gap-3 text-center px-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500/20 to-purple-600/20 border border-brand-500/30 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-brand-400" />
              </div>
              <h3 className="text-white font-semibold">Klaar om te genereren</h3>
              <p className="text-slate-400 text-sm max-w-xs">
                Vul de form in en klik op "Genereer". Je krijgt een complete ad-preview met copy en (optioneel) afbeelding.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Drafts overzicht */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white mb-3">Eerder gegenereerd</h2>
        {loadingDrafts ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
          </div>
        ) : drafts.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-10">
            Nog geen drafts. Genereer hierboven je eerste creative!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drafts.map(d => (
              <div key={d.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                <PreviewCard creative={d} />
                <div className="p-3 flex gap-2">
                  <button
                    onClick={() => setEditing(d)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium py-1.5 rounded-md flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> Bewerk
                  </button>
                  <button
                    onClick={() => regenerateImage(d.id)}
                    disabled={regeneratingId === d.id}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium py-1.5 rounded-md flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {regeneratingId === d.id
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <><RefreshCw className="w-3 h-3" /> Beeld</>
                    }
                  </button>
                  <button
                    onClick={() => deleteCreative(d.id)}
                    className="bg-slate-700 hover:bg-rose-600 text-slate-200 text-xs font-medium py-1.5 px-2 rounded-md"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
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
          onAddContext={openEnrichmentFromPicker}
          onClose={() => setShowProductPicker(false)}
        />
      )}

      {enrichmentForProduct && (
        <EnrichmentModal
          product={enrichmentForProduct}
          onClose={() => setEnrichmentForProduct(null)}
          onSaved={onEnrichmentSaved}
        />
      )}

      {editing && (
        <EditModal
          creative={editing}
          onSave={async updates => updateCreative(editing.id, updates)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
