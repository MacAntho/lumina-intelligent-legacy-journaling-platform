import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Send, Sparkles, Loader2, Download, Star, Book, Maximize2, Minimize2, Type, X, Shield, Lock } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { format, isThisWeek, isThisMonth } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { JOURNAL_TEMPLATES } from '@shared/templates';
import { ExportDialog } from '@/components/ExportDialog';
import { AdvancedSearch } from '@/components/AdvancedSearch';
import { cn } from '@/lib/utils';
import { UpgradeModal } from '@/components/UpgradeModal';
import type { Entry, DailyContent } from '@shared/types';
export function JournalDetail() {
  const { id } = useParams();
  const journals = useAppStore(s => s.journals);
  const entries = useAppStore(s => s.entries);
  const drafts = useAppStore(s => s.drafts);
  const addEntry = useAppStore(s => s.addEntry);
  const setDraft = useAppStore(s => s.setDraft);
  const isSaving = useAppStore(s => s.isSaving);
  const fetchEntries = useAppStore(s => s.fetchEntries);
  const isLimitReached = useAppStore(s => s.isLimitReached);
  const generateContextualPrompt = useAppStore(s => s.generateContextualPrompt);
  const user = useAppStore(s => s.user);
  const journal = journals.find(j => j.id === id);
  const template = JOURNAL_TEMPLATES.find(t => t.id === journal?.templateId) || JOURNAL_TEMPLATES[0];
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [title, setTitle] = useState('');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [focusMode, setFocusMode] = useState(false);
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [contextualSuggestion, setContextualSuggestion] = useState<DailyContent | null>(null);
  const [isGettingSuggestion, setIsGettingSuggestion] = useState(false);
  useEffect(() => {
    if (id) {
      const d = drafts[id];
      if (d) {
        setTitle(d.title || '');
        setTags(d.tags || []);
        setFormData(d.structuredData || {});
      } else {
        setTitle('');
        setTags([]);
        setFormData({});
      }
      fetchEntries(id);
    }
  }, [id, fetchEntries, drafts]);
  useEffect(() => {
    if (!id || (!title && Object.keys(formData).length === 0)) return;
    const timer = setTimeout(() => {
      setDraft(id, {
        title,
        tags,
        structuredData: formData,
        journalId: id
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [id, title, formData, tags, setDraft]);
  const wordCount = useMemo(() => {
    const allText = Object.values(formData).join(' ') + ' ' + title;
    const trimmed = allText.trim();
    return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
  }, [formData, title]);
  const handleSave = async () => {
    if (!id) return;
    if (isLimitReached('entry')) {
      setUpgradeModalOpen(true);
      return;
    }

    const summaryParts = template.fields.map(field => {
      const val = formData[field.id];
      if (!val) return null;
      return `**${field.label}:** ${val}`;
    }).filter(Boolean);
    await addEntry({
      journalId: id,
      title: title || `Reflection ${format(new Date(), 'MMM dd')}`,
      content: summaryParts.join('\n'),
      structuredData: formData,
      tags,
      wordCount,
      mood: String(formData.mood_score || formData.intensity || 'Normal')
    });
    setFormData({});
    setTitle('');
    setTags([]);
    setContextualSuggestion(null);
    toast.success('Preserved in the archive.');
  };
  const handleGetSuggestion = async () => {
    if (!id) return;
    setIsGettingSuggestion(true);
    try {
      const suggestion = await generateContextualPrompt(id, template.id);
      setContextualSuggestion(suggestion);
    } catch (e) {
      toast.error('Unable to establish intelligence link.');
    } finally {
      setIsGettingSuggestion(false);
    }
  };
  const onSearchResults = useCallback((results: Entry[]) => setFilteredEntries(results), []);
  const groupedEntries = useMemo(() => {
    const thisWeek: Entry[] = [], thisMonth: Entry[] = [], older: Entry[] = [];
    filteredEntries.forEach(entry => {
      const date = new Date(entry.date);
      if (isThisWeek(date)) thisWeek.push(entry);
      else if (isThisMonth(date)) thisMonth.push(entry);
      else older.push(entry);
    });
    return { thisWeek, thisMonth, older };
  }, [filteredEntries]);
  if (!journal) return <AppLayout container><Loader2 className="animate-spin" /></AppLayout>;
  const IconComponent = (LucideIcons as any)[template.icon] || Book;
  const currentTier = user?.preferences?.tier || 'free';
  const usage = user?.usage;

  return (
    <AppLayout className={cn(focusMode && "sidebar-hidden")} container={!focusMode}>
      <div className={cn("max-w-4xl mx-auto px-6 py-12 transition-all", focusMode && "max-w-2xl pt-24")}>
        <header className="mb-12 flex items-start justify-between">
          {!focusMode ? (
            <div>
              <Link to="/dashboard" className="text-xs text-stone-400 hover:text-stone-900 flex items-center mb-4 transition-colors">
                <ChevronLeft size={14} /> Back to Dashboard
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <div className={cn("p-2 rounded-xl text-white", `bg-${template.color}-500`)}>
                  <IconComponent size={16} />
                </div>
                <h1 className="text-4xl font-serif font-medium text-stone-900">{journal.title}</h1>
                {journal.isEncrypted && (
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 gap-1.5 ml-2">
                    <Lock size={10} /> Secured
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full text-center mb-12">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-300">Focus Mode Active</span>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => setFocusMode(!focusMode)} className="rounded-full">
              {focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </Button>
            {!focusMode && (
              <Button variant="outline" size="sm" onClick={() => setExportOpen(true)} className="rounded-full h-10 gap-2">
                <Download size={14} /> Export
              </Button>
            )}
          </div>
        </header>
        <section className="bg-white rounded-4xl border border-stone-200 p-10 shadow-sm mb-20 relative">
          <AnimatePresence>
            {contextualSuggestion && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={cn("mb-8 p-6 rounded-2xl border-l-4 bg-stone-50 relative", `border-${template.color}-500`)}
              >
                <button onClick={() => setContextualSuggestion(null)} className="absolute top-4 right-4 text-stone-300 hover:text-stone-600">
                  <X size={14} />
                </button>
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <Sparkles size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Lumina Suggestion</span>
                </div>
                <p className="text-stone-800 font-serif italic text-lg leading-relaxed">"{contextualSuggestion.prompt}"</p>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="absolute top-6 right-10 flex items-center gap-3 text-stone-300">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest">
              <Type size={12} /> {wordCount} Words
            </div>
          </div>
          <div className="space-y-8">
            <Input
              placeholder="Give this reflection a title..."
              className="border-none text-3xl font-serif p-0 focus-visible:ring-0 placeholder:text-stone-100 h-auto"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {template.fields.map((field) => (
              <div key={field.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-widest text-stone-400">{field.label}</Label>
                  {field.type === 'textarea' && (
                    <Button variant="ghost" size="sm" onClick={handleGetSuggestion} disabled={isGettingSuggestion} className="h-6 text-[10px] uppercase tracking-widest font-bold text-stone-300 hover:text-amber-600 gap-1.5">
                      {isGettingSuggestion ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} Get Guidance
                    </Button>
                  )}
                </div>
                {field.type === 'textarea' ? (
                  <Textarea
                    placeholder={field.placeholder}
                    className="rounded-2xl border-stone-100 bg-stone-50/30 min-h-[160px] text-lg font-serif p-6"
                    value={formData[field.id] || ''}
                    onChange={(e) => setFormData(p => ({ ...p, [field.id]: e.target.value }))}
                  />
                ) : field.type === 'rating' ? (
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => setFormData(p => ({ ...p, [field.id]: num }))}
                        className={cn(
                          "h-12 w-12 rounded-2xl border transition-all duration-300 flex items-center justify-center",
                          (formData[field.id] || 0) >= num ? "bg-amber-50 border-amber-200 text-amber-500 scale-105" : "bg-stone-50 border-stone-100 text-stone-200"
                        )}
                      >
                        <Star size={20} fill={(formData[field.id] || 0) >= num ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <Input
                    className="rounded-xl border-stone-100 h-12"
                    value={formData[field.id] || ''}
                    onChange={(e) => setFormData(p => ({ ...p, [field.id]: e.target.value }))}
                  />
                )}
              </div>
            ))}
            <div className="pt-8 border-t border-stone-50 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-stone-300 font-serif italic">Auto-syncing to your private moat...</span>
                {currentTier === 'free' && usage && (
                  <span className="text-[9px] text-stone-400 font-bold uppercase mt-1">{usage.monthlyEntryCount}/100 reflections this month</span>
                )}
              </div>
              <Button onClick={handleSave} disabled={isSaving || wordCount < 1} className="rounded-full bg-stone-900 text-white px-10 h-12 shadow-lg hover:scale-105 transition-transform">
                {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
                Preserve Reflection
              </Button>
            </div>
          </div>
        </section>
        {!focusMode && (
          <section className="space-y-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <h2 className="text-2xl font-serif font-medium">Reflection History</h2>
              <div className="w-full md:w-96">
                <AdvancedSearch items={entries} onResults={onSearchResults} searchFields={['title', 'content']} context="journal" />
              </div>
            </header>
            <div className="space-y-16">
              {Object.entries(groupedEntries).map(([key, group]) => group.length > 0 && (
                <div key={key} className="space-y-8">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400 border-b border-stone-100 pb-2">
                    {key === 'thisWeek' ? 'This Week' : key === 'thisMonth' ? 'Earlier this Month' : 'Historical Archives'}
                  </h3>
                  <div className="space-y-8">
                    {group.map((entry) => (
                      <motion.div key={entry.id} className="group relative">
                        <div className="absolute left-[-20px] top-0 bottom-0 w-1 bg-stone-100 rounded-full group-hover:bg-stone-900 transition-colors" />
                        <div className="flex flex-col gap-2">
                          <time className="text-[10px] text-stone-400 font-medium">{format(new Date(entry.date), 'EEEE, MMM dd, yyyy')}</time>
                          {entry.isEncrypted && (
                            <div className="flex items-center gap-1 text-[8px] font-bold text-emerald-500 uppercase tracking-widest mb-1">
                              <Shield size={10} /> E2E Encrypted
                            </div>
                          )}
                          <h4 className="text-2xl font-serif text-stone-900">{entry.title}</h4>
                          <div className="text-stone-500 font-serif leading-relaxed line-clamp-3 text-sm">
                            {entry.content.replace(/\*\*(.*?)\*\*/g, '$1')}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
      {journal && <ExportDialog open={exportOpen} onOpenChange={setExportOpen} journal={journal} entries={entries} />}
      <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} title="Continuous Growth" description="You've reached your monthly entry limit. Upgrade to continue your journey of reflection without pause." />
    </AppLayout>
  );
}