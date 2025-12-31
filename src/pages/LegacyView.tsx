import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import type { LegacyPublicData, Journal } from '@shared/types';
import { generateJournalPdf } from '@/lib/pdf-export';
import { 
  Loader2, Download, Sparkles, Calendar, Lock, 
  ArrowRight, ShieldAlert, Book, Info, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
export function LegacyView() {
  const { shareId } = useParams();
  const [searchParams] = useSearchParams();
  const key = searchParams.get('key');
  const [data, setData] = useState<LegacyPublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchShared = async () => {
      try {
        const res = await api<LegacyPublicData>(`/api/public/legacy/${shareId}?key=${key}`);
        setData(res);
      } catch (e) {
        console.error("Failed to load shared journal", e);
        setError("This legacy archive has expired or been revoked.");
      } finally {
        setLoading(false);
      }
    };
    if (shareId && key) {
      fetchShared();
    }
  }, [shareId, key]);
  const handleVerifyPassword = async () => {
    setVerifying(true);
    setError(null);
    try {
      const res = await api<LegacyPublicData>(`/api/public/legacy/${shareId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ password })
      });
      setData(res);
    } catch (e) {
      setError("Incorrect password. Access denied.");
    } finally {
      setVerifying(false);
    }
  };
  const handleExport = async () => {
    if (!data || !data.entries) return;
    const dummyJournal: Journal = {
      id: 'shared',
      userId: 'recipient',
      templateId: 'reflective',
      title: data.journalTitle,
      description: `Legacy archive from ${data.authorName}`,
      type: 'reflective',
      createdAt: new Date().toISOString()
    };
    const doc = await generateJournalPdf(dummyJournal, data.entries, {
      title: data.journalTitle,
      author: data.authorName,
      includeImages: true,
      includeTags: true,
      customMessage: "This archive was shared with you through the Lumina Legacy Transmission Moat."
    });
    doc.save(`${data.journalTitle.toLowerCase().replace(/\s+/g, '-')}-shared.pdf`);
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-4">
        <Loader2 className="animate-spin text-stone-900 h-10 w-10 mb-4" />
        <p className="text-stone-500 font-serif italic">Accessing secure legacy archive...</p>
      </div>
    );
  }
  if (error && !data?.entries) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-4 text-center space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-2xl font-serif text-stone-900">Access Restricted</h1>
        <p className="text-stone-500 max-w-sm">{error}</p>
        <Button variant="outline" className="rounded-full" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }
  // Password Entrance
  if (data?.passwordRequired && !data.entries) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-8 text-center">
          <div className="inline-flex h-16 w-16 rounded-3xl bg-stone-900 items-center justify-center text-white mb-2">
            <Lock size={24} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-serif font-medium">Secured Legacy</h1>
            <p className="text-stone-500 text-sm font-light italic">
              This archive from {data.authorName} is protected. Enter the access password to proceed.
            </p>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <Input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleVerifyPassword()}
                className="rounded-2xl h-14 border-stone-200 focus-visible:ring-stone-200 text-center"
              />
            </div>
            {data.passwordHint && (
              <div className="flex items-center justify-center gap-2 text-[10px] text-stone-400 uppercase tracking-widest bg-stone-50 py-2 rounded-xl border border-stone-100">
                <Info size={12} /> Hint: {data.passwordHint}
              </div>
            )}
            {error && (
              <div className="text-xs text-rose-500 bg-rose-50 py-2 rounded-xl border border-rose-100 flex items-center justify-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}
            <Button 
              onClick={handleVerifyPassword} 
              disabled={verifying || !password}
              className="w-full h-14 bg-stone-900 text-white rounded-2xl shadow-xl shadow-stone-200 group"
            >
              {verifying ? <Loader2 className="animate-spin h-5 w-5" /> : (
                <>Unlock Archive <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }
  if (!data) return null;
  return (
    <div className="min-h-screen bg-[#FDFCFB] selection:bg-stone-200">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          ${!data.permissions.canPrint ? 'body { display: none !important; }' : ''}
        }
      `}</style>
      <nav className="border-b border-stone-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="text-stone-900" size={18} />
            <span className="font-semibold text-stone-900 text-sm tracking-tight">Lumina Legacy Transmission</span>
          </div>
          <div className="flex items-center gap-3">
            {data.permissions.canDownload && (
              <Button variant="outline" size="sm" onClick={handleExport} className="rounded-full gap-2 text-xs">
                <Download size={14} /> Save to PDF
              </Button>
            )}
            <div className="h-8 w-px bg-stone-100" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-widest">Archive of</span>
              <span className="text-xs font-medium text-stone-900">{data.authorName}</span>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-20 lg:py-32 flex flex-col lg:flex-row gap-16">
        {/* Table of Contents Sidebar */}
        <aside className="lg:w-64 shrink-0 no-print">
          <div className="sticky top-32 space-y-8">
            <div className="space-y-4">
              <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-stone-400">Archive Index</h4>
              <nav className="space-y-2">
                {data.entries?.slice(0, 15).map(entry => (
                  <a 
                    key={entry.id} 
                    href={`#${entry.id}`} 
                    className="block text-xs text-stone-500 hover:text-stone-900 truncate font-serif transition-colors"
                  >
                    {entry.title || 'Reflection'}
                  </a>
                ))}
                {data.entries && data.entries.length > 15 && (
                  <span className="text-[10px] text-stone-300 italic">... and {data.entries.length - 15} more</span>
                )}
              </nav>
            </div>
            <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100 space-y-4">
              <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center text-stone-400 shadow-sm">
                <Book size={20} />
              </div>
              <div>
                <h5 className="text-xs font-bold text-stone-900">Transmission Info</h5>
                <p className="text-[10px] text-stone-500 mt-1">This archive is shared with specific permissions and may expire.</p>
              </div>
              {data.expiresAt && (
                <div className="pt-2 border-t border-stone-100">
                  <p className="text-[9px] uppercase font-bold text-rose-500">Expiring</p>
                  <p className="text-[10px] font-medium text-stone-900">{format(new Date(data.expiresAt), 'MMM dd, yyyy')}</p>
                </div>
              )}
            </div>
          </div>
        </aside>
        {/* Content Column */}
        <div className="flex-1 max-w-2xl space-y-32">
          <header className="text-center pb-20 border-b border-stone-100">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400 mb-6">Secured Heritage Archive</p>
            <h1 className="text-6xl font-serif font-medium text-stone-900 mb-6 tracking-tight">{data.journalTitle}</h1>
            <div className="h-px w-24 bg-stone-200 mx-auto" />
          </header>
          <div className="space-y-48">
            {(!data.entries || data.entries.length === 0) ? (
              <div className="text-center py-40 bg-stone-50 rounded-4xl border border-dashed border-stone-200">
                <p className="italic text-stone-400 font-serif">The transmission is currently empty.</p>
              </div>
            ) : (
              data.entries.map((entry) => (
                <article key={entry.id} id={entry.id} className="prose-lumina-lg scroll-mt-32">
                  <div className="flex items-center gap-4 text-stone-400 text-xs font-medium uppercase tracking-[0.2em] mb-8">
                    <Calendar size={14} />
                    {format(new Date(entry.date), 'MMMM do, yyyy')}
                  </div>
                  <h3 className="text-4xl font-serif font-medium text-stone-900 mb-8 leading-tight">{entry.title || 'Untitled Entry'}</h3>
                  <div className="text-xl leading-relaxed text-stone-700 font-serif whitespace-pre-wrap selection:bg-stone-200">
                    {entry.content}
                  </div>
                  {entry.tags?.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-stone-50 flex flex-wrap gap-2 no-print">
                      {entry.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-bold uppercase tracking-widest text-stone-400 bg-stone-50 px-3 py-1 rounded-full border border-stone-100">#{tag}</span>
                      ))}
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
          <footer className="pt-20 border-t border-stone-100 text-center pb-20 no-print">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-300">End of Transmission</p>
            <div className="mt-8 opacity-20 hover:opacity-100 transition-opacity cursor-default">
              <Sparkles className="mx-auto text-stone-900" size={24} />
              <p className="mt-4 text-[10px] text-stone-400 font-serif italic">Preserved via Lumina Digital Heritage Platform</p>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}