import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookText, Plus, Calendar, Sparkles, TrendingUp, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
export function Dashboard() {
  const journals = useAppStore((s) => s.journals);
  const user = useAppStore((s) => s.user);
  const addJournal = useAppStore((s) => s.addJournal);
  const deleteJournal = useAppStore((s) => s.deleteJournal);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newJournal, setNewJournal] = useState<{ title: string; description: string; type: 'reflective' | 'fitness' | 'gratitude' | 'legacy' }>({
    title: '',
    description: '',
    type: 'reflective'
  });
  const handleCreate = () => {
    if (!newJournal.title) return;
    addJournal(newJournal);
    setNewJournal({ title: '', description: '', type: 'reflective' });
    setIsCreateOpen(false);
  };
  return (
    <AppLayout container>
      <div className="space-y-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-serif font-medium text-stone-900 dark:text-stone-50">Welcome, {user?.name?.split(' ')[0]}</h1>
            <p className="text-stone-500 mt-1 font-light">Your reflections are waiting for you.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full bg-stone-900 hover:bg-stone-800 text-white gap-2 transition-all hover:scale-105">
                <Plus size={18} /> New Journal
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-serif">Create New Journal</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Journal Title</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g. 2024 Travel Log" 
                    value={newJournal.title} 
                    onChange={(e) => setNewJournal(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Journal Type</Label>
                  <Select onValueChange={(v: any) => setNewJournal(prev => ({ ...prev, type: v }))} defaultValue="reflective">
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reflective">Reflective</SelectItem>
                      <SelectItem value="gratitude">Gratitude</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="legacy">Legacy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="desc">Description</Label>
                  <Input 
                    id="desc" 
                    placeholder="Briefly describe its purpose" 
                    value={newJournal.description} 
                    onChange={(e) => setNewJournal(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} className="w-full rounded-xl bg-stone-900 text-white">Initialize Journal</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            {journals.length === 0 ? (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-stone-200 rounded-3xl text-stone-400">
                No journals found. Create your first sanctuary above.
              </div>
            ) : (
              journals.map((journal) => (
                <div key={journal.id} className="relative group">
                  <Link to={`/journal/${journal.id}`}>
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
                            This will permanently delete "{journal.title}" and all its entries. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteJournal(journal.id)}
                            className="bg-red-500 text-white hover:bg-red-600 rounded-xl"
                          >
                            Delete Forever
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))
            )}
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="h-full border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-3xl flex flex-col items-center justify-center gap-3 py-10 text-stone-400 hover:text-stone-600 hover:border-stone-400 transition-colors"
            >
              <Plus size={32} strokeWidth={1.5} />
              <span className="font-medium">Create New Journal</span>
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}