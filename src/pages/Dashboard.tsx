import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, TrendingUp, Trash2, Loader2, Library, Check, ChevronRight, Book, Sparkles, RefreshCw, ArrowRight, Flame, History, ShieldCheck } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format, differenceInDays, isSameDay, subDays, startOfDay } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { JOURNAL_TEMPLATES, type JournalTemplate } from '@shared/templates';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AdvancedSearch } from '@/components/AdvancedSearch';
import type { Journal } from '@shared/types';
import { UpgradeModal } from '@/components/UpgradeModal';
export function Dashboard() {
  const journals = useAppStore(s => s.journals);
  const entries = useAppStore(s => s.entries);
  const isLoading = useAppStore(s => s.isLoading);
  const isSaving = useAppStore(s => s.isSaving);
  const user = useAppStore(s => s.user);
  const dailyContent = useAppStore(s => s.dailyContent);
  const promptHistory = useAppStore(s => s.promptHistory);
  const fetchDailyContent = useAppStore(s => s.fetchDailyContent);
  const fetchPromptHistory = useAppStore(s => s.fetchPromptHistory);
  const addJournal = useAppStore(s => s.addJournal);
  const deleteJournal = useAppStore(s => s.deleteJournal);
  const isLimitReached = useAppStore(s => s.isLimitReached);
  const navigate = useNavigate();
  const [filteredJournals, setFilteredJournals] = useState<Journal[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [step, setStep] = useState<'template' | 'config'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<JournalTemplate>(JOURNAL_TEMPLATES[0]);
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [isRefreshingPrompt, setIsRefreshingPrompt] = useState(false);
  const streak = useMemo(() => {
    if (!entries.length) return 0;
    const sortedDates = Array.from(new Set(entries.map(e => format(startOfDay(new Date(e.date)), 'yyyy-MM-dd'))))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    let currentStreak = 0;
    const today = startOfDay(new Date());
    const latestDateStr = sortedDates[0];
    if (!latestDateStr) return 0;
    const latestDate = startOfDay(new Date(latestDateStr));
    if (differenceInDays(today, latestDate) > 1) return 0;
    for (let i = 0; i < sortedDates.length; i++) {
      const date = startOfDay(new Date(sortedDates[i]));
      const expected = subDays(latestDate, i);
      if (isSameDay(date, expected)) currentStreak++;
      else break;
    }
    return currentStreak;
  }, [entries]);
  useEffect(() => {
    setFilteredJournals(journals);
  }, [journals]);
  const handleOpenCreate = () => {
    if (isLimitReached('journal')) {
      setUpgradeModalOpen(true);
    } else {
      setIsCreateOpen(true);
    }
  };
  const handleCreate = async () => {
    await addJournal({
      title: customTitle || selectedTemplate.defaultTitle,
      description: customDesc || selectedTemplate.description,
      templateId: selectedTemplate.id,
      type: 'reflective'
    });
    setIsCreateOpen(false);
    setStep('template');
  };
  const handleRegenPrompt = async () => {
    setIsRefreshingPrompt(true);
    await fetchDailyContent(true);
    await fetchPromptHistory();
    setIsRefreshingPrompt(false);
  };
  const selectTemplate = (t: JournalTemplate) => {
    setSelectedTemplate(t);
    setCustomTitle(t.defaultTitle);
    setCustomDesc(t.description);
    setStep('config');
  };
  const onSearchResults = useCallback((results: Journal[]) => setFilteredJournals(results), []);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(' ')[0] ?? 'Explorer';
  const currentTier = user?.preferences?.tier || 'free';
  return (
    <AppLayout container>
      <div className="space-y-12 max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-serif font-medium text-stone-900 dark:text-stone-50 tracking-tight">
              {greeting}, {firstName}
            </h1>
            <div className="flex items-center gap-4">
              <p className="text-stone-500 font-light italic">Your reflections are waiting for you.</p>
              {streak > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-100">
                  <Flame size={14} className="fill-current" /> {streak} Day Streak
                </div>
              )}
              {currentTier !== 'free' && (
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest border",
                  currentTier === 'pro' ? "bg-stone-900 text-white border-stone-800" : "bg-amber-50 text-amber-700 border-amber-100"
                )}>
                  <ShieldCheck size={10} className={currentTier === 'pro' ? "text-amber-400" : "text-amber-600"} /> {currentTier}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Dialog open={isCreateOpen} onOpenChange={(o) => { setIsCreateOpen(o); if(!o) setStep('template'); }}>
              <Button id="tour-new-journal" onClick={handleOpenCreate} className="rounded-full bg-stone-900 hover:bg-stone-800 text-white px-6 gap-2 transition-all hover:scale-105 shadow-xl shadow-stone-200">
                <Plus size={18} /> New Journal
              </Button>
              <DialogContent className="rounded-3xl sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <AnimatePresence mode="wait">
                  {step === 'template' ? (
                    <motion.div key="template-step" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-serif">Choose a Template</DialogTitle>
                        <DialogDescription>Select a specialized structure for your thoughts.</DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4">
                        {JOURNAL_TEMPLATES.map((t) => {
                          const IconComponent = (LucideIcons as any)[t.icon] || Book;
                          return (
                            <button key={t.id} onClick={() => selectTemplate(t)} className={cn("flex flex-col items-start p-4 rounded-2xl border text-left transition-all hover:border-stone-400 group relative", selectedTemplate.id === t.id ? "border-stone-900 bg-stone-50" : "border-stone-100")}>
                              <div className={cn("p-2 rounded-xl mb-3 text-white", `bg-${t.color}-500`)}>
                                <IconComponent size={20} />
                              </div>
                              <h4 className="font-medium text-stone-900">{t.name}</h4>
                              <p className="text-xs text-stone-500 mt-1 line-clamp-1">{t.description}</p>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="config-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                      <DialogHeader>
                        <button onClick={() => setStep('template')} className="text-stone-400 hover:text-stone-900 flex items-center gap-1 text-xs mb-2 transition-colors"><ChevronRight className="rotate-180" size={14} /> Back to Templates</button>
                        <DialogTitle className="text-2xl font-serif">Refine Your Journal</DialogTitle>
                        <DialogDescription>Give your new sanctuary a personal touch.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label>Title</Label>
                          <Input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} className="rounded-xl h-12" />
                        </div>
                        <div className="grid gap-2">
                          <Label>Description</Label>
                          <Input value={customDesc} onChange={(e) => setCustomDesc(e.target.value)} className="rounded-xl h-12" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleCreate} disabled={isSaving} className="w-full h-12 rounded-xl bg-stone-900 text-white hover:bg-stone-800 shadow-lg">
                          {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Check size={16} className="mr-2" />} Initialize Sanctuary
                        </Button>
                      </DialogFooter>
                    </motion.div>
                  )}
                </AnimatePresence>
              </DialogContent>
            </Dialog>
          </div>
        </header>
        <section id="tour-search-bar" className="bg-stone-50/50 rounded-4xl p-1 border border-stone-100 shadow-inner">
          <AdvancedSearch items={journals} onResults={onSearchResults} searchFields={['title', 'description']} context="global" />
        </section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div id="tour-daily-guidance" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="h-full min-h-[300px] rounded-4xl border-none bg-stone-900 text-white shadow-2xl relative overflow-hidden p-10">
              <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-amber-400">
                      <Sparkles size={20} />
                      <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Daily Guidance</span>
                    </div>
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-white/40 hover:text-white">
                          <History size={18} />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="bg-stone-900 text-white border-stone-800">
                        <SheetHeader className="text-left mb-8">
                          <SheetTitle className="text-white font-serif text-2xl">Guidance Archive</SheetTitle>
                          <SheetDescription className="text-stone-400">Past reflections Lumina has sent your way.</SheetDescription>
                        </SheetHeader>
                        <div className="space-y-6">
                          {promptHistory.map((p, idx) => (
                            <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                              <p className="text-xs text-stone-500">{format(new Date(), 'MMMM dd, yyyy')}</p>
                              <p className="text-sm font-serif leading-relaxed italic">"{p.prompt}"</p>
                            </div>
                          ))}
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                  {isRefreshingPrompt ? (
                    <div className="space-y-4 animate-pulse">
                      <div className="h-8 bg-white/10 rounded-lg w-3/4" />
                      <div className="h-8 bg-white/10 rounded-lg w-1/2" />
                    </div>
                  ) : (
                    <h2 className="text-3xl md:text-4xl font-serif leading-tight tracking-tight">
                      {dailyContent?.prompt || "How did you find stillness in the chaos today?"}
                    </h2>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <Button
                    onClick={() => dailyContent?.targetJournalId && navigate(`/journal/${dailyContent.targetJournalId}`)}
                    className="rounded-full bg-white text-stone-900 hover:bg-stone-100 px-8 h-12 font-medium"
                  >
                    Start Writing <ArrowRight size={18} className="ml-2" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleRegenPrompt} disabled={isRefreshingPrompt} className={cn("text-white/40 hover:text-white transition-all", isRefreshingPrompt && "animate-spin")}>
                    <RefreshCw size={18} />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="h-full rounded-4xl border-stone-100 shadow-sm p-10 bg-white flex flex-col justify-center text-center">
              <div className="text-stone-400 italic font-serif text-2xl leading-relaxed px-6">
                "{dailyContent?.affirmation || "I am the architect of my own growth."}"
              </div>
            </Card>
          </motion.div>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <div key={i} className="h-64 rounded-4xl bg-stone-100 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <Card className="lg:col-span-1 rounded-4xl border-stone-100 shadow-sm bg-stone-50/50 flex flex-col p-8">
              <CardTitle className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em] flex items-center gap-2 mb-8">
                <TrendingUp size={14} /> Global Status
              </CardTitle>
              <div className="text-6xl font-serif font-medium text-stone-900">{journals.length}</div>
              <p className="text-sm text-stone-500 mt-2 font-light">Active Archives</p>
            </Card>
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredJournals.length === 0 ? (
                <div className="md:col-span-2 py-32 border-2 border-dashed border-stone-200 rounded-4xl text-center flex flex-col items-center">
                  <h3 className="text-2xl font-serif">No archives found.</h3>
                </div>
              ) : (
                filteredJournals.map((journal) => {
                  const template = JOURNAL_TEMPLATES.find(t => t.id === journal.templateId) || JOURNAL_TEMPLATES[0];
                  const IconComponent = (LucideIcons as any)[template.icon] || Book;
                  return (
                    <div key={journal.id} className="relative group h-full">
                      <Link to={`/journal/${journal.id}`} className="block h-full">
                        <Card className="h-full rounded-4xl border-stone-100 shadow-sm hover:shadow-xl hover:border-stone-300 transition-all duration-500 bg-white p-8">
                          <div className="flex justify-between items-start mb-4">
                            <div className={cn("p-3 rounded-2xl text-white", `bg-${template.color}-500`)}>
                              <IconComponent size={24} />
                            </div>
                            <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-[0.2em]">
                              {template.name}
                            </Badge>
                          </div>
                          <CardTitle className="text-2xl font-serif text-stone-900 mb-2">{journal.title}</CardTitle>
                          <CardDescription className="line-clamp-2 text-stone-500 font-light">{journal.description}</CardDescription>
                          <div className="mt-6 pt-6 border-t border-stone-50 flex items-center gap-2 text-xs text-stone-400">
                             <Calendar size={14} />
                             <span>Last active: {journal.lastEntryAt ? format(new Date(journal.lastEntryAt), 'MMM dd, yyyy') : 'Never'}</span>
                          </div>
                        </Card>
                      </Link>
                      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white shadow-lg text-stone-300 hover:text-red-500">
                              <Trash2 size={18} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-4xl border-rose-100">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-serif text-2xl">Delete Archive?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently erase "{journal.title}" from the Edge.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl">Retain</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteJournal(journal.id)} className="bg-red-500 text-white rounded-xl hover:bg-red-600">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
      <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} title="Expand Your Horizon" description="You've reached the limit of free sanctuaries. Upgrade to Premium for unlimited growth." />
    </AppLayout>
  );
}