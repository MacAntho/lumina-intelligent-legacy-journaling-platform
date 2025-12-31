import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Send, Sparkles, Trash2, Calendar, BookText } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
export function JournalDetail() {
  const { id } = useParams();
  const journals = useAppStore((s) => s.journals);
  const entries = useAppStore((s) => s.entries);
  const addEntry = useAppStore((s) => s.addEntry);
  const deleteEntry = useAppStore((s) => s.deleteEntry);
  const journal = journals.find(j => j.id === id);
  const journalEntries = entries.filter(e => e.journalId === id);
  const [content, setContent] = useState('');
  const handleSave = () => {
    if (!content.trim() || !id) return;
    addEntry({
      journalId: id,
      content: content.trim(),
      date: new Date().toISOString(),
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
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-600 mb-2">
                {journal.type}
              </div>
              <h1 className="text-4xl font-serif font-medium text-stone-900 dark:text-stone-50">{journal.title}</h1>
              <p className="text-stone-500 mt-2 font-light">{journal.description}</p>
            </div>
            <div className="flex gap-2 text-stone-400 text-sm">
              <Calendar size={14} className="mt-0.5" />
              <span>Created {format(new Date(journal.createdAt), 'MMMM yyyy')}</span>
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
            />
            <div className="mt-6 flex items-center justify-between border-t border-stone-100 dark:border-stone-800 pt-6">
              <div className="flex gap-4">
                <button className="text-xs font-medium text-stone-400 hover:text-stone-600">Add Image</button>
                <button className="text-xs font-medium text-stone-400 hover:text-stone-600">Add Tags</button>
              </div>
              <Button
                onClick={handleSave}
                disabled={!content.trim()}
                className="rounded-full bg-stone-900 text-white px-8 transition-all hover:scale-105 active:scale-95"
              >
                Save Entry <Send size={16} className="ml-2" />
              </Button>
            </div>
          </section>
          <section className="space-y-8">
            <h2 className="text-xl font-medium text-stone-900 dark:text-stone-100 flex items-center gap-2">
              Past Entries <span className="text-sm font-normal text-stone-400">({journalEntries.length})</span>
            </h2>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-stone-200 before:via-stone-100 before:to-transparent dark:before:from-stone-800 dark:before:via-stone-900">
              <AnimatePresence mode="popLayout">
                {journalEntries.length === 0 ? (
                  <div className="ml-12 py-12 text-stone-400 italic font-light">
                    No entries yet. Start your journey above.
                  </div>
                ) : (
                  journalEntries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="relative pl-12"
                    >
                      <div className="absolute left-0 top-3 flex items-center justify-center h-10 w-10 rounded-full border-4 border-[#FDFCFB] dark:border-stone-950 bg-stone-900 text-white z-10">
                        <BookText size={14} />
                      </div>
                      <div className="bg-stone-50 dark:bg-stone-900/50 border border-stone-100 dark:border-stone-800 rounded-2xl p-6 hover:shadow-md transition-all group">
                        <div className="flex items-center justify-between mb-4">
                          <time className="text-xs font-medium text-stone-400">
                            {format(new Date(entry.date), 'EEEE, MMMM dd, yyyy')} ��� {format(new Date(entry.date), 'HH:mm')}
                          </time>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-600 font-bold uppercase tracking-wider">
                              {entry.mood}
                            </span>
                            <button
                              onClick={() => deleteEntry(entry.id)}
                              className="text-stone-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <p className="text-stone-700 dark:text-stone-300 font-serif leading-relaxed whitespace-pre-wrap">
                          {entry.content}
                        </p>
                      </div>
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