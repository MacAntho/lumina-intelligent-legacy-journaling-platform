import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookText, Plus, Calendar, TrendingUp, Trash2, Loader2, Library, Check, ChevronRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { JOURNAL_TEMPLATES, type JournalTemplate } from '@/../shared/templates';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
export function Dashboard() {
  const journals = useAppStore((s) => s.journals);
  const isLoading = useAppStore((s) => s.isLoading);
  const isSaving = useAppStore((s) => s.isSaving);
  const user = useAppStore((s) => s.user);
  const addJournal = useAppStore((s) => s.addJournal);
  const deleteJournal = useAppStore((s) => s.deleteJournal);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [step, setStep] = useState<'template' | 'config'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<JournalTemplate>(JOURNAL_TEMPLATES[0]);
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const handleCreate = async () => {
    await addJournal({
      title: customTitle || selectedTemplate.defaultTitle,
      description: customDesc || selectedTemplate.description,
      templateId: selectedTemplate.id,
      type: 'reflective' // Legacy type field kept for safety
    });
    setIsCreateOpen(false);
    setStep('template');
    setCustomTitle('');
    setCustomDesc('');
  };
  const selectTemplate = (t: JournalTemplate) => {
    setSelectedTemplate(t);
    setCustomTitle(t.defaultTitle);
    setCustomDesc(t.description);
    setStep('config');
  };
  const firstName = user?.name?.split(' ')[0] ?? 'Explorer';
  return (
    <AppLayout container>
      <div className="space-y-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-serif font-medium text-stone-900 dark:text-stone-50">
              Welcome, {firstName}
            </h1>
            <p className="text-stone-500 mt-1 font-light">Your reflections are waiting for you.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={(o) => { setIsCreateOpen(o); if(!o) setStep('template'); }}>
            <DialogTrigger asChild>
              <Button className="rounded-full bg-stone-900 hover:bg-stone-800 text-white gap-2 transition-all hover:scale-105">
                <Plus size={18} /> New Journal
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <AnimatePresence mode="wait">
                {step === 'template' ? (
                  <motion.div
                    key="template-step"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-serif">Choose a Template</DialogTitle>
                      <DialogDescription>Select a specialized structure for your thoughts.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      {JOURNAL_TEMPLATES.map((t) => {
                        const Icon = (LucideIcons as any)[t.icon] || LucideIcons.Book;
                        return (
                          <button
                            key={t.id}
                            onClick={() => selectTemplate(t)}
                            className={cn(
                              "flex flex-col items-start p-4 rounded-2xl border text-left transition-all hover:border-stone-400 group relative",
                              selectedTemplate.id === t.id ? "border-stone-900 bg-stone-50" : "border-stone-100"
                            )}
                          >
                            <div className={cn("p-2 rounded-xl mb-3 text-white", `bg-${t.color}-500`)} style={{ backgroundColor: t.color }}>
                              <Icon size={20} />
                            </div>
                            <h4 className="font-medium text-stone-900">{t.name}</h4>
                            <p className="text-xs text-stone-500 mt-1 line-clamp-1">{t.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="config-step"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <DialogHeader>
                      <button onClick={() => setStep('template')} className="text-stone-400 hover:text-stone-900 flex items-center gap-1 text-xs mb-2 transition-colors">
                        <ChevronRight className="rotate-180" size={14} /> Back to Templates
                      </button>
                      <DialogTitle className="text-2xl font-serif">Refine Your Journal</DialogTitle>
                      <DialogDescription>Give your new sanctuary a personal touch.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Title</Label>
                        <Input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} className="rounded-xl" />
                      </div>
                      <div className="grid gap-2">
                        <Label>Description</Label>
                        <Input value={customDesc} onChange={(e) => setCustomDesc(e.target.value)} className="rounded-xl" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreate} disabled={isSaving} className="w-full rounded-xl bg-stone-900 text-white">
                        {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Check size={16} className="mr-2" />}
                        Initialize Journal
                      </Button>
                    </DialogFooter>
                  </motion.div>
                )}
              </AnimatePresence>
            </DialogContent>
          </Dialog>
        </header>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 rounded-3xl bg-stone-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <Card className="lg:col-span-1 rounded-3xl border-stone-100 dark:border-stone-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-stone-500 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp size={16} /> Library Status
                </CardTitle>
              </CardHeader>
              <div className="px-6 pb-6">
                <div className="text-5xl font-serif font-medium">{journals.length}</div>
                <p className="text-sm text-stone-500 mt-2">Active journals</p>
              </div>
            </Card>
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
              {journals.length === 0 ? (
                <div className="md:col-span-2 py-20 border-2 border-dashed border-stone-200 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
                  <div className="h-16 w-16 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-300">
                    <Library size={32} />
                  </div>
                  <h3 className="text-xl font-medium text-stone-900">Your library is empty</h3>
                  <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="rounded-full">
                    Initialize First Journal
                  </Button>
                </div>
              ) : (
                <>
                  {journals.map((journal) => {
                    const template = JOURNAL_TEMPLATES.find(t => t.id === journal.templateId) || JOURNAL_TEMPLATES[0];
                    const Icon = (LucideIcons as any)[template.icon] || LucideIcons.Book;
                    return (
                      <div key={journal.id} className="relative group">
                        <Link to={`/journal/${journal.id}`}>
                          <Card className="h-full rounded-3xl border-stone-100 dark:border-stone-800 shadow-sm hover:shadow-md hover:border-stone-300 transition-all group overflow-hidden">
                            <CardHeader>
                              <div className="flex justify-between items-start mb-2">
                                <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-800 text-stone-600 group-hover:scale-110 transition-transform">
                                  <Icon size={20} />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
                                  {template.name}
                                </span>
                              </div>
                              <CardTitle className="text-xl font-medium">{journal.title}</CardTitle>
                              <CardDescription className="line-clamp-2 mt-1">{journal.description}</CardDescription>
                            </CardHeader>
                            <CardFooter className="pt-0 flex items-center gap-2 text-xs text-stone-400">
                              <Calendar size={12} />
                              Last entry: {journal.lastEntryAt ? format(new Date(journal.lastEntryAt), 'MMM dd, yyyy') : 'Never'}
                            </CardFooter>
                          </Card>
                        </Link>
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-300 hover:text-red-500">
                                <Trash2 size={16} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-3xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Journal?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{journal.title}" and its history.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteJournal(journal.id)} className="bg-red-500 text-white rounded-xl">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    className="h-full border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-3xl flex flex-col items-center justify-center gap-3 py-10 text-stone-400 hover:text-stone-600 hover:border-stone-400 transition-colors min-h-[180px]"
                  >
                    <Plus size={32} strokeWidth={1.5} />
                    <span className="font-medium">New Sanctuary</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}