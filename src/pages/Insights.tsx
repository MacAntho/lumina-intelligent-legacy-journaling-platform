import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { BrainCircuit, Sparkles, TrendingUp, Zap, Loader2, Calendar, Target, TrendingDown, History } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PatternAnalysisCard } from '@/components/PatternAnalysisCard';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from 'date-fns';
export function Insights() {
  const insightData = useAppStore((s) => s.insightData);
  const journals = useAppStore((s) => s.journals);
  const journalInsights = useAppStore((s) => s.journalInsights);
  const fetchInsights = useAppStore((s) => s.fetchInsights);
  const fetchJournalPatterns = useAppStore((s) => s.fetchJournalPatterns);
  const isSaving = useAppStore((s) => s.isSaving);
  const [selectedJournal, setSelectedJournal] = useState<string>('');
  const [selectedRange, setSelectedRange] = useState<string>('week');
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  useEffect(() => {
    if (!insightData) fetchInsights();
  }, [insightData, fetchInsights]);
  const handleGenerateAnalysis = async () => {
    if (!selectedJournal) return;
    const insight = await fetchJournalPatterns(selectedJournal, selectedRange);
    setCurrentAnalysis(insight);
  };
  const relevantHistory = journalInsights.filter(i => i.journalId === selectedJournal);
  if (!insightData) {
    return (
      <AppLayout container>
        <div className="flex items-center justify-center h-64 py-20">
          <Loader2 className="animate-spin mr-2 h-8 w-8 text-amber-600" />
          <span className="text-lg text-stone-500">Synchronizing insights...</span>
        </div>
      </AppLayout>
    );
  }
  return (
    <AppLayout container>
      <div className="space-y-16 pb-32">
        <header>
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <BrainCircuit size={20} />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Intelligence Engine</span>
          </div>
          <h1 className="text-4xl font-serif font-medium text-stone-900 dark:text-stone-50">Discovery Hub</h1>
          <p className="text-stone-500 mt-2 font-light max-w-2xl">
            Lumina deciphers the subtle threads of your narrative to illuminate your path forward.
          </p>
        </header>
        {/* Deep Dive Selector */}
        <section className="bg-stone-50 rounded-4xl p-10 border border-stone-100 shadow-inner">
          <div className="flex flex-col md:flex-row items-end gap-6 mb-12">
            <div className="flex-1 space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Select Sanctuary</label>
              <Select value={selectedJournal} onValueChange={setSelectedJournal}>
                <SelectTrigger className="rounded-2xl h-14 bg-white border-stone-200 shadow-sm text-lg font-serif">
                  <SelectValue placeholder="Which archive shall we analyze?" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {journals.map(j => (
                    <SelectItem key={j.id} value={j.id} className="font-serif">{j.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48 space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Time Horizon</label>
              <Select value={selectedRange} onValueChange={setSelectedRange}>
                <SelectTrigger className="rounded-2xl h-14 bg-white border-stone-200 shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="week">Past Week</SelectItem>
                  <SelectItem value="month">Past Month</SelectItem>
                  <SelectItem value="year">Past Year</SelectItem>
                  <SelectItem value="all">Full Archive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleGenerateAnalysis} 
              disabled={!selectedJournal || isSaving}
              className="h-14 px-8 rounded-2xl bg-stone-900 text-white shadow-xl hover:scale-105 transition-all gap-2"
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />} Generate Deep Analysis
            </Button>
          </div>
          <AnimatePresence mode="wait">
            {currentAnalysis ? (
              <PatternAnalysisCard key={currentAnalysis.id} insight={currentAnalysis} />
            ) : (
              <div className="py-20 text-center space-y-4 opacity-20">
                <BrainCircuit size={64} className="mx-auto" />
                <p className="font-serif italic text-xl">Select an archive to begin the deeper reflection.</p>
              </div>
            )}
          </AnimatePresence>
          {relevantHistory.length > 0 && (
            <div className="mt-12 pt-12 border-t border-stone-100">
              <div className="flex items-center gap-2 text-stone-400 mb-6">
                <History size={16} />
                <h3 className="text-xs font-bold uppercase tracking-widest">Analysis Archive</h3>
              </div>
              <Accordion type="single" collapsible className="space-y-2">
                {relevantHistory.slice(0, 5).map((h) => (
                  <AccordionItem key={h.id} value={h.id} className="border-none bg-white rounded-2xl px-6">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-4 text-left">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{h.range} Analysis</span>
                        <span className="text-sm font-serif">{format(new Date(h.createdAt), 'MMMM dd, yyyy')}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6">
                      <div className="text-sm text-stone-600 leading-relaxed font-serif whitespace-pre-wrap">
                        {h.content.substring(0, 300)}...
                      </div>
                      <Button variant="link" onClick={() => setCurrentAnalysis(h)} className="mt-4 p-0 h-auto text-stone-900">View Full Analysis</Button>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </section>
        {/* General Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 rounded-4xl border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-8 pb-2">
              <CardTitle className="text-xl font-serif flex items-center gap-2">
                <TrendingUp size={20} className="text-stone-400" /> Global Mood Landscape
              </CardTitle>
              <CardDescription>Mapping your collective resonance across all sanctuaries.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] w-full p-8 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={insightData.moodTrends || []}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                  <XAxis dataKey="date" stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis hide domain={[0, 6]} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#d97706" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="rounded-4xl border-stone-100 dark:border-stone-800 shadow-sm bg-white">
            <CardHeader className="p-8">
              <CardTitle className="text-xl font-serif flex items-center gap-2">
                <Zap size={20} className="text-stone-400" /> Writing Rhythm
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] w-full p-8 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={insightData.writingFrequency || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                  <XAxis dataKey="day" stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: '#f5f5f4' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Bar dataKey="count" fill="#1c1917" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}