import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, Send, Sparkles, Calendar, Loader2, Download, Star } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { JOURNAL_TEMPLATES } from '@/../shared/templates';
import { cn } from '@/lib/utils';
export function JournalDetail() {
  const { id } = useParams();
  const journals = useAppStore((s) => s.journals);
  const entries = useAppStore((s) => s.entries);
  const addEntry = useAppStore((s) => s.addEntry);
  const isSaving = useAppStore((s) => s.isSaving);
  const fetchEntries = useAppStore((s) => s.fetchEntries);
  const journal = journals.find(j => j.id === id);
  const template = JOURNAL_TEMPLATES.find(t => t.id === journal?.templateId) || JOURNAL_TEMPLATES[0];
  const [formData, setFormData] = useState<Record<string, any>>({});
  useEffect(() => {
    if (id) fetchEntries(id);
  }, [id, fetchEntries]);
  const handleSave = async () => {
    if (!id) return;
    // Construct summarized content from structured fields
    const summaryParts = template.fields.map(field => {
      const val = formData[field.id];
      if (!val) return null;
      return `**${field.label}:** ${val}`;
    }).filter(Boolean);
    const content = summaryParts.join('\n');
    await addEntry({
      journalId: id,
      content,
      structuredData: formData,
      mood: formData.mood_score?.toString() || formData.intensity?.toString() || 'Normal'
    });
    setFormData({});
    toast.success('Reflection preserved.');
  };
  const updateField = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };
  if (!journal) return <div className="p-20 text-center">Journal not found</div>;
  const Icon = (LucideIcons as any)[template.icon] || LucideIcons.Book;
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-12 print:p-0">
        <header className="mb-12 print:mb-8">
          <div className="flex items-center justify-between mb-6 print:hidden">
            <Link to="/dashboard" className="inline-flex items-center text-sm text-stone-500 hover:text-stone-900 group">
              <ChevronLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" /> Dashboard
            </Link>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="rounded-full gap-2">
              <Download size={14} /> Export
            </Button>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-stone-100 text-stone-900">
                  <Icon size={14} />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-500">{template.name}</div>
              </div>
              <h1 className="text-4xl font-serif font-medium text-stone-900 dark:text-stone-50">{journal.title}</h1>
              <p className="text-stone-500 mt-2 font-light">{journal.description}</p>
            </div>
            <div className="flex gap-2 text-stone-400 text-sm">
              <Calendar size={14} className="mt-0.5" />
              <span>Created {journal.createdAt ? format(new Date(journal.createdAt), 'MMM yyyy') : '...'}</span>
            </div>
          </div>
        </header>
        <div className="grid grid-cols-1 gap-12">
          <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-8 shadow-sm print:hidden">
            <div className="flex items-center gap-2 mb-6 text-xs font-medium text-stone-400 uppercase tracking-widest">
              <Sparkles size={14} className="text-amber-500" /> Intelligence Enabled
            </div>
            <div className="space-y-6">
              {template.fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label className="text-stone-600 font-medium">{field.label}</Label>
                  {field.type === 'textarea' ? (
                    <Textarea
                      placeholder={field.placeholder}
                      className="rounded-xl border-stone-100 min-h-[120px] focus:ring-stone-200"
                      value={formData[field.id] || ''}
                      onChange={(e) => updateField(field.id, e.target.value)}
                    />
                  ) : field.type === 'number' ? (
                    <Input
                      type="number"
                      placeholder={field.placeholder}
                      className="rounded-xl border-stone-100"
                      value={formData[field.id] || ''}
                      onChange={(e) => updateField(field.id, e.target.value)}
                    />
                  ) : field.type === 'select' ? (
                    <Select onValueChange={(val) => updateField(field.id, val)} value={formData[field.id]}>
                      <SelectTrigger className="rounded-xl border-stone-100">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : field.type === 'rating' ? (
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          onClick={() => updateField(field.id, num)}
                          className={cn(
                            "p-3 rounded-xl border transition-all hover:scale-105",
                            formData[field.id] >= num ? "bg-amber-50 border-amber-200 text-amber-500" : "bg-stone-50 border-stone-100 text-stone-300"
                          )}
                        >
                          <Star size={18} fill={formData[field.id] >= num ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <Input
                      placeholder={field.placeholder}
                      className="rounded-xl border-stone-100"
                      value={formData[field.id] || ''}
                      onChange={(e) => updateField(field.id, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-center justify-between border-t border-stone-50 pt-6">
              <div className="text-xs text-stone-400 font-light italic">
                {isSaving ? 'Synching...' : 'Your reflections are encrypted.'}
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-full bg-stone-900 text-white px-8"
              >
                {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Send size={16} className="mr-2" />}
                Preserve Entry
              </Button>
            </div>
          </section>
          <section className="space-y-8 pb-20">
            <h2 className="text-xl font-medium text-stone-900 flex items-center gap-2 print:hidden">
              Past Entries <span className="text-sm font-normal text-stone-400">({entries.length})</span>
            </h2>
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {entries.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-stone-50 dark:bg-stone-900/50 border border-stone-100 rounded-3xl p-6 print:border-none print:p-0"
                  >
                    <time className="text-xs font-medium text-stone-400 block mb-4">
                      {format(new Date(entry.date), 'EEEE, MMM dd, yyyy')}
                    </time>
                    <div className="space-y-4">
                      {entry.structuredData ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {Object.entries(entry.structuredData).map(([key, val]) => {
                            const field = template.fields.find(f => f.id === key);
                            if (!field || !val) return null;
                            return (
                              <div key={key} className="bg-white p-3 rounded-2xl border border-stone-100/50">
                                <Label className="text-[10px] uppercase text-stone-400 block mb-1">{field.label}</Label>
                                <div className="text-stone-900 font-medium">
                                  {field.type === 'rating' ? (
                                    <div className="flex gap-1 text-amber-500">
                                      {Array.from({length: Number(val)}).map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
                                    </div>
                                  ) : (
                                    <span className="whitespace-pre-wrap">{String(val)}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-stone-700 font-serif leading-relaxed whitespace-pre-wrap">
                          {entry.content}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}