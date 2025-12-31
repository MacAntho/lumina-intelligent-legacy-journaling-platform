import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookText, Plus, Calendar, Sparkles, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
export function Dashboard() {
  const journals = useAppStore((s) => s.journals);
  const user = useAppStore((s) => s.user);
  return (
    <AppLayout container>
      <div className="space-y-10">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-serif font-medium text-stone-900 dark:text-stone-50">Welcome, {user?.name?.split(' ')[0]}</h1>
            <p className="text-stone-500 mt-1 font-light">Your reflections are waiting for you.</p>
          </div>
          <Button className="rounded-full bg-stone-900 hover:bg-stone-800 text-white gap-2">
            <Plus size={18} /> New Journal
          </Button>
        </header>
        {/* Daily Prompt Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-stone-100 dark:bg-stone-800/50 p-8 border border-stone-200 dark:border-stone-700">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-white dark:bg-stone-900 shadow-sm flex items-center justify-center text-amber-600">
              <Sparkles size={28} />
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-lg font-medium text-stone-900 dark:text-stone-100">Daily Insight Prompt</h2>
              <p className="text-stone-500 font-light italic mt-1">"What is one thing you learned about yourself today that surprised you?"</p>
            </div>
            <div className="ml-auto">
              <Button variant="outline" className="rounded-full border-stone-300 dark:border-stone-600">
                Answer now
              </Button>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Sparkles size={120} />
          </div>
        </div>
        {/* Stats & Journals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Consistency Card */}
          <Card className="lg:col-span-1 rounded-3xl border-stone-100 dark:border-stone-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-stone-500 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp size={16} /> Consistency
              </CardTitle>
            </CardHeader>
            <div className="px-6 pb-6">
              <div className="text-5xl font-serif font-medium">12</div>
              <p className="text-sm text-stone-500 mt-2">Days streak in May</p>
              <div className="mt-6 flex gap-1 h-8">
                {[1, 1, 0, 1, 1, 1, 1].map((active, i) => (
                  <div key={i} className={`flex-1 rounded-md ${active ? 'bg-stone-900 dark:bg-stone-200' : 'bg-stone-200 dark:bg-stone-800'}`} />
                ))}
              </div>
            </div>
          </Card>
          {/* Journals Grid */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            {journals.map((journal) => (
              <Link key={journal.id} to={`/journal/${journal.id}`}>
                <Card className="h-full rounded-3xl border-stone-100 dark:border-stone-800 shadow-sm hover:shadow-md hover:border-stone-300 transition-all group overflow-hidden">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-800 text-stone-600 group-hover:scale-110 transition-transform">
                        <BookText size={20} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
                        {journal.type}
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
            ))}
            <button className="h-full border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-3xl flex flex-col items-center justify-center gap-3 py-10 text-stone-400 hover:text-stone-600 hover:border-stone-400 transition-colors">
              <Plus size={32} strokeWidth={1.5} />
              <span className="font-medium">Create New Journal</span>
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}