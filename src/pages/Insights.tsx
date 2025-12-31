import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { BrainCircuit, Sparkles, TrendingUp, Zap } from 'lucide-react';
export function Insights() {
  const insightData = useAppStore((s) => s.insightData);
  return (
    <AppLayout container>
      <div className="space-y-12 pb-20">
        <header>
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <BrainCircuit size={20} />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">AI Intelligence Layer</span>
          </div>
          <h1 className="text-4xl font-serif font-medium text-stone-900 dark:text-stone-50">Self-Discovery Insights</h1>
          <p className="text-stone-500 mt-2 font-light max-w-2xl">
            Lumina analyzes your writing patterns and emotional landscape to help you understand your growth over time.
          </p>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 rounded-3xl border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <TrendingUp size={18} className="text-stone-400" /> Mood Landscape
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={insightData.moodTrends}>
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
                  <Area type="monotone" dataKey="score" stroke="#d97706" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-stone-100 dark:border-stone-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <Zap size={18} className="text-stone-400" /> Writing Rhythm
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={insightData.writingFrequency}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                  <XAxis dataKey="day" stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: '#f5f5f4' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Bar dataKey="count" fill="#1c1917" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        <section className="space-y-6">
          <h2 className="text-2xl font-serif font-medium flex items-center gap-2">
            <Sparkles size={22} className="text-amber-500" /> Emerging Themes
          </h2>
          <div className="flex flex-wrap gap-4">
            {insightData.topTopics.map((topic) => (
              <div 
                key={topic.text}
                className="px-6 py-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-sm flex flex-col items-center justify-center min-w-[120px]"
              >
                <span className="text-2xl font-serif font-medium text-stone-900 dark:text-stone-100">{topic.value}%</span>
                <span className="text-xs text-stone-500 uppercase tracking-widest mt-1">{topic.text}</span>
              </div>
            ))}
          </div>
        </section>
        <Card className="rounded-3xl bg-stone-900 text-white p-8 border-none overflow-hidden relative">
          <div className="relative z-10 space-y-4">
            <h3 className="text-2xl font-serif">Lumina's Perspective</h3>
            <p className="text-stone-400 font-light text-lg leading-relaxed max-w-2xl">
              "You've been writing consistently for the past 12 days. Your mood patterns show a significant increase in 'Inspired' states following your 'Fitness' journal entries. Perhaps consider moving your morning reflection to after your workout?"
            </p>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <BrainCircuit size={180} />
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}