'use client';

// app/dashboard/team/page.tsx
//
// V0 Gap 5a polish (16 mei 2026):
//   - Invite form stack vertical op mobile (flex-col sm:flex-row),
//     3 columns paste niet op een 380px viewport.
//   - Truncate op meta-tekst onder email zodat lange "Verstuurd
//     Vandaag, Verloopt over X dagen" strings de role-badge en
//     close-button niet wegduwen.
//   - Page padding p-4 op mobile, p-6 op sm+ voor ademruimte.

import { useState, useEffect } from 'react';
import {
  UserPlus, Mail, Loader2, CheckCircle, X,
  Clock, Trash2, Crown, User, Eye,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface Member {
  id:          string;
  email:       string;
  first_name:  string;
  last_name:   string;
  role:        string;
  status:      string;
  created_at:  string;
}

interface Invite {
  id:         string;
  email:      string;
  role:       string;
  expires_at: string;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  owner:  'Owner',
  member: 'Member',
  viewer: 'Viewer',
};

const ROLE_COLORS: Record<string, string> = {
  owner:  'bg-amber-500/20 text-amber-400',
  member: 'bg-brand-500/20 text-brand-400',
  viewer: 'bg-slate-500/20 text-slate-400',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Vandaag';
  if (days === 1) return 'Gisteren';
  return `${days} dagen geleden`;
}

function daysUntil(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days <= 0) return 'Verlopen';
  if (days === 1) return 'Verloopt morgen';
  return `Verloopt over ${days} dagen`;
}

export default function TeamPage() {
  const { user } = useAuthStore();
  const [members,       setMembers]       = useState<Member[]>([]);
  const [invites,       setInvites]       = useState<Invite[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [email,         setEmail]         = useState('');
  const [role,          setRole]          = useState('member');
  const [sending,       setSending]       = useState(false);
  const [toast,         setToast]         = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [cancelingId,   setCancelingId]   = useState<string | null>(null);
  const [removingId,    setRemovingId]    = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    try {
      const [membersRes, invitesRes] = await Promise.allSettled([
        api.get('/team/members'),
        api.get('/team/invites'),
      ]);
      if (membersRes.status === 'fulfilled') setMembers(membersRes.value.data.members ?? []);
      if (invitesRes.status === 'fulfilled') setInvites(invitesRes.value.data.invites ?? []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    try {
      await api.post('/team/invite', { email, role });
      setEmail('');
      showToast('success', `Uitnodiging verstuurd naar ${email}`);
      load();
    } catch (err: any) {
      showToast('error', err.response?.data?.error ?? 'Kon uitnodiging niet versturen.');
    }
    setSending(false);
  };

  const handleCancelInvite = async (id: string) => {
    setCancelingId(id);
    try {
      await api.delete(`/team/invites/${id}`);
      setInvites(prev => prev.filter(i => i.id !== id));
      showToast('success', 'Uitnodiging geannuleerd.');
    } catch {
      showToast('error', 'Kon uitnodiging niet annuleren.');
    }
    setCancelingId(null);
  };

  const handleRemoveMember = async (id: string) => {
    setRemovingId(id);
    try {
      await api.delete(`/team/members/${id}`);
      setMembers(prev => prev.filter(m => m.id !== id));
      showToast('success', 'Teamlid verwijderd.');
    } catch {
      showToast('error', 'Kon teamlid niet verwijderen.');
    }
    setRemovingId(null);
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium ${
          toast.type === 'success'
            ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/20 border border-rose-500/30 text-rose-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-800 text-white mb-1">Team</h1>
        <p className="text-slate-400 text-sm">Manage who has access to your MarketGrow workspace.</p>
      </div>

      {/* Invite form */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-4 h-4 text-brand-400" />
          <h2 className="text-sm font-semibold text-slate-300">Invite someone</h2>
        </div>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="colleague@company.com"
            required
            className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            type="submit"
            disabled={sending || !email}
            className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
          >
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
            Send invite
          </button>
        </form>
        <p className="text-xs text-slate-500 mt-3 leading-relaxed">
          <span className="text-slate-400 font-medium">Admin</span>: full access except billing. &nbsp;
          <span className="text-slate-400 font-medium">Member</span>: view and edit data. &nbsp;
          <span className="text-slate-400 font-medium">Viewer</span>: read-only.
        </p>
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 sm:p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-slate-300">Pending invites</h2>
            <span className="ml-auto text-xs text-slate-500">{invites.length} open</span>
          </div>
          <div className="space-y-2">
            {invites.map(invite => (
              <div key={invite.id} className="flex items-center gap-2 sm:gap-3 p-3 bg-slate-900/50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{invite.email}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {ROLE_LABELS[invite.role] ?? invite.role} · {timeAgo(invite.created_at)} · {daysUntil(invite.expires_at)}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${ROLE_COLORS[invite.role] ?? 'bg-slate-700 text-slate-400'}`}>
                  {ROLE_LABELS[invite.role] ?? invite.role}
                </span>
                <button
                  onClick={() => handleCancelInvite(invite.id)}
                  disabled={cancelingId === invite.id}
                  className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-rose-600/20 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors disabled:opacity-50 flex-shrink-0"
                  title="Annuleer uitnodiging"
                >
                  {cancelingId === invite.id
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <X className="w-3 h-3" />
                  }
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold text-slate-300">
            {loading ? 'Laden...' : `${members.length} member${members.length !== 1 ? 's' : ''}`}
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
          </div>
        ) : (
          <div className="space-y-2">
            {members.map(member => {
              const isYou  = member.email === user?.email;
              const isOwner = member.role === 'owner';
              const initials = `${member.first_name?.[0] ?? ''}${member.last_name?.[0] ?? ''}`.toUpperCase() || member.email[0].toUpperCase();

              return (
                <div key={member.id} className="flex items-center gap-2 sm:gap-3 p-3 bg-slate-900/50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-600/30 flex items-center justify-center text-xs font-bold text-brand-400 flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-white font-medium truncate">
                        {member.first_name} {member.last_name}
                        {isYou && <span className="text-xs text-slate-500 ml-1">(jij)</span>}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{member.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${ROLE_COLORS[member.role] ?? 'bg-slate-700 text-slate-400'}`}>
                    {isOwner && <Crown className="w-2.5 h-2.5 inline mr-1" />}
                    {ROLE_LABELS[member.role] ?? member.role}
                  </span>
                  {!isYou && !isOwner && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={removingId === member.id}
                      className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-rose-600/20 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors disabled:opacity-50 flex-shrink-0"
                      title="Verwijder teamlid"
                    >
                      {removingId === member.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Trash2 className="w-3 h-3" />
                      }
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
