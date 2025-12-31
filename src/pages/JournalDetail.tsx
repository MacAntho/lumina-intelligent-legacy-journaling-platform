import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Send, Sparkles, Trash2, Calendar, BookText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
export function JournalDetail() {
  const { id } = useParams();
  const journals = useAppStore((s) => s.journals);
  const entries = useAppStore((s) => s.entries);
  const addEntry = useAppStore((s) => s.addEntry);
  const isSaving = useAppStore((s) => s.isSaving);
  const fetchEntries = useAppStore((s) => s.fetchEntries);
  const journal = journals.find(j => j.id === id);
  const [content, setContent] = useState('');
  useEffect(() => {
    if (id) fetchEntries(id);
  }, [id, fetchEntries]);
  const handleSave = async () => {
    if (!content.trim() || !id) return;
    await addEntry({
      journalId: id,
      content: content.trim(),
      mood: 'Normal'
    });
    setContent('');
  };
  if (!journal) return <div className="p-20 text-center">Journal not found</div>;
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <header className="mb-12">
          <Link to="/dashboard" className="inline-flex items-center text-sm text-stone-500 hover:text-stone-900 mb-6 group">
            <ChevronLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-600 mb-2">{journal.type}</div>
              <h1 className="text-4xl font-serif font-medium text-stone-900 dark:text-stone-50">{journal.title}</h1>
              <p className="text-stone-500 mt-2 font-light">{journal.description}</p>
            </div>
            <div className="flex gap-2 text-stone-400 text-sm">
              <Calendar size={14} className="mt-0.5" />
              <span>Created {journal.createdAt ? format(new Date(journal.createdAt), 'MMMM yyyy') : '...'}</span>
            </div>
          </div>
        </header>
        <div className="grid grid-cols-1 gap-12">
          <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-8 shadow-sm transition-all focus-within:shadow-md focus-within:border-stone-400">
            <div className="flex items-center gap-2 mb-4 text-xs font-medium text-stone-400 uppercase tracking-widest">
              <Sparkles size={14} className="text-amber-500" /> Intelligence Enabled
            </div>
            <Textarea
              placeholder="What's on your mind? The paper is yours..."
              className="min-h-[200px] border-none focus-visible:ring-0 text-lg font-serif resize-none p-0 placeholder:text-stone-300 dark:placeholder:text-stone-700 bg-transparent leading-relaxed"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSaving}
            />
            <div className="mt-6 flex items-center justify-between border-t border-stone-100 dark:border-stone-800 pt-6">
              <div className="text-xs text-stone-400 font-light italic">
                {isSaving ? 'Synching with Lumina...' : 'Your words are private and secure.'}
              </div>
              <Button
                onClick={handleSave}
                disabled={!content.trim() || isSaving}
                className="rounded-full bg-stone-900 text-white px-8 transition-all hover:scale-105 active:scale-95"
              >
                {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                {isSaving ? 'Saving...' : 'Save Entry'} <Send size={16} className="ml-2" />
              </Button>
            </div>
          </section>
          <section className="space-y-8 pb-20">
            <h2 className="text-xl font-medium text-stone-900 dark:text-stone-100 flex items-center gap-2">
              Past Entries <span className="text-sm font-normal text-stone-400">({entries.length})</span>
            </h2>
            <div className="space-y-6 relative">
              <AnimatePresence mode="popLayout">
                {entries.length === 0 ? (
                  <div className="py-12 text-stone-400 italic font-light">No entries yet. Start writing...</div>
                ) : (
                  entries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-stone-50 dark:bg-stone-900/50 border border-stone-100 dark:border-stone-800 rounded-2xl p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <time className="text-xs font-medium text-stone-400">
                          {format(new Date(entry.date), 'EEEE, MMMM dd, yyyy')}
                        </time>
                      </div>
                      <p className="text-stone-700 dark:text-stone-300 font-serif leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}