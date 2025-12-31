import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import type { LegacyPublicData, Journal } from '@shared/types';
import { generateJournalPdf } from '@/lib/pdf-export';
import { Loader2, Download, Sparkles, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
export function LegacyView() {
  const { shareId } = useParams();
  const [searchParams] = useSearchParams();
  const key = searchParams.get('key');
  const [data, setData] = useState<LegacyPublicData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchShared = async () => {
      try {
        const res = await api<LegacyPublicData>(`/api/public/legacy/${shareId}?key=${key}`);
        setData(res);
      } catch (e) {
        console.error("Failed to load shared journal", e);
      } finally {
        setLoading(false);
      }
    };
    if (shareId && key) {
      fetchShared();
    }
  }, [shareId, key]);
  const handleExport = async () => {
    if (!data) return;
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
      customMessage: "This archive was shared with you through Lumina Legacy Transmission."
    });
    doc.save(`${data.journalTitle.toLowerCase().replace(/\s+/g, '-')}-shared.pdf`);
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-4">
        <Loader2 className="animate-spin text-stone-900 h-10 w-10 mb-4" />
        <p className="text-stone-500 font-serif italic">Accessing legacy archive...</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-serif text-stone-900 mb-2">Access Denied</h1>
        <p className="text-stone-500">This legacy link is invalid, has expired, or requires a valid key.</p>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#FDFCFB] selection:bg-stone-200">
      <nav className="border-b border-stone-100 bg-white/80 backdrop-blur-md sticky top-0 z-10 print:hidden">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="text-stone-900" size={18} />
            <span className="font-semibold text-stone-900">Lumina Legacy</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="rounded-full gap-2">
            <Download size={14} /> Download PDF
          </Button>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-6 py-20 print:py-0">
        <header className="mb-20 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-stone-400 mb-4">A Shared Journal From</p>
          <h1 className="text-5xl font-serif font-medium text-stone-900 mb-4">{data.authorName}</h1>
          <h2 className="text-2xl font-serif italic text-stone-500">{data.journalTitle}</h2>
          <div className="h-px w-24 bg-stone-200 mx-auto mt-12" />
        </header>
        <div className="space-y-24 print:space-y-12">
          {(!data.entries || data.entries.length === 0) ? (
            <p className="text-center italic text-stone-400 py-20">No entries shared.</p>
          ) : (
            data.entries.map((entry) => (
              <article key={entry.id} className="prose-lumina break-inside-avoid">
                <div className="flex items-center gap-3 text-stone-400 text-xs font-medium uppercase tracking-widest mb-6">
                  <Calendar size={14} />
                  {format(new Date(entry.date), 'MMMM do, yyyy')}
                </div>
                <h3 className="text-3xl font-serif font-medium text-stone-900 mb-6">{entry.title || 'Untitled Entry'}</h3>
                <div className="text-lg leading-relaxed text-stone-700 font-serif whitespace-pre-wrap">{entry.content}</div>
              </article>
            ))
          )}
        </div>
      </main>
    </div>
  );
}