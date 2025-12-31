import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, Send, Sparkles, Calendar, Loader2, Download, Star, Book, Mic, Image as ImageIcon, X, Search, Eye, PenLine } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { JOURNAL_TEMPLATES } from '@shared/templates';
import { ExportDialog } from '@/components/ExportDialog';
import { cn } from '@/lib/utils';
export function JournalDetail() {
  const { id } = useParams();
  const journals = useAppStore(s => s.journals);
  const entries = useAppStore(s => s.entries);
  const drafts = useAppStore(s => s.drafts);
  const addEntry = useAppStore(s => s.addEntry);
  const setDraft = useAppStore(s => s.setDraft);
  const isSaving = useAppStore(s => s.isSaving);
  const fetchEntries = useAppStore(s => s.fetchEntries);
  const journal = journals.find(j => j.id === id);
  const template = JOURNAL_TEMPLATES.find(t => t.id === journal?.templateId) || JOURNAL_TEMPLATES[0];
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  useEffect(() => {
    if (id && drafts[id]) {
      const d = drafts[id];
      setTitle(d.title || '');
      setTags(d.tags || []);
      setImages(d.images || []);
      setFormData(d.structuredData || {});
    }
  }, [id, drafts]);
  useEffect(() => {
    if (id) {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (activeTagFilter) params.append('tag', activeTagFilter);
      fetchEntries(id, params.toString());
    }
  }, [id, fetchEntries, searchQuery, activeTagFilter]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (id && (title || tags.length > 0 || Object.keys(formData).length > 0)) {
        setDraft(id, { title, tags, images, structuredData: formData });
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [id, title, tags, images, formData, setDraft]);
  const handleSave = async () => {
    if (!id) return;
    const summaryParts = template.fields.map(field => {
      const val = formData[field.id];
      if (!val) return null;
      return `**${field.label}:** ${val}`;
    }).filter(Boolean);
    const content = summaryParts.join('\n');
    await addEntry({
      journalId: id,
      title: title || `Reflection ${format(new Date(), 'MMM dd')}`,
      content,
      structuredData: formData,
      tags,
      images,
      mood: String(formData.mood_score || formData.intensity || 'Normal')
    });
    setFormData({});
    setTitle('');
    setTags([]);
    setImages([]);
    toast.success('Reflection preserved.');
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };
  const toggleRecording = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser.');
      return;
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const firstTextarea = template.fields.find(f => f.type === 'textarea')?.id || 'content';
      setFormData(prev => ({ ...prev, [firstTextarea]: (prev[firstTextarea] || '') + ' ' + transcript }));
    };
    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };
  const updateField = useCallback((fieldId: string, value: any, type?: string) => {
    let finalValue = value;
    if (type === 'number') finalValue = value === '' ? 0 : Number(value);
    setFormData(prev => ({ ...prev, [fieldId]: finalValue }));
  }, []);
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      const boldMatch = line.match(/^\*\*(.*?)\*\*(.*)/);
      if (boldMatch) {
        return (
          <p key={i} className="mb-2">
            <strong className="text-stone-900">{boldMatch[1]}</strong>
            {boldMatch[2]}
          </p>
        );
      }
      return <p key={i} className="mb-2">{line}</p>;
    });
  };
  if (!journal) {
    return (
      <AppLayout container>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-stone-300 h-8 w-8" />
          <p className="text-stone-500 font-serif">Opening journal...</p>
        </div>
      </AppLayout>
    );
  }
  const IconComponent = (LucideIcons as any)[template.icon] || Book;
  const allTags = Array.from(new Set(entries.flatMap(e => e.tags || [])));
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-12 print:p-0">
        <header className="mb-12 print:mb-8">
          <div className="flex items-center justify-between mb-6 print:hidden">
            <Link to="/dashboard" className="inline-flex items-center text-sm text-stone-500 hover:text-stone-900 group">
              <ChevronLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" /> Dashboard
            </Link>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPreviewMode(!previewMode)} className="rounded-full gap-2">
                {previewMode ? <PenLine size={14} /> : <Eye size={14} />} {previewMode ? 'Edit' : 'Preview'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setExportOpen(true)} className="rounded-full gap-2">
                <Download size={14} /> Export
              </Button>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("p-1.5 rounded-lg text-white", `bg-${template.color}-500`)}>
                <IconComponent size={14} />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-500">{template.name}</div>
            </div>
            <h1 className="text-4xl font-serif font-medium text-stone-900 dark:text-stone-50">{journal.title}</h1>
          </div>
        </header>
        <div className="grid grid-cols-1 gap-12">
          {!previewMode ? (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-8 shadow-sm print:hidden">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-stone-400 text-[10px] uppercase font-bold tracking-widest">Entry Title</Label>
                  <Input placeholder="Capture..." className="border-none text-2xl font-serif p-0 focus-visible:ring-0 placeholder:text-stone-200 h-auto" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                {template.fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label className="text-stone-600 font-medium">{field.label}</Label>
                    {field.type === 'textarea' ? (
                      <div className="relative">
                        <Textarea placeholder={field.placeholder} className="rounded-xl border-stone-100 min-h-[120px] focus:ring-stone-200 bg-stone-50/30" value={formData[field.id] || ''} onChange={(e) => updateField(field.id, e.target.value)} />
                        <button onClick={toggleRecording} className={cn("absolute bottom-3 right-3 p-2 rounded-full transition-all", isRecording ? "bg-red-500 text-white animate-recording" : "bg-stone-100 text-stone-400 hover:text-stone-600")}><Mic size={16} /></button>
                      </div>
                    ) : field.type === 'number' ? (
                      <Input type="number" placeholder={field.placeholder} className="rounded-xl border-stone-100" value={formData[field.id] || ''} onChange={(e) => updateField(field.id, e.target.value, 'number')} />
                    ) : field.type === 'select' ? (
                      <Select onValueChange={(val) => updateField(field.id, val)} value={formData[field.id]}>
                        <SelectTrigger className="rounded-xl border-stone-100"><SelectValue placeholder="Select an option" /></SelectTrigger>
                        <SelectContent>{field.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : field.type === 'rating' ? (
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button key={num} onClick={() => updateField(field.id, num)} className={cn("p-3 rounded-xl border transition-all hover:scale-105", (formData[field.id] || 0) >= num ? "bg-amber-50 border-amber-200 text-amber-500" : "bg-stone-50 border-stone-100 text-stone-300")}><Star size={18} fill={(formData[field.id] || 0) >= num ? "currentColor" : "none"} /></button>
                        ))}
                      </div>
                    ) : (
                      <Input placeholder={field.placeholder} className="rounded-xl border-stone-100" value={formData[field.id] || ''} onChange={(e) => updateField(field.id, e.target.value)} />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-8 flex items-center justify-between border-t border-stone-50 pt-6">
                <div className="text-xs text-stone-400 font-light italic">{isSaving ? 'Synching...' : 'Auto-saving enabled.'}</div>
                <Button onClick={handleSave} disabled={isSaving || (!title && Object.keys(formData).length === 0)} className="rounded-full bg-stone-900 text-white px-8">
                  {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Send size={16} className="mr-2" />}
                  Preserve Entry
                </Button>
              </div>
            </motion.section>
          ) : (
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose-lumina bg-white border border-stone-200 rounded-3xl p-12 shadow-sm min-h-[400px]">
              <h1 className="text-3xl font-serif font-medium mb-8">{title || 'Untitled Reflection'}</h1>
              {template.fields.map(f => (
                <div key={f.id} className="mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">{f.label}</h3>
                  <div className="text-stone-700 leading-relaxed">
                    {f.type === 'rating' ? (
                      <div className="flex gap-1 text-amber-500">
                        {Array.from({length: Number(formData[f.id] || 0)}).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                      </div>
                    ) : (
                      renderMarkdown(formData[f.id] || '—')
                    )}
                  </div>
                </div>
              ))}
            </motion.section>
          )}
          <section className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
              <h2 className="text-xl font-medium text-stone-900 flex items-center gap-2">
                Discovery <span className="text-sm font-normal text-stone-400">({entries.length})</span>
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
                <Input placeholder="Search..." className="pl-9 rounded-full h-9 bg-stone-50 border-stone-100 text-sm w-48 focus:w-64 transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <div className="space-y-8">
              <AnimatePresence mode="popLayout">
                {entries.length === 0 ? (
                  <div className="text-center py-20 text-stone-400 italic">No entries found.</div>
                ) : (
                  entries.map((entry) => (
                    <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-stone-50 dark:bg-stone-900/50 border border-stone-100 rounded-3xl p-8 print:border-none print:p-0">
                      <div className="flex justify-between items-start mb-6">
                        <time className="text-xs font-medium text-stone-400 flex items-center gap-1"><Calendar size={12} /> {format(new Date(entry.date), 'EEEE, MMM dd, yyyy')}</time>
                        {entry.mood && <Badge variant="outline" className="text-[10px] rounded-full uppercase border-stone-200">{entry.mood}</Badge>}
                      </div>
                      <h3 className="text-2xl font-serif font-medium text-stone-900 mb-4">{entry.title || 'Untitled Entry'}</h3>
                      <div className="prose-lumina-sm text-stone-700 font-serif leading-relaxed space-y-4">{renderMarkdown(entry.content)}</div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </div>
      {journal && <ExportDialog open={exportOpen} onOpenChange={setExportOpen} journal={journal} entries={entries} />}
    </AppLayout>
  );
}