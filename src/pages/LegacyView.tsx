import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import type { LegacyPublicData, Journal, Entry } from '@shared/types';
import { generateJournalPdf } from '@/lib/pdf-export';
import {
  Loader2, Download, Sparkles, Calendar, Lock,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
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
        const res = await api<LegacyPublicData>(`/api/public/legacy/${shareId}?key=${key}`, { silent: true });
        setData(res);
      } catch (e: any) {
        setError(e.message || "This legacy archive has expired or been revoked.");
      } finally {
        setLoading(false);
      }
    };
    if (shareId && key) fetchShared();
    else {
      setLoading(false);
      setError("Missing archive access credentials.");
    }
  }, [shareId, key]);
  const handleVerifyPassword = async () => {
    setVerifying(true);
    setError(null);
    try {
      const res = await api<LegacyPublicData>(`/api/public/legacy/${shareId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ password, key })
      });
      setData(prev => prev ? { ...prev, entries: res.entries } : null);
    } catch (e) {
      setError("Incorrect password. Access denied.");
    } finally {
      setVerifying(false);
    }
  };
  const handleExport = async () => {
    if (!data || !data.entries) return;
    try {
      const dummyJournal: Journal = {
        id: 'shared', userId: 'recipient', templateId: 'reflective', title: data.journalTitle,
        description: `Legacy archive from ${data.authorName}`, type: 'reflective', isEncrypted: false,
        createdAt: new Date().toISOString()
      };
      const doc = await generateJournalPdf(dummyJournal, data.entries, {
        title: data.journalTitle, author: data.authorName, includeImages: true, includeTags: true, highContrast: false,
        customMessage: "This archive was shared through the Lumina Legacy Moat."
      });
      doc.save(`${data.journalTitle.toLowerCase().replace(/\s+/g, '-')}-shared.pdf`);
      toast.success("Archive saved.");
    } catch (e) { toast.error("Export failed"); }
  };
  if (loading) return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-stone-900 h-10 w-10 mb-4" />
      <p className="text-stone-500 font-serif italic">Accessing secure archive...</p>
    </div>
  );
  if (error && !data?.entries) return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-4 text-center space-y-4">
      <ShieldAlert size={48} className="text-rose-500" />
      <h1 className="text-2xl font-serif text-stone-900">Archive Unreachable</h1>
      <p className="text-stone-500 max-w-sm">{error}</p>
    </div>
  );
  if (data?.passwordRequired && !data.entries) return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-8 text-center">
        <Lock size={48} className="mx-auto text-stone-900" />
        <h1 className="text-3xl font-serif font-medium">Secured Legacy</h1>
        <div className="space-y-4">
          <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="rounded-2xl h-14 text-center" />
          {data.passwordHint && <p className="text-xs text-stone-400">Hint: {data.passwordHint}</p>}
          <Button onClick={handleVerifyPassword} disabled={verifying} className="w-full h-14 bg-stone-900 text-white rounded-2xl">
            {verifying ? <Loader2 className="animate-spin" /> : 'Unlock Archive'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <nav className="border-b border-stone-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="text-stone-900" size={18} />
            <span className="font-semibold text-stone-900 text-sm">Lumina Legacy</span>
          </div>
          {data?.permissions.canDownload && (
            <Button variant="outline" size="sm" onClick={handleExport} className="rounded-full gap-2">
              <Download size={14} /> PDF
            </Button>
          )}
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-6 py-20">
        <header className="text-center mb-20">
          <h1 className="text-5xl font-serif font-medium text-stone-900 mb-4">{data?.journalTitle}</h1>
          <p className="text-stone-500 font-serif italic">Archive of {data?.authorName}</p>
        </header>
        <div className="space-y-24">
          {data?.entries?.map((entry) => (
            <article key={entry.id} className="space-y-6">
              <div className="flex items-center gap-2 text-stone-400 text-xs font-bold uppercase tracking-widest">
                <Calendar size={14} /> {format(new Date(entry.date), 'MMMM do, yyyy')}
              </div>
              <h3 className="text-3xl font-serif font-medium text-stone-900">{entry.title || 'Reflection'}</h3>
              <div className="text-lg leading-relaxed text-stone-700 font-serif whitespace-pre-wrap">{entry.content}</div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}